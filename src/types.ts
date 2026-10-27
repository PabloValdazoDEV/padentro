export type Level = 1 | 2 | 3 | 4 | 5;

/** Tipo de carta. Cada uno vive en su propio JSON dentro de src/content/<idioma>/ */
export type CardKind =
  | 'verdad'
  | 'reto'
  | 'yo-nunca'
  | 'mas-probable'
  | 'todos'
  | 'duelo'
  | 'regla';

export interface RawCard {
  id: string;
  level: Level;
  text: string;
  /** Solo tiene sentido bebiendo (brindis, cascada...): no sale en modo sin alcohol. */
  alcohol?: boolean;
}

export interface Card extends RawCard {
  kind: CardKind;
}

export type ModeId = 'verdad-reto' | 'yo-nunca' | 'mas-probable' | 'mixto';

export interface Player {
  id: string;
  name: string;
}
