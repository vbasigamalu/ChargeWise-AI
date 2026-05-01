"""
Generate a GeoJSON file with approximate polygon boundaries for 12 Bengaluru zones.
Used for heatmap rendering and geospatial visualizations.
"""

import json
import os


def make_zone_polygon(center_lat, center_lng, size=0.015):
    """Create a simple rectangular polygon around a center point."""
    return [
        [center_lng - size, center_lat - size],
        [center_lng + size, center_lat - size],
        [center_lng + size, center_lat + size],
        [center_lng - size, center_lat + size],
        [center_lng - size, center_lat - size],  # close ring
    ]


ZONES = {
    "Koramangala":      {"lat": 12.9352, "lng": 77.6245, "color": "#FF6B6B"},
    "Whitefield":       {"lat": 12.9698, "lng": 77.7500, "color": "#4ECDC4"},
    "Jayanagar":        {"lat": 12.9250, "lng": 77.5938, "color": "#45B7D1"},
    "Indiranagar":      {"lat": 12.9784, "lng": 77.6408, "color": "#96CEB4"},
    "Electronic City":  {"lat": 12.8440, "lng": 77.6765, "color": "#FFEAA7"},
    "Yelahanka":        {"lat": 13.1007, "lng": 77.5963, "color": "#DDA0DD"},
    "HSR Layout":       {"lat": 12.9116, "lng": 77.6389, "color": "#98D8C8"},
    "Marathahalli":     {"lat": 12.9591, "lng": 77.7009, "color": "#F7DC6F"},
    "Rajajinagar":      {"lat": 12.9883, "lng": 77.5533, "color": "#BB8FCE"},
    "BTM Layout":       {"lat": 12.9166, "lng": 77.6101, "color": "#82E0AA"},
    "Hebbal":           {"lat": 13.0358, "lng": 77.5970, "color": "#F0B27A"},
    "Banashankari":     {"lat": 12.9255, "lng": 77.5468, "color": "#AED6F1"},
}


def generate():
    features = []
    for name, info in ZONES.items():
        polygon = make_zone_polygon(info["lat"], info["lng"])
        features.append({
            "type": "Feature",
            "properties": {
                "name": name,
                "color": info["color"],
                "center_lat": info["lat"],
                "center_lng": info["lng"],
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon],
            },
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "zones.geojson")
    with open(out_path, "w") as f:
        json.dump(geojson, f, indent=2)
    print(f"[✓] Generated GeoJSON for {len(features)} zones → {out_path}")


if __name__ == "__main__":
    generate()
