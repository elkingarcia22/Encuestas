import { BD_MASTER_COMPETENCIAS } from '@/shared/bd'
import type { Plan } from './planes'

// El banco de pruebas de UBITS: lo que el servicio de assessments ya entrega en producción, hecho de cuenta que lo
// tenemos aquí. Cada competencia trae su prueba armada por psicómetras —12 de un banco de 74 preguntas, 15 minutos— y
// el admin no la edita: la elige al elegir el plan.
//
// Las fichas van **por id de competencia** (`comp-024`), contra `shared/bd/competencias.ts`. El nombre y la imagen
// salen de esa base, así que aquí solo se escribe lo que el servicio aportaría: qué mide, qué se va a encontrar el
// colaborador y para quién es. Están las que de verdad aparecen en los planes de competencias; cuando entre una
// nueva, se le añade su ficha aquí y el resto de pantallas no se entera.

export const PREGUNTAS_POR_COMPETENCIA = 12
export const PREGUNTAS_EN_EL_BANCO = 74
export const MINUTOS_POR_COMPETENCIA = 15

export type TipoHabilidad = 'Habilidad blanda' | 'Habilidad técnica'

export type PruebaCompetencia = {
  id: string
  nombre: string
  imagen: string
  tipo: TipoHabilidad
  /** ¿Qué mide esta prueba? */
  mide: string
  /** ¿Qué encontrará el colaborador? */
  encontraras: string
  poblacion: string
}

type FichaBase = Omit<PruebaCompetencia, 'nombre' | 'imagen'>

const SITUACION =
  'Una serie de situaciones de trabajo, cada una con una pregunta. Eliges, entre tres opciones, la que más se acerca a lo que harías de verdad.'

const FICHAS: FichaBase[] = [
  {
    id: 'comp-024',
    tipo: 'Habilidad blanda',
    mide: 'Tu capacidad para orientar a un equipo hacia un objetivo: dar dirección, delegar con criterio y sostener la motivación cuando las cosas se complican.',
    encontraras: SITUACION,
    poblacion: 'Personas con equipo a cargo o que se preparan para asumir la conducción de un equipo.',
  },
  {
    id: 'comp-004',
    tipo: 'Habilidad blanda',
    mide: 'Qué tan claro transmites una idea y qué tan bien escuchas: ordenar el mensaje, ajustarlo a quien te escucha y confirmar que se entendió.',
    encontraras: SITUACION,
    poblacion: 'Personas que presentan, coordinan trabajo con otras áreas o escriben para públicos distintos al suyo.',
  },
  {
    id: 'comp-027',
    tipo: 'Habilidad blanda',
    mide: 'Cómo llegas a un acuerdo que sirva a las dos partes: preparar la conversación, entender el interés del otro y sostener tus límites sin romper la relación.',
    encontraras: SITUACION,
    poblacion: 'Personas que acuerdan precios, plazos o condiciones con clientes, proveedores u otras áreas.',
  },
  {
    id: 'comp-020',
    tipo: 'Habilidad técnica',
    mide: 'Tu nivel de inglés para el trabajo: entender correos y reuniones, responder por escrito y sostener una conversación con colegas o clientes.',
    encontraras:
      'Preguntas de comprensión sobre correos, mensajes y fragmentos de reuniones. Eliges, entre tres opciones, la que corresponde a lo que leíste o escuchaste.',
    poblacion: 'Personas que trabajan con equipos, clientes o proveedores que no hablan español.',
  },
]

type CompetenciaBd = { id: string; nombre: string; archivoImagen: string }

const CATALOGO = new Map(
  (BD_MASTER_COMPETENCIAS as { competencias: CompetenciaBd[] }).competencias.map((c) => [c.id, c]),
)

const PRUEBAS: PruebaCompetencia[] = FICHAS.flatMap((ficha) => {
  const competencia = CATALOGO.get(ficha.id)
  // Una ficha de una competencia que ya no está en el catálogo se ignora en vez de romper la pantalla.
  if (!competencia) return []
  return [{ ...ficha, nombre: competencia.nombre, imagen: `/images/imagenes competencias/${competencia.archivoImagen}` }]
})

const POR_ID = new Map(PRUEBAS.map((p) => [p.id, p]))

/** La prueba de una competencia, por su id del catálogo. */
export const pruebaDe = (competencia: { id: string }) => POR_ID.get(competencia.id)

/** Las competencias que mide el assessment de un plan, sin repetir y en el orden en que aparecen en el plan. */
export function competenciasDePlan(plan: Plan): PruebaCompetencia[] {
  return plan.competencias.map(pruebaDe).filter((p): p is PruebaCompetencia => Boolean(p))
}

export const MIN_NOMBRE = 5
export const MAX_NOMBRE = 80

/** Por qué un plan no puede tener assessment; `null` si puede. */
export function motivoNoDisponible(plan: Plan, conAssessment: Set<string>) {
  if (conAssessment.has(plan.id)) return 'Ya tiene un assessment.'
  if (!competenciasDePlan(plan).length) return 'Sus competencias todavía no tienen prueba en el banco.'
  return null
}
