import { useRef, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileText,
  Hash,
  IdCard,
  LockKeyhole,
  Mail,
  MessageSquare,
  Plus,
  ShieldCheck,
  Type,
  UploadCloud,
  UserCog,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { uploadFileToCloudinary } from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import { formatBytes } from '../utils/format';
import { Badge, Field } from './common';

export function UserForm({ fixedRole, onSubmit, pending }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: fixedRole || 'student', status: 'active' });
  return (
    <FormGrid
      onSubmit={() => onSubmit(form)}
      pending={pending}
      submitLabel="Create user"
      fields={[
        ['Full name', 'fullName', 'text', 'Enter full legal name', UserRound],
        ['Email', 'email', 'email', 'name@university.edu', Mail],
        ['Password', 'password', 'password', 'Minimum 8 characters', LockKeyhole],
      ]}
      form={form}
      setForm={setForm}
    >
      {!fixedRole ? (
        <Field icon={ShieldCheck} label="Role" help="Controls portal access and permissions.">
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="student">Student</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      ) : null}
      {form.role === 'student' ? (
        <Field icon={IdCard} label="Student ID" help="Supervisor assignment is handled only through supervision groups.">
          <input value={form.studentId || ''} onChange={(event) => setForm({ ...form, studentId: event.target.value })} placeholder="STD-2026-001" />
        </Field>
      ) : null}
      {form.role === 'supervisor' ? (
        <Field icon={IdCard} label="Staff ID">
          <input value={form.staffId || ''} onChange={(event) => setForm({ ...form, staffId: event.target.value })} placeholder="SUP-2026-001" />
        </Field>
      ) : null}
    </FormGrid>
  );
}

export function RoomForm({ onSubmit, pending }) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  return <FormGrid form={form} fields={[['Name', 'name', 'text', 'Research Supervision Lab', Type], ['Code', 'code', 'text', 'SUP-LAB-01', Hash], ['Description', 'description', 'text', 'Short room purpose', FileText]]} onSubmit={() => onSubmit(form)} pending={pending} setForm={setForm} submitLabel="Create room" />;
}

export function GroupForm({ rooms, students, supervisors, onSubmit, pending }) {
  const initial = { name: '', code: '', room: '', supervisor: '', students: [] };
  const [form, setForm] = useState(initial);
  const availableStudents = students.filter((student) => !student.group || form.students.includes(student._id));
  const toggleStudent = (id) => {
    setForm((value) => {
      const selected = value.students.includes(id)
        ? value.students.filter((studentId) => studentId !== id)
        : value.students.length < 4 ? [...value.students, id] : value.students;
      return { ...value, students: selected };
    });
  };
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Field icon={Type} label="Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Software Engineering Research Group" /></Field>
      <Field icon={Hash} label="Code"><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="SCS-GRP-2026-01" /></Field>
      <Field icon={BookOpen} label="Room">
        <select value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })}>
          <option value="">Select room</option>
          {rooms.map((room) => <option key={room._id} value={room._id}>{room.code} - {room.name}</option>)}
        </select>
      </Field>
      <Field icon={UserCog} label="Supervisor">
        <select value={form.supervisor} onChange={(event) => setForm({ ...form, supervisor: event.target.value })}>
          <option value="">Select supervisor</option>
          {supervisors.map((supervisor) => <option key={supervisor._id} value={supervisor._id}>{supervisor.fullName}</option>)}
        </select>
      </Field>
      <div className="student-picker">
        <div className="student-picker-head">
          <span>Students</span>
          <Badge value={`${form.students.length}/4 selected`} />
        </div>
        <div className="student-options">
          {availableStudents.map((student) => (
            <button
              className={form.students.includes(student._id) ? 'student-option selected' : 'student-option'}
              key={student._id}
              onClick={() => toggleStudent(student._id)}
              type="button"
            >
              <span>{student.fullName}</span>
              <small>{student.email}</small>
            </button>
          ))}
        </div>
        <small>Exactly 4 active, unassigned students are required.</small>
      </div>
      <div className="form-actions">
        <button className="secondary-button" disabled={pending} onClick={() => setForm(initial)} type="button">Cancel</button>
        <button className="primary-button inline" disabled={pending || form.students.length !== 4} type="submit"><Plus size={15} />{pending ? 'Saving...' : 'Create group'}</button>
      </div>
    </form>
  );
}

export function MilestoneForm({ groups, onSubmit, pending }) {
  const initial = { title: '', description: '', order: 1, group: '', dueAt: '', status: 'draft', allowedFileTypes: ['pdf', 'docx'] };
  const [form, setForm] = useState(initial);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, order: Number(form.order), dueAt: new Date(form.dueAt).toISOString() }); }}>
      <div className="form-section-title">
        <strong>Milestone details</strong>
        <span>Define what students must submit and when it is due.</span>
      </div>
      <Field icon={Type} label="Title"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Proposal" /></Field>
      <Field icon={Hash} label="Order"><input min="1" type="number" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} /></Field>
      <Field icon={Users} label="Group">
        <select value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}>
          <option value="">Select group</option>
          {groups.map((group) => <option key={group._id} value={group._id}>{group.code} - {group.name}</option>)}
        </select>
      </Field>
      <Field icon={CalendarClock} label="Due date"><input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></Field>
      <Field icon={ShieldCheck} label="Status">
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </Field>
      <Field icon={FileText} label="Description"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the deliverable, requirements, and review expectations." /></Field>
      <div className="form-actions">
        <button className="secondary-button" disabled={pending} onClick={() => setForm(initial)} type="button">Cancel</button>
        <button className="primary-button inline" disabled={pending} type="submit"><Plus size={15} />{pending ? 'Saving...' : 'Create milestone'}</button>
      </div>
    </form>
  );
}

export function SubmissionForm({ groups, milestones, onSubmit, pending }) {
  const initial = {
    milestone: '',
    group: '',
    notes: '',
  };
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const selectedGroup = form.group || (groups.length === 1 ? groups[0]._id : '');
  const allowedExtensions = ['pdf', 'docx'];
  const maxBytes = 10 * 1024 * 1024;
  const maxFiles = 5;
  const addFiles = (selectedFiles) => {
    const current = files.length;
    const next = Array.from(selectedFiles).slice(0, Math.max(maxFiles - current, 0)).map((file) => {
      const extension = file.name.split('.').pop().toLowerCase();
      const invalidType = !allowedExtensions.includes(extension);
      const invalidSize = file.size > maxBytes;
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: invalidType || invalidSize ? 'error' : 'ready',
        error: invalidType ? 'Unsupported file type' : invalidSize ? 'File is larger than 10 MB' : '',
        result: null,
      };
    });
    if (current + selectedFiles.length > maxFiles) toast.error('You can upload up to 5 files per submission');
    setFiles((value) => [...value, ...next]);
  };
  const removeFile = (id) => setFiles((value) => value.filter((item) => item.id !== id));
  const uploadReadyFiles = async () => {
    const validFiles = files.filter((item) => item.status !== 'error');
    if (!validFiles.length) throw new Error('Select at least one valid PDF or DOCX file');
    const uploaded = [];
    setUploading(true);
    try {
      for (const item of validFiles) {
        if (item.result) {
          uploaded.push(item.result);
          continue;
        }
        setFiles((value) => value.map((fileItem) => fileItem.id === item.id ? { ...fileItem, status: 'uploading', progress: 1 } : fileItem));
        const result = await uploadFileToCloudinary(item.file, (progress) => {
          setFiles((value) => value.map((fileItem) => fileItem.id === item.id ? { ...fileItem, progress } : fileItem));
        });
        uploaded.push(result);
        setFiles((value) => value.map((fileItem) => fileItem.id === item.id ? { ...fileItem, status: 'success', progress: 100, result } : fileItem));
      }
      return uploaded;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };
  return (
    <form
      className="form-grid"
      onSubmit={async (event) => {
        event.preventDefault();
        let uploadedFiles;
        try {
          uploadedFiles = await uploadReadyFiles();
        } catch {
          return;
        }
        onSubmit({
          milestone: form.milestone,
          group: selectedGroup,
          versions: [{
            notes: form.notes,
            files: uploadedFiles,
          }],
        });
      }}
    >
      <div className="form-section-title">
        <strong>Submission details</strong>
        <span>Connect your uploaded file to the right milestone and group.</span>
      </div>
      <Field icon={ClipboardList} label="Milestone">
        <select value={form.milestone} onChange={(event) => setForm({ ...form, milestone: event.target.value })}>
          <option value="">Select milestone</option>
          {milestones.map((milestone) => <option key={milestone._id} value={milestone._id}>{milestone.title}</option>)}
        </select>
      </Field>
      <Field icon={Users} label="Group">
        <select value={selectedGroup} onChange={(event) => setForm({ ...form, group: event.target.value })}>
          <option value="">Select group</option>
          {groups.map((group) => <option key={group._id} value={group._id}>{group.code} - {group.name}</option>)}
        </select>
      </Field>
      <div className="form-section-title">
        <strong>Files</strong>
        <span>Allowed file types: PDF and DOCX. Upload 1 to 5 files, maximum 10 MB each.</span>
      </div>
      <div className="upload-dropzone">
        <UploadCloud size={24} />
        <strong>Select submission files</strong>
        <span>PDF, DOCX. Up to 5 files.</span>
        <input
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={(event) => addFiles(event.target.files)}
          type="file"
        />
      </div>
      <div className="upload-list">
        {files.map((item) => (
          <article className={`upload-item upload-${item.status}`} key={item.id}>
            <FileText size={18} />
            <div>
              <strong>{item.file.name}</strong>
              <span>{formatBytes(item.file.size)} - {item.file.name.split('.').pop().toUpperCase()}</span>
              <div className="upload-progress"><i style={{ width: `${item.progress}%` }} /></div>
              {item.error ? <small>{item.error}</small> : null}
            </div>
            <button aria-label={`Remove ${item.file.name}`} onClick={() => removeFile(item.id)} type="button"><X size={16} /></button>
          </article>
        ))}
      </div>
      <Field icon={MessageSquare} label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Add a short note for your supervisor." /></Field>
      <div className="form-actions">
        <button className="secondary-button" disabled={pending || uploading} onClick={() => { setForm(initial); setFiles([]); }} type="button">Cancel</button>
        <button className="primary-button inline" disabled={pending || uploading} type="submit"><Plus size={15} />{pending || uploading ? 'Uploading...' : 'Submit project'}</button>
      </div>
    </form>
  );
}

export function FormGrid({ form, setForm, fields, children, onSubmit, pending, submitLabel }) {
  const initialForm = useRef(form);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      {fields.map(([fieldLabel, key, type = 'text', placeholder = '', Icon]) => (
        <Field key={key} icon={Icon} label={fieldLabel}>
          <input type={type} value={form[key]} placeholder={placeholder} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        </Field>
      ))}
      {children}
      <div className="form-actions">
        <button className="secondary-button" disabled={pending} onClick={() => setForm(initialForm.current)} type="button">
          Cancel
        </button>
        <button className="primary-button inline" disabled={pending} type="submit"><Plus size={15} />{pending ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}
