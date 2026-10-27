import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { haptic } from '../haptics';

interface Props {
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

/** Lo que hay que arrastrar hacia abajo para cerrar. */
const CLOSE_DISTANCE = 90;

/**
 * Panel que sube desde abajo. Se cierra tocando fuera, tocando la barrita de arriba
 * o arrastrándolo hacia abajo (desde la barrita, o desde cualquier sitio si no tiene scroll).
 */
export default function Sheet({ onClose, className = '', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ y: number; t: number; grip: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dy, setDy] = useState(0);
  const [closing, setClosing] = useState(false);
  const [scrolls, setScrolls] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setScrolls(el.scrollHeight > el.clientHeight);
  });

  const close = () => {
    haptic();
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const release = () => {
    if (!start.current) return;
    const fast = dy > 30 && performance.now() - start.current.t < 250;
    const tap = start.current.grip && dy < 5;
    start.current = null;
    setDragging(false);
    if (dy > CLOSE_DISTANCE || fast || tap) close();
    else setDy(0);
  };

  return (
    <div
      className={`overlay ${closing ? 'closing' : ''}`}
      onClick={(e) => {
        // Los paneles pueden ir uno dentro de otro (compartir desde el fin de partida).
        e.stopPropagation();
        close();
      }}
    >
      <div
        ref={ref}
        className={`modal sheet ${className} ${dragging ? 'dragging' : ''}`}
        style={{
          transform: closing ? 'translateY(110%)' : dy ? `translateY(${dy}px)` : undefined,
          touchAction: scrolls ? undefined : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          const onGrip = !!target.closest('.sheet-grip');
          if (!onGrip && (scrolls || target.closest('button, a, input, textarea'))) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          start.current = { y: e.clientY, t: performance.now(), grip: onGrip };
          setDragging(true);
          setDy(0);
        }}
        onPointerMove={(e) => {
          if (start.current) setDy(Math.max(0, e.clientY - start.current.y));
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        {/* El toque lo resuelve release(); onClick solo cubre el teclado. */}
        <button className="sheet-grip" aria-label="Cerrar" onClick={(e) => e.detail === 0 && close()} />
        {children}
      </div>
    </div>
  );
}
