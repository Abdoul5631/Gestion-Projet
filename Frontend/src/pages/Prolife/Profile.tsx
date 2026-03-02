import { useEffect, useState } from 'react';
import api from '../../services/api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  niveau: string;
  niveau_scolaire: string;
  date_naissance: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/me/');
      setProfile(response.data);
      setFormData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement du profil');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      // Ne pas modifier le niveau scolaire
      const { niveau_scolaire, niveau, id, username, ...updateData } = formData;
      
      const response = await api.put('/me/update/', updateData);
      setProfile(response.data);
      setIsEditing(false);
      setSuccessMessage('Profil mise à jour avec succès! 🎉');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
      console.error('Error updating profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">👤 Profil</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Impossible de charger le profil
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">👤 Profil</h1>

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
        Informations personnelles de l'utilisateur.
      </p>

      {/* Infos utilisateur */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Informations générales</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
            >
              Éditer
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-2">Nom</label>
              <input
                type="text"
                value={formData.nom || ''}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-2">Prénom</label>
              <input
                type="text"
                value={formData.prenom || ''}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-2">Date de naissance</label>
              <input
                type="date"
                value={formData.date_naissance || ''}
                onChange={(e) => handleInputChange('date_naissance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(profile);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="font-medium">{profile.nom || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Prénom</p>
              <p className="font-medium">{profile.prenom || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Nom d'utilisateur</p>
              <p className="font-medium">{profile.username}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Niveau scolaire</p>
              <p className="font-medium">{profile.niveau_scolaire || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Niveau global</p>
              <p className="font-medium">{profile.niveau || '-'}</p>
            </div>

            {profile.date_naissance && (
              <div>
                <p className="text-sm text-gray-500">Date de naissance</p>
                <p className="font-medium">{new Date(profile.date_naissance).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progression */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Progression</h2>

        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-500">Leçons complétées</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-[60%]" />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Exercices réussis</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-[45%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
