/**
 * Service API pour l'intégration IA
 */

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

export interface ChatMessage {
  message: string;
  matiere_id?: number;
  lecon_id?: number;
}

export interface ExerciseRequest {
  nombre: number;
  matiere_id: number;
  topics?: string[];
  difficulte?: 'facile' | 'normal' | 'difficile' | 'adapte';
}

export interface AnalysisRequest {
  exercice_id: number;
  reponse_donnee: string;
  temps_resolution?: number;
}

export class IAService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur API');
    }

    return response.json();
  }

  // Chat
  async chat(message: ChatMessage) {
    return this.request('/ia/chat/', 'POST', message);
  }

  async getHistorique(limit = 10, matiereId?: number) {
    let url = `/ia/historique-conversations/?limit=${limit}`;
    if (matiereId) {
      url += `&matiere_id=${matiereId}`;
    }
    return this.request(url);
  }

  // Exercices
  async genererExercices(request: ExerciseRequest) {
    return this.request('/ia/generer-exercices/', 'POST', request);
  }

  async analyserReponse(request: AnalysisRequest) {
    return this.request('/ia/analyser-reponse/', 'POST', request);
  }

  // Recommandations
  async getRecommandations(matiereId?: number) {
    let url = '/ia/recommandations/';
    if (matiereId) {
      url += `?matiere_id=${matiereId}`;
    }
    return this.request(url);
  }

  // Explications
  async expliquerConcept(concept: string, matiereId: number, style = 'analogie') {
    return this.request('/ia/expliquer/', 'POST', {
      concept,
      matiere_id: matiereId,
      style,
    });
  }

  // Diagnostic
  async getDiagnostic() {
    return this.request('/ia/diagnostic/');
  }
}

// Singleton
let iaServiceInstance: IAService | null = null;

export function getIAService(token: string): IAService {
  if (!iaServiceInstance) {
    iaServiceInstance = new IAService(token);
  }
  return iaServiceInstance;
}

export function resetIAService() {
  iaServiceInstance = null;
}
