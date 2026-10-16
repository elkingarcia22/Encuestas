import { useEffect, useRef } from 'react'

// Temporizadores que se limpian solos al salir de la pantalla: simulan esperas (subidas, procesos
// masivos, la IA trabajando). Los usan Procesos largos y los templates del administrador.

export function useTemporizadores() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((id) => window.clearTimeout(id)), [])
  return (fn: () => void, ms: number) => {
    ids.current.push(window.setTimeout(fn, ms))
  }
}
