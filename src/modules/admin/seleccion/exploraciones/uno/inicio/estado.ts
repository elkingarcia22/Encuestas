import { useSyncExternalStore } from 'react'
import { simulado } from '../../../propuestas/simular'
import { QUIEN_MUEVE } from '../../../propuestas/movimientos'

// Lo que se resolvió desde el inicio en esta sesión: los asuntos del tablero de atención (o cada persona o vacante de
// uno) que ya se atendieron, las sugerencias de la IA que se descartaron, y un contador que sube cada vez que el
// inicio cambia una vacante (devolverla al portal, publicarla, duplicarla, eliminarla) para que todo se vuelva a
// dibujar. Vive fuera de la pantalla: si se entra a una vacante y se vuelve, lo resuelto sigue resuelto.
//
// 7 oct: cada cosa resuelta guarda quién la hizo, cuándo y cómo deshacerla, para la lista «Resuelto hoy» del panel: el
// «Deshacer» ya no dura solo lo que dura el aviso (IN-31) y se sabe quién resolvió cada asunto (IN-41). Las descartadas
// se guardan con su motivo y aguantan una recarga (IN-52). Y la primera lectura de la IA tiene su propio estado —en
// curso, terminada o fallida— para que la vacante lo muestre (IN-32).

export type Resuelto = {
  id: number
  // Lo que se marcó (`asunto` o `asunto|elemento`).
  claves: string[]
  // «Reenviaste la invitación a Ana Ruiz», en pasado y con nombres.
  que: string
  // La columna del tablero donde estaba (el panel de cada una muestra lo suyo).
  grupo?: string
  cuando: number
  quien: string
  deshacer?: () => void
}

export type Lectura = { vacanteId: string; vacante: string; cuantos: number; estado: 'leyendo' | 'lista' | 'fallo'; cumplen?: number }

export type EstadoInicio = {
  // `asunto` o `asunto|elemento`: lo resuelto entero o una persona/vacante dentro de un asunto.
  hechos: ReadonlySet<string>
  descartadas: ReadonlySet<string>
  // Qué sugerencia era y por qué se descartó, si se dijo.
  motivos: Readonly<Record<string, { titulo: string; motivo?: string }>>
  resueltos: readonly Resuelto[]
  lecturas: Readonly<Record<string, Lectura>>
  version: number
}

const GUARDADAS = 'seleccion-inicio-descartadas'

function leerDescartadas(): { ids: string[]; motivos: Record<string, { titulo: string; motivo?: string }> } {
  try {
    const crudo = window.sessionStorage.getItem(GUARDADAS)
    return crudo ? JSON.parse(crudo) : { ids: [], motivos: {} }
  } catch {
    return { ids: [], motivos: {} }
  }
}

const guardadas = typeof window === 'undefined' ? { ids: [], motivos: {} } : leerDescartadas()

let estado: EstadoInicio = { hechos: new Set(), descartadas: new Set(guardadas.ids), motivos: guardadas.motivos, resueltos: [], lecturas: {}, version: 0 }
const oyentes = new Set<() => void>()
let contador = 0

const cambiar = (siguiente: Partial<EstadoInicio>) => {
  estado = { ...estado, ...siguiente }
  if ('descartadas' in siguiente || 'motivos' in siguiente) {
    try {
      window.sessionStorage.setItem(GUARDADAS, JSON.stringify({ ids: [...estado.descartadas], motivos: estado.motivos }))
    } catch {
      // Sin almacenamiento (ventana privada): se recuerdan solo mientras la página siga abierta.
    }
  }
  oyentes.forEach((oyente) => oyente())
}

export const claveDe = (asunto: string, elemento?: string) => (elemento ? `${asunto}|${elemento}` : asunto)
// La marca de «lo dejé así a propósito» (IN-28): va junto a la clave del elemento.
export const claveAsi = (clave: string) => `${clave}#asi`

export const estadoInicio = {
  leer: () => estado,
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  // Devuelve cómo deshacerlo: el aviso trae «Deshacer» y tiene que devolver justo lo que se marcó. Con `que`, queda en
  // «Resuelto hoy» con quién y cuándo; su `deshacer` deshace también lo que la acción cambió (no solo la marca).
  marcar: (claves: string[], que?: string, deshacerAccion?: () => void, grupo?: string) => {
    const nuevas = claves.filter((clave) => !estado.hechos.has(clave))
    contador += 1
    const id = contador
    const quitarMarca = () =>
      cambiar({
        hechos: new Set([...estado.hechos].filter((clave) => !nuevas.includes(clave))),
        resueltos: estado.resueltos.filter((resuelto) => resuelto.id !== id),
      })
    const deshacer = () => {
      deshacerAccion?.()
      quitarMarca()
    }
    cambiar({
      hechos: new Set([...estado.hechos, ...nuevas]),
      resueltos: que ? [{ id, claves: nuevas, que, grupo, cuando: Date.now(), quien: QUIEN_MUEVE, deshacer }, ...estado.resueltos] : estado.resueltos,
    })
    return deshacer
  },
  descartar: (id: string, titulo: string, motivo?: string) => {
    cambiar({ descartadas: new Set([...estado.descartadas, id]), motivos: { ...estado.motivos, [id]: { titulo, motivo } } })
    return () => {
      const { [id]: _quitado, ...motivos } = estado.motivos
      cambiar({ descartadas: new Set([...estado.descartadas].filter((otra) => otra !== id)), motivos })
    }
  },
  // Volver a proponer una sugerencia descartada, desde «Descartadas» del panel.
  recuperar: (id: string) => {
    const { [id]: _quitado, ...motivos } = estado.motivos
    cambiar({ descartadas: new Set([...estado.descartadas].filter((otra) => otra !== id)), motivos })
  },
  // La primera lectura de la IA de una etapa (IN-32): empieza, tarda unos segundos y termina con cuántas cumplen todo.
  // Con `?simular=error` la primera falla, para ver qué pasa entonces.
  leerConIA: (lectura: Omit<Lectura, 'estado' | 'cumplen'>, cumplen: number, alTerminar?: (lectura: Lectura) => void) => {
    const falla = simulado('error') && !estado.lecturas[lectura.vacanteId]
    cambiar({ lecturas: { ...estado.lecturas, [lectura.vacanteId]: { ...lectura, estado: 'leyendo' } } })
    window.setTimeout(() => {
      const actual = estado.lecturas[lectura.vacanteId]
      if (!actual || actual.estado !== 'leyendo') return
      const final: Lectura = falla ? { ...actual, estado: 'fallo' } : { ...actual, estado: 'lista', cumplen }
      cambiar({ lecturas: { ...estado.lecturas, [lectura.vacanteId]: final } })
      alTerminar?.(final)
    }, LECTURA_MS)
    return () => {
      const { [lectura.vacanteId]: _quitada, ...resto } = estado.lecturas
      cambiar({ lecturas: resto })
    }
  },
  // Algo cambió en las vacantes (están en la lista compartida de la exploración): que se vuelva a dibujar.
  tocar: () => cambiar({ version: estado.version + 1 }),
  // Solo para probar el estado vacío del tablero desde una prueba.
  reiniciar: () => cambiar({ hechos: new Set(), descartadas: new Set(), motivos: {}, resueltos: [], lecturas: {}, version: estado.version + 1 }),
}

// Lo que tarda la IA en leer una etapa en la maqueta.
export const LECTURA_MS = 6000

export const useEstadoInicio = () => useSyncExternalStore(estadoInicio.suscribir, estadoInicio.leer)
