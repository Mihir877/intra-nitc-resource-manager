// src/App.jsx

import React from "react";
import { BrowserRouter, useRoutes, Navigate } from "react-router-dom";

import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SchedulePage from "./components/SchedulePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import PageNotFound from "./components/PageNotFound";
import ResourceManager from "./components/ManageResources";
import PendingRequests from "./components/PendingRequests";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { setupInterceptors } from "./api/interceptors";

import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/sidebar-context";

const PageTitle = ({ children }) => (
  <Layout>
    <h1 className="text-3xl font-bold text-gray-900">{children}</h1>
  </Layout>
);

// Actual routes
function AppRoutes() {
  return useRoutes([
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },

    {
      path: "/",
      element: <ProtectedRoute requiredRole="student" />,
      children: [
        { index: true, element: <Navigate to="/dashboard" /> },
        { path: "dashboard", element: <StudentDashboard /> },
        { path: "resources", element: <PageTitle>Browse Resources</PageTitle> },
        { path: "requests", element: <PageTitle>My Requests</PageTitle> },
        { path: "history", element: <PageTitle>Usage History</PageTitle> },
        {
          path: "request-resource",
          element: <PageTitle>Request Resource</PageTitle>,
        },
        { path: "schedule", element: <SchedulePage /> },
      ],
    },

    {
      path: "/admin",
      element: <ProtectedRoute requiredRole="admin" />,
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: "resources", element: <ResourceManager /> },
        { path: "requests", element: <PendingRequests /> },
        { path: "schedule", element: <PageTitle>Schedule</PageTitle> },
        { path: "users", element: <PageTitle>Users</PageTitle> },
        { path: "settings", element: <PageTitle>Settings</PageTitle> },
        // optionally
        { path: "dashboard", element: <AdminDashboard /> },
      ],
    },

    { path: "*", element: <PageNotFound /> },
  ]);
}

const App = () => {
  setupInterceptors();

  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default App;
