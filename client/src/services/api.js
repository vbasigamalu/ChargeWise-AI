import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// ─── Demand ─────────────────────────────────────────────────────
export const getDemandPredictions = (zone = "all", hours = null) =>
  api.post("/demand/predict", { zone, hours }).then((r) => r.data);

export const getHeatmapData = () =>
  api.get("/demand/heatmap").then((r) => r.data);

// ─── Scheduling ─────────────────────────────────────────────────
export const getScheduleRecommendations = (zone = "all") =>
  api.post("/schedule/recommend", { zone }).then((r) => r.data);

export const getLoadCurve = (zone) =>
  api.get(`/schedule/load-curve/${zone}`).then((r) => r.data);

// ─── Stations ───────────────────────────────────────────────────
export const getStationRecommendations = (count = 15) =>
  api.get("/stations/recommend", { params: { count } }).then((r) => r.data);

export const getExistingStations = () =>
  api.get("/stations/existing").then((r) => r.data);

// ─── Grid ───────────────────────────────────────────────────────
export const getGridStatus = () =>
  api.get("/grid/status").then((r) => r.data);

// ─── Alerts ─────────────────────────────────────────────────────
export const getAlerts = (zone = "all", threshold = 85) =>
  api.get("/alerts/current", { params: { zone, threshold } }).then((r) => r.data);

// ─── Simulation ─────────────────────────────────────────────────
export const runSimulation = (params) =>
  api.post("/simulation/run", params).then((r) => r.data);

// ─── Explainability ─────────────────────────────────────────────
export const getExplanation = (zone, hour, type = "demand") =>
  api.post("/explain/shap", { zone, hour, type }).then((r) => r.data);

// ─── Zones ──────────────────────────────────────────────────────
export const getZones = () =>
  api.get("/zones").then((r) => r.data);

export default api;
