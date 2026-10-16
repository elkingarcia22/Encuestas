import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

// Los PDF se imprimen, no se generan: el documento se dibuja con los mismos componentes de la
// pantalla dentro de un marco oculto de esta misma página, y el «Guardar como PDF» del diálogo de
// impresión es la descarga. Un marco y no una ventana nueva a propósito: el bloqueador de ventanas
// puede comerse una pestaña en silencio, y un reporte que a veces no aparece parece un botón roto.
// Idea tomada del prototipo, que hacía lo mismo con HTML suelto.

// La hoja se lee en papel: tamaño A4, márgenes de impresión y los fondos de las insignias impresos
// (sin esto el navegador los quita y la escala de colores desaparece).
const HOJA = `
@page { size: A4; margin: 12mm 12mm 14mm; }
html, body { background: var(--background); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; }
`

// Espera a que el documento se asiente antes de congelarlo en el diálogo: fuentes y primer pintado.
const ESPERA_MS = 450
// Respaldo: algunos navegadores nunca avisan que terminó la impresión dentro de un marco.
const LIMPIEZA_MS = 120_000

/** Imprime `documento` en un marco oculto. Devuelve `false` si el navegador no dejó crear el marco. */
export function imprimir(documento: ReactNode, titulo: string): boolean {
  const marco = document.createElement('iframe')
  marco.setAttribute('aria-hidden', 'true')
  marco.tabIndex = -1
  // Del ancho de una hoja: así el reporte se acomoda como en el papel y no a cero píxeles.
  marco.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;visibility:hidden;'
  document.body.appendChild(marco)

  const doc = marco.contentDocument
  const ventana = marco.contentWindow
  if (!doc || !ventana) {
    marco.remove()
    return false
  }

  doc.open()
  doc.write('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /></head><body></body></html>')
  doc.close()
  doc.title = titulo

  // Los mismos estilos de la aplicación, para que cada componente se vea igual que en pantalla.
  // El tema se fuerza a claro: un reporte impreso en modo oscuro gasta una hoja de tinta.
  for (const nodo of document.head.querySelectorAll('style, link[rel="stylesheet"]')) doc.head.appendChild(nodo.cloneNode(true))
  const hoja = doc.createElement('style')
  hoja.textContent = HOJA
  doc.head.appendChild(hoja)
  for (const atributo of document.documentElement.attributes) doc.documentElement.setAttribute(atributo.name, atributo.value)
  doc.documentElement.classList.remove('dark')
  if (doc.documentElement.hasAttribute('data-mode')) doc.documentElement.setAttribute('data-mode', 'light')

  const contenedor = doc.createElement('div')
  doc.body.appendChild(contenedor)
  const raiz = createRoot(contenedor)
  raiz.render(documento)

  const limpiar = () => {
    raiz.unmount()
    marco.remove()
  }
  ventana.addEventListener('afterprint', () => setTimeout(limpiar, 500), { once: true })
  const respaldo = setTimeout(limpiar, LIMPIEZA_MS)
  ventana.addEventListener('unload', () => clearTimeout(respaldo), { once: true })

  setTimeout(async () => {
    await doc.fonts?.ready
    ventana.focus()
    ventana.print()
  }, ESPERA_MS)
  return true
}
