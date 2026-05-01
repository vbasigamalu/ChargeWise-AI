export default function Header({ title, alertCount = 0 }) {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        {alertCount > 0 && (
          <div className="header-badge danger">
            🚨 {alertCount} Active Alert{alertCount > 1 ? "s" : ""}
          </div>
        )}
        <div className="header-badge">
          🟢 System Online
        </div>
      </div>
    </header>
  );
}
