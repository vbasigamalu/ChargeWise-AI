"""
Generate synthetic grid capacity data per zone.
Some zones near capacity (85-92%), others with headroom (40-60%).
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

ZONES = {
    "Koramangala":      {"max_kW": 800,  "base_load_pct": 0.72, "feeders": 3},
    "Whitefield":       {"max_kW": 1200, "base_load_pct": 0.85, "feeders": 4},
    "Jayanagar":        {"max_kW": 700,  "base_load_pct": 0.58, "feeders": 2},
    "Indiranagar":      {"max_kW": 900,  "base_load_pct": 0.76, "feeders": 3},
    "Electronic City":  {"max_kW": 1500, "base_load_pct": 0.89, "feeders": 5},
    "Yelahanka":        {"max_kW": 600,  "base_load_pct": 0.42, "feeders": 2},
    "HSR Layout":       {"max_kW": 750,  "base_load_pct": 0.68, "feeders": 3},
    "Marathahalli":     {"max_kW": 850,  "base_load_pct": 0.80, "feeders": 3},
    "Rajajinagar":      {"max_kW": 650,  "base_load_pct": 0.55, "feeders": 2},
    "BTM Layout":       {"max_kW": 700,  "base_load_pct": 0.65, "feeders": 2},
    "Hebbal":           {"max_kW": 800,  "base_load_pct": 0.60, "feeders": 3},
    "Banashankari":     {"max_kW": 650,  "base_load_pct": 0.50, "feeders": 2},
}


def generate():
    records = []

    for zone_name, info in ZONES.items():
        max_kW = info["max_kW"]
        base_pct = info["base_load_pct"]
        num_feeders = info["feeders"]
        current_base_load = round(max_kW * base_pct, 1)
        headroom_kW = round(max_kW - current_base_load, 1)
        headroom_pct = round((1 - base_pct) * 100, 1)

        # Per-feeder breakdown
        feeder_max = round(max_kW / num_feeders, 1)

        for f in range(1, num_feeders + 1):
            feeder_load_pct = base_pct + np.random.uniform(-0.05, 0.08)
            feeder_load_pct = min(feeder_load_pct, 0.98)
            feeder_current = round(feeder_max * feeder_load_pct, 1)

            records.append({
                "zone": zone_name,
                "transformer_id": f"TX-{zone_name[:3].upper()}-01",
                "transformer_max_kW": max_kW,
                "transformer_current_load_kW": current_base_load,
                "transformer_utilization_pct": round(base_pct * 100, 1),
                "feeder_id": f"FDR-{zone_name[:3].upper()}-{f:02d}",
                "feeder_max_kW": feeder_max,
                "feeder_current_load_kW": feeder_current,
                "feeder_utilization_pct": round(feeder_load_pct * 100, 1),
                "headroom_kW": headroom_kW,
                "headroom_pct": headroom_pct,
            })

    df = pd.DataFrame(records)
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "grid_capacity.csv")
    df.to_csv(out_path, index=False)
    print(f"[✓] Generated {len(df)} grid capacity records → {out_path}")
    return df


if __name__ == "__main__":
    generate()
