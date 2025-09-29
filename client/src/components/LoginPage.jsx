// LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LoginPage=({ setAuth, setRole })=> {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isValidEmail = (email) =>
    email.endsWith("@nitc.ac.in") && email.includes("@");

  const handleLogin = () => {
    // if (!isValidEmail(email)) {
    //   setError("Please enter a valid @nitc.ac.in email address.");
    //   return;
    // }
    // if (!password) {
    //   setError("Please enter your password.");
    //   return;
    // }
    // setError("");
    // // Simulate login role based on email
    // setAuth(true);
    // const role = email.includes("admin") ? "admin" : "student";
    // setRole(role);
    // navigate(role === "admin" ? "/admin" : "/student");
    navigate("/student");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 w-full max-w-md shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="email" className="block font-medium mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@nitc.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // required
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
              // required
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
      </Card>
    </div>
  );
}

export default LoginPage;