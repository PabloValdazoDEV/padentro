/**
 * Capa de monetización.
 *
 * Hoy (web) es un stub: en desarrollo la compra se simula y los anuncios no se muestran.
 * Al empaquetar con Capacitor se sustituye por:
 *   - Compras: RevenueCat (@revenuecat/purchases-capacitor), producto "premium_unlock" (no consumible).
 *   - Anuncios: AdMob (@capacitor-community/admob), intersticial + recompensado.
 * El resto de la app solo usa estas funciones, así que no hay que tocar las pantallas.
 */
import { Capacitor } from '@capacitor/core';
import { load, save } from '../storage';

export const PREMIUM_PRICE = '3,99 €';
/**
 * Nunca hay anuncios en mitad de la partida: corta el rollo y da malas reseñas.
 * El intersticial sale solo al salir de una partida en la que se han jugado al menos estas cartas.
 */
export const INTERSTITIAL_MIN_CARDS = 20;

const isNative = () => Capacitor.isNativePlatform();

export function isPremium(): boolean {
  return load('premium', false);
}

export async function purchasePremium(): Promise<boolean> {
  if (isNative()) {
    // TODO(capacitor): Purchases.purchaseStoreProduct(...) y comprobar el entitlement "premium".
    return false;
  }
  if (import.meta.env.DEV) {
    save('premium', true);
    return true;
  }
  alert('El pack premium estará disponible en la app de iOS y Android.');
  return false;
}

export async function restorePurchases(): Promise<boolean> {
  if (isNative()) {
    // TODO(capacitor): Purchases.restorePurchases()
    return false;
  }
  return isPremium();
}

/** Anuncio recompensado: si el usuario lo ve entero, desbloquea premium solo para esta partida. */
export async function showRewardedAd(): Promise<boolean> {
  if (isNative()) {
    // TODO(capacitor): AdMob.prepareRewardVideoAd + AdMob.showRewardVideoAd
    return false;
  }
  return import.meta.env.DEV;
}

export async function showInterstitial(): Promise<void> {
  if (isPremium() || !isNative()) return;
  // TODO(capacitor): AdMob.prepareInterstitial + AdMob.showInterstitial
}
