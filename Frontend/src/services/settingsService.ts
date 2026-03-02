import api from './api';

export const getSettings = () => api.get('auth/settings/');
export const updateSettings = (data: any) => api.put('auth/settings/', data);
