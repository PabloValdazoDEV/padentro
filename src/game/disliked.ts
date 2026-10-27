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

