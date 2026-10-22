import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, FramePanel, Heading, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, Progress, Text } from '@ubits/flux-ui'
import { FILA_CLICABLE, FilasSeparadas, MarcoLista } from '../../../../../encuestas/components/marco-lista'
import { Badge } from '@/shared/components/Badge'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { MEASURE_META, objectiveIssue, type Objective } from '../../../../modelo/constructor/cicloBuilderTypes'
import type { ObjectiveModelRules } from '../../../../modelo/constructor/objectiveModel'

// La columna izquierda de la ventana de la asignación mientras se escriben los objetivos (21-oct, Elkin: «que ese panel
// sirva como el listado de los objetivos creados, y al lado derecho se vea y se cree»). Dos bloques, los dos con el marco del
// comparativo de Encuestas (MarcoLista: título y bajada sobre el gris, contenido en su panel blanco): cuánto
// peso va repartido —con «Ajustar pesos»— y la lista de objetivos, de la que el elegido se abre a la
// derecha con su formulario de siempre. Las filas son el Item de la librería con FILA_CLICABLE y su línea entre una y otra.

export interface IndiceObjetivosProps {
  objetivos: readonly Objective[]
  elegido: string | null
  onElegir: (id: string) => void
  /** Los que ya se dejaron incompletos: su fila sale en rojo con lo que falta, como la tarjeta al volver a abrirla. */
  revisados: ReadonlySet<string>
  conErrores: boolean
  reglas: ObjectiveModelRules
  requiereAlineacion: boolean
  total: number
  cupo: number
  onAgregar: () => void
  /** «Ajustar pesos» ya armado con su flotante; solo con dos objetivos o más. */
  ajustarPesos?: ReactNode
}

export function IndiceObjetivos({
  objetivos,
  elegido,
  onElegir,
  revisados,
  conErrores,
  reglas,
  requiereAlineacion,
  total,
  cupo,
  onAgregar,
  ajustarPesos,
}: IndiceObjetivosProps) {
  const pasado = total > cupo
  const cuadra = total === cupo

  return (
    <aside aria-label="Objetivos de la asignación" className="flex flex-col gap-4">
      {/* Los dos bloques son el mismo marco del comparativo de Encuestas: título y bajada sobre el gris, y el contenido en su panel blanco. */}
      {objetivos.length > 0 ? (
        // El peso a la vista como una cifra grande con su barra; lo que falta o sobra, en la bajada del marco.
        <MarcoLista titulo="Peso repartido" descripcion={pasado ? `Te pasaste por ${total - cupo} %` : cuadra ? 'Los pesos cuadran' : `Faltan ${cupo - total} % por repartir`}>
          <FramePanel className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <Heading as="h3" level={3} className="tabular-nums">
                {total} %
              </Heading>
              <Text as="span" size="sm" variant={pasado ? 'destructive' : 'muted'} className="tabular-nums">
                de {cupo} %
              </Text>
            </div>
            <Progress value={Math.min(100, cupo === 0 ? 0 : (total / cupo) * 100)} aria-label="Peso repartido" />
            {ajustarPesos}
          </FramePanel>
        </MarcoLista>
      ) : null}

      <section aria-label="Lista de objetivos" className="flex flex-col gap-3">
        {objetivos.length === 0 ? (
          <Text as="p" size="sm" variant="muted">
            Todavía no hay ninguno. El primero que agregues aparece aquí.
          </Text>
        ) : (
          // La misma lista del comparativo de Encuestas: marco gris con su título y su recuento, y un solo panel blanco con las
          // filas separadas por su línea (MarcoLista, FilasSeparadas y FILA_CLICABLE).
          <MarcoLista titulo="Objetivos" descripcion={`${objetivos.length} ${objetivos.length === 1 ? 'objetivo' : 'objetivos'}`}>
            {/* «!»: el relleno corto del catálogo de plantillas; con el del tema, las filas quedan lejos de su línea. */}
            <FramePanel className="py-1!">
              <FilasSeparadas>
                {objetivos.map((objetivo, indice) => {
                  const incidencia = objectiveIssue(objetivo, { requireWeight: true, rules: reglas, requireAlignment: requiereAlineacion })
                  const conError = incidencia !== null && (conErrores || revisados.has(objetivo.id))
                  const actual = objetivo.id === elegido
                  const nombre = objetivo.title.trim() || `Objetivo ${indice + 1}`
                  return (
                    <Item key={objetivo.id} size="sm" variant={actual ? 'muted' : 'default'} render={<button type="button" />} aria-current={actual ? 'true' : undefined} onClick={() => onElegir(objetivo.id)} className={FILA_CLICABLE}>
                      <ItemMedia>
                        {incidencia === null ? (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="text-success" aria-label="Completo" />
                        ) : conError ? (
                          <HugeiconsIcon icon={Alert02Icon} size={20} className="text-destructive" aria-label="Con lo que falta" />
                        ) : (
                          <Badge variant={actual ? 'primary-light' : 'secondary'} radius="full" size="default" className="tabular-nums">
                            {indice + 1}
                          </Badge>
                        )}
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        {/* El título en una línea y, al pasar el cursor, completo (TextoCompleto); la bajada, la medida o lo que falta. */}
                        <TextoCompleto texto={nombre}>
                          <ItemTitle className="max-w-full">{nombre}</ItemTitle>
                        </TextoCompleto>
                        <ItemDescription>
                          {conError ? (
                            <Text as="span" size="sm" variant="destructive">
                              {incidencia}
                            </Text>
                          ) : objetivo.measure !== null ? (
                            MEASURE_META[objetivo.measure].label
                          ) : (
                            'Sin configurar'
                          )}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Text as="span" size="sm" weight="medium" className="tabular-nums">
                          {objetivo.weight} %
                        </Text>
                      </ItemActions>
                    </Item>
                  )
                })}
              </FilasSeparadas>
            </FramePanel>
          </MarcoLista>
        )}

        <div className="flex flex-col gap-2">
          {objetivos.length > 0 ? (
            <Button variant="outline" className="w-full" onClick={onAgregar}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Agregar objetivo
            </Button>
          ) : null}
        </div>
      </section>
    </aside>
  )
}
