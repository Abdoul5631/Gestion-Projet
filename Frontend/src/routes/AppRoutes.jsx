import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import DefaultLayout from "../layout/DefaultLayout";

import LoginPage from "../pages/auth/LoginPage";
import LogoutPage from "../pages/auth/LogoutPage";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import Dashboard from "../pages/dashboard/Dashboard";
import ProjectsPage from "../pages/projects/ProjectsPage";
import TasksPage from "../pages/tasks/TasksPage";
import TeamsPage from "../pages/teams/TeamsPage";
import MessagesPage from "../pages/messages/MessagesPage";
import FilesPage from "../pages/files/FilesPage";

import ProfilePage from "../pages/profile/ProfilePage";
import SettingsPage from "../pages/settings/SettingsPage";
import ReportsPage from "../pages/reports/ReportsPage";
import CalendarPage from "../pages/CalendarPage";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminTeams from "../pages/admin/AdminTeams";
import AdminProjects from "../pages/admin/AdminProjects";
import AdminTasks from "../pages/admin/AdminTasks";

import Unauthorized from "../pages/Unauthorized";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/logout" element={<LogoutPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DefaultLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Route>
      </Route>

      <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DefaultLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/stats" element={<Dashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/teams" element={<AdminTeams />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/tasks" element={<AdminTasks />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
