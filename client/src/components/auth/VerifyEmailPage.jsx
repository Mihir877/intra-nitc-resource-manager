// src/pages/auth/VerifyEmailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("pending"); // pending | success | error
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        if (!active) return;
        setStatus("success");
        setMessage(res?.data?.message || "Email verified successfully.");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      } catch (err) {
        if (!active) return;
        const msg =
          err?.response?.data?.message ||
          (err?.response?.status === 489
            ? "Token is invalid or expired."
            : "Verification failed.");
        setStatus("error");
        setMessage(msg);
      }
    })();
    return () => {
      active = false;
    };
  }, [token, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <Card className="w-full max-w-lg">
        <div className="pt-8 text-center mb-6">
          <CardTitle className="text-3xl font-bold">
            Email verification
          </CardTitle>
          <CardDescription>Validating your verification token…</CardDescription>
        </div>

        <CardContent>
          {status === "pending" && <p>Checking token…</p>}
          {status === "success" && (
            <Alert className="mb-4">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {status === "error" && (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Verification failed</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Link to="/login">
                  <Button variant="secondary">Back to login</Button>
                </Link>
                <Link to="/resend-verification">
                  <Button>Resend email</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
