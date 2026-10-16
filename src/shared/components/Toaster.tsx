import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading02Icon,
  MultiplicationSignCircleIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toast,
  useToastManager,
} from '@ubits/flux-ui'

// Avisos en pila, armados con las mismas piezas y el mismo orden que el `ToastToaster` de flux-ui. Ese trae los nombres
// ocultos en inglés («Notifications» en la región y «Close toast» en la X) y no deja cambiarlos; en una página en español
// el lector los pronuncia mal (AA 3.1.2). Aquí van en español. Reportar a librería para que acepte textos propios.
//
// Cada tipo lleva su icono en su color del tema (follow up del 17-sep: éxito en verde, información en azul, advertencia
// en amarillo y error en rojo). Los iconos son los mismos que usa la librería; su ToastToaster solo pinta el de error y
// deja el resto en negro. Pedido a la librería: que el color venga por tipo. Mientras, este es el único toaster del
// producto (va en RootLayout): no montar ToastToaster en las pantallas, o cada aviso sale dos veces.
const ICONO: Record<string, { icono: IconSvgElement; clase: string }> = {
  success: { icono: CheckmarkCircle02Icon, clase: 'text-success' },
  info: { icono: InformationCircleIcon, clase: 'text-info' },
  warning: { icono: Alert02Icon, clase: 'text-warning' },
  error: { icono: MultiplicationSignCircleIcon, clase: 'text-destructive' },
  loading: {
    icono: Loading02Icon,
    clase: 'animate-spin text-muted-foreground',
  },
}

// Arriba y centrados (decisión del 1-oct). La librería los apila desde abajo: cada aviso va pegado al borde inferior del
// visor y los de atrás se corren hacia arriba. Arriba eso se invierte: pegado al borde superior, los de atrás se corren
// hacia abajo, entran bajando y se descartan deslizando hacia arriba (como el ejemplo «top» de Base UI). Pedido a la
// librería: que el toaster acepte la posición.
const ARRIBA = [
  'top-0! bottom-auto! origin-top!',
  'after:top-auto! after:bottom-full!',
  '[--offset-y:calc(var(--toast-offset-y)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))]!',
  '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))]!',
  'data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]!',
  'data-starting-style:[transform:translateY(-150%)]!',
  '[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(-150%)]!',
].join(' ')

function ToastList() {
  const { toasts } = useToastManager()
  return toasts.map((item) => {
    const tipo = item.type ? ICONO[item.type] : undefined
    return (
      <Toast key={item.id} toast={item} swipeDirection={['up', 'right']} className={ARRIBA}>
        <ToastContent>
          {tipo ? (
            <HugeiconsIcon icon={tipo.icono} size={16} aria-hidden="true" className={`shrink-0 ${tipo.clase}`} />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <ToastTitle />
            <ToastDescription />
          </div>
          <ToastAction />
          <ToastClose aria-label="Cerrar aviso" />
        </ToastContent>
      </Toast>
    )
  })
}

export function Toaster() {
  return (
    <ToastProvider toastManager={toast}>
      <ToastPortal>
        {/* z-60: por encima de los templates a pantalla completa (FullscreenTemplate, z-50), que se montan después.
            Arriba y centrados en todas las pantallas (decisión del 1-oct; antes, abajo): la librería los manda abajo a la
            derecha desde sm. */}
        <ToastViewport aria-label="Avisos" className="top-4! bottom-auto! z-60 sm:left-4 sm:mx-auto">
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}
