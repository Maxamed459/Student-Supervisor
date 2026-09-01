import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldAlert } from 'lucide-react';
import { changePasswordRequest, logoutRequest } from '../../services/apiClient';
import { BrandMark, Field } from '../../components/common';
import { useToast } from '../../context/useToast';
import { logout } from '../../store/slices/authSlice';
import {
  hasValidationErrors,
  validatePassword,
  validateRequired,
} from '../../utils/validation';

/**
 * Full-page gate rendered by ProtectedLayout whenever the signed-in user
 * still has `mustChangePassword: true` (set on every account an Admin
 * creates, and again on every Admin-driven password reset). The user
 * cannot reach any other screen until they set their own password.
 *
 * On success the server invalidates the refresh token (see
 * auth.controller.js#changePassword), so we log the user out locally and
 * send them back to /login to sign in with the new password.
 */
export function ForceChangePasswordScreen({ userName }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: async () => {
      toast.success('Password changed. Please log in again with your new password.');
      await logoutRequest();
      dispatch(logout());
      navigate('/login', { replace: true });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const validate = () => {
    const next = {
      currentPassword: validateRequired(form.currentPassword, 'Current password'),
      newPassword: validatePassword(form.newPassword),
      confirmPassword: validateRequired(form.confirmPassword, 'Confirm password'),
    };
    if (!next.confirmPassword && form.newPassword !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    setErrors(next);
    return !hasValidationErrors(next);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: '' }));
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    mutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <main className="auth-screen">
      <section className="brand-panel">
        <BrandMark />
        <div className="brand-copy">
          <h1>Set a password only you know</h1>
          <p>Your account was created or reset by an Administrator. For security, choose your own password before continuing.</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div>
            <h2>Change your password</h2>
            <p>
              <ShieldAlert size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Hi {userName || 'there'} — you need to set a new password before you can continue.
            </p>
          </div>
          <Field error={errors.currentPassword} icon={LockKeyhole} label="Current password">
            <input
              type="password"
              value={form.currentPassword}
              onChange={(event) => updateField('currentPassword', event.target.value)}
              placeholder="The password you were given"
            />
          </Field>
          <Field error={errors.newPassword} icon={LockKeyhole} label="New password" help="Minimum 8 characters">
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => updateField('newPassword', event.target.value)}
              placeholder="Choose a new password"
            />
          </Field>
          <Field error={errors.confirmPassword} icon={LockKeyhole} label="Confirm new password">
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => updateField('confirmPassword', event.target.value)}
              placeholder="Repeat the new password"
            />
          </Field>
          <button className="primary-button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Saving…' : 'Change password and continue'}
          </button>
        </form>
      </section>
    </main>
  );
}
