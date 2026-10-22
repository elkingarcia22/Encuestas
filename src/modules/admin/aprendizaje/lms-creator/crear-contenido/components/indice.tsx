import { Fragment, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  Edit02Icon,
  EyeOffIcon,
  InformationCircleIcon,
  MoreVerticalIcon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconTile,
  Input,
  Item,
  ItemActions,
  ItemMedia,
  Separator,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { faltanPreguntas, nombreRecurso, seccionesVisibles, type Borrador, type Pagina, type Seccion } from './borrador'
import { ArrastrePaginas, MarcaDeSoltar, useArrastrePaginas } from './arrastre-paginas'
import {
  cerrarNombrePagina,
  editarSeccion,
  moverPagina,
  moverSeccion,
  puedeMover,
  renombrarPagina,
  soltarPaginaEn,
} from './operaciones'
import { ICONO_PAGINA_VACIA, ICONO_RECURSO } from './tipos-recurso'

// Índice editable del paso 2 · Recursos: las secciones con su menú y, dentro, las páginas (el interruptor de secciones va
// en la cabecera de la tarjeta). Cada página dice qué recurso tiene; tocarla abre su hoja lateral «Editar página». Se
// reordenan arrastrando —también de una sección a otra— o con «Mover arriba/abajo». No nacen vacías
// desde aquí: «Agregar página» abre el selector de tipo.

type Props = {
  borrador: Borrador
  /** La página que se está editando en la hoja lateral: va marcada en la lista. */
  paginaAbierta: string | null
  errores: { paginas: Set<string>; secciones: Set<string> }
  onActivar: (id: string) => void
  onAnadirPagina: (seccionId: string) => void
  onAnadirSeccion: () => void
  onEditarSeccion: (seccion: Seccion) => void
  onEliminarSeccion: (seccion: Seccion) => void
  onEliminarPagina: (pagina: Pagina) => void
}

export function Indice(props: Props) {
  const { borrador, onAnadirSeccion } = props
  const secciones = seccionesVisibles(borrador)

  // El interruptor de secciones ya no va aquí: vive en la cabecera del índice del editor («Usar secciones»).
  return (
    <ArrastrePaginas secciones={secciones} onSoltar={soltarPaginaEn}>
      {/* **Una línea entre secciones, no una caja por sección** (Carlos, 13-oct). Aquí ya hay cajas de sobra: la
          gris del índice, la blanca que lo envuelve y la de cada página. Una más por sección convertía la columna en
          cajas dentro de cajas dentro de cajas. Así queda como en la vista del colaborador, donde una sección es un
          título con sus páginas debajo. No es un acordeón: el editor necesita verlas todas abiertas. */}
      {secciones.map((seccion, i) => (
        <Fragment key={seccion.id}>
          {i > 0 && borrador.seccionesHabilitadas ? <Separator className="my-1" /> : null}
          <BloqueSeccion {...props} seccion={seccion} indice={i} total={secciones.length} conTitulo={borrador.seccionesHabilitadas} />
        </Fragment>
      ))}

      {borrador.seccionesHabilitadas ? (
        <Button variant="outline" onClick={onAnadirSeccion}>
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Agregar sección
        </Button>
      ) : null}
    </ArrastrePaginas>
  )
}

function BloqueSeccion({
  seccion,
  indice,
  total,
  conTitulo,
  borrador,
  paginaAbierta,
  errores,
  onActivar,
  onAnadirPagina,
  onEditarSeccion,
  onEliminarSeccion,
  onEliminarPagina,
}: Props & { seccion: Seccion; indice: number; total: number; conTitulo: boolean }) {
  const arrastre = useArrastrePaginas()
  const [renombrando, setRenombrando] = useState(false)
  const [nombre, setNombre] = useState(seccion.titulo)
  const clic = useRef<number | null>(null)
  const conError = errores.secciones.has(seccion.id)
  const activa = seccion.paginas.some((p) => p.id === paginaAbierta)

  const guardarNombre = () => {
    const limpio = nombre.trim()
    if (limpio.length >= 2 && limpio !== seccion.titulo) editarSeccion(seccion.id, limpio)
    else setNombre(seccion.titulo)
    setRenombrando(false)
  }

  return (
    // Con secciones, la que tiene la página abierta lleva el borde azul (como en el prototipo); el error manda sobre él.
    <div
      data-seccion={seccion.id}
      className="relative flex flex-col gap-1"
      aria-current={activa ? 'true' : undefined}
    >
      <div className="flex flex-col gap-1">
        {conTitulo ? (
          <div className="flex min-h-8 items-center gap-1 pb-1">
            {renombrando ? (
              <Input
                autoFocus
                size={1}
                maxLength={60}
                aria-label="Nombre de la sección"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={guardarNombre}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarNombre()
                  if (e.key === 'Escape') {
                    setNombre(seccion.titulo)
                    setRenombrando(false)
                  }
                }}
                className="h-8 flex-1 px-1!"
              />
            ) : (
              <>
                {/* Un clic marca la sección; doble clic abre «Editar sección». */}
                <Text
                  as="span"
                  weight="semibold"
                  /* Sin la caja alrededor, lo que avisa del problema es el propio título; el texto de debajo lo
                     explica. La sección **abierta** ya no se marca: la página que lo está lleva su barra azul, que
                     dice dónde estás con más precisión que un borde alrededor de toda la sección (Carlos, 13-oct). */
                  className={cn('min-w-0 flex-1 cursor-default truncate', conError && 'text-destructive')}
                  onDoubleClick={() => {
                    if (clic.current) window.clearTimeout(clic.current)
                    onEditarSeccion(seccion)
                  }}
                >
                  {seccion.titulo}
                </Text>
                <Hint label="Cambiar nombre">
                  <BotonIcono
                    size="icon-xs"
                    aria-label="Cambiar nombre"
                    onClick={() => {
                      setNombre(seccion.titulo)
                      setRenombrando(true)
                    }}
                  >
                    <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
                  </BotonIcono>
                </Hint>
                {seccion.descripcion.replace(/<[^>]+>/g, '').trim() ? (
                  <Hint label="Sección con descripción">
                    <BotonIcono size="icon-xs" aria-label="Sección con descripción" onClick={() => onEditarSeccion(seccion)}>
                      <HugeiconsIcon icon={InformationCircleIcon} size={14} />
                    </BotonIcono>
                  </Hint>
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label="Opciones de la sección" />}>
                    <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => onEditarSeccion(seccion)}>
                        <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
                        Editar sección
                      </DropdownMenuItem>
                      {indice > 0 ? (
                        <DropdownMenuItem onClick={() => moverSeccion(seccion.id, -1)}>
                          <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
                          Mover arriba
                        </DropdownMenuItem>
                      ) : null}
                      {indice < total - 1 ? (
                        <DropdownMenuItem onClick={() => moverSeccion(seccion.id, 1)}>
                          <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                          Mover abajo
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onEliminarSeccion(seccion)}>
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                      Eliminar sección
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        ) : null}

        <div
          className="flex flex-col gap-1.5"
          role="list"
          aria-label={conTitulo ? `Páginas de ${seccion.titulo}` : 'Páginas del contenido'}
        >
          {/* El recuadro punteado se cuenta sobre las páginas **sin** la que se arrastra: es donde va a quedar. */}
          {seccion.paginas
            .filter((pg) => pg.id !== arrastre.estado?.paginaId)
            .map((pagina, i) => (
              <Fragment key={pagina.id}>
                {arrastre.marcaEn(seccion.id, i) ? <MarcaDeSoltar alto={arrastre.alto} /> : null}
                <FilaPagina
                  pagina={pagina}
                  activa={pagina.id === paginaAbierta}
                  conError={errores.paginas.has(pagina.id)}
                  progreso={borrador.trabajos.find((t) => t.paginaId === pagina.id && t.estado === 'cargando')?.progreso}
                  onActivar={onActivar}
                  onEliminar={onEliminarPagina}
                />
              </Fragment>
            ))}
          {arrastre.marcaEn(seccion.id, seccion.paginas.filter((pg) => pg.id !== arrastre.estado?.paginaId).length) ? (
            <MarcaDeSoltar alto={arrastre.alto} />
          ) : null}
        </div>

        {conTitulo && conError ? (
          <Text as="p" size="xs" className="px-1 text-destructive">
            Sección vacía: agrega al menos una página.
          </Text>
        ) : null}

        {/* Secundario y a todo el ancho de su caja, con o sin secciones: es la puerta de entrada del índice y siempre se
            ve igual, no un enlace suelto que cambia de forma según el modo. */}
        <Button variant="outline" onClick={() => onAnadirPagina(seccion.id)}>
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Agregar página
        </Button>
      </div>
    </div>
  )
}

function FilaPagina({
  pagina,
  activa,
  conError,
  progreso,
  onActivar,
  onEliminar,
}: {
  pagina: Pagina
  activa: boolean
  conError: boolean
  /** Generación en segundo plano (video o presentación con IA), de 0 a 100. */
  progreso?: number
  onActivar: (id: string) => void
  onEliminar: (p: Pagina) => void
}) {
  const arrastre = useArrastrePaginas()
  const alzada = arrastre.estado?.paginaId === pagina.id
  const [renombrando, setRenombrando] = useState(false)
  const [nombre, setNombre] = useState(pagina.titulo)
  const [mover, setMover] = useState({ arriba: false, abajo: false })
  const temporizador = useRef<number | null>(null)
  const icono = pagina.recurso ? ICONO_RECURSO[pagina.recurso.tipo] : ICONO_PAGINA_VACIA

  useEffect(() => {
    if (!renombrando) setNombre(pagina.titulo)
  }, [pagina.titulo, renombrando])

  useEffect(() => () => {
    if (temporizador.current) window.clearTimeout(temporizador.current)
  }, [])

  // La activación espera 300 ms para distinguir el doble clic que renombra.
  const clic = () => {
    if (temporizador.current) window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => onActivar(pagina.id), 300)
  }

  const cerrar = (guardar: boolean) => {
    if (guardar) cerrarNombrePagina(pagina.id)
    else renombrarPagina(pagina.id, nombre)
    setRenombrando(false)
  }

  const tipo = pagina.recurso ? nombreRecurso(pagina.recurso) : 'Sin recurso'
  const sinPreguntas = faltanPreguntas(pagina)
  const detalle = pagina.recurso?.generando
    ? `Generando${progreso != null ? ` ${progreso.toLocaleString('es-CO')} %` : '…'}`
    : conError && !pagina.titulo.trim()
      ? 'Falta el título'
      : // Sin el tipo delante: la fila es angosta y «Evaluación · Agrega al menos…» se cortaba justo en lo que hay que
        // hacer. El tipo ya lo dice el icono de la fila.
        sinPreguntas
        ? 'Agrega al menos una pregunta'
        : tipo

  const etiqueta = `Editar página ${pagina.titulo.trim() || '(sin título)'}${pagina.oculta ? ' (oculta)' : ''}`

  return (
    <div
      data-pagina={pagina.id}
      role="listitem"
      // La que se arrastra se colapsa y deja de ocupar sitio, como en el Creator de producción: la que se ve es el
      // clon que va con el cursor, y así ninguna otra fila se desplaza cruzando de una tarjeta a otra.
      className={cn('group/fila', pagina.oculta && 'opacity-70', alzada && 'hidden')}
    >
      <Item
        size="xs"
        variant="outline"
        className={cn(
          'min-h-12 flex-nowrap gap-2 px-1.5 py-1',
          // La que se está viendo al lado: el mismo borde que las demás y un filo azul a la izquierda, para reconocerla
          // de un vistazo en una lista larga sin que cambie de forma.
          // La que se está viendo al lado se marca como en la barra lateral: una pastilla corta pegada al borde
          // izquierdo, no un borde grueso de arriba abajo. Misma medida que allá (3px de ancho, 20 de alto).
          activa
            // La marca de la izquierda: **36 px, fija**, los mismos que mide la de las escenas en el editor de video.
            // Allá la regla es «8 px de aire arriba y abajo», pero todas las tarjetas de escena miden 55, así que el
            // resultado siempre es el mismo. Aquí las filas miden 62 u 82 según si el título ocupa uno o dos
            // renglones, y esa misma regla daba marcas de 46 y de 66: la de dos renglones se veía más grande sin que
            // eso significara nada. La marca dice «estás aquí», no cuánto mide la tarjeta (Dave, 6-oct).
            ? 'relative bg-muted before:absolute before:top-1/2 before:left-0 before:h-9 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-primary'
            : 'bg-card',
          !renombrando && 'cursor-pointer transition-colors hover:bg-muted/50',
          conError && 'ring-2 ring-destructive',
        )}
        // Toda la tarjeta abre la vista previa de la página; el asa y el menú tienen su propia acción.
        onClick={renombrando ? undefined : clic}
      >
        <span
          aria-label="Arrastrar para reordenar"
          role="button"
          tabIndex={-1}
          className="flex shrink-0 cursor-grab touch-none items-center text-muted-foreground"
          onPointerDown={(e) => arrastre.empezar(e, pagina.id)}
          onClick={(e) => e.stopPropagation()}
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
        </span>
        <ItemMedia>
          {/* En azul solo la página activa: `soft` pinta siempre la baldosa y el icono con el primario, y con
              todas azules el color dejaba de señalar cuál se está editando (Dave, 6-oct). */}
          <IconTile variant="soft" size="sm" className={cn(!activa && 'bg-muted! text-muted-foreground!')}>
            <HugeiconsIcon icon={icono} aria-hidden="true" />
          </IconTile>
        </ItemMedia>
        {renombrando ? (
          <Input
            autoFocus
            size={1}
            placeholder="Escribe el título de la página"
            aria-label="Título de la página"
            value={pagina.titulo}
            onChange={(e) => renombrarPagina(pagina.id, e.target.value)}
            onBlur={() => cerrar(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') cerrar(true)
              if (e.key === 'Escape') cerrar(false)
            }}
            // Mismo relleno lateral que el nombre y que su línea de abajo (px-1): con el del campo por defecto,
            // al renombrar el título se corría a la derecha y quedaba desalineado con su detalle.
            className="h-8 flex-1 px-1!"
          />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={etiqueta}
              aria-current={activa ? 'page' : undefined}
              // En la columna del índice el nombre no cabe de una línea, y cortarlo a «Comunic…» no distingue una página de
              // otra: se deja subir a dos renglones antes de recortar.
              // `px-1!` con el signo: el relleno propio del botón le gana al `px-1` normal y dejaba el título 7px a la
              // derecha de su línea de detalle.
              className="h-auto! min-w-0 justify-start gap-2 overflow-hidden px-1! py-1 text-left whitespace-normal"
              // El clic lo recibe la tarjeta; el doble clic sobre el nombre lo renombra.
              onDoubleClick={() => {
                if (temporizador.current) window.clearTimeout(temporizador.current)
                setNombre(pagina.titulo)
                setRenombrando(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onActivar(pagina.id)
                }
              }}
            >
              <Text
                as="span"
                size="sm"
                variant={pagina.titulo.trim() ? undefined : 'muted'}
                weight={activa ? 'semibold' : 'medium'}
                className="line-clamp-2 min-w-0"
              >
                {pagina.titulo.trim() || 'Sin título'}
              </Text>
              {pagina.oculta ? (
                <Badge variant="secondary" size="xs" className="shrink-0 gap-1" aria-label="Oculta">
                  <HugeiconsIcon icon={EyeOffIcon} size={11} aria-hidden="true" />
                  Oculta
                </Badge>
              ) : null}
            </Button>
            {/* Qué recurso es, o en qué va su generación; con un problema, qué le falta. */}
            <Text as="span" size="xs" variant={conError ? undefined : 'muted'} className={cn('-mt-1 truncate px-1 pb-0.5', conError && 'text-destructive')}>
              {detalle}
            </Text>
          </div>
        )}
        {!renombrando ? (
          <>
            {/* La marca de que el recurso se generó con IA. Va aquí, junto al menú, y no pegada al nombre: ahí se leía
                como parte del título y, cuando el nombre ocupa dos renglones, el conjunto se percibía desalineado.
                A diferencia del menú no se esconde —es un dato de la página, no una acción— y el globo explica qué
                significa para que no se lea como un error. */}
            {pagina.recurso?.generadoConIA && !pagina.recurso.generando ? (
              <Hint label="El recurso principal de esta página se generó con IA">
                <span
                  role="img"
                  aria-label="El recurso principal de esta página se generó con IA"
                  className="flex shrink-0 items-center px-1"
                >
                  <IconoIA />
                </span>
              </Hint>
            ) : null}
            <ItemActions
              className="shrink-0 gap-0 opacity-100 sm:opacity-0 sm:group-focus-within/fila:opacity-100 sm:group-hover/fila:opacity-100"
              // También frena los clics del menú: aunque se pinta aparte, su clic sube por aquí hasta la tarjeta.
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu onOpenChange={(abierto) => abierto && setMover(puedeMover(pagina.id))}>
                <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label="Opciones" />}>
                  <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onActivar(pagina.id)}>
                      <HugeiconsIcon icon={Edit02Icon} size={16} />
                      Editar página
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setNombre(pagina.titulo)
                        setRenombrando(true)
                      }}
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
                      Cambiar nombre
                    </DropdownMenuItem>
                    {mover.arriba ? (
                      <DropdownMenuItem onClick={() => moverPagina(pagina.id, -1)}>
                        <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
                        Mover arriba
                      </DropdownMenuItem>
                    ) : null}
                    {mover.abajo ? (
                      <DropdownMenuItem onClick={() => moverPagina(pagina.id, 1)}>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                        Mover abajo
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onEliminar(pagina)}>
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                    Eliminar página
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          </>
        ) : null}
      </Item>
    </div>
  )
}
