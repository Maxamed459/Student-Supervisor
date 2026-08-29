import { useEffect, useState } from "react";
import documentsService from "../services/documentsService";
import tasksService from "../services/tasksService";
import meetingsService from "../services/meetingsService";
import DocumentReviewViewer from "../components/DocumentReviewViewer";
import {
  documentStatusLabel,
  documentTypeLabel,
  formatDate,
  meetingStatusLabel,
  statusBadgeClass,
  taskStatusLabel,
} from "../utils/collaboration";

function AdminCollaboration() {
  const [tab, setTab] = useState("documents");
  const [documents, setDocuments] = useState([]);
  const [docStats, setDocStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [reviewDoc, setReviewDoc] = useState(null);
  const [reviewError, setReviewError] = useState("");

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [docsRes, docStatsRes, tasksRes, taskStatsRes, meetingsRes] =
        await Promise.all([
          documentsService.list(),
          documentsService.stats(),
          tasksService.list(),
          tasksService.stats(),
          meetingsService.list(),
        ]);

      setDocuments(docsRes.data.documents || []);
      setDocStats(docStatsRes.data.stats || docStatsRes.data.data);
      setTasks(tasksRes.data.tasks || []);
      setTaskStats(taskStatsRes.data.stats || taskStatsRes.data.data);
      setMeetings(meetingsRes.data.meetings || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to load collaboration data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const submitReview = async (reviewForm) => {
    if (!reviewDoc) return;

    try {
      setSaving(true);
      setReviewError("");
      await documentsService.review(reviewDoc._id, reviewForm);
      setReviewDoc(null);
      setMessage({ type: "success", text: "Review saved" });
      await loadAll();
    } catch (err) {
      setReviewError(
        err.response?.data?.message || "Failed to save review"
      );
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save review",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await documentsService.remove(id);
      setMessage({ type: "success", text: "Document deleted" });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete document",
      });
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

  const updateTaskStatus = async (id, status) => {
    try {
      await tasksService.update(id, { status });
      setMessage({ type: "success", text: "Task status updated" });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update task",
      });
    }
  };

  const updateMeetingStatus = async (id, status) => {
    try {
      await meetingsService.update(id, { status });
      setMessage({ type: "success", text: "Meeting updated" });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update meeting",
      });
    }
  };

  const deleteMeeting = async (id) => {
    if (!window.confirm("Delete this meeting?")) return;
    try {
      await meetingsService.remove(id);
      setMessage({ type: "success", text: "Meeting deleted" });
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete meeting",
      });
    }
  };

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h2>Collaboration</h2>
          <p>
            System-wide documents, tasks and meetings
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message.text && (
        <div
          className={`alert ${
            message.type === "success" ? "alert-success" : "alert-error"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <span>Pending Reviews</span>
            <strong>{docStats?.pendingReviews || 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <span>Approved Docs</span>
            <strong>{docStats?.approved || 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <span>Open Tasks</span>
            <strong>
              {(taskStats?.pending || 0) + (taskStats?.inProgress || 0)}
            </strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <span>Meetings</span>
            <strong>{meetings.length}</strong>
          </div>
        </div>
      </div>

      <div className="students-toolbar" style={{ marginTop: 8 }}>
        <div className="students-toolbar-filters">
          {["documents", "tasks", "meetings"].map((id) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "primary-btn" : "cancel-btn"}
              onClick={() => setTab(id)}
            >
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-card">
          {tab === "documents" && (
            documents.length === 0 ? (
              <div className="empty-state">
                <p>No documents in the system yet.</p>
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
                            {documentTypeLabel[doc.type] || doc.type}
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
                        <td>{doc.uploadedBy?.user?.name || "N/A"}</td>
                        <td>{formatDate(doc.createdAt)}</td>
                        <td>
                          <span className={statusBadgeClass(doc.status)}>
                            {documentStatusLabel[doc.status]}
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
                              onClick={() => {
                                setReviewDoc(doc);
                                setReviewError("");
                              }}
                            >
                              Open & Review
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => deleteDocument(doc._id)}
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
            )
          )}

          {tab === "tasks" && (
            tasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks in the system yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Student</th>
                      <th>Supervisor</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id}>
                        <td>{task.title}</td>
                        <td>{task.assignedTo?.user?.name || "N/A"}</td>
                        <td>{task.assignedBy?.user?.name || "N/A"}</td>
                        <td>{formatDate(task.dueDate)}</td>
                        <td>
                          <span className={statusBadgeClass(task.status)}>
                            {taskStatusLabel[task.status]}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                updateTaskStatus(task._id, e.target.value)
                              }
                              aria-label="Update task status"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">
                                In Progress
                              </option>
                              <option value="completed">Completed</option>
                            </select>
                            <button
                              className="delete-btn"
                              onClick={() => deleteTask(task._id)}
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
            )
          )}

          {tab === "meetings" && (
            meetings.length === 0 ? (
              <div className="empty-state">
                <p>No meetings in the system yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Supervisor</th>
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
                        <td>{meeting.createdBy?.user?.name || "N/A"}</td>
                        <td>{meeting.group?.name || "—"}</td>
                        <td>
                          {formatDate(meeting.date)} {meeting.time}
                        </td>
                        <td>
                          <span className={statusBadgeClass(meeting.status)}>
                            {meetingStatusLabel[meeting.status]}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <select
                              value={meeting.status}
                              onChange={(e) =>
                                updateMeetingStatus(
                                  meeting._id,
                                  e.target.value
                                )
                              }
                              aria-label="Update meeting status"
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              className="delete-btn"
                              onClick={() => deleteMeeting(meeting._id)}
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
            )
          )}
        </div>
      )}

      {reviewDoc && (
        <DocumentReviewViewer
          document={reviewDoc}
          saving={saving}
          errorMessage={reviewError}
          allowPendingStatus
          onClose={() => {
            setReviewDoc(null);
            setReviewError("");
          }}
          onSubmitReview={submitReview}
        />
      )}
    </div>
  );
}

export default AdminCollaboration;
