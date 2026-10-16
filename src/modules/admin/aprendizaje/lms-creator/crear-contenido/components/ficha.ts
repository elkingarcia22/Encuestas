// La ficha técnica del contenido: los valores que se eligen en la portada (tipo, nivel, idioma, tiempo, categoría) y
// cómo se leen en pantalla. Vivía en el paso «Portada» del asistente anterior; la usan los chips de la ficha, el
// certificado y los recursos (el tráiler y los videos por enlace).

import { CATEGORIAS, NIVELES, TIPOS_CONTENIDO, nombreCategoria } from '@/shared/bd'
import type { Portada } from './borrador'

export const IDIOMAS_CONTENIDO = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
]

export const UNIDADES = [
  { value: 'min', label: 'Minutos' },
  { value: 'h', label: 'Horas' },
]

export const OPCIONES_TIPO = TIPOS_CONTENIDO.map((t) => ({ value: t.id, label: t.nombre }))
export const OPCIONES_NIVEL = NIVELES.map((n) => ({ value: n.id, label: n.nombre }))
export const OPCIONES_CATEGORIA = CATEGORIAS.map((c) => ({ value: c.id, label: c.nombre }))

export const nombreTipo = (id: string) => TIPOS_CONTENIDO.find((t) => t.id === id)?.nombre ?? ''
export const nombreNivel = (id: string) => NIVELES.find((n) => n.id === id)?.nombre ?? ''
export const nombreIdioma = (id: string) => IDIOMAS_CONTENIDO.find((i) => i.value === id)?.label ?? ''
export { nombreCategoria }

/** «30 minutos», «1 hora», «1,5 horas»; sin tiempo válido, vacío. */
export function textoDuracion(p: Pick<Portada, 'tiempo' | 'unidad'>) {
  const n = Number(p.tiempo.replace(',', '.'))
  if (!(n > 0)) return ''
  const uno = n === 1
  const unidad = p.unidad === 'h' ? (uno ? 'hora' : 'horas') : uno ? 'minuto' : 'minutos'
  return `${n.toLocaleString('es-CO')} ${unidad}`
}

/** «45 minutos», «1 hora», «1,5 horas», a partir de minutos sueltos. Lo usa la duración calculada de una ruta. */
export function textoMinutos(minutos: number) {
  if (!(minutos > 0)) return ''
  if (minutos < 60) return `${minutos.toLocaleString('es-CO')} ${minutos === 1 ? 'minuto' : 'minutos'}`
  const horas = Math.round((minutos / 60) * 10) / 10
  return `${horas.toLocaleString('es-CO')} ${horas === 1 ? 'hora' : 'horas'}`
}

/** Convierte el enlace del tráiler en uno que se pueda reproducir dentro de la página. */
export function embedDeVideo(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?autoplay=1`
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const id = u.searchParams.get('v') ?? u.pathname.split('/').filter(Boolean).at(-1)
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).at(-1)
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null
    }
    const drive = u.pathname.match(/\/file\/d\/([^/]+)/)
    if (host.endsWith('google.com') && drive) return `https://drive.google.com/file/d/${drive[1]}/preview`
    return null
  } catch {
    return null
  }
}

// ── Tráiler ──────────────────────────────────────────────────────────────────────────────────────────────────────

// De dónde se admite un tráiler. Vive aquí, junto a `embedDeVideo`, desde que la portada se resuelve en el paso 1 y el
// modal «Agregar portada» dejó de existir.
const HOSTS_TRAILER = [
  /(^|\.)youtu\.be$/,
  /(^|\.)youtube\.com$/,
  /(^|\.)youtube-nocookie\.com$/,
  /(^|\.)vimeo\.com$/,
  /(^|\.)drive\.google\.com$/,
  /(^|\.)docs\.google\.com$/,
  /(^|\.)onedrive\.[a-z.]+$/,
  /(^|\.)1drv\.ms$/,
  /(^|\.)sharepoint\.com$/,
]

export function trailerValido(url: string) {
  try {
    const u = new URL(url.trim())
    return /^https?:$/.test(u.protocol) && HOSTS_TRAILER.some((re) => re.test(u.hostname))
  } catch {
    return false
  }
}
