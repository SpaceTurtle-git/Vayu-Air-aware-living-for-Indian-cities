import axios from "axios";

// Point this at your deployed Django backend (Render, etc). For local dev,
// create a .env file with VITE_API_BASE_URL=http://localhost:8000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("vayu_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 once, then give up (sends user back to login)
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("vayu_refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh });
          localStorage.setItem("vayu_access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return client(original);
        } catch {
          localStorage.removeItem("vayu_access_token");
          localStorage.removeItem("vayu_refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
