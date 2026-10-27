import { restorePurchases } from '../monetization';
import { speechSupported } from '../speech';
import Toggle from './Toggle';
import VoicePicker from './VoicePicker';
import Sheet from './Sheet';

interface Props {
  /** En partida solo sale lo que se puede cambiar sobre la marcha (sonido, voz, vibración). */
  inGame?: boolean;
  premium: boolean;
  sober: boolean;
  haptics: boolean;
  sounds: boolean;
  onSounds: (v: boolean) => void;
  voice: boolean;
  onVoice: (v: boolean) => void;
  disliked: ReadonlySet<string>;
  onClearDisliked: () => void;
  onSober: (v: boolean) => void;
  onHaptics: (v: boolean) => void;
  onRestored: () => void;
  onClose: () => void;
}

export default function Settings(props: Props) {
  const { inGame, premium, sober, haptics, disliked, onSober, onHaptics, onRestored, onClose } = props;

  return (
    <Sheet onClose={onClose}>
      <h2>Ajustes</h2>
      <div className="toggle-list">
        {!inGame && (
          <Toggle
            label="Modo sin alcohol"
            description="Los tragos se cambian por penitencias"
            checked={sober}
            onChange={onSober}
          />
        )}
        <Toggle
          label="Efectos de sonido"
          description="No cortan la música que tengáis puesta"
          checked={props.sounds}
          onChange={props.onSounds}
        />
        {speechSupported && (
          <Toggle
            label="Leer las cartas en voz alta"
            description="Cada carta se lee sola al salir. Si no, toca 🔊 en la carta"
            checked={props.voice}
            onChange={props.onVoice}
          />
        )}
        {speechSupported && <VoicePicker />}
        <Toggle label="Vibración" checked={haptics} onChange={onHaptics} />
      </div>
      {!inGame && disliked.size > 0 && (
        <p className="disliked">
          Has descartado {disliked.size} {disliked.size === 1 ? 'carta' : 'cartas'} con 👎.{' '}
          <button className="link" onClick={props.onClearDisliked}>
            {disliked.size === 1 ? 'Recuperarla' : 'Recuperarlas'}
          </button>
        </p>
      )}
      {!inGame && !premium && (
        <button className="btn btn-secondary" onClick={async () => (await restorePurchases()) && onRestored()}>
          Restaurar compras
        </button>
      )}
      <button className="btn btn-ghost" onClick={onClose}>
        Cerrar
      </button>
    </Sheet>
  );
}
