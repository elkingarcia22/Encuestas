import { useState } from 'react'
import { Field, FieldLabel, Input } from '@ubits/flux-ui'
import { SelectorColor } from '@/modules/design-system/formularios/selector-color'
import type { Ajuste } from './main'

// Fichas de las piezas de formulario que armó el equipo encima de la librería. La primera es el selector de color
// (14-oct): la librería no trae uno, y el del navegador no se puede tematizar ni deja escribir el código.

function ColorLibreria() {
  const [valor, setValor] = useState('2f5fe0')
  return (
    <Field className="w-56">
      <FieldLabel htmlFor="ficha-color-lib">Color de acento</FieldLabel>
      {/* Lo que ofrece la librería (y ReUI, c-input-28): el input de color del navegador. */}
      <Input id="ficha-color-lib" type="color" className="h-10 w-20 cursor-pointer p-1" value={`${'#'}${valor}`} onChange={(e) => setValor(e.target.value.replace('#', ''))} />
    </Field>
  )
}

function ColorUbits() {
  const [valor, setValor] = useState('2f5fe0')
  return (
    <Field className="w-56">
      <FieldLabel htmlFor="ficha-color-ubits">Color de acento</FieldLabel>
      <SelectorColor
        id="ficha-color-ubits"
        valor={valor}
        onCambio={setValor}
        etiqueta="Color de acento"
        onRestablecer={valor.replace('#', '') !== '2f5fe0' ? () => setValor('2f5fe0') : undefined}
        etiquetaRestablecer="Usar el color de la marca"
      />
    </Field>
  )
}

export const FICHAS_FORMULARIOS: Ajuste[] = [
  {
    id: 'pieza-selector-color',
    titulo: 'Selector de color',
    estado: 'pedido',
    resumen: 'Elegir un color: la muestra y su código, y al abrirlo el área de color, el tono, el gotero y el código en HEX, RGB o HSL.',
    piezas: [
      { nombre: 'Popover', slug: 'popover' },
      { nombre: 'Slider', slug: 'slider' },
      { nombre: 'Select', slug: 'select' },
      { nombre: 'Input', slug: 'input' },
      { nombre: 'Button', slug: 'button' },
    ],
    hechoAMano: 'El área de color (saturación a lo ancho, luz a lo alto, con su punto): ningún componente la trae. Se mueve con el puntero o con las flechas.',
    libreria: <ColorLibreria />,
    ubits: <ColorUbits />,
    cambia: [
      'Un campo con la muestra en un cuadrado grande y el código en vez del cuadro del navegador',
      'Botón de restablecer dentro del campo, solo cuando el color cambió',
      'Área de color y barra de tono dentro de un Popover de la librería',
      'Gotero para tomar un color de la pantalla, cuando el navegador lo trae',
      'El código se escribe en HEX, RGB o HSL',
      'La barra de tono es el Slider con su riel transparente, forzado con «!», para ver el arcoíris detrás',
    ],
    porque:
      'La librería no trae selector de color y el input del navegador abre una ventana distinta en cada sistema, no se puede tematizar y no deja escribir el código. El editor de video de AI Studio armó el suyo y el jefe de Dave lo pidió igual (14-oct).',
    donde: [
      'SelectorColor (design-system/formularios/selector-color.tsx)',
      'Color de acento del video con IA (escenas canvas)',
      'Color de acento de la presentación interactiva',
      'Design system › Formularios',
    ],
    usar: 'Cualquier campo donde la persona elige un color libre: acentos, marca, fondos. El valor es un hex de seis dígitos.',
    evitar: 'El <Input type="color"> del navegador o una paleta armada a mano en la pantalla. Si solo hay unas pocas opciones de color, van como opciones (RadioGroup), no como selector libre.',
  },
]
