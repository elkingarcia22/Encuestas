// Los assessments del diagnóstico: las pruebas con que se mide cuánto aprendieron los
// colaboradores de un plan de formación.
//
// Cada plan genera dos: una **inicial**, que se responde antes de empezar, y una de
// **seguimiento**, al terminar. Comparando las dos se ve lo que el plan enseñó de verdad.
//
// Los nombres y los colaboradores convocados salen de los planes de la base compartida, para que el
// diagnóstico y los planes cuenten la misma historia. **Las fechas se calculan contra el día
// en que se abre la pantalla**, no están escritas: así siempre hay pruebas en los cuatro
// estados, se visite cuando se visite.

import { BD_PLANES_FORMACION } from '@/shared/bd'
import { fechaCorta as fechaDelSistema } from '@/modules/design-system/patrones/formato'

export type Tipo = 'Inicial' | 'Seguimiento'
export type Estado = 'Planeado' | 'Vigente' | 'No vigente' | 'Inactivo'

export const TIPOS: Tipo[] = ['Inicial', 'Seguimiento']
export const ESTADOS: Estado[] = ['Planeado', 'Vigente', 'No vigente', 'Inactivo']

export type Assessment = {
  id: string
  planId: string
  nombre: string
  tipo: Tipo
  /** Vacías mientras la prueba está inactiva: todavía no se le pusieron fechas. */
  inicio: string | null
  fin: string | null
  respondieron: number
  /** Quiénes respondieron (ids de colaborador): para contar personas únicas entre varias pruebas. */
  respondieronIds: string[]
  convocados: number
  estado: Estado
  /** Lo que mide y si el colaborador ve su resultado: solo en los que se crean desde «Crear assessment». */
  competencias?: string[]
  resultadosVisibles?: boolean
}

const HOY = new Date()
const iso = (dias: number) => new Date(HOY.getTime() + dias * 86400000).toISOString().slice(0, 10)

// En qué punto va un plan. Se reparten los planes entre los cinco momentos para que la
// lista siempre tenga pruebas de los cuatro estados.
const MOMENTOS = [
  { inicial: 'Planeado', seguimiento: 'Inactivo' },   // programado, aún no arranca
  { inicial: 'Vigente', seguimiento: 'Inactivo' },   // arrancando: se mide el punto de partida
  { inicial: 'No vigente', seguimiento: 'Inactivo' },    // estudiando
  { inicial: 'No vigente', seguimiento: 'Vigente' }, // cerrando: se mide lo aprendido
  { inicial: 'No vigente', seguimiento: 'No vigente' },  // cerrado, con sus dos medidas
] as const satisfies readonly { inicial: Estado; seguimiento: Estado }[]

// Cuándo abre y cierra una prueba, contando desde hoy. La duración la pone quien la crea,
// así que varía de una a otra.
function ventana(estado: Estado, duracion: number, desfase: number): { inicio: string | null; fin: string | null } {
  if (estado === 'Inactivo') return { inicio: null, fin: null }
  if (estado === 'Planeado') return { inicio: iso(desfase + 3), fin: iso(desfase + 3 + duracion) }
  if (estado === 'Vigente') {
    const abierta = Math.max(1, Math.round(duracion / 3) + (desfase % 4))
    return { inicio: iso(-abierta), fin: iso(duracion - abierta) }
  }
  return { inicio: iso(-(duracion + desfase + 5)), fin: iso(-(desfase + 5)) }
}

type Plan = { id: string; nombre: string; asignaciones?: { colaboradorId: string }[] }

function pruebas(plan: Plan, i: number): Assessment[] {
  const convocados = plan.asignaciones?.length ?? 0
  const momento = MOMENTOS[i % MOMENTOS.length]
  // Cada plan tiene su propia duración: no hay una fija de producto.
  const duracion = 14 + ((i * 7) % 32)

  return ([
    { sufijo: 'ini', tipo: 'Inicial' as Tipo, estado: momento.inicial, desfase: (i % 9) * 4 },
    { sufijo: 'seg', tipo: 'Seguimiento' as Tipo, estado: momento.seguimiento, desfase: (i % 6) * 3 },
  ]).map(({ sufijo, tipo, estado, desfase }) => {
    const { inicio, fin } = ventana(estado, duracion, desfase)
    // Cuánta gente alcanzó a responder, según en qué punto va la ventana.
    const avance = estado === 'No vigente' ? 0.86 : estado === 'Vigente' ? 0.45 : 0
    const ruido = (plan.id.length + sufijo.length) % 5
    const respondieron = Math.max(0, Math.round(convocados * avance) - ruido)

    return {
      id: `axs-${plan.id}-${sufijo}`,
      planId: plan.id,
      nombre: plan.nombre,
      tipo,
      inicio,
      fin,
      respondieron,
      // Los primeros convocados del plan: la misma gente responde la inicial y el seguimiento, como pasa de verdad.
      respondieronIds: (plan.asignaciones ?? []).slice(0, respondieron).map((a) => a.colaboradorId),
      convocados,
      estado,
    }
  })
}

const PLANES = (BD_PLANES_FORMACION as { planes: Plan[] }).planes

// Como en el producto: los planes más recientes primero y, dentro de cada uno, sus dos
// pruebas juntas —seguimiento antes que inicial— para leerlas como un par y no como sueltas.
export const ASSESSMENTS: Assessment[] = PLANES.flatMap((plan, i) => {
  const [inicial, seguimiento] = pruebas(plan, i)
  return [seguimiento, inicial]
})

// Los mismos colores que los planes de formación (`BADGE_ESTADO`): si la palabra es la misma, el color también, o
// «No vigente» saldría verde aquí y neutro allá. «Inactivo» no existe en planes —es la medida que se creó sin
// programar— y se queda con el amarillo de «esto pide una decisión».
export const BADGE: Record<Estado, 'secondary' | 'success-light' | 'outline' | 'warning-light'> = {
  Planeado: 'secondary',
  Vigente: 'success-light',
  'No vigente': 'outline',
  Inactivo: 'warning-light',
}

export const fechaCorta = (valor: string | null) =>
  valor ? fechaDelSistema(valor) : '—'

export const porcentaje = (a: Assessment) =>
  a.convocados ? Math.round((a.respondieron / a.convocados) * 100) : 0

export const hoyIso = () => new Date().toISOString().slice(0, 10)
