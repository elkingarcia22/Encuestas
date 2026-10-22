import { type ReactNode } from 'react'
import type { PageWidth } from '@/shared/components/page-width'

import { EMPRESAS } from '../home-operativo/components/data'
import { Contexto, type MarcoAdmin } from './contexto'
import { MarcoPlantilla, type Miga } from './marco-plantilla'

// Marco de las plantillas del administrador que llevan los patrones a pantallas reales (Gestión de usuarios,
// Planes de formación y Encuestas). La barra lateral, la barra superior y el pie son los del design system
// (sección «plantilla-admin» de nav-config); aquí queda el contexto que usan las pantallas: la empresa. La IA de
// cada pantalla es el agente contextual en el panel de la derecha («Orbit»), nunca un salto a Suite AI.

export function MarcoAdmin({ migas, ancho, children }: { migas: Miga[]; ancho?: PageWidth; children: ReactNode }) {
  const valor: MarcoAdmin = {
    empresa: EMPRESAS[0],
  }

  return (
    <Contexto.Provider value={valor}>
      <MarcoPlantilla migas={migas} ancho={ancho}>
        {children}
      </MarcoPlantilla>
    </Contexto.Provider>
  )
}
