
import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../../services/profileService";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => {
        setProfile(res.data);
        setForm({ username: res.data.username, email: res.data.email });
      })
      .catch(() => setError("Impossible de charger le profil."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await updateProfile(form);
      setProfile(res.data);
      setSuccess("Profil mis à jour.");
    } catch (err) {
      setError("Erreur lors de la mise à jour.");
    }
  };

  const handlePwChange = (e) => {
    setPwForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    try {
      await changePassword(pwForm);
      setPwSuccess("Mot de passe changé avec succès.");
      setPwForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPwError(err?.response?.data?.old_password || err?.response?.data?.confirm_password || "Erreur lors du changement de mot de passe.");
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!profile) return <div>Erreur de chargement du profil.</div>;

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Profil</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Nom d'utilisateur</label>
          <input name="username" value={form.username} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Rôle</label>
          <input value={profile.role} disabled className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" />
        </div>
        {profile.date_joined && (
          <div>
            <label className="block text-sm font-medium">Date de création</label>
            <input value={profile.date_joined?.slice(0, 10)} disabled className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" />
          </div>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button type="submit" className="bg-primary text-white rounded px-4 py-2">Enregistrer</button>
      </form>

      <form onSubmit={handlePwSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Changer le mot de passe</h2>
        <div>
          <label className="block text-sm font-medium">Ancien mot de passe</label>
          <input name="old_password" type="password" value={pwForm.old_password} onChange={handlePwChange} className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Nouveau mot de passe</label>
          <input name="new_password" type="password" value={pwForm.new_password} onChange={handlePwChange} className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Confirmer le nouveau mot de passe</label>
          <input name="confirm_password" type="password" value={pwForm.confirm_password} onChange={handlePwChange} className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        {pwError && <div className="text-red-600 text-sm">{pwError}</div>}
        {pwSuccess && <div className="text-green-600 text-sm">{pwSuccess}</div>}
        <button type="submit" className="bg-primary text-white rounded px-4 py-2">Changer le mot de passe</button>
      </form>
    </div>
  );
}

