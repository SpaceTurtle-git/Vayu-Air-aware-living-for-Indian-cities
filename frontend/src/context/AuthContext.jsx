import React, { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await client.get("/auth/me/");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("vayu_access_token")) fetchMe();
    else setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await client.post("/auth/login/", { username, password });
    localStorage.setItem("vayu_access_token", data.access);
    localStorage.setItem("vayu_refresh_token", data.refresh);
    await fetchMe();
  };

  const register = async (payload) => {
    await client.post("/auth/register/", payload);
    await login(payload.username, payload.password);
  };

  const updateProfile = async (payload) => {
    const { data } = await client.patch("/auth/me/", payload);
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("vayu_access_token");
    localStorage.removeItem("vayu_refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
