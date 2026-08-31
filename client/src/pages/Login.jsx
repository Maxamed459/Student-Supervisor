import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const REMEMBER_KEY = "ssms_remember_email";

function GraduationCapIcon() {
  return (
    <svg
      className="login-brand-mark"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 14.2 16 10l8 4.2-8 4.2-8-4.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11 16.8v3.2c0 .2 2.2 1.8 5 1.8s5-1.6 5-1.8v-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 14.5v5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9z"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.3 2.6 2 3.9l3.1 3.1C3.2 8.4 1.7 10.4 1.7 12S5 19 12 19c2.1 0 3.9-.5 5.4-1.2l2.7 2.7 1.3-1.3L3.3 2.6zM12 17c-5.4 0-8-5-8-5 .5-.9 1.5-2.3 3-3.4l1.8 1.8A4 4 0 0 0 12 16c.5 0 1-.1 1.5-.3l1.5 1.5c-.9.5-2 .8-3 .8zm8.3-2.6-1.5-1.5c.6-.7 1-1.4 1.2-1.9 0 0-2.6-5-8-5-.7 0-1.4.1-2 .2L8.4 4.6C9.5 4.2 10.7 4 12 4c7 0 10.3 7 10.3 7-.5 1.1-1.5 2.5-2 3.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setFormData((prev) => ({ ...prev, email: saved }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("");
    setInfo("Contact your system administrator to reset your password.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      const { token, user } = response.data;

      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, formData.email.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      login({ token, user });

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
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="About SSMS">
        <div className="login-brand-top">
          <GraduationCapIcon />
          <span>SSMS</span>
        </div>

        <div className="login-brand-copy">
          <h1>Student-supervisor management system</h1>
          <p>
            Manage groups, supervisors, and project progress from one secure
            dashboard.
          </p>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <header className="login-form-header">
            <h2>Admin login</h2>
            <p>Sign in to manage your platform.</p>
          </header>

          {error && <div className="error-message">{error}</div>}
          {info && <div className="login-info-message">{info}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@university.edu"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="login-password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div className="login-form-meta">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="login-forgot"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="login-form-divider" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}

export default Login;
