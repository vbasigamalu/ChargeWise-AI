"""
Feature 3: Station Location Recommender
K-Means + DBSCAN clustering to rank candidate locations for new stations.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
import joblib

from utils.data_loader import (
    load_ev_registrations, load_charging_stations,
    load_grid_capacity, get_model_path, ZONE_LIST
)
from utils.geo_utils import haversine_distance, find_nearest_station, point_in_zone, ZONE_CENTERS


def recommend_stations(num_recommendations=15):
    """
    Rank candidate locations for new charging stations using
    K-Means + DBSCAN clustering results + multi-factor scoring.
    """
    # Load data
    evs = load_ev_registrations()
    stations = load_charging_stations()
    grid = load_grid_capacity()

    centroids = joblib.load(get_model_path("demand_centroids.pkl"))
    dbscan_centers = joblib.load(get_model_path("dbscan_centers.pkl"))

    # Combine candidate locations from both clustering methods
    all_candidates = np.vstack([centroids, dbscan_centers]) if len(dbscan_centers) > 0 else centroids

    # De-duplicate candidates within 500m
    unique = [all_candidates[0]]
    for c in all_candidates[1:]:
        if all(haversine_distance(c[0], c[1], u[0], u[1]) > 0.5 for u in unique):
            unique.append(c)
    candidates = np.array(unique)

    # Compute scores for each candidate
    scored = []
    for i, (lat, lng) in enumerate(candidates):
        zone = point_in_zone(lat, lng, ZONE_CENTERS)

        # 1. EV Density Score (0-1)
        zone_evs = len(evs[evs["zone"] == zone])
        ev_density = zone_evs / max(evs.groupby("zone").size().max(), 1)

        # 2. Coverage Gap Score (0-1): distance to nearest existing station
        _, nearest_dist = find_nearest_station(lat, lng, stations)
        coverage_gap = min(nearest_dist / 5.0, 1.0)  # normalize, max 5km

        # 3. Demand Growth Score (0-1): recent registration trend
        zone_evs_df = evs[evs["zone"] == zone].copy()
        zone_evs_df["registration_date"] = pd.to_datetime(zone_evs_df["registration_date"])
        recent = zone_evs_df[zone_evs_df["registration_date"] >= "2025-01-01"]
        growth_rate = len(recent) / max(len(zone_evs_df), 1)
        demand_growth = min(growth_rate * 2, 1.0)

        # 4. Grid Headroom Score (0-1)
        zone_grid = grid[grid["zone"] == zone]
        if not zone_grid.empty:
            headroom = zone_grid["headroom_pct"].iloc[0] / 100
        else:
            headroom = 0.5
        grid_headroom = min(headroom, 1.0)

        # Composite score
        score = (
            0.35 * ev_density +
            0.25 * coverage_gap +
            0.20 * demand_growth +
            0.20 * grid_headroom
        )

        # Count nearby existing stations
        nearby = stations.apply(
            lambda r: haversine_distance(lat, lng, r["lat"], r["lng"]) < 2.0, axis=1
        ).sum()

        scored.append({
            "lat": round(float(lat), 6),
            "lng": round(float(lng), 6),
            "zone": zone,
            "score": round(float(score), 4),
            "ev_density_score": round(float(ev_density), 3),
            "coverage_gap_score": round(float(coverage_gap), 3),
            "demand_growth_score": round(float(demand_growth), 3),
            "grid_headroom_score": round(float(grid_headroom), 3),
            "nearby_existing_stations": int(nearby),
            "nearest_station_km": round(float(nearest_dist), 2),
        })

    # Sort and rank
    scored.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scored):
        s["rank"] = i + 1

    top = scored[:num_recommendations]

    return {
        "recommendations": top,
        "summary": {
            "total_candidates_analyzed": len(candidates),
            "recommendations_returned": len(top),
            "top_zone": top[0]["zone"] if top else "",
            "avg_score": round(np.mean([s["score"] for s in top]), 3) if top else 0,
            "zones_covered": len(set(s["zone"] for s in top)),
        }
    }


if __name__ == "__main__":
    result = recommend_stations()
    import json
    print(json.dumps(result["summary"], indent=2))
    for r in result["recommendations"][:5]:
        print(f"  #{r['rank']} {r['zone']} — score {r['score']} — {r['nearest_station_km']}km to nearest")
