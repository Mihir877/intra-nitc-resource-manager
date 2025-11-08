// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from "react";
import api from "@/api/axios";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/notify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const isNitcEmail = (em) => /@nitc\.ac\.in$/i.test(em?.trim() || "");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      notify.error("Invalid data", "Please enter your email.");
      return;
    }
    if (!isNitcEmail(email)) {
      notify.error(
        "Invalid email",
        "Use your institutional @nitc.ac.in email."
      );
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      notify.success("Email sent", "A reset link has been sent through email.");
    } catch (_) {
      // Generic message to avoid enumeration
      notify.info(
        "If account exists",
        "A reset link will be sent if registered."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>
          We will email you a link to reset your password.
        </CardDescription>
      </div>

      <div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Institutional email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name_roll@nitc.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-describedby="email-help"
            />
            <p id="email-help" className="text-xs text-muted-foreground">
              Use only your NITC email address.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending..." : "Send reset link"}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            If you don’t receive an email in a few minutes, check spam or try
            again.
          </div>
        </form>

        <div className="mt-3 h-px bg-border" />

        <div className="mt-2 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <a
            href="/login"
            className="text-primary underline underline-offset-4"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
