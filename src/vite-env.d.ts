/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' = todo gratis (sin muro de pago ni anuncios). */
  readonly VITE_FREE_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
