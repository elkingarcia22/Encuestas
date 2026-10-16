import { useSyncExternalStore } from 'react'
import {
  SALDO_INICIAL,
  SEMILLA,
  contenidoNuevo,
  evaluacionesVisibles,
  nuevoId,
  pesosParejos,
  type Contenido,
  type Pagina,
  type Seccion,
  type TipoContenido,
} from './datos'

// Lo que se crea y se cambia en la sesión, igual para las tres exploraciones: si se publica un curso en la 1, en la 2
// ya aparece publicado. Vive en memoria (no hay servidor); al recargar, vuelve a la semilla. Cada cambio deja la fecha
// de «actualizado» en ahora, así lo último que se tocó queda primero en la lista (HU-LMS-004, RN-02).

let contenidos: Contenido[] = SEMILLA
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())
const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export const useContenidos = () => useSyncExternalStore(suscribir, () => contenidos)
export const useContenido = (id: string | undefined) => useSyncExternalStore(suscribir, () => contenidos.find((uno) => uno.id === id))
export const leerContenido = (id: string) => contenidos.find((uno) => uno.id === id)

type Cambio = Partial<Contenido> | ((actual: Contenido) => Partial<Contenido>)

export function actualizarContenido(id: string, cambio: Cambio) {
  contenidos = contenidos.map((uno) => {
    if (uno.id !== id) return uno
    const parcial = typeof cambio === 'function' ? cambio(uno) : cambio
    return { ...uno, ...parcial, actualizado: new Date().toISOString() }
  })
  avisar()
}

// Crea un borrador y lo deja primero en la lista. Devuelve el contenido para navegar a él.
export function crearContenido(tipo: TipoContenido, parcial: Partial<Contenido> = {}) {
  const nuevo = contenidoNuevo(tipo, parcial)
  contenidos = [nuevo, ...contenidos]
  avisar()
  return nuevo
}

// Una copia en borrador, sin inscritos, «(copia)» en el título y con páginas nuevas (mismos recursos).
export function duplicarContenido(id: string) {
  const original = leerContenido(id)
  if (!original) return null
  const ahora = new Date().toISOString()
  const copia: Contenido = {
    ...original,
    id: nuevoId('c'),
    titulo: `${original.titulo} (copia)`,
    visibilidad: 'Borrador',
    secciones: original.secciones.map((seccion) => ({ ...seccion, id: nuevoId('s'), paginas: seccion.paginas.map((pagina) => ({ ...pagina, id: nuevoId('p') })) })),
    creado: ahora,
    actualizado: ahora,
    publicado: undefined,
    inscritos: 0,
    finalizaron: 0,
    calificacion: undefined,
  }
  copia.pesos = pesosParejos(evaluacionesVisibles(copia).map((pagina) => pagina.id))
  contenidos = [copia, ...contenidos]
  avisar()
  return copia
}

// Elimina y devuelve cómo deshacerlo (para el «Deshacer» del aviso). Solo se eliminan borradores; lo publicado se archiva.
export function eliminarContenido(id: string) {
  const indice = contenidos.findIndex((uno) => uno.id === id)
  if (indice < 0) return () => {}
  const quitado = contenidos[indice]
  contenidos = contenidos.filter((uno) => uno.id !== id)
  avisar()
  return () => {
    contenidos = [...contenidos.slice(0, indice), quitado, ...contenidos.slice(indice)]
    avisar()
  }
}

/* Páginas ------------------------------------------------------------------------------------------------------- */

const conSecciones = (contenido: Contenido, secciones: Seccion[]) => {
  const provisional = { ...contenido, secciones }
  // Al cambiar qué evaluaciones hay, los pesos vuelven a repartirse parejos entre las visibles (HU-LMS-019).
  const ids = evaluacionesVisibles(provisional).map((pagina) => pagina.id)
  const antes = Object.keys(contenido.pesos).sort().join('|')
  const pesos = antes === [...ids].sort().join('|') ? contenido.pesos : pesosParejos(ids)
  return { secciones, pesos }
}

// Agrega una página al final de una sección (la última si no se dice cuál). Devuelve la página.
export function agregarPagina(id: string, pagina: Pagina, seccionId?: string) {
  actualizarContenido(id, (actual) => {
    const secciones = actual.secciones.length ? actual.secciones : [{ id: 's-unica', titulo: '', paginas: [] }]
    const destino = seccionId ?? secciones[secciones.length - 1].id
    return conSecciones(
      actual,
      secciones.map((seccion) => (seccion.id === destino ? { ...seccion, paginas: [...seccion.paginas, pagina] } : seccion)),
    )
  })
  return pagina
}

export function actualizarPagina(id: string, paginaId: string, cambio: Partial<Pagina>) {
  actualizarContenido(id, (actual) =>
    conSecciones(
      actual,
      actual.secciones.map((seccion) => ({ ...seccion, paginas: seccion.paginas.map((pagina) => (pagina.id === paginaId ? { ...pagina, ...cambio } : pagina)) })),
    ),
  )
}

// Quita una página (solo en borrador; en publicado se oculta). Devuelve cómo deshacerlo.
export function quitarPagina(id: string, paginaId: string) {
  const antes = leerContenido(id)
  actualizarContenido(id, (actual) =>
    conSecciones(
      actual,
      actual.secciones.map((seccion) => ({ ...seccion, paginas: seccion.paginas.filter((pagina) => pagina.id !== paginaId) })),
    ),
  )
  return () => antes && actualizarContenido(id, { secciones: antes.secciones, pesos: antes.pesos })
}

// Oculta o vuelve a mostrar una página publicada. Nunca deja el contenido sin páginas visibles (HU-LMS-002, RN-04).
export function ocultarPagina(id: string, paginaId: string, ocultar: boolean) {
  const actual = leerContenido(id)
  if (!actual) return false
  const visibles = actual.secciones.flatMap((seccion) => seccion.paginas).filter((pagina) => !pagina.ocultaDesde)
  if (ocultar && visibles.length <= 1) return false
  actualizarPagina(id, paginaId, { ocultaDesde: ocultar ? new Date().toISOString().slice(0, 10) : undefined })
  return true
}

// Mueve una página a otra posición (y de sección, si se pasa). `posicion` es el índice final dentro de la sección.
export function moverPagina(id: string, paginaId: string, seccionId: string, posicion: number) {
  actualizarContenido(id, (actual) => {
    const pagina = actual.secciones.flatMap((seccion) => seccion.paginas).find((una) => una.id === paginaId)
    if (!pagina) return {}
    const sinElla = actual.secciones.map((seccion) => ({ ...seccion, paginas: seccion.paginas.filter((una) => una.id !== paginaId) }))
    return {
      secciones: sinElla.map((seccion) => {
        if (seccion.id !== seccionId) return seccion
        const paginas = [...seccion.paginas]
        paginas.splice(Math.max(0, Math.min(posicion, paginas.length)), 0, pagina)
        return { ...seccion, paginas }
      }),
    }
  })
}

// Agrupar en secciones o volver a una sola lista. Al apagar, las páginas de todas las secciones quedan juntas en orden.
export function usarSecciones(id: string, usar: boolean) {
  actualizarContenido(id, (actual) => {
    const paginas = actual.secciones.flatMap((seccion) => seccion.paginas)
    if (!usar) return { usaSecciones: false, secciones: [{ id: 's-unica', titulo: '', paginas }] }
    return { usaSecciones: true, secciones: [{ id: nuevoId('s'), titulo: 'Sección 1', paginas }] }
  })
}

export function agregarSeccion(id: string, titulo = '') {
  const seccion: Seccion = { id: nuevoId('s'), titulo, paginas: [] }
  actualizarContenido(id, (actual) => ({
    usaSecciones: true,
    secciones: [...actual.secciones, { ...seccion, titulo: titulo || `Sección ${actual.secciones.length + 1}` }],
  }))
  return seccion
}

export function actualizarSeccion(id: string, seccionId: string, titulo: string) {
  actualizarContenido(id, (actual) => ({ secciones: actual.secciones.map((seccion) => (seccion.id === seccionId ? { ...seccion, titulo } : seccion)) }))
}

// Quita una sección vacía, o pasa sus páginas a la anterior.
export function quitarSeccion(id: string, seccionId: string) {
  actualizarContenido(id, (actual) => {
    const indice = actual.secciones.findIndex((seccion) => seccion.id === seccionId)
    if (indice < 0 || actual.secciones.length <= 1) return {}
    const paginas = actual.secciones[indice].paginas
    const restantes = actual.secciones.filter((seccion) => seccion.id !== seccionId)
    const receptora = Math.max(0, indice - 1)
    return { secciones: restantes.map((seccion, i) => (i === receptora ? { ...seccion, paginas: [...seccion.paginas, ...paginas] } : seccion)) }
  })
}

/* Créditos de IA ------------------------------------------------------------------------------------------------ */

// El saldo de créditos de IA de la empresa para LMS Creator. Cada acción generativa descuenta su costo (RN-06); sin
// saldo no se ejecuta (RN-05) y quien llama muestra el aviso.
let saldo = SALDO_INICIAL
const oyentesSaldo = new Set<() => void>()
const suscribirSaldo = (oyente: () => void) => {
  oyentesSaldo.add(oyente)
  return () => oyentesSaldo.delete(oyente)
}
export const useCreditos = () => useSyncExternalStore(suscribirSaldo, () => saldo)
export function gastarCreditos(cantidad: number) {
  if (cantidad > saldo) return false
  saldo -= cantidad
  oyentesSaldo.forEach((oyente) => oyente())
  return true
}
export function devolverCreditos(cantidad: number) {
  saldo += cantidad
  oyentesSaldo.forEach((oyente) => oyente())
}
