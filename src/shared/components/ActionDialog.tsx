import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Avatar, AvatarFallback, Button, Dialog, DialogContent, DialogDescription, DialogTitle, Heading, Spinner, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CloseButton } from '@/shared/components/CloseButton'

export type ActionDialogItem = {
  ini: string
  title: string
  meta: string
}

type ActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  sub?: string
  // De qué registro se está hablando, justo bajo la cabecera: el nombre del contenido, de la persona, del aviso. Va
  // aquí y no en `title` porque el título se deja fijo —a desarrollo le sirve más uno que no cambia con el contenido—
  // y lo particular vive en el cuerpo (Carlos, 1-oct).
  lead?: ReactNode
  text?: string
  items?: ActionDialogItem[]
  children?: ReactNode
  note?: string
  cancelLabel?: string
  confirmLabel?: string
  confirmDisabled?: boolean
  onConfirm?: () => void
  // Lo que dice el botón mientras la acción corre («Moviendo…», «Guardando…»). Con él, al confirmar el botón muestra el
  // spinner y ese texto un momento antes de cerrar, y la ventana no se cierra ni se confirma dos veces mientras tanto
  // (regla de /design-system/estados: la respuesta de una acción va en su botón). Sin él, cierra al instante.
  pendingLabel?: string
  // Es la única ventana del sistema (decisión 4 de la auditoría, 5-oct): desde que se retiró ConfiguredModal, cubre
  // también sus medidas. «sm» (448 px) para confirmar algo corto —salir sin guardar, eliminar—; «default» (620 px) para
  // una ventana con contenido; «wide» (736 px) para un formulario largo o dos columnas (editar una vacante, revisar un
  // CV); «full» casi a pantalla completa (16 px de aire), para editores y vistas previas.
  size?: 'sm' | 'default' | 'wide' | 'full'
  // Icono arriba del título, alineado a la izquierda, como en DialogoConfirmar (diseño del 6-oct, lienzo «Ventana de
  // confirmar»). Un IconTile `xl` en `elevated` (el gris, como el de DialogoConfirmar), o el orbe si propone el agente.
  media?: ReactNode
  // Flecha a la izquierda del título para volver al paso anterior dentro de la misma ventana.
  onBack?: () => void
  // Junto a la X: una insignia o un botón de solo icono.
  headerActions?: ReactNode
  // En `false`, el clic afuera no cierra (formularios largos: un clic perdido no borra lo escrito).
  dismissible?: boolean
  // Solo layout del panel, p. ej. fijarle alto (`h-[70svh]`) para que no cambie al cambiar de pestaña.
  className?: string
  // Sin pie: ventanas que solo muestran algo y se cierran con la X.
  hideFooter?: boolean
  // Botones propios para el pie, cuando no basta con cancelar y confirmar (pasos, varias salidas).
  // Van dentro del mismo pie gris, a la derecha de la nota.
  footer?: ReactNode
}

const SIZE: Record<NonNullable<ActionDialogProps['size']>, string> = {
  sm: 'sm:max-w-md!',
  default: 'sm:max-w-155!',
  wide: 'sm:max-w-184!',
  full: 'top-4! h-[calc(100svh-2rem)] max-h-none! sm:max-w-[calc(100%-2rem)]!',
}

// Cuánto dura la acción simulada: más de 300 ms para que el spinner se lea como «está pasando» y no como un destello.
const ACTION_DELAY = 700

// Ventana de acción del prototipo: título, bajada y cerrar arriba; en el cuerpo el registro del que se habla (`lead`),
// un texto, una lista de personas o un formulario; y un pie gris con nota, cancelar y la acción principal.
// Se abre a 120px del borde superior y entra con un rebote suave.
export function ActionDialog({
  open,
  onOpenChange,
  title,
  sub,
  lead,
  text,
  items,
  children,
  note,
  cancelLabel = 'Cancelar',
  confirmLabel,
  confirmDisabled,
  onConfirm,
  pendingLabel,
  size = 'default',
  media,
  onBack,
  headerActions,
  dismissible = true,
  className,
  hideFooter = false,
  footer,
}: ActionDialogProps) {
  const [pending, setPending] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // Mientras la acción corre, ni la X, ni Escape, ni el fondo cierran la ventana.
  const changeOpen = (next: boolean) => {
    if (!next && pending) return
    onOpenChange(next)
  }
  const close = () => changeOpen(false)
  const confirm = () => {
    if (!pendingLabel) {
      close()
      onConfirm?.()
      return
    }
    setPending(true)
    timer.current = window.setTimeout(() => {
      setPending(false)
      onOpenChange(false)
      onConfirm?.()
    }, ACTION_DELAY)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next, detalle) => {
        if (!next && !dismissible && detalle?.reason === 'outside-press') return
        changeOpen(next)
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          'top-30! flex! max-h-[min(40rem,calc(100vh-10rem))] translate-y-0! flex-col gap-0! overflow-hidden p-0! duration-300! ease-[cubic-bezier(0.22,1.2,0.36,1)]! slide-in-from-bottom-[10px]',
          SIZE[size],
          className,
        )}
      >
        <div className="flex items-start gap-4 px-6 pt-5.5 pb-4">
          {onBack ? (
            <BotonIcono className="-ml-2 shrink-0 text-muted-foreground!" aria-label="Volver" onClick={onBack}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} aria-hidden="true" />
            </BotonIcono>
          ) : null}
          <div className="min-w-0 flex-1">
            {media ? <div className="mb-3.5 flex">{media}</div> : null}
            <DialogTitle render={<Heading as="h2" level={4} />}>{title}</DialogTitle>
            <DialogDescription className={sub ? 'mt-2! text-sm leading-relaxed' : 'sr-only'}>{sub ?? title}</DialogDescription>
          </div>
          {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
          <CloseButton label="Cerrar" onClick={close} />
        </div>

        {lead ? <div className="mx-6! mb-4! flex flex-col gap-0.5">{lead}</div> : null}

        {text ? (
          <p className="mx-6! mb-4! rounded-xl bg-muted p-4 text-base leading-relaxed text-pretty text-foreground/80">
            {text}
          </p>
        ) : null}

        {items?.length ? (
          // La lista puede tener scroll: con tabIndex se alcanza y se desplaza con el teclado (AA 2.1.1), y lleva nombre.
          <ul tabIndex={0} aria-label="Incluidos en esta acción" className="mx-6! mb-2! min-h-0 flex-1 overflow-auto rounded-xl border">
            {items.map((item) => (
              <li key={item.title} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs font-medium text-foreground/80!">{item.ini}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-base">{item.title}</span>
                <span className="shrink-0 text-sm text-muted-foreground">{item.meta}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {children ? <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-2">{children}</div> : null}

        {hideFooter ? null : (
          <div className="mt-auto flex items-center gap-2 border-t bg-muted px-6 py-4">
            <span className="min-w-0 flex-1 text-sm text-muted-foreground">{note}</span>
            {footer ?? (
              <>
                <Button variant="outline" disabled={pending} onClick={close}>
                  {cancelLabel}
                </Button>
                {confirmLabel ? (
                  <Button disabled={confirmDisabled || pending} onClick={confirm}>
                    {pending ? <Spinner /> : null}
                    {pending ? pendingLabel : confirmLabel}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
