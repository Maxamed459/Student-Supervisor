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

export async function downloadDocumentFile(
  apiOrService,
  documentId,
  fileName,
  fileUrl
) {
  // Prefer Cloudinary URL when available (no local server file)
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
}
