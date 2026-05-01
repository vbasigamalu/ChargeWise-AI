import { useState } from "react";
import { getExplanation } from "../services/api";
import { ZONES } from "../utils/constants";

export default function ExplainPage() {
  const [zone, setZone] = useState("Koramangala");
  const [hour, setHour] = useState(19);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const explain = () => {
    setLoading(true);
    getExplanation(zone, hour)
      .then(d => { setResult(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const features = result?.features || [];
  const maxShap = Math.max(...features.map(f => f.shap_value), 0.01);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🧠 Explainable AI</h2>
        <p>SHAP values provide human-readable reasoning behind every prediction</p>
      </div>

      {/* Controls */}
      <div className="chart-container" style={{ marginBottom: 24 }}>
        <h3>Select Prediction to Explain</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Zone</div>
            <select className="select" value={zone} onChange={e => setZone(e.target.value)}>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Hour</div>
            <select className="select" value={hour} onChange={e => setHour(+e.target.value)}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i}:00</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={explain} disabled={loading}>
            {loading ? "Analyzing..." : "🔍 Explain Prediction"}
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
          <p style={{ fontSize: 16 }}>Select a zone and hour, then click "Explain Prediction"</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>SHAP values will show which features drive the demand prediction</p>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Computing SHAP values...</p>
        </div>
      )}

      {result && !loading && (
        <div className="grid-2">
          {/* SHAP Waterfall */}
          <div className="chart-container">
            <h3>📊 Feature Contributions (SHAP)</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                <span>Base Value: {result.base_value} kWh</span>
                <span>Prediction: <strong style={{ color: "var(--accent)", fontSize: 16 }}>{result.prediction} kWh</strong></span>
              </div>
            </div>

            {features.map((f, i) => (
              <div className="shap-bar" key={i} style={{ animation: `slideIn 0.3s ease ${i * 0.08}s both` }}>
                <div className="shap-label">{f.name}</div>
                <div className="shap-bar-track">
                  <div
                    className={`shap-bar-fill ${f.direction === "increases" ? "positive" : "negative"}`}
                    style={{ width: `${(f.shap_value / maxShap) * 100}%` }}
                  >
                    {f.contribution_pct}%
                  </div>
                </div>
                <div style={{ width: 80, fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                  {f.direction === "increases" ? "↑" : "↓"} {f.shap_value.toFixed(3)}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 11, color: "var(--text-muted)" }}>
              <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "linear-gradient(90deg, #00D4AA, #4ECDC4)", marginRight: 4, verticalAlign: "middle" }}></span> Increases demand</span>
              <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "linear-gradient(90deg, #FF6B6B, #FF3366)", marginRight: 4, verticalAlign: "middle" }}></span> Decreases demand</span>
            </div>
          </div>

          {/* Explanation */}
          <div className="chart-container">
            <h3>💬 Natural Language Explanation</h3>

            <div style={{ padding: 24, background: "var(--accent-glow)", borderRadius: 12, border: "1px solid rgba(0,212,170,0.2)", marginBottom: 20 }}>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-primary)" }}>
                {result.explanation}
              </div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>Prediction Details</h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 16, background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Zone</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{result.zone}</div>
              </div>
              <div style={{ padding: 16, background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Hour</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{result.hour}:00</div>
              </div>
              <div style={{ padding: 16, background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Predicted Demand</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--accent)" }}>{result.prediction} kWh</div>
              </div>
              <div style={{ padding: 16, background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Top Factor</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{features[0]?.name || "—"}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, background: "rgba(69,183,209,0.08)", borderRadius: 8, border: "1px solid rgba(69,183,209,0.15)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#45B7D1", marginBottom: 6 }}>ℹ️ How SHAP Works</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                SHAP (SHapley Additive exPlanations) assigns each feature a value representing
                its contribution to the prediction. Positive SHAP values push the prediction higher,
                while negative values push it lower. The percentages show each feature's relative importance.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
