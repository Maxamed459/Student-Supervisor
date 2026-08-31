import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
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
  taskAssignmentTypeLabel,
  getTaskAssignmentType,
  taskStatusLabel,
} from "../utils/collaboration";

const TABS = ["documents", "tasks", "meetings"];

const EMPTY_TASK = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  assignedBy: "",
  assignedTo: "",
  group: "",
  assignmentType: "single_student",
};

const EMPTY_MEETING = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  meetingLink: "",
  createdBy: "",
  group: "",
};

function AdminCollaboration() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "documents";

  const [tab, setTab] = useState(initialTab);
  const [documents, setDocuments] = useState([]);
  const [docStats, setDocStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [reviewDoc, setReviewDoc] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [meetingForm, setMeetingForm] = useState(EMPTY_MEETING);

  const changeTab = (id) => {
    setTab(id);
    setSearchParams(id === "documents" ? {} : { tab: id });
  };

  useEffect(() => {
    const next = searchParams.get("tab");
    if (TABS.includes(next) && next !== tab) {
      setTab(next);
    }
  }, [searchParams, tab]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        docsRes,
        docStatsRes,
        tasksRes,
        taskStatsRes,
        meetingsRes,
        studentsRes,
        supervisorsRes,
        groupsRes,
      ] = await Promise.all([
        documentsService.list(),
        documentsService.stats(),
        tasksService.list(),
        tasksService.stats(),
        meetingsService.list(),
        api.get("/students"),
        api.get("/supervisors"),
        api.get("/groups"),
      ]);

      setDocuments(docsRes.data.documents || []);
      setDocStats(docStatsRes.data.stats || docStatsRes.data.data);
      setTasks(tasksRes.data.tasks || []);
      setTaskStats(taskStatsRes.data.stats || taskStatsRes.data.data);
      setMeetings(meetingsRes.data.meetings || []);
      setStudents(studentsRes.data.students || []);
      setSupervisors(supervisorsRes.data.supervisors || []);
      setGroups(groupsRes.data.groups || []);
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

  const groupsForTask = useMemo(() => {
    if (!taskForm.assignedBy) return groups;
    return groups.filter((group) => {
      const supervisorId =
        group.supervisor?._id || group.supervisor || "";
      return supervisorId.toString() === taskForm.assignedBy.toString();
    });
  }, [groups, taskForm.assignedBy]);

  const studentsForTask = useMemo(() => {
    if (!taskForm.group) return [];
    const group = groups.find((g) => g._id === taskForm.group);
    if (!group?.members?.length) return [];
    const memberIds = new Set(
      group.members.map((m) => (m._id || m).toString())
    );
    return students.filter((s) => memberIds.has(s._id.toString()));
  }, [students, groups, taskForm.group]);

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

  const openCreateTask = () => {
    setTaskForm(EMPTY_TASK);
    setShowTaskModal(true);
    setMessage({ type: "", text: "" });
  };

  const openCreateMeeting = () => {
    setMeetingForm(EMPTY_MEETING);
    setShowMeetingModal(true);
    setMessage({ type: "", text: "" });
  };

  const submitTask = async (e) => {
    e.preventDefault();

    if (!taskForm.group) {
      setMessage({ type: "error", text: "Please select a group" });
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
      await tasksService.create({
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        assignedBy: taskForm.assignedBy,
        group: taskForm.group,
        assignmentType: taskForm.assignmentType,
        assignToGroup: isAllGroup,
        assignedTo: isAllGroup
          ? undefined
          : taskForm.assignedTo || undefined,
      });
      setShowTaskModal(false);
      setMessage({ type: "success", text: "Task created" });
      changeTab("tasks");
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create task",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitMeeting = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await meetingsService.create({
        title: meetingForm.title.trim(),
        description: meetingForm.description.trim(),
        date: meetingForm.date,
        time: meetingForm.time,
        location: meetingForm.location.trim(),
        meetingLink: meetingForm.meetingLink.trim(),
        createdBy: meetingForm.createdBy,
        group: meetingForm.group || undefined,
      });
      setShowMeetingModal(false);
      setMessage({ type: "success", text: "Meeting scheduled" });
      changeTab("meetings");
      await loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to schedule meeting",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h2>Collaboration</h2>
          <p>
            Manage documents, tasks and meetings across the system
          </p>
        </div>
        <div className="action-buttons">
          <button
            type="button"
            className="primary-btn"
            onClick={openCreateTask}
          >
            + Create Task
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={openCreateMeeting}
          >
            + Schedule Meeting
          </button>
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
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "primary-btn" : "cancel-btn"}
              onClick={() => changeTab(id)}
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
          {tab === "documents" &&
            (documents.length === 0 ? (
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
            ))}

          {tab === "tasks" &&
            (tasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Assigned Group</th>
                      <th>Assignment Type</th>
                      <th>Assigned Student</th>
                      <th>Supervisor</th>
                      <th>Due</th>
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
                            {taskAssignmentTypeLabel[type] || type}
                          </td>
                          <td>
                            {type === "all_group"
                              ? "All members"
                              : task.assignedTo?.user?.name || "N/A"}
                          </td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "meetings" &&
            (meetings.length === 0 ? (
              <div className="empty-state">
                <p>No meetings yet. Schedule one to get started.</p>
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
            ))}
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

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>Create Task</h3>
                <p>Assign work on behalf of a supervisor</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowTaskModal(false)}
              >
                ×
              </button>
            </div>
            <form className="student-form" onSubmit={submitTask}>
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
                  <label>Supervisor</label>
                  <select
                    required
                    value={taskForm.assignedBy}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        assignedBy: e.target.value,
                        group: "",
                        assignedTo: "",
                      }))
                    }
                  >
                    <option value="">Select supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor._id} value={supervisor._id}>
                        {supervisor.user?.name} ({supervisor.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Group</label>
                  <select
                    required
                    value={taskForm.group}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        group: e.target.value,
                        assignedTo: "",
                      }))
                    }
                  >
                    <option value="">Select group</option>
                    {groupsForTask.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name} ({group.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignment Type</label>
                  <select
                    required
                    value={taskForm.assignmentType}
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
                    <option value="single_student">Single Student</option>
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
                      {studentsForTask.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.user?.name} · {student.studentId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {taskForm.assignmentType === "all_group" &&
                  taskForm.group && (
                    <div className="form-group full-width">
                      <p className="field-hint">
                        Registers one task for the group. All{" "}
                        {studentsForTask.length} member
                        {studentsForTask.length === 1 ? "" : "s"} can
                        access it — no duplicate records.
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
                  {saving ? "Creating..." : "Create Task"}
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
                <h3>Schedule Meeting</h3>
                <p>Create a meeting for a group and supervisor</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowMeetingModal(false)}
              >
                ×
              </button>
            </div>
            <form className="student-form" onSubmit={submitMeeting}>
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
                  <label>Supervisor</label>
                  <select
                    required
                    value={meetingForm.createdBy}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        createdBy: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor._id} value={supervisor._id}>
                        {supervisor.user?.name} ({supervisor.employeeId})
                      </option>
                    ))}
                  </select>
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
                        {group.name} ({group.code})
                      </option>
                    ))}
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
                    placeholder="Optional"
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
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
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
                  {saving ? "Saving..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCollaboration;
