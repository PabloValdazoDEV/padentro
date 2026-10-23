// Modo sin alcohol: convierte las órdenes de beber en penitencias.
// Lo usan la app y scripts/validate-content.mjs, por eso es JS plano.

const VERBS = { bebe: 'cumple', bebes: 'cumples', beben: 'cumplen' };
const like = (word, original) => (original[0] === original[0].toUpperCase() ? word[0].toUpperCase() + word.slice(1) : word);

export function soberize(text) {
  return text
    .replace(/\breparte (un|\d+) tragos?\b/gi, (m, n) =>
      `${like('reparte', m)} ${n === 'un' ? 'una penitencia' : `${n} penitencias`}`,
    )
    .replace(/\b(bebe|bebes|beben)(?: (?:un|\d+) tragos?)?\b/gi, (m, v) => `${like(VERBS[v.toLowerCase()], m)} penitencia`)
    .replace(/\bmandar beber\b/gi, 'mandar una penitencia');
}

/**
 * true si después de soberize() queda alguna orden de beber sin convertir.
 * Las formas descriptivas ("has bebido", "bebiendo") no cuentan.
 */
export const mentionsAlcohol = (text) => /\b(beb(e|es|en|er|a|as|an|ed)|tragos?)\b/i.test(text);
