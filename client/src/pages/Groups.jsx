import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const EMPTY_FORM = {
  name: "",
  code: "",
  department: "",
  supervisor: "",
  projectTitle: "",
  description: "",
  status: "active",
};

function Groups() {
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);

  const [editingGroup, setEditingGroup] = useState(null);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [managingGroup, setManagingGroup] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [supervisorChoice, setSupervisorChoice] = useState("");

  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchAll = async ({ signal } = {}) => {
    try {
      setLoading(true);
      setLoadError("");

      const [groupsRes, departmentsRes, supervisorsRes, studentsRes] =
        await Promise.all([
          api.get("/groups", { signal }),
          api.get("/departments", { signal }),
          api.get("/supervisors", { signal }),
          api.get("/students", { signal }),
        ]);

      if (signal?.aborted) return;

      setGroups(groupsRes.data.groups || groupsRes.data.data || []);
      setDepartments(
        departmentsRes.data.departments || departmentsRes.data.data || []
      );
      setSupervisors(
        supervisorsRes.data.supervisors || supervisorsRes.data.data || []
      );
      setStudents(studentsRes.data.students || studentsRes.data.data || []);
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        return;
      }

      console.error(error);
      setGroups([]);
      setLoadError(
        error.response?.data?.message || "Failed to load groups."
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAll({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  const activeMemberIds = useMemo(() => {
    const ids = new Set();

    groups.forEach((group) => {
      if (group.status !== "active") return;

      (group.members || []).forEach((member) => {
        ids.add(member._id || member);
      });
    });

    return ids;
  }, [groups]);

  const supervisorsForDepartment = (departmentId) =>
    supervisors.filter((supervisor) => {
      const deptId =
        supervisor.department?._id || supervisor.department;
      return (
        deptId === departmentId &&
        supervisor.user?.isActive !== false
      );
    });

  const studentsForDepartment = (departmentId) =>
    students.filter((student) => {
      const deptId =
        student.department?._id || student.department;

      if (deptId !== departmentId) return false;

      const alreadyInThisGroup = (managingGroup?.members || []).some(
        (m) => (m._id || m) === student._id
      );

      if (alreadyInThisGroup) return false;

      if (activeMemberIds.has(student._id)) return false;

      return true;
    });

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setEditingGroup(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "department") {
        next.supervisor = "";
      }

      return next;
    });

    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.code.trim()) errors.code = "Code is required";
    if (!formData.department) errors.department = "Department is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    resetForm();
    setMessage({ type: "", text: "" });
    setShowFormModal(true);
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name || "",
      code: group.code || "",
      department: group.department?._id || group.department || "",
      supervisor: group.supervisor?._id || "",
      projectTitle: group.projectTitle || "",
      description: group.description || "",
      status: group.status || "active",
    });
    setFormErrors({});
    setMessage({ type: "", text: "" });
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      if (editingGroup) {
        await api.put(`/groups/${editingGroup._id}`, {
          name: formData.name.trim(),
          code: formData.code.trim(),
          department: formData.department,
          projectTitle: formData.projectTitle.trim(),
          description: formData.description.trim(),
          status: formData.status,
        });

        setMessage({
          type: "success",
          text: "Group updated successfully",
        });
      } else {
        await api.post("/groups", {
          name: formData.name.trim(),
          code: formData.code.trim(),
          department: formData.department,
          supervisor: formData.supervisor || undefined,
          projectTitle: formData.projectTitle.trim(),
          description: formData.description.trim(),
          status: formData.status,
        });

        setMessage({
          type: "success",
          text: "Group created successfully",
        });
      }

      setShowFormModal(false);
      resetForm();
      await fetchAll();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save group",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (group) => {
    try {
      const response = await api.get(`/groups/${group._id}`);
      setViewingGroup(response.data.group || response.data.data);
      setShowViewModal(true);
      setMessage({ type: "", text: "" });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to load group details",
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this group?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/groups/${id}`);
      setMessage({
        type: "success",
        text: "Group deleted successfully",
      });
      await fetchAll();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to delete group",
      });
    }
  };

  const handleOpenMembers = (group) => {
    setManagingGroup(group);
    setSelectedMemberIds([]);
    setMemberSearch("");
    setMessage({ type: "", text: "" });
    setShowMembersModal(true);
  };

  const handleAddMembers = async () => {
    if (!managingGroup || selectedMemberIds.length === 0) {
      setMessage({
        type: "error",
        text: "Select at least one student to add",
      });
      return;
    }

    try {
      setSaving(true);
      await api.post(`/groups/${managingGroup._id}/members`, {
        studentIds: selectedMemberIds,
      });

      setMessage({
        type: "success",
        text: "Students added to group",
      });
      setShowMembersModal(false);
      setManagingGroup(null);
      setSelectedMemberIds([]);
      await fetchAll();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to add members",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (groupId, studentId) => {
    const confirmed = window.confirm(
      "Remove this student from the group?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/groups/${groupId}/members/${studentId}`
      );
      setMessage({
        type: "success",
        text: "Student removed from group",
      });

      const response = await api.get(`/groups/${groupId}`);
      const updated = response.data.group || response.data.data;

      if (viewingGroup?._id === groupId) {
        setViewingGroup(updated);
      }

      if (managingGroup?._id === groupId) {
        setManagingGroup(updated);
      }

      await fetchAll();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to remove student",
      });
    }
  };

  const handleOpenSupervisor = (group) => {
    setManagingGroup(group);
    setSupervisorChoice(
      group.supervisor?._id || group.supervisor || ""
    );
    setMessage({ type: "", text: "" });
    setShowSupervisorModal(true);
  };

  const handleAssignSupervisor = async () => {
    if (!managingGroup || !supervisorChoice) {
      setMessage({
        type: "error",
        text: "Select a supervisor",
      });
      return;
    }

    try {
      setSaving(true);
      await api.put(
        `/groups/${managingGroup._id}/supervisor`,
        { supervisor: supervisorChoice }
      );

      setMessage({
        type: "success",
        text: "Supervisor assigned successfully",
      });
      setShowSupervisorModal(false);
      setManagingGroup(null);
      setSupervisorChoice("");
      await fetchAll();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to assign supervisor",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = groups.filter((group) => {
    const searchValue = search.toLowerCase().trim();
    const name = group.name?.toLowerCase() || "";
    const code = group.code?.toLowerCase() || "";
    const project = group.projectTitle?.toLowerCase() || "";
    const supervisorName =
      group.supervisor?.user?.name?.toLowerCase() || "";

    const matchesSearch =
      !searchValue ||
      name.includes(searchValue) ||
      code.includes(searchValue) ||
      project.includes(searchValue) ||
      supervisorName.includes(searchValue);

    const deptId =
      group.department?._id || group.department || "";
    const matchesDepartment =
      !departmentFilter || deptId === departmentFilter;

    const matchesStatus =
      statusFilter === "all" || group.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getEmptyMessage = () => {
    if (loadError) {
      return {
        title: "Failed to load groups",
        text: loadError,
      };
    }

    if (groups.length === 0) {
      return {
        title: "No student groups yet",
        text: "Create a group and assign a supervisor and members.",
      };
    }

    return {
      title: "No groups found",
      text: "There are no groups matching your search or filters.",
    };
  };

  const statusClass = (status) => {
    if (status === "active") return "badge badge-success";
    if (status === "inactive") return "badge badge-warning";
    return "badge badge-muted";
  };

  const createDeptId = formData.department;
  const manageDeptId =
    managingGroup?.department?._id || managingGroup?.department;

  const availableStudents = useMemo(() => {
    const searchValue = memberSearch.toLowerCase().trim();

    return studentsForDepartment(manageDeptId).filter((student) => {
      if (!searchValue) return true;

      const name = student.user?.name?.toLowerCase() || "";
      const email = student.user?.email?.toLowerCase() || "";
      const studentId = student.studentId?.toLowerCase() || "";

      return (
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        studentId.includes(searchValue)
      );
    });
  }, [
    students,
    groups,
    managingGroup,
    manageDeptId,
    memberSearch,
    activeMemberIds,
  ]);

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h2>Student Groups</h2>
          <p>
            Organize students into groups and assign supervisors
          </p>
        </div>

        <button className="primary-btn" onClick={handleOpenCreate}>
          + Create Group
        </button>
      </div>

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

      <div className="students-toolbar">
        <div className="students-toolbar-filters">
          <input
            type="text"
            placeholder="Search by name, code, project or supervisor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <span>{filteredGroups.length} groups</span>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading">Loading groups...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="empty-state">
            <h3>{getEmptyMessage().title}</h3>
            <p>{getEmptyMessage().text}</p>
            {loadError && (
              <button
                className="primary-btn"
                onClick={() => fetchAll()}
                style={{ marginTop: "16px" }}
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Supervisor</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <tr key={group._id}>
                    <td>{group.code}</td>
                    <td>
                      <div className="cell-stack">
                        <strong>{group.name}</strong>
                        {group.projectTitle && (
                          <small>{group.projectTitle}</small>
                        )}
                      </div>
                    </td>
                    <td>{group.department?.name || "N/A"}</td>
                    <td>
                      {group.supervisor?.user?.name || (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td>{group.members?.length || 0}</td>
                    <td>
                      <span className={statusClass(group.status)}>
                        {group.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => handleView(group)}
                        >
                          View
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => handleOpenEdit(group)}
                        >
                          Edit
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => handleOpenMembers(group)}
                        >
                          Members
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => handleOpenSupervisor(group)}
                        >
                          Supervisor
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(group._id)}
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

      {/* Create / Edit Group */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>
                  {editingGroup ? "Edit Group" : "Create Group"}
                </h3>
                <p>
                  {editingGroup
                    ? "Update group details and status"
                    : "Create a new student group"}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form className="student-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h4 className="form-section-title">Basic details</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Group Name</label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Thesis Group A"
                    />
                    {formErrors.name && (
                      <small className="field-error">
                        {formErrors.name}
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="code">Group Code</label>
                    <input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="e.g. CS-G01"
                    />
                    {formErrors.code && (
                      <small className="field-error">
                        {formErrors.code}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="form-section-title">Assignment</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      disabled={Boolean(editingGroup)}
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option
                          key={department._id}
                          value={department._id}
                        >
                          {department.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.department && (
                      <small className="field-error">
                        {formErrors.department}
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {!editingGroup && (
                    <div className="form-group full-width">
                      <label htmlFor="supervisor">
                        Supervisor (optional)
                      </label>
                      <select
                        id="supervisor"
                        name="supervisor"
                        value={formData.supervisor}
                        onChange={handleChange}
                        disabled={!createDeptId}
                      >
                        <option value="">
                          {createDeptId
                            ? "Select supervisor"
                            : "Select department first"}
                        </option>
                        {supervisorsForDepartment(
                          createDeptId
                        ).map((supervisor) => (
                          <option
                            key={supervisor._id}
                            value={supervisor._id}
                          >
                            {supervisor.user?.name} (
                            {supervisor.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h4 className="form-section-title">
                  Project information
                </h4>
                <div className="form-stack">
                  <div className="form-group">
                    <label htmlFor="projectTitle">
                      Project / Thesis Title
                    </label>
                    <input
                      id="projectTitle"
                      name="projectTitle"
                      value={formData.projectTitle}
                      onChange={handleChange}
                      placeholder="Optional project title"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Optional notes about the group"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingGroup
                      ? "Save Changes"
                      : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Group */}
      {showViewModal && viewingGroup && (
        <div className="modal-overlay">
          <div className="student-modal group-modal view-group-modal">
            <div className="modal-header">
              <div>
                <h3>{viewingGroup.name}</h3>
                <p>
                  {viewingGroup.code} ·{" "}
                  {viewingGroup.department?.name || "N/A"}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => {
                  setShowViewModal(false);
                  setViewingGroup(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="student-form">
              <div className="form-section">
                <h4 className="form-section-title">Overview</h4>
                <div className="view-meta-grid">
                  <div className="view-meta-item">
                    <span>Status</span>
                    <strong>
                      <span
                        className={statusClass(viewingGroup.status)}
                      >
                        {viewingGroup.status}
                      </span>
                    </strong>
                  </div>
                  <div className="view-meta-item">
                    <span>Members</span>
                    <strong>
                      {viewingGroup.members?.length || 0}
                    </strong>
                  </div>
                  <div className="view-meta-item">
                    <span>Supervisor</span>
                    <strong>
                      {viewingGroup.supervisor?.user?.name ||
                        "Unassigned"}
                    </strong>
                  </div>
                  <div className="view-meta-item">
                    <span>Supervisor Email</span>
                    <strong>
                      {viewingGroup.supervisor?.user?.email ||
                        "N/A"}
                    </strong>
                  </div>
                  <div className="view-meta-item full">
                    <span>Project / Thesis</span>
                    <strong>
                      {viewingGroup.projectTitle || "N/A"}
                    </strong>
                  </div>
                  <div className="view-meta-item full">
                    <span>Description</span>
                    <strong>
                      {viewingGroup.description || "N/A"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-heading">
                  <h4 className="form-section-title">
                    Group members
                  </h4>
                  <span className="section-count">
                    {viewingGroup.members?.length || 0}
                  </span>
                </div>

                {(viewingGroup.members || []).length === 0 ? (
                  <div className="members-empty">
                    <p>No students in this group yet.</p>
                  </div>
                ) : (
                  <ul className="member-cards">
                    {viewingGroup.members.map((member) => (
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
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            handleRemoveMember(
                              viewingGroup._id,
                              member._id
                            )
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingGroup(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members */}
      {showMembersModal && managingGroup && (
        <div className="modal-overlay">
          <div className="student-modal group-modal members-modal">
            <div className="modal-header">
              <div>
                <h3>Manage Members</h3>
                <p>
                  {managingGroup.name} ({managingGroup.code}) —{" "}
                  {managingGroup.department?.name || "Department"}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => {
                  setShowMembersModal(false);
                  setManagingGroup(null);
                  setMemberSearch("");
                }}
              >
                ×
              </button>
            </div>

            <div className="student-form">
              <div className="form-section">
                <div className="form-section-heading">
                  <h4 className="form-section-title">
                    Current members
                  </h4>
                  <span className="section-count">
                    {(managingGroup.members || []).length}
                  </span>
                </div>

                {(managingGroup.members || []).length === 0 ? (
                  <div className="members-empty">
                    <p>No students in this group yet.</p>
                  </div>
                ) : (
                  <ul className="member-cards">
                    {managingGroup.members.map((member) => (
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
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            handleRemoveMember(
                              managingGroup._id,
                              member._id
                            )
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="form-section">
                <div className="form-section-heading">
                  <h4 className="form-section-title">
                    Add students
                  </h4>
                  <span className="section-count">
                    {selectedMemberIds.length} selected
                  </span>
                </div>

                <p className="form-section-hint">
                  Only students in this department who are not
                  already in an active group are listed.
                </p>

                <div className="members-search">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) =>
                      setMemberSearch(e.target.value)
                    }
                    placeholder="Search available students..."
                    aria-label="Search available students"
                  />
                </div>

                <div className="checkbox-list members-picker">
                  {availableStudents.length === 0 ? (
                    <div className="members-empty compact">
                      <p>
                        {studentsForDepartment(manageDeptId)
                          .length === 0
                          ? "No eligible students in this department."
                          : "No students match your search."}
                      </p>
                    </div>
                  ) : (
                    availableStudents.map((student) => (
                      <label
                        key={student._id}
                        className={`checkbox-row member-option ${
                          selectedMemberIds.includes(student._id)
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(
                            student._id
                          )}
                          onChange={(e) => {
                            setSelectedMemberIds((prev) =>
                              e.target.checked
                                ? [...prev, student._id]
                                : prev.filter(
                                    (id) => id !== student._id
                                  )
                            );
                          }}
                        />
                        <div
                          className="member-avatar sm"
                          aria-hidden="true"
                        >
                          {student.user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "S"}
                        </div>
                        <div className="member-meta">
                          <strong>
                            {student.user?.name || "N/A"}
                          </strong>
                          <small>
                            {student.studentId}
                            {student.user?.email
                              ? ` · ${student.user.email}`
                              : ""}
                          </small>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowMembersModal(false);
                    setManagingGroup(null);
                    setMemberSearch("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={
                    saving || selectedMemberIds.length === 0
                  }
                  onClick={handleAddMembers}
                >
                  {saving
                    ? "Adding..."
                    : selectedMemberIds.length > 0
                      ? `Add ${selectedMemberIds.length} Selected`
                      : "Add Selected"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Supervisor */}
      {showSupervisorModal && managingGroup && (
        <div className="modal-overlay">
          <div className="student-modal group-modal">
            <div className="modal-header">
              <div>
                <h3>Assign Supervisor</h3>
                <p>
                  {managingGroup.name} ({managingGroup.code}) —{" "}
                  same department only
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => {
                  setShowSupervisorModal(false);
                  setManagingGroup(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="student-form">
              <div className="form-section">
                <h4 className="form-section-title">Supervisor</h4>
                <div className="form-group">
                  <label htmlFor="supervisorChoice">
                    Select supervisor
                  </label>
                  <select
                    id="supervisorChoice"
                    value={supervisorChoice}
                    onChange={(e) =>
                      setSupervisorChoice(e.target.value)
                    }
                  >
                    <option value="">Select supervisor</option>
                    {supervisorsForDepartment(manageDeptId).map(
                      (supervisor) => (
                        <option
                          key={supervisor._id}
                          value={supervisor._id}
                        >
                          {supervisor.user?.name} (
                          {supervisor.employeeId})
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowSupervisorModal(false);
                    setManagingGroup(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={saving}
                  onClick={handleAssignSupervisor}
                >
                  {saving ? "Saving..." : "Assign Supervisor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;
