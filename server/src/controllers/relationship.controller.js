import mongoose from 'mongoose';
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

const idOf = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

// GET /api/admin/reports — platform report aggregated from existing models (no Report collection)
export const getAdminReports = asyncHandler(async (req, res) => {
  const { groupId } = req.query;

  if (groupId && !mongoose.isValidObjectId(groupId)) {
    throw new ApiError(400, 'Invalid groupId.');
  }

  const groupFilter = groupId ? { _id: groupId } : {};
  const groups = await Group.find(groupFilter).sort({ name: 1 }).lean();
  if (groupId && groups.length === 0) {
    throw new ApiError(404, 'Group not found.');
  }

  const scopedGroupIds = groups.map((group) => group._id);
  const [users, milestones, submissions] = await Promise.all([
    User.find({ role: { $in: ['student', 'supervisor'] } })
      .select('fullName email role groupId isActive lastLoginAt')
      .lean(),
    scopedGroupIds.length
      ? Milestone.find({ groupId: { $in: scopedGroupIds } })
        .select('title groupId dueDate isPublished order')
        .lean()
      : Promise.resolve([]),
    Submission.find()
      .select('milestoneId studentId status versions reviewedAt')
      .lean(),
  ]);

  const students = users.filter((user) => user.role === 'student');
  const supervisors = users.filter((user) => user.role === 'supervisor');
  const studentsByGroup = new Map();
  const supervisorsByGroup = new Map();

  const pushToMap = (map, key, value) => {
    if (!key) return;
    const list = map.get(key) || [];
    list.push(value);
    map.set(key, list);
  };

  students.forEach((student) => pushToMap(studentsByGroup, idOf(student.groupId), student));
  supervisors.forEach((supervisor) => pushToMap(supervisorsByGroup, idOf(supervisor.groupId), supervisor));
  groups.forEach((group) => {
    (group.supervisorIds || []).forEach((supervisorId) => {
      const supervisor = supervisors.find((item) => idOf(item._id) === idOf(supervisorId));
      if (!supervisor) return;
      const existing = supervisorsByGroup.get(idOf(group._id)) || [];
      if (!existing.some((item) => idOf(item._id) === idOf(supervisor._id))) {
        pushToMap(supervisorsByGroup, idOf(group._id), supervisor);
      }
    });
  });

  const milestonesByGroup = new Map();
  milestones.forEach((milestone) => pushToMap(milestonesByGroup, idOf(milestone.groupId), milestone));

  const milestoneIds = new Set(milestones.map((milestone) => idOf(milestone._id)));
  const submissionByPair = new Map();
  submissions.forEach((submission) => {
    const milestoneId = idOf(submission.milestoneId);
    if (milestoneIds.size && !milestoneIds.has(milestoneId)) return;
    submissionByPair.set(`${milestoneId}:${idOf(submission.studentId)}`, submission);
  });

  const now = new Date();
  const overdue = [];
  const groupRows = groups.map((group) => {
    const gid = idOf(group._id);
    const groupStudents = studentsByGroup.get(gid) || [];
    const groupSupervisors = supervisorsByGroup.get(gid) || [];
    const groupMilestones = (milestonesByGroup.get(gid) || []).filter((item) => item.isPublished !== false);
    const counts = { pending: 0, approved: 0, changesRequested: 0, notSubmitted: 0, resubmitted: 0 };
    let overdueCount = 0;

    groupStudents.forEach((student) => {
      groupMilestones.forEach((milestone) => {
        const pairKey = `${idOf(milestone._id)}:${idOf(student._id)}`;
        const submission = submissionByPair.get(pairKey);
        const status = submission ? submission.status : 'not_submitted';
        if (status === 'pending') counts.pending += 1;
        else if (status === 'approved') counts.approved += 1;
        else if (status === 'changes_requested') counts.changesRequested += 1;
        else counts.notSubmitted += 1;
        if (submission?.versions?.length > 1) counts.resubmitted += 1;

        const dueDate = milestone.dueDate ? new Date(milestone.dueDate) : null;
        const isOverdue = dueDate && dueDate < now && status !== 'approved';
        if (isOverdue) {
          overdueCount += 1;
          if (overdue.length < 250) {
            overdue.push({
              groupId: group._id,
              groupName: group.name,
              milestoneId: milestone._id,
              milestoneTitle: milestone.title,
              dueDate: milestone.dueDate,
              studentId: student._id,
              studentName: student.fullName,
              studentEmail: student.email,
              status,
            });
          }
        }
      });
    });

    const expected = groupStudents.length * groupMilestones.length;
    return {
      _id: group._id,
      name: group.name,
      code: group.code,
      term: group.term,
      isActive: group.isActive !== false,
      studentCount: groupStudents.length,
      supervisorCount: groupSupervisors.length,
      milestoneCount: groupMilestones.length,
      expectedSubmissions: expected,
      pending: counts.pending,
      approved: counts.approved,
      changesRequested: counts.changesRequested,
      notSubmitted: counts.notSubmitted,
      resubmitted: counts.resubmitted,
      overdueCount,
      completionPercent: expected === 0 ? 0 : Math.round((counts.approved / expected) * 100),
    };
  });

  overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const scopedGroupIdSet = new Set(groups.map((group) => idOf(group._id)));
  const supervisorsWithLoad = supervisors.map((supervisor) => {
    const fromUser = idOf(supervisor.groupId) ? [idOf(supervisor.groupId)] : [];
    const fromRoster = groups
      .filter((group) => (group.supervisorIds || []).some((id) => idOf(id) === idOf(supervisor._id)))
      .map((group) => idOf(group._id));
    const gids = [...new Set([...fromUser, ...fromRoster])];
    const studentCount = gids.reduce((sum, gid) => sum + (studentsByGroup.get(gid) || []).length, 0);
    return {
      _id: supervisor._id,
      fullName: supervisor.fullName,
      email: supervisor.email,
      groupCount: gids.length,
      studentCount,
      inScope: gids.some((gid) => scopedGroupIdSet.has(gid)),
    };
  })
    .filter((row) => !groupId || row.inScope)
    .sort((a, b) => b.studentCount - a.studentCount)
    .map(({ inScope, ...row }) => row);

  const unassignedStudents = students
    .filter((student) => !student.groupId)
    .map((student) => ({ _id: student._id, fullName: student.fullName, email: student.email }));

  const pipeline = groupRows.reduce(
    (acc, row) => {
      acc.pending += row.pending;
      acc.approved += row.approved;
      acc.changesRequested += row.changesRequested;
      acc.notSubmitted += row.notSubmitted;
      acc.resubmitted += row.resubmitted;
      acc.expected += row.expectedSubmissions;
      acc.overdue += row.overdueCount;
      return acc;
    },
    { pending: 0, approved: 0, changesRequested: 0, notSubmitted: 0, resubmitted: 0, expected: 0, overdue: 0 },
  );

  res.status(200).json(
    new ApiResponse(200, {
      generatedAt: new Date().toISOString(),
      summary: {
        totalGroups: groups.length,
        totalStudents: groupId
          ? groupRows.reduce((sum, row) => sum + row.studentCount, 0)
          : students.length,
        totalSupervisors: groupId
          ? groupRows.reduce((sum, row) => sum + row.supervisorCount, 0)
          : supervisors.length,
        unassignedStudents: unassignedStudents.length,
        inactiveUsers: users.filter((user) => user.isActive === false).length,
        totalMilestones: milestones.filter((item) => item.isPublished !== false).length,
        expectedSubmissions: pipeline.expected,
        pending: pipeline.pending,
        approved: pipeline.approved,
        changesRequested: pipeline.changesRequested,
        notSubmitted: pipeline.notSubmitted,
        resubmitted: pipeline.resubmitted,
        overdue: pipeline.overdue,
        completionPercent: pipeline.expected === 0
          ? 0
          : Math.round((pipeline.approved / pipeline.expected) * 100),
      },
      groups: groupRows,
      overdue,
      unassignedStudents,
      supervisors: supervisorsWithLoad,
    })
  );
});
