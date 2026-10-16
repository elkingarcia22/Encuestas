import { useSyncExternalStore } from 'react'
import { AVISOS_INICIALES, USUARIO_ACTUAL, type Aviso, type Cambio } from './datos'

// Lista de avisos compartida entre la lista y el editor: lo que se guarda o publica en el editor
// se ve al volver a la lista, y lo que se archiva queda en el historial. Vive en memoria.

let avisos = AVISOS_INICIALES
const oyentes = new Set<() => void>()

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
const leer = () => avisos

export const useAvisos = () => useSyncExternalStore(suscribir, leer, leer)

export const buscarAviso = (id: string | undefined) => avisos.find((aviso) => aviso.id === id)

export function guardarAviso(aviso: Aviso) {
  avisos = avisos.some((actual) => actual.id === aviso.id)
    ? avisos.map((actual) => (actual.id === aviso.id ? aviso : actual))
    : [aviso, ...avisos]
  oyentes.forEach((oyente) => oyente())
}

let secuencia = 200
export const nuevoId = () => {
  secuencia += 1
  return `av-${secuencia}`
}

// «Hoy» de la maqueta, con la hora real para que el historial se vea al día.
export const ahora = () => {
  const fecha = new Date()
  fecha.setFullYear(2026, 8, 16)
  return fecha.toISOString()
}
export const hoy = () => ahora().slice(0, 10)

export const registro = (accion: string, detalle?: string): Cambio => ({
  id: `c-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  fecha: ahora(),
  autor: USUARIO_ACTUAL,
  accion,
  detalle,
})

export function archivarAviso(id: string) {
  const aviso = buscarAviso(id)
  if (!aviso) return
  guardarAviso({
    ...aviso,
    estado: 'Archivado',
    historial: [registro('Archivó el aviso', 'Dejó de verse en el inicio de los colaboradores'), ...aviso.historial],
  })
}
