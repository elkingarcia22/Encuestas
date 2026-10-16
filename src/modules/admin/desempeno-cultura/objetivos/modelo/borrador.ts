import { formatSurveyDate, parseSurveyDate } from '../../encuestas/modelo/surveyListDates'
import { DEFAULT_PARTICIPANTS } from '../../encuestas/modelo/surveyBuilderTypes'
import {
  CICLO_PERIOD_LABELS,
  CICLO_STATUS_LABELS,
  assignedObjectiveCount,
  createBlankObjective,
  createObjectiveSet,
  type CicloBuilderAssignmentSeed,
  type CicloDraft,
  type CicloPeriod,
  type MeasureType,
  type Objective,
} from './constructor/cicloBuilderTypes'
import { addMonths, parseISODate, toISODate } from './constructor/cicloDates'
import { DEFAULT_OBJECTIVE_MODEL_RULES, OBJECTIVE_MODEL_PRESETS } from './constructor/objectiveModel'
import { objectiveSetsReach } from './constructor/objectiveSets'
import type { Ciclo, EstadoCiclo, Periodo } from './ciclos'
import { PLANTILLAS_CICLO, type Medida, type ObjetivoPlantilla, type PlantillaCiclo } from './plantillas'

// El puente entre la lista de ciclos del home y el constructor: cómo nace un borrador (en blanco, desde una plantilla
// o desde una fila que ya existe) y cómo vuelve a la lista cuando se guarda. Es el `cicloDraftFromRow` y el
// `draftToCicloRow` del prototipo, con dos errores suyos corregidos:
// - un ciclo que ya existía se reabría con «Otros» como autor, y en la parametrización eso quita el paso de objetivos
//   asignados; aquí se reabre con RRHH, que es quien los reparte;
// - un ciclo duplicado compartía el id de su borrador con el original, y guardar la copia pisaba la fila original;
//   aquí la copia nace sin borrador propio y el id siempre es el de la fila.

const PERIODO_DE: Readonly<Record<CicloPeriod, Periodo>> = {
  mes: 'Mes',
  bimestre: 'Bimestre',
  trimestre: 'Trimestre',
  semestre: 'Semestre',
  anio: 'Año',
  personalizado: 'Personalizado',
}

const PERIODO_A: Readonly<Record<Periodo, CicloPeriod>> = {
  Mes: 'mes',
  Bimestre: 'bimestre',
  Trimestre: 'trimestre',
  Semestre: 'semestre',
  Año: 'anio',
  Personalizado: 'personalizado',
}

const ESTADO_DE: Readonly<Record<CicloDraft['status'], EstadoCiclo>> = {
  draft: 'Borrador',
  scheduled: 'Por iniciar',
  live: 'En curso',
  closed: 'Finalizado',
}

const ESTADO_A: Readonly<Record<EstadoCiclo, CicloDraft['status']>> = {
  Borrador: 'draft',
  'Por iniciar': 'scheduled',
  'En curso': 'live',
  Finalizado: 'closed',
}

/** Un ciclo nuevo: sin nombre, sin duración ni modelo elegidos (son preguntas de verdad del primer paso) y con un
 *  trimestre desde hoy como fechas de partida. Mismo arranque que el prototipo. */
export function createBlankCicloDraft(): CicloDraft {
  const hoy = new Date()
  const cierre = addMonths(hoy, 3)
  return {
    name: '',
    status: 'draft',
    period: null,
    startDate: toISODate(hoy),
    endDate: toISODate(cierre),
    description: '',
    objectiveModel: null,
    modelRules: DEFAULT_OBJECTIVE_MODEL_RULES,
    objectiveCreator: null,
    participants: { ...DEFAULT_PARTICIPANTS, mode: 'groups', groupSegmentBy: 'leader' },
    useCompanyObjectives: null,
    companyObjectives: [],
    remindersEnabled: false,
    reminderFrequency: 'weekly',
    useGroupObjectives: true,
    useIndividualObjectives: false,
    useCustomObjectives: false,
    assignment: { groupSegmentBy: 'area', groupsAutoInclude: false },
    objectiveSets: [],
  }
}

// ── Plantillas ─────────────────────────────────────────────────────────────

const MEDIDA_A: Readonly<Record<Medida, MeasureType>> = { Dinero: 'money', Numérico: 'numeric', Porcentaje: 'percentage', Hito: 'boolean' }

/** «$500.000.000» → «500.000.000», «12 %» → «12»: las cifras de la plantilla en el formato de los campos del constructor. */
const cifra = (valor: string | null) => (valor ?? '').replace(/[$%\s]/g, '')

function objetivoDePlantilla(objetivo: ObjetivoPlantilla, alignedTo: string | null = null): Objective {
  return {
    ...createBlankObjective(objetivo.peso),
    title: objetivo.nombre,
    description: objetivo.descripcion,
    measure: MEDIDA_A[objetivo.medida],
    direction: objetivo.sentido === 'Reducir' ? 'decrease' : objetivo.sentido === 'Aumentar' ? 'increase' : null,
    initialValue: cifra(objetivo.actual),
    targetValue: cifra(objetivo.meta),
    alignedTo,
  }
}

export interface InicioDesdePlantilla {
  borrador: CicloDraft
  /** Objetivos de grupo e individuales en busca de destinatario: el paso de objetivos asignados los ofrece al llegar. */
  semillas: readonly CicloBuilderAssignmentSeed[]
}

/** Usar una plantilla: nombre, periodo, descripción y objetivos de empresa ya puestos. Los de grupo y los individuales
 *  viajan como semillas alineadas, por posición, a los de empresa recién creados. */
export function borradorDesdePlantilla(plantilla: PlantillaCiclo): InicioDesdePlantilla {
  const base = createBlankCicloDraft()
  const periodo = PERIODO_A[plantilla.periodo]
  const empresa = plantilla.empresa.map((objetivo) => objetivoDePlantilla(objetivo))
  const alineados = (lista: readonly ObjetivoPlantilla[]) => lista.map((objetivo, indice) => objetivoDePlantilla(objetivo, empresa[indice]?.id ?? null))
  const meses = { mes: 1, bimestre: 2, trimestre: 3, semestre: 6, anio: 12, personalizado: 3 }[periodo]
  const inicio = parseISODate(base.startDate) ?? new Date()
  const cierre = addMonths(inicio, meses)
  return {
    borrador: { ...base, name: plantilla.nombre, period: periodo, endDate: toISODate(cierre), description: plantilla.descripcion, useCompanyObjectives: null, companyObjectives: empresa },
    semillas: [
      { kind: 'grupal', objectives: alineados(plantilla.grupo) },
      { kind: 'individual', objectives: alineados(plantilla.individual) },
    ],
  }
}

export const plantillaPorId = (id: string): PlantillaCiclo | undefined => PLANTILLAS_CICLO.find((plantilla) => plantilla.id === id)

// ── Filas de la lista ──────────────────────────────────────────────────────

/** La plantilla con la que se reconstruyen los objetivos de un ciclo de ejemplo que no nació en el constructor. */
function plantillaParecida(nombre: string): PlantillaCiclo {
  const texto = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const pistas: readonly [RegExp, string][] = [
    [/comercial|ventas/, 'comercial'],
    [/servicio/, 'servicio'],
    [/operativ|operacion|eficiencia/, 'operaciones'],
    [/gente|cultura|onboarding/, 'gente'],
    [/marca|marketing/, 'marketing'],
    [/tecnolog/, 'tecnologia'],
    [/crecimiento|expansion/, 'expansion'],
    [/kpi|compania|corporativ/, 'financieros'],
  ]
  const id = pistas.find(([patron]) => patron.test(texto))?.[1] ?? 'comercial'
  return plantillaPorId(id) ?? PLANTILLAS_CICLO[0]
}

const aISO = (texto: string) => {
  const fecha = parseSurveyDate(texto)
  return fecha ? toISODate(fecha) : ''
}

/**
 * El borrador con el que se reabre una fila. Si nació en el constructor trae el suyo; si es uno de los ciclos de
 * ejemplo, se reconstruye con la plantilla más parecida: objetivos de empresa y una asignación por grupos al área que
 * le corresponde. Siempre con RRHH como autor y SMART como modelo, para que el paso de objetivos asignados exista.
 */
export function borradorDeCiclo(ciclo: Ciclo): CicloDraft {
  if (ciclo.draft) return { ...ciclo.draft, _id: ciclo.id }
  const plantilla = plantillaParecida(ciclo.nombre)
  const empresa = plantilla.empresa.map((objetivo) => objetivoDePlantilla(objetivo))
  const area = { negocio: 'Comercial', operacion: 'Operaciones', personas: 'Gente y Cultura', producto: 'Tecnología' }[plantilla.categoria]
  const grupo = { ...createObjectiveSet('grupal', [area]), objectives: plantilla.grupo.map((objetivo, indice) => objetivoDePlantilla(objetivo, empresa[indice]?.id ?? null)) }
  const base = createBlankCicloDraft()
  return {
    ...base,
    _id: ciclo.id,
    name: ciclo.nombre,
    status: ESTADO_A[ciclo.estado],
    period: PERIODO_A[ciclo.periodo],
    startDate: aISO(ciclo.inicio) || base.startDate,
    endDate: aISO(ciclo.cierre) || base.endDate,
    description: plantilla.descripcion,
    objectiveModel: 'smart',
    modelRules: OBJECTIVE_MODEL_PRESETS.smart,
    objectiveCreator: 'hr',
    participants: { ...base.participants, mode: 'groups', groupSegmentBy: 'area', selectedGroups: [area] },
    companyObjectives: empresa,
    useGroupObjectives: true,
    useIndividualObjectives: false,
    assignment: { groupSegmentBy: 'area', groupsAutoInclude: true },
    objectiveSets: [grupo],
    _lastStep: 'general',
    _lastSetupBlock: null,
  }
}

const fechaDeLista = (iso: string, respaldo: string) => {
  const fecha = parseISODate(iso)
  return fecha ? formatSurveyDate(fecha) : respaldo
}

/**
 * Un borrador como fila de la lista. Una fila que ya existía conserva su lectura (avance, cumplidos, reporte) y su
 * historia; una nueva entra sin lectura. El estado lo decide el borrador: «Borrador» mientras se autoguarda y
 * «Por iniciar» al finalizar o lanzar.
 */
export function cicloDeBorrador(id: string, borrador: CicloDraft, previo?: Ciclo): Ciclo {
  const estado = ESTADO_DE[borrador.status]
  const segmento = borrador.assignment.groupSegmentBy
  return {
    id,
    nombre: borrador.name.trim() || 'Ciclo sin título',
    periodo: borrador.period ? PERIODO_DE[borrador.period] : 'Personalizado',
    inicio: fechaDeLista(borrador.startDate, previo?.inicio ?? '-'),
    cierre: fechaDeLista(borrador.endDate, previo?.cierre ?? '-'),
    estado,
    objetivos: borrador.companyObjectives.length + assignedObjectiveCount(borrador.objectiveSets),
    personas: borrador.objectiveSets.length > 0 ? objectiveSetsReach(borrador.objectiveSets, segmento) : (previo?.personas ?? 0),
    avance: previo?.avance ?? 0,
    cumplidos: previo?.cumplidos ?? 0,
    reportando: previo?.reportando ?? 0,
    anterior: previo?.anterior ?? null,
    draft: { ...borrador, _id: id },
  }
}

/** La etiqueta de estado del borrador, para la cabecera del constructor. */
export const etiquetaEstado = (borrador: CicloDraft) => CICLO_STATUS_LABELS[borrador.status]
/** La etiqueta del periodo elegido, o null si aún no se elige. */
export const etiquetaPeriodo = (borrador: CicloDraft) => (borrador.period ? CICLO_PERIOD_LABELS[borrador.period] : null)
