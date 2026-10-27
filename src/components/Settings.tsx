import { useRef, useState } from 'react';
import { dislikedReport } from '../game/disliked';
import { restorePurchases } from '../monetization';
import { speechSupported } from '../speech';
import Toggle from './Toggle';
import VoicePicker from './VoicePicker';
import Sheet from './Sheet';

interface Props {
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
  const { premium, sober, haptics, disliked, onSober, onHaptics, onRestored, onClose } = props;
  const report = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  // navigator.clipboard solo existe en https; por la IP de la red local usamos execCommand.
  const copy = async () => {
    const text = report.current?.value ?? '';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      report.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
  };

  return (
    <Sheet onClose={onClose}>
      <h2>Ajustes</h2>
      <div className="toggle-list">
        <Toggle
          label="Modo sin alcohol"
          description="Los tragos se cambian por penitencias"
          checked={sober}
          onChange={onSober}
        />
        <Toggle label="Vibración" checked={haptics} onChange={onHaptics} />
        <Toggle
          label="Efectos de sonido"
          description="No cortan la música que tengáis puesta"
          checked={props.sounds}
          onChange={props.onSounds}
        />
        {speechSupported && (
          <Toggle
            label="Leer las cartas en voz alta"
            description="También puedes tocar 🔊 en cada carta"
            checked={props.voice}
            onChange={props.onVoice}
          />
        )}
        {speechSupported && <VoicePicker />}
      </div>
      {disliked.size > 0 && (
        <div className="disliked">
          <strong>Cartas descartadas ({disliked.size})</strong>
          <textarea ref={report} readOnly value={dislikedReport(disliked)} rows={4} />
          <div className="disliked-actions">
            <button className="btn btn-secondary" onClick={copy}>
              {copied ? '✓ Copiado' : 'Copiar lista'}
            </button>
            <button className="btn btn-ghost" onClick={props.onClearDisliked}>
              Recuperarlas
            </button>
          </div>
        </div>
      )}
      {!premium && (
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
