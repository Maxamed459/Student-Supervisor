import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconBook,
  IconDashboard,
  IconGroups,
  IconLogout,
  IconSettings,
  IconStudents,
  IconUser,
} from "../components/Icons";
import documentsService from "../services/documentsService";
import tasksService from "../services/tasksService";
import meetingsService from "../services/meetingsService";
import api from "../services/api";
import DocumentReviewViewer from "../components/DocumentReviewViewer";
import Logo from "../components/Logo";
import { THESIS_GUIDELINES } from "../data/thesisGuidelines";
import {
  documentStatusLabel,
  documentTypeLabel,
  formatDate,
  formatDateTime,
  meetingStatusLabel,
  statusBadgeClass,
  taskAssignmentTypeLabel,
  getTaskAssignmentType,
  taskStatusLabel,
} from "../utils/collaboration";

const AVATAR_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#DB2777",
  "#0891B2",
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

function relativeLabel(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dayDiff = Math.round(
    (startTarget - startToday) / (1000 * 60 * 60 * 24)
  );

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff > 1 && dayDiff <= 7) return `In ${dayDiff} Days`;
  if (dayDiff === -1) return "Yesterday";
  if (dayDiff < -1) return formatDate(dateValue);
  return formatDate(dateValue);
}

function relativeAgo(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateTime(dateValue);
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

function IconSearch({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconAlert({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCheckCircle({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 14.5-4-4 1.4-1.4L10 13.7l6.6-6.6L18 8.5l-8 8z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconDocPlus({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCalendar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
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

const EMPTY_TASK = {
  title: "",
  description: "",
  dueDate: "",
  assignedTo: "",
  group: "",
  priority: "medium",
  assignmentType: "single_student",
};

const EMPTY_MEETING = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  meetingLink: "",
  group: "",
  status: "scheduled",
};

function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [supervisor, setSupervisor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docStats, setDocStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [reviewDoc, setReviewDoc] = useState(null);
  const [reviewError, setReviewError] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingForm, setMeetingForm] = useState(EMPTY_MEETING);
  const [searchQuery, setSearchQuery] = useState("");
  const [progressGroupFilter, setProgressGroupFilter] = useState("all");

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        profileRes,
        groupsRes,
        docsRes,
        statsRes,
        tasksRes,
        meetingsRes,
      ] = await Promise.all([
        api.get("/supervisors/me"),
        api.get("/groups/me"),
        documentsService.list(),
        documentsService.stats(),
        tasksService.list(),
        meetingsService.list(),
      ]);

      setSupervisor(
        profileRes.data.supervisor || profileRes.data.data
      );
      setGroups(groupsRes.data.groups || []);
      setDocuments(docsRes.data.documents || []);
      setDocStats(statsRes.data.stats || statsRes.data.data);
      setTasks(tasksRes.data.tasks || []);
      setMeetings(meetingsRes.data.meetings || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to load supervisor dashboard"
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

  const groupMembers = useMemo(() => {
    const byId = new Map();

    groups.forEach((group) => {
      (group.members || []).forEach((member) => {
        const id = member._id || member;
        if (!byId.has(id)) {
          byId.set(id, { ...member, _id: id, groupId: group._id });
        }
      });
    });

    return Array.from(byId.values());
  }, [groups]);

  const memberCount =
    supervisor?.assignedStudentsCount ?? groupMembers.length;
  const maxStudents = supervisor?.maxStudents || 0;
  const availableSlots =
    supervisor?.availableSlots ??
    Math.max(maxStudents - memberCount, 0);
  const percentage =
    supervisor?.percentage ??
    (maxStudents > 0
      ? Math.round((memberCount / maxStudents) * 100)
      : 0);

  const pendingDocs = documents.filter(
    (doc) => doc.status === "pending_review"
  );
  const approvedDocs = documents.filter(
    (doc) => doc.status === "approved"
  );
  const changesRequestedDocs = documents.filter(
    (doc) => doc.status === "changes_requested"
  );
  const upcomingMeetings = meetings.filter(
    (meeting) =>
      meeting.status === "scheduled" &&
      new Date(meeting.date) >= new Date(new Date().toDateString())
  );

  const activeGroups = groups.filter(
    (group) => (group.status || "active") === "active"
  );

  const query = searchQuery.trim().toLowerCase();

  const filteredPendingDocs = useMemo(() => {
    if (!query) return pendingDocs;
    return pendingDocs.filter((doc) => {
      const hay = [
        doc.title,
        doc.type,
        doc.originalName,
        doc.uploadedBy?.user?.name,
        doc.group?.name,
        doc.group?.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [pendingDocs, query]);

  const filteredDocuments = useMemo(() => {
    if (!query) return documents;
    return documents.filter((doc) => {
      const hay = [
        doc.title,
        doc.type,
        doc.originalName,
        doc.uploadedBy?.user?.name,
        doc.group?.name,
        doc.feedback,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [documents, query]);

  const filteredStudents = useMemo(() => {
    if (!query) return groupMembers;
    return groupMembers.filter((student) => {
      const hay = [
        student.user?.name,
        student.user?.email,
        student.studentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [groupMembers, query]);

  const studentProgress = useMemo(() => {
    return groupMembers
      .filter((student) => {
        if (progressGroupFilter === "all") return true;
        const group = groups.find((g) => g._id === progressGroupFilter);
        return (group?.members || []).some(
          (m) => (m._id || m) === student._id
        );
      })
      .map((student) => {
        const studentDocs = documents.filter((doc) => {
          const uploader =
            doc.uploadedBy?._id?.toString() ||
            doc.uploadedBy?.toString();
          return uploader === student._id?.toString();
        });
        const studentTasks = tasks.filter((task) => {
          const type = getTaskAssignmentType(task);
          if (type === "all_group") {
            const taskGroupId =
              task.group?._id?.toString() || task.group?.toString();
            if (!taskGroupId) return false;
            const group = groups.find(
              (g) => g._id?.toString() === taskGroupId
            );
            return (group?.members || []).some(
              (m) => (m._id || m)?.toString() === student._id?.toString()
            );
          }
          const assignee =
            task.assignedTo?._id?.toString() ||
            task.assignedTo?.toString();
          return assignee === student._id?.toString();
        });

        const approvedCount = studentDocs.filter(
          (d) => d.status === "approved"
        ).length;
        const completedTasks = studentTasks.filter(
          (t) => t.status === "completed"
        ).length;
        const totalUnits = studentDocs.length + studentTasks.length;
        const doneUnits = approvedCount + completedTasks;
        const pct =
          totalUnits === 0
            ? 0
            : Math.round((doneUnits / totalUnits) * 100);

        const group =
          groups.find((g) =>
            (g.members || []).some((m) => (m._id || m) === student._id)
          ) || null;

        const pendingForStudent = studentDocs.some(
          (d) => d.status === "pending_review"
        );
        const overdueTask = studentTasks.some(
          (t) =>
            t.status !== "completed" &&
            t.dueDate &&
            new Date(t.dueDate) < new Date(new Date().toDateString())
        );

        let track = "On Track";
        let trackTone = "good";
        if (totalUnits === 0) {
          track = "Getting Started";
          trackTone = "neutral";
        } else if (overdueTask || (pct < 40 && pendingForStudent)) {
          track = "Behind Schedule";
          trackTone = "bad";
        } else if (pct < 70) {
          track = "In Progress";
          trackTone = "neutral";
        }

        return {
          id: student._id,
          name: student.user?.name || "N/A",
          groupName: group?.name || "No group",
          projectTitle: group?.projectTitle || group?.name || "Project",
          pct,
          track,
          trackTone,
          student,
          group,
        };
      });
  }, [groupMembers, groups, documents, tasks, progressGroupFilter]);

  const upcomingMilestones = useMemo(() => {
    const fromMeetings = upcomingMeetings.map((m) => ({
      id: `meeting-${m._id}`,
      title: m.title,
      meta: m.group?.name || "Meeting",
      when: relativeLabel(m.date),
      tone:
        relativeLabel(m.date) === "Tomorrow" ||
        relativeLabel(m.date) === "Today"
          ? "urgent"
          : relativeLabel(m.date).startsWith("In")
            ? "info"
            : "muted",
      sortDate: new Date(m.date).getTime(),
    }));

    const fromTasks = tasks
      .filter(
        (t) =>
          t.status !== "completed" &&
          t.dueDate &&
          new Date(t.dueDate) >= new Date(new Date().toDateString())
      )
      .map((t) => ({
        id: `task-${t._id}`,
        title: t.title,
        meta:
          getTaskAssignmentType(t) === "all_group"
            ? t.group?.name
              ? `Group · ${t.group.name}`
              : "All Group"
            : t.assignedTo?.user?.name || "Task",
        when: relativeLabel(t.dueDate),
        tone:
          relativeLabel(t.dueDate) === "Tomorrow" ||
          relativeLabel(t.dueDate) === "Today"
            ? "urgent"
            : "info",
        sortDate: new Date(t.dueDate).getTime(),
      }));

    return [...fromMeetings, ...fromTasks]
      .sort((a, b) => a.sortDate - b.sortDate)
      .slice(0, 5);
  }, [upcomingMeetings, tasks]);

  const recentActivity = useMemo(() => {
    const events = documents.map((doc) => {
      const studentName = doc.uploadedBy?.user?.name || "Student";
      const when = doc.reviewedAt || doc.updatedAt || doc.createdAt;
      let text = `${studentName} submitted ${doc.title}`;
      let tone = "info";

      if (doc.status === "approved") {
        text = `You approved ${doc.title} for ${studentName}`;
        tone = "good";
      } else if (doc.status === "changes_requested") {
        text = `Changes requested on ${doc.title} for ${studentName}`;
        tone = "muted";
      } else if (doc.status === "rejected") {
        text = `You rejected ${doc.title} for ${studentName}`;
        tone = "bad";
      } else if (doc.status === "pending_review") {
        text = `${studentName} submitted ${doc.title}`;
        tone = "info";
      }

      return {
        id: doc._id,
        text,
        when: relativeAgo(when),
        tone,
        sortDate: new Date(when).getTime(),
      };
    });

    return events
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, 6);
  }, [documents]);

  const studentsForGroup = (groupId) => {
    if (!groupId) return groupMembers;
    const group = groups.find((g) => g._id === groupId);
    return group?.members || [];
  };

  const openReview = (doc) => {
    setReviewDoc(doc);
    setReviewError("");
    setMessage({ type: "", text: "" });
  };

  const submitReview = async (reviewForm) => {
    if (!reviewDoc) return;

    try {
      setSaving(true);
      setReviewError("");
      await documentsService.review(reviewDoc._id, reviewForm);
      setMessage({
        type: "success",
        text: "Document review saved",
      });
      setReviewDoc(null);
      await loadAll();
    } catch (err) {
      setReviewError(
        err.response?.data?.message || "Failed to save review"
      );
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to save review",
      });
    } finally {
      setSaving(false);
    }
  };

  const openTaskModal = (task = null) => {
    setEditingTask(task);
    setTaskForm(
      task
        ? {
            title: task.title || "",
            description: task.description || "",
            dueDate: task.dueDate
              ? task.dueDate.slice(0, 10)
              : "",
            assignedTo: task.assignedTo?._id || "",
            group: task.group?._id || "",
            priority: task.priority || "medium",
            assignmentType: getTaskAssignmentType(task),
          }
        : EMPTY_TASK
    );
    setShowTaskModal(true);
    setMessage({ type: "", text: "" });
  };

  const saveTask = async (e) => {
    e.preventDefault();

    if (!taskForm.group) {
      setMessage({
        type: "error",
        text: "Please select a group",
      });
      return;
    }

    if (
      taskForm.assignmentType === "single_student" &&
      !taskForm.assignedTo
    ) {
      setMessage({
        type: "error",
        text: "Please select a student for Single Student assignment",
      });
      return;
    }

    try {
      setSaving(true);
      const isAllGroup = taskForm.assignmentType === "all_group";
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        group: taskForm.group,
        assignmentType: taskForm.assignmentType,
        assignToGroup: isAllGroup,
        assignedTo: isAllGroup
          ? undefined
          : taskForm.assignedTo || undefined,
      };

      if (editingTask) {
        await tasksService.update(editingTask._id, {
          title: payload.title,
          description: payload.description,
          dueDate: payload.dueDate,
          priority: payload.priority,
          group: payload.group,
          assignmentType: "single_student",
          assignedTo: taskForm.assignedTo,
          status: editingTask.status,
        });
      } else {
        await tasksService.create(payload);
      }

      setShowTaskModal(false);
      setEditingTask(null);
      setMessage({
        type: "success",
        text: editingTask ? "Task updated" : "Task created",
      });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save task",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await tasksService.remove(id);
      setMessage({ type: "success", text: "Task deleted" });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete task",
      });
    }
  };

  const openMeetingModal = (meeting = null) => {
    setEditingMeeting(meeting);
    setMeetingForm(
      meeting
        ? {
            title: meeting.title || "",
            description: meeting.description || "",
            date: meeting.date ? meeting.date.slice(0, 10) : "",
            time: meeting.time || "",
            location: meeting.location || "",
            meetingLink: meeting.meetingLink || "",
            group: meeting.group?._id || "",
            status: meeting.status || "scheduled",
          }
        : EMPTY_MEETING
    );
    setShowMeetingModal(true);
    setMessage({ type: "", text: "" });
  };

  const saveMeeting = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const payload = {
        ...meetingForm,
        group: meetingForm.group || undefined,
      };

      if (editingMeeting) {
        await meetingsService.update(editingMeeting._id, payload);
      } else {
        await meetingsService.create(payload);
      }

      setShowMeetingModal(false);
      setEditingMeeting(null);
      setMessage({
        type: "success",
        text: editingMeeting ? "Meeting updated" : "Meeting created",
      });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to save meeting",
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelMeeting = async (id) => {
    if (!window.confirm("Cancel this meeting?")) return;

    try {
      await meetingsService.update(id, { status: "cancelled" });
      setMessage({ type: "success", text: "Meeting cancelled" });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to cancel meeting",
      });
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: IconDashboard },
    { id: "students", label: "My Students", icon: IconStudents },
    { id: "groups", label: "My Groups", icon: IconGroups },
    { id: "documents", label: "Submissions", icon: IconDocPlus },
    { id: "tasks", label: "Tasks", icon: IconTasks },
    { id: "meetings", label: "Meetings", icon: IconCalendar },
    { id: "guidelines", label: "Guidelines", icon: IconBook },
    { id: "profile", label: "Profile", icon: IconUser },
    { id: "settings", label: "Settings", icon: IconSettings },
  ];

  const specialization =
    supervisor?.specialization || "Senior Supervisor";

  return (
    <div className="sos-layout">
      <aside className="sos-sidebar">
        <div className="sos-brand">
          <Logo light />
        </div>

        <nav className="sos-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={
                  tab === item.id
                    ? "sos-nav-link active"
                    : "sos-nav-link"
                }
                onClick={() => setTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sos-sidebar-bottom">
          <button
            type="button"
            className="sos-nav-link sos-logout"
            onClick={handleLogout}
          >
            <IconLogout size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="sos-main">
        <header className="sos-topbar">
          <div className="sos-search">
            <IconSearch size={16} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students or documents..."
              aria-label="Search students or documents"
            />
          </div>

          <div className="sos-topbar-right">
            <button
              type="button"
              className="sos-bell"
              aria-label="Notifications"
              onClick={() => setTab("documents")}
            >
              <IconBell size={18} />
              {pendingDocs.length > 0 && <span className="sos-bell-dot" />}
            </button>

            <div className="sos-user-chip">
              <div className="sos-user-text">
                <strong>{user?.name || "Supervisor"}</strong>
                <span>{specialization}</span>
              </div>
              <div
                className="sos-user-avatar"
                style={{
                  background: avatarColor(user?.name || "S"),
                }}
                aria-hidden="true"
              >
                {initials(user?.name || "S")}
              </div>
            </div>
          </div>
        </header>

        <section className="sos-content">
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
                  <div className="sos-page-head">
                    <div>
                      <h1>Supervisor Dashboard</h1>
                      <p>
                        Monitor assigned students, milestones,
                        submissions, and review activity.
                      </p>
                    </div>
                    <div className="sos-session-pill">
                      <span className="sos-session-dot" />
                      STATUS: Active Session
                    </div>
                  </div>

                  <div className="sos-stats">
                    <div className="sos-stat">
                      <div className="sos-stat-icon">
                        <IconStudents size={18} />
                      </div>
                      <div>
                        <span>My Students</span>
                        <strong>{memberCount}</strong>
                        <small>Total assigned</small>
                      </div>
                    </div>
                    <div className="sos-stat">
                      <div className="sos-stat-icon blue">
                        <IconGroups size={18} />
                      </div>
                      <div>
                        <span>Active Groups</span>
                        <strong>{activeGroups.length}</strong>
                        <small>Active rooms</small>
                      </div>
                    </div>
                    <div className="sos-stat urgent">
                      <div className="sos-stat-icon red">
                        <IconAlert size={18} />
                      </div>
                      <div>
                        <span>Pending Reviews</span>
                        <strong>
                          {docStats?.pendingReviews ||
                            pendingDocs.length}
                        </strong>
                        <small>Waiting for review</small>
                      </div>
                    </div>
                    <div className="sos-stat">
                      <div className="sos-stat-icon green">
                        <IconCheckCircle size={18} />
                      </div>
                      <div>
                        <span>Approved</span>
                        <strong>
                          {docStats?.approved || approvedDocs.length}
                        </strong>
                        <small>Total approved</small>
                      </div>
                    </div>
                    <div className="sos-stat">
                      <div className="sos-stat-icon">
                        <IconDocPlus size={18} />
                      </div>
                      <div>
                        <span>Changes Req.</span>
                        <strong>
                          {docStats?.changesRequested ||
                            changesRequestedDocs.length}
                        </strong>
                        <small>Total revisions</small>
                      </div>
                    </div>
                  </div>

                  <div className="sos-grid">
                    <div className="sos-col-main">
                      <div className="sos-card">
                        <div className="sos-card-head">
                          <div className="sos-card-title">
                            <span className="sos-priority-icon">
                              <IconAlert size={16} />
                            </span>
                            <h3>
                              Pending Reviews ({pendingDocs.length})
                            </h3>
                          </div>
                          <button
                            type="button"
                            className="sos-link"
                            onClick={() => setTab("documents")}
                          >
                            View All →
                          </button>
                        </div>

                        {filteredPendingDocs.length === 0 ? (
                          <div className="empty-state">
                            <p>No documents waiting for review.</p>
                          </div>
                        ) : (
                          <div className="table-wrapper">
                            <table className="sos-table">
                              <thead>
                                <tr>
                                  <th>Student</th>
                                  <th>Milestone / Version</th>
                                  <th>Date Submitted</th>
                                  <th>Status</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPendingDocs
                                  .slice(0, 7)
                                  .map((doc) => {
                                    const name =
                                      doc.uploadedBy?.user?.name ||
                                      "N/A";
                                    return (
                                      <tr key={doc._id}>
                                        <td>
                                          <div className="sos-person">
                                            <span
                                              className="sos-avatar"
                                              style={{
                                                background:
                                                  avatarColor(name),
                                              }}
                                            >
                                              {initials(name)}
                                            </span>
                                            <div>
                                              <strong>{name}</strong>
                                              <small>
                                                {doc.group?.name ||
                                                  "No group"}
                                              </small>
                                            </div>
                                          </div>
                                        </td>
                                        <td>
                                          <strong>{doc.title}</strong>
                                          <div className="text-muted">
                                            {documentTypeLabel[
                                              doc.type
                                            ] || doc.type}
                                          </div>
                                        </td>
                                        <td>
                                          {formatDate(
                                            doc.createdAt ||
                                              doc.uploadedAt
                                          )}
                                        </td>
                                        <td>
                                          <span className="sos-pill danger">
                                            Pending Review
                                          </span>
                                        </td>
                                        <td>
                                          <button
                                            className="sos-btn-sm"
                                            onClick={() =>
                                              openReview(doc)
                                            }
                                          >
                                            Review
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="sos-card">
                        <div className="sos-card-head">
                          <h3>Student Progress Overview</h3>
                          <select
                            className="sos-select"
                            value={progressGroupFilter}
                            onChange={(e) =>
                              setProgressGroupFilter(e.target.value)
                            }
                            aria-label="Filter by group"
                          >
                            <option value="all">
                              Filter by Group
                            </option>
                            {groups.map((group) => (
                              <option
                                key={group._id}
                                value={group._id}
                              >
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {studentProgress.length === 0 ? (
                          <div className="empty-state">
                            <p>No students assigned yet.</p>
                          </div>
                        ) : (
                          <div className="sos-progress-list">
                            {studentProgress
                              .slice(0, 6)
                              .map((row) => (
                                <div
                                  key={row.id}
                                  className="sos-progress-item"
                                >
                                  <div className="sos-progress-top">
                                    <div>
                                      <strong>{row.name}</strong>
                                      <small>
                                        {row.projectTitle} ·{" "}
                                        {row.groupName}
                                      </small>
                                    </div>
                                    <div className="sos-progress-meta">
                                      <strong>{row.pct}%</strong>
                                      <span
                                        className={`sos-pill ${
                                          row.trackTone === "good"
                                            ? "success"
                                            : row.trackTone === "bad"
                                              ? "danger"
                                              : "muted"
                                        }`}
                                      >
                                        {row.track}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="sos-progress-bar">
                                    <div
                                      className={`sos-progress-fill ${
                                        row.trackTone === "bad"
                                          ? "danger"
                                          : ""
                                      }`}
                                      style={{
                                        width: `${Math.min(row.pct, 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        <button
                          type="button"
                          className="sos-btn-block"
                          onClick={() => setTab("students")}
                        >
                          View All Progress Reports
                        </button>
                      </div>
                    </div>

                    <div className="sos-col-side">
                      <div className="sos-card sos-actions-card">
                        <h3>Quick Actions</h3>
                        <button
                          type="button"
                          className="sos-action primary"
                          onClick={() => setTab("documents")}
                        >
                          Review Submissions
                        </button>
                        <button
                          type="button"
                          className="sos-action"
                          onClick={() => setTab("students")}
                        >
                          View My Students
                        </button>
                        <button
                          type="button"
                          className="sos-action"
                          onClick={() => setTab("groups")}
                        >
                          View Groups
                        </button>
                        <button
                          type="button"
                          className="sos-action"
                          onClick={() => openTaskModal()}
                        >
                          Create Task
                        </button>
                      </div>

                      <div className="sos-card">
                        <h3>Upcoming Milestones</h3>
                        {upcomingMilestones.length === 0 ? (
                          <div className="empty-state compact">
                            <p>No upcoming meetings or task due dates.</p>
                          </div>
                        ) : (
                          <ul className="sos-milestone-list">
                            {upcomingMilestones.map((item) => (
                              <li key={item.id}>
                                <div>
                                  <strong>{item.title}</strong>
                                  <small>{item.meta}</small>
                                </div>
                                <span
                                  className={`sos-when ${item.tone}`}
                                >
                                  {item.when}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="sos-card">
                        <h3>Recent Activity</h3>
                        {recentActivity.length === 0 ? (
                          <div className="empty-state compact">
                            <p>No recent document activity.</p>
                          </div>
                        ) : (
                          <ul className="sos-activity-list">
                            {recentActivity.map((item) => (
                              <li key={item.id}>
                                <span
                                  className={`sos-activity-dot ${item.tone}`}
                                />
                                <div>
                                  <p>{item.text}</p>
                                  <small>{item.when}</small>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          className="sos-link sos-link-block"
                          onClick={() => setTab("documents")}
                        >
                          View Full History
                        </button>
                      </div>

                      <div className="sos-card">
                        <h3>Capacity</h3>
                        <div className="capacity-preview large">
                          <div className="capacity-text">
                            <strong>{memberCount}</strong>
                            <span> / {maxStudents}</span>
                          </div>
                          <div className="capacity-bar">
                            <div
                              className="capacity-fill"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <small>
                            Unique students across your groups ·
                            Available slots: {availableSlots}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === "students" && (
                <div className="sos-card">
                  <div className="sos-card-head">
                    <div>
                      <h3>My Students</h3>
                      <p className="sos-card-sub">
                        Students across your assigned groups
                      </p>
                    </div>
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="empty-state">
                      <p>No students found.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="sos-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Student ID</th>
                            <th>Email</th>
                            <th>Group</th>
                            <th>Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => {
                            const name =
                              student.user?.name || "N/A";
                            const progress = studentProgress.find(
                              (p) => p.id === student._id
                            );
                            const group =
                              groups.find((g) =>
                                (g.members || []).some(
                                  (m) => (m._id || m) === student._id
                                )
                              ) || null;
                            return (
                              <tr key={student._id}>
                                <td>
                                  <div className="sos-person">
                                    <span
                                      className="sos-avatar"
                                      style={{
                                        background: avatarColor(name),
                                      }}
                                    >
                                      {initials(name)}
                                    </span>
                                    <strong>{name}</strong>
                                  </div>
                                </td>
                                <td>{student.studentId || "N/A"}</td>
                                <td>
                                  {student.user?.email || "N/A"}
                                </td>
                                <td>
                                  {group?.name || "N/A"}
                                  {group?.code
                                    ? ` (${group.code})`
                                    : ""}
                                </td>
                                <td>
                                  {progress ? (
                                    <span
                                      className={`sos-pill ${
                                        progress.trackTone === "good"
                                          ? "success"
                                          : progress.trackTone ===
                                              "bad"
                                            ? "danger"
                                            : "muted"
                                      }`}
                                    >
                                      {progress.pct}% · {progress.track}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === "groups" && (
                <div className="sos-card">
                  <div className="sos-card-head">
                    <div>
                      <h3>Groups / Rooms</h3>
                      <p className="sos-card-sub">
                        Groups assigned to you
                      </p>
                    </div>
                  </div>
                  {groups.length === 0 ? (
                    <div className="empty-state">
                      <p>No groups assigned yet.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="sos-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Project</th>
                            <th>Members</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {groups.map((group) => (
                            <tr key={group._id}>
                              <td>{group.code}</td>
                              <td>{group.name}</td>
                              <td>
                                {group.projectTitle || "—"}
                              </td>
                              <td>
                                {group.members?.length || 0}
                              </td>
                              <td>
                                <span
                                  className={statusBadgeClass(
                                    group.status === "active"
                                      ? "approved"
                                      : "pending"
                                  )}
                                >
                                  {group.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="sos-btn-sm"
                                  onClick={() =>
                                    setSelectedGroup(group)
                                  }
                                >
                                  View
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

              {tab === "documents" && (
                <div className="sos-card">
                  <div className="sos-card-head">
                    <h3>Submissions</h3>
                  </div>
                  {filteredDocuments.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        No documents from your group students yet.
                      </p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="sos-table">
                        <thead>
                          <tr>
                            <th>Document</th>
                            <th>Group</th>
                            <th>Student</th>
                            <th>Upload Date</th>
                            <th>Status</th>
                            <th>Review / Feedback</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDocuments.map((doc) => (
                            <tr key={doc._id}>
                              <td>
                                <strong>{doc.title}</strong>
                                <div className="text-muted">
                                  {documentTypeLabel[doc.type] ||
                                    doc.type}
                                  {doc.originalName
                                    ? ` · ${doc.originalName}`
                                    : ""}
                                </div>
                              </td>
                              <td>
                                {doc.group?.name || "N/A"}
                                {doc.group?.code
                                  ? ` (${doc.group.code})`
                                  : ""}
                              </td>
                              <td>
                                {doc.uploadedBy?.user?.name ||
                                  "N/A"}
                              </td>
                              <td>
                                {formatDate(doc.createdAt)}
                              </td>
                              <td>
                                <span
                                  className={statusBadgeClass(
                                    doc.status
                                  )}
                                >
                                  {
                                    documentStatusLabel[
                                      doc.status
                                    ]
                                  }
                                </span>
                              </td>
                              <td className="doc-feedback-cell">
                                {doc.feedback ? (
                                  <span title={doc.feedback}>
                                    {doc.feedback.length > 80
                                      ? `${doc.feedback.slice(0, 80)}…`
                                      : doc.feedback}
                                  </span>
                                ) : (
                                  <span className="text-muted">
                                    No feedback yet
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="sos-btn-sm"
                                    onClick={() =>
                                      openReview(doc)
                                    }
                                  >
                                    Open & Review
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === "tasks" && (
                <div className="sos-card">
                  <div className="sos-card-head">
                    <h3>Tasks</h3>
                    <button
                      className="primary-btn"
                      onClick={() => openTaskModal()}
                    >
                      + Create Task
                    </button>
                  </div>
                  {tasks.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        No tasks yet. Create one for your group
                        students.
                      </p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="sos-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Assigned Group</th>
                            <th>Assignment Type</th>
                            <th>Assigned Student</th>
                            <th>Due</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task) => {
                            const type = getTaskAssignmentType(task);
                            return (
                              <tr key={task._id}>
                                <td>{task.title}</td>
                                <td>
                                  {task.group?.name || "—"}
                                  {task.group?.code
                                    ? ` (${task.group.code})`
                                    : ""}
                                </td>
                                <td>
                                  <span className="badge badge-muted">
                                    {taskAssignmentTypeLabel[type] ||
                                      type}
                                  </span>
                                </td>
                                <td>
                                  {type === "all_group"
                                    ? "All members"
                                    : task.assignedTo?.user?.name ||
                                      "N/A"}
                                </td>
                                <td>
                                  {formatDate(task.dueDate)}
                                </td>
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
                                  <div className="action-buttons">
                                    <button
                                      className="edit-btn"
                                      onClick={() =>
                                        openTaskModal(task)
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="delete-btn"
                                      onClick={() =>
                                        deleteTask(task._id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === "meetings" && (
                <>
                  <div className="sos-card" style={{ marginBottom: 18 }}>
                    <div className="sos-card-head">
                      <h3>Meetings</h3>
                      <button
                        className="primary-btn"
                        onClick={() => openMeetingModal()}
                      >
                        + Create Meeting
                      </button>
                    </div>
                    <h4 className="sos-subhead">Upcoming</h4>
                    {upcomingMeetings.length === 0 ? (
                      <div className="empty-state">
                        <p>No upcoming meetings.</p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table className="sos-table">
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Location / Link</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {upcomingMeetings.map((meeting) => (
                              <tr key={meeting._id}>
                                <td>{meeting.title}</td>
                                <td>
                                  {formatDate(meeting.date)}
                                </td>
                                <td>{meeting.time}</td>
                                <td>
                                  {meeting.meetingLink ||
                                    meeting.location ||
                                    "N/A"}
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
                                  <div className="action-buttons">
                                    <button
                                      className="edit-btn"
                                      onClick={() =>
                                        openMeetingModal(meeting)
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="delete-btn"
                                      onClick={() =>
                                        cancelMeeting(
                                          meeting._id
                                        )
                                      }
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="sos-card">
                    <h4 className="sos-subhead">All Meetings</h4>
                    {meetings.length === 0 ? (
                      <div className="empty-state">
                        <p>No meetings created yet.</p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table className="sos-table">
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Group</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meetings.map((meeting) => (
                              <tr key={meeting._id}>
                                <td>{meeting.title}</td>
                                <td>
                                  {meeting.group?.name ||
                                    "Selected students"}
                                </td>
                                <td>
                                  {formatDate(meeting.date)}{" "}
                                  {meeting.time}
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
                                  <button
                                    className="edit-btn"
                                    onClick={() =>
                                      openMeetingModal(meeting)
                                    }
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {tab === "guidelines" && (
                <div className="sos-card">
                  <div className="sos-card-head">
                    <h3>Thesis Guidelines</h3>
                  </div>
                  <p className="field-hint" style={{ marginBottom: 16 }}>
                    Share these chapter expectations with your assigned
                    students when reviewing submissions.
                  </p>
                  <div className="table-wrapper">
                    <table className="sos-table">
                      <thead>
                        <tr>
                          <th>Chapter</th>
                          <th>Focus</th>
                          <th>Word count</th>
                          <th>Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {THESIS_GUIDELINES.map((guide) => (
                          <tr key={guide.id}>
                            <td>
                              <strong>{guide.title}</strong>
                            </td>
                            <td>{guide.requirements}</td>
                            <td>{guide.wordCount}</td>
                            <td>{guide.dueLabel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "profile" && (
                <div className="sos-card">
                  <div className="sos-card-head">
                    <h3>My Profile</h3>
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
                      <label>Employee ID</label>
                      <input
                        value={supervisor?.employeeId || "—"}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        value={supervisor?.department?.name || "—"}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Specialization</label>
                      <input
                        value={
                          supervisor?.specialization || specialization
                        }
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Assigned students</label>
                      <input
                        value={String(memberCount)}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )}

              {tab === "settings" && (
                <div className="sos-card">
                  <div className="sos-card-head">
                    <h3>Settings</h3>
                  </div>
                  <div className="form-stack" style={{ padding: "4px 4px 12px" }}>
                    <div className="form-group">
                      <label>Account email</label>
                      <input value={user?.email || ""} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <input value="Supervisor" readOnly />
                    </div>
                    <p className="field-hint">
                      Password and security changes are managed by your
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

      {reviewDoc && (
        <DocumentReviewViewer
          document={reviewDoc}
          saving={saving}
          errorMessage={reviewError}
          onClose={() => {
            setReviewDoc(null);
            setReviewError("");
          }}
          onSubmitReview={submitReview}
        />
      )}

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>
                  {editingTask ? "Edit Task" : "Create Task"}
                </h3>
                <p>
                  Choose a group, then assign to all members or one
                  student
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowTaskModal(false)}
              >
                ×
              </button>
            </div>
            <form className="student-form" onSubmit={saveTask}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Title</label>
                  <input
                    required
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Group</label>
                  <select
                    required
                    value={taskForm.group}
                    disabled={Boolean(editingTask)}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        group: e.target.value,
                        assignedTo: "",
                      }))
                    }
                  >
                    <option value="">Select group</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                        {group.code ? ` (${group.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignment Type</label>
                  <select
                    required
                    value={taskForm.assignmentType}
                    disabled={Boolean(editingTask)}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        assignmentType: e.target.value,
                        assignedTo:
                          e.target.value === "all_group"
                            ? ""
                            : prev.assignedTo,
                      }))
                    }
                  >
                    <option value="all_group">All Group</option>
                    <option value="single_student">
                      Single Student
                    </option>
                  </select>
                </div>
                {taskForm.assignmentType === "single_student" && (
                  <div className="form-group full-width">
                    <label>Assigned Student</label>
                    <select
                      required
                      value={taskForm.assignedTo}
                      onChange={(e) =>
                        setTaskForm((prev) => ({
                          ...prev,
                          assignedTo: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select student</option>
                      {studentsForGroup(taskForm.group).map(
                        (student) => (
                          <option
                            key={student._id}
                            value={student._id}
                          >
                            {student.user?.name} (
                            {student.studentId})
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
                {taskForm.assignmentType === "all_group" &&
                  taskForm.group && (
                    <div className="form-group full-width">
                      <p className="field-hint">
                        One task will be registered for the selected
                        group. All{" "}
                        {studentsForGroup(taskForm.group).length}{" "}
                        member
                        {studentsForGroup(taskForm.group).length === 1
                          ? ""
                          : "s"}{" "}
                        can access it.
                      </p>
                    </div>
                  )}
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMeetingModal && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>
                  {editingMeeting
                    ? "Edit Meeting"
                    : "Create Meeting"}
                </h3>
                <p>Schedule a meeting with your group</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowMeetingModal(false)}
              >
                ×
              </button>
            </div>
            <form className="student-form" onSubmit={saveMeeting}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Title</label>
                  <input
                    required
                    value={meetingForm.title}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Group</label>
                  <select
                    required
                    value={meetingForm.group}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        group: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select group</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={meetingForm.status}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={meetingForm.date}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    required
                    value={meetingForm.time}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    value={meetingForm.location}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Room / building"
                  />
                </div>
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    value={meetingForm.meetingLink}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        meetingLink: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Agenda / Description</label>
                  <textarea
                    rows={3}
                    value={meetingForm.description}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowMeetingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedGroup && (
        <div className="modal-overlay">
          <div className="student-modal group-modal view-group-modal">
            <div className="modal-header">
              <div>
                <h3>{selectedGroup.name}</h3>
                <p>
                  {selectedGroup.code} ·{" "}
                  {selectedGroup.department?.name || "N/A"}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedGroup(null)}
              >
                ×
              </button>
            </div>
            <div className="student-form">
              <div className="form-section">
                <div className="form-section-heading">
                  <h4 className="form-section-title">
                    Group members
                  </h4>
                  <span className="section-count">
                    {selectedGroup.members?.length || 0}
                  </span>
                </div>
                {(selectedGroup.members || []).length === 0 ? (
                  <div className="members-empty">
                    <p>No students in this group.</p>
                  </div>
                ) : (
                  <ul className="member-cards">
                    {selectedGroup.members.map((member) => (
                      <li key={member._id} className="member-card">
                        <div className="member-card-main">
                          <div
                            className="member-avatar"
                            aria-hidden="true"
                          >
                            {member.user?.name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>
                          <div className="member-meta">
                            <strong>
                              {member.user?.name || "N/A"}
                            </strong>
                            <small>
                              {member.studentId}
                              {member.user?.email
                                ? ` · ${member.user.email}`
                                : ""}
                            </small>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedGroup(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorDashboard;
