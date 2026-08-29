import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import logo from '../../../assets/logo.jpeg';
import logo2 from '../../../assets/logo 2.jpeg';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../../store/slices/authSlice';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  
  const dispatch = useDispatch();
const { isLoading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };
const navigate = useNavigate();
  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    return newErrors;
  };
const handleSubmit = (e) => {
  e.preventDefault();
  const newErrors = validate();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  dispatch(loginStart());

  setTimeout(() => {
  if (form.email === 'admin@test.com' && form.password === '123456') {
  dispatch(
    loginSuccess({
      user: { name: 'Test Admin', email: form.email, role: 'admin' },
      token: 'fake-jwt-token',
    })
  );
  navigate('/admin/otp-verification');
} else {
  dispatch(loginFailure('Invalid email or password'));
}
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
          <h2 className="text-xl font-medium mb-1">Admin login</h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to manage your platform.
          </p>

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="admin@university.edu"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <div className="flex items-center justify-between mb-6 -mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" className="w-3.5 h-3.5" />
              Remember me
            </label>
            <a href="/admin/forgot-password" className="text-sm text-secondary hover:underline">
              Forgot password?
            </a>
          </div>
{error && (
  <p className="text-sm text-red-500 mb-4">{error}</p>
)}
      <Button type="submit" loading={isLoading}>
  Log in
</Button>
     
        </form>
      </div>
    </div>
  );
}