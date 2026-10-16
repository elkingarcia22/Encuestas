import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

import { ENCUESTAS_INICIALES, type Encuesta } from './datos'

// Las encuestas y si ya se cargaron los datos demográficos viven en el layout del template.

export const EncuestasContexto = createContext<{
  encuestas: Encuesta[]
  setEncuestas: Dispatch<SetStateAction<Encuesta[]>>
  demograficos: boolean
  setDemograficos: (listo: boolean) => void
}>({ encuestas: ENCUESTAS_INICIALES, setEncuestas: () => undefined, demograficos: false, setDemograficos: () => undefined })

export const useEncuestas = () => useContext(EncuestasContexto)
