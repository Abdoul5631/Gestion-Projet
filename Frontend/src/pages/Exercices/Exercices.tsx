import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ChatIA } from '../../components/Chat/ChatIA';

interface Exercice {
  id: number;
  question: string;
  reponse?: string;
  reponse_correcte?: string;
  niveau: string;
  lecon: number;
  matiere?: number;
}

interface Resultat {
  score: number;
  feedback: string;
}

const Exercices = () => {
  const { leconId } = useParams();
  const navigate = useNavigate();
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reponses, setReponses] = useState<{ [key: number]: string }>({});
  const [resultats, setResultats] = useState<{ [key: number]: Resultat }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showTuteur, setShowTuteur] = useState(false);

  useEffect(() => {
    const fetchExercices = async () => {
      try {
        const res = await api.get(`lecons/${leconId}/exercices/`);
        setExercices(res.data);
      } catch (err) {
        setMessage('Erreur lors du chargement des exercices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (leconId) {
      fetchExercices();
    }
  }, [leconId]);

  const soumettre = async () => {
    if (!exercices[currentIndex]) return;

    const currentExercice = exercices[currentIndex];
    const answer = reponses[currentExercice.id]?.trim();

    if (!answer) {
      setMessage('Veuillez entrer une réponse');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('exercices/soumettre/', {
        exercice_id: currentExercice.id,
        reponse: answer,
      });

      setResultats(prev => ({
        ...prev,
        [currentExercice.id]: res.data
      }));

      setMessage('');
      
      // Passer à l'exercice suivant
      if (currentIndex < exercices.length - 1) {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 1500);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la soumission';
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoumettreFinal = () => {
    setShowResults(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Chargement des exercices...</p>
      </div>
    );
  }

  if (exercices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Aucun exercice disponible pour cette leçon</p>
        <button
          onClick={() => navigate('/lecons')}
          className="mt-4 rounded bg-primary px-6 py-2 text-white"
        >
          Retour aux leçons
        </button>
      </div>
    );
  }

  const currentExercice = exercices[currentIndex];
  const completedCount = Object.keys(resultats).length;
  const scoreTotal = Object.values(resultats).reduce((sum, r) => sum + r.score, 0);
  const averageScore = completedCount > 0 ? Math.round(scoreTotal / completedCount) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h1 className="text-3xl font-bold text-black dark:text-white">📝 Exercices de la leçon</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTuteur(!showTuteur)}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:opacity-90"
            >
              {showTuteur ? 'Masquer le tuteur' : '💬 Tuteur IA'}
            </button>
            <button
              onClick={() => navigate('/lecons')}
              className="rounded bg-gray-200 dark:bg-meta-4 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-300"
            >
              ← Retour
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Exercice {currentIndex + 1} sur {exercices.length}
        </p>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / exercices.length) * 100}%` }}
        />
      </div>

      {/* Exercice courant */}
      <div className="rounded-sm border border-stroke bg-white p-8 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Question {currentIndex + 1}
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {currentExercice.question}
          </p>
        </div>

        {/* Zone de réponse */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Votre réponse
          </label>
          <textarea
            className="w-full rounded border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Entrez votre réponse ici..."
            value={reponses[currentExercice.id] || ''}
            onChange={(e) =>
              setReponses({ ...reponses, [currentExercice.id]: e.target.value })
            }
            rows={4}
            disabled={!!(submitting || resultats[currentExercice.id])}
          />
        </div>

        {/* Message d'erreur ou feedback */}
        {message && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded">
            {message}
          </div>
        )}

        {/* Résultat */}
        {resultats[currentExercice.id] && (
          <div className={`mb-6 p-4 rounded ${
            resultats[currentExercice.id].score === 100
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <p className="font-semibold mb-2">
              {resultats[currentExercice.id].score === 100 ? '✅ Correct!' : '❌ Incorrect'}
            </p>
            <p className="text-sm whitespace-pre-line">
              {resultats[currentExercice.id].feedback}
            </p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              }
            }}
            disabled={currentIndex === 0 || submitting}
            className="rounded bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            ← Précédent
          </button>

          <button
            onClick={soumettre}
            disabled={!!(submitting || !reponses[currentExercice.id] || resultats[currentExercice.id])}
            className="rounded bg-primary px-6 py-2 text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Soumission...' : 'Soumettre'}
          </button>

          <button
            onClick={() => {
              if (currentIndex < exercices.length - 1) {
                setCurrentIndex(currentIndex + 1);
              } else {
                handleSoumettreFinal();
              }
            }}
            disabled={!!(submitting || !resultats[currentExercice.id])}
            className="rounded bg-blue-600 px-6 py-2 text-white hover:opacity-90 disabled:opacity-50"
          >
            {currentIndex === exercices.length - 1 ? 'Terminer' : 'Suivant →'}
          </button>
        </div>
      </div>

      {/* Tuteur IA : poser une question pendant les exercices */}
      {showTuteur && leconId && (
        <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark overflow-hidden">
          <div className="p-3 border-b border-stroke dark:border-strokedark bg-emerald-50 dark:bg-emerald-900/20">
            <h2 className="font-semibold text-black dark:text-white">Tuteur IA — Besoin d’aide ?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pose ta question sur l’exercice ou demande une explication. L’IA connaît ta leçon et ton niveau.</p>
          </div>
          <div className="p-4 min-h-[280px]">
            <ChatIA leconId={Number(leconId)} matiereId={exercices[0]?.matiere} />
          </div>
        </div>
      )}

      {/* Résumé des résultats */}
      {showResults && (
        <div className="rounded-sm border border-stroke bg-white p-8 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">📊 Résumé des résultats</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-100 dark:bg-meta-4 rounded">
              <p className="text-3xl font-bold text-primary">{completedCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Exercices complétés</p>
            </div>
            <div className="text-center p-4 bg-gray-100 dark:bg-meta-4 rounded">
              <p className="text-3xl font-bold text-primary">{averageScore}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Moyenne</p>
            </div>
            <div className="text-center p-4 bg-gray-100 dark:bg-meta-4 rounded">
              <p className="text-3xl font-bold text-primary">
                {Object.values(resultats).filter(r => r.score === 100).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Réussites</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/lecons')}
            className="w-full rounded bg-primary px-6 py-3 text-white font-medium hover:opacity-90"
          >
            Retour aux leçons
          </button>
        </div>
      )}
    </div>
  );
};

export default Exercices;
