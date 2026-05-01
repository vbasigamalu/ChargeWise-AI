import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { runSimulation } from "../services/api";
import { ZONES } from "../utils/constants";

export default function SimulationPage() {
  const [params, setParams] = useState({
    ev_growth_pct: 30,
    scheduling_adoption_pct: 50,
    time_horizon_months: 12,
  });
  const [newStationZone, setNewStationZone] = useState("Yelahanka");
  const [newStationChargers, setNewStationChargers] = useState(10);
  const [addedStations, setAddedStations] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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

      <div className="grid-2">
        {/* Controls */}
        <div className="chart-container">
          <h3>⚙️ Simulation Parameters</h3>

          <div className="slider-group">
            <label>EV Growth Rate <span>{params.ev_growth_pct}%</span></label>
            <input type="range" min="0" max="100" value={params.ev_growth_pct}
              onChange={e => setParams({ ...params, ev_growth_pct: +e.target.value })} />
          </div>

          <div className="slider-group">
            <label>Scheduling Adoption <span>{params.scheduling_adoption_pct}%</span></label>
            <input type="range" min="0" max="100" value={params.scheduling_adoption_pct}
              onChange={e => setParams({ ...params, scheduling_adoption_pct: +e.target.value })} />
          </div>

          <div className="slider-group">
            <label>Time Horizon <span>{params.time_horizon_months} months</span></label>
            <input type="range" min="3" max="36" value={params.time_horizon_months}
              onChange={e => setParams({ ...params, time_horizon_months: +e.target.value })} />
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
                  {scenarios.slice(0, 8).map((s, i) => (
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
