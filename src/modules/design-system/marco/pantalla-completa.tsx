import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { FullScreenIcon } from '@hugeicons/core-free-icons'
import { Heading, Text, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CloseButton } from '@/shared/components/CloseButton'
import { Hint } from '@/shared/components/Hint'

// La plantilla de pantalla completa del sistema (regla «pantalla-completa», war room del 13-oct). Toda vista ampliada
// —el tablero de candidatos, un mapa de calor, el eNPS, la vista previa de una encuesta, los editores inmersivos de LMS
// Creator— comparte el mismo marco: casi toda la ventana con 16 px de margen, esquinas y sombra de panel, y el fondo
// oscurecido detrás. Arriba, el título con la tipografía del tema y un divisor debajo; a la derecha, sus acciones y la X
// en círculo (CloseButton). El botón que la abre va arriba a la derecha del bloque que se amplía: BotonAmpliar.

// El marco, para quien ya arma su propia capa a pantalla completa (el tablero de Selección, FullscreenTemplate).
export const MARCO_PANTALLA_COMPLETA = 'fixed inset-4 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-xl'
export const FONDO_PANTALLA_COMPLETA = 'fixed inset-0 bg-black/40'

export function PantallaCompleta({
  abierta,
  onCerrar,
  titulo,
  descripcion,
  acciones,
  etiquetaCerrar = 'Cerrar pantalla completa',
  pie,
  partida = false,
  junto,
  children,
}: {
  abierta: boolean
  onCerrar: () => void
  titulo: ReactNode
  descripcion?: ReactNode
  // Junto a la X: los controles de lo que se ve (ver por, filtros, leyenda).
  acciones?: ReactNode
  etiquetaCerrar?: string
  // Una barra al pie, siempre a la vista, para los botones de una tarea que se guarda o se cancela (21-oct, Objetivos).
  pie?: ReactNode
  // El contenido sin relleno ni desplazamiento propio: quien lo pone reparte el espacio (dos columnas que se desplazan por su cuenta).
  partida?: boolean
  // Ancho de un panel acoplado a la derecha (el agente de IA): la pantalla se queda a su izquierda, sin fondo oscuro encima de él.
  junto?: string
  children: ReactNode
}) {
  const id = useId()
  const cerrar = useRef<HTMLDivElement>(null)

  // Escape cierra, salvo que esté abierto algo encima (un menú, una lista, otra ventana): primero se cierra eso.
  useEffect(() => {
    if (!abierta) return
    cerrar.current?.querySelector('button')?.focus()
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape' || document.querySelector('[role=menu], [role=listbox], [role=dialog][data-open]')) return
      onCerrar()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierta, onCerrar])

  if (!abierta) return null
  return createPortal(
    <>
      {junto ? null : <div aria-hidden="true" className={cn(FONDO_PANTALLA_COMPLETA, 'z-40')} />}
      <section
        role="dialog"
        aria-modal={junto ? undefined : true}
        aria-labelledby={id}
        style={junto ? { right: `calc(${junto} + 1rem)` } : undefined}
        className={cn(MARCO_PANTALLA_COMPLETA, 'z-40 animate-in duration-200 fade-in-0 zoom-in-[0.98]')}
      >
        <header className="flex shrink-0 items-start gap-3 border-b px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Heading as="h2" level={5} id={id} className="truncate">
              {titulo}
            </Heading>
            {descripcion ? (
              <Text size="sm" variant="muted">
                {descripcion}
              </Text>
            ) : null}
          </div>
          {acciones ? <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div> : null}
          <div ref={cerrar} className="flex shrink-0">
            <CloseButton label={etiquetaCerrar} onClick={onCerrar} />
          </div>
        </header>
        <div className={partida ? 'min-h-0 flex-1' : 'min-h-0 flex-1 overflow-auto p-5'}>{children}</div>
        {pie ? <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t bg-muted px-5 py-4">{pie}</footer> : null}
      </section>
    </>,
    document.body,
  )
}

// El botón que abre la pantalla completa: solo icono, arriba a la derecha del bloque que se amplía (13-oct: como el de
// Elkin en Resultados; nunca flotando abajo).
export function BotonAmpliar({ onClick, etiqueta = 'Ver en pantalla completa' }: { onClick: () => void; etiqueta?: string }) {
  return (
    <Hint label={etiqueta}>
      <BotonIcono aria-label={etiqueta} onClick={onClick}>
        <HugeiconsIcon icon={FullScreenIcon} aria-hidden="true" />
      </BotonIcono>
    </Hint>
  )
}
