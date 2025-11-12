// src/components/layout/AuthLayout.jsx
import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import NITCLogo from "../common/NITCLogo";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground  ">
      <div className="mx-auto grid max-w-6xl min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: Brand / Info */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-sidebar border-r border-sidebar-border">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2">
              <NITCLogo />
            </Link>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-sidebar-foreground">
              Welcome to Intra NITC Resource Management System
            </h1>

            <p className="mt-3 text-muted-foreground leading-relaxed">
              A unified platform to access, book, and manage institutional
              resources across NIT Calicut.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Secure, role-based access for students and admins.</li>
              <li>• Real-time booking and availability tracking.</li>
              <li>• Transparent approval and notification workflow.</li>
            </ul>

            <p className="mt-8 text-sm text-muted-foreground">
              Designed and developed by Team 10, Software Systems Lab, NIT
              Calicut.
            </p>
          </div>
        </div>

        {/* Right: Routed Form Content */}
        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-sm bg-card text-card-foreground border-border">
            <div className="p-8">
              {/* Nested routes render here */}
              <Outlet />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
