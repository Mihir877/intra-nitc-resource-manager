// src/pages/auth/ResetPasswordPage.jsx
import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/notify";
import { Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { CardDescription, CardTitle } from "../ui/card";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const checks = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const digit = /\d/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    return {
      len,
      upper,
      lower,
      digit,
      special,
      all: len && upper && lower && digit && special,
    };
  }, [password]);

  const strength = useMemo(() => {
    const score = ["len", "upper", "lower", "digit", "special"].reduce(
      (acc, k) => acc + (checks[k] ? 1 : 0),
      0
    );
    return score; // 0..5
  }, [checks]);

  const strengthLabel =
    ["Weak", "Weak", "Fair", "Good", "Strong", "Strong"][strength] || "Weak";
  const strengthColor =
    [
      "bg-red-500",
      "bg-red-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-emerald-500",
      "bg-emerald-600",
    ][strength] || "bg-red-500";

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      notify.error("Invalid input", "Please enter a new password.");
      return;
    }
    if (!checks.all) {
      notify.error(
        "Weak password",
        "Meet all password requirements before continuing."
      );
      return;
    }
    if (password !== confirm) {
      notify.error("Mismatch", "Confirmation does not match the new password.");
      return;
    }

    setBusy(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        newPassword: password,
      });
      notify.success(
        "Password reset",
        "You can sign in with your new password."
      );
      // Optional: slight delay for toast visibility, then redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 600);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 489
          ? "Reset link invalid or expired."
          : "Reset failed.");
      notify.error("Reset failed", msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CardTitle className="text-3xl font-bold">Reset password</CardTitle>
        <CardDescription>
          Choose a strong password to secure your account.
        </CardDescription>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-describedby="pwd-req"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Strength meter */}
          <div className="mt-2">
            <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
              <div
                className={`h-1.5 transition-all ${strengthColor}`}
                style={{ width: `${(strength / 5) * 100}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Strength: {strengthLabel}
            </div>
          </div>

          <ul
            id="pwd-req"
            className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
          >
            <ReqItem ok={checks.len} label="At least 8 characters" />
            <ReqItem ok={checks.upper} label="At least 1 uppercase letter" />
            <ReqItem ok={checks.lower} label="At least 1 lowercase letter" />
            <ReqItem ok={checks.digit} label="At least 1 number" />
            <ReqItem ok={checks.special} label="At least 1 special character" />
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm"
              type={show2 ? "text" : "password"}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow2((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={
                show2 ? "Hide confirm password" : "Show confirm password"
              }
            >
              {show2 ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Both passwords must match exactly.
          </p>
        </div>

        <Button className="w-full" type="submit" disabled={busy}>
          {busy ? "Resetting..." : "Reset password"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="text-primary underline underline-offset-4"
          >
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

function ReqItem({ ok, label }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
      ) : (
        <ShieldAlert className="h-4 w-4 text-amber-500" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}
