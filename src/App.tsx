import { useEffect, useReducer, useState } from 'react';
import AgeGate from './components/AgeGate';
import Paywall from './components/Paywall';
import Settings from './components/Settings';
import { clearDisliked, dislike, loadDisliked } from './game/disliked';
import { loadSavedGame, type SavedGame } from './game/saved';
import { isPremium } from './monetization';
import Game from './screens/Game';
import Home from './screens/Home';
import Players from './screens/Players';
import Setup from './screens/Setup';
import { usePersistentState } from './storage';
import type { Level, ModeId, Player } from './types';

type Screen = 'home' | 'players' | 'setup' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [adult, setAdult] = usePersistentState('adult', false);
  const [players, setPlayers] = usePersistentState<Player[]>('players', []);
  const [mode, setMode] = usePersistentState<ModeId>('mode', 'verdad-reto');
  const [levels, setLevels] = usePersistentState<Level[]>('levels', [1, 2]);
  const [sober, setSober] = usePersistentState('sober', false);
  const [haptics, setHaptics] = usePersistentState('haptics', true);
  const [voice, setVoice] = usePersistentState('voice', false);
  const [sounds, setSounds] = usePersistentState('sounds', true);
  /** Partida a retomar al entrar en la pantalla de juego (null = partida nueva). */
  const [resume, setResume] = useState<SavedGame | null>(null);
  const [premium, setPremium] = useState(isPremium);
  /** Desbloqueo temporal por ver un anuncio recompensado (solo esta sesión). */
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disliked] = useState(loadDisliked);
  const [, refresh] = useReducer((n: number) => n + 1, 0);

  // Cada pantalla es una entrada del historial: el botón/gesto "atrás" del móvil vuelve a la anterior
  // en vez de salir de la web.
  useEffect(() => {
    history.replaceState({ screen: 'home' }, '');
    const onPop = (e: PopStateEvent) => setScreen((e.state?.screen as Screen) ?? 'home');
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  const go = (s: Screen) => {
    history.pushState({ screen: s }, '');
    setScreen(s);
  };
  const back = () => history.back();

  const unlocked = premium || sessionUnlocked;
  const playableLevels = levels.filter((l) => unlocked || l <= 2) as Level[];

  return (
    <div className="app">
      {screen === 'home' && (
        <Home
          premium={premium}
          savedGame={loadSavedGame()}
          onContinue={(game) => {
            setMode(game.mode);
            setLevels(game.levels);
            setSober(game.sober);
            setResume(game);
            go('game');
          }}
          onPlay={() => go(players.length >= 2 ? 'setup' : 'players')}
          onPlayers={() => go('players')}
          onPremium={() => setPaywallOpen(true)}
          onSettings={() => setSettingsOpen(true)}
        />
      )}
      {screen === 'players' && (
        <Players players={players} onChange={setPlayers} onBack={back} onNext={() => go('setup')} />
      )}
      {screen === 'setup' && (
        <Setup
          mode={mode}
          levels={playableLevels}
          unlocked={unlocked}
          sober={sober}
          players={players}
          onMode={setMode}
          onLevels={setLevels}
          onSober={setSober}
          onLocked={() => setPaywallOpen(true)}
          onPlayers={() => go('players')}
          onBack={back}
          onStart={() => {
            setResume(null);
            go('game');
          }}
        />
      )}
      {screen === 'game' && (
        <Game
          mode={mode}
          levels={playableLevels}
          players={players}
          sober={sober}
          disliked={disliked}
          voice={voice}
          onSettings={() => setSettingsOpen(true)}
          resume={resume}
          premium={premium || sessionUnlocked}
          onPremium={() => setPaywallOpen(true)}
          onDislike={(id) => {
            dislike(disliked, id);
            refresh();
          }}
          onExit={back}
        />
      )}

      {settingsOpen && (
        <Settings
          inGame={screen === 'game'}
          premium={premium}
          sober={sober}
          haptics={haptics}
          sounds={sounds}
          onSounds={setSounds}
          voice={voice}
          onVoice={setVoice}
          disliked={disliked}
          onClearDisliked={() => {
            clearDisliked(disliked);
            refresh();
          }}
          onSober={setSober}
          onHaptics={setHaptics}
          onRestored={() => setPremium(true)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {paywallOpen && (
        <Paywall
          onClose={() => setPaywallOpen(false)}
          onPurchased={() => {
            setPremium(true);
            setPaywallOpen(false);
          }}
          onRewarded={() => {
            setSessionUnlocked(true);
            setPaywallOpen(false);
          }}
        />
      )}
      {!adult && <AgeGate onConfirm={() => setAdult(true)} />}
    </div>
  );
}
