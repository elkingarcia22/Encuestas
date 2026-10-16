// Datos del caso «Resumen de un registro»: ficha de Laura Méndez y lo que el agente dice de ella.

export type TabId = 'cv' | 'entrevistas' | 'pruebas'
export type SectionId = 'experiencia' | 'educacion' | 'habilidades' | 'entrevista-tecnica' | 'notas' | 'prueba-sql'

// Cada sección vive en una pestaña: al tocar una fuente se cambia de pestaña antes de resaltar.
export const SECTION_TAB: Record<SectionId, TabId> = {
  experiencia: 'cv',
  educacion: 'cv',
  habilidades: 'cv',
  'entrevista-tecnica': 'entrevistas',
  notas: 'entrevistas',
  'prueba-sql': 'pruebas',
}

export type Source = { label: string; section: SectionId }
export type Finding = { text: string; sources: Source[] }

export const STRENGTHS: Finding[] = [
  {
    text: '4 años en analítica; en Rappi lidera el tablero de retención de usuarios Prime.',
    sources: [{ label: 'Experiencia · Rappi', section: 'experiencia' }],
  },
  {
    text: 'Resolvió la prueba de SQL en 38 minutos con 9 de 10 consultas correctas.',
    sources: [{ label: 'Prueba de SQL · 9/10', section: 'prueba-sql' }],
  },
  {
    text: 'Explica hallazgos a públicos no técnicos: el panel le dio 4,6 de 5 en comunicación.',
    sources: [{ label: 'Entrevista técnica · 12 sep', section: 'entrevista-tecnica' }],
  },
]

export const RISKS: Finding[] = [
  {
    text: 'Python solo en proyectos académicos; el cargo lo pide para automatizar reportes.',
    sources: [
      { label: 'Habilidades', section: 'habilidades' },
      { label: 'Educación · Uniandes', section: 'educacion' },
    ],
  },
  {
    text: 'Pide $7,8 M: 12% por encima del rango aprobado para la vacante.',
    sources: [{ label: 'Notas de entrevista', section: 'notas' }],
  },
]

export const SUMMARY_NOTE =
  'Encaje con el cargo 82%. Fortalezas: analítica de producto en Rappi, 9/10 en SQL y muy buena comunicación. Riesgos: Python básico y pretensión 12% sobre el rango.'

export const QUESTIONS = [
  'Cuéntanos un reporte que hayas automatizado de punta a punta: ¿qué herramienta usaste y por qué?',
  '¿Cómo te preparas para trabajar con Python en producción durante los primeros tres meses?',
  'Si la oferta queda dentro del rango, ¿qué otros beneficios pesarían en tu decisión?',
  '¿Qué harías si un líder de área no confía en el tablero que construiste?',
]

export const REQUIREMENTS: { text: string; status: 'Cumple' | 'Parcial' | 'Por validar' }[] = [
  { text: '3 o más años en analítica de datos', status: 'Cumple' },
  { text: 'SQL avanzado y Power BI', status: 'Cumple' },
  { text: 'Python para automatizar reportes', status: 'Parcial' },
  { text: 'Inglés B2 para reuniones con la regional', status: 'Por validar' },
  { text: 'Salario dentro de $6,5 M – $7 M', status: 'Parcial' },
]

export const JOBS = [
  {
    role: 'Analista de producto sr',
    company: 'Rappi',
    period: 'Mar 2023 – hoy · 2 años y 6 meses',
    points: [
      'Lidera el tablero de retención de usuarios Prime (Looker y SQL).',
      'Diseñó el experimento de precios que subió la conversión 6%.',
    ],
  },
  {
    role: 'Analista de reportería de riesgo',
    company: 'Bancolombia',
    period: 'Feb 2021 – feb 2023 · 2 años',
    points: ['Automatizó 14 reportes mensuales en Power BI.', 'Apoyó el modelo de alertas de mora temprana.'],
  },
]

export const EDUCATION = [
  { title: 'Ingeniería Industrial', place: 'Universidad de los Andes', period: '2015 – 2020' },
  { title: 'Inglés B2 · EF SET', place: 'Certificado en línea', period: '2025' },
  { title: 'Python para análisis de datos', place: 'Curso de Platzi', period: '2024' },
]

export const SKILLS: { name: string; level: 'Avanzado' | 'Intermedio' | 'Básico' }[] = [
  { name: 'SQL', level: 'Avanzado' },
  { name: 'Power BI', level: 'Avanzado' },
  { name: 'Looker', level: 'Avanzado' },
  { name: 'Excel', level: 'Avanzado' },
  { name: 'Estadística', level: 'Intermedio' },
  { name: 'Python', level: 'Básico' },
]

export const SCORES = [
  { label: 'Comunicación', value: 4.6 },
  { label: 'SQL y modelado', value: 4.4 },
  { label: 'Pensamiento de producto', value: 4.2 },
  { label: 'Python', value: 3.1 },
]

export const SQL_TOPICS = [
  { text: 'Uniones y subconsultas', ok: true },
  { text: 'Funciones de ventana', ok: true },
  { text: 'Agregaciones por cohorte', ok: true },
  { text: 'Optimización de una consulta lenta', ok: false },
]

export type Note = { id: number; author: string; date: string; text: string; agent?: boolean }

export const INITIAL_NOTES: Note[] = [
  {
    id: 1,
    author: 'Andrés Pardo',
    date: '12 sep, 4:10 p. m.',
    text: 'Muy clara al explicar el tablero de retención. Pidió $7,8 M; dice que negocia si hay bono por resultados.',
  },
  {
    id: 2,
    author: 'Sara Gómez',
    date: '12 sep, 4:32 p. m.',
    text: 'Le falta práctica en Python, pero mostró cómo lo aprendería. Recomiendo segunda entrevista con el líder del área.',
  },
]

// Respuestas de la caja del panel según lo que se pregunte.
export function replyFor(question: string): Finding {
  const q = question.toLowerCase()
  if (q.includes('salari') || q.includes('pide') || q.includes('sueldo')) {
    return {
      text: 'Pide $7,8 M y el rango aprobado llega a $7 M. En la entrevista dijo que negocia si hay bono por resultados.',
      sources: [{ label: 'Notas de entrevista', section: 'notas' }],
    }
  }
  if (q.includes('experiencia') || q.includes('años') || q.includes('trabaj')) {
    return {
      text: 'Tiene 4 años: 2 y medio en Rappi (analítica de producto) y 2 en Bancolombia (reportería de riesgo).',
      sources: [{ label: 'Experiencia · Rappi', section: 'experiencia' }],
    }
  }
  if (q.includes('ingl')) {
    return {
      text: 'Certificó B2 en EF SET en 2025. La entrevista técnica fue en español: si el cargo lo exige, conviene validarlo en la segunda.',
      sources: [{ label: 'Educación · EF SET', section: 'educacion' }],
    }
  }
  return {
    text: 'No encuentro eso en la hoja de vida ni en las entrevistas. Puedo dejarlo como pregunta para la segunda entrevista.',
    sources: [],
  }
}
