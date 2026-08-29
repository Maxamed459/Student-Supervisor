import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  IconCheck,
  IconDepartments,
  IconGroups,
  IconSlots,
  IconStudents,
  IconSupervisors,
  IconUnassigned,
} from "../components/Icons";

function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    supervisors: 0,
    departments: 0,
    groups: 0,
    activeGroups: 0,
    assignedStudents: 0,
    unassignedStudents: 0,
    availableSlots: 0,
  });

  const [recentGroups, setRecentGroups] = useState([]);
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
          departmentsResponse,
          groupsResponse,
        ] = await Promise.all([
          api.get("/students"),
          api.get("/supervisors"),
          api.get("/departments"),
          api.get("/groups"),
        ]);

        const students =
          studentsResponse.data.students || [];
        const supervisors =
          supervisorsResponse.data.supervisors || [];
        const groups = groupsResponse.data.groups || [];

        const assignedStudents = students.filter(
          (student) => student.supervisor
        ).length;

        const activeGroups = groups.filter(
          (group) => group.status === "active"
        ).length;

        const availableSlots = supervisors.reduce(
          (total, supervisor) =>
            total + (supervisor.availableSlots || 0),
          0
        );

        setStats({
          students: students.length,
          supervisors: supervisors.length,
          departments:
            departmentsResponse.data.count || 0,
          groups: groups.length,
          activeGroups,
          assignedStudents,
          unassignedStudents:
            students.length - assignedStudents,
          availableSlots,
        });

        setRecentGroups(groups.slice(0, 5));
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

  const cards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: IconStudents,
    },
    {
      title: "Total Supervisors",
      value: stats.supervisors,
      icon: IconSupervisors,
    },
    {
      title: "Total Departments",
      value: stats.departments,
      icon: IconDepartments,
    },
    {
      title: "Student Groups",
      value: stats.groups,
      icon: IconGroups,
    },
    {
      title: "Active Groups",
      value: stats.activeGroups,
      icon: IconGroups,
    },
    {
      title: "Assigned Students",
      value: stats.assignedStudents,
      icon: IconCheck,
    },
    {
      title: "Unassigned Students",
      value: stats.unassignedStudents,
      icon: IconUnassigned,
    },
    {
      title: "Available Supervisor Slots",
      value: stats.availableSlots,
      icon: IconSlots,
    },
  ];

  return (
    <div className="dashboard">
      <div className="page-title">
        <h2>Dashboard</h2>
        <p>System overview and statistics</p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="stats-grid stats-grid-dense">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="stat-card" key={card.title}>
              <div className="stat-card-top">
                <span className="stat-icon">
                  <Icon size={18} />
                </span>
                <span>{card.title}</span>
              </div>

              <strong>
                {loading ? "..." : card.value}
              </strong>
            </div>
          );
        })}
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Recent Groups</h3>
            <Link
              to="/admin/groups"
              className="section-link"
            >
              View all
            </Link>
          </div>

          <div className="table-card">
            {loading ? (
              <div className="loading">
                Loading recent activity...
              </div>
            ) : recentGroups.length === 0 ? (
              <div className="empty-state">
                <h3>No groups yet</h3>
                <p>
                  Create a student group to get started.
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Group</th>
                      <th>Supervisor</th>
                      <th>Members</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGroups.map((group) => (
                      <tr key={group._id}>
                        <td>{group.name}</td>
                        <td>
                          {group.supervisor?.user?.name ||
                            "Unassigned"}
                        </td>
                        <td>
                          {group.members?.length || 0}
                        </td>
                        <td>
                          <span
                            className={`status status-${group.status}`}
                          >
                            {group.status}
                          </span>
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
            <h3>Quick Actions</h3>
          </div>

          <div className="quick-actions">
            <Link
              to="/admin/students"
              className="quick-action-card"
            >
              <strong>Manage Students</strong>
              <span>
                Add, edit and filter students
              </span>
            </Link>

            <Link
              to="/admin/supervisors"
              className="quick-action-card"
            >
              <strong>Manage Supervisors</strong>
              <span>
                Review capacity and assigned students
              </span>
            </Link>

            <Link
              to="/admin/groups"
              className="quick-action-card"
            >
              <strong>Manage Groups</strong>
              <span>
                Create groups and assign supervisors
              </span>
            </Link>

            <Link
              to="/admin/collaboration"
              className="quick-action-card"
            >
              <strong>Collaboration</strong>
              <span>
                Review documents, tasks and meetings
              </span>
            </Link>

            <Link
              to="/admin/departments"
              className="quick-action-card"
            >
              <strong>Departments</strong>
              <span>
                Organize academic departments
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
