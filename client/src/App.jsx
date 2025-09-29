// src/App.jsx

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SchedulePage from "./components/SchedulePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";

// ========================= Layout =========================
const Layout = () => {
  const [dashboard, setDashboard] = React.useState("");
  const navigate = useNavigate();

  const handleDashboardChange = (value) => {
    setDashboard(value);
    if (value === "student") {
      navigate("/student");
    } else if (value === "admin") {
      navigate("/admin");
    }
  };

  return (
    <>
      <nav className="p-4 bg-white border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-bold">IRM System</span>
          <Select value={dashboard} onValueChange={handleDashboardChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Dashboard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student Dashboard</SelectItem>
              <SelectItem value="admin">Admin Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<div className="p-8">Page Not Found</div>} />
      </Routes>
    </>
  );
};

// ========================= APP =========================
const App = () => {
  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
