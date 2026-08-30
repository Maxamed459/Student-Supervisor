const Meeting = require("../models/Meeting");
const Group = require("../models/Group");
const Supervisor = require("../models/Supervisor");
const {
  getStudentProfile,
  getSupervisorProfile,
  studentBelongsToSupervisor,
} = require("../utils/accessHelpers");

const populateMeeting = (query) =>
  query
    .populate("group", "name code")
    .populate({
      path: "students",
      populate: [
        { path: "user", select: "name email" },
        { path: "department", select: "name code" },
      ],
    })
    .populate({
      path: "createdBy",
      populate: { path: "user", select: "name email" },
    });

const createMeeting = async (req, res) => {
  try {
    let supervisor = await getSupervisorProfile(req.user._id);

    if (!supervisor && req.user.role === "admin") {
      const { createdBy, group } = req.body;

      if (createdBy) {
        supervisor = await Supervisor.findById(createdBy);
      } else if (group) {
        const groupRecord = await Group.findById(group);
        if (groupRecord?.supervisor) {
          supervisor = await Supervisor.findById(
            groupRecord.supervisor
          );
        }
      }

      if (!supervisor) {
        return res.status(400).json({
          success: false,
          message:
            "Admin must provide createdBy (supervisor) or a group with a supervisor",
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
      date,
      time,
      location,
      meetingLink,
      group,
      students,
      status,
    } = req.body;

    if (!title || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Title, date and time are required",
      });
    }

    let studentIds = Array.isArray(students)
      ? [...new Set(students.filter(Boolean))]
      : [];

    if (group) {
      const groupRecord = await Group.findById(group);

      if (!groupRecord) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        groupRecord.supervisor?.toString() !==
          supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only schedule meetings for your groups",
        });
      }

      if (!studentIds.length) {
        studentIds = groupRecord.members.map((id) =>
          id.toString()
        );
      }
    }

    if (!studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Select a group or at least one student",
      });
    }

    if (req.user.role !== "admin") {
      for (const studentId of studentIds) {
        const allowed = await studentBelongsToSupervisor(
          studentId,
          supervisor._id
        );

        if (!allowed) {
          return res.status(403).json({
            success: false,
            message:
              "All selected students must belong to your groups",
          });
        }
      }
    }

    const meeting = await Meeting.create({
      title: title.trim(),
      description: description?.trim() || "",
      date,
      time: time.trim(),
      location: location?.trim() || "",
      meetingLink: meetingLink?.trim() || "",
      group: group || null,
      students: studentIds,
      createdBy: supervisor._id,
      status: status || "scheduled",
    });

    const populated = await populateMeeting(
      Meeting.findById(meeting._id)
    );

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: populated,
      meeting: populated,
    });
  } catch (error) {
    console.error("Create meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create meeting",
    });
  }
};

const getMeetings = async (req, res) => {
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
      filter.students = student._id;
    } else if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor profile not found",
        });
      }
      filter.createdBy = supervisor._id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const meetings = await populateMeeting(
      Meeting.find(filter).sort({ date: 1, time: 1 })
    );

    return res.status(200).json({
      success: true,
      message: "Meetings fetched successfully",
      count: meetings.length,
      data: meetings,
      meetings,
    });
  } catch (error) {
    console.error("Get meetings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch meetings",
    });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const meeting = await populateMeeting(
      Meeting.findById(req.params.id)
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    if (req.user.role === "student") {
      const student = await getStudentProfile(req.user._id);
      const isInvitee = meeting.students.some(
        (s) => s._id.toString() === student?._id?.toString()
      );

      if (!isInvitee) {
        return res.status(403).json({
          success: false,
          message: "You can only view meetings you are invited to",
        });
      }
    }

    if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (
        !supervisor ||
        meeting.createdBy._id.toString() !==
          supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only view meetings you created",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Meeting fetched successfully",
      data: meeting,
      meeting,
    });
  } catch (error) {
    console.error("Get meeting by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch meeting",
    });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    let supervisor = null;

    if (req.user.role === "supervisor") {
      supervisor = await getSupervisorProfile(req.user._id);
      if (
        !supervisor ||
        meeting.createdBy.toString() !== supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update meetings you created",
        });
      }
    }

    const {
      title,
      description,
      date,
      time,
      location,
      meetingLink,
      group,
      students,
      status,
    } = req.body;

    if (title !== undefined) meeting.title = title.trim();
    if (description !== undefined) {
      meeting.description = description.trim();
    }
    if (date !== undefined) meeting.date = date;
    if (time !== undefined) meeting.time = time.trim();
    if (location !== undefined) meeting.location = location.trim();
    if (meetingLink !== undefined) {
      meeting.meetingLink = meetingLink.trim();
    }
    if (status !== undefined) meeting.status = status;

    if (group !== undefined) {
      if (group) {
        const groupRecord = await Group.findById(group);
        if (!groupRecord) {
          return res.status(404).json({
            success: false,
            message: "Group not found",
          });
        }

        if (
          req.user.role === "supervisor" &&
          groupRecord.supervisor?.toString() !==
            supervisor._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: "Invalid group for this supervisor",
          });
        }
      }
      meeting.group = group || null;
    }

    if (students !== undefined) {
      const studentIds = Array.isArray(students)
        ? [...new Set(students.filter(Boolean))]
        : [];

      if (req.user.role === "supervisor") {
        for (const studentId of studentIds) {
          const allowed = await studentBelongsToSupervisor(
            studentId,
            supervisor._id
          );
          if (!allowed) {
            return res.status(403).json({
              success: false,
              message:
                "All selected students must belong to your groups",
            });
          }
        }
      }

      meeting.students = studentIds;
    }

    await meeting.save();

    const populated = await populateMeeting(
      Meeting.findById(meeting._id)
    );

    return res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      data: populated,
      meeting: populated,
    });
  } catch (error) {
    console.error("Update meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update meeting",
    });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (
        !supervisor ||
        meeting.createdBy.toString() !== supervisor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete meetings you created",
        });
      }
    }

    await meeting.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Delete meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete meeting",
    });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
};
