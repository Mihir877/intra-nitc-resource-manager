import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const PageNotFound = () => {
  const [seconds, setSeconds] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    if (seconds === 0) {
      navigate("/");
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground  ">
      <Alert
        variant="destructive"
        className="mb-8 w-full max-w-md border-border text-destructive-foreground"
      >
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <AlertTitle className="text-xl font-bold">
          404 - Page Not Found
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          The link you followed may be broken, or the page may have been
          removed.
        </AlertDescription>
      </Alert>

      <h2 className="text-2xl font-bold text-center mb-4 text-foreground">
        Sorry, this page isn&apos;t available.
      </h2>

      <div className="flex flex-col items-center mb-6">
        <span className="text-5xl font-extrabold text-primary drop-shadow mb-2">
          {seconds}
        </span>
        <span className="text-lg font-medium text-muted-foreground">
          Redirecting to Home Page...
        </span>
      </div>

      <div className="flex justify-center">
        <Button
          asChild
          variant="default"
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          <Link to="/">Go back to Home Page</Link>
        </Button>
      </div>
    </div>
  );
};

export default PageNotFound;
