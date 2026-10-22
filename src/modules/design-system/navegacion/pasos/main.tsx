import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@ubits/flux-ui'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { STEP_INDICATOR, STEP_LINE, WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'
import { EMPTY_PLAN, STEPS, audienceCount, isStepValid, type PlanForm } from './components/plan-data'
import { AudienceStep, BasicsStep, ContentStep, ReviewStep } from './components/plan-steps'
import { BarraPasos } from '@/modules/design-system/navegacion/barra-pasos'

// Patrón · Asistente por pasos: crear algo con principio y fin, sin distracciones y a 720px.
export function Component() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<PlanForm>(EMPTY_PLAN)
  const [dirty, setDirty] = useState(false)
  const [created, setCreated] = useState(false)

  const update = (patch: Partial<PlanForm>) => {
    setForm((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  const reset = () => {
    setForm(EMPTY_PLAN)
    setStep(1)
    setDirty(false)
    setCreated(false)
  }

  const exit = () => navigate('/design-system/navegacion')

  const next = () => {
    if (step < STEPS.length) {
      setStep((s) => s + 1)
      return
    }
    setCreated(true)
    setDirty(false)
    notify(`Plan «${form.name}» creado`, undefined, 'success')
  }

  const current = STEPS[step - 1]
  const valid = isStepValid(step, form)

  return (
    <CaseFrame title="Asistente por pasos" hint="Crear algo largo en partes, con salida segura" width="narrow">
      <PageShell width="narrow">
        <PageHeader
          breadcrumbs={false}
          kicker="Planes de formación"
          title={created ? 'Plan creado' : 'Crear plan de formación'}
          description={created ? 'Ya está activo y visible para su audiencia.' : `Paso ${step} de ${STEPS.length} · ${current.label}`}
          // Una sola salida, a la derecha del título, como en Crear vacante (/admin/seleccion/exploraciones/uno/crear), que
          // Cristian eligió como la buena el 5-oct: contorno, icono de salir y «Salir de la creación». Nada de flecha de
          // volver junto al título: en un paso a paso se lee como «paso anterior». Es la pieza real de LMS Creator
          // (BotonSalirCreacion, regla de creación del 6-oct), que también dice «Volver a añadir página» o «Salir de la edición».
          // La ventana de salir la trae la pieza (`salida`, war room del 13-oct). Este asistente no tiene un borrador real
          // donde guardar, así que la ventana avisa que se pierde lo que se lleva y la barra dice «Cambios sin guardar».
          actions={
            <BotonSalirCreacion
              onClick={exit}
              salida={{ conCambios: dirty && !created }}
            />
          }
        />

        <PageContent>
          {created ? (
            <Empty className="flex-none rounded-2xl border border-solid py-14">
              <EmptyHeader>
                {/* La ilustración glass de «hecho», como en los vacíos del sistema, en vez del icono en recuadro. */}
                <EmptyMedia variant="default">
                  <ImagenGlass nombre="glass-tick" />
                </EmptyMedia>
                <EmptyTitle>«{form.name}» quedó activo</EmptyTitle>
                <EmptyDescription>
                  {audienceCount(form)} personas lo ven desde hoy en su portal
                  {form.notifyManagers ? ' y sus jefes directos recibieron un aviso.' : '.'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row justify-center gap-2">
                <Button variant="outline" className={WS} onClick={reset}>
                  Crear otro
                </Button>
                <Button className={WS} onClick={() => navigate('/admin/aprendizaje/planes-de-formacion/planes')}>
                  Ver planes
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {/* Anuncia el paso al avanzar o retroceder: el foco se queda en el botón y el cambio no se oiría. */}
              <span role="status" className="sr-only">
                Paso {step} de {STEPS.length}: {current.label}
              </span>

              {/* El Stepper envuelve también el formulario: así el paso actual queda como panel de su pestaña. */}
              <Stepper
                value={step}
                onValueChange={(value) => value < step && setStep(value)}
                indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}
                className="flex flex-col gap-6"
              >
                {/* Los pasos van en una tarjeta, como en Crear vacante y Crear contenido. */}
                <Card data-region="Pasos" className="px-5! py-4!">
                  <StepperNav className="w-full">
                    {STEPS.map((item, index) => (
                      <StepperItem key={item.label} step={index + 1} completed={step > index + 1} className="flex-1 last:flex-none">
                        <StepperTrigger className="gap-2" tabIndex={index + 1 < step ? 0 : -1}>
                          <StepperIndicator className={STEP_INDICATOR}>{index + 1}</StepperIndicator>
                          <StepperTitle className="text-sm whitespace-nowrap">
                            {item.label}
                            {/* El estado se ve por forma (check, círculo lleno o anillo); para lectores de pantalla va en texto. */}
                            {index + 1 !== step ? <span className="sr-only">{index + 1 < step ? ', hecho' : ', pendiente'}</span> : null}
                          </StepperTitle>
                        </StepperTrigger>
                        {index < STEPS.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
                      </StepperItem>
                    ))}
                  </StepperNav>
                </Card>

                <StepperContent value={step}>
                  <Card>
                    <CardHeader>
                      <CardTitle role="heading" aria-level={2}>
                        {current.label}
                      </CardTitle>
                      <CardDescription>{current.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {step === 1 ? <BasicsStep form={form} update={update} /> : null}
                      {step === 2 ? <AudienceStep form={form} update={update} /> : null}
                      {step === 3 ? <ContentStep form={form} update={update} /> : null}
                      {step === 4 ? <ReviewStep form={form} update={update} goTo={setStep} /> : null}
                    </CardContent>
                  </Card>
                </StepperContent>
              </Stepper>

              {/* Abajo, el estado del guardado a la izquierda (informa, no se pulsa) y «Atrás» con contorno + seguir. Sin
                  «Cancelar»: la salida es una sola, la de junto al título (regla de creación, 6-oct). Sin borrador real,
                  dice «Cambios sin guardar» hasta que se crea (regla «guardado-honesto», 13-oct). */}
              <BarraPasos
                className="mb-1"
                inicio={dirty ? <ChipGuardado estado="editando" /> : null}
                paso={step}
                onAtras={() => setStep((s) => s - 1)}
                principal={{ texto: step < STEPS.length ? undefined : 'Crear plan', deshabilitado: !valid, onClick: next }}
              />
            </>
          )}
        </PageContent>
      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationWizardPage'
