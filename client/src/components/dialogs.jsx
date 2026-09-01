import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react';
import { label } from '../utils/format';

export function FormDialog({ open, title, subtitle, icon: Icon, onClose, children, panelClassName = '' }) {
  if (!open) return null;
  const isGroupPanel = panelClassName.includes('modal-panel--group');
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal-panel ${panelClassName}`.trim()}
        style={{
          width: isGroupPanel ? 'min(100%, 720px)' : 'min(100%, 560px)',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: isGroupPanel ? 'visible' : 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            {Icon ? <div className="modal-icon"><Icon size={20} /></div> : null}
            <h2 id="form-dialog-title" style={{ margin: Icon ? '12px 0 4px' : '0 0 4px' }}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-button compact" onClick={onClose} type="button" aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function ForgotPasswordDialog({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel reset-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-icon"><LockKeyhole size={20} /></div>
        <h2 id="reset-title">Forgot your password?</h2>
        <p>
          This system doesn't have self-service password resets — every account is managed
          by an Administrator.
        </p>
        <div className="reset-form">
          <div className="field">
            <span>What to do</span>
            <div className="input-shell has-icon" style={{ alignItems: 'flex-start', paddingTop: 10 }}>
              <ShieldCheck size={16} strokeWidth={2.1} />
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                Contact your Administrator. They can reset your password for you from the Users
                screen — you'll be asked to set a new one the next time you log in.
              </p>
            </div>
          </div>
          <div className="field">
            <span>No admin contact on hand?</span>
            <div className="input-shell has-icon">
              <Mail size={16} strokeWidth={2.1} />
              <span style={{ fontSize: 13 }}>Check with whoever set up your account for their contact details.</span>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="primary-button inline" onClick={onClose} type="button">Got it</button>
        </div>
      </section>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className={`modal-icon${destructive ? ' modal-icon-danger' : ''}`}>
          {destructive ? <AlertTriangle size={20} /> : <LogOut size={20} />}
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} type="button">Cancel</button>
          <button
            className={destructive ? 'primary-button inline danger-button-solid' : 'primary-button inline'}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function RequestChangesDialog({
  open,
  submission,
  onClose,
  onConfirm,
  pending = false,
}) {
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);
  const maxLength = 2000;

  useEffect(() => {
    if (open) {
      setFeedback('');
      setError('');
      window.setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [open]);

  if (!open || !submission) return null;

  const title = label(submission.milestone || submission.milestoneId || submission);
  const studentName = label(submission.student || submission.studentId);
  const groupName = label(submission.group || submission.student?.group);
  const version = submission.currentVersion || submission.versions?.length || 1;

  const submit = () => {
    const clean = feedback.trim();
    if (!clean) {
      setError('Feedback is required so the student knows what to revise.');
      return;
    }
    onConfirm(clean);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={pending ? undefined : onClose}>
      <section
        className="modal-panel review-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-changes-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-icon modal-icon-danger"><AlertTriangle size={20} /></div>
        <h2 id="request-changes-title">Request changes</h2>
        <p>Send clear revision guidance back to the student.</p>
        <dl className="review-dialog-meta">
          <div><dt>Submission</dt><dd>{title}</dd></div>
          <div><dt>Student</dt><dd>{studentName}</dd></div>
          {groupName !== 'Not assigned' ? <div><dt>Group</dt><dd>{groupName}</dd></div> : null}
          <div><dt>Version</dt><dd>v{version}</dd></div>
        </dl>
        <label className="field">
          <span>Revision feedback</span>
          <div className={`input-shell${error ? ' has-error' : ''}`}>
            <textarea
              ref={textareaRef}
              rows={6}
              value={feedback}
              maxLength={maxLength}
              placeholder="Clearly explain what needs to be revised or improved..."
              onChange={(event) => {
                setFeedback(event.target.value);
                if (error) setError('');
              }}
            />
          </div>
          {error ? <small className="field-error"><AlertTriangle size={13} />{error}</small> : null}
          <small className="char-count">{feedback.length}/{maxLength}</small>
        </label>
        <div className="modal-actions">
          <button className="secondary-button" disabled={pending} onClick={onClose} type="button">Cancel</button>
          <button className="primary-button inline danger-button-solid" disabled={pending} onClick={submit} type="button">
            {pending ? <><Loader2 className="spin" size={15} />Sending…</> : 'Request changes'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function ApproveSubmissionDialog({
  open,
  submission,
  onClose,
  onConfirm,
  pending = false,
}) {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (open) setFeedback('');
  }, [open]);

  if (!open || !submission) return null;

  const title = label(submission.milestone || submission.milestoneId || submission);
  const studentName = label(submission.student || submission.studentId);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={pending ? undefined : onClose}>
      <section
        className="modal-panel review-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-icon"><CheckCircle2 size={20} /></div>
        <h2 id="approve-title">Approve submission?</h2>
        <p>
          Confirm approval for <strong>{title}</strong> submitted by <strong>{studentName}</strong>.
          You can optionally leave a note for the student.
        </p>
        <label className="field">
          <span>Optional feedback</span>
          <div className="input-shell">
            <textarea
              rows={4}
              value={feedback}
              placeholder="Add an optional approval note..."
              onChange={(event) => setFeedback(event.target.value)}
            />
          </div>
        </label>
        <div className="modal-actions">
          <button className="secondary-button" disabled={pending} onClick={onClose} type="button">Cancel</button>
          <button className="primary-button inline" disabled={pending} onClick={() => onConfirm(feedback.trim())} type="button">
            {pending ? <><Loader2 className="spin" size={15} />Approving…</> : 'Approve submission'}
          </button>
        </div>
      </section>
    </div>
  );
}
