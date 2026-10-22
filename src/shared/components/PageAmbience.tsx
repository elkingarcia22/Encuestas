import { useLocation } from 'react-router'

// Suite AI tiene su propio ambiente (el degradado de marca del orbe y de «Nueva conversación»), así que el azul
// del Workspace no entra ahí: serían dos ambientes peleando. Vale tanto para el producto como para sus plantillas.
const SIN_AMBIENTE = ['/suite-ai', '/design-system/templates/suite-ai', '/design-system/templates/home-suite-ai']

function tieneAmbiente(pathname: string) {
  return !SIN_AMBIENTE.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`))
}

// Brillo azul que corona todas las pantallas del Workspace, para que se sientan de la misma familia («degradado
// azul» de la revisión del 11 sep; transversal desde el 18 sep). Va en el marco, pegado al header y a todo el ancho,
// por debajo de todo: así también se ve en las pantallas que todavía son un slot, cuyo rayado es semitransparente.
//
// Desde el 13 oct es un degradado lineal por código (Carlos), el mismo del login a menor intensidad: 208°, el azul
// del tema arriba a la derecha que se apaga hacia abajo a la izquierda, y una máscara que lo desvanece hacia abajo
// para que no termine en corte. Antes era la imagen ambiente-azul.png al 25 %; sale de los tokens, así que sigue al
// tema en claro y en oscuro.
//
// Intensidad (21 sep, «mira cómo ataca la pantalla de feo, no deja ver nada»): el velo no puede llegar a media
// pantalla ni comerse el título. Por eso arranca en primary/14 —el login usa /20 porque no tiene nada arriba— y
// muere antes del primer bloque. Se mide leyendo el píxel a la derecha del título, no a ojo:
//   magick captura.png -crop 1x1+900+120 -format "%[pixel:p{0,0}]" info:
export function PageAmbience() {
  const { pathname } = useLocation()
  if (!tieneAmbiente(pathname)) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-linear-208 from-primary/14 via-primary/5 via-30% to-transparent to-60% mask-b-from-35%"
    />
  )
}
