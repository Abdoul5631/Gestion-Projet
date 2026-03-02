import api from "../api/axios";

export const reportsService = {
  async list(params) {
    const { data } = await api.get("/api/reports/", { params });
    return data;
  },

  async detail(id) {
    const { data } = await api.get(`/api/reports/${id}/`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/api/reports/", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/api/reports/${id}/`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/api/reports/${id}/`);
  },
};
