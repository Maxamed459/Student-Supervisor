const Student = require("../models/Student");
const Supervisor = require("../models/Supervisor");
const Group = require("../models/Group");

const getStudentProfile = async (userId) =>
  Student.findOne({ user: userId });

const getSupervisorProfile = async (userId) =>
  Supervisor.findOne({ user: userId });

const getSupervisorStudentIds = async (supervisorId) => {
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

const studentBelongsToSupervisor = async (
  studentId,
  supervisorId
) => {
  const ids = await getSupervisorStudentIds(supervisorId);
  return ids.includes(studentId.toString());
};

const getStudentActiveGroup = async (studentId) =>
  Group.findOne({
    members: studentId,
    status: { $in: ["active", "inactive"] },
  }).sort({ createdAt: -1 });

module.exports = {
  getStudentProfile,
  getSupervisorProfile,
  getSupervisorStudentIds,
  studentBelongsToSupervisor,
  getStudentActiveGroup,
};
