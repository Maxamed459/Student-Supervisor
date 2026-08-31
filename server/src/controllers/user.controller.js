import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Group from '../models/Group.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';
import { notify } from '../services/notification.service.js';
import { assignmentEmail, accountCreatedEmail } from '../templates/emailTemplates.js';

const generateTempPassword = () => crypto.randomBytes(6).toString('hex');

// POST /api/users — Admin creates Supervisor/Student (and Admin) accounts (FR-A1)
export const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, role, groupId, supervisorId, phone } = req.body;

  if (!fullName || !email || !role) {
    throw new ApiError(400, 'fullName, email and role are required.');
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

  if (role === 'student' && supervisorId) {
    const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' });
    if (!supervisor) throw new ApiError(404, 'Supervisor not found.');
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role,
    groupId: groupId || null,
    supervisorId: role === 'student' ? supervisorId || null : null,
    phone: phone || null,
    mustChangePassword: true,
  });

  await recordAudit({
    userId: req.user._id,
    action: 'user.create',
    entityType: 'User',
    entityId: user._id,
    metadata: { role },
  });

  // FR-N1-style welcome email with credentials
  await notify({
    recipient: user,
    type: 'account_created',
    message: `Your ${role} account has been created.`,
    link: '/login',
    emailSubject: 'Welcome to Student Supervisor System — Your Account Details',
    emailHtml: accountCreatedEmail({ fullName, email: user.email, tempPassword, role }),
  });

  // If a student was assigned to a supervisor at creation time, fire FR-N1
  if (role === 'student' && supervisorId) {
    const supervisor = await User.findById(supervisorId);
    if (supervisor) {
      await notify({
        recipient: supervisor,
        type: 'assignment',
        message: `${fullName} has been assigned to you as a student.`,
        link: '/supervisor/students',
        emailSubject: 'New Student Assigned',
        emailHtml: assignmentEmail({
          studentName: fullName,
          supervisorName: supervisor.fullName,
          forStudent: false,
        }),
      });
    }
  }

  res
    .status(201)
    .json(new ApiResponse(201, { user: user.toSafeObject() }, 'User created successfully'));
});

// GET /api/users — list/filter users (supports Admin dashboards, FR-A5)
export const listUsers = asyncHandler(async (req, res) => {
  const { role, groupId, supervisorId, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (groupId) filter.groupId = groupId;
  if (supervisorId) filter.supervisorId = supervisorId;
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

// PATCH /api/users/:id — edit, deactivate, reassign supervisor (FR-A1, FR-A4)
export const updateUser = asyncHandler(async (req, res) => {
  const { fullName, phone, isActive, supervisorId, groupId } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  const previousSupervisorId = user.supervisorId ? user.supervisorId.toString() : null;

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;
  if (groupId !== undefined) user.groupId = groupId || null;

  let reassigned = false;
  if (supervisorId !== undefined && user.role === 'student') {
    if (supervisorId) {
      const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' });
      if (!supervisor) throw new ApiError(404, 'Supervisor not found.');
    }
    if ((supervisorId || null) !== previousSupervisorId) reassigned = true;
    user.supervisorId = supervisorId || null;
  }

  await user.save();

  await recordAudit({
    userId: req.user._id,
    action: 'user.update',
    entityType: 'User',
    entityId: user._id,
    metadata: { reassigned },
  });

  // FR-A4: reassignment notification
  if (reassigned && user.supervisorId) {
    const supervisor = await User.findById(user.supervisorId);
    if (supervisor) {
      await Promise.all([
        notify({
          recipient: user,
          type: 'assignment',
          message: `You have been reassigned to supervisor ${supervisor.fullName}.`,
          link: '/student/supervisor',
          emailSubject: 'Supervisor Assignment Updated',
          emailHtml: assignmentEmail({
            studentName: user.fullName,
            supervisorName: supervisor.fullName,
            forStudent: true,
          }),
        }),
        notify({
          recipient: supervisor,
          type: 'assignment',
          message: `${user.fullName} has been assigned to you.`,
          link: '/supervisor/students',
          emailSubject: 'New Student Assigned',
          emailHtml: assignmentEmail({
            studentName: user.fullName,
            supervisorName: supervisor.fullName,
            forStudent: false,
          }),
        }),
      ]);
    }
  }

  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }, 'User updated'));
});

// DELETE /api/users/:id (FR-A1)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  await user.deleteOne();

  await recordAudit({
    userId: req.user._id,
    action: 'user.delete',
    entityType: 'User',
    entityId: user._id,
  });

  res.status(200).json(new ApiResponse(200, null, 'User deleted'));
});

// POST /api/users/:id/assign-supervisor — dedicated endpoint for FR-A3
export const assignSupervisor = asyncHandler(async (req, res) => {
  const { supervisorId } = req.body;
  if (!supervisorId) throw new ApiError(400, 'supervisorId is required.');

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' });
  if (!supervisor) throw new ApiError(404, 'Supervisor not found.');

  student.supervisorId = supervisor._id;
  await student.save();

  await recordAudit({
    userId: req.user._id,
    action: 'user.assign_supervisor',
    entityType: 'User',
    entityId: student._id,
    metadata: { supervisorId },
  });

  await Promise.all([
    notify({
      recipient: student,
      type: 'assignment',
      message: `You have been assigned to supervisor ${supervisor.fullName}.`,
      link: '/student/supervisor',
      emailSubject: 'Supervisor Assignment',
      emailHtml: assignmentEmail({
        studentName: student.fullName,
        supervisorName: supervisor.fullName,
        forStudent: true,
      }),
    }),
    notify({
      recipient: supervisor,
      type: 'assignment',
      message: `${student.fullName} has been assigned to you.`,
      link: '/supervisor/students',
      emailSubject: 'New Student Assigned',
      emailHtml: assignmentEmail({
        studentName: student.fullName,
        supervisorName: supervisor.fullName,
        forStudent: false,
      }),
    }),
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, { user: student.toSafeObject() }, 'Supervisor assigned'));
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
