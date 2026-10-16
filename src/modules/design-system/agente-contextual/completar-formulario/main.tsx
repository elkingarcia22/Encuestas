import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, Undo02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { keepFocusNear } from '@/modules/admin/aprendizaje/lms-creator/components/agent-focus'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../../navegacion/components/case-frame'
import {
  AgentCard,
  AgentNote,
  AgentStage,
  AgentThinking,
  AgentThread,
  ContextPanel,
  ReopenAgentButton,
  UserBubble,
  type PanelState,
} from '../components/agent-kit'
import { PILL, PILL_XS } from '../components/agent-styles'
import styles from '../components/agent.module.css'
import { useAgentThread } from '../components/use-agent-thread'
import {
  AREAS,
  EMPTY,
  EXAMPLE,
  INFERRED,
  INITIAL_STATUS,
  LABELS,
  MISSING,
  MODES,
  OWNERS,
  display,
  type FieldKey,
  type FieldStatus,
} from './components/form-data'
import { SuggestField } from './components/suggest-field'

type Phase = 'idle' | 'reading' | 'filling' | 'done' | 'discarded'

const STATUS_LABEL: Record<FieldStatus, string> = {
  suggested: 'Por revisar',
  accepted: 'Aceptado',
  empty: 'Deshecho',
  manual: 'Editado por ti',
}

// Caso · Completar un formulario: el agente llena la vacante desde una descripción y cada campo se revisa.
export function Component() {
  const [panel, setPanel] = useState<PanelState>('open')
  const [values, setValues] = useState(EMPTY)
  const [status, setStatus] = useState(INITIAL_STATUS)
  const [phase, setPhase] = useState<Phase>('idle')
  const [request, setRequest] = useState<string | null>(null)
  const [filledKeys, setFilledKeys] = useState<FieldKey[]>([])
  const [flash, setFlash] = useState<FieldKey | null>(null)
  const timers = useRef<number[]>([])
  const thread = useAgentThread()

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const pending = filledKeys.filter((key) => status[key] === 'suggested').length
  const missingOpen = MISSING.filter(({ key }) => !values[key]).length

  const start = (text: string) => {
    // Solo llena lo que sigue vacío: no pisa lo que la persona ya escribió.
    const toFill = INFERRED.filter(({ key }) => !values[key])
    setRequest(text)
    setFilledKeys(toFill.map(({ key }) => key))
    setPhase('reading')
    setPanel('open')
    later(() => setPhase('filling'), 1400)
    toFill.forEach(({ key, value }, index) =>
      later(() => {
        setValues((current) => ({ ...current, [key]: value }))
        setStatus((current) => ({ ...current, [key]: 'suggested' }))
      }, 1650 + index * 250),
    )
    later(() => setPhase('done'), 1650 + toFill.length * 250 + 200)
  }

  const accept = (key: FieldKey) => setStatus((current) => ({ ...current, [key]: 'accepted' }))

  const undo = (key: FieldKey) => {
    setValues((current) => ({ ...current, [key]: '' }))
    setStatus((current) => ({ ...current, [key]: 'empty' }))
  }

  const acceptAll = () =>
    setStatus((current) => {
      const next = { ...current }
      for (const key of filledKeys) if (next[key] === 'suggested') next[key] = 'accepted'
      return next
    })

  const discard = () => {
    for (const key of filledKeys) if (status[key] === 'suggested') undo(key)
    setPhase('discarded')
  }

  // Escribir sobre un campo sugerido cuenta como aceptarlo.
  const edit = (key: FieldKey, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setStatus((current) => ({
      ...current,
      [key]: !value ? 'empty' : current[key] === 'suggested' || current[key] === 'accepted' ? 'accepted' : 'manual',
    }))
  }

  const focusField = (key: FieldKey) => {
    const el = document.getElementById(`campo-${key}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
    setFlash(null)
    window.requestAnimationFrame(() => setFlash(key))
    later(() => setFlash((current) => (current === key ? null : current)), 1900)
  }

  const send = (text: string) => {
    if (phase === 'idle' || phase === 'discarded') start(text)
    else
      thread.ask(
        text,
        'Tomé nota. Si la descripción cambió, pulsa «Descartar» y pégala de nuevo para volver a llenar el formulario.',
      )
  }

  const field = (key: FieldKey, children: React.ReactNode, className?: string) => (
    <SuggestField
      id={key}
      label={LABELS[key]}
      htmlFor={`v-${key}`}
      status={status[key]}
      flash={flash === key}
      onAccept={() => accept(key)}
      onUndo={() => undo(key)}
      className={className}
    >
      {children}
    </SuggestField>
  )

  const agentPanel = (
    <ContextPanel
      context={<span className="text-foreground">Formulario Nueva vacante</span>}
      onClose={() => setPanel('closed')}
      placeholder="Pega la descripción del cargo"
      onSend={send}
      // Baja una vez al pegar la descripción; al terminar se queda ahí para leer el resumen desde arriba.
      scrollKey={`${request ?? ''}-${thread.scrollKey}`}
    >
      <AgentNote>Pega la descripción del cargo o sube un archivo y lleno el formulario por ti.</AgentNote>
      {phase === 'idle' ? (
        <Button variant="outline" className={`${PILL} mt-4`} onClick={() => start(EXAMPLE)}>
          Usar un ejemplo: Analista de datos
        </Button>
      ) : null}

      {request ? (
        <UserBubble className={cn('mt-5', styles.msgIn)}>
          <span className="line-clamp-4">{request}</span>
        </UserBubble>
      ) : null}

      {phase === 'reading' ? <AgentThinking className="mt-4" label="Leyendo la descripción…" /> : null}
      {phase === 'filling' ? <AgentThinking className="mt-4" label="Llenando el formulario…" /> : null}

      {phase === 'discarded' ? (
        <div className={styles.msgIn}>
          <AgentNote className="mt-4">Descarté lo que no habías aceptado. Pega otra descripción cuando quieras.</AgentNote>
          <Button variant="outline" className={`${PILL} mt-4`} onClick={() => start(EXAMPLE)}>
            Usar un ejemplo: Analista de datos
          </Button>
        </div>
      ) : null}

      {phase === 'done' ? (
        <div className={styles.msgIn}>
          <AgentNote className="mt-4">
            {pending
              ? `Llené ${filledKeys.length} campos. Revísalos: nada queda en la vacante hasta que lo aceptes.`
              : missingOpen
                ? 'Revisaste todo lo que llené. Solo falta lo que no pude inferir.'
                : 'Todo listo. Ya puedes publicar la vacante.'}
          </AgentNote>

          <AgentCard className="mt-4 px-2! py-2!" title={<span className="px-2">Lo que llené</span>}>
            {filledKeys.map((key) => (
              <Button
                key={key}
                variant="ghost"
                className="h-auto! w-full justify-start gap-3! rounded-[10px]! px-2! py-2! text-left font-normal!"
                onClick={() => focusField(key)}
              >
                <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
                  {status[key] === 'suggested' ? (
                    <span className="size-2 rounded-full bg-primary" />
                  ) : status[key] === 'empty' ? (
                    <HugeiconsIcon icon={Undo02Icon} size={15} className="text-muted-foreground" />
                  ) : (
                    <HugeiconsIcon icon={Tick02Icon} size={16} />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{LABELS[key]}</span>
                  <span className={cn('truncate text-sm', status[key] === 'empty' && 'text-muted-foreground line-through')}>
                    {display(key, values[key] || INFERRED.find((item) => item.key === key)?.value || '')}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{STATUS_LABEL[status[key]]}</span>
              </Button>
            ))}
          </AgentCard>

          <div className="mt-4 flex items-center gap-2.5">
            {/* Los dos se desactivan al usarlos y el foco quedaría en el aire: pasa al panel. */}
            <Button
              className={PILL}
              disabled={!pending}
              onClick={(event) => {
                keepFocusNear(event.currentTarget)
                acceptAll()
              }}
            >
              Aceptar todo
            </Button>
            <Button
              variant="outline"
              className={PILL}
              disabled={!pending}
              onClick={(event) => {
                keepFocusNear(event.currentTarget)
                discard()
              }}
            >
              Descartar
            </Button>
          </div>

          <AgentCard className="mt-5" title="No pude inferir">
            <div className="flex flex-col gap-3">
              {MISSING.map(({ key, reason, cta }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{LABELS[key]}</div>
                    <div className="text-xs text-muted-foreground">{values[key] ? display(key, values[key]) : reason}</div>
                  </div>
                  {values[key] ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <HugeiconsIcon icon={Tick02Icon} size={14} />
                      Listo
                    </span>
                  ) : (
                    <Button variant="outline" className={PILL_XS} onClick={() => focusField(key)}>
                      {cta}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </AgentCard>
        </div>
      ) : null}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )

  return (
    <CaseFrame
      title="Completar un formulario"
      hint="El agente llena los campos y cada uno se acepta o se deshace"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit Flow', to: '/design-system/agente-contextual' }}
    >
      <AgentStage state={panel} onOpen={() => setPanel('open')} pending={phase === 'done' && pending > 0} panel={agentPanel}>
        <div className="px-8 py-6">
          <PageShell>
            <PageHeader
              breadcrumbs={[
                { label: 'Inicio', path: '/admin' },
                { label: 'Selección' },
                { label: 'Vacantes', path: '/design-system/navegacion/basica' },
                { label: 'Nueva vacante' },
              ]}
              title="Nueva vacante"
              description="Se guarda como borrador hasta que la publiques."
              actions={
                <>
                  <Button variant="outline" className={WS} onClick={() => notify('Borrador guardado')}>
                    Guardar borrador
                  </Button>
                  <Button className={WS} disabled={pending > 0 || !values.name} onClick={() => notify(`Vacante «${values.name}» publicada`)}>
                    Publicar vacante
                  </Button>
                  {panel === 'closed' ? <ReopenAgentButton onClick={() => setPanel('open')} /> : null}
                </>
              }
            />

            <PageContent className="gap-4">
              {pending ? (
                <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', styles.msgIn)}>
                  <Orb className="size-4.5" />
                  {pending === 1 ? '1 campo sugerido por revisar' : `${pending} campos sugeridos por revisar`} · «Publicar vacante» se activa
                  cuando los revises
                </div>
              ) : null}

              <Card className="gap-0! py-0!">
                <CardContent className="grid gap-x-8 gap-y-7 p-7! sm:grid-cols-2">
                  {field(
                    'name',
                    <Input id="v-name" value={values.name} onChange={(e) => edit('name', e.target.value)} placeholder="Analista de datos" />,
                    'sm:col-span-2',
                  )}
                  {field(
                    'area',
                    <Select value={values.area || null} onValueChange={(value) => edit('area', (value as string | null) ?? '')} items={AREAS}>
                      <SelectTrigger id="v-area" className="w-full">
                        <SelectValue placeholder="Elige un área" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>,
                  )}
                  {field('city', <Input id="v-city" value={values.city} onChange={(e) => edit('city', e.target.value)} placeholder="Bogotá" />)}
                  {field(
                    'mode',
                    <ToggleGroup
                      aria-labelledby="etiqueta-mode"
                      value={values.mode ? [values.mode] : []}
                      onValueChange={(value) => edit('mode', (value as string[]).at(-1) ?? '')}
                      variant="outline"
                      className="w-full"
                    >
                      {MODES.map((option) => (
                        <ToggleGroupItem key={option.value} value={option.value} className="flex-1">
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>,
                    'sm:col-span-2',
                  )}
                  {field(
                    'description',
                    <Textarea
                      id="v-description"
                      value={values.description}
                      onChange={(e) => edit('description', e.target.value)}
                      rows={4}
                      placeholder="Qué hará la persona y con qué equipo trabajará"
                      className="resize-none"
                    />,
                    'sm:col-span-2',
                  )}
                  {field(
                    'salary',
                    <Input id="v-salary" value={values.salary} onChange={(e) => edit('salary', e.target.value)} placeholder="$ 0" inputMode="numeric" />,
                  )}
                  {field(
                    'owner',
                    <Select value={values.owner || null} onValueChange={(value) => edit('owner', (value as string | null) ?? '')} items={OWNERS}>
                      <SelectTrigger id="v-owner" className="w-full">
                        <SelectValue placeholder="Elige quién lleva el proceso" />
                      </SelectTrigger>
                      <SelectContent>
                        {OWNERS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>,
                  )}
                </CardContent>
              </Card>
            </PageContent>
          </PageShell>
        </div>
      </AgentStage>
    </CaseFrame>
  )
}

Component.displayName = 'AgentFormFillCasePage'
