# Padentro (nombre provisional): plan del proyecto

## Decisiones tomadas

| Tema         | Decisión                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| Plataforma   | Web (PWA) → iOS y Android con **Capacitor**, con un solo código          |
| Stack        | React 19 + Vite + TypeScript, sin backend; todo el contenido va en JSON  |
| Modos        | Verdad o Reto, Yo nunca, ¿Quién es más probable?, Ronda mixta            |
| Niveles      | Suave · Fiesta (gratis) · Picante · Extremo (premium)                    |
| "Picante"    | Íntimo y comprometido, **nunca sexual** (facilita la aprobación en las tiendas) |
| Jugadores    | Solo nombre, guardados en el dispositivo                                 |
| Idioma       | Español; la estructura `src/content/<idioma>/` permite añadir más        |
| Público      | 18–30 años, España                                                       |
| Monetización | Freemium (pago único) + anuncios para quien no paga                     |

## Hoja de ruta

### Fase 1: MVP web ✅
- 4 modos, 4 niveles, jugadores, confirmación de +18, muro de pago (simulado en desarrollo).
- ~180 cartas de ejemplo.
- Scripts `validate` e `import` para el contenido de Grok.

### Fase 2: contenido
- Llegar a unas 1.250 cartas con Grok (ver [GROK.md](GROK.md)), revisadas a mano.
- Que lo de pago sea lo mejor: Picante y Extremo con más cartas y más cuidadas.

### Fase 3: pulir la experiencia (en curso)
Hecho:
- ✅ **Modo sin alcohol**: selector en "Elige el juego" y en Ajustes. Los tragos pasan a penitencias, en Yo nunca se baja un dedo, y las cartas que solo funcionan bebiendo no salen.
- ✅ Botón **Penitencia / No bebo** en cada carta: nadie está obligado a beber (esto ayuda en la revisión de Apple).
- ✅ **Deslizar la carta** para pasar, o botón Siguiente.
- ✅ **Vibración** con interruptor en Ajustes. Funciona en Android y en la app nativa; Safari de iPhone no permite vibrar desde la web.
- ✅ Hecho para móvil: el botón/gesto **atrás** vuelve a la pantalla anterior, la pantalla no se apaga durante la partida (solo en https o en la app), no hay zoom con doble toque, se usa el alto real de pantalla y el botón Empezar queda fijo abajo.

Pendiente:
- Añadir o quitar jugadores sin salir de la partida.
- "Esta carta no me gusta" (para no volver a mostrarla).
- Pantalla de cómo se juega en cada modo.
- Icono y splash definitivos (cuando haya nombre).

### Fase 4: apps nativas
Requisito: **Node 22** (Capacitor 8 lo exige; ahora tienes Node 20).

```bash
# 1. Actualizar Node (con nvm)
nvm install 22 && nvm use 22

# 2. Capacitor
npm i @capacitor/core@8 @capacitor/ios@8 @capacitor/android@8
npm i -D @capacitor/cli@8
npx cap init "<nombre>" com.tunombre.<nombre> --web-dir dist
npx cap add ios
npx cap add android

# 3. Plugins
npm i @revenuecat/purchases-capacitor @capacitor-community/admob \
      @capacitor/haptics @capacitor/status-bar @capacitor/splash-screen

# 4. Cada vez que cambies algo
npm run build && npx cap sync
npx cap open ios       # Xcode (necesitas un Mac, que ya tienes)
npx cap open android   # Android Studio
```

**Compartir directo a Instagram Stories** (como Spotify): en nativo se abre Instagram con la carta ya
puesta en la story. Necesita un App ID de Meta (gratis en developers.facebook.com) y un plugin de
Capacitor para "Sharing to Stories". En la web solo existe el menú de compartir del sistema (requiere https).

Luego se rellenan los `TODO(capacitor)` de `src/monetization/index.ts`. **El resto de la app no hay que tocarlo.**

### Fase 5: lanzamiento
- Web gratis en Vercel, Netlify o Cloudflare Pages (`npm run build` → carpeta `dist`).
- Fichas de App Store y Google Play.
- Marketing (ver abajo).

## Monetización

### Modelo
| Usuario  | Qué tiene                                                                    |
| -------- | ---------------------------------------------------------------------------- |
| Gratis   | Suave + Fiesta, todos los modos. Un intersticial al salir de la partida (nunca en mitad). |
| Anuncio  | Ver un anuncio recompensado desbloquea Picante y Extremo **solo esa partida**. |
| Premium  | Pago único **3,99 €**: todo el contenido, sin anuncios, packs futuros incluidos. |

Por qué así:
- Este tipo de apps se usan en grupo y de forma esporádica, y la suscripción suele tener muchos rechazos y reseñas malas. Un pago único bajo se convierte mejor.
- El anuncio recompensado deja que el grupo pruebe lo de pago. Si les gusta, alguien paga el desbloqueo para la siguiente fiesta.
- Más adelante se pueden vender **packs temáticos** (Navidad, Despedidas, Parejas, Universidad) a 1,99 € cada uno, o subir el precio del premium.

Todo esto se ajusta en `src/monetization/index.ts` (`PREMIUM_PRICE`, `INTERSTITIAL_MIN_CARDS`) y en `premium` de `src/content/levels.ts`.

### Herramientas
- **RevenueCat** para las compras dentro de la app en iOS y Android. Gestiona recibos, restaurar compras y estadísticas sin backend propio. Gratis hasta 2.500 $ de ingresos al mes.
- **AdMob** para los anuncios (intersticial + recompensado). Hay que revisar sus políticas sobre contenido relacionado con alcohol: puede que haya menos anunciantes y se gane menos por anuncio.
- **Web**: se queda gratis y sirve para atraer gente, con un aviso de "Descarga la app para desbloquear Picante y Extremo". Si más adelante quieres cobrar en la web sin backend, Lemon Squeezy tiene claves de licencia que se validan desde el navegador.

### Costes
- Apple Developer Program: 99 $/año.
- Google Play Console: 25 $ una sola vez.
- Comisión de las tiendas: 15 % si facturas menos de 1 M$/año (Apple Small Business Program / Google).
- Dominio para la web: ~10 €/año (opcional).
- Fiscalidad: los ingresos de las tiendas hay que declararlos. Consúltalo con un gestor (alta de autónomo, IVA en ventas a la UE, etc.).

## Revisión de tiendas: puntos clave

- **Apple 1.4.3**: no puede fomentar el consumo excesivo de alcohol. Por eso las cartas piden como mucho X tragos, nunca "bébete el vaso", y hay mensajes de "bebe con responsabilidad". El modo sin alcohol ayuda mucho.
- **Apple 4.2 (funcionalidad mínima)**: una web metida en una app se rechaza si se nota que es una web. Hay que funcionar sin conexión (ya lo hace: el contenido va dentro), usar vibración, que no haya enlaces externos, etc.
- **Clasificación por edad**: 18+ en Apple (referencias frecuentes al alcohol) y "Mature/PEGI 18" en Google Play.
- **Sin contenido sexual**: con "picante = íntimo" no tienes problemas con eso.
- **Restaurar compras**: obligatorio en iOS (ya está el botón).
- Necesitas una **política de privacidad** pública (una página simple sirve: no recoges datos, salvo los de AdMob/RevenueCat).

## Marketing (18–30)

- **TikTok / Instagram Reels**: es el canal principal para este público. Graba vídeos de grupos reaccionando a cartas de Extremo ("la carta que rompió mi grupo de amigos"). Las cartas en sí son el contenido viral.
- **ASO** (palabras clave en las tiendas): "juegos para beber", "verdad o reto", "yo nunca", "juegos de fiesta", "previa".
- Pantalla final de partida con botón para compartir la app.
- Hacerlo bien en España primero y después traducir (inglés, México/Argentina con variantes).

## Nombres (revisados el 23/10/2026)

Se ha buscado en App Store España, Google Play España, marcas conocidas y dominios. **Falta comprobar
OEPM y EUIPO** (clases 9 y 41) antes de registrar nada.

| Nombre        | Qué hay ya                                                                          | Riesgo   |
| ------------- | ----------------------------------------------------------------------------------- | -------- |
| **Padentro**  | No hay apps ni marcas. padentro.es en uso, .com aparcado, .app sin uso aparente.    | Bajo ✅  |
| **Ni de Coña**| No hay apps ni marcas. nidecona.com parece libre.                                   | Bajo ✅  |
| **Cogorza**   | No hay apps ni marcas. .es y .app parecen libres. Habla de emborracharse sin rodeos: ojo con Apple y anuncios. | Bajo ✅ |
| **Melopea**   | No hay apps ni marcas. .com en uso.                                                 | Bajo     |
| Otra Ronda    | "Ronda" y "La Ronda" en Play (mismo género), la película *Druk* y una cerveza chilena. | Medio  |
| Al Centro     | Muy genérico, difícil de registrar como marca. Vale como nombre de modo.            | Medio    |
| La Previa     | Ya existen "La Previa: Juego de Fiesta", "Sale Previa", "PreviaON", "Previa Go"…   | Alto ❌  |
| Sin Filtro    | Ya existe "Sin Filtro: Party Game" en Play.                                         | Alto ❌  |
| Chupito       | Ya existe "CHUPITO - Juegos para Beber" (100 mil+ descargas).                       | Alto ❌  |

Competencia principal en España: Picolo (5 M+), La Guatoca, Tomanji, A Beber (1 M+ cada una).

Idea: usar el brindis "arriba, abajo, **al centro y pa' dentro**". **Padentro** como nombre de la app
y **Al Centro** como nombre de la ronda mixta.
