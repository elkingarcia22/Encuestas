import type { AlignmentNode } from '../../../../modelo/constructor/alignmentGraph'

// La geometría del lienzo, sin React: dónde está cada cosa en el plano y cómo se encuadra. Vive aparte porque el
// lienzo, los conectores y la capa de tarjetas la comparten, y una curva calculada dos veces de dos maneras deja la
// flecha separada de su botón de cortar.

export interface Punto {
  x: number
  y: number
}

/** Desplazamiento (x, y) y escala (k) del plano dentro del marco. */
export interface Vista {
  x: number
  y: number
  k: number
}

export type Posiciones = Readonly<Record<string, Punto>>

/** Aire entre la punta de la flecha y la tarjeta: pegada al borde, el punto de la tarjeta se traga la punta. */
export const HOLGURA_PUERTO = 13
export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 1.8
/** El encuadre automático no baja de aquí: un mapa entero pero ilegible es una miniatura, no un encuadre. */
const ZOOM_MIN_ENCUADRE = 0.45
// Al encuadrar solo, el mapa no pasa del tamaño real: con pocas tarjetas y mucho sitio (pantalla completa) llegaba al
// 180 % y las tarjetas se veían enormes (20-oct). Con «+» se sigue pudiendo acercar hasta ZOOM_MAX.
const ZOOM_MAX_ENCUADRE = 1
const MARGEN_ENCUADRE = 40
/** Al soltar una tarjeta se ajusta a esta rejilla, para que las columnas vuelvan a quedar alineadas sin esfuerzo. */
export const REJILLA = 8
export const VISTA_INICIAL: Vista = { x: 40, y: 24, k: 0.85 }

const limitar = (k: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, k))

/** Acerca o aleja manteniendo quieto el punto (px, py) del marco: el que está bajo el cursor o el centro. */
export function zoomEn(vista: Vista, factor: number, px: number, py: number): Vista {
  const k = limitar(vista.k * factor)
  return { k, x: px - ((px - vista.x) / vista.k) * k, y: py - ((py - vista.y) / vista.k) * k }
}

/** La vista que deja el mapa entero dentro del marco, o su esquina de arriba si entero no se leería. */
export function encuadrar(nodos: readonly AlignmentNode[], ancho: number, alto: number): Vista | null {
  if (nodos.length === 0 || ancho === 0 || alto === 0) return null
  const minX = Math.min(...nodos.map((n) => n.x))
  const minY = Math.min(...nodos.map((n) => n.y))
  const anchoMapa = Math.max(1, Math.max(...nodos.map((n) => n.x + n.width)) - minX)
  const altoMapa = Math.max(1, Math.max(...nodos.map((n) => n.y + n.height)) - minY)
  const k = Math.min(ZOOM_MAX_ENCUADRE, Math.max(ZOOM_MIN_ENCUADRE, Math.min((ancho - MARGEN_ENCUADRE * 2) / anchoMapa, (alto - MARGEN_ENCUADRE * 2) / altoMapa)))
  // Lo que cabe se centra; lo que no, arranca pegado al margen: centrar un mapa más alto que el marco esconde su principio.
  const sobraX = ancho - anchoMapa * k
  const sobraY = alto - altoMapa * k
  return { k, x: (sobraX > 0 ? sobraX / 2 : MARGEN_ENCUADRE) - minX * k, y: (sobraY > 0 ? sobraY / 2 : MARGEN_ENCUADRE) - minY * k }
}

const curvatura = (desde: Punto, hasta: Punto) => Math.max(60, Math.abs(desde.x - hasta.x) * 0.45)

/** La curva entre dos puntos, horizontal en las puntas: entra y sale perpendicular a la tarjeta, no en diagonal. */
export function curva(desde: Punto, hasta: Punto): string {
  const c = curvatura(desde, hasta)
  return `M ${desde.x} ${desde.y} C ${desde.x - c} ${desde.y}, ${hasta.x + c} ${hasta.y}, ${hasta.x} ${hasta.y}`
}

/** El punto medio real de esa curva (t = 0,5): ahí van la cifra de la flecha y su botón de cortar. */
export function puntoMedio(desde: Punto, hasta: Punto): Punto {
  const c = curvatura(desde, hasta)
  return { x: (desde.x + 3 * (desde.x - c) + 3 * (hasta.x + c) + hasta.x) / 8, y: (desde.y + 3 * desde.y + 3 * hasta.y + hasta.y) / 8 }
}

/** De dónde sale la flecha de una tarjeta (su borde izquierdo) y a dónde llega (el borde derecho de la otra). */
export const salidaDe = (nodo: AlignmentNode): Punto => ({ x: nodo.x - HOLGURA_PUERTO, y: nodo.y + nodo.height / 2 })
export const llegadaA = (nodo: AlignmentNode): Punto => ({ x: nodo.x + nodo.width + HOLGURA_PUERTO, y: nodo.y + nodo.height / 2 })

/** El objetivo de la empresa que hay bajo un punto del plano, si hay alguno. */
export function empresaEn(nodos: readonly AlignmentNode[], punto: Punto): string | null {
  const nodo = nodos.find((n) => n.kind === 'company' && punto.x >= n.x && punto.x <= n.x + n.width && punto.y >= n.y && punto.y <= n.y + n.height)
  return nodo?.id ?? null
}
