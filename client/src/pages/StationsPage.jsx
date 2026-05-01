import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { getStationRecommendations, getExistingStations } from "../services/api";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

export default function StationsPage() {
  const [recs, setRecs] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getStationRecommendations(), getExistingStations()])
      .then(([r, e]) => {
        if (r.status === "fulfilled") setRecs(r.value);
        if (e.status === "fulfilled") setExisting(e.value);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading-container"><div className="loading-spinner" /><p>Analyzing locations...</p></div>;

  const recommendations = recs?.recommendations || [];
  const stations = existing?.stations || [];
  const center = [12.9516, 77.6480]; // Bengaluru center

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📍 Station Location Planner</h2>
        <p>K-Means + DBSCAN clustering to identify optimal new station locations</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{stations.length}</div>
          <div className="stat-label">Existing Stations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-value">{recommendations.length}</div>
          <div className="stat-label">Recommended Locations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{recs?.summary?.avg_score || 0}</div>
          <div className="stat-label">Avg Recommendation Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-value">{recs?.summary?.zones_covered || 0}</div>
          <div className="stat-label">Zones Covered</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Map */}
        <div className="chart-container">
          <h3>🗺️ Station Map</h3>
          <div className="map-container">
            <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CartoDB'
              />
              {stations.map((s, i) => (
                <Marker key={`e-${i}`} position={[s.lat, s.lng]} icon={blueIcon}>
                  <Popup>
                    <strong>{s.station_name}</strong><br />
                    Zone: {s.zone}<br />
                    Chargers: {s.num_chargers}<br />
                    Type: {s.charger_type}<br />
                    Utilization: {s.avg_utilization_pct}%
                  </Popup>
                </Marker>
              ))}
              {recommendations.map((r, i) => (
                <span key={`r-${i}`}>
                  <Marker position={[r.lat, r.lng]} icon={greenIcon}>
                    <Popup>
                      <strong>Recommended #{r.rank}</strong><br />
                      Zone: {r.zone}<br />
                      Score: {r.score}<br />
                      Nearest station: {r.nearest_station_km}km
                    </Popup>
                  </Marker>
                  <Circle center={[r.lat, r.lng]} radius={600}
                    pathOptions={{ color: "#00D4AA", fillColor: "#00D4AA", fillOpacity: 0.1, weight: 1 }} />
                </span>
              ))}
            </MapContainer>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
            <span>🔵 Existing Stations</span>
            <span>🟢 Recommended Locations</span>
          </div>
        </div>

        {/* Ranking Table */}
        <div className="chart-container" style={{ maxHeight: 560, overflowY: "auto" }}>
          <h3>🏆 Ranked Recommendations</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Zone</th>
                <th>Score</th>
                <th>EV Density</th>
                <th>Gap</th>
                <th>Nearest</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>#{r.rank}</td>
                  <td>{r.zone}</td>
                  <td><span className="badge healthy">{r.score}</span></td>
                  <td>{r.ev_density_score}</td>
                  <td>{r.coverage_gap_score}</td>
                  <td>{r.nearest_station_km}km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
