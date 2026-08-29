import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import {
  IconDashboard,
  IconGroups,
  IconLogout,
  IconUser,
} from "../components/Icons";
import documentsService from "../services/documentsService";
import tasksService from "../services/tasksService";
import meetingsService from "../services/meetingsService";
import api from "../services/api";
import DocumentReviewViewer from "../components/DocumentReviewViewer";
import {
  documentStatusLabel,
  documentTypeLabel,
  formatDate,
  meetingStatusLabel,
  statusBadgeClass,
  taskStatusLabel,
} from "../utils/collaboration";

const EMPTY_TASK = {
  title: "",
  description: "",
  dueDate: "",
  assignedTo: "",
  group: "",
  priority: "medium",
  assignToGroup: false,
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
  const upcomingMeetings = meetings.filter(
    (meeting) =>
      meeting.status === "scheduled" &&
      new Date(meeting.date) >= new Date(new Date().toDateString())
  );

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
            assignToGroup: false,
          }
        : EMPTY_TASK
    );
    setShowTaskModal(true);
    setMessage({ type: "", text: "" });
  };

  const saveTask = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        group: taskForm.group || undefined,
        assignedTo: taskForm.assignToGroup
          ? undefined
          : taskForm.assignedTo || undefined,
        assignToGroup: Boolean(taskForm.assignToGroup),
      };

      if (editingTask) {
        await tasksService.update(editingTask._id, {
          ...payload,
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
    { id: "overview", label: "Overview", icon: IconDashboard },
    { id: "documents", label: "Documents", icon: IconGroups },
    { id: "tasks", label: "Tasks", icon: IconGroups },
    { id: "meetings", label: "Meetings", icon: IconGroups },
  ];

  return (
    <div className="role-layout">
      <aside className="admin-sidebar role-sidebar">
        <div className="sidebar-logo">
          <Logo light />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={
                  tab === item.id
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
                onClick={() => setTab(item.id)}
              >
                <span className="sidebar-link-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="user-avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div>
              <strong>{user?.name}</strong>
              <span>Supervisor</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <IconLogout size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main role-main">
        <header className="admin-header">
          <div>
            <h1>Supervisor Dashboard</h1>
            <p>
              Groups, document reviews, tasks and meetings
            </p>
          </div>
          <div className="header-user">
            <IconUser size={16} />
            <span>{user?.name}</span>
          </div>
        </header>

        <section className="admin-content">
          {error && (
            <div className="alert alert-error">{error}</div>
          )}

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
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-card-content">
                        <span>Pending Reviews</span>
                        <strong>
                          {docStats?.pendingReviews || 0}
                        </strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-content">
                        <span>Approved Documents</span>
                        <strong>{docStats?.approved || 0}</strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-content">
                        <span>Rejected Documents</span>
                        <strong>{docStats?.rejected || 0}</strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-content">
                        <span>Group Members</span>
                        <strong>{memberCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-section">
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
                        Unique students across your groups · Available
                        slots: {availableSlots}
                      </small>
                    </div>
                  </div>

                  <div className="dashboard-panels">
                    <div className="dashboard-section">
                      <div className="section-header">
                        <h3>Pending Reviews</h3>
                        <button
                          type="button"
                          className="section-link"
                          onClick={() => setTab("documents")}
                        >
                          View all
                        </button>
                      </div>
                      <div className="table-card">
                        {pendingDocs.length === 0 ? (
                          <div className="empty-state">
                            <p>No documents waiting for review.</p>
                          </div>
                        ) : (
                          <div className="table-wrapper">
                            <table>
                              <thead>
                                <tr>
                                  <th>Document</th>
                                  <th>Group</th>
                                  <th>Student</th>
                                  <th>Upload Date</th>
                                  <th>Status</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {pendingDocs
                                  .slice(0, 5)
                                  .map((doc) => (
                                    <tr key={doc._id}>
                                      <td>
                                        <strong>{doc.title}</strong>
                                        <div className="text-muted">
                                          {documentTypeLabel[
                                            doc.type
                                          ] || doc.type}
                                        </div>
                                      </td>
                                      <td>
                                        {doc.group?.name || "N/A"}
                                        {doc.group?.code
                                          ? ` (${doc.group.code})`
                                          : ""}
                                      </td>
                                      <td>
                                        {doc.uploadedBy?.user
                                          ?.name || "N/A"}
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
                                      <td>
                                        <button
                                          className="edit-btn"
                                          onClick={() =>
                                            openReview(doc)
                                          }
                                        >
                                          Open & Review
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="section-header">
                        <h3>Approved Documents</h3>
                      </div>
                      <div className="table-card">
                        {approvedDocs.length === 0 ? (
                          <div className="empty-state">
                            <p>No approved documents yet.</p>
                          </div>
                        ) : (
                          <ul className="simple-list">
                            {approvedDocs.slice(0, 5).map((doc) => (
                              <li key={doc._id}>
                                <span>
                                  <strong>{doc.title}</strong>
                                  <small className="text-muted">
                                    {" "}
                                    ·{" "}
                                    {doc.uploadedBy?.user?.name}
                                  </small>
                                </span>
                                <span
                                  className={statusBadgeClass(
                                    "approved"
                                  )}
                                >
                                  Approved
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-section">
                    <h3>My Student Groups</h3>
                    <div className="table-card">
                      {groups.length === 0 ? (
                        <div className="empty-state">
                          <p>No groups assigned yet.</p>
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table>
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Members</th>
                                <th>Status</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {groups.map((group) => (
                                <tr key={group._id}>
                                  <td>{group.code}</td>
                                  <td>{group.name}</td>
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
                                      className="view-btn"
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
                  </div>
                </>
              )}

              {tab === "documents" && (
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3>Document Reviews</h3>
                  </div>
                  <div className="table-card">
                    {documents.length === 0 ? (
                      <div className="empty-state">
                        <p>
                          No documents from your group students yet.
                        </p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table>
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
                            {documents.map((doc) => (
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
                                      className="edit-btn"
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
                </div>
              )}

              {tab === "tasks" && (
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3>Tasks</h3>
                    <button
                      className="primary-btn"
                      onClick={() => openTaskModal()}
                    >
                      + Create Task
                    </button>
                  </div>
                  <div className="table-card">
                    {tasks.length === 0 ? (
                      <div className="empty-state">
                        <p>
                          No tasks yet. Create one for your group
                          students.
                        </p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Student</th>
                              <th>Due</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((task) => (
                              <tr key={task._id}>
                                <td>{task.title}</td>
                                <td>
                                  {task.assignedTo?.user?.name ||
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
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "meetings" && (
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3>Meetings</h3>
                    <button
                      className="primary-btn"
                      onClick={() => openMeetingModal()}
                    >
                      + Create Meeting
                    </button>
                  </div>

                  <div className="dashboard-section">
                    <h4>Upcoming</h4>
                    <div className="table-card">
                      {upcomingMeetings.length === 0 ? (
                        <div className="empty-state">
                          <p>No upcoming meetings.</p>
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table>
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
                  </div>

                  <div className="dashboard-section">
                    <h4>All Meetings</h4>
                    <div className="table-card">
                      {meetings.length === 0 ? (
                        <div className="empty-state">
                          <p>No meetings created yet.</p>
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table>
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
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

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
                <p>Assign work to a student in your groups</p>
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
                    value={taskForm.group}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        group: e.target.value,
                        assignedTo: "",
                        assignToGroup: false,
                      }))
                    }
                    required={taskForm.assignToGroup}
                  >
                    <option value="">Select group (optional)</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignment Target</label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={taskForm.assignToGroup}
                      disabled={!taskForm.group || Boolean(editingTask)}
                      onChange={(e) =>
                        setTaskForm((prev) => ({
                          ...prev,
                          assignToGroup: e.target.checked,
                          assignedTo: e.target.checked
                            ? ""
                            : prev.assignedTo,
                        }))
                      }
                    />
                    <span>Assign to entire group</span>
                  </label>
                </div>
                {!taskForm.assignToGroup && (
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
