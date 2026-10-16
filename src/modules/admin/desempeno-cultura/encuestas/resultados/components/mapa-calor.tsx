import { Fragment, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, LockIcon, Message01Icon, RotateLeft01Icon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  cn,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { FAVORABILITY_SCALE_LEGEND, bandForScore, formatScore, type ScaleTone } from '../../modelo/favorabilityScale'
import { heatmapBySegment, type HeatmapCell, type HeatmapRow, type SegmentDefinition, type SurveyResults } from '../../modelo/surveyResults'
import { ChipsFiltro, Filtros, LeyendaEscala, Personalizar, TotalOculto, VerPor, type OpcionEscala } from './controles'
import { COLOR_POR_TONO, numero, FONDO_ESCALA, TEXTO_ESCALA } from './escala'
import { nivelDe, type FiltrosResultados, type Nivel } from './filtros'
import { BotonPantallaCompleta } from './pantalla-completa'
import { PrimeraVez } from '@/shared/components/PrimeraVez'

// Favorabilidad › Mapa de calor. Arranca colapsado a las secciones de nivel 1, salvo la primera,
// que se abre entera como ejemplo. La primera columna se queda fija al desplazarse de lado: sin
// eso, leer el décimo grupo es leer números cuya fila ya no se ve.

const nivelDeFila = (fila: HeatmapRow): Nivel => (fila.kind === 'question' ? 'question' : nivelDe(fila.depth))
const seccionesBajo = (fila: HeatmapRow): string[] => fila.children.flatMap((hija) => (hija.kind === 'section' ? [hija.id, ...seccionesBajo(hija)] : []))
const todoBajo = (fila: HeatmapRow): string[] => fila.children.flatMap((hija) => [hija.id, ...todoBajo(hija)])


// La sangría de cada nivel y, con ella, dónde cae la flecha de cada sección: de ahí baja la línea
// que une a una fila con las secciones de las que cuelga, como en el árbol de «Secciones».
export const SANGRIA = ['', 'ps-6', 'ps-10', 'ps-14'] as const
const SANGRIA_PX = [0, 24, 40, 56] as const
const RELLENO_CELDA_PX = 8
const MITAD_FLECHA_PX = 12

export function LineasGuia({ depth }: { depth: number }) {
  return SANGRIA_PX.slice(0, Math.max(0, Math.min(depth, SANGRIA_PX.length + 1) - 1)).map((px) => (
    <span key={px} aria-hidden="true" className="absolute inset-y-0 border-s" style={{ left: RELLENO_CELDA_PX + px + MITAD_FLECHA_PX }} />
  ))
}

export const COLUMNA_FIJA = 'sticky left-0 z-10 bg-card group-hover/fila:bg-muted/50 transition-colors'

/** Con qué escala se lee el mapa: favorabilidad por defecto; el riesgo NOM 035 va al revés. */
export type EscalaMapa = {
  titulo: string
  tituloLeyenda: string
  descripcion: string
  /** Las bandas que se pueden resaltar. */
  bandas: readonly OpcionEscala[]
  leyenda: readonly OpcionEscala[]
  banda: (puntaje: number) => { id: string; label: string; tone: ScaleTone }
  formato: (puntaje: number) => string
}

const ESCALA_FAVORABILIDAD: EscalaMapa = {
  titulo: 'Mapa de calor',
  tituloLeyenda: 'Escala de favorabilidad',
  descripcion: 'Cada celda es el promedio de las respuestas en escala 1 a 5 de ese cruce, y la banda es el tramo en el que cae ese promedio. Los NS/NR no entran en el promedio.',
  bandas: FAVORABILITY_SCALE_LEGEND.filter((banda) => banda.id !== 'nsnr'),
  leyenda: FAVORABILITY_SCALE_LEGEND,
  banda: bandForScore,
  formato: formatScore,
}

type Lectura = {
  niveles: ReadonlySet<Nivel>
  bandas: ReadonlySet<string>
  resaltadas: ReadonlySet<string>
}

function Celda({ celda, oculta, gris, grupo, fila, escala }: { celda: HeatmapCell; oculta: boolean; gris: boolean; grupo: string; fila: string; escala: EscalaMapa }) {
  const nombre = `${fila} · ${grupo}`
  if (oculta) {
    return (
      <Hint label="Resultados ocultos: marca este nivel en el filtro de Niveles.">
        <Badge variant="outline" className="h-full min-h-8 w-full rounded-sm" aria-label={`${nombre}: oculto`} />
      </Hint>
    )
  }
  if (celda.unscored) {
    return (
      <Hint label="Sin escala">
        <Badge variant="secondary" className="h-full min-h-8 w-full m-0 justify-center rounded-sm" aria-label={`${nombre}: sin escala`}>
          <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
        </Badge>
      </Hint>
    )
  }
  if (celda.masked) {
    const sinRespuestas = celda.n === 0
    return (
      <Hint
        label={
          <>
            {sinRespuestas ? 'Sin respuestas' : 'Reservado'} · {numero(celda.n)} respuestas · {numero(celda.participants)} participantes
            <br />
            {sinRespuestas ? 'Todavía nadie de este grupo ha respondido.' : 'Por debajo del mínimo para mostrar resultados de este grupo.'}
          </>
        }
      >
        {sinRespuestas ? (
          <Badge variant="outline" className="h-full min-h-8 w-full m-0 justify-center rounded-sm" aria-label={`${nombre}: sin respuestas`}>
            —
          </Badge>
        ) : (
          <Badge variant="secondary" className="h-full min-h-8 w-full m-0 justify-center rounded-sm" aria-label={`${nombre}: reservado`}>
            <HugeiconsIcon icon={LockIcon} aria-hidden="true" />
          </Badge>
        )}
      </Hint>
    )
  }
  const banda = escala.banda(celda.score ?? 0)
  return (
    <Hint
      label={`${banda.label} · ${numero(celda.n)} respuestas · ${numero(celda.participants)} participantes`}
    >
      <Badge variant={gris ? 'secondary' : 'outline'} className="h-full min-h-8 w-full m-0 justify-center tabular-nums rounded-sm !border-0" style={gris ? undefined : { backgroundColor: FONDO_ESCALA[banda.tone], color: TEXTO_ESCALA[banda.tone] }}>
        {escala.formato(celda.score ?? 0)}
      </Badge>
    </Hint>
  )
}

function Fila({
  fila,
  abiertas,
  onAlternar,
  lectura,
  onResaltar,
  columnas,
  escala,
}: {
  fila: HeatmapRow
  abiertas: ReadonlySet<string>
  onAlternar: (id: string) => void
  lectura: Lectura
  onResaltar: (fila: HeatmapRow) => void
  columnas: readonly { id: string; label: string }[]
  escala: EscalaMapa
}) {
  const abierta = abiertas.has(fila.id)
  const desplegable = fila.kind === 'section' && fila.children.length > 0
  const oculta = !lectura.niveles.has(nivelDeFila(fila))
  const resaltada = lectura.resaltadas.has(fila.id)
  const apagada = lectura.resaltadas.size > 0 && !resaltada
  const sangria = SANGRIA[Math.min(fila.depth, SANGRIA.length) - 1]
  const raiz = fila.depth === 1 && fila.kind === 'section'

  return (
    <>
      <TableRow className="group/fila h-[1px] !border-b-0 border-transparent has-aria-expanded:bg-transparent">
        <TableHead scope="row" className={cn(COLUMNA_FIJA, 'w-80 min-w-80 max-w-80 !border-b-0')}>
          <LineasGuia depth={fila.depth} />
          <div className={cn('flex items-center gap-1.5 py-1 whitespace-normal', sangria)}>
            {desplegable ? (
              <BotonIcono size="icon-xs" aria-expanded={abierta} aria-label={abierta ? `Contraer ${fila.label}` : `Expandir ${fila.label}`} onClick={() => onAlternar(fila.id)}>
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
              </BotonIcono>
            ) : (
              <span className="w-6 shrink-0" aria-hidden="true" />
            )}
            <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
              {fila.numbering || (fila.kind === 'question' ? '•' : '')}
            </Text>
            <Text as="span" size={raiz ? 'sm' : 'xs'} weight={fila.kind === 'question' ? 'normal' : raiz ? 'bold' : 'semibold'} variant={apagada ? 'muted' : 'default'} className="min-w-0 flex-1">
              {fila.label}
            </Text>
            <Hint label={resaltada ? 'Quitar el resaltado' : `Resaltar solo ${fila.label}`}>
              <BotonIcono size="icon-xs" aria-pressed={resaltada} aria-label={`Resaltar solo ${fila.label}`} className={resaltada ? 'text-primary' : 'text-muted-foreground'} onClick={() => onResaltar(fila)}>
                <HugeiconsIcon icon={Target02Icon} aria-hidden="true" />
              </BotonIcono>
            </Hint>
          </div>
        </TableHead>
        <TableCell className="w-20 text-center border-r border-border !border-b-0">
          {oculta ? (
            <TotalOculto />
          ) : fila.total === null ? (
            <Badge variant="secondary" className="h-6 rounded-md bg-muted/50 text-muted-foreground whitespace-nowrap px-2" size="sm">
              Sin escala
            </Badge>
          ) : (
            <span
              className={cn('font-medium text-sm tabular-nums', apagada && 'text-muted-foreground opacity-50')}
              style={apagada ? undefined : { color: COLOR_POR_TONO[escala.banda(fila.total).tone] }}
            >
              {escala.formato(fila.total)}
            </span>
          )}
        </TableCell>
        {fila.cells.map((celda, indice) => {
          const banda = celda.score === null ? null : escala.banda(celda.score)
          const gris = apagada || (banda !== null && !celda.masked && !lectura.bandas.has(banda.id))
          return (
            <TableCell key={columnas[indice]?.id ?? indice} className="min-w-16 p-0 h-full relative !border-b-0">
              <div className="absolute inset-0 p-0.5 flex flex-col [&>*]:flex-1 [&_button]:h-full [&_button]:w-full">
                <Celda celda={celda} oculta={oculta} gris={gris} grupo={columnas[indice]?.label ?? ''} fila={fila.label} escala={escala} />
              </div>
            </TableCell>
          )
        })}
      </TableRow>
      {abierta
        ? fila.children.map((hija) => <Fila key={hija.id} fila={hija} abiertas={abiertas} onAlternar={onAlternar} lectura={lectura} onResaltar={onResaltar} columnas={columnas} escala={escala} />)
        : null}
    </>
  )
}

type Props = {
  resultados: SurveyResults
  segmentos: readonly SegmentDefinition[]
  segmento: SegmentDefinition
  estado: FiltrosResultados
  escala?: EscalaMapa
  /** Controles que la pestaña pone delante de los del mapa: su cambio de vista (la pastilla). No van en pantalla completa. */
  extra?: React.ReactNode
  /** Dentro de la ventana de pantalla completa: el mismo mapa, sin el botón para abrirla otra vez. */
  enPantallaCompleta?: boolean
}

// El cambio Secciones / Mapa de calor ya no va en la cabecera de la caja: son pestañas subrayadas encima, que pone quien
// lo usa (decisión 13 de la auditoría).
export function MapaCalor({ resultados, segmentos, segmento, estado, escala = ESCALA_FAVORABILIDAD, extra, enPantallaCompleta = false }: Props) {
  const mapa = useMemo(() => heatmapBySegment(resultados, segmento, estado.filtros), [resultados, segmento, estado.filtros])
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => {
    const primera = mapa.rows[0]
    return new Set(primera ? [primera.id, ...seccionesBajo(primera)] : [])
  })
  const alternar = (id: string) =>
    setAbiertas((actuales) => {
      const siguientes = new Set(actuales)
      if (siguientes.has(id)) siguientes.delete(id)
      else siguientes.add(id)
      return siguientes
    })
  const lectura: Lectura = { niveles: estado.niveles, bandas: estado.bandas, resaltadas: estado.filasResaltadas }
  const conResaltado = estado.filasResaltadas.size > 0 || estado.bandasOcultas

  // Ver por, filtros, personalizar y la leyenda: en la cabecera de la caja y, en pantalla completa, en la de la ventana.
  const controlesDelMapa = (
    <>
    <VerPor segmentos={segmentos} activo={segmento} onCambio={estado.cambiarSegmento} />
    <Filtros estado={estado} activo={segmento} />
    <Personalizar
      estado={estado}
      escala={escala.bandas}
      resaltadas={estado.bandas}
      onResaltar={estado.alternarBanda}
      onRestablecerResaltado={estado.restablecerBandas}
      ajustesResaltado={escala.bandas.length - estado.bandas.size}
    />
    <LeyendaEscala titulo={escala.tituloLeyenda} descripcion={escala.descripcion} escala={escala.leyenda} />
    </>
  )
  const controles = (
    <>
      {extra}
      {controlesDelMapa}
    </>
  )

  return (
    <Frame spacing="sm" className="[--frame-gap:0px]">
      {/* En pantalla completa la cabecera de la caja no se pinta: el título, el conteo y los controles van en la ventana. */}
      {enPantallaCompleta ? null : (
      <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
        <div>
          <FrameTitle>
            {escala.titulo} por {segmento.label.toLowerCase()}
          </FrameTitle>
          <FrameDescription>
            {mapa.columns.length} {mapa.columns.length === 1 ? 'grupo' : 'grupos'}
            {mapa.maskedColumns > 0 ? ` · ${mapa.maskedColumns} con resultados reservados` : ''}
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {controles}
          {enPantallaCompleta ? null : (
            <BotonPantallaCompleta titulo={escala.titulo} descripcion={`Por ${segmento.label.toLowerCase()} · ${mapa.columns.length} ${mapa.columns.length === 1 ? 'grupo' : 'grupos'}`} acciones={controlesDelMapa}>
              <MapaCalor resultados={resultados} segmentos={segmentos} segmento={segmento} estado={estado} escala={escala} enPantallaCompleta />
            </BotonPantallaCompleta>
          )}
        </div>
      </FrameHeader>
      )}
      {estado.filtros.length > 0 || conResaltado ? (
        <FramePanel className="flex flex-wrap items-center gap-3">
          <ChipsFiltro estado={estado} segmentos={segmentos} />
          {conResaltado ? (
            <Button variant="ghost" size="xs" onClick={estado.restablecerResaltado}>
              <HugeiconsIcon icon={RotateLeft01Icon} aria-hidden="true" />
              Restablecer vista
            </Button>
          ) : null}
        </FramePanel>
      ) : null}
      <FramePanel className="p-0!">
        {mapa.rows.length === 0 ? (
          <PrimeraVez icono="glass-chart" titulo="Sin secciones con resultados" descripcion="Esta encuesta no tiene secciones ni preguntas en la escala de 1 a 5." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="border-collapse border-spacing-0">
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(COLUMNA_FIJA, 'w-80 min-w-80 max-w-80 uppercase text-xs tracking-wider')}>Sección</TableHead>
                  <TableHead className="w-20 text-center uppercase text-xs tracking-wider border-r border-border">Total</TableHead>
                  {mapa.columns.map((columna, indice) => (
                    <TableHead key={columna.id} className="min-w-16 px-0.5 py-2 text-center uppercase text-xs tracking-wider">
                      <Hint label={mapa.columnTotals[indice] === null ? columna.label : `${columna.label} · total ${escala.formato(mapa.columnTotals[indice] as number)}`}>
                        <span className="block max-w-20 truncate mx-auto" tabIndex={0}>
                          {columna.label}
                        </span>
                      </Hint>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapa.rows.map((fila) => (
                  <Fragment key={fila.id}>
                    <Fila fila={fila} abiertas={abiertas} onAlternar={alternar} lectura={lectura} onResaltar={(elegida) => estado.alternarFila([elegida.id, ...todoBajo(elegida)])} columnas={mapa.columns} escala={escala} />
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </FramePanel>
    </Frame>
  )
}
