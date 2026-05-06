import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { getHeatmapData, getDemandPredictions } from "../services/api";
import { ZONES, CHART_COLORS } from "../utils/constants";

export default function DemandPage() {
  const [data, setData] = useState(null);
  const [selectedZone, setSelectedZone] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getHeatmapData().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="loading-spinner" /><p>Predicting demand...</p></div>;

  const heatmapData = data?.heatmap_data || [];
  const currentHour = data?.current_hour;
  const zones = [...new Set(heatmapData.map(d => d.zone))];
  
  // Dynamic hours: Extract order from the first zone's data
  const orderedHours = heatmapData.filter(d => d.zone === (zones[0] || "")).map(d => d.hour);
  const hours = orderedHours.length === 24 ? orderedHours : Array.from({ length: 24 }, (_, i) => i);

  // Build heatmap grid
  const filteredZones = selectedZone === "all" ? zones : [selectedZone];

  const demandByZone = {};
  heatmapData.forEach(d => {
    if (!demandByZone[d.zone]) demandByZone[d.zone] = {};
    demandByZone[d.zone][d.hour] = d.intensity;
  });

  // Line chart
  const lineData = {
    labels: hours.map(h => h === currentHour ? `NOW (${h}:00)` : `${h}:00`),
    datasets: filteredZones.map((z, i) => ({
      label: z,
      data: hours.map(h => demandByZone[z]?.[h] || 0),
      borderColor: CHART_COLORS[zones.indexOf(z) % CHART_COLORS.length],
      backgroundColor: CHART_COLORS[zones.indexOf(z) % CHART_COLORS.length] + "15",
      fill: true,
      tension: 0.4,
      pointRadius: hours.map(h => h === currentHour ? 6 : 2),
      pointBackgroundColor: hours.map(h => h === currentHour ? "#fff" : CHART_COLORS[zones.indexOf(z) % CHART_COLORS.length]),
      borderWidth: 2,
    })),
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#8B95A8", font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: "#5A6478" }, grid: { color: "rgba(255,255,255,0.03)" } },
      y: { ticks: { color: "#5A6478" }, grid: { color: "rgba(255,255,255,0.03)" }, title: { display: true, text: "Predicted kWh", color: "#5A6478" } },
    },
  };

  // Get max intensity for heatmap color scaling
  const maxIntensity = Math.max(...heatmapData.map(d => d.intensity), 1);

  const getHeatColor = (val) => {
    const ratio = val / maxIntensity;
    if (ratio > 0.75) return "rgba(255, 51, 102, 0.8)";
    if (ratio > 0.5) return "rgba(255, 107, 53, 0.7)";
    if (ratio > 0.25) return "rgba(255, 217, 61, 0.5)";
    return "rgba(0, 212, 170, 0.3)";
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🔥 Demand Prediction</h2>
        <p>RF + XGBoost ensemble forecasting zone-wise EV charging demand</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{data?.summary?.total_predicted_kWh?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Predicted kWh</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏔️</div>
          <div className="stat-value">{data?.summary?.peak_hour || 0}:00</div>
          <div className="stat-label">Peak Hour</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{data?.summary?.peak_zone || "—"}</div>
          <div className="stat-label">Peak Zone</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-value">{data?.summary?.zones_analyzed || 0}</div>
          <div className="stat-label">Zones Analyzed</div>
        </div>
      </div>

      {/* Zone filter */}
      <div style={{ marginBottom: 20 }}>
        <select className="select" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
          <option value="all">All Zones</option>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      {/* Line chart */}
      <div className="chart-container">
        <h3>24-Hour Demand Forecast</h3>
        <div className="chart-wrapper" style={{ height: 350 }}>
          <Line data={lineData} options={chartOpts} />
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="chart-container">
        <h3>Demand Heatmap (Zone × Hour)</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone</th>
                {hours.map(h => <th key={h} style={{ textAlign: "center", minWidth: 36 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredZones.map(z => (
                <tr key={z}>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{z}</td>
                  {hours.map(h => {
                    const val = demandByZone[z]?.[h] || 0;
                    const isNow = h === currentHour;
                    return (
                      <td key={h} style={{
                        background: getHeatColor(val),
                        textAlign: "center",
                        fontSize: 10,
                        color: "#fff",
                        padding: "6px 2px",
                        border: isNow ? "2px solid #fff" : "none",
                        position: "relative",
                        zIndex: isNow ? 1 : 0,
                      }}>
                        {val > 0 ? Math.round(val) : ""}
                        {isNow && <div style={{ fontSize: 7, fontWeight: 800, position: "absolute", top: -12, left: 0, width: "100%", color: "#fff", textShadow: "0 0 4px #000" }}>LIVE</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
          <span>■ Low <span style={{ color: "#00D4AA" }}>(&lt;25%)</span></span>
          <span>■ Medium <span style={{ color: "#FFD93D" }}>(25-50%)</span></span>
          <span>■ High <span style={{ color: "#FF6B35" }}>(50-75%)</span></span>
          <span>■ Critical <span style={{ color: "#FF3366" }}>(&gt;75%)</span></span>
        </div>
      </div>
    </div>
  );
}
