import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/dashboardService";
import { projectsService } from "../../services/projectsService";
import { tasksService } from "../../services/tasksService";
import { teamsService } from "../../services/teamsService";

// same implementation as admin; backend scopes stats automatically by role
export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setLoading(true);
    setError("");

    const loadStats = async () => {
      try {
        const [projectsData, tasksData, teamsData] = await Promise.all([
          projectsService.list(),
          tasksService.list(),
          teamsService.list(),
        ]);
        const projectsList = projectsData?.results || projectsData || [];
        const tasksList = tasksData?.results || tasksData || [];
        setProjects(projectsList);
        setTasks(tasksList);
        const teams = teamsData?.results || teamsData || [];
        const today = new Date().toISOString().slice(0, 10);
        const overdueTasks = tasksList.filter((task) => task.status !== "DONE" && task.due_date && task.due_date < today).length;
        const memberIds = new Set();
        teams.forEach((team) => (team.members || []).forEach((id) => memberIds.add(id)));
        if (active) {
          setStats({
            total_projects: projectsList.length,
            total_tasks: tasksList.length,
            overdue_tasks: overdueTasks,
            total_users: memberIds.size,
          });
        }
      } catch {
        if (active) setError("Impossible de charger le dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStats();
    return () => {
      active = false;
    };
  }, []);

  // Calcul de l'avancement (%) pour chaque projet
  const projectProgress = useMemo(() => {
    if (!projects.length || !tasks.length) return [];
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.project === project.id);
      const total = projectTasks.length;
      const done = projectTasks.filter((t) => t.status === "DONE").length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        id: project.id,
        name: project.name,
        percent,
        total,
        done,
      };
    });
  }, [projects, tasks]);

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Tableau de bord équipe</h2>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
            {/* Statistiques classiques */}
            <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
              <span className="text-sm font-medium text-slate-500">Projets totaux</span>
              <div className="mt-2 text-3xl font-bold text-slate-700">{stats?.total_projects || 0}</div>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
              <span className="text-sm font-medium text-slate-500">Tâches totales</span>
              <div className="mt-2 text-3xl font-bold text-slate-700">{stats?.total_tasks || 0}</div>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
              <span className="text-sm font-medium text-slate-500">Tâches en retard</span>
              <div className="mt-2 text-3xl font-bold text-slate-700">{stats?.overdue_tasks || 0}</div>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
              <span className="text-sm font-medium text-slate-500">Membres actifs</span>
              <div className="mt-2 text-3xl font-bold text-slate-700">{stats?.total_users || 0}</div>
            </div>
          </div>
          {/* Avancement par projet */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Avancement des projets</h3>
            {projectProgress.map((proj) => (
              <div key={proj.id} className="rounded border border-stroke bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="font-medium text-slate-700 mb-2 md:mb-0">{proj.name}</div>
                <div className="flex items-center gap-4">
                  <div className="w-40 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${proj.percent}%`,
                        background:
                          proj.percent >= 80 ? '#22c55e' : proj.percent >= 50 ? '#fbbf24' : '#ef4444',
                        transition: 'width 0.5s',
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold" style={{color: proj.percent >= 80 ? '#22c55e' : proj.percent >= 50 ? '#fbbf24' : '#ef4444'}}>
                    {proj.percent}%
                  </span>
                  <span className="text-xs text-slate-400">({proj.done}/{proj.total} tâches terminées)</span>
                </div>
              </div>
            ))}
            {projectProgress.length === 0 && <div className="text-slate-400">Aucun projet à afficher.</div>}
          </div>
        </>
      ) : null}
    </div>
  );
}
