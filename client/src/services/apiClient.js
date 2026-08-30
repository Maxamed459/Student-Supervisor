import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const tokenStore = {
  getAccessToken() {
    return localStorage.getItem('ssms_access_token');
  },
  getRefreshToken() {
    return localStorage.getItem('ssms_refresh_token');
  },
  setTokens({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem('ssms_access_token', accessToken);
    if (refreshToken) localStorage.setItem('ssms_refresh_token', refreshToken);
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
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function loginRequest(payload) {
  const { data } = await api.post('/auth/login', payload);
  tokenStore.setTokens(data);
  tokenStore.setUser(data.user);
  return data;
}

export async function requestPasswordReset(payload) {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
}

export async function verifyResetOtp(payload) {
  const { data } = await api.post('/auth/forgot-password/verify', payload);
  return data;
}

export async function resetPasswordRequest(payload) {
  const { data } = await api.post('/auth/forgot-password/reset', payload);
  return data;
}

export async function logoutRequest() {
  const refreshToken = tokenStore.getRefreshToken();
  if (refreshToken) {
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
  }
  tokenStore.clear();
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  tokenStore.setUser(data.user);
  return data.user;
}

export async function listResource(path, key) {
  const { data } = await api.get(path);
  return data[key] || [];
}

export async function createResource(path, payload, key) {
  const { data } = await api.post(path, payload);
  return key ? data[key] : data;
}

export async function patchResource(path, payload, key) {
  const { data } = await api.patch(path, payload);
  return key ? data[key] : data;
}

export async function createUploadSignature(payload = {}) {
  const { data } = await api.post('/uploads/signature', payload);
  return data.upload;
}

export async function uploadFileToCloudinary(file, onProgress) {
  const signature = await createUploadSignature({ folder: 'student-supervisor/submissions' });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', signature.timestamp);
  form.append('folder', signature.folder);
  form.append('resource_type', signature.resource_type);
  form.append('signature', signature.signature);

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/raw/upload`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    },
  );

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
    originalName: file.name,
    format: file.name.split('.').pop().toLowerCase(),
    bytes: data.bytes || file.size,
    resourceType: data.resource_type || 'raw',
  };
}
