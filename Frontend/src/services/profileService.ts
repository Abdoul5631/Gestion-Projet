import api from './api';

export const getProfile = () => api.get('auth/profile/');
export const updateProfile = (data: any) => api.put('auth/profile/', data);
export const changePassword = (data: any) => api.put('/change-password/', data);
