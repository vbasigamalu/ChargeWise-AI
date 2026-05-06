import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { runSimulation } from "../services/api";
import { ZONES } from "../utils/constants";

const PRESETS = [
  {
    id: "conservative",
    label: "Conservative 2025",
    icon: "🟢",
    desc: "Low growth, minimal adoption",
    params: { ev_growth_pct: 10, scheduling_adoption_pct: 20, time_horizon_months: 6 },
    color: "#00D4AA",
  },
  {
    id: "moderate",
    label: "Moderate 2026",
    icon: "🟡",
    desc: "Balanced growth & adoption",
    params: { ev_growth_pct: 30, scheduling_adoption_pct: 50, time_horizon_months: 12 },
    color: "#FFD93D",
  },
  {
    id: "stress",
    label: "⚠️ Stress Test 2027",
    icon: "🔴",
    desc: "High growth, low adoption",
    params: { ev_growth_pct: 60, scheduling_adoption_pct: 15, time_horizon_months: 24 },
    color: "#FF6B35",
  },
  {
    id: "aggressive",
    label: "🚀 Aggressive 2030",
    icon: "🟣",
    desc: "Max growth + full smart charging",
    params: { ev_growth_pct: 100, scheduling_adoption_pct: 80, time_horizon_months: 36 },
    color: "#c084fc",
  },
];

export default function SimulationPage() {
  const [params, setParams] = useState({
    ev_growth_pct: 30,
    scheduling_adoption_pct: 50,
    time_horizon_months: 12,
  });
  const [activePreset, setActivePreset] = useState("moderate");
  const [newStationZone, setNewStationZone] = useState("Yelahanka");
  const [newStationChargers, setNewStationChargers] = useState(10);
  const [addedStations, setAddedStations] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setParams({ ...preset.params });
  };

  const addStation = () => {
    setAddedStations([...addedStations, { zone: newStationZone, chargers: newStationChargers }]);
  };

  const runSim = () => {
    setLoading(true);
    runSimulation({ ...params, new_stations: addedStations })
      .then(d => { setResult(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const scenarios = result?.scenarios || [];

  const barData = scenarios.length > 0 ? {
    labels: scenarios.map(s => s.zone),
    datasets: [
      {
        label: "Baseline Peak (kWh)",
        data: scenarios.map(s => s.baseline.daily_peak_kWh),
        backgroundColor: "rgba(255, 107, 107, 0.7)",
        borderRadius: 4,
      },
      {
        label: "Projected Peak (kWh)",
        data: scenarios.map(s => s.projected.daily_peak_kWh),
        backgroundColor: "rgba(0, 212, 170, 0.7)",
        borderRadius: 4,
      },
    ],
  } : null;

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#8B95A8" } } },
    scales: {
      x: { ticks: { color: "#5A6478", maxRotation: 45 }, grid: { display: false } },
      y: { ticks: { color: "#5A6478" }, grid: { color: "rgba(255,255,255,0.03)" } },
    },
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🔮 Scenario Simulation</h2>
        <p>Model future EV growth, station additions, and scheduling impact on grid load</p>
      </div>

      {/* Scenario Presets */}
      <div className="chart-container" style={{ marginBottom: 24 }}>
        <h3>⚡ Quick Scenarios</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, marginTop: -8 }}>
          Click a preset to instantly configure all parameters
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="preset-btn"
              style={{
                padding: "16px 12px",
                borderRadius: "var(--radius-sm)",
                background: activePreset === p.id
                  ? `${p.color}15`
                  : "var(--bg-card)",
                border: `2px solid ${activePreset === p.id ? p.color : "var(--glass-border)"}`,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {activePreset === p.id && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: p.color,
                }} />
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: activePreset === p.id ? p.color : "var(--text-primary)", marginBottom: 4 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                {p.desc}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, display: "flex", gap: 8 }}>
                <span>📈 {p.params.ev_growth_pct}%</span>
                <span>⏱ {p.params.scheduling_adoption_pct}%</span>
                <span>📅 {p.params.time_horizon_months}mo</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Controls */}
        <div className="chart-container">
          <h3>⚙️ Simulation Parameters</h3>

          <div className="slider-group">
            <label>EV Growth Rate <span>{params.ev_growth_pct}%</span></label>
            <input type="range" min="0" max="100" value={params.ev_growth_pct}
              onChange={e => { setActivePreset(null); setParams({ ...params, ev_growth_pct: +e.target.value }); }} />
          </div>

          <div className="slider-group">
            <label>Scheduling Adoption <span>{params.scheduling_adoption_pct}%</span></label>
            <input type="range" min="0" max="100" value={params.scheduling_adoption_pct}
              onChange={e => { setActivePreset(null); setParams({ ...params, scheduling_adoption_pct: +e.target.value }); }} />
          </div>

          <div className="slider-group">
            <label>Time Horizon <span>{params.time_horizon_months} months</span></label>
            <input type="range" min="3" max="36" value={params.time_horizon_months}
              onChange={e => { setActivePreset(null); setParams({ ...params, time_horizon_months: +e.target.value }); }} />
          </div>

          <div style={{ marginTop: 16, padding: 16, background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--glass-border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Add New Stations</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select className="select" value={newStationZone} onChange={e => setNewStationZone(e.target.value)} style={{ flex: 1 }}>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <input className="input" type="number" value={newStationChargers} min={1} max={50}
                onChange={e => setNewStationChargers(+e.target.value)} style={{ width: 70 }} />
              <button className="btn btn-secondary" onClick={addStation}>+</button>
            </div>
            {addedStations.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "4px 0" }}>
                📍 {s.zone} — {s.chargers} chargers
                <span style={{ cursor: "pointer", color: "#FF6B6B", marginLeft: 8 }}
                  onClick={() => setAddedStations(addedStations.filter((_, j) => j !== i))}>✕</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={runSim} style={{ width: "100%", marginTop: 16 }}
            disabled={loading}>
            {loading ? "Running Simulation..." : "🚀 Run Simulation"}
          </button>
        </div>

        {/* Results Summary */}
        <div className="chart-container">
          <h3>📊 Simulation Results</h3>
          {!result ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
              <p>Configure parameters and click "Run Simulation"</p>
            </div>
          ) : (
            <>
              <div className="stats-grid" style={{ marginBottom: 16 }}>
                <div className="stat-card">
                  <div className="stat-value" style={{ fontSize: 22, color: result.summary.overall_change_pct > 0 ? "#FF6B35" : "#00D4AA" }}>
                    {result.summary.overall_change_pct > 0 ? "+" : ""}{result.summary.overall_change_pct}%
                  </div>
                  <div className="stat-label">Overall Peak Change</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ fontSize: 22, color: "#FF3366" }}>
                    {result.summary.zones_at_risk}
                  </div>
                  <div className="stat-label">Zones at Risk</div>
                </div>
              </div>
              <div style={{ padding: 16, background: "var(--accent-glow)", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Scheduling Savings</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>
                  {Math.round(result.summary.total_scheduling_savings)} kWh/day
                </div>
              </div>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr><th>Zone</th><th>Baseline</th><th>Projected</th><th>Change</th><th>Risk</th></tr>
                </thead>
                <tbody>
                  {scenarios.map((s, i) => (
                    <tr key={i}>
                      <td>{s.zone}</td>
                      <td>{s.baseline.daily_peak_kWh}</td>
                      <td>{s.projected.daily_peak_kWh}</td>
                      <td style={{ color: s.impact.peak_change_pct > 0 ? "#FF6B35" : "#00D4AA" }}>
                        {s.impact.peak_change_pct > 0 ? "+" : ""}{s.impact.peak_change_pct}%
                      </td>
                      <td>{s.impact.at_risk ? <span className="badge critical">AT RISK</span> : <span className="badge healthy">SAFE</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      {barData && (
        <div className="chart-container">
          <h3>📊 Baseline vs Projected Peak Load</h3>
          <div className="chart-wrapper" style={{ height: 300 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </div>
      )}
    </div>
  );
}
