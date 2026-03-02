import { useEffect, useState } from 'react';
import api from '../services/api';

interface Preferences {
  notifications_actives: boolean;
  theme: string;
  style_apprentissage: string;
}

const Settings = () => {
  const [preferences, setPreferences] = useState<Preferences>({
    notifications_actives: true,
    theme: 'light',
    style_apprentissage: 'visuel',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/me/preferences/');
      setPreferences(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des préférences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (field: string, value: boolean | string) => {
    setPreferences({
      ...preferences,
      [field]: value,
    });
  };

  const handleSavePreferences = async () => {
    try {
      const response = await api.put('/me/preferences/', preferences);
      setPreferences(response.data);
      setSuccessMessage('Préférences mises à jour avec succès! 🎉');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour des préférences');
      console.error('Error updating preferences:', err);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs du mot de passe sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      const response = await api.post('/me/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      
      setSuccessMessage('Mot de passe changé avec succès! 🎉');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
      console.error('Error changing password:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">⚙️ Paramètres</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {successMessage}
        </div>
      )}

      <p className="text-gray-600">
        Gérez vos préférences et paramètres du compte.
      </p>

      {/* Préférences */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold">Préférences personnelles</h2>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Notifications pédagogiques</p>
            <p className="text-sm text-gray-500">
              Recevoir des notifications sur votre progression
            </p>
          </div>

          <input
            type="checkbox"
            checked={preferences.notifications_actives}
            onChange={(e) => handlePreferenceChange('notifications_actives', e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </div>

        {/* Style d'apprentissage */}
        <div>
          <p className="font-medium mb-2">Style d'apprentissage préféré</p>
          <select
            value={preferences.style_apprentissage}
            onChange={(e) => handlePreferenceChange('style_apprentissage', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          >
            <option value="visuel">Visuel</option>
            <option value="auditif">Auditif</option>
            <option value="kinesthesique">Kinesthésique</option>
            <option value="lecture_ecriture">Lecture-Écriture</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Cela aide l'IA à adapter ses explications à votre style d'apprentissage
          </p>
        </div>

        <button
          onClick={handleSavePreferences}
          className="px-6 py-2 rounded bg-primary text-white hover:bg-primary/90 transition"
        >
          Enregistrer les préférences
        </button>
      </div>

      {/* Sécurité */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Sécurité</h2>

        {passwordError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {passwordError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Ancien mot de passe</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Entrez votre ancien mot de passe"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Entrez votre nouveau mot de passe"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmez le nouveau mot de passe"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={handleChangePassword}
          className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
        >
          Changer le mot de passe
        </button>
      </div>
    </div>
  );
};

export default Settings;
