"""
Generate synthetic EV registration data for 12 Bengaluru zones.
Produces ~6,000 records weighted by zone population density.
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

ZONES = {
    "Koramangala":      {"lat": 12.9352, "lng": 77.6245, "density_weight": 1.3},
    "Whitefield":       {"lat": 12.9698, "lng": 77.7500, "density_weight": 1.5},
    "Jayanagar":        {"lat": 12.9250, "lng": 77.5938, "density_weight": 1.0},
    "Indiranagar":      {"lat": 12.9784, "lng": 77.6408, "density_weight": 1.2},
    "Electronic City":  {"lat": 12.8440, "lng": 77.6765, "density_weight": 1.6},
    "Yelahanka":        {"lat": 13.1007, "lng": 77.5963, "density_weight": 0.7},
    "HSR Layout":       {"lat": 12.9116, "lng": 77.6389, "density_weight": 1.1},
    "Marathahalli":     {"lat": 12.9591, "lng": 77.7009, "density_weight": 1.3},
    "Rajajinagar":      {"lat": 12.9883, "lng": 77.5533, "density_weight": 0.8},
    "BTM Layout":       {"lat": 12.9166, "lng": 77.6101, "density_weight": 1.0},
    "Hebbal":           {"lat": 13.0358, "lng": 77.5970, "density_weight": 0.9},
    "Banashankari":     {"lat": 12.9255, "lng": 77.5468, "density_weight": 0.8},
}

VEHICLE_TYPES = {
    "2W": {"pct": 0.45, "battery_range": (1.5, 4.0)},
    "3W": {"pct": 0.15, "battery_range": (5.0, 10.0)},
    "4W": {"pct": 0.40, "battery_range": (30.0, 75.0)},
}

TOTAL_REGISTRATIONS = 6000

def generate():
    records = []
    vid = 1

    # Calculate per-zone registration count
    total_weight = sum(z["density_weight"] for z in ZONES.values())
    zone_counts = {
        name: int(TOTAL_REGISTRATIONS * z["density_weight"] / total_weight)
        for name, z in ZONES.items()
    }

    start_date = pd.Timestamp("2023-01-01")
    end_date = pd.Timestamp("2025-05-31")
    date_range_days = (end_date - start_date).days

    for zone_name, count in zone_counts.items():
        for _ in range(count):
            # Pick vehicle type
            vtype = np.random.choice(
                list(VEHICLE_TYPES.keys()),
                p=[v["pct"] for v in VEHICLE_TYPES.values()]
            )
            batt_lo, batt_hi = VEHICLE_TYPES[vtype]["battery_range"]
            battery_kWh = round(np.random.uniform(batt_lo, batt_hi), 1)

            # Registration date — more recent dates more likely (EV adoption curve)
            day_offset = int(np.random.beta(2, 5) * date_range_days)
            reg_date = start_date + pd.Timedelta(days=date_range_days - day_offset)

            records.append({
                "vehicle_id": f"EV-{vid:05d}",
                "zone": zone_name,
                "vehicle_type": vtype,
                "battery_capacity_kWh": battery_kWh,
                "registration_date": reg_date.strftime("%Y-%m-%d"),
            })
            vid += 1

    df = pd.DataFrame(records)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "ev_registrations.csv")
    df.to_csv(out_path, index=False)
    print(f"[✓] Generated {len(df)} EV registrations → {out_path}")
    return df

if __name__ == "__main__":
    generate()
