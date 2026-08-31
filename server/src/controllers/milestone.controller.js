import Milestone from '../models/Milestone.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';
import { notifyMany } from '../services/notification.service.js';
import { guidelinePublishedEmail, taskCreatedEmail } from '../templates/emailTemplates.js';
import { getSupervisorGroupIds } from './group.controller.js';

// Returns true when `caller` is allowed to read/edit/delete `milestone`
// under the new Group-centric model. Admin is always allowed. Otherwise
// the caller must share a Group with the milestone.
const sharesGroupWithMilestone = async (caller, milestone) => {
  if (caller.role === 'admin') return true;
  if (caller.role === 'student') {
    return Boolean(caller.groupId && caller.groupId.toString() === milestone.groupId.toString());
  }
  if (caller.role === 'supervisor') {
    if (
      milestone.supervisorId &&
      caller._id.toString() === milestone.supervisorId.toString()
    ) {
      return true;
    }
    const myGroupIds = await getSupervisorGroupIds(caller._id);
    return myGroupIds.includes(milestone.groupId.toString());
  }
  return false;
};

const resolveAudience = async ({ groupId }) => {
  return User.find({ groupId, role: 'student' });
};

// POST /api/milestones — Supervisor publishes guideline/task (FR-S2)
// The supervisor MUST belong to the group they're publishing into.
export const createMilestone = asyncHandler(async (req, res) => {
  const { title, description, order, dueDate, groupId, attachments } = req.body;
  if (!title) throw new ApiError(400, 'title is required.');
  if (!groupId) throw new ApiError(400, 'groupId is required.');

  if (req.user.role !== 'admin') {
    const myGroupIds = await getSupervisorGroupIds(req.user._id);
    if (!myGroupIds.includes(groupId.toString())) {
      throw new ApiError(403, 'You can only publish milestones into a group you belong to.');
    }
  }

  const milestone = await Milestone.create({
    supervisorId: req.user._id,
    groupId,
    title,
    description,
    order,
    dueDate: dueDate || null,
    attachments: attachments || [],
  });

  await recordAudit({
    userId: req.user._id,
    action: 'milestone.create',
    entityType: 'Milestone',
    entityId: milestone._id,
    metadata: { groupId: milestone.groupId },
  });

  // Notify every student in the Group (FR-N2 / FR-N3)
  const students = await resolveAudience({ groupId: milestone.groupId });
  const isTask = Boolean(dueDate);

  await notifyMany(students, (student) => ({
    recipient: student,
    type: isTask ? 'task_created' : 'guideline_published',
    message: isTask
      ? `New task published: ${title}`
      : `New guideline published: ${title}`,
    link: '/student/assignments',
    emailSubject: isTask ? 'New Milestone Task' : 'New Guideline Published',
    emailHtml: isTask
      ? taskCreatedEmail({
          studentName: student.fullName,
          title,
          dueDate,
          supervisorName: req.user.fullName,
        })
      : guidelinePublishedEmail({
          studentName: student.fullName,
          title,
          supervisorName: req.user.fullName,
        }),
  }));

  res.status(201).json(new ApiResponse(201, { milestone }, 'Milestone published'));
});

// GET /api/milestones — list, scoped by role
export const listMilestones = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'supervisor') {
    // A supervisor sees the milestones of every Group they belong to,
    // AND the milestones they themselves published (attribution).
    const myGroupIds = await getSupervisorGroupIds(req.user._id);
    filter.$or = [
      { groupId: { $in: myGroupIds } },
      { supervisorId: req.user._id },
    ];
  } else if (req.user.role === 'student') {
    if (!req.user.groupId) {
      return res.status(200).json(new ApiResponse(200, { milestones: [] }));
    }
    filter.groupId = req.user.groupId;
  } else if (req.query.supervisorId) {
    filter.supervisorId = req.query.supervisorId;
  }

  const milestones = await Milestone.find(filter).sort({ order: 1, createdAt: 1 });
  res.status(200).json(new ApiResponse(200, { milestones }));
});

// GET /api/students/:id/milestones (FR-T2) — Group-scoped
export const listMilestonesForStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  if (
    req.user.role === 'student' &&
    req.user._id.toString() !== student._id.toString()
  ) {
    throw new ApiError(403, 'You may only view your own milestones.');
  }

  if (!student.groupId) {
    return res.status(200).json(new ApiResponse(200, { milestones: [] }));
  }

  // Supervisors must share a group with the student.
  if (req.user.role === 'supervisor') {
    const myGroupIds = await getSupervisorGroupIds(req.user._id);
    if (!myGroupIds.includes(student.groupId.toString())) {
      throw new ApiError(403, 'This student is not in any of your groups.');
    }
  }

  const milestones = await Milestone.find({ groupId: student.groupId }).sort({
    order: 1,
    createdAt: 1,
  });

  res.status(200).json(new ApiResponse(200, { milestones }));
});

// GET /api/milestones/:id
export const getMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');

  if (!(await sharesGroupWithMilestone(req.user, milestone))) {
    throw new ApiError(403, 'You do not have access to this milestone.');
  }

  res.status(200).json(new ApiResponse(200, { milestone }));
});

// PATCH /api/milestones/:id
export const updateMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');

  // Only the original publisher or an Admin can edit a milestone
  // (Group co-supervisors can read but not edit each other's posts).
  if (
    milestone.supervisorId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You may only edit milestones you published.');
  }

  const { title, description, order, dueDate, attachments, isPublished, groupId } = req.body;
  if (title !== undefined) milestone.title = title;
  if (description !== undefined) milestone.description = description;
  if (order !== undefined) milestone.order = order;
  if (dueDate !== undefined) milestone.dueDate = dueDate;
  if (attachments !== undefined) milestone.attachments = attachments;
  if (isPublished !== undefined) milestone.isPublished = isPublished;
  if (groupId !== undefined) {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Only admins may move a milestone to a different group.');
    }
    milestone.groupId = groupId;
  }

  await milestone.save();

  await recordAudit({
    userId: req.user._id,
    action: 'milestone.update',
    entityType: 'Milestone',
    entityId: milestone._id,
  });

  res.status(200).json(new ApiResponse(200, { milestone }, 'Milestone updated'));
});

// DELETE /api/milestones/:id
export const deleteMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');

  if (
    milestone.supervisorId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You may only delete milestones you published.');
  }

  await milestone.deleteOne();
  await Submission.deleteMany({ milestoneId: milestone._id });

  await recordAudit({
    userId: req.user._id,
    action: 'milestone.delete',
    entityType: 'Milestone',
    entityId: milestone._id,
  });

  res.status(200).json(new ApiResponse(200, null, 'Milestone deleted'));
});
