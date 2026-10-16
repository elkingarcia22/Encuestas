import { METRICAS, type Metrica } from '@/modules/design-system/templates/home-operativo/components/data'

// Periodos del Inicio del admin (1 oct, Charlie): últimos 30 y 90 días. Los 30 días son los del concepto de producto
// (home-operativo); los 90 días se suman aquí con la misma forma y las mismas ayudas.

export type PeriodoAdmin = '30' | '90'

export const PERIODOS_ADMIN: { valor: PeriodoAdmin; etiqueta: string }[] = [
  { valor: '30', etiqueta: 'Últimos 30 días' },
  { valor: '90', etiqueta: 'Últimos 90 días' },
]

const cifra = (n: number) => n.toLocaleString('es-CO')

// Serie de 90 puntos que sube con ondas suaves, como las minigráficas de los otros periodos (sin datos al azar).
function serie(base: number, amplitud: number, pendiente: number, fase: number) {
  return Array.from({ length: 90 }, (_, i) =>
    Math.round((base + amplitud * Math.sin((i + fase) / 6) + amplitud * 0.4 * Math.cos((i + fase) / 3.5) + pendiente * i) * 100) / 100,
  )
}

const [ingreso30, activos30, terminacion30] = METRICAS['30']

export const METRICAS_ADMIN: Record<PeriodoAdmin, Metrica[]> = {
  '30': METRICAS['30'],
  '90': [
    { ...ingreso30, valor: cifra(389), detalle: `de ${cifra(444)} usuarios registrados`, serie: serie(300, 8, 1, 1) },
    { ...activos30, valor: cifra(71), detalle: `de ${cifra(203)} con ingreso en el periodo`, serie: serie(48, 2.5, 0.25, 3) },
    { ...terminacion30, valor: '35,1 %', detalle: `${cifra(402)} contenidos finalizados`, serie: serie(30, 0.8, 0.06, 2) },
  ],
}
