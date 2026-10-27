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

export function speak(text: string) {
  if (!synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(forSpeech(text));
  const voice = currentVoice();
  utterance.lang = voice ? langOf(voice) : 'es-ES';
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function stopSpeaking() {
  synth?.cancel();
}
