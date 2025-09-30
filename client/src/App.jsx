// src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SchedulePage from "./components/SchedulePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import PageNotFound from "./components/PageNotFound";
import { Layout } from "./components/layout/Layout";

const PageTitle = ({ children }) => (
  <Layout>
    <h1 className="text-3xl font-bold text-gray-900">{children}</h1>
  </Layout>
);

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student pages */}
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route
          path="/resources"
          element={<PageTitle>Browse Resources</PageTitle>}
        />
        <Route path="/requests" element={<PageTitle>My Requests</PageTitle>} />
        <Route path="/history" element={<PageTitle>Usage History</PageTitle>} />
        <Route
          path="/request-resource"
          element={<PageTitle>Request Resource</PageTitle>}
        />

        {/* Admin pages */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin/resources"
          element={<PageTitle>Manage Resources</PageTitle>}
        />
        <Route
          path="/admin/requests"
          element={<PageTitle>Pending Requests</PageTitle>}
        />
        <Route
          path="/admin/schedule"
          element={<PageTitle>Schedule</PageTitle>}
        />
        <Route path="/admin/users" element={<PageTitle>Users</PageTitle>} />
        <Route
          path="/admin/settings"
          element={<PageTitle>Settings</PageTitle>}
        />

        {/* Schedule page (if needed for students) */}
        <Route path="/schedule" element={<SchedulePage />} />

        {/* 404 fallback */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
