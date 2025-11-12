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

  // Auto-redirect after login
  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
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
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="text-center mb-6">
        <CardTitle className="text-3xl font-bold">Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Use your institutional NITC email to continue.
        </CardDescription>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block font-medium mb-1 text-foreground"
          >
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name_roll@nitc.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block font-medium mb-1 text-foreground"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            className="bg-background border-border text-foreground"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
          disabled={isSubmitting}
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

      {/* Links */}
      <div className="mt-4 text-sm flex items-center justify-between">
        <Link
          to="/forgot-password"
          className="text-primary hover:text-primary/80 underline transition"
        >
          Forgot password?
        </Link>
        <Link
          to="/register"
          className="text-primary hover:text-primary/80 underline transition"
        >
          Create account
        </Link>
      </div>

      {/* Demo Users */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">
          Demo users
        </span>

        <span
          className="cursor-pointer inline-flex items-center px-3 py-1 rounded-full bg-accent text-accent-foreground font-medium text-sm border border-border hover:bg-accent/80 transition"
          onClick={() => {
            if (isSubmitting) return;
            setEmail("student_m25@nitc.ac.in");
            setPassword("Student@123");
          }}
        >
          student
        </span>

        <span
          className="cursor-pointer inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium text-sm border border-border hover:bg-secondary/80 transition"
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
