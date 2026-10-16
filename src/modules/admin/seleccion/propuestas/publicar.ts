import { avanceInformacion } from '../vacantes/crear/components/secciones-informacion'
import { pendienteEtapa } from '../vacantes/crear/components/etapas'
import { creacionDesdeVacante } from './desde-creacion'
import { HOY } from './creditos'
import type { VacanteUI } from './datos'

// Lo que le falta a una vacante para poder publicarla, con las mismas reglas de la creación por pasos: los obligatorios
// del paso 1, las secciones de la descripción del paso 2 y las etapas sin configurar del paso 3 (IN-04). Publicar desde
// la lista o desde la insignia de estado pasa por aquí: si falta algo, no se publica y se lleva al paso pendiente.

export type Falta = { paso: 1 | 2 | 3; texto: string }

export function faltaParaPublicar(vacante: VacanteUI): Falta[] {
  const nueva = creacionDesdeVacante(vacante)
  const faltas: Falta[] = []
  const info = avanceInformacion(nueva).falta
  if (info.length) faltas.push({ paso: 1, texto: info.length === 1 ? `Falta «${info[0]}»` : `Faltan ${info.length} datos de la información` })
  const secciones = nueva.secciones.filter((seccion) => !seccion.texto.trim())
  if (secciones.length) faltas.push({ paso: 2, texto: secciones.length === 1 ? 'Falta por escribir una sección de la descripción' : `Faltan por escribir ${secciones.length} secciones de la descripción` })
  const etapas = nueva.etapas.filter((etapa) => pendienteEtapa(etapa) !== null)
  if (etapas.length) faltas.push({ paso: 3, texto: etapas.length === 1 ? `Falta configurar «${etapas[0].nombre}»` : `Faltan configurar ${etapas.length} etapas` })
  return faltas
}

// El paso donde está lo primero que falta (para abrir la creación ahí, IN-23).
export const pasoPendiente = (vacante: VacanteUI) => faltaParaPublicar(vacante)[0]?.paso ?? 3

const FECHA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' })
const DIA = 24 * 60 * 60 * 1000

// «3 de septiembre»: la fecha de hoy en la maqueta, o de hace unos días.
export const fechaHace = (dias: number) => FECHA.format(new Date(HOY.getTime() - dias * DIA))
// La misma fecha en corto («7 de sept»), para una celda de tabla.
const FECHA_CORTA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
export const fechaCortaHace = (dias: number) => FECHA_CORTA.format(new Date(HOY.getTime() - dias * DIA))

// Cómo terminó una vacante al cerrarla (IN-09). Se guarda en `desenlace` con la misma forma de las cerradas de ejemplo:
// «Cerrada el 3 de septiembre · se contrató a Marcela Ríos».
export type ComoTermino = 'contrato' | 'congelo' | 'cancelo'

export const COMO_TERMINO: { valor: ComoTermino; texto: string; detalle: string }[] = [
  { valor: 'contrato', texto: 'Se contrató a alguien', detalle: 'El proceso terminó bien: la vacante se llenó.' },
  { valor: 'congelo', texto: 'La vacante se congeló', detalle: 'Se frena por ahora; se puede reabrir más adelante.' },
  { valor: 'cancelo', texto: 'Se canceló el cargo', detalle: 'El cargo ya no existe o se cubrió de otra forma.' },
]

export function desenlaceDe(como: ComoTermino, contratada?: string) {
  const fin = como === 'contrato' ? (contratada ? `se contrató a ${contratada}` : 'se contrató a una persona') : como === 'congelo' ? 'la vacante se congeló' : 'se canceló el cargo'
  return `Cerrada el ${fechaHace(0)} · ${fin}`
}
