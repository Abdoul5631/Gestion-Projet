// ...existing code...
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/dashboardService";
import { projectsService } from "../../services/projectsService";
import { tasksService } from "../../services/tasksService";
import { teamsService } from "../../services/teamsService";
import { usersService } from "../../services/usersService";

// identical logic to legacy dashboard, used by admin

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setLoading(true);
    setError("");

    const loadStats = async () => {
      try {
        const data = await dashboardService.getStats();
        if (active) setStats(data);
      } catch {
        try {
          const [projectsData, tasksData, teamsData] = await Promise.all([
            projectsService.list(),
            tasksService.list(),
            teamsService.list(),
          ]);
          const projects = projectsData?.results || projectsData || [];
          const tasks = tasksData?.results || tasksData || [];
          const teams = teamsData?.results || teamsData || [];
          const today = new Date().toISOString().slice(0, 10);
          const overdueTasks = tasks.filter((task) => task.status !== "DONE" && task.due_date && task.due_date < today).length;
          const memberIds = new Set();
          teams.forEach((team) => (team.members || []).forEach((id) => memberIds.add(id)));
          if (active) {
            setStats({
              total_projects: projects.length,
              total_tasks: tasks.length,
              overdue_tasks: overdueTasks,
              total_users: memberIds.size,
            });
          }
        } catch {
          if (active) setError("Impossible de charger le dashboard.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError("");
      try {
        const data = await usersService.list();
        const usersList = data?.results || data || [];
        if (active) setUsers(usersList);
      } catch {
        if (active) setUsersError("Impossible de charger la liste des utilisateurs.");
      } finally {
        if (active) setUsersLoading(false);
      }
    };

    loadStats();
    loadUsers();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const cards = useMemo(() => {
    const totalProjects = Number(stats?.total_projects || 0);
    const totalTasks = Number(stats?.total_tasks || 0);
    const overdueTasks = Number(stats?.overdue_tasks || 0);
    const activeMembers = Number(stats?.total_users || stats?.active_members || 0);
    return [
      { label: "Projets totaux", value: totalProjects },
      { label: "Tâches totales", value: totalTasks },
      { label: "Tâches en retard", value: overdueTasks },
      { label: "Membres actifs", value: activeMembers },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Administration - Statistiques système</h2>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      {!loading && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className="mt-2 text-3xl font-bold text-slate-700">{card.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Liste des utilisateurs */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Utilisateurs (id username)</h3>
        {usersLoading ? (
          <div className="rounded border border-stroke bg-white p-4">Chargement des utilisateurs...</div>
        ) : usersError ? (
          <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{usersError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[300px] border border-stroke bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">ID</th>
                  <th className="px-4 py-2 border-b">Username</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 border-b">{user.id}</td>
                    <td className="px-4 py-2 border-b">{user.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
