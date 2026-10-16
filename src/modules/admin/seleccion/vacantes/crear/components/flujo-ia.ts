import { CATALOGO, etapaDelCatalogo, preguntaNueva, pruebaNueva, type EtapaFlujo, type Pregunta, type Prueba } from './etapas'

// El flujo que propone «Crear con IA»: el recomendado de la plataforma más las etapas con IA que
// pide el cargo, y todas llegan ya configuradas (preguntas de Serena, pruebas, agentes con su
// prompt) para que la vacante quede lista sin abrir cada panel. Se revisan y se cambian después.

export type Contexto = {
  cargo: string
  area: string
  conIngles: boolean
  // Cargos de cara al cliente: se ensaya una conversación real con un role play.
  conRolePlay: boolean
  // Nivel alto (senior en adelante): la prueba de idiomas sube de dificultad.
  exigente: boolean
}

export function flujoPropuesto(contexto: Contexto): EtapaFlujo[] {
  const ids = [
    'evaluacion-cv',
    'psicometrico',
    contexto.conIngles ? 'idiomas' : null,
    contexto.conRolePlay ? 'role-play' : null,
    'serena',
    'entrevista-lider',
    'antecedentes',
    'oferta',
  ].filter((id): id is string => id !== null)

  return ids.flatMap((id) => {
    const catalogo = CATALOGO.find((etapa) => etapa.id === id)
    return catalogo ? [configurar(etapaDelCatalogo(catalogo), contexto)] : []
  })
}

export function configurar(etapa: EtapaFlujo, contexto: Contexto): EtapaFlujo {
  if (etapa.pruebas) return { ...etapa, pruebas: pruebasPara(contexto) }
  if (etapa.entrevista) return { ...etapa, entrevista: { ...etapa.entrevista, preguntas: preguntasPara(contexto) } }
  if (etapa.agente && etapa.configuracion === 'idiomas') {
    return {
      ...etapa,
      agente: {
        ...etapa.agente,
        nombre: 'Evaluador de inglés conversacional',
        descripcion: `Conversa en inglés sobre el día a día de ${contexto.cargo} para medir su nivel real.`,
        prompt: `Eres un evaluador de inglés. Conversa de forma natural con la persona candidata al cargo de ${contexto.cargo}: preséntate, pregúntale por su experiencia en ${contexto.area} y por una situación difícil que haya resuelto. Sube la dificultad si responde con soltura y baja el ritmo si se traba.`,
        dificultad: contexto.exigente ? 'Avanzado' : 'Intermedio',
      },
    }
  }
  if (etapa.agente && etapa.configuracion === 'roleplay') {
    return {
      ...etapa,
      agente: {
        ...etapa.agente,
        nombre: `Cliente exigente para ${contexto.cargo}`,
        descripcion: 'Hace de cliente con dudas y objeciones para ver cómo el candidato lleva la conversación hasta el cierre.',
        prompt: `Eres un cliente potencial interesado pero escéptico. La persona candidata al cargo de ${contexto.cargo} intenta venderte. Plantea dudas de precio y de tiempos de entrega, pide comparaciones con la competencia y no aceptes la primera respuesta.`,
        dificultad: contexto.exigente ? 'Difícil' : 'Intermedio',
      },
    }
  }
  return etapa
}

// Dos pruebas: el razonamiento, que sirve para cualquier cargo, y la que mejor lee el área.
const PRUEBA_POR_AREA: Record<string, string> = {
  Ventas: 'Estilo social',
  Marketing: 'Perfil de motivación',
  Diseño: 'Dominancia cerebral',
  Producto: 'Dominancia cerebral',
  'Recursos Humanos': 'Estilo social',
}

function pruebasPara({ area }: Contexto): Prueba[] {
  return [
    { ...pruebaNueva(), tipo: 'Cognición (inteligencia)', idioma: 'Español', puntajeMinimo: 60 },
    { ...pruebaNueva(), tipo: PRUEBA_POR_AREA[area] ?? 'Personalidad 16', idioma: 'Español', puntajeMinimo: 50 },
  ]
}

// Cinco preguntas de 20 puntos: las dos primeras hablan del cargo y el área; el resto mide cómo trabaja.
function preguntasPara({ cargo, area }: Contexto): Pregunta[] {
  const preguntas: Array<Omit<Pregunta, 'id'>> = [
    {
      objetivo: `Conocer su experiencia real en tareas de ${cargo}.`,
      texto: `Cuéntame de un proyecto como ${cargo} del que te sientas orgulloso. ¿Qué parte fue tuya y cómo mediste el resultado?`,
      puntos: 20,
    },
    {
      objetivo: `Ver qué sabe del trabajo del equipo de ${area}.`,
      texto: `¿Qué crees que es lo más difícil de trabajar en ${area} y cómo lo has resuelto antes?`,
      puntos: 20,
    },
    {
      objetivo: 'Entender cómo prioriza y hace seguimiento cuando tiene varias cosas encima.',
      texto: 'Cuando manejas varias tareas a la vez, ¿cómo decides qué atender primero y cómo te aseguras de que todo avance?',
      puntos: 20,
    },
    {
      objetivo: 'Medir cómo se comunica y coordina con otras personas del equipo.',
      texto: 'Descríbeme una ocasión en la que tuviste que ponerte de acuerdo con alguien para sacar algo adelante.',
      puntos: 20,
    },
    {
      objetivo: 'Conocer qué le interesa del cargo y qué cree que puede aportar.',
      texto: '¿Qué te motiva de esta oportunidad y qué crees que puedes aportar desde el primer mes?',
      puntos: 20,
    },
  ]
  return preguntas.map((pregunta) => ({ ...preguntaNueva(), ...pregunta }))
}
