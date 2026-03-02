import { useEffect, useMemo, useState } from "react";
import { teamsService } from "../../services/teamsService";
import { projectsService } from "../../services/projectsService";
import { tasksService } from "../../services/tasksService";
import { usersService } from "../../services/usersService";
import { useAuth } from "../../context/AuthContext";

const readError = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const firstVal = data[firstKey];
  if (Array.isArray(firstVal) && firstVal.length) return `${firstKey}: ${firstVal[0]}`;
  if (typeof firstVal === "string") return `${firstKey}: ${firstVal}`;
  return fallback;
};

export default function TeamsPage() {
  const { role } = useAuth();
  const canManageTeam = ["admin", "manager"].includes(String(role || "").toLowerCase());

  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberIdInput, setMemberIdInput] = useState("");
  const [usersById, setUsersById] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamsData, projectsData, tasksData, usersData] = await Promise.all([
        teamsService.list(),
        projectsService.list(),
        tasksService.list(),
        usersService.list(),
      ]);
      const tRows = teamsData?.results || teamsData || [];
      const pRows = projectsData?.results || projectsData || [];
      const taskRows = tasksData?.results || tasksData || [];
      setTeams(tRows);
      setProjects(pRows);
      setTasks(taskRows);
      if (!selectedTeamId && tRows.length) setSelectedTeamId(tRows[0].id);
      // Indexer les utilisateurs par id
      const usersArr = usersData?.results || usersData || [];
      const usersMap = {};
      usersArr.forEach((u) => { usersMap[u.id] = u; });
      setUsersById(usersMap);
    } catch (e) {
      setError(readError(e, "Impossible de charger les équipes."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const projectsByTeam = useMemo(() => {
    const map = {};
    projects.forEach((project) => {
      map[project.team] = map[project.team] || [];
      map[project.team].push(project);
    });
    return map;
  }, [projects]);

  const taskByProject = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      map[task.project] = map[task.project] || [];
      map[task.project].push(task);
    });
    return map;
  }, [tasks]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  const selectedTeamStats = useMemo(() => {
    if (!selectedTeam) return { totalTasks: 0, doneTasks: 0, overdueTasks: 0 };
    const teamProjects = projectsByTeam[selectedTeam.id] || [];
    const allTasks = teamProjects.flatMap((project) => taskByProject[project.id] || []);
    const doneTasks = allTasks.filter((task) => task.status === "DONE").length;
    const overdueTasks = allTasks.filter(
      (task) => task.status !== "DONE" && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)
    ).length;
    return {
      totalTasks: allTasks.length,
      doneTasks,
      overdueTasks,
    };
  }, [selectedTeam, projectsByTeam, taskByProject]);

  const updateTeamMembers = async (newMembers) => {
    if (!selectedTeam) return;
    setError("");
    try {
      await teamsService.update(selectedTeam.id, {
        name: selectedTeam.name,
        description: selectedTeam.description || "",
        members: newMembers,
      });
      setMemberIdInput("");
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de mise à jour des membres."));
    }
  };

  const addMember = async () => {
    if (!selectedTeam || !memberIdInput) return;
    const memberId = Number(memberIdInput);
    if (!memberId) return;
    const members = selectedTeam.members || [];
    if (members.includes(memberId)) return;
    await updateTeamMembers([...members, memberId]);
  };

  const removeMember = async (memberId) => {
    if (!selectedTeam) return;
    const members = (selectedTeam.members || []).filter((id) => Number(id) !== Number(memberId));
    await updateTeamMembers(members);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Gestion des équipes</h2>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {!loading && !error && teams.length === 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Aucune équipe assignée. Contactez un administrateur.
        </div>
      ) : null}

      {!loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-sm border border-stroke bg-white p-5 shadow-default">
            <h3 className="mb-4 text-lg font-medium">Liste des équipes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => {
                const relatedProjects = projectsByTeam[team.id] || [];
                return (
                  <div key={team.id} className={`rounded border p-4 ${selectedTeamId === team.id ? "border-primary bg-blue-50" : "border-stroke"}`}>
                    <p className="font-semibold">{team.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{team.description || "Aucune description"}</p>
                    <p className="mt-2 text-xs text-slate-500">Membres: {(team.members || []).length}</p>
                    <p className="mt-1 text-xs text-slate-500">Projets: {relatedProjects.length}</p>
                    <button onClick={() => setSelectedTeamId(team.id)} className="mt-3 rounded border px-2 py-1 text-sm">
                      Voir détails
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
            <h3 className="mb-4 text-lg font-medium">Détails de l'équipe</h3>
            {selectedTeam ? (
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">Nom:</span> {selectedTeam.name}</p>
                <p><span className="font-medium">Description:</span> {selectedTeam.description || "-"}</p>
                <div className="rounded border border-stroke p-3">
                  <p className="font-medium">Performance</p>
                  <p className="mt-1 text-xs text-slate-600">Tâches totales: {selectedTeamStats.totalTasks}</p>
                  <p className="text-xs text-slate-600">Tâches terminées: {selectedTeamStats.doneTasks}</p>
                  <p className="text-xs text-slate-600">Tâches en retard: {selectedTeamStats.overdueTasks}</p>
                </div>
                <div>
                  <p className="font-medium">Membres</p>
                  <div className="mt-2 space-y-2">
                    {(selectedTeam.members || []).length ? (
                      selectedTeam.members.map((memberId) => {
                        const member = usersById[memberId];
                        return (
                          <div key={memberId} className="flex items-center justify-between rounded border border-stroke px-2 py-1">
                            <span>{member ? `#${member.id} - ${member.username}` : `User #${memberId}`}</span>
                            {canManageTeam ? (
                              <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={() => removeMember(memberId)}>
                                Retirer
                              </button>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-slate-500">Aucun membre</span>
                    )}
                  </div>
                </div>
                {canManageTeam ? (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded border px-3 py-2"
                      placeholder="Ajouter membre (User ID)"
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value)}
                    />
                    <button className="rounded bg-primary px-3 py-2 text-white" onClick={addMember}>
                      Ajouter
                    </button>
                  </div>
                ) : null}
                <div>
                  <p className="font-medium">Projets liés</p>
                  <div className="mt-1 space-y-1">
                    {(projectsByTeam[selectedTeam.id] || []).length ? (
                      (projectsByTeam[selectedTeam.id] || []).map((project) => (
                        <div key={project.id} className="rounded border border-stroke px-2 py-1 text-xs">
                          {project.name}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500">Aucun projet lié</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sélectionne une équipe.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
