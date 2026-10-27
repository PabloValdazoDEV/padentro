import { load } from './storage';

/**
 * Efectos de sonido cortos, generados con Web Audio (sin archivos ni licencias).
 * Se mezclan con la música que ya esté sonando (Spotify, etc.) en vez de pararla,
 * y respetan el botón de silencio del iPhone.
 */
export type Sound = 'next' | 'prev' | 'pick' | 'penitencia' | 'duelo' | 'regla';

let ctx: AudioContext | undefined;

function audio(): AudioContext | undefined {
  if (!ctx) {
    // Safari 16.4+: "ambient" = no interrumpe otras apps y se calla con el modo silencio.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'ambient';
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Nota con envolvente rápida; `to` hace un barrido de frecuencia. */
function tone(c: AudioContext, at: number, freq: number, dur: number, opts: { to?: number; type?: OscillatorType; vol?: number } = {}) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, at);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(opts.vol ?? 0.15, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** Ruido filtrado: el "swoosh" de pasar carta y los golpes del redoble. */
function noise(c: AudioContext, at: number, dur: number, opts: { from: number; to: number; vol?: number }) {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(opts.from, at);
  filter.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(opts.vol ?? 0.25, at + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(at);
}

const SOUNDS: Record<Sound, (c: AudioContext, t: number) => void> = {
  next: (c, t) => noise(c, t, 0.18, { from: 600, to: 3500 }),
  prev: (c, t) => noise(c, t, 0.18, { from: 3500, to: 600 }),
  pick: (c, t) => tone(c, t, 520, 0.12, { to: 900 }),
  penitencia: (c, t) => {
    for (let i = 0; i < 8; i++) noise(c, t + i * 0.055, 0.06, { from: 180, to: 120, vol: 0.2 + i * 0.03 });
    tone(c, t + 0.47, 110, 0.35, { to: 70, type: 'triangle', vol: 0.35 });
  },
  duelo: (c, t) => {
    tone(c, t, 1800, 0.25, { to: 1500, type: 'square', vol: 0.05 });
    tone(c, t + 0.12, 2200, 0.3, { to: 1900, type: 'square', vol: 0.05 });
  },
  regla: (c, t) => {
    [660, 880, 1320].forEach((f, i) => tone(c, t + i * 0.08, f, 0.25, { vol: 0.1 }));
  },
};

export function playSound(name: Sound, delay = 0) {
  if (!load('sounds', true)) return;
  try {
    const c = audio();
    if (c) SOUNDS[name](c, c.currentTime + delay);
  } catch {
    // Sin audio no pasa nada.
  }
}
