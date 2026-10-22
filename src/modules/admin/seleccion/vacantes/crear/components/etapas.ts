// Paso 3: las etapas por las que pasa el candidato. Unas son manuales (las hace una persona del
// equipo) y otras las lleva la IA, y esas últimas son las que traen configuración propia.

export type TipoConfiguracion = 'ninguna' | 'cv' | 'pruebas' | 'idiomas' | 'roleplay' | 'entrevista'

export type EtapaCatalogo = {
  id: string
  nombre: string
  categoria: string
  conIa: boolean
  configuracion: TipoConfiguracion
  // La creó el equipo desde «Crear etapa»: va al comienzo de la biblioteca, marcada.
  propia?: boolean
}

export type Prueba = { id: string; tipo: string; idioma: string; puntajeMinimo: number }
export type Criterio = { id: string; nombre: string; descripcion: string; peso: number }
export type Pregunta = { id: string; objetivo: string; texto: string; puntos: number }

export type AjustesCv = { porcentajeRango: number; puntajeMinimo: number; exEmpleados: boolean }

export type AjustesAgente = {
  nombre: string
  descripcion: string
  prompt: string
  idioma: string
  duracion: string
  dificultad: string
  voz: string
  criterios: Criterio[]
  diasExpira: number
  puntajeMinimo: number
}

export type AjustesEntrevista = {
  preguntas: Pregunta[]
  modalidad: 'telefonica' | 'virtual'
  voz: string
  diasExpira: number
  puntajeMinimo: number
}

// Una etapa ya puesta en el flujo. Solo lleva los ajustes de su tipo: la fábrica de abajo se
// encarga de que la etapa nazca con los que le tocan.
export type EtapaFlujo = EtapaCatalogo & {
  clave: string
  cv?: AjustesCv
  pruebas?: Prueba[]
  agente?: AjustesAgente
  entrevista?: AjustesEntrevista
}

export const LIMITE_PUNTOS = 100
export const LIMITE_PROMPT = 2000
export const LIMITE_OBJETIVO = 300
export const LIMITE_PREGUNTA = 500

export const CATEGORIAS = [
  'Filtro inicial',
  'Entrevista con liderazgo',
  'Prueba técnica',
  'Antecedentes judiciales',
  'Contratación',
  'Oferta',
]

export const CATALOGO: EtapaCatalogo[] = [
  { id: 'hoja-de-vida', nombre: 'Revisión de CV', categoria: 'Filtro inicial', conIa: false, configuracion: 'ninguna' },
  { id: 'entrevista-rrhh', nombre: 'Entrevista con Recursos Humanos', categoria: 'Filtro inicial', conIa: false, configuracion: 'ninguna' },
  { id: 'entrevista-lider', nombre: 'Entrevista con el líder del área', categoria: 'Entrevista con liderazgo', conIa: false, configuracion: 'ninguna' },
  { id: 'prueba-tecnica', nombre: 'Prueba técnica', categoria: 'Prueba técnica', conIa: false, configuracion: 'ninguna' },
  { id: 'referencias', nombre: 'Referencias laborales', categoria: 'Contratación', conIa: false, configuracion: 'ninguna' },
  { id: 'oferta', nombre: 'Oferta económica', categoria: 'Oferta', conIa: false, configuracion: 'ninguna' },
  { id: 'contrato', nombre: 'Firma del contrato', categoria: 'Contratación', conIa: false, configuracion: 'ninguna' },
  { id: 'evaluacion-cv', nombre: 'Evaluación de CV', categoria: 'Filtro inicial', conIa: true, configuracion: 'cv' },
  { id: 'psicometrico', nombre: 'Pruebas psicotécnicas', categoria: 'Filtro inicial', conIa: true, configuracion: 'pruebas' },
  { id: 'idiomas', nombre: 'Prueba de idiomas', categoria: 'Filtro inicial', conIa: true, configuracion: 'idiomas' },
  { id: 'role-play', nombre: 'Role play', categoria: 'Prueba técnica', conIa: true, configuracion: 'roleplay' },
  { id: 'serena', nombre: 'Entrevista con Serena AI', categoria: 'Filtro inicial', conIa: true, configuracion: 'entrevista' },
  { id: 'antecedentes', nombre: 'Antecedentes judiciales', categoria: 'Antecedentes judiciales', conIa: true, configuracion: 'ninguna' },
]

// El flujo con el que arranca una cuenta en la plataforma (docs/plataforma-ubits/06-marco-d-reclutamiento.md):
// filtro de CV, entrevista con Serena, revisión humana, antecedentes y oferta. Sirve para no empezar de cero.
export const FLUJO_RECOMENDADO = ['evaluacion-cv', 'serena', 'entrevista-lider', 'antecedentes', 'oferta']

// Cada prueba con una línea que dice qué mide, para elegir con contexto.
export const TIPOS_PRUEBA = [
  { valor: 'Cognición (inteligencia)', detalle: 'Razonamiento lógico, verbal y numérico para resolver problemas.' },
  { valor: 'Perfil de motivación', detalle: 'Qué lo impulsa en el trabajo y qué lo desanima.' },
  { valor: 'Dominancia cerebral', detalle: 'Cómo piensa y decide: analítico, práctico, relacional o creativo.' },
  { valor: 'Estilo social', detalle: 'Cómo se relaciona y se comunica con los demás.' },
  {
    valor: 'Inventario de valores organizacionales (corta)',
    detalle: 'Qué tanto encajan sus valores con los de la empresa. Versión corta.',
  },
  { valor: 'Personalidad 16', detalle: 'Sus rasgos de personalidad en 16 factores, como estabilidad o apertura.' },
]

export const IDIOMAS_PRUEBA = ['Español', 'Portugués']

export const IDIOMAS_AGENTE = ['Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano']

export const DURACIONES = ['5 min', '10 min', '15 min', '20 min', '30 min']

// Cada nivel con una línea que dice cómo se comporta el agente, para elegir con contexto.
export type Dificultad = { valor: string; detalle: string }

export const DIFICULTADES_IDIOMA: Dificultad[] = [
  { valor: 'Básico', detalle: 'Frases simples sobre temas cotidianos; el agente habla despacio.' },
  { valor: 'Intermedio', detalle: 'Conversación sobre su trabajo y experiencia, con preguntas abiertas.' },
  { valor: 'Avanzado', detalle: 'Temas complejos, vocabulario técnico y ritmo de hablante nativo.' },
]

export const DIFICULTADES_ROLEPLAY: Dificultad[] = [
  { valor: 'Fácil', detalle: 'El personaje coopera y acepta los argumentos sin mucha resistencia.' },
  { valor: 'Intermedio', detalle: 'Plantea dudas y alguna objeción, pero se deja convencer.' },
  { valor: 'Difícil', detalle: 'Objeta seguido, compara con la competencia y pide pruebas.' },
  { valor: 'Experto', detalle: 'Escéptico y con poco tiempo: hay que ganárselo en cada respuesta.' },
]

export const VOCES = [
  { id: 'valentina', nombre: 'Valentina', etiqueta: 'Mujer', tono: 'Natural' },
  { id: 'mateo', nombre: 'Mateo', etiqueta: 'Hombre', tono: 'Informativo' },
  { id: 'santiago', nombre: 'Santiago', etiqueta: 'Hombre', tono: 'Expresivo' },
  { id: 'isabela', nombre: 'Isabela', etiqueta: 'Mujer', tono: 'Firme' },
  { id: 'sebastian', nombre: 'Sebastián', etiqueta: 'Hombre', tono: 'Animado' },
]

// Serena habla con el acento del país de la vacante, no con una voz de personaje.
export const VOCES_SERENA = [
  { id: 'colombia', nombre: 'Colombia', etiqueta: 'Español', tono: 'Cercana', bandera: '🇨🇴' },
  { id: 'mexico', nombre: 'México', etiqueta: 'Español', tono: 'Cercana', bandera: '🇲🇽' },
  { id: 'espana', nombre: 'España', etiqueta: 'Español', tono: 'Neutra', bandera: '🇪🇸' },
  { id: 'argentina', nombre: 'Argentina', etiqueta: 'Español', tono: 'Cercana', bandera: '🇦🇷' },
  { id: 'brasil', nombre: 'Brasil', etiqueta: 'Portugués', tono: 'Cercana', bandera: '🇧🇷' },
]

const CRITERIOS_IDIOMAS: Criterio[] = [
  { id: 'fluidez', nombre: 'Fluidez', descripcion: 'Habla de corrido, sin pausas largas ni tropiezos para armar las frases.', peso: 20 },
  { id: 'vocabulario', nombre: 'Vocabulario', descripcion: 'Variedad y precisión de las palabras, y si repite siempre las mismas.', peso: 20 },
  { id: 'gramatica', nombre: 'Gramática', descripcion: 'Concordancia, tiempos verbales y construcción de las oraciones.', peso: 20 },
  { id: 'pronunciacion', nombre: 'Pronunciación', descripcion: 'Claridad al pronunciar y qué tan fácil es entenderle.', peso: 20 },
  { id: 'comprension', nombre: 'Comprensión auditiva', descripcion: 'Entiende las preguntas a la primera, sin pedir que se las repitan.', peso: 20 },
]

const CRITERIOS_ROLEPLAY: Criterio[] = [
  { id: 'objeciones', nombre: 'Manejo de objeciones', descripcion: 'Responde a dudas y rechazos sin perder el hilo de la conversación.', peso: 20 },
  { id: 'persuasion', nombre: 'Persuasión', descripcion: 'Convence con argumentos y con datos, no solo con entusiasmo.', peso: 20 },
  { id: 'escucha', nombre: 'Escucha empática', descripcion: 'Entiende de verdad lo que necesita el otro antes de responder.', peso: 20 },
  { id: 'control', nombre: 'Control del proceso', descripcion: 'Lleva la conversación de forma ordenada hacia un cierre.', peso: 20 },
  { id: 'adaptabilidad', nombre: 'Adaptabilidad', descripcion: 'Ajusta lo que dice según el perfil y las reacciones del otro.', peso: 20 },
]

export function criteriosDe(configuracion: TipoConfiguracion) {
  return configuracion === 'roleplay' ? CRITERIOS_ROLEPLAY : CRITERIOS_IDIOMAS
}

export function dificultadesDe(configuracion: TipoConfiguracion) {
  return configuracion === 'roleplay' ? DIFICULTADES_ROLEPLAY : DIFICULTADES_IDIOMA
}

const identificador = () => Math.random().toString(36).slice(2, 9)

export const pruebaNueva = (): Prueba => ({ id: identificador(), tipo: '', idioma: '', puntajeMinimo: 0 })

export const preguntaNueva = (): Pregunta => ({ id: identificador(), objetivo: '', texto: '', puntos: 0 })

// Al sacar una etapa de la biblioteca nace con sus ajustes por defecto, para que el panel de
// configuración siempre abra con algo sensato y no en blanco.
export function etapaDelCatalogo(catalogo: EtapaCatalogo): EtapaFlujo {
  const base = { ...catalogo, clave: `${catalogo.id}-${identificador()}` }

  if (catalogo.configuracion === 'cv') {
    return { ...base, cv: { porcentajeRango: 25, puntajeMinimo: 70, exEmpleados: true } }
  }
  if (catalogo.configuracion === 'pruebas') {
    return { ...base, pruebas: [] }
  }
  if (catalogo.configuracion === 'entrevista') {
    return { ...base, entrevista: { preguntas: [], modalidad: 'virtual', voz: 'colombia', diasExpira: 5, puntajeMinimo: 70 } }
  }
  if (catalogo.configuracion === 'idiomas' || catalogo.configuracion === 'roleplay') {
    return {
      ...base,
      agente: {
        nombre: '',
        descripcion: '',
        prompt: '',
        idioma: 'Inglés',
        duracion: '10 min',
        dificultad: 'Intermedio',
        voz: 'valentina',
        criterios: criteriosDe(catalogo.configuracion),
        diasExpira: 30,
        puntajeMinimo: 70,
      },
    }
  }
  return base
}

// Etapa inventada por el equipo desde el diálogo «Crear etapa»: siempre manual y sin ajustes.
export function etapaPropia(nombre: string, categoria: string): EtapaCatalogo {
  return { id: `propia-${identificador()}`, nombre, categoria, conIa: false, configuracion: 'ninguna', propia: true }
}

export const sumaPuntos = (valores: number[]) => valores.reduce((total, valor) => total + valor, 0)

// Lo que le falta a una etapa con configuración para poder publicar la vacante; null si ya está lista.
// La evaluación de CV nace con sus ajustes y las manuales no se configuran: nunca quedan pendientes.
export function pendienteEtapa(etapa: EtapaFlujo): string | null {
  if (etapa.pruebas) return etapa.pruebas.length === 0 ? 'Agrega al menos una prueba' : null
  if (etapa.entrevista) {
    const { preguntas } = etapa.entrevista
    if (preguntas.length === 0) return 'Agrega las preguntas de la entrevista'
    const total = sumaPuntos(preguntas.map((pregunta) => pregunta.puntos))
    return total === LIMITE_PUNTOS ? null : `Las preguntas suman ${total} de ${LIMITE_PUNTOS} pts`
  }
  if (etapa.agente) {
    if (!etapa.agente.nombre.trim() || !etapa.agente.prompt.trim()) return 'Falta el nombre y el prompt del agente'
    const total = sumaPuntos(etapa.agente.criterios.map((criterio) => criterio.peso))
    return total === LIMITE_PUNTOS ? null : `Los criterios suman ${total} % de 100 %`
  }
  return null
}

// Resumen que se lee en la tarjeta de la etapa sin tener que abrir su panel.
export function resumenEtapa(etapa: EtapaFlujo): string | null {
  if (etapa.pruebas) {
    return etapa.pruebas.length === 0 ? 'Sin pruebas' : `${etapa.pruebas.length} ${etapa.pruebas.length === 1 ? 'prueba' : 'pruebas'}`
  }
  if (etapa.entrevista) {
    const total = etapa.entrevista.preguntas.length
    return total === 0 ? 'Sin preguntas' : `${total} ${total === 1 ? 'pregunta' : 'preguntas'} · ${sumaPuntos(etapa.entrevista.preguntas.map((p) => p.puntos))} pts`
  }
  if (etapa.agente) {
    return etapa.agente.nombre.trim() || 'Sin configurar'
  }
  if (etapa.cv) {
    return `Mínimo ${etapa.cv.puntajeMinimo} pts`
  }
  return null
}
