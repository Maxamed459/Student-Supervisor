import { useEffect, useState } from "react";
import api from "../services/api";

function Departments() {
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [editingDepartment, setEditingDepartment] =
    useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  // ==========================================
  // FETCH DEPARTMENTS
  // ==========================================

  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/departments"
      );

      setDepartments(
        response.data.departments || []
      );
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to load departments",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
    });

    setEditingDepartment(null);
  };

  // ==========================================
  // ADD DEPARTMENT
  // ==========================================

  const handleAddDepartment = () => {
    resetForm();

    setMessage({
      type: "",
      text: "",
    });

    setShowModal(true);
  };

  // ==========================================
  // EDIT DEPARTMENT
  // ==========================================

  const handleEdit = (department) => {
    setEditingDepartment(department);

    setFormData({
      name: department.name || "",
      code: department.code || "",
      description:
        department.description || "",
    });

    setMessage({
      type: "",
      text: "",
    });

    setShowModal(true);
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      setMessage({
        type: "",
        text: "",
      });

      if (editingDepartment) {
        await api.put(
          `/departments/${editingDepartment._id}`,
          formData
        );

        setMessage({
          type: "success",
          text: "Department updated successfully",
        });
      } else {
        await api.post(
          "/departments",
          formData
        );

        setMessage({
          type: "success",
          text: "Department created successfully",
        });
      }

      setShowModal(false);
      resetForm();

      await fetchDepartments();
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

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this department?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/departments/${id}`
      );

      setMessage({
        type: "success",
        text: "Department deleted successfully",
      });

      await fetchDepartments();
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to delete department",
      });
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredDepartments =
    departments.filter((department) => {
      const name =
        department.name?.toLowerCase() || "";

      const code =
        department.code?.toLowerCase() || "";

      const description =
        department.description
          ?.toLowerCase() || "";

      const searchValue =
        search.toLowerCase();

      return (
        name.includes(searchValue) ||
        code.includes(searchValue) ||
        description.includes(searchValue)
      );
    });

  // ==========================================
  // COUNTS
  // ==========================================

  const getStudentCount = (department) => {
    return department.studentCount || 0;
  };

  const getSupervisorCount = (department) => {
    return department.supervisorCount || 0;
  };

  return (
    <div className="departments-page">

      {/* PAGE HEADER */}

      <div className="departments-header">
        <div>
          <h2>Departments</h2>

          <p>
            Manage academic departments
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={handleAddDepartment}
        >
          + Add Department
        </button>
      </div>

      {/* MESSAGE */}

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

      {/* SEARCH */}

      <div className="departments-toolbar">
        <input
          type="text"
          placeholder="Search by department name or code..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <span>
          {filteredDepartments.length} departments
        </span>
      </div>

      {/* TABLE */}

      <div className="table-card">
        {loading ? (
          <div className="loading">
            Loading departments...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="empty-state">
            <h3>No departments found</h3>

            <p>
              There are no departments matching
              your search.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Code</th>
                  <th>Students</th>
                  <th>Supervisors</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map(
                  (department) => (
                    <tr
                      key={department._id}
                    >

                      {/* DEPARTMENT */}

                      <td>
                        <div className="department-info">
                          <div className="department-icon">
                            {department.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "D"}
                          </div>

                          <div>
                            <strong>
                              {department.name}
                            </strong>

                            <small>
                              {department.description ||
                                "No description"}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* CODE */}

                      <td>
                        <span className="department-code">
                          {department.code ||
                            "N/A"}
                        </span>
                      </td>

                      {/* STUDENTS */}

                      <td>
                        <strong className="count-number">
                          {getStudentCount(
                            department
                          )}
                        </strong>
                      </td>

                      {/* SUPERVISORS */}

                      <td>
                        <strong className="count-number">
                          {getSupervisorCount(
                            department
                          )}
                        </strong>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={
                            department.isActive !==
                              false
                              ? "status active"
                              : "status inactive"
                          }
                        >
                          {department.isActive !==
                          false
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="action-buttons">

                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                department
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                department._id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >
          <div
            className="student-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">
              <div>
                <h3>
                  {editingDepartment
                    ? "Edit Department"
                    : "Add Department"}
                </h3>

                <p>
                  {editingDepartment
                    ? "Update department information"
                    : "Create a new academic department"}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="student-form"
            >

              <div className="form-grid">

                {/* NAME */}

                <div className="form-group">
                  <label>
                    Department Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Computer Science"
                    required
                  />
                </div>

                {/* CODE */}

                <div className="form-group">
                  <label>
                    Department Code
                  </label>

                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="CS"
                    required
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="form-group full-width">
                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                    placeholder="Department description..."
                    rows="4"
                  />
                </div>

              </div>

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowModal(false)
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
                    : editingDepartment
                    ? "Update Department"
                    : "Create Department"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Departments;