import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import logo from '../../../assets/logo.jpeg';
import logo2 from '../../../assets/logo 2.jpeg';
import { FiCheck } from 'react-icons/fi';

export default function VerificationSuccess() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          navigate('/admin/dashboard');
          return 100;
        }
        return p + 4;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-3xl flex rounded-xl overflow-hidden shadow-sm">
        {/* Left branding panel */}
        <div className="hidden md:flex md:w-1/2 bg-primary flex-col p-10 relative overflow-hidden">
          <img
            src={logo2}
            alt=""
            aria-hidden="true"
            className="absolute -right-32 -bottom-32 w-[500px] h-[500px] object-contain opacity-10 pointer-events-none select-none"
          />
          <div className="relative z-10 flex items-center gap-2">
            <img src={logo} alt="SSMS logo" className="w-8 h-8 object-contain rounded" />
            <span className="text-white font-medium">SSMS</span>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h1 className="text-white text-xl font-medium mb-2">
              Student-supervisor management system
            </h1>
            <p className="text-blue-100/70 text-sm leading-relaxed">
              Manage groups, supervisors, and project progress from one
              secure dashboard.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-10 bg-white text-center">
          <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
            <FiCheck className="text-secondary" size={28} />
          </div>
          <h2 className="text-xl font-medium mb-2">Verification Successful</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your identity has been verified. Redirecting you to the Admin
            Dashboard...
          </p>

          <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <Button onClick={() => navigate('/admin/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}