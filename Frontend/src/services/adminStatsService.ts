import api from './api';

export const getUsersCount = async () => {
  const res = await api.get('/users/admin/users-count/');
  return res.data.count;
};

export const getProjectsCount = async () => {
  const res = await api.get('/users/admin/projects-count/');
  return res.data.count;
};
