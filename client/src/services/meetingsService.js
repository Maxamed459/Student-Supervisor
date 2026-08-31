import api from "./api";

export const meetingsService = {
  list: (params) => api.get("/meetings", { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (payload) => api.post("/meetings", payload),
  update: (id, payload) => api.put(`/meetings/${id}`, payload),
  remove: (id) => api.delete(`/meetings/${id}`),
};

export default meetingsService;
