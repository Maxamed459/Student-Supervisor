const Student = require("../models/Student");
const Supervisor = require("../models/Supervisor");
const Group = require("../models/Group");
const Department = require("../models/Department");

const yearPrefix = () => String(new Date().getFullYear());

async function nextUniqueCode({
  Model,
  field,
  prefix,
  pad = 4,
  uppercase = false,
}) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const count = await Model.countDocuments({
    [field]: new RegExp(`^${escaped}`),
  });

  let sequence = count + 1;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    let candidate = `${prefix}${String(sequence).padStart(pad, "0")}`;
    if (uppercase) candidate = candidate.toUpperCase();

    const exists = await Model.exists({ [field]: candidate });
    if (!exists) return candidate;

    sequence += 1;
  }

  const fallback = `${prefix}${Date.now().toString().slice(-6)}`;
  return uppercase ? fallback.toUpperCase() : fallback;
}

const generateStudentId = () =>
  nextUniqueCode({
    Model: Student,
    field: "studentId",
    prefix: `STU-${yearPrefix()}-`,
    pad: 4,
  });

const generateEmployeeId = () =>
  nextUniqueCode({
    Model: Supervisor,
    field: "employeeId",
    prefix: `EMP-${yearPrefix()}-`,
    pad: 4,
  });

const generateGroupCode = () =>
  nextUniqueCode({
    Model: Group,
    field: "code",
    prefix: `GRP-`,
    pad: 4,
    uppercase: true,
  });

const generateDepartmentCode = () =>
  nextUniqueCode({
    Model: Department,
    field: "code",
    prefix: `DEP-`,
    pad: 3,
    uppercase: true,
  });

module.exports = {
  generateStudentId,
  generateEmployeeId,
  generateGroupCode,
  generateDepartmentCode,
};
