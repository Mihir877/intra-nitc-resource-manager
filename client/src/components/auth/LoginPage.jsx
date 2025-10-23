import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/");
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 w-full max-w-md shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-medium mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@nitc.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginTop: "-12px" }}>
            <label htmlFor="password" className="block font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        <p className="mt-4 text-sm text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-500">
            Register
          </Link>
        </p>

        {/* Demo Users Section */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-sm font-semibold">Demo users:</span>
          <span
            className="group relative cursor-pointer inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm border border-blue-300 hover:bg-blue-200 transition"
            onClick={() => {
              setEmail("student_m25@nitc.ac.in");
              setPassword("Student@123");
            }}
          >
            student
          </span>
          <span
            className="group relative cursor-pointer inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm border border-green-300 hover:bg-green-200 transition"
            onClick={() => {
              setEmail("admin_m25@nitc.ac.in");
              setPassword("Admin@25");
            }}
          >
            admin
          </span>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
