import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  Send,
  X,
} from 'lucide-react';
import { useToast } from '../context/useToast';
import { formatBytes, formatDate, getFileCategory } from '../utils/format';
import { ApproveSubmissionDialog, RequestChangesDialog } from './dialogs';

export function PdfViewer({ url, fileName }) {
  const [state, setState] = useState({ blobUrl: null, loading: true, error: null, currentUrl: url });

  const activeState = state.currentUrl === url ? state : { blobUrl: null, loading: true, error: null, currentUrl: url };

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(pdfBlob);
        setState({ blobUrl: createdUrl, loading: false, error: null, currentUrl: url });
      })
      .catch((err) => {
        if (!active) return;
        setState({ blobUrl: null, loading: false, error: err.message || 'Could not load PDF', currentUrl: url });
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [url]);

  const { blobUrl, loading, error } = activeState;

  if (loading) {
    return (
      <div className="pdf-viewer-loading">
        <Loader2 className="spin" size={32} />
        <p>Loading PDF document…</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="raw-preview-box">
        <FileText size={48} strokeWidth={1.5} />
        <strong>{fileName}</strong>
        <p>Could not preview inline. You can open or download the PDF directly using the buttons below.</p>
        <div className="row-actions" style={{ justifyContent: 'center', marginTop: 12 }}>
          <a
            className="primary-button inline"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink size={15} />Open PDF in new tab
          </a>
          <a
            className="secondary-button"
            download={fileName}
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Download size={15} />Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container">
      <iframe
        className="pdf-preview-iframe"
        src={`${blobUrl}#toolbar=1&navpanes=1`}
        title={fileName}
      />
    </div>
  );
}

export function FileViewerDialog({ file, onClose }) {
  if (!file) return null;

  const fileName = file.originalFilename || file.originalName || 'Document';
  const category = getFileCategory(file);
  const secureUrl = file.secureUrl || file.url;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel file-viewer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-viewer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="file-viewer-header">
          <div className="file-viewer-title" id="file-viewer-title">
            {category === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
            <span>{fileName}</span>
            {file.bytes ? <small className="file-badge">({formatBytes(file.bytes)})</small> : null}
          </div>
          <div className="file-viewer-actions">
            <a
              className="icon-button"
              href={secureUrl}
              rel="noopener noreferrer"
              target="_blank"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>
            <a
              className="icon-button"
              download={fileName}
              href={secureUrl}
              rel="noopener noreferrer"
              target="_blank"
              title="Download file"
            >
              <Download size={16} />
            </a>
            <button
              className="icon-button"
              onClick={onClose}
              type="button"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="file-viewer-body">
          {category === 'pdf' ? (
            <PdfViewer url={secureUrl} fileName={fileName} />
          ) : category === 'image' ? (
            <img
              alt={fileName}
              className="image-preview-img"
              src={secureUrl}
            />
          ) : (
            <div className="raw-preview-box">
              <File size={48} strokeWidth={1.5} />
              <strong>{fileName}</strong>
              <p>This file type cannot be previewed directly in the browser. You can download or open it using the link below.</p>
              <a
                className="primary-button inline"
                download={fileName}
                href={secureUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Download size={15} />Download {fileName}
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function SubmissionFiles({ submission }) {
  const [activePreview, setActivePreview] = useState(null);
  const version = submission.versions?.find((item) => item.versionNumber === submission.currentVersion) || submission.versions?.at(-1);
  const files = version?.files?.length ? version.files : version?.file ? [version.file] : [];
  if (!files.length) return 'No files';

  return (
    <>
      <div className="file-link-list">
        {files.map((file) => {
          const fileName = file.originalFilename || file.originalName || 'Document';
          const category = getFileCategory(file);
          const secureUrl = file.secureUrl || file.url;
          return (
            <div className="file-row" key={file.publicId || secureUrl}>
              <button
                className="file-preview-btn"
                onClick={() => setActivePreview(file)}
                title={`Preview ${fileName}`}
                type="button"
              >
                <Eye size={13} />
              </button>
              <a
                className="file-link"
                href={secureUrl}
                rel="noopener noreferrer"
                target="_blank"
                title={`Open ${fileName}`}
              >
                {category === 'image' ? <ImageIcon size={13} /> : <FileText size={13} />}
                <span>{fileName}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          );
        })}
      </div>
      {activePreview ? (
        <FileViewerDialog
          file={activePreview}
          onClose={() => setActivePreview(null)}
        />
      ) : null}
    </>
  );
}

export function FeedbackReplyForm({ submission, mutation }) {
  const [message, setMessage] = useState('');
  return (
    <form
      className="feedback-reply"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanMessage = message.trim();
        if (!cleanMessage) return;
        mutation.mutate({ id: submission._id, message: cleanMessage }, {
          onSuccess: () => setMessage(''),
        });
      }}
    >
      <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Reply feedback" />
      <button className="small-button" disabled={mutation.isPending || !message.trim()} type="submit">
        <Send size={13} />Send
      </button>
    </form>
  );
}

export function SubmissionFeedbackCell({ submission }) {
  const feedback = submission.review?.feedback?.trim();
  if (!feedback) {
    return <span className="muted">No feedback yet</span>;
  }
  return (
    <div className="submission-feedback-cell">
      <p>{feedback}</p>
      {submission.review?.reviewedAt ? (
        <small>{formatDate(submission.review.reviewedAt)}</small>
      ) : null}
    </div>
  );
}

export function SubmissionStudentReplyCell({ submission }) {
  const latest = submission.latestStudentReply;
  const count = submission.studentReplies?.length || 0;
  if (!latest) {
    return <span className="muted">No student replies</span>;
  }
  return (
    <div className="submission-feedback-cell">
      <small>{count} student repl{count === 1 ? 'y' : 'ies'}</small>
      <p>{latest.content}</p>
    </div>
  );
}

export function ReviewControls({ item, mutation }) {
  const toast = useToast();
  const [requestOpen, setRequestOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const handleApprove = (feedback) => {
    mutation.mutate(
      { id: item._id, payload: { decision: 'approved', feedback } },
      {
        onSuccess: () => {
          setApproveOpen(false);
          toast.success('Submission approved');
        },
        onError: (error) => toast.error(error.response?.data?.message || error.message),
      },
    );
  };

  const handleRequestChanges = (feedback) => {
    mutation.mutate(
      { id: item._id, payload: { decision: 'changes_requested', feedback } },
      {
        onSuccess: () => {
          setRequestOpen(false);
          toast.success('Revision request sent');
        },
        onError: (error) => toast.error(error.response?.data?.message || error.message),
      },
    );
  };

  return (
    <>
      <div className="review-controls">
        <button className="small-button" onClick={() => setApproveOpen(true)} type="button">
          <CheckCircle2 size={13} />Approve
        </button>
        <button className="small-button danger" onClick={() => setRequestOpen(true)} type="button">
          Request changes
        </button>
      </div>
      <ApproveSubmissionDialog
        open={approveOpen}
        pending={mutation.isPending}
        submission={item}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
      />
      <RequestChangesDialog
        open={requestOpen}
        pending={mutation.isPending}
        submission={item}
        onClose={() => setRequestOpen(false)}
        onConfirm={handleRequestChanges}
      />
    </>
  );
}
