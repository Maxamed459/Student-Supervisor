import api from "./api";

export const tasksService = {
  list: (params) => api.get("/tasks", { params }),
  stats: () => api.get("/tasks/stats"),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (payload) => api.post("/tasks", payload),
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  remove: (id) => api.delete(`/tasks/${id}`),
};

export default tasksService;
