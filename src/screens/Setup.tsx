import { LEVELS } from '../content/levels';
import { MODES } from '../content/modes';
import { haptic } from '../haptics';
import type { Level, ModeId, Player } from '../types';

interface Props {
  mode: ModeId;
  levels: Level[];
  unlocked: boolean;
  sober: boolean;
  players: Player[];
  onMode: (m: ModeId) => void;
  onLevels: (l: Level[]) => void;
  onSober: (v: boolean) => void;
  onLocked: () => void;
  onPlayers: () => void;
  onBack: () => void;
  onStart: () => void;
}

export default function Setup(props: Props) {
  const { mode, levels, unlocked, sober, players } = props;

  const toggle = (l: Level) => {
    if (levels.includes(l)) {
      if (levels.length > 1) props.onLevels(levels.filter((x) => x !== l));
    } else {
      props.onLevels([...levels, l].sort((a, b) => a - b));
    }
  };

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={props.onBack} aria-label="Volver">
          ←
        </button>
        <h2>Elige el juego</h2>
        <button className="pill" onClick={props.onPlayers}>
          👥 {players.length}
        </button>
      </header>

      <div className="segmented" role="radiogroup" aria-label="Alcohol">
        {[
          { value: false, label: '🍺 Con alcohol' },
          { value: true, label: '🥤 Sin alcohol' },
        ].map((o) => (
          <button
            key={o.label}
            role="radio"
            aria-checked={sober === o.value}
            className={sober === o.value ? 'active' : ''}
            onClick={() => {
              haptic();
              props.onSober(o.value);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mode-grid">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-card ${mode === m.id ? 'selected' : ''}`}
            onClick={() => {
              haptic();
              props.onMode(m.id);
            }}
          >
            <span className="mode-emoji">{m.emoji}</span>
            <strong>{m.name}</strong>
            <small>{sober ? m.soberDescription : m.description}</small>
          </button>
        ))}
      </div>

      <h3 className="section-title">Intensidad</h3>
      <div className="level-list">
        {LEVELS.map((l) => {
          const locked = l.premium && !unlocked;
          const active = levels.includes(l.level);
          return (
            <button
              key={l.level}
              className={`level-chip ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
              style={{ '--c': l.color } as React.CSSProperties}
              onClick={() => {
                haptic();
                if (locked) props.onLocked();
                else toggle(l.level);
              }}
            >
              <span className="level-emoji">{l.emoji}</span>
              <span className="level-text">
                <strong>{l.name}</strong>
                <small>{l.description}</small>
              </span>
              <span className="level-check">{locked ? '🔒' : active ? '✓' : ''}</span>
            </button>
          );
        })}
      </div>

      <div className="bottom sticky">
        <button
          className="btn btn-primary btn-xl"
          onClick={() => {
            haptic('medium');
            props.onStart();
          }}
        >
          Empezar
        </button>
      </div>
    </main>
  );
}
