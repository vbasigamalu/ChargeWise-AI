"""
Shared data loading utilities for all ML scripts.
"""

import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def load_charging_sessions():
    return pd.read_csv(os.path.join(DATA_DIR, "charging_sessions.csv"))


def load_ev_registrations():
    return pd.read_csv(os.path.join(DATA_DIR, "ev_registrations.csv"))


def load_grid_capacity():
    return pd.read_csv(os.path.join(DATA_DIR, "grid_capacity.csv"))


def load_charging_stations():
    return pd.read_csv(os.path.join(DATA_DIR, "charging_stations.csv"))


def load_zones_geojson():
    import json
    with open(os.path.join(DATA_DIR, "zones.geojson"), "r") as f:
        return json.load(f)


def get_model_path(name):
    os.makedirs(MODELS_DIR, exist_ok=True)
    return os.path.join(MODELS_DIR, name)


ZONE_LIST = [
    "Koramangala", "Whitefield", "Jayanagar", "Indiranagar",
    "Electronic City", "Yelahanka", "HSR Layout", "Marathahalli",
    "Rajajinagar", "BTM Layout", "Hebbal", "Banashankari"
]
