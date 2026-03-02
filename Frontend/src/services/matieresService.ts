/**
 * Service API pour les matières
 */
import api from './api';

export interface Matiere {
  id: number;
  nom: string;
  nom_display?: string;
  couleur_hex?: string;
  icone?: string;
}

/** Toutes les matières (référence) */
export async function fetchMatieres(): Promise<Matiere[]> {
  const res = await api.get<Matiere[]>('matieres/');
  return Array.isArray(res.data) ? res.data : [];
}

/** Matières du niveau de l'élève connecté (une seule fois à l'inscription) */
export async function fetchMatieresMonNiveau(): Promise<Matiere[]> {
  const res = await api.get<Matiere[]>('eleve/matieres/');
  return Array.isArray(res.data) ? res.data : [];
}
