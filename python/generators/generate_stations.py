"""
Generate existing charging station data with real Bengaluru coordinates.
Intentional coverage gaps in some zones for the recommender to discover.
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

# Zone centers with approximate real coordinates
ZONES = {
    "Koramangala":      {"lat": 12.9352, "lng": 77.6245, "stations": 5},
    "Whitefield":       {"lat": 12.9698, "lng": 77.7500, "stations": 6},
    "Jayanagar":        {"lat": 12.9250, "lng": 77.5938, "stations": 3},
    "Indiranagar":      {"lat": 12.9784, "lng": 77.6408, "stations": 4},
    "Electronic City":  {"lat": 12.8440, "lng": 77.6765, "stations": 7},
    "Yelahanka":        {"lat": 13.1007, "lng": 77.5963, "stations": 1},   # underserved
    "HSR Layout":       {"lat": 12.9116, "lng": 77.6389, "stations": 3},
    "Marathahalli":     {"lat": 12.9591, "lng": 77.7009, "stations": 4},
    "Rajajinagar":      {"lat": 12.9883, "lng": 77.5533, "stations": 2},   # underserved
    "BTM Layout":       {"lat": 12.9166, "lng": 77.6101, "stations": 2},
    "Hebbal":           {"lat": 13.0358, "lng": 77.5970, "stations": 2},   # underserved
    "Banashankari":     {"lat": 12.9255, "lng": 77.5468, "stations": 1},   # underserved
}

CHARGER_TYPES = ["Slow AC (3.3kW)", "Fast AC (7.4kW)", "DC Fast (50kW)"]
CHARGER_PROBS = [0.4, 0.35, 0.25]


def generate():
    records = []
    sid = 1

    for zone_name, info in ZONES.items():
        center_lat = info["lat"]
        center_lng = info["lng"]
        num_stations = info["stations"]

        for s in range(num_stations):
            # Scatter stations within ~1.5 km of zone center
            lat = center_lat + np.random.uniform(-0.012, 0.012)
            lng = center_lng + np.random.uniform(-0.012, 0.012)

            charger_type = np.random.choice(CHARGER_TYPES, p=CHARGER_PROBS)
            num_chargers = np.random.randint(2, 12)

            # Utilization — high demand zones have higher utilization
            base_util = info["stations"]  # more stations = more popular zone
            avg_util = min(95, max(20, np.random.normal(55 + base_util * 3, 15)))

            records.append({
                "station_id": f"STN-{sid:03d}",
                "station_name": f"{zone_name} Station {s+1}",
                "zone": zone_name,
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "num_chargers": num_chargers,
                "charger_type": charger_type,
                "avg_utilization_pct": round(avg_util, 1),
                "is_operational": True,
            })
            sid += 1

    df = pd.DataFrame(records)
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "charging_stations.csv")
    df.to_csv(out_path, index=False)
    print(f"[✓] Generated {len(df)} charging stations → {out_path}")
    return df


if __name__ == "__main__":
    generate()
