import sys
import os
import json
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, np.bool_): return bool(obj)
        return super(NumpyEncoder, self).default(obj)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing function argument"}))
        sys.exit(1)
        
    func_name = sys.argv[1]
    
    # Read JSON arguments from stdin
    input_data = sys.stdin.read()
    try:
        kwargs = json.loads(input_data) if input_data.strip() else {}
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)
        
    try:
        if func_name == "predict_demand":
            from scripts.predict_demand import predict_demand
            result = predict_demand(**kwargs)
        elif func_name == "smart_schedule":
            from scripts.smart_schedule import smart_schedule
            result = smart_schedule(**kwargs)
        elif func_name == "recommend_stations":
            from scripts.recommend_stations import recommend_stations
            result = recommend_stations(**kwargs)
        elif func_name == "validate_grid_constraints":
            from scripts.grid_constraints import validate_grid_constraints
            result = validate_grid_constraints(**kwargs)
        elif func_name == "get_surge_alerts":
            from scripts.surge_alerts import get_surge_alerts
            result = get_surge_alerts(**kwargs)
        elif func_name == "run_simulation":
            from scripts.scenario_simulation import run_simulation
            result = run_simulation(**kwargs)
        elif func_name == "explain_prediction":
            from scripts.explain_shap import explain_prediction
            result = explain_prediction(**kwargs)
        elif func_name == "get_existing_stations":
            from utils.data_loader import load_charging_stations
            stations = load_charging_stations()
            result = {"stations": stations.to_dict(orient="records")}
        elif func_name == "get_zones":
            from utils.data_loader import load_zones_geojson
            result = load_zones_geojson()
        else:
            print(json.dumps({"error": f"Unknown function: {func_name}"}))
            sys.exit(1)
            
        print(json.dumps(result, cls=NumpyEncoder))
        
    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
