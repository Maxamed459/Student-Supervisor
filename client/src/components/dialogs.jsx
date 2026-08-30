import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Hash, LockKeyhole, LogOut, Mail } from 'lucide-react';
import { requestPasswordReset, resetPasswordRequest, verifyResetOtp } from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import { Field } from './common';

export function ForgotPasswordDialog({ open, onClose }) {
  const toast = useToast();
  const [step, setStep] = useState('email');
  const [form, setForm] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      toast.success(data.message);
      setStep('otp');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const verifyMutation = useMutation({
    mutationFn: verifyResetOtp,
    onSuccess: (data) => {
      toast.success(data.message);
      setStep('password');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const resetMutation = useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: (data) => {
      toast.success(data.message);
      onClose();
      setStep('email');
      setForm({ email: '', otp: '', password: '', confirmPassword: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  if (!open) return null;

  const pending = requestMutation.isPending || verifyMutation.isPending || resetMutation.isPending;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel reset-panel" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-icon"><LockKeyhole size={20} /></div>
        <h2 id="reset-title">Reset password</h2>
        <p>Use the OTP sent to your registered email. Codes expire after a short period.</p>
        <form
          className="reset-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 'email') requestMutation.mutate({ email: form.email });
            if (step === 'otp') verifyMutation.mutate({ email: form.email, otp: form.otp });
            if (step === 'password') {
              if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
              resetMutation.mutate({ email: form.email, otp: form.otp, password: form.password });
            }
          }}
        >
          <Field icon={Mail} label="Registered email">
            <input value={form.email} disabled={step !== 'email'} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@university.edu" />
          </Field>
          {step !== 'email' ? (
            <Field icon={Hash} label="OTP">
              <input inputMode="numeric" maxLength="6" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value.replace(/\D/g, '') })} placeholder="6 digit code" />
            </Field>
          ) : null}
          {step === 'password' ? (
            <>
              <Field icon={LockKeyhole} label="New password">
                <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimum 8 characters" />
              </Field>
              <Field icon={LockKeyhole} label="Confirm password">
                <input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Repeat new password" />
              </Field>
            </>
          ) : null}
          <div className="modal-actions">
            <button className="secondary-button" onClick={onClose} type="button">Cancel</button>
            {step !== 'email' ? <button className="secondary-button" disabled={pending} onClick={() => requestMutation.mutate({ email: form.email })} type="button">Resend OTP</button> : null}
            <button className="primary-button inline" disabled={pending} type="submit">
              {step === 'email' ? 'Send OTP' : step === 'otp' ? 'Verify OTP' : 'Reset password'}
            </button>
          </div>
        </form>
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
