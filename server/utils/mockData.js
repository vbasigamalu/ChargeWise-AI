/**
 * Mock Data for EVOPT Hackathon Safety Net
 * Returns high-quality sample data if Python bridges fail in cloud environments.
 */

const mockData = {
  predict_demand: (args) => {
    const zones = ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar", "MG Road"];
    const data = [];
    for (const zone of zones) {
      for (let h = 0; h < 24; h++) {
        data.push({
          zone,
          hour: h,
          predicted_demand_kW: 200 + Math.random() * 800,
          occupancy_pct: 30 + Math.random() * 60
        });
      }
    }
    return { heatmap_data: data, current_hour: new Date().getHours() };
  },

  get_surge_alerts: (args) => ({
    summary: { total_alerts: 3, critical_count: 1 },
    alerts: [
      { zone: "Koramangala", severity: "CRITICAL", message: "Transformer load exceeding 92%", transformer_max_kW: 1200, current_load_kW: 1105 },
      { zone: "Indiranagar", severity: "WARNING", message: "Predicted surge in 45 mins", transformer_max_kW: 800, current_load_kW: 650 },
      { zone: "HSR Layout", severity: "INFO", message: "Optimization sequence active", transformer_max_kW: 1000, current_load_kW: 420 }
    ]
  }),

  validate_grid_constraints: (args) => ({
    status: "HEALTHY",
    summary: { total_capacity_kW: 50000, current_utilization_pct: 68, critical_zones: 0 },
    zone_status: [
      { zone: "Indiranagar", status: "HEALTHY", utilization: 62 },
      { zone: "Koramangala", status: "STRESSED", utilization: 88 }
    ]
  }),

  smart_schedule: (args) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return {
      zone: args.zone || "Indiranagar",
      summary: { avg_peak_reduction_pct: 24, cost_savings_pct: 18 },
      load_curve: hours.map(h => ({
        hour: h,
        baseline_kW: 500 + Math.sin(h / 4) * 200 + 100,
        optimized_kW: 400 + Math.sin(h / 4) * 150 + 50
      })),
      recommendations: [
        { vehicle_id: "EV-9902", current_slot: "18:00", recommended_slot: "22:00", impact: "High" },
        { vehicle_id: "EV-4412", current_slot: "19:30", recommended_slot: "01:00", impact: "Medium" }
      ]
    };
  },

  recommend_stations: (args) => ({
    recommendations: [
      { id: 1, name: "Brigade Road Hub", lat: 12.9716, lng: 77.6046, score: 94, reason: "High traffic density" },
      { id: 2, name: "Tech Park Central", lat: 12.9667, lng: 77.7119, score: 88, reason: "Underserved tech corridor" }
    ]
  }),

  get_zones: (args) => ({
    type: "FeatureCollection",
    features: [] // Simplified for mock
  })
};

module.exports = { mockData };
