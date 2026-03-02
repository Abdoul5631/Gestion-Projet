import api from "../api/axios";

export const messagesService = {
  async list(params) {
    const { data } = await api.get("/api/messages/", { params });
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/api/messages/", payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/api/messages/${id}/`);
  },
};
