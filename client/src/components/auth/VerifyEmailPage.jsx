import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending"); // pending | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        if (!active) return;
        setStatus("success");
        setMessage(res?.data?.message || "Your email has been verified!");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
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
    };

    if (token) verify();
    return () => {
      active = false;
    };
  }, [token, navigate]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6  ">
      {status === "pending" && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Verifying your email...
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Please wait a moment while we validate your verification token.
          </p>
        </motion.div>
      )}

      {status === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">
            Email Verified!
          </h1>
          <Alert className="border-border bg-accent text-accent-foreground max-w-lg mx-auto">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Redirecting you to login...
          </p>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">
            Verification Failed
          </h1>
          <Alert variant="destructive" className="max-w-lg mx-auto text-left">
            <AlertTitle>We couldn’t verify your email</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Link to="/login">
              <Button variant="secondary" className="w-full sm:w-auto">
                Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} MyApp. All rights reserved.
      </footer>
    </div>
  );
}
