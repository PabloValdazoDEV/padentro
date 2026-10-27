import { useMemo, useState } from 'react';
import { PENITENCIAS } from '../content';
import { fillTemplate, type OtherPicker } from '../game/deck';
import { haptic } from '../haptics';
import { playSound } from '../sounds';
import type { Player } from '../types';

interface Props {
  player?: Player;
  players: Player[];
  pickOther?: OtherPicker;
  onClose: () => void;
}

const pick = (exclude?: string) => {
  const options = PENITENCIAS.filter((p) => p !== exclude);
  return options[Math.floor(Math.random() * options.length)];
};

export default function Penitencia({ player, players, pickOther, onClose }: Props) {
  const [raw, setRaw] = useState(() => pick());
  const text = useMemo(() => fillTemplate(raw, player, players, pickOther), [raw, player, players, pickOther]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="modal-emoji">🎭</div>
        <h2>Penitencia{player ? ` para ${player.name}` : ''}</h2>
        <p className="penitencia-text" key={raw}>
          {text}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            haptic();
            onClose();
          }}
        >
          Hecho
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            haptic();
            playSound('penitencia');
            setRaw(pick(raw));
          }}
        >
          Otra
        </button>
      </div>
    </div>
  );
}
