import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import LocationSetup from "./pages/LocationSetup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RoutePlanner from "./pages/RoutePlanner.jsx";
import Settings from "./pages/Settings.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-haze">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.profile?.latitude) return <Navigate to="/setup-location" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-haze">Loading…</div>;

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/setup-location" element={user ? <LocationSetup /> : <Navigate to="/login" />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/routes" element={<Protected><RoutePlanner /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
