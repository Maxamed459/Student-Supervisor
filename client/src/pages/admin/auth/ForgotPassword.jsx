import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import logo from '../../../assets/logo.jpeg';
import logo2 from '../../../assets/logo 2.jpeg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col p-12 relative overflow-hidden">
        <img
          src={logo2}
          alt=""
          aria-hidden="true"
          className="absolute -right-40 -bottom-40 w-[750px] h-[750px] object-contain opacity-10 pointer-events-none select-none"
        />
        <div className="relative z-10 flex items-center gap-2">
          <img src={logo} alt="SSMS logo" className="w-9 h-9 object-contain rounded" />
          <span className="text-white font-medium">SSMS</span>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-white text-2xl font-medium mb-3">
            Student-supervisor management system
          </h1>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            Manage groups, supervisors, and project progress from one secure
            dashboard.
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-medium mb-1">Forgot password?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email address and we'll send you instructions to
                reset your password.
              </p>

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="admin@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                error={error}
              />

              <Button type="submit" loading={loading} className="mt-2">
                Send Reset Link
              </Button>

              <div className="text-center mt-4">
                <Link
                  to="/admin/login"
                  className="text-sm text-secondary hover:underline"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="text-xl font-medium mb-1">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                We've sent password reset instructions to{' '}
                <span className="font-medium text-gray-700">{email}</span>
              </p>
              <div className="text-center mt-4">
                <Link
                  to="/admin/login"
                  className="text-sm text-secondary hover:underline"
                >
                  ← Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}