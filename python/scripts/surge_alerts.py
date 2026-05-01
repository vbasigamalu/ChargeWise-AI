"""
Feature 5: Surge Alert System
Real-time anomaly detection — flags high-risk zones before overload.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
from scripts.predict_demand import predict_demand
from utils.data_loader import load_grid_capacity


def get_surge_alerts(zone="all", threshold_pct=85):
    grid = load_grid_capacity()
    zone_grid = grid.groupby("zone").agg({
        "transformer_max_kW": "first",
        "transformer_current_load_kW": "first",
    }).reset_index()

    demand_result = predict_demand(zone=zone)
    predictions = demand_result["predictions"]

    alerts = []
    for pred in predictions:
        z = pred["zone"]
        zg = zone_grid[zone_grid["zone"] == z]
        if zg.empty:
            continue
        max_kW = zg.iloc[0]["transformer_max_kW"]
        base_load = zg.iloc[0]["transformer_current_load_kW"]
        total_load = base_load + pred["predicted_kWh"]
        load_pct = (total_load / max_kW) * 100

        if load_pct < 75:
            continue

        if load_pct >= 95:
            severity = "EMERGENCY"
        elif load_pct >= threshold_pct:
            severity = "CRITICAL"
        else:
            severity = "WARNING"

        actions = {
            "WARNING": "Monitor closely. Consider activating demand response.",
            "CRITICAL": "Activate load shifting. Notify station operators.",
            "EMERGENCY": "Immediate load shedding required. Restrict new sessions.",
        }

        alerts.append({
            "zone": z, "hour": pred["hour"],
            "predicted_load_pct": round(float(load_pct), 1),
            "predicted_demand_kWh": pred["predicted_kWh"],
            "transformer_max_kW": round(float(max_kW), 1),
            "severity": severity,
            "recommended_action": actions[severity],
        })

    alerts.sort(key=lambda x: x["predicted_load_pct"], reverse=True)
    return {
        "alerts": alerts,
        "summary": {
            "total_alerts": len(alerts),
            "emergency": sum(1 for a in alerts if a["severity"] == "EMERGENCY"),
            "critical": sum(1 for a in alerts if a["severity"] == "CRITICAL"),
            "warning": sum(1 for a in alerts if a["severity"] == "WARNING"),
            "highest_load_pct": round(float(alerts[0]["predicted_load_pct"]), 1) if alerts else 0,
        }
    }

if __name__ == "__main__":
    import json
    print(json.dumps(get_surge_alerts()["summary"], indent=2))
