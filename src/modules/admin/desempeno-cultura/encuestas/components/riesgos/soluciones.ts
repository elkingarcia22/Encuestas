import { Mail01Icon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import type { PlanConIa } from '@/modules/admin/tareas/components/plan-con-ia'
import type { RiskKind, SurveyRisk } from '../../modelo/riesgos'
import type { AccionEncuesta } from '../acciones'
import { parseSurveyDate } from '../../modelo/surveyListDates'

// Cómo se resuelve cada caso del panel de riesgos desde su panel lateral. Solo con lo que el módulo ya hace:
// - recordar a quienes faltan, de una en una o a todas (el mismo recordatorio de la tabla de Participación);
// - más días de cierre (lo mismo que editar la fecha de cierre en la lista);
// - una acción de la encuesta: finalizar, reabrir, editar, elegir participantes, copiar el enlace, reintentar la carga;
// - crear con IA un plan de acción (Tareas › Planes) para lo que hay que mejorar y, una vez creado, verlo ahí;
// - ir a la pestaña de Resultados que explica el caso. Donde el módulo solo deja leer (la canalización de la NOM 035,
//   el riesgo psicosocial, las preguntas con peor resultado, los comentarios), el detalle muestra qué hay que mirar
//   y el botón lleva ahí, sin inventar una acción que la pantalla de destino no tiene.

export type PestanaResultados = 'participation' | 'favorability' | 'questions' | 'nps' | 'ai' | 'actionables' | 'risk' | 'channeling'

export type Solucion =
  | { tipo: 'resultados'; pestana?: PestanaResultados }
  | { tipo: 'accion'; accion: AccionEncuesta; paso?: string }
  | { tipo: 'lista'; aviso: string; completa: boolean }
  | { tipo: 'extension'; nuevoCierre: string }
  | { tipo: 'planes'; nuevos: PlanConIa[]; elegido: string }

/** La acción de una lista: un botón por fila y uno para todas. */
export type ListaAccion = {
  icono: IconSvgElement
  /** El botón de cada fila. */
  individual: string
  /** El botón de la cabecera con filas marcadas; sin marcar, `todas`. */
  masiva: (cuantas: number) => string
  todas: string
  /** Lo que dice la fila cuando ya se hizo. */
  hecho: string
  aviso: (cuantas: number) => string
  /** Es una acción de IA: su botón es el de IA de la pantalla de crear. */
  ia?: boolean
  /** Con esto, la fila hecha ofrece ir a lo creado. */
  ver?: string
}

export type Manera = {
  texto: string
  /** Lo que se lista, con su nombre y su buscador. */
  lista?: { titulo: string; buscar: string; accion?: ListaAccion }
  /** Ofrece más días de cierre. */
  extension?: boolean
  /** La barra de participación contra la meta, arriba. */
  avance?: boolean
  /** El botón de pie. `resultados` lleva a la pestaña que explica el caso. */
  boton?: { etiqueta: string; accion: AccionEncuesta | 'resultados'; pestana?: PestanaResultados; /** Al editar, el paso del constructor que se abre. */ paso?: string }
}

const personas = (cuantas: number) => `${cuantas.toLocaleString('es-CO')} ${cuantas === 1 ? 'participante' : 'participantes'}`

const RECORDAR: ListaAccion = {
  icono: Mail01Icon,
  individual: 'Recordar',
  masiva: (cuantas) => `Recordar a ${cuantas}`,
  todas: 'Recordar a todas las personas',
  hecho: 'Recordatorio enviado',
  aviso: (cuantas) => `Recordatorio enviado a ${personas(cuantas)}. Les llega por correo y en su inicio de UBITS.`,
}

const crearPlanes = (cuantas: number) => `${cuantas.toLocaleString('es-CO')} ${cuantas === 1 ? 'plan creado' : 'planes creados'} con IA. Los ves en Tareas › Planes.`

const PLAN_IA: ListaAccion = {
  icono: Mail01Icon,
  individual: 'Crear plan con IA',
  masiva: (cuantas) => `Crear ${cuantas} ${cuantas === 1 ? 'plan' : 'planes'} con IA`,
  todas: 'Crear todos con IA',
  hecho: 'Plan creado',
  aviso: crearPlanes,
  ia: true,
  ver: 'Ver plan',
}

const FALTAN = { titulo: 'Quiénes faltan', buscar: 'Buscar por nombre, correo o área', accion: RECORDAR }
const FALTAN_EN_AREAS = { ...FALTAN, titulo: 'Quiénes faltan en esas áreas' }

export const MANERAS: Record<RiskKind, Manera> = {
  resultados: {
    texto: 'Crea con IA un plan de acción para las preguntas con peor resultado: queda en Tareas › Planes, con sus tareas listas para asignar. En Preguntas ves cómo se reparten las respuestas.',
    lista: { titulo: 'Preguntas con peor resultado', buscar: 'Buscar pregunta', accion: PLAN_IA },
    boton: { etiqueta: 'Ver preguntas', accion: 'resultados', pestana: 'questions' },
  },
  'meta-final': { texto: 'Ya casi no hay tiempo: recuerda a quienes faltan y, si hace falta, dale más días.', lista: FALTAN, extension: true, avance: true },
  'nom-canalizar': {
    texto: 'Estas personas reportaron un acontecimiento traumático severo y la norma obliga a canalizarlas a atención médica. La lista completa, por área y líder, está en la pestaña Canalización.',
    lista: { titulo: 'Personas por canalizar', buscar: 'Buscar por nombre o área' },
    boton: { etiqueta: 'Ver canalización', accion: 'resultados', pestana: 'channeling' },
  },
  'nom-riesgo': {
    texto: 'La norma pide medidas de control para las dimensiones en riesgo alto. Crea con IA un plan para cada una; en Riesgo psicosocial ves qué áreas y qué categorías lo concentran.',
    lista: { titulo: 'Dimensiones en riesgo', buscar: 'Buscar dimensión', accion: PLAN_IA },
    boton: { etiqueta: 'Ver riesgo psicosocial', accion: 'resultados', pestana: 'risk' },
  },
  'nom-participacion': {
    texto: 'La norma pide que responda todo el personal. Recuerda a quienes faltan y reabre la encuesta unos días para que puedan hacerlo.',
    lista: FALTAN,
    boton: { etiqueta: 'Reabrir encuesta', accion: 'reabrir' },
  },
  meta: { texto: 'Todavía hay tiempo: un recordatorio a quienes faltan suele ser suficiente.', lista: FALTAN, extension: true, avance: true },
  anonimato: {
    texto: 'Mientras esas áreas no lleguen al mínimo de respuestas, sus resultados no se mostrarán. Recuerda a quienes faltan en ellas.',
    lista: FALTAN_EN_AREAS,
    extension: true,
  },
  brecha: {
    texto: 'Crea con IA un plan para el área que está por debajo. Antes, mira en Favorabilidad, en el mapa de calor, qué secciones explican la diferencia.',
    lista: { titulo: 'Áreas por debajo', buscar: 'Buscar área', accion: PLAN_IA },
    boton: { etiqueta: 'Ver favorabilidad', accion: 'resultados', pestana: 'favorability' },
  },
  'sin-demograficos': {
    texto: 'Sin datos demográficos no hay cómo ver la participación ni los resultados por grupo. Actívalos y elige cuáles preguntar en el paso Datos demográficos.',
    boton: { etiqueta: 'Agregar datos demográficos', accion: 'editar', paso: 'demographics' },
  },
  comentarios: {
    texto: 'Lo que escribieron suele explicar lo que los números solo muestran. Léelos completos en Preguntas, con su tema y su sentimiento.',
    lista: { titulo: 'Comentarios negativos', buscar: 'Buscar en los comentarios' },
    boton: { etiqueta: 'Leer comentarios', accion: 'resultados', pestana: 'questions' },
  },
  caida: {
    texto: 'Crea con IA un plan para las preguntas con peor resultado y compara con la medición anterior en Favorabilidad.',
    lista: { titulo: 'Preguntas con peor resultado', buscar: 'Buscar pregunta', accion: PLAN_IA },
    boton: { etiqueta: 'Ver favorabilidad', accion: 'resultados', pestana: 'favorability' },
  },
  rezagada: { texto: 'Va atrasada frente al tiempo que lleva abierta: recuerda a quienes faltan antes de que se acerque el cierre.', lista: FALTAN, extension: true, avance: true },
  areas: {
    texto: 'Esas áreas casi no han respondido aunque el resto va bien. Un recordatorio dirigido a ellas es lo más directo.',
    lista: FALTAN_EN_AREAS,
    extension: true,
  },
  'revisar-comentarios': {
    texto: 'La IA no está segura de cómo leer estos comentarios. En Preguntas puedes corregir el sentimiento de cada uno antes de compartir los resultados.',
    lista: { titulo: 'Comentarios por revisar', buscar: 'Buscar en los comentarios' },
    boton: { etiqueta: 'Revisar comentarios', accion: 'resultados', pestana: 'questions' },
  },
  borrador: { texto: 'Complétala y publícala antes de la fecha de inicio, o cambia la fecha si ya no llega a tiempo.', boton: { etiqueta: 'Terminar y publicar', accion: 'editar' } },
  'sin-participantes': { texto: 'Una encuesta sin participantes no puede pasar a «Por iniciar» ni abrir. Elige a toda la empresa, a unos grupos o importa la lista desde un archivo, y termínala antes de la fecha de inicio.', boton: { etiqueta: 'Elegir participantes', accion: 'editarParticipantes' } },
  abre: { texto: 'El correo le llega solo a quien tiene cuenta. Copia el enlace para enviarlo por otros canales o descarga el QR para imprimirlo.', boton: { etiqueta: 'Copiar enlace', accion: 'compartirEnlace' } },
  error: { texto: 'Se vuelve a guardar con el mismo archivo. Si falla otra vez, revisa el archivo en «Cargar encuestas».', boton: { etiqueta: 'Reintentar la carga', accion: 'reintentarCarga' } },
}

/** Lo que propone de entrada: si ya casi no hay tiempo, una semana más que el cierre de hoy; si no, nada (se elige). */
export const extensionInicial = (riesgo: SurveyRisk): Date | undefined => {
  if (riesgo.kind !== 'meta-final') return undefined
  const cierre = parseSurveyDate(riesgo.survey.endDate)
  return cierre ? new Date(cierre.getFullYear(), cierre.getMonth(), cierre.getDate() + 7) : undefined
}
