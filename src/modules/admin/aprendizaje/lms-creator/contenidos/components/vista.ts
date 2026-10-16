// Lo que el listado necesita de cada contenido, resuelto desde la base compartida:
// la BD guarda ids (nivel, categoría) y aquí se convierten en los nombres que se ven.

import { HeadphonesIcon, Mortarboard01Icon, Route01Icon } from '@hugeicons/core-free-icons'
import { Calendar03Icon, FileEditIcon, Mic01Icon, Video01Icon } from '@hugeicons/core-free-icons'
import { CONTENIDOS, nombreCategoria, nombreNivel, type Contenido, type Visibilidad } from '@/shared/bd'
import type { ContenidoDeCatalogo } from '@/shared/bd/catalogos'

export type Fila = Contenido & { nivel: string; categoria: string }

/** Los contenidos de un catálogo, con el nivel y la categoría ya resueltos a texto. */
export const aFilas = (contenidos: ContenidoDeCatalogo[]): Fila[] =>
  contenidos.map((contenido) => ({
    ...contenido,
    nivel: nombreNivel(contenido.nivelId),
    // Lo de UBITS trae su clasificación ya resuelta (es una competencia, no una categoría de la empresa).
    categoria: contenido.categoria ?? nombreCategoria(contenido.categoriaId),
  }))

export const FILAS: Fila[] = aFilas(CONTENIDOS)

export const BADGE: Record<Visibilidad, 'secondary' | 'success-light' | 'info-light' | 'warning-light' | 'outline'> = {
  Publicado: 'success-light',
  Privado: 'info-light',
  Borrador: 'secondary',
  Oculto: 'warning-light',
  Archivado: 'outline',
}

// Un icono por tipo; los que no están en esta lista caen en el de curso.
const ICONOS: Record<string, typeof Mortarboard01Icon> = {
  Curso: Mortarboard01Icon,
  'Ruta de aprendizaje': Route01Icon,
  Evento: Calendar03Icon,
  Podcast: HeadphonesIcon,
  Charla: Mic01Icon,
  Artículo: FileEditIcon,
  Short: Video01Icon,
  Programa: Route01Icon,
}

export const iconoTipo = (tipo: string) => ICONOS[tipo] ?? Mortarboard01Icon

export const duracion = (minutos: number) =>
  minutos >= 60 ? `${Math.round((minutos / 60) * 10) / 10} h`.replace('.', ',') : `${minutos} min`

export const fechaCorta = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })

// Cuántos contenidos se ven por página. Múltiplos de 12 para que la cuadrícula
// cierre filas completas tanto a 3 como a 4 columnas.
export const POR_PAGINA = [
  { value: '12', label: '12' },
  { value: '24', label: '24' },
  { value: '48', label: '48' },
]

export const POR_PAGINA_INICIAL = 12

// Los números que muestra el paginador: los extremos, los vecinos de la página actual
// y puntos suspensivos en los saltos.
export function listaPaginas(actual: number, total: number): (number | 'salto')[] {
  const paginas: (number | 'salto')[] = []
  for (let pagina = 1; pagina <= total; pagina++) {
    if (pagina === 1 || pagina === total || Math.abs(pagina - actual) <= 1) paginas.push(pagina)
    else if (paginas.at(-1) !== 'salto') paginas.push('salto')
  }
  return paginas
}
