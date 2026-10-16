import { ETAPAS, VACANTES, type Candidato, type EstadoRequisito, type EtapaId, type Vacante } from '../vacantes/detalle/components/data'
import { nivelDe, puntajesPorPregunta, sinResultado } from './respuestas-serena'
import { VACANTE_COMERCIAL } from '../vacantes/detalle/candidato/components/vacante-comercial'

// Datos que comparten las tres propuestas de Selección (bandeja, tablero y copiloto). No inventan nada: parten de
// las vacantes que ya existen en `vacantes/detalle/components/data.ts` y las ponen en la forma que cada propuesta
// necesita: una lista plana de candidaturas (una persona en una vacante) y el detalle de por qué la IA dio ese ajuste.
//
// Una persona es un solo registro aunque esté en dos vacantes: por eso la candidatura guarda `personaId`.

export const ETIQUETAS_VACANTE: Record<string, string[]> = {
  'analista-de-datos': ['Reemplazo'],
  'disenadora-de-producto': ['Nuevo cargo'],
  'coordinador-de-turno': ['Urgente'],
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// La vacante completa
// ══════════════════════════════════════════════════════════════════════════════════════════════════════
//
// En el producto de hoy la vacante no es solo su contenido: tiene un estado de publicación que se cambia desde
// la cabecera (Borrador → Publicada → Cerrada), una visibilidad aparte (el ojo tachado: publicada pero fuera del
// portal, solo la ve el equipo interno), un equipo con permisos que se invita desde «Compartir», sus etiquetas,
// sus propias etapas y el conteo de aplicaciones («0 Aplicaciones · 0 en la última semana»).
//
// Todo eso es igual en las tres exploraciones: lo que cambia entre ellas es cómo se trabaja la pestaña de
// candidatos, no qué es una vacante.

export type EstadoPublicacion = 'Borrador' | 'Publicada' | 'Cerrada'

export const ESTADOS_PUBLICACION: EstadoPublicacion[] = ['Borrador', 'Publicada', 'Cerrada']

// Verde para lo que está vivo, gris para lo que aún no sale y contorno para lo que ya terminó.
export const ESTADO_BADGE: Record<EstadoPublicacion, 'success-light' | 'secondary' | 'outline'> = {
  Publicada: 'success-light',
  Borrador: 'secondary',
  Cerrada: 'outline',
}

// Qué significa cada estado, con las consecuencias que tiene. Se usa en el menú de la cabecera para que cambiar
// de estado no sea una apuesta.
export const ESTADO_EXPLICACION: Record<EstadoPublicacion, string> = {
  Borrador: 'Nadie la ve fuera del equipo y no recibe aplicaciones.',
  Publicada: 'Visible en el portal de empleo; puede recibir aplicaciones.',
  Cerrada: 'Deja de recibir aplicaciones. Las personas en proceso siguen ahí.',
}

export type Permiso = 'Dueña del proceso' | 'Puede editar' | 'Solo ver'

export type Miembro = { nombre: string; iniciales: string; correo: string; permiso: Permiso }

// La gente de la empresa a la que se le puede dar acceso (la lista de «Compartir vacante › Invitar»).
export const PERSONAS_EMPRESA: Omit<Miembro, 'permiso'>[] = [
  { nombre: 'Ana María Mejía Peláez', iniciales: 'AM', correo: 'amejia@ubits.com' },
  { nombre: 'Pablo Suárez de la Torre', iniciales: 'PS', correo: 'psuarez@ubits.com' },
  { nombre: 'Catalina Silva Becerra', iniciales: 'CS', correo: 'cbecerra@ubits.com' },
  { nombre: 'Jorge Luis Gamarra Valverde', iniciales: 'JG', correo: 'jgamarra@ubits.com' },
  { nombre: 'Daniela Rojas Mesa', iniciales: 'DR', correo: 'drojas@ubits.com' },
  { nombre: 'Felipe Arango Ruiz', iniciales: 'FA', correo: 'farango@ubits.com' },
  // Las otras reclutadoras también se invitan: dos personas trabajando la misma vacante (VA-23).
  { nombre: 'Sara Gómez', iniciales: 'SG', correo: 'sara@ubits.com' },
  { nombre: 'Andrés Pardo', iniciales: 'AP', correo: 'andres@ubits.com' },
]

// ── Etapas propias de cada vacante ──
//
// Nicolás decidió que las etapas se configuran por vacante (no una sola plantilla global). Aquí se ve: la de
// diseño tiene un reto, la de planta un examen médico, y la de datos se quedó con las cinco de siempre.

// Una etapa del proceso de una vacante. El id es libre porque las etapas propias no están en la plantilla:
// los candidatos siguen guardando una de las cinco de siempre, así que una etapa añadida empieza vacía.
export type EtapaVacante = { id: string; titulo: string; descripcion: string; ia?: boolean; origen: 'plantilla' | 'propia' }

const DE_PLANTILLA = (etapas: { id: string; titulo: string; descripcion: string; ia?: boolean }[]): EtapaVacante[] =>
  etapas.map((etapa) => ({ ...etapa, origen: 'plantilla' }))

// Etapas que se le pueden añadir a una vacante desde el editor. Las de IA quedan marcadas: las hace la máquina.
export const BIBLIOTECA_ETAPAS: Omit<EtapaVacante, 'origen'>[] = [
  { id: 'reto', titulo: 'Reto de diseño', descripcion: 'Ejercicio corto con la persona; lo revisa el equipo.' },
  { id: 'tecnica', titulo: 'Prueba técnica', descripcion: 'Ejercicio del oficio, con tiempo y rúbrica.' },
  { id: 'equipo', titulo: 'Entrevista con el equipo', descripcion: 'Conversación con las personas con las que va a trabajar.' },
  { id: 'medico', titulo: 'Examen médico', descripcion: 'Requisito de ley antes de firmar en planta.' },
  { id: 'referencias', titulo: 'Verificación de referencias', descripcion: 'Llamadas a jefes anteriores.' },
  { id: 'situacional', titulo: 'Prueba situacional con IA', descripcion: 'Casos del cargo resueltos con la IA como evaluadora.', ia: true },
  // Las etapas que cobran créditos de IA aparte de las de la plantilla: Créditos lee de aquí qué agentes usa cada vacante.
  { id: 'psicometrico', titulo: 'Pruebas psicométricas', descripcion: 'Personalidad y razonamiento, calificados por la IA.', ia: true },
  { id: 'roleplay', titulo: 'Role play', descripcion: 'Una simulación del cargo con la IA haciendo de cliente o de jefe.', ia: true },
  { id: 'idiomas', titulo: 'Prueba de idiomas', descripcion: 'Conversación con la IA en el idioma que pide la vacante.', ia: true },
]

const propia = (id: string): EtapaVacante => ({ ...BIBLIOTECA_ETAPAS.find((e) => e.id === id)!, origen: 'propia' })

// La plantilla con etapas propias después de Serena AI.
const conEtapas = (...ids: string[]) => [...DE_PLANTILLA(ETAPAS.slice(0, 2)), ...ids.map(propia), ...DE_PLANTILLA(ETAPAS.slice(2))]

const ETAPAS_POR_VACANTE: Record<string, EtapaVacante[]> = {
  'analista-de-datos': DE_PLANTILLA(ETAPAS),
  // Diseño mete un reto entre la revisión y los antecedentes.
  'disenadora-de-producto': [...DE_PLANTILLA(ETAPAS.slice(0, 3)), propia('reto'), ...DE_PLANTILLA(ETAPAS.slice(3))],
  // Planta exige examen médico antes de la oferta.
  'coordinador-de-turno': [...DE_PLANTILLA(ETAPAS.slice(0, 4)), propia('medico'), ...DE_PLANTILLA(ETAPAS.slice(4))],
  // Las que usan agentes que cobran aparte (CI-01): el agente sale de la etapa, no de una lista escrita a mano.
  'analista-de-nomina': conEtapas('psicometrico'),
  'asistente-de-gerencia': conEtapas('psicometrico'),
  'analista-de-compensacion': conEtapas('psicometrico'),
  // Ejecutivo comercial sigue la plantilla «Comercial con roleplay»: pruebas psicométricas y roleplay en vez de Serena. Es
  // la vacante comercial del expediente de antes, con su gente y sus pruebas (CA-41).
  'ejecutivo-comercial': [...DE_PLANTILLA(ETAPAS.slice(0, 1)), propia('psicometrico'), propia('roleplay'), ...DE_PLANTILLA(ETAPAS.slice(2))],
  'asesor-de-servicio': conEtapas('roleplay'),
  'operativo-de-tienda': conEtapas('roleplay'),
  'key-account-manager': conEtapas('roleplay', 'idiomas'),
}

export const etapasDe = (vacanteId: string): EtapaVacante[] => ETAPAS_POR_VACANTE[vacanteId] ?? DE_PLANTILLA(ETAPAS)

const idDeTitulo = (titulo: string) =>
  titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')

// ── La vacante tal como la ven las tres exploraciones ──

export type VacanteUI = Omit<Vacante, 'estado'> & {
  estado: EstadoPublicacion
  // Publicada pero fuera del portal: el ojo tachado de la cabecera. Solo la ve el equipo interno.
  oculta: boolean
  etiquetas: string[]
  // Personas que aplicaron en total y en los últimos siete días (el contador de la cabecera de hoy).
  aplicaciones: number
  ultimaSemana: number
  equipo: Miembro[]
  etapas: EtapaVacante[]
  // Solo en las cerradas: cuándo y cómo terminó.
  desenlace?: string
  // Cómo terminaron las veces anteriores, si se reabrió (IN-20): reabrir empieza de cero y guarda aquí el desenlace.
  historial?: string[]
}

// Las tres vacantes con proceso vivo salen de los datos que ya existían. «Pausada» era en realidad una vacante
// publicada pero escondida del portal, que es lo que hace el ojo tachado: por eso se traduce así.
const VIVAS: VacanteUI[] = VACANTES.map((vacante) => ({
  ...vacante,
  estado: vacante.estado === 'Borrador' ? 'Borrador' : 'Publicada',
  oculta: vacante.estado === 'Pausada',
  etiquetas: ETIQUETAS_VACANTE[vacante.id] ?? [],
  aplicaciones: vacante.candidatos.length + vacante.descartados,
  ultimaSemana: vacante.candidatos.filter((c) => c.dias <= 7).length,
  equipo: [
    { ...vacante.reclutador, correo: `${vacante.reclutador.nombre.split(' ')[0].toLowerCase()}@ubits.com`, permiso: 'Dueña del proceso' },
  ],
  etapas: etapasDe(vacante.id),
}))

// Dos vacantes más para que la lista tenga los tres estados: una que todavía no sale y una que ya terminó.
// Sin candidatos: son el caso vacío, que es donde más se nota si la pantalla está bien resuelta.
const SIN_PROCESO: VacanteUI[] = [
  {
    id: 'asistente-de-gerencia',
    titulo: 'Asistente de gerencia',
    estado: 'Borrador',
    oculta: false,
    area: 'Administración',
    sede: 'Bogotá · Torre Calle 100',
    modalidad: 'Presencial',
    diasAbierta: 0,
    reclutador: { nombre: 'Laura Martínez', iniciales: 'LM' },
    contrato: 'Término indefinido',
    seniority: 'Junior',
    experiencia: '1 a 2 años',
    idioma: 'Inglés B1',
    rango: [3.2, 4.4],
    descripcion: [
      'Acompañarás la agenda de la gerencia general: reuniones, viajes y la relación con las áreas.',
      'Todavía está en borrador: falta cerrar el rango salarial con Compensación antes de publicarla.',
    ],
    requisitos: ['Manejo de agenda ejecutiva', 'Excel intermedio', 'Inglés conversacional', 'Discreción con información sensible'],
    descartados: 0,
    candidatos: [],
    etiquetas: ['Confidencial'],
    aplicaciones: 0,
    ultimaSemana: 0,
    equipo: [{ nombre: 'Laura Martínez', iniciales: 'LM', correo: 'laura@ubits.com', permiso: 'Dueña del proceso' }],
    etapas: etapasDe('asistente-de-gerencia'),
  },
  {
    id: 'operativo-de-tienda',
    titulo: 'Operativo de tienda',
    estado: 'Cerrada',
    oculta: false,
    area: 'Operaciones',
    sede: 'Cali · Centro',
    modalidad: 'Presencial',
    diasAbierta: 63,
    reclutador: { nombre: 'Sara Gómez', iniciales: 'SG' },
    contrato: 'Término fijo a un año',
    seniority: 'Junior',
    experiencia: '1 a 2 años',
    idioma: 'No requerido',
    rango: [1.8, 2.3],
    descripcion: ['Atención en piso, inventario y cierre de caja en la tienda del centro de Cali.'],
    requisitos: ['Atención al cliente', 'Manejo de caja', 'Disponibilidad de fin de semana', 'Bachillerato completo'],
    descartados: 47,
    candidatos: [],
    etiquetas: ['Contratación masiva'],
    aplicaciones: 64,
    ultimaSemana: 0,
    equipo: [{ nombre: 'Sara Gómez', iniciales: 'SG', correo: 'sara@ubits.com', permiso: 'Dueña del proceso' }],
    etapas: etapasDe('operativo-de-tienda'),
    desenlace: 'Cerrada el 3 de septiembre · se contrató a Marcela Ríos',
  },
]

// El resto de la cartera. Una empresa de verdad no tiene tres vacantes: tiene veinte, y por eso la lista se
// busca, se filtra y se pagina. Estas no tienen proceso montado —se abren y muestran su caso vacío—, pero sí
// estado, etiquetas, responsable y aplicaciones, que es lo que se compara desde la lista.
const CARTERA: {
  titulo: string
  area: string
  sede: string
  modalidad: string
  estado: EstadoPublicacion
  oculta?: boolean
  dias: number
  aplicaciones: number
  semana: number
  etiquetas: string[]
  quien: keyof typeof RECLUTADORES
  desenlace?: string
}[] = [
  { titulo: 'Ejecutivo comercial', area: 'Ventas', sede: 'Bogotá · Torre Calle 100', modalidad: 'Híbrido', estado: 'Publicada', dias: 12, aplicaciones: 41, semana: 12, etiquetas: ['Contratación masiva'], quien: 'andres' },
  { titulo: 'Desarrollador backend', area: 'Tecnología', sede: 'Remoto', modalidad: 'Remoto', estado: 'Publicada', dias: 6, aplicaciones: 88, semana: 31, etiquetas: [], quien: 'laura' },
  { titulo: 'Analista de nómina', area: 'Administración', sede: 'Bogotá · Torre Calle 100', modalidad: 'Presencial', estado: 'Publicada', oculta: true, dias: 21, aplicaciones: 17, semana: 2, etiquetas: ['Reemplazo'], quien: 'sara' },
  // Publicada hace 34 días y nadie ha aplicado: el caso «vacante sin gente», con las cifras de acuerdo con el tablero
  // vacío (VA-13).
  { titulo: 'Jefe de planta', area: 'Operaciones', sede: 'Planta Funza', modalidad: 'Presencial', estado: 'Publicada', dias: 34, aplicaciones: 0, semana: 0, etiquetas: ['Urgente', 'Confidencial'], quien: 'sara' },
  { titulo: 'Diseñador gráfico', area: 'Mercadeo', sede: 'Medellín', modalidad: 'Híbrido', estado: 'Publicada', dias: 8, aplicaciones: 52, semana: 19, etiquetas: [], quien: 'andres' },
  { titulo: 'Auxiliar de bodega', area: 'Operaciones', sede: 'Planta Funza', modalidad: 'Presencial', estado: 'Publicada', dias: 15, aplicaciones: 73, semana: 8, etiquetas: ['Contratación masiva', 'Temporada fin de año'], quien: 'sara' },
  { titulo: 'Key account manager', area: 'Ventas', sede: 'Cali · Centro', modalidad: 'Híbrido', estado: 'Publicada', dias: 3, aplicaciones: 11, semana: 11, etiquetas: ['Nuevo cargo'], quien: 'andres' },
  { titulo: 'Ingeniero de datos', area: 'Analítica y BI', sede: 'Remoto', modalidad: 'Remoto', estado: 'Borrador', dias: 0, aplicaciones: 0, semana: 0, etiquetas: ['Nuevo cargo'], quien: 'laura' },
  { titulo: 'Practicante de mercadeo', area: 'Mercadeo', sede: 'Bogotá · Torre Calle 100', modalidad: 'Híbrido', estado: 'Borrador', dias: 0, aplicaciones: 0, semana: 0, etiquetas: ['Practicantes'], quien: 'andres' },
  { titulo: 'Analista de compensación', area: 'Administración', sede: 'Bogotá · Torre Calle 100', modalidad: 'Híbrido', estado: 'Borrador', dias: 0, aplicaciones: 0, semana: 0, etiquetas: [], quien: 'laura' },
  { titulo: 'Supervisor de turno noche', area: 'Operaciones', sede: 'Planta Funza', modalidad: 'Presencial', estado: 'Cerrada', dias: 71, aplicaciones: 38, semana: 0, etiquetas: ['Reemplazo'], quien: 'sara', desenlace: 'Cerrada el 28 de agosto · se contrató a Wilmer Ospina' },
  { titulo: 'Asesor de servicio', area: 'Ventas', sede: 'Barranquilla', modalidad: 'Presencial', estado: 'Cerrada', dias: 54, aplicaciones: 96, semana: 0, etiquetas: ['Contratación masiva', 'Temporada fin de año'], quien: 'andres', desenlace: 'Cerrada el 12 de agosto · se contrataron 3 personas' },
  { titulo: 'QA automatizador', area: 'Tecnología', sede: 'Remoto', modalidad: 'Remoto', estado: 'Cerrada', dias: 45, aplicaciones: 64, semana: 0, etiquetas: [], quien: 'laura', desenlace: 'Cerrada el 30 de julio · la vacante se congeló' },
  { titulo: 'Coordinador de bienestar', area: 'Administración', sede: 'Medellín', modalidad: 'Híbrido', estado: 'Cerrada', dias: 61, aplicaciones: 22, semana: 0, etiquetas: [], quien: 'sara', desenlace: 'Cerrada el 5 de agosto · se contrató a Diana Peña' },
]

const RECLUTADORES = {
  laura: { nombre: 'Laura Martínez', iniciales: 'LM', correo: 'laura@ubits.com' },
  andres: { nombre: 'Andrés Pardo', iniciales: 'AP', correo: 'andres@ubits.com' },
  sara: { nombre: 'Sara Gómez', iniciales: 'SG', correo: 'sara@ubits.com' },
}

// La única cartera con gente: Ejecutivo comercial trae a las personas de la vacante comercial de antes, con sus pruebas
// psicométricas y su roleplay, para que la ficha muestre esas dos etapas (CA-41). Su rango y sus requisitos son los de
// esa vacante, porque contra ellos se leyeron sus hojas de vida.
const CON_GENTE: Record<string, Partial<VacanteUI>> = {
  'ejecutivo-comercial': {
    rango: VACANTE_COMERCIAL.rango,
    requisitos: VACANTE_COMERCIAL.requisitos,
    descripcion: VACANTE_COMERCIAL.descripcion,
    descartados: VACANTE_COMERCIAL.descartados,
    candidatos: VACANTE_COMERCIAL.candidatos,
  },
}

const sinProcesoMontado = (): VacanteUI[] =>
  CARTERA.map((v) => {
    const quien = RECLUTADORES[v.quien]
    return {
      id: idDeTitulo(v.titulo),
      titulo: v.titulo,
      estado: v.estado,
      oculta: Boolean(v.oculta),
      area: v.area,
      sede: v.sede,
      modalidad: v.modalidad,
      diasAbierta: v.dias,
      reclutador: { nombre: quien.nombre, iniciales: quien.iniciales },
      contrato: 'Término indefinido',
      seniority: 'Semi senior',
      experiencia: '2 a 4 años',
      idioma: 'No requerido',
      rango: [3.5, 5.5] as [number, number],
      descripcion: [`Vacante de ${v.area.toLowerCase()} en ${v.sede}. La descripción completa se escribe desde «Editar».`],
      requisitos: ['Experiencia en el cargo', 'Disponibilidad para la sede', 'Manejo de herramientas del área', 'Trabajo en equipo'],
      descartados: Math.max(0, v.aplicaciones - v.semana),
      candidatos: [],
      etiquetas: v.etiquetas,
      aplicaciones: v.aplicaciones,
      ultimaSemana: v.semana,
      equipo: [{ ...quien, permiso: 'Dueña del proceso' as Permiso }],
      etapas: etapasDe(idDeTitulo(v.titulo)),
      desenlace: v.desenlace,
      ...CON_GENTE[idDeTitulo(v.titulo)],
    }
  })

export const VACANTES_UI: VacanteUI[] = [...VIVAS, ...SIN_PROCESO, ...sinProcesoMontado()]

export const buscarVacanteUI = (id: string | undefined) => VACANTES_UI.find((vacante) => vacante.id === id)

// Todas las etiquetas en uso, para los filtros de la lista.
export const ETIQUETAS = [...new Set(VACANTES_UI.flatMap((vacante) => vacante.etiquetas))].sort((a, b) => a.localeCompare(b, 'es'))

// ── Lotes de hojas de vida importadas ──
//
// Lo que hoy es una tabla de «ID del Batch · Nombre · Estado» sin más. Aquí cada lote guarda en qué terminó cada
// archivo, que es lo que permite revisar solo lo dudoso en vez de todo.

export type Lote = {
  id: string
  nombre: string
  fecha: string
  quien: string
  total: number
  listos: number
  dudosos: number
  repetidos: number
  fallidos: number
  // De dónde venían las hojas de vida (el selector «De dónde vienen» al importar).
  origen: string
}

export const LOTES_DE: Record<string, Lote[]> = {
  'analista-de-datos': [
    { id: 'L-4821', nombre: 'Referidos equipo de datos.zip', fecha: 'Hoy, 9:12 a. m.', quien: 'Laura Martínez', total: 14, listos: 9, dudosos: 3, repetidos: 1, fallidos: 1, origen: 'referido' },
    { id: 'L-4770', nombre: 'Feria de empleo Uniandes.zip', fecha: '14 de septiembre', quien: 'Laura Martínez', total: 38, listos: 31, dudosos: 4, repetidos: 3, fallidos: 0, origen: 'feria' },
  ],
  'disenadora-de-producto': [
    { id: 'L-4795', nombre: 'Portafolios Behance.zip', fecha: '16 de septiembre', quien: 'Andrés Pardo', total: 9, listos: 6, dudosos: 2, repetidos: 0, fallidos: 1, origen: 'correo' },
  ],
  'coordinador-de-turno': [],
}

export const lotesDe = (vacanteId: string): Lote[] => LOTES_DE[vacanteId] ?? []

export type Veredicto = 'cumple' | 'parcial' | 'no-cumple' | 'por-validar'

// Cada requisito de la vacante con lo que la IA concluyó y de dónde lo sacó. Se puede corregir a mano.
export type Criterio = {
  requisito: string
  veredicto: Veredicto
  evidencia: string
}

export type Candidatura = {
  id: string
  personaId: string
  candidato: Candidato
  vacante: VacanteUI
  // La etapa se guarda por su id en texto, no como una de las cinco de la plantilla: cada vacante arma sus propias
  // etapas y hay que poder mover a alguien a una que se acaba de añadir.
  etapa: string
  dias: number
  ajuste: number
  criterios: Criterio[]
  // Entró en un lote de hojas de vida: de cuál, de dónde venía y quién lo subió (la ficha lo cuenta en «Cómo llegó»).
  importada?: Importada
  // La postularon desde la base global («Mis candidatos»): quién y cuándo.
  postulada?: { quien: string; cuando: number }
  // Hace cuántos días aplicó. Se fija la primera vez que se mueve: moverla de etapa no cambia cuándo aplicó (VA-14).
  aplico?: number
}

export type Importada = {
  loteId: string
  lote: string
  quien: string
  // Cuándo entró, en milisegundos.
  cuando: number
  // «Referido», «Feria de empleo»…: lo que dice la columna «Origen» y el filtro del tablero.
  origen: string
  referidoPor?: string
  archivo: string
  peso: number
  deZip?: string
  // Un dato estaba en duda y alguien lo confirmó.
  confirmado?: boolean
  // El archivo de verdad, cuando se subió uno del equipo.
  file?: File
}

// El origen que se ve de una persona: el del lote, si entró importada.
export const origenDe = (c: Candidatura): string => c.importada?.origen ?? c.candidato.origen

export const VEREDICTO_TEXTO: Record<Veredicto, string> = {
  cumple: 'Cumple',
  parcial: 'Cumple a medias',
  'no-cumple': 'No cumple',
  'por-validar': 'Por validar',
}

// Colores de la librería: verde cumple, ámbar a medias, rojo no cumple y gris por validar.
export const VEREDICTO_BADGE: Record<Veredicto, 'success-light' | 'warning-light' | 'destructive-light' | 'secondary'> = {
  cumple: 'success-light',
  parcial: 'warning-light',
  'no-cumple': 'destructive-light',
  'por-validar': 'secondary',
}

const DEL_ESTADO: Record<string, Veredicto> = {
  Cumple: 'cumple',
  Parcial: 'parcial',
  'Por validar': 'por-validar',
  'No cumple': 'no-cumple',
}

// De dónde salió cada veredicto. La frase cambia según el requisito y la trayectoria de la persona, para que se
// lea como una cita de la hoja de vida y no como un texto de relleno.
function evidenciaDe(candidato: Candidato, requisito: string, veredicto: Veredicto): string {
  const primero = candidato.trayectoria[0]
  const cargo = primero ? `${primero.cargo} en ${primero.empresa} (${primero.periodo})` : `${candidato.cargo} en ${candidato.empresa}`
  const habilidad = candidato.habilidades.find((h) => requisito.toLowerCase().includes(h.toLowerCase().split(' ')[0]))

  if (veredicto === 'cumple') {
    return habilidad ? `«${habilidad}» aparece en el CV · ${cargo}` : `CV · ${cargo}`
  }
  if (veredicto === 'parcial') {
    return `Lo menciona pero sin detalle · ${cargo}`
  }
  if (veredicto === 'no-cumple') {
    return candidato.serena !== undefined ? 'No aparece en el CV ni en la entrevista con Serena AI' : 'No aparece en el CV'
  }
  return 'No aparece en el CV; se puede preguntar en la entrevista'
}

function criteriosDe(candidato: Candidato, vacante: VacanteUI): Criterio[] {
  return vacante.requisitos.map((requisito, indice) => {
    const estado = candidato.requisitos[indice] ?? 'Por validar'
    const veredicto = DEL_ESTADO[estado] ?? 'por-validar'
    return { requisito, veredicto, evidencia: evidenciaDe(candidato, requisito, veredicto) }
  })
}

// Personas que están en dos procesos a la vez: la misma ficha, dos candidaturas. Sirve para mostrar que no se
// duplican (el riesgo de tener «Vacantes» y «Mis candidatos» como pantallas separadas).
// Lo pendiente, lo evaluado y la entrevista son de cada candidatura, no de la persona: en la segunda vacante la IA lee
// la hoja de vida contra otros requisitos, todavía no hay entrevista con Serena y lo que esperaba en la primera no
// aplica (IN-01, CA-06, CA-07, CA-27). Antes la segunda copiaba todo de la primera y Julián salía en Coordinador de
// turno con la invitación a Serena de Analista de datos.
const TAMBIEN_EN: Record<string, { vacante: string; etapa: EtapaId; dias: number; requisitos: EstadoRequisito[] }> = {
  'valentina-ortiz': { vacante: 'disenadora-de-producto', etapa: 'cv', dias: 3, requisitos: ['Parcial', 'Por validar', 'Parcial', 'Por validar'] },
  'julian-rey': { vacante: 'coordinador-de-turno', etapa: 'cv', dias: 5, requisitos: ['Por validar', 'Parcial', 'Por validar', 'Por validar'] },
}

// El ajuste se cuenta en requisitos, no en un porcentaje: «3 de 4» se entiende y no finge una precisión que no hay.
// El número (0–100) se guarda solo para poder ordenar la lista.
// Quién refirió a alguien que llegó por un referido: una persona de la empresa (CA-25). Si el dato vino con la
// candidatura, ese; si no, una fija por persona.
export function referenteDe(candidato: Candidato): string | undefined {
  if (candidato.referidoPor) return candidato.referidoPor
  if (candidato.origen !== 'Referido') return undefined
  const indice = [...candidato.id].reduce((suma, letra) => suma + letra.charCodeAt(0), 0) % PERSONAS_EMPRESA.length
  return PERSONAS_EMPRESA[indice].nombre
}

// Cuántos días tiene una persona para presentar la entrevista con Serena AI desde que le llega la invitación: el mismo
// plazo en la configuración de la etapa, en el inicio y en su ficha (CA-15).
export const PLAZO_ENTREVISTA = 7

export const cumplidosDe = (criterios: Criterio[]) => criterios.filter((c) => c.veredicto === 'cumple').length

export const ajusteDe = (criterios: Criterio[]) => {
  const parcial = criterios.filter((c) => c.veredicto === 'parcial').length
  return Math.round(((cumplidosDe(criterios) + parcial * 0.5) / criterios.length) * 100)
}

function candidatura(candidato: Candidato, vacante: VacanteUI, etapa: string, dias: number): Candidatura {
  const criterios = criteriosDe(candidato, vacante)
  return {
    id: `${candidato.id}@${vacante.id}`,
    personaId: candidato.id,
    candidato,
    vacante,
    etapa,
    dias,
    ajuste: ajusteDe(criterios),
    criterios,
  }
}

// La vacante comercial de antes llama «psicometricas» a la etapa que la biblioteca llama «psicometrico» (CA-41).
const etapaEn = (vacante: VacanteUI, etapa: string) =>
  etapa === 'psicometricas' && vacante.etapas.some((una) => una.id === 'psicometrico') ? 'psicometrico' : etapa

const DE_LAS_VACANTES: Candidatura[] = VACANTES_UI.flatMap((vacante) =>
  vacante.candidatos.map((candidato) => candidatura(candidato, vacante, etapaEn(vacante, candidato.etapa), candidato.dias)),
).concat(
  Object.entries(TAMBIEN_EN).flatMap(([personaId, donde]) => {
    const original = VACANTES_UI.flatMap((v) => v.candidatos).find((c) => c.id === personaId)
    const vacante = VACANTES_UI.find((v) => v.id === donde.vacante)
    if (!original || !vacante) return []
    const candidato: Candidato = {
      ...original,
      etapa: donde.etapa,
      dias: donde.dias,
      requisitos: donde.requisitos,
      accion: undefined,
      serena: undefined,
      respuestas: [],
      notas: [],
    }
    return [candidatura(candidato, vacante, donde.etapa, donde.dias)]
  }),
)

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// Lo que pide el tablero de candidatos
// ══════════════════════════════════════════════════════════════════════════════════════════════════════
//
// «Candidatos › Tablero Kanban de candidatos» (24 sep, Nicolás: «completa todo el flujo, que lo que haya alrededor
// quede construido») necesita tres cosas que la lista no pedía:
// - **volumen**: con tres personas por columna no se ve qué pasa cuando una etapa se llena (Greenhouse corta en 10
//   por columna y manda a la tabla). «Desarrollador backend» tiene 31 personas en proceso y 57 rechazadas;
// - **los rechazados de cada etapa**, que el producto de hoy separa de los activos («Activos · Rechazados» por
//   columna). Cada vacante viva trae los suyos, con motivo, para que ese pie no esté siempre en cero;
// - **quién trabajó antes en la empresa**: es el único filtro que tiene hoy esa pestaña («Candidatos que han
//   trabajado en la compañía anteriormente»).
//
// Todo sale de una secuencia fija: la misma gente en el mismo sitio en cada recarga.

function secuencia(semilla: number) {
  let estado = semilla
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648
    return estado / 2147483648
  }
}

const NOMBRES_RELLENO = [
  'María', 'Juan', 'Camila', 'Andrés', 'Valentina', 'Santiago', 'Daniela', 'Sebastián', 'Paula', 'David', 'Sofía',
  'Mariana', 'Carlos', 'Diego', 'Juliana', 'Miguel', 'Catalina', 'Alejandro', 'Natalia', 'Esteban', 'Manuela', 'Ricardo',
]
const APELLIDOS_RELLENO = [
  'Gómez', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'Pérez', 'Ramírez', 'Torres', 'Vargas', 'Castro', 'Moreno',
  'Jiménez', 'Álvarez', 'Ospina', 'Cárdenas', 'Mejía', 'Salazar', 'Duarte', 'Navarro', 'Zapata', 'Bermúdez', 'Franco',
]
const EMPRESAS_RELLENO = ['Bancolombia', 'Rappi', 'Grupo Éxito', 'Sura', 'Nutresa', 'Alpina', 'Davivienda', 'Claro', 'Avianca', 'Falabella', 'Terpel', 'Quala']
const CIUDADES_RELLENO = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira']
const ORIGENES_RELLENO: Candidato['origen'][] = ['LinkedIn', 'Portal de empleo', 'Referido', 'Computrabajo', 'Portal de empleo', 'LinkedIn']

// Los cargos de quien aplica a cada vacante: se parecen al puesto, sin ser todos iguales.
const CARGOS_RELLENO: Record<string, string[]> = {
  'analista-de-datos': ['Analista de datos', 'Analista de BI', 'Ingeniero de datos', 'Analista financiero'],
  'disenadora-de-producto': ['Diseñador UX', 'Diseñador de producto', 'Diseñador gráfico', 'Investigador de usuarios'],
  'coordinador-de-turno': ['Supervisor de bodega', 'Auxiliar logístico', 'Jefe de línea', 'Coordinador de producción'],
  'desarrollador-backend': ['Desarrollador backend', 'Ingeniero de software', 'Desarrollador Java', 'Desarrollador Node.js'],
}

// Quién trabajó antes en la empresa. Felipe Arango es, además, alguien del equipo de hoy: volvió a aplicar.
const EX_EMPLEADOS = new Set(['felipe-arango', 'daniela-mora', 'oscar-guerrero', 'lucia-cifuentes'])

export const fueEmpleado = (candidatura: Candidatura) => EX_EMPLEADOS.has(candidatura.personaId)

// Su paso por la empresa (CA-09): la tarjeta, la ficha y el filtro de la hoja de vida dicen lo mismo. Quien trabaja hoy
// en la empresa (está en «Compartir › Invitar») es candidato interno: su postulación es confidencial.
const INTERNOS = new Set(['felipe-arango'])
const MOTIVOS_SALIDA = ['Renunció para un cargo con más responsabilidad', 'Terminó su contrato a término fijo', 'Se cambió de ciudad']
export type PasoPorLaEmpresa = { tipo: 'ex' | 'interno'; titulo: string; detalle: string }
export function pasoPorLaEmpresa(personaId: string, cargo: string): PasoPorLaEmpresa | null {
  if (INTERNOS.has(personaId))
    return {
      tipo: 'interno',
      titulo: 'Trabaja hoy en la empresa',
      detalle: `Es candidato interno: hoy es ${cargo.toLowerCase()}. Su postulación es confidencial: su jefe actual no la ve hasta que llegue a la oferta.`,
    }
  if (!EX_EMPLEADOS.has(personaId)) return null
  const h = [...personaId].reduce((suma, letra) => suma + letra.charCodeAt(0), 0)
  const desde = 2018 + (h % 4)
  const hasta = desde + 1 + (h % 3)
  const motivo = MOTIVOS_SALIDA[h % MOTIVOS_SALIDA.length]
  return {
    tipo: 'ex',
    titulo: 'Ya trabajó en la empresa',
    detalle: `De ${desde} a ${hasta}. ${motivo}; se puede recontratar.`,
  }
}

// Lo que espera una respuesta según la etapa, dicho como lo dice el producto.
const ACCION_RELLENO: Record<string, (dias: number) => string | undefined> = {
  cv: (dias) => (dias > 5 ? `Sin revisar hace ${dias} días` : undefined),
  serena: (dias) => (dias > 3 ? 'No ha agendado la entrevista con Serena AI' : undefined),
  revision: (dias) => (dias > 4 ? 'Revisar assessment' : undefined),
  antecedentes: (dias) => (dias > 6 ? `Antecedentes pendientes hace ${dias} días` : undefined),
}

// Lo que respondió en Serena AI quien ya pasó por la entrevista. Las preguntas son las de su vacante (las mismas que
// respondieron las personas escritas a mano); la de backend no tiene a nadie escrito y lleva las suyas. Cada respuesta
// tiene dos versiones, la sólida y la general, y sale una u otra según el puntaje: así la cita que lee la IA en el
// perfil cuadra con lo que la persona dijo. Sin esto, su entrevista salía con puntaje y cero preguntas.
const PREGUNTAS_BACKEND = [
  'Cuéntame de un servicio que hayas llevado a producción y qué problema resolvía.',
  '¿Cómo encuentras la causa de un error que solo pasa en producción?',
  '¿Qué revisas antes de aprobar el código de otra persona?',
]

const RESPUESTAS_RELLENO: Record<string, [string, string][]> = {
  'analista-de-datos': [
    [
      'En {empresa} armé el tablero de cartera: mostró que tres clientes concentraban la mora y el comité cambió las condiciones de crédito ese mismo mes.',
      'Hice varios tableros en Power BI para el área; sirvieron para que el equipo viera mejor los números.',
    ],
    [
      'Lo cruzo con la fuente original y con el corte anterior; si la diferencia pasa del 2 %, no lo publico hasta encontrar por qué.',
      'Reviso que los totales cuadren y, si algo se ve raro, le pregunto a quien me pasó el archivo.',
    ],
    [
      'El cierre mensual: en {empresa} lo hacíamos a mano en Excel. Lo pasaría a una consulta programada con alerta si falta un dato.',
      'Automatizaría los reportes que más tiempo toman, según lo que el equipo necesite.',
    ],
  ],
  'disenadora-de-producto': [
    [
      'En {empresa} quitamos un paso del registro porque en las pruebas cinco de ocho personas se perdían ahí; la conversión subió.',
      'Siempre tengo en cuenta lo que dicen los usuarios y ajusto los diseños cuando hay comentarios.',
    ],
    [
      'Recorto el alcance con ingeniería en la misma mesa: qué sale ahora y qué queda documentado para la siguiente entrega.',
      'Trato de negociar los tiempos y de entregar lo más importante primero.',
    ],
  ],
  'coordinador-de-turno': [
    [
      'Primero hablo a solas con él para saber qué pasa; en {empresa} ajustamos la ruta de un operario y dejó de llegar tarde.',
      'Le hago el llamado de atención y, si sigue, lo reporto a recursos humanos.',
    ],
    [
      'Se derramó químico en la línea 2: paré la línea, aislé la zona y reportamos al área de seguridad antes de retomar.',
      'Cuando hay un incidente seguimos el protocolo de seguridad de la planta.',
    ],
  ],
  'desarrollador-backend': [
    [
      'En {empresa} llevé a producción el servicio de conciliación de pagos; bajó de un día a diez minutos el cierre de caja.',
      'He hecho varios servicios con Node.js y los he subido a producción con el equipo.',
    ],
    [
      'Reproduzco con los datos del incidente en un ambiente aparte y leo los registros por el identificador de la petición.',
      'Reviso los logs y pruebo hasta encontrar el error.',
    ],
    [
      'Que tenga pruebas, que el nombre diga lo que hace y que no rompa la compatibilidad de la API con los clientes.',
      'Que el código funcione y que siga las buenas prácticas del equipo.',
    ],
  ],
}

function respuestasDeRelleno(vacante: VacanteUI, candidato: Candidato) {
  if (candidato.serena === undefined) return []
  const preguntas = vacante.candidatos.find((c) => c.respuestas.length)?.respuestas.map((r) => r.pregunta) ?? PREGUNTAS_BACKEND
  const respuestas = RESPUESTAS_RELLENO[vacante.id] ?? RESPUESTAS_RELLENO['desarrollador-backend']
  // Cada pregunta según su propio puntaje, el mismo que elige la lectura de la IA (CA-21): la alta cita la versión
  // sólida; la media, el caso sin su resultado; la baja, la general.
  const puntajes = puntajesPorPregunta(candidato.serena, preguntas.length)
  return preguntas.map((pregunta, indice) => {
    const [solida, general] = respuestas[indice % respuestas.length]
    const nivel = nivelDe(puntajes[indice])
    const texto = nivel === 'alta' ? solida : nivel === 'baja' ? general : `${sinResultado(solida)}${indice % 3 === 1 ? ' En general, depende de cada caso.' : ''}`
    return { pregunta, respuesta: texto.replaceAll('{empresa}', candidato.empresa) }
  })
}

function personaDeRelleno(azar: () => number, vacante: VacanteUI, numero: number, etapa: string, conProceso: boolean): Candidatura {
  const toma = <T,>(lista: T[]) => lista[Math.floor(azar() * lista.length)]
  // Nombre y un apellido, como se presenta la gente en una hoja de vida: cabe en la tarjeta del tablero.
  const nombre = `${toma(NOMBRES_RELLENO)} ${toma(APELLIDOS_RELLENO)}`
  const [primero, apellido] = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(' ')
  const cargo = toma(CARGOS_RELLENO[vacante.id] ?? ['Profesional del área'])
  const empresa = toma(EMPRESAS_RELLENO)
  const anios = 1 + Math.floor(azar() * 9)
  const dias = Math.floor(azar() * (etapa === 'cv' ? 12 : 9))
  const orden = vacante.etapas.findIndex((e) => e.id === etapa)
  const pasoPorSerena = orden > vacante.etapas.findIndex((e) => e.id === 'serena')
  // Quien sigue en proceso cumple más que quien se quedó en el camino: el tablero se lee como un embudo de verdad.
  const tope = conProceso ? 0.35 : 0.6
  const requisitos = vacante.requisitos.map(() => {
    const r = azar()
    return r > tope ? 'Cumple' : r > tope / 2 ? 'Parcial' : 'Por validar'
  }) as Candidato['requisitos']
  const id = `${primero}-${apellido}-${vacante.id}-${numero}`
  if (azar() > 0.88) EX_EMPLEADOS.add(id)

  const candidato: Candidato = {
    id,
    nombre,
    iniciales: `${nombre[0]}${nombre.split(' ')[1][0]}`.toUpperCase(),
    correo: `${primero[0]}${apellido}${numero}@correo.com`,
    celular: `+57 3${Math.floor(10 + azar() * 89)} ${Math.floor(100 + azar() * 899)} ${Math.floor(1000 + azar() * 8999)}`,
    origen: toma(ORIGENES_RELLENO),
    etapa: etapa as EtapaId,
    dias,
    ajuste: 0,
    cargo,
    empresa,
    ciudad: toma(CIUDADES_RELLENO),
    anios,
    pretension: Math.round((vacante.rango[0] + azar() * (vacante.rango[1] - vacante.rango[0] + 1.5)) * 10) / 10,
    disponibilidad: toma([0, 15, 15, 30, 30, 45]),
    resumen: `${cargo} en ${empresa}, con ${anios} ${anios === 1 ? 'año' : 'años'} de experiencia.`,
    trayectoria: [{ cargo, empresa, periodo: `${2026 - Math.min(anios, 4)} – hoy` }],
    habilidades: [],
    serena: pasoPorSerena ? 62 + Math.floor(azar() * 34) : undefined,
    respuestas: [],
    requisitos,
    fortalezas: [
      {
        texto: `${anios} ${anios === 1 ? 'año' : 'años'} de experiencia; hoy es ${cargo} en ${empresa}.`,
        fuentes: [{ etiqueta: `CV · ${empresa}`, seccion: 'cv' }],
      },
    ],
    riesgos: [],
    notas: [],
    accion: conProceso ? ACCION_RELLENO[etapa]?.(dias) : undefined,
  }
  // Después de armar a la persona y sin tocar la secuencia: sumarle pasos cambiaría a toda la gente que viene detrás.
  candidato.respuestas = respuestasDeRelleno(vacante, candidato)
  // Dos casos que la ficha tiene que saber mostrar (CA-14, CA-44): una hoja de vida que la IA no pudo leer y alguien que
  // se agregó sin hoja de vida. Sin lectura, sus requisitos quedan por validar.
  if (vacante.id === 'desarrollador-backend' && etapa === 'cv' && (numero === 2 || numero === 4)) {
    if (numero === 2) {
      candidato.hojaIlegible = 'es una imagen escaneada, sin texto que leer'
      candidato.accion = 'No se pudo leer su CV'
    } else {
      candidato.sinHojaDeVida = true
      candidato.origen = 'Agregado a mano'
      candidato.accion = 'Sin CV'
    }
    candidato.requisitos = vacante.requisitos.map(() => 'Por validar')
  }
  // Dos entrevistas con Serena que la ficha tiene que saber mostrar: una que se cortó a la mitad (CA-37) y una que se
  // repitió (CA-38). Sin puntaje, la que se cortó no entra a los promedios; en la repetida cuenta la última completa.
  if (vacante.id === 'desarrollador-backend' && etapa === 'serena' && numero === 21) {
    candidato.respuestas = respuestasDeRelleno(vacante, { ...candidato, serena: 74 }).slice(0, 1)
    candidato.entrevistaSinTerminar = { respondidas: 1, de: 3, minuto: 5, motivo: 'Se cortó la llamada en la segunda pregunta' }
    candidato.accion = 'Entrevista sin terminar'
  }
  if (vacante.id === 'desarrollador-backend' && etapa === 'serena' && numero === 23) {
    candidato.serena = 81
    candidato.respuestas = respuestasDeRelleno(vacante, candidato)
    candidato.intentosSerena = [{ puntaje: 61, hace: dias, motivo: 'Tuvo problemas de audio en la llamada; pidió repetirla y el equipo la reinvitó' }]
  }
  return candidatura(candidato, vacante, etapa, dias)
}

// Cuánta gente hay en cada etapa. Con proceso: los activos; sin: los que se rechazaron ahí.
const RELLENO: Record<string, { activos?: Record<string, number>; rechazados: Record<string, number> }> = {
  'desarrollador-backend': {
    activos: { cv: 17, serena: 8, revision: 4, antecedentes: 2 },
    rechazados: { cv: 40, serena: 12, revision: 5 },
  },
  'analista-de-datos': { rechazados: { cv: 8, serena: 4, revision: 2 } },
  'disenadora-de-producto': { rechazados: { cv: 3, serena: 1, revision: 1 } },
  'coordinador-de-turno': { rechazados: { cv: 5, serena: 2, revision: 1, antecedentes: 1 } },
}

// Por qué se rechazó a alguien, según dónde iba. Salen de la misma lista del diálogo de rechazo (los de UBITS, más
// alguno de quien se retiró).
const MOTIVOS_RELLENO: Record<string, string[]> = {
  cv: ['No cumple requisitos', 'Rechazo de CV', 'Alta expectativa salarial', 'Falta de experiencia clave'],
  serena: ['Bajo puntaje AI', 'Entrevista expirada', 'Aceptó otra oferta'],
  revision: ['Soft skills débiles', 'No encaja con cultura', 'No se presentó', 'No le sirve el salario'],
  antecedentes: ['Falta de documentación', 'Sin disponibilidad'],
}

export type Rechazada = {
  candidatura: Candidatura
  motivo: string
  avisada: boolean
  // Lo decidió el equipo o se retiró la persona. Lo sembrado no lo guarda: se deduce del motivo (`rechazos.ts`).
  quien?: 'nosotros' | 'candidato'
  // Quién lo registró y cuándo (milisegundos), en la sesión.
  por?: string
  cuando?: number
  // La nota para el equipo, que la persona no ve.
  nota?: string
  // La plantilla del correo, si salió.
  plantilla?: string
}

const azarRelleno = secuencia(311)
let numeroRelleno = 0
const rellenar = (conProceso: boolean) =>
  Object.entries(RELLENO).flatMap(([vacanteId, cuanto]) => {
    const vacante = VACANTES_UI.find((v) => v.id === vacanteId)
    const porEtapa = conProceso ? cuanto.activos : cuanto.rechazados
    if (!vacante || !porEtapa) return []
    return Object.entries(porEtapa).flatMap(([etapa, n]) =>
      Array.from({ length: n }, () => personaDeRelleno(azarRelleno, vacante, (numeroRelleno += 1), etapa, conProceso)),
    )
  })

export const CANDIDATURAS: Candidatura[] = [...DE_LAS_VACANTES, ...rellenar(true)]

export const RECHAZADAS: Rechazada[] = rellenar(false).map((candidatura, indice) => {
  const motivos = MOTIVOS_RELLENO[candidatura.etapa] ?? MOTIVOS_RELLENO.cv
  return { candidatura, motivo: motivos[indice % motivos.length], avisada: indice % 7 !== 0 }
})

// ── Etapas con consecuencias ──
//
// Mover de etapa no manda correo, salvo en dos casos que el tablero tiene que decir antes de soltar la tarjeta:
// entrar a una etapa que hace la IA (Serena AI le escribe a la persona para su entrevista) y llegar a la última, que
// es la oferta y cierra el proceso.

export const etapaDe = (etapas: EtapaVacante[], id: string) => etapas.find((etapa) => etapa.id === id)

export const esUltimaEtapa = (etapas: EtapaVacante[], id: string) => etapas[etapas.length - 1]?.id === id

// Cuántas veces aparece cada persona: la ficha avisa «también está en otra vacante».
export const OTRAS_DE = (personaId: string, salvo: string) =>
  CANDIDATURAS.filter((c) => c.personaId === personaId && c.id !== salvo)

// Lo que espera una respuesta del equipo: lo que mueve el trabajo del día.
export const ESPERA_RESPUESTA = (c: Candidatura) => Boolean(c.candidato.accion)

export const ORIGENES = [...new Set(CANDIDATURAS.map((c) => c.candidato.origen))]

// Una vacante recién creada: el borrador con el que se abre el editor desde «Crear vacante». Nace en borrador,
// sin equipo más que quien la crea y con las etapas de la plantilla, que después se ajustan.
export const vacanteNueva = (): VacanteUI => ({
  id: `nueva-${Date.now()}`,
  titulo: '',
  estado: 'Borrador',
  oculta: false,
  area: '',
  sede: '',
  modalidad: 'Híbrido',
  diasAbierta: 0,
  reclutador: { nombre: 'Laura Martínez', iniciales: 'LM' },
  contrato: 'Término indefinido',
  seniority: 'Semi senior',
  experiencia: '2 a 4 años',
  idioma: 'No requerido',
  rango: [3, 5],
  descripcion: [],
  requisitos: [],
  descartados: 0,
  candidatos: [],
  etiquetas: [],
  aplicaciones: 0,
  ultimaSemana: 0,
  equipo: [{ nombre: 'Laura Martínez', iniciales: 'LM', correo: 'laura@ubits.com', permiso: 'Dueña del proceso' }],
  etapas: DE_PLANTILLA(ETAPAS),
})


// ── Etapas: el nombre y el siguiente paso ──
//
// Como cada vacante arma su proceso, el nombre de una etapa ya no se puede sacar de una lista fija: se busca
// primero en las de la plantilla y después en las que se pueden añadir.

export const tituloEtapa = (id: string): string =>
  ETAPAS.find((etapa) => etapa.id === id)?.titulo ??
  BIBLIOTECA_ETAPAS.find((etapa) => etapa.id === id)?.titulo ??
  // Las etapas de una vacante hecha con la creación de Vacantes (30 sep) tienen su propio id: se buscan en ella.
  VACANTES_UI.flatMap((vacante) => vacante.etapas).find((etapa) => etapa.id === id)?.titulo ??
  id

// La etapa que sigue **en esta vacante**, que no tiene por qué ser la misma que en otra.
export const siguienteEtapaDe = (etapas: EtapaVacante[], etapa: string): string | null => {
  const indice = etapas.findIndex((una) => una.id === etapa)
  return indice >= 0 && indice < etapas.length - 1 ? etapas[indice + 1].id : null
}

// La primera etapa de la vacante: donde caen las hojas de vida importadas.
export const primeraEtapaDe = (etapas: EtapaVacante[]): string => etapas[0]?.id ?? ETAPAS[0].id

// Una vacante creada en la maqueta se queda en la lista mientras dure la sesión: así el recorrido completo
// («crear → queda en borrador → abrirla → publicarla») se puede hacer de verdad, sin recargar.
export const agregarVacante = (vacante: VacanteUI) => {
  VACANTES_UI.unshift(vacante)
  return vacante
}
