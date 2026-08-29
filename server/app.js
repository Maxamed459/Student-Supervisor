require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

// Routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const supervisorRoutes = require("./routes/supervisorRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
const documentRoutes = require("./routes/documentRoutes");
const taskRoutes = require("./routes/taskRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

// =====================================================
// INITIALIZE EXPRESS
// =====================================================

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Enable CORS (allow common Vite ports in local development)
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const allowedOrigins = [
  ...defaultOrigins,
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Parse JSON
app.use(
  express.json()
);

// Parse URL-encoded data
app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Students
app.use(
  "/api/students",
  studentRoutes
);

// Supervisors
app.use(
  "/api/supervisors",
  supervisorRoutes
);

// Assignments
app.use(
  "/api/assignments",
  assignmentRoutes
);

// Departments
app.use(
  "/api/departments",
  departmentRoutes
);

// Groups
app.use(
  "/api/groups",
  groupRoutes
);

// Documents
app.use(
  "/api/documents",
  documentRoutes
);

// Tasks
app.use(
  "/api/tasks",
  taskRoutes
);

// Meetings
app.use(
  "/api/meetings",
  meetingRoutes
);

// Users
app.use(
  "/api/users",
  userRoutes
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Student-Supervisor API is running",
      timestamp: new Date().toISOString(),
    });
  }
);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Welcome to Student-Supervisor Management System API",
    });
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "Global error:",
      err
    );

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (err?.message?.includes("Unsupported file type")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const statusCode =
      res.statusCode !== 200
        ? res.statusCode
        : 500;

    res.status(statusCode).json({
      success: false,
      message:
        err.message ||
        "Internal server error",
    });
  }
);

module.exports = app;
