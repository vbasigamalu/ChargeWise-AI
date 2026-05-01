"""
Train K-Means + DBSCAN clustering for station location recommendation.
Identifies demand centroids and dense clusters for candidate placement.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
import joblib

from utils.data_loader import load_ev_registrations, load_charging_stations, get_model_path
from utils.geo_utils import ZONE_CENTERS


def train():
    print("[*] Loading EV registrations and stations...")
    evs = load_ev_registrations()
    stations = load_charging_stations()

    # Build feature matrix: each EV's zone center + noise for spatial spread
    np.random.seed(42)
    ev_points = []
    for _, row in evs.iterrows():
        center = ZONE_CENTERS.get(row["zone"])
        if center:
            lat = center["lat"] + np.random.normal(0, 0.008)
            lng = center["lng"] + np.random.normal(0, 0.008)
            ev_points.append([lat, lng])

    ev_coords = np.array(ev_points)

    # --- K-Means: find 15 demand centroids ---
    print("[*] Running K-Means (k=15)...")
    kmeans = KMeans(n_clusters=15, random_state=42, n_init=10)
    kmeans.fit(ev_coords)
    centroids = kmeans.cluster_centers_
    print(f"    Found {len(centroids)} demand centroids")

    # --- DBSCAN: find dense clusters ---
    print("[*] Running DBSCAN (eps=0.008 ≈ 0.9km)...")
    scaler = StandardScaler()
    ev_scaled = scaler.fit_transform(ev_coords)

    dbscan = DBSCAN(eps=0.5, min_samples=30)
    dbscan_labels = dbscan.fit_predict(ev_scaled)
    n_clusters = len(set(dbscan_labels)) - (1 if -1 in dbscan_labels else 0)
    print(f"    Found {n_clusters} dense clusters")

    # Compute DBSCAN cluster centers
    dbscan_centers = []
    for label in set(dbscan_labels):
        if label == -1:
            continue
        mask = dbscan_labels == label
        center = ev_coords[mask].mean(axis=0)
        dbscan_centers.append(center)
    dbscan_centers = np.array(dbscan_centers) if dbscan_centers else np.empty((0, 2))

    # Save artifacts
    joblib.dump(kmeans, get_model_path("kmeans_stations.pkl"))
    joblib.dump(scaler, get_model_path("scaler_stations.pkl"))
    joblib.dump(centroids, get_model_path("demand_centroids.pkl"))
    joblib.dump(dbscan_centers, get_model_path("dbscan_centers.pkl"))

    print(f"\n[✓] Clustering models saved to {os.path.dirname(get_model_path(''))}")

    return {
        "kmeans_centroids": len(centroids),
        "dbscan_clusters": n_clusters,
    }


if __name__ == "__main__":
    train()
