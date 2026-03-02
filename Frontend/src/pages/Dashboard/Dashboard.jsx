import { useAuth } from "../../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import MemberDashboard from "./MemberDashboard";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  console.log("Dashboard render, role=", role, "user=", user, "auth=", isAuthenticated);

  if (role === "admin") return <AdminDashboard />;
  if (role === "manager") return <ManagerDashboard />;
  // default to member view for others
  return <MemberDashboard />;
}
