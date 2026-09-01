import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    status: user.status || (user.isActive === false ? 'inactive' : 'active'),
    group: user.group || user.groupId || null,
    supervisors: user.supervisors || [],
  };
};

const normalizeGroup = (group) => {
  if (!group) return group;
  return {
    ...group,
    code: group.code || group.term || '',
    supervisors: group.supervisors || [],
    supervisor:
      group.supervisor ||
      (group.supervisors && group.supervisors.length === 1 ? group.supervisors[0] : null),
    students: group.students || [],
  };
};

const normalizeMilestone = (milestone) => {
  if (!milestone) return milestone;
  return {
    ...milestone,
    group: milestone.group || milestone.groupId || null,
    dueAt: milestone.dueAt || milestone.dueDate || null,
    status: milestone.status || (milestone.isPublished ? 'published' : 'draft'),
  };
};

const normalizeSubmission = (submission) => {
  if (!submission) return submission;
  const currentVersion = submission.currentVersion || submission.versions?.at(-1)?.versionNumber || 1;
  const comments = submission.comments || [];
  const status = submission.status;
  const supervisorFeedback = [...comments].reverse().find((comment) => {
    const role = comment?.authorId?.role || comment?.authorRole || comment?.role;
    return role === 'supervisor';
  });
  const studentReplies = comments.filter((comment) => {
    const role = comment?.authorId?.role || comment?.authorRole || comment?.role;
    return role === 'student';
  });
  return {
    ...submission,
    milestone: submission.milestone || submission.milestoneId || null,
    student: submission.student || submission.studentId || null,
    group: submission.group || submission.milestoneId?.groupId || submission.studentId?.groupId || null,
    currentVersion,
    review: submission.review || {
      decision: status,
      feedback: ['changes_requested', 'approved'].includes(status)
        ? supervisorFeedback?.content || ''
        : '',
      reviewedAt: submission.reviewedAt,
    },
    studentReplies,
    latestStudentReply: studentReplies.at(-1) || null,
  };
};

const normalizeNotification = (notification) => {
  if (!notification) return notification;
  return {
    ...notification,
    title: notification.title || notification.type,
    readAt: notification.readAt || (notification.isRead ? notification.updatedAt || notification.createdAt : null),
  };
};

const normalizeAuditLog = (item) => {
  if (!item) return item;
  const actorSource = item.userId && typeof item.userId === 'object'
    ? item.userId
    : item.actor;
  const actor = actorSource && typeof actorSource === 'object'
    ? normalizeUser(actorSource)
    : null;
  return {
    ...item,
    actor,
    actorLabel: actor?.fullName || actor?.email || (typeof actorSource === 'string' ? actorSource : 'System'),
  };
};

const normalizers = {
  user: normalizeUser,
  users: (items = []) => items.map(normalizeUser),
  group: normalizeGroup,
  groups: (items = []) => items.map(normalizeGroup),
  milestone: normalizeMilestone,
  milestones: (items = []) => items.map(normalizeMilestone),
  submission: normalizeSubmission,
  submissions: (items = []) => items.map(normalizeSubmission),
  notification: normalizeNotification,
  notifications: (items = []) => items.map(normalizeNotification),
  auditLog: normalizeAuditLog,
  auditLogs: (items = []) => items.map(normalizeAuditLog),
};

const normalizeByKey = (key, value) => normalizers[key]?.(value) ?? value;

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

const toGroupPayload = (payload = {}) => ({
  name: String(payload.name || '').trim(),
  code: payload.code?.trim() || null,
  description: payload.description?.trim() || '',
  term: payload.term?.trim() || null,
  supervisors: normalizeMemberIds(payload.supervisors).slice(0, 1),
  students: normalizeMemberIds(payload.students),
  ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
});

const toApiPayload = (path, payload = {}) => {
  if (path === '/groups' || /^\/groups\/[^/]+$/.test(path)) {
    return toGroupPayload(payload);
  }

  if (path === '/milestones') {
    const { group, dueAt, status, ...rest } = payload;
    return {
      ...rest,
      groupId: group || payload.groupId || null,
      dueDate: dueAt || payload.dueDate || null,
      isPublished: status ? status === 'published' : payload.isPublished,
    };
  }

  if (path === '/submissions') {
    const latestVersion = payload.versions?.at(-1);
    return {
      milestoneId: payload.milestoneId || payload.milestone,
      files: payload.files || latestVersion?.files || [],
      note: payload.note || latestVersion?.notes || payload.notes || '',
    };
  }

  if (path.endsWith('/comments')) {
    return {
      content: payload.content || payload.message || '',
    };
  }

  return payload;
};

export const tokenStore = {
  getAccessToken() {
    return localStorage.getItem('ssms_access_token');
  },
  getRefreshToken() {
    // The refresh token is stored in an httpOnly cookie by the server
    // and is never readable from JavaScript. We keep this stub for
    // backward compatibility with callers that still ask for it, but
    // it always returns null and the server-side cookie is the real
    // source of truth.
    return null;
  },
  setTokens({ accessToken }) {
    if (accessToken) localStorage.setItem('ssms_access_token', accessToken);
  },
  clear() {
    localStorage.removeItem('ssms_access_token');
    localStorage.removeItem('ssms_refresh_token');
    localStorage.removeItem('ssms_user');
  },
  getUser() {
    const value = localStorage.getItem('ssms_user');
    return value ? JSON.parse(value) : null;
  },
  setUser(user) {
    if (user) localStorage.setItem('ssms_user', JSON.stringify(user));
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

// On a 401 (expired access token), silently exchange the httpOnly refresh
// cookie for a new access token and retry the original request once. If
// the refresh itself fails (cookie missing/expired/revoked), the session
// is really over — clear local state and let ProtectedLayout's `!token`
// guard redirect to /login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { data } = await refreshPromise;
        const newToken = data?.data?.accessToken;
        if (!newToken) throw new Error('No access token in refresh response');
        tokenStore.setTokens({ accessToken: newToken });
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenStore.clear();
        const { store } = await import('../store/store');
        const { logout: logoutAction } = await import('../store/slices/authSlice');
        store.dispatch(logoutAction());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export async function loginRequest(payload) {
  const data = unwrapResponse(await api.post('/auth/login', payload));
  data.user = normalizeUser(data.user);
  tokenStore.setTokens(data);
  tokenStore.setUser(data.user);
  return data;
}

export async function requestPasswordHelp() {
  // There is no self-service password reset in this system — accounts
  // are Admin-managed, and only an Admin can reset a password (from the
  // Users screen). This stub exists so LoginPage's "Forgot password?"
  // link has somewhere sensible to point without hitting a nonexistent
  // backend endpoint.
  return { message: 'Contact your Administrator to reset your password.' };
}

export async function logoutRequest() {
  // The server keeps the refresh token in an httpOnly cookie. A POST
  // with `withCredentials: true` reaches `/auth/logout`, which clears
  // the cookie. We don't need to send anything in the body.
  await api.post('/auth/logout').catch(() => { });
  tokenStore.clear();
}

export async function fetchMe() {
  const data = unwrapResponse(await api.get('/auth/me'));
  const user = normalizeUser(data.user);
  tokenStore.setUser(user);
  return user;
}

export async function updateMe(payload) {
  const data = unwrapResponse(await api.patch('/me', payload));
  const user = normalizeUser(data.user);
  tokenStore.setUser(user);
  return user;
}

export async function changePasswordRequest(payload) {
  return unwrapResponse(await api.post('/auth/change-password', payload));
}

export async function listResource(path, key) {
  const data = unwrapResponse(await api.get(path));
  let value;
  if (key === 'auditLogs') {
    value = data.auditLogs || data.logs || [];
  } else if (key === 'notifications') {
    value = data.notifications || data[key] || [];
  } else {
    value = key === 'progress' && !data[key] ? data.items : data[key];
  }
  return normalizeByKey(key, value || []);
}

export async function fetchNotificationMeta() {
  const data = unwrapResponse(await api.get('/notifications'));
  const notifications = data.notifications || [];
  return {
    notifications: normalizers.notifications(notifications),
    unreadCount: typeof data.unreadCount === 'number'
      ? data.unreadCount
      : notifications.filter((item) => !item.isRead).length,
  };
}

export async function createResource(path, payload, key) {
  const data = unwrapResponse(await api.post(path, toApiPayload(path, payload)));
  // Return the full payload alongside the normalized value at `key`, so callers
  // can read sibling fields returned by the server (e.g. a one-time cleartext
  // password for newly created accounts).
  if (!key) return data;
  return { ...data, [key]: normalizeByKey(key, data[key]) };
}

export async function patchResource(path, payload, key) {
  const data = unwrapResponse(await api.patch(path, toApiPayload(path, payload)));
  return key ? normalizeByKey(key, data[key]) : data;
}

export async function deleteResource(path) {
  return unwrapResponse(await api.delete(path));
}

export async function fetchAdminDashboard() {
  return unwrapResponse(await api.get('/admin/dashboard'));
}

export async function fetchAdminReports(groupId) {
  const params = groupId ? { groupId } : undefined;
  return unwrapResponse(await api.get('/admin/reports', { params }));
}

export async function createUploadSignature(payload = {}) {
  const data = unwrapResponse(await api.post('/uploads/signature', payload));
  return data.upload || data;
}

export function getCloudinaryResourceType(file) {
  const name = file?.name || '';
  const ext = name.split('.').pop().toLowerCase();
  const type = file?.type || '';

  // Images
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic'];
  if (type.startsWith('image/') || imageExtensions.includes(ext)) {
    return 'image';
  }

  // PDFs: upload as 'raw' so Cloudinary preserves the original file and serves
  // it with Content-Type: application/pdf — required for <iframe> inline viewing.
  if (type === 'application/pdf' || ext === 'pdf') {
    return 'raw';
  }

  // Video / Audio
  const mediaExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'flac'];
  if (type.startsWith('video/') || type.startsWith('audio/') || mediaExtensions.includes(ext)) {
    return 'video';
  }

  // Raw documents (docx, doc, pptx, ppt, xlsx, xls, zip, txt, csv, etc.)
  return 'raw';
}

export async function uploadFileToCloudinary(file, onProgress, folder = 'submissions') {
  const resourceType = getCloudinaryResourceType(file);
  const signature = await createUploadSignature({ folder });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', signature.timestamp);
  form.append('folder', signature.folder);
  form.append('signature', signature.signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`;

  try {
    const { data } = await axios.post(
      uploadUrl,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
        },
      },
    );

    const format = data.format || file.name.split('.').pop().toLowerCase();
    const secureUrl = data.secure_url || data.url;

    return {
      publicId: data.public_id,
      secureUrl,
      url: secureUrl,
      originalFilename: file.name,
      originalName: file.name,
      format,
      bytes: data.bytes || file.size,
      resourceType: data.resource_type || resourceType,
    };
  } catch (error) {
    const serverMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    throw new Error(`Upload failed for ${file.name}: ${serverMsg}`, { cause: error });
  }
}

