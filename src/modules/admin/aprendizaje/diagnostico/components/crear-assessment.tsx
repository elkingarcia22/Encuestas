import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  TooltipProvider,
  cn,
} from '@ubits/flux-ui'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'
import { VentanaSalir } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PLANES, totalPersonas, type Plan } from './planes'
import { plural } from '@/modules/design-system/patrones/formato'
import { ChipGuardado, useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { getBorradorAssessment, guardarBorradorAssessment, limpiarBorradorAssessment, sinTocar } from './borrador'
import { competenciasDePlan, MIN_NOMBRE } from './banco'
import type { Assessment, Estado, Tipo } from './datos'
import { PasoCompetencias } from './paso-competencias'
import { PasoPlan } from './paso-plan'
import { PasoProgramacion } from './paso-programacion'
import {
  aIso,
  desdeIso,
  FECHA_LARGA,
  hoy,
  inicioMinimoInicial,
  inicioMinimoSeguimiento,
  problemaDe,
  sugerir,
  type Medida,
  type Ventana,
} from './programacion'
import { ResumenAssessment } from './resumen-assessment'
import { cambiarAssessments, nombreOcupado, planesConAssessment, useAssessments } from './sesion'
import { BarraPasos } from '@/modules/design-system/navegacion/barra-pasos'

// Diagnóstico › Crear assessment: el asistente de siempre del admin (el de Crear contenido y Crear plan) —pasos arriba,
// el trabajo a la izquierda, «Así va el assessment» a la derecha y la barra de acciones abajo—. Usa los servicios que ya
// existen en producción, hechos de cuenta que están aquí: los planes de formación, el banco de pruebas por competencia y
// las reglas de fechas.
//
// Qué cambia frente a producción (Diagnóstico › Crea un Assessment):
// - Tres pasos en vez de cuatro: el plan y el nombre van juntos, y las fechas se eligen antes de crear, no después.
// - Cada plan dice su estado, vigencia, personas y competencias; los que no sirven salen deshabilitados con el motivo.
// - Las competencias dicen cuánto tiempo le van a pedir a cada persona.
// - Las fechas vienen sugeridas y cumplen las reglas; lo que no se puede elegir sale deshabilitado en el calendario.
// - Nada dice «activado» si no se activó: al final se ve qué va a pasar, cuándo y a cuántas personas les llega.

const RUTA_DIAGNOSTICO = '/admin/aprendizaje/diagnostico'

const PASOS = [
  { nombre: 'Plan', descripcion: 'Qué plan vas a medir y cómo se va a llamar.' },
  { nombre: 'Qué se mide', descripcion: 'Las competencias del plan y sus pruebas.' },
  { nombre: 'Programación', descripcion: 'Cuándo abre cada assessment.' },
] as const

type Paso = 1 | 2 | 3

/** El nombre que se propone al elegir un plan, sin chocar con otro assessment. */
function nombreSugerido(plan: Plan) {
  const base = `Diagnóstico · ${plan.nombre}`
  if (!nombreOcupado(base)) return base
  let n = 2
  while (nombreOcupado(`${base} ${n}`)) n += 1
  return `${base} ${n}`
}

/** El plan ya terminó: una medida inicial no tiene sentido. */
const terminoPlan = (plan: Plan | null) => Boolean(plan && (plan.estado === 'No vigente' || desdeIso(plan.fin) < hoy()))
const empezoPlan = (plan: Plan | null) => Boolean(plan && desdeIso(plan.inicio) <= hoy())

export function CrearAssessment() {
  const navigate = useNavigate()
  const planes = PLANES
  // Se lee para que el aviso de nombre repetido y los planes que ya tienen assessment sigan a la lista.
  useAssessments()

  // Se retoma donde se dejó: si hay borrador, el asistente abre en el paso más lejano al que se había llegado.
  const [paso, setPaso] = useState<Paso>(getBorradorAssessment().visitado as Paso)
  const [visitado, setVisitado] = useState<Paso>(getBorradorAssessment().visitado as Paso)
  if (paso > visitado) setVisitado(paso)
  const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante')
  // Los errores de un paso se muestran al intentar avanzar, no mientras se llena.
  const [intento, setIntento] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  // Se arranca del borrador: salir y volver no pierde lo que se llevaba.
  const guardado = getBorradorAssessment()
  const [planId, setPlanId] = useState<string | null>(guardado.planId)
  const [nombre, setNombre] = useState(guardado.nombre)
  const [nombreTocado, setNombreTocado] = useState(guardado.nombreTocado)
  const [resultadosVisibles, setResultadosVisibles] = useState(guardado.resultadosVisibles)
  const [inicial, setInicial] = useState<Medida>(guardado.inicial)
  const [seguimiento, setSeguimiento] = useState<Medida>(guardado.seguimiento)
  const [estadoGuardado, guardar] = useGuardadoSimulado()
  // El borrador existe desde el primer paso: en cuanto se elige un plan o se escribe un nombre ya se está guardando, y
  // por eso el chip aparece en el paso 1 y no en el 2 (Carlos, 1-oct). La regla de «tocado» es una sola y vive en
  // `sinTocar`; aquí se le pasan los valores de ahora, no los del guardado, para que el chip no llegue tarde.
  const esBorrador = !sinTocar({ ...guardado, planId, nombre, visitado })

  // El autoguardado sigue a cualquier cambio, desde que hay algo que guardar.
  useEffect(() => {
    guardarBorradorAssessment({ planId, nombre, nombreTocado, resultadosVisibles, inicial, seguimiento, visitado })
    if (esBorrador) guardar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, nombre, nombreTocado, resultadosVisibles, inicial, seguimiento, visitado, esBorrador])

  const plan = planes.find((p) => p.id === planId) ?? null
  const competencias = useMemo(() => (plan ? competenciasDePlan(plan) : []), [plan])
  const personas = plan ? totalPersonas(plan) : 0
  const planTermino = terminoPlan(plan)
  const minimoInicial = inicioMinimoInicial()
  const minimoSeguimiento = plan ? inicioMinimoSeguimiento(plan.fin, !planTermino && inicial.programar ? inicial.ventana : undefined) : hoy()

  // ── Validación ──
  const errorPlan = plan ? undefined : 'Elige el plan que vas a medir.'
  const errorNombre =
    nombre.trim().length < MIN_NOMBRE
      ? `Escribe al menos ${MIN_NOMBRE} caracteres.`
      : nombreOcupado(nombre)
        ? 'Ya hay un assessment con ese nombre. Elige otro.'
        : undefined
  const problemaInicial = !planTermino && inicial.programar ? problemaDe(inicial.ventana, minimoInicial) : null
  const problemaSeguimiento = seguimiento.programar ? problemaDe(seguimiento.ventana, minimoSeguimiento) : null
  const ningunoHabilitado = !seguimiento.programar && (planTermino || !inicial.programar)
  const validos: Record<Paso, boolean> = {
    1: !errorPlan && !errorNombre,
    2: true,
    // Sin ninguno habilitado no hay nada que crear: el assessment sería una carcasa vacía.
    3: ningunoHabilitado ? false : !problemaInicial && !problemaSeguimiento,
  }

  const falta = [
    ...(errorPlan ? ['Plan de formación'] : []),
    ...(errorNombre ? ['Nombre del assessment'] : []),
    ...(visitado >= 3 && problemaInicial ? ['Fechas del assessment inicial'] : []),
    ...(visitado >= 3 && problemaSeguimiento ? ['Fechas del seguimiento'] : []),
    ...(visitado >= 3 && ningunoHabilitado ? ['Habilitar al menos un assessment'] : []),
  ]
  const total = 2 + (visitado >= 3 ? Math.max(1, Number(!planTermino && inicial.programar) + Number(seguimiento.programar)) : 0)

  // ── Cambios ──
  const elegirPlan = (nuevo: Plan) => {
    setPlanId(nuevo.id)
    if (!nombreTocado) setNombre(nombreSugerido(nuevo))
    // Las fechas se proponen de nuevo con cada plan: dependen de cuándo termina. El inicial mide el punto de partida,
    // así que solo viene encendido si el plan todavía no empieza; si ya empezó o terminó llega apagado y con su aviso,
    // pero con fechas puestas para que encenderlo sea un clic.
    const termino = terminoPlan(nuevo)
    const ventanaInicial = sugerir(inicioMinimoInicial())
    setInicial({ programar: !empezoPlan(nuevo) && !termino, ventana: ventanaInicial })
    setSeguimiento({ programar: true, ventana: sugerir(inicioMinimoSeguimiento(nuevo.fin, ventanaInicial)) })
  }

  const cambiarInicial = (medida: Medida) => {
    setInicial(medida)
    if (!plan) return
    // Si la inicial cierra más tarde, el seguimiento se corre para abrir después de ella.
    const minimo = inicioMinimoSeguimiento(plan.fin, medida.programar ? medida.ventana : undefined)
    if (seguimiento.programar && seguimiento.ventana?.from && seguimiento.ventana.from < minimo) {
      setSeguimiento({ ...seguimiento, ventana: sugerir(minimo) })
      notify('Movimos el seguimiento', `Ahora abre el ${FECHA_LARGA.format(minimo)}, después de que cierra el assessment inicial.`)
    }
  }

  // ── Navegación ──
  const alcanzable = (destino: Paso) => destino <= paso || PASOS.slice(0, destino - 1).every((_, i) => validos[(i + 1) as Paso])
  const hecho = (n: Paso) => n < paso || (n > paso && n <= visitado && PASOS.slice(0, n).every((_, i) => validos[(i + 1) as Paso]))

  const irAlPaso = (siguiente: Paso) => {
    setDireccion(siguiente > paso ? 'adelante' : 'atras')
    setIntento(false)
    setPaso(siguiente)
  }

  const inicio = useRef<HTMLDivElement>(null)
  useEffect(() => {
    inicio.current?.scrollIntoView({ block: 'start' })
  }, [paso])

  useEffect(() => {
    document.title = 'Crear assessment · Playground UX'
  }, [])

  // El borrador se conserva: es lo que promete la confirmación («puedes retomarlo cuando quieras»). Si no se tocó
  // nada no hay borrador que conservar y se limpia el rastro.
  const salir = () => {
    if (!esBorrador) limpiarBorradorAssessment()
    navigate(RUTA_DIAGNOSTICO)
  }
  // Quien solo entró a mirar se va de una: no hay nada que confirmar ni nada guardado.
  const pedirSalir = () => (esBorrador ? setSaliendo(true) : salir())

  // ── Crear ──
  const crear = () => {
    if (!plan) return
    const hoyIso = aIso(hoy())
    const registro = (tipo: Tipo, medida: Medida, sufijo: string): Assessment => {
      const v: Ventana = medida.programar ? medida.ventana : undefined
      const inicioIso = v?.from ? aIso(v.from) : null
      const finIso = v?.to ? aIso(v.to) : null
      const estado: Estado = !inicioIso ? 'Inactivo' : inicioIso <= hoyIso ? 'Vigente' : 'Planeado'
      return {
        id: `axs-nuevo-${Date.now()}-${sufijo}`,
        planId: plan.id,
        nombre: nombre.trim(),
        tipo,
        inicio: inicioIso,
        fin: finIso,
        respondieron: 0,
        respondieronIds: [],
        convocados: personas,
        estado,
        competencias: competencias.map((c) => c.nombre),
        resultadosVisibles,
      }
    }
    // Como en la lista: el par junto, seguimiento antes que inicial. Si el plan terminó, solo hay seguimiento.
    // Solo se crea lo que quedó habilitado: dejar el interruptor apagado es decir «este no lo necesito», no «créalo
    // apagado». Como en la lista, el par va junto y el seguimiento antes que el inicial.
    const nuevos = [
      ...(seguimiento.programar ? [registro('Seguimiento', seguimiento, 'seg')] : []),
      ...(!planTermino && inicial.programar ? [registro('Inicial', inicial, 'ini')] : []),
    ]
    cambiarAssessments((todos) => [...nuevos, ...todos])

    const primera = nuevos.map((a) => a.inicio as string).filter(Boolean).sort()[0]
    notify(
      `Assessment «${nombre.trim()}» creado`,
      primera
        ? `Abre el ${FECHA_LARGA.format(desdeIso(primera))} y ese día se les avisa a ${personas.toLocaleString('es-CO')} ${plural(personas, 'persona', 'personas')}.`
        : undefined,
    )
    // Se aterriza en el listado: el aviso de abajo ya cuenta qué quedó y cuándo abre.
    limpiarBorradorAssessment()
    navigate(RUTA_DIAGNOSTICO)
  }

  const avanzar = () => {
    if (!validos[paso]) {
      setIntento(true)
      return
    }
    if (paso === PASOS.length) crear()
    else irAlPaso((paso + 1) as Paso)
  }

  const actual = PASOS[paso - 1]
  const ultimo = paso === PASOS.length

  return (
    <TooltipProvider delay={300}>
      <PageShell width="default">
        <div ref={inicio} aria-hidden="true" className="scroll-mt-24" />
        {/* Sin flecha de volver a la izquierda del título: en un paso a paso se lee como «paso anterior» cuando en
            realidad sacaba del flujo. Para atrás está el botón de la barra de abajo, y la salida es la de la derecha
            (Carlos, 1-oct). */}
        <PageHeader
          title="Crear assessment"
          description={`Paso ${paso} de ${PASOS.length} · ${actual.descripcion}`}
          actions={
            // Secundario y con el nombre completo, como la salida de Crear vacante y la de Crear contenido.
            <Button variant="outline" onClick={pedirSalir}>
              <HugeiconsIcon icon={Logout01Icon} size={16} aria-hidden="true" />
              Salir de la creación
            </Button>
          }
        />

        <PageContent>
          <>
              <span role="status" className="sr-only">
                Paso {paso} de {PASOS.length}: {actual.nombre}
              </span>

              <Stepper
                value={paso}
                onValueChange={(valor) => valor !== paso && alcanzable(valor as Paso) && irAlPaso(valor as Paso)}
                indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}
                className="flex flex-col gap-6"
              >
                <StepperNav className="w-full">
                  {PASOS.map((item, indice) => {
                    const n = (indice + 1) as Paso
                    return (
                      <StepperItem key={item.nombre} step={n} completed={hecho(n)} className="flex-1 last:flex-none">
                        <StepperTrigger className={cn('gap-2', !alcanzable(n) && 'cursor-default')} tabIndex={n !== paso && alcanzable(n) ? 0 : -1}>
                          <StepperIndicator className={STEP_INDICATOR}>{n}</StepperIndicator>
                          <StepperTitle className="text-sm whitespace-nowrap">
                            {item.nombre}
                            {n !== paso ? <span className="sr-only">{hecho(n) ? ', hecho' : ', pendiente'}</span> : null}
                          </StepperTitle>
                        </StepperTrigger>
                        {indice < PASOS.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
                      </StepperItem>
                    )
                  })}
                </StepperNav>

                <StepperContent value={paso}>
                  <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div
                      key={paso}
                      className={cn(
                        'min-w-0 animate-in duration-300 fade-in motion-reduce:animate-none',
                        direccion === 'adelante' ? 'slide-in-from-right-6' : 'slide-in-from-left-6',
                      )}
                    >
                      {paso === 1 ? (
                        <PasoPlan
                          planes={planes}
                          conAssessment={planesConAssessment()}
                          planId={planId}
                          onPlan={elegirPlan}
                          nombre={nombre}
                          onNombre={(valor) => {
                            setNombre(valor.replace(/\n/g, ' '))
                            setNombreTocado(true)
                          }}
                          errorPlan={intento ? errorPlan : undefined}
                          errorNombre={intento || nombreTocado ? errorNombre : undefined}
                        />
                      ) : null}
                      {paso === 2 && plan ? (
                        <PasoCompetencias
                          competencias={competencias}
                          nombrePlan={plan.nombre}
                          resultadosVisibles={resultadosVisibles}
                          onResultados={setResultadosVisibles}
                        />
                      ) : null}
                      {paso === 3 && plan ? (
                        <PasoProgramacion
                          planTermino={planTermino}
                          planEmpezo={empezoPlan(plan)}
                          inicioPlan={desdeIso(plan.inicio)}
                          finPlan={desdeIso(plan.fin)}
                          personas={personas}
                          inicial={inicial}
                          seguimiento={seguimiento}
                          minimoInicial={minimoInicial}
                          minimoSeguimiento={minimoSeguimiento}
                          mostrarErrores
                          onInicial={cambiarInicial}
                          onSeguimiento={setSeguimiento}
                        />
                      ) : null}
                    </div>
                    <div className="lg:sticky lg:top-0">
                      <ResumenAssessment
                        plan={plan}
                        nombre={nombre}
                        personas={personas}
                        competencias={competencias.map((c) => c.nombre)}
                        resultadosVisibles={resultadosVisibles}
                        inicial={inicial}
                        seguimiento={seguimiento}
                        planTermino={planTermino}
                        paso={visitado}
                        falta={falta}
                        total={total}
                      />
                    </div>
                  </div>
                </StepperContent>
              </Stepper>

              {/* La barra de los pasos del sistema (BarraPasos, 13-oct). El estado del guardado aparece en cuanto hay
                  algo que guardar, también en el paso 1. */}
              <BarraPasos
                className="mb-1"
                inicio={esBorrador ? <ChipGuardado estado={estadoGuardado} /> : null}
                paso={paso}
                onAtras={() => irAlPaso((paso - 1) as Paso)}
                principal={{ texto: ultimo ? 'Crear assessment' : undefined, onClick: avanzar }}
              />
          </>
        </PageContent>

        {/* Una sola pregunta, y no es una advertencia: el assessment se guarda desde el primer paso, así que no hay
            nada que perder. Está para evitar el clic por error y para contarle dónde quedó. Solo aparece si se eligió
            o escribió algo; si no, se sale de una. Idéntica a la de Crear contenido, sin tarjeta del registro en el
            cuerpo (Carlos, 1-oct; el jefe de Dave, 13-oct: todas las salidas de la creación, iguales). */}
        <VentanaSalir
          abierto={saliendo}
          onAbiertoChange={setSaliendo}
          borrador
          mensaje="El assessment queda guardado como borrador. Puedes retomarlo cuando quieras desde Diagnóstico."
          onSalir={() => {
            setSaliendo(false)
            salir()
          }}
        />
      </PageShell>
    </TooltipProvider>
  )
}
