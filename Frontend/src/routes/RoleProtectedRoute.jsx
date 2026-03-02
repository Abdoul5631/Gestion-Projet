import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles.length && !allowedRoles.includes(String(role || "").toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

