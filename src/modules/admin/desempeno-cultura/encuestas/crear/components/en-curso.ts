import { createContext, useContext } from 'react'

// Una encuesta en curso ya tiene respuestas: cambiar sus preguntas, su visibilidad o sus datos demográficos movería
// lo que ya se respondió y los resultados que salen de ahí. Se siguen viendo, apagados, y cada control lo explica.
export const MOTIVO_EN_CURSO = 'No se puede cambiar mientras la encuesta está en curso: afectaría sus resultados y las respuestas que ya tiene.'

// Una plantilla NOM-035 trae el cuestionario oficial de la norma: sus secciones y preguntas se revisan, pero no se
// cambian, para que la encuesta siga cumpliendo la guía de referencia (Elkin, 14-oct).
export const MOTIVO_NORMATIVA = 'Viene de la NOM-035: sus secciones y preguntas son las oficiales y no se cambian, para que la encuesta siga cumpliendo la norma.'

/** El motivo que dicen los controles apagados del paso: en curso por defecto; el paso de secciones lo cambia si es normativa. */
export const MotivoBloqueo = createContext(MOTIVO_EN_CURSO)
export const useMotivoBloqueo = () => useContext(MotivoBloqueo)
