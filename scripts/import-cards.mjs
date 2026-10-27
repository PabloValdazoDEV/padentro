// Importa cartas generadas (p. ej. por Grok) a un mazo, asignando IDs y saltando duplicados.
//
// Uso: npm run import -- <tipo> <archivo.json> [idioma]
//   tipo: verdad | reto | yo-nunca | mas-probable | todos | duelo | regla
//   archivo.json: array de { "level": 1-5, "text": "...", "alcohol"?: true }
import { readFileSync } from 'node:fs';
import { KINDS, LEVELS, normalize, readCards, writeCards } from './cards-lib.mjs';

const [kind, file, lang = 'es'] = process.argv.slice(2);
if (!KINDS[kind] || !file) {
  console.error(`Uso: npm run import -- <${Object.keys(KINDS).join('|')}> <archivo.json> [idioma]`);
  process.exit(1);
}

// Grok a veces envuelve el JSON en ```json ... ```: lo limpiamos.
const raw = readFileSync(file, 'utf8').replace(/```(json)?/g, '').trim();
const incoming = JSON.parse(raw);
const cards = readCards(lang, kind);
const seen = new Set(cards.map((c) => normalize(c.text)));
const prefix = KINDS[kind];

let added = 0;
let skipped = 0;
for (const { level, text, alcohol } of incoming) {
  const t = String(text ?? '').trim();
  if (!LEVELS.includes(level) || t.length < 5 || seen.has(normalize(t))) {
    skipped++;
    continue;
  }
  const n = cards.filter((c) => c.level === level).length + 1;
  let id = `${prefix}${level}-${String(n).padStart(3, '0')}`;
  for (let k = n; cards.some((c) => c.id === id); k++) id = `${prefix}${level}-${String(k).padStart(3, '0')}`;
  cards.push({ id, level, text: t, ...(alcohol === true && { alcohol: true }) });
  seen.add(normalize(t));
  added++;
}

cards.sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
writeCards(lang, kind, cards);
console.log(`${kind}: ${added} añadidas, ${skipped} descartadas (duplicadas o inválidas). Total: ${cards.length}`);
