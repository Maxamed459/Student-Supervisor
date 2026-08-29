import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import logo from '../../../assets/logo.jpeg';
import logo2 from '../../../assets/logo 2.jpeg';

export default function OtpVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(59);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value[value.length - 1];
    setOtp(newOtp);
    setError('');

    if (index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (code === '123456') {
        navigate('/admin/verification-success');
      } else {
        setError('Invalid or expired code');
      }
    }, 1000);
  };

  const handleResend = () => {
    setTimer(59);
    setOtp(new Array(6).fill(''));
    setError('');
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
          <h1 className="text-white text-2xl font-medium mb-3">Secure Access</h1>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            To maintain the integrity of our academic systems, we require
            multi-factor authentication. Please verify your identity to
            proceed to the management dashboard.
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-medium mb-1">Verify Your Identity</h2>
          <p className="text-sm text-gray-500 mb-6">
            We've sent a 6-digit code to{' '}
            <span className="font-medium text-gray-700">admin@university.edu</span>
          </p>

          <div className="flex gap-2 mb-2 justify-between">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`w-12 h-12 text-center text-lg rounded-lg border outline-none transition-colors
                  ${error ? 'border-red-500' : 'border-gray-300 focus:border-secondary'}
                  focus:ring-2 focus:ring-secondary/20`}
              />
            ))}
          </div>
          {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

          <Button onClick={handleVerify} loading={loading} className="mt-4">
            Verify & Proceed
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Didn't receive the code?{' '}
            {timer > 0 ? (
              <span className="text-gray-400">Resend in 0:{timer < 10 ? `0${timer}` : timer}</span>
            ) : (
              <button
                onClick={handleResend}
                className="text-secondary hover:underline"
              >
                Resend
              </button>
            )}
          </p>

          <div className="text-center mt-4">
            <Link
              to="/admin/login"
              className="text-sm text-secondary hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}