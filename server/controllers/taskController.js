const Task = require("../models/Task");
const Group = require("../models/Group");
const Supervisor = require("../models/Supervisor");
const {
  getStudentProfile,
  getSupervisorProfile,
  studentBelongsToSupervisor,
} = require("../utils/accessHelpers");

const populateTask = (query) =>
  query
    .populate({
      path: "assignedTo",
      populate: [
        { path: "user", select: "name email" },
        { path: "department", select: "name code" },
      ],
    })
    .populate("group", "name code members")
    .populate({
      path: "assignedBy",
      populate: { path: "user", select: "name email" },
    });

const studentCanAccessTask = async (task, studentId) => {
  if (!task || !studentId) return false;
  const studentKey = studentId.toString();

  if (
    task.assignmentType === "single_student" ||
    task.assignedTo
  ) {
    const assignedId =
      task.assignedTo?._id?.toString() ||
      task.assignedTo?.toString() ||
      "";
    return assignedId === studentKey;
  }

  if (task.assignmentType === "all_group") {
    const groupId =
      task.group?._id?.toString() || task.group?.toString();
    if (!groupId) return false;

    const group =
      task.group?.members
        ? task.group
        : await Group.findById(groupId).select("members");

    return (group?.members || []).some(
      (id) => id.toString() === studentKey
    );
  }

  return false;
};

const createTask = async (req, res) => {
  try {
    let supervisor = await getSupervisorProfile(req.user._id);

    if (!supervisor && req.user.role === "admin") {
      const { assignedBy } = req.body;

      if (!assignedBy) {
        return res.status(400).json({
          success: false,
          message:
            "Select a supervisor (assignedBy) when creating a task as admin",
        });
      }

      supervisor = await Supervisor.findById(assignedBy);

      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor not found",
        });
      }
    }

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor profile not found",
      });
    }

    const {
      title,
      description,
      dueDate,
      assignedTo,
      group,
      priority,
      assignToGroup,
      assignmentType: assignmentTypeRaw,
    } = req.body;

    if (!title?.trim() || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and due date are required",
      });
    }

    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Valid due date is required",
      });
    }

    const allowedPriorities = ["low", "medium", "high"];
    const taskPriority = priority || "medium";

    if (!allowedPriorities.includes(taskPriority)) {
      return res.status(400).json({
        success: false,
        message: "Priority must be low, medium, or high",
      });
    }

    const wantsAllGroup =
      assignmentTypeRaw === "all_group" ||
      assignToGroup === true ||
      assignToGroup === "true";

    const assignmentType = wantsAllGroup
      ? "all_group"
      : "single_student";

    if (!group) {
      return res.status(400).json({
        success: false,
        message: "Group is required",
      });
    }

    const groupRecord = await Group.findById(group);

    if (
      !groupRecord ||
      groupRecord.supervisor?.toString() !== supervisor._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid group for this supervisor",
      });
    }

    let assignedStudentId = null;

    if (assignmentType === "all_group") {
      if (!(groupRecord.members || []).length) {
        return res.status(400).json({
          success: false,
          message: "Selected group has no members",
        });
      }
    } else {
      if (!assignedTo) {
        return res.status(400).json({
          success: false,
          message:
            "Assigned student is required when assignment type is Single Student",
        });
      }

      const allowed = await studentBelongsToSupervisor(
        assignedTo,
        supervisor._id
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "You can only assign tasks to students in your groups",
        });
      }

      const isMember = (groupRecord.members || []).some(
        (id) => id.toString() === assignedTo.toString()
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: "Student is not a member of the selected group",
        });
      }

      assignedStudentId = assignedTo;
    }

    // One task record only — never duplicate per group member
    const created = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      dueDate: due,
      assignedTo: assignedStudentId,
      group: groupRecord._id,
      assignmentType,
      assignedBy: supervisor._id,
      priority: taskPriority,
      status: "pending",
    });

    const populated = await populateTask(Task.findById(created._id));

    return res.status(201).json({
      success: true,
      message:
        assignmentType === "all_group"
          ? "Task created for the whole group"
          : "Task created successfully",
      count: 1,
      data: populated,
      tasks: [populated],
      task: populated,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

const getTasks = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "student") {
      const student = await getStudentProfile(req.user._id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      const memberships = await Group.find({
        members: student._id,
      }).select("_id");

      const groupIds = memberships.map((g) => g._id);

      filter = {
        $or: [
          { assignedTo: student._id },
          {
            assignmentType: "all_group",
            group: { $in: groupIds },
          },
        ],
      };
    } else if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor profile not found",
        });
      }
      filter.assignedBy = supervisor._id;
    }

    if (req.query.status) {
      filter = {
        $and: [filter, { status: req.query.status }],
      };
    }

    const tasks = await populateTask(
      Task.find(filter).sort({ dueDate: 1, createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      count: tasks.length,
      data: tasks,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (req.user.role === "student") {
      const student = await getStudentProfile(req.user._id);
      const allowed = await studentCanAccessTask(task, student?._id);
      if (!student || !allowed) {
        return res.status(403).json({
          success: false,
          message: "You can only view tasks assigned to you or your group",
        });
      }
    }

    if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (
        !supervisor ||
        task.assignedBy._id.toString() !== supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only view tasks you created",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Task fetched successfully",
      data: task,
      task,
    });
  } catch (error) {
    console.error("Get task by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch task",
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (req.user.role === "supervisor" || req.user.role === "admin") {
      if (req.user.role === "supervisor") {
        const supervisor = await getSupervisorProfile(req.user._id);
        if (
          !supervisor ||
          task.assignedBy.toString() !== supervisor._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: "You can only update tasks you created",
          });
        }
      }

      const {
        title,
        description,
        dueDate,
        priority,
        status,
        assignedTo,
        group,
        assignmentType,
      } = req.body;

      if (assignedTo && req.user.role === "supervisor") {
        const supervisor = await getSupervisorProfile(req.user._id);
        const allowed = await studentBelongsToSupervisor(
          assignedTo,
          supervisor._id
        );
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message:
              "You can only assign tasks to students in your groups",
          });
        }
      }

      if (assignedTo !== undefined) {
        task.assignedTo = assignedTo || null;
      }
      if (title !== undefined) task.title = title.trim();
      if (description !== undefined) {
        task.description = description.trim();
      }
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      if (group !== undefined) task.group = group || null;
      if (
        assignmentType === "all_group" ||
        assignmentType === "single_student"
      ) {
        task.assignmentType = assignmentType;
        if (assignmentType === "all_group") {
          task.assignedTo = null;
        }
      }
    } else if (req.user.role === "student") {
      const student = await getStudentProfile(req.user._id);
      const populatedForAccess = await populateTask(
        Task.findById(task._id)
      );
      const allowed = await studentCanAccessTask(
        populatedForAccess,
        student?._id
      );

      if (!student || !allowed) {
        return res.status(403).json({
          success: false,
          message: "You can only update tasks assigned to you or your group",
        });
      }

      const { status, submissionNote } = req.body;
      const allowedStatuses = ["pending", "in_progress", "completed"];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status",
        });
      }

      if (status) task.status = status;
      if (submissionNote !== undefined) {
        task.submissionNote = submissionNote.trim();
      }

      if (status === "completed") {
        task.submittedAt = new Date();
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await task.save();

    const populated = await populateTask(Task.findById(task._id));

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: populated,
      task: populated,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (
        !supervisor ||
        task.assignedBy.toString() !== supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete tasks you created",
        });
      }
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};

const getTaskStats = async (req, res) => {
  try {
    let base = {};

    if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);

      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor profile not found",
        });
      }

      base = { assignedBy: supervisor._id };
    }

    const [pending, inProgress, completed] = await Promise.all([
      Task.countDocuments({ ...base, status: "pending" }),
      Task.countDocuments({ ...base, status: "in_progress" }),
      Task.countDocuments({ ...base, status: "completed" }),
    ]);

    const stats = {
      pending,
      inProgress,
      completed,
      total: pending + inProgress + completed,
    };

    return res.status(200).json({
      success: true,
      message: "Task stats fetched successfully",
      data: stats,
      stats,
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch task stats",
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
};
