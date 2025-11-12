import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import PasswordField from "./PasswordField";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      notify.error("Invalid input", "Please enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
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

      // Redirect after short delay for user feedback
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
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
    <div className="space-y-6 text-foreground  ">
      <div className="text-center">
        <CardTitle className="text-3xl font-bold">Reset password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Choose a strong password to secure your account.
        </CardDescription>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <PasswordField
          id="new-password"
          label="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          confirmValue={confirmPassword}
          onConfirmChange={(e) => setConfirmPassword(e.target.value)}
          showChecklist
          showStrength
        />

        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
          type="submit"
          disabled={busy}
        >
          {busy ? "Resetting..." : "Reset password"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition"
          >
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
