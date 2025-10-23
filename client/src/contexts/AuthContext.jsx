import React, { createContext, useEffect, useState } from "react";
import api from "@/api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🧠 Load user on startup
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // 🔹 Decode or fetch user from token
  const fetchUser = async (token) => {
    try {
      const res = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch (error) {
      console.error("Error fetching user:", error.message);
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Login
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        const { accessToken, user } = res.data;
        localStorage.setItem("accessToken", accessToken);
        setUser(user);
        return user;
      } else {
        throw new Error(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error.message);
      throw error;
    }
  };

  // 🔹 Register
  const register = async (username, email, password) => {
    try {
      const res = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      return res.data;
    } catch (error) {
      console.error("Registration failed:", error.message);
      throw error;
    }
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error.message);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
