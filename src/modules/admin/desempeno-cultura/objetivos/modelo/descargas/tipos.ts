import type { IconSvgElement } from '@hugeicons/react'
import { ChartLineData02Icon, File02Icon, Table01Icon, UserAccountIcon } from '@hugeicons/core-free-icons'
import type { Corte } from '../resultados/lecturas'
import { resumir, type PersonaSeguida, type ResultadosCiclo } from '../resultados/seguimiento'

// Los reportes de un ciclo (portados del prototipo «configuración objetivos», 21-oct), con el molde de las descargas de
// Encuestas: cada reporte es un tipo con su formato, se arma con un pedido (a quién cubre, qué niveles, qué bloques) y
// se prepara en el centro de descargas. Excel para los datos que se cruzan en una hoja; PDF para leer y firmar.

export type TipoReporte = 'detalle' | 'estado' | 'progreso' | 'individual'

export const TIPOS_REPORTE: readonly { id: TipoReporte; titulo: string; descripcion: string; formato: 'XLSX' | 'PDF'; icono: IconSvgElement; slug: string; prepararMs: number }[] = [
  { id: 'detalle', titulo: 'Detalle del ciclo', descripcion: 'Excel con una fila por objetivo de cada persona: peso, medida, cumplimiento y estado.', formato: 'XLSX', icono: Table01Icon, slug: 'detalle-ciclo', prepararMs: 2600 },
  { id: 'estado', titulo: 'Estado por colaborador', descripcion: 'Excel con una fila por persona: avance, nivel, objetivos cumplidos y último reporte.', formato: 'XLSX', icono: File02Icon, slug: 'estado-colaboradores', prepararMs: 2400 },
  { id: 'progreso', titulo: 'Progreso del ciclo', descripcion: 'PDF para leer: cifras del ciclo, niveles, estado de los objetivos y avance por grupo.', formato: 'PDF', icono: ChartLineData02Icon, slug: 'progreso-ciclo', prepararMs: 4200 },
  { id: 'individual', titulo: 'Reporte individual', descripcion: 'PDF con una hoja por persona: su avance, sus objetivos y el espacio para firmar.', formato: 'PDF', icono: UserAccountIcon, slug: 'reporte-individual', prepararMs: 5200 },
]
export const tipoReporte = (id: TipoReporte) => TIPOS_REPORTE.find((tipo) => tipo.id === id) ?? TIPOS_REPORTE[0]

/** A quién cubre el reporte: todo el ciclo, unas personas elegidas o los grupos de un corte. */
export type Alcance = 'todos' | 'personas' | 'grupos'

/** Los bloques de la hoja del reporte individual. Los datos de la persona y del ciclo van siempre: son el documento. */
export type BloqueCarta = 'avance' | 'objetivos' | 'firmas'
export const BLOQUES_CARTA: readonly { id: BloqueCarta; titulo: string; descripcion: string }[] = [
  { id: 'avance', titulo: 'Avance y nivel de desempeño', descripcion: 'Su avance, su nivel y cuántos objetivos lleva.' },
  { id: 'objetivos', titulo: 'Detalle por objetivo', descripcion: 'Cada objetivo con su peso, su medida, su cumplimiento y su estado.' },
  { id: 'firmas', titulo: 'Firmas', descripcion: 'Firma del líder y espacio para la de la persona.' },
]

export interface PedidoReporte {
  tipo: TipoReporte
  alcance: Alcance
  /** Ids de las personas (con `alcance: 'personas'`). */
  personas: readonly string[]
  corte: Corte
  /** Los grupos del corte (con `alcance: 'grupos'`). */
  grupos: readonly string[]
  /** Los niveles que entran (ids); vacío, todos. */
  niveles: readonly string[]
  bloques: readonly BloqueCarta[]
}

export interface Descarga {
  id: string
  tipo: TipoReporte
  archivo: string
  estado: 'preparando' | 'lista'
  /** 0–100 mientras se prepara. */
  avance: number
  /** Si el archivo llegó de verdad al navegador; solo queda en false si el navegador lo bloqueó. */
  entregado: boolean
  entregar: () => boolean
  pedido: PedidoReporte
}

/** Las personas que entran al reporte según el pedido. */
export function personasDelPedido(r: ResultadosCiclo, pedido: PedidoReporte): readonly PersonaSeguida[] {
  const elegidas = new Set(pedido.personas)
  const grupos = new Set(pedido.grupos)
  const niveles = new Set(pedido.niveles)
  return r.personas.filter((persona) => {
    if (pedido.alcance === 'personas' && !elegidas.has(persona.id)) return false
    if (pedido.alcance === 'grupos' && !grupos.has(persona.colaborador[pedido.corte] ?? 'Sin líder')) return false
    if (niveles.size > 0 && !niveles.has(persona.nivel.id)) return false
    return true
  })
}

/** Las cifras del reporte sobre las personas del pedido (las mismas cuentas que la pantalla). */
export const resultadosDelPedido = (r: ResultadosCiclo, pedido: PedidoReporte): ResultadosCiclo => resumir(r.ciclo, personasDelPedido(r, pedido))
