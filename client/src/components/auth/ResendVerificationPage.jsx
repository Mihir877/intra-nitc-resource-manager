// src/pages/auth/ResendVerificationPage.jsx
import React, { useState } from "react";
import api from "@/api/axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ResendVerificationPage() {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const onResend = async () => {
    setBusy(true);
    setInfo("");
    setError("");
    try {
      // Controller expects authenticated user (req.user.id). Ensure cookie/Authorization present.
      const res = await api.post("/auth/resend-email-verification");
      setInfo(res?.data?.message || "Verification email sent.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? "Login required to resend verification."
          : "Could not send verification.");
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground  ">
      <Card className="w-full max-w-md bg-card text-card-foreground border-border shadow-sm">
        <div className="pt-8 text-center mb-6">
          <CardTitle className="text-3xl font-bold">
            Resend verification
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Send a new verification email to your inbox.
          </CardDescription>
        </div>

        <CardContent>
          {info && (
            <Alert className="mb-4 border-border bg-accent text-accent-foreground">
              <AlertTitle>Sent</AlertTitle>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert
              variant="destructive"
              className="mb-4 border-border text-destructive-foreground"
            >
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={onResend}
            disabled={busy}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
          >
            {busy ? "Sending..." : "Send verification email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
