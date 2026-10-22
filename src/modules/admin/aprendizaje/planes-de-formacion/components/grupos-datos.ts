import { useSyncExternalStore } from 'react'
import { USUARIOS_INICIALES, nombreCompleto, type Usuario } from '@/modules/design-system/templates/gestion-usuarios/components/datos'
// De la plantilla y no de planes-datos: planes-datos lee los grupos para saber quién está en cada asignación.
import { TAMANO_GRUPO } from '@/modules/design-system/templates/planes-formacion/components/datos'

// Grupos de colaboradores (HU-LMS-006): un nombre, una descripción opcional y sus integrantes. Se reutilizan en los
// planes de contenidos y de competencias. Los compartes la pantalla de Grupos y el panel «Participantes por grupo»
// del plan: un grupo que se crea o se edita allá aparece acá sin recargar.

export type Grupo = {
  id: string
  nombre: string
  descripcion: string
  integrantes: string[]
  actualizado: string
  // Para fijar arriba lo último que se tocó.
  tocado: number
}

export const ACTIVOS = USUARIOS_INICIALES.filter((u) => u.estado === 'Activo')
const POR_ID = new Map(USUARIOS_INICIALES.map((u) => [u.id, u]))
export const usuarioDe = (id: string) => POR_ID.get(id)
export { nombreCompleto, type Usuario }

// Los integrantes de un grupo de ejemplo: los que cumplen la regla y, si faltan para llegar al tamaño que ya usan los
// planes, se completan con otros activos. Siempre los mismos entre recargas.
function integrantes(cumple: (u: Usuario) => boolean, tamano?: number) {
  const elegidos = ACTIVOS.filter(cumple)
  if (tamano === undefined) return elegidos.map((u) => u.id)
  const resto = ACTIVOS.filter((u) => !cumple(u))
  return [...elegidos, ...resto].slice(0, tamano).map((u) => u.id)
}

const semilla = (id: string, nombre: string, descripcion: string, ids: string[], actualizado: string): Grupo => ({
  id,
  nombre,
  descripcion,
  integrantes: ids,
  actualizado,
  tocado: 0,
})

const GRUPOS_INICIALES: Grupo[] = [
  semilla('equipo-comercial-q3', 'Equipo comercial Q3', 'Ejecutivos y key accounts con cuota del tercer trimestre.', integrantes((u) => u.area === 'Ventas', TAMANO_GRUPO['Equipo comercial Q3']), '2026-07-01'),
  semilla('mandos-medios', 'Mandos medios', 'Personas con equipo a cargo en todas las áreas.', integrantes((u) => u.nivel === 'Táctico con personal a cargo', TAMANO_GRUPO['Mandos medios']), '2026-06-12'),
  semilla('lideres-nuevos-2026', 'Líderes nuevos 2026', 'Quienes asumieron un equipo este año.', integrantes((u) => u.nivel !== 'Operativo' && u.creado >= '2026-01-01', TAMANO_GRUPO['Líderes nuevos 2026']), '2026-08-18'),
  semilla('cohorte-agosto', 'Cohorte agosto', 'Ingresos de agosto de 2026.', integrantes((u) => u.creado.startsWith('2026-08'), TAMANO_GRUPO['Cohorte agosto']), '2026-08-04'),
  semilla('sucursal-beta', 'Sucursal Beta', 'Todo el personal de la Sede Centro.', integrantes((u) => u.columnaA === 'Sede Centro', TAMANO_GRUPO['Sucursal Beta']), '2026-05-20'),
  semilla('logistica', 'Logística', 'Operaciones de bodega y distribución.', integrantes((u) => u.area === 'Operaciones'), '2026-09-02'),
  semilla('servicio-al-cliente', 'Servicio al cliente', 'Agentes, supervisores y calidad.', integrantes((u) => u.area === 'Servicio al cliente'), '2026-04-15'),
  semilla('tecnologia', 'Tecnología', '', integrantes((u) => u.area === 'Tecnología'), '2026-03-09'),
  semilla('finanzas-y-legal', 'Finanzas y legal', 'Contabilidad, tesorería y cumplimiento.', integrantes((u) => u.area === 'Finanzas' || u.area === 'Legal'), '2026-02-26'),
  // RN-02: un grupo puede quedar sin integrantes.
  semilla('embajadores-bienestar', 'Embajadores de bienestar', 'Voluntarios que acompañan las pausas activas.', [], '2026-09-10'),
]

// ── Los grupos de la sesión ──

let grupos = GRUPOS_INICIALES
const oyentes = new Set<() => void>()

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function useGrupos() {
  return useSyncExternalStore(suscribir, () => grupos)
}

export function cambiarGrupos(cambio: (todos: Grupo[]) => Grupo[]) {
  grupos = cambio(grupos)
  oyentes.forEach((oyente) => oyente())
}

// Los grupos de este momento, fuera de React: con ellos planes-datos resuelve quién está en cada asignación.
export const gruposActuales = () => grupos

export const buscarGrupo = (id: string | undefined) => grupos.find((g) => g.id === id)
export const grupoPorNombre = (nombre: string) => grupos.find((g) => g.nombre === nombre)
