import Milestone from '../models/Milestone.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';
import { notifyMany } from '../services/notification.service.js';
import { guidelinePublishedEmail, taskCreatedEmail } from '../templates/emailTemplates.js';

const resolveAudience = async ({ supervisorId, groupId }) => {
  const filter = { role: 'student', supervisorId };
  if (groupId) filter.groupId = groupId;
  return User.find(filter);
};

// POST /api/milestones — Supervisor publishes guideline/task (FR-S2)
export const createMilestone = asyncHandler(async (req, res) => {
  const { title, description, order, dueDate, groupId, attachments } = req.body;
  if (!title) throw new ApiError(400, 'title is required.');

  const milestone = await Milestone.create({
    supervisorId: req.user._id,
    groupId: groupId || null,
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
  });

  // Notify all assigned students (FR-N2 guideline published / FR-N3 task created)
  const students = await resolveAudience({ supervisorId: req.user._id, groupId });
  const isTask = Boolean(dueDate);

  await notifyMany(students, (student) => ({
    recipient: student,
    type: isTask ? 'task_created' : 'guideline_published',
    message: isTask
      ? `New task published: ${title}`
      : `New guideline published: ${title}`,
    link: '/student/milestones',
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
    filter.supervisorId = req.user._id;
  } else if (req.user.role === 'student') {
    if (!req.user.supervisorId) {
      return res.status(200).json(new ApiResponse(200, { milestones: [] }));
    }
    filter.supervisorId = req.user.supervisorId;
    filter.$or = [{ groupId: null }, { groupId: req.user.groupId }];
  } else if (req.query.supervisorId) {
    filter.supervisorId = req.query.supervisorId;
  }

  const milestones = await Milestone.find(filter).sort({ order: 1, createdAt: 1 });
  res.status(200).json(new ApiResponse(200, { milestones }));
});

// GET /api/students/:id/milestones (FR-T2)
export const listMilestonesForStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  if (
    req.user.role === 'student' &&
    req.user._id.toString() !== student._id.toString()
  ) {
    throw new ApiError(403, 'You may only view your own milestones.');
  }
  if (
    req.user.role === 'supervisor' &&
    (!student.supervisorId || student.supervisorId.toString() !== req.user._id.toString())
  ) {
    throw new ApiError(403, 'This student is not assigned to you.');
  }

  if (!student.supervisorId) {
    return res.status(200).json(new ApiResponse(200, { milestones: [] }));
  }

  const milestones = await Milestone.find({
    supervisorId: student.supervisorId,
    $or: [{ groupId: null }, { groupId: student.groupId }],
  }).sort({ order: 1, createdAt: 1 });

  res.status(200).json(new ApiResponse(200, { milestones }));
});

// GET /api/milestones/:id
export const getMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  res.status(200).json(new ApiResponse(200, { milestone }));
});

// PATCH /api/milestones/:id
export const updateMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');

  if (milestone.supervisorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You may only edit your own milestones.');
  }

  const { title, description, order, dueDate, attachments, isPublished } = req.body;
  if (title !== undefined) milestone.title = title;
  if (description !== undefined) milestone.description = description;
  if (order !== undefined) milestone.order = order;
  if (dueDate !== undefined) milestone.dueDate = dueDate;
  if (attachments !== undefined) milestone.attachments = attachments;
  if (isPublished !== undefined) milestone.isPublished = isPublished;

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

  if (milestone.supervisorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You may only delete your own milestones.');
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
