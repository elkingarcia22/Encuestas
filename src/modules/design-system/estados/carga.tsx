import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshIcon } from '@hugeicons/core-free-icons'
import { Avatar, Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Skeleton, cn } from '@ubits/flux-ui'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { simulado } from '@/modules/admin/seleccion/propuestas/simular'

// Las cargas de Selección (25 sep, Nicolás: «de cada componente construyas su skeleton para que cada que haya una
// acción con este, siempre mostremos las cargas bien»). Siguen la regla de /design-system/estados:
// - Un bloque que llega por primera vez, o que cambia por un filtro, una pestaña o una búsqueda, muestra su esqueleto:
//   solo ese bloque, con su silueta real (mismas filas, columnas y tarjetas), y el resto de la pantalla sigue quieto y
//   se puede usar. Si al llegar el contenido algo salta de sitio, la silueta está mal.
// - Una acción que la persona dispara (guardar, mover, enviar) no lleva esqueleto: su respuesta va en el botón, con
//   `Spinner` y un texto que dice qué pasa («Guardando…»).
// Como la maqueta no tiene servidor, la espera se simula aquí, en un solo lugar: si cambia, cambia en todo el módulo.

// Más de 300 ms (antes, un destello de carga se ve como un error) y menos de un segundo, para que se note sin estorbar.
export const DEMORA_CARGA = 800

// ¿Está cargando el bloque? Carga al montarse y otra vez cada vez que cambia `clave` (lo que decide su contenido: los
// filtros, la búsqueda, la pestaña, la persona abierta). Al escribir en un buscador, cada letra vuelve a empezar la
// espera: el resultado llega cuando se deja de escribir.
export function useCarga(clave: unknown = 'inicio', demora = DEMORA_CARGA) {
  const texto = typeof clave === 'string' ? clave : JSON.stringify(clave)
  const espera = simulado('lento') ? DEMORA_LENTA : demora
  const [lista, setLista] = useState<string | null>(null)
  useEffect(() => {
    const reloj = window.setTimeout(() => setLista(texto), espera)
    return () => window.clearTimeout(reloj)
  }, [texto, espera])
  return lista !== texto
}

// Con `?simular=lento`, para ver los esqueletos con calma.
const DEMORA_LENTA = 4000

// La carga de un bloque que también puede fallar (`?simular=error` hace fallar la primera): mientras carga, su
// esqueleto; si falla, `ErrorDeCarga` con «Reintentar», que vuelve a cargar solo ese bloque.
export function useCargaConError(clave: unknown = 'inicio', demora = DEMORA_CARGA) {
  const [intento, setIntento] = useState(0)
  const cargando = useCarga({ clave, intento }, demora)
  const falla = !cargando && intento === 0 && simulado('error')
  return { cargando, falla, reintentar: () => setIntento((actual) => actual + 1) }
}

// Lo que se ve cuando un bloque no cargó: qué no llegó, que lo demás sigue funcionando y cómo reintentar. Va dentro del
// panel del bloque, en el lugar de su contenido, para que la página no salte.
export function ErrorDeCarga({ que, onReintentar, className }: { que: string; onReintentar: () => void; className?: string }) {
  return (
    <Empty className={cn('py-10', className)}>
      <EmptyHeader>
        {/* La ilustración «glass» del error, como en los demás estados vacíos y de error del design system (no un icono de línea). */}
        <EmptyMedia variant="default">
          <ImagenGlass nombre="glass-danger" />
        </EmptyMedia>
        <EmptyTitle>No pudimos cargar {que}</EmptyTitle>
        <EmptyDescription>Suele ser la conexión. Lo demás de la página sigue funcionando.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onReintentar}>
          <HugeiconsIcon icon={RefreshIcon} size={16} />
          Reintentar
        </Button>
      </EmptyContent>
    </Empty>
  )
}

// Cuánto tarda una acción simulada (guardar, mover, enviar): la misma que `ActionDialog` con `pendingLabel`.
export const DEMORA_ACCION = 700

// Una acción con su espera, para los botones que no son el de confirmar de un `ActionDialog` (que ya lo trae con
// `pendingLabel`): `correr(hacer)` pone el botón en curso, espera y después hace. Mientras tanto no se puede repetir.
// En el botón: `disabled={accion.enCurso}` y `{accion.enCurso ? <Spinner /> : icono}` con el texto de lo que pasa.
export function useAccion(demora = DEMORA_ACCION) {
  const [enCurso, setEnCurso] = useState(false)
  const espera = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(espera.current), [])
  const correr = (hacer: () => void) => {
    if (enCurso) return
    setEnCurso(true)
    espera.current = window.setTimeout(() => {
      setEnCurso(false)
      hacer()
    }, demora)
  }
  return { enCurso, correr }
}

// Envoltura de un bloque que carga: el lector de pantalla oye «Cargando vacantes» (una vez) y no las piezas grises. Las
// piezas (`LineaEsqueleto`, `AvatarEsqueleto`) ya van ocultas para él, así que también sirven sueltas dentro de un bloque
// que ya anuncia su carga de otra forma.
export function Esqueleto({ etiqueta, className, children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={etiqueta} className={className}>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  )
}

// La cara de una persona mientras carga: el mismo `Avatar` (mismo tamaño y borde) con el gris del esqueleto adentro.
export function AvatarEsqueleto({ size = 'default', className }: { size?: 'sm' | 'default' | 'lg'; className?: string }) {
  return (
    <Avatar size={size} aria-hidden="true" className={className}>
      <Skeleton className="size-full rounded-full" />
    </Avatar>
  )
}

// Una línea de texto que todavía no llega. El alto es el de la línea (no el de la letra), así el bloque mide lo mismo
// cargando y cargado: `texto` 14px → 20px de línea; `chico` 12px → 16px; `titulo` 16px → 24px.
export function LineaEsqueleto({ ancho = 'w-2/3', tamano = 'texto', className }: { ancho?: string; tamano?: 'chico' | 'texto' | 'titulo'; className?: string }) {
  const alto = { chico: 'h-4 py-0.5', texto: 'h-5 py-0.75', titulo: 'h-6 py-1' }[tamano]
  return (
    <span aria-hidden="true" className={cn('flex', alto, ancho, className)}>
      <Skeleton className="size-full" />
    </span>
  )
}

// Un texto que todavía no llega, con la forma exacta que tendrá: el mismo texto, transparente, con el gris del esqueleto
// renglón por renglón. Se parte y se corta igual que el de verdad a cualquier ancho, así que sirve donde el ancho de
// una columna o el número de renglones depende del texto (tablas sin anchos fijos, descripciones que a veces van en
// dos líneas). Si lo corta un `truncate`, ese contenedor también va `text-transparent`: el «…» toma su color.
export function TextoEsqueleto({ children }: { children: string }) {
  return (
    <Skeleton aria-hidden="true" className="inline text-transparent select-none [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
      {children}
    </Skeleton>
  )
}

// Una insignia (`Badge` sm) mientras carga: de su tamaño (letra de 12px, relleno de 2 y 5px), con su texto transparente.
export function InsigniaEsqueleto({ children }: { children: string }) {
  return (
    <Skeleton aria-hidden="true" className="inline-flex h-5 shrink-0 items-center rounded-[10px] border border-transparent px-1.25 text-xs font-medium whitespace-nowrap text-transparent select-none">
      {children}
    </Skeleton>
  )
}

// Un botón `sm` mientras carga: su texto (transparente) con el mismo relleno, letra y, si lo lleva, el hueco del icono.
export function BotonEsqueleto({ children, conIcono = false }: { children: string; conIcono?: boolean }) {
  return (
    <Skeleton aria-hidden="true" className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[10px] border border-transparent px-2.5 text-sm font-medium whitespace-nowrap text-transparent select-none">
      {conIcono ? <span className="size-4" /> : null}
      {children}
    </Skeleton>
  )
}
