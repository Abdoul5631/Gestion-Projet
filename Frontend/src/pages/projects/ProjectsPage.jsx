import React, { useEffect, useMemo, useState } from "react";
import { projectsService } from "../../services/projectsService";
import { tasksService } from "../../services/tasksService";
import { teamsService } from "../../services/teamsService";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  name: "",
  description: "",
  team: "",
  start_date: "",
  end_date: "",
  status: "PLANNED",
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

// Mapping code statut -> label humain
const STATUS_LABELS = {
  PLANNED: "Planifié",
  ACTIVE: "Actif",
  ON_HOLD: "En pause",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  ACTIFS: "Actif", // fallback pour l'ancien code
};

export default function ProjectsPage() {
  // Hooks (déclaration unique et en haut du composant)
  const [projects, setProjects] = useState([]);
  const [taskRows, setTaskRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [quickTeamName, setQuickTeamName] = useState("");
  const [loading, setLoading] = useState(true);

  const { role, user } = useAuth();
  const isAdmin = String(role || "").toLowerCase() === "admin";
  const isManager = String(role || "").toLowerCase() === "manager";
  const canManageProjects = isAdmin || isManager;
  const userId = Number(user?.id);

  // Fonctions
  const isTeamMember = (teamId) => {
    const team = teams.find((t) => t.id === Number(teamId));
    return team ? (team.members || []).some((m) => Number(m) === userId) : false;
  };

  const loadData = async () => {
    setError("");
    try {
      const [projectsData, tasksData, teamsData] = await Promise.all([
        projectsService.list(),
        tasksService.list(),
        teamsService.list(),
      ]);
      const pRows = projectsData?.results || projectsData || [];
      const tRows = tasksData?.results || tasksData || [];
      const teamRows = teamsData?.results || teamsData || [];
      // setRows(pRows); // Cette ligne provoque une erreur car setRows n'existe pas
      setProjects(pRows);
      setTaskRows(tRows);
      setTeams(teamRows);
      if (!selectedId && pRows.length) setSelectedId(Number(pRows[0].id));
    } catch (e) {
      setError(readError(e, "Impossible de charger les projets."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = async () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      team: teams.length ? String(teams[0].id) : "",
    });
    setQuickTeamName("");
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        team: Number(form.team),
      };
      if (editingId) {
        await projectsService.update(editingId, payload);
      } else {
        await projectsService.create(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de sauvegarde du projet."));
    }
  };

  const openEdit = (project) => {
    setEditingId(project.id);
    setForm({
      name: project.name || "",
      description: project.description || "",
      team: String(project.team || ""),
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status || "PLANNED",
    });
    setShowForm(true);
  };

  const tasksCountMap = useMemo(() => {
    const map = {};
    taskRows.forEach((task) => {
      map[task.project] = (map[task.project] || 0) + 1;
    });
    return map;
  }, [taskRows]);

  const selectedProject = useMemo(
    () => projects.find((p) => Number(p.id) === Number(selectedId)) || null,
    [projects, selectedId]
  );
  const onArchive = async (id) => {
    setError("");
    try {
      await projectsService.archive(id);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec d'archivage du projet."));
    }
  };

  const onDelete = async (id) => {
    setError("");
    try {
      await projectsService.remove(id);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de suppression du projet."));
    }
  };

  const onQuickCreateTeam = async () => {
    if (!quickTeamName.trim()) return;
    setError("");
    try {
      const created = await teamsService.create({
        name: quickTeamName.trim(),
        description: "Equipe créée depuis la page Projets",
      });
      const createdId = created?.id;
      if (createdId) {
        setTeams((prev) => [...prev, created]);
        setForm((prev) => ({ ...prev, team: String(createdId) }));
      }
      setQuickTeamName("");
    } catch (e) {
      setError(readError(e, "Impossible de créer l'équipe."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">Projets</h2>
        {canManageProjects ? (
          <button onClick={openCreate} className="rounded bg-primary px-4 py-2 text-white">
            Créer Projet
          </button>
        ) : null}
      </div>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      {/* DEBUG: Affichage temporaire pour diagnostic */}
      <div style={{fontSize: '12px', color: '#888', marginBottom: 8}}>
        <b>selectedId:</b> {String(selectedId)} | projets: [{projects.map(p => p.id).join(', ')}]
      </div>
      {!loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-sm border border-stroke bg-white p-5 shadow-default">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-lg border p-4 transition ${selectedId === project.id ? "border-primary bg-blue-50" : "border-stroke hover:border-primary hover:bg-blue-50/30"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold">{project.name}</h4>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{project.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{project.description || "Aucune description"}</p>
                  <p className="mt-2 text-xs text-slate-500">Début: {project.start_date || "-"}</p>
                  <p className="mt-1 text-xs text-slate-500">Tâches: {tasksCountMap[project.id] || 0}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedId(Number(project.id))}
                      className={`rounded px-3 py-1 text-sm font-semibold shadow transition border-2 focus:outline-none focus:ring-2 focus:ring-primary/60 ${Number(selectedId) === Number(project.id) ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary hover:bg-primary hover:text-white"}`}
                    >
                      Voir
                    </button>
                    {(canManageProjects && (isAdmin || isTeamMember(project.team))) ? (
                      <button onClick={e => { e.stopPropagation(); openEdit(project); }} className="rounded border px-2 py-1 text-sm">
                        Modifier
                      </button>
                    ) : null}
                    {(canManageProjects && (isAdmin || isTeamMember(project.team))) ? (
                      <button onClick={e => { e.stopPropagation(); onArchive(project.id); }} className="rounded border px-2 py-1 text-sm">
                        Archiver
                      </button>
                    ) : null}
                    {isAdmin ? (
                      <button onClick={e => { e.stopPropagation(); onDelete(project.id); }} className="rounded bg-rose-600 px-2 py-1 text-sm text-white">
                        Supprimer
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
            <h3 className="mb-3 text-lg font-medium">Détails du projet</h3>
            {selectedProject && (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Nom:</span> {selectedProject.name || '-'}</p>
                <p><span className="font-medium">Description:</span> {selectedProject.description || '-'}</p>
                <p><span className="font-medium">Statut:</span> {STATUS_LABELS[selectedProject.status] || selectedProject.status || '-'}</p>
                <p><span className="font-medium">Date:</span> {selectedProject.start_date || '-'} {'->'} {selectedProject.end_date || '-'}</p>
                <p><span className="font-medium">Tâches:</span> {tasksCountMap[selectedProject.id] || 0}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {showForm ? (
        <>
          {/* Rapport d’avancement global (manager) */}
          <div className="fixed inset-0 z-99999 grid place-items-center bg-black/40 px-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                try {
                  await reportsService.create(form);
                  setShowForm(false);
                  setForm(emptyForm);
                  alert("Rapport d’avancement global généré avec succès.");
                } catch (e) {
                  setError(readError(e, "Impossible de générer le rapport."));
                }
              }}
              className="w-full max-w-xl rounded border bg-white p-5"
            >
              <h3 className="mb-3 text-lg font-medium">Générer rapport d’avancement global</h3>
              <div className="grid grid-cols-1 gap-3">
                <input className="rounded border px-3 py-2" placeholder="Titre" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                <textarea className="rounded border px-3 py-2" placeholder="Contenu du rapport" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={5} required />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="rounded px-4 py-2 bg-slate-200" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="rounded px-4 py-2 bg-green-600 text-white">Générer</button>
              </div>
              {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}
            </form>
          </div>
          {/* Formulaire projet classique */}
          <div className="fixed inset-0 z-99999 grid place-items-center bg-black/40 px-4">
            <form onSubmit={submitForm} className="w-full max-w-xl rounded border bg-white p-5">
              <h3 className="mb-3 text-lg font-medium">{editingId ? "Modifier Projet" : "Créer Projet"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="rounded border px-3 py-2" placeholder="Nom" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                <select className="rounded border px-3 py-2" value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))} required>
                  <option value="">Equipe</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <input className="rounded border px-3 py-2" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} required />
                <input className="rounded border px-3 py-2" type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} required />
                <select className="rounded border px-3 py-2 md:col-span-2" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="PLANNED">PLANNED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                {teams.length === 0 ? (
                  <div className="md:col-span-2 rounded border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-2 text-sm text-amber-800">Aucune équipe disponible. Crée une équipe d'abord.</p>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded border px-3 py-2"
                        placeholder="Nom de l'équipe"
                        value={quickTeamName}
                        onChange={(e) => setQuickTeamName(e.target.value)}
                      />
                      <button type="button" className="rounded bg-primary px-3 py-2 text-white" onClick={onQuickCreateTeam}>
                        Créer équipe
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="rounded border px-3 py-2" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="rounded bg-primary px-3 py-2 text-white">Enregistrer</button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
