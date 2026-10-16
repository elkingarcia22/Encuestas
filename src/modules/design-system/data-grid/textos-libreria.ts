import { useEffect } from 'react'

// Textos en inglés que la tabla de la librería trae fijos en sus menús y que no se pueden pasar por `labels`
// (reui/data-grid vendorizado en flux-ui 0.5.5, anterior al i18n de ReUI; ver /design-system/componentes/dev):
// el menú de cada columna («Asc», «Desc», «Pin to left»…) y el de «Personalizar columnas» («Toggle Columns»).
// Mientras la librería no los traiga en español, se cambian en pantalla al abrir el menú: se vigila solo cuando
// hay una TablaDatos montada y solo dentro de los menús desplegables. Cuando la librería los traduzca, se borra.

const TRADUCCIONES: Record<string, string> = {
  'Toggle Columns': 'Columnas visibles',
  Columns: 'Columnas',
  Asc: 'Ascendente',
  Desc: 'Descendente',
  'Pin to left': 'Fijar a la izquierda',
  'Pin to right': 'Fijar a la derecha',
  'Move to Left': 'Mover a la izquierda',
  'Move to Right': 'Mover a la derecha',
}

const MENU = '[data-slot="dropdown-menu-content"]'

function traducirEn(raiz: Element) {
  const menus = raiz.matches(MENU) ? [raiz] : [...raiz.querySelectorAll(MENU)]
  for (const menu of menus) {
    const recorrido = document.createTreeWalker(menu, NodeFilter.SHOW_TEXT)
    for (let nodo = recorrido.nextNode(); nodo; nodo = recorrido.nextNode()) {
      const traduccion = TRADUCCIONES[nodo.nodeValue?.trim() ?? '']
      if (traduccion) nodo.nodeValue = traduccion
    }
  }
}

let usos = 0
let observador: MutationObserver | null = null

export function useTextosDeLaLibreria() {
  useEffect(() => {
    usos += 1
    if (!observador) {
      observador = new MutationObserver((cambios) => {
        for (const cambio of cambios) for (const nodo of cambio.addedNodes) if (nodo instanceof Element) traducirEn(nodo)
      })
      observador.observe(document.body, { childList: true, subtree: true })
    }
    return () => {
      usos -= 1
      if (!usos) {
        observador?.disconnect()
        observador = null
      }
    }
  }, [])
}
