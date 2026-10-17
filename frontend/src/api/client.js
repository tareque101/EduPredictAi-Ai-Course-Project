import axios from 'axios';

export const TOKEN_KEY = 'edupredict_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem(TOKEN_KEY);
    return Promise.reject(err);
  }
);

export const register = async (payload) => (await api.post('/auth/register', payload)).data;
export const login = async (payload) => (await api.post('/auth/login', payload)).data;
export const fetchMe = async () => (await api.get('/auth/me')).data;

export const fetchHabits = async () => (await api.get('/habits')).data.habits;
export const createHabit = async (payload) => (await api.post('/habits', payload)).data.habit;
export const logHabit = async (id) => (await api.post(`/habits/${id}/log`)).data.habit;
export const deleteHabit = async (id) => {
  await api.delete(`/habits/${id}`);
};

export const predictCgpa = async (payload) => (await api.post('/predict', payload)).data;
export const sendChatMessage = async (message, history = []) =>
  (await api.post('/chat', { message, history })).data;
export const fetchModelInfo = async () => (await api.get('/model-info')).data;

export default api;