import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, PencilEdit02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  RadioGroup,
  RadioGroupItem,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BADGE_ESTADO, totalPersonas, type Plan } from './planes'
import { fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { competenciasDePlan, MAX_NOMBRE, MIN_NOMBRE, motivoNoDisponible } from './banco'
import { SinResultados } from '@/shared/components/SinResultados'

// Paso 1 · Nombre y plan, en dos grupos con cabecera gris como los del asistente de Crear contenido.
//
// Primero el nombre —es lo que el admin tiene en la cabeza al entrar— y después el plan. La lista de planes **no va
// desplegada en la página**: con decenas de planes el paso se volvía un scroll larguísimo. Se elige en un panel
// lateral con buscador, el patrón que ya usa Crear plan de formación, y en la página queda solo el plan elegido.
//
// Cada plan dice lo que hace falta para elegir bien: estado, vigencia, a cuántas personas llega y cuántas
// competencias mide. Los que no dan para un assessment salen deshabilitados con el motivo.

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Primero lo que se está estudiando, después lo que viene y al final lo que ya terminó.
const ORDEN: Record<Plan['estado'], number> = { Vigente: 0, Planeado: 1, 'No vigente': 2 }

type Props = {
  planes: Plan[]
  conAssessment: Set<string>
  planId: string | null
  onPlan: (plan: Plan) => void
  nombre: string
  onNombre: (nombre: string) => void
  errorPlan?: string
  errorNombre?: string
}

export function PasoPlan({ planes, conAssessment, planId, onPlan, nombre, onNombre, errorPlan, errorNombre }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const lista = useMemo(() => {
    const q = sinTildes(busqueda.trim())
    return planes
      .filter((p) => !q || sinTildes(p.nombre).includes(q))
      .map((plan) => ({ plan, motivo: motivoNoDisponible(plan, conAssessment), competencias: competenciasDePlan(plan).length }))
      .sort((a, b) => Number(Boolean(a.motivo)) - Number(Boolean(b.motivo)) || ORDEN[a.plan.estado] - ORDEN[b.plan.estado])
  }, [planes, busqueda, conAssessment])

  const elegido = planId ? planes.find((p) => p.id === planId) : undefined
  const [eligiendo, setEligiendo] = useState(false)
  // Lo marcado dentro del panel, que todavía no es el plan del assessment: se aplica al confirmar. Antes el plan
  // cambiaba con el propio clic en el radio y el panel se cerraba solo, así que no había forma de mirar dos y
  // decidir, ni de arrepentirse (Dave, 1-oct).
  const [marcado, setMarcado] = useState<string | null>(null)

  const abrirPanel = () => {
    // Al reabrir («Cambiar plan») se parte del que está puesto, no de la marca de la vez pasada.
    setMarcado(planId)
    setEligiendo(true)
  }
  const confirmarPlan = () => {
    const plan = marcado ? planes.find((p) => p.id === marcado) : undefined
    if (plan) onPlan(plan)
    setEligiendo(false)
  }

  const listaPlanes = (
    <>
      <InputGroup className="bg-background">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput aria-label="Buscar planes" placeholder="Buscar planes" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {busqueda ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Limpiar la búsqueda" onClick={() => setBusqueda('')}>
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      {lista.length ? (
        <RadioGroup
          value={marcado ?? ''}
          onValueChange={setMarcado}
          aria-label="Plan de formación"
          className="flex flex-col gap-2"
        >
          {lista.map(({ plan, motivo, competencias }) => {
            const personas = totalPersonas(plan)
            return (
              <FieldLabel key={plan.id} htmlFor={`as-plan-${plan.id}`} className="bg-card">
                <Field orientation="horizontal" data-disabled={motivo ? true : undefined} className="items-start!">
                  <RadioGroupItem value={plan.id} id={`as-plan-${plan.id}`} disabled={Boolean(motivo)} className="mt-0.5" />
                  <FieldContent className="gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <FieldTitle>{plan.nombre}</FieldTitle>
                      <Badge variant={BADGE_ESTADO[plan.estado]} size="xs">
                        {plan.estado}
                      </Badge>
                    </div>
                    <FieldDescription>
                      {motivo ??
                        `${fechaCorta(plan.inicio)} – ${fechaCorta(plan.fin)} · ${personas.toLocaleString('es-CO')} ${plural(personas, 'persona', 'personas')} · ${competencias} ${plural(competencias, 'competencia', 'competencias')}`}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>
      ) : (
        <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
      )}
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* El nombre primero: es lo que el admin trae decidido al entrar. */}
      <Frame>
        <FrameHeader>
          <FrameTitle>El assessment</FrameTitle>
          <FrameDescription>Así lo encuentras en Diagnóstico y así lo ven tus colaboradores.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <Field data-invalid={errorNombre ? true : undefined}>
            <FieldLabel htmlFor="as-nombre">
              Nombre
              <Text as="span" size="xs" variant="muted" className="ml-auto tabular-nums" aria-live="polite">
                {nombre.length}/{MAX_NOMBRE}
              </Text>
            </FieldLabel>
            {/* Input suelto, como el título de Crear contenido: un InputGroup sin complementos deja que el
                autocompletado del navegador tape el borde redondeado. */}
            <Input
              id="as-nombre"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. Diagnóstico de liderazgo 2026"
              value={nombre}
              aria-invalid={errorNombre ? true : undefined}
              onChange={(e) => onNombre(e.target.value)}
            />
            {errorNombre ? (
              <FieldError>{errorNombre}</FieldError>
            ) : (
              <FieldDescription>Te lo proponemos con el nombre del plan. Mínimo {MIN_NOMBRE} caracteres y sin repetir el de otro assessment.</FieldDescription>
            )}
          </Field>
        </FramePanel>
      </Frame>

      <Frame>
        <FrameHeader>
          <FrameTitle>Qué plan vas a medir</FrameTitle>
          <FrameDescription>El assessment mide las competencias del plan, a las personas que lo tienen asignado.</FrameDescription>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-3">
          {elegido ? (
            <Field orientation="horizontal" className="items-center!">
              <FieldContent className="gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <FieldTitle>{elegido.nombre}</FieldTitle>
                  <Badge variant={BADGE_ESTADO[elegido.estado]} size="xs">
                    {elegido.estado}
                  </Badge>
                </div>
                <FieldDescription>
                  {`${fechaCorta(elegido.inicio)} – ${fechaCorta(elegido.fin)} · ${totalPersonas(elegido).toLocaleString('es-CO')} ${plural(totalPersonas(elegido), 'persona', 'personas')} · ${competenciasDePlan(elegido).length} ${plural(competenciasDePlan(elegido).length, 'competencia', 'competencias')}`}
                </FieldDescription>
              </FieldContent>
              <Button variant="outline" onClick={abrirPanel}>
                <HugeiconsIcon icon={PencilEdit02Icon} size={16} aria-hidden="true" />
                Cambiar plan
              </Button>
            </Field>
          ) : (
            <Button variant="outline" className="self-start" onClick={abrirPanel} aria-invalid={errorPlan ? true : undefined}>
              <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
              Elegir plan
            </Button>
          )}
          {errorPlan ? <FieldError>{errorPlan}</FieldError> : null}
        </FramePanel>
      </Frame>

      {/* El panel lateral con la lista: el mismo patrón de Crear plan de formación. */}
      <DrawerShell
        open={eligiendo}
        onOpenChange={setEligiendo}
        title="Elegir plan de formación"
        description="Solo planes de competencias. Los que ya tienen assessment o no tienen competencias salen deshabilitados."
        // 13-oct (I-009): con un plan marcado distinto del puesto, no se cierra al tocar fuera y pregunta antes de descartar.
        conCambios={marcado !== planId}
        // «Confirmar», no «Cerrar»: aquí se está eligiendo algo, y el botón es el que lo aplica. Apagado hasta que
        // haya un plan marcado, porque sin plan no hay nada que confirmar. Para salirse sin elegir está la X.
        footer={
          <Button disabled={!marcado} onClick={confirmarPlan}>
            Confirmar
          </Button>
        }
      >
        <div className="flex flex-col gap-3">{listaPlanes}</div>
      </DrawerShell>
    </div>
  )
}
