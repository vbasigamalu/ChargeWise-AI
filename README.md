# EVOPT — AI-Based EV Charging Optimization

An AI-powered decision-support overlay for BESCOM Bengaluru, designed to optimize EV charging behavior and infrastructure planning.

## Overview

EVOPT addresses the core challenges of urban EV adoption:
1. Uncoordinated evening peak charging (stressing the grid)
2. Data-blind infrastructure planning (leading to underserved zones)

This system provides an intelligent decision-support layer operating on top of existing grid infrastructure, requiring no modifications to live systems.

## Features

1. **Demand Prediction:** RF + XGBoost ensemble forecasting zone-wise charging demand.
2. **Smart Scheduling:** Load-shifting recommendation engine to flatten peak curves.
3. **Station Location Recommender:** K-Means + DBSCAN clustering for candidate placements.
4. **Grid Constraint Engine:** Ensures recommendations respect transformer/feeder capacities.
5. **Surge Alert System:** Anomaly detection for zones approaching load limits.
6. **Scenario Simulation:** Models EV growth and scheduling adoption impacts.
7. **Explainable AI (XAI):** SHAP values providing human-readable reasoning.
8. **Operator Dashboard:** React + Chart.js interactive UI with dark glassmorphism design.

## Architecture

* **Backend:** Python (Pandas, Scikit-learn, XGBoost, SHAP) exposes ML via Flask API
* **Middleware:** Node.js / Express handles routing and bridging
* **Frontend:** React + Vite + Chart.js + Leaflet

## Getting Started

### 1. Generate Datasets & Train Models (Python)

```bash
cd python
pip install -r requirements.txt

# Generate synthetic data for Bengaluru
python generators/generate_ev_registrations.py
python generators/generate_charging_sessions.py
python generators/generate_grid_capacity.py
python generators/generate_stations.py
python generators/generate_zones_geojson.py

# Train models
python training/train_demand_model.py
python training/train_clustering.py

# Start ML API server (runs on port 5001)
python app.py
```

### 2. Start Middleware (Node.js)

```bash
cd server
npm install
npm start
# Runs on port 5000, proxies requests to Python API
```

### 3. Start Frontend (React)

```bash
cd client
npm install
npm run dev
# Runs on port 5173
```

## Hackathon Details
* **Event:** AI for Bharat 2025
* **Client:** BESCOM, Bengaluru
* **Team:** 2 members
* **Timeframe:** 4 days
