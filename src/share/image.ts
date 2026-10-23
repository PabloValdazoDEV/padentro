import { APP } from '../../app.config';

/** Imágenes en formato story (1080×1920) para compartir en Instagram/TikTok. */
const W = 1080;
const H = 1920;
const FONT = '-apple-system, "SF Pro Rounded", system-ui, "Segoe UI", Roboto, sans-serif';

function canvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0b0614';
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, color] of [
    [0, 0, '#ff4d8d40'],
    [W, H, '#a855ff48'],
  ] as const) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 1100);
    g.addColorStop(0, color);
    g.addColorStop(1, '#0b061400');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  return { c, ctx };
}

function logo(ctx: CanvasRenderingContext2D, y: number) {
  ctx.font = `900 110px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  const [a, b] = APP.logo;
  const wa = ctx.measureText(a).width;
  const x = (W - wa - ctx.measureText(b).width) / 2;
  ctx.fillStyle = '#fbf7ff';
  ctx.textAlign = 'left';
  ctx.fillText(a, x, y);
  ctx.shadowColor = '#ff4d8d';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ff4d8d';
  ctx.fillText(b, x + wa, y);
  ctx.shadowBlur = 0;
}

function footer(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = `700 46px ${FONT}`;
  ctx.fillStyle = '#a99bc2';
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, H - 170);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));

export function cardImage(card: { kind: string; level: string; color: string; text: string }): Promise<Blob> {
  const { c, ctx } = canvas();
  logo(ctx, 300);

  const x = 90;
  const y = 440;
  const w = W - 180;
  const h = 1000;
  ctx.shadowColor = card.color;
  ctx.shadowBlur = 70;
  roundRect(ctx, x, y, w, h, 64);
  ctx.fillStyle = '#1d1230';
  ctx.fill();
  ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `${card.color}33`);
  g.addColorStop(0.6, `${card.color}00`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = card.color;
  ctx.stroke();

  ctx.font = `800 40px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = card.color;
  ctx.fillText(card.kind.toUpperCase(), x + 70, y + 110);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#a99bc2';
  ctx.fillText(card.level.toUpperCase(), x + w - 70, y + 110);

  // El tamaño de letra baja hasta que el texto cabe en la carta.
  let size = 80;
  let lines: string[];
  do {
    ctx.font = `800 ${size}px ${FONT}`;
    lines = wrap(ctx, card.text, w - 140);
    size -= 4;
  } while (lines.length * size * 1.25 > h - 260 && size > 36);
  const lineHeight = (size + 4) * 1.25;
  const top = y + 150 + (h - 220 - lines.length * lineHeight) / 2 + lineHeight * 0.8;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbf7ff';
  lines.forEach((l, i) => ctx.fillText(l, x + 70, top + i * lineHeight));

  footer(ctx, `¿Te atreves? Juega en ${APP.name} 🍻`);
  return toBlob(c);
}

export function summaryImage(s: { cards: number; minutes: number; mode: string; players: string[]; star?: string }) {
  const { c, ctx } = canvas();
  logo(ctx, 300);
  ctx.textAlign = 'center';
  ctx.font = `800 64px ${FONT}`;
  ctx.fillStyle = '#fbf7ff';
  ctx.fillText('Nuestra partida', W / 2, 520);
  ctx.font = `700 44px ${FONT}`;
  ctx.fillStyle = '#a99bc2';
  ctx.fillText(s.mode, W / 2, 595);

  const stats = [
    [String(s.cards), 'cartas', '#ffd23f'],
    [s.minutes >= 60 ? `${Math.floor(s.minutes / 60)}h ${s.minutes % 60}m` : `${s.minutes} min`, 'jugando', '#3ef0c1'],
  ] as const;
  stats.forEach(([value, label, color], i) => {
    const cx = W / 2 + (i === 0 ? -230 : 230);
    ctx.font = `900 150px ${FONT}`;
    ctx.fillStyle = color;
    ctx.fillText(value, cx, 860);
    ctx.font = `700 44px ${FONT}`;
    ctx.fillStyle = '#a99bc2';
    ctx.fillText(label, cx, 930);
  });

  if (s.star) {
    ctx.font = `700 44px ${FONT}`;
    ctx.fillStyle = '#a99bc2';
    ctx.fillText('Quien más ha salido', W / 2, 1110);
    ctx.font = `900 96px ${FONT}`;
    ctx.fillStyle = '#ff4d8d';
    ctx.fillText(`👑 ${s.star}`, W / 2, 1220);
  }

  ctx.font = `700 46px ${FONT}`;
  ctx.fillStyle = '#fbf7ff';
  wrap(ctx, s.players.join(' · '), W - 200).forEach((l, i) => ctx.fillText(l, W / 2, 1420 + i * 62));

  footer(ctx, `Jugad en ${APP.name} 🍻`);
  return toBlob(c);
}

/**
 * Abre el menú de compartir del móvil con la imagen. Devuelve false si no se puede
 * (p. ej. por http en la red local), para mostrar la imagen y que se guarde a mano.
 * TODO(capacitor): en la app nativa usar @capacitor/share con el archivo guardado en Filesystem.
 */
export async function shareImage(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file] });
  } catch (e) {
    if ((e as Error).name !== 'AbortError') return false;
  }
  return true;
}
