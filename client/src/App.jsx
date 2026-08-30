import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastProvider } from './context/ToastContext';
import { isSupportedRole } from './config/navigation';
import { ProtectedLayout } from './layouts/ProtectedLayout';
import { LoginPage } from './pages/auth/LoginPage';

const queryClient = new QueryClient();

function HomeRedirect() {
  const user = useSelector((state) => state.auth.user);
  return user && isSupportedRole(user.role) ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </QueryClientProvider>
  );
}
