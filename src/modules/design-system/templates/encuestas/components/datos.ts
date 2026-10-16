import { ENCUESTAS as BASE_ENCUESTAS } from '../../admin-compartido/rutas'

// Template «Encuestas»: calca /surveys/admin de la plataforma de hoy (recorrido del 2026-09-13):
// pestañas Encuestas y Datos demográficos, la lista con Nombre, Tipo, Origen, Estado, Inicio,
// Cierre, Participantes y Avance, filtros por estado y tipo, selección con Vista previa, Editar,
// Duplicar y Eliminar, «Comparar encuestas» y «Crear encuesta» (en blanco o con plantilla).
// No hay historia de usuario todavía (_pendiente.md): los textos salen de la pantalla real.

export const BASE = BASE_ENCUESTAS

export type EstadoEncuesta = 'Por iniciar' | 'En progreso' | 'Borrador' | 'Finalizado'
export type Origen = 'UBITS' | 'Propia'

// Los ocho tipos del filtro de la plataforma, con su texto literal.
export const TIPOS = [
  'Cultura',
  'Clima',
  'eNPS',
  'Otros',
  'Evaluación y adopción de IA',
  'Acontecimientos traumáticos',
  'Riesgo psicosocial (- 50 trabajadores)',
  'Riesgo psicosocial (+ 50 trabajadores)',
] as const
export type TipoEncuesta = (typeof TIPOS)[number]

export const ESTADOS: EstadoEncuesta[] = ['Por iniciar', 'En progreso', 'Borrador', 'Finalizado']

export type Encuesta = {
  id: string
  nombre: string
  tipo: TipoEncuesta
  origen: Origen
  estado: EstadoEncuesta
  inicio: string
  cierre: string
  participantes: number | null
  respuestas: number
  // Para fijar arriba lo último que se creó o duplicó.
  tocado: number
  // Lo que se arma en el formulario (las de ejemplo no lo traen: se completa al editarlas).
  descripcion?: string
  preguntas?: Pregunta[]
  alcance?: Alcance
  grupos?: string[]
  anonima?: boolean
}

// ── Formulario de encuesta ──

export const TIPOS_PREGUNTA = ['Escala del 1 al 5', 'Del 0 al 10', 'Opción múltiple', 'Respuesta abierta'] as const
export type TipoPregunta = (typeof TIPOS_PREGUNTA)[number]
export type Pregunta = { id: string; texto: string; tipo: TipoPregunta }

export type Alcance = 'empresa' | 'grupos' | 'archivo'

// Colaboradores con licencia activa (los mismos del Home operativo) y tamaño aproximado de un grupo.
export const TOTAL_COLABORADORES = 1502
export const PERSONAS_POR_GRUPO = 48

export const participantesDe = (alcance: Alcance, grupos: string[]) =>
  alcance === 'empresa' ? TOTAL_COLABORADORES : alcance === 'grupos' ? grupos.length * PERSONAS_POR_GRUPO : 212

// Tipo de respuesta de cada pregunta de muestra: el eNPS se contesta del 0 al 10 y las que piden
// explicar algo son abiertas; el resto, escala del 1 al 5.
function tipoDe(texto: string): TipoPregunta {
  if (texto.startsWith('Del 0 al 10')) return 'Del 0 al 10'
  if (/^¿(Qué|Para qué)/.test(texto)) return 'Respuesta abierta'
  if (texto.startsWith('¿Con qué frecuencia')) return 'Opción múltiple'
  return 'Escala del 1 al 5'
}

export const preguntasDe = (tipo: TipoEncuesta): Pregunta[] =>
  (PREGUNTAS[tipo] ?? PREGUNTAS.Otros).map((texto, indice) => ({ id: `p-${indice + 1}`, texto, tipo: tipoDe(texto) }))

export const avanceDe = (e: Pick<Encuesta, 'participantes' | 'respuestas'>) =>
  e.participantes ? Math.round((e.respuestas / e.participantes) * 100) : 0

const e = (
  id: string,
  nombre: string,
  tipo: TipoEncuesta,
  origen: Origen,
  estado: EstadoEncuesta,
  inicio: string,
  cierre: string,
  participantes: number | null,
  respuestas = 0,
): Encuesta => ({ id, nombre, tipo, origen, estado, inicio, cierre, participantes, respuestas, tocado: 0 })

// Encuestas de Google. Las tres que cierran en 48 horas con menos del 50 % de respuesta son las que
// el Home operativo lista en «Necesita tu atención»; la de clima cerrada con 87 % es la de sus
// notificaciones.
export const ENCUESTAS_INICIALES: Encuesta[] = [
  e('s-01', 'Pulso de bienestar emocional y carga laboral', 'Clima', 'UBITS', 'En progreso', '2026-09-07', '2026-09-12', 412, 168),
  e('s-02', 'eNPS tercer trimestre', 'eNPS', 'Propia', 'En progreso', '2026-09-01', '2026-09-13', 888, 371),
  e('s-03', 'Adopción de IA en el trabajo diario', 'Evaluación y adopción de IA', 'UBITS', 'En progreso', '2026-09-04', '2026-09-13', 520, 214),
  e('s-04', 'Riesgo psicosocial NOM-035 · Planta Monterrey', 'Riesgo psicosocial (+ 50 trabajadores)', 'UBITS', 'En progreso', '2026-08-25', '2026-09-30', 146, 97),
  e('s-05', 'Cultura organizacional 2026', 'Cultura', 'UBITS', 'Por iniciar', '2026-09-21', '2026-10-09', 888),
  e('s-06', 'Pulso de regreso a la oficina', 'Otros', 'Propia', 'Por iniciar', '2026-09-28', '2026-10-02', 312),
  e('s-07', 'Clima laboral 2026-II', 'Clima', 'UBITS', 'Finalizado', '2026-08-18', '2026-09-05', 888, 773),
  e('s-08', 'Acontecimientos traumáticos · Sucursal Beta', 'Acontecimientos traumáticos', 'UBITS', 'Finalizado', '2026-08-03', '2026-08-14', 312, 241),
  e('s-09', 'eNPS segundo trimestre', 'eNPS', 'Propia', 'Finalizado', '2026-06-02', '2026-06-13', 861, 602),
  e('s-10', 'Riesgo psicosocial · Oficinas Bogotá', 'Riesgo psicosocial (- 50 trabajadores)', 'UBITS', 'Finalizado', '2026-05-11', '2026-05-29', 44, 41),
  e('s-11', 'Clima laboral 2026-I', 'Clima', 'UBITS', 'Finalizado', '2026-03-02', '2026-03-20', 842, 690),
  e('s-12', 'Cultura de feedback en equipos comerciales', 'Cultura', 'Propia', 'Finalizado', '2026-04-06', '2026-04-17', 84, 63),
  e('s-13', 'Satisfacción con el onboarding', 'Otros', 'Propia', 'Finalizado', '2026-07-20', '2026-07-31', 46, 39),
  e('s-14', 'Pulso de bienestar para personal administrativo', 'Clima', 'UBITS', 'Borrador', '2026-09-10', '2026-09-24', null),
  e('s-15', 'Evaluación de herramientas de IA · Tecnología', 'Evaluación y adopción de IA', 'Propia', 'Borrador', '2026-10-05', '2026-10-16', null),
  e('s-16', 'Encuesta nueva', 'Otros', 'Propia', 'Borrador', '2026-09-15', '2026-09-30', null),
  e('s-17', 'eNPS primer trimestre', 'eNPS', 'Propia', 'Finalizado', '2026-03-02', '2026-03-13', 830, 548),
  e('s-18', 'Riesgo psicosocial NOM-035 · Planta Monterrey 2025', 'Riesgo psicosocial (+ 50 trabajadores)', 'UBITS', 'Finalizado', '2025-09-01', '2025-09-26', 139, 131),
  e('s-19', 'Clima laboral 2025-II', 'Clima', 'UBITS', 'Finalizado', '2025-08-18', '2025-09-05', 801, 617),
  e('s-20', 'Pulso de trabajo híbrido', 'Otros', 'Propia', 'Finalizado', '2026-02-09', '2026-02-20', 512, 301),
]

// Plantillas de «Crear con plantilla». Las de riesgo psicosocial y acontecimientos traumáticos son
// las de la NOM-035 que trae UBITS.
export const PLANTILLAS: { id: string; nombre: string; tipo: TipoEncuesta; detalle: string }[] = [
  { id: 'clima', nombre: 'Clima laboral', tipo: 'Clima', detalle: '32 preguntas · 12 minutos' },
  { id: 'enps', nombre: 'eNPS', tipo: 'eNPS', detalle: '2 preguntas · 1 minuto' },
  { id: 'cultura', nombre: 'Cultura organizacional', tipo: 'Cultura', detalle: '24 preguntas · 10 minutos' },
  { id: 'ia', nombre: 'Evaluación y adopción de IA', tipo: 'Evaluación y adopción de IA', detalle: '18 preguntas · 8 minutos' },
  { id: 'nom035', nombre: 'Riesgo psicosocial NOM-035 (+ 50 trabajadores)', tipo: 'Riesgo psicosocial (+ 50 trabajadores)', detalle: '72 preguntas · 25 minutos' },
]

// Preguntas de muestra para la vista previa, por tipo.
export const PREGUNTAS: Partial<Record<TipoEncuesta, string[]>> & { Otros: string[] } = {
  Clima: ['¿Cuentas con las herramientas que necesitas para hacer tu trabajo?', '¿Tu líder reconoce tu trabajo?', '¿Cómo calificas tu carga de trabajo de las últimas semanas?'],
  eNPS: ['Del 0 al 10, ¿qué tan probable es que recomiendes Google como lugar para trabajar?', '¿Qué es lo principal que cambiarías?'],
  Cultura: ['¿Las decisiones de tu área se explican con claridad?', '¿Puedes dar tu opinión sin miedo a represalias?', '¿Sientes que tu trabajo tiene propósito?'],
  'Evaluación y adopción de IA': ['¿Con qué frecuencia usas herramientas de IA en tu trabajo?', '¿Para qué tareas te han servido más?', '¿Qué te frena para usarlas más?'],
  'Riesgo psicosocial (+ 50 trabajadores)': ['Mi trabajo me exige hacer mucho esfuerzo físico.', 'Por la cantidad de trabajo que tengo debo quedarme tiempo adicional.', 'Mi trabajo exige que esté muy concentrado.'],
  'Riesgo psicosocial (- 50 trabajadores)': ['El espacio donde trabajo me permite realizar mis actividades de manera segura.', 'Me cuesta descansar por pensar en el trabajo.'],
  'Acontecimientos traumáticos': ['¿Ha presenciado o sufrido algún acontecimiento traumático durante o con motivo del trabajo?', '¿Ha tenido recuerdos o sueños recurrentes sobre el acontecimiento?'],
  Otros: ['¿Qué tan satisfecho estás con esta iniciativa?', '¿Qué mejorarías?'],
}

// Variables de «Datos demográficos» con las que se segmentan los resultados.
export const DEMOGRAFICOS = [
  { nombre: 'Edad', detalle: '5 rangos · de 18 a 65+' },
  { nombre: 'Antigüedad', detalle: '6 rangos · de menos de 6 meses a más de 10 años' },
  { nombre: 'Sede', detalle: 'Sede Norte, Sede Centro, Remoto, Planta Monterrey' },
  { nombre: 'Tipo de contrato', detalle: 'Indefinido, fijo, por obra, aprendiz' },
  { nombre: 'Nivel en la empresa', detalle: 'Estratégico, táctico y operativo' },
]

export const ruta = (resto = '') => (resto ? `${BASE}/${resto}` : BASE)

export function migasDe(pathname: string) {
  const resto = pathname.replace(BASE, '').replace(/^\//, '')
  const base = [{ etiqueta: 'Inicio', ruta: '/design-system/templates/home-operativo' }, { etiqueta: 'Desempeño y cultura' }]
  if (!resto) return [...base, { etiqueta: 'Encuestas' }]
  const titulo = resto === 'nueva' ? 'Crear encuesta' : resto.endsWith('/editar') ? 'Editar encuesta' : 'Pantalla no encontrada'
  return [...base, { etiqueta: 'Encuestas', ruta: BASE }, { etiqueta: titulo }]
}
