import { useEffect, useState } from 'react';
import api from '../../services/api';

interface LeaderboardEntry {
  username: string;
  niveau: string;
  moyenne: number;
  total_exercices: number;
  reussis: number;
  position: number;
}

interface UserProfile {
  id: number;
  username: string;
  niveau?: string; // readable school level
  niveau_code?: string;
}

const Leaderboard = () => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('leaderboard/');
        setData(res.data);
      } catch (err) {
        setError('Erreur lors du chargement du leaderboard');
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
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Chargement du leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 mb-2">
          🏆 Classement des élèves
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Voir les meilleures performances de la communauté
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Leaderboard - Top 3 Podium */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 2nd place */}
          {data[1] && (
            <div className="rounded-lg border-2 border-gray-400 bg-white p-6 shadow-lg dark:bg-boxdark text-center transform hover:scale-105 transition">
              <div className="text-5xl mb-2">🥈</div>
              <p className="text-sm font-medium text-gray-600 mb-2">2º Place</p>
              <p className="text-xl font-bold text-black dark:text-white mb-4">
                {data[1].username}
              </p>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-500">{data[1].moyenne}%</div>
                <p className="text-xs text-gray-500">{data[1].total_exercices} exercices</p>
                <p className="text-xs font-semibold text-green-600">{data[1].reussis} réussis</p>
              </div>
            </div>
          )}

          {/* 1st place (Gold) */}
          {data[0] && (
            <div className="rounded-lg border-4 border-yellow-400 bg-gradient-to-b from-yellow-50 to-white p-8 shadow-2xl dark:bg-boxdark text-center transform scale-110 z-10">
              <div className="text-6xl mb-2">👑</div>
              <p className="text-sm font-bold text-yellow-600 mb-2 uppercase">1º PLACE - CHAMPION!</p>
              <p className="text-2xl font-bold text-black dark:text-white mb-4">
                {data[0].username}
              </p>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-yellow-500">{data[0].moyenne}%</div>
                <p className="text-sm text-gray-500">{data[0].total_exercices} exercices</p>
                <p className="text-sm font-semibold text-green-600">{data[0].reussis} réussis</p>
              </div>
            </div>
          )}

          {/* 3rd place */}
          {data[2] && (
            <div className="rounded-lg border-2 border-orange-400 bg-white p-6 shadow-lg dark:bg-boxdark text-center transform hover:scale-105 transition">
              <div className="text-5xl mb-2">🥉</div>
              <p className="text-sm font-medium text-gray-600 mb-2">3º Place</p>
              <p className="text-xl font-bold text-black dark:text-white mb-4">
                {data[2].username}
              </p>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-orange-500">{data[2].moyenne}%</div>
                <p className="text-xs text-gray-500">{data[2].total_exercices} exercices</p>
                <p className="text-xs font-semibold text-green-600">{data[2].reussis} réussis</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
          <h3 className="font-bold text-black dark:text-white">
            Classement complet ({data.length} élèves)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4">
                <th className="px-6 py-4 text-left font-semibold text-black dark:text-white">
                  Position
                </th>
                <th className="px-6 py-4 text-left font-semibold text-black dark:text-white">
                  Élève
                </th>
                <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                  Niveau
                </th>
                <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                  Moyenne
                </th>
                <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                  Exercices
                </th>
                <th className="px-6 py-4 text-center font-semibold text-black dark:text-white">
                  Réussis
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition ${
                    idx === 0 ? 'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20' : ''
                  }`}
                >
                  <td className="px-6 py-5">
                    <span className="text-lg font-bold text-primary">#{entry.position}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-black dark:text-white">
                      {entry.position === 1 ? '👑' : entry.position === 2 ? '🥈' : entry.position === 3 ? '🥉' : '•'} {entry.username}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {(() => {
                      const displayNiveau = profile?.niveau || entry.niveau;
                      const schoolLike = /\d+\w*|ème|e|ère|Tle|1ère|2de/i.test(displayNiveau || '');
                      const badgeClass = schoolLike ? 'bg-gray-100 text-gray-700' : (displayNiveau === 'Débutant' ? 'bg-blue-100 text-blue-700' : (displayNiveau === 'Intermédiaire' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'));
                      return (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                          {displayNiveau}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-bold text-primary">{entry.moyenne}%</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {entry.total_exercices}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-bold text-green-600">
                      {entry.reussis}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Aucun élève n'a complété d'exercices pour le moment
          </p>
        </div>
      )}

      {/* Stats Footer */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-4 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{data.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Élèves classés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {(data.reduce((sum, e) => sum + e.reussis, 0))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total réussis</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {(data.reduce((sum, e) => sum + e.moyenne, 0) / data.length).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Moyenne générale</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
