import { useState } from 'react';
import { haptic } from '../haptics';
import { newId } from '../ids';
import type { Player } from '../types';

interface Props {
  players: Player[];
  onChange: (players: Player[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Players({ players, onChange, onBack, onNext }: Props) {
  const [name, setName] = useState('');

  const add = () => {
    const n = name.trim();
    if (!n || players.some((p) => p.name.toLowerCase() === n.toLowerCase())) return;
    onChange([...players, { id: newId(), name: n }]);
    haptic();
    setName('');
  };

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Volver">
          ←
        </button>
        <h2>¿Quién juega?</h2>
        <span />
      </header>

      <form
        className="add-player"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del jugador"
          maxLength={20}
          autoFocus
          enterKeyHint="done"
        />
        <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
          +
        </button>
      </form>

      <ul className="player-list">
        {players.map((p, i) => (
          <li key={p.id} className="player-chip" style={{ '--i': i } as React.CSSProperties}>
            <span>{p.name}</span>
            <button
              className="icon-btn"
              aria-label={`Quitar a ${p.name}`}
              onClick={() => {
                haptic();
                onChange(players.filter((x) => x.id !== p.id));
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {players.length < 2 && <p className="muted center">Añade al menos 2 jugadores.</p>}

      <div className="bottom">
        <button className="btn btn-primary btn-xl" disabled={players.length < 2} onClick={onNext}>
          Siguiente
        </button>
      </div>
    </main>
  );
}
