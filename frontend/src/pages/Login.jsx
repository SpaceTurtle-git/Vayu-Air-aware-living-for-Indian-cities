import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch {
      setError("Couldn't sign in — check your username and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-dusk flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-700 text-3xl text-white">Vayu</h1>
          <p className="text-haze text-sm mt-1">Air-aware living for Indian cities</p>
        </div>
        <form onSubmit={submit} className="bg-mist rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-dusk2 uppercase tracking-wide">Username</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dusk2"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-dusk2 uppercase tracking-wide">Password</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dusk2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-verypoor text-sm">{error}</p>}
          <button
            disabled={busy}
            className="w-full bg-dusk2 text-white py-2.5 rounded-lg font-medium hover:bg-dusk transition disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-haze text-sm mt-4">
          New here? <Link to="/register" className="text-white underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
