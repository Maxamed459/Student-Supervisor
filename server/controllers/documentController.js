const fs = require("fs");
const path = require("path");
const Document = require("../models/Document");
const {
  getStudentProfile,
  getSupervisorProfile,
  getSupervisorStudentIds,
  studentBelongsToSupervisor,
  getStudentActiveGroup,
} = require("../utils/accessHelpers");

const populateDocument = (query) =>
  query
    .populate({
      path: "uploadedBy",
      populate: [
        { path: "user", select: "name email" },
        { path: "department", select: "name code" },
      ],
    })
    .populate("group", "name code")
    .populate({
      path: "reviewedBy",
      populate: { path: "user", select: "name email" },
    });

const canAccessDocument = async (req, document) => {
  if (req.user.role === "admin") return true;

  if (req.user.role === "student") {
    const student = await getStudentProfile(req.user._id);
    if (!student) return false;

    const uploaderId =
      document.uploadedBy._id?.toString() ||
      document.uploadedBy.toString();

    return uploaderId === student._id.toString();
  }

  if (req.user.role === "supervisor") {
    const supervisor = await getSupervisorProfile(req.user._id);
    if (!supervisor) return false;

    const uploaderId =
      document.uploadedBy._id?.toString() ||
      document.uploadedBy.toString();

    return studentBelongsToSupervisor(
      uploaderId,
      supervisor._id
    );
  }

  return false;
};

const allowedTypes = [
  "thesis",
  "project_book",
  "proposal",
  "report",
  "other",
];

// Student: upload document
const uploadDocument = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user._id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const { title, type } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Document title is required",
      });
    }

    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid document type is required (thesis, project_book, proposal, report, other)",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    const group = await getStudentActiveGroup(student._id);

    const document = await Document.create({
      title: title.trim(),
      type,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: student._id,
      group: group?._id || null,
      status: "pending_review",
    });

    const populated = await populateDocument(
      Document.findById(document._id)
    );

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: populated,
      document: populated,
    });
  } catch (error) {
    console.error("Upload document error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload document",
    });
  }
};

// Student: resubmit after changes requested / rejection
const resubmitDocument = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user._id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.uploadedBy.toString() !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only resubmit your own documents",
      });
    }

    if (
      !["changes_requested", "rejected"].includes(document.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only rejected or changes-requested documents can be resubmitted",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A new document file is required for resubmission",
      });
    }

    if (req.body.title?.trim()) {
      document.title = req.body.title.trim();
    }

    if (req.body.type && allowedTypes.includes(req.body.type)) {
      document.type = req.body.type;
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    document.fileName = req.file.filename;
    document.originalName = req.file.originalname;
    document.filePath = req.file.path;
    document.mimeType = req.file.mimetype;
    document.fileSize = req.file.size;
    document.status = "pending_review";
    document.feedback = "";
    document.reviewedBy = null;
    document.reviewedAt = null;

    await document.save();

    const populated = await populateDocument(
      Document.findById(document._id)
    );

    return res.status(200).json({
      success: true,
      message: "Document resubmitted for review",
      data: populated,
      document: populated,
    });
  } catch (error) {
    console.error("Resubmit document error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to resubmit document",
    });
  }
};

// Student: my documents / Supervisor: group documents / Admin: all
const getDocuments = async (req, res) => {
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
      filter.uploadedBy = student._id;
    } else if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor profile not found",
        });
      }

      const studentIds = await getSupervisorStudentIds(
        supervisor._id
      );
      filter.uploadedBy = { $in: studentIds };

      if (req.query.status) {
        filter.status = req.query.status;
      }
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    const documents = await populateDocument(
      Document.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      count: documents.length,
      data: documents,
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

const getDocumentStats = async (req, res) => {
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

      const studentIds = await getSupervisorStudentIds(
        supervisor._id
      );
      base = { uploadedBy: { $in: studentIds } };
    }

    const [pendingReviews, approved, rejected, changesRequested] =
      await Promise.all([
        Document.countDocuments({
          ...base,
          status: "pending_review",
        }),
        Document.countDocuments({ ...base, status: "approved" }),
        Document.countDocuments({ ...base, status: "rejected" }),
        Document.countDocuments({
          ...base,
          status: "changes_requested",
        }),
      ]);

    const stats = {
      pendingReviews,
      approved,
      rejected,
      changesRequested,
      total: pendingReviews + approved + rejected + changesRequested,
    };

    return res.status(200).json({
      success: true,
      message: "Document stats fetched successfully",
      data: stats,
      stats,
    });
  } catch (error) {
    console.error("Get document stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document stats",
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await populateDocument(
      Document.findById(req.params.id)
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const allowed = await canAccessDocument(req, document);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this document",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document fetched successfully",
      data: document,
      document,
    });
  } catch (error) {
    console.error("Get document by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document",
    });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const allowed = await canAccessDocument(req, document);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to download this document",
      });
    }

    const absolutePath = path.resolve(document.filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    const inline =
      req.query.inline === "1" ||
      req.query.inline === "true" ||
      req.query.view === "1";

    const fileName =
      document.originalName || document.fileName || "document";

    if (inline) {
      res.setHeader(
        "Content-Type",
        document.mimeType || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(fileName)}"`
      );
      return res.sendFile(absolutePath);
    }

    return res.download(absolutePath, fileName);
  } catch (error) {
    console.error("Download document error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download document",
    });
  }
};

const reviewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    let supervisor = null;

    if (req.user.role === "supervisor") {
      supervisor = await getSupervisorProfile(req.user._id);

      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor profile not found",
        });
      }

      const allowed = await studentBelongsToSupervisor(
        document.uploadedBy,
        supervisor._id
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "You can only review documents from students in your groups",
        });
      }
    }

    const { status, feedback } = req.body;
    const allowedStatuses = [
      "approved",
      "rejected",
      "changes_requested",
      "pending_review",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid status is required (approved, rejected, changes_requested)",
      });
    }

    if (
      (status === "rejected" || status === "changes_requested") &&
      !feedback?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Feedback is required when rejecting or requesting changes",
      });
    }

    document.status = status;
    document.feedback = feedback?.trim() || "";
    if (supervisor) {
      document.reviewedBy = supervisor._id;
    }
    document.reviewedAt = new Date();
    await document.save();

    const populated = await populateDocument(
      Document.findById(document._id)
    );

    return res.status(200).json({
      success: true,
      message: "Document review saved successfully",
      data: populated,
      document: populated,
    });
  } catch (error) {
    console.error("Review document error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to review document",
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (req.user.role === "student") {
      const student = await getStudentProfile(req.user._id);
      if (
        !student ||
        document.uploadedBy.toString() !== student._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own documents",
        });
      }

      if (document.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Approved documents cannot be deleted",
        });
      }
    } else if (req.user.role === "supervisor") {
      const supervisor = await getSupervisorProfile(req.user._id);
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor profile not found",
        });
      }

      const allowed = await studentBelongsToSupervisor(
        document.uploadedBy,
        supervisor._id
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete documents from students in your groups",
        });
      }
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await document.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};

module.exports = {
  uploadDocument,
  resubmitDocument,
  getDocuments,
  getDocumentStats,
  getDocumentById,
  downloadDocument,
  reviewDocument,
  deleteDocument,
};
