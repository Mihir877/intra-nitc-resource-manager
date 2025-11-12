import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import LoadingPage from "./LoadingPage";

const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;

  if (!user) return <Navigate to="/login" />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
