import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const CONTENT_DIR = new URL('../src/content/', import.meta.url).pathname;
export const KINDS = {
  verdad: 'v',
  reto: 'r',
  'yo-nunca': 'yn',
  'mas-probable': 'mp',
  todos: 't',
  duelo: 'd',
  regla: 'rg',
};
export const TOKENS = ['{jugador}', '{otro}'];

export const langs = () => readdirSync(CONTENT_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
export const fileFor = (lang, kind) => join(CONTENT_DIR, lang, `${kind}.json`);
export const readCards = (lang, kind) => JSON.parse(readFileSync(fileFor(lang, kind), 'utf8'));
export const writeCards = (lang, kind, cards) =>
  writeFileSync(fileFor(lang, kind), JSON.stringify(cards, null, 2) + '\n');

/** Normaliza para detectar duplicados aunque cambien tildes, mayúsculas o puntuación. */
export const normalize = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9{} ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
