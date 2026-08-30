import Group from '../models/Group.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';

// POST /api/groups (FR-A2)
export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, term } = req.body;
  if (!name) throw new ApiError(400, 'name is required.');

  const group = await Group.create({
    name,
    description,
    term,
    createdBy: req.user._id,
  });

  await recordAudit({
    userId: req.user._id,
    action: 'group.create',
    entityType: 'Group',
    entityId: group._id,
  });

  res.status(201).json(new ApiResponse(201, { group }, 'Group created'));
});

// GET /api/groups
export const listGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().sort({ createdAt: -1 });
  const groupsWithCounts = await Promise.all(
    groups.map(async (g) => {
      const [studentCount, supervisorCount] = await Promise.all([
        User.countDocuments({ groupId: g._id, role: 'student' }),
        User.countDocuments({ groupId: g._id, role: 'supervisor' }),
      ]);
      return { ...g.toObject(), studentCount, supervisorCount };
    })
  );
  res.status(200).json(new ApiResponse(200, { groups: groupsWithCounts }));
});

// GET /api/groups/:id
export const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Group not found.');
  const members = await User.find({ groupId: group._id });
  res.status(200).json(new ApiResponse(200, { group, members: members.map((m) => m.toSafeObject()) }));
});

// PATCH /api/groups/:id
export const updateGroup = asyncHandler(async (req, res) => {
  const { name, description, term, isActive } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Group not found.');

  if (name !== undefined) group.name = name;
  if (description !== undefined) group.description = description;
  if (term !== undefined) group.term = term;
  if (isActive !== undefined) group.isActive = isActive;

  await group.save();

  await recordAudit({
    userId: req.user._id,
    action: 'group.update',
    entityType: 'Group',
    entityId: group._id,
  });

  res.status(200).json(new ApiResponse(200, { group }, 'Group updated'));
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
