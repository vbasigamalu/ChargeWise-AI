/**
 * Mock Data for EVOPT Hackathon Safety Net
 * Returns high-quality sample data if Python bridges fail in cloud environments.
 * Updated to match the exact requirements of all features including Simulation, Explainability, and Surge Alerts.
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
    summary: { 
      total_alerts: 4, 
      emergency: 1, 
      critical: 2, 
      warning: 1,
      highest_load_pct: 98
    },
    alerts: [
      { 
        zone: "Koramangala", 
        severity: "EMERGENCY", 
        predicted_load_pct: 98, 
        hour: 19,
        recommended_action: "Initiate immediate peak-shifting and throttle Non-Essential chargers.",
        predicted_demand_kWh: 1180,
        transformer_max_kW: 1200
      },
      { 
        zone: "Indiranagar", 
        severity: "CRITICAL", 
        predicted_load_pct: 89, 
        hour: 18,
        recommended_action: "Advise users to delay charging via app notification.",
        predicted_demand_kWh: 712,
        transformer_max_kW: 800
      },
      { 
        zone: "MG Road", 
        severity: "CRITICAL", 
        predicted_load_pct: 86, 
        hour: 20,
        recommended_action: "Enable V2G discharge for parked fleet vehicles.",
        predicted_demand_kWh: 860,
        transformer_max_kW: 1000
      },
      { 
        zone: "HSR Layout", 
        severity: "WARNING", 
        predicted_load_pct: 78, 
        hour: 18,
        recommended_action: "Monitor transformer temperature sensor status.",
        predicted_demand_kWh: 780,
        transformer_max_kW: 1000
      }
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

  run_simulation: (args) => {
    const evGrowth = args.ev_growth_pct || 30;
    const adoption = args.scheduling_adoption_pct || 50;
    
    const scenarios = ZONES.slice(0, 8).map(z => {
      const baselinePeak = 800 + Math.random() * 400;
      const growthFactor = 1 + (evGrowth / 100);
      const reductionFactor = 1 - ((adoption / 100) * 0.3); // Max 30% reduction from scheduling
      const projectedPeak = baselinePeak * growthFactor * reductionFactor;
      
      return {
        zone: z,
        baseline: { daily_peak_kWh: Math.round(baselinePeak) },
        projected: { daily_peak_kWh: Math.round(projectedPeak) },
        impact: {
          peak_change_pct: Math.round(((projectedPeak - baselinePeak) / baselinePeak) * 100),
          at_risk: projectedPeak > 1200
        }
      };
    });

    return {
      scenarios,
      summary: {
        overall_change_pct: Math.round(evGrowth - (adoption * 0.4)),
        zones_at_risk: scenarios.filter(s => s.impact.at_risk).length,
        total_scheduling_savings: 4500 + (adoption * 120)
      }
    };
  },

  explain_prediction: (args) => ({
    zone: args.zone || "Koramangala",
    hour: args.hour || 19,
    prediction: 842,
    base_value: 520,
    explanation: `The prediction for ${args.zone} at ${args.hour}:00 is primarily driven by high Historical Occupancy and Local Event activity. Weather (Temperature) is providing a slight cooling effect on the total demand.`,
    features: [
      { name: "Historical Occupancy", shap_value: 0.421, contribution_pct: 45, direction: "increases" },
      { name: "Local Events (Tech Park)", shap_value: 0.285, contribution_pct: 30, direction: "increases" },
      { name: "Traffic Density", shap_value: 0.152, contribution_pct: 16, direction: "increases" },
      { name: "Temperature (Celsius)", shap_value: 0.082, contribution_pct: 9, direction: "decreases" }
    ]
  }),

  recommend_stations: (args) => ({
    summary: { avg_score: 88, zones_covered: ZONES.length },
    recommendations: ZONES.slice(0, 10).map((z, i) => ({
      rank: i + 1,
      zone: z,
      lat: 12.9 + Math.random() * 0.1,
      lng: 77.5 + Math.random() * 0.1,
      score: 95 - i * 2,
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
