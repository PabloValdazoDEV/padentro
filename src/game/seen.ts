import { load, save } from '../storage';

/** Cartas que ya han salido en cualquier partida, para que la siguiente noche salgan primero las nuevas. */
const seen = new Set(load<string[]>('seen', []));

export const wasSeen = (id: string) => seen.has(id);

export function markSeen(id: string) {
  seen.add(id);
  save('seen', [...seen]);
}

/** Cuando ya se han visto todas las cartas de un mazo, se olvidan para empezar otra vuelta. */
export function forgetSeen(ids: string[]) {
  ids.forEach((id) => seen.delete(id));
  save('seen', [...seen]);
}
