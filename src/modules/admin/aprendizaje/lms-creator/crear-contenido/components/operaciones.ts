// Lo que se puede hacer con el índice de Recursos: secciones y páginas. Todo pasa por el borrador.

import { preguntasDeSatisfaccion } from './encuestas'
import { getBorrador, nombreRecurso, nuevoId, seccionesVisibles, setBorrador, todasLasPaginas, type Pagina, type Seccion } from './borrador'

const reemplazar = (secciones: Seccion[], id: string, cambio: (s: Seccion) => Seccion) => secciones.map((s) => (s.id === id ? cambio(s) : s))

/** Título por defecto cuando se deja vacío: el nombre del recurso, o «Título de la página» si no tiene. */
export const tituloPorDefecto = (p: Pagina) => (p.recurso ? nombreRecurso(p.recurso) : 'Título de la página')

// ── Secciones ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Encender: todas las páginas pasan a «Sección 1». Apagar: todas vuelven a una sola lista, en orden. */
export function habilitarSecciones(encender: boolean) {
  setBorrador((b) => {
    if (encender) {
      const paginas = b.secciones.flatMap((s) => s.paginas)
      return {
        seccionesHabilitadas: true,
        secciones: [
          { id: 'default', titulo: '', descripcion: '', paginas: [] },
          { id: nuevoId('s'), titulo: 'Sección 1', descripcion: '', paginas },
        ],
      }
    }
    const paginas = seccionesVisibles(b).flatMap((s) => s.paginas)
    return { seccionesHabilitadas: false, secciones: [{ id: 'default', titulo: '', descripcion: '', paginas }] }
  })
}

/** Con 2 o más secciones que tengan páginas, apagar las secciones pide confirmación. */
export function apagarPideConfirmar() {
  const b = getBorrador()
  const reales = seccionesVisibles(b)
  return reales.length >= 2 && reales.filter((s) => s.paginas.length).length >= 2
}

export function anadirSeccion() {
  setBorrador((b) => {
    const numero = seccionesVisibles(b).length + 1
    return { secciones: [...b.secciones, { id: nuevoId('s'), titulo: `Sección ${numero}`, descripcion: '', paginas: [] }] }
  })
}

export function editarSeccion(id: string, titulo: string, descripcion?: string) {
  setBorrador((b) => ({
    secciones: reemplazar(b.secciones, id, (s) => ({ ...s, titulo, descripcion: descripcion ?? s.descripcion })),
  }))
}

export function moverSeccion(id: string, direccion: -1 | 1) {
  setBorrador((b) => {
    const lista = [...b.secciones]
    const i = lista.findIndex((s) => s.id === id)
    const j = i + direccion
    // `default` se queda siempre en su lugar (primera, vacía).
    if (i < 0 || j < 0 || j >= lista.length || lista[j].id === 'default') return {}
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    return { secciones: lista }
  })
}

export function eliminarSeccion(id: string) {
  setBorrador((b) => {
    const eliminada = b.secciones.find((s) => s.id === id)
    const secciones = b.secciones.filter((s) => s.id !== id)
    const ids = new Set(eliminada?.paginas.map((p) => p.id))
    const quedan = seccionesVisibles({ ...b, secciones }).flatMap((s) => s.paginas)
    return {
      secciones,
      paginaActiva: b.paginaActiva && ids.has(b.paginaActiva) ? (quedan[0]?.id ?? null) : b.paginaActiva,
      trabajos: b.trabajos.map((t) => (ids.has(t.paginaId) && t.estado === 'cargando' ? { ...t, estado: 'error' } : t)),
    }
  })
}

// ── Páginas ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function activarPagina(id: string | null) {
  setBorrador({ paginaActiva: id })
}

export function renombrarPagina(id: string, titulo: string) {
  setBorrador((b) => ({
    secciones: b.secciones.map((s) => ({
      ...s,
      paginas: s.paginas.map((p) => (p.id === id ? { ...p, titulo } : p)),
    })),
  }))
}

/** Al terminar de editar el nombre: si quedó vacío, toma el del recurso. */
export function cerrarNombrePagina(id: string) {
  setBorrador((b) => ({
    secciones: b.secciones.map((s) => ({
      ...s,
      paginas: s.paginas.map((p) => (p.id === id && !p.titulo.trim() ? { ...p, titulo: tituloPorDefecto(p) } : p)),
    })),
  }))
}

/**
 * Soltar una página arrastrada en una sección, en una posición concreta. Vale igual si la sección es la suya o es
 * otra: sale de donde estaba y entra donde se soltó, sin intercambiar nada con nadie. El índice de destino ya viene
 * contado **sin** la página que se mueve (Dave, 5-oct).
 */
export function soltarPaginaEn(id: string, destino: { seccionId: string; indice: number }) {
  setBorrador((b) => {
    const origen = b.secciones.find((s) => s.paginas.some((p) => p.id === id))
    const pagina = origen?.paginas.find((p) => p.id === id)
    if (!pagina) return {}
    const sinElla = b.secciones.map((s) => ({ ...s, paginas: s.paginas.filter((p) => p.id !== id) }))
    return {
      secciones: sinElla.map((s) => {
        if (s.id !== destino.seccionId) return s
        const paginas = [...s.paginas]
        paginas.splice(Math.min(destino.indice, paginas.length), 0, pagina)
        return { ...s, paginas }
      }),
    }
  })
}

/**
 * Mover arriba o abajo. Con secciones, la primera de una sección sube al final de la anterior y la última baja al
 * inicio de la siguiente.
 */
export function moverPagina(id: string, direccion: -1 | 1) {
  setBorrador((b) => {
    const visibles = seccionesVisibles(b)
    const si = visibles.findIndex((s) => s.paginas.some((p) => p.id === id))
    if (si < 0) return {}
    const seccion = visibles[si]
    const pi = seccion.paginas.findIndex((p) => p.id === id)
    const pagina = seccion.paginas[pi]
    const destino = pi + direccion
    if (destino >= 0 && destino < seccion.paginas.length) {
      const paginas = [...seccion.paginas]
      ;[paginas[pi], paginas[destino]] = [paginas[destino], paginas[pi]]
      return { secciones: reemplazar(b.secciones, seccion.id, (s) => ({ ...s, paginas })) }
    }
    const vecina = visibles[si + direccion]
    if (!vecina) return {}
    let secciones = reemplazar(b.secciones, seccion.id, (s) => ({ ...s, paginas: s.paginas.filter((p) => p.id !== id) }))
    secciones = reemplazar(secciones, vecina.id, (s) => ({ ...s, paginas: direccion < 0 ? [...s.paginas, pagina] : [pagina, ...s.paginas] }))
    return { secciones }
  })
}

export function puedeMover(id: string) {
  const b = getBorrador()
  const visibles = seccionesVisibles(b)
  const si = visibles.findIndex((s) => s.paginas.some((p) => p.id === id))
  const seccion = visibles[si]
  const pi = seccion?.paginas.findIndex((p) => p.id === id) ?? -1
  return {
    arriba: pi > 0 || (b.seccionesHabilitadas && si > 0),
    abajo: (seccion && pi < seccion.paginas.length - 1) || (b.seccionesHabilitadas && si < visibles.length - 1),
  }
}

export function eliminarPagina(id: string) {
  setBorrador((b) => {
    const secciones = b.secciones.map((s) => ({ ...s, paginas: s.paginas.filter((p) => p.id !== id) }))
    const quedan = todasLasPaginas({ ...b, secciones })
    return {
      secciones,
      paginaActiva: b.paginaActiva === id ? (quedan[0]?.id ?? null) : b.paginaActiva,
      trabajos: b.trabajos.map((t) => (t.paginaId === id && t.estado === 'cargando' ? { ...t, estado: 'error' } : t)),
    }
  })
}

/** Las encuestas nacen igual que la evaluación: en la misma pantalla. La de satisfacción, con sus dos preguntas fijas. */
export function crearPaginaEncuesta(seccionId: string, titulo: string, satisfaccion: boolean) {
  const id = nuevoId('p')
  setBorrador((b) => ({
    paginaActiva: id,
    secciones: reemplazar(b.secciones, seccionId, (s) => ({
      ...s,
      paginas: [
        ...s.paginas,
        {
          id,
          titulo: titulo.trim() || (satisfaccion ? 'Encuesta de satisfacción' : 'Encuesta libre'),
          recurso: satisfaccion
            ? { tipo: 'encuesta-satisfaccion' as const, preguntas: preguntasDeSatisfaccion() }
            : { tipo: 'encuesta-libre' as const, preguntas: [] },
        },
      ],
    })),
  }))
  return id
}

/** Evaluación: nace en la misma pantalla, vacía de preguntas (HU-LMS-010). */
export function crearPaginaEvaluacion(seccionId: string, titulo: string) {
  const id = nuevoId('p')
  setBorrador((b) => ({
    paginaActiva: id,
    secciones: reemplazar(b.secciones, seccionId, (s) => ({
      ...s,
      paginas: [...s.paginas, { id, titulo: titulo.trim() || 'Evaluación', recurso: { tipo: 'evaluacion-final', preguntas: [] } }],
    })),
  }))
  return id
}
