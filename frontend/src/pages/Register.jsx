import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", first_name: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await register(form);
      navigate("/setup-location");
    } catch (err) {
      const data = err?.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-dusk flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-700 text-3xl text-white">Vayu</h1>
          <p className="text-haze text-sm mt-1">Create your account</p>
        </div>
        <form onSubmit={submit} className="bg-mist rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-dusk2 uppercase tracking-wide">First name</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dusk2"
              value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-dusk2 uppercase tracking-wide">Username</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dusk2"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-medium text-dusk2 uppercase tracking-wide">Email (for daily reports)</label>
            <input type="email" className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dusk2"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-medium text-dusk2 uppercase tracking-wide">Password</label>
            <input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dusk2"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          {error && <p className="text-verypoor text-sm">{error}</p>}
          <button disabled={busy} className="w-full bg-dusk2 text-white py-2.5 rounded-lg font-medium hover:bg-dusk transition disabled:opacity-60">
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-haze text-sm mt-4">
          Already have an account? <Link to="/login" className="text-white underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
