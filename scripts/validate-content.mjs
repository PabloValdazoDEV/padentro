// Comprueba que todas las cartas tienen el formato correcto. Se ejecuta antes de cada build.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mentionsAlcohol, soberize } from '../src/game/sober.js';
import { CONTENT_DIR, KINDS, TOKENS, langs, normalize, readCards } from './cards-lib.mjs';

// En estos tipos hablar de beber es parte de la frase ("Yo nunca he vomitado por beber"), no una orden.
const DESCRIPTIVE_KINDS = ['yo-nunca', 'mas-probable'];

let errors = 0;
const fail = (msg) => {
  errors++;
  console.error('  ✗ ' + msg);
};

for (const lang of langs()) {
  console.log(`[${lang}]`);
  for (const kind of Object.keys(KINDS)) {
    const cards = readCards(lang, kind);
    const ids = new Set();
    const texts = new Map();
    const perLevel = [0, 0, 0, 0];
    for (const c of cards) {
      if (!c.id || ids.has(c.id)) fail(`${kind}: id vacío o repetido (${c.id})`);
      ids.add(c.id);
      if (![1, 2, 3, 4].includes(c.level)) fail(`${kind} ${c.id}: level debe ser 1-4`);
      else perLevel[c.level - 1]++;
      if (typeof c.text !== 'string' || c.text.trim().length < 5) fail(`${kind} ${c.id}: texto vacío`);
      for (const tok of c.text.match(/\{[^}]*\}/g) ?? []) {
        if (!TOKENS.includes(tok)) fail(`${kind} ${c.id}: token desconocido ${tok} (usa ${TOKENS.join(' o ')})`);
      }
      if (!c.alcohol && !DESCRIPTIVE_KINDS.includes(kind) && mentionsAlcohol(soberize(c.text))) {
        fail(`${kind} ${c.id}: no se puede pasar a modo sin alcohol. Usa "bebe/bebes/beben (N tragos)" o marca "alcohol": true`);
      }
      const n = normalize(c.text);
      if (texts.has(n)) fail(`${kind} ${c.id}: duplicado de ${texts.get(n)}`);
      texts.set(n, c.id);
    }
    console.log(`  ${kind.padEnd(13)} ${String(cards.length).padStart(4)}  (por nivel: ${perLevel.join(' / ')})`);
  }
  const penitencias = JSON.parse(readFileSync(join(CONTENT_DIR, lang, 'penitencias.json'), 'utf8'));
  if (!Array.isArray(penitencias) || penitencias.some((t) => typeof t !== 'string' || t.trim().length < 5)) {
    fail('penitencias.json: debe ser un array de textos');
  }
  console.log(`  ${'penitencias'.padEnd(13)} ${String(penitencias.length).padStart(4)}`);
}

if (errors) {
  console.error(`\n${errors} error(es) en el contenido.`);
  process.exit(1);
}
console.log('\nContenido OK.');
