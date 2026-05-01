import { useState, useEffect } from "react";
import { getAlerts } from "../services/api";

export default function AlertsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="loading-spinner" /><p>Scanning for surges...</p></div>;

  const alerts = data?.alerts || [];
  const summary = data?.summary || {};

  const severityColors = { EMERGENCY: "#FF3366", CRITICAL: "#FF6B35", WARNING: "#FFD93D" };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🚨 Surge Alert System</h2>
        <p>Anomaly detection flagging high-risk zones before overload</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{summary.total_alerts || 0}</div>
          <div className="stat-label">Total Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-value">{summary.emergency || 0}</div>
          <div className="stat-label">Emergency</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟠</div>
          <div className="stat-value">{summary.critical || 0}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-value">{summary.warning || 0}</div>
          <div className="stat-label">Warning</div>
        </div>
      </div>

      {summary.highest_load_pct > 0 && (
        <div style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", borderRadius: 12, padding: 20, marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 36 }}>⚡</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#FF3366" }}>Highest Predicted Load: {summary.highest_load_pct}%</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Immediate attention required for zones exceeding 95% capacity</div>
          </div>
        </div>
      )}

      <div className="chart-container">
        <h3>Alert Feed</h3>
        {alerts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
            ✅ No alerts — all zones operating within safe limits
          </p>
        ) : (
          alerts.map((a, i) => (
            <div className="alert-item slide-in" key={i} style={{ animationDelay: `${i * 0.05}s`, borderLeft: `3px solid ${severityColors[a.severity]}` }}>
              <div className="alert-dot" style={{ backgroundColor: severityColors[a.severity] }} />
              <div className="alert-content">
                <div className="alert-title">{a.zone} — {a.predicted_load_pct}% predicted load at {a.hour}:00</div>
                <div className="alert-desc">{a.recommended_action}</div>
                <div className="alert-meta" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                  <span className={`badge ${a.severity.toLowerCase()}`}>{a.severity}</span>
                  <span>Demand: {a.predicted_demand_kWh} kWh</span>
                  <span>Max: {a.transformer_max_kW} kW</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
