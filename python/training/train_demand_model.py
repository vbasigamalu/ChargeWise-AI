"""
Train Random Forest + XGBoost ensemble for zone-wise demand prediction.
Saves trained models to python/models/
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import joblib

from utils.data_loader import load_charging_sessions, get_model_path
from utils.feature_engineering import engineer_demand_features, get_feature_columns


def train():
    print("[*] Loading charging sessions...")
    sessions = load_charging_sessions()

    print("[*] Engineering features...")
    hourly, zone_map = engineer_demand_features(sessions)

    feature_cols = get_feature_columns()
    target_col = "total_energy_kWh"

    X = hourly[feature_cols].values
    y = hourly[target_col].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # --- Random Forest ---
    print("[*] Training Random Forest...")
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)

    print(f"    RF  MAE:  {mean_absolute_error(y_test, rf_pred):.2f} kWh")
    print(f"    RF  RMSE: {np.sqrt(mean_squared_error(y_test, rf_pred)):.2f} kWh")
    print(f"    RF  R²:   {r2_score(y_test, rf_pred):.4f}")

    # --- XGBoost ---
    print("[*] Training XGBoost...")
    xgb_model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)

    print(f"    XGB MAE:  {mean_absolute_error(y_test, xgb_pred):.2f} kWh")
    print(f"    XGB RMSE: {np.sqrt(mean_squared_error(y_test, xgb_pred)):.2f} kWh")
    print(f"    XGB R²:   {r2_score(y_test, xgb_pred):.4f}")

    # --- Ensemble (0.4 RF + 0.6 XGB) ---
    ensemble_pred = 0.4 * rf_pred + 0.6 * xgb_pred
    mae = mean_absolute_error(y_test, ensemble_pred)
    rmse = np.sqrt(mean_squared_error(y_test, ensemble_pred))
    r2 = r2_score(y_test, ensemble_pred)

    print(f"\n[✓] Ensemble MAE:  {mae:.2f} kWh")
    print(f"[✓] Ensemble RMSE: {rmse:.2f} kWh")
    print(f"[✓] Ensemble R²:   {r2:.4f}")

    # Save models
    joblib.dump(rf, get_model_path("rf_demand.pkl"))
    joblib.dump(xgb_model, get_model_path("xgb_demand.pkl"))
    joblib.dump(zone_map, get_model_path("zone_map.pkl"))

    print(f"\n[✓] Models saved to {os.path.dirname(get_model_path(''))}")

    return {"mae": mae, "rmse": rmse, "r2": r2}


if __name__ == "__main__":
    train()
