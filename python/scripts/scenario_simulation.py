"""
Feature 6: Scenario Simulation
Models future EV growth, station additions, and scheduling adoption impact.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
from utils.data_loader import load_charging_sessions, load_grid_capacity, load_charging_stations, ZONE_LIST


def run_simulation(ev_growth_pct=30, new_stations=None, scheduling_adoption_pct=50, time_horizon_months=12):
    sessions = load_charging_sessions()
    grid = load_grid_capacity()
    stations = load_charging_stations()

    if new_stations is None:
        new_stations = []

    zone_grid = grid.groupby("zone").agg({
        "transformer_max_kW": "first",
        "transformer_current_load_kW": "first",
        "transformer_utilization_pct": "first",
    }).reset_index()

    results = []
    for z in ZONE_LIST:
        zone_sessions = sessions[sessions["zone"] == z]
        zg = zone_grid[zone_grid["zone"] == z]
        if zg.empty:
            continue
        zg = zg.iloc[0]

        # Baseline
        peak_demand = zone_sessions[zone_sessions["is_peak"] == 1]["energy_kWh"].sum()
        n_days = zone_sessions["start_time"].apply(lambda x: x[:10]).nunique()
        daily_peak = peak_demand / max(n_days, 1)
        current_stations = len(stations[stations["zone"] == z])
        base_util = zg["transformer_utilization_pct"]

        # Projected
        growth_factor = 1 + ev_growth_pct / 100 * (time_horizon_months / 12)
        projected_peak = daily_peak * growth_factor

        # New stations in this zone
        zone_new = [s for s in new_stations if s.get("zone") == z]
        added_chargers = sum(s.get("chargers", 5) for s in zone_new)
        new_capacity_relief = added_chargers * 7.4  # kW per charger

        # Scheduling adoption reduces peak
        schedule_reduction = projected_peak * (scheduling_adoption_pct / 100) * 0.35
        final_peak = projected_peak - schedule_reduction

        projected_util = base_util * growth_factor
        final_util = projected_util * (1 - (scheduling_adoption_pct / 100) * 0.25)

        results.append({
            "zone": z,
            "baseline": {
                "daily_peak_kWh": round(float(daily_peak), 2),
                "stations": int(current_stations),
                "utilization_pct": round(float(base_util), 1),
            },
            "projected": {
                "daily_peak_kWh": round(float(final_peak), 2),
                "stations": int(current_stations + len(zone_new)),
                "utilization_pct": round(float(min(final_util, 100)), 1),
                "peak_without_scheduling": round(float(projected_peak), 2),
            },
            "impact": {
                "peak_change_pct": round(float((final_peak - daily_peak) / max(daily_peak, 1) * 100), 1),
                "scheduling_savings_kWh": round(float(schedule_reduction), 2),
                "at_risk": final_util > 85,
            },
        })

    # Aggregate
    base_total = sum(r["baseline"]["daily_peak_kWh"] for r in results)
    proj_total = sum(r["projected"]["daily_peak_kWh"] for r in results)

    return {
        "scenarios": results,
        "parameters": {
            "ev_growth_pct": ev_growth_pct,
            "new_stations_added": len(new_stations),
            "scheduling_adoption_pct": scheduling_adoption_pct,
            "time_horizon_months": time_horizon_months,
        },
        "summary": {
            "baseline_total_peak_kWh": round(float(base_total), 2),
            "projected_total_peak_kWh": round(float(proj_total), 2),
            "overall_change_pct": round(float((proj_total - base_total) / max(base_total, 1) * 100), 1),
            "zones_at_risk": sum(1 for r in results if r["impact"]["at_risk"]),
            "total_scheduling_savings": round(sum(r["impact"]["scheduling_savings_kWh"] for r in results), 2),
        },
    }

if __name__ == "__main__":
    import json
    result = run_simulation(ev_growth_pct=30, scheduling_adoption_pct=50)
    print(json.dumps(result["summary"], indent=2))
