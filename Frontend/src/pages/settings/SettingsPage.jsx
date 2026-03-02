import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../../services/settingsService";
import { getProfile } from "../../services/profileService";
import api from "../../services/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState({ email_notifications: true, task_reminder_notifications: true });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminStats, setAdminStats] = useState({ users: null, projects: null });

  useEffect(() => {
    Promise.all([getSettings(), getProfile()])
      .then(([settingsRes, profileRes]) => {
        setSettings(settingsRes.data);
        setProfile(profileRes.data);
        if (profileRes.data.role === "admin") {
          fetchAdminStats();
        }
      })
      .catch(() => setError("Impossible de charger les paramètres."))
      .finally(() => setLoading(false));
  }, []);

  const fetchAdminStats = async () => {
    try {
      const usersRes = await api.get("auth/admin/users-count/");
      const projectsRes = await api.get("auth/admin/projects-count/");
      setAdminStats({ users: usersRes.data.count, projects: projectsRes.data.count });
    } catch {}
  };

  const handleChange = (e) => {
    setSettings((s) => ({ ...s, [e.target.name]: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await updateSettings(settings);
      setSuccess("Paramètres enregistrés.");
    } catch {
      setError("Erreur lors de la sauvegarde.");
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!profile) return <div>Erreur de chargement du profil.</div>;

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Paramètres</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Notifications</h2>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="email_notifications" name="email_notifications" checked={settings.email_notifications} onChange={handleChange} />
          <label htmlFor="email_notifications">Recevoir les notifications par email</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="task_reminder_notifications" name="task_reminder_notifications" checked={settings.task_reminder_notifications} onChange={handleChange} />
          <label htmlFor="task_reminder_notifications">Alertes tâches en retard</label>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button type="submit" className="bg-primary text-white rounded px-4 py-2">Enregistrer</button>
      </form>

      <div className="bg-white rounded-xl shadow p-6 space-y-2">
        <h2 className="text-lg font-semibold mb-2">Sécurité</h2>
        <div className="flex items-center gap-2">
          <span className="font-medium">Rôle :</span>
          <span>{profile.role}</span>
        </div>
        {/* Déconnexion globale possible ici si besoin */}
      </div>

      {profile.role === "admin" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          <h2 className="text-lg font-semibold mb-2">Statistiques administrateur</h2>
          <div>Nombre total d'utilisateurs : <b>{adminStats.users ?? "..."}</b></div>
          <div>Nombre de projets actifs : <b>{adminStats.projects ?? "..."}</b></div>
        </div>
      )}
    </div>
  );
}

