import { useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/AuthContext";

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, loading, login, register, logout } = context;

  // Derived helpers
  const derived = useMemo(() => {
    const isAuthenticated = !!user;
    const role = user?.role || null;

    const isAdmin = role === "admin";
    const isFaculty = role === "faculty";
    const isStudent = role === "student";

    // You can add more based on your system roles

    return { isAuthenticated, isAdmin, isFaculty, isStudent, role };
  }, [user]);

  // Return everything together
  return {
    user,
    loading,
    login,
    register,
    logout,
    ...derived,
  };
};

export default useAuth;
