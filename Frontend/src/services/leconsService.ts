/**
 * Service API pour les leçons
 * Gestion centralisée des erreurs, plus jamais d'écran blanc
 */
import api from './api';

export interface Exercice {
  id: number;
  question: string;
}

export interface Lecon {
  id: number;
  titre: string;
  description?: string;
  niveau: string;
  niveau_display?: string;
  matiere?: number;
  matiere_display?: string;
  exercices?: Exercice[];
  contenu_principal?: string;
  contenu_simplifie?: string;
  contenu_approfondi?: string;
}

export type LeconsState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Lecon[] }
  | { status: 'error'; message: string; detail?: unknown };

/** Leçons du niveau de l'élève connecté. Optionnel: filtrer par matière. */
export async function fetchLecons(matiereId?: number): Promise<Lecon[]> {
  const params = matiereId != null ? { matiere_id: matiereId } : {};
  const res = await api.get<Lecon[]>('lecons/', { params });
  return Array.isArray(res.data) ? res.data : [];
}

/** Détail d'une leçon (vérifie niveau élève). */
export async function fetchLeconDetail(leconId: number): Promise<Lecon> {
  const res = await api.get<Lecon>(`lecons/${leconId}/`);
  return res.data;
}

/** Messages utilisateur (jamais de texte technique type "populate_db", "404", etc.) */
export function getErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Une erreur est survenue. Veuillez réessayer.';
  const e = err as { response?: { status?: number; data?: { detail?: string; error?: string } }; message?: string };
  const status = e.response?.status;
  const server = e.response?.data;
  const raw = server?.detail || server?.error || e.message;
  if (status === 401) return 'Session expirée. Veuillez vous reconnecter.';
  if (status === 404) return 'Contenu indisponible. Reconnectez-vous si le problème continue.';
  if (status && status >= 500) return 'Le service est temporairement indisponible. Réessayez dans un instant.';
  if (typeof raw === 'string' && !raw.includes('populate') && !/^\s*erreur\s*\d+/i.test(raw)) return raw;
  return 'Une erreur est survenue. Veuillez réessayer.';
}
