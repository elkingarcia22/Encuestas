import { useMemo } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AppleIcon,
  Calendar03Icon,
  CalendarAdd01Icon,
  Download04Icon,
  GoogleIcon,
  Mail01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FramePanel,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconTile,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { Hint } from '@/shared/components/Hint'
import { CajaCarrusel } from './carrusel'
import { descargarIcs, enlaceCalendario, horario, mesCorto, PROVEEDOR_EVENTO, proximasSesiones, type Sesion } from './datos'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'

// Pestaña Eventos (HU-APR-011): las sesiones que vienen, en «Mis eventos» y «Eventos públicos». Es de solo lectura:
// asistir y confirmar pasan en la experiencia de estudio. Cada sesión futura se puede añadir al calendario.

/** Los calendarios a los que se puede añadir una sesión. También los usa la tarjeta de una sesión de asistencia (HU-APR-009). */
export function opcionesCalendario(sesion: Sesion): {
  etiqueta: string
  icono: IconSvgElement
  accion: () => void
}[] {
  return [
    {
      etiqueta: 'Google Calendar',
      icono: GoogleIcon,
      accion: () => window.open(enlaceCalendario(sesion, 'google'), '_blank', 'noopener,noreferrer'),
    },
    {
      etiqueta: 'Outlook',
      icono: Mail01Icon,
      accion: () => window.open(enlaceCalendario(sesion, 'outlook'), '_blank', 'noopener,noreferrer'),
    },
    {
      etiqueta: 'Apple Calendar',
      icono: AppleIcon,
      accion: () => descargarIcs(sesion),
    },
    {
      etiqueta: 'Otro calendario (.ics)',
      icono: Download04Icon,
      accion: () => descargarIcs(sesion),
    },
  ]
}

function AnadirCalendario({ sesion }: { sesion: Sesion }) {
  const opciones = opcionesCalendario(sesion)
  return (
    <DropdownMenu>
      <Hint label="Agregar a mi calendario">
        {/* El secundario de solo icono (`outline`), no el terciario: el ghost es transparente y sobre la foto no se
            lee, y pintarle fondo con `!` es repintar un componente oficial (Dave, 2-oct). */}
        <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="Agregar a mi calendario" />}>
          <HugeiconsIcon icon={CalendarAdd01Icon} size={14} />
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          {opciones.map((o) => (
            <DropdownMenuItem key={o.etiqueta} onClick={o.accion}>
              <HugeiconsIcon icon={o.icono} size={16} />
              {o.etiqueta}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TarjetaSesion({ sesion }: { sesion: Sesion }) {
  return (
    // La misma tarjeta del catálogo, no una copia. Lo único propio de una sesión son las dos esquinas de la portada
    // —la fecha y el «En vivo»— y para eso están las ranuras `encimaIzquierda` y `encimaDerecha`. Antes esto era un
    // componente aparte, y en un solo día se le quedaron atrás cuatro cosas: el tamaño del título, el trato del logo,
    // el relleno y el alto de la primera fila (Dave, 2-oct).
    <TarjetaContenido
      titulo={sesion.titulo}
      imagen={sesion.imagen}
      tipo="Sesión"
      proveedor={PROVEEDOR_EVENTO.nombre}
      logoProveedor={PROVEEDOR_EVENTO.logo}
      // De qué evento cuelga la sesión y a qué hora es: ocupan los huecos de la competencia y la duración.
      //
      // Con el icono de etiqueta se leía como una categoría, y no lo es: una sesión vive dentro de **un contenido de
      // tipo Evento**, así que lleva el icono de ese tipo —el calendario— igual que en la lista de Contenidos
      // (Dave, 2-oct).
      competencia={sesion.evento}
      competenciaIcono={Calendar03Icon}
      duracion={horario(sesion)}
      className="h-full"
      encimaIzquierda={
        <div className="flex min-w-14 flex-col items-center rounded-md border bg-card px-2 py-1">
          <Text as="span" size="sm" weight="semibold" className="leading-tight">
            {sesion.inicio.getDate()}
          </Text>
          <Text as="span" size="xs" variant="muted" className="leading-tight">
            {mesCorto(sesion.inicio)}
          </Text>
        </div>
      }
      encimaDerecha={
        sesion.enVivo ? (
          // «Badge with a status dot» del Storybook de la librería: no es una variante con prop, es la insignia con un
          // punto dentro, y el punto hereda el color del texto. De paso sale del contorno verde, que no llega al
          // contraste mínimo.
          //
          // Dos cosas del ejemplo publicado **no** se copian, porque está hecho a tamaño normal y aquí el badge es
          // `xs`: el `ms-0.25`, que empujaba el punto a 6 px del borde cuando el texto acaba a 5 del otro lado, y el
          // espacio suelto antes del texto, que se sumaba a los 4 px de separación que el propio badge ya pone. A
          // tamaño normal no se ven; en `xs` el punto quedaba descuadrado (Dave, 2-oct).
          <span className="inline-flex rounded-sm bg-card">
            <Badge variant="success-light" size="xs">
              <span className="size-1.25 rounded-full! bg-[currentColor]" />
              En vivo
            </Badge>
          </span>
        ) : (
          <AnadirCalendario sesion={sesion} />
        )
      }
    />
  )
}

function Seccion({ titulo, icono, sesiones }: { titulo: string; icono: IconSvgElement; sesiones: Sesion[] }) {
  if (!sesiones.length) return null
  return (
    <CajaCarrusel
      etiqueta={titulo}
      titulo={titulo}
      descripcion={sesiones.length === 1 ? '1 evento' : `${sesiones.length} eventos`}
      icono={
        <IconTile variant="soft" size="lg" className="text-info">
          <HugeiconsIcon icon={icono} aria-hidden="true" />
        </IconTile>
      }
      items={sesiones.map((s) => ({
        clave: s.clave,
        nodo: <TarjetaSesion sesion={s} />,
      }))}
    />
  )
}

export function PestanaEventos({ sinEventos }: { sinEventos: boolean }) {
  // La hora se toma al entrar a la pestaña, como en el prototipo.
  const { mis, publicos } = useMemo(() => (sinEventos ? { mis: [], publicos: [] } : proximasSesiones()), [sinEventos])

  if (!mis.length && !publicos.length)
    return (
      <Frame>
        <FramePanel>
        <PrimeraVez
          icono="glass-calendar"
          titulo="Todavía no tienes eventos"
          descripcion="Aquí van a aparecer las formaciones en vivo o en sitio a las que te inscriban, con su fecha y su hora."
        />
        </FramePanel>
      </Frame>
    )

  return (
    <div className="flex flex-col gap-6">
      <Seccion titulo="Mis eventos" icono={Calendar03Icon} sesiones={mis} />
      <Seccion titulo="Eventos públicos" icono={UserGroupIcon} sesiones={publicos} />
    </div>
  )
}
