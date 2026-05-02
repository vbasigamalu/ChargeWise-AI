import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { getScheduleRecommendations } from "../services/api";
import { ZONES } from "../utils/constants";

export default function SchedulePage() {
  const [data, setData] = useState(null);
  const [selectedZone, setSelectedZone] = useState("Koramangala");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getScheduleRecommendations().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="loading-spinner" /><p>Analyzing schedules...</p></div>;

  const schedules = data?.schedules || [];
  const zoneData = schedules.find(s => s.zone === selectedZone) || schedules[0];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const loadCurveData = {
    labels: hours,
    datasets: [
      {
        label: "Before Optimization",
        data: zoneData?.load_curve_before || [],
        borderColor: "#FF6B6B",
        backgroundColor: "rgba(255,107,107,0.1)",
        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
      },
      {
        label: "After Optimization",
        data: zoneData?.load_curve_after || [],
        borderColor: "#00D4AA",
        backgroundColor: "rgba(0,212,170,0.1)",
        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
        borderDash: [5, 5],
      },
    ],
  };

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#8B95A8" } } },
    scales: {
      x: { ticks: { color: "#5A6478" }, grid: { color: "rgba(255,255,255,0.03)" } },
      y: { ticks: { color: "#5A6478" }, grid: { color: "rgba(255,255,255,0.03)" }, title: { display: true, text: "kWh", color: "#5A6478" } },
    },
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>⏱️ Smart Scheduling</h2>
        <p>Load-shifting recommendations to flatten peak demand curves</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-value">{data?.summary?.avg_peak_reduction_pct || 0}%</div>
          <div className="stat-label">Avg Peak Reduction</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔋</div>
          <div className="stat-value">{Math.round(data?.summary?.total_shift_potential_kWh || 0)}</div>
          <div className="stat-label">kWh Shift Potential</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💡</div>
          <div className="stat-value">{data?.summary?.total_recommendations || 0}</div>
          <div className="stat-label">Recommendations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-value">{data?.summary?.zones_analyzed || 0}</div>
          <div className="stat-label">Zones Analyzed</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select className="select" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
          {schedules.map(s => <option key={s.zone} value={s.zone}>{s.zone}</option>)}
        </select>
      </div>

      <div className="grid-2">
        <div className="chart-container">
          <h3>Load Curve — Before vs After</h3>
          <div className="chart-wrapper" style={{ height: 350 }}>
            <Line key={selectedZone} data={loadCurveData} options={opts} />
          </div>
        </div>

        <div className="chart-container">
          <h3>Schedule Details — {zoneData?.zone}</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Peak Hours</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(zoneData?.peak_hours || []).map(h => (
                <span key={h} className="badge critical">{h}:00</span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Off-Peak Hours</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(zoneData?.off_peak_hours || []).map(h => (
                <span key={h} className="badge healthy">{h}:00</span>
              ))}
            </div>
          </div>
          <div style={{ padding: "16px", background: "var(--accent-glow)", borderRadius: 8, marginTop: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>
              {zoneData?.peak_reduction_pct || 0}%
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Peak Load Reduction</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="chart-container">
        <h3>📋 Recommendations for {zoneData?.zone}</h3>
        {(zoneData?.recommendations || []).map((r, i) => (
          <div className="alert-item slide-in" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="alert-dot" style={{ backgroundColor: r.priority === "high" ? "#FF6B35" : "#00D4AA" }} />
            <div className="alert-content">
              <div className="alert-title">{r.description}</div>
              <div className="alert-desc">Impact: {r.impact}</div>
              <div className="alert-meta">
                <span className={`badge ${r.priority === "high" ? "critical" : "healthy"}`}>{r.priority}</span>
                {" "}{r.type.replace(/_/g, " ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
