import { LockKeyhole, LogOut, Mail, ShieldCheck, X } from 'lucide-react';

export function FormDialog({ open, title, subtitle, icon: Icon, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel"
        style={{ width: 'min(100%, 560px)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
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

export function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-icon"><LogOut size={20} /></div>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} type="button">Cancel</button>
          <button className="primary-button inline" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
