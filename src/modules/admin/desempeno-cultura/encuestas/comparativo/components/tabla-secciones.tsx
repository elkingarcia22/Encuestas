import { useCallback, useMemo } from 'react'
import { cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { deltaAgainstBase, type CellReading, type ComparativeColumn, type DimensionParticipationPeriod } from '../../modelo/comparativo/comparativeHelpers'
import { treeNodeReading, type ComparativeTreeMetric, type ComparativeTreeNode } from '../../modelo/comparativo/comparativeSectionTree'
import { formatPercent } from '../../modelo/favorabilityScale'
import { ArbolResultados, type NodoSeccion } from '../../resultados/components/arbol-resultados'
import { TotalOculto } from '../../resultados/components/controles'
import { numero } from '../../resultados/components/escala'
import { nivelDe, type Nivel } from '../../resultados/components/filtros'
import { MarcaBase, decimalesDe, type Unidad } from './variacion'
import { Cambio } from '@/modules/admin/seleccion/propuestas/components/cifras'
import { Hint } from '@/shared/components/Hint'

// «Secciones» del comparativo con la misma forma que Favorabilidad › Secciones: cada sección es una tarjeta plegable
// (las subsecciones con su cabecera gris y la línea guía) y, dentro, sus preguntas en una tabla con una columna por
// medición. La cabecera de cada sección dice siempre el valor de la base; las diferencias de las demás mediciones salen
// al pasar el cursor, como el reparto en Favorabilidad.

type Props = {
  arbol: readonly ComparativeTreeNode[]
  columnas: readonly ComparativeColumn[]
  metrica: ComparativeTreeMetric
  /** La participación de cada medición, para «Ver por: Participación»: es de toda la encuesta, la misma en cada sección. */
  participacion?: readonly DimensionParticipationPeriod[]
  /** Los niveles de Personalizar: un nivel desmarcado deja su fila pero sin cifras. */
  niveles?: ReadonlySet<Nivel>
}

/** Una sección del cuestionario en la forma que pide el árbol de Resultados: sus preguntas y sus subsecciones aparte. */
type NodoComparativo = NodoSeccion & { nodo: ComparativeTreeNode; questions: readonly ComparativeTreeNode[]; children: readonly NodoComparativo[] }

const aNodo = (nodo: ComparativeTreeNode): NodoComparativo => ({
  id: nodo.key,
  title: nodo.label,
  numbering: nodo.numbering,
  nodo,
  questions: nodo.children.filter((hija) => hija.kind === 'question'),
  children: nodo.children.filter((hija) => hija.kind !== 'question').map(aNodo),
})

const formatoDe = (metrica: ComparativeTreeMetric) => (valor: number) => (metrica === 'nps' ? `${valor > 0 ? '+' : ''}${Math.round(valor)}` : metrica === 'positividad' ? `${Math.round(valor)} %` : formatPercent(valor))
const unidadDe = (metrica: ComparativeTreeMetric): Unidad => (metrica === 'nps' ? 'pts' : 'pp')


function Celda({ lectura, base, columna, metrica, seccion }: { lectura: CellReading; base: CellReading | null; columna: ComparativeColumn; metrica: ComparativeTreeMetric; seccion: ComparativeTreeNode }) {
  if (lectura.state !== 'ok' || lectura.value === null) {
    // Cada medición trae su cuestionario: si no tenía la sección entera se dice así; si la tenía, le faltaba la pregunta.
    const ausente = seccion.measures[columna.id] === undefined ? 'Esta medición no incluía esta sección' : 'Esta medición no incluía esta pregunta'
    return (
      // Las notas al pasar el cursor, en el globo del producto (Hint) y no en el del navegador (decisión 16 de la auditoría).
      <Hint label={lectura.state === 'not-measured' ? ausente : 'Sin datos'}>
        <Text as="span" size="sm" variant="muted" tabIndex={0}>
          —
        </Text>
      </Hint>
    )
  }
  const delta = columna.isBase ? undefined : deltaAgainstBase(lectura, base)
  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5">
        <Text as="span" size="sm" weight="semibold" className={cn('tabular-nums', columna.isBase && 'text-primary')}>
          {formatoDe(metrica)(lectura.value)}
        </Text>
        {delta !== undefined ? <Cambio valor={delta} sufijo={` ${unidadDe(metrica)}`} decimales={decimalesDe(unidadDe(metrica))} frente="la base" enCelda ayuda="Diferencia frente a la base" /> : null}
      </div>
      <Text as="span" size="xs" variant="muted" className="tabular-nums">
        n={numero(lectura.n ?? 0)}
      </Text>
    </div>
  )
}

export function TablaSecciones({ arbol, columnas, metrica, niveles, participacion }: Props) {
  const base = columnas.find((columna) => columna.isBase) ?? columnas[0]
  const comparadas = columnas.filter((columna) => !columna.isBase)
  const lectura = useCallback((nodo: ComparativeTreeNode, columna: ComparativeColumn) => treeNodeReading({ node: nodo, column: columna, metric: metrica, participationByPeriod: participacion }), [metrica, participacion])
  const secciones = useMemo(() => arbol.filter((nodo) => nodo.kind !== 'question').map(aNodo), [arbol])
  const visible = (nivel: Nivel) => (niveles ? niveles.has(nivel) : true)

  return (
    <ArbolResultados
      secciones={secciones}
      metrica={(seccion) => {
        if (!visible(nivelDe(seccion.nodo.depth))) return <TotalOculto />
        const enBase = lectura(seccion.nodo, base)
        if (enBase.state === 'not-measured') {
          return (
            <Hint label="La encuesta base no incluía esta sección: la traen otras mediciones">
              <Text as="span" size="sm" variant="muted" tabIndex={0}>
                —
              </Text>
            </Hint>
          )
        }
        if (enBase.state !== 'ok' || enBase.value === null) return <TotalOculto />
        return (
          <div className="flex items-center gap-3">
            {/* Las diferencias de las demás mediciones, al pasar por la cabecera. */}
            <div className="hidden items-center gap-1.5 opacity-0 transition-opacity group-hover/cabecera:opacity-100 group-focus-within/cabecera:opacity-100 xl:flex">
              {comparadas.map((columna) => {
                const delta = deltaAgainstBase(lectura(seccion.nodo, columna), enBase)
                return delta === undefined ? null : (
                  <span key={columna.id} className="inline-flex items-center gap-1">
                    <Text as="span" size="xs" variant="muted">
                      {columna.shortLabel}
                    </Text>
                    <Cambio valor={delta} sufijo={` ${unidadDe(metrica)}`} decimales={decimalesDe(unidadDe(metrica))} frente="la base" enCelda ayuda={`${columna.label} frente a la base`} />
                  </span>
                )
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <MarcaBase />
              <Text as="span" size="sm" weight="semibold" className="text-primary tabular-nums">
                {formatoDe(metrica)(enBase.value)}
              </Text>
            </div>
          </div>
        )
      }}
      preguntas={(seccion) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Pregunta</TableHead>
              {columnas.map((columna) => (
                <TableHead key={columna.id} className="w-40">
                  <Hint label={columna.label}>
                    <div className="flex items-center justify-end gap-1.5" tabIndex={0}>
                      {columna.shortLabel}
                      {columna.isBase ? <MarcaBase /> : null}
                    </div>
                  </Hint>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(seccion.questions as readonly ComparativeTreeNode[]).map((pregunta, indice) => (
              <TableRow key={pregunta.key}>
                <TableCell className="text-center tabular-nums">
                  <Text as="span" size="xs" variant="muted" weight="semibold">
                    {indice + 1}
                  </Text>
                </TableCell>
                {/* whitespace-normal!: el enunciado largo se parte en renglones; la celda de la librería no deja cambiar su
                    nowrap con una clase normal (ficha instalacion-estilos-sin-capa en ai-tools/flux-ui/diferencias.json). */}
                <TableCell className="whitespace-normal!">
                  <Text as="span" size="sm" weight="medium">
                    {pregunta.label}
                  </Text>
                </TableCell>
                {columnas.map((columna) => (
                  <TableCell key={columna.id} className="text-right">
                    {visible('question') ? <Celda lectura={lectura(pregunta, columna)} base={lectura(pregunta, base)} columna={columna} metrica={metrica} seccion={seccion.nodo} /> : <TotalOculto />}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    />
  )
}
