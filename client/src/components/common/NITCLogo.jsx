import React from "react";
import { useNavigate } from "react-router-dom";

const NITCLogo = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center space-x-2 select-none cursor-pointer"
      onClick={() => navigate("/")}
    >
      <div className="h-11 rounded-lg flex items-center justify-center p-1">
        <img
          src="/assets/nitc_logo.png"
          alt="NITC Logo"
          className="h-full object-contain dark:invert transition "
        />
      </div>

      <div className="hidden md:block">
        <h1 className="font-bold text-xl text-foreground">NITC Resources</h1>
        <p className="text-xs text-muted-foreground -mt-1">
          Resource Management System
        </p>
      </div>
    </div>
  );
};

export default NITCLogo;
