import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthRoutes from './pages/admin/auth/AuthRoutes';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/dashboard/Dashboard';
import Students from './pages/admin/students/Students';
import Supervisors from './pages/admin/supervisors/Supervisors';
import Assigned from './pages/admin/assigned/Assigned';
import Monitoring from './pages/admin/monitor/Monitoring';
import Reports from './pages/admin/reports/Reports';
function App() {
  return (
    <BrowserRouter>
      <Routes>
       <Route
  path="/admin/dashboard"
  element={
    <AdminLayout title="Admin Dashboard">
      <Dashboard />
    </AdminLayout>
  }
/>
<Route
  path="/admin/students"
  element={
    <AdminLayout title="Student management">
      <Students />
    </AdminLayout>
  }
/>
<Route
  path="/admin/supervisors"
  element={<AdminLayout title="Supervisors"><Supervisors /></AdminLayout>}
/>
<Route
  path="/admin/assigned"
  element={<AdminLayout title="Assigned"><Assigned /></AdminLayout>}
/>
<Route
  path="/admin/monitoring"
  element={<AdminLayout title="Project Monitoring"><Monitoring /></AdminLayout>}
/>
<Route
  path="/admin/reports"
  element={<AdminLayout title="Reports"><Reports /></AdminLayout>}
/>
        <Route path="/admin/*" element={<AuthRoutes />} />
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;