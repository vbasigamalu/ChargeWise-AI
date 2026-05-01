"""
Feature 7: Explainable AI — SHAP values for human-readable reasoning.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import joblib
import shap

from utils.data_loader import load_charging_sessions, get_model_path, ZONE_LIST
from utils.feature_engineering import engineer_demand_features, get_feature_columns, get_feature_names_readable


def explain_prediction(zone="Koramangala", hour=19, explain_type="demand"):
    rf = joblib.load(get_model_path("rf_demand.pkl"))
    xgb_model = joblib.load(get_model_path("xgb_demand.pkl"))
    zone_map = joblib.load(get_model_path("zone_map.pkl"))

    sessions = load_charging_sessions()
    hourly, _ = engineer_demand_features(sessions)
    feature_cols = get_feature_columns()
    feature_names = get_feature_names_readable()

    mask = (hourly["zone"] == zone) & (hourly["hour"] == hour)
    if mask.sum() == 0:
        return {"error": f"No data for {zone} at hour {hour}"}

    X_sample = hourly.loc[mask, feature_cols].mean().values.reshape(1, -1)

    # Use XGBoost for SHAP (tree-based, fast)
    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(X_sample)

    prediction = float(0.4 * rf.predict(X_sample)[0] + 0.6 * xgb_model.predict(X_sample)[0])

    # Build feature contributions
    features = []
    sv = shap_values[0]
    indices = np.argsort(np.abs(sv))[::-1]

    for idx in indices[:7]:
        val = float(sv[idx])
        features.append({
            "name": feature_names[idx],
            "feature_key": feature_cols[idx],
            "value": round(float(X_sample[0][idx]), 3),
            "shap_value": round(abs(val), 4),
            "contribution_pct": round(abs(val) / max(sum(np.abs(sv)), 0.001) * 100, 1),
            "direction": "increases" if val > 0 else "decreases",
        })

    # Generate natural language explanation
    top3 = features[:3]
    parts = []
    for f in top3:
        parts.append(f"{f['name']} ({f['contribution_pct']}%)")
    explanation = f"{zone} demand at {hour}:00 is {'high' if prediction > 30 else 'moderate' if prediction > 15 else 'low'} because: {', '.join(parts)}"

    return {
        "zone": zone, "hour": hour, "type": explain_type,
        "prediction": round(prediction, 2),
        "base_value": round(float(explainer.expected_value), 2),
        "features": features,
        "explanation": explanation,
        "shap_values_all": [round(float(v), 4) for v in sv],
        "feature_names_all": feature_names,
    }

if __name__ == "__main__":
    import json
    result = explain_prediction("Electronic City", 19)
    print(result["explanation"])
    print(json.dumps(result["features"][:3], indent=2))
