import { createContext, useContext } from 'react'

import { EMPRESAS, type Empresa } from '../home-operativo/components/data'

// Lo que el marco de los templates del administrador ofrece a sus pantallas: la empresa elegida. La IA de una
// pantalla no pasa por aquí: es el agente contextual, que se abre en el panel de la derecha con «Orbit Flow».

export type MarcoAdmin = { empresa: Empresa }

export const Contexto = createContext<MarcoAdmin>({ empresa: EMPRESAS[0] })

export const useMarcoAdmin = () => useContext(Contexto)
