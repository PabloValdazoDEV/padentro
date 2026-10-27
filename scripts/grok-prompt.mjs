// Genera el prompt completo para Grok (notas del tipo, ejemplos buenos y cartas existentes)
// y lo copia al portapapeles.
//
// Uso: npm run prompt -- <tipo> <nivel> [cantidad]
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { KINDS, LEVELS, readCards } from './cards-lib.mjs';

const [kind, levelArg, n = '30'] = process.argv.slice(2);
const level = Number(levelArg);
if (!KINDS[kind] || !LEVELS.includes(level)) {
  console.error(`Uso: npm run prompt -- <${Object.keys(KINDS).join('|')}> <1-${LEVELS.length}> [cantidad]`);
  process.exit(1);
}

const doc = readFileSync(new URL('../docs/GROK.md', import.meta.url), 'utf8');
const template = doc.match(/## Prompt base[\s\S]*?```text\n([\s\S]*?)```/)[1];
// El nivel 5 es el único con contenido sexual: cambia la regla de contenido.
const contentRule = doc.match(new RegExp(`### ${level === 5 ? 'nivel-5' : 'niveles-1-4'}\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`))[1].trim();
const notes = doc.match(new RegExp(`### ${kind}\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`))[1].trim();

const cards = readCards('es', kind);
const sameLevel = cards.filter((c) => c.level === level);
// Ejemplos: los del mismo nivel (barajados); si hay pocos, completamos con niveles cercanos.
const pool = [...sameLevel.sort(() => Math.random() - 0.5), ...cards.filter((c) => Math.abs(c.level - level) === 1)];
// En el nivel 5 los ejemplos van en la regla de contenido: las cartas que hay son más flojas de lo que buscamos.
const examples =
  level === 5 ? '(ver los ejemplos de nivel en las REGLAS)' : pool.slice(0, 6).map((c) => `- ${c.text}`).join('\n');
// El nivel 5 va de sexo y ningún otro nivel lo toca: basta con no repetir las suyas (y el prompt queda corto).
const existing = (level === 5 ? sameLevel : cards).map((c) => `- ${c.text}`).join('\n');
// Ideas del mismo nivel en otros tipos: en la Ronda mixta salen juntas, así que tampoco se pueden repetir.
const others = Object.keys(KINDS)
  .filter((k) => k !== kind)
  .flatMap((k) => readCards('es', k).filter((c) => c.level === level))
  .map((c) => `- ${c.text}`)
  .join('\n');

const prompt = template
  .replaceAll('<TIPO>', kind)
  .replaceAll('<NIVEL>', String(level))
  .replaceAll('<N>', n)
  .replace('<REGLA_CONTENIDO>', contentRule)
  .replace('<NOTAS_TIPO>', notes)
  .replace('<EJEMPLOS>', examples)
  .replace('<EXISTENTES>', existing)
  .replace('<OTROS_TIPOS>', others);

try {
  execSync('pbcopy', { input: prompt });
  console.log(`✓ Prompt de ${kind} nivel ${level} (${n} cartas) copiado al portapapeles. Pégalo en un CHAT NUEVO de Grok.`);
} catch {
  console.log(prompt);
}
