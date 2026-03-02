import { useEffect, useState } from "react";
import api from "../../api/axios";
import { projectsService } from "../../services/projectsService";
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

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editValues, setEditValues] = useState({ name: "", status: "", team: "", manager: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const statusOptions = [
    { value: "PLANNED", label: "Planifié" },
    { value: "ACTIVE", label: "Actif" },
    { value: "ON_HOLD", label: "En pause" },
    { value: "COMPLETED", label: "Terminé" },
    { value: "CANCELLED", label: "Annulé" },
  ];

  const startEdit = (project) => {
    setEditingProjectId(project.id);
    setEditValues({
      name: project.name,
      status: project.status,
      team: project.team,
      manager: project.manager || "",
    });
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditValues({ name: "", status: "", team: "", manager: "" });
  };

  const saveEdit = async () => {
    if (editingProjectId == null) return;
    setError("");
    try {
      await projectsService.update(editingProjectId, {
        name: editValues.name,
        status: editValues.status,
        manager: editValues.manager || null,
      });
      cancelEdit();
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec modification projet."));
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [projectsData, usersRes] = await Promise.all([
        projectsService.list(),
        usersService.list(),
      ]);
      setProjects(projectsData?.results || projectsData || []);
      const rows = usersRes?.results || usersRes || [];
      setManagers(rows.filter((u) => ["admin", "manager"].includes(String(u.role || "").toLowerCase())));
      const usersMap = {};
      rows.forEach((u) => { usersMap[u.id] = u; });
      setUsersById(usersMap);
    } catch (e) {
      setError(readError(e, "Impossible de charger les projets."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const archiveProject = async (projectId) => {
    setError("");
    try {
      await projectsService.archive(projectId);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec archivage projet."));
    }
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Supprimer le projet ${project.name} ?`)) return;
    setError("");
    try {
      await projectsService.remove(project.id);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec suppression projet."));
    }
  };

  const reassignManager = async (projectId, managerId) => {
    setError("");
    try {
      await projectsService.update(projectId, { manager: managerId ? Number(managerId) : null });
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec changement manager."));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Projects Overview</h2>
      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {!loading ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Projet</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-left">Equipe</th>
                <th className="px-3 py-2 text-left">Manager</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const isEditing = editingProjectId === project.id;
                if (isEditing) {
                  return (
                    <tr key={`edit-${project.id}`} className="border-b bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded border px-2 py-1"
                          value={editValues.name}
                          onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded border px-2 py-1"
                          value={editValues.status}
                          onChange={(e) => setEditValues((v) => ({ ...v, status: e.target.value }))}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">#{project.team}</td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded border px-2 py-1"
                          value={editValues.manager || ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, manager: e.target.value }))}
                        >
                          <option value="">Aucun</option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>{m.username}</option>
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
                  <tr key={project.id} className="border-b">
                    <td className="px-3 py-2">{project.name}</td>
                    <td className="px-3 py-2">{project.status}</td>
                    <td className="px-3 py-2">#{project.team}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border px-2 py-1"
                        value={project.manager || ""}
                        onChange={(e) => reassignManager(project.id, e.target.value)}
                      >
                        <option value="">Aucun</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>{m.id} {m.username}</option>
                        ))}
                      </select>
                      {project.manager && usersById[project.manager] ? (
                        <div className="text-xs text-slate-500 mt-1">{usersById[project.manager].id} {usersById[project.manager].username}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button className="rounded border px-2 py-1" onClick={() => startEdit(project)}>
                          Modifier
                        </button>
                        <button className="rounded border px-2 py-1" onClick={() => archiveProject(project.id)}>Archiver</button>
                        <button className="rounded bg-rose-600 px-2 py-1 text-white" onClick={() => deleteProject(project)}>Supprimer</button>
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
