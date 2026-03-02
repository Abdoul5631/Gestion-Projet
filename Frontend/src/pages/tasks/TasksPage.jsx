import { useEffect, useMemo, useState } from "react";
import { tasksService } from "../../services/tasksService";
import { projectsService } from "../../services/projectsService";
import { teamsService } from "../../services/teamsService";
import { useAuth } from "../../context/AuthContext";

const badgeClasses = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

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

export default function TasksPage() {
  const { role, user } = useAuth();
  const isAdmin = String(role || "").toLowerCase() === "admin";
  const isManager = String(role || "").toLowerCase() === "manager";
  const isMember = String(role || "").toLowerCase() === "member";
  const canCreate = isAdmin || isManager;

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    project: "",
    description: "",
    due_date: "",
    priority: "MEDIUM",
    assigned_to: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    project: "",
    description: "",
    due_date: "",
    priority: "MEDIUM",
    assigned_to: "",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [taskData, projectData, teamsData] = await Promise.all([
        tasksService.list(),
        projectsService.list(),
        teamsService.list(),
      ]);
      const tRows = taskData?.results || taskData || [];
      const pRows = projectData?.results || projectData || [];
      const teamRows = teamsData?.results || teamsData || [];
      setTasks(tRows);
      setProjects(pRows);
      setTeams(teamRows);
      if (!selectedTaskId && tRows.length) setSelectedTaskId(tRows[0].id);
    } catch (e) {
      setError(readError(e, "Impossible de charger les tâches."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (!filterProject) {
      list = tasks;
    } else {
      list = tasks.filter((task) => String(task.project) === String(filterProject));
    }
    if (isMember) {
      list = list.filter((task) => Number(task.assigned_to) === Number(user?.id));
    }
    return list;
  }, [tasks, filterProject, isMember, user]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach((project) => {
      map[project.id] = project;
    });
    return map;
  }, [projects]);

  const teamMap = useMemo(() => {
    const map = {};
    teams.forEach((team) => {
      map[team.id] = team;
    });
    return map;
  }, [teams]);

  const membersFor = (projectId) => {
    const project = projectMap[Number(projectId)];
    if (!project) return [];
    const team = teamMap[project.team];
    return team?.members || [];
  };

  const availableMembers = useMemo(() => membersFor(createForm.project), [createForm.project, projectMap, teamMap]);
  const availableEditMembers = useMemo(() => membersFor(editForm.project), [editForm.project, projectMap, teamMap]);

  const projectName = (projectId) =>
    projects.find((project) => project.id === projectId)?.name || `Project #${projectId}`;

  const canEditTask = (task) => {
    if (isAdmin || isManager) return true;
    return isMember && Number(task.assigned_to) === Number(user?.id);
  };

  const onStatusChange = async (taskId, newStatus) => {
    setError("");
    try {
      if (isMember) {
        console.log("DEBUG: updateStatus payload", { status: newStatus });
        await tasksService.updateStatus(taskId, newStatus); // n'envoie que {status: ...}
      } else {
        console.log("DEBUG: update payload", { status: newStatus });
        await tasksService.update(taskId, { status: newStatus }); // admin/manager peuvent tout envoyer
      }
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de mise à jour du statut."));
    }
  };

  const onPriorityChange = async (taskId, newPriority) => {
    setError("");
    try {
      await tasksService.update(taskId, { priority: newPriority });
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de mise à jour de la priorité."));
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        title: createForm.title,
        description: createForm.description,
        project: Number(createForm.project),
        due_date: createForm.due_date || null,
        status: "TODO",
        priority: createForm.priority || "MEDIUM",
      };
      if (createForm.assigned_to) payload.assigned_to = Number(createForm.assigned_to);
      await tasksService.create(payload);
      setCreateForm({
        title: "",
        project: "",
        description: "",
        due_date: "",
        priority: "MEDIUM",
        assigned_to: "",
      });
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de création de la tâche."));
    }
  };
  const onEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        project: Number(editForm.project),
        due_date: editForm.due_date || null,
        priority: editForm.priority || "MEDIUM",
      };
      if (editForm.assigned_to) payload.assigned_to = Number(editForm.assigned_to);
      await tasksService.update(editingTaskId, payload);
      setShowEdit(false);
      setEditingTaskId(null);
      setEditForm({
        title: "",
        project: "",
        description: "",
        due_date: "",
        priority: "MEDIUM",
        assigned_to: "",
      });
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de modification de la tâche."));
    }
  };

  const onDelete = async (taskId) => {
    setError("");
    try {
      await tasksService.remove(taskId);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de suppression de la tâche."));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Tâches</h2>

      {canCreate ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
          <h3 className="mb-3 text-lg font-medium">Créer une tâche</h3>
          <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="rounded border px-3 py-2" placeholder="Titre" value={createForm.title} onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))} required />
            <select className="rounded border px-3 py-2" value={createForm.project} onChange={(e) => setCreateForm((s) => ({ ...s, project: e.target.value, assigned_to: "" }))} required>
              <option value="">Projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <input className="rounded border px-3 py-2" type="date" value={createForm.due_date} onChange={(e) => setCreateForm((s) => ({ ...s, due_date: e.target.value }))} />
            <select className="rounded border px-3 py-2" value={createForm.priority} onChange={(e) => setCreateForm((s) => ({ ...s, priority: e.target.value }))}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
            <button className="rounded bg-primary px-4 py-2 text-white">Créer</button>
            <select className="rounded border px-3 py-2 md:col-span-2" value={createForm.assigned_to} onChange={(e) => setCreateForm((s) => ({ ...s, assigned_to: e.target.value }))}>
              <option value="">Assigner à (optionnel)</option>
              {availableMembers.map((memberId) => (
                <option key={memberId} value={memberId}>User #{memberId}</option>
              ))}
            </select>
            <textarea className="rounded border px-3 py-2 md:col-span-3" rows={2} placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))} />
          </form>
        </div>
      ) : null}
      {showEdit ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
          <h3 className="mb-3 text-lg font-medium">Modifier la tâche</h3>
          <form onSubmit={onEditSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="rounded border px-3 py-2" placeholder="Titre" value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} required />
            <select className="rounded border px-3 py-2" value={editForm.project} onChange={(e) => setEditForm((s) => ({ ...s, project: e.target.value, assigned_to: "" }))} required>
              <option value="">Projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <input className="rounded border px-3 py-2" type="date" value={editForm.due_date} onChange={(e) => setEditForm((s) => ({ ...s, due_date: e.target.value }))} />
            <select className="rounded border px-3 py-2" value={editForm.priority} onChange={(e) => setEditForm((s) => ({ ...s, priority: e.target.value }))}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
            <div className="flex items-center gap-2">
              <button className="rounded bg-primary px-4 py-2 text-white">Enregistrer</button>
              <button type="button" className="rounded border px-4 py-2" onClick={() => { setShowEdit(false); setEditingTaskId(null); }}>Annuler</button>
            </div>
            <select className="rounded border px-3 py-2 md:col-span-2" value={editForm.assigned_to} onChange={(e) => setEditForm((s) => ({ ...s, assigned_to: e.target.value }))}>
              <option value="">Assigner à (optionnel)</option>
              {availableEditMembers.map((memberId) => (
                <option key={memberId} value={memberId}>User #{memberId}</option>
              ))}
            </select>
            <textarea className="rounded border px-3 py-2 md:col-span-3" rows={2} placeholder="Description" value={editForm.description} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} />
          </form>
        </div>
      ) : null}

      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm font-medium">Filtrer par projet:</label>
          <select className="rounded border px-3 py-2" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">Tous</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        {loading ? <p>Chargement...</p> : null}
        {error ? <div className="mb-3 rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div> : null}

        {!loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-2">
              {filteredTasks.map((task) => (
                <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className={`cursor-pointer rounded border p-3 ${selectedTaskId === task.id ? "border-primary bg-blue-50" : "border-stroke"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{task.title}</p>
                    <span className={`rounded-full px-2 py-1 text-xs ${badgeClasses[task.status] || badgeClasses.TODO}`}>{task.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{projectName(task.project)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Assigné: {task.assigned_to ? `#${task.assigned_to}` : "-"}</span>
                    <span className="text-xs text-slate-500">Echéance: {task.due_date || "-"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select className="rounded border px-2 py-1 text-sm" value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)} disabled={!canEditTask(task)}>
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DONE">DONE</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                    {(isAdmin || isManager) ? (
                      <select className="rounded border px-2 py-1 text-sm" value={task.priority || "MEDIUM"} onChange={(e) => onPriorityChange(task.id, e.target.value)}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    ) : null}
                    {(isAdmin || isManager) ? (
                      <>
                        <button className="rounded bg-primary px-2 py-1 text-xs text-white" onClick={(e) => { e.stopPropagation();
                          setEditingTaskId(task.id);
                          setEditForm({
                            title: task.title || "",
                            project: task.project || "",
                            description: task.description || "",
                            due_date: task.due_date || "",
                            priority: task.priority || "MEDIUM",
                            assigned_to: task.assigned_to || "",
                          });
                          setShowEdit(true);
                        }}>
                          Modifier
                        </button>
                        <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
                          Supprimer
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded border border-stroke p-4">
              <h4 className="mb-2 font-semibold">Détails de la tâche</h4>
              {selectedTask ? (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Titre:</span> {selectedTask.title}</p>
                  <p><span className="font-medium">Projet:</span> {projectName(selectedTask.project)}</p>
                  <p><span className="font-medium">Description:</span> {selectedTask.description || "-"}</p>
                  <p><span className="font-medium">Statut:</span> {selectedTask.status}</p>
                  <p><span className="font-medium">Priorité:</span> {selectedTask.priority || "-"}</p>
                  <p><span className="font-medium">Date limite:</span> {selectedTask.due_date || "-"}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sélectionne une tâche.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
