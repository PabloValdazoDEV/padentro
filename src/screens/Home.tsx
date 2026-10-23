import { APP } from '../../app.config';
import { modeInfo } from '../content/modes';
import type { SavedGame } from '../game/saved';
import { haptic } from '../haptics';

interface Props {
  premium: boolean;
  savedGame: SavedGame | null;
  onContinue: (game: SavedGame) => void;
  onPlay: () => void;
  onPlayers: () => void;
  onPremium: () => void;
  onSettings: () => void;
}

export default function Home({ premium, savedGame, onContinue, onPlay, onPlayers, onPremium, onSettings }: Props) {
  const tap = (fn: () => void) => () => {
    haptic();
    fn();
  };

  return (
    <main className="screen home">
      <header className="home-top">
        <button className="icon-btn" onClick={tap(onSettings)} aria-label="Ajustes">
          ⚙️
        </button>
      </header>

      <div className="home-hero">
        <div className="logo-glass">🍻</div>
        <h1 className="logo">
          {APP.logo[0]}
          <span>{APP.logo[1]}</span>
        </h1>
        <p className="muted">Verdad o Reto · Yo nunca · ¿Quién es más probable?</p>
      </div>

      <div className="stack">
        {savedGame && (
          <button className="btn btn-primary btn-xl btn-continue" onClick={tap(() => onContinue(savedGame))}>
            ▶ Continuar partida
            <small>
              {modeInfo(savedGame.mode).name} · {savedGame.players.length} jugadores
            </small>
          </button>
        )}
        <button className={`btn btn-xl ${savedGame ? 'btn-secondary' : 'btn-primary'}`} onClick={tap(onPlay)}>
          {savedGame ? 'Nueva partida' : 'Jugar'}
        </button>
        <button className="btn btn-secondary" onClick={tap(onPlayers)}>
          Jugadores
        </button>
        {!premium && (
          <button className="btn btn-premium" onClick={tap(onPremium)}>
            🌶️ Desbloquear Picante y Extremo
          </button>
        )}
      </div>

      <p className="tiny center">Solo para mayores de 18. Bebe con responsabilidad.</p>
    </main>
  );
}
