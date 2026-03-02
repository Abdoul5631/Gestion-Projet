import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { teamsService } from "../../services/teamsService";
import { usersService } from "../../services/usersService";

const emptyForm = {
  name: "",
  description: "",
  manager: "",
};

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

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamsRes, usersRes] = await Promise.all([
        teamsService.list(),
        usersService.list(),
      ]);
      setTeams(teamsRes?.results || teamsRes || []);
      const usersArr = usersRes?.results || usersRes || [];
      setUsers(usersArr);
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

  const managers = useMemo(
    () => users.filter((u) => ["manager", "admin"].includes(String(u.role || "").toLowerCase())),
    [users]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (team) => {
    setEditing(team);
    setForm({
      name: team.name || "",
      description: team.description || "",
      manager: team.manager ? String(team.manager) : "",
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        name: form.name,
        description: form.description,
        manager: form.manager ? Number(form.manager) : null,
      };
      if (editing) {
        await teamsService.update(editing.id, payload);
      } else {
        await teamsService.create(payload);
      }
      setShowForm(false);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec sauvegarde équipe."));
    }
  };

  const remove = async (team) => {
    if (!window.confirm(`Supprimer l'équipe ${team.name} ?`)) return;
    setError("");
    try {
      await teamsService.remove(team.id);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec suppression équipe."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">Teams Management</h2>
        <button className="rounded bg-primary px-4 py-2 text-white" onClick={openCreate}>Créer équipe</button>
      </div>
      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {!loading ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Manager</th>
                <th className="px-3 py-2 text-left">Membres</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b">
                  <td className="px-3 py-2">{team.name}</td>
                  <td className="px-3 py-2">{team.manager ? (usersById[team.manager] ? `${usersById[team.manager].id} ${usersById[team.manager].username}` : `#${team.manager}`) : "-"}</td>
                  <td className="px-3 py-2">{(team.members || []).map((id) => usersById[id] ? `${usersById[id].id} ${usersById[id].username}` : `#${id}`).join(', ') || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="rounded border px-2 py-1" onClick={() => openEdit(team)}>Modifier</button>
                      <button className="rounded bg-rose-600 px-2 py-1 text-white" onClick={() => remove(team)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showForm ? (
        <div className="fixed inset-0 z-99999 grid place-items-center bg-black/40 px-4">
          <form onSubmit={submit} className="w-full max-w-lg rounded border bg-white p-5">
            <h3 className="mb-3 text-lg font-medium">{editing ? "Modifier équipe" : "Créer équipe"}</h3>
            <div className="grid grid-cols-1 gap-3">
              <input className="rounded border px-3 py-2" placeholder="Nom" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
              <textarea className="rounded border px-3 py-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
              <select className="rounded border px-3 py-2" value={form.manager} onChange={(e) => setForm((s) => ({ ...s, manager: e.target.value }))}>
                <option value="">Manager (optionnel)</option>
                {managers.map((u) => (
                  <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-2" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="rounded bg-primary px-3 py-2 text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
