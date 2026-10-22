// Al finalizar, el contenido pasa a la lista de Contenidos: allí aparece de primero, con su tarjeta, y un aviso de éxito.
// Como en el prototipo de referencia, la tarjeta vive en la sesión (se pierde al recargar la lista).

import { nombreCategoria } from '@/shared/bd'
import { borradorVacio, claseDe, minutosDeRuta, reemplazarBorrador, type Borrador, type ClaseCreacion } from './borrador'
import { TIPOS_CONTENIDO } from '@/shared/bd'
import { IDIOMAS_CONTENIDO } from './ficha'
import { DEMO_PORTADA, DEMO_TITULO } from './demo'

export const CLAVE_RECIEN_CREADO = 'playground:lms-contenido-recien-creado'

export type RecienCreado = {
  id: string
  titulo: string
  imagen: string
  minutos: number
  categoriaId: string
  categoria: string
  visibilidad: Borrador['visibilidad']
  evento: boolean
  ruta: boolean
}

export function publicarContenido(b: Borrador) {
  const tiempo = Number(b.portada.tiempo.replace(',', '.')) || 30
  const creado: RecienCreado = {
    id: `nuevo-${Date.now().toString(36)}`,
    titulo: b.portada.titulo.trim() || DEMO_TITULO,
    imagen: b.portada.imagen || DEMO_PORTADA,
    // Una ruta no escribe su duración: es la suma de lo que lleva dentro.
    minutos: b.ruta ? minutosDeRuta(b) : Math.round(b.portada.unidad === 'h' ? tiempo * 60 : tiempo),
    categoriaId: b.portada.categoria,
    categoria: nombreCategoria(b.portada.categoria),
    visibilidad: b.visibilidad,
    evento: b.evento,
    ruta: b.ruta,
  }
  try {
    window.sessionStorage.setItem(CLAVE_RECIEN_CREADO, JSON.stringify(creado))
  } catch {
    // Sin almacenamiento, la lista se abre igual, solo sin la tarjeta nueva.
  }
  // El asistente queda en blanco para el siguiente contenido.
  reemplazarBorrador(borradorVacio(claseDe(b)))
}

/** Lo lee la lista de Contenidos al abrir; después lo olvida con `olvidarRecienCreado`. */
export function leerRecienCreado(): RecienCreado | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_RECIEN_CREADO)
    return crudo ? (JSON.parse(crudo) as RecienCreado) : null
  } catch {
    return null
  }
}

export function olvidarRecienCreado() {
  try {
    window.sessionStorage.removeItem(CLAVE_RECIEN_CREADO)
  } catch {
    // Nada que olvidar.
  }
}

/** «Crear contenido», «Crear evento» y «Crear ruta» desde la lista siempre arrancan en blanco. */
export function empezarDeCero(clase: ClaseCreacion = 'contenido') {
  reemplazarBorrador(borradorVacio(clase))
}

/**
 * Retomar un contenido que quedó **en borrador**: el asistente se abre con lo que ya se había llenado, no en blanco.
 * Es lo que hace el playground React, que manda los borradores a `crear-contenido?id=` y los demás a un editor
 * aparte; aquí solo existe el asistente, así que solo los borradores tienen a dónde ir (Dave, 6-oct).
 *
 * Lo que se recupera es la ficha —título, portada, descripción y los datos técnicos—. Las páginas no: en la lista
 * no viajan, y el prototipo no guarda su contenido entre pantallas.
 *
 * Con `relleno` se parte de otro borrador en vez de uno vacío, y entonces la ficha de este contenido se monta sobre
 * **sus** páginas. Es lo que usa la vista previa desde Resultados: sin páginas, la vista del colaborador enseñaba
 * solo la portada y el cierre, que no es la vista previa de nada (Dave, 14-oct).
 */
export function retomarBorrador(contenido: {
  titulo: string
  imagen?: string
  descripcion?: string
  tipo?: string
  nivelId?: string
  categoriaId?: string
  idioma?: string
  minutos?: number
}, relleno?: Borrador) {
  const base = relleno ?? borradorVacio('contenido')
  const horas = (contenido.minutos ?? 0) >= 60 && (contenido.minutos ?? 0) % 60 === 0
  reemplazarBorrador({
    ...base,
    portada: {
      ...base.portada,
      titulo: contenido.titulo,
      imagen: contenido.imagen ?? '',
      descripcion: contenido.descripcion ?? '',
      tipo: TIPOS_CONTENIDO.find((t) => t.nombre === contenido.tipo)?.id ?? base.portada.tipo,
      nivel: contenido.nivelId || base.portada.nivel,
      categoria: contenido.categoriaId ?? '',
      idioma: IDIOMAS_CONTENIDO.find((i) => i.label === contenido.idioma)?.value ?? base.portada.idioma,
      tiempo: String(horas ? (contenido.minutos ?? 0) / 60 : (contenido.minutos ?? 30)),
      unidad: horas ? 'h' : 'min',
    },
  })
}
