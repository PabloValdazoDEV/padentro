// Genera el audio de cada carta con una voz de Google Cloud Text-to-Speech, para no depender de las voces del móvil.
//
// Uso:
//   npm run audio -- voces           lista las voces de España disponibles
//   npm run audio -- probar [voz…]   genera y reproduce una frase de prueba con cada voz
//   npm run audio                    genera lo que falte (solo las cartas nuevas o cambiadas)
//
// La clave va en .env.local (no se sube a git):  GOOGLE_TTS_KEY=...   y opcionalmente  GOOGLE_TTS_VOICE=...
// Las cartas con {jugador}/{otro} no tienen audio: los nombres no se saben de antemano y se leen con la voz del móvil.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { soberize } from '../src/game/sober.js';
import { CONTENT_DIR, KINDS, readCards } from './cards-lib.mjs';

const LANG = 'es';
const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'public', 'audio', LANG);
const MANIFEST = join(CONTENT_DIR, LANG, 'audio.json');
const DEFAULT_VOICE = 'es-ES-Chirp3-HD-Aoede';

const env = Object.fromEntries(
  (existsSync(join(ROOT, '.env.local')) ? readFileSync(join(ROOT, '.env.local'), 'utf8') : '')
    .split('\n')
    .map((l) => l.match(/^\s*([\w]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^['"]|['"]$/g, '')]),
);
const KEY = env.GOOGLE_TTS_KEY;
if (!KEY) {
  console.error('Falta la clave: crea .env.local con la línea  GOOGLE_TTS_KEY=tu-clave');
  process.exit(1);
}
const API = 'https://texttospeech.googleapis.com/v1';

async function synthesize(text, voice) {
  const res = await fetch(`${API}/text:synthesize?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'es-ES', name: voice },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from((await res.json()).audioContent, 'base64');
}

/** Igual que en la app: "enamorado/a" → "enamorado". */
const forSpeech = (text) => text.replace(/(\p{L}+)\/\p{L}+/gu, '$1');
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'voces') {
  const res = await fetch(`${API}/voices?languageCode=es-ES&key=${KEY}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  for (const v of (await res.json()).voices) console.log(`${v.name.padEnd(32)} ${v.ssmlGender}`);
  process.exit(0);
}

if (cmd === 'probar') {
  const voices = args.length
    ? args
    : ['es-ES-Chirp3-HD-Aoede', 'es-ES-Chirp3-HD-Kore', 'es-ES-Chirp3-HD-Charon', 'es-ES-Chirp3-HD-Puck'];
  const sample = 'Yo nunca he mandado un audio de cuatro minutos desde el baño de una discoteca. Si lo has hecho, bebes.';
  const dir = join(ROOT, 'grok', 'voces');
  mkdirSync(dir, { recursive: true });
  for (const voice of voices) {
    const file = join(dir, `${voice}.mp3`);
    try {
      writeFileSync(file, await synthesize(sample, voice));
    } catch (e) {
      console.log(`✗ ${voice}: ${e.message.slice(0, 120)}`);
      continue;
    }
    console.log(`▶ ${voice}`);
    execSync(`afplay "${file}"`);
  }
  console.log(`\nLos audios están en grok/voces. Pon la que más te guste en .env.local:  GOOGLE_TTS_VOICE=nombre`);
  process.exit(0);
}

// Generar todo lo que falte.
const voice = env.GOOGLE_TTS_VOICE || DEFAULT_VOICE;
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const wanted = {};
for (const kind of Object.keys(KINDS)) {
  for (const card of readCards(LANG, kind)) {
    if (/\{(jugador|otro)\}/.test(card.text)) continue;
    const prefix = kind === 'regla' ? 'Nueva norma. ' : '';
    wanted[card.id] = prefix + forSpeech(card.text);
    // En modo sin alcohol el texto cambia ("bebe" → "cumple penitencia"): necesita su propio audio.
    const sober = soberize(card.text);
    if (!card.alcohol && sober !== card.text) wanted[`${card.id}.s`] = prefix + forSpeech(sober);
  }
}

mkdirSync(OUT, { recursive: true });
const todo = Object.entries(wanted).filter(
  ([file, text]) => manifest[file] !== hash(voice + text) || !existsSync(join(OUT, `${file}.mp3`)),
);
console.log(`Voz: ${voice}. ${Object.keys(wanted).length} audios en total, ${todo.length} por generar.`);

let done = 0;
const queue = [...todo];
const worker = async () => {
  for (let item; (item = queue.shift()); ) {
    const [file, text] = item;
    writeFileSync(join(OUT, `${file}.mp3`), await synthesize(text, voice));
    manifest[file] = hash(voice + text);
    if (++done % 25 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
  }
};
try {
  await Promise.all(Array.from({ length: 4 }, worker));
} finally {
  // Aunque falle a medias, guardamos lo hecho para no repetirlo.
  for (const file of Object.keys(manifest)) if (!(file in wanted)) delete manifest[file];
  writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 0) + '\n');
}

// Borrar audios de cartas que ya no existen.
for (const f of readdirSync(OUT)) if (!(f.replace(/\.mp3$/, '') in wanted)) rmSync(join(OUT, f));
console.log('✓ Listo.');
