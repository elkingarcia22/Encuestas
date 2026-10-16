import { useEffect, useState } from 'react'

// Un valor que espera una pausa de escritura antes de cambiar. La tarjeta destapa sus pasos con él: si cada tecla
// destapara el siguiente, «¿Cómo se mide?» saltaría a la vista a mitad de la primera palabra. Con espera 0 sigue al
// valor sin demora (la IA llena la tarjeta con sus propias pausas y no hace falta sumarle otra).

/** La pausa de inactividad antes de destapar el siguiente paso: la del prototipo. */
export const PAUSA_PASO = 450

export function useDiferido<T>(valor: T, espera: number): T {
  const [diferido, setDiferido] = useState(valor)
  useEffect(() => {
    // Sin espera también se guarda (al instante), para que al volver a esperar no reaparezca un valor viejo.
    const reloj = window.setTimeout(() => setDiferido(valor), Math.max(0, espera))
    return () => window.clearTimeout(reloj)
  }, [valor, espera])
  return espera <= 0 ? valor : diferido
}
