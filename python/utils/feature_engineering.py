"""
Feature engineering for demand prediction model.
Transforms raw charging sessions into ML-ready features.
"""

import pandas as pd
import numpy as np


def engineer_demand_features(sessions_df):
    """
    Aggregate charging sessions to hourly demand per zone,
    then create time-series features for the demand model.
    """
    df = sessions_df.copy()
    df["start_time"] = pd.to_datetime(df["start_time"])
    df["date"] = df["start_time"].dt.date
    df["hour"] = df["start_time"].dt.hour

    # Aggregate: total energy demand per zone per hour per day
    hourly = df.groupby(["zone", "date", "hour"]).agg(
        total_energy_kWh=("energy_kWh", "sum"),
        session_count=("session_id", "count"),
        avg_duration_min=("duration_min", "mean"),
        avg_temperature=("temperature", "mean"),
    ).reset_index()

    hourly["date"] = pd.to_datetime(hourly["date"])
    hourly["day_of_week"] = hourly["date"].dt.dayofweek
    hourly["month"] = hourly["date"].dt.month
    hourly["is_weekend"] = (hourly["day_of_week"] >= 5).astype(int)
    hourly["is_peak"] = hourly["hour"].apply(lambda h: 1 if 18 <= h <= 21 else 0)

    # Cyclical encoding for hour and day_of_week
    hourly["hour_sin"] = np.sin(2 * np.pi * hourly["hour"] / 24)
    hourly["hour_cos"] = np.cos(2 * np.pi * hourly["hour"] / 24)
    hourly["dow_sin"] = np.sin(2 * np.pi * hourly["day_of_week"] / 7)
    hourly["dow_cos"] = np.cos(2 * np.pi * hourly["day_of_week"] / 7)

    # Zone encoding (label encoding)
    zone_map = {z: i for i, z in enumerate(sorted(hourly["zone"].unique()))}
    hourly["zone_encoded"] = hourly["zone"].map(zone_map)

    # Sort for lag features
    hourly = hourly.sort_values(["zone", "date", "hour"]).reset_index(drop=True)

    # Rolling and lag features per zone
    for zone in hourly["zone"].unique():
        mask = hourly["zone"] == zone
        zone_data = hourly.loc[mask, "total_energy_kWh"]

        # Lag features
        hourly.loc[mask, "lag_1h"] = zone_data.shift(1)
        hourly.loc[mask, "lag_24h"] = zone_data.shift(24)

        # Rolling averages
        hourly.loc[mask, "rolling_24h_mean"] = zone_data.rolling(24, min_periods=1).mean()
        hourly.loc[mask, "rolling_7d_mean"] = zone_data.rolling(168, min_periods=1).mean()

    # Fill NaNs from lag/rolling
    hourly = hourly.fillna(0)

    return hourly, zone_map


def get_feature_columns():
    """Return the list of feature columns used by the demand model."""
    return [
        "hour", "day_of_week", "month", "is_weekend", "is_peak",
        "hour_sin", "hour_cos", "dow_sin", "dow_cos",
        "zone_encoded", "avg_temperature", "session_count",
        "avg_duration_min", "lag_1h", "lag_24h",
        "rolling_24h_mean", "rolling_7d_mean",
    ]


def get_feature_names_readable():
    """Human-readable feature names for SHAP explanations."""
    return [
        "Hour of Day", "Day of Week", "Month", "Weekend",
        "Peak Hour (6-10PM)", "Hour (cyclic sin)", "Hour (cyclic cos)",
        "Day (cyclic sin)", "Day (cyclic cos)", "Zone",
        "Temperature (°C)", "Session Count", "Avg Duration (min)",
        "Demand 1h Ago", "Demand 24h Ago",
        "24h Rolling Avg", "7-Day Rolling Avg",
    ]
