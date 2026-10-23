/** Lectura en voz alta con la voz del propio móvil (Web Speech API: iOS, Android y la app nativa). */
const synth: SpeechSynthesis | undefined = typeof speechSynthesis !== 'undefined' ? speechSynthesis : undefined;

export const speechSupported = !!synth;

let voice: SpeechSynthesisVoice | undefined;
const pickVoice = () => {
  const voices = synth?.getVoices() ?? [];
  voice = voices.find((v) => v.lang === 'es-ES') ?? voices.find((v) => v.lang.startsWith('es'));
};
pickVoice();
synth?.addEventListener?.('voiceschanged', pickVoice);

/** "enamorado/a" se leería "enamorado barra a": nos quedamos con la primera forma. */
const forSpeech = (text: string) => text.replace(/(\p{L}+)\/\p{L}+/gu, '$1');

export function speak(text: string) {
  if (!synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(forSpeech(text));
  utterance.lang = 'es-ES';
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function stopSpeaking() {
  synth?.cancel();
}
