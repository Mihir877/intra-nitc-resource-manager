import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
