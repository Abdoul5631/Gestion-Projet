import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchLeconDetail, getErrorMessage, type Lecon } from '../../services/leconsService';
import { ChatIA } from '../../components/Chat/ChatIA';

const LeconDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lecon, setLecon] = useState<Lecon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTuteur, setShowTuteur] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchLeconDetail(Number(id))
      .then(setLecon)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !lecon) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/lecons')} className="text-primary hover:underline">
          ← Retour aux leçons
        </button>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error || 'Leçon introuvable.'}</p>
        </div>
      </div>
    );
  }

  const contenu = lecon.contenu_principal || lecon.contenu_simplifie || lecon.contenu_approfondi || 'Aucun contenu disponible pour cette leçon.';

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/lecons')}
        className="text-primary hover:underline flex items-center gap-1"
      >
        ← Retour aux leçons
      </button>

      <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark overflow-hidden">
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <h1 className="text-2xl font-bold text-black dark:text-white">{lecon.titre}</h1>
          {(lecon.matiere_display || lecon.niveau_display) && (
            <p className="text-sm text-gray-500 mt-1">
              {[lecon.matiere_display, lecon.niveau_display].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="p-6 prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{contenu}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate(`/exercices/${lecon.id}`)}
          className="rounded bg-primary px-6 py-3 text-white font-medium hover:opacity-90"
        >
          Faire les exercices de cette leçon →
        </button>
        <button
          onClick={() => setShowTuteur(!showTuteur)}
          className="rounded bg-emerald-600 px-6 py-3 text-white font-medium hover:opacity-90"
        >
          {showTuteur ? 'Masquer le tuteur IA' : '💬 Poser une question au tuteur IA'}
        </button>
        <button
          onClick={() => navigate('/lecons')}
          className="rounded border border-stroke dark:border-strokedark px-6 py-3 font-medium hover:bg-gray-50 dark:hover:bg-meta-4"
        >
          Retour aux leçons
        </button>
      </div>

      {showTuteur && (
        <div className="mt-8 rounded-lg border border-stroke bg-white dark:bg-boxdark overflow-hidden">
          <div className="p-3 border-b border-stroke dark:border-strokedark bg-emerald-50 dark:bg-emerald-900/20">
            <h2 className="font-semibold text-black dark:text-white">Tuteur IA — Pose ta question sur cette leçon</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">L’IA utilise ta matière, ta leçon et ton niveau pour t’expliquer.</p>
          </div>
          <div className="p-4 min-h-[320px]">
            <ChatIA leconId={lecon.id} matiereId={lecon.matiere} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeconDetail;
