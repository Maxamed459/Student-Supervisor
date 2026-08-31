import api from "./api";

export const documentsService = {
  list: (params) => api.get("/documents", { params }),
  stats: () => api.get("/documents/stats"),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post("/documents", formData),
  resubmit: (id, formData) =>
    api.put(`/documents/${id}/resubmit`, formData),
  review: (id, payload) => api.put(`/documents/${id}/review`, payload),
  remove: (id) => api.delete(`/documents/${id}`),
  download: (id) =>
    api.get(`/documents/${id}/download`, { responseType: "blob" }),
  view: (id) =>
    api.get(`/documents/${id}/download`, {
      params: { inline: "1" },
      responseType: "blob",
    }),
};

export default documentsService;
