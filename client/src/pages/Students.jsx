import { useEffect, useState } from "react";
import api from "../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");
  const [assignmentFilter, setAssignmentFilter] =
    useState("all");

  const [showFormModal, setShowFormModal] =
    useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);
  const [viewingStudent, setViewingStudent] =
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
    studentId: "",
    department: "",
    phone: "",
    level: "",
    academicYear: "",
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await api.get("/students");

      setStudents(response.data.students || []);
    } catch (error) {
      console.error(error);

      setStudents([]);
      setLoadError(
        error.response?.data?.message ||
          "Failed to load students."
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
    fetchStudents();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      studentId: "",
      department: "",
      phone: "",
      level: "",
      academicYear: "",
    });

    setEditingStudent(null);
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
    } else if (!emailPattern.test(formData.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (!editingStudent) {
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

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleAddStudent = () => {
    resetForm();
    setMessage({ type: "", text: "" });
    setShowFormModal(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);

    setFormData({
      name: student.user?.name || "",
      email: student.user?.email || "",
      password: "",
      studentId: student.studentId || "",
      department:
        student.department?._id ||
        student.department ||
        "",
      phone: student.phone || "",
      level: student.level || "",
      academicYear: student.academicYear || "",
    });

    setFormErrors({});
    setMessage({ type: "", text: "" });
    setShowFormModal(true);
  };

  const handleView = (student) => {
    setViewingStudent(student);
    setShowViewModal(true);
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

      if (editingStudent) {
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department,
          phone: formData.phone.trim(),
          level: formData.level.trim(),
          academicYear: formData.academicYear.trim(),
        };

        await api.put(
          `/students/${editingStudent._id}`,
          updateData
        );

        setMessage({
          type: "success",
          text: "Student updated successfully",
        });
      } else {
        await api.post("/students", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          department: formData.department,
          phone: formData.phone.trim(),
          level: formData.level.trim(),
          academicYear: formData.academicYear.trim(),
        });

        setMessage({
          type: "success",
          text: "Student created successfully",
        });
      }

      setShowFormModal(false);
      resetForm();
      await fetchStudents();
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
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/students/${id}`);

      setMessage({
        type: "success",
        text: "Student deleted successfully",
      });

      await fetchStudents();
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to delete student",
      });
    }
  };

  const isAssigned = (student) =>
    Boolean(student.supervisor);

  const getSupervisorName = (student) =>
    student.supervisor?.user?.name ||
    "Unassigned";

  const filteredStudents = students.filter(
    (student) => {
      const name =
        student.user?.name?.toLowerCase() || "";
      const email =
        student.user?.email?.toLowerCase() || "";
      const studentId =
        student.studentId?.toLowerCase() || "";
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        studentId.includes(searchValue);

      const studentDepartmentId =
        student.department?._id ||
        student.department ||
        "";

      const matchesDepartment =
        !departmentFilter ||
        studentDepartmentId === departmentFilter;

      const assigned = isAssigned(student);

      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" &&
          assigned) ||
        (assignmentFilter === "unassigned" &&
          !assigned);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesAssignment
      );
    }
  );

  const getEmptyMessage = () => {
    if (loadError) {
      return {
        title: "Failed to load students",
        text: loadError,
      };
    }

    if (students.length === 0) {
      return {
        title: "No students found",
        text: "Add your first student to get started.",
      };
    }

    return {
      title: "No students found",
      text: "There are no students matching your search or filters.",
    };
  };

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h2>Students</h2>
          <p>Manage all registered students</p>
        </div>

        <button
          className="primary-btn"
          onClick={handleAddStudent}
        >
          + Add Student
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
            placeholder="Search by name, email or student ID..."
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
            value={assignmentFilter}
            onChange={(e) =>
              setAssignmentFilter(e.target.value)
            }
            aria-label="Filter by assignment status"
          >
            <option value="all">
              All assignment statuses
            </option>
            <option value="assigned">
              Assigned
            </option>
            <option value="unassigned">
              Unassigned
            </option>
          </select>
        </div>

        <span>
          {filteredStudents.length} students
        </span>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading">
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <h3>{getEmptyMessage().title}</h3>
            <p>{getEmptyMessage().text}</p>

            {loadError && (
              <button
                className="primary-btn"
                onClick={fetchStudents}
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
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Supervisor</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.studentId}</td>

                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "S"}
                        </div>

                        <div>
                          <strong>
                            {student.user?.name ||
                              "N/A"}
                          </strong>
                        </div>
                      </div>
                    </td>

                    <td>
                      {student.user?.email || "N/A"}
                    </td>

                    <td>
                      {student.department?.name ||
                        "N/A"}
                    </td>

                    <td>
                      {getSupervisorName(student)}
                    </td>

                    <td>
                      <span
                        className={
                          isAssigned(student)
                            ? "status assigned"
                            : "status unassigned"
                        }
                      >
                        {isAssigned(student)
                          ? "Assigned"
                          : "Unassigned"}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() =>
                            handleView(student)
                          }
                        >
                          View
                        </button>

                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEdit(student)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDelete(
                              student._id
                            )
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

      {/* VIEW DETAILS MODAL */}

      {showViewModal && viewingStudent && (
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
                <h3>Student Details</h3>
                <p>
                  View student and assignment
                  information
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
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Student ID</span>
                  <strong>
                    {viewingStudent.studentId ||
                      "N/A"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Name</span>
                  <strong>
                    {viewingStudent.user?.name ||
                      "N/A"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Email</span>
                  <strong>
                    {viewingStudent.user?.email ||
                      "N/A"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Phone</span>
                  <strong>
                    {viewingStudent.phone || "N/A"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Department</span>
                  <strong>
                    {viewingStudent.department
                      ?.name || "N/A"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Level</span>
                  <strong>
                    {viewingStudent.level || "N/A"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Academic Year</span>
                  <strong>
                    {viewingStudent.academicYear ||
                      "N/A"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Account Status</span>
                  <strong>
                    {viewingStudent.user?.isActive
                      ? "Active"
                      : "Inactive"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Assignment Status</span>
                  <strong>
                    {isAssigned(viewingStudent)
                      ? "Assigned"
                      : "Unassigned"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Supervisor</span>
                  <strong>
                    {getSupervisorName(
                      viewingStudent
                    )}
                  </strong>
                </div>

                {viewingStudent.supervisor && (
                  <>
                    <div className="detail-item">
                      <span>
                        Supervisor Email
                      </span>
                      <strong>
                        {viewingStudent.supervisor
                          ?.user?.email || "N/A"}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span>
                        Supervisor Department
                      </span>
                      <strong>
                        {viewingStudent.supervisor
                          ?.department?.name ||
                          "N/A"}
                      </strong>
                    </div>
                  </>
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
                    handleEdit(viewingStudent);
                  }}
                >
                  Edit Student
                </button>
              </div>
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
                  {editingStudent
                    ? "Edit Student"
                    : "Add Student"}
                </h3>

                <p>
                  {editingStudent
                    ? "Update student information"
                    : "Create a new student account"}
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
                    placeholder="student@example.com"
                  />
                  {formErrors.email && (
                    <small className="field-error">
                      {formErrors.email}
                    </small>
                  )}
                </div>

                {!editingStudent && (
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

                {editingStudent ? (
                  <div className="form-group">
                    <label>Student ID</label>
                    <input
                      type="text"
                      value={editingStudent.studentId || ""}
                      readOnly
                    />
                    <small className="field-hint">
                      Auto-generated by the system
                    </small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Student ID</label>
                    <input
                      type="text"
                      value="Generated automatically"
                      readOnly
                    />
                    <small className="field-hint">
                      Assigned when the student is created
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
                  <label>Level</label>
                  <input
                    type="text"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    placeholder="Year 4"
                  />
                </div>

                <div className="form-group">
                  <label>Academic Year</label>
                  <input
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    placeholder="2026/2027"
                  />
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
                    : editingStudent
                    ? "Update Student"
                    : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
