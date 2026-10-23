import { useEffect, useState } from 'react';
import { siInstagram, siTelegram, siTiktok, siWhatsapp, siX, type SimpleIcon } from 'simple-icons';
import { haptic } from '../haptics';
import { shareImage } from '../share/image';

interface Props {
  title: string;
  /** Texto para las redes que comparten texto (WhatsApp, Telegram, X). */
  text: string;
  /** Imagen para las que comparten imagen (Instagram, TikTok). */
  image: () => Promise<Blob>;
  filename: string;
  onClose: () => void;
}

const open = (url: string) => window.open(url, '_blank', 'noopener');

export default function ShareSheet({ title, text, image, filename, onClose }: Props) {
  // La imagen se prepara al abrir: si se generase al pulsar, el móvil podría bloquear el menú de compartir.
  const [blob, setBlob] = useState<Blob>();
  const [preview, setPreview] = useState<string>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void image().then(setBlob);
    // Una sola vez al abrir el panel.
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const shareAsImage = async () => {
    haptic();
    if (!blob) return;
    if (!(await shareImage(blob, filename))) setPreview(URL.createObjectURL(blob));
  };

  const networks: { icon: SimpleIcon; label: string; action: () => void }[] = [
    { icon: siInstagram, label: 'Instagram', action: shareAsImage },
    { icon: siTiktok, label: 'TikTok', action: shareAsImage },
    { icon: siWhatsapp, label: 'WhatsApp', action: () => open(`https://wa.me/?text=${encodeURIComponent(text)}`) },
    { icon: siTelegram, label: 'Telegram', action: () => open(`https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(text)}`) },
    { icon: siX, label: 'X', action: () => open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`) },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* sin portapapeles: no hacemos nada */
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <h2>{title}</h2>

        {preview ? (
          <>
            <img className="share-preview" src={preview} alt="Imagen para compartir" />
            <p className="muted">Mantén pulsada la imagen para guardarla o compartirla en Instagram o TikTok.</p>
          </>
        ) : (
          <div className="networks">
            {networks.map((n) => (
              <button key={n.label} className="network" onClick={n.action} disabled={!blob && n.action === shareAsImage}>
                <span className="network-icon" style={{ background: `#${n.icon.hex}` }}>
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d={n.icon.path} fill="#fff" />
                  </svg>
                </span>
                <small>{n.label}</small>
              </button>
            ))}
          </div>
        )}

        <div className="share-extra">
          {typeof navigator.share === 'function' && (
            <button className="btn btn-secondary" onClick={shareAsImage}>
              Más opciones
            </button>
          )}
          {navigator.clipboard && (
            <button className="btn btn-secondary" onClick={copy}>
              {copied ? '✓ Copiado' : 'Copiar texto'}
            </button>
          )}
        </div>
        <button className="btn btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
