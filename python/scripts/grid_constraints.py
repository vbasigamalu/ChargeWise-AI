"""
Feature 4: Grid Constraint Engine
Validates recommendations against transformer/feeder capacity limits.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.data_loader import load_grid_capacity

STATION_LOAD_KW = 50

def validate_grid_constraints(recommendations=None, constraint_type="stations"):
    grid = load_grid_capacity()
    zone_grid = grid.groupby("zone").agg({
        "transformer_max_kW": "first",
        "transformer_current_load_kW": "first",
        "transformer_utilization_pct": "first",
        "headroom_kW": "first",
        "headroom_pct": "first",
    }).reset_index()

    if recommendations is None:
        status = []
        for _, row in zone_grid.iterrows():
            util = row["transformer_utilization_pct"]
            level = "critical" if util >= 90 else "warning" if util >= 75 else "moderate" if util >= 60 else "healthy"
            status.append({
                "zone": row["zone"],
                "transformer_max_kW": round(float(row["transformer_max_kW"]), 1),
                "current_load_kW": round(float(row["transformer_current_load_kW"]), 1),
                "utilization_pct": round(float(util), 1),
                "headroom_kW": round(float(row["headroom_kW"]), 1),
                "headroom_pct": round(float(row["headroom_pct"]), 1),
                "status": level,
            })
        return {
            "grid_status": status,
            "summary": {
                "total_zones": len(status),
                "critical_zones": sum(1 for s in status if s["status"] == "critical"),
                "warning_zones": sum(1 for s in status if s["status"] == "warning"),
                "healthy_zones": sum(1 for s in status if s["status"] == "healthy"),
            }
        }

    validated, rejected, warnings = [], [], []
    for rec in recommendations:
        zone = rec.get("zone", "")
        zone_data = zone_grid[zone_grid["zone"] == zone]
        if zone_data.empty:
            warnings.append({**rec, "warning": f"No grid data for {zone}"})
            continue
        zd = zone_data.iloc[0]
        headroom = zd["headroom_kW"]
        util_pct = zd["transformer_utilization_pct"]
        if headroom < STATION_LOAD_KW:
            rejected.append({**rec, "rejection_reason": f"Insufficient headroom ({headroom:.0f}kW)", "grid_utilization_pct": round(float(util_pct), 1)})
        elif headroom < STATION_LOAD_KW * 1.5:
            validated.append(rec)
            warnings.append({**rec, "warning": f"Low headroom ({headroom:.0f}kW)", "grid_utilization_pct": round(float(util_pct), 1)})
        else:
            validated.append(rec)
    return {"validated": validated, "rejected": rejected, "warnings": warnings,
            "summary": {"total_checked": len(recommendations), "validated": len(validated), "rejected": len(rejected), "warnings": len(warnings)}}

if __name__ == "__main__":
    import json
    print(json.dumps(validate_grid_constraints()["summary"], indent=2))
