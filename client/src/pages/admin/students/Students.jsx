import { useState } from 'react';
import { LuSearch, LuPlus, LuX, LuPencil, LuTrash2 } from 'react-icons/lu';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const initialStudents = [
  { id: 1, name: 'Eleanor Vance', email: 'e.vance@uni.edu', studentId: 'STU-2024-001', department: 'Computer Science', status: 'active' },
  { id: 2, name: 'Luke Crain', email: 'l.crain@uni.edu', studentId: 'STU-2024-002', department: 'Engineering', status: 'active' },
  { id: 3, name: 'Theodora Crain', email: 't.crain@uni.edu', studentId: 'STU-2024-003', department: 'Mathematics', status: 'inactive' },
  { id: 4, name: 'Steven Crain', email: 's.crain@uni.edu', studentId: 'STU-2024-004', department: 'Computer Science', status: 'active' },
  { id: 5, name: 'Shirley Crain', email: 'sh.crain@uni.edu', studentId: 'STU-2024-005', department: 'Engineering', status: 'active' },
];

const emptyForm = {
  name: '',
  email: '',
  studentId: '',
  department: '',
  password: '',
};

export default function Students() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Full name is required';
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.department) newErrors.department = 'Department is required';
    // password only required when creating, not editing
    if (!editingId && !form.password) newErrors.password = 'Password is required';
    else if (form.password && form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      department: student.department,
      password: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (editingId) {
        // MOCK update
        setStudents(
          students.map((s) =>
            s.id === editingId
              ? { ...s, name: form.name, email: form.email, studentId: form.studentId, department: form.department }
              : s
          )
        );
      } else {
        const newStudent = {
          id: Date.now(),
          name: form.name,
          email: form.email,
          studentId: form.studentId || '-',
          department: form.department,
          status: 'active',
        };
        setStudents([newStudent, ...students]);
      }

      setLoading(false);
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
    }, 800);
  };

  const confirmDelete = () => {
    setStudents(students.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 my-5">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-64">
            <LuSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          <select className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none">
            <option>Department</option>
            <option>Computer Science</option>
            <option>Engineering</option>
            <option>Mathematics</option>
          </select>

          <select className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none">
            <option>Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <Button
          variant="primary"
          className="w-auto px-4 flex items-center gap-2"
          onClick={openAddModal}
        >
          <LuPlus size={16} />
          Add Student
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
              
              <th className="py-3 px-4 font-medium">Student Name</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Student ID</th>
              <th className="py-3 px-4 font-medium">Department</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50">
               
                <td className="py-3 px-4 text-gray-800">{student.name}</td>
                <td className="py-3 px-4 text-gray-500">{student.email}</td>
                <td className="py-3 px-4 text-gray-500">{student.studentId}</td>
                <td className="py-3 px-4 text-gray-500">{student.department}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      student.status === 'active'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {student.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEditModal(student)}
                      className="text-gray-400 hover:text-secondary"
                      title="Edit"
                    >
                      <LuPencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(student)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
          <span>Showing 1 to {filtered.length} of {students.length} results</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded hover:bg-gray-100">‹ Previous</button>
            <button className="w-7 h-7 rounded bg-secondary text-white">1</button>
            <button className="w-7 h-7 rounded hover:bg-gray-100">2</button>
            <button className="w-7 h-7 rounded hover:bg-gray-100">3</button>
            <span>...</span>
            <button className="px-2 py-1 rounded hover:bg-gray-100">Next ›</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <LuX size={18} />
            </button>

            <h3 className="text-lg font-medium text-gray-800 mb-1">
              {editingId ? 'Edit Student' : 'Add New Student'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {editingId ? 'Update this student\u2019s details.' : 'Create a student account.'}
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                name="name"
                placeholder="e.g. Eleanor Vance"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="student@uni.edu"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
              />
              <Input
                label="Student ID"
                name="studentId"
                placeholder="e.g. STU-2026-001"
                value={form.studentId}
                onChange={handleChange}
              />
              <Input
                label="Department"
                name="department"
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={handleChange}
                error={errors.department}
              />
              <Input
                label={editingId ? 'New Password (optional)' : 'Password'}
                name="password"
                type="password"
                placeholder={editingId ? 'Leave blank to keep current password' : 'Set a password for this account'}
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />

              <div className="flex gap-3 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={loading}>
                  {editingId ? 'Save Changes' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Delete Student</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete <span className="font-medium text-gray-700">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-500 hover:!bg-red-600"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}