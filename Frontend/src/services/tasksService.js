import api from "../api/axios";

export const tasksService = {
  async list(params) {
    const { data } = await api.get("/api/tasks/", { params });
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/api/tasks/", payload);
    return data;
  },

  async detail(id) {
    const { data } = await api.get(`/api/tasks/${id}/`);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/api/tasks/${id}/`, payload);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/api/tasks/${id}/`, { status });
    return data;
  },

  async remove(id) {
    await api.delete(`/api/tasks/${id}/`);
  },
};
