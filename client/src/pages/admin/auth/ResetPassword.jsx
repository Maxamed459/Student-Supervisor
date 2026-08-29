import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import logo from '../../../assets/logo.jpeg';
import logo2 from '../../../assets/logo 2.jpeg';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.password) newErrors.password = 'New password is required';
    else if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate('/admin/login');
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
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-xl font-medium mb-1">Set new password</h2>
          <p className="text-sm text-gray-500 mb-6">
            Please create a strong password for your account.
          </p>

          <Input
            label="New Password"
            name="password"
            type="password"
            placeholder="Enter new password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <Button type="submit" loading={loading} className="mt-2">
            Update Password
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
      </div>
    </div>
  );
}