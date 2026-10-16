import type { IconSvgElement } from '@hugeicons/react'
import { Building03Icon, Mortarboard01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { BD_MASTER_COLABORADORES, BDS_CONTENIDOS_UBITS, CONTENIDOS } from '@/shared/bd'
import { textoDeRango } from '@/modules/design-system/patrones/formato'
import type { Rango } from '@/modules/design-system/formularios/rango-de-fechas'

// Descarga masiva de certificados (HU-LMS-007 · PRD admin certificados). Todo es simulado: no hay servidor, la
// solicitud «se registra» en memoria y el correo se abre como vista previa.

export type Modo = 'global' | 'contenido' | 'colaborador'
export type TipoContenidos = 'ubits' | 'propios' | 'ambos'

// Los estados de la pantalla que tienen dirección propia (#contenido-confirmacion…), como en el prototipo.
export type Estado = 'vacio' | 'lleno' | 'validacion' | 'confirmacion' | 'sin-resultados' | 'error' | 'duplicada' | 'registrada'

export const MODOS: Modo[] = ['global', 'contenido', 'colaborador']

export const ICONO_MODO: Record<Modo, IconSvgElement> = { global: Building03Icon, contenido: Mortarboard01Icon, colaborador: UserIcon }

// ── Datos de ejemplo ─────────────────────────────────────────────────────────────────────────────────────────────

type Registro = { id: string; nombre: string; area: string; username: string }
const REGISTROS = (BD_MASTER_COLABORADORES as { colaboradores: Registro[] }).colaboradores

/** Quien pide la descarga: la persona con la sesión abierta en el prototipo (E006). */
export const USUARIO = REGISTROS.find((r) => r.id === 'E006') ?? REGISTROS[0]

export type Persona = { id: string; nombre: string; area: string }
export const PERSONAS: Persona[] = REGISTROS.map((r) => ({ id: r.id, nombre: r.nombre, area: r.area })).sort((a, b) =>
  a.nombre.localeCompare(b.nombre, 'es'),
)

export type ContenidoCert = { id: string; titulo: string; origen: 'UBITS' | 'Tu empresa'; conCertificado: boolean }
type ItemUbits = { id: string; titulo: string; conCertificacion?: boolean }
export const CONTENIDOS_CERT: ContenidoCert[] = [
  ...CONTENIDOS.map((c) => ({ id: c.id, titulo: c.titulo, origen: 'Tu empresa' as const, conCertificado: c.conCertificacion })),
  ...(BDS_CONTENIDOS_UBITS.contents as ItemUbits[]).map((c) => ({
    id: c.id,
    titulo: c.titulo,
    origen: 'UBITS' as const,
    conCertificado: c.conCertificacion !== false,
  })),
].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))

export const TIPOS_CONTENIDO: { valor: TipoContenidos; etiqueta: string }[] = [
  { valor: 'ubits', etiqueta: 'Solo contenidos UBITS' },
  { valor: 'propios', etiqueta: 'Solo contenidos propios' },
  { valor: 'ambos', etiqueta: 'Ambos tipos de contenido' },
]

// ── Formulario ───────────────────────────────────────────────────────────────────────────────────────────────────

export type Formulario = {
  modo: Modo
  contenidoId: string | null
  personaId: string | null
  tipoContenidos: TipoContenidos
  rango: Rango
  correo: string
  confirmarCorreo: string
  incluirInactivos: boolean
}

export type Errores = Partial<Record<'filtro' | 'fechas' | 'correo' | 'confirmarCorreo', string>>

export const formularioVacio = (modo: Modo): Formulario => ({
  modo,
  contenidoId: null,
  personaId: null,
  tipoContenidos: 'propios',
  rango: undefined,
  correo: USUARIO.username,
  confirmarCorreo: '',
  incluirInactivos: false,
})

/** El ejemplo que se ve al llegar directo a un estado lleno: primer semestre de 2026. */
export const formularioDeEjemplo = (modo: Modo): Formulario => ({
  ...formularioVacio(modo),
  contenidoId: CONTENIDOS_CERT.find((c) => c.conCertificado && c.origen === 'Tu empresa')?.id ?? null,
  personaId: PERSONAS[3]?.id ?? null,
  rango: { from: new Date('2026-01-01T00:00:00'), to: new Date('2026-06-30T00:00:00') },
  confirmarCorreo: USUARIO.username,
})

const esCorreo = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
const DIA = 24 * 60 * 60 * 1000

export function validar(f: Formulario): Errores {
  const e: Errores = {}
  if (f.modo === 'contenido' && !f.contenidoId) e.filtro = 'Selecciona un contenido.'
  if (f.modo === 'colaborador' && !f.personaId) e.filtro = 'Selecciona un colaborador.'
  if (!f.rango?.from || !f.rango.to) e.fechas = 'Elige la fecha inicial y la final.'
  else if (Math.round((f.rango.to.getTime() - f.rango.from.getTime()) / DIA) > 366) e.fechas = 'El rango máximo permitido es de un año.'
  if (!f.correo.trim()) e.correo = 'El correo de destino es obligatorio.'
  else if (!esCorreo(f.correo)) e.correo = 'Ingresa un correo válido.'
  if (!f.confirmarCorreo.trim()) e.confirmarCorreo = 'Confirma el correo de destino.'
  else if (f.correo.trim() !== f.confirmarCorreo.trim()) e.confirmarCorreo = 'Los correos no coinciden.'
  return e
}

// ── Lo que se encuentra ──────────────────────────────────────────────────────────────────────────────────────────

export const contenidoPorId = (id: string | null) => CONTENIDOS_CERT.find((c) => c.id === id) ?? null
export const personaPorId = (id: string | null) => PERSONAS.find((p) => p.id === id) ?? null

/**
 * Cuántos certificados saldrían. Sin resultados si el contenido no genera certificado, si el periodo termina antes de
 * 2025 (aún no se emitían) o si la persona es de las que no terminaron cursos (una de cada siete, fijo).
 */
export function certificadosEncontrados(f: Formulario): number {
  if (!f.rango?.to || f.rango.to < new Date('2025-01-01T00:00:00')) return 0
  const extra = f.incluirInactivos ? 1.06 : 1
  // Global: todos los de la empresa según el tipo de contenidos (solo UBITS, solo propios o ambos).
  if (f.modo === 'global') return Math.round((f.tipoContenidos === 'ubits' ? 140 : f.tipoContenidos === 'propios' ? 172 : 312) * extra)
  if (f.modo === 'contenido') {
    const c = contenidoPorId(f.contenidoId)
    if (!c?.conCertificado) return 0
    return Math.round((24 + (c.titulo.length * 7) % 90) * extra)
  }
  const i = PERSONAS.findIndex((p) => p.id === f.personaId)
  if (i < 0 || i % 7 === 3) return 0
  return f.tipoContenidos === 'ubits' ? 3 : f.tipoContenidos === 'propios' ? 4 : 7
}

// ── Anti-duplicado (RN-03) ───────────────────────────────────────────────────────────────────────────────────────

/** Dos solicitudes son la misma si coinciden el modo, su filtro (y el tipo de contenidos), el periodo, el correo y los inactivos. */
export const huella = (f: Formulario) =>
  [
    f.modo,
    f.modo === 'contenido' ? f.contenidoId : '',
    f.modo === 'colaborador' ? `${f.personaId}|${f.tipoContenidos}` : f.modo === 'global' ? f.tipoContenidos : '',
    f.rango?.from?.toDateString() ?? '',
    f.rango?.to?.toDateString() ?? '',
    f.correo.trim().toLowerCase(),
    f.incluirInactivos ? '1' : '0',
  ].join('|')

export const VENTANA_DUPLICADO_MS = 48 * 60 * 60 * 1000

export type Solicitud = { huella: string; formulario: Formulario; certificados: number; hora: number }

// ── Textos ───────────────────────────────────────────────────────────────────────────────────────────────────────

export const TITULO_MODO: Record<Modo, string> = {
  global: 'Descarga global',
  contenido: 'Descarga por contenido',
  colaborador: 'Descarga por colaborador',
}

/** «Por contenido · Inducción…», para el resumen y las solicitudes recientes. */
export function descripcionFiltro(f: Formulario) {
  if (f.modo === 'contenido') return contenidoPorId(f.contenidoId)?.titulo ?? null
  if (f.modo === 'colaborador') return personaPorId(f.personaId)?.nombre ?? null
  return null
}

export const periodo = (rango: Rango) => textoDeRango(rango) ?? ''

const FECHA_LARGA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })
export const fechaLarga = (fecha: Date | undefined) => (fecha ? FECHA_LARGA.format(fecha) : '')

// ── Direcciones por estado ───────────────────────────────────────────────────────────────────────────────────────

const SUFIJO: Record<Estado, string> = {
  vacio: '',
  lleno: '-filled',
  validacion: '-validacion',
  confirmacion: '-confirmacion',
  'sin-resultados': '-sin-resultados',
  error: '-error',
  duplicada: '-solicitud-duplicada',
  registrada: '-registrada',
}

export const hashDe = (modo: Modo, estado: Estado) => `#${modo}${SUFIJO[estado]}`

export function leerHash(hash: string): { modo: Modo; estado: Estado } {
  const clave = hash.replace(/^#/, '')
  for (const modo of MODOS)
    for (const [estado, sufijo] of Object.entries(SUFIJO) as [Estado, string][]) if (clave === `${modo}${sufijo}`) return { modo, estado }
  return { modo: 'global', estado: 'vacio' }
}

export const TODOS_LOS_ESTADOS = Object.keys(SUFIJO) as Estado[]
