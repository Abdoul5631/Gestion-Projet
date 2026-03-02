import { useEffect, useState } from "react";
import api from "../../api/axios";
import { usersService } from "../../services/usersService";
import { teamsService } from "../../services/teamsService";

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

const emptyForm = {
  username: "",
  email: "",
  role: "",
  password: "",
  is_active: true,
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadUsers = async ({ nextPage = page, nextSearch = search, nextRole = roleFilter } = {}) => {
    setLoading(true);
    setError("");
    try {
      const [data, teamsData] = await Promise.all([
        usersService.list({
          page: nextPage,
          search: nextSearch || undefined,
          role: nextRole || undefined,
        }),
        teamsService.list(),
      ]);
      setUsers(data?.results || data || []);
      setHasNext(Boolean(data?.next));
      setPage(nextPage);
      // Indexer les équipes par id
      const teamsArr = teamsData?.results || teamsData || [];
      const teamsMap = {};
      teamsArr.forEach((t) => { teamsMap[t.id] = t; });
      setTeamsById(teamsMap);
    } catch (e) {
      setError(readError(e, "Impossible de charger les utilisateurs."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers({ nextPage: 1 });
  }, []);

  const patchRole = async (user, nextRole) => {
    try {
      await usersService.update(user.id, { role: nextRole });
      await loadUsers();
    } catch (e) {
      setError(readError(e, "Echec de mise a jour du role."));
    }
  };

  const deactivateUser = async (user) => {
    try {
      await usersService.deactivate(user.id);
      await loadUsers();
    } catch (e) {
      setError(readError(e, "Echec de desactivation."));
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Supprimer ${user.username} ?`)) return;
    try {
      await usersService.remove(user.id);
      await loadUsers();
    } catch (e) {
      setError(readError(e, "Echec de suppression."));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "",
      password: "",
      is_active: user.is_active,
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        username: form.username,
        email: form.email,
        role: form.role || undefined,
      };
      if (editing) {
        // allow toggling active status
        payload.is_active = form.is_active;
      }
      if (!editing && form.password) {
        payload.password = form.password;
      }
      if (!editing && form.is_active === false) {
        payload.is_active = form.is_active;
      }
      if (editing) {
        await usersService.update(editing.id, payload);
      } else {
        if (!form.password) {
          throw new Error("Le mot de passe est requis pour créer un utilisateur.");
        }
        await usersService.create(payload);
      }
      setShowForm(false);
      await loadUsers({ nextPage: 1 });
    } catch (e) {
      setError(readError(e, "Echec sauvegarde utilisateur."));
    }
  };

  const onFilter = async (e) => {
    e.preventDefault();
    await loadUsers({ nextPage: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">Users Management</h2>
        <button className="rounded bg-primary px-4 py-2 text-white" onClick={openCreate}>Créer utilisateur</button>
      </div>

      <form onSubmit={onFilter} className="rounded-sm border border-stroke bg-white p-4 shadow-default">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input className="rounded border px-3 py-2" placeholder="Rechercher username/email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded border px-3 py-2" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les roles</option>
            <option value="member">member</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
          <button className="rounded bg-primary px-4 py-2 text-white">Filtrer</button>
          <button type="button" className="rounded border px-4 py-2" onClick={() => { setSearch(""); setRoleFilter(""); loadUsers({ nextPage: 1, nextSearch: "", nextRole: "" }); }}>
            Reset
          </button>
        </div>
      </form>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {!loading ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Username</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Actif</th>
                <th className="px-3 py-2 text-left">Equipes</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-3 py-2">{user.username}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{user.is_active ? "Oui" : "Non"}</td>
                  <td className="px-3 py-2">{(user.teams || []).length ? user.teams.map((id) => teamsById[id] ? `${teamsById[id].id} ${teamsById[id].name}` : `#${id}`).join(', ') : "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded border px-2 py-1" onClick={() => openEdit(user)}>Modifier</button>
                      <button className="rounded border px-2 py-1" onClick={() => patchRole(user, "member")}>member</button>
                      <button className="rounded border px-2 py-1" onClick={() => patchRole(user, "manager")}>manager</button>
                      <button className="rounded border px-2 py-1" onClick={() => patchRole(user, "admin")}>admin</button>
                      <button className="rounded border px-2 py-1" onClick={() => deactivateUser(user)}>Desactiver</button>
                      <button className="rounded bg-rose-600 px-2 py-1 text-white" onClick={() => deleteUser(user)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="rounded border px-3 py-1" onClick={() => loadUsers({ nextPage: Math.max(1, page - 1) })} disabled={page <= 1}>
              Prec
            </button>
            <span className="text-xs text-slate-500">Page {page}</span>
            <button className="rounded border px-3 py-1" onClick={() => loadUsers({ nextPage: page + 1 })} disabled={!hasNext}>
              Suiv
            </button>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div className="fixed inset-0 z-99999 grid place-items-center bg-black/40 px-4">
          <form onSubmit={submitForm} className="w-full max-w-lg rounded border bg-white p-5">
            <h3 className="mb-3 text-lg font-medium">{editing ? "Modifier utilisateur" : "Créer utilisateur"}</h3>
            <div className="grid grid-cols-1 gap-3">
              <input
                className="rounded border px-3 py-2"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                required
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                required
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Mot de passe"
                type="password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                required={!editing}
              />
              <select
                className="rounded border px-3 py-2"
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
              >
                <option value="">Role (optionnel)</option>
                <option value="member">member</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                Utilisateur actif
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-2" onClick={() => setShowForm(false)}>
                Annuler
              </button>
              <button className="rounded bg-primary px-3 py-2 text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
