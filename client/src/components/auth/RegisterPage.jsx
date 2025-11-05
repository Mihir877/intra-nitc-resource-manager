// src/components/auth/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";
import { notify } from "@/lib/notify";

const RegisterPage = () => {
  const { register, user } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/student");
  }

  // Matches: name.rollnumber@nitc.ac.in
  // name: at least 1 letter; rollnumber: at least 2 letters and 2 digits (order free)
  const isNitcEmail = (em) => {
    const match = em.trim().match(/^([a-zA-Z]+)\.([a-zA-Z0-9]+)@nitc\.ac\.in$/);
    if (!match) return false;
    const roll = match[2];
    const letters = (roll.match(/[a-zA-Z]/g) || []).length >= 2;
    const digits = (roll.match(/[0-9]/g) || []).length >= 2;
    return letters && digits;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      notify.error("Registration failed", "Please enter your full username.");
      return;
    }
    if (!isNitcEmail(email)) {
      notify.error(
        "Registration failed",
        "Email must be in valid name.rollnumber@nitc.ac.in format."
      );
      return;
    }
    if (!password) {
      notify.error("Registration failed", "Please enter your password.");
      return;
    }

    try {
      const res = await register(username, email, password);
      if (res?.success) {
        notify.success("Account created", "Please login to continue.");
        setTimeout(() => navigate("/login"), 400);
      } else {
        notify.error(
          "Registration failed",
          res?.message || "Unable to register."
        );
      }
    } catch (err) {
      notify.error("Server error", err?.message || "Please try again.");
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <CardTitle className="text-3xl font-bold">Create account</CardTitle>
        <CardDescription>
          Only institutional NITC emails are allowed.
        </CardDescription>
      </div>

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
          <div style={{ marginTop: "-12px" }} />
        </div>

        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you.name.roll@nitc.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div style={{ marginTop: "-12px" }} />
        </div>

        <div>
          <label htmlFor="password" className="block font-medium mb-1">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Inline error removed; toaster-only feedback */}

        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-4 text-sm text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-500">
          Login
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
