import { useRef, useState, type ReactNode } from 'react';
import { haptic } from '../haptics';

const THRESHOLD = 90; // px para dar la carta por pasada
const FLICK_SPEED = 0.6; // px/ms: un gesto rápido cuenta aunque sea corto

interface Props {
  /** Dedo hacia la izquierda (siguiente). */
  onSwipeLeft: () => void;
  /** Dedo hacia la derecha (anterior). Sin handler, la carta vuelve a su sitio. */
  onSwipeRight?: () => void;
  children: ReactNode;
}

/** Carta que se arrastra en horizontal; al soltarla lejos (o con un gesto rápido) sale volando en esa dirección. */
export default function SwipeCard({ onSwipeLeft, onSwipeRight, children }: Props) {
  const start = useRef<{ x: number; t: number } | null>(null);
  const passed = useRef(false);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState(0);

  const release = (x: number) => {
    if (!start.current) return;
    const dist = x - start.current.x;
    const speed = Math.abs(dist) / (performance.now() - start.current.t);
    start.current = null;
    const dir = Math.sign(dist);
    const handler = dir < 0 ? onSwipeLeft : onSwipeRight;
    if (handler && (Math.abs(dist) > THRESHOLD || (Math.abs(dist) > 30 && speed > FLICK_SPEED))) {
      setLeaving(dir);
      setDx(dir * window.innerWidth * 1.2);
      setTimeout(handler, 220);
    } else {
      setDx(0);
    }
  };

  return (
    <div
      className={`swipe ${start.current ? 'dragging' : ''}`}
      style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, opacity: leaving ? 0 : 1 }}
      onPointerDown={(e) => {
        if (leaving || (e.target as HTMLElement).closest('button')) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, t: performance.now() };
        passed.current = false;
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const d = e.clientX - start.current.x;
        setDx(d);
        if (!passed.current && Math.abs(d) > THRESHOLD) {
          passed.current = true;
          haptic();
        }
      }}
      onPointerUp={(e) => release(e.clientX)}
      onPointerCancel={() => {
        start.current = null;
        setDx(0);
      }}
    >
      {children}
    </div>
  );
}
