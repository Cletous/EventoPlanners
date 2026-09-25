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

export default api;
