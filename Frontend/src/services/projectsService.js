import api from "../api/axios";

export const projectsService = {
  async list(params) {
    const { data } = await api.get("/api/projects/", { params });
    return data;
  },

  async detail(id) {
    const { data } = await api.get(`/api/projects/${id}/`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/api/projects/", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/api/projects/${id}/`, payload);
    return data;
  },

  async archive(id) {
    const { data } = await api.patch(`/api/projects/${id}/`, { status: "ON_HOLD" });
    return data;
  },

  async report(id) {
    const { data } = await api.get(`/api/projects/${id}/report/`);
    return data;
  },
  async remove(id) {
    await api.delete(`/api/projects/${id}/`);
  },
};
