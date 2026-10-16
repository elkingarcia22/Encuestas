import { CATEGORIAS, CONTENIDOS, NIVELES, TIPOS_CONTENIDO, nombreCategoria } from '@/shared/bd'
import type { Criterio } from '@/modules/admin/aprendizaje/lms-creator/contenidos/components/controles-lista'
import { horario, proximasSesiones, tarjetaEmpresa, type Sesion, type Tarjeta } from '../../zona-de-estudio/components/datos'

// Universidad corporativa (HU-APR-005): la vista de colaborador de lo que la empresa publicó en LMS Creator › Contenidos.
// Salen los mismos contenidos de ese listado, solo los publicados. Las sesiones de los eventos no se listan de entrada:
// aparecen al buscarlas o al filtrar por tipo «Sesión» (HU-APR-010, RN-08).

export type Item = { clave: string; tarjeta: Tarjeta; categoriaId: string; nivelId: string; sesion?: Sesion }

const PUBLICADOS = CONTENIDOS.filter((c) => c.visibilidad === 'Publicado')

export const CONTENIDOS_EMPRESA: Item[] = PUBLICADOS.map((c) => ({
  clave: c.id,
  tarjeta: tarjetaEmpresa(c),
  categoriaId: c.categoriaId,
  nivelId: c.nivelId,
}))

const EVENTO = CONTENIDOS.find((c) => c.id === 'f021')

/** Las sesiones del evento como filas de la lista, para cuando se buscan o se filtran. */
export function sesionesCatalogo(ahora = new Date()): Item[] {
  if (!EVENTO) return []
  const { mis, publicos } = proximasSesiones(ahora)
  const base = tarjetaEmpresa(EVENTO)
  return [...mis, ...publicos].map((s) => ({
    clave: `sesion-${s.clave}`,
    tarjeta: { ...base, id: `sesion-${s.clave}`, titulo: s.titulo, tipo: 'Sesión', duracion: horario(s) },
    categoriaId: EVENTO.categoriaId,
    nivelId: EVENTO.nivelId,
    sesion: s,
  }))
}

// ── Filtros ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Los mismos cuatro criterios de LMS Creator › Contenidos (por nombre); el tipo suma «Evento» y «Sesión».
export type Filtros = { tipo: string; categoria: string; nivel: string; idioma: string }
export const SIN_FILTROS: Filtros = { tipo: '', categoria: '', nivel: '', idioma: '' }

export const CRITERIOS: Criterio<keyof Filtros>[] = [
  {
    key: 'tipo',
    label: 'Tipo de contenido',
    vacio: 'Todos los tipos',
    opciones: [...new Set([...TIPOS_CONTENIDO.map((t) => t.nombre), 'Evento', 'Sesión'])],
  },
  { key: 'categoria', label: 'Categoría', vacio: 'Todas las categorías', opciones: CATEGORIAS.map((c) => c.nombre) },
  { key: 'nivel', label: 'Nivel', vacio: 'Todos los niveles', opciones: NIVELES.map((n) => n.nombre) },
  { key: 'idioma', label: 'Idioma', vacio: 'Todos los idiomas', opciones: ['Español', 'Inglés', 'Portugués'] },
]

/** ?categoria=cfq-XXX → el nombre de esa categoría, para filtrar con él. */
export const categoriaDeEnlace = (id: string | null) => (id ? (CATEGORIAS.find((c) => c.id === id)?.nombre ?? '') : '')

const cumple = (item: Item, f: Filtros) =>
  (!f.tipo || item.tarjeta.tipo === f.tipo) &&
  (!f.categoria || nombreCategoria(item.categoriaId) === f.categoria) &&
  (!f.nivel || item.tarjeta.nivel === f.nivel) &&
  (!f.idioma || item.tarjeta.idioma === f.idioma)

/**
 * La lista que se ve: los contenidos que cumplen búsqueda y filtros y, si se buscó algo o se filtró por «Sesión»,
 * también las sesiones que coinciden (primero). La búsqueda mira título, competencia, tipo y nivel; en las sesiones,
 * además, el evento, la fecha, la hora y quien la dicta.
 */
export function listaVisible(busqueda: string, f: Filtros, sesiones: Item[]) {
  const q = busqueda.trim().toLowerCase()
  const contenidos = CONTENIDOS_EMPRESA.filter(
    (i) =>
      cumple(i, f) && (!q || [i.tarjeta.titulo, i.tarjeta.competencia, i.tarjeta.tipo, i.tarjeta.nivel].some((c) => c.toLowerCase().includes(q))),
  )
  const conSesiones = Boolean(q) || f.tipo === 'Sesión'
  const sesionesQueCoinciden = conSesiones
    ? sesiones.filter((i) => {
        if (!cumple(i, f)) return false
        if (!q) return true
        const s = i.sesion
        const fecha = s ? s.inicio.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
        return [i.tarjeta.titulo, s?.evento, fecha, i.tarjeta.duracion, i.tarjeta.tipo, i.tarjeta.proveedor, i.tarjeta.nivel, 'sesión']
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
    : []
  return [...sesionesQueCoinciden, ...contenidos]
}
