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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-100 to-blue-300">
      <Alert variant="destructive" className="mb-8 w-full max-w-md">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <AlertTitle className="text-xl font-bold">404 - Page Not Found</AlertTitle>
        <AlertDescription>
          The link you followed may be broken, or the page may have been removed.
        </AlertDescription>
      </Alert>
      <h2 className="text-2xl font-bold text-center mb-4">
        Sorry, this page isn't available.
      </h2>
      <div className="flex flex-col items-center mb-6">
        <span className="text-5xl font-extrabold text-blue-700 drop-shadow mb-2">
          {seconds}
        </span>
        <span className="text-lg font-medium text-gray-700">
          Redirecting to Home Page...
        </span>
      </div>
      <div className="flex justify-center">
        <Button asChild variant="">
          <Link to="/">Go back to Home Page</Link>
        </Button>
      </div>
    </div>
  );
};

export default PageNotFound;