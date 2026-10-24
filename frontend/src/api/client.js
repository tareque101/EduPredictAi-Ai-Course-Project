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

// Auth
export const register = async (payload) => (await api.post('/auth/register', payload)).data;
export const login = async (payload) => (await api.post('/auth/login', payload)).data;
export const fetchMe = async () => (await api.get('/auth/me')).data;

// Habits
export const fetchHabits = async () => (await api.get('/habits')).data.habits;
export const createHabit = async (payload) => (await api.post('/habits', payload)).data.habit;
export const logHabit = async (id) => (await api.post(`/habits/${id}/log`)).data.habit;
export const deleteHabit = async (id) => {
  await api.delete(`/habits/${id}`);
};

// Activities (ECA)
export const fetchActivities = async () => (await api.get('/activities')).data.activities;
export const createActivity = async (payload) => (await api.post('/activities', payload)).data.activity;
export const deleteActivity = async (id) => {
  await api.delete(`/activities/${id}`);
};

// Skills
export const fetchSkills = async () => (await api.get('/skills')).data.skills;
export const createSkill = async (payload) => (await api.post('/skills', payload)).data.skill;
export const logSkillPractice = async (id, hours) =>
  (await api.post(`/skills/${id}/practice`, { hours })).data.skill;
export const deleteSkill = async (id) => {
  await api.delete(`/skills/${id}`);
};

// Health logs
export const fetchHealthLogs = async () => (await api.get('/health-logs')).data.logs;
export const saveHealthLog = async (payload) => (await api.post('/health-logs', payload)).data.log;
export const deleteHealthLog = async (id) => {
  await api.delete(`/health-logs/${id}`);
};

// ML
const NUMERIC_KEYS = ['age', 'attendancePct', 'studyHours', 'previousCgpa', 'sleepHours', 'socialHours'];

export const predictCgpa = async (form) => {
  const payload = { ...form };
  for (const key of NUMERIC_KEYS) {
    payload[key] = Number(payload[key]);
  }
  return (await api.post('/predict', payload)).data;
};

export const sendChatMessage = async (message, history = []) =>
  (await api.post('/chat', { message, history })).data;
export const fetchModelInfo = async () => (await api.get('/model-info')).data;

export default api;