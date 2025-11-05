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
          className="h-full object-contain"
        />
      </div>
      <div>
        <h1 className="font-bold text-xl">NITC Resources</h1>
        <p className="text-xs text-muted-foreground -mt-[4px]">
          Resource Management System
        </p>
      </div>
    </div>
  );
};

export default NITCLogo;
