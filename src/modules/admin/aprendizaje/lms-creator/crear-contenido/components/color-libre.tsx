import { useLayoutEffect, useState, type CSSProperties } from 'react'
import { Field, FieldDescription, FieldLabel } from '@ubits/flux-ui'
import { SelectorColor } from '@/modules/design-system/formularios/selector-color'

// Color libre para la presentación y los canvas del video: el creador elige cualquier color con el selector del sistema
// (SelectorColor: área de color, tono, gotero y código), como en el editor de AI Studio, en lugar de una paleta
// cerrada. Hasta el 14-oct era el input de color del navegador.
//
// El valor es un token del tema (el de la marca por defecto, p. ej. 'primary') o el hex que eligió el creador. El hex es
// un dato, no código: se pinta con una variable CSS (`--acento`) puesta en la raíz de la diapositiva, y las clases leen
// esa variable. El texto que va encima del color (`--acento-frente`) se elige por contraste: negro o blanco.

/** ¿Es un color elegido por el creador (`#` + seis dígitos hex) y no un token del tema? */
export const esColorLibre = (valor: string | null | undefined): boolean => typeof valor === 'string' && /^#[0-9a-f]{6}$/i.test(valor)

/** Las clases de un color libre: todas leen la variable que pone `estiloColorLibre`. */
export const CLASES_COLOR_LIBRE = {
  fondo: 'bg-(--acento)',
  frente: 'text-(--acento-frente)',
  texto: 'text-(--acento)',
  suave: 'bg-(--acento)/10',
  borde: 'border-(--acento)',
} as const

/** Claridad percibida del color (0 oscuro, 1 claro), para decidir el texto que va encima. */
function claridad(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Las variables CSS del color libre, para la raíz de lo que se pinta con él (sin color libre, nada). */
export function estiloColorLibre(valor: string | null | undefined): CSSProperties | undefined {
  if (!valor || !esColorLibre(valor)) return undefined
  return { ['--acento' as string]: valor, ['--acento-frente' as string]: claridad(valor) > 0.6 ? 'black' : 'white' }
}

/**
 * El hex de un token del tema, leído de la pantalla: el input de color necesita un hex y el tema está en oklch. Se pinta
 * un elemento con la clase del token y se lee el pixel en un canvas (así no se escribe ningún color en el código).
 */
export function hexDeClase(clase: string) {
  const muestra = document.createElement('span')
  muestra.className = clase
  muestra.style.position = 'absolute'
  muestra.style.visibility = 'hidden'
  document.body.appendChild(muestra)
  const color = getComputedStyle(muestra).backgroundColor
  muestra.remove()
  const lienzo = document.createElement('canvas')
  lienzo.width = 1
  lienzo.height = 1
  const ctx = lienzo.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

type Props = {
  id: string
  etiqueta: string
  descripcion?: string
  /** Un token del tema o un hex. */
  valor: string
  /** La clase de fondo del token actual (p. ej. 'bg-primary'), para mostrar su color cuando no hay hex. */
  claseToken: string
  onCambio: (valor: string) => void
  /** El token al que vuelve «Usar el de la marca». */
  porDefecto: string
  /** La etiqueta solo para lectores de pantalla (cuando el contenedor ya pone su propio título). */
  ocultarEtiqueta?: boolean
}

/** El campo: el selector de color con su código y la vuelta al color de la marca. */
export function CampoColorLibre({ id, etiqueta, descripcion, valor, claseToken, onCambio, porDefecto, ocultarEtiqueta = false }: Props) {
  const [hexToken, setHexToken] = useState('')
  useLayoutEffect(() => {
    if (!esColorLibre(valor)) setHexToken(hexDeClase(claseToken))
  }, [valor, claseToken])
  const hex = esColorLibre(valor) ? valor : hexToken

  return (
    <Field>
      <FieldLabel htmlFor={id} className={ocultarEtiqueta ? 'sr-only' : undefined}>
        {etiqueta}
      </FieldLabel>
      {/* Siempre controlado: se pinta cuando ya se conoce el color (se calcula antes del primer cuadro, sin parpadeo). La
          vuelta al color de la marca es el botón de restablecer del propio campo. */}
      {hex ? (
        <SelectorColor
          id={id}
          valor={hex}
          onCambio={onCambio}
          etiqueta={etiqueta}
          onRestablecer={esColorLibre(valor) ? () => onCambio(porDefecto) : undefined}
          etiquetaRestablecer="Usar el color de la marca"
        />
      ) : (
        <span className="h-10 w-full" aria-hidden="true" />
      )}
      {descripcion && !ocultarEtiqueta ? <FieldDescription>{descripcion}</FieldDescription> : null}
    </Field>
  )
}
