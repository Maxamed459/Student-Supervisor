import { useEffect, useState } from "react";
import mammoth from "mammoth";
import documentsService from "../services/documentsService";
import {
  documentStatusLabel,
  documentTypeLabel,
  downloadDocumentFile,
  formatDateTime,
  getDocumentPreviewKind,
  statusBadgeClass,
} from "../utils/collaboration";

const DECISIONS = [
  {
    value: "approved",
    label: "Approve",
    hint: "Accept this submission",
  },
  {
    value: "changes_requested",
    label: "Request changes",
    hint: "Ask the student to revise",
  },
  {
    value: "rejected",
    label: "Reject",
    hint: "Decline this submission",
  },
];

function DocumentReviewViewer({
  document: doc,
  onClose,
  onSubmitReview,
  saving = false,
  allowPendingStatus = false,
  errorMessage = "",
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [docxHtml, setDocxHtml] = useState("");
  const [textContent, setTextContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [reviewForm, setReviewForm] = useState({
    status: "approved",
    feedback: doc?.feedback || "",
  });

  const kind = getDocumentPreviewKind(doc);
  const studentName = doc?.uploadedBy?.user?.name || "N/A";
  const studentEmail = doc?.uploadedBy?.user?.email || "";
  const groupName = doc?.group?.name || "No group";
  const groupCode = doc?.group?.code || "";
  const typeLabel = documentTypeLabel[doc?.type] || doc?.type || "Document";

  const decisions = allowPendingStatus
    ? [
        ...DECISIONS,
        {
          value: "pending_review",
          label: "Keep pending",
          hint: "Leave awaiting review",
        },
      ]
    : DECISIONS;

  useEffect(() => {
    setReviewForm({
      status:
        doc?.status === "pending_review"
          ? "approved"
          : doc?.status || "approved",
      feedback: doc?.feedback || "",
    });
  }, [doc]);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    const loadPreview = async () => {
      if (!doc?._id) return;

      try {
        setPreviewLoading(true);
        setPreviewError("");
        setDocxHtml("");
        setTextContent("");
        setPreviewUrl("");

        // Always proxy through the API with inline disposition so Cloudinary
        // "raw" PDFs/images are not forced as attachments in the iframe.
        if (kind === "pdf" || kind === "image") {
          const response = await documentsService.view(doc._id);
          const mime =
            doc.mimeType ||
            doc.fileType ||
            response.data?.type ||
            (kind === "pdf" ? "application/pdf" : "image/*");
          const blob = new Blob([response.data], { type: mime });
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) setPreviewUrl(objectUrl);
          return;
        }

        let blob;

        if (doc.fileUrl && (kind === "docx" || kind === "text")) {
          try {
            const cloudRes = await fetch(doc.fileUrl);
            if (!cloudRes.ok) {
              throw new Error("Failed to load file from Cloudinary");
            }
            blob = await cloudRes.blob();
          } catch {
            const response = await documentsService.view(doc._id);
            blob = new Blob([response.data], {
              type:
                doc.mimeType ||
                doc.fileType ||
                response.data.type ||
                "application/octet-stream",
            });
          }
        } else {
          const response = await documentsService.view(doc._id);
          blob = new Blob([response.data], {
            type:
              doc.mimeType ||
              doc.fileType ||
              response.data.type ||
              "application/octet-stream",
          });
        }

        if (cancelled) return;

        if (kind === "docx") {
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!cancelled) {
            setDocxHtml(result.value || "<p>(Empty document)</p>");
          }
        } else if (kind === "text") {
          const text = await blob.text();
          if (!cancelled) setTextContent(text);
        } else if (kind === "doc") {
          setPreviewError(
            "Legacy .DOC files cannot be previewed here. Download the file, or ask the student to resubmit as PDF or DOCX."
          );
        } else {
          setPreviewError(
            "This file type cannot be previewed in the app. You can still download it and leave a review."
          );
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setPreviewError(
            error.response?.data?.message ||
              error.message ||
              "Failed to load document preview"
          );
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc?._id, doc?.mimeType, doc?.fileType, doc?.fileUrl, kind]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview?.(reviewForm);
  };

  const handleDownload = () => {
    downloadDocumentFile(
      documentsService,
      doc._id,
      doc.originalName || doc.fileName,
      doc.fileUrl
    );
  };

  return (
    <div className="modal-overlay doc-viewer-overlay">
      <div className="doc-viewer-shell" role="dialog" aria-modal="true">
        <header className="doc-viewer-topbar">
          <div className="doc-viewer-topbar-main">
            <p className="doc-viewer-kicker">Document review</p>
            <h3>{doc?.title || "Untitled document"}</h3>
            <div className="doc-viewer-trail" aria-label="Document details">
              <span>
                <em>Document</em>
                {typeLabel}
              </span>
              <span className="doc-trail-sep" aria-hidden="true">
                →
              </span>
              <span>
                <em>Group</em>
                {groupName}
                {groupCode ? ` · ${groupCode}` : ""}
              </span>
              <span className="doc-trail-sep" aria-hidden="true">
                →
              </span>
              <span>
                <em>Student</em>
                {studentName}
              </span>
              <span className="doc-trail-sep" aria-hidden="true">
                →
              </span>
              <span>
                <em>Uploaded</em>
                {formatDateTime(doc?.createdAt)}
              </span>
              <span className="doc-trail-sep" aria-hidden="true">
                →
              </span>
              <span className="doc-trail-status">
                <em>Status</em>
                <span className={statusBadgeClass(doc?.status)}>
                  {documentStatusLabel[doc?.status] || doc?.status}
                </span>
              </span>
            </div>
          </div>

          <div className="doc-viewer-topbar-actions">
            <button
              type="button"
              className="doc-ghost-btn"
              onClick={handleDownload}
            >
              Download
            </button>
            <button
              type="button"
              className="doc-close-btn"
              onClick={onClose}
              aria-label="Close reviewer"
            >
              ×
            </button>
          </div>
        </header>

        <div className="doc-viewer-workspace">
          <section
            className="doc-viewer-stage"
            aria-label="Document preview"
          >
            <div className="doc-stage-frame">
              {previewLoading ? (
                <div className="doc-preview-state">
                  <div className="doc-preview-spinner" />
                  <p>Loading preview…</p>
                </div>
              ) : previewError ? (
                <div className="doc-preview-state">
                  <p>{previewError}</p>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleDownload}
                  >
                    Download file
                  </button>
                </div>
              ) : kind === "pdf" && previewUrl ? (
                <iframe
                  title={`Preview of ${doc?.title}`}
                  src={`${previewUrl}#toolbar=0&navpanes=0`}
                  className="doc-preview-frame"
                />
              ) : kind === "image" && previewUrl ? (
                <div className="doc-preview-image-wrap">
                  <img
                    src={previewUrl}
                    alt={doc?.title || "Document"}
                  />
                </div>
              ) : kind === "docx" ? (
                <div
                  className="doc-preview-html"
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              ) : kind === "text" ? (
                <pre className="doc-preview-text">{textContent}</pre>
              ) : (
                <div className="doc-preview-state">
                  <p>Preview unavailable for this file type.</p>
                </div>
              )}
            </div>
          </section>

          <aside
            className="doc-review-panel"
            aria-label="Review and feedback"
          >
            <div className="doc-review-panel-head">
              <h4>Review & feedback</h4>
              <p>
                Decide on this submission and leave notes for{" "}
                <strong>{studentName}</strong>
                {studentEmail ? ` (${studentEmail})` : ""}.
              </p>
            </div>

            {doc?.feedback && doc?.status !== "pending_review" ? (
              <div className="doc-prior-note">
                <span>Previous feedback</span>
                <p>{doc.feedback}</p>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="message error">{errorMessage}</div>
            ) : null}

            <form className="doc-review-form" onSubmit={handleSubmit}>
              <fieldset className="doc-decision-set">
                <legend>Decision</legend>
                <div className="doc-decision-grid">
                  {decisions.map((option) => {
                    const active = reviewForm.status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`doc-decision-card${
                          active ? " active" : ""
                        } decision-${option.value}`}
                        onClick={() =>
                          setReviewForm((prev) => ({
                            ...prev,
                            status: option.value,
                          }))
                        }
                      >
                        <strong>{option.label}</strong>
                        <small>{option.hint}</small>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label
                className="doc-feedback-label"
                htmlFor="doc-review-feedback"
              >
                Feedback
              </label>
              <textarea
                id="doc-review-feedback"
                rows={7}
                value={reviewForm.feedback}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    feedback: e.target.value,
                  }))
                }
                placeholder="Write clear feedback for the student. Required when rejecting or requesting changes."
              />

              <div className="doc-review-footer">
                <button
                  type="button"
                  className="doc-ghost-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save review"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default DocumentReviewViewer;
