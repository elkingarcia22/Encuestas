import { type ReactNode } from 'react'
import { TooltipProvider, cn } from '@ubits/flux-ui'
import type { EstadoGuardado } from '@/shared/components/ChipGuardado'
import { PageShell } from '@/shared/components/PageShell'
import { FullscreenTemplate } from '@/modules/design-system/templates/fullscreen-template'
import { Resaltado, TextoResaltado } from '@/modules/design-system/tipografia/texto-resaltado'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { EncabezadoEditor } from './encabezado-editor'

// ── Marco de los flujos hijos ────────────────────────────────────────────────────────────────────────────────────
//
// **Pantalla completa de verdad**, con el FullscreenTemplate ocupando todo y la cabecera del editor —donde caben el
// guardado, los créditos y sus acciones—: los editores de video y de presentación interactiva (tres columnas con línea
// de tiempo e inspector, trabajo largo y de precisión) y los setups (video con IA, presentación, asistencia y los dos
// roleplays), con su barra flotante abajo, la misma de los pasos de Crear contenido.
//
// Antes los pasos cortos podían abrirse como un modal de pantalla completa (sin `lleno`). Desde la auditoría del 5-oct
// (decisión 5: crear y editar en una página, nunca en ventana) no queda ninguno así: el roleplay con IA, el último, va
// con el mismo marco y la misma barra que el roleplay MVP. `lleno` ya no cambia nada; se acepta para no tocar a quienes
// lo pasan.

type MarcoProps = {
  titulo: ReactNode
  /** Bajo el título: la página de destino o el paso. */
  subtitulo?: ReactNode
  /** Junto al título: «MVP». */
  insignia?: ReactNode
  guardado?: EstadoGuardado
  tokens?: number
  /** La flecha a la izquierda del título. Sin ella, el flujo solo sale por la X. */
  volver?: { etiqueta: string; onClick: () => void; soloIcono?: boolean }
  /** La X de la cabecera (cerrar sin guardar). */
  cerrar?: { etiqueta: string; onClick: () => void }
  /** Los botones propios del editor. */
  acciones?: ReactNode
  /** Bajo la cabecera: los pasos del flujo. */
  pasos?: ReactNode
  /** La barra inferior flotante (BarraEditor). */
  barra?: ReactNode
  /**
   * La barra de acciones al pie, fija, para los editores de tres columnas. Es `barra` por otro camino: ahí el
   * contenido hace scroll y la barra viaja con él, y un editor de tres columnas no hace scroll de página.
   *
   * Existe porque **la acción principal no puede cambiar de sitio entre el setup y el editor**: en el setup está
   * abajo y en el editor estaba arriba, y pasar de una a otra se sentía raro (el jefe de Dave, 5-oct).
   */
  pie?: ReactNode
  /** Ya no cambia nada: todos los flujos hijos son pantalla completa (ver arriba). */
  lleno?: boolean
  /**
   * El tamaño del panel del modal, cuando a la pantalla no le sirve el de pantalla completa. Hoy solo lo usa la
   * vista del colaborador, que necesita medir lo que medirá de verdad y no todo el monitor.
   */
  panelClassName?: string
  /** El ancho del contenido: 1600 para los lienzos de edición, 1140 para un paso a paso con su resumen al lado. */
  ancho?: 'default' | 'wide'
  children: ReactNode
}

export function MarcoInmersivo(props: MarcoProps) {
  return <PantallaCompleta {...props} />
}

/** Los editores de tres columnas: todo el alto, sin panel de modal, con la cabecera del editor. */
function PantallaCompleta({ titulo, subtitulo, insignia, guardado, tokens, volver, cerrar, acciones, pasos, barra, pie, ancho = 'wide', children }: MarcoProps) {
  return (
    // Con el margen de la plantilla de pantalla completa del sistema (regla «pantalla-completa», 13-oct).
    <FullscreenTemplate margen>
      <TooltipProvider delay={300}>
        <div className="flex h-full flex-col text-foreground">
          <header className="shrink-0 border-b bg-background">
            <PageShell width="wide" className="px-4 sm:px-8">
              <EncabezadoEditor
                titulo={titulo}
                subtitulo={subtitulo}
                insignia={insignia}
                guardado={guardado}
                tokens={tokens}
                acciones={acciones}
                volver={volver?.etiqueta}
                volverSoloIcono={volver?.soloIcono}
                onSalir={volver?.onClick}
                cerrar={cerrar}
              />
            </PageShell>
            {pasos ? (
              <PageShell width="wide" className="px-4 pb-2 sm:px-8">
                {pasos}
              </PageShell>
            ) : null}
          </header>
          {/* `overflow-clip`, no `hidden`: una caja `hidden` **sigue siendo** un contenedor de scroll, así que al enfocar
              algo el navegador la desplazaba para «traerlo a la vista» y se llevaba el editor entero fuera de pantalla —y
              como con `hidden` la rueda no la mueve, quedaba así hasta recargar—. Con `clip` no hay scroll que mover. */}
          <main className={cn('relative isolate flex min-h-0 flex-1 flex-col bg-background', barra ? 'overflow-auto' : 'overflow-clip')}>
            {barra ? (
              <PageShell width={ancho} className="min-h-full px-4 pt-6 pb-4 sm:px-8">
                <div className="flex-1">{children}</div>
                {/* Dentro del scroll: la barra es una pastilla `sticky`, así flota sobre el contenido al bajar. */}
                {barra}
              </PageShell>
            ) : (
              children
            )}
          </main>
          {pie ? (
            <div className="shrink-0">
              <PageShell width={ancho} className="px-4 pb-4 sm:px-8">
                {pie}
              </PageShell>
            </div>
          ) : null}
        </div>
      </TooltipProvider>
    </FullscreenTemplate>
  )
}

// ── La salida de un paso de creación ─────────────────────────────────────────────────────────────────────────────

// BotonSalirCreacion se mudó al sistema de diseño el 8-oct (design-system/navegacion/boton-salir-creacion). Se reenvía
// desde aquí para no romper imports viejos ni ramas abiertas; lo nuevo importa desde la ruta nueva.
export { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'

// ── Insignias de IA ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Marca de «Generado con IA» sobre un recurso o una portada. Los colores suaves del Badge son translúcidos: va sobre una
 * base del color de la tarjeta, del tamaño del badge, para que se lea encima de cualquier imagen (como en TarjetaContenido).
 */
export function InsigniaIA({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex rounded-md bg-card', className)}>
      {/* La insignia de IA de Design system › IA: EtiquetaIA. */}
      <EtiquetaIA size="sm">Generado con IA</EtiquetaIA>
    </span>
  )
}

/** Instrucción grande y centrada de los modales de recurso: «Sube el **archivo PDF** que quieres agregar». */
export function InstruccionGrande({ antes, clave, despues }: { antes: string; clave: string; despues: string }) {
  return (
    <TextoResaltado className="text-center">
      {antes}
      <Resaltado>{clave}</Resaltado>
      {despues}
    </TextoResaltado>
  )
}
