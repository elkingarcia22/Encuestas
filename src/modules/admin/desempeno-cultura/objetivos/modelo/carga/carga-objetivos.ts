import type { Collaborator } from '../../../encuestas/modelo/collaborators'
import { COLLABORATORS } from '../../../encuestas/modelo/collaborators'
import type { Ciclo } from '../ciclos'
import { construirResultados } from '../resultados/seguimiento'

// La carga masiva de objetivos de un ciclo (portada del prototipo «configuración objetivos», 9-oct): se elige qué va a
// hacer el archivo (crear, editar o actualizar el avance), se sube, se revisa lo que se leyó y se cargan solo los
// objetivos de las personas que ya están listas. No hay servidor: el archivo no se lee de verdad, la revisión se siembra
// con un azar fijo a partir de su nombre y del ciclo (el mismo archivo da siempre la misma revisión).

export type Modo = 'crear' | 'editar' | 'actualizar'

export const MODOS: readonly { id: Modo; etiqueta: string; descripcion: string; columnas: readonly string[]; intencion: string; accion: string }[] = [
  {
    id: 'crear',
    etiqueta: 'Cargar objetivos nuevos',
    descripcion: 'Crea objetivos para las personas del ciclo. Los que ya existen no cambian.',
    columnas: ['username', 'nombre_objetivo', 'peso', 'tipo_medida', 'aumentar_reducir', 'valor_inicial', 'meta', 'descripcion_meta'],
    intencion: 'Se crean objetivos nuevos. Los que ya existen no se tocan.',
    accion: 'Cargar objetivos',
  },
  {
    id: 'editar',
    etiqueta: 'Editar objetivos',
    descripcion: 'Cambia el nombre, el peso o la meta de objetivos que ya existen.',
    columnas: ['username', 'nombre_objetivo', 'nombre_objetivo_nuevo', 'peso', 'tipo_medida', 'aumentar_reducir', 'valor_inicial', 'meta', 'descripcion_meta'],
    intencion: 'Se reemplaza cómo está escrito cada objetivo. El avance que ya tiene no cambia.',
    accion: 'Editar objetivos',
  },
  {
    id: 'actualizar',
    etiqueta: 'Actualizar el avance',
    descripcion: 'Registra el avance de objetivos que ya existen, de muchas personas a la vez.',
    columnas: ['username', 'nombre_objetivo', 'avance_actual', 'avance_nuevo', 'comentario'],
    intencion: 'Se registra el avance nuevo de cada objetivo y queda en su historial.',
    accion: 'Actualizar avance',
  },
]
export const modoDe = (modo: Modo) => MODOS.find((opcion) => opcion.id === modo) ?? MODOS[0]

/** En qué ciclos tiene sentido cada operación: un ciclo finalizado ya no recibe cambios; el avance, solo uno en curso. */
export const admiteModo = (ciclo: Ciclo, modo: Modo) => (modo === 'actualizar' ? ciclo.estado === 'En curso' : ciclo.estado !== 'Finalizado')

export const EXTENSIONES = ['.csv', '.xls', '.xlsx']
export const MAXIMO_BYTES = 10 * 1024 * 1024

/** La plantilla de cada operación, en CSV: solo las columnas, con una fila de ejemplo. */
export function plantillaCsv(modo: Modo): string {
  const ejemplo: Record<Modo, string[]> = {
    crear: ['ana.gomez', 'Aumentar la satisfacción de clientes', '40', 'porcentaje', 'aumentar', '70', '85', 'Encuesta trimestral de satisfacción'],
    editar: ['ana.gomez', 'Aumentar la satisfacción de clientes', 'Subir la satisfacción de clientes al 85%', '40', 'porcentaje', 'aumentar', '70', '85', 'Encuesta trimestral'],
    actualizar: ['ana.gomez', 'Aumentar la satisfacción de clientes', '72', '78', 'Subió tras el cambio de proceso'],
  }
  return [modoDe(modo).columnas.join(','), ejemplo[modo].map((valor) => (valor.includes(',') ? `"${valor}"` : valor)).join(',')].join('\n')
}

// ── La revisión ─────────────────────────────────────────────────────────────

export type Sentido = 'aumentar' | 'reducir'

export interface FilaObjetivo {
  id: string
  /** La fila del archivo, para poder buscarla allá. */
  fila: number
  titulo: string
  /** Solo al editar: el nombre nuevo. */
  tituloNuevo?: string
  peso: number
  sentido: Sentido
  inicial: number
  meta: number
  /** Solo al actualizar: el avance que ya tiene en UBITS y el que trae el archivo (null si la celda vino vacía). */
  avanceActual?: number
  avanceNuevo?: number | null
}

/** Cómo se encontró a la persona del archivo en UBITS. */
export type Coincidencia = 'exacta' | 'sugerida' | 'ninguna'

export interface GrupoPersona {
  /** El identificador tal como vino en el archivo (correo, documento o usuario). Es la clave del grupo. */
  identificador: string
  coincidencia: Coincidencia
  /** La persona contra la que se carga, cuando ya se sabe. */
  persona: Collaborator | null
  /** La propuesta cuando el identificador no coincidió exacto, y por qué se propuso. */
  sugerida: Collaborator | null
  motivo?: string
  objetivos: readonly FilaObjetivo[]
}

export type Pestana = 'sin-alinear' | 'sugeridas' | 'errores' | 'listos'

export const PESTANAS: readonly { id: Pestana; etiqueta: string; vacio: string; tono: 'info-light' | 'warning-light' | 'destructive-light' | 'success-light' }[] = [
  { id: 'sin-alinear', etiqueta: 'Personas sin encontrar', vacio: 'Cada identificador del archivo apunta a una persona de UBITS.', tono: 'info-light' },
  { id: 'sugeridas', etiqueta: 'Por confirmar', vacio: 'Todos los identificadores coincidieron exacto: no hay propuestas por confirmar.', tono: 'warning-light' },
  { id: 'errores', etiqueta: 'Con errores', vacio: 'Ningún dato por corregir: los pesos suman 100% y las metas están bien escritas.', tono: 'destructive-light' },
  { id: 'listos', etiqueta: 'Listos para cargar', vacio: 'Todavía no hay nada listo. Resuelve las otras pestañas.', tono: 'success-light' },
]

/** Lo que impide cargar un objetivo, en una frase. */
export function erroresDe(objetivo: FilaObjetivo, modo: Modo): string[] {
  if (modo === 'actualizar') return objetivo.avanceNuevo === null || objetivo.avanceNuevo === undefined ? ['Falta el avance nuevo.'] : objetivo.avanceNuevo < 0 ? ['El avance no puede ser negativo.'] : []
  const errores: string[] = []
  const titulo = (modo === 'editar' ? objetivo.tituloNuevo : objetivo.titulo)?.trim() ?? ''
  if (!titulo) errores.push('Falta el nombre del objetivo.')
  else if (titulo.length > 150) errores.push('El nombre pasa de 150 caracteres.')
  if (!(objetivo.peso >= 1)) errores.push('El peso tiene que ser de 1% o más.')
  if (objetivo.meta === objetivo.inicial) errores.push('La meta no puede ser igual al valor inicial.')
  else if (objetivo.sentido === 'aumentar' && objetivo.meta < objetivo.inicial) errores.push('Para aumentar, la meta tiene que ser mayor al valor inicial.')
  else if (objetivo.sentido === 'reducir' && objetivo.meta > objetivo.inicial) errores.push('Para reducir, la meta tiene que ser menor al valor inicial.')
  return errores
}

export const sumaPesos = (grupo: GrupoPersona) => grupo.objetivos.reduce((s, objetivo) => s + (Number.isFinite(objetivo.peso) ? objetivo.peso : 0), 0)

/** Lo que impide cargar a la persona entera: hoy, que sus pesos no sumen 100 (al actualizar el peso no se toca). */
export const erroresDelGrupo = (grupo: GrupoPersona, modo: Modo): string[] => (modo !== 'actualizar' && Math.round(sumaPesos(grupo)) !== 100 ? [`Los pesos suman ${Math.round(sumaPesos(grupo))}%: tienen que sumar 100%.`] : [])

export function pestanaDe(grupo: GrupoPersona, modo: Modo): Pestana {
  if (grupo.coincidencia === 'ninguna' || !grupo.persona) return 'sin-alinear'
  if (grupo.coincidencia === 'sugerida') return 'sugeridas'
  if (erroresDelGrupo(grupo, modo).length || grupo.objetivos.some((objetivo) => erroresDe(objetivo, modo).length)) return 'errores'
  return 'listos'
}

// ── La siembra ──────────────────────────────────────────────────────────────

function azar(semilla: string) {
  let h = 2166136261
  for (const letra of semilla) h = Math.imul(h ^ letra.charCodeAt(0), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TITULOS = ['Aumentar la satisfacción de clientes', 'Cumplir el presupuesto de ventas', 'Reducir el tiempo de respuesta', 'Lanzar el nuevo proceso de onboarding', 'Mejorar la calidad de las entregas', 'Reducir los costos operativos', 'Subir la adopción de la plataforma', 'Cerrar las incidencias abiertas']

/** Las personas del ciclo: contra ellas se resuelve el archivo. Un borrador sin gente usa el directorio. */
export function personasDelCiclo(ciclo: Ciclo): readonly Collaborator[] {
  const personas = construirResultados(ciclo).personas.map((persona) => persona.colaborador)
  return personas.length ? personas : COLLABORATORS.slice(0, 40)
}

/** Lee (de mentira) el archivo: una revisión con todos los casos, para que cada pestaña tenga algo que mostrar. */
export function analizarArchivo(archivo: string, ciclo: Ciclo, modo: Modo): GrupoPersona[] {
  const r = azar(`${archivo}-${ciclo.id}-${modo}`)
  const personas = personasDelCiclo(ciclo)
  const total = Math.min(personas.length, 9 + Math.floor(r() * 5))
  const desde = Math.floor(r() * Math.max(1, personas.length - total))
  let fila = 2
  return personas.slice(desde, desde + total).map((persona, indice): GrupoPersona => {
    const cuantos = 2 + Math.floor(r() * 3)
    const pesos = Array.from({ length: cuantos }, () => 1 + Math.floor(r() * 4))
    const suma = pesos.reduce((a, b) => a + b, 0)
    const enteros = pesos.map((peso) => Math.round((peso / suma) * 100))
    enteros[0] += 100 - enteros.reduce((a, b) => a + b, 0)
    // Los casos de la revisión, siempre en el mismo orden: dos con propuesta, uno sin encontrar y dos con errores.
    const caso = indice === 1 || indice === 5 ? 'sugerida' : indice === 3 ? 'ninguna' : indice === 2 ? 'pesos' : indice === 6 ? 'meta' : 'bien'
    const objetivos = enteros.map((peso, n): FilaObjetivo => {
      const inicial = Math.round(r() * 50)
      const meta = inicial + 10 + Math.round(r() * 40)
      const base: FilaObjetivo = { id: `${persona.id}-${n}`, fila: fila++, titulo: TITULOS[(indice + n) % TITULOS.length], peso: caso === 'pesos' && n === 0 ? peso + 15 : peso, sentido: 'aumentar', inicial, meta: caso === 'meta' && n === 0 ? inicial : meta }
      if (modo === 'editar') return { ...base, tituloNuevo: `${base.titulo} este periodo` }
      if (modo === 'actualizar') {
        const actual = Math.round(r() * 60)
        return { ...base, avanceActual: actual, avanceNuevo: caso === 'meta' && n === 0 ? null : Math.min(150, actual + Math.round(r() * 30)) }
      }
      return base
    })
    const [usuario, dominio] = persona.email.split('@')
    if (caso === 'ninguna') return { identificador: `${usuario.split('.')[0]}.externo@${dominio}`, coincidencia: 'ninguna', persona: null, sugerida: null, objetivos }
    if (caso === 'sugerida') return { identificador: `${usuario.replace('.', '')}@${dominio}`, coincidencia: 'sugerida', persona, sugerida: persona, motivo: 'El correo no coincide exacto, pero el nombre sí.', objetivos }
    return { identificador: persona.email, coincidencia: 'exacta', persona, sugerida: null, objetivos }
  })
}
