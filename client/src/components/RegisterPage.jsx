// RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RegisterPage=()=>{
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (email) =>
    email.endsWith("@nitc.ac.in") && email.includes("@");

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid @nitc.ac.in email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    alert("Registration successful! Please login.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 w-full max-w-md shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="name" className="block font-medium mb-1">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div style={{ marginTop: "-12px" }}>
            <label htmlFor="email" className="block font-medium mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@nitc.ac.in"
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
            Register
          </Button>
        </form>
        <p className="mt-4 text-sm text-center">
          Already registered?{" "}
          <Link to="/login" className="text-blue-500">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default RegisterPage;