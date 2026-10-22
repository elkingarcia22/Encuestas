// Datos del tablero «Rotación y clima» y lo que el agente sabe explicar de cada dato.

export type Driver = { label: string; share: number }

export type Topic = {
  id: string
  // Lo que muestra la franja de contexto: «Rotación voluntaria · agosto».
  label: string
  question: string
  lead: string
  drivers: Driver[]
  sector: string
  unknown: string
  sources: string[]
  peopleAction: string
  alertAction: string
  alertDone: string
}

// Sin variación junto a la cifra (auditoría 5-oct, decisión 11): el detalle dice de cuándo es el dato, y «bad» suma
// «Requiere atención». Cuánto subió o bajó lo explica el agente al preguntarle.
export const KPIS: { id: string; title: string; value: string; note: string; bad: boolean }[] = [
  { id: 'rotacion', title: 'Rotación voluntaria', value: '3,4 %', note: 'Últimos 30 días', bad: true },
  { id: 'clima', title: 'Clima laboral', value: '72/100', note: 'Encuesta de agosto', bad: true },
  { id: 'ausentismo', title: 'Ausentismo', value: '2,1 %', note: 'Agosto', bad: false },
  { id: 'vacantes', title: 'Vacantes abiertas', value: '12', note: '4 críticas', bad: false },
]

export const MONTHS = [
  { id: 'mes-mar', short: 'Mar', name: 'marzo', value: 2.1 },
  { id: 'mes-abr', short: 'Abr', name: 'abril', value: 2.3 },
  { id: 'mes-may', short: 'May', name: 'mayo', value: 2.0 },
  { id: 'mes-jun', short: 'Jun', name: 'junio', value: 2.6 },
  { id: 'mes-jul', short: 'Jul', name: 'julio', value: 2.5 },
  { id: 'mes-ago', short: 'Ago', name: 'agosto', value: 3.4 },
  { id: 'mes-sep', short: 'Sep', name: 'septiembre', value: 2.9 },
]

export const CHART_MAX = 4
export const TARGET = 2.5

export const AREAS = [
  { name: 'Operaciones · planta Funza', value: 5.8 },
  { name: 'Ventas', value: 3.9 },
  { name: 'Tecnología', value: 2.2 },
  { name: 'Administración', value: 1.4 },
]

export const formatPct = (value: number) => value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const AUGUST_DRIVERS: Driver[] = [
  { label: 'Planta Funza · cambio de turnos', share: 44 },
  { label: 'Ofertas con mejor salario', share: 33 },
  { label: 'Primer año en la empresa', share: 23 },
]

const ROTATION_SOURCES = ['Retiros · nómina', 'Entrevistas de salida', 'Benchmark ACRIP 2026']

const KPI_TOPICS: Record<string, Topic> = {
  rotacion: {
    id: 'rotacion',
    label: 'Rotación voluntaria · últimos 30 días',
    question: 'Explícame la rotación voluntaria',
    lead: '3,4 % es el valor más alto del año. Lo empuja agosto: 8 de las 18 salidas fueron en la planta Funza.',
    drivers: AUGUST_DRIVERS,
    sector: 'El sector manufactura en Colombia está en 2,6 %: estamos 0,8 puntos arriba.',
    unknown: '5 de las 18 personas no hicieron entrevista de salida, así que su motivo quedó vacío.',
    sources: ROTATION_SOURCES,
    peopleAction: 'Ver las 18 personas',
    alertAction: 'Crear alerta si pasa de 3 %',
    alertDone: 'Alerta creada: te aviso si la rotación pasa de 3 %',
  },
  clima: {
    id: 'clima',
    label: 'Clima laboral · encuesta de agosto',
    question: 'Explícame el clima laboral',
    lead: '72/100: bajó 3 puntos, sobre todo por la carga de trabajo en Operaciones.',
    drivers: [
      { label: 'Carga de trabajo', share: 38 },
      { label: 'Reconocimiento del líder', share: 34 },
      { label: 'Claridad de objetivos', share: 28 },
    ],
    sector: 'El promedio del sector es 75/100: estamos 3 puntos abajo.',
    unknown: 'En Operaciones respondió solo el 64 %; ahí el dato es menos confiable.',
    sources: ['Encuesta de clima · ago', '212 comentarios abiertos'],
    peopleAction: 'Ver comentarios de Operaciones',
    alertAction: 'Crear alerta si baja de 70',
    alertDone: 'Alerta creada: te aviso si el clima baja de 70',
  },
  ausentismo: {
    id: 'ausentismo',
    label: 'Ausentismo · agosto',
    question: 'Explícame el ausentismo',
    lead: '2,1 %: estable desde mayo y por debajo del sector.',
    drivers: [
      { label: 'Incapacidades por enfermedad general', share: 52 },
      { label: 'Citas médicas y permisos', share: 29 },
      { label: 'Ausencias sin justificar', share: 19 },
    ],
    sector: 'El sector está en 2,4 %: estamos 0,3 puntos abajo.',
    unknown: 'Las incapacidades de septiembre llegan de la EPS hasta el 10 de octubre.',
    sources: ['Novedades de nómina', 'Reporte EPS'],
    peopleAction: 'Ver las 27 personas',
    alertAction: 'Crear alerta si pasa de 3 %',
    alertDone: 'Alerta creada: te aviso si el ausentismo pasa de 3 %',
  },
  vacantes: {
    id: 'vacantes',
    label: 'Vacantes abiertas · hoy',
    question: 'Explícame las vacantes abiertas',
    lead: '12 abiertas y 4 críticas: los perfiles técnicos de planta son los que más tardan.',
    drivers: [
      { label: 'Técnicos de planta', share: 50 },
      { label: 'Ventas B2B', share: 33 },
      { label: 'Tecnología', share: 17 },
    ],
    sector: 'Tardamos 41 días en cubrir una vacante; el sector tarda 35.',
    unknown: 'No sé cuántas ya tienen una oferta verbal que no se registró en la plataforma.',
    sources: ['Selección · vacantes', 'Tiempos de contratación'],
    peopleAction: 'Ver las 4 vacantes críticas',
    alertAction: 'Crear alerta si una pasa de 45 días',
    alertDone: 'Alerta creada: te aviso si una vacante pasa de 45 días',
  },
}

function monthTopic(month: (typeof MONTHS)[number]): Topic {
  const people = Math.round(month.value * 5.3)
  const august = month.id === 'mes-ago'
  const above = month.value > 2.6
  return {
    id: month.id,
    label: `Rotación voluntaria · ${month.name}`,
    question: august ? '¿Por qué subió la rotación en agosto?' : `Explícame la rotación de ${month.name}`,
    lead: august
      ? 'Subió 0,9 puntos frente a julio: 8 de las 18 salidas fueron en la planta Funza después del cambio de turnos del 4 de agosto.'
      : `${formatPct(month.value)} % con ${people} salidas voluntarias, ${month.value > TARGET ? 'por encima' : 'dentro'} de la meta de 2,5 %.`,
    drivers: august
      ? AUGUST_DRIVERS
      : [
          { label: 'Ofertas con mejor salario', share: 41 },
          { label: 'Traslado de ciudad o estudio', share: 34 },
          { label: 'Relación con el líder', share: 25 },
        ],
    sector: `El sector manufactura en Colombia está en 2,6 %: ${above ? `estamos ${formatPct(month.value - 2.6)} puntos arriba` : 'estamos por debajo'}.`,
    unknown: august
      ? '5 de las 18 personas no hicieron entrevista de salida, así que su motivo quedó vacío.'
      : 'Los motivos salen de la entrevista de salida; 2 personas no la hicieron.',
    sources: ROTATION_SOURCES,
    peopleAction: `Ver las ${people} personas`,
    alertAction: 'Crear alerta si pasa de 3 %',
    alertDone: 'Alerta creada: te aviso si la rotación mensual pasa de 3 %',
  }
}

export function topicFor(id: string): Topic {
  return KPI_TOPICS[id] ?? monthTopic(MONTHS.find((month) => month.id === id) ?? MONTHS[5])
}
