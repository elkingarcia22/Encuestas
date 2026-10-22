import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Clock01Icon,
  GlobalIcon,
  Download01Icon,
  Mortarboard01Icon,
  SignalFull01Icon,
  SignalLow01Icon,
  SignalMedium01Icon,
  Tag01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  Checkbox,
  CardContent,
  Heading,
  Progress,
  Text,
  cn,
} from '@ubits/flux-ui'

// Tarjeta de contenido: la ficha de un curso, ruta, evento o podcast en un catálogo.
//
// Sale de la tarjeta con imagen de la librería y **no la reemplaza**: el Card, el Badge, el Avatar,
// el Progress y el Text son los de flux-ui, sin tocar su apariencia. Lo propio es la composición.
//
// Qué cambia frente a la tarjeta con imagen de la librería:
//   · la imagen respira dentro de la tarjeta en vez de ir de borde a borde, con las medidas de la tarjeta
//     del tour de la barra lateral (InviteCard): 6 px de aire alrededor, esquina de 10 px
//     concéntrica con la de la tarjeta, y el texto con 16 px a los lados, 14 px arriba y 16 px abajo;
//   · encima de la imagen van la visibilidad y, si el contenido está empezado, su avance;
//   · debajo, el orden de campos del catálogo: tipo → título → proveedor → competencia → ficha técnica.
//
// El orden de los campos es el del catálogo de UBITS, para que la ficha se lea igual en todos los
// productos. El estilo es el de la librería.

export type TarjetaContenidoProps = {
  titulo: string
  imagen?: string
  tipo?: string
  /** Estado en el LMS: Publicado, Borrador, Privado, Oculto, Archivado. */
  visibilidad?: string
  visibilidadColor?: 'secondary' | 'success-light' | 'info-light' | 'warning-light' | 'outline'
  /**
   * De dónde viene el contenido, cuando no se creó aquí: «Antiguo LMS» para lo migrado. Cambia lo que se puede
   * hacer con él —en el LMS de hoy su menú ofrece Restaurar e Informes en vez de las acciones normales—, por eso
   * se marca en la propia tarjeta y no solo en el detalle.
   */
  origen?: string
  proveedor?: string
  logoProveedor?: string
  competencia?: string
  /**
   * El icono de esa línea. Por defecto la etiqueta, porque en un catálogo ahí va la competencia. No siempre es una
   * competencia: en la tarjeta de una sesión ahí va **el evento del que cuelga**, que es un contenido de tipo Evento,
   * y con la etiqueta se leía como si fuera una categoría (Dave, 2-oct).
   */
  competenciaIcono?: IconSvgElement
  nivel?: string
  duracion?: string
  idioma?: string
  /** 0–100. Solo se dibuja si el contenido ya se empezó. */
  progreso?: number
  /**
   * Cómo va el colaborador con este contenido, dicho con palabras al lado del tipo: «En progreso» en azul o
   * «Completado» en verde. Es de las vistas del colaborador —catálogo, zona de estudio, historial—; en LMS Creator no
   * se pasa, porque ahí lo que importa es la visibilidad y no el avance de nadie (Dave, 2-oct).
   */
  estado?: 'en-progreso' | 'completado'
  /**
   * Descargar el certificado, en un botón de solo icono sobre la portada. Solo lo pasa el historial de la zona de
   * estudio, y solo en cursos completados que entregan certificado.
   */
  onDescargarCertificado?: () => void
  /**
   * Qué se pinta en el hueco de la imagen mientras no hay portada. Por defecto, el icono de contenido; quien
   * previsualiza algo a medio hacer (el paso 1 de Crear contenido) manda su propia ilustración.
   */
  sinImagen?: ReactNode
  /**
   * Lo que se pinta **encima de la portada**, dentro de su recuadro: hoy, el play del tráiler en la vista previa del
   * paso 1. Es una capa absoluta; la tarjeta no sabe qué lleva dentro.
   */
  sobrePortada?: ReactNode
  /**
   * Solo acostada: el asidero de arrastre, a la izquierda del todo y pegado al borde de la tarjeta. Lo pasa quien
   * pone la tarjeta en una lista que se reordena arrastrando.
   */
  asa?: ReactNode
  /**
   * Solo acostada: en qué puesto va dentro de la lista. Va junto al asidero, antes de la portada.
   */
  posicion?: number
  /**
   * **De pie** (por defecto) para cuadrículas; **acostada** para listas: el índice de una ruta, el catálogo en modo
   * lista o la pantalla donde se eligen los contenidos que entran en una ruta.
   *
   * Es una orientación del mismo componente y no una tarjeta aparte **a propósito**: cuando la de eventos era un
   * componente separado, en un solo día se le quedaron atrás cuatro cosas —el tamaño del título, el trato del logo,
   * el relleno y el alto de la primera fila—. Las dos formas reciben las mismas props, así que cambiar de forma es
   * cambiar una palabra (Dave, 2-oct).
   */
  orientacion?: 'vertical' | 'horizontal'
  /** Solo acostada: la lista donde se marcan varios contenidos para meterlos en una ruta o en un plan. */
  seleccionable?: boolean
  seleccionado?: boolean
  onSeleccionar?: (valor: boolean) => void
  /** Menú de opciones u otra acción, arriba a la derecha. */
  acciones?: ReactNode
  /**
   * Las dos esquinas de la portada, como huecos. Por defecto las llenan `visibilidad` (izquierda) y `origen` o la
   * descarga del certificado (derecha), que es lo que necesita un catálogo. Quien necesite otra cosa las reemplaza:
   * la tarjeta de una sesión pone ahí la fecha y el «En vivo».
   *
   * Existen porque esas dos esquinas estaban atadas a props concretas, y por eso la tarjeta de eventos **no pudo
   * reusar este componente y acabó siendo una copia** que se fue quedando atrás —el tamaño del título, el logo, el
   * relleno y el alto de la primera fila, todo desfasado en un día de trabajo— (Dave, 2-oct).
   */
  encimaIzquierda?: ReactNode
  encimaDerecha?: ReactNode
  onClick?: () => void
  className?: string
}

// El nivel se reconoce por su ícono, el mismo de la ficha técnica en Crear contenido: señal baja, media o completa.
const ICONO_NIVEL: Record<string, IconSvgElement> = {
  básico: SignalLow01Icon,
  intermedio: SignalMedium01Icon,
  avanzado: SignalFull01Icon,
}
const iconoNivel = (nivel: string) => ICONO_NIVEL[nivel.trim().toLowerCase()] ?? SignalMedium01Icon

// Ficha técnica: cada dato con su icono, en una sola fila que envuelve si no cabe.
/**
 * La ficha de la tarjeta va **abreviada**: «1 hora» → «1 h», «30 minutos» → «30 m», «Español» → «ES». En una
 * cuadrícula esos tres datos comparten un solo renglón, y escritos enteros se comían el sitio del que de verdad
 * importa —el título— o partían la línea. Se abrevia aquí, en la tarjeta, y no en quien la usa: así vale para
 * todas y nadie tiene que acordarse (Dave, 6-oct).
 *
 * Lo que no reconoce se deja tal cual: el horario de un evento («9:00 a 11:00») pasa de largo.
 */
function abreviarDuracion(texto: string) {
  return texto
    .replace(/\s*\bhoras?\b/gi, ' h')
    .replace(/\s*\b(?:minutos?|mins?)\b/gi, ' m')
    .replace(/\s+/g, ' ')
    .trim()
}

const IDIOMA_ABREVIADO: Record<string, string> = {
  español: 'ES',
  espanol: 'ES',
  inglés: 'EN',
  ingles: 'EN',
  portugués: 'PT',
  portugues: 'PT',
  francés: 'FR',
  frances: 'FR',
}

function abreviarIdioma(texto: string) {
  return IDIOMA_ABREVIADO[texto.trim().toLowerCase()] ?? texto
}

function Dato({ icono, children }: { icono: IconSvgElement; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <HugeiconsIcon icon={icono} size={14} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

export function TarjetaContenido(props: TarjetaContenidoProps) {
  return props.orientacion === 'horizontal' ? <Acostada {...props} /> : <DePie {...props} />
}

/** De pie: para cuadrículas. La portada arriba, en 16:9, y la ficha debajo. */
function DePie({
  titulo,
  imagen,
  tipo,
  visibilidad,
  visibilidadColor = 'secondary',
  origen,
  proveedor,
  logoProveedor,
  competencia,
  competenciaIcono,
  nivel,
  duracion,
  idioma,
  progreso,
  estado,
  onDescargarCertificado,
  sinImagen,
  sobrePortada,
  acciones,
  encimaIzquierda,
  encimaDerecha,
  onClick,
  className,
}: TarjetaContenidoProps) {
  const avance = progreso ?? 0
  const empezado = avance > 0

  return (
    <Card
      size="sm"
      // Al pasar por encima (solo si se abre): el borde se pone azul y la foto crece un poco, como en el prototipo.
      className={cn('gap-0! overflow-hidden py-0!', onClick && 'cursor-pointer transition-shadow hover:ring-primary focus-visible:ring-primary', className)}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* La imagen no llega a los bordes: 6 px de aire y esquina de 10 px, como la ilustración de InviteCard. */}
      <div className="relative m-1.5 mb-0 overflow-hidden rounded-lg bg-muted">
        <div className="aspect-video w-full">
          {imagen ? (
            <img src={imagen} alt="" className={cn('size-full object-cover', onClick && 'transition-transform duration-300 group-hover/card:scale-105')} />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              {sinImagen ?? <HugeiconsIcon icon={Mortarboard01Icon} size={28} aria-hidden="true" />}
            </div>
          )}
        </div>

        {sobrePortada}

        {/* Los colores suaves del Badge son translúcidos: sobre una foto se pierden. Va sobre una base
            del color de la tarjeta, del tamaño exacto del badge (de ahí inline-flex y la esquina sm,
            que es la suya), para que se lea encima de cualquier imagen sin verse como un parche. */}
        {/* `flex` y no un div normal: con display block, un hijo en línea crea una línea de texto con su interlineado
            alrededor y lo empuja ~4,5 px hacia abajo. El badge de la esquina quedaba más caído que el de al lado y no
            había forma de verlo sin medirlo (Dave, 2-oct). */}
        {encimaIzquierda ? (
          <div className="absolute top-2 left-2 flex">{encimaIzquierda}</div>
        ) : visibilidad ? (
          <div className="absolute top-2 left-2 inline-flex rounded-sm bg-card">
            <Badge variant={visibilidadColor} size="xs" className="font-normal">
              {visibilidad}
            </Badge>
          </div>
        ) : null}

        {/* El origen va en la esquina opuesta al estado, como en el LMS de hoy: son dos lecturas distintas —quién lo
            ve y de dónde salió— y enfrentadas no se confunden. Contorno en info, el mismo tratamiento del producto. */}
        {encimaDerecha ? (
          <div className="absolute top-2 right-2 flex" onClick={(event) => event.stopPropagation()}>
            {encimaDerecha}
          </div>
        ) : origen ? (
          <div className="absolute top-2 right-2 inline-flex max-w-[calc(50%-0.75rem)] rounded-sm bg-card">
            <Badge variant="info-outline" size="xs" className="truncate font-normal">
              {origen}
            </Badge>
          </div>
        ) : null}

        {/* El certificado se descarga desde la propia tarjeta, sin entrar al contenido: en el historial la lista es
            larga y entrar a cada curso para bajar su diploma era un viaje. Va sobre la portada, en la esquina que
            queda libre cuando no hay origen. */}
        {onDescargarCertificado ? (
          <div className="absolute top-2 right-2 flex" onClick={(event) => event.stopPropagation()}>
            {/* El secundario de solo icono, que en Design system › Botones es `outline`: trae su propio fondo, así que
                se lee sobre la foto **sin forzarle nada**. El terciario (ghost) es transparente y encima de una imagen
                desaparece, y pintarle fondo con `!` es repintar un componente oficial (Dave, 2-oct). */}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Descargar el certificado de ${titulo}`}
              onClick={onDescargarCertificado}
            >
              <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        {empezado ? (
          <div className="absolute inset-x-0 bottom-0 p-2">
            <Progress
              value={avance}
              aria-label={`Avance de ${titulo}`}
              className="**:data-[slot=progress-track]:h-1.5"
            />
          </div>
        ) : null}
      </div>

      <CardContent className="flex flex-col gap-2 px-4! pt-3.5 pb-4">
        {tipo || estado || acciones ? (
          // El alto de 24 px solo hace falta cuando hay botón de acciones, para que la fila cuadre con él. Sin
          // acciones —la tarjeta de la vista previa del asistente— era espacio muerto que separaba de más el tipo
          // del título.
          <div className={cn('flex items-center justify-between gap-2', acciones && 'min-h-6')}>
            {tipo || estado ? (
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                {tipo ? (
                  <Text as="span" size="xs" className="text-muted-foreground">
                    {tipo}
                  </Text>
                ) : null}
                {/* Cómo va, en palabras y no solo en la barra: la barra dice cuánto y esto dice qué significa. */}
                {estado ? (
                  <Text as="span" size="xs" className={estado === 'completado' ? 'text-success' : 'text-primary'}>
                    {estado === 'completado' ? 'Completado' : 'En progreso'}
                  </Text>
                ) : null}
              </span>
            ) : (
              <span />
            )}
            {/* El clic de las acciones no abre la tarjeta. */}
            {acciones ? <div onClick={(event) => event.stopPropagation()}>{acciones}</div> : null}
          </div>
        ) : null}

        {/* Siempre dos renglones: ni se corta a uno ni crece a tres, así la ficha técnica de todas
            las tarjetas de una cuadrícula queda a la misma altura.
            `text-sm` (14/20) en vez de los 16/24 del `Heading` level 6: a 16 el título pesaba de más dentro de la
            ficha. Sigue siendo un encabezado —el `h3` no cambia—, solo baja un escalón de la escala del tema; nada
            de medidas a mano. El título de InviteCard, que se ve junto a estas tarjetas, va a 15 porque Nicolás se
            lo puso a mano: ese es el que está fuera de escala, no este. */}
        <Heading as="h3" level={6} className="line-clamp-2 min-h-[2lh] text-sm">
          {titulo}
        </Heading>

        {proveedor ? (
          <div className="flex min-w-0 items-center gap-2">
            {/* Un logo no es una cara: el Avatar por defecto es redondo y recorta la imagen para llenarlo
                (`object-cover`), y la marca sale cortada. Se trata igual que en la barra lateral —baldosa cuadrada de
                esquina suave, fondo de la tarjeta y la imagen entera dentro con aire— para que la misma empresa se
                vea igual en los dos sitios (Dave, 2-oct). */}
            <Avatar size="sm" className="size-5 rounded-md bg-background shadow-xs">
              {logoProveedor ? <AvatarImage src={logoProveedor} alt="" className="rounded-none! object-contain! p-[12%]" /> : null}
              <AvatarFallback className="rounded-md text-[10px]">{proveedor.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Text as="span" size="xs" className="truncate text-muted-foreground">
              {proveedor}
            </Text>
          </div>
        ) : null}

        {competencia ? <Dato icono={competenciaIcono ?? Tag01Icon}>{competencia}</Dato> : null}

        {nivel || duracion || idioma ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {nivel ? <Dato icono={iconoNivel(nivel)}>{nivel}</Dato> : null}
            {duracion ? <Dato icono={Clock01Icon}>{abreviarDuracion(duracion)}</Dato> : null}
            {idioma ? <Dato icono={GlobalIcon}>{abreviarIdioma(idioma)}</Dato> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ── Acostada ─────────────────────────────────────────────────────────────────────────────────────────────────────
//
// Para listas: el índice de una ruta —donde lo que hay dentro son contenidos, no páginas—, el catálogo en modo lista
// y la pantalla donde se eligen los contenidos que entran en una ruta o en un plan.
//
// Qué cambia frente a la de pie, y por qué:
//
//  · La portada va a la izquierda y en **4:3**, no en 16:9: horizontal sin ser apaisada. Se probó 3:2 y los 32 px que
//    le quitaba al texto rompían la fila —la etiqueta de origen se caía de renglón y la ficha técnica se cortaba—.
//  · El título va en **un solo renglón**, con puntos suspensivos. Acostada todas las filas tienen que medir lo mismo
//    para que una lista larga se escanee; a dos renglones unas crecían y otras no.
//  · Nivel, duración e idioma van **en una sola línea**, sin envolver.
//  · El estado y las etiquetas no van sobre la portada sino **en una fila encima del título**, con el tipo. Ahí mismo,
//    a la derecha, van el checkbox y el menú: así solo le quitan sitio a esa fila, que es la que va holgada, y no al
//    título ni a la ficha. Moverlos ahí dio 35 px de texto y acabó con los cortes.
//  · Sin proveedor: en una lista la marca repetida en cada fila es ruido.
//  · **No lleva el botón del certificado**, aunque tenga el estado completado: el historial de la zona de estudio,
//    que es donde se baja, va con las tarjetas de pie. Si algún día hace falta aquí, su sitio es la fila del tipo,
//    junto al menú (Dave, 2-oct).
//
// (Dave, 2-oct.)

function Acostada({
  titulo,
  imagen,
  tipo,
  visibilidad,
  visibilidadColor = 'secondary',
  origen,
  nivel,
  duracion,
  idioma,
  progreso,
  estado,
  sinImagen,
  sobrePortada,
  acciones,
  asa,
  posicion,
  seleccionable,
  seleccionado,
  onSeleccionar,
  onClick,
  className,
}: TarjetaContenidoProps) {
  const avance = progreso ?? 0
  const completado = estado === 'completado'
  const barra = completado ? 100 : avance

  return (
    <Card
      size="sm"
      className={cn('@container gap-0! overflow-hidden py-0!', onClick && 'cursor-pointer transition-shadow hover:ring-primary focus-visible:ring-primary', className)}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-stretch gap-0 p-2">
        {/* El asidero y el número del puesto, **dentro** de la tarjeta: en una lista que se reordena, arrastrar y
            saber en qué escalón va son parte de la fila, y sueltos a la izquierda hacían que la tarjeta empezara en
            un sitio distinto al de las demás listas (Dave, 5-oct). */}
        {asa || posicion != null ? (
          <div className="flex shrink-0 items-center gap-1 self-center pr-1 pl-0.5" onClick={(event) => event.stopPropagation()}>
            {asa}
            {/* Centrado en su hueco: alineado a la derecha, un número de un dígito quedaba pegado a la portada y
                dejaba un claro junto al asidero, mientras que uno de dos se veía equilibrado (Dave, 5-oct). */}
            {posicion != null ? (
              <Text as="span" size="xs" variant="muted" className="w-5 text-center tabular-nums">
                {posicion}
              </Text>
            ) : null}
          </div>
        ) : null}
        {/* `self-center`, no `self-stretch`: estirada al alto de la fila la proporción se pierde —la foto salía
            85×88— porque el estiramiento le gana al aspecto. Y no `self-start`: con la ficha de tres líneas el
            contenido mide 68 px y la foto 64, así que alineada arriba quedaba con 8 px encima y 12 debajo. Centrada
            son 10 y 10 (Dave, 2-oct). */}
        <div className="relative aspect-4/3 h-16 shrink-0 self-center overflow-hidden rounded-lg bg-muted">
          {imagen ? (
            <img src={imagen} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              {sinImagen ?? <HugeiconsIcon icon={Mortarboard01Icon} size={20} aria-hidden="true" />}
            </div>
          )}
          {sobrePortada}
          {barra > 0 ? (
            <div className="absolute inset-x-0 bottom-0 p-1.5">
              <Progress value={barra} aria-label={`Avance de ${titulo}`} className="**:data-[slot=progress-track]:h-1.5" />
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-1">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {tipo ? (
                <Text as="span" size="xs" className="text-muted-foreground">
                  {tipo}
                </Text>
              ) : null}
              {estado ? (
                <Text as="span" size="xs" className={completado ? 'text-success' : 'text-primary'}>
                  {completado ? 'Completado' : 'En progreso'}
                </Text>
              ) : null}
              {visibilidad ? (
                <Badge variant={visibilidadColor} size="xs" className="font-normal">
                  {visibilidad}
                </Badge>
              ) : null}
              {origen ? (
                <Badge variant="info-outline" size="xs" className="font-normal">
                  {origen}
                </Badge>
              ) : null}
            </div>
            {seleccionable || acciones ? (
              <div className="ml-auto flex shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
                {acciones}
                {seleccionable ? (
                  <Checkbox checked={seleccionado} onCheckedChange={(valor) => onSeleccionar?.(valor === true)} aria-label={`Seleccionar ${titulo}`} />
                ) : null}
              </div>
            ) : null}
          </div>

          <Heading as="h3" level={6} className="truncate text-sm">
            {titulo}
          </Heading>

          {/* Nivel, duración e idioma en un solo renglón, pase lo que pase: sin envolver y sin truncar. Aquí no va
              la competencia —ni el proveedor—: en una lista ese cuarto dato rompe el renglón y la marca repetida en
              cada fila es ruido. */}
          <div className="flex min-w-0 flex-nowrap items-center gap-x-2.5 overflow-hidden">
            {nivel ? <Dato icono={iconoNivel(nivel)}>{nivel}</Dato> : null}
            {duracion ? <Dato icono={Clock01Icon}>{abreviarDuracion(duracion)}</Dato> : null}
            {idioma ? <Dato icono={GlobalIcon}>{abreviarIdioma(idioma)}</Dato> : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
