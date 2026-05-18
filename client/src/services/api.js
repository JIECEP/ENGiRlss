import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 seconds maximum
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('carms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('carms_token');
      localStorage.removeItem('carms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
