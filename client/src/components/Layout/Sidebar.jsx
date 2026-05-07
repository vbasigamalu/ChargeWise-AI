import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", icon: "📊", label: "Dashboard" },
  { path: "/demand", icon: "🔥", label: "Demand Prediction" },
  { path: "/schedule", icon: "⏱️", label: "Smart Scheduling" },
  { path: "/stations", icon: "📍", label: "Station Planner" },
  { path: "/grid", icon: "⚡", label: "Grid Status" },
  { path: "/alerts", icon: "🚨", label: "Surge Alerts" },
  { path: "/simulation", icon: "🔮", label: "Simulation" },
  { path: "/explain", icon: "🧠", label: "Explainability" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>⚡ EVOPT</h1>
        <span>BESCOM · Bengaluru</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            end={item.path === "/"}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
