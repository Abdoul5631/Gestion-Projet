import api from "../api/axios";

export const usersService = {
  async list(params) {
    const { data } = await api.get("/api/users/", { params });
    return data;
  },

  async me() {
    const { data } = await api.get("/api/users/me/");
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/api/users/", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/api/users/${id}/`, payload);
    return data;
  },

  async deactivate(id) {
    const { data } = await api.patch(`/api/users/${id}/deactivate/`);
    return data;
  },

  async remove(id) {
    await api.delete(`/api/users/${id}/`);
  },
};
