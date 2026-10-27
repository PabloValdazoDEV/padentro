import { useEffect, useState } from 'react';
import { haptic } from '../haptics';
import { chooseVoice, currentVoice, onVoicesChanged, spanishVoices, speak } from '../speech';

const REGIONS: Record<string, string> = {
  'es-ES': 'España',
  'es-MX': 'México',
  'es-US': 'EE. UU.',
  'es-AR': 'Argentina',
  'es-CO': 'Colombia',
  'es-CL': 'Chile',
};

const label = (v: SpeechSynthesisVoice) => {
  const lang = v.lang.replace('_', '-');
  return `${v.name} · ${REGIONS[lang] ?? lang}`;
};

/** Elegir entre las voces en español del móvil y escucharlas. */
export default function VoicePicker() {
  const [voices, setVoices] = useState(spanishVoices);
  const [selected, setSelected] = useState(() => currentVoice()?.voiceURI ?? '');

  useEffect(
    () =>
      onVoicesChanged(() => {
        setVoices(spanishVoices());
        setSelected(currentVoice()?.voiceURI ?? '');
      }),
    [],
  );

  // Con una sola voz (o ninguna) no hay nada que elegir.
  if (voices.length < 2) return null;

  return (
    <div className="voice-picker">
      <label htmlFor="voice-select">Voz</label>
      <div className="voice-picker-row">
        <select
          id="voice-select"
          value={selected}
          onChange={(e) => {
            chooseVoice(e.target.value);
            setSelected(e.target.value);
            speak('¿Quién es más probable que se líe esta noche?');
          }}
        >
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {label(v)}
            </option>
          ))}
        </select>
        <button
          className="icon-btn"
          aria-label="Escuchar esta voz"
          onClick={() => {
            haptic();
            speak('Verdad o reto. Te toca.');
          }}
        >
          🔊
        </button>
      </div>
    </div>
  );
}
