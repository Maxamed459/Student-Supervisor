import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconDashboard,
  IconLogout,
  IconSettings,
  IconStudents,
  IconUser,
} from "../components/Icons";
import Logo from "../components/Logo";
import documentsService from "../services/documentsService";
import tasksService from "../services/tasksService";
import meetingsService from "../services/meetingsService";
import api from "../services/api";
import { THESIS_GUIDELINES } from "../data/thesisGuidelines";
import {
  documentStatusLabel,
  documentTypeLabel,
  downloadDocumentFile,
  formatDate,
  getDocumentPreviewKind,
  viewDocumentFile,
  meetingStatusLabel,
  statusBadgeClass,
  taskAssignmentTypeLabel,
  getTaskAssignmentType,
  taskStatusLabel,
} from "../utils/collaboration";

const AVATAR_COLORS = [
  "#0B1B33",
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#DB2777",
];

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function avatarColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function IconBell({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22zm6.4-6.2V11a6.4 6.4 0 0 0-5.1-6.3V4a1.3 1.3 0 1 0-2.6 0v.7A6.4 6.4 0 0 0 5.6 11v4.8L4 17.4v.8h16v-.8l-1.6-1.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconDoc({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCheck({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCloudUpload({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInfo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconSend({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
    </svg>
  );
}

function IconBook({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCalendar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconTasks({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14-4-4 1.4-1.4L10 14.2l5.6-5.6L17 10l-7 7z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconClip({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 6.5v10.2a4.5 4.5 0 1 1-9 0V6.4a3 3 0 1 1 6 0v9.6a1.5 1.5 0 1 1-3 0V7.75h-1.5v8.25a3 3 0 1 0 6 0V6.4a4.5 4.5 0 1 0-9 0v10.3a6 6 0 1 0 12 0V6.5h-1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconSearch({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPin({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconClock({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11H7v-2h4V7h2v6z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconMail({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPhone({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
        fill="currentColor"
      />
    </svg>
  );
}

function fileKindLabel(doc) {
  const kind = getDocumentPreviewKind(doc);
  if (kind === "pdf") return "PDF Document";
  if (kind === "docx" || kind === "doc") return "Word Document";
  if (kind === "image") return "Image File";
  if (kind === "text") return "Text File";
  return documentTypeLabel[doc?.type] || "Document";
}

function submissionVersion(doc) {
  if (!doc?.createdAt || !doc?.updatedAt) return 1;
  return new Date(doc.updatedAt) - new Date(doc.createdAt) > 60 * 1000 ? 2 : 1;
}

function ProgressRing({ value = 0, size = 72 }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ef-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2563EB"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="ef-ring-text"
      >
        {value}%
      </text>
    </svg>
  );
}
function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [student, setStudent] = useState(null);
  const [group, setGroup] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [showSubmitPage, setShowSubmitPage] = useState(false);
  const [resubmitDoc, setResubmitDoc] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "thesis",
    version: "",
    description: "",
    file: null,
  });

  const [viewDoc, setViewDoc] = useState(null);
  const [viewGuideline, setViewGuideline] = useState(null);
  const [guidelineQuery, setGuidelineQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskUpdate, setTaskUpdate] = useState({
    status: "pending",
    submissionNote: "",
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileRes, groupRes, docsRes, tasksRes, meetingsRes] =
        await Promise.all([
          api.get("/students/me"),
          api.get("/groups/me"),
          documentsService.list(),
          tasksService.list(),
          meetingsService.list(),
        ]);

      setStudent(profileRes.data.student || profileRes.data.data);
      setGroup(groupRes.data.group || groupRes.data.data);
      setDocuments(docsRes.data.documents || []);
      setTasks(tasksRes.data.tasks || []);
      setMeetings(meetingsRes.data.meetings || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to load student dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const reviewerFromDocs = useMemo(() => {
    const withReviewer = [...documents].find(
      (doc) => doc.reviewedBy?.user?.name
    );
    return withReviewer?.reviewedBy || null;
  }, [documents]);

  const isAssigned = Boolean(
    student?.supervisor || group?.supervisor || reviewerFromDocs
  );
  const upcomingMeetings = meetings.filter(
    (meeting) =>
      meeting.status === "scheduled" &&
      new Date(meeting.date) >= new Date(new Date().toDateString())
  );
  const openTasks = tasks.filter(
    (task) => task.status !== "completed"
  );

  const pendingDocs = documents.filter(
    (doc) => doc.status === "pending_review"
  );
  const approvedDocs = documents.filter(
    (doc) => doc.status === "approved"
  );
  const changesDocs = documents.filter(
    (doc) => doc.status === "changes_requested"
  );

  const openFile = async (doc) => {
    try {
      const result = await viewDocumentFile(documentsService, doc);
      if (!result.opened) {
        setMessage({
          type: "error",
          text:
            result.message ||
            "This file cannot be previewed. Use Download File instead.",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to open file for viewing",
      });
    }
  };

  const downloadFile = async (doc) => {
    try {
      await downloadDocumentFile(
        documentsService,
        doc._id,
        doc.originalName || doc.fileName,
        doc.fileUrl
      );
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to download file",
      });
    }
  };

  const openResubmit = (doc) => {
    setResubmitDoc(doc);
    setShowSubmitPage(false);
    setUploadForm({
      title: doc.title,
      type: doc.type,
      version: "",
      description: "",
      file: null,
    });
    setMessage({ type: "", text: "" });
  };
  const feedbackDocs = useMemo(
    () =>
      [...documents]
        .filter((doc) => doc.feedback?.trim())
        .sort(
          (a, b) =>
            new Date(b.reviewedAt || b.updatedAt || b.createdAt) -
            new Date(a.reviewedAt || a.updatedAt || a.createdAt)
        ),
    [documents]
  );

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const totalMilestones = documents.length + tasks.length;
  const completedMilestones =
    approvedDocs.length + completedTasks.length;
  const progressPct =
    totalMilestones === 0
      ? 0
      : Math.round((completedMilestones / totalMilestones) * 100);

  const currentMilestone =
    documents.find((d) => d.status === "changes_requested") ||
    documents.find((d) => d.status === "pending_review") ||
    documents.find((d) => d.status === "rejected") ||
    openTasks[0] ||
    documents[0] ||
    null;

  const supervisorProfile =
    student?.supervisor ||
    group?.supervisor ||
    reviewerFromDocs ||
    null;
  const supervisorName =
    supervisorProfile?.user?.name || "N/A";
  const supervisorEmail =
    supervisorProfile?.user?.email || "N/A";
  const supervisorDept =
    supervisorProfile?.department?.name ||
    student?.department?.name ||
    "Department office";
  const supervisorPhone =
    supervisorProfile?.phone?.trim() || "Not provided";
  const supervisorSpec =
    supervisorProfile?.specialization?.trim() || "";
  const researchAreas = supervisorSpec
    ? supervisorSpec
        .split(/[,;/|]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : supervisorProfile?.department?.name
      ? [supervisorProfile.department.name]
      : ["General supervision"];
  const academicBackground = [
    supervisorDept ? `Department of ${supervisorDept}` : null,
    supervisorSpec
      ? `Specialization: ${supervisorSpec}`
      : "Academic research and thesis supervision",
    supervisorProfile?.employeeId
      ? `Employee ID: ${supervisorProfile.employeeId}`
      : "Assigned thesis supervisor",
  ].filter(Boolean);
  const levelLabel = student?.level
    ? `Level ${student.level} Student`
    : "Student";

  const topbarCopy = {
    overview: {
      title: "Student Portal",
      subtitle: "Track your academic progress and feedback",
    },
    supervisor: {
      title: "Student Portal",
      subtitle:
        "View your assigned supervisor's profile and contact information.",
    },
    tasks: {
      title: "Student Portal",
      subtitle: "Track your academic progress and feedback",
    },
    meetings: {
      title: "Student Portal",
      subtitle: "Track your academic progress and feedback",
    },
    profile: {
      title: "Student Portal",
      subtitle: "View and manage your academic profile details.",
    },
  };
  const currentTopbar = topbarCopy[tab] || topbarCopy.overview;
  const profileName = student?.user?.name || user?.name || "Student";
  const profileEmail = student?.user?.email || user?.email || "N/A";
  const profilePhone = student?.phone?.trim() || "Not provided";

  const guidelineStatusFor = (guideline) => {
    const matched = documents.find((doc) =>
      guideline.match.some((re) => re.test(doc.title || ""))
    );
    if (!matched) {
      return { key: "upcoming", label: "Upcoming" };
    }
    if (matched.status === "approved") {
      return { key: "completed", label: "Completed" };
    }
    if (
      matched.status === "changes_requested" ||
      matched.status === "rejected"
    ) {
      return { key: "changes", label: "Changes Requested" };
    }
    if (matched.status === "pending_review") {
      return { key: "pending", label: "Pending Review" };
    }
    return { key: "upcoming", label: "Upcoming" };
  };

  const filteredGuidelines = useMemo(() => {
    const q = guidelineQuery.trim().toLowerCase();
    if (!q) return THESIS_GUIDELINES;
    return THESIS_GUIDELINES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.requirements.toLowerCase().includes(q)
    );
  }, [guidelineQuery]);

  const emptyUploadForm = () => ({
    title: group?.projectTitle || "",
    type: "thesis",
    version: documents.length ? `v${documents.length + 1}` : "v1.0",
    description: "",
    file: null,
  });

  const openUpload = () => {
    setUploadForm(emptyUploadForm());
    setShowSubmitPage(true);
    setResubmitDoc(null);
    setDragOver(false);
    setMessage({ type: "", text: "" });
    setTab("documents");
  };

  const closeSubmitPage = () => {
    setShowSubmitPage(false);
    setDragOver(false);
    setUploadForm(emptyUploadForm());
  };

  const acceptSubmitFile = (file) => {
    if (!file) return;
    const name = (file.name || "").toLowerCase();
    const ok =
      name.endsWith(".pdf") ||
      name.endsWith(".docx") ||
      name.endsWith(".doc") ||
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword";
    if (!ok) {
      setMessage({
        type: "error",
        text: "Accepted formats: PDF and DOCX only",
      });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "File exceeds the 15MB size limit",
      });
      return;
    }
    setMessage({ type: "", text: "" });
    setUploadForm((prev) => ({ ...prev, file }));
  };

  const statusPillClass = (status) => {
    if (status === "approved" || status === "completed") return "success";
    if (status === "changes_requested" || status === "rejected") {
      return "danger";
    }
    if (status === "pending_review" || status === "pending") {
      return "warn";
    }
    return "muted";
  };

  const shortStatus = (status) => {
    if (status === "changes_requested") return "Changes";
    if (status === "pending_review") return "Pending";
    return documentStatusLabel[status] || status;
  };

  const submitUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.title.trim()) {
      setMessage({
        type: "error",
        text: "Project title is required",
      });
      return;
    }

    if (!uploadForm.description.trim()) {
      setMessage({
        type: "error",
        text: "Submission description is required",
      });
      return;
    }

    if (!uploadForm.file) {
      setMessage({
        type: "error",
        text: "Please choose a file to upload",
      });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      const version = uploadForm.version.trim();
      const title = version
        ? `${uploadForm.title.trim()} (${version})`
        : uploadForm.title.trim();
      formData.append("title", title);
      formData.append("type", uploadForm.type);
      formData.append("file", uploadForm.file);

      await documentsService.upload(formData);

      setShowSubmitPage(false);
      setResubmitDoc(null);
      setUploadForm(emptyUploadForm());
      setMessage({
        type: "success",
        text: "Document uploaded successfully",
      });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to upload document",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitResubmit = async (e) => {
    e.preventDefault();

    if (!resubmitDoc || !uploadForm.file) {
      setMessage({
        type: "error",
        text: "Please choose a file to resubmit",
      });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", uploadForm.title.trim());
      formData.append("type", uploadForm.type);
      formData.append("file", uploadForm.file);

      await documentsService.resubmit(resubmitDoc._id, formData);

      setResubmitDoc(null);
      setShowSubmitPage(false);
      setUploadForm(emptyUploadForm());
      setMessage({
        type: "success",
        text: "Document resubmitted for review",
      });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to resubmit document",
      });
    } finally {
      setSaving(false);
    }
  };

  const openTask = (task) => {
    setSelectedTask(task);
    setTaskUpdate({
      status: task.status,
      submissionNote: task.submissionNote || "",
    });
  };

  const saveTaskUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setSaving(true);
      await tasksService.update(selectedTask._id, taskUpdate);
      setSelectedTask(null);
      setMessage({
        type: "success",
        text: "Task updated successfully",
      });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update task",
      });
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: IconDashboard },
    { id: "supervisor", label: "My Supervisor", icon: IconUser },
    { id: "guidelines", label: "Guidelines", icon: IconBook },
    { id: "documents", label: "My Submissions", icon: IconDoc },
    { id: "tasks", label: "My Tasks", icon: IconTasks },
    { id: "meetings", label: "Meetings", icon: IconCalendar },
    { id: "profile", label: "Profile", icon: IconStudents },
    { id: "settings", label: "Settings", icon: IconSettings },
  ];

  return (
    <div className="ef-layout">
      <aside className="ef-sidebar">
        <div className="ef-brand">
          <Logo light />
        </div>

        <nav className="ef-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={
                  tab === item.id ? "ef-nav-link active" : "ef-nav-link"
                }
                onClick={() => {
                  setShowSubmitPage(false);
                  setTab(item.id);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ef-sidebar-bottom">
          <button
            type="button"
            className="ef-nav-link ef-logout"
            onClick={handleLogout}
          >
            <IconLogout size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="ef-main">
        <header
          className={`ef-topbar ${
            tab === "documents" || tab === "guidelines"
              ? "ef-topbar-compact"
              : ""
          }`}
        >
          {tab !== "documents" && tab !== "guidelines" && (
            <div>
              <h1>{currentTopbar.title}</h1>
              <p>{currentTopbar.subtitle}</p>
            </div>
          )}
          <div className="ef-topbar-right">
            <button
              type="button"
              className="ef-bell"
              aria-label="Notifications"
              onClick={() => navigate("/student/notifications")}
            >
              <IconBell size={18} />
              {pendingDocs.length > 0 && <span className="ef-bell-dot" />}
            </button>
            <div className="ef-user-chip">
              <div className="ef-user-text">
                <strong>{user?.name || "Student"}</strong>
                <span>{levelLabel}</span>
              </div>
              <div
                className="ef-avatar"
                style={{ background: avatarColor(user?.name || "S") }}
                aria-hidden="true"
              >
                {initials(user?.name || "S")}
              </div>
            </div>
          </div>
        </header>

        <section className="ef-content">
          {error && <div className="alert alert-error">{error}</div>}
          {message.text && (
            <div
              className={`alert ${
                message.type === "success"
                  ? "alert-success"
                  : "alert-error"
              }`}
            >
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading dashboard...</div>
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="ef-stats">
                    <div className="ef-stat ef-stat-progress">
                      <ProgressRing value={progressPct} />
                      <div className="ef-stat-body">
                        <span className="ef-stat-label">
                          Overall Progress
                        </span>
                        <strong>Milestones achieved</strong>
                        <small>
                          {completedMilestones} of {totalMilestones}{" "}
                          completed
                        </small>
                      </div>
                    </div>

                    <div className="ef-stat">
                      <div className="ef-stat-head">
                        <span className="ef-stat-label">
                          Current Milestone
                        </span>
                        {currentMilestone?.status && (
                          <span
                            className={`ef-pill ${statusPillClass(
                              currentMilestone.status
                            )}`}
                          >
                            {documentStatusLabel[
                              currentMilestone.status
                            ] ||
                              taskStatusLabel[
                                currentMilestone.status
                              ] ||
                              currentMilestone.status}
                          </span>
                        )}
                      </div>
                      {currentMilestone ? (
                        <div className="ef-stat-body">
                          <strong className="ef-stat-title">
                            {currentMilestone.title}
                          </strong>
                          <small>
                            {currentMilestone.dueDate
                              ? `Due: ${formatDate(currentMilestone.dueDate)}`
                              : `Updated: ${formatDate(
                                  currentMilestone.updatedAt ||
                                    currentMilestone.createdAt
                                )}`}
                          </small>
                          <button
                            type="button"
                            className="ef-text-link"
                            onClick={() =>
                              currentMilestone.dueDate
                                ? setTab("tasks")
                                : setTab("documents")
                            }
                          >
                            View Details →
                          </button>
                        </div>
                      ) : (
                        <p className="ef-empty-inline">
                          No active milestone yet. Upload your first
                          document.
                        </p>
                      )}
                    </div>

                    <div className="ef-stat">
                      <span className="ef-stat-label">
                        Pending Review
                      </span>
                      <div className="ef-stat-body">
                        <div className="ef-stat-number">
                          <strong>{pendingDocs.length}</strong>
                          <span>submissions</span>
                        </div>
                        <small>Waiting for supervisor review</small>
                      </div>
                    </div>

                    <div className="ef-stat">
                      <span className="ef-stat-label">Approved</span>
                      <div className="ef-stat-body">
                        <div className="ef-stat-number">
                          <strong>{approvedDocs.length}</strong>
                          <span>milestones</span>
                        </div>
                        <small className="ef-success-line">
                          <IconCheck size={14} /> Completed successfully
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="ef-grid">
                    <div className="ef-card ef-feedback-card">
                      <div className="ef-card-head">
                        <div>
                          <h3>Recent Feedback</h3>
                          <p>Latest comments from your supervisor</p>
                        </div>
                        <button
                          type="button"
                          className="ef-text-link"
                          onClick={() => setTab("documents")}
                        >
                          View All
                        </button>
                      </div>

                      {feedbackDocs.length === 0 ? (
                        <div className="ef-empty">
                          <p>No supervisor feedback yet.</p>
                        </div>
                      ) : (
                        <ul className="ef-feedback-list">
                          {feedbackDocs.slice(0, 4).map((doc) => {
                            const reviewer =
                              doc.reviewedBy?.user?.name ||
                              supervisorName;
                            return (
                              <li key={doc._id}>
                                <div className="ef-feedback-top">
                                  <div className="ef-person">
                                    <span
                                      className="ef-avatar sm"
                                      style={{
                                        background:
                                          avatarColor(reviewer),
                                      }}
                                    >
                                      {initials(reviewer)}
                                    </span>
                                    <div>
                                      <strong>{reviewer}</strong>
                                      <small>{doc.title}</small>
                                    </div>
                                  </div>
                                  <span
                                    className={`ef-pill ${statusPillClass(
                                      doc.status
                                    )}`}
                                  >
                                    {documentStatusLabel[doc.status]}
                                  </span>
                                </div>
                                <blockquote>“{doc.feedback}”</blockquote>
                                <small className="ef-feedback-date">
                                  {formatDate(
                                    doc.reviewedAt || doc.updatedAt
                                  )}
                                </small>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="ef-side">
                      <div className="ef-card">
                        <div className="ef-card-head">
                          <h3>My Submissions</h3>
                          <button
                            type="button"
                            className="ef-text-link"
                            onClick={() => setTab("documents")}
                          >
                            View All
                          </button>
                        </div>
                        {documents.length === 0 ? (
                          <div className="ef-empty">
                            <p>No submissions yet.</p>
                          </div>
                        ) : (
                          <ul className="ef-submission-list">
                            {documents.slice(0, 4).map((doc) => (
                              <li key={doc._id}>
                                <div>
                                  <strong>{doc.title}</strong>
                                  <small>
                                    Submitted{" "}
                                    {formatDate(doc.createdAt)}
                                  </small>
                                </div>
                                <span
                                  className={`ef-pill ${statusPillClass(
                                    doc.status
                                  )}`}
                                >
                                  {shortStatus(doc.status)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="ef-card">
                        <h3>Quick Actions</h3>
                        <div className="ef-actions">
                          <button
                            type="button"
                            className="ef-action"
                            onClick={() => setTab("supervisor")}
                          >
                            <IconUser size={16} />
                            View Supervisor
                          </button>
                          <button
                            type="button"
                            className="ef-action"
                            onClick={() => setTab("guidelines")}
                          >
                            <IconBook size={16} />
                            View Guidelines
                          </button>
                          <button
                            type="button"
                            className="ef-action primary"
                            onClick={openUpload}
                          >
                            <IconDoc size={16} />
                            Submit Work
                          </button>
                          <button
                            type="button"
                            className="ef-action"
                            onClick={() => setTab("tasks")}
                          >
                            <IconTasks size={16} />
                            View Progress
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === "supervisor" && (
                <div className="ef-supv">
                  <div className="ef-guide-page-head">
                    <h2>My Supervisor</h2>
                    <p>
                      View your assigned supervisor&apos;s profile and
                      contact information.
                    </p>
                  </div>

                  {!isAssigned ? (
                    <div className="ef-card">
                      <div className="ef-empty">
                        <p>
                          You have not been assigned a supervisor yet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="ef-supv-card">
                      <div className="ef-supv-hero">
                        <div
                          className="ef-supv-avatar"
                          style={{
                            background: avatarColor(supervisorName),
                          }}
                          aria-hidden="true"
                        >
                          {initials(supervisorName)}
                        </div>
                        <div className="ef-supv-hero-info">
                          <span className="ef-supv-badge">
                            Assigned Supervisor
                          </span>
                          <h3>{supervisorName}</h3>
                          <p>
                            Thesis Supervisor
                            {supervisorDept
                              ? ` · ${supervisorDept}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="ef-supv-info-row">
                        <div className="ef-supv-info-box">
                          <span className="ef-supv-info-icon pin">
                            <IconPin size={16} />
                          </span>
                          <div>
                            <span>Office Location</span>
                            <strong>{supervisorDept}</strong>
                            <small>
                              {group?.name
                                ? `Group: ${group.name}`
                                : "Department office"}
                            </small>
                          </div>
                        </div>
                        <div className="ef-supv-info-box">
                          <span className="ef-supv-info-icon clock">
                            <IconClock size={16} />
                          </span>
                          <div>
                            <span>Consultation Hours</span>
                            <strong>By appointment</strong>
                            <small>
                              Schedule via Meetings or email
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="ef-supv-split">
                        <div>
                          <h4>Academic Background</h4>
                          <ul className="ef-supv-bullets">
                            {academicBackground.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4>Research Areas</h4>
                          <div className="ef-supv-tags">
                            {researchAreas.map((tag) => (
                              <span key={tag} className="ef-supv-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="ef-supv-contact">
                        <h4>Quick Contact</h4>
                        <div className="ef-supv-contact-row">
                          {supervisorEmail !== "N/A" ? (
                            <a
                              className="ef-supv-contact-chip"
                              href={`mailto:${supervisorEmail}`}
                            >
                              <span className="ef-supv-contact-icon mail">
                                <IconMail size={15} />
                              </span>
                              {supervisorEmail}
                            </a>
                          ) : (
                            <span className="ef-supv-contact-chip muted">
                              <span className="ef-supv-contact-icon mail">
                                <IconMail size={15} />
                              </span>
                              Email not available
                            </span>
                          )}
                          {supervisorPhone !== "Not provided" ? (
                            <a
                              className="ef-supv-contact-chip"
                              href={`tel:${supervisorPhone}`}
                            >
                              <span className="ef-supv-contact-icon phone">
                                <IconPhone size={15} />
                              </span>
                              {supervisorPhone}
                            </a>
                          ) : (
                            <span className="ef-supv-contact-chip muted">
                              <span className="ef-supv-contact-icon phone">
                                <IconPhone size={15} />
                              </span>
                              Phone not provided
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "guidelines" && (
                <div className="ef-guide">
                  <div className="ef-guide-page-head">
                    <h2>Guidelines</h2>
                    <p>
                      Review the instructions and requirements published
                      by your supervisor.
                    </p>
                  </div>

                  <div className="ef-guide-panel">
                    <div className="ef-guide-panel-head">
                      <div>
                        <h3>Thesis Guidelines</h3>
                        <p>
                          Follow each milestone carefully before
                          submitting your work.
                        </p>
                      </div>
                      <label className="ef-guide-search">
                        <IconSearch size={16} />
                        <input
                          type="search"
                          value={guidelineQuery}
                          onChange={(e) =>
                            setGuidelineQuery(e.target.value)
                          }
                          placeholder="Search guidelines..."
                          aria-label="Search guidelines"
                        />
                      </label>
                    </div>

                    {filteredGuidelines.length === 0 ? (
                      <div className="ef-empty">
                        <p>No guidelines match your search.</p>
                      </div>
                    ) : (
                      <div className="ef-guide-list">
                        {filteredGuidelines.map((guide) => {
                          const status = guidelineStatusFor(guide);
                          const isAction =
                            status.key === "changes" ||
                            status.key === "pending";
                          return (
                            <article
                              key={guide.id}
                              className="ef-guide-card"
                            >
                              <div className="ef-guide-card-main">
                                <span className="ef-guide-num">
                                  {guide.number}
                                </span>
                                <div className="ef-guide-card-body">
                                  <div className="ef-guide-card-top">
                                    <div className="ef-guide-card-title">
                                      <h4>{guide.title}</h4>
                                      <span
                                        className={`ef-pill ${
                                          status.key === "completed"
                                            ? "success"
                                            : status.key === "changes"
                                              ? "danger"
                                              : status.key === "pending"
                                                ? "warn"
                                                : "muted"
                                        }`}
                                      >
                                        {status.label}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className={
                                        isAction
                                          ? "ef-btn-primary"
                                          : "ef-btn-outline"
                                      }
                                      onClick={() =>
                                        setViewGuideline({
                                          ...guide,
                                          status,
                                        })
                                      }
                                    >
                                      View Guidelines →
                                    </button>
                                  </div>
                                  <p className="ef-guide-desc">
                                    {guide.description}
                                  </p>
                                  <div className="ef-guide-meta">
                                    <div>
                                      <span>Requirements</span>
                                      <strong>
                                        {guide.requirements}
                                      </strong>
                                    </div>
                                    {status.key === "upcoming" ? (
                                      <>
                                        <div>
                                          <span>Status</span>
                                          <strong>Not Started</strong>
                                        </div>
                                        <div>
                                          <span>Due Date</span>
                                          <strong>
                                            {guide.dueLabel}
                                          </strong>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div>
                                          <span>Word Count</span>
                                          <strong>
                                            {guide.wordCount}
                                          </strong>
                                        </div>
                                        <div>
                                          <span>Supervisor</span>
                                          <strong>
                                            {supervisorName}
                                          </strong>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "profile" && (
                <div className="ef-profile">
                  <div className="ef-guide-page-head">
                    <h2>My Profile</h2>
                    <p>
                      View your account details, academic information,
                      and group assignment.
                    </p>
                  </div>

                  <div className="ef-profile-card">
                    <div className="ef-profile-hero">
                      <div
                        className="ef-profile-avatar"
                        style={{
                          background: avatarColor(profileName),
                        }}
                        aria-hidden="true"
                      >
                        {initials(profileName)}
                      </div>
                      <div className="ef-profile-hero-info">
                        <span className="ef-supv-badge">
                          Student Profile
                        </span>
                        <h3>{profileName}</h3>
                        <p>
                          {levelLabel}
                          {student?.department?.name
                            ? ` · ${student.department.name}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="ef-profile-section">
                      <div className="ef-profile-section-head">
                        <h4>Account details</h4>
                      </div>
                      <div className="ef-profile-rows">
                        <div className="ef-profile-row">
                          <div
                            className="ef-profile-row-avatar"
                            style={{
                              background: avatarColor(profileName),
                            }}
                          >
                            {initials(profileName).charAt(0)}
                          </div>
                          <div className="ef-profile-row-meta">
                            <strong>{profileName}</strong>
                            <small>
                              {student?.studentId || "No student ID"}
                              {profileEmail !== "N/A"
                                ? ` · ${profileEmail}`
                                : ""}
                            </small>
                          </div>
                          <span className="ef-pill muted">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="ef-profile-section">
                      <div className="ef-profile-section-head">
                        <h4>Academic information</h4>
                        <span className="section-count">6</span>
                      </div>
                      <div className="ef-profile-grid">
                        <div className="ef-profile-field">
                          <span>Student ID</span>
                          <strong>
                            {student?.studentId || "N/A"}
                          </strong>
                        </div>
                        <div className="ef-profile-field">
                          <span>Department</span>
                          <strong>
                            {student?.department?.name || "N/A"}
                            {student?.department?.code
                              ? ` (${student.department.code})`
                              : ""}
                          </strong>
                        </div>
                        <div className="ef-profile-field">
                          <span>Academic Year</span>
                          <strong>
                            {student?.academicYear || "N/A"}
                          </strong>
                        </div>
                        <div className="ef-profile-field">
                          <span>Level</span>
                          <strong>{student?.level || "N/A"}</strong>
                        </div>
                        <div className="ef-profile-field">
                          <span>Phone</span>
                          <strong>{profilePhone}</strong>
                        </div>
                        <div className="ef-profile-field">
                          <span>Email</span>
                          <strong>{profileEmail}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="ef-profile-section">
                      <div className="ef-profile-section-head">
                        <h4>Group & supervisor</h4>
                        <span className="section-count">
                          {group ? 1 : 0}
                        </span>
                      </div>
                      <div className="ef-profile-rows">
                        <div className="ef-profile-row">
                          <div className="ef-profile-row-icon group">
                            <IconStudents size={16} />
                          </div>
                          <div className="ef-profile-row-meta">
                            <strong>
                              {group?.name || "No group assigned"}
                            </strong>
                            <small>
                              {group
                                ? `${group.code || "—"}${
                                    group.projectTitle
                                      ? ` · ${group.projectTitle}`
                                      : ""
                                  }`
                                : "You are not in an active group yet"}
                            </small>
                          </div>
                          <span
                            className={`ef-pill ${
                              group?.status === "active"
                                ? "success"
                                : "muted"
                            }`}
                          >
                            {group?.status
                              ? group.status.charAt(0).toUpperCase() +
                                group.status.slice(1)
                              : "Unassigned"}
                          </span>
                        </div>

                        <div className="ef-profile-row">
                          <div
                            className="ef-profile-row-avatar"
                            style={{
                              background: avatarColor(supervisorName),
                            }}
                          >
                            {initials(supervisorName).charAt(0)}
                          </div>
                          <div className="ef-profile-row-meta">
                            <strong>
                              {isAssigned
                                ? supervisorName
                                : "No supervisor assigned"}
                            </strong>
                            <small>
                              {isAssigned
                                ? `${supervisorEmail}${
                                    supervisorDept
                                      ? ` · ${supervisorDept}`
                                      : ""
                                  }`
                                : "Waiting for supervisor assignment"}
                            </small>
                          </div>
                          <button
                            type="button"
                            className="ef-btn-outline"
                            onClick={() => setTab("supervisor")}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="ef-profile-contact">
                      <h4>Quick contact</h4>
                      <div className="ef-supv-contact-row">
                        {profileEmail !== "N/A" ? (
                          <a
                            className="ef-supv-contact-chip"
                            href={`mailto:${profileEmail}`}
                          >
                            <span className="ef-supv-contact-icon mail">
                              <IconMail size={15} />
                            </span>
                            {profileEmail}
                          </a>
                        ) : (
                          <span className="ef-supv-contact-chip muted">
                            <span className="ef-supv-contact-icon mail">
                              <IconMail size={15} />
                            </span>
                            Email not available
                          </span>
                        )}
                        {profilePhone !== "Not provided" ? (
                          <a
                            className="ef-supv-contact-chip"
                            href={`tel:${profilePhone}`}
                          >
                            <span className="ef-supv-contact-icon phone">
                              <IconPhone size={15} />
                            </span>
                            {profilePhone}
                          </a>
                        ) : (
                          <span className="ef-supv-contact-chip muted">
                            <span className="ef-supv-contact-icon phone">
                              <IconPhone size={15} />
                            </span>
                            Phone not provided
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "documents" && showSubmitPage && (
                <form className="ef-submit-page" onSubmit={submitUpload}>
                  <div className="ef-submit-page-head">
                    <h2>Submit Project Work</h2>
                    <p>
                      Upload your latest deliverables and update your
                      project status.
                    </p>
                  </div>

                  <div className="ef-submit-layout">
                    <div className="ef-submit-main">
                      <section className="ef-submit-card">
                        <h3>Submission Details</h3>

                        <div className="ef-submit-field">
                          <label htmlFor="submit-title">
                            Project Title
                          </label>
                          <input
                            id="submit-title"
                            className="ef-submit-input muted"
                            required
                            value={uploadForm.title}
                            onChange={(e) =>
                              setUploadForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Enter your project title"
                          />
                        </div>

                        <div className="ef-submit-row">
                          <div className="ef-submit-field">
                            <label htmlFor="submit-version">
                              Version Number{" "}
                              <span className="req">*</span>
                            </label>
                            <input
                              id="submit-version"
                              className="ef-submit-input"
                              required
                              value={uploadForm.version}
                              onChange={(e) =>
                                setUploadForm((prev) => ({
                                  ...prev,
                                  version: e.target.value,
                                }))
                              }
                              placeholder="e.g., v1.2"
                            />
                          </div>
                          <div className="ef-submit-field">
                            <label htmlFor="submit-type">
                              Submission Type{" "}
                              <span className="req">*</span>
                            </label>
                            <select
                              id="submit-type"
                              className="ef-submit-input"
                              required
                              value={uploadForm.type}
                              onChange={(e) =>
                                setUploadForm((prev) => ({
                                  ...prev,
                                  type: e.target.value,
                                }))
                              }
                            >
                              <option value="thesis">Thesis</option>
                              <option value="project_book">
                                Project Book
                              </option>
                              <option value="proposal">Proposal</option>
                              <option value="report">Report</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="ef-submit-field">
                          <label htmlFor="submit-desc">
                            Submission Description{" "}
                            <span className="req">*</span>
                          </label>
                          <textarea
                            id="submit-desc"
                            className="ef-submit-input"
                            rows={4}
                            required
                            value={uploadForm.description}
                            onChange={(e) =>
                              setUploadForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Briefly describe the contents of this submission and any changes from previous versions..."
                          />
                        </div>
                      </section>

                      <section className="ef-submit-card">
                        <h3>File Upload</h3>

                        <div
                          className={`ef-dropzone${
                            dragOver ? " drag-over" : ""
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                          }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            acceptSubmitFile(e.dataTransfer.files?.[0]);
                          }}
                        >
                          <span className="ef-dropzone-icon">
                            <IconCloudUpload size={40} />
                          </span>
                          <p>
                            Drag and drop your project files here or
                            click to browse from your computer
                          </p>
                          <label className="ef-browse-btn">
                            Browse Files
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              hidden
                              onChange={(e) => {
                                acceptSubmitFile(e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {uploadForm.file && (
                            <div className="ef-selected-file">
                              <IconClip size={16} />
                              <span>{uploadForm.file.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setUploadForm((prev) => ({
                                    ...prev,
                                    file: null,
                                  }))
                                }
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="ef-upload-tips">
                          <IconInfo size={16} />
                          <ul>
                            <li>
                              Maximum file size: 15MB per file.
                            </li>
                            <li>
                              Accepted formats: PDF, DOCX only.
                            </li>
                            <li>
                              Please ensure file names do not contain
                              special characters.
                            </li>
                          </ul>
                        </div>
                      </section>
                    </div>

                    <aside className="ef-submit-side">
                      <section className="ef-submit-card ef-history-card">
                        <h3>
                          <span className="ef-history-icon">
                            <IconClock size={16} />
                          </span>
                          Submission History
                        </h3>

                        {(() => {
                          const latest = [...documents].sort(
                            (a, b) =>
                              new Date(b.createdAt) -
                              new Date(a.createdAt)
                          )[0];
                          if (!latest) {
                            return (
                              <div className="ef-last-status muted">
                                <p>
                                  <strong>Last Submission Status</strong>
                                  <span>
                                    No submissions yet. This will be
                                    your first upload.
                                  </span>
                                </p>
                              </div>
                            );
                          }
                          const when = formatDate(
                            latest.reviewedAt || latest.createdAt
                          );
                          let statusText = `Your last submission is ${
                            documentStatusLabel[latest.status] ||
                            latest.status
                          }.`;
                          if (latest.status === "approved") {
                            statusText = `Your last submission was approved on ${when}.`;
                          } else if (
                            latest.status === "pending_review"
                          ) {
                            statusText = `Your last submission is awaiting review (submitted ${when}).`;
                          } else if (
                            latest.status === "changes_requested"
                          ) {
                            statusText = `Changes were requested on ${when}.`;
                          }
                          return (
                            <div className="ef-last-status">
                              <span className="ef-last-check">
                                <IconCheck size={14} />
                              </span>
                              <p>
                                <strong>Last Submission Status</strong>
                                <span>{statusText}</span>
                              </p>
                            </div>
                          );
                        })()}

                        <ul className="ef-submit-timeline">
                          {[...documents]
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt) -
                                new Date(a.createdAt)
                            )
                            .slice(0, 5)
                            .map((doc, index) => (
                              <li
                                key={doc._id}
                                className={
                                  index === 0 ? "active" : undefined
                                }
                              >
                                <strong>
                                  {`v${submissionVersion(doc)} Submitted`}
                                </strong>
                                <span>
                                  {formatDate(doc.createdAt)}
                                  {doc.reviewedAt
                                    ? " • Reviewed"
                                    : doc.status === "pending_review"
                                      ? " • Pending"
                                      : ` • ${
                                          documentStatusLabel[
                                            doc.status
                                          ] || doc.status
                                        }`}
                                </span>
                              </li>
                            ))}
                          <li>
                            <strong>Project Started</strong>
                            <span>
                              {formatDate(
                                group?.createdAt ||
                                  student?.createdAt ||
                                  user?.createdAt
                              )}
                            </span>
                          </li>
                        </ul>
                      </section>
                    </aside>
                  </div>

                  <div className="ef-submit-footer">
                    <button
                      type="button"
                      className="ef-cancel-link"
                      onClick={closeSubmitPage}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ef-submit-project-btn"
                      disabled={saving}
                    >
                      <IconSend size={16} />
                      {saving ? "Submitting..." : "Submit Project"}
                    </button>
                  </div>
                </form>
              )}

              {tab === "documents" && !showSubmitPage && (
                <div className="ef-subs">
                  <div className="ef-page-head">
                    <div className="ef-page-title">
                      <span className="ef-page-icon">
                        <IconDoc size={20} />
                      </span>
                      <div>
                        <h2>My Submissions</h2>
                        <p>
                          Track your submitted work, feedback, and
                          review status.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ef-submit-btn"
                      onClick={openUpload}
                    >
                      + Submit New Work
                    </button>
                  </div>

                  <div className="ef-sub-stats">
                    <div className="ef-sub-stat">
                      <span>Total Submissions</span>
                      <strong>{documents.length}</strong>
                    </div>
                    <div className="ef-sub-stat success">
                      <span>Approved</span>
                      <strong>{approvedDocs.length}</strong>
                    </div>
                    <div className="ef-sub-stat danger">
                      <span>Changes Requested</span>
                      <strong>{changesDocs.length}</strong>
                    </div>
                  </div>

                  <h3 className="ef-section-title">
                    Submission History
                  </h3>

                  {documents.length === 0 ? (
                    <div className="ef-empty">
                      <p>
                        No submissions yet. Upload your first document
                        to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="ef-sub-list">
                      {documents.map((doc) => {
                        const reviewer =
                          doc.reviewedBy?.user?.name || supervisorName;
                        const canResubmit =
                          doc.status === "changes_requested" ||
                          doc.status === "rejected";
                        return (
                          <article
                            key={doc._id}
                            className="ef-sub-card"
                          >
                            <div className="ef-sub-card-head">
                              <div>
                                <h4>{doc.title}</h4>
                                <p>
                                  Version {submissionVersion(doc)} •
                                  Submitted {formatDate(doc.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`ef-pill ${statusPillClass(
                                  doc.status
                                )}`}
                              >
                                {doc.status === "approved" && (
                                  <IconCheck size={12} />
                                )}
                                {documentStatusLabel[doc.status]}
                              </span>
                            </div>

                            <div className="ef-file-box">
                              <span className="ef-file-icon">
                                <IconClip size={16} />
                              </span>
                              <div className="ef-file-meta">
                                <strong>
                                  {doc.originalName || doc.fileName}
                                </strong>
                                <small>{fileKindLabel(doc)}</small>
                              </div>
                              <div className="ef-file-actions">
                                <button
                                  type="button"
                                  className="ef-text-link"
                                  onClick={() => openFile(doc)}
                                >
                                  View File →
                                </button>
                                <button
                                  type="button"
                                  className="ef-text-link"
                                  onClick={() => downloadFile(doc)}
                                >
                                  Download File
                                </button>
                              </div>
                            </div>

                            {doc.feedback?.trim() && (
                              <div className="ef-feedback-box">
                                <span
                                  className="ef-avatar sm"
                                  style={{
                                    background: avatarColor(reviewer),
                                  }}
                                >
                                  {initials(reviewer)}
                                </span>
                                <div>
                                  <strong>{reviewer}</strong>
                                  <small>Supervisor Feedback</small>
                                  <p>{doc.feedback}</p>
                                </div>
                              </div>
                            )}

                            <div className="ef-sub-footer">
                              <button
                                type="button"
                                className="ef-btn-outline"
                                onClick={() => setViewDoc(doc)}
                              >
                                View Details
                              </button>
                              {canResubmit && (
                                <button
                                  type="button"
                                  className="ef-btn-primary"
                                  onClick={() => openResubmit(doc)}
                                >
                                  Resubmit Work
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === "tasks" && (
                <div className="ef-card">
                  <div className="ef-card-head">
                    <h3>My Tasks</h3>
                  </div>
                  {tasks.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        Tasks assigned by your supervisor will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="ef-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Due Date</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task) => (
                            <tr key={task._id}>
                              <td>{task.title}</td>
                              <td>{formatDate(task.dueDate)}</td>
                              <td>{task.priority}</td>
                              <td>
                                <span
                                  className={statusBadgeClass(
                                    task.status
                                  )}
                                >
                                  {taskStatusLabel[task.status]}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="view-btn"
                                  onClick={() => openTask(task)}
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === "meetings" && (
                <div className="ef-card">
                  <div className="ef-card-head">
                    <h3>My Meetings</h3>
                  </div>
                  {meetings.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        Meetings scheduled by your supervisor will
                        appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="ef-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Location / Link</th>
                            <th>Status</th>
                            <th>Agenda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meetings.map((meeting) => (
                            <tr key={meeting._id}>
                              <td>{meeting.title}</td>
                              <td>{formatDate(meeting.date)}</td>
                              <td>{meeting.time}</td>
                              <td>
                                {meeting.meetingLink ? (
                                  <a
                                    href={meeting.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Join link
                                  </a>
                                ) : (
                                  meeting.location || "N/A"
                                )}
                              </td>
                              <td>
                                <span
                                  className={statusBadgeClass(
                                    meeting.status
                                  )}
                                >
                                  {
                                    meetingStatusLabel[
                                      meeting.status
                                    ]
                                  }
                                </span>
                              </td>
                              <td>
                                {meeting.description || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === "settings" && (
                <div className="ef-card">
                  <div className="ef-card-head">
                    <h3>Settings</h3>
                  </div>
                  <div className="form-stack" style={{ padding: "4px 4px 12px" }}>
                    <div className="form-group">
                      <label>Name</label>
                      <input value={user?.name || ""} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input value={user?.email || ""} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <input value="Student" readOnly />
                    </div>
                    <p className="field-hint">
                      Account security changes are handled by your
                      institution administrator. Use Profile for academic
                      details.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {resubmitDoc && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>Resubmit Document</h3>
                <p>
                  Upload a revised file after supervisor feedback
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setResubmitDoc(null)}
              >
                ×
              </button>
            </div>
            <form className="student-form" onSubmit={submitResubmit}>
              {resubmitDoc.feedback && (
                <div className="overview-card" style={{ marginBottom: 16 }}>
                  <p>
                    <strong>Supervisor feedback:</strong>{" "}
                    {resubmitDoc.feedback}
                  </p>
                </div>
              )}
              <div className="form-stack">
                <div className="form-group">
                  <label>Document Title</label>
                  <input
                    required
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Document Type</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                  >
                    <option value="thesis">Thesis</option>
                    <option value="project_book">
                      Project Book
                    </option>
                    <option value="proposal">Proposal</option>
                    <option value="report">Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Revised File</label>
                  <input
                    type="file"
                    required
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        file: e.target.files?.[0] || null,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setResubmitDoc(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Submitting..." : "Resubmit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewGuideline && (
        <div
          className="modal-overlay"
          onClick={() => setViewGuideline(null)}
        >
          <div
            className="ef-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ef-detail-modal-head">
              <div className="ef-detail-modal-title">
                <h3>{viewGuideline.title}</h3>
                <p>
                  Milestone {viewGuideline.number} ·{" "}
                  {viewGuideline.requirements}
                </p>
              </div>
              <div className="ef-detail-modal-head-right">
                <span
                  className={`ef-pill ${
                    viewGuideline.status?.key === "completed"
                      ? "success"
                      : viewGuideline.status?.key === "changes"
                        ? "danger"
                        : viewGuideline.status?.key === "pending"
                          ? "warn"
                          : "muted"
                  }`}
                >
                  {viewGuideline.status?.label}
                </span>
                <button
                  type="button"
                  className="ef-detail-close"
                  onClick={() => setViewGuideline(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="ef-detail-modal-body">
              <p className="ef-guide-modal-lead">
                {viewGuideline.description}
              </p>
              <div className="ef-detail-meta">
                <div>
                  <span>Requirements</span>
                  <strong>{viewGuideline.requirements}</strong>
                </div>
                <div>
                  <span>Word Count</span>
                  <strong>{viewGuideline.wordCount}</strong>
                </div>
                <div>
                  <span>Suggested timeline</span>
                  <strong>{viewGuideline.dueLabel}</strong>
                </div>
                <div>
                  <span>Supervisor</span>
                  <strong>{supervisorName}</strong>
                </div>
              </div>
              <div className="ef-guide-modal-list-wrap">
                <h4>What to include</h4>
                <ul className="ef-guide-modal-list">
                  {viewGuideline.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="ef-detail-modal-footer">
              <button
                type="button"
                className="ef-btn-outline"
                onClick={() => setViewGuideline(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="ef-btn-primary"
                onClick={() => {
                  setViewGuideline(null);
                  openUpload();
                }}
              >
                Submit Work
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDoc && (
        <div
          className="modal-overlay"
          onClick={() => setViewDoc(null)}
        >
          <div
            className="ef-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ef-detail-modal-head">
              <div className="ef-detail-modal-title">
                <h3>{viewDoc.title}</h3>
                <p>
                  Version {submissionVersion(viewDoc)} · Submitted{" "}
                  {formatDate(viewDoc.createdAt)}
                </p>
              </div>
              <div className="ef-detail-modal-head-right">
                <span
                  className={`ef-pill ${statusPillClass(
                    viewDoc.status
                  )}`}
                >
                  {viewDoc.status === "approved" && (
                    <IconCheck size={12} />
                  )}
                  {documentStatusLabel[viewDoc.status]}
                </span>
                <button
                  type="button"
                  className="ef-detail-close"
                  onClick={() => setViewDoc(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="ef-detail-modal-body">
              <div className="ef-detail-meta">
                <div>
                  <span>Document type</span>
                  <strong>
                    {documentTypeLabel[viewDoc.type] || viewDoc.type}
                  </strong>
                </div>
                <div>
                  <span>Review status</span>
                  <strong>
                    {viewDoc.reviewedAt
                      ? `Reviewed ${formatDate(viewDoc.reviewedAt)}`
                      : "Awaiting supervisor review"}
                  </strong>
                </div>
              </div>

              <div className="ef-file-box">
                <span className="ef-file-icon">
                  <IconClip size={16} />
                </span>
                <div className="ef-file-meta">
                  <strong>
                    {viewDoc.originalName || viewDoc.fileName}
                  </strong>
                  <small>{fileKindLabel(viewDoc)}</small>
                </div>
                <div className="ef-file-actions">
                  <button
                    type="button"
                    className="ef-text-link"
                    onClick={() => openFile(viewDoc)}
                  >
                    View File →
                  </button>
                  <button
                    type="button"
                    className="ef-text-link"
                    onClick={() => downloadFile(viewDoc)}
                  >
                    Download File
                  </button>
                </div>
              </div>

              {viewDoc.feedback?.trim() ? (
                <div className="ef-feedback-box">
                  <span
                    className="ef-avatar sm"
                    style={{
                      background: avatarColor(
                        viewDoc.reviewedBy?.user?.name ||
                          supervisorName
                      ),
                    }}
                  >
                    {initials(
                      viewDoc.reviewedBy?.user?.name || supervisorName
                    )}
                  </span>
                  <div>
                    <strong>
                      {viewDoc.reviewedBy?.user?.name ||
                        supervisorName}
                    </strong>
                    <small>Supervisor Feedback</small>
                    <p>{viewDoc.feedback}</p>
                  </div>
                </div>
              ) : (
                <div className="ef-detail-empty">
                  No supervisor feedback yet.
                </div>
              )}
            </div>

            <div className="ef-detail-modal-footer">
              {(viewDoc.status === "changes_requested" ||
                viewDoc.status === "rejected") && (
                <button
                  type="button"
                  className="ef-btn-primary"
                  onClick={() => {
                    openResubmit(viewDoc);
                    setViewDoc(null);
                  }}
                >
                  Resubmit Work
                </button>
              )}
              <button
                type="button"
                className="ef-btn-outline"
                onClick={() => setViewDoc(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>{selectedTask.title}</h3>
                <p>
                  Due {formatDate(selectedTask.dueDate)} ·{" "}
                  Priority: {selectedTask.priority}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedTask(null)}
              >
                ×
              </button>
            </div>
            <form className="student-form" onSubmit={saveTaskUpdate}>
              <div className="form-stack">
                <div className="form-group">
                  <label>Assigned Group</label>
                  <p className="text-muted">
                    {selectedTask.group?.name || "—"}
                    {selectedTask.group?.code
                      ? ` (${selectedTask.group.code})`
                      : ""}
                  </p>
                </div>
                <div className="form-group">
                  <label>Assignment Type</label>
                  <p className="text-muted">
                    {taskAssignmentTypeLabel[
                      getTaskAssignmentType(selectedTask)
                    ] || "—"}
                  </p>
                </div>
                <div className="form-group">
                  <label>Assigned Student</label>
                  <p className="text-muted">
                    {getTaskAssignmentType(selectedTask) === "all_group"
                      ? "All group members"
                      : selectedTask.assignedTo?.user?.name || "—"}
                  </p>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <p className="text-muted">
                    {selectedTask.description || "No description"}
                  </p>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={taskUpdate.status}
                    onChange={(e) =>
                      setTaskUpdate((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Submission Note</label>
                  <textarea
                    rows={3}
                    value={taskUpdate.submissionNote}
                    onChange={(e) =>
                      setTaskUpdate((prev) => ({
                        ...prev,
                        submissionNote: e.target.value,
                      }))
                    }
                    placeholder="Optional note when submitting"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
