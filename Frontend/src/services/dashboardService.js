import api from "../api/axios";

export const dashboardService = {
  async getStats() {
    const { data } = await api.get("/api/dashboard/");
    return data;
  },
};

