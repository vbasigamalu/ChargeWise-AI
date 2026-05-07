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

* **Middleware/Backend:** Node.js + Express (Port 5000)
    * Uses a `child_process` bridge to execute Python ML scripts on-demand.
* **ML Logic:** Python 3.12 (Pandas, Scikit-learn, XGBoost, SHAP).
* **Frontend:** React + Vite + Chart.js + Leaflet (Port 5173).

## Getting Started

### 1. Setup Python Environment
Ensure you have **Python 3.12** installed.

```bash
cd python
pip install -r requirements.txt

# Generate data & train models
py -3.12 generators/generate_ev_registrations.py
py -3.12 generators/generate_charging_sessions.py
py -3.12 generators/generate_grid_capacity.py
py -3.12 generators/generate_stations.py
py -3.12 generators/generate_zones_geojson.py
py -3.12 training/train_demand_model.py
py -3.12 training/train_clustering.py
```

### 2. Start Backend (Node.js)
The backend spawns Python scripts directly, so no Flask server is needed.

```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```

### 3. Start Frontend (React)

```bash
cd client
npm install
npm run dev
# Dashboard runs on http://localhost:5173
```

## Hackathon Details
* **Event:** AI for Bharat 2026
* **Client:** BESCOM, Bengaluru
* **Team:** 5 members
