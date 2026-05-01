"""
Feature 2: Smart Scheduling
Identifies peak/off-peak windows and recommends load-shifting strategies.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd

from utils.data_loader import load_charging_sessions, load_grid_capacity, ZONE_LIST


def smart_schedule(zone="all"):
    """
    Analyze demand patterns and recommend charging schedules
    that flatten the load curve.
    """
    sessions = load_charging_sessions()
    grid = load_grid_capacity()

    zones = ZONE_LIST if zone == "all" else [zone]
    results = []

    for z in zones:
        zone_sessions = sessions[sessions["zone"] == z]
        if zone_sessions.empty:
            continue

        # Hourly demand profile
        hourly_demand = zone_sessions.groupby("hour")["energy_kWh"].sum().reindex(range(24), fill_value=0)
        total_demand = hourly_demand.sum()

        # Normalize to get average daily demand per hour
        n_days = zone_sessions["start_time"].apply(lambda x: x[:10]).nunique()
        avg_hourly = (hourly_demand / max(n_days, 1)).round(2)

        # Identify peak and off-peak windows
        p80 = np.percentile(avg_hourly, 80)
        p40 = np.percentile(avg_hourly, 40)

        peak_hours = [int(h) for h in avg_hourly.index if avg_hourly[h] >= p80]
        off_peak_hours = [int(h) for h in avg_hourly.index if avg_hourly[h] <= p40]

        # Calculate shiftable load (sessions in peak that could move to off-peak)
        peak_demand = avg_hourly[peak_hours].sum()
        off_peak_capacity = avg_hourly[off_peak_hours].sum()
        shift_potential = min(peak_demand * 0.45, off_peak_capacity * 0.8)

        # Simulate shifted load curve
        load_before = avg_hourly.values.copy().astype(float)
        load_after = load_before.copy()

        # Reduce peak hours
        for h in peak_hours:
            reduction = load_before[h] * 0.35
            load_after[h] -= reduction

        # Distribute to off-peak
        shift_per_hour = shift_potential / max(len(off_peak_hours), 1)
        for h in off_peak_hours:
            load_after[h] += shift_per_hour

        # Peak reduction calculation
        peak_before = max(load_before)
        peak_after = max(load_after)
        peak_reduction_pct = ((peak_before - peak_after) / max(peak_before, 1)) * 100

        # Get grid capacity for this zone
        zone_grid = grid[grid["zone"] == z]
        transformer_max = zone_grid["transformer_max_kW"].iloc[0] if not zone_grid.empty else 1000

        # Generate recommendations
        recommendations = []
        if peak_reduction_pct > 5:
            recommendations.append({
                "type": "shift_charging",
                "description": f"Shift {round(shift_potential, 1)} kWh from peak ({peak_hours[0]}:00-{peak_hours[-1]+1}:00) to off-peak ({off_peak_hours[0]}:00-{off_peak_hours[-1]+1}:00)",
                "impact": f"{round(peak_reduction_pct, 1)}% peak load reduction",
                "priority": "high" if peak_reduction_pct > 15 else "medium",
            })
        if peak_before / transformer_max > 0.8:
            recommendations.append({
                "type": "stagger_charging",
                "description": f"Stagger EV charging start times within peak hours to avoid simultaneous draws",
                "impact": f"Reduce instantaneous peak by ~{round(peak_reduction_pct * 0.5, 1)}%",
                "priority": "high",
            })
        recommendations.append({
            "type": "incentive_pricing",
            "description": f"Offer {round(25 + peak_reduction_pct * 0.5)}% tariff discount for off-peak charging ({off_peak_hours[0]}:00-{off_peak_hours[-1]+1}:00)",
            "impact": f"Encourage voluntary load shifting of ~{round(shift_potential * 0.6, 1)} kWh/day",
            "priority": "medium",
        })

        results.append({
            "zone": z,
            "peak_hours": peak_hours,
            "off_peak_hours": off_peak_hours,
            "load_curve_before": [round(float(v), 2) for v in load_before],
            "load_curve_after": [round(float(v), 2) for v in load_after],
            "peak_demand_kWh": round(float(peak_before), 2),
            "optimized_peak_kWh": round(float(peak_after), 2),
            "peak_reduction_pct": round(float(peak_reduction_pct), 1),
            "shift_potential_kWh": round(float(shift_potential), 2),
            "recommendations": recommendations,
        })

    # Aggregate
    avg_reduction = np.mean([r["peak_reduction_pct"] for r in results]) if results else 0
    total_shift = sum(r["shift_potential_kWh"] for r in results)

    return {
        "schedules": results,
        "summary": {
            "zones_analyzed": len(results),
            "avg_peak_reduction_pct": round(float(avg_reduction), 1),
            "total_shift_potential_kWh": round(float(total_shift), 2),
            "total_recommendations": sum(len(r["recommendations"]) for r in results),
        }
    }


if __name__ == "__main__":
    result = smart_schedule()
    import json
    print(json.dumps(result["summary"], indent=2))
