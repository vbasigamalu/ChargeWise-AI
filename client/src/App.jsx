import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import DashboardPage from "./pages/DashboardPage";
import DemandPage from "./pages/DemandPage";
import SchedulePage from "./pages/SchedulePage";
import StationsPage from "./pages/StationsPage";
import GridPage from "./pages/GridPage";
import AlertsPage from "./pages/AlertsPage";
import SimulationPage from "./pages/SimulationPage";
import ExplainPage from "./pages/ExplainPage";
import "./index.css";

const routes = [
  { path: "/", element: <DashboardPage />, title: "Dashboard Overview" },
  { path: "/demand", element: <DemandPage />, title: "Demand Prediction" },
  { path: "/schedule", element: <SchedulePage />, title: "Smart Scheduling" },
  { path: "/stations", element: <StationsPage />, title: "Station Planner" },
  { path: "/grid", element: <GridPage />, title: "Grid Status" },
  { path: "/alerts", element: <AlertsPage />, title: "Surge Alerts" },
  { path: "/simulation", element: <SimulationPage />, title: "Scenario Simulation" },
  { path: "/explain", element: <ExplainPage />, title: "Explainable AI" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Routes>
            {routes.map((r) => (
              <Route
                key={r.path}
                path={r.path}
                element={
                  <>
                    <Header title={r.title} />
                    <div className="page-content">{r.element}</div>
                  </>
                }
              />
            ))}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
