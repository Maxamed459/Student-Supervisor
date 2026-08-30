import { useEffect, useState } from "react";
import api from "../services/api";

function Supervisors() {
  const [supervisors, setSupervisors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");
  const [capacityFilter, setCapacityFilter] =
    useState("all");

  const [showFormModal, setShowFormModal] =
    useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingSupervisor, setEditingSupervisor] =
    useState(null);
  const [viewingSupervisor, setViewingSupervisor] =
    useState(null);

  const [formErrors, setFormErrors] = useState({});

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    department: "",
    specialization: "",
    phone: "",
    maxStudents: 10,
  });

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await api.get("/supervisors");

      setSupervisors(
        response.data.supervisors || []
      );
    } catch (error) {
      console.error(error);

      setSupervisors([]);
      setLoadError(
        error.response?.data?.message ||
          "Failed to load supervisors."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");

      setDepartments(
        response.data.departments || []
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSupervisors();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "maxStudents"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      department: "",
      specialization: "",
      phone: "",
      maxStudents: 10,
    });

    setEditingSupervisor(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (
      !emailPattern.test(formData.email.trim())
    ) {
      errors.email = "Enter a valid email address";
    }

    if (!editingSupervisor) {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 6) {
        errors.password =
          "Password must be at least 6 characters";
      }
    }

    if (!formData.department) {
      errors.department = "Department is required";
    }

    const maxStudents = Number(formData.maxStudents);

    if (
      !Number.isInteger(maxStudents) ||
      maxStudents < 1
    ) {
      errors.maxStudents =
        "Maximum students must be a positive whole number";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const getCapacity = (supervisor) => {
    const current =
      supervisor.assignedStudentsCount || 0;
    const max = supervisor.maxStudents || 10;
    const available =
      supervisor.availableSlots ??
      Math.max(max - current, 0);

    return {
      current,
      max,
      available,
      percentage:
        max > 0
          ? Math.min(
              Math.round((current / max) * 100),
              100
            )
          : 0,
      isFull: current >= max,
    };
  };

  const handleAddSupervisor = () => {
    resetForm();
    setMessage({ type: "", text: "" });
    setShowFormModal(true);
  };

  const handleEdit = (supervisor) => {
    setEditingSupervisor(supervisor);

    setFormData({
      name: supervisor.user?.name || "",
      email: supervisor.user?.email || "",
      password: "",
      employeeId: supervisor.employeeId || "",
      department:
        supervisor.department?._id ||
        supervisor.department ||
        "",
      specialization:
        supervisor.specialization || "",
      phone: supervisor.phone || "",
      maxStudents: supervisor.maxStudents || 10,
    });

    setFormErrors({});
    setMessage({ type: "", text: "" });
    setShowFormModal(true);
  };

  const handleView = async (supervisor) => {
    setShowViewModal(true);
    setViewLoading(true);
    setViewingSupervisor(supervisor);

    try {
      const response = await api.get(
        `/supervisors/${supervisor._id}`
      );

      setViewingSupervisor(
        response.data.supervisor || supervisor
      );
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to load supervisor details",
      });
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      setMessage({
        type: "",
        text: "",
      });

      if (editingSupervisor) {
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department,
          specialization:
            formData.specialization.trim(),
          phone: formData.phone.trim(),
          maxStudents: Number(formData.maxStudents),
        };

        await api.put(
          `/supervisors/${editingSupervisor._id}`,
          updateData
        );

        setMessage({
          type: "success",
          text: "Supervisor updated successfully",
        });
      } else {
        await api.post("/supervisors", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          department: formData.department,
          specialization:
            formData.specialization.trim(),
          phone: formData.phone.trim(),
          maxStudents: Number(formData.maxStudents),
        });

        setMessage({
          type: "success",
          text: "Supervisor created successfully",
        });
      }

      setShowFormModal(false);
      resetForm();
      await fetchSupervisors();
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this supervisor?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/supervisors/${id}`);

      setMessage({
        type: "success",
        text: "Supervisor deleted successfully",
      });

      await fetchSupervisors();
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to delete supervisor",
      });
    }
  };

  const filteredSupervisors = supervisors.filter(
    (supervisor) => {
      const name =
        supervisor.user?.name?.toLowerCase() || "";
      const email =
        supervisor.user?.email?.toLowerCase() || "";
      const employeeId =
        supervisor.employeeId?.toLowerCase() || "";
      const specialization =
        supervisor.specialization?.toLowerCase() ||
        "";
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        employeeId.includes(searchValue) ||
        specialization.includes(searchValue);

      const supervisorDepartmentId =
        supervisor.department?._id ||
        supervisor.department ||
        "";

      const matchesDepartment =
        !departmentFilter ||
        supervisorDepartmentId === departmentFilter;

      const capacity = getCapacity(supervisor);

      const matchesCapacity =
        capacityFilter === "all" ||
        (capacityFilter === "available" &&
          !capacity.isFull) ||
        (capacityFilter === "full" &&
          capacity.isFull);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesCapacity
      );
    }
  );

  const getEmptyMessage = () => {
    if (loadError) {
      return {
        title: "Failed to load supervisors",
        text: loadError,
      };
    }

    if (supervisors.length === 0) {
      return {
        title: "No supervisors found",
        text: "Add your first supervisor to get started.",
      };
    }

    return {
      title: "No supervisors found",
      text: "There are no supervisors matching your search or filters.",
    };
  };

  const viewCapacity = viewingSupervisor
    ? getCapacity(viewingSupervisor)
    : null;

  return (
    <div className="supervisors-page">
      <div className="supervisors-header">
        <div>
          <h2>Supervisors</h2>
          <p>Manage all registered supervisors</p>
        </div>

        <button
          className="primary-btn"
          onClick={handleAddSupervisor}
        >
          + Add Supervisor
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

      <div className="supervisors-toolbar">
        <div className="supervisors-toolbar-filters">
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value)
            }
            aria-label="Filter by department"
          >
            <option value="">
              All departments
            </option>

            {departments.map((department) => (
              <option
                key={department._id}
                value={department._id}
              >
                {department.name}
              </option>
            ))}
          </select>

          <select
            value={capacityFilter}
            onChange={(e) =>
              setCapacityFilter(e.target.value)
            }
            aria-label="Filter by capacity"
          >
            <option value="all">
              All capacities
            </option>
            <option value="available">
              Available slots
            </option>
            <option value="full">
              Full capacity
            </option>
          </select>
        </div>

        <span>
          {filteredSupervisors.length} supervisors
        </span>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading">
            Loading supervisors...
          </div>
        ) : filteredSupervisors.length === 0 ? (
          <div className="empty-state">
            <h3>{getEmptyMessage().title}</h3>
            <p>{getEmptyMessage().text}</p>

            {loadError && (
              <button
                className="primary-btn"
                onClick={fetchSupervisors}
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
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSupervisors.map(
                  (supervisor) => {
                    const capacity =
                      getCapacity(supervisor);

                    return (
                      <tr key={supervisor._id}>
                        <td>
                          {supervisor.employeeId}
                        </td>

                        <td>
                          <div className="student-info">
                            <div className="supervisor-avatar">
                              {supervisor.user?.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <div>
                              <strong>
                                {supervisor.user
                                  ?.name || "N/A"}
                              </strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          {supervisor.user?.email ||
                            "N/A"}
                        </td>

                        <td>
                          {supervisor.department
                            ?.name || "N/A"}
                        </td>

                        <td>
                          <strong>
                            {capacity.current}
                          </strong>
                        </td>

                        <td>
                          <div className="capacity-wrapper">
                            <div className="capacity-text">
                              <strong>
                                {capacity.current}
                              </strong>
                              <span>
                                {" "}
                                / {capacity.max}
                              </span>
                            </div>

                            <div className="capacity-bar">
                              <div
                                className="capacity-fill"
                                style={{
                                  width: `${capacity.percentage}%`,
                                }}
                              />
                            </div>

                            <small className="capacity-slots">
                              Available slots:{" "}
                              {capacity.available}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              supervisor.user
                                ?.isActive
                                ? "status active"
                                : "status inactive"
                            }
                          >
                            {supervisor.user
                              ?.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              onClick={() =>
                                handleView(
                                  supervisor
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="edit-btn"
                              onClick={() =>
                                handleEdit(
                                  supervisor
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                handleDelete(
                                  supervisor._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}

      {showViewModal && viewingSupervisor && (
        <div
          className="modal-overlay"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="student-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Supervisor Details</h3>
                <p>
                  View capacity and assigned
                  students
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                ×
              </button>
            </div>

            <div className="student-details">
              {viewLoading ? (
                <div className="loading">
                  Loading supervisor details...
                </div>
              ) : (
                <>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Employee ID</span>
                      <strong>
                        {viewingSupervisor.employeeId ||
                          "N/A"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Name</span>
                      <strong>
                        {viewingSupervisor.user
                          ?.name || "N/A"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Email</span>
                      <strong>
                        {viewingSupervisor.user
                          ?.email || "N/A"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Phone</span>
                      <strong>
                        {viewingSupervisor.phone ||
                          "N/A"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Department</span>
                      <strong>
                        {viewingSupervisor.department
                          ?.name || "N/A"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Specialization</span>
                      <strong>
                        {viewingSupervisor.specialization ||
                          "N/A"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Account Status</span>
                      <strong>
                        {viewingSupervisor.user
                          ?.isActive
                          ? "Active"
                          : "Inactive"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Students</span>
                      <strong>
                        {viewCapacity.current} /{" "}
                        {viewCapacity.max}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Available Slots</span>
                      <strong>
                        {viewCapacity.available}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>Capacity</span>
                      <div className="capacity-wrapper detail-capacity">
                        <div className="capacity-bar">
                          <div
                            className="capacity-fill"
                            style={{
                              width: `${viewCapacity.percentage}%`,
                            }}
                          />
                        </div>
                        <small>
                          {viewCapacity.percentage}%
                          filled
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="assigned-students-section">
                    <h4>Assigned Students</h4>

                    {!viewingSupervisor.students ||
                    viewingSupervisor.students
                      .length === 0 ? (
                      <p className="assigned-empty">
                        No students currently
                        assigned.
                      </p>
                    ) : (
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Student ID</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Department</th>
                            </tr>
                          </thead>

                          <tbody>
                            {viewingSupervisor.students.map(
                              (student) => (
                                <tr
                                  key={student._id}
                                >
                                  <td>
                                    {student.studentId ||
                                      "N/A"}
                                  </td>
                                  <td>
                                    {student.user
                                      ?.name ||
                                      "N/A"}
                                  </td>
                                  <td>
                                    {student.user
                                      ?.email ||
                                      "N/A"}
                                  </td>
                                  <td>
                                    {student
                                      .department
                                      ?.name ||
                                      "N/A"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() =>
                        setShowViewModal(false)
                      }
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => {
                        setShowViewModal(false);
                        handleEdit(
                          viewingSupervisor
                        );
                      }}
                    >
                      Edit Supervisor
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {showFormModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowFormModal(false)}
        >
          <div
            className="student-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>
                  {editingSupervisor
                    ? "Edit Supervisor"
                    : "Add Supervisor"}
                </h3>

                <p>
                  {editingSupervisor
                    ? "Update supervisor information"
                    : "Create a new supervisor account"}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowFormModal(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="student-form"
              noValidate
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                  {formErrors.name && (
                    <small className="field-error">
                      {formErrors.name}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="supervisor@example.com"
                  />
                  {formErrors.email && (
                    <small className="field-error">
                      {formErrors.email}
                    </small>
                  )}
                </div>

                {!editingSupervisor && (
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                    />
                    {formErrors.password && (
                      <small className="field-error">
                        {formErrors.password}
                      </small>
                    )}
                  </div>
                )}

                {editingSupervisor ? (
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      value={editingSupervisor.employeeId || ""}
                      readOnly
                    />
                    <small className="field-hint">
                      Auto-generated by the system
                    </small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      value="Generated automatically"
                      readOnly
                    />
                    <small className="field-hint">
                      Assigned when the supervisor is created
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={department._id}
                          value={department._id}
                        >
                          {department.name}
                        </option>
                      )
                    )}
                  </select>
                  {formErrors.department && (
                    <small className="field-error">
                      {formErrors.department}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Software Engineering"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0612345678"
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Students</label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleChange}
                    min="1"
                    max="100"
                  />
                  {formErrors.maxStudents && (
                    <small className="field-error">
                      {formErrors.maxStudents}
                    </small>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowFormModal(false)
                  }
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
                    : editingSupervisor
                    ? "Update Supervisor"
                    : "Create Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Supervisors;
