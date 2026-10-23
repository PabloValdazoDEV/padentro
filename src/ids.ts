/** crypto.randomUUID solo existe en contextos seguros (https); en la red local por http no. */
export const newId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
