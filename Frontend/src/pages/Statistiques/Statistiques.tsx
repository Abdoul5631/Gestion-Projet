import { useEffect, useState } from 'react';
import api from '../../services/api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  nom?: string;
  prenom?: string;
  niveau?: string; // readable school level or fallback
  niveau_code?: string;
}

interface StatLecon {
  lecon_id: number;
  lecon_titre: string;
  niveau: string;
  exercices_total: number;
  exercices_faits: number;
  moyenne: number;
  reussis: number;
  progression: number;
}

const Statistiques = () => {
  const [stats, setStats] = useState<StatLecon[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('statistiques-lecons/');
        setStats(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des statistiques');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await api.get('me/');
        setProfile(res.data);
      } catch (err) {
        console.error('Erreur fetch profile', err);
      }
    };

    fetchProfile();
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
          📊 Mes Statistiques
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Suivi détaillé de votre progression par leçon
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Global Stats Summary */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Leçons complétées
            </h4>
            <p className="text-3xl font-bold text-primary">
              {stats.filter(s => s.exercices_faits > 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              sur {stats.length}
            </p>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Moyenne générale
            </h4>
            <p className="text-3xl font-bold text-blue-600">
              {stats.length > 0
                ? (
                    stats.reduce((sum, s) => sum + s.moyenne, 0) / stats.length
                  ).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 mt-1">
              sur tous exercices
            </p>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Total réussis
            </h4>
            <p className="text-3xl font-bold text-green-600">
              {stats.reduce((sum, s) => sum + s.reussis, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              exercices à 100%
            </p>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Progression
            </h4>
            <p className="text-3xl font-bold text-purple-600">
              {stats.length > 0
                ? (
                    stats.reduce((sum, s) => sum + s.progression, 0) / stats.length
                  ).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 mt-1">
              en moyenne
            </p>
          </div>
        </div>
      )}

      {/* Detailed Stats Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
          <h3 className="font-bold text-black dark:text-white">
            Statistiques par leçon
          </h3>
        </div>

        <div className="overflow-x-auto">
          {stats.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4">
                  <th className="px-6 py-4 text-left font-semibold text-black dark:text-white">
                    Leçon
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                    Niveau
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                    Exercices
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                    Moyenne
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                    Réussis
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                    Progression
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => {
                  const badgeClass = stat.niveau === 'Débutant' ? 'bg-blue-100 text-blue-700' :
                    stat.niveau === 'Intermédiaire' ? 'bg-yellow-100 text-yellow-700' :
                    stat.niveau === 'Avancé' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700';

                  return (
                    <tr
                      key={stat.lecon_id}
                      className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition"
                    >
                    <td className="px-6 py-5">
                      <p className="font-semibold text-black dark:text-white">
                        {stat.lecon_titre}
                      </p>
                    </td>
                      <td className="px-6 py-5 text-center">
                        {
                          // prefer user's school-level if available, otherwise use lesson level
                        }
                        {(() => {
                          const displayNiveau = profile?.niveau || stat.niveau;
                          // if displayNiveau looks like a school grade (contains digits or 'e'/'ère' etc.)
                          const schoolLike = /\d+\w*|ème|e|ère|Tle|1ère|2de/i.test(displayNiveau || '');
                          const finalBadgeClass = schoolLike ? 'bg-gray-100 text-gray-700' : badgeClass;
                          return (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${finalBadgeClass}`}>
                              {displayNiveau}
                            </span>
                          );
                        })()}
                      </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {stat.exercices_faits}/{stat.exercices_total}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-sm font-bold ${
                        stat.moyenne >= 80 ? 'text-green-600' :
                        stat.moyenne >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {stat.moyenne.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-semibold text-green-600">
                        {stat.reussis}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="w-16 mx-auto">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-meta-4 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-blue-600 transition-all"
                              style={{ width: `${stat.progression}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8 text-right">
                            {stat.progression.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Aucun exercice complété pour le moment
            </div>
          )}
        </div>
      </div>

      {/* Tips / Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-sm border border-stroke bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-default dark:border-strokedark dark:from-blue-900 dark:to-indigo-900 dark:bg-opacity-20">
          <h4 className="mb-4 font-semibold text-black dark:text-white">
            💡 Recommandations
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {stats.some(s => s.moyenne < 60) && (
              <li>📚 Concentrez-vous sur les leçons où vous avez moins de 60%</li>
            )}
            {stats.some(s => s.exercices_faits === 0) && (
              <li>🎯 Il y a des leçons non commencées, commencez par celles-ci</li>
            )}
            {stats.every(s => s.progression > 80) && (
              <li>🏆 Excellent travail! Vous maîtrisez la majorité des leçons!</li>
            )}
            <li>✨ Révisez régulièrement pour consolider vos apprentissages</li>
          </ul>
        </div>

        <div className="rounded-sm border border-stroke bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-default dark:border-strokedark dark:from-green-900 dark:to-emerald-900 dark:bg-opacity-20">
          <h4 className="mb-4 font-semibold text-black dark:text-white">
            🎓 Prochaines étapes
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>1️⃣ Terminez toutes les leçons Débutant</li>
            <li>2️⃣ Progressez vers le niveau Intermédiaire</li>
            <li>3️⃣ Visez 100% sur chaque leçon</li>
            <li>4️⃣ Accédez au niveau Avancé pour les défis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;
