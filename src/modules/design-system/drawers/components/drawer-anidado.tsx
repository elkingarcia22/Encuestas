import { useEffect, useRef, useState, type ReactNode } from 'react'
import { type IconSvgElement } from '@hugeicons/react'
import { Button, Spinner, Text } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { DrawerShell } from './drawer-shell'
import { usePanelActual } from './panel-actual'

// Dentro de un drawer no se abre una ventana encima ni otro drawer (8 oct, Nicolás: «si dentro de un drawer dispara un
// modal, dentro del drawer abras una nueva instancia y muestres ahí todo lo que estaba en el modal… en el drawer que
// tiene todo, nada de abrir un nuevo drawer»). Lo que antes era un modal se abre como una vista del mismo drawer: tapa
// su contenido con la cabecera, el cuerpo y el pie de la ventana, y arriba queda «← título del panel» para volver. Lo
// hace `DrawerShell` solo cuando está dentro de otro (ver `drawer-shell.tsx`).
//
// - `VentanaDeAccion` es `ActionDialog` con la misma API: fuera de un panel es la ventana de siempre; dentro, la vista.
// - `DialogoConfirmar` (design-system/estados) hace lo mismo con las confirmaciones.
// - `useVentanasEnPanel` es para las ventanas que una pantalla monta afuera (las del proceso de una vacante, las de la
//   base): dice si la acción se pidió desde el panel, para dibujarlas dentro de él.

// Lo que se abre desde un panel, como vista del mismo: un DrawerShell dentro de otro.
export function DrawerAnidado({
  open,
  onOpenChange,
  title,
  description,
  icon,
  ancho = false,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  icon?: IconSvgElement
  // Lo que antes era una ventana ancha (dos columnas): el panel se ensancha mientras la vista está abierta.
  ancho?: boolean
  footer?: ReactNode
  children?: ReactNode
}) {
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size={ancho ? 'xl' : undefined}
      title={title}
      description={description}
      icon={icon}
      footer={footer}
      // La nota y los botones no siempre caben en una fila del panel: la nota sube y los botones quedan abajo.
      footerClassName="flex-wrap"
    >
      {children}
    </DrawerShell>
  )
}

// La acción que tarda: el botón muestra el spinner con su texto un momento y nada cierra mientras tanto (la misma regla
// que ActionDialog: la respuesta de una acción va en su botón).
const DEMORA_ACCION = 700

function useAccionPendiente(onOpenChange: (open: boolean) => void, onConfirm?: () => void, pendingLabel?: string) {
  const [pendiente, setPendiente] = useState(false)
  const reloj = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(reloj.current), [])
  const cambiar = (abrir: boolean) => {
    if (!abrir && pendiente) return
    onOpenChange(abrir)
  }
  const confirmar = () => {
    if (!pendingLabel) {
      cambiar(false)
      onConfirm?.()
      return
    }
    setPendiente(true)
    reloj.current = window.setTimeout(() => {
      setPendiente(false)
      onOpenChange(false)
      onConfirm?.()
    }, DEMORA_ACCION)
  }
  return { pendiente, cambiar, confirmar }
}

type VentanaProps = Parameters<typeof ActionDialog>[0] & {
  // Dentro de un panel, más ancha que él: para las de dos columnas que no caben en el ancho del panel (revisar un CV).
  anchoEnPanel?: boolean
}

export function VentanaDeAccion({ anchoEnPanel, ...props }: VentanaProps) {
  const padre = usePanelActual()
  if (padre) return <VentanaEnPanel {...props} anchoEnPanel={anchoEnPanel} />
  // La lista de personas la pinta esta pieza, sin avatar: la de ActionDialog lleva el círculo con iniciales y los
  // candidatos no lo llevan (8 oct).
  const { items, children, ...resto } = props
  return (
    <ActionDialog {...resto}>
      {items?.length || children ? (
        <>
          <ListaIncluidos items={items} />
          {children}
        </>
      ) : null}
    </ActionDialog>
  )
}

// A quiénes toca la acción: el nombre y un dato, sin avatar.
function ListaIncluidos({ items }: { items: VentanaProps['items'] }) {
  if (!items?.length) return null
  return (
    <ul tabIndex={0} aria-label="Incluidos en esta acción" className="max-h-64 shrink-0 overflow-auto rounded-xl border">
      {items.map((item) => (
        <li key={item.title} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
          <Text as="span" className="min-w-0 flex-1 truncate">
            {item.title}
          </Text>
          <Text as="span" variant="muted" size="sm" className="shrink-0">
            {item.meta}
          </Text>
        </li>
      ))}
    </ul>
  )
}

function VentanaEnPanel({
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
  anchoEnPanel,
  footer,
}: VentanaProps) {
  const accion = useAccionPendiente(onOpenChange, onConfirm, pendingLabel)
  return (
    <DrawerAnidado
      open={open}
      onOpenChange={accion.cambiar}
      ancho={anchoEnPanel}
      title={title}
      description={sub}
      footer={
        <>
          {note ? (
            // Con 12rem mínimo: si los botones no le dejan sitio (en el celular), la nota sube a su propia línea.
            <Text as="span" variant="muted" size="sm" className="min-w-48 flex-1">
              {note}
            </Text>
          ) : null}
          {footer ?? (
            <>
              <Button variant="outline" disabled={accion.pendiente} onClick={() => accion.cambiar(false)}>
                {cancelLabel}
              </Button>
              {confirmLabel ? (
                <Button disabled={confirmDisabled || accion.pendiente} onClick={accion.confirmar}>
                  {accion.pendiente ? <Spinner /> : null}
                  {accion.pendiente ? pendingLabel : confirmLabel}
                </Button>
              ) : null}
            </>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* El registro del que habla la ventana (el nombre de la vacante en «Compartir»): sin él, dentro del panel no se
            sabría de cuál se trata, porque el título es fijo. */}
        {lead ? <div className="flex flex-col gap-0.5">{lead}</div> : null}
        {text ? (
          <Text as="p" className="rounded-xl bg-muted p-4 text-pretty">
            {text}
          </Text>
        ) : null}
        <ListaIncluidos items={items} />
        {children}
      </div>
    </DrawerAnidado>
  )
}

/* Las ventanas que la pantalla monta afuera ------------------------------------------------------------------------ */

// Dónde fue la última interacción: dentro de un drawer o fuera. La lee `useVentanasEnPanel` en el momento en que se abre
// una ventana, que es justo después del clic o la tecla que la pidió.
let ultimaEnPanel = false
const DENTRO_DE_DRAWER = '[data-slot="drawer-popup"], [data-slot="drawer-content"]'
// Un menú, una lista o un globo se dibujan fuera de todo (en el body), pero pertenecen a quien los abrió: tocar ahí no
// cambia de dónde vino la acción («⋯ › Escribirle» en el pie de la ficha sigue siendo de la ficha).
const FLOTANTE = [
  '[role="menu"]',
  '[role="listbox"]',
  '[data-slot="popover-content"]',
  '[data-slot="select-content"]',
  '[data-slot="combobox-content"]',
  '[data-slot$="menu-content"]',
  '[data-slot$="sub-content"]',
  '[data-slot="menubar-content"]',
].join(', ')
if (typeof document !== 'undefined') {
  const anotar = (evento: Event) => {
    if (!(evento.target instanceof Element)) return
    if (evento.target.closest(FLOTANTE)) return
    ultimaEnPanel = evento.target.closest(DENTRO_DE_DRAWER) !== null
  }
  document.addEventListener('pointerdown', anotar, true)
  document.addEventListener('keydown', anotar, true)
}

// Para las ventanas que una pantalla monta fuera del panel (p. ej. las del proceso de una vacante, que se piden desde el
// tablero y desde la ficha): `true` si la que se abre se pidió desde el panel abierto, para dibujarla dentro de él como
// anidado. Se decide al abrir y no cambia hasta que se cierra, aunque luego se toque otra cosa.
export function useVentanasEnPanel(abiertas: boolean, panelAbierto: boolean) {
  const [antes, setAntes] = useState(abiertas)
  const [enPanel, setEnPanel] = useState(false)
  if (abiertas !== antes) {
    setAntes(abiertas)
    // Solo al abrir: al cerrar se queda donde estaba, para que el anidado salga con su animación.
    if (abiertas) setEnPanel(panelAbierto && ultimaEnPanel)
  }
  return panelAbierto && enPanel
}
