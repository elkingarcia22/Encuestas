import { useEffect, useState, type CSSProperties } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CreditCardIcon, PieChartIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TrafficLight,
  cn,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { PageContent, PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
import paleta from '@/shared/components/tarjeta-ia.module.css'
import anillo from './components/anillo.module.css'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { BarraSegmentada, GraficoArea } from '@/modules/design-system/templates/dashboard/components/graficos'
import {
  AGENTES_CON_COSTO,
  bolsaDe,
  consumoPorSemana,
  creditos,
  porUrgencia,
  useHistorial,
  usosTexto,
  type EstadoAgente,
} from '../../propuestas/creditos'
import { IconoAgente, InsigniaSituacion } from '../../propuestas/components/creditos-ui'
import { useCarga } from '../../propuestas/components/carga'
import { ReasignarCreditos } from './components/reasignar'
import { ComprarCreditos } from './components/comprar'
import { Historial } from './components/historial'
import { nombresDe } from './components/atencion'
import { TableroCreditos } from './components/tablero'

// Créditos de IA · exploración 1, «Saldo» (25 sep, Nicolás: «esfuérzate, quiero algo hermoso»). La claridad de una
// cuenta de banco: primero lo que necesita tu atención (desde el 5 oct, el tablero de Vacantes en lugar de un aviso);
// después cuánto queda y en qué se fue la bolsa, con cifras que suman a la vista; los agentes ordenados por urgencia, con
// para cuánto les alcanza; el consumo por semana; y el historial como una tabla que se lee. Reasignar abre un cajón que
// muestra el efecto de cada cambio.
//
// Menos scroll (5 oct, Nicolás: «cómo hacemos para que la sección de créditos no tenga tanto scroll»): eran casi 2.900 px.
// El historial, que medía casi una pantalla y se consulta aparte, va en su pestaña («Resumen» · «Historial», la pestaña
// maestra subrayada bajo la cabecera, como en los Resultados de Encuestas); la bolsa y lo cobrado por semana, que
// cuentan los dos cómo va la bolsa, van lado a lado; y las filas de los agentes, más bajas.
//
// Lo de hoy: «18.450 disponibles» junto a «16.340 asignados» y «27.040» en el cajón, sin decir cómo se relacionan;
// «20 disponibles» en Psicométrico cuando ya no le alcanza para una prueba (cuesta 50); «congelados» sin explicar.

export function Component() {
  const historial = useHistorial()
  const bolsa = bolsaDe(historial)
  // El cajón arranca en lo de hoy cada vez que se abre: `vez` lo monta de nuevo.
  const [vez, setVez] = useState(0)
  const [reasignando, setReasignando] = useState(false)
  // Comprar con tarjeta, sin pasar por el ejecutivo (8 oct): se monta de nuevo en cada apertura, como reasignar.
  const [comprando, setComprando] = useState(false)
  const comprar = () => {
    setVez((antes) => antes + 1)
    setComprando(true)
  }
  const abrir = () => {
    setVez((antes) => antes + 1)
    setReasignando(true)
  }
  // Las cifras, los agentes y el gráfico llegan al entrar.
  const cargando = useCarga()
  const [pestana, setPestana] = useState<'resumen' | 'historial'>('resumen')

  const conCosto = porUrgencia(bolsa.porAgente.filter((uno) => uno.agente.costo))
  const compras = historial.filter((movimiento) => movimiento.tipo === 'compra').length
  const libres = conCosto.reduce((suma, uno) => suma + uno.libre, 0)

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: 'Créditos de IA' }]}
        title="Créditos de IA"
        // En una sola línea, como la de Vacantes: el marco de página corta la descripción a ~670 px.
        description="Cuánto queda, qué agente lo usa y para cuánto le alcanza a cada uno."
        actions={
          <>
            {/* Antes «Pedir más créditos», que avisaba al ejecutivo; ahora se compran ahí mismo (8 oct, VP de producto). El
                paquete grande se pide desde el cajón. */}
            <Button variant="outline" onClick={comprar}>
              <HugeiconsIcon icon={CreditCardIcon} size={16} />
              Comprar créditos
            </Button>
            <Button onClick={abrir}>
              <HugeiconsIcon icon={PieChartIcon} size={16} />
              Reasignar créditos
            </Button>
          </>
        }
        tabs={
          <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as 'resumen' | 'historial')}>
            <TabsList variant="line">
              <TabsTrigger value="resumen" className="flex-none">
                Resumen
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex-none">
                Historial
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <PageContent>
        {pestana === 'historial' ? (
          // ── El historial: su propia pestaña. La tabla ya no lleva título: lo dice la pestaña. ──
          <Historial historial={historial} />
        ) : (
          <>
            {/* ── Lo que necesita tu atención, lo primero (5 oct): el tablero de Vacantes en lugar del aviso amarillo.
                Si te dicen que algo necesita tu atención, lo primero es resolverlo. ── */}
            <TableroCreditos bolsa={bolsa} historial={historial} cargando={cargando} onReasignar={abrir} onComprar={comprar} />

            {/* ── La bolsa y lo cobrado por semana, lado a lado y del mismo alto: los dos cuentan cómo va la bolsa. Cada
                uno con la forma de los demás bloques: marco gris, título arriba y lo suyo en blanco. ── */}
            {/* Se mide contra el ancho del contenido, no de la ventana: con el menú abierto en una pantalla mediana, las dos
                columnas no caben y van una debajo de la otra. */}
            <div className="@container">
            <div className="grid gap-6 @4xl:grid-cols-2">
              <Frame spacing="sm" className="h-full">
                <FrameHeader>
                  <FrameTitle>Tu bolsa</FrameTitle>
                  <FrameDescription>
                    {creditos(bolsa.comprado)} comprados en {compras === 1 ? 'una parte' : `${compras} partes`}
                    {compras === 2 ? ': el 1 de agosto y el 10 de septiembre.' : '.'}
                  </FrameDescription>
                </FrameHeader>
                <FramePanel className="flex flex-1 flex-col gap-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Text as="span" variant="muted" size="sm">
                        Disponibles
                      </Text>
                      {cargando ? (
                        <span className="flex h-12 items-center" aria-hidden="true">
                          <Skeleton className="h-9 w-44" />
                        </span>
                      ) : (
                        <span className="flex flex-wrap items-baseline gap-2">
                          <Text as="span" weight="semibold" className="text-5xl leading-12 tracking-tight tabular-nums">
                            {creditos(bolsa.disponible)}
                          </Text>
                          <Text as="span" variant="muted">
                            de {creditos(bolsa.comprado)}
                          </Text>
                        </span>
                      )}
                    </div>
                    {/* El mismo anillo con el degradado de la IA del menú de la empresa: lo usado de la bolsa. */}
                    <AnilloUsado usado={bolsa.usado} total={bolsa.comprado} cargando={cargando} />
                  </div>

                  <div aria-hidden="true">
                    {cargando ? (
                      <Skeleton className="h-2.5 w-full" />
                    ) : (
                      <BarraSegmentada
                        segmentos={[
                          { id: 'usado', etiqueta: 'Usados', valor: bolsa.usado, color: 'var(--chart-4)' },
                          { id: 'reservado', etiqueta: 'Reservados', valor: bolsa.reservado, color: 'var(--chart-2)' },
                          { id: 'libre', etiqueta: 'Libres en los agentes', valor: libres, color: 'var(--chart-1)' },
                          { id: 'sin', etiqueta: 'Sin asignar', valor: bolsa.sinAsignar, color: 'var(--muted)' },
                        ]}
                      />
                    )}
                  </div>
                  {/* Las cuatro partes suman la bolsa; las tres últimas suman lo disponible. */}
                  <div className="grid grid-cols-2 gap-4">
                    <Parte color="var(--chart-4)" etiqueta="Usados" valor={bolsa.usado} texto="Ya se cobraron." cargando={cargando} />
                    <Parte
                      color="var(--chart-2)"
                      etiqueta="Reservados"
                      valor={bolsa.reservado}
                      texto="Procesos en curso: se cobran al terminar y vuelven si se caen."
                      cargando={cargando}
                    />
                    <Parte color="var(--chart-1)" etiqueta="Libres en los agentes" valor={libres} texto="Listos para trabajar." cargando={cargando} />
                    <Parte
                      color="var(--muted-foreground)"
                      etiqueta="Sin asignar"
                      valor={bolsa.sinAsignar}
                      texto="En la bolsa, todavía sin agente."
                      cargando={cargando}
                    />
                  </div>
                </FramePanel>
              </Frame>

              <Frame spacing="sm" className="h-full">
                <FrameHeader>
                  <FrameTitle>Lo cobrado por semana</FrameTitle>
                  <FrameDescription>Las últimas ocho semanas, por agente. Role Play se lleva casi todo, y más cada semana.</FrameDescription>
                </FrameHeader>
                <FramePanel className="flex flex-1 flex-col justify-between gap-3">
                  {cargando ? (
                    <Skeleton className="h-60 w-full rounded-xl" aria-hidden="true" />
                  ) : (
                    <GraficoArea
                      datos={consumoPorSemana(historial)}
                      eje="semana"
                      series={AGENTES_CON_COSTO.map((agente) => ({ clave: agente.id, nombre: agente.nombre, color: agente.color }))}
                      apilado
                      unidad=" créditos"
                    />
                  )}
                  <TrafficLight
                    data={{
                      label: 'Agentes',
                      items: AGENTES_CON_COSTO.map((agente) => ({ label: agente.nombre, value: '', color: agente.color })),
                    }}
                  />
                </FramePanel>
              </Frame>
            </div>
            </div>

            {/* ── Los agentes: la tabla del sistema (`TablaDatos`; auditoría, 5-oct; decisión 4a de Cristian, 9-oct), en su sección
                con título. Es corta: el pie de páginas sale solo si hace falta. ── */}
            <PageSection
              title={
                <span className="flex items-center gap-2">
                  <IconoIA />
                  Agentes con IA
                </span>
              }
              description="Lo asignado a cada uno, lo que ya usó y para cuánto le alcanza. Primero lo urgente."
            >
              <TablaAgentes agentes={[...conCosto, ...bolsa.porAgente.filter((uno) => !uno.agente.costo)]} cargando={cargando} />
              {/* Lo mismo que dice Orbit Flow de sí mismo (OF-57): preguntarle no gasta, gastan las etapas con IA. */}
              <Text as="p" variant="muted" size="sm">
                Orbit Flow, el agente de cada vacante, no usa créditos: preguntarle es gratis. Gastan las etapas con IA cuando alguien entra a ellas.
              </Text>
            </PageSection>
          </>
        )}
      </PageContent>

      <ReasignarCreditos key={vez} open={reasignando} onOpenChange={setReasignando} bolsa={bolsa} />
      <ComprarCreditos
        key={`comprar-${vez}`}
        open={comprando}
        onOpenChange={setComprando}
        bolsa={bolsa}
        onReasignar={() => {
          setComprando(false)
          abrir()
        }}
      />
    </PageShell>
  )
}

function AnilloUsado({ usado, total, cargando }: { usado: number; total: number; cargando: boolean }) {
  // Sin bolsa no hay qué dividir: 0 % y no «NaN %» (CI-23; el estado de primera vez sigue pendiente).
  const porcentaje = total > 0 ? Math.round((usado / total) * 100) : 0
  // El arco arranca vacío y se llena hasta lo usado al llegar a la pantalla.
  const [mostrado, setMostrado] = useState(0)
  useEffect(() => {
    if (cargando) return
    const cuadro = requestAnimationFrame(() => setMostrado(porcentaje))
    return () => cancelAnimationFrame(cuadro)
  }, [cargando, porcentaje])
  if (cargando) return <Skeleton aria-hidden="true" className="size-36 shrink-0 rounded-full!" />
  return (
    <span
      role="img"
      aria-label={`Se ha usado el ${porcentaje} % de la bolsa`}
      className={cn(paleta.vars, anillo.anillo, 'me-2.5')}
      style={{ '--v': mostrado } as CSSProperties}
    >
      <span aria-hidden="true" className={anillo.escala} />
      <span aria-hidden="true" className={anillo.brillo} />
      <span aria-hidden="true" className={anillo.pista} />
      <span aria-hidden="true" className={anillo.arco} />
      {porcentaje > 0 ? <span aria-hidden="true" className={anillo.inicio} /> : null}
      {porcentaje > 0 ? <span aria-hidden="true" className={anillo.punta} /> : null}
      <span aria-hidden="true" className={anillo.centro}>
        <Text as="span" size="xl" weight="semibold" className="tabular-nums sm:text-2xl">
          {porcentaje} %
        </Text>
        <Text as="span" variant="muted" size="xs">
          usado
        </Text>
      </span>
    </span>
  )
}

function Parte({ color, etiqueta, valor, texto, cargando }: { color: string; etiqueta: string; valor: number; texto: string; cargando: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <TrafficLight data={{ label: etiqueta, items: [{ label: etiqueta, value: '', color }] }} />
      {cargando ? (
        <span className="flex h-7 items-center" aria-hidden="true">
          <Skeleton className="h-5 w-20" />
        </span>
      ) : (
        <Text as="span" size="xl" weight="semibold" className="tabular-nums">
          {creditos(valor)}
        </Text>
      )}
      <Text as="span" variant="muted" size="xs">
        {texto}
      </Text>
    </div>
  )
}

// Los agentes en la tabla del sistema (`TablaDatos`, auditoría del 5-oct). Lo que se ordena de cada fila: el nombre del
// agente, cuánto lleva usado de lo asignado, para cuántos usos le alcanza y en cuántas vacantes está. Todas las filas
// llevan lo justo para la barra y dos líneas de texto; «De lo asignado» con aire para «2.990 usados · 1.560 reservados de
// 4.940» y las vacantes en pausa contadas, no nombradas (los nombres los dice el tablero de atención).
type FilaAgente = EstadoAgente & { id: string; nombre: string; uso: number; alcanza: number; enVacantes: number }

const COLUMNAS_AGENTES: DataGridListConfig<FilaAgente>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Agente',
    size: 300,
    cell: ({ row }) => {
      const { agente, vecesUsado } = row.original
      return (
        <span className="flex min-w-0 items-center gap-3">
          <IconoAgente agente={agente} />
          <CeldaTitulo
            titulo={agente.nombre}
            detalle={agente.costo ? `${creditos(agente.costo)} créditos por ${agente.uso[0]}` : `${creditos(vecesUsado)} CVs analizados`}
          />
        </span>
      )
    },
  },
  {
    accessorKey: 'uso',
    header: 'De lo asignado',
    size: 260,
    cell: ({ row }) => {
      const { agente, asignado, usado, reservado, libre } = row.original
      return agente.costo && asignado ? (
        <span className="flex w-full flex-col gap-1.5 pe-4">
          {/* `flex`: sin él, la barra queda en una línea de texto y le suma 3 px a la fila. */}
          <span aria-hidden="true" className="flex">
            <BarraSegmentada
              segmentos={[
                { id: 'usado', etiqueta: 'Usado', valor: usado, color: 'var(--chart-4)' },
                { id: 'reservado', etiqueta: 'Reservado', valor: reservado, color: 'var(--chart-2)' },
                { id: 'libre', etiqueta: 'Libre', valor: libre, color: 'var(--muted)' },
              ]}
            />
          </span>
          <Text as="span" variant="muted" size="sm" className="truncate tabular-nums">
            {creditos(usado)} usados{reservado ? ` · ${creditos(reservado)} reservados` : ''} de {creditos(asignado)}
          </Text>
        </span>
      ) : (
        <Text as="span" variant="muted" size="sm">
          {agente.costo ? 'Sin créditos asignados' : 'No usa créditos'}
        </Text>
      )
    },
  },
  {
    accessorKey: 'alcanza',
    header: 'Le alcanza para',
    size: 220,
    cell: ({ row }) => {
      const { agente, usos } = row.original
      return (
        <span className="flex flex-col items-start gap-1">
          <Text as="span" weight="medium" className="tabular-nums">
            {agente.costo ? (usos ? usosTexto(agente, usos) : `Ninguna ${agente.uso[0]}`.replace('Ninguna roleplay', 'Ningún roleplay')) : 'Todas las que lleguen'}
          </Text>
          <InsigniaSituacion estado={row.original} />
        </span>
      )
    },
  },
  {
    accessorKey: 'enVacantes',
    header: 'Vacantes',
    size: 240,
    cell: ({ row }) => {
      const { vacantes, situacion } = row.original
      const pausado = situacion === 'sin-cupo' && vacantes.length
      return (
        <Text as="span" size="sm" className={pausado ? 'truncate text-destructive' : 'truncate'}>
          {pausado
            ? `En pausa en ${vacantes.length === 1 ? nombresDe(vacantes) : `${vacantes.length} vacantes`}`
            : `Lo usan ${plural(vacantes.length, '1 vacante', `${vacantes.length} vacantes`)}`}
        </Text>
      )
    },
  },
]

function TablaAgentes({ agentes, cargando }: { agentes: EstadoAgente[]; cargando: boolean }) {
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const filas = agentes.map<FilaAgente>((estado) => ({
    ...estado,
    id: estado.agente.id,
    nombre: estado.agente.nombre,
    uso: estado.asignado ? estado.usado / estado.asignado : 0,
    alcanza: estado.agente.costo ? (estado.usos ?? 0) : Number.MAX_SAFE_INTEGER,
    enVacantes: estado.vacantes.length,
  }))
  // Sin orden pedido, primero lo urgente (como llegan).
  const ordenadas = orden ? ordenarPor(filas, orden) : filas

  return (
    <TablaDatos
      config={{ columns: COLUMNAS_AGENTES, sort: { onSortChange: setOrden } }}
      data={ordenadas.slice((pagina - 1) * porPagina, pagina * porPagina)}
      isLoading={cargando}
      paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: ordenadas.length }}
      nombre="agentes"
      singular="agente"
      id="agentes-creditos"
      pieSoloSiHaceFalta
    />
  )
}

// El orden de la tabla: por la columna que se pidió («-» adelante, de mayor a menor).
function ordenarPor(filas: FilaAgente[], orden: string) {
  const desc = orden.startsWith('-')
  const campo = (desc ? orden.slice(1) : orden) as keyof FilaAgente
  return [...filas].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'es')
    return desc ? -r : r
  })
}

Component.displayName = 'SeleccionCreditosUnoPage'
