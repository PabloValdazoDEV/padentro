import type { Level } from '../types';

export interface LevelInfo {
  level: Level;
  name: string;
  emoji: string;
  description: string;
  color: string;
  premium: boolean;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Suave', emoji: '🧃', description: 'Para romper el hielo', color: '#3ef0c1', premium: false },
  { level: 2, name: 'Fiesta', emoji: '🍻', description: 'Risas y algo de vergüenza', color: '#ffd23f', premium: false },
  { level: 3, name: 'Picante', emoji: '🌶️', description: 'Preguntas íntimas y comprometidas', color: '#ff4d8d', premium: true },
  { level: 4, name: 'Extremo', emoji: '💀', description: 'Sin filtro. Aquí se pierden amistades', color: '#a855ff', premium: true },
];

export const levelInfo = (l: Level) => LEVELS[l - 1];
