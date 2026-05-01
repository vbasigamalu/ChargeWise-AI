"""
Geospatial utilities for station recommendation and zone operations.
"""

import numpy as np


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two lat/lng points."""
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c


def find_nearest_station(lat, lng, stations_df):
    """Find the nearest existing station and its distance."""
    distances = stations_df.apply(
        lambda row: haversine_distance(lat, lng, row["lat"], row["lng"]),
        axis=1
    )
    min_idx = distances.idxmin()
    return stations_df.loc[min_idx, "station_id"], distances[min_idx]


def point_in_zone(lat, lng, zones):
    """
    Determine which zone a lat/lng falls in.
    Simple nearest-center approach.
    """
    min_dist = float("inf")
    best_zone = None
    for zone_name, info in zones.items():
        d = haversine_distance(lat, lng, info["lat"], info["lng"])
        if d < min_dist:
            min_dist = d
            best_zone = zone_name
    return best_zone


ZONE_CENTERS = {
    "Koramangala":      {"lat": 12.9352, "lng": 77.6245},
    "Whitefield":       {"lat": 12.9698, "lng": 77.7500},
    "Jayanagar":        {"lat": 12.9250, "lng": 77.5938},
    "Indiranagar":      {"lat": 12.9784, "lng": 77.6408},
    "Electronic City":  {"lat": 12.8440, "lng": 77.6765},
    "Yelahanka":        {"lat": 13.1007, "lng": 77.5963},
    "HSR Layout":       {"lat": 12.9116, "lng": 77.6389},
    "Marathahalli":     {"lat": 12.9591, "lng": 77.7009},
    "Rajajinagar":      {"lat": 12.9883, "lng": 77.5533},
    "BTM Layout":       {"lat": 12.9166, "lng": 77.6101},
    "Hebbal":           {"lat": 13.0358, "lng": 77.5970},
    "Banashankari":     {"lat": 12.9255, "lng": 77.5468},
}
