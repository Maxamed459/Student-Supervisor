import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Group from '../models/Group.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';
import { notify } from '../services/notification.service.js';
import { accountCreatedEmail, groupAssignmentEmail } from '../templates/emailTemplates.js';
import { removeMember } from './group.controller.js';

// POST /api/users — Admin creates Supervisor/Student (and Admin) accounts (FR-A1)
// The admin supplies the password; the cleartext is returned once in the
// response so the admin can hand it to the new user, and a welcome email
// with the same credentials is sent via Gmail OAuth2 (best-effort — email
// failures never block account creation).
// `groupId` is OPTIONAL at creation — the admin can assign the user to a
// Group immediately or later from the Group management UI.
export const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, role, groupId, phone, password } = req.body;

  if (!fullName || !email || !role) {
    throw new ApiError(400, 'fullName, email and role are required.');
  }
  if (!password || String(password).length < 8) {
    throw new ApiError(400, 'password is required and must be at least 8 characters.');
  }
  if (!['admin', 'supervisor', 'student'].includes(role)) {
    throw new ApiError(400, 'role must be one of admin, supervisor, student.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, 'Group not found.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role,
    groupId: groupId || null,
    phone: phone || null,
    mustChangePassword: true,
  });

  // If a group was specified at creation, register the user in the
  // Group's supervisorIds[] (for supervisors) — students are picked up
  // by the getGroupForStudent / listGroups queries that scan User.groupId.
  let assignedGroup = null;
  if (groupId) {
    if (role === 'supervisor') {
      await Group.updateOne(
        { _id: groupId },
        { $addToSet: { supervisorIds: user._id } }
      );
    }
    assignedGroup = await Group.findById(groupId);
  }

  await recordAudit({
    userId: req.user._id,
    action: 'user.create',
    entityType: 'User',
    entityId: user._id,
    metadata: { role, groupId: groupId || null },
  });

  // Best-effort welcome email with the account's credentials (FR-N1-style).
  // Failure here must never block account creation — `notify()` already
  // swallows email errors and records them on the Notification document.
  await notify({
    recipient: user,
    type: 'account_created',
    message: `Your ${role} account has been created.`,
    link: '/login',
    emailSubject: 'Welcome to Student Supervisor System — Your Account Details',
    emailHtml: accountCreatedEmail({ fullName, email: user.email, password, role }),
  });

  if (assignedGroup) {
    await notify({
      recipient: user,
      type: 'assignment',
      message: `You have been added to the group "${assignedGroup.name}".`,
      link: role === 'student' ? '/student/my-group' : '/supervisor/groups',
      emailSubject: 'Added to a Group',
      emailHtml: groupAssignmentEmail({
        recipientName: fullName,
        groupName: assignedGroup.name,
        role,
      }),
    });
  }

  res.status(201).json(
    new ApiResponse(
      201,
      { user: user.toSafeObject(), password },
      'User created successfully. Share the password with the new user — it will not be shown again.'
    )
  );
});

// GET /api/users — list/filter users (supports Admin dashboards, FR-A5)
export const listUsers = asyncHandler(async (req, res) => {
  const { role, groupId, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (groupId) filter.groupId = groupId;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      users: users.map((u) => u.toSafeObject()),
      pagination: { total, page: Number(page), limit: Number(limit) },
    })
  );
});

// GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }));
});

// PATCH /api/users/:id — edit, deactivate, reset password, change group membership (FR-A1, FR-A4)
export const updateUser = asyncHandler(async (req, res) => {
  const { fullName, phone, isActive, groupId, password } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  const previousGroupId = user.groupId ? user.groupId.toString() : null;
  const nextGroupId = groupId === undefined ? previousGroupId : (groupId || null);
  const groupChanged =
    groupId !== undefined &&
    nextGroupId !== previousGroupId &&
    (user.role === 'student' || user.role === 'supervisor');

  // Apply simple field changes directly on the single `user` document we
  // already have in memory — everything below is saved together in one
  // `user.save()` call so no change here can be silently lost by a
  // separately-fetched copy overwriting it (see git history for the bug
  // this replaced: group-membership changes used to re-fetch the user
  // and save that copy instead of this one).
  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;

  let passwordWasReset = false;
  if (password !== undefined && password !== '') {
    if (String(password).length < 8) {
      throw new ApiError(400, 'password must be at least 8 characters.');
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    user.mustChangePassword = true;
    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1; // force re-login everywhere
    passwordWasReset = true;
  }

  if (groupChanged) {
    // Detach from the previous group's supervisor roster (if applicable).
    if (previousGroupId && user.role === 'supervisor') {
      await Group.updateOne({ _id: previousGroupId }, { $pull: { supervisorIds: user._id } });
    }
    // Attach to the new group's supervisor roster (if applicable).
    if (nextGroupId && user.role === 'supervisor') {
      const group = await Group.findById(nextGroupId);
      if (!group) throw new ApiError(404, 'Group not found.');
      await Group.updateOne({ _id: nextGroupId }, { $addToSet: { supervisorIds: user._id } });
    } else if (nextGroupId) {
      const group = await Group.findById(nextGroupId);
      if (!group) throw new ApiError(404, 'Group not found.');
    }
    user.groupId = nextGroupId;
  }

  await user.save();

  await recordAudit({
    userId: req.user._id,
    action: 'user.update',
    entityType: 'User',
    entityId: user._id,
    metadata: { groupIdChanged: groupChanged, passwordReset: passwordWasReset },
  });

  if (groupChanged && nextGroupId) {
    const group = await Group.findById(nextGroupId);
    if (group) {
      await notify({
        recipient: user,
        type: 'assignment',
        message: `You have been added to the group "${group.name}".`,
        link: user.role === 'student' ? '/student/my-group' : '/supervisor/groups',
        emailSubject: 'Added to a Group',
        emailHtml: groupAssignmentEmail({
          recipientName: user.fullName,
          groupName: group.name,
          role: user.role,
        }),
      });
    }
  }

  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }, 'User updated'));
});

// DELETE /api/users/:id (FR-A1)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  if (user.groupId) {
    await removeMember(user.groupId, user._id);
  }

  await user.deleteOne();

  await recordAudit({
    userId: req.user._id,
    action: 'user.delete',
    entityType: 'User',
    entityId: user._id,
  });

  res.status(200).json(new ApiResponse(200, null, 'User deleted'));
});

// PATCH /api/me — any role updates own profile (FR-C4)
export const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  const user = await User.findById(req.user._id);

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }, 'Profile updated'));
});
