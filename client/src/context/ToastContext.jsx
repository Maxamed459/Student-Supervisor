import { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { ToastContext } from './toastContextValue';

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (type, message) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, type, message }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200);
  };
  const value = {
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    warning: (message) => push('warning', message),
    info: (message) => push('info', message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type] || Info;
          return (
            <div className={`toast toast-${toast.type}`} key={toast.id}>
              <span className="toast-icon" aria-hidden="true"><Icon size={18} /></span>
              <span>{toast.message}</span>
              <button onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))} type="button" aria-label="Dismiss notification">×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
