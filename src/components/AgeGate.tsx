export default function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-emoji">🔞</div>
        <h2>¿Eres mayor de edad?</h2>
        <p className="muted">
          Este juego es para mayores de 18 años. Bebe con responsabilidad: nadie está obligado a beber y siempre
          podéis cambiar los tragos por otra penitencia.
        </p>
        <button className="btn btn-primary" onClick={onConfirm}>
          Sí, tengo +18
        </button>
        <a className="btn btn-ghost" href="https://www.google.com">
          No, salir
        </a>
      </div>
    </div>
  );
}
