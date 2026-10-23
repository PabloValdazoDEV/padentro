import type { CardKind, ModeId } from '../types';

export interface ModeInfo {
  id: ModeId;
  name: string;
  emoji: string;
  description: string;
  soberDescription: string;
  kinds: CardKind[];
  /** Si el modo va por turnos (cada carta es para un jugador concreto). */
  turns: boolean;
}

export const MODES: ModeInfo[] = [
  {
    id: 'verdad-reto',
    name: 'Verdad o Reto',
    emoji: '🎯',
    description: 'Contesta o cumple. Si te rajas, bebes.',
    soberDescription: 'Contesta o cumple. Si te rajas, penitencia.',
    kinds: ['verdad', 'reto'],
    turns: true,
  },
  {
    id: 'yo-nunca',
    name: 'Yo nunca',
    emoji: '🙊',
    description: 'Bebe si lo has hecho. Sin mentir.',
    soberDescription: 'Baja un dedo si lo has hecho. Sin mentir.',
    kinds: ['yo-nunca'],
    turns: false,
  },
  {
    id: 'mas-probable',
    name: '¿Quién es más probable?',
    emoji: '👉',
    description: 'Todos señalan a la de tres. El más votado bebe.',
    soberDescription: 'Todos señalan a la de tres. Penitencia para el más votado.',
    kinds: ['mas-probable'],
    turns: false,
  },
  {
    id: 'mixto',
    name: 'Ronda mixta',
    emoji: '🎲',
    description: 'De todo un poco: retos, duelos, normas y tragos para todos.',
    soberDescription: 'De todo un poco: retos, duelos, normas y penitencias.',
    kinds: ['verdad', 'reto', 'yo-nunca', 'mas-probable', 'todos', 'duelo', 'regla'],
    turns: true,
  },
];

export const modeInfo = (id: ModeId) => MODES.find((m) => m.id === id)!;

/** Cómo se presenta cada tipo de carta en pantalla. */
export const KIND_INFO: Record<CardKind, { label: string; hint: string; soberHint: string }> = {
  verdad: { label: 'Verdad', hint: 'Si no contestas, bebes 2 tragos.', soberHint: 'Si no contestas, penitencia.' },
  reto: { label: 'Reto', hint: 'Si no lo cumples, bebes 3 tragos.', soberHint: 'Si no lo cumples, penitencia.' },
  'yo-nunca': {
    label: 'Yo nunca',
    hint: 'Bebe quien lo haya hecho.',
    soberHint: 'Quien lo haya hecho baja un dedo. Sin dedos = penitencia.',
  },
  'mas-probable': {
    label: '¿Quién es más probable?',
    hint: 'A la de tres, todos señalan. El más votado bebe.',
    soberHint: 'A la de tres, todos señalan. El más votado cumple penitencia.',
  },
  todos: { label: 'Todos', hint: '', soberHint: '' },
  duelo: { label: 'Duelo', hint: 'Quien pierda, bebe.', soberHint: 'Quien pierda, cumple penitencia.' },
  regla: { label: 'Nueva norma', hint: 'Dura hasta que salga otra norma.', soberHint: 'Dura hasta que salga otra norma.' },
};
