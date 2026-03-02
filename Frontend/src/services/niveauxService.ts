/**
 * Service API pour les niveaux scolaires (CP1 → Terminale)
 */
import api from './api';

export interface NiveauScolaire {
  id: number;
  code: string;
  libelle: string;
  ordre: number;
  cycle: string;
}

export async function fetchNiveaux(): Promise<NiveauScolaire[]> {
  try {
    const res = await api.get<NiveauScolaire[]>('niveaux/');
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
}
