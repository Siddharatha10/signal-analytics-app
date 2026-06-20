import { NavLink, Outlet } from "react-router-dom";
import "./Shell.css";

function Shell() {
  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand">
          <span className="shell__pulse" aria-hidden="true" />
          <div>
            <div className="shell__brand-name">Signal</div>
            <div className="shell__brand-tag">user analytics</div>
          </div>
        </div>

        <nav className="shell__nav">
          <NavLink
            to="/"
            className={({ isActive }) => "shell__nav-link" + (isActive ? " is-active" : "")}
          >
            Sessions
          </NavLink>
          <NavLink
            to="/heatmap"
            className={({ isActive }) => "shell__nav-link" + (isActive ? " is-active" : "")}
          >
            Heatmap
          </NavLink>
        </nav>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  );
}

export default Shell;
