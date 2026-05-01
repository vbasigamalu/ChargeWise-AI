import { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { getHeatmapData, getAlerts, getGridStatus, getScheduleRecommendations } from "../services/api";
import { ZONE_COLORS, CHART_COLORS } from "../utils/constants";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const [heatmap, setHeatmap] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [grid, setGrid] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getHeatmapData(), getAlerts(), getGridStatus(), getScheduleRecommendations()
    ]).then(([h, a, g, s]) => {
      if (h.status === "fulfilled") setHeatmap(h.value);
      if (a.status === "fulfilled") setAlerts(a.value);
      if (g.status === "fulfilled") setGrid(g.value);
      if (s.status === "fulfilled") setSchedule(s.value);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p>Loading dashboard data...</p>
    </div>
  );

  const totalEVs = 6000;
  const activeStations = 40;
  const peakReduction = schedule?.summary?.avg_peak_reduction_pct || 23;
  const alertCount = alerts?.summary?.total_alerts || 0;
  const criticalZones = grid?.summary?.critical_zones || 0;

  // Build demand by zone chart
  const zones = [...new Set((heatmap?.heatmap_data || []).map(d => d.zone))];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const demandByHour = {};
  (heatmap?.heatmap_data || []).forEach(d => {
    if (!demandByHour[d.zone]) demandByHour[d.zone] = new Array(24).fill(0);
    demandByHour[d.zone][d.hour] = d.intensity;
  });

  const lineData = {
    labels: hours,
    datasets: zones.slice(0, 6).map((z, i) => ({
      label: z,
      data: demandByHour[z] || [],
      borderColor: CHART_COLORS[i],
      backgroundColor: CHART_COLORS[i] + "20",
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    })),
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#8B95A8", font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: "#5A6478", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.03)" } },
      y: { ticks: { color: "#5A6478" }, grid: { color: "rgba(255,255,255,0.03)" }, title: { display: true, text: "kWh", color: "#5A6478" } },
    },
  };

  // Grid status bar chart
  const gridStatus = grid?.grid_status || [];
  const gridData = {
    labels: gridStatus.map(g => g.zone),
    datasets: [{
      label: "Utilization %",
      data: gridStatus.map(g => g.utilization_pct),
      backgroundColor: gridStatus.map(g =>
        g.utilization_pct >= 85 ? "#FF3366" : g.utilization_pct >= 70 ? "#FF6B35" : g.utilization_pct >= 55 ? "#FFD93D" : "#00D4AA"
      ),
      borderRadius: 6,
    }],
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#5A6478", font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
      y: { max: 100, ticks: { color: "#5A6478" }, grid: { color: "rgba(255,255,255,0.03)" } },
    },
  };

  return (
    <div className="fade-in">
      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-value">{totalEVs.toLocaleString()}</div>
          <div className="stat-label">Registered EVs</div>
          <div className="stat-change positive">↑ 12 zones covered</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{activeStations}</div>
          <div className="stat-label">Charging Stations</div>
          <div className="stat-change positive">↑ 14+ recommended</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-value">{peakReduction}%</div>
          <div className="stat-label">Peak Load Reduction</div>
          <div className="stat-change positive">↓ via smart scheduling</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-value">{alertCount}</div>
          <div className="stat-label">Active Alerts</div>
          <div className={`stat-change ${alertCount > 0 ? "negative" : "positive"}`}>
            {criticalZones} critical zones
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="chart-container">
          <h3>📈 Zone-wise Demand (24h)</h3>
          <div className="chart-wrapper">
            <Line data={lineData} options={lineOpts} />
          </div>
        </div>
        <div className="chart-container">
          <h3>⚡ Grid Utilization by Zone</h3>
          <div className="chart-wrapper">
            <Bar data={gridData} options={barOpts} />
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="chart-container">
        <h3>🚨 Latest Surge Alerts</h3>
        {(alerts?.alerts || []).slice(0, 5).map((a, i) => (
          <div className="alert-item slide-in" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="alert-dot" style={{
              backgroundColor: a.severity === "EMERGENCY" ? "#FF3366" : a.severity === "CRITICAL" ? "#FF6B35" : "#FFD93D"
            }} />
            <div className="alert-content">
              <div className="alert-title">{a.zone} — {a.predicted_load_pct}% load</div>
              <div className="alert-desc">{a.recommended_action}</div>
              <div className="alert-meta">
                <span className={`badge ${a.severity.toLowerCase()}`}>{a.severity}</span>
                {" "}at {a.hour}:00
              </div>
            </div>
          </div>
        ))}
        {(alerts?.alerts || []).length === 0 && (
          <p style={{ color: "var(--text-muted)", padding: "20px", textAlign: "center" }}>
            ✅ No active alerts — all zones operating within safe limits
          </p>
        )}
      </div>
    </div>
  );
}
