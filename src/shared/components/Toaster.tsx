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

// Forma (war room del 13-oct, regla «avisos-cortos»): la esquina de las tarjetas (la librería trae una más redonda) y,
// con texto largo, más ancho para no pasar de dos líneas. A 384 px caben unos 45 caracteres por línea en el título y
// 90 en dos líneas de detalle; si pasa de eso, el aviso usa el ancho entero del visor (576 px). Los cortos siguen de
// 384 px, centrados.
const texto = (valor: unknown) => (typeof valor === 'string' ? valor.length : 0)
const esLargo = (titulo: unknown, detalle: unknown) => texto(titulo) > 45 || texto(detalle) > 90

function ToastList() {
  const { toasts } = useToastManager()
  return toasts.map((item) => {
    const tipo = item.type ? ICONO[item.type] : undefined
    const largo = esLargo(item.title, item.description)
    // «!»: la esquina de las tarjetas y el centrado de los cortos le ganan al tema de la librería (rounded-2xl, pegado a
    // la derecha). Documentado en Ajustes propios › «Avisos: esquina y ancho». El ancho va en `style`: no es de página.
    const forma = `${ARRIBA} rounded-xl! ${largo ? '' : 'left-0! mx-auto!'}`
    return (
      <Toast key={item.id} toast={item} swipeDirection={['up', 'right']} className={forma} style={largo ? undefined : { maxWidth: '24rem' }}>
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
        <ToastViewport aria-label="Avisos" className="top-4! bottom-auto! z-60 sm:left-4 sm:mx-auto" style={{ maxWidth: '36rem' }}>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}
