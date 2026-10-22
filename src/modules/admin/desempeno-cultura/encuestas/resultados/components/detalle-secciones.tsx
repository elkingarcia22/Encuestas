import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Message01Icon } from '@hugeicons/core-free-icons'
import {
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
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { EncabezadoOrdenable } from '../../components/tabla-piezas'
import { FAVORABILITY_FLOOR, FAVORABILITY_TARGET, THREE_TIER_FAVORABILITY_LEGEND, formatPercent } from '../../modelo/favorabilityScale'
import { flattenResultSections, sectionResultsForFilters, type Distribution, type QuestionResult, type SectionResult, type SurveyResults } from '../../modelo/surveyResults'
import { ArbolResultados, SobreGris, contarPreguntas } from './arbol-resultados'
import { ChipsFiltro, Filtros, LeyendaEscala, Personalizar, TotalOculto } from './controles'
import { numero } from './escala'
import { nivelDe, type FiltrosResultados, type Nivel } from './filtros'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { plural } from '@/modules/design-system/patrones/formato'

// Favorabilidad › Secciones: el mapa completo con la jerarquía de la encuesta. Cada fila trae el
// reparto (favorables, neutrales, desfavorables y NS/NR) y su favorabilidad. Una pregunta sin
// escala no toma prestada una barra que no significa nada: dice «Sin escala» y ya.

type Grupo = 'favorable' | 'neutral' | 'unfavorable' | 'nsnr'

const GRUPOS: { id: Grupo; corto: string; texto: string }[] = [
  { id: 'favorable', corto: 'Favorables', texto: 'text-success' },
  { id: 'neutral', corto: 'Neutrales', texto: 'text-warning' },
  { id: 'unfavorable', corto: 'Desfav.', texto: 'text-destructive' },
  { id: 'nsnr', corto: 'NS/NR', texto: 'text-muted-foreground' },
]

const VARIANTE_GRUPO: Record<Exclude<Grupo, 'nsnr'>, 'success-light' | 'warning-light' | 'destructive-outline'> = {
  favorable: 'success-light',
  neutral: 'warning-light',
  unfavorable: 'destructive-outline',
}

const grupoDe = (valor: number): Exclude<Grupo, 'nsnr'> => (valor >= FAVORABILITY_TARGET ? 'favorable' : valor >= FAVORABILITY_FLOOR ? 'neutral' : 'unfavorable')

function reparto(distribucion: Distribution | null, nsnr: number): Record<Grupo, number> & { total: number } {
  const cajas = distribucion ?? [0, 0, 0, 0, 0]
  const favorable = cajas[3] + cajas[4]
  const neutral = cajas[2]
  const unfavorable = cajas[0] + cajas[1]
  return { favorable, neutral, unfavorable, nsnr, total: favorable + neutral + unfavorable + nsnr }
}

// Todas las respuestas con escala bajo una sección, juntas en una sola distribución.
function distribucionDe(seccion: SectionResult): Distribution {
  const totales: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (const nodo of flattenResultSections([seccion])) {
    for (const pregunta of nodo.questions) pregunta.distribution?.forEach((cuenta, indice) => (totales[indice] += cuenta))
  }
  return totales
}

type Lectura = { niveles: ReadonlySet<Nivel>; grupos: ReadonlySet<string> }

// Fuera del resaltado: el número sigue ahí, pero en gris.
const atenuada = (lectura: Lectura, grupo: Grupo | null, conNsnr: boolean) =>
  grupo !== null && lectura.grupos.size > 0 && !(lectura.grupos.has(grupo) || (lectura.grupos.has('nsnr') && conNsnr))

function SinEscala() {
  return (
    <Badge variant="secondary" size="sm">
      <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
      Sin escala
    </Badge>
  )
}

function Favorabilidad({ valor, gris, conEtiqueta }: { valor: number; gris: boolean; conEtiqueta?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {conEtiqueta ? (
        <Text as="span" size="xs" variant="muted" weight="medium">
          Favorabilidad
        </Text>
      ) : null}
      <Badge variant={gris ? 'secondary' : VARIANTE_GRUPO[grupoDe(valor)]} size="sm" className="tabular-nums">
        {formatPercent(valor)}
      </Badge>
    </div>
  )
}

function Reparto({ valores, lectura, gris }: { valores: ReturnType<typeof reparto>; lectura: Lectura; gris: boolean }) {
  return (
    <div className="flex items-center justify-end gap-4">
      {GRUPOS.map((grupo) => {
        const apagado = gris || (lectura.grupos.size > 0 && !lectura.grupos.has(grupo.id))
        // El detalle, en el globo del producto (Hint) y no en el del navegador (decisión 16 de la auditoría).
        return (
          <Hint key={grupo.id} label={`${grupo.corto} · ${numero(valores[grupo.id])} ${plural(valores[grupo.id], 'respuesta', 'respuestas')}`}>
            <Text as="span" size="xs" weight="semibold" className={cn('w-16 text-right tabular-nums', apagado ? 'text-muted-foreground' : grupo.texto)}>
              {valores.total > 0 ? Math.round((valores[grupo.id] / valores.total) * 100) : 0} %
            </Text>
          </Hint>
        )
      })}
    </div>
  )
}

function TotalSeccion({ seccion, lectura }: { seccion: SectionResult; lectura: Lectura }) {
  if (!lectura.niveles.has(nivelDe(seccion.depth))) return <TotalOculto />
  if (seccion.n === 0) return <SinEscala />
  const gris = atenuada(lectura, grupoDe(seccion.favorability), seccion.nsnr > 0)
  return (
    <div className="flex items-center gap-4">
      {/* El reparto de la sección no tiene encabezado de columna, como el de las preguntas: sale solo al pasar por la cabecera. */}
      <div className="hidden opacity-0 transition-opacity group-hover/cabecera:opacity-100 group-focus-within/cabecera:opacity-100 xl:block">
        <Reparto valores={reparto(distribucionDe(seccion), seccion.nsnr)} lectura={lectura} gris={gris} />
      </div>
      <Favorabilidad valor={seccion.favorability} gris={gris} conEtiqueta />
    </div>
  )
}

function TablaPreguntas({ preguntas, lectura }: { preguntas: readonly QuestionResult[]; lectura: Lectura }) {
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const ordenadas = useMemo(() => {
    if (!orden) return preguntas
    const campo = orden.replace('-', '')
    const signo = orden.startsWith('-') ? -1 : 1
    // Las que tienen escala van primero: «peor primero» no puede empezar por una abierta.
    return [...preguntas].sort((a, b) => {
      const conEscala = (b.scored ? 1 : 0) - (a.scored ? 1 : 0)
      if (conEscala !== 0) return conEscala
      return (campo === 'pregunta' ? a.statement.localeCompare(b.statement, 'es') : (a.favorability ?? -1) - (b.favorability ?? -1)) * signo
    })
  }, [preguntas, orden])
  const ordenar = (campo: string) => setOrden((previo) => (previo === campo ? `-${campo}` : previo === `-${campo}` ? undefined : campo))
  const oculto = !lectura.niveles.has('question')

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center">#</TableHead>
          <TableHead>
            <EncabezadoOrdenable etiqueta="Pregunta" campo="pregunta" ordenActual={orden} onOrdenar={ordenar} />
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            <div className="flex justify-end gap-4">
              {GRUPOS.map((grupo) => (
                <span key={grupo.id} className="w-16 text-right">
                  {grupo.corto}
                </span>
              ))}
            </div>
          </TableHead>
          <TableHead className="w-36">
            <div className="flex justify-end">
              <EncabezadoOrdenable etiqueta="Favorabilidad" campo="favorabilidad" ordenActual={orden} onOrdenar={ordenar} />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordenadas.map((pregunta, indice) => {
          const gris = pregunta.scored && pregunta.favorability !== null && atenuada(lectura, grupoDe(pregunta.favorability), pregunta.nsnr > 0)
          return (
            <TableRow key={pregunta.id}>
              <TableCell className="text-center tabular-nums">
                <Text as="span" size="xs" variant="muted" weight="semibold">
                  {indice + 1}
                </Text>
              </TableCell>
              {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
              <TableCell className="whitespace-normal!">
                <Text as="span" size="sm" weight="medium" variant={gris ? 'muted' : 'default'}>
                  {pregunta.statement || 'Pregunta sin enunciado'}
                </Text>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {pregunta.scored && pregunta.distribution && !oculto ? <Reparto valores={reparto(pregunta.distribution, pregunta.nsnr)} lectura={lectura} gris={gris} /> : null}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  {oculto ? <TotalOculto /> : pregunta.scored && pregunta.favorability !== null ? <Favorabilidad valor={pregunta.favorability} gris={gris} /> : <SinEscala />}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function DetalleSecciones({ resultados, estado, extra }: { resultados: SurveyResults; estado: FiltrosResultados; extra?: ReactNode }) {
  const secciones = useMemo(() => sectionResultsForFilters(resultados, estado.filtros), [resultados, estado.filtros])
  const total = secciones.reduce((suma, seccion) => suma + contarPreguntas(seccion), 0)
  const lectura: Lectura = { niveles: estado.niveles, grupos: estado.grupos }
  const segmentos = resultados.segments.filter((segmento) => !segmento.perPerson)

  return (
    <Frame spacing="sm" className="[--frame-gap:0px]">
      {/* Cabecera del marco en fila (título a la izquierda, controles a la derecha): con el tema sin capa solo obedece con «!». Ficha: diferencias.json › instalacion-estilos-sin-capa. */}
      <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
        <div>
          <FrameTitle>Detalle por secciones</FrameTitle>
          <FrameDescription>
            {total} {total === 1 ? 'pregunta' : 'preguntas'}
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* La pastilla del cambio de vista va primera (la pone Favorabilidad). */}
          {extra}
          {/* Sin datos demográficos no hay por qué filtrar: el aviso de la pestaña ya lo explica. */}
          {segmentos.length > 0 ? <Filtros estado={{ ...estado, filtrables: segmentos }} activo={{ key: '', label: 'las secciones', preloaded: false, perPerson: false, options: [] }} /> : null}
          <Personalizar
            estado={estado}
            escala={THREE_TIER_FAVORABILITY_LEGEND}
            resaltadas={estado.grupos}
            onResaltar={estado.alternarGrupo}
            onRestablecerResaltado={estado.restablecerGrupos}
            ajustesResaltado={estado.grupos.size > 0 && estado.grupos.size < THREE_TIER_FAVORABILITY_LEGEND.length ? THREE_TIER_FAVORABILITY_LEGEND.length - estado.grupos.size : 0}
          />
          <LeyendaEscala
            titulo="Escala de favorabilidad"
            descripcion="Cada respuesta en escala 1 a 5 cae en uno de estos tres bloques, y el porcentaje se calcula sobre el total de respuestas en escala de la pregunta. Los NS/NR quedan fuera de ese total y se cuentan aparte."
            escala={THREE_TIER_FAVORABILITY_LEGEND}
          />
        </div>
      </FrameHeader>
      {estado.filtros.length > 0 ? (
        <FramePanel>
          <ChipsFiltro estado={estado} segmentos={segmentos} />
        </FramePanel>
      ) : null}
      {secciones.length === 0 ? (
        <FramePanel>
          <PrimeraVez icono="glass-chart" titulo="Sin secciones con resultados" descripcion="Las secciones de esta encuesta no tienen resultados en la escala de 1 a 5." />
        </FramePanel>
      ) : (
        <SobreGris>
          <ArbolResultados
            secciones={secciones}
            preguntas={(seccion) => <TablaPreguntas preguntas={seccion.questions} lectura={lectura} />}
            metrica={(seccion) => <TotalSeccion seccion={seccion} lectura={lectura} />}
          />
        </SobreGris>
      )}
    </Frame>
  )
}
