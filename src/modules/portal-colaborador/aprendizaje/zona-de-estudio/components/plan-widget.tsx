import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Badge,
  Frame,
  FramePanel,
  Field,
  FieldLabel,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { conteoContenidos, diasParaTerminar, metaPlan, minutosCompetencia, vencidoHace, vigencia, type Plan, type TipoPlan } from './datos'

// El widget del plan de las pestañas Plan de contenidos y Plan de competencias: qué plan se está viendo, su vigencia,
// el recordatorio si ya venció y el avance.

const colorEstado = (estado: string) =>
  estado === 'Vigente'
    ? 'success-light'
    : estado === 'Planeado'
      ? 'info-light'
      : String(estado).startsWith('Procesando')
        ? 'warning-light'
        : 'secondary'

export function EstadoPlan({ estado }: { estado: string }) {
  return (
    <Badge variant={colorEstado(estado)} size="xs">
      {estado}
    </Badge>
  )
}

export function PlanWidget({ tipo, planes, plan, onPlan }: { tipo: TipoPlan; planes: Plan[]; plan: Plan | undefined; onPlan: (id: string) => void }) {
  const avance = plan ? (tipo === 'competencias' ? minutosCompetencia(plan) : conteoContenidos(plan)) : null
  const id = `zona-plan-${tipo}`

  return (
    <div className="flex flex-col gap-3">
      <Frame spacing="sm">
        <FramePanel className="flex flex-col gap-4">
          {plan ? (
            <>
              <div className="flex flex-col gap-2">
                <Field>
                  <FieldLabel htmlFor={id}>Filtrar por plan</FieldLabel>
                  <Select value={plan.id} onValueChange={(valor) => valor && onPlan(String(valor))}>
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue>{(valor) => planes.find((p) => p.id === valor)?.nombre ?? 'Seleccionar plan'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="min-w-(--anchor-width) sm:min-w-130">
                      {planes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex w-full min-w-0 items-center gap-2">
                            <span className="truncate">{p.nombre}</span>
                            <EstadoPlan estado={p.estado} />
                            <Text as="span" size="xs" variant="muted" className="ml-auto shrink-0 pl-3">
                              {metaPlan(p)}
                            </Text>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <Text as="p" size="sm" variant="muted">
                    {vigencia(plan)} - termina en{' '}
                    <Text as="span" size="sm" weight="semibold" className="text-foreground">
                      {diasParaTerminar(plan)} días
                    </Text>
                  </Text>
                  <EstadoPlan estado={plan.estado} />
                </div>
              </div>

              {plan.estado === 'No vigente' ? (
                <Alert variant="destructive">
                  <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                  <AlertDescription>
                    <span>
                      <strong className="font-semibold">Recordatorio:</strong> Lo que completes después de la fecha límite no se suma al progreso del
                      plan. Este plan se venció hace {vencidoHace(plan)}.
                    </span>
                  </AlertDescription>
                </Alert>
              ) : null}

              {avance ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2">
                    <Text as="span" size="sm" weight="semibold" variant="muted">
                      Progreso:
                    </Text>
                    <Text as="span" size="sm" variant="muted" className="flex-1">
                      {avance.hechos} de {avance.total} {tipo === 'competencias' ? 'minutos' : 'contenidos'}
                    </Text>
                    <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                      {avance.pct} %
                    </Text>
                  </div>
                  <Progress value={avance.pct} aria-label="Progreso del plan" />
                </div>
              ) : null}
            </>
          ) : (
            <Text as="p" size="sm" variant="muted">
              No tienes planes {tipo === 'competencias' ? 'de competencias' : 'de contenidos'} asignados.
            </Text>
          )}
        </FramePanel>
      </Frame>
      <Text as="p" size="sm" variant="muted">
        {tipo === 'competencias' ? 'Sugerencias de contenidos para este plan de formación.' : 'Contenidos que hacen parte de este plan de formación.'}
      </Text>
    </div>
  )
}
