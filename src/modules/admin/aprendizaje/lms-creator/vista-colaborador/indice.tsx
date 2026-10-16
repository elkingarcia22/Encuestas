import { useEffect, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Certificate01Icon,
  Flag03Icon,
  Image01Icon,
  InformationCircleIcon,
  ShuffleIcon,
  SortByDown02Icon,
} from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  cn,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  Progress,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { NOMBRE_RECURSO, seccionesVisibles, textoPlano, todasLasPaginas, type Borrador, type Pagina } from '../crear-contenido/components/borrador'
import { ICONO_PAGINA_VACIA, ICONO_RECURSO } from '../crear-contenido/components/tipos-recurso'
import { EstadoPagina, FilaPaginaIndice, type EstadoPaginaIndice } from '../compartido/fila-pagina'

// El índice del contenido como lo ve quien estudia: «Portada» arriba, las secciones con sus páginas en medio y «Fin
// del contenido» abajo, cada una con su estado —en curso, completada, pendiente o bloqueada—.
//
// Es el índice de `legacy-2` (`indice-contenido.tsx`, la rama «Vista del colaborador»), traído tal cual: allá convivía
// con el índice editable en el mismo componente y aquí solo existe el del colaborador (Dave, 5-oct).

export type EstadoColaborador = {
  visitadas: string[]
  accesible: (id: string) => boolean
  cierreAccesible: boolean
  /** Una página de asistencia con una sesión en curso y sin confirmar lleva «En vivo» (HU-APR-009, RN-10). */
  enVivo?: (id: string) => boolean
}

export type Vista = 'portada' | 'pagina' | 'cierre'

type Estado = EstadoPaginaIndice

export function IndiceColaborador({
  borrador,
  vista,
  paginaId,
  colaborador,
  progreso,
  empezado,
  onPortada,
  onCierre,
  onPagina,
}: {
  borrador: Borrador
  vista: Vista
  paginaId: string | null
  colaborador: EstadoColaborador
  /** 0–100: lo que lleva recorrido del contenido. Se pinta en «Información general», y solo si ya empezó. */
  progreso: number
  /** Pulsó «Comenzar ahora». Hasta entonces no hay avance que enseñar: mirar la portada no es empezar el contenido. */
  empezado: boolean
  onPortada: () => void
  onCierre: () => void
  onPagina: (id: string) => void
}) {
  const secciones = seccionesVisibles(borrador)
  // La sección donde está la página en curso nace abierta; lo que el colaborador abra o cierre después manda.
  const seccionDeLaPagina = secciones.find((x) => x.paginas.some((p) => p.id === paginaId))?.id
  const [abiertas, setAbiertas] = useState<string[]>(() => (seccionDeLaPagina ? [seccionDeLaPagina] : []))
  useEffect(() => {
    if (seccionDeLaPagina) setAbiertas((previas) => (previas.includes(seccionDeLaPagina) ? previas : [...previas, seccionDeLaPagina]))
  }, [seccionDeLaPagina])
  // Una página oculta no existe para quien estudia.
  const paginas = todasLasPaginas(borrador).filter((p) => !p.oculta)
  const resumen = !paginas.length
    ? 'Aún no tiene páginas'
    : `${borrador.seccionesHabilitadas ? `${secciones.length} ${secciones.length === 1 ? 'sección' : 'secciones'} · ` : ''}${paginas.length} ${paginas.length === 1 ? 'página' : 'páginas'}`
  const certificado = borrador.certificado.habilitado
  /** La sección cuya descripción se está leyendo. `null` con la ventana cerrada. */
  const [info, setInfo] = useState<(typeof secciones)[number] | null>(null)

  return (
    // El scroll vive **dentro** de la tarjeta y con la barra fina, como en la experiencia de estudio de producción:
    // así la tarjeta se ve entera y no aparece una barra de scroll pegada a la columna del recurso (Dave, 5-oct).
    <>
    <Frame className="flex h-full min-h-0 flex-col">
      {/* Qué es la columna y cuánto trae, en el marco gris; el panel blanco es solo el índice (Dave, 9-oct). */}
      <FrameHeader className="flex flex-row flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <FrameTitle>Contenido</FrameTitle>
          <FrameDescription>{resumen}</FrameDescription>
        </div>
        {/* «invert-light» y no «secondary»: dentro del marco gris una insignia gris se funde con el fondo, y un relleno
            de color (azul, verde, ámbar) la haría pasar por algo que se pulsa o por un estado. Esta es neutra, con un
            punto más de cuerpo que el fondo, así que se despega sin volverse protagonista (Dave, 9-oct). */}
        <Badge variant="invert-light">
          <HugeiconsIcon icon={borrador.navegacion === 'lineal' ? SortByDown02Icon : ShuffleIcon} aria-hidden="true" />
          {borrador.navegacion === 'lineal' ? 'Navegación lineal' : 'Navegación libre'}
        </Badge>
      </FrameHeader>
      <FramePanel className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [scrollbar-width:thin]">

        {/* Solo «Información general»: el nombre del contenido ya está arriba, encima del índice, y repetirlo
            debajo de «Portada» era decir dos veces lo mismo en dos renglones (Dave, 6-oct). */}
        <FilaFija
          titulo="Información general"
          imagen={borrador.portada.imagen}
          icono={Image01Icon}
          activa={vista === 'portada'}
          // **Mirar la portada no es empezar el contenido**: hasta que se pulsa «Comenzar ahora» no hay nada
          // registrado, así que la fila no se da por vista ni enseña avance. Ese botón es lo que le dice al back que
          // alguien inició el contenido (Dave, 8-oct).
          estado={vista === 'portada' ? 'actual' : empezado ? 'vista' : 'pendiente'}
          progreso={empezado ? progreso : undefined}
          onClick={onPortada}
        />

        {paginas.length ? (
          borrador.seccionesHabilitadas ? (
            // **Secciones plegables**, con el acordeón de la librería: en un contenido largo el índice se recorre
            // mejor cerrando lo que no interesa. Sin «Sección 1» encima del nombre —ese rótulo era del Creator, a
            // quien estudia no le dice nada— y con el número de páginas en una insignia, a la izquierda del chevron
            // (Dave, 6-oct). Nace abierta la sección donde está la página en curso.
            <Accordion value={abiertas} onValueChange={setAbiertas} className="w-full">
              {secciones.map((seccion) => {
                const suyas = seccion.paginas.filter((p) => !p.oculta)
                if (!suyas.length) return null
                return (
                  <AccordionItem key={seccion.id} value={seccion.id} className="min-w-0">
                    <AccordionTrigger className="min-w-0 items-start!">
                      {/* Hasta dos renglones y luego recorta, como el título de una página. En una línea sola el
                          nombre largo de una sección estiraba el acordeón y sacaba scroll horizontal en todo el
                          índice (Dave, 6-oct). */}
                      <span className="line-clamp-2 min-w-0 flex-1 text-left whitespace-normal">
                        {seccion.titulo || 'Sección sin título'}
                      </span>
                      {/* **La descripción no se pinta aquí: se abre.** Hay clientes con párrafos y párrafos ahí
                          dentro, y al migrarlos a este formato el índice se estiraría hasta dejar de servir como
                          índice. Es lo que hace la plataforma de hoy: un icono de información que abre la ventana
                          (Dave, 13-oct). El clic no debe plegar la sección, de ahí que se pare aquí. */}
                      {textoPlano(seccion.descripcion).trim() ? (
                        <Hint label="Sobre esta sección">
                          <BotonIcono
                            size="icon-xs"
                            aria-label={`Sobre la sección ${seccion.titulo || 'sin título'}`}
                            /* A la altura de la primera línea del título. Con su alto propio (24 px) el icono queda
                               centrado en una caja más alta que la insignia y el chevron, y se ve caído (Dave, 13-oct). */
                            className="size-5! shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setInfo(seccion)
                            }}
                          >
                            <HugeiconsIcon icon={InformationCircleIcon} size={14} aria-hidden="true" />
                          </BotonIcono>
                        </Hint>
                      ) : null}
                      <Badge variant="secondary" size="sm" className="shrink-0 tabular-nums">
                        {suyas.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-1">
                      {suyas.map((pagina) => (
                        <FilaPagina
                          key={pagina.id}
                          pagina={pagina}
                          vista={vista}
                          paginaId={paginaId}
                          colaborador={colaborador}
                          onPagina={onPagina}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            // Sin secciones no hay nada que plegar: la lista va seguida.
            <div className="flex flex-col gap-1" aria-label="Páginas del contenido">
              {secciones.flatMap((seccion) =>
                seccion.paginas
                  .filter((p) => !p.oculta)
                  .map((pagina) => (
                    <FilaPagina
                      key={pagina.id}
                      pagina={pagina}
                      vista={vista}
                      paginaId={paginaId}
                      colaborador={colaborador}
                      onPagina={onPagina}
                    />
                  )),
              )}
            </div>
          )
        ) : (
          <Text as="p" size="sm" variant="muted" className="px-1 py-2">
            Este contenido aún no tiene páginas.
          </Text>
        )}

        <Separator />

        <FilaFija
          titulo={certificado ? 'Fin del contenido · Certificado' : 'Fin del contenido'}
          descripcion={certificado ? 'Certificado disponible' : 'Sin certificado'}
          icono={certificado ? Certificate01Icon : Flag03Icon}
          activa={vista === 'cierre'}
          estado={vista === 'cierre' ? 'actual' : colaborador.cierreAccesible ? 'pendiente' : 'bloqueada'}
          onClick={onCierre}
        />
      </FramePanel>
    </Frame>

    {/**
     * **Lo que el creador escribió sobre la sección, en su ventana.** Es como lo resuelve la plataforma de hoy, y por
     * una razón práctica: hay clientes con párrafos y párrafos ahí dentro, y pintarlo en el índice lo estiraría hasta
     * dejar de servir para lo que sirve. Si el texto es largo, el cuerpo saca su propio desplazamiento. El pie lleva
     * un solo botón, «Entendido»: aquí no se decide nada, solo se lee (Dave, 13-oct).
     *
     * El **título no es el de la sección**, sino el de la ventana; el nombre de la sección abre el cuerpo. Es la regla
     * del equipo para cualquier ventana: a desarrollo le sirve más una cabecera que no cambia con el contenido
     * (Carlos, 1-oct).
     */}
    <ActionDialog
      open={info !== null}
      onOpenChange={(abierto) => !abierto && setInfo(null)}
      title="Sobre esta sección"
      lead={<Heading as="h3" level={6}>{info?.titulo || 'Sección sin título'}</Heading>}
      footer={<Button onClick={() => setInfo(null)}>Entendido</Button>}
    >
      <Text as="p" className="whitespace-pre-line">
        {info ? textoPlano(info.descripcion) : ''}
      </Text>
    </ActionDialog>
    </>
  )
}

/** «Portada» y «Fin del contenido»: siempre en su lugar, arriba y abajo de la lista. */
function FilaFija({
  titulo,
  descripcion,
  imagen,
  icono,
  activa,
  estado,
  progreso,
  onClick,
}: {
  titulo: string
  descripcion?: string
  imagen?: string
  icono: IconSvgElement
  activa: boolean
  estado: Estado
  /** 0–100. Solo la lleva «Información general»: es el avance de todo el contenido. */
  progreso?: number
  onClick: () => void
}) {
  return (
    <Item
      size="sm"
      variant="outline"
      render={<button type="button" disabled={estado === 'bloqueada'} />}
      aria-current={activa ? 'page' : undefined}
      className={cn('w-full text-left', activa && 'border-primary! bg-primary/5!')}
      onClick={() => estado !== 'bloqueada' && onClick()}
    >
      <ItemMedia variant={imagen ? 'image' : 'default'}>
        {imagen ? (
          <img src={imagen} alt="" />
        ) : (
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={icono} />
          </IconTile>
        )}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{titulo}</ItemTitle>
        {descripcion ? <ItemDescription className="truncate">{descripcion}</ItemDescription> : null}
        {/* El avance del contenido, **sin rótulo**: debajo de «Información general» se entiende de qué es, y el
            índice es donde se mira cómo va la cosa (Dave, 8-oct). */}
        {progreso != null ? <Progress value={progreso} aria-label="Tu progreso" className="mt-1 **:data-[slot=progress-track]:h-1.5" /> : null}
      </ItemContent>
      <ItemActions>
        <EstadoPagina estado={estado} />
      </ItemActions>
    </Item>
  )
}

/** Una página del índice: calcula en qué estado está **para quien lee** y deja el dibujo a la pieza compartida. */
function FilaPagina({
  pagina,
  vista,
  paginaId,
  colaborador,
  onPagina,
}: {
  pagina: Pagina
  vista: Vista
  paginaId: string | null
  colaborador: EstadoColaborador
  onPagina: (id: string) => void
}) {
  const activa = vista === 'pagina' && pagina.id === paginaId
  const estado: Estado = activa
    ? 'actual'
    : colaborador.visitadas.includes(pagina.id)
      ? 'vista'
      : colaborador.accesible(pagina.id)
        ? 'pendiente'
        : 'bloqueada'

  return (
    <FilaPaginaIndice
      titulo={pagina.titulo}
      descripcion={pagina.recurso ? NOMBRE_RECURSO[pagina.recurso.tipo] : 'Sin recurso'}
      icono={pagina.recurso ? ICONO_RECURSO[pagina.recurso.tipo] : ICONO_PAGINA_VACIA}
      estado={estado}
      extra={
        colaborador.enVivo?.(pagina.id) ? (
          <Badge variant="success-light" size="xs">
            <span className="size-1.25 rounded-full! bg-[currentColor]" />
            En vivo
          </Badge>
        ) : null
      }
      onClick={() => onPagina(pagina.id)}
    />
  )
}
