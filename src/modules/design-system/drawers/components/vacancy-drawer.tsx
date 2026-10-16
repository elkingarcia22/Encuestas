import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Briefcase06Icon, LogoutSquare01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldLabel,
  IconTile,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Switch,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { KICKER, STEP_INDICATOR, STEP_LINE, WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const STEPS = ['Datos', 'Requisitos', 'Publicación']
const AREAS = [
  { value: 'analitica', label: 'Analítica' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'operaciones', label: 'Operaciones' },
]
const OWNERS = [
  { value: 'laura', label: 'Laura M.' },
  { value: 'andres', label: 'Andrés P.' },
  { value: 'sara', label: 'Sara G.' },
]
const SKILLS = ['SQL', 'Power BI', 'Python', 'Comunicación', 'Estadística']

// Caso: formulario largo por pasos. Si hay cambios y se intenta cerrar, pide confirmación.
export function VacancyDrawer({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [area, setArea] = useState('analitica')
  const [mode, setMode] = useState(['hibrido'])
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState<string[]>(['SQL'])
  const [technical, setTechnical] = useState(true)
  const [owner, setOwner] = useState('laura')
  const [portal, setPortal] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const touch = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setDirty(true)
  }

  const reset = () => {
    setStep(1)
    setName('')
    setDescription('')
    setSkills(['SQL'])
    setDirty(false)
  }

  const requestOpenChange = (next: boolean) => {
    if (!next && dirty) {
      setConfirm(true)
      return
    }
    onOpenChange(next)
  }

  const publish = () => {
    notify(`Vacante «${name || 'Sin nombre'}» publicada`)
    reset()
    onOpenChange(false)
  }

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={requestOpenChange}
        size="lg"
        icon={Briefcase06Icon}
        title="Nueva vacante"
        description="Se guarda como borrador hasta que la publiques."
        headerExtra={
          <div className="border-b px-5 py-3">
            <Stepper value={step} onValueChange={setStep} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
              <StepperNav className="w-full">
                {STEPS.map((label, index) => (
                  <StepperItem key={label} step={index + 1} completed={step > index + 1} className="flex-1 last:flex-none">
                    {/* El formulario de cada paso va en el cuerpo del drawer, fuera del Stepper: sin aria-controls a un panel inexistente. */}
                    <StepperTrigger className="gap-2" aria-controls={undefined}>
                      <StepperIndicator className={STEP_INDICATOR}>{index + 1}</StepperIndicator>
                      <StepperTitle className="text-sm">{label}</StepperTitle>
                    </StepperTrigger>
                    {index < STEPS.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
                  </StepperItem>
                ))}
              </StepperNav>
            </Stepper>
          </div>
        }
        footer={
          <>
            <span className="mr-auto text-xs text-muted-foreground">
              Paso {step} de {STEPS.length}
              {dirty ? ' · cambios sin publicar' : ''}
            </span>
            <Button variant="outline" className={WS} disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
            {step < STEPS.length ? (
              <Button className={WS} disabled={step === 1 && !name.trim()} onClick={() => setStep((s) => s + 1)}>
                Siguiente
              </Button>
            ) : (
              <Button className={WS} onClick={publish}>
                Publicar vacante
              </Button>
            )}
          </>
        }
      >
        {step === 1 ? (
          <div className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="v-name">Nombre de la vacante</FieldLabel>
              <Input id="v-name" value={name} onChange={(e) => touch(setName)(e.target.value)} placeholder="Analista de datos" />
            </Field>
            <Field>
              <FieldLabel id="v-area-label">Área</FieldLabel>
              <Select value={area} onValueChange={(v) => touch(setArea)(v as string)} items={AREAS}>
                <SelectTrigger className="w-full" aria-labelledby="v-area-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel id="v-mode-label">Modalidad</FieldLabel>
              <ToggleGroup aria-labelledby="v-mode-label" value={mode} onValueChange={(v) => v.length && touch(setMode)(v as string[])} variant="outline" className="w-full">
                <ToggleGroupItem value="presencial" className="flex-1">Presencial</ToggleGroupItem>
                <ToggleGroupItem value="hibrido" className="flex-1">Híbrido</ToggleGroupItem>
                <ToggleGroupItem value="remoto" className="flex-1">Remoto</ToggleGroupItem>
              </ToggleGroup>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="v-desc">Descripción del cargo</FieldLabel>
              <Textarea
                id="v-desc"
                value={description}
                onChange={(e) => touch(setDescription)(e.target.value)}
                rows={5}
                placeholder="Qué hará la persona y con qué equipo trabajará"
                className="resize-none"
              />
              <FieldDescription>Los candidatos la ven en el portal de empleo.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel id="v-skills-label">Competencias clave</FieldLabel>
              <ToggleGroup aria-labelledby="v-skills-label" multiple value={skills} onValueChange={(v) => touch(setSkills)(v as string[])} variant="outline" size="sm" spacing={2} className="flex-wrap justify-start">
                {SKILLS.map((skill) => (
                  <ToggleGroupItem key={skill} value={skill}>
                    {skill}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Label className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 font-normal">
              <span className="flex flex-col gap-1">
                Requiere prueba técnica
                <span className="text-xs text-muted-foreground">Se envía después del filtro inicial.</span>
              </span>
              <Switch checked={technical} onCheckedChange={touch(setTechnical)} />
            </Label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-5">
            <Field>
              <FieldLabel id="v-owner-label">Responsable</FieldLabel>
              <Select value={owner} onValueChange={(v) => touch(setOwner)(v as string)} items={OWNERS}>
                <SelectTrigger className="w-full" aria-labelledby="v-owner-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OWNERS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Label className="flex items-center gap-2.5 font-normal">
              <Checkbox checked={portal} onCheckedChange={(c) => touch(setPortal)(Boolean(c))} />
              Publicar también en el portal de empleo
            </Label>
            <div className="rounded-xl bg-muted px-4 py-3.5">
              <div role="heading" aria-level={3} className={KICKER}>
                Resumen
              </div>
              <div className="mt-2 text-sm font-medium">{name || 'Sin nombre'}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {AREAS.find((a) => a.value === area)?.label} · {mode[0] === 'hibrido' ? 'Híbrido' : mode[0] === 'remoto' ? 'Remoto' : 'Presencial'} ·{' '}
                {skills.length} competencias{technical ? ' · con prueba técnica' : ''}
              </div>
            </div>
          </div>
        ) : null}
      </DrawerShell>

      {/* Salir con cambios: la ventana única del sistema (decisión 4 de la auditoría, 5-oct), con el icono de salir. El
          clic afuera no la cierra, como antes. */}
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        dismissible={false}
        media={
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={LogoutSquare01Icon} aria-hidden="true" />
          </IconTile>
        }
        title="¿Descartar la vacante?"
        sub="Tienes cambios sin publicar. Si cierras ahora se pierden."
        cancelLabel="Seguir editando"
        confirmLabel="Descartar"
        onConfirm={() => {
          reset()
          onOpenChange(false)
        }}
      />
    </>
  )
}
