import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim();

if (!apiBaseUrl) {
  console.warn(
    'VITE_API_URL is not configured. Falling back to http://localhost:3001/api.',
  );
}

const api = axios.create({
  baseURL: apiBaseUrl || 'http://localhost:3001/api',
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventoplanners_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
