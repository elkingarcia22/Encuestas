import { Fragment, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Message01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Button, cn, Progress, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { EncabezadoOrdenable } from '../../components/tabla-piezas'
import type { QuestionBreakdown } from '../../modelo/questionResponses'
import { flattenResultSections, type QuestionResult, type SectionResult } from '../../modelo/surveyResults'
import { ArbolResultados, contarPreguntas } from './arbol-resultados'
import { TotalOculto } from './controles'
import { numero } from './escala'
import { nivelDe, type Nivel } from './filtros'
import { plural } from '@/modules/design-system/patrones/formato'

// Preguntas › Secciones: cuántas personas eligieron cada opción de cada pregunta, sobre el árbol de
// la encuesta. Tocar una opción lleva a «Por persona» con la lista acotada a esa gente; una pregunta
// abierta lleva a «Comentarios» filtrado a ella.

const porcentaje = (valor: number) => `${valor.toFixed(1).replace(/\.0$/, '').replace('.', ',')} %`

const respuestasDe = (seccion: SectionResult) =>
  flattenResultSections([seccion]).reduce((suma, nodo) => suma + nodo.questions.reduce((total, pregunta) => total + pregunta.n + pregunta.nsnr, 0), 0)

function Recuentos({ recuento, onPersonas }: { recuento: QuestionBreakdown; onPersonas: (opcion: string) => void }) {
  if (recuento.tallies.length === 0) {
    return (
      <Text size="sm" variant="muted">
        Esta pregunta no registró respuestas.
      </Text>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Text as="span" size="xs" variant="muted" weight="medium">
        Respuestas por opción
      </Text>
      {recuento.tallies.map((opcion) => (
        <div key={opcion.id} className="flex items-center gap-3">
          <Text as="span" size="sm" variant={opcion.isNsNr ? 'muted' : 'default'} className="min-w-0 flex-1">
            {opcion.label}
          </Text>
          <Progress value={opcion.percentage} aria-label={opcion.label} className="w-40" />
          <Text as="span" size="sm" weight="semibold" className="w-12 text-right tabular-nums">
            {numero(opcion.count)}
          </Text>
          <Text as="span" size="xs" variant="muted" className="w-12 text-right tabular-nums">
            {porcentaje(opcion.percentage)}
          </Text>
          <Hint label={opcion.count > 0 ? `${plural(opcion.count, 'Ver a la persona que respondió', `Ver las ${numero(opcion.count)} personas que respondieron`)} «${opcion.shortLabel}»` : 'Nadie eligió esta opción'}>
            <span>
              <BotonIcono size="icon-xs" aria-label={`Ver las personas que respondieron ${opcion.shortLabel}`} disabled={opcion.count === 0} onClick={() => onPersonas(opcion.id)}>
                <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
              </BotonIcono>
            </span>
          </Hint>
        </div>
      ))}
      {recuento.multiSelect ? (
        <Text as="p" size="xs" variant="muted">
          Pregunta de múltiples respuestas: los porcentajes son sobre personas, así que suman más de 100 %.
        </Text>
      ) : null}
    </div>
  )
}

function TablaRecuentos({
  preguntas,
  recuentos,
  oculto,
  conNsnr,
  onPersonas,
  onComentarios,
}: {
  preguntas: readonly QuestionResult[]
  recuentos: ReadonlyMap<string, QuestionBreakdown>
  oculto: boolean
  conNsnr: boolean
  onPersonas: (pregunta: string, opcion: string) => void
  onComentarios: (pregunta: string) => void
}) {
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => new Set())
  const ordenadas = useMemo(() => {
    if (!orden) return preguntas
    const signo = orden.startsWith('-') ? -1 : 1
    return [...preguntas].sort((a, b) => (orden.includes('pregunta') ? a.statement.localeCompare(b.statement, 'es') : a.n + a.nsnr - (b.n + b.nsnr)) * signo)
  }, [preguntas, orden])
  const ordenar = (campo: string) => setOrden((previo) => (previo === campo ? `-${campo}` : previo === `-${campo}` ? undefined : campo))
  const alternar = (id: string) =>
    setAbiertas((actuales) => {
      const siguientes = new Set(actuales)
      if (siguientes.has(id)) siguientes.delete(id)
      else siguientes.add(id)
      return siguientes
    })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center">#</TableHead>
          <TableHead>
            <EncabezadoOrdenable etiqueta="Pregunta" campo="pregunta" ordenActual={orden} onOrdenar={ordenar} />
          </TableHead>
          {conNsnr ? <TableHead className="w-20 text-right">NS/NR</TableHead> : null}
          <TableHead className="w-32">
            <div className="flex justify-end">
              <EncabezadoOrdenable etiqueta="Respuestas" campo="respuestas" ordenActual={orden} onOrdenar={ordenar} />
            </div>
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordenadas.map((pregunta, indice) => {
          const recuento = recuentos.get(pregunta.id)
          const abierta = abiertas.has(pregunta.id)
          const abiertaTexto = recuento?.type === 'open'
          return (
            <Fragment key={pregunta.id}>
              <TableRow data-state={abierta ? 'selected' : undefined}>
                <TableCell className="text-center">
                  <Text as="span" size="xs" variant="muted" weight="semibold" className="tabular-nums">
                    {indice + 1}
                  </Text>
                </TableCell>
                {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                <TableCell className="whitespace-normal!">
                  <div className="flex flex-col gap-0.5">
                    <Text as="span" size="sm" weight="medium">
                      {pregunta.statement || 'Pregunta sin enunciado'}
                    </Text>
                    <Text as="span" size="xs" variant="muted">
                      {recuento?.formatLabel ?? 'Escala'}
                    </Text>
                  </div>
                </TableCell>
                {conNsnr ? (
                  <TableCell className="text-right tabular-nums">{oculto ? <TotalOculto /> : pregunta.nsnr > 0 ? numero(pregunta.nsnr) : '—'}</TableCell>
                ) : null}
                <TableCell className="text-right">
                  {oculto ? (
                    <TotalOculto />
                  ) : abiertaTexto ? (
                    <Badge variant="outline" size="sm">
                      <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
                      {numero(recuento?.commentCount ?? 0)} escritas
                    </Badge>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      {recuento?.scaleKind === 'nps' ? (
                        <Badge variant="secondary" size="xs">
                          NPS
                        </Badge>
                      ) : null}
                      <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                        {numero(pregunta.n + pregunta.nsnr)}
                      </Text>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <BotonIcono size="icon-xs" aria-expanded={abierta} aria-label={abierta ? 'Ocultar las respuestas' : 'Ver las respuestas por opción'} onClick={() => alternar(pregunta.id)}>
                    <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
                  </BotonIcono>
                </TableCell>
              </TableRow>
              {abierta ? (
                <TableRow>
                  {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                  <TableCell colSpan={conNsnr ? 5 : 4} className="whitespace-normal!">
                    <div className="ps-10 pe-2 pb-2">
                      {abiertaTexto ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Text size="sm" variant="muted">
                            {numero(recuento?.commentCount ?? 0)} {plural(recuento?.commentCount ?? 0, 'persona escribió', 'personas escribieron')} una respuesta. El sentimiento y el tema de cada una están en Comentarios.
                          </Text>
                          <Button variant="outline" size="sm" onClick={() => onComentarios(pregunta.id)}>
                            <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
                            Ver comentarios
                          </Button>
                        </div>
                      ) : recuento ? (
                        <Recuentos recuento={recuento} onPersonas={(opcion) => onPersonas(pregunta.id, opcion)} />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}

type Props = {
  secciones: readonly SectionResult[]
  recuentos: ReadonlyMap<string, QuestionBreakdown>
  niveles: ReadonlySet<Nivel>
  onPersonas: (pregunta: string, opcion: string) => void
  onComentarios: (pregunta: string) => void
}

export function PreguntasRecuentos({ secciones, recuentos, niveles, onPersonas, onComentarios }: Props) {
  const conNsnr = useMemo(() => [...recuentos.values()].some((recuento) => recuento.tallies.some((opcion) => opcion.isNsNr)), [recuentos])
  return (
    <ArbolResultados
      secciones={secciones}
      subtitulo={(seccion) => `${contarPreguntas(seccion)} ${plural(contarPreguntas(seccion), 'pregunta', 'preguntas')} · ${numero(respuestasDe(seccion))} ${plural(respuestasDe(seccion), 'respuesta', 'respuestas')}`}
      metrica={(seccion) => {
        if (!niveles.has(nivelDe(seccion.depth))) return <TotalOculto />
        const respuestas = respuestasDe(seccion)
        const preguntas = contarPreguntas(seccion)
        return (
          <Hint label={`${numero(respuestas)} ${plural(respuestas, 'respuesta', 'respuestas')} en ${preguntas} ${plural(preguntas, 'pregunta', 'preguntas')} · ${numero(preguntas > 0 ? respuestas / preguntas : 0)} por pregunta en promedio`}>
            <Badge variant="outline" className="tabular-nums">
              {numero(respuestas)} resp.
            </Badge>
          </Hint>
        )
      }}
      preguntas={(seccion) => (
        <TablaRecuentos preguntas={seccion.questions} recuentos={recuentos} oculto={!niveles.has('question')} conNsnr={conNsnr} onPersonas={onPersonas} onComentarios={onComentarios} />
      )}
    />
  )
}
