import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { loginRequest, tokenStore } from '../../services/apiClient';
import { BrandMark, Field } from '../../components/common';
import { ForgotPasswordDialog } from '../../components/dialogs';
import { useToast } from '../../context/useToast';
import { isSupportedRole } from '../../config/navigation';
import { logout, setSession } from '../../store/slices/authSlice';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if (!isSupportedRole(data.user?.role)) {
        tokenStore.clear();
        dispatch(logout());
        toast.error('This account role is not supported.');
        return;
      }
      dispatch(setSession(data));
      toast.success(`Welcome back, ${data.user.fullName}`);
      navigate(`/${data.user.role}/dashboard`, { replace: true });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <main className="auth-screen">
      <section className="brand-panel">
        <BrandMark />
        <div className="brand-copy">
          <h1>Student-supervisor management system</h1>
          <p>Manage groups, supervisors, and project progress from one secure dashboard.</p>
        </div>
      </section>
      <section className="login-panel">
        <form
          className="login-card"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ email, password });
          }}
        >
          <div>
            <h2>Welcome back</h2>
            <p>Sign in with your university supervision account.</p>
          </div>
          <Field icon={Mail} label="Email">
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" />
          </Field>
          <Field icon={LockKeyhole} label="Password">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
            />
            <button
              className="input-action"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>
          <div className="form-row">
            <label className="check-row">
              <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
              Remember me
            </label>
            <button className="text-button" onClick={() => setResetOpen(true)} type="button">Forgot password?</button>
          </div>
          {mutation.error ? <p className="form-error" role="alert">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
          <button className="primary-button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Logging in...' : 'Log in'}
          </button>
          <div className="login-rule" />
        </form>
      </section>
      <ForgotPasswordDialog open={resetOpen} onClose={() => setResetOpen(false)} />
    </main>
  );
}
