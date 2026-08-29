const Department = require("../models/Department");
const Student = require("../models/Student");
const Supervisor = require("../models/Supervisor");

// CREATE DEPARTMENT
const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Department name and code are required",
      });
    }

    const existingDepartment = await Department.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() },
      ],
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: "Department name or code already exists",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
      department,
    });
  } catch (error) {
    console.error("Create department error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET ALL DEPARTMENTS
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Departments fetched successfully",
      count: departments.length,
      data: departments,
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET SINGLE DEPARTMENT
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department fetched successfully",
      data: department,
      department,
    });
  } catch (error) {
    console.error("Get department error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// UPDATE DEPARTMENT
const updateDepartment = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    if (name) {
      department.name = name.trim();
    }

    if (code) {
      department.code = code.trim().toUpperCase();
    }

    if (description !== undefined) {
      department.description = description.trim();
    }

    if (isActive !== undefined) {
      department.isActive = isActive;
    }

    const updatedDepartment = await department.save();

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedDepartment,
      department: updatedDepartment,
    });
  } catch (error) {
    console.error("Update department error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// DELETE DEPARTMENT
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const studentCount = await Student.countDocuments({
      department: department._id,
    });

    const supervisorCount = await Supervisor.countDocuments({
      department: department._id,
    });

    if (studentCount > 0 || supervisorCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          `Cannot delete department while it is referenced by ${studentCount} student(s) and ${supervisorCount} supervisor(s)`,
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
