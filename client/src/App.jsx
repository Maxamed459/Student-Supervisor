import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Public Pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

// Layouts
import AdminLayout from "./layouts/AdminLayout";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import Students from "./pages/Students";
import Supervisors from "./pages/Supervisors";
import Departments from "./pages/Departments";
import Groups from "./pages/Groups";
import AdminCollaboration from "./pages/AdminCollaboration";
import AdminSettings from "./pages/AdminSettings";

// Role Dashboards
import SupervisorDashboard from "./pages/SupervisorDashboard";
import StudentDashboard from "./pages/StudentDashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* =====================================
              PUBLIC ROUTES
          ===================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />

          {/* =====================================
              ADMIN ROUTES
          ===================================== */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              >
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route
              index
              element={<AdminDashboard />}
            />

            {/* Students */}
            <Route
              path="students"
              element={<Students />}
            />

            {/* Supervisors */}
            <Route
              path="supervisors"
              element={<Supervisors />}
            />

            {/* Departments */}
            <Route
              path="departments"
              element={<Departments />}
            />

            {/* Student Groups */}
            <Route
              path="groups"
              element={<Groups />}
            />

            {/* Documents / Tasks / Meetings */}
            <Route
              path="collaboration"
              element={<AdminCollaboration />}
            />

            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* =====================================
              SUPERVISOR ROUTE
          ===================================== */}

          <Route
            path="/supervisor"
            element={
              <ProtectedRoute
                allowedRoles={["supervisor"]}
              >
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          {/* =====================================
              STUDENT ROUTE
          ===================================== */}

          <Route
            path="/student"
            element={
              <ProtectedRoute
                allowedRoles={["student"]}
              >
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* =====================================
              DEFAULT / FALLBACK
          ===================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
