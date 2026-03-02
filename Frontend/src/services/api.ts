import axios from 'axios';
import { refreshToken } from './refreshToken';

const base = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000/api/' : '/api/';

const api = axios.create({
  baseURL: base,
});

// 🔥 INTERCEPTOR JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor pour gérer les réponses 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API response error', error?.response || error);
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const success = await refreshToken();
      if (success) {
        const token = localStorage.getItem('access_token');
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } else {
        // Rediriger vers la connexion
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/signin';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
