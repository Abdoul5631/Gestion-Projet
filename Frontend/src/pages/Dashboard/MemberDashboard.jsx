import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/dashboardService";
import { projectsService } from "../../services/projectsService";
import { tasksService } from "../../services/tasksService";
import { teamsService } from "../../services/teamsService";
import { usersService } from "../../services/usersService";

// identical to other dashboards; backend returns personal stats for member
export default function MemberDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [usersById, setUsersById] = useState({});

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setLoading(true);
    setError("");

    const loadStats = async () => {
      try {
        const [statsData, projectsData, usersData] = await Promise.all([
          dashboardService.getStats(),
          projectsService.list(),
          usersService.list(),
        ]);
        if (!active) return;
        setStats(statsData);
        const allProjects = projectsData?.results || projectsData || [];
        // Récupérer toutes les équipes nécessaires
        const teamIds = Array.from(new Set(allProjects.map((p) => p.team).filter(Boolean)));
        const teamsMap = {};
        await Promise.all(
          teamIds.map(async (teamId) => {
            try {
              const team = await teamsService.detail(teamId);
              teamsMap[teamId] = team;
            } catch {}
          })
        );
        if (!active) return;
        setTeamsById(teamsMap);
        // Indexer les utilisateurs par id
        const usersArr = usersData?.results || usersData || [];
        const usersMap = {};
        usersArr.forEach((u) => { usersMap[u.id] = u; });
        setUsersById(usersMap);
        // Filtrer les projets où l'utilisateur est membre de l'équipe
        const userProjects = allProjects.filter((p) => {
          const team = teamsMap[p.team];
          return team && Array.isArray(team.members) && team.members.includes(user?.id);
        });
        setProjects(userProjects);
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
  }, [isAuthenticated, user]);

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
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Mon tableau de bord</h2>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                <div className="mt-2 text-3xl font-bold text-slate-700">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Mes projets et membres associés</h3>
            {projects.length === 0 ? (
              <div className="rounded border border-stroke bg-white p-4 text-slate-500">Aucun projet associé.</div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const team = teamsById[project.team];
                  return (
                    <div key={project.id} className="rounded border border-stroke bg-white p-4">
                      <div className="font-medium text-slate-700">{project.name}</div>
                      <div className="text-xs text-slate-500 mb-2">Projet #{project.id}</div>
                      <div className="text-sm font-semibold mt-2 mb-1">Membres du projet :</div>
                      <ul className="list-disc ml-6">
                        {team && team.members && team.members.length ? (
                          team.members.map((memberId) => {
                            const member = usersById[memberId];
                            return (
                              <li key={memberId}>
                                {member ? `#${member.id} - ${member.username}` : `Utilisateur #${memberId}`}
                              </li>
                            );
                          })
                        ) : (
                          <li className="text-slate-400">Aucun membre trouvé</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
