const Group = require("../models/Group");
const Student = require("../models/Student");

const getSupervisorMemberIds = async (supervisorId) => {
  if (!supervisorId) return [];

  const groups = await Group.find({
    supervisor: supervisorId,
  })
    .select("members")
    .lean();

  return [
    ...new Set(
      groups.flatMap((group) =>
        (group.members || []).map((id) => id.toString())
      )
    ),
  ];
};

const countSupervisorGroupStudents = async (supervisorId) => {
  const memberIds = await getSupervisorMemberIds(supervisorId);
  return memberIds.length;
};

const getSupervisorGroupStudents = async (supervisorId) => {
  const memberIds = await getSupervisorMemberIds(supervisorId);

  if (!memberIds.length) {
    return [];
  }

  return Student.find({
    _id: { $in: memberIds },
  })
    .populate("user", "name email isActive")
    .populate("department", "name code")
    .lean();
};

const buildCapacityFields = (supervisor, assignedStudentsCount) => {
  const maxStudents = supervisor.maxStudents || 10;
  const availableSlots = Math.max(
    maxStudents - assignedStudentsCount,
    0
  );

  return {
    assignedStudentsCount,
    availableSlots,
    isFull: assignedStudentsCount >= maxStudents,
    percentage:
      maxStudents > 0
        ? Math.round(
            (assignedStudentsCount / maxStudents) * 100
          )
        : 0,
  };
};

const getSupervisorCapacitySnapshot = async (supervisor) => {
  const assignedStudentsCount =
    await countSupervisorGroupStudents(supervisor._id);

  return buildCapacityFields(supervisor, assignedStudentsCount);
};

module.exports = {
  getSupervisorMemberIds,
  countSupervisorGroupStudents,
  getSupervisorGroupStudents,
  buildCapacityFields,
  getSupervisorCapacitySnapshot,
};
