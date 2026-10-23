import { load, save } from '../storage';
import type { CardKind, Level, ModeId, Player } from '../types';

/** Partida en curso, guardada en el móvil para poder retomarla. */
export interface SavedGame {
  mode: ModeId;
  levels: Level[];
  sober: boolean;
  /** Jugadores en el orden de turnos de esta partida. */
  players: Player[];
  turn: number;
  drawCount: number;
  drawn: { cardId: string; text: string; playerId?: string } | null;
  /** Cartas que quedan por salir de cada mazo, para no repetir al retomar. */
  piles: Partial<Record<CardKind, string[]>>;
  /** Cuándo empezó la partida (para el resumen final). */
  startedAt?: number;
  savedAt: number;
}

const KEY = 'game';
/** Pasado este tiempo la partida se da por terminada. */
const MAX_AGE = 12 * 60 * 60 * 1000;

export function loadSavedGame(): SavedGame | null {
  const game = load<SavedGame | null>(KEY, null);
  return game && Date.now() - game.savedAt < MAX_AGE ? game : null;
}

export const saveGame = (game: Omit<SavedGame, 'savedAt'>) => save(KEY, { ...game, savedAt: Date.now() });

export const clearSavedGame = () => save(KEY, null);
