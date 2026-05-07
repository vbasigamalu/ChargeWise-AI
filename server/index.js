/**
 * EVOPT Node.js Express Middleware Server
 * Spawns Python scripts via child_process instead of using Flask.
 * Runs on port 5000.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { runPython } = require("./utils/pythonBridge");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ─── Health ─────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", server: "express", mode: "python-spawn" });
});

// ─── Demand Prediction ─────────────────────────────────────────
app.post("/api/demand/predict", async (req, res) => {
  try {
    const data = await runPython("predict_demand", req.body);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/demand/heatmap", async (req, res) => {
  try {
    const data = await runPython("predict_demand", { zone: "all" });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Smart Scheduling ──────────────────────────────────────────
app.post("/api/schedule/recommend", async (req, res) => {
  try {
    const data = await runPython("smart_schedule", req.body);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/schedule/load-curve/:zone", async (req, res) => {
  try {
    const data = await runPython("smart_schedule", { zone: req.params.zone });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Station Recommender ────────────────────────────────────────
app.get("/api/stations/recommend", async (req, res) => {
  try {
    const data = await runPython("recommend_stations", { num_recommendations: parseInt(req.query.count) || 15 });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/stations/existing", async (req, res) => {
  try {
    const data = await runPython("get_existing_stations", {});
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Grid Status ────────────────────────────────────────────────
app.get("/api/grid/status", async (req, res) => {
  try {
    const data = await runPython("validate_grid_constraints", {});
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/grid/validate", async (req, res) => {
  try {
    const data = await runPython("validate_grid_constraints", {
      recommendations: req.body.recommendations || [],
      constraint_type: req.body.type || "stations",
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Surge Alerts ───────────────────────────────────────────────
app.get("/api/alerts/current", async (req, res) => {
  try {
    const data = await runPython("get_surge_alerts", {
      zone: req.query.zone || "all",
      threshold_pct: parseInt(req.query.threshold) || 85,
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Scenario Simulation ───────────────────────────────────────
app.post("/api/simulation/run", async (req, res) => {
  try {
    const data = await runPython("run_simulation", req.body);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SHAP Explainability ───────────────────────────────────────
app.post("/api/explain/shap", async (req, res) => {
  try {
    const payload = {
      zone: req.body.zone,
      hour: req.body.hour,
      explain_type: req.body.type || "demand",
    };
    const data = await runPython("explain_prediction", payload);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Zones GeoJSON ─────────────────────────────────────────────
app.get("/api/zones", async (req, res) => {
  try {
    const data = await runPython("get_zones", {});
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Start ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("═".repeat(50));
    console.log(`  EVOPT Express Server — http://localhost:${PORT}`);
    console.log(`  Mode: Spawning Python via child_process`);
    console.log("═".repeat(50));
  });
}

module.exports = app;
