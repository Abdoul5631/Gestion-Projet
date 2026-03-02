import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SignUpModal from './SignUpModal';
import ForgotPasswordModal from './ForgotPasswordModal';

const SignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        username: username.trim(),
        password: password,
      };
      const res = await api.post('auth/login/', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.data?.access || !res.data?.refresh) {
        setError('Réponse du serveur invalide (tokens manquants).');
        return;
      }
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.');
      } else {
        const data = err.response?.data;
        const msg =
          typeof data?.detail === 'string'
            ? data.detail
            : data?.detail?.[0]?.msg || data?.error || data?.message;
        setError(
          msg
            ? String(msg)
            : 'Identifiants incorrects. Vérifiez le nom d\'utilisateur (sensible à la casse) et le mot de passe.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-600 flex-col justify-center items-center p-12 text-white">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">🎓 Tuteur Intelligent</h1>
          <p className="text-xl mb-8 opacity-90">Bienvenue dans votre plateforme d'apprentissage personnalisée</p>
          
          <div className="space-y-6 text-left max-w-md">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">📚</span>
              <div>
                <h3 className="font-semibold text-lg">Leçons adaptées</h3>
                <p className="text-sm opacity-80">Contenus adaptés à votre niveau</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-3xl">🚀</span>
              <div>
                <h3 className="font-semibold text-lg">Progression rapide</h3>
                <p className="text-sm opacity-80">Suivez vos progrès en temps réel</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="font-semibold text-lg">Compétition</h3>
                <p className="text-sm opacity-80">Rejoignez le leaderboard global</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Header Mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">🎓 Tuteur Intelligent</h1>
            <p className="text-gray-600">Plateforme d'apprentissage intelligent</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Connexion</h2>
            <p className="text-center text-gray-600 mb-6">Accédez à votre compte étudiant</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm space-y-1">
                <p>{error}</p>
                {error.includes('Mot de passe incorrect') && (
                  <p className="text-xs mt-2">
                    Astuce : utilisez le lien « Mot de passe oublié » ci-dessous pour en définir un nouveau.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="alice"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? '⏳ Connexion...' : '🔓 Se connecter'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center text-sm text-primary hover:text-blue-600 transition"
              >
                🔑 Mot de passe oublié?
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSignUp(true)}
                className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                ✍️ Créer un compte
              </button>
            </div>
          </div>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">📝 Compte de test:</span> alice / 123456
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSuccess={() => {
            setShowSignUp(false);
            setError('');
            alert('✅ Compte créé avec succès! Veuillez vous connecter.');
          }}
        />
      )}

      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </div>
  );
};

export default SignIn;
