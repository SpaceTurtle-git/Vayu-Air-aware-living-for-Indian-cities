import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition ${
      isActive ? "bg-dusk2 text-white" : "text-haze hover:text-white"
    }`;

  return (
    <header className="bg-dusk sticky top-0 z-40">
      <div className="h-1 horizon-gradient" />
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <span className="font-display font-700 text-white text-xl tracking-tight">Vayu</span>
          <span className="text-haze text-xs hidden sm:inline">know your air</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/routes" className={linkClass}>Route Planner</NavLink>
          <NavLink to="/settings" className={linkClass}>Settings</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-haze text-sm hidden sm:inline">{user?.username}</span>
          <button
            onClick={logout}
            className="text-sm text-white bg-dusk2 hover:bg-ember px-3 py-1.5 rounded-lg transition"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
