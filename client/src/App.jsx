// src/App.jsx

import React from "react";
import { BrowserRouter, useRoutes, Navigate, Outlet } from "react-router-dom";

import StudentDashboard from "./components/student/StudentDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
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
import ResourceDetailPage from "./components/common/resource/ResourceDetailPage";
import StudentSchdeule from "./components/student/StudentSchedule";
import { Toaster } from "./components/ui/sonner";

// Newly added auth pages
import VerifyEmailPage from "./components/auth/VerifyEmailPage";
import ResendVerificationPage from "./components/auth/ResendVerificationPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import AuthLayout from "./components/auth/AuthLayout";
import ResourceFormPage from "./components/common/resource/ResourceFormPage";
import RequestDetails from "./components/common/RequestDetails";

const PageTitle = ({ children }) => (
  <h1 className="text-3xl font-bold text-gray-900">{children}</h1>
);

// Actual routes
function AppRoutes() {
  return useRoutes([
    {
      path: "/",
      element: <AuthLayout />,
      children: [
        { path: "/login", element: <LoginPage /> },
        { path: "/register", element: <RegisterPage /> },
        { path: "/resend-verification", element: <ResendVerificationPage /> },
        { path: "/forgot-password", element: <ForgotPasswordPage /> },
        { path: "/reset-password/:token", element: <ResetPasswordPage /> },
      ],
    },
    // Public auth

    // Student area
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
            { path: "resources/:id", element: <ResourceDetailPage /> },
            {
              path: "resources/:id/book",
              element: <PageTitle>Book Resource</PageTitle>,
            },

            { path: "requests", element: <MyRequests /> },
            {
              path: "requests/:id",
              element: <RequestDetails />,
            },

            { path: "history", element: <History /> },
            {
              path: "request-resource",
              element: <PageTitle>Request Resource</PageTitle>,
            },
            { path: "schedule", element: <StudentSchdeule /> },
            { path: "profile/me", element: <Profile /> },
          ],
        },
      ],
    },

    // Admin area
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
            { path: "resources/:id", element: <ResourceDetailPage /> },
            { path: "resources/add", element: <ResourceFormPage /> },
            { path: "resources/:id/edit", element: <ResourceFormPage /> },
            { path: "requests", element: <PendingRequests /> },
            {
              path: "requests/:id",
              element: <RequestDetails />,
            },
            { path: "users", element: <Users /> },
            { path: "users/:id", element: <Profile /> },
            { path: "profile/me", element: <Profile /> },
            { path: "preferences", element: <Preferences /> },
          ],
        },
      ],
    },

    { path: "/verify-email/:token", element: <VerifyEmailPage /> },

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
          <Toaster
            richColors
            closeButton
            position="bottom-left"
            expand
            duration={3500}
            toastOptions={{
              classNames: {
                toast: "border shadow-sm",
                actionButton: "bg-primary text-white",
              },
            }}
          />
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default App;
