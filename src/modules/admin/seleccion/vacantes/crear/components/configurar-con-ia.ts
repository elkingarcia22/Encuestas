import type { EtapaFlujo } from './etapas'
import { configurar } from './flujo-ia'
import { propuestaIa } from './propuesta-ia'

// «Configurar con IA» en la fila de una etapa (29 sep, reunión con Elkin: el botón de IA va afuera, junto a
// «Configurar», y no escondido en una pantalla dentro del configurador). Arma solo esa etapa con lo mismo que usa
// «Crear con IA» para la vacante entera: el cargo y lo que se deduce de él (área, si pide inglés, qué tan exigente es).
export function configurarConIa(etapa: EtapaFlujo, cargo: string): EtapaFlujo {
  const nombre = cargo.trim() || 'la vacante'
  const propuesta = propuestaIa(nombre)
  const area = propuesta.area ?? 'Operaciones'
  return configurar(etapa, {
    cargo: nombre,
    area,
    conIngles: propuesta.idiomas?.includes('Inglés') ?? false,
    conRolePlay: area === 'Ventas',
    exigente: (propuesta.experienciaDesde ?? 0) >= 6,
  })
}
