/**
 * Mock Data for EVOPT Hackathon Safety Net
 * Returns high-quality sample data if Python bridges fail in cloud environments.
 * Updated to match the exact requirements of all Dashboard, Demand, Schedule, and Station pages.
 */

const ZONES = ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar", "MG Road", "Malleshwaram", "Rajajinagar", "Hebbal", "Electronic City", "Bannerghatta", "Basavanagudi"];

const mockData = {
  predict_demand: (args) => {
    const data = [];
    for (const zone of ZONES) {
      for (let h = 0; h < 24; h++) {
        data.push({
          zone,
          hour: h,
          intensity: 20 + Math.random() * 80,
          occupancy_pct: 30 + Math.random() * 60
        });
      }
    }
    return { 
      heatmap_data: data, 
      current_hour: new Date().getHours(),
      summary: {
        total_predicted_kWh: Math.floor(Math.random() * 50000) + 20000,
        peak_hour: 18,
        peak_zone: "Koramangala",
        zones_analyzed: ZONES.length
      }
    };
  },

  get_surge_alerts: (args) => ({
    summary: { total_alerts: 3, critical_count: 1 },
    alerts: [
      { zone: "Koramangala", severity: "CRITICAL", message: "Transformer load exceeding 92%", transformer_max_kW: 1200, current_load_kW: 1105 },
      { zone: "Indiranagar", severity: "WARNING", message: "Predicted surge in 45 mins", transformer_max_kW: 800, current_load_kW: 650 },
      { zone: "HSR Layout", severity: "INFO", message: "Optimization sequence active", transformer_max_kW: 1000, current_load_kW: 420 }
    ]
  }),

  validate_grid_constraints: (args) => {
    const grid_status = ZONES.map(z => ({
      zone: z,
      transformer_max_kW: 1000 + Math.floor(Math.random() * 500),
      current_load_kW: 600 + Math.floor(Math.random() * 400),
      utilization_pct: 60 + Math.floor(Math.random() * 35),
      headroom_kW: 100 + Math.floor(Math.random() * 200),
      status: Math.random() > 0.8 ? "CRITICAL" : Math.random() > 0.5 ? "STRESSED" : "HEALTHY"
    }));
    return {
      grid_status,
      summary: {
        total_zones: ZONES.length,
        critical_zones: grid_status.filter(g => g.status === "CRITICAL").length,
        warning_zones: grid_status.filter(g => g.status === "STRESSED").length,
        healthy_zones: grid_status.filter(g => g.status === "HEALTHY").length
      }
    };
  },

  smart_schedule: (args) => {
    const schedules = ZONES.map(z => ({
      zone: z,
      peak_reduction_pct: 15 + Math.floor(Math.random() * 15),
      load_curve_before: Array.from({ length: 24 }, (_, i) => 500 + Math.sin(i / 4) * 200 + Math.random() * 100),
      load_curve_after: Array.from({ length: 24 }, (_, i) => 400 + Math.sin(i / 4) * 150 + Math.random() * 80),
      peak_hours: [18, 19, 20],
      off_peak_hours: [1, 2, 3, 4],
      recommendations: [
        { description: "Delay charging for EV-1002 to 22:00", impact: "High", priority: "high", type: "load_shift" },
        { description: "Charge EV-4491 at 02:00", impact: "Medium", priority: "normal", type: "off_peak" }
      ]
    }));
    return {
      schedules,
      summary: {
        avg_peak_reduction_pct: 22,
        total_shift_potential_kWh: 12500,
        total_recommendations: ZONES.length * 2,
        zones_analyzed: ZONES.length
      }
    };
  },

  recommend_stations: (args) => ({
    summary: { avg_score: 88, zones_covered: ZONES.length },
    recommendations: ZONES.slice(0, 5).map((z, i) => ({
      rank: i + 1,
      zone: z,
      lat: 12.9 + Math.random() * 0.1,
      lng: 77.5 + Math.random() * 0.1,
      score: 95 - i * 3,
      ev_density_score: "High",
      coverage_gap_score: "Significant",
      nearest_station_km: (1.2 + Math.random() * 2).toFixed(1)
    }))
  }),

  get_existing_stations: (args) => ({
    stations: ZONES.map(z => ({
      station_name: `${z} Charging Hub`,
      zone: z,
      lat: 12.9 + Math.random() * 0.1,
      lng: 77.5 + Math.random() * 0.1,
      num_chargers: 4 + Math.floor(Math.random() * 8),
      charger_type: "DC Fast",
      avg_utilization_pct: 40 + Math.floor(Math.random() * 50)
    }))
  }),

  get_zones: (args) => ({
    type: "FeatureCollection",
    features: []
  })
};

module.exports = { mockData };
