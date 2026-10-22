import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, Shield01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Marker,
  MarkerContent,
  MarkerIcon,
  cn,
} from '@ubits/flux-ui'
import { PEOPLE, initialsOf, type StepState } from '../../shared/data'
import type { useApprovalFlow } from './use-approval-flow'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { plural } from '@/modules/design-system/patrones/formato'

// Contenido de las ventanas del plan, copiado del prototipo.
const DRAFT_TEXT =
  'Desde el 1 de octubre cambia la forma de pedir vacaciones: la solicitud se hace con 15 días de anticipación y la aprueba tu líder directo en la plataforma. Los días acumulados no se pierden y puedes dividirlos en dos periodos al año. El curso «Política de vacaciones» explica el paso a paso en 8 minutos.'
const BOGOTA = PEOPLE.slice(0, 12).map((name) => ({ ini: initialsOf(name), title: name, meta: 'Sede Bogotá' }))
const NO_EMAIL = [
  { ini: 'JM', title: 'Julián Mena', meta: 'correo rebotado' },
  { ini: 'RC', title: 'Rocío Cárdenas', meta: 'sin correo' },
  { ini: 'TP', title: 'Tomás Pardo', meta: 'correo inválido' },
]

// Nombre del estado para el lector de pantalla: a la vista lo dicen la forma y el color del punto.
const STATE_LABEL: Record<StepState, string> = { done: 'Hecho', now: 'En curso', wait: 'Pendiente' }

// Los estados se codifican con forma y color, como los pasos de la librería: hecho = círculo lleno en primary con
// check blanco, en curso = anillo primary, pendiente = anillo gris. Antes iban en negro.
export function StateDot({ state, className }: { state: StepState; className?: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full',
          state === 'done' && 'bg-primary text-primary-foreground',
          state === 'now' && 'border-2 border-primary bg-background',
          state === 'wait' && 'border-2 border-border bg-background',
          className,
        )}
      >
        {state === 'done' ? <HugeiconsIcon icon={Tick02Icon} size={10} /> : null}
      </span>
      <span className="sr-only">{STATE_LABEL[state]}: </span>
    </>
  )
}

type ApprovalPlanProps = ReturnType<typeof useApprovalFlow>

export function ApprovalPlan({ steps, published, publish, doneCount }: ApprovalPlanProps) {
  const [confirm, setConfirm] = useState(false)
  const [draft, setDraft] = useState(false)
  const [audience, setAudience] = useState(false)
  const [noEmail, setNoEmail] = useState(false)

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center gap-2 border-b py-3">
          <CardTitle className="text-sm">Plan de 4 pasos</CardTitle>
          {/* Estado del plan en texto legible de 13px (la insignia diminuta medía 9.6px). */}
          <span
            className={cn(
              'ml-auto text-[length:13px]',
              published && doneCount === 4 ? 'font-medium text-success' : 'text-muted-foreground',
            )}
          >
            {published && doneCount === 4
              ? 'Completado'
              : `${doneCount} ${plural(doneCount, 'terminado', 'terminados')} · ${published ? '0 pendientes' : '1 requiere revisión'}`}
          </span>
        </CardHeader>
        <CardContent className="py-0">
          <ol className="divide-y divide-border">
            {steps.map((step) => (
              <li key={step.title} className="flex items-center gap-3 py-3">
                <StateDot state={step.state} />
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    step.state === 'now' && 'font-medium',
                    step.state === 'wait' && 'text-muted-foreground',
                  )}
                >
                  {step.title}
                </span>
                {step.link ? (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setDraft(true)}>
                    {step.meta}
                  </Button>
                ) : (
                  <span className={cn('text-[length:13px]', step.state === 'now' ? 'font-medium' : 'text-muted-foreground')}>
                    {step.meta}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center gap-2 border-b py-3">
          <HugeiconsIcon icon={Shield01Icon} size={16} className="text-muted-foreground" />
          <CardTitle className="text-sm">Resumen de la acción</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 divide-x divide-border py-3">
          {[
            ['Destinatarios', '312 colaboradores'],
            ['Correo', 'Se envía al publicar'],
            ['Deshacer', 'No disponible'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 px-4 first:pl-0 last:pr-0">
              <span className="text-[13px] text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex-wrap items-center gap-2 border-t bg-muted/40 py-3">
          <span className="min-w-0 flex-1 text-[13px] text-foreground/70">
            {published
              ? 'Publicado a las 9:43 · correo enviado a 309 personas'
              : 'Puedes revisar la lista antes. Publicar no se puede deshacer.'}
          </span>
          {!published ? (
            <Button variant="outline" size="sm" onClick={() => setAudience(true)}>
              Revisar audiencia
            </Button>
          ) : null}
          <Button size="sm" disabled={published} onClick={() => setConfirm(true)}>
            {published ? 'Publicado' : 'Publicar y continuar'}
          </Button>
        </CardFooter>
      </Card>

      <Marker>
        <MarkerIcon>
          <HugeiconsIcon icon={AlertCircleIcon} size={16} />
        </MarkerIcon>
        <MarkerContent className="flex flex-wrap items-center gap-2">
          <span>
            De 312 personas, <span className="font-medium">3 no tienen correo válido</span>. El resto sí recibe el aviso.
          </span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => setNoEmail(true)}
          >
            Ver las 3
          </Button>
        </MarkerContent>
      </Marker>

      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Publicar y notificar a 312 personas"
        sub="El correo sale al publicar y no se puede deshacer. Después se asigna el curso automáticamente."
        note="3 de 312 sin correo válido"
        confirmLabel="Publicar y continuar"
        onConfirm={publish}
      />
      <ActionDialog
        open={draft}
        onOpenChange={setDraft}
        title="Borrador del aviso"
        sub="Redactado con la política v3 · sede Bogotá"
        text={DRAFT_TEXT}
        note="Puedes editarlo antes de publicar"
        cancelLabel="Cerrar"
        confirmLabel="Usar este borrador"
        onConfirm={() => notify('Borrador confirmado', undefined, 'success')}
      />
      <ActionDialog
        open={audience}
        onOpenChange={setAudience}
        title="312 colaboradores · sede Bogotá"
        sub="Audiencia autorizada para el aviso"
        items={BOGOTA}
        note="Se muestran 12 de 312"
        cancelLabel="Cerrar"
      />
      <ActionDialog
        open={noEmail}
        onOpenChange={setNoEmail}
        title="3 personas sin correo válido"
        sub="No reciben el aviso por correo; sí lo ven en la plataforma"
        items={NO_EMAIL}
        note="Puedes corregirlo en Usuarios"
        cancelLabel="Cerrar"
      />
    </div>
  )
}
