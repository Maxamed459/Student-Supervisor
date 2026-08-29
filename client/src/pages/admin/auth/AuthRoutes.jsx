import { Routes, Route } from 'react-router-dom';
import Login from './login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import OtpVerification from './OtpVerification';
import VerificationSuccess from './VerificationSuccess';

export default function AuthRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="otp-verification" element={<OtpVerification />} />
      <Route path="verification-success" element={<VerificationSuccess />} />
    </Routes>
  );
}