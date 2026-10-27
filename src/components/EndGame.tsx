import { useState } from 'react';
import { APP } from '../../app.config';
import { haptic } from '../haptics';
import { summaryImage } from '../share/image';
import ShareSheet from './ShareSheet';
import ShareIcon from './ShareIcon';
import Sheet from './Sheet';

export interface GameStats {
  cards: number;
  minutes: number;
  mode: string;
  players: string[];
  /** Quien más veces ha salido en las cartas. */
  star?: string;
}

interface Props {
  stats: GameStats;
  premium: boolean;
  onContinue: () => void;
  onFinish: () => void;
  onPremium: () => void;
}

export default function EndGame({ stats, premium, onContinue, onFinish, onPremium }: Props) {
  const [sharing, setSharing] = useState(false);

  const time = stats.minutes >= 60 ? `${Math.floor(stats.minutes / 60)} h ${stats.minutes % 60} min` : `${stats.minutes} min`;
  const text = [
    `Hemos jugado ${stats.cards} cartas en ${time} a ${APP.name} 🍻`,
    stats.star && `👑 Quien más ha salido: ${stats.star}`,
    APP.url,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <>
      <Sheet onClose={onContinue} className="end-game">
        <div className="modal-emoji">🏁</div>
        <h2>¿Fin de la partida?</h2>
        <div className="end-stats">
          <div>
            <strong style={{ color: 'var(--yellow)' }}>{stats.cards}</strong>
            <small>cartas</small>
          </div>
          <div>
            <strong style={{ color: 'var(--mint)' }}>{time}</strong>
            <small>jugando</small>
          </div>
        </div>
        {stats.star && (
          <p className="end-star">
            👑 Quien más ha salido: <strong>{stats.star}</strong>
          </p>
        )}
        <button
          className="btn btn-primary btn-icon"
          onClick={() => {
            haptic();
            setSharing(true);
          }}
        >
          <ShareIcon size={20} /> Compartir la partida
        </button>
        {!premium && (
          <button className="btn btn-premium" onClick={onPremium}>
            🌶️ ¿Os habéis quedado con ganas? Desbloquea Extremo
          </button>
        )}
        <div className="end-actions">
          <button className="btn btn-secondary" onClick={onContinue}>
            Seguir jugando
          </button>
          <button className="btn btn-ghost" onClick={onFinish}>
            Terminar
          </button>
        </div>
      </Sheet>
      {sharing && (
        <ShareSheet
          title="Compartir la partida"
          text={text}
          image={() => summaryImage(stats)}
          filename="padentro-partida.png"
          onClose={() => setSharing(false)}
        />
      )}
    </>
  );
}
