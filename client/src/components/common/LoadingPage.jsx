import React from "react";
import { Loader2 } from "lucide-react";

const LoadingPage = ({
  message = "Loading...",
  fullScreen = true,
  compact = false,
}) => {
  const containerClass = fullScreen
    ? "min-h-120 flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center py-10";

  const sizeClass = compact ? "w-5 h-5" : "w-8 h-8";

  return (
    <div className={`${containerClass} text-muted-foreground  `}>
      <Loader2
        className={`${sizeClass} animate-spin text-foreground mb-3`}
        strokeWidth={2}
      />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
};

export default LoadingPage;
