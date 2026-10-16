// @ts-nocheck
// Resultados de un contenido: progreso, evaluaciones y asistencias.
// Portado del catálogo del playground anterior; los datos no se editan a mano.

export interface ResultadosEvaluacionDef {
  id: string
  nombre: string
  peso: number
  /** null = No aplica */
  porcentajeAprobar: number | null
  /** null = No aplica */
  limiteIntentos: number | null
  /** null = No aplica */
  tiempoLimiteMinutos: number | null
  totalPreguntas: number
}

export interface ResultadosEvaluacionColaborador {
  estado: string
  percent: number | null
  correctas: number | null
  total: number | null
}

export interface ResultadosColaborador {
  nombre: string
  email: string
  fechaInicio: string
  fechaFin: string | null
  progresoPercent: number
  evaluaciones: Record<string, ResultadosEvaluacionColaborador>
}

export interface ResultadosBloqueo {
  id: string
  nombre: string
  email: string
  evaluacionNombre: string
  fechaBloqueo: string
}

export interface ResultadosDescargaRecurso {
  id: string
  titulo: string
  tipo: 'evaluacion' | 'encuesta' | string
  participantes: number
}

export type ResultadosAsistenciaModo = 'Autoconfirmación' | 'Manual'

export interface ResultadosAsistencia {
  id: string
  /** Nombre visible del usuario */
  usuario: string
  username: string
  /** Etiqueta de sesión (ej. Sesión 01) */
  sesion: string
  modo: ResultadosAsistenciaModo
  /** Página de recurso asistencia (si se conoce). */
  pageId?: string
  /** Sesión concreta; null/omitido = sesión libre de esa página. */
  sessionId?: string | null
  /** ISO de la confirmación (autoconfirmación o carga manual). */
  confirmadoAt?: string | null
  /** Nota opcional (texto libre) */
  nota?: string | null
}

export interface ResultadosContenidoRecord {
  fechaPublicacion: string | null
  evaluaciones: ResultadosEvaluacionDef[]
  colaboradores: ResultadosColaborador[]
  bloqueos: ResultadosBloqueo[]
  descargas?: ResultadosDescargaRecurso[]
  asistencias?: ResultadosAsistencia[]
}


import { BD_CONTENIDO_EDITOR_PAYLOAD } from './editor-payload'
var EVALUACIONES_DEFAULT = [
    {
        id: 'eval-seccion-1',
        nombre: 'Evaluación Sección 1',
        peso: 50,
        porcentajeAprobar: 60,
        limiteIntentos: 3,
        tiempoLimiteMinutos: 30,
        totalPreguntas: 5
    },
    {
        id: 'eval-seccion-2',
        nombre: 'Evaluación Sección 2',
        peso: 50,
        porcentajeAprobar: 60,
        limiteIntentos: 2,
        tiempoLimiteMinutos: 30,
        totalPreguntas: 5
    }
];

/** Filas del tab Descargas (recorrido lineal → participantes decrecientes). */
var DESCARGAS_DEFAULT = [
    {
        id: 'eval-seccion-1',
        titulo: 'Evaluación Sección 1',
        tipo: 'evaluacion',
        participantes: 20
    },
    {
        id: 'eval-seccion-2',
        titulo: 'Evaluación Sección 2',
        tipo: 'evaluacion',
        participantes: 17
    },
    {
        id: 'encuesta-satisfaccion',
        titulo: 'Encuesta de satisfacción',
        tipo: 'encuesta',
        participantes: 10
    }
];

var DESCARGAS_SMALL = [
    {
        id: 'eval-seccion-1',
        titulo: 'Evaluación Sección 1',
        tipo: 'evaluacion',
        participantes: 7
    },
    {
        id: 'eval-seccion-2',
        titulo: 'Evaluación Sección 2',
        tipo: 'evaluacion',
        participantes: 6
    },
    {
        id: 'encuesta-satisfaccion',
        titulo: 'Encuesta de satisfacción',
        tipo: 'encuesta',
        participantes: 3
    }
];

function daysAgoISO(days) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - days);
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function evalCell(estado, percent, correctas, total) {
    if (estado === 'Pendiente') {
        return { estado: 'Pendiente', percent: null, correctas: null, total: null };
    }
    return { estado: estado, percent: percent, correctas: correctas, total: total };
}

function colaborador(nombre, email, daysAgoInicio, daysAgoFin, progresoPercent, ev1, ev2) {
    return {
        nombre: nombre,
        email: email,
        fechaInicio: daysAgoISO(daysAgoInicio),
        fechaFin: daysAgoFin != null ? daysAgoISO(daysAgoFin) : null,
        progresoPercent: progresoPercent,
        evaluaciones: {
            'eval-seccion-1': ev1,
            'eval-seccion-2': ev2
        }
    };
}

  /**
   * Distribución por periodo (fecha de inicio):
   * - 30 días: 15 colaboradores (hace 1–27 días)
   * - 90 días: +5 (hace 32–58 días) → 20
   * - 180 / 365 / año actual: +2 (hace 95–110 días) → 22
   */
function buildColaboradoresDemo() {
    return [
        colaborador(
            'Cristian Andrés Mejía López',
            'crismejia@meta.com',
            2,
            null,
            45,
            evalCell('Aprobado', 70, 4, 5),
            evalCell('Fallido', 58, 3, 5)
        ),
        colaborador(
            'Laura Patricia Gómez Ruiz',
            'lagomez@meta.com',
            4,
            12,
            100,
            evalCell('Aprobado', 80, 4, 5),
            evalCell('Aprobado', 75, 4, 5)
        ),
        colaborador(
            'Carlos Andrés García López',
            'cgarcl@meta.com',
            6,
            18,
            100,
            evalCell('Aprobado', 90, 5, 5),
            evalCell('Aprobado', 83, 4, 5)
        ),
        colaborador(
            'Laura Valentina Rodríguez Martínez',
            'lrodrm@meta.com',
            8,
            null,
            62,
            evalCell('Aprobado', 65, 3, 5),
            evalCell('Aprobado', 72, 4, 5)
        ),
        colaborador(
            'Miguel Ángel Hernández Díaz',
            'mhernd@meta.com',
            10,
            null,
            38,
            evalCell('Fallido', 45, 2, 5),
            evalCell('Pendiente')
        ),
        colaborador(
            'Natalia Sofía Torres Sánchez',
            'ntorrs@meta.com',
            12,
            20,
            100,
            evalCell('Aprobado', 75, 4, 5),
            evalCell('Aprobado', 67, 3, 5)
        ),
        colaborador(
            'Sebastián Felipe Gómez Álvarez',
            'sgomea@meta.com',
            14,
            null,
            55,
            evalCell('Aprobado', 60, 3, 5),
            evalCell('Fallido', 50, 3, 5)
        ),
        colaborador(
            'Juliana Andrea Pérez Castro',
            'jperec@meta.com',
            16,
            null,
            28,
            evalCell('Pendiente'),
            evalCell('Pendiente')
        ),
        colaborador(
            'Juan David López González',
            'jlopeg@meta.com',
            18,
            25,
            100,
            evalCell('Aprobado', 85, 4, 5),
            evalCell('Aprobado', 78, 4, 5)
        ),
        colaborador(
            'Diego Alejandro Martínez Romero',
            'dmartr@meta.com',
            19,
            null,
            72,
            evalCell('Aprobado', 70, 4, 5),
            evalCell('Aprobado', 68, 3, 5)
        ),
        colaborador(
            'Camilo Ernesto Sánchez Vargas',
            'csancv@meta.com',
            21,
            null,
            15,
            evalCell('Pendiente'),
            evalCell('Pendiente')
        ),
        colaborador(
            'Andrés Felipe Ruiz Mendoza',
            'aruizm@meta.com',
            22,
            null,
            48,
            evalCell('Aprobado', 55, 3, 5),
            evalCell('Pendiente')
        ),
        colaborador(
            'Santiago José Díaz Suárez',
            'sdiazs@meta.com',
            24,
            28,
            100,
            evalCell('Aprobado', 92, 5, 5),
            evalCell('Aprobado', 88, 4, 5)
        ),
        colaborador(
            'Daniel Esteban Ortiz Restrepo',
            'dortir@meta.com',
            25,
            null,
            33,
            evalCell('Fallido', 40, 2, 5),
            evalCell('Pendiente')
        ),
        colaborador(
            'Carolina María Álvarez Torres',
            'calvat@meta.com',
            27,
            null,
            80,
            evalCell('Aprobado', 78, 4, 5),
            evalCell('Aprobado', 81, 4, 5)
        ),
        colaborador(
            'Pablo Antonio Castro Ríos',
            'pcastr@meta.com',
            35,
            40,
            100,
            evalCell('Aprobado', 86, 4, 5),
            evalCell('Aprobado', 80, 4, 5)
        ),
        colaborador(
            'Sandra Milena Rojas Pineda',
            'srojap@meta.com',
            42,
            null,
            58,
            evalCell('Aprobado', 68, 3, 5),
            evalCell('Aprobado', 70, 4, 5)
        ),
        colaborador(
            'Gustavo Hernán Mejía López',
            'gmejil@meta.com',
            48,
            null,
            35,
            evalCell('Fallido', 48, 2, 5),
            evalCell('Pendiente')
        ),
        colaborador(
            'Marcela Isabel Duque Vásquez',
            'mduquv@meta.com',
            52,
            55,
            100,
            evalCell('Aprobado', 77, 4, 5),
            evalCell('Aprobado', 74, 4, 5)
        ),
        colaborador(
            'Paola Andrea Hernández Gil',
            'pherng@meta.com',
            58,
            null,
            42,
            evalCell('Aprobado', 58, 3, 5),
            evalCell('Pendiente')
        ),
        colaborador(
            'Iván Mauricio Romero Jiménez',
            'iromej@meta.com',
            98,
            null,
            20,
            evalCell('Pendiente'),
            evalCell('Pendiente')
        ),
        colaborador(
            'José Luis González Pérez',
            'jgonzp@meta.com',
            105,
            108,
            100,
            evalCell('Aprobado', 88, 4, 5),
            evalCell('Aprobado', 79, 4, 5)
        )
    ];
}

function buildBloqueosDemo() {
    return [
        {
            id: 'bloq-demo-001',
            nombre: 'Cristian Andrés Mejía López',
            email: 'crismejia@meta.com',
            evaluacionNombre: 'Evaluación Sección 2',
            fechaBloqueo: daysAgoISO(5)
        },
        {
            id: 'bloq-demo-002',
            nombre: 'Miguel Ángel Hernández Díaz',
            email: 'mhernd@meta.com',
            evaluacionNombre: 'Evaluación Sección 1',
            fechaBloqueo: daysAgoISO(8)
        },
        {
            id: 'bloq-demo-003',
            nombre: 'Sebastián Felipe Gómez Álvarez',
            email: 'sgomea@meta.com',
            evaluacionNombre: 'Evaluación Sección 2',
            fechaBloqueo: daysAgoISO(11)
        },
        {
            id: 'bloq-demo-004',
            nombre: 'Daniel Esteban Ortiz Restrepo',
            email: 'dortir@meta.com',
            evaluacionNombre: 'Evaluación Sección 1',
            fechaBloqueo: daysAgoISO(20)
        },
        {
            id: 'bloq-demo-005',
            nombre: 'Gustavo Hernán Mejía López',
            email: 'gmejil@meta.com',
            evaluacionNombre: 'Evaluación Sección 2',
            fechaBloqueo: daysAgoISO(45)
        }
    ];
}

/** Sesiones demo f021 (Protocolos de Supervivencia) — una fila por página × sesión. */
export const ASISTENCIA_SESIONES_DEMO = [
  'Jornada de fundamentos — turno mañana',
  'Jornada de fundamentos — turno tarde',
  'Jornada de fundamentos — refuerzo',
  'Jornada de fundamentos — sede norte',
  'Simulacro Torre A — ensayo previo',
  'Simulacro Torre A',
  'Simulacro Torre B',
  'Simulacro torre completa',
  'Taller RCP — grupo piloto',
  'Taller RCP y heridas — grupo 1',
  'Taller RCP y heridas — grupo 2',
  'Taller RCP — instructores',
]

var EVALUACIONES_F021 = [
  {
    id: 'eval-sismos',
    nombre: 'Evaluación',
    peso: 100,
    porcentajeAprobar: 60,
    limiteIntentos: 3,
    tiempoLimiteMinutos: 20,
    totalPreguntas: 5,
  },
]

var DESCARGAS_F021 = [
  {
    id: 'eval-sismos',
    titulo: 'Evaluación',
    tipo: 'evaluacion',
    participantes: 14,
  },
]

function colaboradorF021(nombre, email, daysAgoInicio, daysAgoFin, progresoPercent, ev) {
  return {
    nombre: nombre,
    email: email,
    fechaInicio: daysAgoISO(daysAgoInicio),
    fechaFin: daysAgoFin != null ? daysAgoISO(daysAgoFin) : null,
    progresoPercent: progresoPercent,
    evaluaciones: {
      'eval-sismos': ev,
    },
  }
}

function buildEstudiantesF021() {
  return [
    colaboradorF021(
      'Laura Patricia Gómez Ruiz',
      'lagomez@meta.com',
      3,
      1,
      100,
      evalCell('Aprobado', 80, 4, 5)
    ),
    colaboradorF021(
      'Carlos Andrés García López',
      'cgarcl@meta.com',
      3,
      1,
      100,
      evalCell('Aprobado', 100, 5, 5)
    ),
    colaboradorF021(
      'Natalia Sofía Torres Sánchez',
      'ntorrs@meta.com',
      4,
      2,
      100,
      evalCell('Aprobado', 80, 4, 5)
    ),
    colaboradorF021(
      'Juan David López González',
      'jlopeg@meta.com',
      5,
      null,
      66,
      evalCell('Aprobado', 60, 3, 5)
    ),
    colaboradorF021(
      'Santiago José Díaz Suárez',
      'sdiazs@meta.com',
      5,
      null,
      33,
      evalCell('Pendiente', null, null, null)
    ),
    colaboradorF021(
      'Marcela Isabel Duque Vásquez',
      'mduquv@meta.com',
      6,
      2,
      100,
      evalCell('Aprobado', 80, 4, 5)
    ),
    colaboradorF021(
      'José Luis González Pérez',
      'jgonzp@meta.com',
      7,
      null,
      33,
      evalCell('Fallido', 40, 2, 5)
    ),
    colaboradorF021(
      'Pablo Antonio Castro Ríos',
      'pcastr@meta.com',
      8,
      3,
      100,
      evalCell('Aprobado', 100, 5, 5)
    ),
    colaboradorF021(
      'Andrea Carolina Mejía Ortiz',
      'amejia@meta.com',
      2,
      null,
      33,
      evalCell('Pendiente', null, null, null)
    ),
    colaboradorF021(
      'Diego Fernando Vargas León',
      'dvargas@meta.com',
      10,
      null,
      0,
      evalCell('Pendiente', null, null, null)
    ),
  ]
}

function buildBloqueosF021() {
  return [
    {
      id: 'bloq-f021-001',
      nombre: 'José Luis González Pérez',
      email: 'jgonzp@meta.com',
      evaluacionNombre: 'Evaluación',
      fechaBloqueo: daysAgoISO(2),
    },
  ]
}

function buildAsistenciasDemo() {
  return [
    {
      id: 'asist-f021-001',
      pageId: 'f021-p-asistencia',
      sessionId: 'f021-ses-fund-1',
      usuario: 'Laura Patricia Gómez Ruiz',
      username: 'lagomez@meta.com',
      sesion: 'Jornada de fundamentos — turno mañana',
      modo: 'Autoconfirmación',
      confirmadoAt: '2026-08-12T09:12:00-05:00',
    },
    {
      id: 'asist-f021-002',
      pageId: 'f021-p-asistencia',
      sessionId: 'f021-ses-fund-1',
      usuario: 'Carlos Andrés García López',
      username: 'cgarcl@meta.com',
      sesion: 'Jornada de fundamentos — turno mañana',
      modo: 'Autoconfirmación',
      confirmadoAt: '2026-08-12T09:18:00-05:00',
    },
    {
      id: 'asist-f021-003',
      pageId: 'f021-p-asistencia',
      sessionId: 'f021-ses-fund-2',
      usuario: 'Natalia Sofía Torres Sánchez',
      username: 'ntorrs@meta.com',
      sesion: 'Jornada de fundamentos — turno tarde',
      modo: 'Manual',
      confirmadoAt: '2026-08-14T16:40:00-05:00',
    },
    {
      id: 'asist-f021-004',
      pageId: 'f021-p-asistencia',
      sessionId: 'f021-ses-fund-2',
      usuario: 'José Luis González Pérez',
      username: 'jgonzp@meta.com',
      sesion: 'Jornada de fundamentos — turno tarde',
      modo: 'Manual',
      confirmadoAt: '2026-08-14T16:41:00-05:00',
    },
    {
      id: 'asist-f021-005',
      pageId: 'f021-p-asistencia-simulacro',
      sessionId: 'f021-ses-sim-1',
      usuario: 'Juan David López González',
      username: 'jlopeg@meta.com',
      sesion: 'Simulacro Torre A',
      modo: 'Autoconfirmación',
      confirmadoAt: '2026-08-27T10:05:00-05:00',
    },
    {
      id: 'asist-f021-006',
      pageId: 'f021-p-asistencia-simulacro',
      sessionId: 'f021-ses-sim-1',
      usuario: 'Santiago José Díaz Suárez',
      username: 'sdiazs@meta.com',
      sesion: 'Simulacro Torre A',
      modo: 'Manual',
      confirmadoAt: '2026-08-27T10:20:00-05:00',
    },
    {
      id: 'asist-f021-007',
      pageId: 'f021-p-asistencia-simulacro',
      sessionId: 'f021-ses-sim-2',
      usuario: 'Marcela Isabel Duque Vásquez',
      username: 'mduquv@meta.com',
      sesion: 'Simulacro Torre B',
      modo: 'Autoconfirmación',
      confirmadoAt: '2026-09-03T10:11:00-05:00',
    },
    {
      id: 'asist-f021-008',
      pageId: 'f021-p-asistencia-simulacro',
      sessionId: 'f021-ses-sim-2',
      usuario: 'Pablo Antonio Castro Ríos',
      username: 'pcastr@meta.com',
      sesion: 'Simulacro Torre B',
      modo: 'Autoconfirmación',
      confirmadoAt: '2026-09-03T10:22:00-05:00',
    },
    {
      id: 'asist-f021-009',
      pageId: 'f021-p-asistencia-primeros-auxilios',
      sessionId: 'f021-ses-pa-1',
      usuario: 'Andrea Carolina Mejía Ortiz',
      username: 'amejia@meta.com',
      sesion: 'Taller RCP y heridas — grupo 1',
      modo: 'Autoconfirmación',
      confirmadoAt: '2026-09-10T09:30:00-05:00',
    },
    {
      id: 'asist-f021-010',
      pageId: 'f021-p-asistencia-primeros-auxilios',
      sessionId: 'f021-ses-pa-2',
      usuario: 'Laura Patricia Gómez Ruiz',
      username: 'lagomez@meta.com',
      sesion: 'Taller RCP y heridas — grupo 2',
      modo: 'Manual',
      confirmadoAt: '2026-09-17T09:45:00-05:00',
    },
  ]
}

let BD_RESULTADOS_CONTENIDO: Record<string, ResultadosContenidoRecord> = {}

function initBdResultadosContenido() {
  if (Object.keys(BD_RESULTADOS_CONTENIDO).length > 0) return
  const ESTUDIANTES_DEMO = buildColaboradoresDemo()
  const BLOQUEOS_DEMO = buildBloqueosDemo()
  const ASISTENCIAS_F021 = buildAsistenciasDemo()
  const ESTUDIANTES_F021 = buildEstudiantesF021()
  const BLOQUEOS_F021 = buildBloqueosF021()
  Object.assign(BD_RESULTADOS_CONTENIDO, {
    f002: {
      fechaPublicacion: daysAgoISO(76),
      evaluaciones: EVALUACIONES_DEFAULT,
      colaboradores: ESTUDIANTES_DEMO,
      bloqueos: BLOQUEOS_DEMO,
      descargas: DESCARGAS_DEFAULT,
      asistencias: [],
    },
    f007: {
      fechaPublicacion: daysAgoISO(24),
      evaluaciones: EVALUACIONES_DEFAULT,
      colaboradores: ESTUDIANTES_DEMO,
      bloqueos: BLOQUEOS_DEMO,
      descargas: DESCARGAS_DEFAULT,
      asistencias: [],
    },
    /** Protocolos de Supervivencia — Evento demo asistencia ILT (datos propios, no reutilizar f007) */
    f021: {
      fechaPublicacion: '2026-08-12',
      evaluaciones: EVALUACIONES_F021,
      colaboradores: ESTUDIANTES_F021,
      bloqueos: BLOQUEOS_F021,
      descargas: DESCARGAS_F021,
      asistencias: ASISTENCIAS_F021,
    },
    '24003': {
      fechaPublicacion: daysAgoISO(90),
      evaluaciones: EVALUACIONES_DEFAULT,
      colaboradores: ESTUDIANTES_DEMO.slice(0, 8),
      bloqueos: [],
      descargas: DESCARGAS_SMALL,
      asistencias: [],
    },
    '24000': {
      fechaPublicacion: daysAgoISO(45),
      evaluaciones: EVALUACIONES_DEFAULT,
      colaboradores: ESTUDIANTES_DEMO,
      bloqueos: BLOQUEOS_DEMO,
      descargas: DESCARGAS_DEFAULT,
      asistencias: [],
    },
    'testing-eval': {
      fechaPublicacion: daysAgoISO(3),
      evaluaciones: EVALUACIONES_DEFAULT,
      colaboradores: [],
      bloqueos: [],
      descargas: [],
      asistencias: [],
    },
  })
}

function emptyResultadosRecord(): ResultadosContenidoRecord {
  return {
    fechaPublicacion: null,
    evaluaciones: [],
    colaboradores: [],
    bloqueos: [],
    descargas: [],
    asistencias: [],
  }
}

function cloneResultadosRecord(record: ResultadosContenidoRecord): ResultadosContenidoRecord {
  return {
    ...record,
    evaluaciones: [...(record.evaluaciones || [])],
    colaboradores: (record.colaboradores || []).map((e) => ({
      ...e,
      evaluaciones: { ...(e.evaluaciones || {}) },
    })),
    bloqueos: [...(record.bloqueos || [])],
    descargas: [...(record.descargas || [])],
    asistencias: [...(record.asistencias || [])],
  }
}

export function getResultadosContenido(contentId: string): ResultadosContenidoRecord {
  initBdResultadosContenido()
  const key = String(contentId || '').trim()
  if (!key) return emptyResultadosRecord()

  const direct = BD_RESULTADOS_CONTENIDO[key]
  if (direct) return cloneResultadosRecord(direct)

  const payload = BD_CONTENIDO_EDITOR_PAYLOAD[key]
  if (payload?.useDemoSeed) {
    const template = BD_RESULTADOS_CONTENIDO.f007 ?? BD_RESULTADOS_CONTENIDO['f007']
    if (template) {
      const cloned = cloneResultadosRecord(template)
      return {
        ...cloned,
        fechaPublicacion:
          payload.fechaPublicacion != null
            ? String(payload.fechaPublicacion)
            : cloned.fechaPublicacion,
      }
    }
  }

  const demoTemplate = BD_RESULTADOS_CONTENIDO.f007 ?? BD_RESULTADOS_CONTENIDO['f007']
  if (demoTemplate) {
    return cloneResultadosRecord(demoTemplate)
  }

  return emptyResultadosRecord()
}

if (typeof window !== 'undefined') {
  initBdResultadosContenido()
}
