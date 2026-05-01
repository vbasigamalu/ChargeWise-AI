"""
Feature 1: Demand Prediction
Predicts zone-wise EV charging demand by hour using RF+XGBoost ensemble.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
import joblib

from utils.data_loader import load_charging_sessions, get_model_path, ZONE_LIST
from utils.feature_engineering import engineer_demand_features, get_feature_columns


def predict_demand(zone="all", date=None, hours=None):
    """
    Predict demand for given zone(s) and date/hours.
    Returns predictions and heatmap data.
    """
    # Load models
    rf = joblib.load(get_model_path("rf_demand.pkl"))
    xgb_model = joblib.load(get_model_path("xgb_demand.pkl"))
    zone_map = joblib.load(get_model_path("zone_map.pkl"))

    sessions = load_charging_sessions()
    hourly, _ = engineer_demand_features(sessions)
    feature_cols = get_feature_columns()

    zones = ZONE_LIST if zone == "all" else [zone]
    if hours is None:
        hours = list(range(24))

    predictions = []
    heatmap_data = []

    for z in zones:
        if z not in zone_map:
            continue
        zone_enc = zone_map[z]

        for h in hours:
            # Get average features for this zone/hour from historical data
            mask = (hourly["zone"] == z) & (hourly["hour"] == h)
            if mask.sum() == 0:
                continue

            row = hourly.loc[mask, feature_cols].mean().values.reshape(1, -1)

            rf_pred = rf.predict(row)[0]
            xgb_pred = xgb_model.predict(row)[0]
            ensemble_pred = 0.4 * rf_pred + 0.6 * xgb_pred

            # Confidence based on prediction agreement
            diff_pct = abs(rf_pred - xgb_pred) / max(ensemble_pred, 1) * 100
            confidence = max(0, min(100, 100 - diff_pct * 2))

            predictions.append({
                "zone": z,
                "hour": int(h),
                "predicted_kWh": round(float(ensemble_pred), 2),
                "rf_prediction": round(float(rf_pred), 2),
                "xgb_prediction": round(float(xgb_pred), 2),
                "confidence": round(float(confidence), 1),
            })

            heatmap_data.append({
                "zone": z,
                "hour": int(h),
                "intensity": round(float(ensemble_pred), 2),
            })

    # Summary stats
    total_demand = sum(p["predicted_kWh"] for p in predictions)
    peak_hour = max(predictions, key=lambda x: x["predicted_kWh"]) if predictions else {}

    return {
        "predictions": predictions,
        "heatmap_data": heatmap_data,
        "summary": {
            "total_predicted_kWh": round(total_demand, 2),
            "peak_zone": peak_hour.get("zone", ""),
            "peak_hour": peak_hour.get("hour", 0),
            "peak_demand_kWh": peak_hour.get("predicted_kWh", 0),
            "zones_analyzed": len(zones),
        }
    }


if __name__ == "__main__":
    result = predict_demand()
    import json
    print(json.dumps(result["summary"], indent=2))
    print(f"\nTotal predictions: {len(result['predictions'])}")
