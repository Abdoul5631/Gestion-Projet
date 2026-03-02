/**
 * Configuration API centralisée
 * - En dev (Vite): utilise /api/ → proxy Vite vers http://127.0.0.1:8000 (pas de CORS)
 * - En prod: utilise /api/ (même origine après build)
 * - VITE_API_URL: override pour forcer une URL (ex: http://127.0.0.1:8000/api/)
 */
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || '/api/';
