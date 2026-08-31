import Submission from '../models/Submission.js';
import Milestone from '../models/Milestone.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';
import { notify } from '../services/notification.service.js';
import { submissionReceivedEmail, reviewOutcomeEmail } from '../templates/emailTemplates.js';
import { getSupervisorGroupIds } from './group.controller.js';

const assertStudentOwnsSubmission = (submission, user) => {
  if (user.role === 'student' && submission.studentId.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You may only access your own submissions.');
  }
};

// A supervisor may access a milestone if they belong to the milestone's
// group OR are the original publisher (attribution). Admin is always OK.
const supervisorOwnsMilestone = async (supervisor, milestone) => {
  if (supervisor.role === 'admin') return true;
  if (supervisor.role !== 'supervisor') return false;
  if (milestone.supervisorId && milestone.supervisorId.toString() === supervisor._id.toString()) {
    return true;
  }
  const myGroupIds = await getSupervisorGroupIds(supervisor._id);
  const milestoneGroupId = milestone.groupId?._id ? milestone.groupId._id.toString() : milestone.groupId?.toString();
  return myGroupIds.includes(milestoneGroupId);
};

// POST /api/submissions — Student submits or resubmits work (FR-T3, FR-T4)
export const createOrResubmit = asyncHandler(async (req, res) => {
  const { milestoneId, files, note } = req.body;
  if (!milestoneId) throw new ApiError(400, 'milestoneId is required.');
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new ApiError(400, 'At least one file attachment is required.');
  }

  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');

  const student = req.user;
  // The student must be in the milestone's group.
  if (!student.groupId || student.groupId.toString() !== milestone.groupId.toString()) {
    throw new ApiError(403, 'You may only submit work to milestones in your group.');
  }

  let submission = await Submission.findOne({ milestoneId, studentId: student._id });

  if (!submission) {
    submission = await Submission.create({
      milestoneId,
      studentId: student._id,
      status: 'pending',
      versions: [{ versionNumber: 1, files, note: note || '' }],
    });
  } else {
    // Preserve version history on resubmission (FR-T4)
    const nextVersion = (submission.versions?.length || 0) + 1;
    submission.versions.push({ versionNumber: nextVersion, files, note: note || '' });
    submission.status = 'pending';
    submission.reviewedBy = null;
    submission.reviewedAt = null;
    await submission.save();
  }

  await recordAudit({
    userId: student._id,
    action: 'submission.submit',
    entityType: 'Submission',
    entityId: submission._id,
    metadata: { milestoneId, versionCount: submission.versions.length },
  });

  // FR-N4: notify every supervisor in the milestone's group
  const group = await Group.findById(milestone.groupId);
  const supervisorIdsFromGroup = (group?.supervisorIds || []).map((id) => id.toString());
  const supervisors = await User.find({
    $or: [
      { _id: { $in: supervisorIdsFromGroup } },
      { groupId: milestone.groupId, role: 'supervisor' },
    ],
  });
  await Promise.all(
    supervisors.map((supervisor) =>
      notify({
        recipient: supervisor,
        type: 'submission_received',
        message: `${student.fullName} submitted work for "${milestone.title}".`,
        link: '/supervisor/submissions',
        emailSubject: 'New Submission Ready for Review',
        emailHtml: submissionReceivedEmail({
          supervisorName: supervisor.fullName,
          studentName: student.fullName,
          milestoneTitle: milestone.title,
        }),
      })
    )
  );

  res.status(201).json(new ApiResponse(201, { submission }, 'Submission recorded'));
});

// GET /api/milestones/:id/submissions — Supervisor reviews all submissions (FR-S3)
export const listSubmissionsForMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');

  if (!(await supervisorOwnsMilestone(req.user, milestone))) {
    throw new ApiError(403, 'This milestone does not belong to you.');
  }

  const submissions = await Submission.find({ milestoneId: req.params.id })
    .populate('studentId', 'fullName email')
    .sort({ updatedAt: -1 });

  res.status(200).json(new ApiResponse(200, { submissions }));
});

// GET /api/submissions - role-scoped list for dashboards/history screens
export const listSubmissions = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'student') {
    filter.studentId = req.user._id;
  }

  if (req.user.role === 'supervisor') {
    // Submissions in any of my Groups
    const myGroupIds = await getSupervisorGroupIds(req.user._id);
    if (myGroupIds.length === 0) {
      return res.status(200).json(new ApiResponse(200, { submissions: [] }));
    }
    const milestones = await Milestone.find({ groupId: { $in: myGroupIds } }).select('_id');
    filter.milestoneId = { $in: milestones.map((milestone) => milestone._id) };
  }

  const submissions = await Submission.find(filter)
    .populate('studentId', 'fullName email groupId')
    .populate('milestoneId', 'title order dueDate supervisorId groupId')
    .populate('comments.authorId', 'fullName role')
    .sort({ updatedAt: -1 });

  res.status(200).json(new ApiResponse(200, { submissions }));
});

// GET /api/submissions/:id (FR-S4)
export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('studentId', 'fullName email groupId')
    .populate('milestoneId', 'title supervisorId description dueDate groupId')
    .populate('comments.authorId', 'fullName role');

  if (!submission) throw new ApiError(404, 'Submission not found.');

  assertStudentOwnsSubmission(submission, req.user);
  if (req.user.role === 'supervisor') {
    if (!(await supervisorOwnsMilestone(req.user, submission.milestoneId))) {
      throw new ApiError(403, 'This submission does not belong to your group.');
    }
  }

  res.status(200).json(new ApiResponse(200, { submission }));
});

// PATCH /api/submissions/:id — Student updates their submission (files and note)
export const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate('milestoneId');
  if (!submission) throw new ApiError(404, 'Submission not found.');

  assertStudentOwnsSubmission(submission, req.user);

  if (submission.status === 'approved' && req.user.role !== 'admin') {
    throw new ApiError(400, 'Approved submissions cannot be edited.');
  }

  const { files, note } = req.body;
  if (files && (!Array.isArray(files) || files.length === 0)) {
    throw new ApiError(400, 'Files must be a non-empty array.');
  }

  if (submission.versions && submission.versions.length > 0) {
    const latestVersion = submission.versions[submission.versions.length - 1];
    if (files) latestVersion.files = files;
    if (note !== undefined) latestVersion.note = note;
  } else if (files) {
    submission.versions = [{ versionNumber: 1, files, note: note || '' }];
  }

  // Reset status to pending if changes were previously requested
  if (submission.status === 'changes_requested') {
    submission.status = 'pending';
    submission.reviewedBy = null;
    submission.reviewedAt = null;
  }

  await submission.save();

  await recordAudit({
    userId: req.user._id,
    action: 'submission.update',
    entityType: 'Submission',
    entityId: submission._id,
  });

  res.status(200).json(new ApiResponse(200, { submission }, 'Submission updated'));
});

// DELETE /api/submissions/:id — Student or Admin deletes submission
export const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) throw new ApiError(404, 'Submission not found.');

  assertStudentOwnsSubmission(submission, req.user);

  await submission.deleteOne();

  await recordAudit({
    userId: req.user._id,
    action: 'submission.delete',
    entityType: 'Submission',
    entityId: submission._id,
  });

  res.status(200).json(new ApiResponse(200, null, 'Submission deleted'));
});

const decide = async (req, res, { status, requireComment }) => {
  const submission = await Submission.findById(req.params.id).populate('milestoneId');
  if (!submission) throw new ApiError(404, 'Submission not found.');

  if (!(await supervisorOwnsMilestone(req.user, submission.milestoneId))) {
    throw new ApiError(403, 'You may only review submissions for milestones in your group.');
  }

  const { comment } = req.body;
  if (requireComment && !comment) {
    throw new ApiError(400, 'A comment describing required corrections is required.');
  }

  submission.status = status;
  submission.reviewedBy = req.user._id;
  submission.reviewedAt = new Date();
  if (comment) {
    submission.comments.push({ authorId: req.user._id, content: comment });
  }
  await submission.save();

  await recordAudit({
    userId: req.user._id,
    action: status === 'approved' ? 'submission.approve' : 'submission.request_changes',
    entityType: 'Submission',
    entityId: submission._id,
  });

  const student = await User.findById(submission.studentId);
  if (student) {
    await notify({
      recipient: student,
      type: 'review_outcome',
      message:
        status === 'approved'
          ? `Your submission for "${submission.milestoneId.title}" was approved.`
          : `Changes were requested on your submission for "${submission.milestoneId.title}".`,
      link: '/student/submissions',
      emailSubject: 'Submission Review Outcome',
      emailHtml: reviewOutcomeEmail({
        studentName: student.fullName,
        milestoneTitle: submission.milestoneId.title,
        status,
        comment,
        reviewerName: req.user.fullName,
      }),
    });
  }

  return submission;
};

// PATCH /api/submissions/:id/approve (FR-S5)
export const approveSubmission = asyncHandler(async (req, res) => {
  const submission = await decide(req, res, { status: 'approved', requireComment: false });
  res.status(200).json(new ApiResponse(200, { submission }, 'Submission approved'));
});

// PATCH /api/submissions/:id/request-changes (FR-S6)
export const requestChanges = asyncHandler(async (req, res) => {
  const submission = await decide(req, res, {
    status: 'changes_requested',
    requireComment: true,
  });
  res.status(200).json(new ApiResponse(200, { submission }, 'Changes requested'));
});

// POST /api/submissions/:id/comments — general/itemized feedback (FR-S7, FR-T6)
export const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new ApiError(400, 'content is required.');

  const submission = await Submission.findById(req.params.id).populate('milestoneId');
  if (!submission) throw new ApiError(404, 'Submission not found.');

  assertStudentOwnsSubmission(submission, req.user);
  if (req.user.role === 'supervisor') {
    if (!(await supervisorOwnsMilestone(req.user, submission.milestoneId))) {
      throw new ApiError(403, 'This submission does not belong to your group.');
    }
  }

  submission.comments.push({ authorId: req.user._id, content });
  await submission.save();

  await recordAudit({
    userId: req.user._id,
    action: 'submission.comment',
    entityType: 'Submission',
    entityId: submission._id,
  });

  res.status(201).json(new ApiResponse(201, { submission }, 'Comment added'));
});

// GET /api/students/:id/submissions — student's own submissions across all
// milestones, populated with milestone info (supports FR-T5/FR-T7 list views
// and lets the client resolve a submission _id for a given milestone).
export const listSubmissionsForStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  if (req.user.role === 'student' && req.user._id.toString() !== student._id.toString()) {
    throw new ApiError(403, 'You may only view your own submissions.');
  }
  if (req.user.role === 'supervisor') {
    if (
      !req.user.groupId ||
      !student.groupId ||
      req.user.groupId.toString() !== student.groupId.toString()
    ) {
      throw new ApiError(403, 'This student is not in any of your groups.');
    }
  }

  const submissions = await Submission.find({ studentId: student._id })
    .populate('milestoneId', 'title order dueDate supervisorId groupId')
    .sort({ updatedAt: -1 });

  res.status(200).json(new ApiResponse(200, { submissions }));
});

// GET /api/students/:id/progress (FR-S8, FR-T7)
export const getStudentProgress = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  if (req.user.role === 'student' && req.user._id.toString() !== student._id.toString()) {
    throw new ApiError(403, 'You may only view your own progress.');
  }
  if (req.user.role === 'supervisor') {
    if (
      !req.user.groupId ||
      !student.groupId ||
      req.user.groupId.toString() !== student.groupId.toString()
    ) {
      throw new ApiError(403, 'This student is not in any of your groups.');
    }
  }

  if (!student.groupId) {
    return res
      .status(200)
      .json(new ApiResponse(200, { totalMilestones: 0, completed: 0, pending: 0, items: [] }));
  }

  const milestones = await Milestone.find({ groupId: student.groupId }).sort({ order: 1 });

  const submissions = await Submission.find({
    studentId: student._id,
    milestoneId: { $in: milestones.map((m) => m._id) },
  });
  const submissionByMilestone = new Map(
    submissions.map((s) => [s.milestoneId.toString(), s])
  );

  const items = milestones.map((m) => {
    const submission = submissionByMilestone.get(m._id.toString());
    return {
      milestoneId: m._id,
      title: m.title,
      order: m.order,
      status: submission ? submission.status : 'not_submitted',
      lastSubmittedAt: submission?.versions?.at(-1)?.submittedAt || null,
    };
  });

  const completed = items.filter((i) => i.status === 'approved').length;

  res.status(200).json(
    new ApiResponse(200, {
      totalMilestones: milestones.length,
      completed,
      pending: milestones.length - completed,
      items,
    })
  );
});
