const Assignment = require("../models/Assignment");
const Student = require("../models/Student");
const Supervisor = require("../models/Supervisor");

// =====================================================
// GET ALL ASSIGNMENTS
// GET /api/assignments
// =====================================================

const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate({
        path: "student",
        populate: [
          {
            path: "user",
            select: "name email isActive",
          },
          {
            path: "department",
            select: "name code",
          },
        ],
      })
      .populate({
        path: "supervisor",
        populate: [
          {
            path: "user",
            select: "name email isActive",
          },
          {
            path: "department",
            select: "name code",
          },
        ],
      })
      .populate(
        "assignedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Assignments fetched successfully",
      count: assignments.length,
      data: assignments,
      assignments,
    });
  } catch (error) {
    console.error(
      "Get assignments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch assignments",
    });
  }
};

// =====================================================
// GET SINGLE ASSIGNMENT
// GET /api/assignments/:id
// =====================================================

const getAssignmentById = async (
  req,
  res
) => {
  try {
    const assignment =
      await Assignment.findById(
        req.params.id
      )
        .populate({
          path: "student",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate({
          path: "supervisor",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate(
          "assignedBy",
          "name email role"
        );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment fetched successfully",
      data: assignment,
      assignment,
    });
  } catch (error) {
    console.error(
      "Get assignment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch assignment",
    });
  }
};

// =====================================================
// CREATE ASSIGNMENT
// POST /api/assignments
// =====================================================

const createAssignment = async (
  req,
  res
) => {
  try {
    const {
      student,
      supervisor,
      notes,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!student || !supervisor) {
      return res.status(400).json({
        success: false,
        message:
          "Student and supervisor are required",
      });
    }

    // -------------------------------------------------
    // CHECK STUDENT
    // -------------------------------------------------

    const studentRecord =
      await Student.findById(
        student
      );

    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found",
      });
    }

    // -------------------------------------------------
    // CHECK SUPERVISOR
    // -------------------------------------------------

    const supervisorRecord =
      await Supervisor.findById(
        supervisor
      ).populate(
        "user",
        "name email isActive"
      );

    if (!supervisorRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Supervisor not found",
      });
    }

    // -------------------------------------------------
    // CHECK SUPERVISOR ACTIVE STATUS
    // -------------------------------------------------

    if (
      supervisorRecord.user &&
      supervisorRecord.user.isActive ===
        false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign a student to an inactive supervisor",
      });
    }

    // -------------------------------------------------
    // CHECK STUDENT ALREADY HAS SUPERVISOR
    // -------------------------------------------------

    if (studentRecord.supervisor) {
      return res.status(409).json({
        success: false,
        message:
          "Student already has a supervisor",
      });
    }

    // -------------------------------------------------
    // CHECK EXISTING ASSIGNMENT
    // -------------------------------------------------

    const existingAssignment =
      await Assignment.findOne({
        student: studentRecord._id,
        status: {
          $in: [
            "active",
          ],
        },
      });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message:
          "Student already has an active assignment",
      });
    }

    // -------------------------------------------------
    // CHECK DEPARTMENT
    // -------------------------------------------------

    if (
      studentRecord.department &&
      supervisorRecord.department &&
      studentRecord.department.toString() !==
        supervisorRecord.department.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Student and supervisor must belong to the same department",
      });
    }

    // -------------------------------------------------
    // CHECK SUPERVISOR CAPACITY
    // -------------------------------------------------

    const assignedStudentsCount =
      await Assignment.countDocuments({
        supervisor:
          supervisorRecord._id,
        status: "active",
      });

    const maxStudents =
      supervisorRecord.maxStudents ||
      10;

    if (
      assignedStudentsCount >=
      maxStudents
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Supervisor has reached maximum student capacity",
      });
    }

    // -------------------------------------------------
    // CHECK ADMIN USER
    // -------------------------------------------------

    const assignedBy =
      req.user?._id ||
      req.user?.id;

    if (!assignedBy) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user not found",
      });
    }

    // -------------------------------------------------
    // CREATE ASSIGNMENT
    // -------------------------------------------------

    const assignment =
      await Assignment.create({
        student:
          studentRecord._id,

        supervisor:
          supervisorRecord._id,

        assignedBy,

        assignedAt: new Date(),

        status: "active",

        notes:
          notes?.trim() || "",
      });

    // -------------------------------------------------
    // UPDATE STUDENT
    // -------------------------------------------------

    studentRecord.supervisor =
      supervisorRecord._id;

    await studentRecord.save();

    // -------------------------------------------------
    // RETURN POPULATED ASSIGNMENT
    // -------------------------------------------------

    const populatedAssignment =
      await Assignment.findById(
        assignment._id
      )
        .populate({
          path: "student",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate({
          path: "supervisor",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate(
          "assignedBy",
          "name email role"
        );

    return res.status(201).json({
      success: true,
      message:
        "Student assigned to supervisor successfully",
      data: populatedAssignment,
      assignment:
        populatedAssignment,
    });
  } catch (error) {
    console.error(
      "Create assignment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create assignment",
    });
  }
};

// =====================================================
// UPDATE ASSIGNMENT STATUS
// PUT /api/assignments/:id
// =====================================================

const updateAssignment = async (
  req,
  res
) => {
  try {
    const assignment =
      await Assignment.findById(
        req.params.id
      );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found",
      });
    }

    const {
      status,
      notes,
    } = req.body;

    // -------------------------------------------------
    // VALIDATE STATUS
    // -------------------------------------------------

    const allowedStatuses = [
      "active",
      "completed",
      "cancelled",
    ];

    if (
      status &&
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid assignment status",
      });
    }

    // -------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------

    if (status) {
      assignment.status = status;
    }

    if (notes !== undefined) {
      assignment.notes =
        notes.trim();
    }

    await assignment.save();

    // -------------------------------------------------
    // UPDATE STUDENT SUPERVISOR
    // -------------------------------------------------

    const student =
      await Student.findById(
        assignment.student
      );

    if (student) {
      if (
        assignment.status === "cancelled" ||
        assignment.status === "completed"
      ) {
        student.supervisor = null;
      } else if (assignment.status === "active") {
        student.supervisor =
          assignment.supervisor;
      }

      await student.save();
    }

    // -------------------------------------------------
    // RETURN UPDATED ASSIGNMENT
    // -------------------------------------------------

    const updatedAssignment =
      await Assignment.findById(
        assignment._id
      )
        .populate({
          path: "student",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate({
          path: "supervisor",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate(
          "assignedBy",
          "name email role"
        );

    return res.status(200).json({
      success: true,
      message:
        "Assignment updated successfully",
      data: updatedAssignment,
      assignment:
        updatedAssignment,
    });
  } catch (error) {
    console.error(
      "Update assignment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update assignment",
    });
  }
};

// =====================================================
// DELETE / CANCEL ASSIGNMENT
// DELETE /api/assignments/:id
// =====================================================

const deleteAssignment = async (
  req,
  res
) => {
  try {
    const assignment =
      await Assignment.findById(
        req.params.id
      );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found",
      });
    }

    // -------------------------------------------------
    // REMOVE SUPERVISOR FROM STUDENT
    // -------------------------------------------------

    const student =
      await Student.findById(
        assignment.student
      );

    if (student) {
      student.supervisor = null;

      await student.save();
    }

    // -------------------------------------------------
    // DELETE ASSIGNMENT
    // -------------------------------------------------

    await Assignment.findByIdAndDelete(
      assignment._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Assignment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete assignment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete assignment",
    });
  }
};

// =====================================================
// GET STUDENTS ASSIGNED TO SUPERVISOR
// GET /api/assignments/supervisor/:supervisorId
// =====================================================

const getSupervisorAssignments = async (
  req,
  res
) => {
  try {
    // Supervisors may only view their own assignments
    if (req.user.role === "supervisor") {
      const ownSupervisor =
        await Supervisor.findOne({
          user: req.user._id,
        });

      if (
        !ownSupervisor ||
        ownSupervisor._id.toString() !==
          req.params.supervisorId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this resource",
        });
      }
    }

    const assignments =
      await Assignment.find({
        supervisor:
          req.params.supervisorId,
      })
        .populate({
          path: "student",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate(
          "supervisor"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      message: "Supervisor assignments fetched successfully",
      count: assignments.length,
      data: assignments,
      assignments,
    });
  } catch (error) {
    console.error(
      "Get supervisor assignments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch supervisor assignments",
    });
  }
};

// =====================================================
// GET STUDENT ASSIGNMENT
// GET /api/assignments/student/:studentId
// =====================================================

const getStudentAssignment = async (
  req,
  res
) => {
  try {
    // Students may only view their own assignments
    if (req.user.role === "student") {
      const ownStudent =
        await Student.findOne({
          user: req.user._id,
        });

      if (
        !ownStudent ||
        ownStudent._id.toString() !==
          req.params.studentId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this resource",
        });
      }
    }

    // Prefer active assignment; otherwise return most recent
    let assignment =
      await Assignment.findOne({
        student:
          req.params.studentId,
        status: "active",
      })
        .populate({
          path: "student",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate({
          path: "supervisor",
          populate: [
            {
              path: "user",
              select:
                "name email isActive",
            },
            {
              path: "department",
              select:
                "name code",
            },
          ],
        })
        .populate(
          "assignedBy",
          "name email role"
        );

    if (!assignment) {
      assignment =
        await Assignment.findOne({
          student:
            req.params.studentId,
        })
          .sort({ createdAt: -1 })
          .populate({
            path: "student",
            populate: [
              {
                path: "user",
                select:
                  "name email isActive",
              },
              {
                path: "department",
                select:
                  "name code",
              },
            ],
          })
          .populate({
            path: "supervisor",
            populate: [
              {
                path: "user",
                select:
                  "name email isActive",
              },
              {
                path: "department",
                select:
                  "name code",
              },
            ],
          })
          .populate(
            "assignedBy",
            "name email role"
          );
    }

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "No assignment found for this student",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student assignment fetched successfully",
      data: assignment,
      assignment,
    });
  } catch (error) {
    console.error(
      "Get student assignment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch student assignment",
    });
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSupervisorAssignments,
  getStudentAssignment,
};