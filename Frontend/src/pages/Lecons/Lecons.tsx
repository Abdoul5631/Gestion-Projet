import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMatieresMonNiveau, type Matiere } from '../../services/matieresService';
import { fetchLecons, getErrorMessage, type Lecon } from '../../services/leconsService';

const Lecons = () => {
  const navigate = useNavigate();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [matiereSelectionnee, setMatiereSelectionnee] = useState<Matiere | null>(null);
  const [lecons, setLecons] = useState<Lecon[]>([]);
  const [loadingMatieres, setLoadingMatieres] = useState(true);
  const [loadingLecons, setLoadingLecons] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatieres = useCallback(async () => {
    setLoadingMatieres(true);
    setError(null);
    try {
      const data = await fetchMatieresMonNiveau();
      setMatieres(data);
      setMatiereSelectionnee(null);
      setLecons([]);
    } catch (err) {
      setError(getErrorMessage(err));
      setMatieres([]);
    } finally {
      setLoadingMatieres(false);
    }
  }, []);

  useEffect(() => {
    loadMatieres();
  }, [loadMatieres]);

  useEffect(() => {
    if (!matiereSelectionnee) {
      setLecons([]);
      return;
    }
    setLoadingLecons(true);
    setError(null);
    fetchLecons(matiereSelectionnee.id)
      .then(setLecons)
      .catch((err) => {
        setError(getErrorMessage(err));
        setLecons([]);
      })
      .finally(() => setLoadingLecons(false));
  }, [matiereSelectionnee]);

  const handleLireLecon = (leconId: number) => {
    navigate(`/lecons/${leconId}`);
  };

  const handleExercices = (leconId: number) => {
    navigate(`/exercices/${leconId}`);
  };

  if (loadingMatieres) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des matières...</p>
        </div>
      </div>
    );
  }

  if (error && matieres.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">📚 Mes leçons</h1>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          <button onClick={loadMatieres} className="mt-4 rounded bg-primary px-4 py-2 text-white text-sm hover:opacity-90">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">📚 Mes leçons</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Les matières et leçons sont adaptées à votre niveau (saisi à l'inscription). Choisissez une matière puis une leçon.
        </p>
      </div>

      {matieres.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-stroke bg-white dark:bg-boxdark p-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Les matières de votre niveau seront bientôt disponibles. En attendant, vous pouvez consulter le tableau de bord.
          </p>
          <button onClick={() => navigate('/')} className="rounded bg-primary px-6 py-2 text-white hover:opacity-90">
            Retour au tableau de bord
          </button>
        </div>
      ) : (
        <>
          {/* Matières du niveau — cliquables */}
          <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Matières</h2>
            <div className="flex flex-wrap gap-3">
              {matieres.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMatiereSelectionnee(m)}
                  className={`px-5 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                    matiereSelectionnee?.id === m.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-meta-4 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-meta-4/80'
                  }`}
                >
                  <span>{m.icone || '📚'}</span>
                  {m.nom_display || m.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Leçons de la matière sélectionnée */}
          {matiereSelectionnee && (
            <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                Leçons — {matiereSelectionnee.nom_display || matiereSelectionnee.nom}
              </h2>
              {loadingLecons ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
              ) : error ? (
                <p className="text-red-600 dark:text-red-400">{error}</p>
              ) : lecons.length === 0 ? (
                <p className="text-gray-500">Aucune leçon pour cette matière à votre niveau.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lecons.map((lecon) => (
                    <div
                      key={lecon.id}
                      className="border border-stroke dark:border-strokedark rounded-lg p-4 flex flex-col gap-3"
                    >
                      <h3 className="font-semibold text-black dark:text-white">{lecon.titre}</h3>
                      <p className="text-sm text-gray-500">
                        {lecon.exercices?.length ?? 0} exercice(s)
                      </p>
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => handleLireLecon(lecon.id)}
                          className="flex-1 rounded bg-gray-200 dark:bg-meta-4 text-gray-800 dark:text-gray-200 py-2 text-sm font-medium hover:opacity-90"
                        >
                          Lire la leçon
                        </button>
                        <button
                          onClick={() => handleExercices(lecon.id)}
                          className="flex-1 rounded bg-primary py-2 text-white text-sm font-medium hover:opacity-90"
                        >
                          Faire les exercices
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Lecons;
