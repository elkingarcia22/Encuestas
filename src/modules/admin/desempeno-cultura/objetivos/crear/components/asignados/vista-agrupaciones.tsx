import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowUp01Icon, Target02Icon, UserGroupIcon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Checkbox,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { KICKER } from '@/modules/design-system/drawers/components/drawer-styles'
import { FilasSeparadas } from '../../../../encuestas/components/marco-lista'
import { formatCount } from '../../../../encuestas/modelo/participants'
import type { SegmentKey } from '../../../../encuestas/modelo/surveyBuilderTypes'
import { TOTAL_WEIGHT, type ObjectiveSet, type ObjectiveSetKind } from '../../../modelo/constructor/cicloBuilderTypes'
import { assignmentRowId, type AssignmentSetSummary } from '../../../modelo/constructor/assignmentRows'
import { targetHint, targetLabel } from '../../../modelo/constructor/objectiveSets'
import { DrawerExcepciones } from './drawer-excepciones'
import { EstadoAgrupacion, MedidorPeso } from './piezas-asignacion'

// Lo repartido agrupado por lo que de verdad se creó: la agrupación. Varios grupos que comparten objetivos comparten
// también su 100 %, y verlos juntos es lo que dice a quién le cambia el objetivo una edición. Un marco por agrupación,
// con su casilla (marca todos sus destinatarios), el peso, el estado y, al abrirlo, sus objetivos y sus destinatarios
// con una casilla cada uno. Las tarjetas no llevan botones de acción: marcar elige sobre qué se actúa y las acciones
// salen en la fila de arriba. La casilla de la agrupación no se pinta «a medias» (la librería dibuja igual el visto):
// cuando hay solo algunos marcados, se dice en texto.

export function VistaAgrupaciones({
  tipo,
  resumenes,
  segmentBy,
  conErrores,
  marcadas,
  onAlternarFila,
  onAlternarAgrupacion,
  sets,
}: {
  tipo: ObjectiveSetKind
  resumenes: readonly AssignmentSetSummary[]
  segmentBy: SegmentKey
  conErrores: boolean
  marcadas: ReadonlySet<string>
  onAlternarFila: (filaId: string) => void
  onAlternarAgrupacion: (setId: string) => void
  /** Todo lo repartido: «N excepciones» muestra los objetivos propios de quien se sacó. */
  sets: readonly ObjectiveSet[]
}) {
  const [excepciones, setExcepciones] = useState<string | null>(null)
  // La agrupación más reciente entra abierta: es lo que se acaba de hacer.
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => new Set(resumenes.length ? [resumenes[resumenes.length - 1].set.id] : []))
  const [conocidas, setConocidas] = useState<readonly string[]>(() => resumenes.map((resumen) => resumen.set.id))
  const ids = resumenes.map((resumen) => resumen.set.id)
  const nuevas = ids.filter((id) => !conocidas.includes(id))
  if (nuevas.length || ids.length !== conocidas.length) {
    setConocidas(ids)
    if (nuevas.length) setAbiertas((actual) => new Set([...actual, ...nuevas]))
  }
  const enExcepciones = resumenes.find((resumen) => resumen.set.id === excepciones) ?? null

  return (
    <div className="flex flex-col gap-3">
      {resumenes.map((resumen) => (
        <TarjetaAgrupacion
          key={resumen.set.id}
          tipo={tipo}
          resumen={resumen}
          segmentBy={segmentBy}
          conErrores={conErrores}
          abierta={abiertas.has(resumen.set.id)}
          onAbierta={() =>
            setAbiertas((actual) => {
              const siguiente = new Set(actual)
              if (siguiente.has(resumen.set.id)) siguiente.delete(resumen.set.id)
              else siguiente.add(resumen.set.id)
              return siguiente
            })
          }
          marcadas={marcadas}
          onAlternarFila={onAlternarFila}
          onAlternarAgrupacion={onAlternarAgrupacion}
          onExcepciones={() => setExcepciones(resumen.set.id)}
        />
      ))}
      <DrawerExcepciones abierto={enExcepciones !== null} onAbiertoChange={(abrir) => (abrir ? undefined : setExcepciones(null))} excluidas={enExcepciones?.set.excludedIds ?? []} sets={sets} />
    </div>
  )
}

function TarjetaAgrupacion({
  tipo,
  resumen,
  segmentBy,
  conErrores,
  abierta,
  onAbierta,
  marcadas,
  onAlternarFila,
  onAlternarAgrupacion,
  onExcepciones,
}: {
  tipo: ObjectiveSetKind
  resumen: AssignmentSetSummary
  segmentBy: SegmentKey
  conErrores: boolean
  abierta: boolean
  onAbierta: () => void
  marcadas: ReadonlySet<string>
  onAlternarFila: (filaId: string) => void
  onAlternarAgrupacion: (setId: string) => void
  onExcepciones: () => void
}) {
  const { set, position, title, isShared, reach, excludedCount, weight, budget, issue } = resumen
  const grupal = tipo === 'grupal'
  const filas = set.targetIds.map((targetId) => assignmentRowId(set.id, targetId))
  const cuantas = filas.filter((fila) => marcadas.has(fila)).length
  const todas = cuantas > 0 && cuantas === filas.length
  const objetivos = set.objectives.length

  return (
    <Frame data-state={cuantas > 0 ? 'selected' : undefined}>
      <FrameHeader className="flex-row! flex-wrap items-center! gap-3!">
        <Checkbox checked={todas} onCheckedChange={() => onAlternarAgrupacion(set.id)} aria-label={`Seleccionar la agrupación ${title}`} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <FrameTitle className="truncate">{title}</FrameTitle>
            {isShared ? (
              <Badge variant="secondary" size="xs">
                Compartida
              </Badge>
            ) : null}
            {excludedCount > 0 ? (
              <Button variant="outline" size="xs" onClick={onExcepciones}>
                {excludedCount === 1 ? '1 excepción' : `${excludedCount} excepciones`}
              </Button>
            ) : null}
          </div>
          <FrameDescription className="truncate">
            Agrupación {position} · {formatCount(reach)} {reach === 1 ? 'persona' : 'personas'} · {objetivos} {objetivos === 1 ? 'objetivo' : 'objetivos'}
            {cuantas > 0 && !todas ? ` · ${cuantas} de ${filas.length} marcados` : ''}
          </FrameDescription>
        </div>
        <MedidorPeso peso={weight} cupo={budget} conErrores={conErrores} className="max-sm:hidden" />
        <EstadoAgrupacion problema={issue} conErrores={conErrores} className="max-lg:hidden" />
        <BotonIcono aria-label={abierta ? 'Contraer la agrupación' : 'Expandir la agrupación'} aria-expanded={abierta} onClick={onAbierta}>
          <HugeiconsIcon icon={abierta ? ArrowUp01Icon : ArrowDown01Icon} aria-hidden="true" />
        </BotonIcono>
      </FrameHeader>

      {abierta ? (
        <FramePanel className="flex flex-col gap-5">
          <section className="flex flex-col gap-2" aria-label="Objetivos de esta agrupación">
            <div className="flex items-center gap-2">
              <span className={KICKER}>Objetivos de esta agrupación</span>
              {budget !== TOTAL_WEIGHT ? (
                <Badge variant="warning-light" size="xs">
                  cupo de {budget} %
                </Badge>
              ) : null}
            </div>
            {objetivos === 0 ? (
              <Text size="sm" variant="muted">
                Esta agrupación todavía no tiene objetivos.
              </Text>
            ) : (
              <FilasSeparadas>
                {set.objectives.map((objetivo, indice) => (
                  <Item key={objetivo.id} size="sm">
                    <ItemContent>
                      <ItemTitle className="truncate">
                        <HugeiconsIcon icon={Target02Icon} className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {indice + 1}. {objetivo.title.trim() || 'Objetivo sin título'}
                      </ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      {objetivo.keyActions.length > 0 ? (
                        <Text as="span" size="xs" variant="muted" className="max-sm:hidden">
                          {objetivo.keyActions.length} {objetivo.keyActions.length === 1 ? 'acción' : 'acciones'}
                        </Text>
                      ) : null}
                      <Badge variant="secondary" size="sm" className="tabular-nums">
                        {objetivo.weight} %
                      </Badge>
                    </ItemActions>
                  </Item>
                ))}
              </FilasSeparadas>
            )}
          </section>

          <section className="flex flex-col gap-2" aria-label={grupal ? 'Grupos en esta agrupación' : 'Personas en esta agrupación'}>
            <span className={KICKER}>{grupal ? 'Grupos en esta agrupación' : 'Personas en esta agrupación'}</span>
            <FilasSeparadas>
              {set.targetIds.map((targetId) => {
                const fila = assignmentRowId(set.id, targetId)
                const nombre = targetLabel(set, targetId)
                return (
                  <Item key={fila} size="sm" className="gap-3" data-state={marcadas.has(fila) ? 'selected' : undefined}>
                    <Checkbox checked={marcadas.has(fila)} onCheckedChange={() => onAlternarFila(fila)} aria-label={`Seleccionar ${nombre}`} />
                    <ItemContent>
                      <ItemTitle className="truncate">
                        <HugeiconsIcon icon={grupal ? UserGroupIcon : UserIcon} className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {nombre}
                      </ItemTitle>
                      <ItemDescription>{targetHint(set, targetId, segmentBy)}</ItemDescription>
                    </ItemContent>
                  </Item>
                )
              })}
            </FilasSeparadas>
          </section>
        </FramePanel>
      ) : null}
    </Frame>
  )
}
