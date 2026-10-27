import type { Level } from '../types';

export interface LevelInfo {
  level: Level;
  name: string;
  emoji: string;
  description: string;
  color: string;
  premium: boolean;
  /** Hay que confirmar que todo el grupo está de acuerdo antes de activarlo. */
  consent?: boolean;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Suave', emoji: '🧃', description: 'Para romper el hielo', color: '#3ef0c1', premium: false },
  { level: 2, name: 'Fiesta', emoji: '🍻', description: 'Risas y algo de vergüenza', color: '#ffd23f', premium: false },
  { level: 3, name: 'Picante', emoji: '🌶️', description: 'Preguntas íntimas y comprometidas', color: '#ff4d8d', premium: true },
  { level: 4, name: 'Extremo', emoji: '💀', description: 'Lo más bestia. Aquí se pierden amistades', color: '#a855ff', premium: true },
  {
    level: 5,
    name: 'Sin filtro',
    emoji: '🔥',
    description: 'Sexo y ligoteo. Solo si todo el grupo se apunta',
    color: '#ff6a2b',
    premium: true,
    consent: true,
  },
];

export const levelInfo = (l: Level) => LEVELS[l - 1];
