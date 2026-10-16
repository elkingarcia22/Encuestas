import { Fragment, useState, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Frame,
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
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  Tooltip,
  TooltipTrigger,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { HintContent } from '@/shared/components/Hint'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

import { CeldaCifra } from '@/modules/design-system/metricas/cifras'
import { Tendencia } from '@/modules/design-system/metricas/graficos'
import {
  ACCIONES_RAPIDAS,
  ATENCION,
  METRICAS,
  PERIODOS,
  PERSONA,
  saludo,
  type Metrica,
  type Periodo,
} from './data'
import { AiCard, type AiCardProps } from '@/shared/components/AiCard'

// Inicio del administrador (HU-INI-001) con la composición del concepto de producto: saludo,
// top métricas por periodo, lo que necesita atención y quick actions. Lo usan dos marcos: el del
// Home operativo y el de Suite AI (template «Home Suite AI»); cada uno dice a dónde lleva cada
// enlace con `enlace(slug)`, donde slug es el del menú del Home operativo.

type Enlace = (slug: string) => string

// Top métricas en una sola tarjeta con divisores (reunión del 2026-09-14), con la misma estructura que
// los indicadores del Inicio de Nicolás (template Suite AI), que fue la versión elegida: nombre, cifra
// y su minigráfica. Sin la variación contra el periodo anterior desde el 5-oct (decisión 11 de la auditoría).
// El icono de información de cada métrica. El Tooltip de flux-ui solo abre con el cursor o el foco y se
// cierra al hacer clic; aquí también abre con clic (y con toque en pantallas táctiles), como el prototipo.
// Por eso va el Tooltip controlado y no Hint (solo hover), pero el globo es el oficial, HintContent. El texto
// conserva el ancho de antes (256px con el aire del globo).
function AyudaMetrica({ titulo, texto }: { titulo: string; texto: string }) {
  const [abierta, setAbierta] = useState(false)

  return (
    <Tooltip open={abierta} onOpenChange={setAbierta}>
      <TooltipTrigger
        closeOnClick={false}
        onClick={() => setAbierta(true)}
        render={<BotonIcono size="icon-xs" aria-label={`Qué mide «${titulo}»`} className="shrink-0" />}
      >
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      </TooltipTrigger>
      <HintContent side="top">
        <span className="block max-w-58">{texto}</span>
      </HintContent>
    </Tooltip>
  )
}

// Exportado para el Inicio del admin (1 oct), que trae sus propios periodos (30 y 90 días) y pasa las métricas en
// `metricas`; sin ellas usa las del periodo de este template. Con `encabezado`, el marco lleva arriba su franja de título
// con lo que se le pase a la derecha (el Inicio del admin pone ahí el periodo, para que se lea como parte del módulo).
export function TopMetricas({
  periodo,
  metricas,
  encabezado,
  titulo = 'Métricas del periodo',
}: {
  periodo: Periodo
  metricas?: Metrica[]
  encabezado?: ReactNode
  titulo?: string
}) {
  return (
    <section aria-label="Top métricas">
      <Frame>
        {encabezado ? (
          <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <FrameTitle>{titulo}</FrameTitle>
            {encabezado}
          </FrameHeader>
        ) : null}
        {/* La cifra es la de Design system › Métricas (CeldaCifra, la misma de FilaCifras), sin variación (decisión 11 de la
            auditoría): una sola versión. FilaCifras no tiene sitio para la minigráfica ni para el «i», así que la fila
            repite su rejilla partida por líneas y cada celda lleva a la derecha el «i» arriba y la minigráfica abajo. */}
        <FramePanel className="divide-border grid gap-5 lg:grid-cols-3 lg:gap-0 lg:divide-x">
          {(metricas ?? METRICAS[periodo]).map((metrica) => (
            <div key={metrica.id} className="flex min-w-0 items-stretch justify-between gap-3 lg:px-5 lg:first:ps-0 lg:last:pe-0">
              <CeldaCifra cifra={{ etiqueta: metrica.titulo, valor: metrica.valor, detalle: metrica.detalle }} />
              <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                <AyudaMetrica titulo={metrica.titulo} texto={metrica.ayuda} />
                <div className="h-9 w-24" aria-hidden="true">
                  <Tendencia datos={metrica.serie} color="var(--primary)" />
                </div>
              </div>
            </div>
          ))}
        </FramePanel>
      </Frame>
    </section>
  )
}

// Estructura del bloque «Integrations» de ReUI (dashboard-4), como pidió Carlos: título y
// descripción en la franja del marco; adentro, cada pendiente con su imagen, estado y acción.
// Una sola caja con los pendientes separados por una línea (marco denso y apilado de flux-ui): el
// título va afuera, como el de Quick actions, para no meter una caja dentro de otra. El marco denso
// de flux-ui conserva 3 px de relleno (su p-0 no gana a px-(--frame-px)); se anula por variable.
// En la baldosa azul el recuadro interno se pega al borde para que no se vea otra caja.
// Exportado para el Inicio del admin (1 oct), que lo pone a todo el ancho, con el contador en azul (`contadorAzul`) y,
// con `enMarco`, en la misma caja que las métricas: título y contador en la franja del marco y los pendientes en un solo
// panel, separados por una línea.
export function NecesitaTuAtencion({
  enlace,
  contadorAzul = false,
  enMarco = false,
  entrada,
}: {
  enlace: Enlace
  contadorAzul?: boolean
  enMarco?: boolean
  // Solo con `enMarco`: animación de llegada de cada fila (el Inicio del admin pone la clase y los retrasos).
  entrada?: { clase: string; desde: number; paso: number }
}) {
  if (enMarco) {
    return (
      <section aria-labelledby="atencion" className="min-w-0">
        <Frame>
          <FrameHeader className="flex flex-row items-center gap-2">
            <FrameTitle id="atencion">Necesita tu atención</FrameTitle>
            <Badge variant={contadorAzul ? 'info-light' : 'secondary'} radius="full">
              {ATENCION.length}
            </Badge>
          </FrameHeader>
          <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
            {/* Filas pegadas, separadas solo por la línea: el grupo y la línea traían 16px y 8px de margen. */}
            <ItemGroup className="gap-0!">
              {ATENCION.map((pendiente, indice) => (
                <Fragment key={pendiente.id}>
                  {indice > 0 ? <ItemSeparator className="my-0!" /> : null}
                  <Item
                    className={entrada?.clase}
                    style={entrada ? { animationDelay: `${entrada.desde + indice * entrada.paso}ms` } : undefined}
                  >
                    <ItemMedia>
                      <IconTile variant="soft">
                        <HugeiconsIcon icon={pendiente.icono} aria-hidden="true" />
                      </IconTile>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>{pendiente.titulo}</ItemTitle>
                      <ItemDescription>
                        {pendiente.modulo} · {pendiente.detalle}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button variant="outline" size="sm" nativeButton={false} render={<Link to={enlace(pendiente.destino)} />}>
                        {pendiente.accion}
                      </Button>
                    </ItemActions>
                  </Item>
                </Fragment>
              ))}
            </ItemGroup>
          </FramePanel>
        </Frame>
      </section>
    )
  }

  return (
    <section aria-labelledby="atencion" className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Heading as="h2" level={5} id="atencion">
          Necesita tu atención
        </Heading>
        <Badge variant={contadorAzul ? 'info-light' : 'secondary'} radius="full">
          {ATENCION.length}
        </Badge>
      </div>
      <Frame stacked className="grow">
        {ATENCION.map((pendiente) => (
          <FramePanel key={pendiente.id} className="flex items-center [--frame-panel-px:0px] [--frame-panel-py:0px]">
            <Item>
              <ItemMedia>
                <IconTile variant="soft">
                  <HugeiconsIcon icon={pendiente.icono} aria-hidden="true" />
                </IconTile>
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>{pendiente.titulo}</ItemTitle>
                <ItemDescription>
                  {pendiente.modulo} · {pendiente.detalle}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link to={enlace(pendiente.destino)} />}>
                  {pendiente.accion}
                </Button>
              </ItemActions>
            </Item>
          </FramePanel>
        ))}
      </Frame>
    </section>
  )
}

function QuickActions({ enlace, tarjetaIa }: { enlace: Enlace; tarjetaIa?: ReactElement<AiCardProps> }) {
  return (
    <section aria-labelledby="quick-actions" className="flex min-w-0 flex-col gap-4">
      <Heading as="h2" level={5} id="quick-actions">
        Quick actions
      </Heading>
      {/* Mismo borde doble que Top métricas: un marco con los atajos como paneles adentro. Arriba, «Crear un curso». */}
      <Frame className="grow">
        {/* Tarjeta de invitación a la IA (variante «Halo», elegida el 18 sep): el color va difuminado en las esquinas
            y no rellenando la tarjeta, para que no le gane al resto del Inicio. Se documenta y se configura en
            /design-system/tarjeta-ia. */}
        <FramePanel fit className="flex [--frame-panel-px:0px] [--frame-panel-py:0px]">
          {tarjetaIa ?? (
            <AiCard
              title="Crear un curso"
              description="Genera contenido de aprendizaje apoyado en AI en minutos."
              action="Crear ahora"
              render={<Link to={enlace('contenidos')} />}
              inFrame
              className="flex-1"
            />
          )}
        </FramePanel>
        {/* Cuatro atajos con solo imagen Glass y título, en dos columnas; si quedara uno suelto, ocupa la
            fila. Las tarjetas reparten el alto que sobra para terminar a la par de «Necesita tu atención». */}
        <div className="grid grow auto-rows-fr gap-1 sm:grid-cols-2">
          {ACCIONES_RAPIDAS.map((accion, indice) => (
            <FramePanel
              key={accion.titulo}
              fit
              className={cn(
                'flex [--frame-panel-px:0px] [--frame-panel-py:0px]',
                indice === ACCIONES_RAPIDAS.length - 1 && ACCIONES_RAPIDAS.length % 2 === 1 && 'sm:col-span-2',
              )}
            >
              <Item render={<Link to={enlace(accion.destino)} />} className="flex-col items-start justify-between gap-3">
                <ItemMedia>
                  {/* El lienzo del PNG trae margen transparente: se corre para alinear el dibujo con el texto. */}
                  <span className="-ms-2">
                    {/* La ilustración de vidrio compartida (decisión 21, 5-oct): aquí había una copia. */}
                    <ImagenGlass nombre={accion.glass.nombre} tamano={56} />
                  </span>
                </ItemMedia>
                <ItemContent>
                  {/* Título un poco más grande que el de un Item (16 px en vez de 14). */}
                  <Heading as="h3" level={6}>
                    {accion.lineas[0]}
                    <br />
                    {accion.lineas[1]}
                  </Heading>
                </ItemContent>
              </Item>
            </FramePanel>
          ))}
        </div>
      </Frame>
    </section>
  )
}

// `tarjetaIa`: otra versión de «Crear un curso». La usa «Probar en pantalla» de /design-system/tarjeta-ia para
// mostrar la tarjeta configurada en su sitio real, dentro del Inicio de verdad.
export function InicioOperativo({ enlace, tarjetaIa }: { enlace: Enlace; tarjetaIa?: ReactElement<AiCardProps> }) {
  const [periodo, setPeriodo] = useState<Periodo>('7')

  return (
    <div className="relative isolate flex flex-1 flex-col gap-10 pt-2">
      {/* El brillo azul ya no se pinta aquí: desde el 18 sep lo pone el marco de página en todas las pantallas
          del Workspace (ver PageAmbience). */}
      {/* Encabezado: un solo saludo, con la hora y el nombre («Buenas tardes, Carolina»), y debajo la línea de
          contexto (revisión de Carlos del 2026-09-14: antes se saludaba dos veces). */}
      <header className="flex flex-col gap-1">
        <Heading as="h1" level={2}>
          {saludo()}, {PERSONA.corto}
        </Heading>
        <Text variant="muted">Esto es lo que pasa hoy en tu empresa.</Text>
      </header>

      {/* El periodo de las métricas (7 o 30 días, HU-INI-001) va en pestañas subrayadas dentro de la franja de título de
          las métricas, como en el Inicio de /admin: solo cambia estas cifras (decisión 13 de la auditoría). */}
      <TopMetricas
        periodo={periodo}
        encabezado={
          <Tabs value={periodo} onValueChange={(valor) => setPeriodo(valor as Periodo)}>
            <TabsList variant="line" aria-label="Periodo de las métricas">
              {PERIODOS.map((opcion) => (
                <TabsTrigger key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {/* «Necesita tu atención» se estira hasta el alto de Quick actions: sus filas reparten el alto. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <NecesitaTuAtencion enlace={enlace} />
        <QuickActions enlace={enlace} tarjetaIa={tarjetaIa} />
      </div>

    </div>
  )
}
