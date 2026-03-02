import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { tasksService } from "../../services/tasksService";
import { projectsService } from "../../services/projectsService"; // need projects for task editing
import { usersService } from "../../services/usersService";

const readError = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const k = Object.keys(data)[0];
  const v = data[k];
  if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`;
  if (typeof v === "string") return `${k}: ${v}`;
  return fallback;
};

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [projects, setProjects] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editValues, setEditValues] = useState({ title: "", status: "", assigned_to: "", project: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksData, usersData, projectsData] = await Promise.all([
        tasksService.list(),
        usersService.list(),
        projectsService.list(),
      ]);
      setTasks(tasksData?.results || tasksData || []);
      const usersArr = usersData?.results || usersData || [];
      setUsers(usersArr);
      setProjects(projectsData?.results || projectsData || []);
      const usersMap = {};
      usersArr.forEach((u) => { usersMap[u.id] = u; });
      setUsersById(usersMap);
    } catch (e) {
      setError(readError(e, "Impossible de charger les taches."));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditValues({
      title: task.title,
      status: task.status,
      assigned_to: task.assigned_to || "",
      project: task.project,
    });
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditValues({ title: "", status: "", assigned_to: "", project: null });
  };

  const saveEdit = async () => {
    if (editingTaskId == null) return;
    await updateTask(editingTaskId, {
      title: editValues.title,
      status: editValues.status,
      assigned_to: editValues.assigned_to || null,
      project: editValues.project,
    }, "Echec modification tache.");
    cancelEdit();
  }; 

  useEffect(() => {
    loadData();
  }, []);

  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => t.status !== "DONE" && t.due_date && t.due_date < today).length;
  }, [tasks]);

  const updateTask = async (taskId, payload, fallback) => {
    setError("");
    try {
      await tasksService.update(taskId, payload);
      await loadData();
    } catch (e) {
      setError(readError(e, fallback));
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Supprimer la tache ${task.title} ?`)) return;
    setError("");
    try {
      await tasksService.remove(task.id);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec suppression tache."));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Tasks Overview</h2>
      <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
        <span className="text-sm text-slate-500">Taches en retard globales</span>
        <div className="mt-2 text-3xl font-bold text-slate-700">{overdueCount}</div>
      </div>
      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {!loading ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Titre</th>
                <th className="px-3 py-2 text-left">Projet</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-left">Assigné à</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const isEditing = editingTaskId === task.id;
                if (isEditing) {
                  return (
                    <tr key={`edit-${task.id}`} className="border-b bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded border px-2 py-1"
                          value={editValues.title}
                          onChange={(e) => setEditValues((v) => ({ ...v, title: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded border px-2 py-1"
                          value={editValues.project || ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, project: Number(e.target.value) }))}
                        >
                          <option value="">--</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded border px-2 py-1"
                          value={editValues.status}
                          onChange={(e) => setEditValues((v) => ({ ...v, status: e.target.value }))}
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="DONE">DONE</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded border px-2 py-1"
                          value={editValues.assigned_to || ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, assigned_to: e.target.value ? Number(e.target.value) : "" }))}
                        >
                          <option value="">Aucun</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.id} {u.username}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={saveEdit}>Enregistrer</button>
                          <button className="rounded border px-2 py-1" onClick={cancelEdit}>Annuler</button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={task.id} className="border-b">
                    <td className="px-3 py-2">{task.title}</td>
                    <td className="px-3 py-2">#{task.project}</td>
                    <td className="px-3 py-2">
                      <select className="rounded border px-2 py-1" value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value }, "Echec mise a jour statut.") }>
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="DONE">DONE</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className="rounded border px-2 py-1" value={task.assigned_to || ""} onChange={(e) => updateTask(task.id, { assigned_to: e.target.value ? Number(e.target.value) : null }, "Echec reassignment tache.") }>
                        <option value="">Aucun</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.id} {u.username}</option>
                        ))}
                      </select>
                      {task.assigned_to && usersById[task.assigned_to] ? (
                        <div className="text-xs text-slate-500 mt-1">{usersById[task.assigned_to].id} {usersById[task.assigned_to].username}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button className="rounded border px-2 py-1" onClick={() => startEdit(task)}>
                          Modifier
                        </button>
                        <button className="rounded bg-rose-600 px-2 py-1 text-white" onClick={() => deleteTask(task)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
