// Sesión del flujo «Agregar presentación interactiva»: setup → editor. Cada paso tiene su propia URL y el estado viaja
// en la sesión del navegador (sessionStorage), así ir y volver entre el setup y el editor conserva el borrador de
// estructura y las diapositivas. Se borra al generar, al cerrar o al volver a «Añadir página».

import {
  ACENTO_POR_DEFECTO,
  ESTILO_POR_DEFECTO,
  ESTRUCTURA_VACIA,
  acento,
  conIds,
  estilo,
  leerDatosPresentacion,
  POOL,
  type AcentoId,
  type DatosDiapositiva,
  type EstiloId,
  type Estructura,
  type ModoContexto,
} from './datos'

export const RUTA_SETUP_PRESENTACION = '/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva'
export const RUTA_EDITOR_PRESENTACION = `${RUTA_SETUP_PRESENTACION}/editor`

const CLAVE = 'ubits-presentacion-interactiva-session'

export type ArchivoContexto = { nombre: string; peso: number }

export type SesionPresentacion = {
  idea: string
  contexto: ModoContexto
  /** Solo el nombre y el peso: el archivo en sí no se guarda (es un mock). */
  archivosContexto: ArchivoContexto[]
  objetivo: string
  objetivoOtro: string
  estilo: EstiloId
  acento: AcentoId
  /** Logo PNG como data URL, para que sobreviva a la navegación y a una recarga. */
  logo: string | null
  estructura: Estructura
  /** Huella del setup con la que se estructuró (null si nunca). */
  huella: string | null
  diapositivas: DatosDiapositiva[]
  tituloEditor: string
  activa: number
  /** Ya terminó la generación progresiva de las diapositivas en el editor. */
  contenidoListo: boolean
}

export function sesionVacia(): SesionPresentacion {
  return {
    idea: '',
    contexto: 'internet',
    archivosContexto: [],
    objetivo: 'comprender',
    objetivoOtro: '',
    estilo: ESTILO_POR_DEFECTO,
    acento: ACENTO_POR_DEFECTO,
    logo: null,
    estructura: ESTRUCTURA_VACIA,
    huella: null,
    diapositivas: [],
    tituloEditor: '',
    activa: 0,
    contenidoListo: false,
  }
}

export function leerSesion(): SesionPresentacion | null {
  try {
    const guardada = window.sessionStorage.getItem(CLAVE)
    if (!guardada) return null
    const s = { ...sesionVacia(), ...(JSON.parse(guardada) as Partial<SesionPresentacion>) }
    return { ...s, estilo: estilo(s.estilo).id, acento: acento(s.acento).id, diapositivas: conIds(s.diapositivas ?? []) }
  } catch {
    return null
  }
}

export function guardarSesion(sesion: SesionPresentacion) {
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
  } catch {
    // Sin espacio (un logo muy pesado) el flujo sigue: solo no sobrevive a una recarga.
  }
}

export function limpiarSesionPresentacion() {
  try {
    window.sessionStorage.removeItem(CLAVE)
  } catch {
    // Nada que limpiar.
  }
}

/**
 * Retomar una presentación de «Tus presentaciones recientes»: deja la sesión lista con el deck de muestra y el título
 * de la que se eligió, para abrir el editor sin pasar otra vez por el setup. En el prototipo todas abren el mismo
 * deck; lo que cambia es el nombre (Dave, 5-oct).
 */
export function sembrarPresentacion(titulo: string) {
  const diapositivas = conIds(POOL.filter((d) => TIPOS_MUESTRA.includes(d.type)))
  guardarSesion({ ...sesionVacia(), idea: titulo, diapositivas, tituloEditor: titulo, activa: 0, contenidoListo: true })
}

/** Los tipos de diapositiva del deck de muestra, en el orden en que se arma. */
const TIPOS_MUESTRA: DatosDiapositiva['type'][] = ['intro', 'agenda', 'main_point', 'steps', 'two_columns', 'quote', 'big_number', 'accordion', 'flashcards', 'quiz_mc', 'summary']

/**
 * «Editar presentación» desde el asistente: siembra la sesión con lo que guardó la página y deja el editor listo, sin
 * volver a mostrar la generación progresiva (RN-07). Devuelve `false` si la página no tiene diapositivas editables
 * (el asistente avisa «No hay datos editables para esta presentación. Genera una con IA de nuevo.»).
 */
export function abrirEdicionPresentacion(datos: unknown): boolean {
  const leidos = leerDatosPresentacion(datos)
  if (!leidos) return false
  guardarSesion({
    ...sesionVacia(),
    idea: leidos.titulo,
    estilo: leidos.estilo,
    acento: leidos.acento,
    logo: leidos.logo,
    diapositivas: leidos.diapositivas,
    tituloEditor: leidos.titulo,
    activa: 0,
    contenidoListo: true,
  })
  return true
}
