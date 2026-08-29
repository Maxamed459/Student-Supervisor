const Group = require("../models/Group");
const Student = require("../models/Student");
const Supervisor = require("../models/Supervisor");
const Department = require("../models/Department");
const {
  getSupervisorMemberIds,
} = require("../utils/supervisorCapacity");

const populateGroup = (query) =>
  query
    .populate("department", "name code")
    .populate({
      path: "supervisor",
      populate: [
        { path: "user", select: "name email isActive" },
        { path: "department", select: "name code" },
      ],
    })
    .populate({
      path: "members",
      populate: [
        { path: "user", select: "name email isActive" },
        { path: "department", select: "name code" },
      ],
    })
    .populate("createdBy", "name email role");

const findActiveGroupForStudent = async (studentId, excludeGroupId = null) => {
  const filter = {
    status: "active",
    members: studentId,
  };

  if (excludeGroupId) {
    filter._id = { $ne: excludeGroupId };
  }

  return Group.findOne(filter);
};

const syncMembersSupervisor = async (memberIds, supervisorId) => {
  if (!memberIds?.length) return;

  await Student.updateMany(
    { _id: { $in: memberIds } },
    { $set: { supervisor: supervisorId || null } }
  );
};

const ensureSupervisorCapacity = async (
  supervisorId,
  additionalMemberIds = []
) => {
  const supervisor = await Supervisor.findById(supervisorId);

  if (!supervisor) {
    return {
      ok: false,
      status: 404,
      message: "Supervisor not found",
    };
  }

  const existingIds = await getSupervisorMemberIds(
    supervisorId
  );
  const prospective = new Set([
    ...existingIds,
    ...additionalMemberIds.map((id) => id.toString()),
  ]);

  const maxStudents = supervisor.maxStudents || 10;

  if (prospective.size > maxStudents) {
    return {
      ok: false,
      status: 400,
      message: `Supervisor capacity exceeded. Current group students: ${existingIds.length}, max: ${maxStudents}`,
    };
  }

  return { ok: true, supervisor };
};

const clearSupervisorIfOrphaned = async (
  memberIds,
  previousSupervisorId,
  excludeGroupId = null
) => {
  if (!previousSupervisorId || !memberIds?.length) {
    return;
  }

  for (const memberId of memberIds) {
    const filter = {
      supervisor: previousSupervisorId,
      members: memberId,
    };

    if (excludeGroupId) {
      filter._id = { $ne: excludeGroupId };
    }

    const stillAssigned = await Group.findOne(filter).select(
      "_id"
    );

    if (!stillAssigned) {
      await Student.updateOne(
        {
          _id: memberId,
          supervisor: previousSupervisorId,
        },
        { $set: { supervisor: null } }
      );
    }
  }
};

// =====================================================
// GET ALL GROUPS (Admin)
// =====================================================

const getGroups = async (req, res) => {
  try {
    const groups = await populateGroup(
      Group.find().sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      message: "Groups fetched successfully",
      count: groups.length,
      data: groups,
      groups,
    });
  } catch (error) {
    console.error("Get groups error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
    });
  }
};

// =====================================================
// GET MY GROUPS (Supervisor / Student)
// =====================================================

const getMyGroups = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const groups = await populateGroup(
        Group.find().sort({ createdAt: -1 })
      );

      return res.status(200).json({
        success: true,
        message: "Groups fetched successfully",
        count: groups.length,
        data: groups,
        groups,
      });
    }

    if (req.user.role === "supervisor") {
      const supervisor = await Supervisor.findOne({
        user: req.user._id,
      });

      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor profile not found",
        });
      }

      const groups = await populateGroup(
        Group.find({ supervisor: supervisor._id }).sort({
          createdAt: -1,
        })
      );

      return res.status(200).json({
        success: true,
        message: "Supervisor groups fetched successfully",
        count: groups.length,
        data: groups,
        groups,
      });
    }

    if (req.user.role === "student") {
      const student = await Student.findOne({
        user: req.user._id,
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      const group = await populateGroup(
        Group.findOne({
          members: student._id,
          status: { $in: ["active", "inactive"] },
        }).sort({ createdAt: -1 })
      );

      return res.status(200).json({
        success: true,
        message: group
          ? "Student group fetched successfully"
          : "No group assigned",
        data: group,
        group,
      });
    }

    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource",
    });
  } catch (error) {
    console.error("Get my groups error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
    });
  }
};

// =====================================================
// GET GROUP BY ID
// =====================================================

const getGroupById = async (req, res) => {
  try {
    const group = await populateGroup(
      Group.findById(req.params.id)
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (req.user.role === "supervisor") {
      const supervisor = await Supervisor.findOne({
        user: req.user._id,
      });

      if (
        !supervisor ||
        !group.supervisor ||
        group.supervisor._id.toString() !==
          supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this group",
        });
      }
    }

    if (req.user.role === "student") {
      const student = await Student.findOne({
        user: req.user._id,
      });

      const isMember = group.members.some(
        (member) =>
          member._id.toString() === student?._id?.toString()
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this group",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Group fetched successfully",
      data: group,
      group,
    });
  } catch (error) {
    console.error("Get group by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch group",
    });
  }
};

// =====================================================
// CREATE GROUP (Admin)
// =====================================================

const createGroup = async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      supervisor,
      projectTitle,
      description,
      status,
      memberIds,
    } = req.body;

    if (!name || !code || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, code and department are required",
      });
    }

    const departmentRecord = await Department.findById(
      department
    );

    if (!departmentRecord) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const existingCode = await Group.findOne({
      code: code.trim().toUpperCase(),
    });

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: "Group code already exists",
      });
    }

    let supervisorId = null;

    if (supervisor) {
      const supervisorRecord = await Supervisor.findById(
        supervisor
      ).populate("user", "isActive");

      if (!supervisorRecord) {
        return res.status(404).json({
          success: false,
          message: "Supervisor not found",
        });
      }

      if (
        supervisorRecord.department.toString() !==
        department.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Supervisor must belong to the same department as the group",
        });
      }

      if (supervisorRecord.user?.isActive === false) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign an inactive supervisor",
        });
      }

      supervisorId = supervisorRecord._id;
    }

    const uniqueMemberIds = [
      ...new Set(
        Array.isArray(memberIds)
          ? memberIds.filter(Boolean)
          : []
      ),
    ];

    for (const studentId of uniqueMemberIds) {
      const student = await Student.findById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student not found: ${studentId}`,
        });
      }

      if (
        student.department.toString() !==
        department.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All students must belong to the same department as the group",
        });
      }

      const existingActiveGroup =
        await findActiveGroupForStudent(studentId);

      if (existingActiveGroup) {
        return res.status(409).json({
          success: false,
          message: `Student ${student.studentId} is already in an active group (${existingActiveGroup.name})`,
        });
      }
    }

    if (supervisorId && uniqueMemberIds.length) {
      const capacityCheck = await ensureSupervisorCapacity(
        supervisorId,
        uniqueMemberIds
      );

      if (!capacityCheck.ok) {
        return res.status(capacityCheck.status).json({
          success: false,
          message: capacityCheck.message,
        });
      }
    }

    const group = await Group.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      department,
      supervisor: supervisorId,
      members: uniqueMemberIds,
      projectTitle: projectTitle?.trim() || "",
      description: description?.trim() || "",
      status: status || "active",
      createdBy: req.user._id,
    });

    if (uniqueMemberIds.length && supervisorId) {
      await syncMembersSupervisor(
        uniqueMemberIds,
        supervisorId
      );
    }

    const populated = await populateGroup(
      Group.findById(group._id)
    );

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: populated,
      group: populated,
    });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create group",
    });
  }
};

// =====================================================
// UPDATE GROUP (Admin)
// =====================================================

const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const {
      name,
      code,
      department,
      projectTitle,
      description,
      status,
    } = req.body;

    if (code) {
      const existingCode = await Group.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: group._id },
      });

      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: "Group code already exists",
        });
      }

      group.code = code.trim().toUpperCase();
    }

    if (name !== undefined) {
      group.name = name.trim();
    }

    if (department !== undefined) {
      const departmentRecord = await Department.findById(
        department
      );

      if (!departmentRecord) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      if (
        group.supervisor &&
        group.members.length > 0
      ) {
        const supervisor = await Supervisor.findById(
          group.supervisor
        );

        if (
          supervisor &&
          supervisor.department.toString() !==
            department.toString()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot change department while supervisor belongs to another department",
          });
        }
      }

      group.department = department;
    }

    if (projectTitle !== undefined) {
      group.projectTitle = projectTitle.trim();
    }

    if (description !== undefined) {
      group.description = description.trim();
    }

    if (status !== undefined) {
      const allowed = ["active", "inactive", "archived"];

      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid group status",
        });
      }

      // Reactivating: ensure members are not in another active group
      if (status === "active" && group.status !== "active") {
        for (const memberId of group.members) {
          const conflict = await findActiveGroupForStudent(
            memberId,
            group._id
          );

          if (conflict) {
            return res.status(409).json({
              success: false,
              message:
                "Cannot activate group because a member already belongs to another active group",
            });
          }
        }
      }

      group.status = status;
    }

    await group.save();

    const populated = await populateGroup(
      Group.findById(group._id)
    );

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: populated,
      group: populated,
    });
  } catch (error) {
    console.error("Update group error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update group",
    });
  }
};

// =====================================================
// ASSIGN / CHANGE SUPERVISOR (Admin)
// =====================================================

const assignSupervisor = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const { supervisor } = req.body;

    if (!supervisor) {
      return res.status(400).json({
        success: false,
        message: "Supervisor is required",
      });
    }

    const supervisorRecord = await Supervisor.findById(
      supervisor
    ).populate("user", "isActive");

    if (!supervisorRecord) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found",
      });
    }

    if (
      supervisorRecord.department.toString() !==
      group.department.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Supervisor must belong to the same department as the group",
      });
    }

    if (supervisorRecord.user?.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign an inactive supervisor",
      });
    }

    const previousSupervisorId = group.supervisor
      ? group.supervisor.toString()
      : null;
    const newSupervisorId = supervisorRecord._id.toString();
    const memberIds = group.members.map((id) =>
      id.toString()
    );

    const capacityCheck = await ensureSupervisorCapacity(
      supervisorRecord._id,
      memberIds
    );

    if (!capacityCheck.ok) {
      return res.status(capacityCheck.status).json({
        success: false,
        message: capacityCheck.message,
      });
    }

    group.supervisor = supervisorRecord._id;
    await group.save();

    if (
      previousSupervisorId &&
      previousSupervisorId !== newSupervisorId
    ) {
      await clearSupervisorIfOrphaned(
        memberIds,
        previousSupervisorId,
        group._id
      );
    }

    await syncMembersSupervisor(
      group.members,
      supervisorRecord._id
    );

    const populated = await populateGroup(
      Group.findById(group._id)
    );

    return res.status(200).json({
      success: true,
      message: "Supervisor assigned to group successfully",
      data: populated,
      group: populated,
    });
  } catch (error) {
    console.error("Assign supervisor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign supervisor",
    });
  }
};

// =====================================================
// ADD MEMBERS (Admin)
// =====================================================

const addMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const { studentIds } = req.body;
    const ids = [
      ...new Set(
        Array.isArray(studentIds)
          ? studentIds.filter(Boolean)
          : []
      ),
    ];

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        message: "At least one student ID is required",
      });
    }

    const newMemberIds = ids.filter(
      (studentId) =>
        !group.members.some(
          (id) => id.toString() === studentId.toString()
        )
    );

    if (group.supervisor && newMemberIds.length) {
      const capacityCheck = await ensureSupervisorCapacity(
        group.supervisor,
        newMemberIds
      );

      if (!capacityCheck.ok) {
        return res.status(capacityCheck.status).json({
          success: false,
          message: capacityCheck.message,
        });
      }
    }

    for (const studentId of ids) {
      if (
        group.members.some(
          (id) => id.toString() === studentId.toString()
        )
      ) {
        continue;
      }

      const student = await Student.findById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student not found: ${studentId}`,
        });
      }

      if (
        student.department.toString() !==
        group.department.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: `${student.studentId} must belong to the same department as the group`,
        });
      }

      if (group.status === "active") {
        const existingActiveGroup =
          await findActiveGroupForStudent(studentId);

        if (existingActiveGroup) {
          return res.status(409).json({
            success: false,
            message: `${student.studentId} is already in an active group (${existingActiveGroup.name})`,
          });
        }
      }

      group.members.push(student._id);
    }

    await group.save();

    if (group.supervisor) {
      await syncMembersSupervisor(
        ids,
        group.supervisor
      );
    }

    const populated = await populateGroup(
      Group.findById(group._id)
    );

    return res.status(200).json({
      success: true,
      message: "Students added to group successfully",
      data: populated,
      group: populated,
    });
  } catch (error) {
    console.error("Add members error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add students to group",
    });
  }
};

// =====================================================
// REMOVE MEMBER (Admin)
// =====================================================

const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const studentId = req.params.studentId;
    const before = group.members.length;

    group.members = group.members.filter(
      (id) => id.toString() !== studentId.toString()
    );

    if (group.members.length === before) {
      return res.status(404).json({
        success: false,
        message: "Student is not a member of this group",
      });
    }

    await group.save();

    const student = await Student.findById(studentId);

    if (
      student &&
      group.supervisor &&
      student.supervisor?.toString() ===
        group.supervisor.toString()
    ) {
      student.supervisor = null;
      await student.save();
    }

    const populated = await populateGroup(
      Group.findById(group._id)
    );

    return res.status(200).json({
      success: true,
      message: "Student removed from group successfully",
      data: populated,
      group: populated,
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove student from group",
    });
  }
};

// =====================================================
// DELETE GROUP (Admin)
// =====================================================

const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (group.members.length && group.supervisor) {
      await Student.updateMany(
        {
          _id: { $in: group.members },
          supervisor: group.supervisor,
        },
        { $set: { supervisor: null } }
      );
    }

    await Group.findByIdAndDelete(group._id);

    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete group",
    });
  }
};

module.exports = {
  getGroups,
  getMyGroups,
  getGroupById,
  createGroup,
  updateGroup,
  assignSupervisor,
  addMembers,
  removeMember,
  deleteGroup,
};
