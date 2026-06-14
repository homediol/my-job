import axios from 'axios';

// ── Main Prediction API (Flask, port 5000) ───────────────────────────

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// ── Bot Control API (FastAPI, port 5001) ─────────────────────────────

export const botApi = axios.create({
  baseURL: '/bot-api',
  timeout: 15000,
});

// ═════════════════════════════════════════════════════════════════════
// PREDICTION ENDPOINTS
// ═════════════════════════════════════════════════════════════════════

export async function fetchPrediction() {
  const { data } = await api.get('/predict');
  return data;
}

export async function fetchHistory(limit = 80) {
  const { data } = await api.get('/history', { params: { limit } });
  return data;
}

export async function fetchAccuracy() {
  const { data } = await api.get('/accuracy');
  return data;
}

export async function fetchDecisions(limit = 30) {
  const { data } = await api.get('/decisions', { params: { limit } });
  return data;
}

export async function trainModel(epochs = 30) {
  const { data } = await api.post('/train', { epochs });
  return data;
}

// ═════════════════════════════════════════════════════════════════════
// RISK ENDPOINTS
// ═════════════════════════════════════════════════════════════════════

export async function fetchRiskOverview() {
  const { data } = await api.get('/risk/overview');
  return data;
}

export async function fetchRiskVolatility() {
  const { data } = await api.get('/risk/volatility');
  return data;
}

export async function fetchRiskStreaks() {
  const { data } = await api.get('/risk/streaks');
  return data;
}

export async function fetchRiskMovingAverages() {
  const { data } = await api.get('/risk/moving-averages');
  return data;
}

export async function fetchRiskHistory(limit = 100) {
  const { data } = await api.get('/risk/history', { params: { limit } });
  return data;
}

// ═════════════════════════════════════════════════════════════════════
// BOT AUTOMATION ENDPOINTS
// ═════════════════════════════════════════════════════════════════════

export async function startBot(phone, password, headless = false) {
  const { data } = await botApi.post('/bot/start', { phone, password, headless });
  return data;
}

export async function stopBot() {
  const { data } = await botApi.post('/bot/stop');
  return data;
}

export async function fetchBotStatus() {
  const { data } = await botApi.get('/bot/status');
  return data;
}

export async function fetchBotLogs(tail = 100) {
  const { data } = await botApi.get('/bot/logs', { params: { tail } });
  return data;
}

