import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

import { PLANES_INICIALES, type Plan } from './datos'

// Los planes viven en el layout: lo que se guarda, duplica o elimina se ve al volver a la lista.

export const PlanesContexto = createContext<{ planes: Plan[]; setPlanes: Dispatch<SetStateAction<Plan[]>> }>({
  planes: PLANES_INICIALES,
  setPlanes: () => undefined,
})

export const usePlanes = () => useContext(PlanesContexto)
