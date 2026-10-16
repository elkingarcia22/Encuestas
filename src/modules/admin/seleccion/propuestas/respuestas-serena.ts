// Lo que cada persona respondió en la entrevista con Serena, cuando su ficha no lo trae escrito (CA-21). Antes todas
// decían la misma frase («Respondió con un ejemplo… explicó el resultado con cifras») y la lectura de la IA, al lado,
// decía otra cosa. Ahora el puntaje de cada pregunta elige la respuesta y la lectura, así que las dos hablan de lo mismo:
// una respuesta alta trae el caso y la cifra; una media, el caso sin el resultado; una baja, una idea general.
//
// No importa nada de los datos de la vacante: lo usan ellos para armar a cada persona.

export type Nivel = 'alta' | 'media' | 'baja'

export const nivelDe = (puntaje: number): Nivel => (puntaje >= 80 ? 'alta' : puntaje >= 65 ? 'media' : 'baja')

// Cuánto sacó cada pregunta: el puntaje de la entrevista con un desvío pequeño, para que no salgan todas iguales.
const DESVIO: Record<number, number[]> = { 1: [0], 2: [4, -4], 3: [5, -3, -2] }
export const puntajesPorPregunta = (puntaje: number, preguntas: number) =>
  Array.from({ length: preguntas }, (_, indice) => Math.min(100, puntaje + (DESVIO[preguntas]?.[indice] ?? 0)))

// La lectura de la IA de cada respuesta, por nivel y por pregunta (como las citas del producto).
export const LECTURAS: Record<Nivel, string[]> = {
  alta: [
    'Responde con un caso propio y lo cierra con una cifra de resultado.',
    'Explica qué hizo y por qué, sin rodeos; el ejemplo se puede verificar.',
    'Respuesta completa: el contexto, lo que hizo y el resultado en menos de dos minutos.',
  ],
  media: [
    'Buen ejemplo, aunque no llega a decir qué cambió gracias a lo que hizo.',
    'Entiende la pregunta y da un caso real, pero al final se queda en lo general.',
    'Resuelve bien la primera parte; la segunda la contesta con una idea, no con un hecho.',
  ],
  baja: [
    'Responde en general («uno hace…») sin un caso propio que lo respalde.',
    'Se desvía de la pregunta y no llega a un ejemplo concreto.',
    'Respuesta corta: menciona la herramienta, pero no cómo la usó.',
  ],
}

export const lecturaDe = (puntaje: number, indice: number) => LECTURAS[nivelDe(puntaje)][indice % 3]

// Las respuestas de las preguntas de las vacantes escritas a mano. Cada una se escribió para la lectura de su nivel y de
// su lugar en la entrevista (la primera pregunta lee «caso y cifra», la segunda «qué hizo y por qué», la tercera «el
// contexto, lo que hizo y el resultado»). `{empresa}` es donde trabaja hoy.
const RESPUESTAS: Record<string, Record<Nivel, string>> = {
  'Cuéntame de un tablero que hayas construido y qué decisión cambió.': {
    alta: 'En {empresa} armé el tablero de cartera: mostró que tres clientes tenían el 60 % de la mora y el comité les cambió las condiciones de crédito ese mismo mes.',
    media: 'En {empresa} armé el tablero de cartera por cliente, con la mora de cada semana. Lo revisaban en el comité de los lunes.',
    baja: 'Uno arma el tablero con lo que pide el área y lo va ajustando; así la gente toma mejores decisiones.',
  },
  '¿Cómo validas que un dato es confiable antes de presentarlo?': {
    alta: 'Lo cruzo con la fuente original y con el corte anterior: si la diferencia pasa del 2 %, no lo presento. Así encontré en {empresa} un doble conteo de ventas antes del cierre.',
    media: 'Una vez en {empresa} los totales no cuadraban con contabilidad y lo revisé con ellos. En general trato de revisar bien todo antes de presentarlo.',
    baja: 'Para mí lo más importante es que el tablero se vea claro y que la gente lo entienda rápido.',
  },
  '¿Qué reporte automatizarías primero en un equipo nuevo?': {
    alta: 'El cierre mensual. En {empresa} se hacía a mano en Excel y tomaba tres días; lo pasé a una consulta programada con una alerta si falta un dato, y ahora sale en dos horas.',
    media: 'El cierre mensual, porque es el que más tiempo toma. Lo pasaría a algo automático para que el equipo gane tiempo.',
    baja: 'Lo haría con Python.',
  },
  'Cuéntame de una decisión de diseño que cambiaste por lo que dijeron los usuarios.': {
    alta: 'En {empresa} quitamos un paso del registro porque en las pruebas cinco de ocho personas se perdían ahí; la conversión subió 9 %.',
    media: 'En {empresa} hicimos pruebas del registro y vimos que la gente se perdía en un paso, así que lo quitamos.',
    baja: 'Uno siempre tiene en cuenta lo que dicen los usuarios y ajusta los diseños cuando hay comentarios.',
  },
  '¿Cómo trabajas con ingeniería cuando el plazo no alcanza?': {
    alta: 'Recorto el alcance con ingeniería en la misma mesa, porque así se ve qué cuesta cada cosa. En {empresa} salió primero el pago con tarjeta y PSE quedó documentado para la entrega siguiente; llegamos a la fecha.',
    media: 'En {empresa} nos pasó con el pago en línea y lo hablamos con ingeniería. En general trato de entregar lo más importante primero.',
    baja: 'Creo que lo importante es la comunicación y que todos estén alineados con el objetivo.',
  },
  '¿Cómo manejas a un operario que llega tarde de forma repetida?': {
    alta: 'En {empresa} un operario llegaba tarde tres veces por semana. Hablé con él: dependía del primer bus. Lo pasé al turno de las 6 y en un mes no volvió a llegar tarde.',
    media: 'En {empresa} tuve un caso así: hablé con él para entender qué pasaba y le busqué otro horario.',
    baja: 'Uno tiene que hablar con la persona y aplicar el reglamento si sigue pasando.',
  },
  'Cuéntame de un incidente de seguridad y qué hiciste.': {
    alta: 'En {empresa} se soltó la guarda de una troqueladora: paré la línea, aislé la zona y lo reporté, porque nadie debía tocarla sin mantenimiento. Pasamos la revisión al inicio de cada turno y no se repitió en el año.',
    media: 'En {empresa} se soltó la guarda de una máquina y paré la línea. En general siempre pongo la seguridad primero.',
    baja: 'Para mí lo más importante es que la gente use los elementos de protección.',
  },
}

// Para una pregunta que no está escrita arriba: lo mismo por nivel, sin hablar de un tema en particular.
const DE_CUALQUIER_PREGUNTA: Record<Nivel, string> = {
  alta: 'Me pasó en {empresa}: lo resolví con el equipo en dos semanas y lo medimos; el indicador mejoró y se volvió la forma de trabajar.',
  media: 'Me pasó en {empresa} y lo resolví con el equipo. En general trato de hacerlo así.',
  baja: 'Uno trata de hacerlo lo mejor posible según lo que pida la situación.',
}

export const respuestaCitada = (pregunta: string, puntaje: number, empresa: string) =>
  (RESPUESTAS[pregunta] ?? DE_CUALQUIER_PREGUNTA)[nivelDe(puntaje)].replaceAll('{empresa}', empresa)

// Una respuesta escrita a mano en su versión sólida, recortada a su primera parte: el caso sin el resultado (nivel
// medio). Si la primera parte queda muy corta, se deja la primera frase.
export function sinResultado(respuesta: string) {
  const corte = respuesta.search(/[:;]/)
  if (corte >= 30) return `${respuesta.slice(0, corte)}.`
  const frase = respuesta.search(/\. /)
  return frase > 0 ? respuesta.slice(0, frase + 1) : respuesta
}
