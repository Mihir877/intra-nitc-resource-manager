import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";

const RegisterPage = () => {
  const { register, user } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/student");
  }

  const isNitcEmail = (email) => {
    // name part (at least 1 letter)
    // rollnumber part: at least 2 letters + at least 2 numbers
    const pattern = /^[a-zA-Z]+_([a-zA-Z0-9]+)@nitc\.ac\.in$/;
    const match = email.trim().match(pattern);
    if (!match) return false;
    const roll = match[1];
    // At least 2 letters and at least 2 digits
    const hasTwoLetters = (roll.match(/[a-zA-Z]/g) || []).length >= 2;
    const hasTwoDigits = (roll.match(/[0-9]/g) || []).length >= 2;
    return hasTwoLetters && hasTwoDigits;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim()) return setError("Please enter your full username.");

    if (!isNitcEmail(email)) {
      return setError(
        "Email must be in valid name_rollnumber@nitc.ac.in format."
      );
    }

    if (!password) return setError("Please enter your password.");
    setError("");

    try {
      const res = await register(username, email, password);
      if (res.success) {
        navigate("/login");
      } else {
        setError(res.message || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 w-full max-w-md shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="username" className="block font-medium mb-1">
              Full Name
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Your Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
};

export default RegisterPage;
