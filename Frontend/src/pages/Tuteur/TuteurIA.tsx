import { useState, useEffect } from 'react';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumb';
import PageTitle from '../../components/PageTitle';
import { ChatIA } from '../../components/Chat/ChatIA';
import { useAuth } from '../../context/AuthContext';
import { fetchMatieresMonNiveau, type Matiere } from '../../services/matieresService';

interface DiagnosticInfo {
  score_moyen: number;
  total_exercices: number;
  progression: string;
  domaines_forts: string[];
  domaines_faibles: string[];
  niveau_actuel: string;
}

export default function TuteurIA() {
  const { token } = useAuth();
  const [matiereSelectionnee, setMatiereSelectionnee] = useState<number | null>(null);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [exercicesGeneres, setExercicesGeneres] = useState<any[]>([]);
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);
  const [loadingDiag, setLoadingDiag] = useState(true);

  useEffect(() => {
    loadDiagnostic();
    loadMatieres();
  }, [token]);

  const loadDiagnostic = async () => {
    try {
      const response = await fetch('/api/ia/diagnostic/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDiagnostic(data);
      }
    } catch (error) {
      console.error('Erreur diagnostic:', error);
    } finally {
      setLoadingDiag(false);
    }
  };

  const loadMatieres = async () => {
    try {
      const data = await fetchMatieresMonNiveau();
      setMatieres(data);
      if (data.length > 0) {
        setMatiereSelectionnee(data[0].id);
      }
    } catch (error) {
      console.error('Erreur matières:', error);
      setMatieres([]);
    }
  };

  return (
    <>
      <Breadcrumbs pageName="Tuteur IA" />
      <PageTitle breadcrumbs="Tuteur IA" title="Ton Tuteur Intelligent IA 🤖" subtitle="Apprends avec un tuteur personnalisé disponible 24/7" />

      <div className="grid grid-cols-1 gap-9 sm:grid-cols-3">
        {/* Colonne gauche - Diagnostic */}
        <div className="flex flex-col gap-9 sm:col-span-1">
          {/* Carte Diagnostic */}
          {!loadingDiag && diagnostic && (
            <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
                Ton Diagnostic
              </h4>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Score Moyen</span>
                  <span className="text-lg font-bold text-blue-600">
                    {diagnostic.score_moyen.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${diagnostic.score_moyen}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Exercices complétés:</span>
                  <span className="font-semibold float-right">
                    {diagnostic.total_exercices}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Progression:</span>
                  <span className="font-semibold float-right capitalize">
                    {diagnostic.progression}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Niveau:</span>
                  <span className="font-semibold float-right capitalize">
                    {diagnostic.niveau_actuel}
                  </span>
                </div>
              </div>

              {diagnostic.domaines_forts.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">💪 Points Forts</p>
                  <div className="flex flex-wrap gap-2">
                    {diagnostic.domaines_forts.slice(0, 3).map((domaine, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {domaine}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {diagnostic.domaines_faibles.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">📚 À Améliorer</p>
                  <div className="flex flex-wrap gap-2">
                    {diagnostic.domaines_faibles.slice(0, 3).map((domaine, idx) => (
                      <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {domaine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sélection Matière */}
          <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
              Matière
            </h4>
            {matieres.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune matière chargée pour le moment. Vous pouvez quand même discuter avec le tuteur à droite.
              </p>
            ) : (
              <div className="space-y-2">
                {matieres.map((matiere) => (
                  <button
                    key={matiere.id}
                    onClick={() => setMatiereSelectionnee(matiere.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      matiereSelectionnee === matiere.id
                        ? 'bg-blue-500 text-white font-semibold'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-meta-4 dark:hover:bg-meta-4/80'
                    }`}
                  >
                    <span className="mr-2">{matiere.icone || '📚'}</span>
                    {matiere.nom_display || matiere.nom}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exercices Générés */}
          {exercicesGeneres.length > 0 && (
            <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
                Exercices Générés ✨
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {exercicesGeneres.map((exercice, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition"
                  >
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {exercice.question}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Difficulté: {exercice.difficulte}/10 | {exercice.points} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite - Chat IA */}
        <div className="sm:col-span-2">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <ChatIA
              matiereId={matiereSelectionnee || undefined}
              onExerciceGenerated={setExercicesGeneres}
            />
          </div>
        </div>
      </div>

      {/* Section Conseils */}
      <div className="mt-9 rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
          💡 Comment Utiliser le Tuteur IA
        </h4>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <h5 className="font-semibold text-blue-900 mb-2">1️⃣ Pose des Questions</h5>
            <p className="text-sm text-blue-800">
              Demande-moi d'expliquer un concept ou une leçon. Je m'adapterai à ton niveau.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <h5 className="font-semibold text-green-900 mb-2">2️⃣ Génère Exercices</h5>
            <p className="text-sm text-green-800">
              Clique sur "Générer des exercices" pour créer des exercices adaptés.
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <h5 className="font-semibold text-purple-900 mb-2">3️⃣ Obtiens du Feedback</h5>
            <p className="text-sm text-purple-800">
              Envoie tes réponses et je te fournirai un feedback détaillé et encourageant.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
