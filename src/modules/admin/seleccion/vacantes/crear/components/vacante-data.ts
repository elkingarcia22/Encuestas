// Datos del asistente de creación de vacantes (Selección › Vacantes › Crear vacante).
//
// Los campos, los nombres de las etapas y los textos salen del recorrido real del admin de reclutamiento
// (docs/plataforma-ubits/06-marco-d-reclutamiento.md: crear vacante paso 1 «información básica», paso 2
// «configurar» con la biblioteca de etapas, y las cinco etapas que trae la cuenta por defecto).

import { plural } from '@/modules/design-system/patrones/formato'

export type Modalidad = 'presencial' | 'hibrida' | 'remota'

export type InfoBasica = {
  carpeta: string
  confidencial: boolean
  nombre: string
  descripcion: string
  contrato: string
  habilidades: string[]
  departamento: string
  experiencia: string
  seniority: string
  idioma: string
  pais: string
  ciudad: string
  modalidad: Modalidad
  reubicacion: boolean
  moneda: string
  salario: number[]
  equity: boolean
  equityMax: number
}

export const INFO_VACIA: InfoBasica = {
  carpeta: 'sin-carpeta',
  confidencial: false,
  nombre: '',
  descripcion: '',
  contrato: 'indefinido',
  habilidades: [],
  departamento: '',
  experiencia: '3-5',
  seniority: 'semi-senior',
  idioma: 'es',
  pais: 'co',
  ciudad: '',
  modalidad: 'hibrida',
  reubicacion: false,
  moneda: 'cop',
  salario: [4, 6],
  equity: false,
  equityMax: 0.5,
}

type Opcion = { value: string; label: string }

export const CARPETAS: Opcion[] = [
  { value: 'sin-carpeta', label: 'Sin carpeta' },
  { value: 'comercial-2026', label: 'Comercial 2026' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'masivos', label: 'Procesos masivos' },
]

export const CONTRATOS: Opcion[] = [
  { value: 'indefinido', label: 'Término indefinido' },
  { value: 'fijo', label: 'Término fijo' },
  { value: 'obra', label: 'Obra o labor' },
  { value: 'prestacion', label: 'Prestación de servicios' },
  { value: 'aprendizaje', label: 'Contrato de aprendizaje' },
]

export const DEPARTAMENTOS: Opcion[] = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'gestion-humana', label: 'Gestión humana' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'servicio', label: 'Servicio al cliente' },
]

export const EXPERIENCIA: Opcion[] = [
  { value: '0-1', label: 'Menos de 1 año' },
  { value: '1-3', label: 'De 1 a 3 años' },
  { value: '3-5', label: 'De 3 a 5 años' },
  { value: '5-10', label: 'De 5 a 10 años' },
  { value: '10', label: 'Más de 10 años' },
]

export const SENIORITY: Opcion[] = [
  { value: 'practicante', label: 'Practicante' },
  { value: 'junior', label: 'Junior' },
  { value: 'semi-senior', label: 'Semi senior' },
  { value: 'senior', label: 'Senior' },
  { value: 'lider', label: 'Líder' },
  { value: 'direccion', label: 'Dirección' },
]

export const IDIOMAS: Opcion[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
]

export const PAISES: Opcion[] = [
  { value: 'co', label: 'Colombia' },
  { value: 'mx', label: 'México' },
  { value: 'pe', label: 'Perú' },
  { value: 'cl', label: 'Chile' },
  { value: 'ar', label: 'Argentina' },
]

export const MONEDAS: Opcion[] = [
  { value: 'cop', label: 'COP · peso colombiano' },
  { value: 'mxn', label: 'MXN · peso mexicano' },
  { value: 'usd', label: 'USD · dólar' },
]

// Millones para COP y MXN; miles para USD. Solo cambia cómo se lee el rango del deslizador.
export const UNIDAD_SALARIO: Record<string, string> = {
  cop: 'millones',
  mxn: 'miles',
  usd: 'miles',
}

// Catálogo de habilidades. Se busca por nombre, así que no importa que sea largo; el orden solo decide qué se ve
// primero al abrir la lista, y arriba van las que más se repiten en las vacantes de la cuenta.
export const HABILIDADES = [
  // Las más usadas
  'Comunicación',
  'Trabajo en equipo',
  'Servicio al cliente',
  'Excel avanzado',
  'Pensamiento analítico',
  'Negociación',
  'Liderazgo',
  'Gestión de proyectos',
  'Orientación a resultados',
  'Resolución de problemas',
  // Datos y tecnología
  'SQL',
  'Power BI',
  'Tableau',
  'Python',
  'Estadística',
  'Modelado de datos',
  'Google Analytics',
  'Automatización de procesos',
  'Bases de datos',
  'Ciberseguridad',
  // Comercial
  'Prospección en frío',
  'Cierre de ventas',
  'Manejo de objeciones',
  'CRM (Salesforce, HubSpot)',
  'Venta consultiva',
  'Gestión de cuentas clave',
  'Elaboración de propuestas',
  // Finanzas y administración
  'Contabilidad',
  'Presupuestos',
  'Análisis financiero',
  'Facturación',
  'Normativa tributaria',
  'Control de inventarios',
  // Operaciones
  'Logística',
  'Gestión de proveedores',
  'Mejora continua',
  'Seguridad y salud en el trabajo',
  'Control de calidad',
  'Planeación de la demanda',
  // Gestión humana
  'Selección por competencias',
  'Formación de equipos',
  'Nómina',
  'Relaciones laborales',
  'Evaluación de desempeño',
  // Habilidades blandas
  'Adaptabilidad',
  'Atención al detalle',
  'Manejo de la presión',
  'Escucha activa',
  'Toma de decisiones',
  'Pensamiento crítico',
]

// Texto que escribe el asistente de redacción. En el producto lo genera el modelo con el nombre del cargo,
// el departamento y las habilidades marcadas; aquí se arma con esos mismos datos para que la maqueta muestre
// de dónde sale cada parte.
export function redaccionSugerida(info: InfoBasica) {
  const cargo = info.nombre.trim() || 'esta posición'
  const area = DEPARTAMENTOS.find((d) => d.value === info.departamento)?.label
  const habilidades = info.habilidades.length ? info.habilidades.join(', ') : 'las competencias del cargo'
  const donde = info.modalidad === 'remota' ? 'en modalidad remota' : info.modalidad === 'hibrida' ? 'en modalidad híbrida' : 'de manera presencial'

  return [
    `Buscamos ${cargo}${area ? ` para el área de ${area.toLowerCase()}` : ''}. La persona trabajará ${donde} y será responsable de llevar los indicadores del equipo, proponer mejoras y acompañar al resto del área en el día a día.`,
    '',
    'Qué harás:',
    '· Hacer seguimiento a los resultados del área y reportarlos cada semana.',
    '· Proponer mejoras a los procesos con los que trabaja el equipo.',
    '· Acompañar a otras áreas en los proyectos que involucren tu trabajo.',
    '',
    `Qué buscamos: experiencia comprobada en ${habilidades}, autonomía para organizar tu trabajo y ganas de aprender.`,
  ].join('\n')
}

/* Paso 2 · flujo de selección --------------------------------------------------------------------- */

export type TipoEtapa = 'estandar' | 'ia'

// Las cuatro etapas que abren panel de configuración.
export type Configurable = 'psicometricas' | 'serena' | 'roleplay' | 'idiomas'

export type Etapa = {
  slug: string
  nombre: string
  categoria: string
  tipo: TipoEtapa
  descripcion: string
  configura?: Configurable
  // «Seleccionado» cierra el proceso: no se quita ni se saca del último lugar.
  fija?: boolean
}

export const BIBLIOTECA: Etapa[] = [
  {
    slug: 'evaluacion-cv',
    nombre: 'Evaluación de CV',
    categoria: 'Filtro',
    tipo: 'estandar',
    descripcion: 'Filtro inicial por expectativa salarial, puntaje mínimo y ex empleados.',
  },
  {
    slug: 'psicometricas',
    nombre: 'Pruebas psicométricas',
    categoria: 'Evaluación',
    tipo: 'estandar',
    descripcion: 'Cognición, motivación, estilo social y personalidad.',
    configura: 'psicometricas',
  },
  {
    slug: 'prueba-tecnica',
    nombre: 'Prueba técnica',
    categoria: 'Evaluación',
    tipo: 'estandar',
    descripcion: 'Un ejercicio propio del cargo, con plazo de entrega.',
  },
  {
    slug: 'para-revision',
    nombre: 'Para revisión',
    categoria: 'Revisión humana',
    tipo: 'estandar',
    descripcion: 'El reclutador revisa a mano quién sigue en el proceso.',
  },
  {
    slug: 'entrevista-equipo',
    nombre: 'Entrevista con el equipo',
    categoria: 'Revisión humana',
    tipo: 'estandar',
    descripcion: 'Entrevista con el jefe directo y el equipo del cargo.',
  },
  {
    slug: 'antecedentes',
    nombre: 'Antecedentes judiciales',
    categoria: 'Verificación',
    tipo: 'estandar',
    descripcion: 'Verificación de antecedentes antes de la oferta.',
  },
  {
    slug: 'referencias',
    nombre: 'Referencias laborales',
    categoria: 'Verificación',
    tipo: 'estandar',
    descripcion: 'Llamadas a los empleos anteriores de la persona.',
  },
  {
    slug: 'seleccionado',
    nombre: 'Seleccionado',
    categoria: 'Oferta',
    tipo: 'estandar',
    descripcion: 'Cierra el proceso con la persona elegida.',
    fija: true,
  },
  {
    slug: 'serena',
    nombre: 'Entrevista con Serena AI',
    categoria: 'Entrevista con IA',
    tipo: 'ia',
    descripcion: 'Serena entrevista por teléfono o videollamada y puntúa cada respuesta.',
    configura: 'serena',
  },
  {
    slug: 'roleplay',
    nombre: 'Roleplay AI',
    categoria: 'Simulación',
    tipo: 'ia',
    descripcion: 'El candidato atiende una situación real frente a un agente que le responde.',
    configura: 'roleplay',
  },
  {
    slug: 'idiomas',
    nombre: 'Agente de Idiomas AI',
    categoria: 'Evaluación oral',
    tipo: 'ia',
    descripcion: 'Conversación hablada para medir el nivel real del idioma.',
    configura: 'idiomas',
  },
]

export function buscarEtapa(slug: string) {
  return BIBLIOTECA.find((e) => e.slug === slug)
}

// Las cinco etapas con las que llega una vacante nueva.
export const FLUJO_INICIAL = ['evaluacion-cv', 'serena', 'para-revision', 'antecedentes', 'seleccionado']

export const PLANTILLAS: Opcion[] = [
  { value: 'sin-plantilla', label: 'Sin plantilla · empezar desde cero' },
  { value: 'estandar', label: 'Proceso estándar (5 etapas)' },
  { value: 'comercial', label: 'Comercial con roleplay (6 etapas)' },
  { value: 'bilingue', label: 'Cargo bilingüe (6 etapas)' },
]

export const FLUJOS_DE_PLANTILLA: Record<string, string[]> = {
  'sin-plantilla': ['evaluacion-cv', 'seleccionado'],
  estandar: FLUJO_INICIAL,
  comercial: ['evaluacion-cv', 'psicometricas', 'roleplay', 'para-revision', 'antecedentes', 'seleccionado'],
  bilingue: ['evaluacion-cv', 'serena', 'idiomas', 'para-revision', 'antecedentes', 'seleccionado'],
}

/* Configuración de las cuatro etapas ----------------------------------------------------------- */

export const VOCES: Opcion[] = [
  { value: 'neutro', label: 'Español neutro' },
  { value: 'co', label: 'Español · Colombia' },
  { value: 'mx', label: 'Español · México' },
  { value: 'es', label: 'Español · España' },
  { value: 'us', label: 'Inglés · Estados Unidos' },
]

export const DIFICULTADES: Opcion[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
]

export const PRUEBAS_PSICOMETRICAS = [
  { value: 'cognicion', label: 'Cognición', texto: 'Razonamiento verbal, numérico y abstracto.', minutos: 25 },
  { value: 'motivacion', label: 'Motivación', texto: 'Qué mueve a la persona en el trabajo.', minutos: 10 },
  { value: 'estilo-social', label: 'Estilo social', texto: 'Cómo se relaciona con el equipo y con el cliente.', minutos: 12 },
  { value: 'personalidad', label: 'Personalidad', texto: 'Rasgos estables de comportamiento.', minutos: 20 },
  { value: 'valores', label: 'Valores', texto: 'Qué tanto encaja con la cultura de la empresa.', minutos: 10 },
  { value: 'competencias', label: 'Competencias', texto: 'Las competencias declaradas en la vacante.', minutos: 15 },
]

// Lo que le toma al candidato responder lo que esté marcado.
export function minutosDePruebas(marcadas: string[]) {
  return PRUEBAS_PSICOMETRICAS.filter((p) => marcadas.includes(p.value)).reduce((total, p) => total + p.minutos, 0)
}

export type ConfigPsicometricas = { pruebas: string[]; idioma: string }

export const PSICOMETRICAS_POR_DEFECTO: ConfigPsicometricas = {
  pruebas: ['cognicion', 'personalidad'],
  idioma: 'es',
}

export type Pregunta = { id: string; objetivo: string; texto: string; puntos: number }

export type ConfigSerena = {
  preguntas: Pregunta[]
  canal: 'telefonico' | 'virtual'
  voz: string
  vigencia: number
  minimo: number
}

export const SERENA_POR_DEFECTO: ConfigSerena = {
  preguntas: [
    {
      id: 'p1',
      objetivo: 'Experiencia en el cargo',
      texto: 'Cuéntame de un proceso que hayas liderado de principio a fin. ¿Qué parte te costó más?',
      puntos: 40,
    },
    {
      id: 'p2',
      objetivo: 'Manejo de presión',
      texto: 'Describe una semana en la que se te juntó todo. ¿Cómo decidiste qué hacer primero?',
      puntos: 30,
    },
    {
      id: 'p3',
      objetivo: 'Expectativa y disponibilidad',
      texto: '¿Cuál es tu expectativa salarial y desde cuándo podrías empezar?',
      puntos: 30,
    },
  ],
  canal: 'telefonico',
  voz: 'neutro',
  // El mismo plazo que dicen el inicio y la ficha de la persona (CA-15).
  vigencia: 7,
  minimo: 70,
}

export type Criterio = { clave: string; nombre: string; peso: number; ayuda: string }

export type ConfigRoleplay = {
  agente: string
  dificultad: string
  duracion: number
  contexto: string
  voz: string
  criterios: Criterio[]
  vigencia: number
  minimo: number
}

export const LIMITE_CONTEXTO = 2000

export const ROLEPLAY_POR_DEFECTO: ConfigRoleplay = {
  agente: 'Camila, jefa de compras',
  dificultad: 'media',
  duracion: 10,
  contexto:
    'Eres Camila, jefa de compras de una cadena de droguerías. Llevas dos años con otro proveedor y estás conforme. El candidato te llama para ofrecerte un cambio. Muestra interés solo si te habla de ahorro real y tiempos de entrega; si insiste en el precio sin argumentos, corta la conversación con amabilidad.',
  voz: 'co',
  criterios: [
    { clave: 'objeciones', nombre: 'Manejo de objeciones', peso: 35, ayuda: 'Qué hace cuando le dicen que no.' },
    { clave: 'persuasion', nombre: 'Persuasión', peso: 25, ayuda: 'Si sus argumentos mueven la decisión.' },
    { clave: 'escucha', nombre: 'Escucha activa', peso: 20, ayuda: 'Si recoge lo que dijo la otra persona.' },
    { clave: 'control', nombre: 'Control de la conversación', peso: 20, ayuda: 'Si lleva la charla a un cierre.' },
  ],
  vigencia: 7,
  minimo: 75,
}

export type ConfigIdiomas = {
  idioma: string
  dificultad: string
  experiencia: string
  voz: string
  criterios: Criterio[]
  vigencia: number
  minimo: number
}

export const IDIOMAS_POR_DEFECTO: ConfigIdiomas = {
  idioma: 'en',
  dificultad: 'media',
  experiencia:
    'Preséntate como un cliente extranjero que llama para resolver una duda sobre su pedido. Habla a velocidad normal y usa expresiones cotidianas. Deja que el candidato lleve la conversación y hazle dos preguntas de seguimiento.',
  voz: 'us',
  criterios: [
    { clave: 'fluidez', nombre: 'Fluidez', peso: 25, ayuda: 'Si habla seguido, sin pausas largas.' },
    { clave: 'vocabulario', nombre: 'Vocabulario', peso: 20, ayuda: 'Variedad y precisión de las palabras.' },
    { clave: 'gramatica', nombre: 'Gramática', peso: 20, ayuda: 'Estructura correcta de las frases.' },
    { clave: 'pronunciacion', nombre: 'Pronunciación', peso: 20, ayuda: 'Qué tan claro se le entiende.' },
    { clave: 'comprension', nombre: 'Comprensión', peso: 15, ayuda: 'Si responde lo que se le preguntó.' },
  ],
  vigencia: 7,
  minimo: 70,
}

// El deslizador de la librería devuelve un número cuando tiene un solo tirador y un arreglo cuando es un rango.
// Sin esto, un deslizador de un solo tirador dejaba el valor en NaN al moverlo con el teclado.
export function valorUnico(valor: number | readonly number[]) {
  return Array.isArray(valor) ? valor[0] : (valor as number)
}

export function valorRango(valor: number | readonly number[]) {
  return Array.isArray(valor) ? [...valor] : [valor as number]
}

export function sumaPesos(criterios: Criterio[]) {
  return criterios.reduce((total, c) => total + c.peso, 0)
}

export function totalPuntos(preguntas: Pregunta[]) {
  return preguntas.reduce((total, p) => total + p.puntos, 0)
}

/* Paso 3 · visibilidad y equipo --------------------------------------------------------------- */

export type Portal = { value: string; label: string; texto: string; creditos?: number }

// Dónde se publica la vacante. Los portales con crédito descuentan del plan de la empresa; el propio no.
export const PORTALES: Portal[] = [
  { value: 'portal-propio', label: 'Portal de empleo de la empresa', texto: 'La página de vacantes de Meta Colombia. No consume créditos.' },
  { value: 'elempleo', label: 'elempleo', texto: 'El de mayor alcance en Colombia para cargos administrativos.', creditos: 1 },
  { value: 'computrabajo', label: 'Computrabajo', texto: 'Buen volumen en cargos operativos y comerciales.', creditos: 1 },
  { value: 'magneto', label: 'Magneto365', texto: 'Postulación rápida desde el celular.', creditos: 1 },
  { value: 'linkedin', label: 'LinkedIn Jobs', texto: 'Para perfiles profesionales y de tecnología.', creditos: 2 },
  { value: 'indeed', label: 'Indeed', texto: 'Alcance internacional; útil si la vacante es remota.', creditos: 2 },
]

export const PERSONAS = [
  'Laura Méndez · Reclutadora senior',
  'Andrés Pardo · Reclutador',
  'Sara Gómez · Líder de selección',
  'Camilo Ruiz · Business partner',
  'Daniela Ortiz · Analista de selección',
  'Mateo Herrera · Jefe comercial',
  'Valentina Silva · Jefa de operaciones',
]

export type Visibilidad = {
  portales: string[]
  reclutador: string
  equipo: string[]
  difusionInterna: boolean
  areasDifusion: string[]
  mensajeInterno: string
}

export const VISIBILIDAD_POR_DEFECTO: Visibilidad = {
  portales: ['portal-propio'],
  reclutador: '',
  equipo: [],
  difusionInterna: false,
  areasDifusion: [],
  mensajeInterno: 'Estamos buscando a alguien para este cargo. Si conoces a la persona indicada, compártele la vacante.',
}

// Créditos que descuenta del plan lo que esté marcado. Se muestra antes de crear, no después.
export function creditosDeLaPublicacion(portales: string[]) {
  return PORTALES.filter((p) => portales.includes(p.value)).reduce((total, p) => total + (p.creditos ?? 0), 0)
}

export function faltaEnPaso3(v: Visibilidad) {
  const falta: string[] = []
  if (!v.reclutador) falta.push('Reclutador responsable')
  if (!v.portales.length) falta.push('Dónde se publica')
  if (v.difusionInterna && !v.areasDifusion.length) falta.push('Áreas para la difusión interna')
  return falta
}

/* Estado completo del asistente ---------------------------------------------------------------- */

export type Borrador = {
  info: InfoBasica
  plantilla: string
  flujo: string[]
  rechazoAutomatico: boolean
  diasRechazo: number
  psicometricas: ConfigPsicometricas
  serena: ConfigSerena
  roleplay: ConfigRoleplay
  idiomas: ConfigIdiomas
  visibilidad: Visibilidad
}

export const BORRADOR_VACIO: Borrador = {
  info: INFO_VACIA,
  plantilla: 'estandar',
  flujo: FLUJO_INICIAL,
  rechazoAutomatico: true,
  diasRechazo: 15,
  psicometricas: PSICOMETRICAS_POR_DEFECTO,
  serena: SERENA_POR_DEFECTO,
  roleplay: ROLEPLAY_POR_DEFECTO,
  idiomas: IDIOMAS_POR_DEFECTO,
  visibilidad: VISIBILIDAD_POR_DEFECTO,
}

// «Siguiente» se habilita solo cuando el paso tiene lo obligatorio.
export function pasoValido(paso: number, b: Borrador) {
  if (paso === 1) return Boolean(b.info.nombre.trim() && b.info.descripcion.trim() && b.info.departamento && b.info.ciudad.trim())
  if (paso === 2) return b.flujo.length >= 2
  if (paso === 3) return faltaEnPaso3(b.visibilidad).length === 0
  return true
}

export const PASOS = [
  { label: 'Información básica', descripcion: 'Los datos con los que el candidato ve y encuentra la vacante.' },
  { label: 'Configurar vacante', descripcion: 'El orden de las etapas por las que pasa cada candidato.' },
  { label: 'Visibilidad', descripcion: 'Dónde se publica la vacante y quién la acompaña.' },
]

/* Resúmenes en vivo ------------------------------------------------------------------------------ */

function etiqueta(opciones: { value: string; label: string }[], valor: string) {
  return opciones.find((o) => o.value === valor)?.label ?? ''
}

export const MODALIDADES: Record<Modalidad, string> = {
  presencial: 'Presencial',
  hibrida: 'Híbrida',
  remota: 'Remota',
}

// Lo que va en el panel de resumen.
//
// Separa lo que la persona **decidió** de lo que sigue en su valor de fábrica. Antes salía todo mezclado y el panel
// mostraba seis filas llenas cuando todavía no se había escrito nada: parecía medio formulario resuelto. Ahora los
// valores por defecto no ocupan una fila cada uno; se resumen en una línea al final, que además dice cuáles revisar.
export function resumenDeLaVacante(info: InfoBasica) {
  const unidad = UNIDAD_SALARIO[info.moneda] ?? 'millones'
  const defecto = INFO_VACIA

  const todas: { termino: string; valor: string; elegido: boolean }[] = [
    { termino: 'Departamento', valor: etiqueta(DEPARTAMENTOS, info.departamento), elegido: Boolean(info.departamento) },
    {
      termino: 'Ubicación',
      valor: [info.ciudad.trim(), etiqueta(PAISES, info.pais)].filter(Boolean).join(', '),
      elegido: Boolean(info.ciudad.trim()) || info.pais !== defecto.pais,
    },
    { termino: 'Contrato', valor: etiqueta(CONTRATOS, info.contrato), elegido: info.contrato !== defecto.contrato },
    { termino: 'Experiencia', valor: etiqueta(EXPERIENCIA, info.experiencia), elegido: info.experiencia !== defecto.experiencia },
    { termino: 'Seniority', valor: etiqueta(SENIORITY, info.seniority), elegido: info.seniority !== defecto.seniority },
    { termino: 'Idioma', valor: etiqueta(IDIOMAS, info.idioma), elegido: info.idioma !== defecto.idioma },
    {
      termino: 'Salario',
      valor: `${info.salario[0]} – ${info.salario[1]} ${unidad} ${info.moneda.toUpperCase()}`,
      elegido: info.salario[0] !== defecto.salario[0] || info.salario[1] !== defecto.salario[1] || info.moneda !== defecto.moneda,
    },
  ]

  // Las opciones que solo existen si se encienden: si están, es porque alguien las encendió.
  if (info.equity) todas.push({ termino: 'Equity', valor: `hasta ${info.equityMax.toFixed(2)} %`, elegido: true })
  if (info.reubicacion) todas.push({ termino: 'Reubicación', valor: 'La empresa cubre el traslado', elegido: true })
  if (info.carpeta !== defecto.carpeta) todas.push({ termino: 'Carpeta', valor: etiqueta(CARPETAS, info.carpeta), elegido: true })

  const conValor = todas.filter((f) => f.valor)
  return {
    elegidas: conValor.filter((f) => f.elegido).map(({ termino, valor }) => ({ termino, valor })),
    porDefecto: conValor.filter((f) => !f.elegido).map((f) => f.termino.toLowerCase()),
  }
}

// Cuántos de los datos obligatorios del paso 1 ya están puestos. Sirve para la barra del panel.
export const OBLIGATORIOS_PASO1 = 4

// Lo que falta para poder continuar. Se lista con el nombre del campo tal como se ve en pantalla.
export function faltaEnPaso1(info: InfoBasica) {
  const falta: string[] = []
  if (!info.nombre.trim()) falta.push('Nombre de la vacante')
  if (!info.descripcion.trim()) falta.push('Descripción del cargo')
  if (!info.departamento) falta.push('Departamento')
  if (!info.ciudad.trim()) falta.push('Ciudad')
  return falta
}

// Cómo quedó configurada una etapa, en una línea. Se muestra en su fila del flujo para no tener que abrir el panel.
export function resumenDeEtapa(slug: string, b: Borrador): string | null {
  const etapa = buscarEtapa(slug)
  if (!etapa?.configura) return null

  if (etapa.configura === 'psicometricas') {
    const n = b.psicometricas.pruebas.length
    return `${n} ${plural(n, 'prueba', 'pruebas')} · ${minutosDePruebas(b.psicometricas.pruebas)} min · en ${etiqueta(IDIOMAS, b.psicometricas.idioma).toLowerCase()}`
  }

  if (etapa.configura === 'serena') {
    const n = b.serena.preguntas.length
    const canal = b.serena.canal === 'telefonico' ? 'por teléfono' : 'por videollamada'
    return `${n} ${plural(n, 'pregunta', 'preguntas')} · ${canal} · aprueba con ${b.serena.minimo}`
  }

  if (etapa.configura === 'roleplay') {
    return `${b.roleplay.agente} · ${b.roleplay.duracion} min · aprueba con ${b.roleplay.minimo}`
  }

  return `${etiqueta(IDIOMAS, b.idiomas.idioma)} · dificultad ${etiqueta(DIFICULTADES, b.idiomas.dificultad).toLowerCase()} · aprueba con ${b.idiomas.minimo}`
}
