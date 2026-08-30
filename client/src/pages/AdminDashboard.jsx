import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import documentsService from "../services/documentsService";
import tasksService from "../services/tasksService";
import meetingsService from "../services/meetingsService";
import {
  IconDepartments,
  IconDocuments,
  IconGroups,
  IconMeetings,
  IconStudents,
  IconSupervisors,
  IconTasks,
} from "../components/Icons";

const STATUS_META = [
  { key: "inProgress", label: "In Progress", color: "#2170E4" },
  { key: "submitted", label: "Submitted", color: "#0F766E" },
  { key: "completed", label: "Completed", color: "#001E40" },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function StatusBarChart({ counts }) {
  const values = STATUS_META.map((item) => counts[item.key] || 0);
  const total = values.reduce((sum, n) => sum + n, 0);
  const maxValue = Math.max(...values, 0);
  const yMax =
    maxValue === 0
      ? 4
      : Math.max(4, Math.ceil(maxValue / 4) * 4);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(yMax * t)
  );

  const width = 560;
  const height = 280;
  const pad = { top: 28, right: 20, bottom: 42, left: 44 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const barGap = 36;
  const barWidth = Math.min(
    64,
    (chartW - barGap * (STATUS_META.length - 1)) / STATUS_META.length
  );
  const totalBarsWidth =
    barWidth * STATUS_META.length + barGap * (STATUS_META.length - 1);
  const startX = pad.left + (chartW - totalBarsWidth) / 2;

  if (total === 0) {
    return (
      <div className="admin-chart-empty">
        <div className="admin-chart-empty-icon" aria-hidden="true">
          <IconTasks size={22} />
        </div>
        <strong>No project activity yet</strong>
        <p>
          Status bars will appear here once students submit work and
          supervisors create tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="status-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="status-chart-svg"
        role="img"
        aria-label="Project status distribution chart"
      >
        {ticks.map((tick) => {
          const y = pad.top + chartH - (tick / yMax) * chartH;
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                className="status-chart-grid"
              />
              <text
                x={pad.left - 10}
                y={y + 4}
                textAnchor="end"
                className="status-chart-tick"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {STATUS_META.map((item, index) => {
          const value = counts[item.key] || 0;
          const barH = yMax === 0 ? 0 : (value / yMax) * chartH;
          const x = startX + index * (barWidth + barGap);
          const y = pad.top + chartH - barH;

          return (
            <g key={item.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, value > 0 ? 4 : 0)}
                rx="8"
                fill={item.color}
              />
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className="status-chart-value"
              >
                {value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 14}
                textAnchor="middle"
                className="status-chart-label"
              >
                {item.label}
              </text>
              <title>
                {item.label}: {value}
              </title>
            </g>
          );
        })}
      </svg>

      <div className="status-chart-legend">
        {STATUS_META.map((item) => (
          <div key={item.key} className="status-chart-legend-item">
            <span style={{ background: item.color }} />
            {item.label}
            <em>{formatNumber(counts[item.key] || 0)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    supervisors: 0,
    groups: 0,
    departments: 0,
    assignedStudents: 0,
    assignedGroups: 0,
    unassignedGroups: 0,
    pendingReviews: 0,
    openTasks: 0,
    meetings: 0,
  });
  const [projectStatus, setProjectStatus] = useState({
    inProgress: 0,
    submitted: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          studentsResponse,
          supervisorsResponse,
          groupsResponse,
          departmentsResponse,
          docStatsRes,
          taskStatsRes,
          meetingsRes,
        ] = await Promise.all([
          api.get("/students"),
          api.get("/supervisors"),
          api.get("/groups"),
          api.get("/departments"),
          documentsService.stats(),
          tasksService.stats(),
          meetingsService.list(),
        ]);

        const students = studentsResponse.data.students || [];
        const supervisors =
          supervisorsResponse.data.supervisors || [];
        const groups = groupsResponse.data.groups || [];
        const departments =
          departmentsResponse.data.departments ||
          departmentsResponse.data.data ||
          [];
        const docStats =
          docStatsRes.data.stats || docStatsRes.data.data || {};
        const taskStats =
          taskStatsRes.data.stats || taskStatsRes.data.data || {};
        const meetings =
          meetingsRes.data.meetings || meetingsRes.data.data || [];

        const assignedGroups = groups.filter(
          (group) => group.supervisor
        ).length;
        const assignedStudents = students.filter(
          (student) => student.supervisor
        ).length;

        setStats({
          students: students.length,
          supervisors: supervisors.length,
          groups: groups.length,
          departments: departments.length,
          assignedStudents,
          assignedGroups,
          unassignedGroups: groups.length - assignedGroups,
          pendingReviews: docStats.pendingReviews || 0,
          openTasks:
            (taskStats.pending || 0) + (taskStats.inProgress || 0),
          meetings: meetings.filter((m) => m.status === "scheduled")
            .length,
        });

        setProjectStatus({
          inProgress:
            (taskStats.inProgress || 0) + (taskStats.pending || 0),
          submitted: docStats.pendingReviews || 0,
          completed:
            (docStats.approved || 0) + (taskStats.completed || 0),
        });
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            "Failed to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const studentRatio = useMemo(() => {
    if (!stats.supervisors) return null;
    return Math.max(
      1,
      Math.round(stats.students / stats.supervisors)
    );
  }, [stats.students, stats.supervisors]);

  const assignedPct = useMemo(() => {
    if (!stats.groups) return 0;
    return Math.round((stats.assignedGroups / stats.groups) * 100);
  }, [stats.assignedGroups, stats.groups]);

  const coveragePct = useMemo(() => {
    if (!stats.students) return 0;
    return Math.round(
      (stats.assignedStudents / stats.students) * 100
    );
  }, [stats.assignedStudents, stats.students]);

  const termLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    []
  );

  const quickActions = [
    {
      to: "/admin/students",
      title: "Manage Students",
      text: "Add, edit, and assign students",
      icon: IconStudents,
    },
    {
      to: "/admin/supervisors",
      title: "Manage Supervisors",
      text: "Review capacity and workload",
      icon: IconSupervisors,
    },
    {
      to: "/admin/groups",
      title: "Manage Groups",
      text: "Create groups and assign leads",
      icon: IconGroups,
    },
    {
      to: "/admin/collaboration",
      title: "Review Documents",
      text: "Monitor all student submissions",
      icon: IconDocuments,
    },
  ];

  return (
    <div className="dashboard admin-home">
      <div className="admin-overview-head">
        <div>
          <h2>Overview</h2>
          <p>
            Platform health for {termLabel} — students, supervisors,
            and project activity at a glance.
          </p>
        </div>
        <div className="admin-overview-meta">
          <span className="admin-live-pill">
            <i /> Live metrics
          </span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-metric-grid">
        <article className="admin-metric-card">
          <div className="admin-metric-top">
            <span>Total Students</span>
            <span className="admin-metric-icon students">
              <IconStudents size={18} />
            </span>
          </div>
          <strong>
            {loading ? "…" : formatNumber(stats.students)}
          </strong>
          <small className="admin-metric-trend">
            {loading
              ? "Loading…"
              : `${formatNumber(stats.assignedStudents)} assigned · ${coveragePct}% coverage`}
          </small>
          <div className="admin-metric-progress soft">
            <span style={{ width: `${loading ? 0 : coveragePct}%` }} />
          </div>
        </article>

        <article className="admin-metric-card">
          <div className="admin-metric-top">
            <span>Total Supervisors</span>
            <span className="admin-metric-icon supervisors">
              <IconSupervisors size={18} />
            </span>
          </div>
          <strong>
            {loading ? "…" : formatNumber(stats.supervisors)}
          </strong>
          <small>
            {loading
              ? "Loading…"
              : studentRatio
                ? `Avg. ${studentRatio} students per supervisor`
                : "No supervisors yet"}
          </small>
          <div className="admin-metric-foot">
            <span>
              {loading ? "…" : formatNumber(stats.departments)}{" "}
              departments
            </span>
          </div>
        </article>

        <article className="admin-metric-card">
          <div className="admin-metric-top">
            <span>Student Groups</span>
            <span className="admin-metric-icon groups">
              <IconGroups size={18} />
            </span>
          </div>
          <strong>
            {loading ? "…" : formatNumber(stats.groups)}
            {!loading && <em> total</em>}
          </strong>
          <div className="admin-metric-split">
            <span>
              Assigned ({loading ? "…" : stats.assignedGroups})
            </span>
            <span>
              Unassigned ({loading ? "…" : stats.unassignedGroups})
            </span>
          </div>
          <div className="admin-metric-progress">
            <span style={{ width: `${loading ? 0 : assignedPct}%` }} />
          </div>
        </article>
      </div>

      <div className="admin-activity-strip">
        <div className="admin-activity-item">
          <span className="admin-activity-icon docs">
            <IconDocuments size={16} />
          </span>
          <div>
            <strong>
              {loading ? "…" : formatNumber(stats.pendingReviews)}
            </strong>
            <small>Pending reviews</small>
          </div>
        </div>
        <div className="admin-activity-item">
          <span className="admin-activity-icon tasks">
            <IconTasks size={16} />
          </span>
          <div>
            <strong>
              {loading ? "…" : formatNumber(stats.openTasks)}
            </strong>
            <small>Open tasks</small>
          </div>
        </div>
        <div className="admin-activity-item">
          <span className="admin-activity-icon meetings">
            <IconMeetings size={16} />
          </span>
          <div>
            <strong>
              {loading ? "…" : formatNumber(stats.meetings)}
            </strong>
            <small>Scheduled meetings</small>
          </div>
        </div>
        <div className="admin-activity-item">
          <span className="admin-activity-icon depts">
            <IconDepartments size={16} />
          </span>
          <div>
            <strong>
              {loading ? "…" : formatNumber(stats.departments)}
            </strong>
            <small>Departments</small>
          </div>
        </div>
      </div>

      <div className="dashboard-panels admin-home-panels">
        <div className="dashboard-section">
          <div className="admin-chart-card">
            <div className="admin-chart-head">
              <div>
                <h3>Project Status Distribution</h3>
                <p>Tasks in progress, pending submissions, and completed work</p>
              </div>
            </div>
            {loading ? (
              <div className="loading">Loading project status…</div>
            ) : (
              <StatusBarChart counts={projectStatus} />
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="admin-actions-card">
            <div className="admin-chart-head">
              <div>
                <h3>Quick Actions</h3>
                <p>Jump to everyday admin workflows</p>
              </div>
            </div>
            <div className="admin-quick-grid">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="admin-quick-card"
                  >
                    <span className="admin-quick-icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <strong>{action.title}</strong>
                      <span>{action.text}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
