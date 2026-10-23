import { CARD_BY_ID, CARDS } from '../content';
import type { Card, CardKind, Level, Player } from '../types';
import { forgetSeen, markSeen, wasSeen } from './seen';

/** Peso de cada tipo de carta en la Ronda mixta. */
const MIX_WEIGHTS: Record<CardKind, number> = {
  verdad: 3,
  reto: 3,
  'yo-nunca': 2,
  'mas-probable': 2,
  todos: 1.5,
  duelo: 1,
  regla: 0.7,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Baraja por tipo de carta: no repite ninguna hasta agotar el mazo de ese tipo,
 * y entonces vuelve a barajar. Las cartas que no han salido en partidas anteriores van primero.
 */
export class Deck {
  private piles = new Map<CardKind, Card[]>();

  constructor(
    private kinds: CardKind[],
    private levels: Level[],
    private sober = false,
    /** Ids que el usuario ha descartado con 👎. Se comparte por referencia para que afecte al momento. */
    private disliked: ReadonlySet<string> = new Set(),
  ) {}

  private pool(kind: CardKind) {
    return CARDS[kind].filter(
      (c) => this.levels.includes(c.level) && !(this.sober && c.alcohol) && !this.disliked.has(c.id),
    );
  }

  /** Ids que quedan en cada mazo (para guardar la partida). */
  snapshot(): Partial<Record<CardKind, string[]>> {
    return Object.fromEntries([...this.piles].map(([kind, pile]) => [kind, pile.map((c) => c.id)]));
  }

  restore(snapshot: Partial<Record<CardKind, string[]>>) {
    for (const [kind, ids] of Object.entries(snapshot) as [CardKind, string[]][]) {
      const cards = ids.map((id) => CARD_BY_ID.get(id)).filter((c): c is Card => !!c);
      this.piles.set(kind, cards);
    }
  }

  available(): CardKind[] {
    return this.kinds.filter((k) => this.pool(k).length > 0);
  }

  draw(kind: CardKind): Card | undefined {
    let pile = this.piles.get(kind);
    if (!pile || pile.length === 0) {
      const pool = this.pool(kind);
      let fresh = pool.filter((c) => !wasSeen(c.id));
      if (fresh.length === 0) {
        forgetSeen(pool.map((c) => c.id));
        fresh = pool;
      }
      // Se roba desde el final: las nuevas quedan encima.
      pile = [...shuffle(pool.filter((c) => !fresh.includes(c))), ...shuffle(fresh)];
      this.piles.set(kind, pile);
    }
    let card = pile.pop();
    while (card && this.disliked.has(card.id)) card = pile.pop();
    if (card) markSeen(card.id);
    return card ?? (pile.length === 0 && this.pool(kind).length ? this.draw(kind) : undefined);
  }

  randomKind(): CardKind {
    const kinds = this.available();
    const total = kinds.reduce((s, k) => s + MIX_WEIGHTS[k], 0);
    let r = Math.random() * total;
    for (const k of kinds) {
      r -= MIX_WEIGHTS[k];
      if (r <= 0) return k;
    }
    return kinds[kinds.length - 1];
  }
}

/** Si la carta va dirigida a quien tiene el turno (y por tanto lo consume). */
export const usesPlayer = (card: Card) =>
  card.kind === 'verdad' || card.kind === 'reto' || card.text.includes('{jugador}');

export type OtherPicker = (current: Player | undefined, players: Player[]) => Player | undefined;

/** Elige a {otro} repartiendo: siempre entre quienes menos veces han salido. */
export function balancedPicker(): OtherPicker {
  const counts = new Map<string, number>();
  return (current, players) => {
    const others = players.filter((p) => p.id !== current?.id);
    const min = Math.min(...others.map((p) => counts.get(p.id) ?? 0));
    const candidates = others.filter((p) => (counts.get(p.id) ?? 0) === min);
    const other = candidates[Math.floor(Math.random() * candidates.length)];
    if (other) counts.set(other.id, min + 1);
    return other;
  };
}

const randomPicker: OtherPicker = (current, players) => {
  const others = players.filter((p) => p.id !== current?.id);
  return others[Math.floor(Math.random() * others.length)];
};

/** Sustituye {jugador} y {otro} por nombres reales. */
export function fillTemplate(
  text: string,
  current: Player | undefined,
  players: Player[],
  pickOther: OtherPicker = randomPicker,
): string {
  const other = text.includes('{otro}') ? pickOther(current, players) : undefined;
  return text
    .replaceAll('{jugador}', current?.name ?? 'Alguien')
    .replaceAll('{otro}', other?.name ?? 'alguien');
}
