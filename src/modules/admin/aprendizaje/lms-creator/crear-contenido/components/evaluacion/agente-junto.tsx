import { createContext, useCallback, useContext, useState } from 'react'
import type { PedidoGeneracion } from './agente-evaluaciones'

// El Agente de evaluaciones se abre junto a la hoja «Editar página», no dentro de ella: un panel dentro de otro panel es
// un panel anidado, y la librería apaga el contenido del de atrás (quedaba un rectángulo gris). La hoja monta el agente a
// su lado (fuera de su árbol) y el editor de la evaluación lo pide con `useAbrirAgenteEvaluaciones`.

export type PedidoAgente = { paginaId: string; onGenerar: (pedido: PedidoGeneracion) => void }

const Contexto = createContext<((pedido: PedidoAgente) => void) | null>(null)

export const ProveedorAgenteEvaluaciones = Contexto.Provider

/** Lo usa el editor de la evaluación para abrir el agente al lado de la hoja. */
export function useAbrirAgenteEvaluaciones() {
  return useContext(Contexto)
}

/** El estado del agente en la hoja: qué página lo pidió, si está abierto y la sesión (cada apertura reinicia el hilo). */
export function useAgenteJunto() {
  const [pedido, setPedido] = useState<PedidoAgente | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [sesion, setSesion] = useState(0)
  const abrir = useCallback((siguiente: PedidoAgente) => {
    setPedido(siguiente)
    setSesion((s) => s + 1)
    setAbierto(true)
  }, [])
  return { pedido, abierto, sesion, abrir, setAbierto }
}
