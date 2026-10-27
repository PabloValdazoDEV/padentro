import { Capacitor } from '@capacitor/core';
import { APP } from '../app.config';
import audioFiles from './content/es/audio.json';
import { load, save } from './storage';

/** Lectura en voz alta con la voz del propio móvil (Web Speech API: iOS, Android y la app nativa). */
const synth: SpeechSynthesis | undefined = typeof speechSynthesis !== 'undefined' ? speechSynthesis : undefined;

export const speechSupported = !!synth;

// Android a veces da el idioma como "es_ES".
const langOf = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-');

/**
 * Voces de España que tiene el móvil. Las latinoamericanas solo si no hay ninguna de España,
 * para que al menos se pueda leer.
 */
export function spanishVoices(): SpeechSynthesisVoice[] {
  const spanish = (synth?.getVoices() ?? []).filter((v) => langOf(v).toLowerCase().startsWith('es'));
  const spain = spanish.filter((v) => langOf(v) === 'es-ES');
  return (spain.length ? spain : spanish).sort((a, b) => a.name.localeCompare(b.name));
}

/** La que ha elegido el usuario en Ajustes o, si no hay ninguna (o ya no existe), la primera de España. */
export function currentVoice(): SpeechSynthesisVoice | undefined {
  const voices = spanishVoices();
  const chosen = load<string | null>('voiceName', null);
  return voices.find((v) => v.voiceURI === chosen) ?? voices[0];
}

export function chooseVoice(voiceURI: string) {
  save('voiceName', voiceURI);
}

/** Las voces cargan tarde en algunos navegadores: avisa cuando estén. */
export function onVoicesChanged(cb: () => void): () => void {
  synth?.addEventListener?.('voiceschanged', cb);
  return () => synth?.removeEventListener?.('voiceschanged', cb);
}

/** "enamorado/a" se leería "enamorado barra a": nos quedamos con la primera forma. */
const forSpeech = (text: string) => text.replace(/(\p{L}+)\/\p{L}+/gu, '$1');

// --- Audio grabado de cada carta (scripts/generate-audio.mjs) ---

const AUDIO: Record<string, string> = audioFiles;
export const hasRecordedAudio = Object.keys(AUDIO).length > 0;
/** Se puede leer en voz alta: con audio grabado o con la voz del móvil. */
export const canRead = speechSupported || hasRecordedAudio;
// Cada lectura nueva invalida las anteriores que aún se estén descargando.
let turn = 0;

/**
 * Un único reproductor para todas las cartas. El iPhone solo deja sonar audio justo después de un toque,
 * y al deslizar la carta nueva sale tras la animación, fuera de ese toque. Pero si un reproductor ha sonado
 * una vez durante un toque, queda desbloqueado y ya puede sonar cuando sea: lo desbloqueamos con el primer toque.
 */
const player: HTMLAudioElement | undefined = typeof Audio !== 'undefined' ? new Audio() : undefined;
const SILENCE = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
let unlocked = false;
const unlock = () => {
  if (!player || unlocked || player.src.startsWith('blob:')) return;
  player.muted = true;
  player.src = SILENCE;
  player
    .play()
    .then(() => {
      player.pause();
      player.muted = false;
      markUnlocked();
    })
    .catch(() => {
      player.muted = false;
    });
};
const UNLOCK_EVENTS = ['touchend', 'click', 'keydown'] as const;
const markUnlocked = () => {
  unlocked = true;
  for (const ev of UNLOCK_EVENTS) document.removeEventListener(ev, unlock, true);
};
if (typeof document !== 'undefined') for (const ev of UNLOCK_EVENTS) document.addEventListener(ev, unlock, true);
let blobUrl: string | undefined;

/** Audio grabado de la carta, si lo hay (las cartas con nombres no tienen). */
function recordedUrl(cardId: string, sober: boolean): string | undefined {
  const key = sober && AUDIO[`${cardId}.s`] ? `${cardId}.s` : cardId;
  return AUDIO[key] && `audio/es/${key}.mp3?v=${AUDIO[key]}`;
}

/**
 * Cartas con nombres: el audio se genera al momento en el servidor (public/tts.php) con la misma voz.
 * Desde la app nativa hay que ir a la web; en la web, al propio dominio.
 */
const liveUrl = (text: string) =>
  `${Capacitor.isNativePlatform() ? `${APP.url}/` : ''}tts.php?t=${encodeURIComponent(forSpeech(text))}`;

/** Descarga un audio entero. Algunos servidores devuelven la página principal en vez de un 404: solo vale si es audio. */
const fetchAudio = (url: string) =>
  fetch(url).then((res) =>
    res.ok && res.headers.get('content-type')?.startsWith('audio/') ? res.blob() : Promise.reject(),
  );

/** Reproduce varios audios seguidos con el reproductor desbloqueado. */
function playInOrder(blobs: Blob[], mine: number) {
  if (!player || mine !== turn || !blobs.length) return;
  const [first, ...rest] = blobs;
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = URL.createObjectURL(first);
  player.muted = false;
  player.src = blobUrl;
  if (rest.length) player.addEventListener('ended', () => playInOrder(rest, mine), { once: true });
  return player.play().then(markUnlocked);
}

/**
 * Lee una carta con la voz grabada: su audio si lo tiene y, si lleva nombres, generado al momento.
 * `intro` ("Turno de Ana.") se genera al momento y suena antes; si no se puede (sin conexión), se lee solo la carta.
 * Si la carta no se puede reproducir, todo con la voz del móvil.
 * Los audios se descargan enteros antes de sonar: así el service worker los guarda y luego suenan sin conexión.
 */
export function speakCard(cardId: string, sober: boolean, text: string, intro?: string) {
  const fullText = intro ? `${intro} ${text}` : text;
  const recorded = recordedUrl(cardId, sober);
  if (!hasRecordedAudio) return speak(fullText);
  stopSpeaking();
  const mine = turn;
  // Sin audio grabado (lleva nombres), la frase entera se genera de una vez, que suena más natural.
  if (!recorded) {
    fetchAudio(liveUrl(fullText))
      .then((blob) => playInOrder([blob], mine))
      .catch(() => mine === turn && speak(fullText));
    return;
  }
  const introBlob = intro ? fetchAudio(liveUrl(intro)).catch(() => undefined) : Promise.resolve(undefined);
  Promise.all([introBlob, fetchAudio(recorded)])
    .then(([i, card]) => playInOrder(i ? [i, card] : [card], mine))
    .catch(() => mine === turn && speak(fullText));
}

/** Una frase suelta con la misma voz ("Turno de Ana. ¿Verdad o reto?"). */
export function speakLine(text: string) {
  if (!hasRecordedAudio) return speak(text);
  stopSpeaking();
  const mine = turn;
  fetchAudio(liveUrl(text))
    .then((blob) => playInOrder([blob], mine))
    .catch(() => mine === turn && speak(text));
}

export function speak(text: string) {
  if (!synth) return;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(forSpeech(text));
  const voice = currentVoice();
  utterance.lang = voice ? langOf(voice) : 'es-ES';
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function stopSpeaking() {
  turn++;
  synth?.cancel();
  player?.pause();
}
