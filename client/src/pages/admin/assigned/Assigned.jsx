import { useState } from 'react';
import { LuPlus, LuX, LuPencil, LuTrash2, LuUsers } from 'react-icons/lu';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const initialGroups = [
  { id: 1, group: 'Group A', leader: 'Eleanor Vance', members: ['Eleanor Vance', 'Sam Carter', 'Nia Brooks', 'Omar Yusuf'], title: 'Machine Learning for Climate Prediction', department: 'Computer Science', assignedTo: '' },
  { id: 2, group: 'Group B', leader: 'Luke Crain', members: ['Luke Crain', 'Priya Nair', 'Jamal Reed', 'Sofia Marsh'], title: 'Advanced Robotics Kinematics', department: 'Engineering', assignedTo: 'Dr. G. Hopper' },
  { id: 3, group: 'Group C', leader: 'Theodora Crain', members: ['Theodora Crain', 'Ken Osei', 'Maria Lopez', 'Tariq Hassan'], title: 'CRISPR Applications in Agriculture', department: 'Biology', assignedTo: 'Dr. A. Turing' },
  { id: 4, group: 'Group D', leader: 'Steven Crain', members: ['Steven Crain', 'Ava Chen', 'Ibrahim Noor', 'Ruth Klein'], title: 'Quantum Cryptography Protocols', department: 'Physics', assignedTo: '' },
];

const studentOptions = [
  'Eleanor Vance', 'Luke Crain', 'Theodora Crain', 'Steven Crain', 'Shirley Crain',
  'Sam Carter', 'Nia Brooks', 'Omar Yusuf', 'Priya Nair', 'Jamal Reed',
];
const supervisorOptions = ['Dr. Alan Turing', 'Prof. Grace Hopper', 'Dr. Ada Lovelace'];

const emptyForm = {
  group: '',
  leader: '',
  title: '',
  department: '',
  assignedTo: '',
};

export default function Assignment() {
  const [groups, setGroups] = useState(initialGroups);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMembersId, setOpenMembersId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [members, setMembers] = useState([]);
  const [memberToAdd, setMemberToAdd] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.group) newErrors.group = 'Group name is required';
    if (!form.leader) newErrors.leader = 'Group leader is required';
    if (!form.title) newErrors.title = 'Project title is required';
    if (!form.department) newErrors.department = 'Department is required';
    return newErrors;
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMembers([]);
    setMemberToAdd('');
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (g) => {
    setEditingId(g.id);
    setForm({
      group: g.group,
      leader: g.leader,
      title: g.title,
      department: g.department,
      assignedTo: g.assignedTo,
    });
    setMembers(g.members || []);
    setMemberToAdd('');
    setErrors({});
    setShowModal(true);
  };

  const handleAddMember = () => {
    if (!memberToAdd) return;
    if (members.includes(memberToAdd)) return;
    setMembers([...members, memberToAdd]);
    setMemberToAdd('');
  };

  const handleRemoveMember = (name) => {
    setMembers(members.filter((m) => m !== name));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const finalMembers = members.includes(form.leader)
      ? members
      : [form.leader, ...members];

    setTimeout(() => {
      if (editingId) {
        setGroups(
          groups.map((g) =>
            g.id === editingId ? { ...g, ...form, members: finalMembers } : g
          )
        );
      } else {
        setGroups([
          { id: Date.now(), ...form, members: finalMembers },
          ...groups,
        ]);
      }
      setLoading(false);
      setShowModal(false);
      setForm(emptyForm);
      setMembers([]);
      setEditingId(null);
    }, 800);
  };

  const confirmDelete = () => {
    setGroups(groups.filter((g) => g.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-xl font-medium text-gray-800">Projects &amp; Supervisor Assignment</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage project groups and assign supervisors to ensure academic oversight.
          </p>
        </div>
        <Button
          variant="primary"
          className="!w-auto px-4 flex items-center gap-2 justify-center"
          onClick={openAddModal}
        >
          <LuPlus size={16} />
          New Group
        </Button>
      </div>

      <div className="flex items-center gap-3 my-5">
        <select className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none">
          <option>All Departments</option>
          <option>Computer Science</option>
          <option>Engineering</option>
          <option>Biology</option>
          <option>Physics</option>
        </select>
        <select className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none">
          <option>All Supervisors</option>
          {supervisorOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
              <th className="py-3 px-4 font-medium">Group Name</th>
              <th className="py-3 px-4 font-medium">Group Leader</th>
              <th className="py-3 px-4 font-medium">Members</th>
              <th className="py-3 px-4 font-medium">Project Title</th>
              <th className="py-3 px-4 font-medium">Department</th>
              <th className="py-3 px-4 font-medium">Supervisor Status</th>
              <th className="py-3 px-4 font-medium">Assigned To</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4 text-gray-800 font-medium">{g.group}</td>
                <td className="py-3 px-4 text-gray-500">{g.leader}</td>
                <td className="py-3 px-4">
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        setOpenMembersId(openMembersId === g.id ? null : g.id)
                      }
                      className="flex items-center gap-1.5 text-gray-500 hover:text-secondary text-xs"
                    >
                      <LuUsers size={14} />
                      {g.members?.length || 0} members
                    </button>

                    {openMembersId === g.id && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 p-3 z-20">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Group Members
                        </p>
                        <ul className="space-y-1.5">
                          {g.members?.map((m, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-[10px] font-medium">
                                {m.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </span>
                              {m}
                              {m === g.leader && (
                                <span className="text-[9px] text-secondary font-medium">
                                  (Leader)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">{g.title}</td>
                <td className="py-3 px-4 text-gray-500">{g.department}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      g.assignedTo ? 'bg-blue-50 text-secondary' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {g.assignedTo ? 'Assigned' : 'Unassigned'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {g.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-[10px] font-medium">
                        {g.assignedTo.split(' ').pop()[0]}
                      </div>
                      <span className="text-gray-600 text-sm">{g.assignedTo}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">None</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEditModal(g)}
                      className="text-gray-400 hover:text-secondary"
                      title="Edit"
                    >
                      <LuPencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(g)}
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
          <span>Showing 1 to {groups.length} of {groups.length} groups</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border border-gray-200 text-gray-400" disabled>
              Previous
            </button>
            <button className="px-3 py-1 rounded border border-gray-200">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <LuX size={18} />
            </button>

            <h3 className="text-lg font-medium text-gray-800 mb-1">
              {editingId ? 'Edit Group' : 'New Project Group'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {editingId ? 'Update this group\u2019s details.' : 'Create a group and assign a supervisor.'}
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                label="Group Name"
                name="group"
                placeholder="e.g. Group E"
                value={form.group}
                onChange={handleChange}
                error={errors.group}
              />

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1.5">Group Leader</label>
                <select
                  name="leader"
                  value={form.leader}
                  onChange={handleChange}
                  className={`w-full h-11 px-3.5 rounded-lg border text-sm outline-none ${
                    errors.leader ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a student</option>
                  {studentOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {errors.leader && <p className="text-xs text-red-500 mt-1">{errors.leader}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1.5">Group Members</label>
                <div className="flex gap-2">
                  <select
                    value={memberToAdd}
                    onChange={(e) => setMemberToAdd(e.target.value)}
                    className="flex-1 h-11 px-3.5 rounded-lg border border-gray-300 text-sm outline-none"
                  >
                    <option value="">Select a student to add</option>
                    {studentOptions
                      .filter((s) => !members.includes(s))
                      .map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    className="!w-auto px-4"
                    onClick={handleAddMember}
                  >
                    Add
                  </Button>
                </div>

                {members.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {members.map((m) => (
                      <span
                        key={m}
                        className="flex items-center gap-1.5 bg-secondary/10 text-secondary text-xs px-2.5 py-1 rounded-full"
                      >
                        {m}
                        {m !== form.leader && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m)}
                            className="hover:text-red-500"
                          >
                            <LuX size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  The group leader is automatically included as a member.
                </p>
              </div>

              <Input
                label="Project Title"
                name="title"
                placeholder="e.g. Machine Learning for Climate Prediction"
                value={form.title}
                onChange={handleChange}
                error={errors.title}
              />

              <Input
                label="Department"
                name="department"
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={handleChange}
                error={errors.department}
              />

              <div className="mb-2">
                <label className="block text-sm text-gray-600 mb-1.5">
                  Supervisor <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm outline-none"
                >
                  <option value="">Unassigned</option>
                  {supervisorOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

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
                  {editingId ? 'Save Changes' : 'Create Group'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Delete Group</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-700">{deleteTarget.group}</span>? This
              action cannot be undone.
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