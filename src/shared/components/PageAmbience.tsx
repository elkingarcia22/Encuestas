import { useLocation } from 'react-router'
import ambienteAzul from '@/shared/assets/ambiente-azul.png'

// Suite AI tiene su propio ambiente (el degradado de marca del orbe y de «Nueva conversación»), así que el azul
// del Workspace no entra ahí: serían dos ambientes peleando. Vale tanto para el producto como para sus plantillas.
const SIN_AMBIENTE = ['/suite-ai', '/design-system/templates/suite-ai', '/design-system/templates/home-suite-ai']

function tieneAmbiente(pathname: string) {
  return !SIN_AMBIENTE.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`))
}

// Brillo azul difuminado que corona todas las pantallas del Workspace, para que se sientan de la misma familia
// («degradado azul» de la revisión del 11 sep; transversal desde el 18 sep). Va en el marco, pegado al header y a
// todo el ancho, por debajo de todo: así también se ve en las pantallas que todavía son un slot, cuyo rayado es
// semitransparente. Es una imagen, para no escribir colores sueltos.
// La imagen está recortada para que ARRANQUE en su punto más brillante y se desvanezca hacia abajo (18 sep). La
// original tenía el brillo a media altura, así que al estirarla el resplandor se iba hacia el centro de la pantalla
// en vez de quedarse pegado al header, que es donde Nicolás lo quiere. Se estira sin `object-fit`: es un degradado.
//
// Intensidad (21 sep, «mira cómo ataca la pantalla de feo, no deja ver nada»): **22rem, 25 % en claro y 30 % en
// oscuro**. Antes eran 32rem al 70 % y 85 %, que medido daba 31 puntos de separación contra el blanco y **75 contra
// el negro**: el velo llegaba a media pantalla y se comía el contenido. Ahora son 11 y 26, y muere antes del primer
// bloque. Se mide leyendo el píxel a la derecha del título, no a ojo:
//   magick captura.png -crop 1x1+900+120 -format "%[pixel:p{0,0}]" info:
export function PageAmbience() {
  const { pathname } = useLocation()
  if (!tieneAmbiente(pathname)) return null

  return (
    <img
      src={ambienteAzul}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[22rem] w-full opacity-25 select-none dark:opacity-30"
    />
  )
}
