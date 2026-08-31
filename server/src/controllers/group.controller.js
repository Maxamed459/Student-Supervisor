import Group from '../models/Group.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';
import { notify } from '../services/notification.service.js';
import { groupAssignmentEmail } from '../templates/emailTemplates.js';

// Membership helpers (used by user.controller.js too). They set the
// user's `groupId` and keep the Group's `supervisorIds[]` in sync.
export const addMember = async (groupId, userId, { save = true } = {}) => {
  const user = await User.findById(userId);
  const group = await Group.findById(groupId);
  if (!user) throw new ApiError(404, 'User not found.');
  if (!group) throw new ApiError(404, 'Group not found.');
  if (user.role !== 'student' && user.role !== 'supervisor') {
    throw new ApiError(400, 'Only students and supervisors can be added to a Group.');
  }
  user.groupId = group._id;
  if (
    user.role === 'supervisor' &&
    !(group.supervisorIds || []).some((id) => id.toString() === user._id.toString())
  ) {
    group.supervisorIds.push(user._id);
  }
  if (save) {
    await Promise.all([user.save(), group.save()]);
  }
};

export const removeMember = async (groupId, userId, { save = true } = {}) => {
  const user = await User.findById(userId);
  const group = await Group.findById(groupId);
  if (!user || !group) return;
  if (user.groupId && user.groupId.toString() === group._id.toString()) {
    user.groupId = null;
  }
  if (user.role === 'supervisor') {
    group.supervisorIds = (group.supervisorIds || []).filter(
      (id) => id.toString() !== user._id.toString()
    );
  }
  if (save) {
    await Promise.all([user.save(), group.save()]);
  }
};

// POST /api/groups (FR-A2)
export const createGroup = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    description,
    term,
    supervisors = [],
    students = [],
  } = req.body;
  if (!name) throw new ApiError(400, 'name is required.');

  if (supervisors.length) {
    const valid = await User.countDocuments({
      _id: { $in: supervisors },
      role: 'supervisor',
      isActive: true,
    });
    if (valid !== supervisors.length) {
      throw new ApiError(400, 'All selected supervisors must be active supervisor accounts.');
    }
  }

  if (students.length) {
    const valid = await User.countDocuments({
      _id: { $in: students },
      role: 'student',
      isActive: true,
    });
    if (valid !== students.length) {
      throw new ApiError(400, 'All selected members must be active students.');
    }
  }

  const group = await Group.create({
    name,
    code: code || null,
    description,
    term,
    supervisorIds: supervisors,
    createdBy: req.user._id,
  });

  // Wire up membership. Use a bulk update so the call is atomic per side.
  if (supervisors.length || students.length) {
    const memberIds = [...new Set([...supervisors, ...students])];
    await User.updateMany(
      { _id: { $in: memberIds }, role: { $in: ['student', 'supervisor'] } },
      { $set: { groupId: group._id } }
    );

    // Best-effort "added to group" notification/email for every member
    // wired up above (FR-N1-equivalent for the group-centric model).
    const members = await User.find({ _id: { $in: memberIds } });
    await Promise.all(
      members.map((member) =>
        notify({
          recipient: member,
          type: 'assignment',
          message: `You have been added to the group "${group.name}".`,
          link: member.role === 'student' ? '/student/my-group' : '/supervisor/groups',
          emailSubject: 'Added to a Group',
          emailHtml: groupAssignmentEmail({
            recipientName: member.fullName,
            groupName: group.name,
            role: member.role,
          }),
        })
      )
    );
  }

  await recordAudit({
    userId: req.user._id,
    action: 'group.create',
    entityType: 'Group',
    entityId: group._id,
    metadata: { supervisors: supervisors.length, students: students.length },
  });

  const populatedGroup = await buildGroupView(group);
  res.status(201).json(new ApiResponse(201, { group: populatedGroup }, 'Group created'));
});

export const getSupervisorGroupIds = async (supervisorId) => {
  if (!supervisorId) return [];
  const [supervisor, rosterGroups] = await Promise.all([
    User.findById(supervisorId).select('groupId'),
    Group.find({ supervisorIds: supervisorId }).select('_id'),
  ]);
  const userGroup = supervisor?.groupId ? [supervisor.groupId.toString()] : [];
  const roster = (rosterGroups || []).map((g) => g._id.toString());
  return [...new Set([...userGroup, ...roster])];
};

export const buildGroupView = async (group) => {
  const [students, supervisorRecords] = await Promise.all([
    User.find({ groupId: group._id, role: 'student' }).sort({ fullName: 1 }),
    User.find({
      $or: [
        { _id: { $in: group.supervisorIds || [] } },
        { groupId: group._id, role: 'supervisor' },
      ],
    }).sort({ fullName: 1 }),
  ]);

  return {
    ...group.toObject(),
    supervisors: supervisorRecords.map((sup) => sup.toSafeObject()),
    supervisor:
      supervisorRecords.length === 1 ? supervisorRecords[0].toSafeObject() : null,
    students: students.map((student) => student.toSafeObject()),
    studentCount: students.length,
    supervisorCount: supervisorRecords.length,
  };
};

// GET /api/groups
export const listGroups = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'supervisor') {
    // A supervisor sees the Group(s) they belong to (via Group.supervisorIds or User.groupId).
    const myGroupIds = await getSupervisorGroupIds(req.user._id);
    filter._id = { $in: myGroupIds };
  } else if (req.user.role === 'student') {
    // A student sees only their own group.
    if (req.user.groupId) {
      filter._id = req.user.groupId;
    } else {
      return res.status(200).json(new ApiResponse(200, { groups: [] }));
    }
  }
  const groups = await Group.find(filter).sort({ createdAt: -1 });
  const groupsWithCounts = await Promise.all(groups.map(buildGroupView));
  res.status(200).json(new ApiResponse(200, { groups: groupsWithCounts }));
});

// GET /api/groups/:id
export const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Group not found.');

  // Authorization: a student or supervisor may only see groups they
  // belong to. Admins may see any.
  if (req.user.role === 'student') {
    if (!req.user.groupId || req.user.groupId.toString() !== group._id.toString()) {
      throw new ApiError(403, 'You are not a member of this group.');
    }
  } else if (req.user.role === 'supervisor') {
    const myGroupIds = await getSupervisorGroupIds(req.user._id);
    if (!myGroupIds.includes(group._id.toString())) {
      throw new ApiError(403, 'You are not a member of this group.');
    }
  }

  const groupView = await buildGroupView(group);
  res.status(200).json(
    new ApiResponse(200, {
      group: groupView,
      members: groupView.students,
      supervisors: groupView.supervisors,
    })
  );
});

// PATCH /api/groups/:id
export const updateGroup = asyncHandler(async (req, res) => {
  const { name, code, description, term, supervisors, isActive } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Group not found.');

  if (name !== undefined) group.name = name;
  if (code !== undefined) group.code = code;
  if (description !== undefined) group.description = description;
  if (term !== undefined) group.term = term;
  if (isActive !== undefined) group.isActive = isActive;
  if (supervisors !== undefined) {
    if (supervisors.length) {
      const valid = await User.countDocuments({
        _id: { $in: supervisors },
        role: 'supervisor',
      });
      if (valid !== supervisors.length) {
        throw new ApiError(400, 'All supervisor ids must reference supervisor accounts.');
      }
    }
    // Update each supervisor's groupId to reflect the new roster.
    const previousSupervisorIds = (group.supervisorIds || []).map((id) => id.toString());
    const nextSupervisorIds = supervisors.map((id) => id.toString());

    const added = nextSupervisorIds.filter((id) => !previousSupervisorIds.includes(id));
    const removed = previousSupervisorIds.filter((id) => !nextSupervisorIds.includes(id));

    if (removed.length) {
      // Detach supervisors that are no longer in this group IF they
      // don't belong to any other group — they keep their existing
      // groupId if they have one.
      await User.updateMany(
        { _id: { $in: removed }, groupId: group._id },
        { $set: { groupId: null } }
      );
    }
    if (added.length) {
      await User.updateMany(
        { _id: { $in: added } },
        { $set: { groupId: group._id } }
      );
    }
    group.supervisorIds = supervisors;
  }

  await group.save();

  await recordAudit({
    userId: req.user._id,
    action: 'group.update',
    entityType: 'Group',
    entityId: group._id,
  });

  const groupView = await buildGroupView(group);
  res.status(200).json(new ApiResponse(200, { group: groupView }, 'Group updated'));
});

// DELETE /api/groups/:id
export const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Group not found.');

  await group.deleteOne();
  await User.updateMany({ groupId: group._id }, { $set: { groupId: null } });

  await recordAudit({
    userId: req.user._id,
    action: 'group.delete',
    entityType: 'Group',
    entityId: group._id,
  });

  res.status(200).json(new ApiResponse(200, null, 'Group deleted'));
});

// POST /api/groups/:id/members — add one member to a Group
export const addGroupMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  if (!userId) throw new ApiError(400, 'userId is required.');

  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Group not found.');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');
  if (role && user.role !== role) {
    throw new ApiError(400, `User is not a ${role}.`);
  }
  if (user.role !== 'student' && user.role !== 'supervisor') {
    throw new ApiError(400, 'Only students and supervisors may join a group.');
  }

  await addMember(group._id, user._id);

  await recordAudit({
    userId: req.user._id,
    action: 'group.member.add',
    entityType: 'Group',
    entityId: group._id,
    metadata: { memberId: user._id, memberRole: user.role },
  });

  // Best-effort "added to group" notification/email.
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

  const groupView = await buildGroupView(group);
  res.status(200).json(
    new ApiResponse(200, { group: groupView }, `${user.fullName} added to the group.`)
  );
});

// DELETE /api/groups/:id/members/:userId — remove a member from a Group
export const removeGroupMember = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Group not found.');

  await removeMember(group._id, req.params.userId);

  await recordAudit({
    userId: req.user._id,
    action: 'group.member.remove',
    entityType: 'Group',
    entityId: group._id,
    metadata: { memberId: req.params.userId },
  });

  const groupView = await buildGroupView(group);
  res.status(200).json(
    new ApiResponse(200, { group: groupView }, 'Member removed from the group.')
  );
});
