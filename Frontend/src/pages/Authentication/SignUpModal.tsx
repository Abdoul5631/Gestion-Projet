import { useState, useEffect } from 'react';
import api from '../../services/api';
import { type NiveauScolaire } from '../../services/niveauxService';

interface SignUpModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SignUpModal = ({ onClose, onSuccess }: SignUpModalProps) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    prenom: '',
    nom: '',
    date_naissance: '',
    niveau: 'débutant',
    niveau_scolaire: '',
    parent_email: '',
    telephone: '',
    password: '',
    password_confirm: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Levels hardcoded (CP1 → Terminale)
  const niveauxScolaires: NiveauScolaire[] = [
    { id: 1, code: 'cp1', libelle: 'CP1', ordre: 1, cycle: 'primaire' },
    { id: 2, code: 'cp2', libelle: 'CP2', ordre: 2, cycle: 'primaire' },
    { id: 3, code: 'ce1', libelle: 'CE1', ordre: 3, cycle: 'primaire' },
    { id: 4, code: 'ce2', libelle: 'CE2', ordre: 4, cycle: 'primaire' },
    { id: 5, code: 'cm1', libelle: 'CM1', ordre: 5, cycle: 'primaire' },
    { id: 6, code: 'cm2', libelle: 'CM2', ordre: 6, cycle: 'primaire' },
    { id: 7, code: '6eme', libelle: '6ème', ordre: 7, cycle: 'college' },
    { id: 8, code: '5eme', libelle: '5ème', ordre: 8, cycle: 'college' },
    { id: 9, code: '4eme', libelle: '4ème', ordre: 9, cycle: 'college' },
    { id: 10, code: '3eme', libelle: '3ème', ordre: 10, cycle: 'college' },
    { id: 11, code: 'seconde', libelle: 'Seconde', ordre: 11, cycle: 'lycee' },
    { id: 12, code: '1ere', libelle: '1ère', ordre: 12, cycle: 'lycee' },
    { id: 13, code: 'terminale', libelle: 'Terminale', ordre: 13, cycle: 'lycee' },
  ];

  // Set default niveau_scolaire on mount
  useEffect(() => {
    if (formData.niveau_scolaire === '') {
      setFormData(prev => ({ ...prev, niveau_scolaire: niveauxScolaires[0].code }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur de ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) newErrors.username = 'Le nom d\'utilisateur est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est requise';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    if (formData.password.length < 6) newErrors.password = 'Le mot de passe doit avoir au moins 6 caractères';
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('auth/register/', {
        username: formData.username,
        email: formData.email,
        prenom: formData.prenom,
        nom: formData.nom,
        date_naissance: formData.date_naissance,
        niveau: formData.niveau,
        niveau_scolaire: formData.niveau_scolaire,
        parent_email: formData.parent_email || null,
        telephone: formData.telephone || null,
        password: formData.password,
        password_confirm: formData.password_confirm,
      });

      if (response.status === 201) {
        setSuccess('✅ Compte créé avec succès!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Une erreur est survenue';
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">✍️ Créer un compte</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-80 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Section: Identifiants */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-3">📱 Identifiants</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="alice"
                  disabled={loading}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="alice@example.com"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Informations personnelles */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-3">👤 Informations personnelles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.prenom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Alice"
                  disabled={loading}
                />
                {errors.prenom && (
                  <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Dupont"
                  disabled={loading}
                />
                {errors.nom && (
                  <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.date_naissance ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.date_naissance && (
                  <p className="text-red-500 text-xs mt-1">{errors.date_naissance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau scolaire (CP1 → Terminale) *
                </label>
                <select
                  name="niveau_scolaire"
                  value={formData.niveau_scolaire}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="">Choisissez votre niveau</option>
                  {niveauxScolaires.map(n => (
                    <option key={n.code} value={n.code}>{n.libelle}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Informations additionnelles */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-3">📞 Informations additionnelles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email parent (optionnel)
                </label>
                <input
                  type="email"
                  name="parent_email"
                  value={formData.parent_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="parent@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+33 6 12 34 56 78"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Section: Mot de passe */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-3">🔒 Mot de passe</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••"
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer mot de passe *
                </label>
                <input
                  type="password"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.password_confirm ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••"
                  disabled={loading}
                />
                {errors.password_confirm && (
                  <p className="text-red-500 text-xs mt-1">{errors.password_confirm}</p>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '⏳ Création...' : '✅ Créer le compte'}
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center">
            * Champs obligatoires
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpModal;
