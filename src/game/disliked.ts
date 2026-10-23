import { CARDS } from '../content';
import { load, save } from '../storage';

const KEY = 'disliked';

export const loadDisliked = () => new Set(load<string[]>(KEY, []));

export function dislike(set: Set<string>, id: string) {
  set.add(id);
  save(KEY, [...set]);
}

export function clearDisliked(set: Set<string>) {
  set.clear();
  save(KEY, []);
}

/** Lista legible para pegársela a quien revisa el contenido. */
export function dislikedReport(set: ReadonlySet<string>): string {
  const all = Object.values(CARDS).flat();
  return [...set]
    .map((id) => {
      const card = all.find((c) => c.id === id);
      return card ? `${card.id} (${card.kind}) | ${card.text}` : id;
    })
    .join('\n');
}
