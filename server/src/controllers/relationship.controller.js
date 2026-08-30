import User from '../models/User.js';
import Group from '../models/Group.js';
import Milestone from '../models/Milestone.js';
import Submission from '../models/Submission.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/supervisors/:id/students (FR-S1)
export const listStudentsForSupervisor = asyncHandler(async (req, res) => {
  if (req.user.role === 'supervisor' && req.user._id.toString() !== req.params.id) {
    throw new ApiError(403, 'You may only view your own student list.');
  }

  const supervisor = await User.findOne({ _id: req.params.id, role: 'supervisor' });
  if (!supervisor) throw new ApiError(404, 'Supervisor not found.');

  const students = await User.find({ supervisorId: supervisor._id, role: 'student' }).sort({
    fullName: 1,
  });

  res.status(200).json(new ApiResponse(200, { students: students.map((s) => s.toSafeObject()) }));
});

// GET /api/students/:id/supervisor (FR-T1)
export const getSupervisorForStudent = asyncHandler(async (req, res) => {
  if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
    throw new ApiError(403, 'You may only view your own supervisor.');
  }

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  if (!student.supervisorId) {
    return res.status(200).json(new ApiResponse(200, { supervisor: null }, 'No supervisor assigned yet'));
  }

  const supervisor = await User.findById(student.supervisorId);
  res.status(200).json(new ApiResponse(200, { supervisor: supervisor ? supervisor.toSafeObject() : null }));
});

// GET /api/admin/dashboard (FR-A5, FR-A6)
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalSupervisors,
    totalGroups,
    totalMilestones,
    totalSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    changesRequestedSubmissions,
    groups,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'supervisor' }),
    Group.countDocuments(),
    Milestone.countDocuments(),
    Submission.countDocuments(),
    Submission.countDocuments({ status: 'pending' }),
    Submission.countDocuments({ status: 'approved' }),
    Submission.countDocuments({ status: 'changes_requested' }),
    Group.find().sort({ createdAt: -1 }).limit(10),
  ]);

  const groupSummaries = await Promise.all(
    groups.map(async (g) => {
      const [studentCount, supervisorCount] = await Promise.all([
        User.countDocuments({ groupId: g._id, role: 'student' }),
        User.countDocuments({ groupId: g._id, role: 'supervisor' }),
      ]);
      return { _id: g._id, name: g.name, studentCount, supervisorCount };
    })
  );

  const supervisorsWithLoad = await User.aggregate([
    { $match: { role: 'supervisor' } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'supervisorId',
        as: 'students',
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        studentCount: { $size: '$students' },
      },
    },
    { $sort: { studentCount: -1 } },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totals: {
        totalStudents,
        totalSupervisors,
        totalGroups,
        totalMilestones,
        totalSubmissions,
      },
      submissionActivity: {
        pending: pendingSubmissions,
        approved: approvedSubmissions,
        changesRequested: changesRequestedSubmissions,
      },
      recentGroups: groupSummaries,
      supervisorsWithLoad,
    })
  );
});
