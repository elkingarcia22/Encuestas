import type { IconSvgElement } from '@hugeicons/react'
import { AlertDiamondIcon, Clock01Icon, Wrench01Icon } from '@hugeicons/core-free-icons'

// Los grupos del tablero «Lo que necesita tu atención» de Selección: el inicio de Vacantes y Créditos (5 oct). Son los
// mismos tres del «Panel de riesgos» que Elkin armó en Encuestas —Críticas, Necesitan atención y Acción manual— más un
// cuarto con lo que propone la IA. Cada pantalla decide qué asunto va en cuál (`exploraciones/uno/inicio/atencion.ts`,
// `creditos/uno/components/atencion.ts`).

export type Grupo = 'critico' | 'atencion' | 'manual' | 'ia'

export type InfoGrupo = {
  grupo: Grupo
  titulo: string
  // El de la IA no lleva icono: lleva el orbe.
  icono?: IconSvgElement
  tono: string
  // Qué hay en la columna, en una línea.
  corto: string
  vacio: string
}

export const GRUPOS: InfoGrupo[] = [
  { grupo: 'critico', titulo: 'Críticas', icono: AlertDiamondIcon, tono: 'text-destructive', corto: 'Se pierden si nadie actúa hoy', vacio: 'Nada crítico por ahora' },
  { grupo: 'atencion', titulo: 'Necesitan atención', icono: Clock01Icon, tono: 'text-warning', corto: 'Conviene revisarlas pronto', vacio: 'Todo va a buen ritmo' },
  { grupo: 'manual', titulo: 'Acción manual', icono: Wrench01Icon, tono: 'text-primary', corto: 'Pasos que haces tú', vacio: 'No hay pasos pendientes' },
  { grupo: 'ia', titulo: 'Sugerencias de la IA', tono: 'text-primary', corto: 'Lo que propone el agente', vacio: 'Sin sugerencias por ahora' },
]

export const grupoDe = (grupo: Grupo) => GRUPOS.find((uno) => uno.grupo === grupo) ?? GRUPOS[0]
