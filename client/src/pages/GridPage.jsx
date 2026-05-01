import { useState, useEffect } from "react";
import { getGridStatus } from "../services/api";
import { STATUS_COLORS } from "../utils/constants";

export default function GridPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGridStatus().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="loading-spinner" /><p>Checking grid status...</p></div>;

  const gridStatus = data?.grid_status || [];
  const summary = data?.summary || {};

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>⚡ Grid Status Monitor</h2>
        <p>Real-time transformer and feeder utilization across all zones</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏗️</div>
          <div className="stat-value">{summary.total_zones || 0}</div>
          <div className="stat-label">Total Zones</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-value">{summary.critical_zones || 0}</div>
          <div className="stat-label">Critical Zones</div>
          <div className="stat-change negative">≥ 90% utilization</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-value">{summary.warning_zones || 0}</div>
          <div className="stat-label">Warning Zones</div>
          <div className="stat-change negative">75-90% utilization</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-value">{summary.healthy_zones || 0}</div>
          <div className="stat-label">Healthy Zones</div>
          <div className="stat-change positive">&lt; 60% utilization</div>
        </div>
      </div>

      {/* Gauge Grid */}
      <div className="chart-container">
        <h3>Transformer Utilization Gauges</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20, marginTop: 16 }}>
          {gridStatus.map((g, i) => {
            const color = STATUS_COLORS[g.status] || "#00D4AA";
            const circumference = 2 * Math.PI * 52;
            const offset = circumference - (g.utilization_pct / 100) * circumference;

            return (
              <div key={i} className="gauge-container" style={{ animation: `fadeIn 0.4s ease ${i * 0.05}s both` }}>
                <svg width="130" height="130" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                  <text x="60" y="55" textAnchor="middle" fill={color} fontSize="22" fontWeight="700">
                    {g.utilization_pct}%
                  </text>
                  <text x="60" y="72" textAnchor="middle" fill="#5A6478" fontSize="9">
                    {g.current_load_kW}/{g.transformer_max_kW} kW
                  </text>
                </svg>
                <div className="gauge-label">{g.zone}</div>
                <span className={`badge ${g.status}`} style={{ marginTop: 4 }}>{g.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="chart-container">
        <h3>📋 Detailed Grid Data</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Max Capacity (kW)</th>
              <th>Current Load (kW)</th>
              <th>Utilization</th>
              <th>Headroom (kW)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {gridStatus.map((g, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{g.zone}</td>
                <td>{g.transformer_max_kW}</td>
                <td>{g.current_load_kW}</td>
                <td style={{ color: STATUS_COLORS[g.status], fontWeight: 600 }}>{g.utilization_pct}%</td>
                <td>{g.headroom_kW}</td>
                <td><span className={`badge ${g.status}`}>{g.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
