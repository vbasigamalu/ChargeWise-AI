"""
Generate ~50,000 synthetic EV charging sessions over 12 months.
Key pattern: 65% of sessions concentrated in 6 PM – 10 PM peak window.
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

ZONES = [
    "Koramangala", "Whitefield", "Jayanagar", "Indiranagar",
    "Electronic City", "Yelahanka", "HSR Layout", "Marathahalli",
    "Rajajinagar", "BTM Layout", "Hebbal", "Banashankari"
]

TOTAL_SESSIONS = 50000

# Hourly probability distribution — strong evening peak
HOUR_PROBS = np.array([
    0.008, 0.005, 0.004, 0.003, 0.003, 0.005,   # 0-5 AM  (low)
    0.010, 0.015, 0.025, 0.035, 0.040, 0.035,     # 6-11 AM (morning ramp)
    0.030, 0.028, 0.025, 0.030, 0.040, 0.055,     # 12-5 PM (afternoon)
    0.085, 0.105, 0.115, 0.100, 0.070, 0.040,     # 6-11 PM (PEAK)
])
HOUR_PROBS = HOUR_PROBS / HOUR_PROBS.sum()

VEHICLE_TYPES = ["2W", "3W", "4W"]
VT_ENERGY = {"2W": (0.5, 3.0), "3W": (2.0, 7.0), "4W": (8.0, 50.0)}
VT_DURATION = {"2W": (15, 60), "3W": (30, 90), "4W": (30, 240)}  # minutes


def generate():
    records = []

    start_date = pd.Timestamp("2024-06-01")
    end_date = pd.Timestamp("2025-05-31")
    date_range_days = (end_date - start_date).days

    for i in range(TOTAL_SESSIONS):
        zone = np.random.choice(ZONES)
        day_offset = np.random.randint(0, date_range_days)
        session_date = start_date + pd.Timedelta(days=day_offset)
        day_of_week = session_date.dayofweek
        is_weekend = 1 if day_of_week >= 5 else 0

        # Adjust hour distribution for weekends (more midday charging)
        if is_weekend:
            probs = HOUR_PROBS.copy()
            probs[10:16] *= 1.4   # boost midday
            probs[18:22] *= 0.85  # slightly less peak
            probs = probs / probs.sum()
        else:
            probs = HOUR_PROBS

        hour = np.random.choice(24, p=probs)
        minute = np.random.randint(0, 60)
        start_time = session_date.replace(hour=hour, minute=minute)

        vtype = np.random.choice(VEHICLE_TYPES, p=[0.45, 0.15, 0.40])
        e_lo, e_hi = VT_ENERGY[vtype]
        energy_kWh = round(np.random.uniform(e_lo, e_hi), 2)

        d_lo, d_hi = VT_DURATION[vtype]
        duration_min = np.random.randint(d_lo, d_hi)
        end_time = start_time + pd.Timedelta(minutes=duration_min)

        temperature = round(np.random.normal(28, 4), 1)  # Bengaluru avg
        is_peak = 1 if 18 <= hour <= 21 else 0

        # Day type
        day_type = "weekend" if is_weekend else "weekday"
        # ~5% holidays
        if np.random.random() < 0.05:
            day_type = "holiday"

        station_id = f"STN-{zone[:3].upper()}-{np.random.randint(1, 6):02d}"

        records.append({
            "session_id": f"S-{i+1:06d}",
            "vehicle_id": f"EV-{np.random.randint(1, 6001):05d}",
            "zone": zone,
            "station_id": station_id,
            "vehicle_type": vtype,
            "start_time": start_time.strftime("%Y-%m-%d %H:%M"),
            "end_time": end_time.strftime("%Y-%m-%d %H:%M"),
            "energy_kWh": energy_kWh,
            "duration_min": duration_min,
            "hour": hour,
            "day_of_week": day_of_week,
            "day_type": day_type,
            "is_weekend": is_weekend,
            "is_peak": is_peak,
            "temperature": temperature,
            "month": session_date.month,
        })

    df = pd.DataFrame(records)
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "charging_sessions.csv")
    df.to_csv(out_path, index=False)
    print(f"[✓] Generated {len(df)} charging sessions → {out_path}")
    return df


if __name__ == "__main__":
    generate()
