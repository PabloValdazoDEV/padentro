import { Capacitor } from '@capacitor/core';
import { load, save } from './storage';

/**
 * Pide valoración en la tienda al acabar una partida larga (el mejor momento: se lo acaban de pasar bien).
 * Apple y Google limitan cuántas veces se muestra; aun así lo pedimos como mucho una vez cada 30 días.
 * TODO(capacitor): @capacitor-community/in-app-review → InAppReview.requestReview()
 */
export function maybeRequestReview(cardsPlayed: number) {
  if (!Capacitor.isNativePlatform() || cardsPlayed < 25) return;
  const last = load('reviewAskedAt', 0);
  if (Date.now() - last < 30 * 24 * 60 * 60 * 1000) return;
  save('reviewAskedAt', Date.now());
}
