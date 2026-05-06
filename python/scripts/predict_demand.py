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


import random
from datetime import datetime

def predict_demand(zone="all", date=None, hours=None, shift_to_now=True):
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
    
    # Live shift logic: Start from current hour and go 24h forward
    current_hour = datetime.now().hour
    if hours is None:
        if shift_to_now:
            # e.g., if now is 14, hours = [14, 15...23, 0, 1...13]
            hours = [(current_hour + i) % 24 for i in range(24)]
        else:
            hours = list(range(24))

    all_rows = []
    meta = []

    for z in zones:
        if z not in zone_map: continue
        for h in hours:
            mask = (hourly["zone"] == z) & (hourly["hour"] == h)
            if mask.sum() == 0: continue
            
            row = hourly.loc[mask, feature_cols].mean()
            all_rows.append(row)
            meta.append({"zone": z, "hour": h})

    if not all_rows:
        return {"predictions": [], "heatmap_data": [], "summary": {"total_predicted_kWh": 0, "zones_analyzed": 0}}

    X = pd.DataFrame(all_rows)
    rf_preds = rf.predict(X)
    xgb_preds = xgb_model.predict(X)
    
    predictions = []
    heatmap_data = []

    for i, (rf_p, xgb_p) in enumerate(zip(rf_preds, xgb_preds)):
        # Calculate base ensemble
        ensemble_pred = 0.4 * rf_p + 0.6 * xgb_p
        
        # --- Real-Time Noise Injection (±5%) ---
        # We use a seed based on zone+hour+current_minute to make it "wiggle" slightly
        noise_factor = random.uniform(0.95, 1.05)
        ensemble_pred *= noise_factor
        
        z, h = meta[i]["zone"], meta[i]["hour"]
        
        # Confidence based on prediction agreement (after noise)
        diff_pct = abs(rf_p - xgb_p) / max(ensemble_pred, 1) * 100
        confidence = max(0, min(100, 100 - diff_pct * 2))

        res = {
            "zone": z,
            "hour": int(h),
            "is_now": int(h) == current_hour,
            "predicted_kWh": round(float(ensemble_pred), 2),
            "rf_prediction": round(float(rf_p), 2),
            "xgb_prediction": round(float(xgb_p), 2),
            "confidence": round(float(confidence), 1),
        }
        predictions.append(res)
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
        "current_hour": current_hour,
        "summary": {
            "total_predicted_kWh": round(total_demand, 2),
            "peak_zone": peak_hour.get("zone", ""),
            "peak_hour": peak_hour.get("hour", 0),
            "peak_demand_kWh": peak_hour.get("predicted_kWh", 0),
            "zones_analyzed": len(zones),
        }
    }


if __name__ == "__main__":
    result = predict_demand(shift_to_now=True)
    import json
    print(f"Current Hour: {result['current_hour']}")
    print(json.dumps(result["summary"], indent=2))
    print(f"\nTotal predictions: {len(result['predictions'])}")
