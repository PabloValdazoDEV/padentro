# Padentro 🍻 (nombre provisional: se cambia en `app.config.ts`)

Juego para beber en grupo: Verdad o Reto, Yo nunca, ¿Quién es más probable? y Ronda mixta.
Web sin backend, preparada para empaquetarse como app de iOS y Android con Capacitor.

```bash
npm install
npm run dev        # http://localhost:5173 (en desarrollo, el pago premium se simula)
npm run build      # valida el contenido y genera dist/
npm run validate   # comprueba las cartas
npm run import -- <tipo> <archivo.json>   # importa cartas generadas por Grok
```

- Plan, monetización y tiendas: [docs/PLAN.md](docs/PLAN.md)
- Cómo generar cartas con Grok: [docs/GROK.md](docs/GROK.md)

## Estructura

```
src/
  content/es/*.json     cartas (una por tipo)
  content/levels.ts     niveles y cuáles son premium
  content/modes.ts      modos de juego y textos de cada tipo de carta
  game/deck.ts          barajado sin repeticiones y sustitución de {jugador}/{otro}
  monetization/         compras y anuncios (stub web; RevenueCat/AdMob en nativo)
  screens/              Home, Players, Setup, Game
  components/           AgeGate, Paywall
scripts/                validar e importar contenido
```
