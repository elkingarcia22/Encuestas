import { useEffect, useState } from 'react'
import type { DatosAsistencia, SesionAsistencia } from '../../crear-contenido/components/borrador'
import { leerFecha, normalizarHora } from '../../crear-contenido/components/asistencia/sesiones'

// Las reglas de la asistencia de quien estudia (HU-APR-009), aparte de la tarjeta que las pinta: cuándo está abierta
// una sesión, cuándo una página de asistencia queda completada y cuándo el índice la marca «En vivo».

/** Las sesiones confirmadas: el id de cada una y la hora (en milisegundos) a la que se confirmó. */
export type Confirmaciones = Record<string, number>

export type EstadoSesion = 'confirmada' | 'en-curso' | 'futura' | 'expirada' | 'por-definir'

/** El inicio y el fin de una sesión como fechas. Sin fecha u hora válidas, o con el fin antes del inicio, no hay ventana. */
export function ventanaDeSesion(sesion: SesionAsistencia) {
  const dia = leerFecha(sesion.fecha)
  const inicio = normalizarHora(sesion.inicio)
  const fin = normalizarHora(sesion.fin)
  if (!dia || !inicio || !fin) return null
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  const desde = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hi, mi)
  const hasta = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hf, mf)
  return hasta.getTime() > desde.getTime() ? { desde, hasta } : null
}

export function estadoDeSesion(sesion: SesionAsistencia, confirmaciones: Confirmaciones, ahora: number): EstadoSesion {
  if (confirmaciones[sesion.id]) return 'confirmada'
  const ventana = ventanaDeSesion(sesion)
  if (!ventana) return 'por-definir'
  if (ahora < ventana.desde.getTime()) return 'futura'
  if (ahora < ventana.hasta.getTime()) return 'en-curso'
  return 'expirada'
}

/** Con una sola sesión confirmada la página cuenta como completada (gating de HU-APR-009). Sin sesiones no hay qué confirmar. */
export const asistenciaCompletada = (datos: DatosAsistencia | undefined, confirmaciones: Confirmaciones) =>
  !datos || datos.sesiones.length === 0 || datos.sesiones.some((s) => confirmaciones[s.id])

/** RN-10: alguna sesión está en curso y la página aún no está completada → el índice dice «En vivo». */
export const asistenciaEnVivo = (datos: DatosAsistencia | undefined, confirmaciones: Confirmaciones, ahora: number) =>
  datos ? !asistenciaCompletada(datos, confirmaciones) && datos.sesiones.some((s) => estadoDeSesion(s, confirmaciones, ahora) === 'en-curso') : false

/** La hora de ahora, al día cada `cadaMs`. Con 0 no corre: quien no tiene nada que vigilar no vuelve a pintar. */
export function useAhora(cadaMs: number) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    if (!cadaMs) return
    const id = window.setInterval(() => setAhora(Date.now()), cadaMs)
    return () => window.clearInterval(id)
  }, [cadaMs])
  return ahora
}
