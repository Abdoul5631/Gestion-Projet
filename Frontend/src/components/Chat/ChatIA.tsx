import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  type?: 'question' | 'explication' | 'exercice' | 'feedback';
  exercises?: Array<{question: string; type: string}>;
}

export interface ChatProps {
  matiereId?: number;
  leconId?: number;
  onExerciceGenerated?: (exercices: any[]) => void;
}

export const ChatIA: React.FC<ChatProps> = ({ matiereId, leconId, onExerciceGenerated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading || !token) return;

    // Sauvegarder le message avant de le vider
    const messageText = inputValue;

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/ia/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          matiere_id: matiereId,
          lecon_id: leconId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: data.id,
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
          type: data.type,
          exercises: data.exercises || []
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Erreur: ${errorData.error || 'Une erreur s\'est produite'}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Erreur chat:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Erreur de connexion avec le serveur',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateExercises = async () => {
    if (!token || !matiereId) return;

    try {
      setLoading(true);
      const response = await fetch('/api/ia/generer-exercices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: 3,
          matiere_id: matiereId,
          topics: [],
          difficulte: 'adapte',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (onExerciceGenerated) {
          onExerciceGenerated(data.exercices);
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `✅ J'ai généré ${data.nombre_genere} exercices pour toi!`,
            timestamp: new Date().toISOString(),
            type: 'exercice',
          },
        ]);
      }
    } catch (error) {
      console.error('Erreur génération:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">🤖 Tuteur IA</h2>
        <p className="text-sm opacity-90">Je suis là pour t'aider à apprendre</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="mb-4">👋 Salut! Je suis ton tuteur IA</p>
            <p>Pose-moi une question ou demande de l'aide</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="break-words">{message.content}</p>
                {message.timestamp && (
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
            
            {/* Afficher les exercices si disponibles */}
            {message.role === 'assistant' && message.exercises && message.exercises.length > 0 && (
              <div className="mt-4 ml-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="font-semibold text-sm text-gray-800 mb-3">💡 Exercices proposés :</p>
                <div className="space-y-3">
                  {message.exercises.map((exercise, exIdx) => (
                    <div key={exIdx} className="p-3 bg-white rounded border border-blue-200">
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>📝 {exIdx + 1}.</strong> {exercise.question}
                      </p>
                      <p className="text-xs text-gray-500">Type: {exercise.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Actions rapides */}
      {messages.length < 3 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={generateExercises}
            disabled={loading || !matiereId}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 rounded-lg mb-2 transition"
          >
            ✨ Générer des exercices
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
        {!matiereId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            💡 Sans matière sélectionnée, le tuteur répond en mode général. Choisissez une matière à gauche pour un contexte précis.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pose une question au tuteur..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition"
          >
            {loading ? '...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );
};
