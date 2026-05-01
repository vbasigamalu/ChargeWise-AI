"""
Flask API Server for EVOPT — exposes all ML features as REST endpoints.
Runs on port 5001. Node.js middleware calls this service.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# ─── Health Check ────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "evopt-ml-api"})


# ─── Feature 1: Demand Prediction ───────────────────────────────
@app.route("/api/demand/predict", methods=["POST"])
def demand_predict():
    try:
        from scripts.predict_demand import predict_demand
        data = request.get_json() or {}
        zone = data.get("zone", "all")
        hours = data.get("hours", None)
        result = predict_demand(zone=zone, hours=hours)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/demand/heatmap", methods=["GET"])
def demand_heatmap():
    try:
        from scripts.predict_demand import predict_demand
        result = predict_demand(zone="all")
        return jsonify({
            "heatmap_data": result["heatmap_data"],
            "summary": result["summary"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Feature 2: Smart Scheduling ────────────────────────────────
@app.route("/api/schedule/recommend", methods=["POST"])
def schedule_recommend():
    try:
        from scripts.smart_schedule import smart_schedule
        data = request.get_json() or {}
        zone = data.get("zone", "all")
        result = smart_schedule(zone=zone)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/schedule/load-curve/<zone>", methods=["GET"])
def schedule_load_curve(zone):
    try:
        from scripts.smart_schedule import smart_schedule
        result = smart_schedule(zone=zone)
        if result["schedules"]:
            return jsonify(result["schedules"][0])
        return jsonify({"error": "Zone not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Feature 3: Station Recommender ─────────────────────────────
@app.route("/api/stations/recommend", methods=["GET"])
def stations_recommend():
    try:
        from scripts.recommend_stations import recommend_stations
        n = request.args.get("count", 15, type=int)
        result = recommend_stations(num_recommendations=n)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stations/existing", methods=["GET"])
def stations_existing():
    try:
        from utils.data_loader import load_charging_stations
        stations = load_charging_stations()
        return jsonify({"stations": stations.to_dict(orient="records")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Feature 4: Grid Constraints ────────────────────────────────
@app.route("/api/grid/status", methods=["GET"])
def grid_status():
    try:
        from scripts.grid_constraints import validate_grid_constraints
        result = validate_grid_constraints()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/grid/validate", methods=["POST"])
def grid_validate():
    try:
        from scripts.grid_constraints import validate_grid_constraints
        data = request.get_json() or {}
        result = validate_grid_constraints(
            recommendations=data.get("recommendations", []),
            constraint_type=data.get("type", "stations"),
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Feature 5: Surge Alerts ────────────────────────────────────
@app.route("/api/alerts/current", methods=["GET"])
def alerts_current():
    try:
        from scripts.surge_alerts import get_surge_alerts
        zone = request.args.get("zone", "all")
        threshold = request.args.get("threshold", 85, type=int)
        result = get_surge_alerts(zone=zone, threshold_pct=threshold)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Feature 6: Scenario Simulation ─────────────────────────────
@app.route("/api/simulation/run", methods=["POST"])
def simulation_run():
    try:
        from scripts.scenario_simulation import run_simulation
        data = request.get_json() or {}
        result = run_simulation(
            ev_growth_pct=data.get("ev_growth_pct", 30),
            new_stations=data.get("new_stations", []),
            scheduling_adoption_pct=data.get("scheduling_adoption_pct", 50),
            time_horizon_months=data.get("time_horizon_months", 12),
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Feature 7: SHAP Explainability ─────────────────────────────
@app.route("/api/explain/shap", methods=["POST"])
def explain_shap():
    try:
        from scripts.explain_shap import explain_prediction
        data = request.get_json() or {}
        result = explain_prediction(
            zone=data.get("zone", "Koramangala"),
            hour=data.get("hour", 19),
            explain_type=data.get("type", "demand"),
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Zones GeoJSON ──────────────────────────────────────────────
@app.route("/api/zones", methods=["GET"])
def get_zones():
    try:
        from utils.data_loader import load_zones_geojson
        return jsonify(load_zones_geojson())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("  EVOPT ML API Server — http://localhost:5001")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5001, debug=True)
