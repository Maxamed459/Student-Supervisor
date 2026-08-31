import { useRef, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  FileText,
  Hash,
  LockKeyhole,
  Mail,
  MessageSquare,
  Plus,
  ShieldCheck,
  Type,
  UploadCloud,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { uploadFileToCloudinary } from '../services/apiClient';
import { useToast } from '../context/useToast';
import { formatBytes } from '../utils/format';
import { Badge, Field } from './common';

const userFromInitial = (initial) => ({
  fullName: initial?.fullName || '',
  email: initial?.email || '',
  password: '',
  role: initial?.role || 'student',
  phone: initial?.phone || '',
  isActive: initial?.isActive !== false,
  groupId: initial?.groupId || initial?.group?._id || '',
});

export function UserForm({ groups = [], onSubmit, pending, initial = null, submitLabel = 'Create user' }) {
  // `key` resets the form when `initial` changes (see WorkspacePages
  // <UserForm initial={editing} key={editing._id} .../>) so this
  // component can stay purely controlled-by-props without an effect.
  const [form, setForm] = useState(() => userFromInitial(initial));

  const submit = () => {
    if (!form.fullName || !form.email) return;
    if (!initial && (!form.password || form.password.length < 8)) return;
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    if (payload.isActive === undefined) payload.isActive = true;
    onSubmit(payload);
  };

  const isEdit = Boolean(initial);

  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <Field icon={UserRound} label="Full name">
        <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Enter full legal name" />
      </Field>
      <Field icon={Mail} label="Email">
        <input disabled={isEdit} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@university.edu" />
      </Field>
      <Field icon={LockKeyhole} label={isEdit ? 'Reset password (optional)' : 'Password'} help={isEdit ? 'Leave blank to keep the current password.' : 'Minimum 8 characters'}>
        <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isEdit ? 'New password' : 'Minimum 8 characters'} />
      </Field>
      <Field icon={ShieldCheck} label="Role" help="Controls portal access and permissions.">
        <select disabled={isEdit} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          <option value="student">Student</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      {(form.role === 'student' || form.role === 'supervisor') ? (
        <Field icon={Users} label="Group" help="Group membership is the link between students and supervisors.">
          <select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}>
            <option value="">No group (assign later)</option>
            {groups.map((group) => <option key={group._id} value={group._id}>{group.code || group.name}</option>)}
          </select>
        </Field>
      ) : null}
      {isEdit ? (
        <Field icon={ShieldCheck} label="Status">
          <select value={form.isActive ? 'active' : 'inactive'} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'active' })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      ) : null}
      <div className="form-actions">
        <button className="primary-button inline" disabled={pending} type="submit">
          <Plus size={15} />{pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function GroupForm({ users, initial, onSubmit, pending, submitLabel = 'Create group' }) {
  const initialData = {
    name: initial?.name || '',
    code: initial?.code || '',
    description: initial?.description || '',
    supervisors: (initial?.supervisors || []).map((s) => s._id || s),
    students: (initial?.students || []).map((s) => s._id || s),
  };
  const [form, setForm] = useState(initialData);

  const availableSupervisors = (users || []).filter((u) => u.role === 'supervisor');
  const availableStudents = (users || []).filter((u) => u.role === 'student');

  const toggleUser = (kind, id) => {
    setForm((value) => {
      const list = value[kind] || [];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...value, [kind]: next };
    });
  };

  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Field icon={Type} label="Name">
        <input
          placeholder="Software Engineering Research Group"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </Field>
      <Field icon={Hash} label="Code">
        <input
          placeholder="SCS-GRP-2026-01"
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
        />
      </Field>
      <Field icon={FileText} label="Description">
        <textarea
          placeholder="Describe the group's research scope, domain, or topics..."
          rows={3}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </Field>
      <div className="form-section-title">
        <strong>Supervisors</strong>
        <span>A Group can have one or more supervisors. Click to toggle.</span>
      </div>
      <div className="student-picker">
        <div className="student-picker-head">
          <span>Supervisors</span>
          <Badge value={`${form.supervisors.length} selected`} />
        </div>
        <div className="student-options">
          {availableSupervisors.length === 0 ? (
            <small>No supervisor accounts yet — create one from the Users screen first.</small>
          ) : availableSupervisors.map((sup) => (
            <button
              className={form.supervisors.includes(sup._id) ? 'student-option selected' : 'student-option'}
              key={sup._id}
              onClick={() => toggleUser('supervisors', sup._id)}
              type="button"
            >
              <span>{sup.fullName}</span>
              <small>{sup.email}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="form-section-title">
        <strong>Students</strong>
        <span>Click to toggle. Membership is not exclusive — you can add/remove later.</span>
      </div>
      <div className="student-picker">
        <div className="student-picker-head">
          <span>Students</span>
          <Badge value={`${form.students.length} selected`} />
        </div>
        <div className="student-options">
          {availableStudents.length === 0 ? (
            <small>No student accounts yet — create one from the Users screen first.</small>
          ) : availableStudents.map((student) => (
            <button
              className={form.students.includes(student._id) ? 'student-option selected' : 'student-option'}
              key={student._id}
              onClick={() => toggleUser('students', student._id)}
              type="button"
            >
              <span>{student.fullName}</span>
              <small>{student.email}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button className="primary-button inline" disabled={pending || !form.name} type="submit">
          <Plus size={15} />{pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function MilestoneForm({ groups, initial, onSubmit, pending, disabled = false, submitLabel = 'Publish milestone' }) {
  const initialData = {
    title: initial?.title || '',
    description: initial?.description || '',
    order: initial?.order || 1,
    group: initial?.groupId || initial?.group?._id || initial?.group || '',
    dueAt: initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 16) : initial?.dueAt ? new Date(initial.dueAt).toISOString().slice(0, 16) : '',
    status: initial?.status || 'published',
  };
  const [form, setForm] = useState(initialData);
  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...form,
          order: Number(form.order),
          dueDate: form.dueAt ? new Date(form.dueAt).toISOString() : null,
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        });
      }}
    >
      <div className="form-section-title">
        <strong>Milestone details</strong>
        <span>Define what students must submit and when it is due.</span>
      </div>
      <Field icon={Type} label="Title">
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Proposal" />
      </Field>
      <Field icon={Hash} label="Order">
        <input min="1" type="number" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} />
      </Field>
      <Field icon={Users} label="Group">
        <select disabled={disabled} value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}>
          <option value="">Select group</option>
          {groups.map((group) => <option key={group._id} value={group._id}>{group.code || group.name}</option>)}
        </select>
      </Field>
      <Field icon={CalendarClock} label="Due date">
        <input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} />
      </Field>
      <Field icon={ShieldCheck} label="Status">
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </Field>
      <Field icon={FileText} label="Description">
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the deliverable, requirements, and review expectations." />
      </Field>
      <div className="form-actions">
        <button className="primary-button inline" disabled={pending || disabled || !form.title || (!form.group && groups.length > 0)} type="submit">
          <Plus size={15} />{pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

// GuidelineForm — supervisor uploads instructional material (no due date).
// Attachments are optional but common (e.g. a PDF specification document).
export function GuidelineForm({ initial, onSubmit, pending, submitLabel = 'Publish guideline' }) {
  const initialData = {
    title: initial?.title || '',
    description: initial?.description || '',
  };
  const [form, setForm] = useState(initialData);
  const [existingAttachments, setExistingAttachments] = useState(initial?.attachments || []);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const allowedExtensions = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'png', 'jpg', 'jpeg'];
  const maxBytes = 20 * 1024 * 1024; // 20 MB for guideline docs
  const maxFiles = 5;

  const addFiles = (selectedFiles) => {
    const current = files.length + existingAttachments.length;
    const next = Array.from(selectedFiles).slice(0, Math.max(maxFiles - current, 0)).map((file) => {
      const extension = file.name.split('.').pop().toLowerCase();
      const invalidType = !allowedExtensions.includes(extension);
      const invalidSize = file.size > maxBytes;
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: invalidType || invalidSize ? 'error' : 'ready',
        error: invalidType ? 'Unsupported file type' : invalidSize ? 'File exceeds 20 MB' : '',
        result: null,
      };
    });
    if (current + selectedFiles.length > maxFiles) toast.error('Maximum 5 files per guideline');
    setFiles((value) => [...value, ...next]);
  };

  const removeFile = (id) => setFiles((value) => value.filter((item) => item.id !== id));
  const removeExistingAttachment = (index) => setExistingAttachments((prev) => prev.filter((_, i) => i !== index));

  const uploadReadyFiles = async () => {
    const validFiles = files.filter((item) => item.status !== 'error');
    if (!validFiles.length) return [];
    const uploaded = [];
    setUploading(true);
    try {
      for (const item of validFiles) {
        if (item.result) { uploaded.push(item.result); continue; }
        setFiles((value) => value.map((f) => f.id === item.id ? { ...f, status: 'uploading', progress: 1 } : f));
        const result = await uploadFileToCloudinary(item.file, (progress) => {
          setFiles((value) => value.map((f) => f.id === item.id ? { ...f, progress } : f));
        }, 'guidelines');
        uploaded.push(result);
        setFiles((value) => value.map((f) => f.id === item.id ? { ...f, status: 'success', progress: 100, result } : f));
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
        let uploadedAttachments;
        try {
          uploadedAttachments = await uploadReadyFiles();
        } catch {
          return;
        }
        const allAttachments = [...existingAttachments, ...uploadedAttachments];
        onSubmit({ title: form.title, description: form.description, attachments: allAttachments });
      }}
    >
      <div className="form-section-title">
        <strong>Guideline details</strong>
        <span>Write a title and description, then optionally attach supporting documents.</span>
      </div>
      <Field icon={Type} label="Title">
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Research Proposal Guidelines" />
      </Field>
      <Field icon={FileText} label="Description">
        <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the guideline, instructions, or any relevant information for students." />
      </Field>
      <div className="form-section-title">
        <strong>Attachments</strong>
        <span>Optional — PDF, DOCX, PPTX, images and more. Up to 5 files, 20 MB each.</span>
      </div>
      {existingAttachments.length > 0 ? (
        <div className="upload-list">
          {existingAttachments.map((att, idx) => (
            <article className="upload-item upload-success" key={att.publicId || idx}>
              <FileText size={18} />
              <div>
                <strong>{att.originalFilename || att.originalName || 'Attachment'}</strong>
                <span>Existing attachment</span>
              </div>
              <button aria-label="Remove attachment" onClick={() => removeExistingAttachment(idx)} type="button"><X size={16} /></button>
            </article>
          ))}
        </div>
      ) : null}
      <div className="upload-dropzone">
        <UploadCloud size={24} />
        <strong>Attach guideline documents</strong>
        <span>PDF, DOCX, PPT, images — up to 5 files</span>
        <input
          accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg"
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
              <span>{formatBytes(item.file.size)} — {item.file.name.split('.').pop().toUpperCase()}</span>
              <div className="upload-progress"><i style={{ width: `${item.progress}%` }} /></div>
              {item.error ? <small>{item.error}</small> : null}
            </div>
            <button aria-label={`Remove ${item.file.name}`} onClick={() => removeFile(item.id)} type="button"><X size={16} /></button>
          </article>
        ))}
      </div>
      <div className="form-actions">
        <button className="primary-button inline" disabled={pending || uploading || !form.title} type="submit">
          <Plus size={15} />{pending || uploading ? 'Uploading…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function SubmissionForm({ groups = [], milestones = [], initial, onSubmit, pending, disabled = false, submitLabel = 'Submit project' }) {
  const latestVersion = initial?.versions?.find((item) => item.versionNumber === initial?.currentVersion) || initial?.versions?.at(-1);
  const initialMilestone = initial?.milestoneId?._id || initial?.milestoneId || initial?.milestone?._id || initial?.milestone || '';
  const initialGroup = initial?.group?._id || initial?.group || initial?.student?.group || '';
  const initialData = {
    milestone: initialMilestone,
    group: initialGroup,
    notes: latestVersion?.note || latestVersion?.notes || initial?.note || '',
  };
  const [form, setForm] = useState(initialData);
  const [existingFiles, setExistingFiles] = useState(latestVersion?.files || (latestVersion?.file ? [latestVersion.file] : []));
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const selectedGroup = form.group || (groups.length === 1 ? groups[0]._id : '');
  const allowedExtensions = ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'pptx', 'xlsx', 'zip'];
  const maxBytes = 20 * 1024 * 1024; // 20 MB max
  const maxFiles = 5;

  const addFiles = (selectedFiles) => {
    const current = files.length + existingFiles.length;
    const next = Array.from(selectedFiles).slice(0, Math.max(maxFiles - current, 0)).map((file) => {
      const extension = file.name.split('.').pop().toLowerCase();
      const invalidType = !allowedExtensions.includes(extension);
      const invalidSize = file.size > maxBytes;
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: invalidType || invalidSize ? 'error' : 'ready',
        error: invalidType ? 'Unsupported file type' : invalidSize ? 'File is larger than 20 MB' : '',
        result: null,
      };
    });
    if (current + selectedFiles.length > maxFiles) toast.error('You can upload up to 5 files per submission');
    setFiles((value) => [...value, ...next]);
  };

  const removeFile = (id) => setFiles((value) => value.filter((item) => item.id !== id));
  const removeExistingFile = (index) => setExistingFiles((prev) => prev.filter((_, i) => i !== index));

  const uploadReadyFiles = async () => {
    const validFiles = files.filter((item) => item.status !== 'error');
    if (!validFiles.length) return [];
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
        }, 'submissions');
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
        const allFiles = [...existingFiles, ...uploadedFiles];
        if (allFiles.length === 0) {
          toast.error('Please attach at least one file (PDF, DOCX, etc.)');
          return;
        }
        onSubmit({
          milestoneId: form.milestone,
          milestone: form.milestone,
          group: selectedGroup,
          note: form.notes,
          files: allFiles,
          versions: [{ note: form.notes, notes: form.notes, files: allFiles }],
        });
      }}
    >
      <div className="form-section-title">
        <strong>Submission details</strong>
        <span>Connect your uploaded file to the right milestone.</span>
      </div>
      <Field icon={ClipboardList} label="Milestone">
        <select value={form.milestone} onChange={(event) => setForm({ ...form, milestone: event.target.value })}>
          <option value="">Select milestone</option>
          {milestones.map((milestone) => <option key={milestone._id} value={milestone._id}>{milestone.title}</option>)}
        </select>
      </Field>
      {groups.length > 1 ? (
        <Field icon={Users} label="Group">
          <select disabled={disabled} value={selectedGroup} onChange={(event) => setForm({ ...form, group: event.target.value })}>
            <option value="">Select group</option>
            {groups.map((group) => <option key={group._id} value={group._id}>{group.code || group.name}</option>)}
          </select>
        </Field>
      ) : null}
      <div className="form-section-title">
        <strong>Files</strong>
        <span>Allowed file types: PDF, DOCX, Images (PNG, JPG), PPTX, XLSX. Up to 5 files, maximum 20 MB each.</span>
      </div>
      {existingFiles.length > 0 ? (
        <div className="upload-list">
          {existingFiles.map((file, idx) => (
            <article className="upload-item upload-success" key={file.publicId || idx}>
              <FileText size={18} />
              <div>
                <strong>{file.originalFilename || file.originalName || 'File'}</strong>
                <span>Current file</span>
              </div>
              <button aria-label="Remove file" onClick={() => removeExistingFile(idx)} type="button"><X size={16} /></button>
            </article>
          ))}
        </div>
      ) : null}
      <div className="upload-dropzone">
        <UploadCloud size={24} />
        <strong>Select submission files</strong>
        <span>PDF, DOCX, Images, etc. Up to 5 files.</span>
        <input
          accept=".pdf,.docx,.doc,.pptx,.xlsx,.png,.jpg,.jpeg,.zip,application/pdf,image/*"
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
      <Field icon={MessageSquare} label="Notes">
        <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Add a short note for your supervisor." />
      </Field>
      <div className="form-actions">
        <button className="primary-button inline" disabled={pending || uploading || (!form.milestone && milestones.length > 0)} type="submit">
          <Plus size={15} />{pending || uploading ? 'Uploading…' : submitLabel}
        </button>
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
        <button className="primary-button inline" disabled={pending} type="submit"><Plus size={15} />{pending ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
