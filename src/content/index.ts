import type { Card, CardKind, RawCard } from '../types';
import verdad from './es/verdad.json';
import reto from './es/reto.json';
import yoNunca from './es/yo-nunca.json';
import masProbable from './es/mas-probable.json';
import todos from './es/todos.json';
import duelo from './es/duelo.json';
import regla from './es/regla.json';
import penitencias from './es/penitencias.json';

const raw: Record<CardKind, RawCard[]> = {
  verdad: verdad as RawCard[],
  reto: reto as RawCard[],
  'yo-nunca': yoNunca as RawCard[],
  'mas-probable': masProbable as RawCard[],
  todos: todos as RawCard[],
  duelo: duelo as RawCard[],
  regla: regla as RawCard[],
};

export const CARDS: Record<CardKind, Card[]> = Object.fromEntries(
  Object.entries(raw).map(([kind, list]) => [kind, list.map((c) => ({ ...c, kind: kind as CardKind }))]),
) as Record<CardKind, Card[]>;

export const PENITENCIAS: string[] = penitencias;

export const CARD_BY_ID = new Map(Object.values(CARDS).flat().map((c) => [c.id, c]));
