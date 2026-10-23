import { useState } from 'react';
import { PREMIUM_PRICE, purchasePremium, showRewardedAd } from '../monetization';

interface Props {
  onClose: () => void;
  onPurchased: () => void;
  onRewarded: () => void;
}

export default function Paywall({ onClose, onPurchased, onRewarded }: Props) {
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<boolean>, ok: () => void) => {
    setBusy(true);
    try {
      if (await fn()) ok();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-emoji">🌶️💀</div>
        <h2>Desbloquea Picante y Extremo</h2>
        <ul className="perks">
          <li>Todas las cartas de los niveles Picante y Extremo</li>
          <li>Sin anuncios</li>
          <li>Todos los packs nuevos que salgan</li>
        </ul>
        <button className="btn btn-primary" disabled={busy} onClick={() => run(purchasePremium, onPurchased)}>
          Desbloquear todo · {PREMIUM_PRICE}
        </button>
        <button className="btn btn-secondary" disabled={busy} onClick={() => run(showRewardedAd, onRewarded)}>
          Ver un anuncio (solo esta partida)
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
