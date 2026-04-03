import axios from 'axios';

const ACCESS_KEY = 'pulsed_at';

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token) {
  if (token) sessionStorage.setItem(ACCESS_KEY, token);
  else sessionStorage.removeItem(ACCESS_KEY);
}

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const t = getAccessToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);
    if (error.response?.status !== 401) return Promise.reject(error);
    if (original.url?.includes('/api/auth/refresh') || original.url?.includes('/api/auth/login')) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      const token = res.data?.data?.accessToken;
      if (token) {
        setAccessToken(token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    } catch {
      setAccessToken(null);
    }
    return Promise.reject(error);
  }
);

export default api;
