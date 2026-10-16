import { useSyncExternalStore } from 'react'
import { File01Icon } from '@hugeicons/core-free-icons'
import type { VacanteNueva } from '../crear/components/formulario'
import { QUIEN_MUEVE } from '../../propuestas/movimientos'
import { CATALOGO_PLANTILLAS, CATEGORIAS_PLANTILLA, tonoDeCategoria, type CategoriaPlantilla, type PlantillaCatalogo } from './datos'

// Las plantillas que crea la persona. Se arman con el mismo flujo de «Crear vacante» y guardan la
// vacante completa, así que usarlas o editarlas vuelve a abrir el flujo con todo lleno. Solo estas se
// editan y se eliminan: las del sistema (CATALOGO_PLANTILLAS) no. La categoría de una plantilla es el
// área de su vacante: las áreas que la persona crea (en el paso 1) quedan disponibles para todo y salen
// como categoría en el catálogo. Viven fuera de React para seguir ahí al ir y volver
// entre el catálogo y el flujo; se reinician al recargar, como los datos de ejemplo.
//
// 7 oct: cada plantilla tiene dueña y solo ella la edita o la elimina; las demás (de una compañera o del sistema) se
// duplican para ajustarlas (IN-44). No se guardan dos con el mismo nombre ni una sin nombre (IN-43), y eliminar se puede
// deshacer (IN-48).

export type PlantillaPropia = PlantillaCatalogo & { propia: true; vacante: VacanteNueva; duena: string }

type Estado = { plantillas: readonly PlantillaPropia[]; categorias: readonly CategoriaPlantilla[] }

let estado: Estado = { plantillas: [], categorias: [] }
const oyentes = new Set<() => void>()

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

const leerPlantillas = () => estado.plantillas
const leerCategorias = () => estado.categorias

function reemplazar(cambio: Partial<Estado>) {
  estado = { ...estado, ...cambio }
  oyentes.forEach((oyente) => oyente())
}

export function usePlantillasPropias(): readonly PlantillaPropia[] {
  return useSyncExternalStore(suscribir, leerPlantillas)
}

// Las áreas que creó la persona, además de las del sistema: cada una es también una categoría del catálogo.
export function useCategoriasPropias(): readonly CategoriaPlantilla[] {
  return useSyncExternalStore(suscribir, leerCategorias)
}

/** La categoría que creó la persona con ese id (fuera de React, para las vistas que no son un componente). */
export const categoriaPropiaPorId = (id: string) => estado.categorias.find((categoria) => categoria.id === id)

export const plantillaPropiaPorId = (id: string) => estado.plantillas.find((plantilla) => plantilla.id === id)

const mismoNombre = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// «Tecnología» (un área) y «Tecnología y datos» (una categoría del sistema) son lo mismo: se reconocen por el inicio del nombre.
function categoriaPorNombre(nombre: string) {
  const buscado = nombre.trim().toLowerCase()
  return [...CATEGORIAS_PLANTILLA, ...estado.categorias].find(
    (categoria) => mismoNombre(categoria.nombre, nombre) || categoria.nombre.toLowerCase().startsWith(`${buscado} `),
  )
}

/** Crea el área (y con ella la categoría) si no existe y devuelve la que quede. */
export function crearCategoria(nombre: string): CategoriaPlantilla {
  const existente = categoriaPorNombre(nombre)
  if (existente) return existente
  const nueva = { id: `categoria-${estado.categorias.length + 1}-${Date.now()}`, nombre: nombre.trim(), detalle: 'Área creada por ti.' }
  reemplazar({ categorias: [...estado.categorias, nueva] })
  return nueva
}

export const esPropia = (plantilla: PlantillaCatalogo): plantilla is PlantillaPropia => 'propia' in plantilla

// Solo quien la creó la edita o la elimina.
export const esMia = (plantilla: PlantillaPropia) => plantilla.duena === QUIEN_MUEVE

/** Por qué no se puede guardar con ese nombre, o null si se puede (IN-43). `id` es la que se está editando. */
export function problemaConNombre(nombre: string, id?: string): string | null {
  if (!nombre.trim()) return 'Ponle un nombre: es como la vas a encontrar en el catálogo.'
  const repetida = [...estado.plantillas.filter((plantilla) => plantilla.id !== id), ...CATALOGO_PLANTILLAS].find((plantilla) => mismoNombre(plantilla.nombre, nombre))
  if (!repetida) return null
  const deQuien = esPropia(repetida) ? (esMia(repetida) ? ', creada por ti' : `, de ${repetida.duena}`) : ', del catálogo de UBITS'
  return `Ya hay una plantilla «${repetida.nombre}»${deQuien}. Usa otro nombre para no confundirlas.`
}

// «Ejecutivo comercial (copia)», «(copia 2)»… el primero que no exista.
function nombreLibre(base: string) {
  const ocupado = (nombre: string) => [...estado.plantillas, ...CATALOGO_PLANTILLAS].some((plantilla) => mismoNombre(plantilla.nombre, nombre))
  let nombre = `${base} (copia)`
  for (let n = 2; ocupado(nombre); n++) nombre = `${base} (copia ${n})`
  return nombre
}

// De la vacante sale lo que muestra el catálogo: el nombre, un resumen corto y cuántas etapas tiene.
// `categoria`: la de la plantilla de la que salió (una copia va junto a su original, no a un área nueva).
function aPlantilla(id: string, vacante: VacanteNueva, duena: string, categoria?: string): PlantillaPropia {
  const detalle = [vacante.area, vacante.seniority].filter(Boolean).join(' · ')
  const categoriaId = categoria ?? crearCategoria(vacante.area || 'Sin área').id
  return {
    id,
    categoriaId,
    nombre: vacante.nombre.trim() || 'Plantilla sin nombre',
    detalle: detalle || 'Sin área ni nivel todavía.',
    etapas: vacante.etapas.length,
    icono: File01Icon,
    tono: tonoDeCategoria(categoriaId, estado.categorias),
    propia: true,
    vacante,
    duena,
  }
}

/** Crea la plantilla si el id no existe; si existe, la reemplaza (editar). Devuelve su id. */
export function guardarPlantillaPropia(id: string | undefined, vacante: VacanteNueva, categoria?: string) {
  const destino = id ?? `propia-${estado.plantillas.length + 1}-${Date.now()}`
  const { plantillas } = estado
  // Editarla no le cambia la dueña, y si no se cambió el área, tampoco la categoría.
  const antes = plantillas.find((plantilla) => plantilla.id === destino)
  const nueva = aPlantilla(destino, vacante, antes?.duena ?? QUIEN_MUEVE, categoria ?? (antes && antes.vacante.area === vacante.area ? antes.categoriaId : undefined))
  const existe = plantillas.some((plantilla) => plantilla.id === destino)
  reemplazar({ plantillas: existe ? plantillas.map((plantilla) => (plantilla.id === destino ? nueva : plantilla)) : [nueva, ...plantillas] })
  return destino
}

/** La saca del catálogo y devuelve cómo deshacerlo: vuelve al mismo lugar. */
export function eliminarPlantillaPropia(id: string) {
  const indice = estado.plantillas.findIndex((plantilla) => plantilla.id === id)
  const quitada = estado.plantillas[indice]
  reemplazar({ plantillas: estado.plantillas.filter((plantilla) => plantilla.id !== id) })
  return () => {
    if (!quitada || estado.plantillas.some((plantilla) => plantilla.id === id)) return
    const plantillas = [...estado.plantillas]
    plantillas.splice(Math.min(indice, plantillas.length), 0, quitada)
    reemplazar({ plantillas })
  }
}

/** Una copia a tu nombre de cualquier plantilla (tuya, de una compañera o del sistema), para ajustarla. Devuelve su id. */
export function duplicarPlantilla(origen: PlantillaCatalogo, vacante: VacanteNueva) {
  return guardarPlantillaPropia(undefined, { ...vacante, nombre: nombreLibre(origen.nombre) }, origen.categoriaId)
}

// La plantilla de ejemplo de una compañera: con ella se ve que cada una dice de quién es (IN-44). Una sola vez.
let sembrada = false
export function sembrarPlantilla(vacante: VacanteNueva, duena: string, categoria: string) {
  if (sembrada) return
  sembrada = true
  reemplazar({ plantillas: [...estado.plantillas, aPlantilla(`propia-ejemplo-${duena.split(' ')[0].toLowerCase()}`, vacante, duena, categoria)] })
}
