import { useEffect, useRef, type RefObject } from 'react'

// Foco del teclado en el agente contextual (panel del editor y casos del design system).
// Al abrir, cerrar o deshacer, el botón que tenía el foco desaparece (la X, «Orbit Flow», la fila «Deshacer») y el foco
// se iría al inicio de la página. Estas ayudas lo llevan a donde sigue el trabajo. Si la persona usó otro control
// que sigue en pantalla (una pestaña, «Preguntar» en un dato), el foco se queda donde estaba.

const focusLost = () => {
  const active = document.activeElement
  return !active || active === document.body || !active.isConnected
}

// Panel abierto: el foco pasa al panel (anuncia «Agente contextual»). Cerrado o minimizado: al botón para reabrirlo.
export function useAgentPanelFocus(scope: RefObject<HTMLElement | null>, state: string) {
  const previous = useRef(state)
  useEffect(() => {
    if (previous.current === state) return
    previous.current = state
    if (!focusLost()) return
    scope.current?.querySelector<HTMLElement>(state === 'open' ? '[data-agent-panel]' : '[data-agent-reopen]')?.focus()
  }, [scope, state])
}

// Llamar al pulsar un botón que desaparece o se desactiva («Deshacer», «Aceptar todo»): el foco vuelve a la acción
// marcada con `data-undo-focus` más cercana (la que hizo el cambio) o, si no hay, al panel.
export function keepFocusNear(from: HTMLElement) {
  const ancestors: HTMLElement[] = []
  for (let node = from.parentElement; node; node = node.parentElement) {
    ancestors.push(node)
    if (node.hasAttribute('data-agent-panel')) break
  }
  window.requestAnimationFrame(() => {
    if (!focusLost()) return
    for (const node of ancestors) {
      if (!node.isConnected) continue
      const target = node.querySelector<HTMLElement>('[data-undo-focus]:not(:disabled)') ?? (node.hasAttribute('data-agent-panel') ? node : null)
      if (target) {
        target.focus()
        return
      }
    }
  })
}
