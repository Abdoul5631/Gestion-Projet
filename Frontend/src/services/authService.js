import api from "../api/axios";
import { tokenService } from "./tokenService";

export const authService = {
  async login(credentials) {
    const response = await api.post("/api/token/", credentials);
    tokenService.setTokens({
      access: response.data.access,
      refresh: response.data.refresh,
    });
    return response.data;
  },

  async refreshToken() {
    const refresh = tokenService.getRefreshToken();
    if (!refresh) {
      throw new Error("No refresh token found");
    }
    const response = await api.post("/api/token/refresh/", { refresh });
    tokenService.setTokens({ access: response.data.access });
    return response.data;
  },

  logout() {
    tokenService.clearTokens();
  },

  isAuthenticated() {
    return Boolean(tokenService.getAccessToken());
  },
};
