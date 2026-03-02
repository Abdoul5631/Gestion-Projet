import React, { useEffect, useState } from "react";
import { reportsService } from "../../services/reportsService";
import { projectsService } from "../../services/projectsService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";

const emptyForm = {
  project: "",
  title: "",
  content: "",
  status: "PENDING",
  manager_comment: "",
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

export default function ReportsPage() {
  const [showGlobalContent, setShowGlobalContent] = useState(false);
  const { role, user } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  const isAdmin = roleLower === "admin";
  const isManager = roleLower === "manager";
  const isMember = roleLower === "member";

  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [globalReports, setGlobalReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [managerComment, setManagerComment] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reportsData, projectsData] = await Promise.all([
        reportsService.list(),
        projectsService.list(),
      ]);
      const list = reportsData?.results || reportsData || [];
      setRows(list);
      const projList = projectsData?.results || projectsData || [];
      setProjects(projList);
      if (!selectedId && list.length) setSelectedId(list[0].id);
    } catch (e) {
      setError(readError(e, "Impossible de charger les rapports."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  // Pour les membres, trouver tous les rapports globaux du manager pour leurs projets
  useEffect(() => {
    if (isMember && projects.length && rows.length) {
      // Pour chaque projet du membre, trouver les rapports dont l'auteur est le manager du projet
      const myProjects = projects.filter(
        (p) => p.team && p.team.members && p.team.members.includes(user?.id)
      );
      const globals = rows.filter((r) => {
        const proj = myProjects.find((p) => String(p.id) === String(r.project));
        if (!proj) return false;
        // Supporte manager comme id ou objet
        const managerId = typeof proj.manager === 'object' && proj.manager !== null ? proj.manager.id : proj.manager;
        return (
          String(r.author) === String(managerId) &&
          String(r.author) !== String(user?.id)
        );
      });
      setGlobalReports(globals);
    } else {
      setGlobalReports([]);
    }
  }, [isMember, projects, rows, user]);

  useEffect(() => {
    if (selectedId != null) {
      const rep = rows.find((r) => r.id === selectedId) || null;
      setSelectedReport(rep);
    } else {
      setSelectedReport(null);
    }
  }, [selectedId, rows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await reportsService.update(editingId, form);
      } else {
        await reportsService.create(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de sauvegarde du rapport."));
    }
  };

  const onUpdate = async (patch) => {
    if (!selectedReport) return;
    setError("");
    try {
      await reportsService.update(selectedReport.id, patch);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de mise à jour du rapport."));
    }
  };

  const onDelete = async (id) => {
    setError("");
    try {
      await reportsService.remove(id);
      setSelectedId(null);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de suppression du rapport."));
    }
  };

  const canEditOwn = () => {
    return (
      selectedReport &&
      selectedReport.author === user?.id &&
      selectedReport.status === "PENDING"
    );
  };

  const openEdit = () => {
    if (selectedReport) {
      setEditingId(selectedReport.id);
      setForm({
        project: selectedReport.project || "",
        title: selectedReport.title || "",
        content: selectedReport.content || "",
        status: selectedReport.status || "PENDING",
        manager_comment: selectedReport.manager_comment || "",
      });
      setShowForm(true);
    }
  };

  const renderActions = () => {
    if (!selectedReport) return null;
    if (isAdmin) {
      return (
        <div className="mt-3 space-x-2">
          <button
            className="rounded bg-green-600 px-3 py-2 text-white"
            onClick={openEdit}
          >
            Modifier
          </button>
          <button
            className="rounded bg-rose-600 px-3 py-2 text-white"
            onClick={() => onDelete(selectedReport.id)}
          >
            Supprimer
          </button>
        </div>
      );
    }
    if (isManager && selectedReport.status === "PENDING") {
      return (
        <div className="mt-3 space-x-2">
          <textarea
            className="w-full rounded border px-3 py-2"
            placeholder="Commentaire manager"
            value={managerComment}
            onChange={(e) => setManagerComment(e.target.value)}
          />
          <button
            className="rounded bg-green-600 px-3 py-2 text-white"
            onClick={() => onUpdate({ status: "APPROVED", manager_comment: managerComment })}
          >
            Approuver
          </button>
          <button
            className="rounded bg-red-600 px-3 py-2 text-white"
            onClick={() => onUpdate({ status: "REJECTED", manager_comment: managerComment })}
          >
            Rejeter
          </button>
        </div>
      );
    }
    if (canEditOwn()) {
      return (
        <div className="mt-3 space-x-2">
          <button
            className="rounded bg-primary px-3 py-2 text-white"
            onClick={openEdit}
          >
            Modifier
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">Rapports</h2>
        <div className="flex gap-2">
          {isMember ? (
            <button onClick={openCreate} className="rounded bg-primary px-4 py-2 text-white">
              Créer Rapport
            </button>
          ) : null}
          {isManager ? (
            <button
              onClick={openCreate}
              className="rounded bg-green-600 px-4 py-2 text-white font-semibold shadow"
              style={{ minWidth: 220 }}
            >
              Générer rapport d’avancement global
            </button>
          ) : null}
        </div>
      </div>

      {/* Rapports globaux finaux bien différenciés pour les membres, affichés en haut et non dans la liste classique */}
      {isMember && globalReports.length > 0 && (
        <GlobalReportsModalList globalReports={globalReports} />
      )}

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      {!loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-sm border border-stroke bg-white p-5 shadow-default">
            <div className="space-y-2">
              {rows
                .filter((rep) => !(isMember && globalReports.some((g) => g.id === rep.id)))
                .map((rep) => (
                  <div
                    key={rep.id}
                    className={`cursor-pointer rounded border p-3 ${selectedId === rep.id ? "border-primary bg-blue-50" : "border-stroke"}`}
                    onClick={() => setSelectedId(rep.id)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{rep.title}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold
                          ${rep.status === 'APPROUVÉ' ? 'bg-green-600 text-white border border-green-700'
                          : rep.status === 'REJETÉ' ? 'bg-rose-100 text-rose-700 border border-rose-400'
                          : 'bg-slate-100 text-slate-700'}
                        `}
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Par {rep.author_username}</p>
                    <p className="mt-1 text-xs text-slate-500">Projet: {rep.project_name || "-"}</p>
                    {isAdmin ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          className="text-xs text-blue-600"
                          onClick={(e) => { e.stopPropagation(); setSelectedId(rep.id); openEdit(); }}
                        >Modifier</button>
                        <button
                          className="text-xs text-rose-600"
                          onClick={(e) => { e.stopPropagation(); onDelete(rep.id); }}
                        >Supprimer</button>
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
            {selectedReport ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Titre:</span> {selectedReport.title}</p>
                <p><span className="font-medium">Projet:</span> {selectedReport.project_name || "-"}</p>
                <p><span className="font-medium">Auteur:</span> {selectedReport.author_username}</p>
                <p>
                  <span className="font-medium">Statut:</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold
                      ${selectedReport.status === 'APPROUVÉ' ? 'bg-green-600 text-white border border-green-700'
                      : selectedReport.status === 'REJETÉ' ? 'bg-rose-100 text-rose-700 border border-rose-400'
                      : 'bg-slate-100 text-slate-700'}
                    `}
                  >
                    {selectedReport.status}
                  </span>
                </p>
                <p><span className="font-medium">Créé le:</span> {selectedReport.created_at}</p>
                <p><span className="font-medium">Contenu:</span> {selectedReport.content}</p>
                <p><span className="font-medium">Commentaire manager:</span> {selectedReport.manager_comment || "-"}</p>
                {renderActions()}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sélectionne un rapport.</p>
            )}
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div className="fixed inset-0 z-99999 grid place-items-center bg-black/40 px-4">
          <form onSubmit={onSubmit} className="w-full max-w-xl rounded border bg-white p-5">
            <h3 className="mb-3 text-lg font-medium">{canEditOwn() ? "Modifier Rapport" : "Créer Rapport"}</h3>
            <div className="grid grid-cols-1 gap-3">
              <select
                className="rounded border px-3 py-2"
                value={form.project}
                onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
                required
                disabled={Boolean(editingId) && !isAdmin}
              >
                <option value="">Projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                className="rounded border px-3 py-2"
                placeholder="Titre"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <textarea
                className="rounded border px-3 py-2"
                rows={5}
                placeholder="Contenu"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                required
              />
              {editingId && isAdmin ? (
                <>
                  <select
                    className="rounded border px-3 py-2"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                  <textarea
                    className="rounded border px-3 py-2"
                    rows={2}
                    placeholder="Commentaire manager"
                    value={form.manager_comment}
                    onChange={(e) => setForm((f) => ({ ...f, manager_comment: e.target.value }))}
                  />
                </>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-2" onClick={() => { setShowForm(false); setEditingId(null); }}>Annuler</button>
              <button type="submit" className="rounded bg-primary px-3 py-2 text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function GlobalReportsModalList({ globalReports }) {
  const [openReport, setOpenReport] = useState(null);
  return (
    <div className="mb-4">
      {globalReports.map((globalReport) => (
        <div key={globalReport.id} className="rounded border-2 border-green-600 bg-green-50 p-4 mb-4 shadow">
          <h3 className="text-xl font-bold text-green-800 mb-2">Rapport global final du manager</h3>
          <p className="mb-1"><span className="font-medium">Projet :</span> {globalReport.project_name}</p>
          <p className="mb-1"><span className="font-medium">Titre donné par le manager :</span> {globalReport.title}</p>
          <p className="mb-1"><span className="font-medium">Statut :</span> {globalReport.status === 'PENDING' ? 'En attente de validation' : globalReport.status === 'APPROUVÉ' ? 'Approuvé' : globalReport.status === 'REJETÉ' ? 'Rejeté' : globalReport.status}</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => setOpenReport(globalReport)}
          >
            Ouvrir
          </button>
          <p className="mt-2 text-sm text-green-900"><span className="font-medium">Manager :</span> {globalReport.author_username}</p>
        </div>
      ))}
      {openReport && (
        <Modal onClose={() => setOpenReport(null)}>
          <div className="p-4 max-w-lg">
            <h3 className="text-xl font-bold mb-2">{openReport.title}</h3>
            <div className="mb-4 whitespace-pre-line text-gray-800 bg-white p-3 rounded border">
              {openReport.content}
            </div>
            <p className="text-sm text-green-900 mb-2"><span className="font-medium">Manager :</span> {openReport.author_username}</p>
            <button
              className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setOpenReport(null)}
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}