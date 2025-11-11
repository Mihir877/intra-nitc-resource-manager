// src/components/auth/LoginPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";
import { notify } from "@/lib/notify";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avoid navigating during render
  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // hard guard against double submit [web:24]
    if (!email || !password) {
      notify.error("Login failed", "Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(email, password);
      notify.success("Login successful", "Redirecting to your dashboard...");
      setTimeout(() => {
        const role = res?.role ?? user?.role;
        navigate(role === "admin" ? "/admin" : "/");
      }, 350);
    } catch (err) {
      console.log(err);
      // notify.error(
      //   "Login failed",
      //   err?.response?.data?.message ||
      //     "Something went wrong. Please try again."
      // );

      toast.info("Event has been created", {});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <CardTitle className="text-3xl font-bold">Login</CardTitle>
        <CardDescription>
          Use your institutional NITC email to continue.
        </CardDescription>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name_roll@nitc.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting} // disable inputs while pending [web:7]
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
            disabled={isSubmitting} // disable inputs while pending [web:7]
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting} // main disable flag [web:24]
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      <div className="mt-4 text-sm flex items-center justify-between">
        <Link to="/forgot-password" className="text-primary underline">
          Forgot password?
        </Link>
        <Link to="/register" className="text-primary underline">
          Create account
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-sm font-semibold">Demo users</span>

        <span
          className="group relative cursor-pointer inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm border border-blue-300 hover:bg-blue-200 transition"
          onClick={() => {
            if (isSubmitting) return;
            setEmail("student_m25@nitc.ac.in");
            setPassword("Student@123");
          }}
        >
          student
        </span>

        <span
          className="group relative cursor-pointer inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm border border-green-300 hover:bg-green-200 transition"
          onClick={() => {
            if (isSubmitting) return;
            setEmail("admin_m25@nitc.ac.in");
            setPassword("Admin@25");
          }}
        >
          admin
        </span>
      </div>
    </div>
  );
};

export default LoginPage;
