const bcrypt = require("bcryptjs");
const Supervisor = require("../models/Supervisor");
const User = require("../models/User");
const Department = require("../models/Department");
const Group = require("../models/Group");
const {
  countSupervisorGroupStudents,
  getSupervisorGroupStudents,
  getSupervisorCapacitySnapshot,
  buildCapacityFields,
} = require("../utils/supervisorCapacity");
const { generateEmployeeId } = require("../utils/idGenerator");

// =====================================================
// GET ALL SUPERVISORS
// GET /api/supervisors
// =====================================================

const getSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.find()
      .populate(
        "user",
        "name email isActive role"
      )
      .populate(
        "department",
        "name code"
      )
      .lean();

    const supervisorsWithCapacity =
      await Promise.all(
        supervisors.map(async (supervisor) => {
          const capacity =
            await getSupervisorCapacitySnapshot(
              supervisor
            );

          return {
            ...supervisor,
            ...capacity,
          };
        })
      );

    return res.status(200).json({
      success: true,
      message: "Supervisors fetched successfully",
      count: supervisorsWithCapacity.length,
      data: supervisorsWithCapacity,
      supervisors: supervisorsWithCapacity,
    });
  } catch (error) {
    console.error(
      "Get supervisors error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch supervisors",
    });
  }
};

// =====================================================
// GET SINGLE SUPERVISOR
// GET /api/supervisors/:id
// =====================================================

const getSupervisorById = async (
  req,
  res
) => {
  try {
    const supervisor =
      await Supervisor.findById(
        req.params.id
      )
        .populate(
          "user",
          "name email isActive role"
        )
        .populate(
          "department",
          "name code"
        )
        .lean();

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message:
          "Supervisor not found",
      });
    }

    const assignedStudents =
      await getSupervisorGroupStudents(
        supervisor._id
      );

    const capacity = buildCapacityFields(
      supervisor,
      assignedStudents.length
    );

    const supervisorData = {
      ...supervisor,
      ...capacity,
      students: assignedStudents,
    };

    return res.status(200).json({
      success: true,
      message: "Supervisor fetched successfully",
      data: supervisorData,
      supervisor: supervisorData,
    });
  } catch (error) {
    console.error(
      "Get supervisor by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch supervisor",
    });
  }
};

// =====================================================
// CREATE SUPERVISOR
// POST /api/supervisors
// =====================================================

const createSupervisor = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
      department,
      specialization,
      phone,
      maxStudents,
    } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (
      !name ||
      !email ||
      !password ||
      !department
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and department are required",
      });
    }

    // -----------------------------------------------
    // CHECK EXISTING USER
    // -----------------------------------------------

    const existingUser =
      await User.findOne({
        email: email.toLowerCase(),
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    // -----------------------------------------------
    // CHECK DEPARTMENT EXISTS
    // -----------------------------------------------

    const departmentRecord =
      await Department.findById(
        department
      );

    if (!departmentRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Department not found",
      });
    }

    const employeeId = await generateEmployeeId();

    // -----------------------------------------------
    // CREATE USER (hashed password)
    // -----------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "supervisor",
      isActive: true,
    });

    // -----------------------------------------------
    // CREATE SUPERVISOR
    // -----------------------------------------------

    const supervisor =
      await Supervisor.create({
        user: user._id,
        employeeId,
        department,
        specialization:
          specialization?.trim() || "",
        phone: phone?.trim() || "",
        maxStudents:
          Number(maxStudents) || 10,
      });

    // -----------------------------------------------
    // RETURN POPULATED DATA
    // -----------------------------------------------

    const populatedSupervisor =
      await Supervisor.findById(
        supervisor._id
      )
        .populate(
          "user",
          "name email isActive role"
        )
        .populate(
          "department",
          "name code"
        );

    return res.status(201).json({
      success: true,
      message:
        "Supervisor created successfully",
      data: populatedSupervisor,
      supervisor:
        populatedSupervisor,
    });
  } catch (error) {
    console.error(
      "Create supervisor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create supervisor",
    });
  }
};

// =====================================================
// UPDATE SUPERVISOR
// PUT /api/supervisors/:id
// =====================================================

const updateSupervisor = async (
  req,
  res
) => {
  try {
    const supervisor =
      await Supervisor.findById(
        req.params.id
      );

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message:
          "Supervisor not found",
      });
    }

    const {
      name,
      email,
      department,
      specialization,
      phone,
      maxStudents,
    } = req.body;

    // employeeId is system-generated and not editable

    // -----------------------------------------------
    // UPDATE SUPERVISOR FIELDS
    // -----------------------------------------------

    if (department !== undefined) {
      const departmentRecord =
        await Department.findById(
          department
        );

      if (!departmentRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Department not found",
        });
      }

      supervisor.department =
        department;
    }

    if (
      specialization !== undefined
    ) {
      supervisor.specialization =
        specialization.trim();
    }

    if (phone !== undefined) {
      supervisor.phone =
        phone.trim();
    }

    if (maxStudents !== undefined) {
      const newMaxStudents =
        Number(maxStudents);

      if (
        !Number.isInteger(
          newMaxStudents
        ) ||
        newMaxStudents < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum students must be a positive number",
        });
      }

      const assignedStudentsCount =
        await countSupervisorGroupStudents(
          supervisor._id
        );

      if (
        newMaxStudents <
        assignedStudentsCount
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Maximum students cannot be less than the current assigned students (${assignedStudentsCount})`,
        });
      }

      supervisor.maxStudents =
        newMaxStudents;
    }

    await supervisor.save();

    // -----------------------------------------------
    // UPDATE USER
    // -----------------------------------------------

    const user = await User.findById(
      supervisor.user
    );

    if (user) {
      if (name !== undefined) {
        user.name = name.trim();
      }

      if (email !== undefined) {
        const normalizedEmail =
          email.toLowerCase().trim();

        const existingUser =
          await User.findOne({
            email: normalizedEmail,
            _id: {
              $ne: user._id,
            },
          });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message:
              "Email already exists",
          });
        }

        user.email =
          normalizedEmail;
      }

      await user.save();
    }

    // -----------------------------------------------
    // RETURN UPDATED SUPERVISOR
    // -----------------------------------------------

    const updatedSupervisor =
      await Supervisor.findById(
        supervisor._id
      )
        .populate(
          "user",
          "name email isActive role"
        )
        .populate(
          "department",
          "name code"
        );

    return res.status(200).json({
      success: true,
      message:
        "Supervisor updated successfully",
      data: updatedSupervisor,
      supervisor:
        updatedSupervisor,
    });
  } catch (error) {
    console.error(
      "Update supervisor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update supervisor",
    });
  }
};

// =====================================================
// DELETE SUPERVISOR
// DELETE /api/supervisors/:id
// =====================================================

const deleteSupervisor = async (
  req,
  res
) => {
  try {
    const supervisor =
      await Supervisor.findById(
        req.params.id
      );

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message:
          "Supervisor not found",
      });
    }

    // -----------------------------------------------
    // CHECK ASSIGNED STUDENTS
    // -----------------------------------------------

    const assignedStudentsCount =
      await countSupervisorGroupStudents(
        supervisor._id
      );

    const assignedGroupsCount =
      await Group.countDocuments({
        supervisor: supervisor._id,
      });

    if (
      assignedStudentsCount > 0 ||
      assignedGroupsCount > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete supervisor while groups or students are assigned to them",
      });
    }

    // -----------------------------------------------
    // DELETE SUPERVISOR
    // -----------------------------------------------

    await Supervisor.findByIdAndDelete(
      supervisor._id
    );

    // -----------------------------------------------
    // DELETE USER ACCOUNT
    // -----------------------------------------------

    if (supervisor.user) {
      await User.findByIdAndDelete(
        supervisor.user
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Supervisor deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete supervisor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete supervisor",
    });
  }
};

// =====================================================
// GET SUPERVISOR CAPACITY
// GET /api/supervisors/:id/capacity
// =====================================================

const getSupervisorCapacity = async (
  req,
  res
) => {
  try {
    const supervisor =
      await Supervisor.findById(
        req.params.id
      )
        .populate(
          "user",
          "name email isActive"
        )
        .populate(
          "department",
          "name code"
        );

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message:
          "Supervisor not found",
      });
    }

    // Supervisors may only view their own capacity
    if (req.user.role === "supervisor") {
      const ownSupervisor =
        await Supervisor.findOne({
          user: req.user._id,
        });

      if (
        !ownSupervisor ||
        ownSupervisor._id.toString() !==
          supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this resource",
        });
      }
    }

    const capacityFields =
      await getSupervisorCapacitySnapshot(
        supervisor
      );

    const capacity = {
      supervisorId: supervisor._id,
      supervisorName:
        supervisor.user?.name || "",
      employeeId: supervisor.employeeId,
      maxStudents: supervisor.maxStudents || 10,
      ...capacityFields,
    };

    return res.status(200).json({
      success: true,
      message: "Supervisor capacity fetched successfully",
      data: capacity,
      capacity,
    });
  } catch (error) {
    console.error(
      "Get supervisor capacity error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch supervisor capacity",
    });
  }
};

// =====================================================
// GET MY SUPERVISOR PROFILE
// GET /api/supervisors/me
// =====================================================

const getMySupervisor = async (req, res) => {
  try {
    const supervisor = await Supervisor.findOne({
      user: req.user._id,
    })
      .populate(
        "user",
        "name email isActive role"
      )
      .populate(
        "department",
        "name code"
      )
      .lean();

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message:
          "Supervisor profile not found for this account",
      });
    }

    const students =
      await getSupervisorGroupStudents(
        supervisor._id
      );

    const capacity = buildCapacityFields(
      supervisor,
      students.length
    );

    const data = {
      ...supervisor,
      ...capacity,
      students,
    };

    return res.status(200).json({
      success: true,
      message: "Supervisor profile fetched successfully",
      data,
      supervisor: data,
    });
  } catch (error) {
    console.error("Get my supervisor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supervisor profile",
    });
  }
};

module.exports = {
  getSupervisors,
  getSupervisorById,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  getSupervisorCapacity,
  getMySupervisor,
};
