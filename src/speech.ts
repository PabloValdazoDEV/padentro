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
let playing: HTMLAudioElement | undefined;
// Cada lectura nueva invalida las anteriores que aún se estén descargando.
let turn = 0;

/** Audio grabado de la carta, si lo hay (las cartas con nombres no tienen). */
function recordedUrl(cardId: string, sober: boolean): string | undefined {
  const key = sober && AUDIO[`${cardId}.s`] ? `${cardId}.s` : cardId;
  return AUDIO[key] && `audio/es/${key}.mp3?v=${AUDIO[key]}`;
}

/**
 * Lee una carta: con su audio grabado si existe y, si no (o falla la descarga), con la voz del móvil.
 * El audio se descarga entero antes de sonar: así el service worker lo guarda y luego suena sin conexión.
 */
export function speakCard(cardId: string, sober: boolean, fallbackText: string) {
  const url = recordedUrl(cardId, sober);
  if (!url) return speak(fallbackText);
  stopSpeaking();
  const mine = turn;
  fetch(url)
    // Algunos servidores devuelven la página principal en vez de un 404: solo vale si es audio de verdad.
    .then((res) => (res.ok && res.headers.get('content-type')?.startsWith('audio/') ? res.blob() : Promise.reject()))
    .then((blob) => {
      if (mine !== turn) return;
      playing = new Audio(URL.createObjectURL(blob));
      playing.addEventListener('ended', () => URL.revokeObjectURL(playing!.src), { once: true });
      return playing.play();
    })
    .catch(() => mine === turn && speak(fallbackText));
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
  playing?.pause();
  playing = undefined;
}
