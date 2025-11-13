import React from "react";
import { Grid, ThreeDots } from "react-loader-spinner";

const LoadingPage = ({ message = "Loading...", fullScreen = false }) => {
  const containerClass = fullScreen
    ? "h-screen flex flex-col items-center justify-center"
    : "min-h-[calc(100vh-64px)] flex flex-col items-center justify-center";

  return (
    <div className={`${containerClass} text-muted-foreground`}>
      <ThreeDots
        visible={true}
        height="80"
        width="80"
        color="hsl(var(--primary))"
        radius="9"
        ariaLabel="three-dots-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
      <p className="text-sm text-muted-foreground font-medium mt-4">
        {message}
      </p>
    </div>
  );
};

export default LoadingPage;
