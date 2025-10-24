// src/App.jsx

import React from "react";
import { BrowserRouter, useRoutes, Navigate } from "react-router-dom";

import StudentDashboard from "./components/student/StudentDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import SchedulePage from "./components/student/Schedule";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import PageNotFound from "./components/common/PageNotFound";
import ResourceManager from "./components/admin/ManageResources";
import PendingRequests from "./components/admin/PendingRequests";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { setupInterceptors } from "./api/interceptors";

import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import BrowseResources from "./components/student/BrowseResources";
import MyRequests from "./components/student/MyRequests";
import History from "./components/student/History";
import Users from "./components/admin/Users";
import Profile from "./components/common/Profile";
import Preferences from "./components/admin/Preferences";
import ResourceDetailPage from "./components/common/ResourceDetailPage";

const PageTitle = ({ children }) => (
  <h1 className="text-3xl font-bold text-gray-900">{children}</h1>
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
        {
          element: <Layout />,
          children: [
            { index: true, element: <Navigate to="/dashboard" /> },
            { path: "dashboard", element: <StudentDashboard /> },
            { path: "resources", element: <BrowseResources /> },
            {
              path: "resources/:id",
              element: <ResourceDetailPage />,
            },
            {
              path: "resources/:id/book",
              element: <PageTitle>Book Resource</PageTitle>,
            },

            { path: "requests", element: <MyRequests /> },
            {
              path: "requests/:id",
              element: <PageTitle>Request Details</PageTitle>,
            },

            { path: "history", element: <History /> },
            {
              path: "request-resource",
              element: <PageTitle>Request Resource</PageTitle>,
            },
            { path: "schedule", element: <SchedulePage /> },
            { path: "profile", element: <Profile /> },
          ],
        },
      ],
    },

    {
      path: "/admin",
      element: <ProtectedRoute requiredRole="admin" />,
      children: [
        {
          element: <Layout />,
          children: [
            { index: true, element: <Navigate to="dashboard" /> },
            { path: "dashboard", element: <AdminDashboard /> },
            { path: "resources", element: <ResourceManager /> },
            { path: "requests", element: <PendingRequests /> },
            { path: "schedule", element: <PageTitle>Schedule</PageTitle> },
            { path: "users", element: <Users /> },
            { path: "users/:id", element: <Profile /> },
            { path: "preferences", element: <Preferences /> },
          ],
        },
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
