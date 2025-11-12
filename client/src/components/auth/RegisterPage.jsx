// src/components/auth/RegisterPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useAuth from "@/hooks/useAuth";
import { notify } from "@/lib/notify";
import { Separator } from "../ui/separator";
import PasswordField from "./PasswordField";
import { DEPARTMENTS } from "@/utils/constants";
import { Loader2 } from "lucide-react";

const DEPT_CODES = DEPARTMENTS.map((d) => d.code);

const RegisterPage = () => {
  const { register, user } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Avoid navigating during render
  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/student");
    }
  }, [user, navigate]); // [web:7]

  // Matches name_roll@nitc.ac.in; roll must have >=2 letters & >=2 digits
  const isNitcEmail = (em) => {
    const match = em.trim().match(/^([a-zA-Z]+)_([a-zA-Z0-9]+)@nitc\.ac\.in$/);
    if (!match) return false;
    const roll = match[2];
    const letters = (roll.match(/[a-zA-Z]/g) || []).length >= 2;
    const digits = (roll.match(/[0-9]/g) || []).length >= 2;
    return letters && digits;
  }; // [web:50]

  // Heuristic dept inference from roll
  const inferredDept = useMemo(() => {
    const local = email.toLowerCase();
    if (!/@nitc\.ac\.in$/.test(local)) return "";
    const lp = local.split("@")[0] || "";
    const roll = lp.includes("_") ? lp.split("_")[1] : "";
    if (/cs/.test(roll)) return "CSE";
    if (/ec/.test(roll)) return "ECE";
    if (/ee/.test(roll)) return "EEE";
    if (/me/.test(roll)) return "ME";
    if (/ce(?!o)/.test(roll)) return "CE";
    if (/arch/.test(roll)) return "ARCH";
    if (/che/.test(roll)) return "CHE";
    if (/mba/.test(roll)) return "MBA";
    if (/mca/.test(roll)) return "MCA";
    return "";
  }, [email]); // [web:50]

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // guard against double submit [web:24]

    if (!username.trim()) {
      notify.error("Registration failed", "Please enter your full username.");
      return;
    }
    if (!isNitcEmail(email)) {
      notify.error(
        "Registration failed",
        "Email must be name_rollnumber@nitc.ac.in."
      );
      return;
    }
    if (!password) {
      notify.error("Registration failed", "Please enter your password.");
      return;
    }
    if (password !== confirmPassword) {
      notify.error("Registration failed", "Passwords do not match.");
      return;
    }

    const finalDept = department || inferredDept;
    if (!finalDept) {
      notify.error("Department needed", "Please select your department.");
      return;
    }
    if (!DEPT_CODES.includes(finalDept)) {
      notify.error("Invalid department", "Please choose a valid department.");
      return;
    }

    try {
      setIsSubmitting(true);
      // role omitted: backend defaults to student
      const res = await register(username, email, password, finalDept);
      if (res?.success) {
        notify.success(
          "Account created",
          "Please verify your email, then login."
        );
        setTimeout(() => navigate("/login"), 400);
      } else {
        notify.error(
          "Registration failed",
          res?.message || "Unable to register."
        );
      }
    } catch (err) {
      console.error("Registration failed:", err?.response?.data?.message);
      notify.error(
        "Registration error",
        err?.response?.data?.message || "Please try again."
      );
    } finally {
      setIsSubmitting(false); // always re-enable [web:47]
    }
  };

  return (
    <div className="text-foreground">
      <div className="text-center mb-6">
        <CardTitle className="text-3xl font-bold">Create account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Only institutional NITC emails are allowed.
        </CardDescription>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <Label htmlFor="username" className="mb-1 block text-foreground">
            Full Name
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="email" className="mb-1 block text-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name_roll@nitc.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          {inferredDept && !department && (
            <p className="text-xs text-muted-foreground mt-1">
              Suggested department: {inferredDept} —{" "}
              {DEPARTMENTS.find((d) => d.code === inferredDept)?.name}
            </p>
          )}
        </div>

        <div>
          <Label className="mb-1 block text-foreground">Department</Label>
          <Select
            value={department}
            onValueChange={setDepartment}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              {DEPARTMENTS.map((d) => (
                <SelectItem
                  key={d.code}
                  value={d.code}
                  className="hover:bg-accent hover:text-accent-foreground transition"
                >
                  <div className="flex gap-2 items-center">
                    {d.code}
                    <Separator
                      orientation="vertical"
                      className="h-4 bg-border"
                    />
                    {d.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PasswordField
          id="reg-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          confirmId="reg-confirm"
          confirmLabel="Confirm password"
          confirmValue={confirmPassword}
          onConfirmChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-4 text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-primary hover:text-primary/80 underline transition"
        >
          Login
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
