import api from "../api/axios";

export const teamsService = {
  async list(params) {
    const { data } = await api.get("/api/teams/", { params });
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/api/teams/", payload);
    return data;
  },

  async detail(id) {
    const { data } = await api.get(`/api/teams/${id}/`);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/api/teams/${id}/`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/api/teams/${id}/`);
  },
};
