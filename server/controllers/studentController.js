const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const User = require("../models/User");
const Department = require("../models/Department");
const { generateStudentId } = require("../utils/idGenerator");

// =====================================================
// GET ALL STUDENTS
// GET /api/students
// =====================================================

const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate(
        "user",
        "name email isActive role"
      )
      .populate(
        "department",
        "name code"
      )
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
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      count: students.length,
      data: students,
      students,
    });
  } catch (error) {
    console.error(
      "Get students error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch students",
    });
  }
};

// =====================================================
// GET SINGLE STUDENT
// GET /api/students/:id
// =====================================================

const getStudentById = async (
  req,
  res
) => {
  try {
    const student =
      await Student.findById(
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
              select: "name code",
            },
          ],
        });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student fetched successfully",
      data: student,
      student,
    });
  } catch (error) {
    console.error(
      "Get student by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch student",
    });
  }
};

// =====================================================
// CREATE STUDENT
// POST /api/students
// =====================================================

const createStudent = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
      department,
      phone,
      level,
      academicYear,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

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

    // -------------------------------------------------
    // CHECK EXISTING USER
    // -------------------------------------------------

    const existingUser =
      await User.findOne({
        email: email
          .toLowerCase()
          .trim(),
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    // -------------------------------------------------
    // CHECK DEPARTMENT EXISTS
    // -------------------------------------------------

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

    const studentId = await generateStudentId();

    // -------------------------------------------------
    // CREATE USER (hashed password)
    // -------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email
        .toLowerCase()
        .trim(),
      password: hashedPassword,
      role: "student",
      isActive: true,
    });

    // -------------------------------------------------
    // CREATE STUDENT
    // -------------------------------------------------

    const student =
      await Student.create({
        user: user._id,
        studentId,
        department,
        supervisor: null,
        phone:
          phone?.trim() || "",
        level:
          level?.trim() || "",
        academicYear:
          academicYear?.trim() || "",
      });

    // -------------------------------------------------
    // RETURN POPULATED STUDENT
    // -------------------------------------------------

    const populatedStudent =
      await Student.findById(
        student._id
      )
        .populate(
          "user",
          "name email isActive role"
        )
        .populate(
          "department",
          "name code"
        )
        .populate({
          path: "supervisor",
          populate: {
            path: "user",
            select:
              "name email isActive",
          },
        });

    return res.status(201).json({
      success: true,
      message:
        "Student created successfully",
      data: populatedStudent,
      student:
        populatedStudent,
    });
  } catch (error) {
    console.error(
      "Create student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create student",
    });
  }
};

// =====================================================
// UPDATE STUDENT
// PUT /api/students/:id
// =====================================================

const updateStudent = async (
  req,
  res
) => {
  try {
    const student =
      await Student.findById(
        req.params.id
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found",
      });
    }

    const {
      name,
      email,
      department,
      phone,
      level,
      academicYear,
    } = req.body;

    // studentId is system-generated and not editable

    // -------------------------------------------------
    // UPDATE STUDENT FIELDS
    // -------------------------------------------------

    if (
      department !== undefined
    ) {
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

      student.department =
        department;
    }

    if (phone !== undefined) {
      student.phone =
        phone.trim();
    }

    if (level !== undefined) {
      student.level =
        level.trim();
    }

    if (
      academicYear !== undefined
    ) {
      student.academicYear =
        academicYear.trim();
    }

    await student.save();

    // -------------------------------------------------
    // UPDATE USER
    // -------------------------------------------------

    const user = await User.findById(
      student.user
    );

    if (user) {
      if (name !== undefined) {
        user.name =
          name.trim();
      }

      if (email !== undefined) {
        const normalizedEmail =
          email
            .toLowerCase()
            .trim();

        const existingUser =
          await User.findOne({
            email:
              normalizedEmail,
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

    // -------------------------------------------------
    // RETURN UPDATED STUDENT
    // -------------------------------------------------

    const updatedStudent =
      await Student.findById(
        student._id
      )
        .populate(
          "user",
          "name email isActive role"
        )
        .populate(
          "department",
          "name code"
        )
        .populate({
          path: "supervisor",
          populate: {
            path: "user",
            select:
              "name email isActive",
          },
        });

    return res.status(200).json({
      success: true,
      message:
        "Student updated successfully",
      data: updatedStudent,
      student:
        updatedStudent,
    });
  } catch (error) {
    console.error(
      "Update student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update student",
    });
  }
};

// =====================================================
// DELETE STUDENT
// DELETE /api/students/:id
// =====================================================

const deleteStudent = async (
  req,
  res
) => {
  try {
    const student =
      await Student.findById(
        req.params.id
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found",
      });
    }

    // -------------------------------------------------
    // DELETE STUDENT
    // -------------------------------------------------

    await Student.findByIdAndDelete(
      student._id
    );

    // -------------------------------------------------
    // DELETE USER ACCOUNT
    // -------------------------------------------------

    if (student.user) {
      await User.findByIdAndDelete(
        student.user
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Student deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete student",
    });
  }
};

// =====================================================
// GET MY STUDENT PROFILE
// GET /api/students/me
// =====================================================

const getMyStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
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
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found for this account",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student profile fetched successfully",
      data: student,
      student,
    });
  } catch (error) {
    console.error("Get my student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student profile",
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getMyStudent,
};
