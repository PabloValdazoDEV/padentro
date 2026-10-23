import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { load } from './storage';

const STYLES = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };

/**
 * Vibración. En la app nativa usa el motor háptico; en web cae a navigator.vibrate
 * (Android sí; Safari de iPhone no permite vibrar desde la web).
 */
export function haptic(strength: keyof typeof STYLES = 'light') {
  if (!load('haptics', true)) return;
  Haptics.impact({ style: STYLES[strength] }).catch(() => {});
}
