import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Logo from "../components/Logo";
import { IconEmail, IconLock } from "../components/Icons";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);

      const { token, user } = response.data;

      login({
        token,
        user,
      });

      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;

        case "supervisor":
          navigate("/supervisor");
          break;

        case "student":
          navigate("/student");
          break;

        default:
          setError("Invalid user role");
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-backdrop" aria-hidden="true">
        <div className="login-orb login-orb-a" />
        <div className="login-orb login-orb-b" />
        <div className="login-grid" />
      </div>

      <div className="login-shell">
        <section className="login-hero-panel">
          <Logo light />
          <h1>Academic supervision, organized.</h1>
          <p>
            Manage students, supervisors, departments and
            groups from one secure workspace.
          </p>

          <ul className="login-highlights">
            <li>Role-based access for Admin, Supervisor and Student</li>
            <li>Student groups with assigned supervisors</li>
            <li>Clear department and progress tracking</li>
          </ul>
        </section>

        <section className="login-container">
          <div className="login-card-header">
            <Logo compact />
            <h2>Welcome back</h2>
            <p>Sign in to continue to SSMS</p>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <IconEmail size={16} />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <IconLock size={16} />
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Login;
