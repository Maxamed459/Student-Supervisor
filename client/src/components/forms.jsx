import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  BookOpen,
  ChevronDown,
  ClipboardList,
  FileText,
  Hash,
  LockKeyhole,
  Mail,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Type,
  UploadCloud,
  UserCog,
  UserRound,
  Users,
  X,
} from 'lucide-react';import { uploadFileToCloudinary } from '../services/apiClient';
import { useToast } from '../context/useToast';
import { formatBytes } from '../utils/format';
import {
  hasValidationErrors,
  validateEmail,
  validatePassword,
  validateRequired,
  validateDateRange,
} from '../utils/validation';
import { Field } from './common';

const normalizeMemberIds = (values = []) => [...new Set(
  (values || [])
    .map((value) => {
      if (!value) return null;
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'object') return value._id || value.id || null;
      return String(value);
    })
    .filter(Boolean),
)];

function MultiSelectDropdown({
  label,
  hint,
  icon: Icon,
  options = [],
  value = [],
  onChange,
  placeholder = 'Select…',
  emptyMessage = 'No options available.',
  tone = 'blue',
  multiple = true,
  maxSelected,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => `${option.label} ${option.sublabel || ''}`.toLowerCase().includes(term));
  }, [options, search]);

  const selectedOptions = options.filter((option) => value.some((item) => String(item) === String(option.id)));

  const toggleOption = (id) => {
    const idStr = String(id);
    if (!multiple) {
      onChange(value.some((item) => String(item) === idStr) ? [] : [id]);
      setOpen(false);
      return;
    }
    if (maxSelected && !value.some((item) => String(item) === idStr) && value.length >= maxSelected) {
      return;
    }
    const next = value.some((item) => String(item) === idStr)
      ? value.filter((item) => String(item) !== idStr)
      : [...value, id];
    onChange(next);
  };

  const removeChip = (id) => {
    onChange(value.filter((item) => String(item) !== String(id)));
  };

  const triggerLabel = multiple
    ? (selectedOptions.length ? `${selectedOptions.length} selected` : placeholder)
    : (selectedOptions[0]?.label || placeholder);

  const countLabel = multiple
    ? `${value.length}${maxSelected ? ` / ${maxSelected}` : ''} selected`
    : (value.length ? '1 selected' : 'None selected');

  return (
    <div className={`multi-select multi-select--${tone}`} ref={rootRef}>
      <div className="multi-select-head">
        <div className="multi-select-label">
          {Icon ? <span className="multi-select-label-icon" aria-hidden="true"><Icon size={16} /></span> : null}
          <div>
            <strong>{label}</strong>
            {hint ? <small>{hint}</small> : null}
          </div>
        </div>
        <span className="multi-select-count">{countLabel}</span>
      </div>

      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`multi-select-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={selectedOptions.length ? 'multi-select-trigger-value' : 'multi-select-trigger-placeholder'}>
          {triggerLabel}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {selectedOptions.length ? (
        <div className="multi-select-chips">
          {selectedOptions.map((option) => (
            <span className="multi-select-chip" key={option.id}>
              <span>{option.label}</span>
              <button
                aria-label={`Remove ${option.label}`}
                onClick={() => removeChip(option.id)}
                type="button"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="multi-select-menu" role="listbox">
          <label className="multi-select-search">
            <Search size={14} aria-hidden="true" />
            <input
              aria-label={`Search ${label.toLowerCase()}`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              value={search}
            />
          </label>
          <div className="multi-select-options">
            {filtered.length === 0 ? (
              <p className="multi-select-empty">{emptyMessage}</p>
            ) : filtered.map((option) => {
              const checked = value.some((item) => String(item) === String(option.id));
              return (
                <button
                  aria-selected={checked}
                  className={`multi-select-option${checked ? ' is-selected' : ''}`}
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  role="option"
                  type="button"
                >
                  <span className="multi-select-check" aria-hidden="true">{checked ? '✓' : ''}</span>
                  <span className="multi-select-option-body">
                    <strong>{option.label}</strong>
                    {option.sublabel ? <small>{option.sublabel}</small> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
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
  const toast = useToast();
  const [form, setForm] = useState(() => userFromInitial(initial));
  const [errors, setErrors] = useState({});

  const groupOptions = useMemo(() => {
    if (form.role !== 'student' && form.role !== 'supervisor') return [];
    return (groups || []).filter((group) => {
      if (form.role !== 'supervisor') return true;
      const supervisors = group.supervisors || (group.supervisor ? [group.supervisor] : []);
      if (supervisors.length === 0) return true;
      return initial && supervisors.some(
        (sup) => String(sup._id || sup) === String(initial._id),
      );
    });
  }, [form.role, groups, initial]);

  const submit = () => {
    const nextErrors = {
      fullName: validateRequired(form.fullName, 'Full name'),
      email: initial ? '' : validateEmail(form.email),
      password: initial
        ? (form.password ? validatePassword(form.password) : '')
        : validatePassword(form.password),
    };
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    if (form.role === 'supervisor' && form.groupId) {
      const group = (groups || []).find((item) => String(item._id) === String(form.groupId));
      const supervisors = group?.supervisors || (group?.supervisor ? [group.supervisor] : []);
      const occupiedByOther = supervisors.some(
        (sup) => String(sup._id || sup) !== String(initial?._id || ''),
      );
      if (occupiedByOther) {
        toast.error('This group already has a supervisor assigned.');
        return;
      }
    }

    if (form.role === 'student' && form.groupId && initial) {
      const assignedGroupId = resolveUserGroupId(initial);
      if (
        assignedGroupId
        && String(form.groupId) !== String(assignedGroupId)
      ) {
        toast.error('This student is already assigned to a group.');
        return;
      }
    }

    const payload = { ...form };
    if (!payload.password) delete payload.password;
    if (payload.isActive === undefined) payload.isActive = true;
    onSubmit(payload);
  };

  const isEdit = Boolean(initial);

  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <Field icon={UserRound} label="Full name" error={errors.fullName}>
        <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Enter full legal name" />
      </Field>
      <Field icon={Mail} label="Email" error={errors.email}>
        <input disabled={isEdit} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@university.edu" />
      </Field>
      <Field icon={LockKeyhole} label={isEdit ? 'Reset password (optional)' : 'Password'} help={isEdit ? 'Leave blank to keep the current password.' : 'Minimum 8 characters'} error={errors.password}>
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
        <Field icon={Users} label="Group" help={form.role === 'supervisor'
          ? 'Supervisors can lead multiple groups, but each group may only have one supervisor.'
          : 'Students can belong to one group at a time.'}>
          <select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}>
            <option value="">No group (assign later)</option>
            {groupOptions.map((group) => <option key={group._id} value={group._id}>{group.code || group.name}</option>)}
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

const resolveUserGroupId = (user) => {
  const groupRef = user?.groupId || user?.group;
  if (!groupRef) return null;
  if (typeof groupRef === 'object') return groupRef._id || groupRef.id || null;
  return String(groupRef);
};

export function GroupForm({ users, initial, onSubmit, pending, submitLabel = 'Create group' }) {
  const toast = useToast();
  const editingGroupId = initial?._id || null;
  const initialData = {
    name: initial?.name || '',
    code: initial?.code || initial?.term || '',
    description: initial?.description || '',
    supervisors: normalizeMemberIds(initial?.supervisors || []).slice(0, 1),
    students: normalizeMemberIds(initial?.students || []),
  };
  const [form, setForm] = useState(initialData);
  const [errors, setErrors] = useState({});
  const isEditing = Boolean(editingGroupId);
  const selectedSupervisor = form.supervisors[0] || null;

  const supervisorOptions = useMemo(
    () => (users || [])
      .filter((u) => u.role === 'supervisor')
      .map((sup) => ({ id: sup._id, label: sup.fullName, sublabel: sup.email })),
    [users],
  );

  const studentOptions = useMemo(
    () => (users || [])
      .filter((u) => u.role === 'student')
      .filter((u) => {
        const assignedGroupId = resolveUserGroupId(u);
        if (!assignedGroupId) return true;
        return editingGroupId && String(assignedGroupId) === String(editingGroupId);
      })
      .map((student) => ({ id: student._id, label: student.fullName, sublabel: student.email })),
    [users, editingGroupId],
  );

  const submit = () => {
    const nextErrors = { name: validateRequired(form.name, 'Group name') };
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    const supervisors = normalizeMemberIds(form.supervisors).slice(0, 1);
    const students = normalizeMemberIds(form.students);

    if (supervisors.length > 1) {
      toast.error('A group can only have one supervisor.');
      return;
    }

    const uniqueSupervisors = [...new Set(supervisors.map(String))];
    if (uniqueSupervisors.length !== supervisors.length) {
      toast.error('Duplicate supervisor selection is not allowed.');
      return;
    }

    const blockedStudent = (users || []).find((user) => {
      if (user.role !== 'student' || !students.includes(String(user._id))) return false;
      const assignedGroupId = resolveUserGroupId(user);
      return assignedGroupId && String(assignedGroupId) !== String(editingGroupId || '');
    });
    if (blockedStudent) {
      toast.error('This student is already assigned to a group.');
      return;
    }

    onSubmit({
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim(),
      supervisors,
      students,
    });
  };

  return (
    <form className="group-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <section className="group-form-section">
        <header className="group-form-section-head">
          <div className="group-form-section-icon group-form-section-icon--details">
            <BookOpen size={18} />
          </div>
          <div>
            <h3>Group details</h3>
            <p>Name your workspace and add an optional code or description.</p>
          </div>
        </header>
        <div className="group-form-grid">
          <Field icon={Type} label="Name" error={errors.name}>
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
          <div className="group-form-span-2">
            <Field icon={FileText} label="Description">
              <textarea
                placeholder="Describe the group's research scope, domain, or topics…"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="group-form-section group-form-section--membership">
        <header className="group-form-section-head">
          <div className="group-form-section-icon group-form-section-icon--members">
            <Users size={18} />
          </div>
          <div>
            <h3>Membership</h3>
            <p>Assign one supervisor and any available students to this group.</p>
          </div>
        </header>

        <div className="group-form-select-grid">
          <div className="group-form-supervisor-field">
            <MultiSelectDropdown
              emptyMessage="No supervisor accounts yet — create one from the Users screen first."
              hint={selectedSupervisor
                ? (isEditing
                  ? 'Choose a different supervisor to replace the current one, or remove to leave the group without a supervisor.'
                  : 'Each group can have only one supervisor. The same supervisor may lead multiple groups.')
                : 'Select one supervisor for this group.'}
              icon={UserCog}
              label="Supervisor"
              maxSelected={1}
              multiple={false}
              onChange={(supervisors) => setForm((current) => ({ ...current, supervisors }))}
              options={supervisorOptions}
              placeholder={isEditing ? 'Change supervisor…' : 'Select a supervisor…'}
              tone="indigo"
              value={form.supervisors}
            />
            {selectedSupervisor ? (
              <button
                className="small-button group-form-clear-supervisor"
                onClick={() => setForm((current) => ({ ...current, supervisors: [] }))}
                type="button"
              >
                Remove supervisor
              </button>
            ) : null}
          </div>
          <MultiSelectDropdown
            emptyMessage="No unassigned student accounts — students already in another group are hidden."
            hint="Students can belong to one group at a time."
            icon={UserRound}
            label="Students"
            onChange={(students) => setForm((current) => ({ ...current, students }))}
            options={studentOptions}
            placeholder="Select students…"
            tone="teal"
            value={form.students}
          />
        </div>
      </section>

      <div className="group-form-actions">
        <button className="primary-button group-form-submit" disabled={pending || !form.name} type="submit">
          <Plus size={15} />{pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function MilestoneForm({ groups, initial, onSubmit, pending, disabled = false, submitLabel = 'Publish milestone' }) {
  const toast = useToast();
  const initialData = {
    title: initial?.title || '',
    description: initial?.description || '',
    order: initial?.order || 1,
    group: initial?.groupId || initial?.group?._id || initial?.group || '',
    dueAt: initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 16) : initial?.dueAt ? new Date(initial.dueAt).toISOString().slice(0, 16) : '',
    status: initial?.status || 'published',
  };
  const [form, setForm] = useState(initialData);
  const [errors, setErrors] = useState({});

  const submit = () => {
    const nextErrors = {
      title: validateRequired(form.title, 'Title'),
      group: groups.length > 0 && !form.group ? 'Select a group.' : '',
      dueAt: validateDateRange(form.dueAt),
    };
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    onSubmit({
      ...form,
      order: Number(form.order),
      dueDate: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
    });
  };

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="form-section-title">
        <strong>Milestone details</strong>
        <span>Define what students must submit and when it is due.</span>
      </div>
      <Field icon={Type} label="Title" error={errors.title}>
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Proposal" />
      </Field>
      <Field icon={Hash} label="Order">
        <input min="1" type="number" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} />
      </Field>
      <Field icon={Users} label="Group" error={errors.group}>
        <select disabled={disabled} value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}>
          <option value="">Select group</option>
          {groups.map((group) => <option key={group._id} value={group._id}>{group.code || group.name}</option>)}
        </select>
      </Field>
      <Field icon={CalendarClock} label="Due date" error={errors.dueAt}>
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
  const [errors, setErrors] = useState({});
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
        const nextErrors = { title: validateRequired(form.title, 'Title') };
        setErrors(nextErrors);
        if (hasValidationErrors(nextErrors)) {
          toast.error('Please fill in all required fields correctly.');
          return;
        }
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
      <Field icon={Type} label="Title" error={errors.title}>
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
  const [errors, setErrors] = useState({});
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
        const nextErrors = {
          milestone: milestones.length > 0 && !form.milestone ? 'Select a milestone.' : '',
          group: groups.length > 1 && !selectedGroup ? 'Select a group.' : '',
        };
        setErrors(nextErrors);
        if (hasValidationErrors(nextErrors)) {
          toast.error('Please fill in all required fields correctly.');
          return;
        }
        let uploadedFiles;
        try {
          uploadedFiles = await uploadReadyFiles();
        } catch {
          return;
        }
        const allFiles = [...existingFiles, ...uploadedFiles];
        if (allFiles.length === 0) {
          setErrors((value) => ({ ...value, files: 'Attach at least one valid file.' }));
          toast.error('Please fill in all required fields correctly.');
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
      <Field icon={ClipboardList} label="Milestone" error={errors.milestone}>
        <select value={form.milestone} onChange={(event) => setForm({ ...form, milestone: event.target.value })}>
          <option value="">Select milestone</option>
          {milestones.map((milestone) => <option key={milestone._id} value={milestone._id}>{milestone.title}</option>)}
        </select>
      </Field>
      {groups.length > 1 ? (
        <Field icon={Users} label="Group" error={errors.group}>
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
      {errors.files ? <p className="form-error" role="alert">{errors.files}</p> : null}
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
