import User from '../models/User.js';
import Group from '../models/Group.js';
import Milestone from '../models/Milestone.js';
import Submission from '../models/Submission.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getSupervisorGroupIds } from './group.controller.js';

// GET /api/supervisors/:id/students (FR-S1) — list the students in the
// supervisor's Group(s). Aggregates across all Groups the supervisor
// belongs to, but flags each row with its groupId so the UI can scope
// the response.
export const listStudentsForSupervisor = asyncHandler(async (req, res) => {
  if (req.user.role === 'supervisor' && req.user._id.toString() !== req.params.id) {
    throw new ApiError(403, 'You may only view your own student list.');
  }

  const supervisor = await User.findOne({ _id: req.params.id, role: 'supervisor' });
  if (!supervisor) throw new ApiError(404, 'Supervisor not found.');

  const myGroupIds = await getSupervisorGroupIds(supervisor._id);

  if (myGroupIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, { students: [] }));
  }

  const students = await User.find({
    groupId: { $in: myGroupIds },
    role: 'student',
  })
    .sort({ fullName: 1 })
    .populate('groupId', 'name code');

  res.status(200).json(
    new ApiResponse(200, {
      students: students.map((s) => {
        const safe = s.toSafeObject();
        safe.group = s.groupId;
        return safe;
      }),
      groups: myGroupIds,
    })
  );
});

// GET /api/students/:id/supervisor (FR-T1) — returns the supervisors in
// the student's Group. There is no longer a single per-student
// "supervisor" — return the full roster.
export const getSupervisorForStudent = asyncHandler(async (req, res) => {
  if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
    throw new ApiError(403, 'You may only view your own supervisor.');
  }

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  if (!student.groupId) {
    return res
      .status(200)
      .json(new ApiResponse(200, { supervisors: [] }, 'No group assigned yet'));
  }

  const group = await Group.findById(student.groupId);
  if (!group) {
    return res
      .status(200)
      .json(new ApiResponse(200, { supervisors: [] }, 'No group assigned yet'));
  }

  const supervisors = await User.find({ _id: { $in: group.supervisorIds || [] } });
  res.status(200).json(
    new ApiResponse(200, {
      supervisors: supervisors.map((s) => s.toSafeObject()),
      group: { _id: group._id, name: group.name, code: group.code },
    })
  );
});

// GET /api/students/:id/group
export const getGroupForStudent = asyncHandler(async (req, res) => {
  if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
    throw new ApiError(403, 'You may only view your own group.');
  }

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  // Supervisor must share a group with the student.
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
    return res.status(200).json(new ApiResponse(200, { groups: [] }));
  }

  const group = await Group.findById(student.groupId);
  if (!group) return res.status(200).json(new ApiResponse(200, { groups: [] }));

  const [supervisors, students] = await Promise.all([
    User.find({ _id: { $in: group.supervisorIds || [] } }).sort({ fullName: 1 }),
    User.find({ groupId: group._id, role: 'student' }).sort({ fullName: 1 }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      groups: [
        {
          ...group.toObject(),
          supervisors: supervisors.map((s) => s.toSafeObject()),
          supervisor: supervisors.length === 1 ? supervisors[0].toSafeObject() : null,
          students: students.map((member) => member.toSafeObject()),
        },
      ],
    })
  );
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

  // Supervisor load = how many distinct students the supervisor shares
  // a Group with.
  const allSupervisors = await User.find({ role: 'supervisor' }).sort({ fullName: 1 });
  const supervisorsWithLoad = await Promise.all(
    allSupervisors.map(async (sup) => {
      const gids = await getSupervisorGroupIds(sup._id);
      const studentCount = gids.length > 0
        ? await User.countDocuments({ groupId: { $in: gids }, role: 'student' })
        : 0;
      return {
        _id: sup._id,
        fullName: sup.fullName,
        email: sup.email,
        studentCount,
      };
    })
  );
  supervisorsWithLoad.sort((a, b) => b.studentCount - a.studentCount);

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
