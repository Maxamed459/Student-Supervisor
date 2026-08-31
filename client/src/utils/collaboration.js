export const documentTypeLabel = {
  thesis: "Thesis",
  project_book: "Project Book",
  proposal: "Proposal",
  report: "Report",
  other: "Other",
};

export const documentStatusLabel = {
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
};

export const taskStatusLabel = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export const taskAssignmentTypeLabel = {
  all_group: "All Group",
  single_student: "Single Student",
};

export function getTaskAssignmentType(task) {
  if (task?.assignmentType === "all_group") return "all_group";
  if (task?.assignmentType === "single_student") return "single_student";
  // Legacy tasks created before assignmentType existed
  return task?.group ? "single_student" : "single_student";
}

export const meetingStatusLabel = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusBadgeClass(status) {
  if (
    status === "approved" ||
    status === "completed" ||
    status === "scheduled"
  ) {
    return "badge badge-success";
  }

  if (
    status === "pending_review" ||
    status === "pending" ||
    status === "in_progress" ||
    status === "changes_requested"
  ) {
    return "badge badge-warning";
  }

  if (status === "rejected" || status === "cancelled") {
    return "badge badge-muted";
  }

  return "badge badge-muted";
}

export function getDocumentPreviewKind(doc) {
  const mime = (doc?.mimeType || doc?.fileType || "").toLowerCase();
  const name = (doc?.originalName || doc?.fileName || "").toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("wordprocessingml") ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  if (mime === "application/msword" || name.endsWith(".doc")) {
    return "doc";
  }
  if (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp)$/.test(name)
  ) {
    return "image";
  }
  if (mime.startsWith("text/") || name.endsWith(".txt")) return "text";
  return "unsupported";
}

export function canPreviewInBrowser(doc) {
  const kind = getDocumentPreviewKind(doc);
  return kind === "pdf" || kind === "image" || kind === "text";
}

/**
 * Open a document for in-browser viewing (no forced download).
 * Uses the authenticated inline download endpoint so Cloudinary "raw"
 * assets are not served with Content-Disposition: attachment.
 */
export async function viewDocumentFile(apiOrService, doc) {
  const documentId = doc?._id || doc?.id;
  const kind = getDocumentPreviewKind(doc);

  if (!documentId) {
    throw new Error("Document id is required");
  }

  if (!canPreviewInBrowser(doc)) {
    return {
      opened: false,
      reason: "unsupported",
      kind,
      message:
        kind === "docx" || kind === "doc"
          ? "Word documents cannot be previewed in the browser. Please download the file instead."
          : "This file type cannot be previewed in the browser. Please download the file instead.",
    };
  }

  // Open during the user gesture so the tab is not treated as a pop-up.
  const previewTab = window.open("about:blank", "_blank");

  try {
    const response =
      typeof apiOrService.view === "function"
        ? await apiOrService.view(documentId)
        : await apiOrService.get(`/documents/${documentId}/download`, {
            params: { inline: "1" },
            responseType: "blob",
          });

    const mime =
      doc?.mimeType ||
      doc?.fileType ||
      response.data?.type ||
      (kind === "pdf"
        ? "application/pdf"
        : kind === "text"
          ? "text/plain"
          : "application/octet-stream");

    const blob = new Blob([response.data], { type: mime });
    const url = window.URL.createObjectURL(blob);

    if (previewTab) {
      previewTab.location.href = url;
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    // Allow the new tab to load before revoking
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);

    return { opened: true, kind };
  } catch (error) {
    if (previewTab && !previewTab.closed) {
      previewTab.close();
    }
    throw error;
  }
}

/**
 * Explicitly download a document (attachment). Prefer the API so
 * Content-Disposition: attachment is applied consistently.
 */
export async function downloadDocumentFile(
  apiOrService,
  documentId,
  fileName,
  fileUrl
) {
  try {
    const response =
      typeof apiOrService.download === "function"
        ? await apiOrService.download(documentId)
        : await apiOrService.get(`/documents/${documentId}/download`, {
            responseType: "blob",
          });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName || "document");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    // Last-resort fallback if the API proxy fails
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("download", fileName || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    throw error;
  }
}
