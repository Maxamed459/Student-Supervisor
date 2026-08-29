import { useEffect, useState } from "react";
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
import {
  documentStatusLabel,
  documentTypeLabel,
  downloadDocumentFile,
  formatDate,
  meetingStatusLabel,
  statusBadgeClass,
  taskStatusLabel,
} from "../utils/collaboration";

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

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [resubmitDoc, setResubmitDoc] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "thesis",
    file: null,
  });

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

  const isAssigned = Boolean(student?.supervisor);
  const upcomingMeetings = meetings.filter(
    (meeting) =>
      meeting.status === "scheduled" &&
      new Date(meeting.date) >= new Date(new Date().toDateString())
  );
  const openTasks = tasks.filter(
    (task) => task.status !== "completed"
  );

  const submitUpload = async (e) => {
    e.preventDefault();

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
      formData.append("title", uploadForm.title.trim());
      formData.append("type", uploadForm.type);
      formData.append("file", uploadForm.file);

      await documentsService.upload(formData);

      setShowUploadModal(false);
      setResubmitDoc(null);
      setUploadForm({ title: "", type: "thesis", file: null });
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
      setUploadForm({ title: "", type: "thesis", file: null });
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
    { id: "overview", label: "Overview" },
    { id: "documents", label: "My Documents" },
    { id: "tasks", label: "My Tasks" },
    { id: "meetings", label: "My Meetings" },
  ];

  return (
    <div className="role-layout">
      <aside className="admin-sidebar role-sidebar">
        <div className="sidebar-logo">
          <Logo light />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
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
                {item.id === "overview" ? (
                  <IconDashboard />
                ) : (
                  <IconGroups />
                )}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="user-avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div>
              <strong>{user?.name}</strong>
              <span>Student</span>
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
            <h1>Student Dashboard</h1>
            <p>
              Your documents, tasks, meetings and group information
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
                        <span>My Documents</span>
                        <strong>{documents.length}</strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-content">
                        <span>Open Tasks</span>
                        <strong>{openTasks.length}</strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-content">
                        <span>Upcoming Meetings</span>
                        <strong>{upcomingMeetings.length}</strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-content">
                        <span>My Group</span>
                        <strong>{group?.name || "None"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-panels">
                    <div className="dashboard-section">
                      <div className="section-header">
                        <h3>My Documents</h3>
                        <button
                          type="button"
                          className="section-link"
                          onClick={() => setTab("documents")}
                        >
                          View all
                        </button>
                      </div>
                      <div className="table-card">
                        {documents.length === 0 ? (
                          <div className="empty-state">
                            <p>No documents uploaded yet.</p>
                          </div>
                        ) : (
                          <ul className="simple-list">
                            {documents.slice(0, 4).map((doc) => (
                              <li key={doc._id}>
                                <span>
                                  <strong>{doc.title}</strong>
                                  <small className="text-muted">
                                    {" "}
                                    · {formatDate(doc.createdAt)}
                                  </small>
                                </span>
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
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="section-header">
                        <h3>My Tasks</h3>
                        <button
                          type="button"
                          className="section-link"
                          onClick={() => setTab("tasks")}
                        >
                          View all
                        </button>
                      </div>
                      <div className="table-card">
                        {tasks.length === 0 ? (
                          <div className="empty-state">
                            <p>No tasks assigned yet.</p>
                          </div>
                        ) : (
                          <ul className="simple-list">
                            {tasks.slice(0, 4).map((task) => (
                              <li key={task._id}>
                                <span>
                                  <strong>{task.title}</strong>
                                  <small className="text-muted">
                                    {" "}
                                    · Due {formatDate(task.dueDate)}
                                  </small>
                                </span>
                                <span
                                  className={statusBadgeClass(
                                    task.status
                                  )}
                                >
                                  {taskStatusLabel[task.status]}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-section">
                    <div className="section-header">
                      <h3>Upcoming Meetings</h3>
                      <button
                        type="button"
                        className="section-link"
                        onClick={() => setTab("meetings")}
                      >
                        View all
                      </button>
                    </div>
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
                              </tr>
                            </thead>
                            <tbody>
                              {upcomingMeetings
                                .slice(0, 5)
                                .map((meeting) => (
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
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-panels">
                    <div className="dashboard-section">
                      <h3>My Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span>Name</span>
                          <strong>
                            {student?.user?.name || user?.name}
                          </strong>
                        </div>
                        <div className="detail-item">
                          <span>Student ID</span>
                          <strong>
                            {student?.studentId || "N/A"}
                          </strong>
                        </div>
                        <div className="detail-item">
                          <span>Department</span>
                          <strong>
                            {student?.department?.name || "N/A"}
                          </strong>
                        </div>
                        <div className="detail-item">
                          <span>Group</span>
                          <strong>
                            {group?.name || "Not assigned"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <h3>My Supervisor</h3>
                      {!isAssigned ? (
                        <div className="overview-card">
                          <p>
                            You have not been assigned a supervisor
                            yet.
                          </p>
                        </div>
                      ) : (
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span>Name</span>
                            <strong>
                              {student.supervisor?.user?.name ||
                                group?.supervisor?.user?.name ||
                                "N/A"}
                            </strong>
                          </div>
                          <div className="detail-item">
                            <span>Email</span>
                            <strong>
                              {student.supervisor?.user?.email ||
                                group?.supervisor?.user?.email ||
                                "N/A"}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {tab === "documents" && (
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3>My Documents</h3>
                    <button
                      className="primary-btn"
                      onClick={() => {
                        setUploadForm({
                          title: "",
                          type: "thesis",
                          file: null,
                        });
                        setShowUploadModal(true);
                        setMessage({ type: "", text: "" });
                      }}
                    >
                      + Upload Document
                    </button>
                  </div>
                  <div className="table-card">
                    {documents.length === 0 ? (
                      <div className="empty-state">
                        <p>
                          Upload your thesis, proposal, reports and
                          other academic documents.
                        </p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Type</th>
                              <th>Uploaded</th>
                              <th>Status</th>
                              <th>Feedback</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((doc) => (
                              <tr key={doc._id}>
                                <td>{doc.title}</td>
                                <td>
                                  {documentTypeLabel[doc.type] ||
                                    doc.type}
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
                                  {doc.feedback || "—"}
                                  {doc.reviewedAt && (
                                    <small className="text-muted">
                                      {" "}
                                      · Reviewed{" "}
                                      {formatDate(doc.reviewedAt)}
                                    </small>
                                  )}
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button
                                      className="view-btn"
                                      onClick={() =>
                                        downloadDocumentFile(
                                          documentsService,
                                          doc._id,
                                          doc.originalName
                                        )
                                      }
                                    >
                                      Download
                                    </button>
                                    {(doc.status ===
                                      "changes_requested" ||
                                      doc.status ===
                                        "rejected") && (
                                      <button
                                        className="edit-btn"
                                        onClick={() => {
                                          setResubmitDoc(doc);
                                          setUploadForm({
                                            title: doc.title,
                                            type: doc.type,
                                            file: null,
                                          });
                                          setMessage({
                                            type: "",
                                            text: "",
                                          });
                                        }}
                                      >
                                        Resubmit
                                      </button>
                                    )}
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
                    <h3>My Tasks</h3>
                  </div>
                  <div className="table-card">
                    {tasks.length === 0 ? (
                      <div className="empty-state">
                        <p>
                          Tasks assigned by your supervisor will
                          appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table>
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
                </div>
              )}

              {tab === "meetings" && (
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3>My Meetings</h3>
                  </div>
                  <div className="table-card">
                    {meetings.length === 0 ? (
                      <div className="empty-state">
                        <p>
                          Meetings scheduled by your supervisor will
                          appear here.
                        </p>
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
                              <th>Agenda</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meetings.map((meeting) => (
                              <tr key={meeting._id}>
                                <td>{meeting.title}</td>
                                <td>
                                  {formatDate(meeting.date)}
                                </td>
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
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {showUploadModal && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>Upload Document</h3>
                <p>Submit academic work for supervisor review</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            <form className="student-form" onSubmit={submitUpload}>
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
                    placeholder="e.g. Thesis Chapter 1"
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
                  <label>File</label>
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
                  <small className="field-hint">
                    PDF, Word, PowerPoint, Excel, text or images up
                    to 15MB
                  </small>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
