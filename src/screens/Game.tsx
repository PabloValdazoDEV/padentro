import { useEffect, useMemo, useRef, useState } from 'react';
import EndGame, { type GameStats } from '../components/EndGame';
import Penitencia from '../components/Penitencia';
import ShareSheet from '../components/ShareSheet';
import ShareIcon from '../components/ShareIcon';
import SwipeCard from '../components/SwipeCard';
import { levelInfo } from '../content/levels';
import { KIND_INFO, modeInfo } from '../content/modes';
import { CARD_BY_ID } from '../content';
import { balancedPicker, Deck, fillTemplate, usesPlayer } from '../game/deck';
import { clearSavedGame, saveGame, type SavedGame } from '../game/saved';
import { soberize } from '../game/sober.js';
import { haptic } from '../haptics';
import { playSound } from '../sounds';
import { INTERSTITIAL_MIN_CARDS, showInterstitial } from '../monetization';
import { maybeRequestReview } from '../review';
import { APP } from '../../app.config';
import { cardImage } from '../share/image';
import { speak, speechSupported, stopSpeaking } from '../speech';
import type { Card, CardKind, Level, ModeId, Player } from '../types';

interface Props {
  mode: ModeId;
  levels: Level[];
  players: Player[];
  sober: boolean;
  disliked: ReadonlySet<string>;
  /** Leer cada carta en voz alta al salir. */
  voice: boolean;
  onVoice: (v: boolean) => void;
  /** Partida guardada a retomar; si no hay, empieza una nueva. */
  resume?: SavedGame | null;
  premium: boolean;
  onPremium: () => void;
  onDislike: (id: string) => void;
  onExit: () => void;
}

interface Drawn {
  card: Card;
  text: string;
  player?: Player;
}

/** Una carta ya vista (o la elección de Verdad/Reto pendiente, con drawn = null). */
interface Entry {
  /** Jugador al que le toca si la carta va dirigida a alguien. Solo esas cartas pasan el turno. */
  turn: number;
  drawn: Drawn | null;
}

/** Mantiene la pantalla encendida durante la partida (solo en https o en la app nativa). */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    const request = () =>
      navigator.wakeLock
        ?.request('screen')
        .then((l) => (lock = l))
        .catch(() => {});
    void request();
    const onVisible = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, []);
}

/** Recupera la carta que estaba en pantalla al guardar. */
function restoreDrawn(saved: SavedGame): Drawn | null {
  const card = saved.drawn && CARD_BY_ID.get(saved.drawn.cardId);
  if (!saved.drawn || !card) return null;
  return { card, text: saved.drawn.text, player: saved.players.find((p) => p.id === saved.drawn?.playerId) };
}

export default function Game(props: Props) {
  const { mode, levels, sober, disliked, voice, resume, onDislike, onExit } = props;
  useWakeLock();
  const info = modeInfo(mode);
  const deck = useMemo(() => {
    const d = new Deck(info.kinds, levels, sober, disliked);
    if (resume) d.restore(resume.piles);
    return d;
    // El mazo se crea una sola vez por partida.
  }, []);
  const [shuffledPlayers] = useState(() => resume?.players ?? [...props.players].sort(() => Math.random() - 0.5));
  const [penitencia, setPenitencia] = useState(false);
  const [toast, setToast] = useState(false);
  const drawCount = useRef(resume?.drawCount ?? 0);
  const [pickOther] = useState(balancedPicker);
  const [startedAt] = useState(() => resume?.startedAt ?? Date.now());
  const [ended, setEnded] = useState(false);
  const [sharing, setSharing] = useState<Drawn | null>(null);

  const playerAt = (t: number) => (info.turns ? shuffledPlayers[t % shuffledPlayers.length] : undefined);

  const draw = (kind: CardKind, t: number): Drawn | null => {
    const card = deck.draw(kind);
    if (!card) return null;
    const player = usesPlayer(card) ? playerAt(t) : undefined;
    drawCount.current++;
    const text = fillTemplate(card.text, player, shuffledPlayers, pickOther);
    return { card, player, text: sober ? soberize(text) : text };
  };

  const nextKind = () => (mode === 'mixto' ? deck.randomKind() : info.kinds[0]);

  // Historial de cartas vistas: deslizar a la derecha vuelve atrás y a la izquierda avanza
  // (repitiendo las ya vistas antes de robar nuevas, para que no sirva para saltarse cartas).
  // En Verdad o Reto el jugador elige primero; en el resto se roba directamente.
  const [history, setHistory] = useState<Entry[]>(() => [
    resume
      ? { turn: resume.turn, drawn: restoreDrawn(resume) }
      : { turn: 0, drawn: mode === 'verdad-reto' ? null : draw(nextKind(), 0) },
  ]);
  const [pos, setPos] = useState(0);
  const { turn, drawn } = history[pos];
  const setCurrent = (d: Drawn | null) => setHistory((h) => h.map((e, i) => (i === pos ? { ...e, drawn: d } : e)));

  // Guardamos la partida en cada cambio para poder retomarla.
  useEffect(() => {
    saveGame({
      mode,
      levels,
      sober,
      players: shuffledPlayers,
      turn,
      drawCount: drawCount.current,
      drawn: drawn && { cardId: drawn.card.id, text: drawn.text, playerId: drawn.player?.id },
      piles: deck.snapshot(),
      startedAt,
    });
  }, [turn, drawn, mode, levels, sober, shuffledPlayers, deck, startedAt]);

  // Nombre y tipo solo en las cartas dirigidas a un jugador ("Ana. Verdad. ¿…?"); en el resto el texto ya se explica solo.
  const speechText = (d: Drawn) => {
    const directed = d.card.kind === 'verdad' || d.card.kind === 'reto';
    const prefix = directed && d.player ? `${d.player.name}. ${KIND_INFO[d.card.kind].label}. ` : d.card.kind === 'regla' ? 'Nueva norma. ' : '';
    return prefix + d.text;
  };

  useEffect(() => {
    if (voice && drawn) speak(speechText(drawn));
  }, [voice, drawn]);
  useEffect(() => stopSpeaking, []);

  // Duelos y normas tienen su propio sonido, justo después del de pasar carta.
  const kindSound = useRef(false);
  useEffect(() => {
    // La primera carta sale sin tocar nada: sin gesto del usuario el navegador no deja sonar.
    if (!kindSound.current) return void (kindSound.current = true);
    if (drawn?.card.kind === 'duelo' || drawn?.card.kind === 'regla') playSound(drawn.card.kind, 0.15);
  }, [drawn]);

  const choose = (kind: CardKind) => {
    haptic('medium');
    playSound('pick');
    setCurrent(draw(kind, turn));
  };

  const next = () => {
    haptic('medium');
    playSound('next');
    if (pos < history.length - 1) {
      setPos(pos + 1);
      return;
    }
    const t = drawn?.player ? turn + 1 : turn;
    const entry = { turn: t, drawn: mode === 'verdad-reto' ? null : draw(nextKind(), t) };
    setHistory((h) => [...h, entry]);
    setPos(pos + 1);
  };

  const prev = () => {
    if (pos === 0) return;
    haptic('medium');
    playSound('prev');
    setPos(pos - 1);
  };

  const dislikeCard = () => {
    if (!drawn) return;
    onDislike(drawn.card.id);
    setToast(true);
    setTimeout(() => setToast(false), 1600);
    // Otra carta para el mismo turno: descartar no hace perder el turno.
    haptic('medium');
    playSound('next');
    setCurrent(draw(mode === 'verdad-reto' ? drawn.card.kind : nextKind(), turn));
  };

  // El nombre solo se muestra si la carta es para alguien concreto (o le toca elegir Verdad o Reto).
  const current = drawn ? drawn.player : mode === 'verdad-reto' ? playerAt(turn) : undefined;

  // Salir con × abre el resumen; "Terminar" cierra la partida del todo (ya no se puede retomar).
  const exit = () => (drawCount.current > 0 ? setEnded(true) : onExit());
  const finish = () => {
    clearSavedGame();
    if (!props.premium && drawCount.current >= INTERSTITIAL_MIN_CARDS) void showInterstitial();
    maybeRequestReview(drawCount.current);
    onExit();
  };

  const stats = (): GameStats => {
    // Quien más veces aparece en las cartas vistas, ya sea con turno o nombrado en el texto.
    const counts = new Map<string, number>();
    for (const { drawn: d } of history) {
      if (!d) continue;
      for (const p of shuffledPlayers) {
        if (d.player?.id === p.id || d.text.includes(p.name)) counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
      }
    }
    const star = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      cards: drawCount.current,
      minutes: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      mode: info.name,
      players: shuffledPlayers.map((p) => p.name),
      star,
    };
  };

  const shareCard = () => {
    haptic();
    setSharing(drawn);
  };
  const level = drawn ? levelInfo(drawn.card.level) : null;
  const kind = drawn ? KIND_INFO[drawn.card.kind] : null;
  const hint = kind && (sober ? kind.soberHint : kind.hint);

  return (
    <main className="screen game">
      <header className="topbar">
        <button className="icon-btn" onClick={exit} aria-label="Salir">
          ×
        </button>
        <h2>
          {info.emoji} {info.name}
        </h2>
        {speechSupported ? (
          <button
            className={`icon-btn voice-toggle ${voice ? 'on' : ''}`}
            aria-label={voice ? 'Desactivar lectura en voz alta' : 'Activar lectura en voz alta'}
            aria-pressed={voice}
            onClick={() => {
              haptic();
              if (voice) stopSpeaking();
              props.onVoice(!voice);
            }}
          >
            {voice ? '🔊' : '🔇'}
          </button>
        ) : (
          <span />
        )}
      </header>

      {current && (
        <div className="turn" key={`turn-${turn}`}>
          <small>Turno de</small>
          <strong>{current.name}</strong>
        </div>
      )}

      <div className="card-area">
        {mode === 'verdad-reto' && !drawn ? (
          <div className="choice">
            <button className="choice-btn verdad" onClick={() => choose('verdad')}>
              Verdad
            </button>
            <button className="choice-btn reto" onClick={() => choose('reto')}>
              Reto
            </button>
          </div>
        ) : drawn && level && kind ? (
          <SwipeCard key={`${pos}-${drawn.card.id}`} onSwipeLeft={next} onSwipeRight={pos > 0 ? prev : undefined}>
            <article className="card" style={{ '--c': level.color } as React.CSSProperties}>
              <div className="card-head">
                <span className="card-kind">{kind.label}</span>
                <span className="card-level">
                  {level.emoji} {level.name}
                  <button className="dislike share-btn" onClick={shareCard} aria-label="Compartir carta">
                    <ShareIcon />
                  </button>
                  <button className="dislike" onClick={dislikeCard} aria-label="No me gusta esta carta">
                    👎
                  </button>
                </span>
              </div>
              <p className="card-text">{drawn.text}</p>
              <div className="card-foot">
                {hint && <p className="card-hint">{hint}</p>}
                {speechSupported && (
                  <button
                    className="listen"
                    onClick={() => {
                      haptic();
                      speak(speechText(drawn));
                    }}
                  >
                    🔊 Escuchar
                  </button>
                )}
              </div>
            </article>
          </SwipeCard>
        ) : (
          <p className="muted center">No hay cartas para esta combinación. Prueba otros niveles.</p>
        )}
      </div>

      {drawn ? (
        <div className={`bottom game-actions ${pos > 0 ? 'with-back' : ''}`}>
          {pos > 0 && (
            <button className="btn btn-secondary btn-back" onClick={prev} aria-label="Carta anterior">
              ↩
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => {
              haptic('heavy');
              playSound('penitencia');
              setPenitencia(true);
            }}
          >
            🎭 {sober ? 'Penitencia' : 'No bebo'}
          </button>
          <button className="btn btn-primary" onClick={next}>
            Siguiente
          </button>
        </div>
      ) : (
        pos > 0 && (
          <div className="bottom">
            <button className="btn btn-ghost" onClick={prev}>
              ↩ Carta anterior
            </button>
          </div>
        )
      )}
      {drawn && drawCount.current <= 3 && (
        <p className="tiny center swipe-hint">← Desliza para la siguiente · para volver →</p>
      )}

      {toast && <div className="toast">Carta descartada: no volverá a salir</div>}

      {sharing && (
        <ShareSheet
          title="Compartir carta"
          text={`«${sharing.text}»\n\n¿Te atreves? Juega a ${APP.name} 🍻 ${APP.url}`.trim()}
          image={() => {
            const l = levelInfo(sharing.card.level);
            return cardImage({ kind: KIND_INFO[sharing.card.kind].label, level: l.name, color: l.color, text: sharing.text });
          }}
          filename="padentro-carta.png"
          onClose={() => setSharing(null)}
        />
      )}

      {ended && (
        <EndGame
          stats={stats()}
          premium={props.premium}
          onContinue={() => setEnded(false)}
          onFinish={finish}
          onPremium={props.onPremium}
        />
      )}

      {penitencia && (
        <Penitencia
          player={drawn?.player}
          players={shuffledPlayers}
          pickOther={pickOther}
          onClose={() => setPenitencia(false)}
        />
      )}
    </main>
  );
}
