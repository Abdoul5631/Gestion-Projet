import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import CardDataStats from '../../components/CardDataStats';

interface UserProfile {
  username: string;
  email: string;
  niveau: string;
}

interface ProgressData {
  niveau: string;
  moyenne: number;
  total_exercices: number;
}

interface Exercice {
  id: number;
  question: string;
  lecon: number;
}

const TuteurDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progression, setProgression] = useState<ProgressData | null>(null);
  const [recommandations, setRecommandations] = useState<Exercice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le profil utilisateur
        const profileRes = await api.get('me/');
        setProfile(profileRes.data);

        // Récupérer la progression
        const progressionRes = await api.get('progression/');
        setProgression(progressionRes.data);

        // Récupérer les recommandations
        const recommandationsRes = await api.get('exercices/recommandations/');
        setRecommandations(recommandationsRes.data);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const progressPercentage = progression?.moyenne ?? 0;

  return (
    <>
      {/* Welcome Banner */}
      <div className="mb-8 rounded-sm border border-stroke bg-gradient-to-r from-primary to-blue-600 p-8 text-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              👋 Bienvenue, {profile?.username}! 
            </h2>
            <p className="text-blue-100">
              Continuez votre apprentissage et progressez! 🚀
            </p>
          </div>
          <div className="text-6xl">📚</div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4.5 mb-6">
        <CardDataStats 
          title="Exercices complétés" 
          total={progression?.total_exercices ?? 0} 
          rate="+" 
          levelUp 
        />
        <CardDataStats 
          title="Moyenne générale" 
          total={Math.round(progression?.moyenne ?? 0)} 
          rate="%" 
          levelUp 
        />
        <CardDataStats 
          title="Niveau actuel" 
          total={profile?.niveau ?? 'N/A'} 
          rate="" 
        />
        <CardDataStats 
          title="Progression" 
          total={progressPercentage > 75 ? '✅ Excellent' : progressPercentage > 50 ? '⚡ Bon' : '📈 Débute'} 
          rate="" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Progression du niveau */}
        <div className="lg:col-span-2 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-6 text-xl font-semibold text-black dark:text-white">
            📊 Progression du niveau
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Niveau actuel: <span className="font-bold text-primary">{profile?.niveau}</span>
          </p>
          <ProgressBar value={progressPercentage} />
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-meta-4 rounded">
              <p className="text-2xl font-bold text-primary">{progression?.total_exercices ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Exercices</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-meta-4 rounded">
              <p className="text-2xl font-bold text-green-600">{Math.round(progressPercentage)}%</p>
              <p className="text-xs text-gray-500 mt-1">Moyenne</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-meta-4 rounded">
              <p className="text-2xl font-bold text-blue-600">
                {progressPercentage > 75 ? '🏆' : progressPercentage > 50 ? '⭐' : '🌱'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Statut</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
            ⚡ Actions rapides
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/lecons')}
              className="w-full rounded bg-primary px-4 py-3 text-white text-sm font-medium hover:opacity-90 transition"
            >
              📚 Commencer une leçon
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full rounded bg-blue-500 px-4 py-3 text-white text-sm font-medium hover:opacity-90 transition"
            >
              🏆 Voir le classement
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full rounded bg-gray-200 px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-300 transition dark:bg-meta-4 dark:text-white"
            >
              👤 Mon profil
            </button>
          </div>
        </div>
      </div>

      {/* Exercices recommandés */}
      <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            💡 Exercices recommandés
          </h3>
          <button
            onClick={() => navigate('/lecons')}
            className="text-primary text-sm font-medium hover:underline"
          >
            Voir tous →
          </button>
        </div>

        {recommandations.length > 0 ? (
          <div className="space-y-3">
            {recommandations.slice(0, 5).map((ex, idx) => (
              <div
                key={ex.id}
                className="flex items-start gap-4 p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-meta-4 rounded border border-blue-100 dark:border-blue-800"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white line-clamp-2">
                    {ex.question}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Leçon #{ex.lecon}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/exercices/${ex.lecon}`)}
                  className="flex-shrink-0 rounded bg-primary px-3 py-1 text-xs text-white hover:opacity-90"
                >
                  Faire
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucun exercice recommandé pour le moment
          </p>
        )}
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-sm border border-stroke bg-gradient-to-br from-green-50 to-blue-50 p-6 shadow-default dark:border-strokedark dark:from-green-900 dark:to-blue-900 dark:bg-opacity-20">
          <h4 className="mb-3 font-semibold text-black dark:text-white">
            💚 Conseils pour réussir
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>✓ Pratiquez régulièrement chaque jour</li>
            <li>✓ Relisez les leçons avant de faire les exercices</li>
            <li>✓ Essayez de viser 100% de réussite</li>
            <li>✓ Progressez à votre rythme</li>
          </ul>
        </div>

        <div className="rounded-sm border border-stroke bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-default dark:border-strokedark dark:from-purple-900 dark:to-pink-900 dark:bg-opacity-20">
          <h4 className="mb-3 font-semibold text-black dark:text-white">
            🎯 Objectifs hebdomadaires
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>📊 Faire au moins 5 exercices</li>
            <li>⭐ Viser une moyenne de 80%+</li>
            <li>🏆 Grimper dans le classement</li>
            <li>🎓 Débloquer le niveau suivant</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default TuteurDashboard;


