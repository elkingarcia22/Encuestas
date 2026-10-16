import {
  BDS_CONTENIDOS_UBITS,
  BD_MASTER_ALIADOS,
  BD_MASTER_COMPETENCIAS,
  BD_MASTER_HABILIDADES,
  CATEGORIAS,
  CONTENIDOS,
  NIVELES,
  NIVELES_INGLES,
  nombreNivel,
} from '@/shared/bd'

// Lo que se puede meter en una ruta: **las dos fuentes juntas**, el catálogo de UBITS y lo que creó la empresa.
//
// Es lo primero que pregunta quien arma una ruta —«¿esto lo hicimos nosotros o viene de UBITS?»— y por eso el origen
// es un filtro de primera clase y una etiqueta en la tarjeta, no un dato escondido (Dave, 2-oct). En el LMS de hoy el
// catálogo de UBITS es la mayor parte de lo que hay disponible: una ruta que solo pudiera usar contenido propio sería
// casi inservible.

export type OrigenContenido = 'empresa' | 'ubits'

/** Un contenido elegible, venga de donde venga, con lo justo para pintarlo y filtrarlo. */
export type Elegible = {
  id: string
  titulo: string
  imagen: string
  tipo: string
  minutos: number
  idioma: string
  nivel: string
  /** De qué trata: la categoría si es de la empresa, la competencia si es de UBITS. */
  categoria: string
  /** Solo UBITS: la habilidad concreta dentro de esa competencia. */
  habilidad: string
  /** Solo UBITS: quién produce el contenido. */
  aliado: string
  /** Solo UBITS: quién lo dicta. */
  expertos: string[]
  /** Solo UBITS y solo en los contenidos en inglés: qué inglés hace falta para seguirlo. */
  nivelIngles: string
  origen: OrigenContenido
  /**
   * A quién le llega. De la empresa se pueden elegir los publicados y los privados; de UBITS, solo lo publicado, que
   * es todo lo suyo. Va en insignia bajo el título porque dice si ese escalón de la ruta le llega a todo el mundo.
   */
  visibilidad: 'Publicado' | 'Privado'
}

/** Qué visibilidades admite una ruta (HU-LMS-013 · RN-10 a RN-12). */
const ELEGIBLES = new Set(['Publicado', 'Privado'])

const categoria = (id: string) => CATEGORIAS.find((c) => c.id === id)?.nombre ?? ''

/**
 * Cómo está clasificado un contenido, sea de donde sea. Lo de la empresa va por **categoría** —las crea cada
 * empresa— y lo de UBITS por **competencia**: son dos nombres para lo mismo a la hora de buscar, así que van en la
 * misma columna y bajo el mismo filtro. Dejarla vacía para los de UBITS escondía el único dato que dice de qué trata
 * cada uno (Dave, 2-oct).
 */
const COMPETENCIAS = (BD_MASTER_COMPETENCIAS as { competencias: { id: string; nombre: string }[] }).competencias
const competencia = (id?: string) => COMPETENCIAS.find((c) => c.id === id)?.nombre ?? ''

/**
 * Tres datos que **solo existen en el Creator interno de UBITS** y que el creador de una empresa ni ve ni llena:
 * la **habilidad** (dentro de su competencia), los **expertos** que dictan el contenido y el **nivel de inglés** que
 * hace falta para seguirlo. En las columnas de lo que creó la empresa van vacíos, y no se inventan (Dave, 2-oct).
 */
const HABILIDADES = (BD_MASTER_HABILIDADES as { habilidades: { id: string; nombre: string }[] }).habilidades
const habilidad = (id?: string) => HABILIDADES.find((h) => h.id === id)?.nombre ?? ''

/** Quién produce el contenido. Lo de la empresa lo produce la empresa, así que ahí no hay aliado que nombrar. */
const ALIADOS = (BD_MASTER_ALIADOS as { aliados: { id: string; nombre: string }[] }).aliados
const aliado = (id?: string) => ALIADOS.find((a) => a.id === id)?.nombre ?? ''

/** Las rutas de la base de UBITS vienen sin «/» inicial. */
const ruta = (valor?: string | null) => (valor ? (valor.startsWith('/') ? valor : `/${valor}`) : '')

type ItemUbits = {
  id: string
  titulo: string
  imagen?: string
  tipoContenido?: string
  tiempoValor?: number
  unidadTiempo?: string
  idioma?: string
  nivelId?: string
  competenciaPrincipalId?: string
  habilidadPrincipalId?: string
  aliadoId?: string
  expertos?: string[]
  nivelIngles?: string | null
}

const DE_LA_EMPRESA: Elegible[] = CONTENIDOS.filter((c) => ELEGIBLES.has(c.visibilidad)).map((c) => ({
  id: c.id,
  titulo: c.titulo,
  imagen: c.imagen,
  tipo: c.tipo,
  minutos: c.minutos,
  idioma: c.idioma,
  nivel: nombreNivel(c.nivelId),
  categoria: categoria(c.categoriaId),
  // Habilidad, aliado, expertos y nivel de inglés son del Creator de UBITS: en lo de la empresa no existen.
  habilidad: '',
  aliado: '',
  expertos: [],
  nivelIngles: '',
  origen: 'empresa',
  visibilidad: c.visibilidad as 'Publicado' | 'Privado',
}))

// Los de UBITS no tienen visibilidad —ya vienen publicados— y su clasificación es la **competencia**, que es lo que
// en el catálogo de la empresa es la categoría: va en el mismo sitio.
const DE_UBITS: Elegible[] = (BDS_CONTENIDOS_UBITS as { contents: ItemUbits[] }).contents.map((c) => ({
  id: c.id,
  titulo: c.titulo,
  imagen: ruta(c.imagen),
  tipo: c.tipoContenido ?? 'Curso',
  minutos: c.unidadTiempo === 'horas' ? (c.tiempoValor ?? 0) * 60 : (c.tiempoValor ?? 0),
  idioma: c.idioma ?? 'Español',
  nivel: nombreNivel(c.nivelId ?? 'niv-001'),
  categoria: competencia(c.competenciaPrincipalId),
  habilidad: habilidad(c.habilidadPrincipalId),
  aliado: aliado(c.aliadoId),
  expertos: c.expertos ?? [],
  // Solo los que están en inglés lo llevan: en un contenido en español no significa nada.
  nivelIngles: c.nivelIngles ?? '',
  origen: 'ubits',
  // Todo el catálogo de UBITS es público: no hay contenido suyo que una empresa no pueda poner en una ruta.
  visibilidad: 'Publicado',
}))

export const ELEGIBLES_RUTA: Elegible[] = [...DE_LA_EMPRESA, ...DE_UBITS]

export const porId = (id: string) => ELEGIBLES_RUTA.find((c) => c.id === id)

export const ORIGENES: Record<OrigenContenido, string> = {
  empresa: 'De mi empresa',
  ubits: 'UBITS',
}

const sinTildes = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Las opciones de los filtros por columna: solo lo que de verdad hay en la lista. */
export const TIPOS_ELEGIBLES = [...new Set(ELEGIBLES_RUTA.map((c) => c.tipo))].sort()
export const NIVELES_ELEGIBLES = NIVELES.map((n) => n.nombre)
export const IDIOMAS_ELEGIBLES = [...new Set(ELEGIBLES_RUTA.map((c) => c.idioma))].sort()
/** Categorías de la empresa y competencias de UBITS, juntas: en esa columna conviven las dos. */
export const CLASIFICACIONES = [...new Set(ELEGIBLES_RUTA.map((c) => c.categoria).filter(Boolean))].sort()
export const HABILIDADES_ELEGIBLES = [...new Set(ELEGIBLES_RUTA.map((c) => c.habilidad).filter(Boolean))].sort()
export const ALIADOS_ELEGIBLES = [...new Set(ELEGIBLES_RUTA.map((c) => c.aliado).filter(Boolean))].sort()
/** En el orden del marco, no alfabético: «A2+» va después de «A2», no entre «A2» y «B1». */
export const INGLES_ELEGIBLES = NIVELES_INGLES.filter((n) => ELEGIBLES_RUTA.some((c) => c.nivelIngles === n))

/**
 * Si una fila pasa la búsqueda y los filtros por columna, con la forma que espera `TablaSeleccion`. La cuadrícula usa
 * la misma función con la lista de filtros vacía, para que buscar signifique lo mismo en las dos vistas.
 */
export function coincideElegible(c: Elegible, busqueda: string, filtros: { id: string; value: unknown }[]) {
  const marcados = (id: string) => {
    const valor = filtros.find((f) => f.id === id)?.value
    return Array.isArray(valor) ? (valor as string[]) : []
  }
  const origen = marcados('origen')
  if (origen.length && !origen.includes(ORIGENES[c.origen])) return false
  for (const campo of ['tipo', 'nivel', 'idioma', 'categoria', 'habilidad', 'aliado', 'nivelIngles'] as const) {
    const elegidos = marcados(campo)
    if (elegidos.length && !elegidos.includes(c[campo])) return false
  }
  return !busqueda || sinTildes(`${c.titulo} ${c.tipo} ${c.categoria} ${c.habilidad} ${c.aliado} ${c.expertos.join(' ')}`).includes(sinTildes(busqueda))
}
