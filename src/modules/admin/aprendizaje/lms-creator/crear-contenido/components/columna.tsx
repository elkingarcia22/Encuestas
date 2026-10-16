import type { ReactNode } from 'react'
import { Frame, FrameHeader, FramePanel, FrameTitle, Text, cn } from '@ubits/flux-ui'

// El panel con rótulo del asistente: el nombre arriba —«Índice», «Vista previa»— con lo que lo acompaña a la derecha,
// y debajo el contenido. Es lo que arma las dos columnas del paso 2 y lo que envuelve el certificado en el paso 3,
// para que «vista previa» se vea igual en todo el flujo y no cada paso a su manera.
//
// Va en el **mismo marco gris del paso 1**: el rótulo fuera, sobre el gris, y el contenido en un panel blanco dentro.
// Antes era una tarjeta blanca con el rótulo adentro y una línea debajo, así que el paso 1 y el 2 se veían como dos
// pantallas distintas aunque fueran el mismo asistente (Dave, 6-oct).

// El reparto de las dos columnas del asistente: el índice (o el formulario) a la izquierda, con una medida fija, y la
// vista previa ocupando lo que quede. Los pasos 2 y 3 lo comparten para que las columnas midan lo mismo en los dos.
export const DOS_COLUMNAS = 'lg:grid-cols-[24rem_minmax(0,1fr)]'

/**
 * La angosta a la **derecha**: el trabajo a la izquierda y, al lado, el resumen de lo que se va a crear.
 *
 * **20rem**, el mismo ancho que ya usan los tres asistentes —Crear contenido, Planes de formación y Diagnóstico—,
 * que lo escriben a mano. Aquí queda nombrado para que el siguiente no tenga que adivinarlo (Dave, 13-oct).
 */
export const DOS_COLUMNAS_RESUMEN = 'lg:grid-cols-[minmax(0,1fr)_20rem]'

export function Columna({ titulo, accion, className, children }: { titulo: string; accion?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <Frame className={cn('min-h-0', className)}>
      <FrameHeader className="flex-row! items-center! justify-between! gap-2">
        <FrameTitle>{titulo}</FrameTitle>
        {accion}
      </FrameHeader>
      {/* El panel se come el alto que sobre y recorta: el scroll lo hace el contenido, no el marco. */}
      <FramePanel className="flex min-h-0 flex-1 flex-col overflow-hidden p-0!">{children}</FramePanel>
    </Frame>
  )
}

/** El dato que acompaña a un rótulo: el conteo de páginas, «5 de 7», el estado del certificado. */
export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <Text as="span" size="sm" variant="muted" className="shrink-0 tabular-nums">
      {children}
    </Text>
  )
}
