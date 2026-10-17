import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Predicts CGPA and risk level from habit values.
 * @param {{studyHours:number, sleepHours:number, socialHours:number, attendancePct:number}} payload
 */
export async function predictCgpa(payload) {
  const { data } = await api.post('/predict', payload);
  return data;
}

/**
 * Sends a message to the study assistant.
 * @param {string} message
 * @param {Array<{role:string, content:string}>} history
 */
export async function sendChatMessage(message, history = []) {
  const { data } = await api.post('/chat', { message, history });
  return data;
}

export default api;