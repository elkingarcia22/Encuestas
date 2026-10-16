import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ColorPickerIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'

// El selector de color del sistema: el botón con la muestra y el código, y al abrirlo el área de color, la barra de
// tono, el gotero, el formato y el código para escribirlo. Lo pidió el jefe de Dave el 14-oct, tomado del editor de
// video de AI Studio en producción.
//
// **Ni flux-ui ni ReUI lo traen**: los dos usan el `<input type="color">` del navegador, que en cada sistema operativo
// abre una ventana distinta y no deja escribir el código. Se arma con piezas de la librería —Popover, Slider, Select,
// Input, Button— y lo único propio es el área de color, que no existe en ningún componente. Ficha en
// ai-tools/flux-ui/diferencias.json («selector-color»), para que la librería lo adopte.
//
// El valor siempre es un hex de seis dígitos: es lo que guardan el acento del video y el de la presentación. Por eso no
// hay transparencia, a diferencia del de AI Studio: un acento a medias no tiene uso en una diapositiva.
//
// Los colores de aquí son **datos que se calculan**, no estilos del tema: el tono que eliges, el blanco y el negro con
// que se arma el área. Por eso salen de funciones y no van escritos.

type Hsv = { h: number; s: number; v: number }
type Formato = 'hex' | 'rgb' | 'hsl'

const FORMATOS: { valor: Formato; etiqueta: string }[] = [
  { valor: 'hex', etiqueta: 'HEX' },
  { valor: 'rgb', etiqueta: 'RGB' },
  { valor: 'hsl', etiqueta: 'HSL' },
]

const limitar = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n))
const dosDigitos = (n: number) => Math.round(n).toString(16).padStart(2, '0')

export const esHex = (valor: string) => /^#?[0-9a-f]{6}$/i.test(valor.trim())
/** El código corto («f00») a seis dígitos. */
const largo = (valor: string) => {
  const limpio = valor.trim().replace('#', '')
  return /^[0-9a-f]{3}$/i.test(limpio) ? limpio.split('').map((c) => c + c).join('') : limpio
}

function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16)) as [number, number, number]
}

const rgbAHex = (r: number, g: number, b: number) => `${'#'}${dosDigitos(r)}${dosDigitos(g)}${dosDigitos(b)}`

function rgbAHsv(r: number, g: number, b: number): Hsv {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255]
  const max = Math.max(rr, gg, bb)
  const d = max - Math.min(rr, gg, bb)
  let h = 0
  if (d) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h = (h * 60 + 360) % 360
  }
  return { h, s: max ? d / max : 0, v: max }
}

function hsvARgb({ h, s, v }: Hsv): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [f(5) * 255, f(3) * 255, f(1) * 255]
}

const hsvAHex = (hsv: Hsv) => rgbAHex(...hsvARgb(hsv))
const hexAHsv = (hex: string) => rgbAHsv(...hexARgb(hex))

function rgbAHsl(r: number, g: number, b: number): [number, number, number] {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255]
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  const d = max - min
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0
  const { h } = rgbAHsv(r, g, b)
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
}

function hslARgb(h: number, s: number, l: number): [number, number, number] {
  const ss = s / 100
  const ll = l / 100
  const a = ss * Math.min(ll, 1 - ll)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

/** El código en el formato elegido, como se escribe en el campo. */
function codigo(hex: string, formato: Formato) {
  const [r, g, b] = hexARgb(hex)
  if (formato === 'rgb') return `${r}, ${g}, ${b}`
  if (formato === 'hsl') {
    const [h, s, l] = rgbAHsl(r, g, b)
    return `${h}°, ${s} %, ${l} %`
  }
  return hex.replace('#', '').toUpperCase()
}

/** Lo escrito en el campo, de vuelta a hex; `null` si todavía no es un color. */
function leerCodigo(texto: string, formato: Formato): string | null {
  if (formato === 'hex') return esHex(largo(texto)) ? `${'#'}${largo(texto).toLowerCase()}` : null
  // Los números, con o sin sus unidades («50°, 100 %, 50 %»).
  const partes = texto.split(/[\s,°%]+/).filter(Boolean).map(Number)
  if (partes.length !== 3 || partes.some((n) => Number.isNaN(n))) return null
  if (formato === 'rgb') return partes.every((n) => n >= 0 && n <= 255) ? rgbAHex(partes[0], partes[1], partes[2]) : null
  const [h, s, l] = partes
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null
  return rgbAHex(...hslARgb(h, s, l))
}

/** La barra de tono: los seis colores puros de la vuelta, calculados. */
const DEGRADADO_TONO = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => hsvAHex({ h, s: 1, v: 1 })).join(', ')})`

/** El último formato elegido, para la próxima vez que se abra (en esta sesión). */
let ultimoFormato: Formato = 'hex'

type Props = {
  id?: string
  /** Hex de seis dígitos, con o sin `#`. */
  valor: string
  onCambio: (hex: string) => void
  /** Para lectores de pantalla, si el campo no tiene su FieldLabel. */
  etiqueta?: string
  className?: string
  /** Vuelve al color por defecto (el de la marca, el de la escena…). Sin esto no hay botón; pásalo solo cuando el color cambió. */
  onRestablecer?: () => void
  /** Qué dice el botón de restablecer (para el globo y el lector de pantalla). */
  etiquetaRestablecer?: string
}

/**
 * El selector: el botón muestra el color y su código; al abrirlo, el área de color (saturación a lo ancho, luz a lo
 * alto), la barra de tono, el gotero (si el navegador lo trae) y el código en HEX, RGB o HSL.
 */
export function SelectorColor({ id, valor, onCambio, etiqueta, className, onRestablecer, etiquetaRestablecer = 'Restablecer el color' }: Props) {
  const hex = esHex(valor) ? `${'#'}${valor.replace('#', '').toLowerCase()}` : rgbAHex(0, 0, 0)
  // El tono se guarda aparte: con un gris o un negro el hex ya no lo dice, y el área perdía el color que se venía usando.
  const [hsv, setHsv] = useState<Hsv>(() => hexAHsv(hex))
  // El formato que se eligió la última vez: volver a HEX cada vez que se abría obligaba a elegirlo de nuevo.
  const [formato, setFormatoLocal] = useState<Formato>(() => ultimoFormato)
  const setFormato = (f: Formato) => {
    ultimoFormato = f
    setFormatoLocal(f)
  }
  const [texto, setTexto] = useState(() => codigo(hex, ultimoFormato))
  const invalido = texto.trim() !== '' && leerCodigo(texto, formato) === null
  const ultimo = useRef(hex)

  // Si el valor cambia desde afuera (restablecer, otra escena), el selector lo sigue.
  useEffect(() => {
    if (hex === ultimo.current) return
    ultimo.current = hex
    setHsv((anterior) => {
      const nuevo = hexAHsv(hex)
      return nuevo.s === 0 || nuevo.v === 0 ? { ...nuevo, h: anterior.h } : nuevo
    })
    setTexto(codigo(hex, formato))
  }, [hex, formato])

  const elegir = (siguiente: Hsv) => {
    setHsv(siguiente)
    const nuevo = hsvAHex(siguiente)
    ultimo.current = nuevo
    setTexto(codigo(nuevo, formato))
    onCambio(nuevo)
  }

  const escribir = (valorEscrito: string) => {
    setTexto(valorEscrito)
    const leido = leerCodigo(valorEscrito, formato)
    if (!leido) return
    ultimo.current = leido
    setHsv(hexAHsv(leido))
    onCambio(leido)
  }

  const conGotero = typeof window !== 'undefined' && 'EyeDropper' in window
  const gotero = async () => {
    try {
      const Gotero = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper
      const { sRGBHex } = await new Gotero().open()
      if (esHex(sRGBHex)) escribir(formato === 'hex' ? sRGBHex.replace('#', '') : codigo(sRGBHex, formato))
    } catch {
      // Cerrar el gotero con Escape no es un error: no se cambia nada.
    }
  }

  return (
    // Como un campo, igual que en el editor de AI Studio (Dave, 14-oct): la muestra en un cuadrado grande, el código y, a
    // la derecha y dentro del mismo campo, el botón de restablecer cuando el color cambió.
    <Popover>
      <div className={cn('relative w-full', className)}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              aria-label={etiqueta ? `${etiqueta}: ${hex.toUpperCase()}` : undefined}
              className={cn('h-10 w-full justify-start gap-2.5 pl-1.5', onRestablecer && 'pr-10')}
            />
          }
        >
          {/* La muestra es el color elegido: un dato, por eso va en `style` y no en una clase del tema. */}
          <span aria-hidden="true" className="size-7 shrink-0 rounded-md border" style={{ backgroundColor: hex }} />
          <span className="tabular-nums">{hex.toUpperCase()}</span>
        </PopoverTrigger>
        {onRestablecer ? (
          <span className="absolute top-1/2 right-1.5 -translate-y-1/2">
            <Hint label={etiquetaRestablecer}>
              <BotonIcono size="icon-xs" aria-label={etiquetaRestablecer} onClick={onRestablecer}>
                <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" />
              </BotonIcono>
            </Hint>
          </span>
        ) : null}
      </div>
      <PopoverContent align="start" className="w-72 gap-3">
        <AreaColor hsv={hsv} onCambio={elegir} />
        {/* La barra de tono es el Slider de la librería con el arcoíris pintado detrás: su riel y su tramo lleno van
            transparentes y más altos (ajuste propio, ficha «selector-color» en diferencias.json). */}
        <div className="relative flex h-3 items-center rounded-full" style={{ backgroundImage: DEGRADADO_TONO }}>
          <Slider
            aria-label="Tono"
            min={0}
            max={360}
            value={Math.round(hsv.h)}
            onValueChange={(v) => elegir({ ...hsv, h: Array.isArray(v) ? (v[0] ?? 0) : v })}
            className="[&_[data-slot=slider-range]]:bg-transparent! [&_[data-slot=slider-track]]:h-3! [&_[data-slot=slider-track]]:bg-transparent!"
          />
        </div>
        <div className="flex items-center gap-2">
          {conGotero ? (
            <Hint label="Tomar un color de la pantalla">
              <BotonIcono aria-label="Tomar un color de la pantalla" onClick={gotero}>
                <HugeiconsIcon icon={ColorPickerIcon} aria-hidden="true" />
              </BotonIcono>
            </Hint>
          ) : null}
          <Select
            value={formato}
            onValueChange={(v) => {
              const f = v as Formato
              setFormato(f)
              setTexto(codigo(hex, f))
            }}
          >
            <SelectTrigger size="sm" aria-label="Formato del color" className="w-20 shrink-0">
              <SelectValue>{(v: Formato) => FORMATOS.find((f) => f.valor === v)?.etiqueta}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FORMATOS.map((f) => (
                <SelectItem key={f.valor} value={f.valor}>
                  {f.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label={`Código del color en ${FORMATOS.find((f) => f.valor === formato)?.etiqueta}`}
            aria-invalid={invalido || undefined}
            value={texto}
            onChange={(e) => escribir(e.target.value)}
            onBlur={() => setTexto(codigo(hex, formato))}
            className="h-8 min-w-0 flex-1 tabular-nums"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * El área de color: la saturación a lo ancho y la luz a lo alto, sobre el tono elegido. Es lo único que no sale de un
 * componente —no hay uno en la librería—: un recuadro con dos degradados y su punto, que se arrastra con el puntero y
 * se mueve con las flechas (Mayús para pasos largos).
 */
function AreaColor({ hsv, onCambio }: { hsv: Hsv; onCambio: (hsv: Hsv) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  const desde = (e: PointerEvent<HTMLDivElement>) => {
    const caja = ref.current?.getBoundingClientRect()
    if (!caja) return
    onCambio({ ...hsv, s: limitar((e.clientX - caja.left) / caja.width), v: limitar(1 - (e.clientY - caja.top) / caja.height) })
  }

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = e.shiftKey ? 0.1 : 0.01
    const cambio: Partial<Record<string, Partial<Hsv>>> = {
      ArrowLeft: { s: limitar(hsv.s - paso) },
      ArrowRight: { s: limitar(hsv.s + paso) },
      ArrowUp: { v: limitar(hsv.v + paso) },
      ArrowDown: { v: limitar(hsv.v - paso) },
    }
    const mover = cambio[e.key]
    if (!mover) return
    e.preventDefault()
    onCambio({ ...hsv, ...mover })
  }

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Saturación y luz"
      aria-valuetext={`Saturación ${Math.round(hsv.s * 100)} %, luz ${Math.round(hsv.v * 100)} %`}
      aria-valuenow={Math.round(hsv.s * 100)}
      className="relative aspect-[4/3] w-full cursor-crosshair touch-none rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      // Blanco a la izquierda y negro abajo sobre el tono puro: es como se arma esta área en cualquier editor.
      style={{
        backgroundColor: hsvAHex({ h: hsv.h, s: 1, v: 1 }),
        backgroundImage: 'linear-gradient(to top, black, transparent), linear-gradient(to right, white, transparent)',
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        desde(e)
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && desde(e)}
      onKeyDown={teclas}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md"
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hsvAHex(hsv) }}
      />
    </div>
  )
}
