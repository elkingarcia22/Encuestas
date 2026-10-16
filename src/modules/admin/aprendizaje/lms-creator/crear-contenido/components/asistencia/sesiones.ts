// Reglas de las sesiones del recurso Asistencia (HU-recurso-asistencia).
//
// Formato guardado en `SesionAsistencia`: `fecha` en «aaaa-mm-dd» (día local) e `inicio` / `fin` en «HH:MM».
// En pantalla la fecha se elige con el CampoFecha del sistema y se lee como «1 oct 2026».

import type { DatosAsistencia, SesionAsistencia } from '../borrador'

export const MAX_NOMBRE_SESION = 80

let consecutivo = 0
export const idSesion = () => `as-${Date.now().toString(36)}-${(consecutivo++).toString(36)}`

export const nombrePorDefecto = (indice: number) => `Sesión ${indice + 1}`

const dos = (n: number) => String(n).padStart(2, '0')

/** Fecha local → «aaaa-mm-dd». */
export const aFechaGuardada = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`

/** «aaaa-mm-dd» (o «dd/mm/aaaa») → Date local, o null si no es una fecha válida. */
export function leerFecha(fecha: string): Date | null {
  const texto = fecha.trim()
  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  const ui = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const [a, m, d] = iso ? [iso[1], iso[2], iso[3]] : ui ? [ui[3], ui[2], ui[1]] : []
  if (!a) return null
  const anio = Number(a)
  const mes = Number(m)
  const dia = Number(d)
  if (!anio || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const fechaLocal = new Date(anio, mes - 1, dia)
  return Number.isNaN(fechaLocal.getTime()) ? null : fechaLocal
}

/** «H:MM» o «HH:MM» válida (0–23 / 0–59) → «HH:MM»; si no, null. */
export function normalizarHora(hora: string): string | null {
  const m = hora.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return `${dos(h)}:${dos(min)}`
}

/** Una sesión nueva: «Sesión n», hoy, de 09:00 a 10:00, sin descripción. */
export function sesionNueva(indice: number): SesionAsistencia {
  return { id: idSesion(), nombre: nombrePorDefecto(indice), fecha: aFechaGuardada(new Date()), inicio: '09:00', fin: '10:00', descripcion: '' }
}

/** Una sesión está lista con fecha y horas válidas. No se valida que el fin sea después del inicio ni los cruces. */
export const sesionCompleta = (s: SesionAsistencia) => Boolean(leerFecha(s.fecha) && normalizarHora(s.inicio) && normalizarHora(s.fin))

/** «Confirmar» se habilita con al menos una sesión y todas completas. */
export const asistenciaLista = (sesiones: SesionAsistencia[]) => sesiones.length > 0 && sesiones.every(sesionCompleta)

/** Lo que se entrega al confirmar: nombres vacíos → «Sesión n», horas normalizadas y descripciones recortadas. */
export function asistenciaConfirmada(datos: DatosAsistencia): DatosAsistencia {
  return {
    instrucciones: datos.instrucciones,
    autoasistencia: datos.autoasistencia,
    sesiones: datos.sesiones.map((s, i) => ({
      ...s,
      nombre: s.nombre.trim() || nombrePorDefecto(i),
      fecha: aFechaGuardada(leerFecha(s.fecha) ?? new Date()),
      inicio: normalizarHora(s.inicio) ?? s.inicio,
      fin: normalizarHora(s.fin) ?? s.fin,
      descripcion: s.descripcion.trim(),
    })),
  }
}

const MES_CORTO = new Intl.DateTimeFormat('es-CO', { month: 'short' })

/** Ventana de la sesión: «12 oct 2026 · 09:00 – 10:00». */
/** El día y el mes de una sesión, por separado, para el bloque de fecha de la tarjeta. Sin fecha válida, vacíos. */
export function diaDeSesion(s: SesionAsistencia) {
  const d = leerFecha(s.fecha)
  if (!d) return { dia: '', mes: '' }
  return { dia: dos(d.getDate()), mes: MES_CORTO.format(d).replace('.', '') }
}

/** «09:00 – 11:00», o lo que haya escrito si todavía no es una hora válida. */
export function horarioDeSesion(s: SesionAsistencia) {
  return `${normalizarHora(s.inicio) ?? s.inicio} – ${normalizarHora(s.fin) ?? s.fin}`
}

export function ventanaSesion(s: SesionAsistencia) {
  const d = leerFecha(s.fecha)
  const dia = d ? `${dos(d.getDate())} ${MES_CORTO.format(d).replace('.', '')} ${d.getFullYear()}` : s.fecha
  return `${dia} · ${normalizarHora(s.inicio) ?? s.inicio} – ${normalizarHora(s.fin) ?? s.fin}`
}
