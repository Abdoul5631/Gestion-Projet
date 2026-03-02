import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { fetchNiveaux, type NiveauScolaire } from '../../services/niveauxService';

const SignUp = () => {
  const navigate = useNavigate();
  const [niveaux, setNiveaux] = useState<NiveauScolaire[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    niveau_scolaire: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingNiveaux, setLoadingNiveaux] = useState(true);

  useEffect(() => {
    fetchNiveaux()
      .then(setNiveaux)
      .catch(() => setNiveaux([]))
      .finally(() => setLoadingNiveaux(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.niveau_scolaire) {
      setError('Choisissez votre niveau scolaire (CP1 à Terminale). Ce choix ne sera plus demandé.');
      return;
    }
    setLoading(true);
    try {
      await api.post('auth/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        niveau_scolaire: formData.niveau_scolaire,
      });
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/auth/signin');
    } catch (err: any) {
      let errorMsg = 'Erreur lors de l\'inscription.';
      if (!err.response) {
        errorMsg = 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
      } else if (err.response.data) {
        const d = err.response.data;
        errorMsg = typeof d.error === 'string' ? d.error : (d.detail || JSON.stringify(d));
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="mb-6 text-3xl font-bold text-center text-gray-800">
          Inscription élève
        </h1>
        <p className="text-center text-sm text-gray-600 mb-4">
          Votre niveau scolaire (CP1 → Terminale) est demandé une seule fois et ne sera plus modifiable.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              name="username"
              placeholder="Choisissez un nom d'utilisateur"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="Au moins 8 caractères"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmez le mot de passe</label>
            <input
              type="password"
              name="password_confirm"
              placeholder="Confirmez votre mot de passe"
              value={formData.password_confirm}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau scolaire <span className="text-red-500">*</span>
            </label>
            <select
              name="niveau_scolaire"
              value={formData.niveau_scolaire}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={loadingNiveaux}
            >
              <option value="">Choisissez votre niveau (CP1 → Terminale)</option>
              {niveaux.map((n) => (
                <option key={n.id} value={n.code}>{n.libelle}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-3 text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <Link to="/auth/signin" className="text-primary font-medium hover:underline">
            Connectez-vous ici
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
