import { Fragment, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertDiamondIcon, ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertTitle,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemTitle,
  Skeleton,
  Text,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { GRUPOS, grupoDe, type Grupo } from './grupos-atencion'

// El tablero «Lo que necesita tu atención» de Selección, la forma que comparten el inicio de Vacantes (29 sep, reunión
// con Elkin) y Créditos (5 oct, Nicolás: «lo de créditos también debería tener el mismo tipo de tablero que manejamos
// para vacantes»). Una columna por grupo —Críticas, Necesitan atención, Acción manual y Sugerencias de la IA—, cada una
// con sus asuntos más urgentes arriba. Lo crítico va en el aviso rojo apagado del sistema (`Alert` destructive) para que
// llame a actuar; lo demás, en blanco. Cada asunto se abre en el panel lateral de su pantalla y ahí se resuelve; lo
// resuelto sale del tablero. Cuando no queda nada, el tablero lo celebra (aprendizaje de Symmetric que contó Nicolás:
// «no tienes nada por hacer» les da alegría a los usuarios operativos).
//
// Entra recogido, con el asunto más urgente de cada columna (1 oct, Nicolás), para que no se coma la pantalla;
// «Expandir» lo deja con los tres primeros de cada una. Aquí vive solo la forma: qué asuntos hay y cómo se resuelven
// los pone cada pantalla.
//
// Compacto desde el 5 oct (Nicolás: «una forma de visualizar esto más reducida en altura»): el encabezado de cada
// columna en una línea (icono, nombre y cuenta; lo que agrupa lo dice el panel) y cada asunto solo con su título, en tres
// líneas como mucho: en dos, a 1366 px se cortaba justo la cifra («vence para 5…», IN-10). El detalle vive en el panel.
// La cuenta de cada columna va en texto, no en insignia: las cifras se leen como texto (IN-46).
// Lo crítico sigue en el aviso rojo, con la flecha a la derecha en
// lugar del botón «Resolver»; la sugerencia de la IA también se abre en el panel, donde se aplica o se descarta. Las
// cuatro columnas caben desde un contenido de 896 px; más angosto, van de dos en dos.

const VISIBLES = 3
const RECOGIDO = 1

// Lo mínimo que el tablero necesita de un asunto.
export type AsuntoTablero = { id: string; grupo: Grupo; titulo: string; resumen: string }

export function MediaGrupo({ grupo, size = 'sm' }: { grupo: Grupo; size?: 'xs' | 'sm' }) {
  const info = grupoDe(grupo)
  return (
    <IconTile variant="soft" size={size} className={info.tono}>
      {info.icono ? <HugeiconsIcon icon={info.icono} aria-hidden="true" /> : <IconoIA />}
    </IconTile>
  )
}

/* El marco y sus columnas --------------------------------------------------------------------------------------- */

export function TableroAtencion<A extends AsuntoTablero>({
  pendientes,
  cargando = false,
  expandido,
  onExpandido,
  onAbrir,
  onVerGrupo,
  vacio,
  error,
  grupos = GRUPOS.map(({ grupo }) => grupo),
  nombres,
}: {
  // Los asuntos sin resolver, ya en orden de urgencia.
  pendientes: A[]
  // Mientras llegan los datos, cada columna ya dice qué agrupa y en gris su cuenta y su primer asunto.
  cargando?: boolean
  expandido: boolean
  onExpandido: (expandido: boolean) => void
  onAbrir: (asunto: A) => void
  onVerGrupo: (grupo: Grupo) => void
  // Lo que se ve sin nada pendiente, si no es la celebración: el primer uso, sin nada todavía (IN-24).
  vacio?: { titulo: string; descripcion: string; contenido: ReactNode }
  // Si no cargó: el error con «Reintentar» va en el lugar de las columnas (IN-26).
  error?: ReactNode
  // Las columnas que lleva, si no son las cuatro, y otro nombre para alguna. Vacantes junta «Necesitan atención» y
  // «Acción manual» en una sola, «Esperando acción» (13 oct, reunión con la PM y el TL).
  grupos?: Grupo[]
  nombres?: Partial<Record<Grupo, string>>
}) {
  const delGrupo = (grupo: Grupo) => pendientes.filter((asunto) => asunto.grupo === grupo)
  // Solo hay algo que expandir si alguna columna tiene más de lo que se ve recogido.
  const hayMas = grupos.some((grupo) => delGrupo(grupo).length > RECOGIDO)

  return (
    // Compacto, como el marco de las tablas: así los títulos de la pantalla arrancan en la misma línea.
    <Frame spacing="sm">
      <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <FrameTitle id="atencion-titulo">Lo que necesita tu atención</FrameTitle>
          <FrameDescription>
            {pendientes.length ? 'Resuélvelo desde aquí o entra al detalle. Lo que resuelves sale del tablero.' : vacio ? 'Aquí aparece lo que necesite una acción tuya.' : 'Todo está al día.'}
          </FrameDescription>
        </div>
        {pendientes.length && hayMas && !cargando && !error ? (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-expanded={expandido}
            aria-controls="atencion-columnas"
            onClick={() => onExpandido(!expandido)}
          >
            {expandido ? 'Contraer' : 'Expandir'}
            <HugeiconsIcon icon={expandido ? ArrowUp01Icon : ArrowDown01Icon} aria-hidden="true" />
          </Button>
        ) : null}
      </FrameHeader>
      <FramePanel
        className="@container"
        role={cargando ? 'status' : undefined}
        aria-label={cargando ? 'Cargando lo que necesita tu atención' : undefined}
      >
        {error ? (
          error
        ) : pendientes.length === 0 && !cargando && vacio ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyMedia>
                <ImagenGlass nombre="glass-tick" tamano={88} />
              </EmptyMedia>
              <EmptyTitle>{vacio.titulo}</EmptyTitle>
              <EmptyDescription>{vacio.descripcion}</EmptyDescription>
            </EmptyHeader>
            {vacio.contenido}
          </Empty>
        ) : pendientes.length === 0 && !cargando ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyMedia>
                <ImagenGlass nombre="glass-tick" tamano={88} />
              </EmptyMedia>
              <EmptyTitle>No tienes nada por hacer</EmptyTitle>
              <EmptyDescription>Todo lo que pedía una acción tuya está resuelto. Si algo vuelve a necesitarte, aparece aquí.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div
            id="atencion-columnas"
            className={cn('divide-border grid gap-5 @4xl:gap-0 @4xl:divide-x', grupos.length === 3 ? '@4xl:grid-cols-3' : '@2xl:grid-cols-2 @4xl:grid-cols-4')}
          >
            {grupos.map((grupo) => (
              <Columna
                key={grupo}
                grupo={grupo}
                nombre={nombres?.[grupo]}
                asuntos={delGrupo(grupo)}
                cargando={cargando}
                expandido={expandido}
                onAbrir={onAbrir}
                onVerTodos={() => onVerGrupo(grupo)}
              />
            ))}
          </div>
        )}
      </FramePanel>
    </Frame>
  )
}

function Columna<A extends AsuntoTablero>({
  grupo,
  nombre,
  asuntos,
  cargando,
  expandido,
  onAbrir,
  onVerTodos,
}: {
  grupo: Grupo
  nombre?: string
  asuntos: A[]
  cargando: boolean
  expandido: boolean
  onAbrir: (asunto: A) => void
  onVerTodos: () => void
}) {
  const info = grupoDe(grupo)
  const visibles = asuntos.slice(0, expandido ? VISIBLES : RECOGIDO)
  return (
    <section aria-labelledby={`grupo-${grupo}`} className="flex min-w-0 flex-col gap-2.5 @4xl:px-4 @4xl:first:ps-0 @4xl:last:pe-0">
      {/* En una línea: icono, nombre y cuenta. */}
      <div className="flex min-w-0 items-center gap-2">
        <MediaGrupo grupo={grupo} size="xs" />
        <Text as="span" id={`grupo-${grupo}`} size="sm" weight="medium" className="min-w-0 flex-1 truncate">
          {nombre ?? info.titulo}
        </Text>
        {cargando ? (
          <Skeleton aria-hidden="true" className="h-4.5 w-6 shrink-0 rounded-full" />
        ) : (
          <Text
            as="span"
            size="sm"
            weight="medium"
            variant={grupo === 'critico' && asuntos.length ? undefined : 'muted'}
            className={grupo === 'critico' && asuntos.length ? 'shrink-0 text-destructive tabular-nums' : 'shrink-0 tabular-nums'}
          >
            {asuntos.length}
          </Text>
        )}
      </div>

      {cargando ? (
        <Skeleton aria-hidden="true" className="h-16 w-full rounded-lg" />
      ) : asuntos.length === 0 ? (
        <div className="flex items-center gap-2 py-1">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 text-success" aria-hidden="true" />
          <Text as="span" variant="muted" size="sm">
            {info.vacio}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibles.map((asunto) =>
            grupo === 'critico' ? (
              // El aviso rojo, bajo: el título en tres líneas como mucho y la flecha que lo abre. Todo el aviso se toca, como
              // las tarjetas de las otras columnas (IN-50); con teclado se llega a la flecha.
              <Alert key={asunto.id} variant="destructive" role="group" aria-label={asunto.titulo} className="cursor-pointer" onClick={() => onAbrir(asunto)}>
                <HugeiconsIcon icon={AlertDiamondIcon} aria-hidden="true" />
                <AlertTitle className="line-clamp-3">{asunto.titulo}</AlertTitle>
                <AlertAction>
                  <BotonIcono
                    size="icon-xs"
                    aria-label={`Resolver «${asunto.titulo}»`}
                    onClick={(evento) => {
                      evento.stopPropagation()
                      onAbrir(asunto)
                    }}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                  </BotonIcono>
                </AlertAction>
              </Alert>
            ) : (
              <Item
                key={asunto.id}
                variant="outline"
                size="sm"
                render={<button type="button" />}
                className="w-full cursor-pointer items-start text-left"
                onClick={() => onAbrir(asunto)}
              >
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-3! w-full">{asunto.titulo}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" aria-hidden="true" />
                </ItemActions>
              </Item>
            ),
          )}
          {/* Recogido, la cuenta de la columna ya dice que hay más; «Ver los N» sale al expandir, si aun así no caben. */}
          {expandido && asuntos.length > VISIBLES ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={onVerTodos}>
              Ver {plural(asuntos.length, 'el asunto', `los ${asuntos.length}`)}
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      )}
    </section>
  )
}

/* Una sugerencia de la IA --------------------------------------------------------------------------------------- */

// Con su porqué y las dos salidas: aplicarla o descartarla. El botón de IA, el último. En el tablero va el resumen
// cortado a tres líneas; en el panel (`completa`), el porqué entero.
export function TarjetaSugerencia({
  titulo,
  resumen,
  porque,
  completa = false,
  etiqueta,
  onAplicar,
  onDescartar,
}: {
  titulo: string
  resumen: string
  porque?: string
  completa?: boolean
  etiqueta: string
  onAplicar: () => void
  onDescartar: () => void
}) {
  return (
    <Item variant="outline" size="sm" className="items-start">
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">{titulo}</ItemTitle>
        {completa && porque ? (
          <Text as="p" variant="muted" size="sm">
            {porque}
          </Text>
        ) : (
          <ItemDescription className="line-clamp-3!">{resumen}</ItemDescription>
        )}
      </ItemContent>
      <ItemFooter className="flex-wrap justify-end gap-1.5">
        <Button variant="ghost" size="sm" onClick={onDescartar}>
          Descartar
        </Button>
        <BotonIaSecundario size="sm" onClick={onAplicar}>
          {etiqueta}
        </BotonIaSecundario>
      </ItemFooter>
    </Item>
  )
}

/* La lista de un grupo, en el panel lateral --------------------------------------------------------------------- */

export function ListaAsuntos<A extends AsuntoTablero>({
  grupo,
  asuntos,
  onAbrir,
  sugerencia,
}: {
  grupo: Grupo
  asuntos: A[]
  onAbrir: (asunto: A) => void
  // La sugerencia completa, con su porqué.
  sugerencia: (asunto: A) => ReactNode
}) {
  const info = grupoDe(grupo)
  if (asuntos.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{info.vacio}</EmptyTitle>
          <EmptyDescription>Lo que resolviste ya no aparece aquí.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  if (grupo === 'ia') {
    return (
      <ItemGroup className="gap-2!">
        {asuntos.map((asunto) => (
          <Fragment key={asunto.id}>{sugerencia(asunto)}</Fragment>
        ))}
      </ItemGroup>
    )
  }
  return (
    <ItemGroup className="gap-1!">
      {asuntos.map((asunto) => (
        <Item key={asunto.id} variant="outline" render={<button type="button" />} className="w-full cursor-pointer text-left" onClick={() => onAbrir(asunto)}>
          <ItemContent className="min-w-0">
            <ItemTitle className="w-full">{asunto.titulo}</ItemTitle>
            <ItemDescription className="line-clamp-2!">{asunto.resumen}</ItemDescription>
          </ItemContent>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        </Item>
      ))}
    </ItemGroup>
  )
}
