import type { Formulario, Modo } from './logica'
import { descripcionFiltro } from './logica'

// La vista previa del correo que llega al confirmar (RN-04): una dirección por modo, con los datos de la solicitud en
// la consulta para que se pueda abrir o compartir tal cual.

export const RUTA_CORREO = '/admin/aprendizaje/certificados/correo'

// Fecha local (no UTC): con toISOString un día a medianoche puede salir como el anterior según la zona horaria.
const iso = (fecha: Date | undefined) =>
  fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : ''

export function urlCorreo(f: Formulario) {
  const consulta = new URLSearchParams({ desde: iso(f.rango?.from), hasta: iso(f.rango?.to), para: f.correo.trim() })
  const nombre = descripcionFiltro(f)
  if (nombre) consulta.set('nombre', nombre)
  return `${RUTA_CORREO}/${f.modo}?${consulta.toString()}`
}

/** Como en el prototipo: el correo se abre en otra pestaña; si el navegador bloquea la ventana, en esta misma. */
export function abrirCorreo(f: Formulario) {
  const url = urlCorreo(f)
  const ventana = window.open(url, '_blank')
  if (ventana) ventana.opener = null
  else window.location.assign(url)
}

export const esModo = (valor: string | undefined): valor is Modo => valor === 'global' || valor === 'contenido' || valor === 'colaborador'
