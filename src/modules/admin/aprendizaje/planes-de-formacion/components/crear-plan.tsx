import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { notify } from '@/shared/components/notify'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { HOY, fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { AgentePlanes, useAgente, type Borrador } from './agente-aprendizaje'
import { aFecha, aIso, erroresDe, type DatosPlan } from './datos-plan'
import { PasoDatos } from './paso-datos'
import { PasoQuienes } from './paso-quienes'
import { PasoQueVen } from './paso-que-ven'
import { PasoRevisar } from './paso-revisar'
import { PASOS, PasosPlan, SelectorAsignaciones, asignacionLista, asignacionVacia, indiceDe, type PasoId } from './pasos-crear'
import { PlanCreado } from './plan-creado'
import { ResumenPlan } from './resumen-plan'
import { MAXIMO_COMPETENCIAS, TIPOS, cambiarPlanes, miembrosDe, personasDelPlan, rutaPlan, type Asignacion, type Plan, type TipoPlan } from './planes-datos'

// Crear plan (/…/planes/crear?tipo=…), armado como el constructor de Encuestas (Elkin): los pasos en una fila arriba, el
// trabajo a la izquierda, «Así va el plan» a la derecha y la barra fija abajo con Volver y Continuar. Cuatro pasos:
// 1. Datos del plan: nombre, descripción opcional, tipo (contenidos o competencias) y fechas (y horas en competencias).
// 2. A quiénes: arma UNA asignación a la vez (toda la empresa, grupos, personas o un archivo). Arriba, las asignaciones
//    del plan en pastillas, para pasar de una a otra o sumar otra.
// 3. Qué ven: todas las asignaciones lado a lado y el catálogo debajo; lo que se toca entra a la asignación activa.
// 4. Revisar y guardar: una ficha por asignación, «Agregar otra asignación» y lo que pasa al guardar.
// Al guardar (RN-11) nace Planeado, o Vigente si empieza hoy (RN-04), y se ve «Plan de formación creado».
// Antes (14-oct) eran tres pasos con todas las asignaciones como tarjetas editables en uno solo; el diseño aprobado el
// 15-oct separa a quiénes de qué ven, como Participantes y Secciones en Encuestas.

const nuevaAsignacion = (): Asignacion => ({ id: `a-${Date.now()}-${Math.round(Math.random() * 1000)}`, alcance: 'colaboradores', destinatarios: [], sumadas: [], fuera: [], personas: 0, items: [] })
const n = (cuantas: number) => cuantas.toLocaleString('es-CO')

export function CrearPlan() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const borradorAgente = (useLocation().state as { borrador?: Borrador } | null)?.borrador
  const tipoInicial: TipoPlan = parametros.get('tipo') === 'competencias' ? 'competencias' : 'contenidos'
  const lista = tipoInicial === 'competencias' ? `${rutaPlan()}?tipo=competencias` : rutaPlan()
  const agente = useAgente()

  const [tipo, setTipo] = useState<TipoPlan>(tipoInicial)
  const textos = TIPOS[tipo]
  const [datos, setDatos] = useState<DatosPlan>(() => ({
    nombre: borradorAgente?.nombre ?? '',
    inicio: borradorAgente ? aFecha(borradorAgente.inicio) : undefined,
    fin: borradorAgente ? aFecha(borradorAgente.fin) : undefined,
    horas: 8,
  }))
  const [descripcion, setDescripcion] = useState('')
  const [conDescripcion, setConDescripcion] = useState(false)
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(() => (borradorAgente?.asignaciones.length ? borradorAgente.asignaciones : [nuevaAsignacion()]))
  const [actualId, setActualId] = useState(() => asignaciones[0].id)
  const [paso, setPaso] = useState<PasoId>('datos')
  const [visitados, setVisitados] = useState<ReadonlySet<PasoId>>(() => new Set(['datos']))
  const [tocado, setTocado] = useState(Boolean(borradorAgente))
  const [errores, setErrores] = useState<ReadonlySet<PasoId>>(() => new Set())
  const [creado, setCreado] = useState<Plan | null>(null)

  const actual = asignaciones.find((a) => a.id === actualId) ?? asignaciones[0]
  const numeroActual = asignaciones.indexOf(actual) + 1
  const validas = asignaciones.filter((a) => !asignacionVacia(a))

  // El plan tal como va quedando: lo leen el resumen, la barra y el agente.
  const plan: Plan = useMemo(
    () => ({
      id: 'nuevo',
      nombre: datos.nombre.trim(),
      tipo,
      estado: 'Planeado',
      inicio: aIso(datos.inicio ?? HOY),
      fin: aIso(datos.fin ?? datos.inicio ?? HOY),
      horas: tipo === 'competencias' ? datos.horas : undefined,
      asignaciones,
      tocado: 0,
    }),
    [datos, asignaciones, tipo],
  )
  const totalPersonas = personasDelPlan(plan).length
  const distintos = new Set(asignaciones.flatMap((a) => a.items)).size

  // ── Qué falta en cada paso ──
  const e = erroresDe(datos)
  const datosListos = !e.nombre && !e.inicio && !e.fin
  const pasaTope = (a: Asignacion) => tipo === 'competencias' && a.items.length > MAXIMO_COMPETENCIAS
  const conPersonas = asignaciones.filter((a) => miembrosDe(a).length > 0)
  const sinItems = conPersonas.find((a) => !a.items.length || pasaTope(a))
  const completo = (id: PasoId): boolean =>
    id === 'datos'
      ? datosListos
      : id === 'quienes'
        ? miembrosDe(actual).length > 0
        : id === 'que'
          ? conPersonas.length > 0 && !sinItems
          : validas.length > 0 && validas.every((a) => asignacionLista(a) && !pasaTope(a))
  const plano = validas.length > 0 && validas.every(asignacionLista) && datosListos
  const falta = [...(e.nombre ? ['Nombre del plan'] : []), ...(e.inicio || e.fin ? ['Fechas del plan'] : []), ...(!plano ? ['Al menos una asignación completa'] : [])]

  // Qué decir cuando un paso no está listo, y a qué asignación llevar.
  const avisarPendiente = (id: PasoId) => {
    setErrores((previos) => new Set([...previos, id]))
    if (id === 'datos') return notify('Completa los datos del plan para seguir.', undefined, 'warning')
    if (id === 'quienes') return notify(`Elige a quiénes les llega la Asignación ${numeroActual}.`, undefined, 'warning')
    if (sinItems) {
      setActualId(sinItems.id)
      const numero = asignaciones.indexOf(sinItems) + 1
      const mensaje = pasaTope(sinItems) ? `La Asignación ${numero} tiene más de ${MAXIMO_COMPETENCIAS} competencias.` : `A la Asignación ${numero} le faltan ${textos.items}.`
      return notify(mensaje, undefined, 'warning')
    }
    notify(`Elige a quiénes les llega al menos una asignación y qué ven.`, undefined, 'warning')
  }

  const marca = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    marca.current?.scrollIntoView({ block: 'start' })
  }, [paso])

  const irA = (destino: PasoId) => {
    setPaso(destino)
    setVisitados((previos) => new Set([...previos, destino]))
  }

  // Los pasos se recorren en orden: saltar a uno más adelante pide completar los anteriores (el candado de Encuestas).
  const pedirPaso = (destino: PasoId) => {
    if (indiceDe(destino) <= indiceDe(paso)) return irA(destino)
    const pendiente = PASOS.slice(0, indiceDe(destino)).find((p) => !completo(p.id))
    if (pendiente) return avisarPendiente(pendiente.id)
    irA(destino)
  }

  const continuar = () => {
    if (!completo(paso)) return avisarPendiente(paso)
    const siguiente = PASOS[indiceDe(paso) + 1]
    if (siguiente) irA(siguiente.id)
  }

  const cambiarDatos = (cambio: Partial<DatosPlan>) => {
    setDatos((previos) => ({ ...previos, ...cambio }))
    setTocado(true)
  }
  const cambiarAsignacion = (cambiada: Asignacion) => {
    setAsignaciones((todas) => todas.map((a) => (a.id === cambiada.id ? cambiada : a)))
    setTocado(true)
  }
  // Los contenidos y las competencias son catálogos distintos: cambiar el tipo vacía lo elegido.
  const cambiarTipo = (siguiente: TipoPlan) => {
    if (siguiente === tipo) return
    if (asignaciones.some((a) => a.items.length)) {
      setAsignaciones((todas) => todas.map((a) => ({ ...a, items: [], habilidades: undefined })))
      const detalle = `Un ${TIPOS[siguiente].singular.toLowerCase()} se arma con ${TIPOS[siguiente].items}. Las personas de cada asignación se quedan.`
      notify(`Quitamos los ${textos.items} elegidos`, detalle, 'info')
    }
    setTipo(siguiente)
    setTocado(true)
  }

  // Otra asignación: empieza en «A quiénes». Si ya hay una vacía, se usa esa en vez de sumar otra.
  const otraAsignacion = () => {
    const vacia = asignaciones.find(asignacionVacia)
    if (vacia) setActualId(vacia.id)
    else {
      const nueva = nuevaAsignacion()
      setAsignaciones((todas) => [...todas, nueva])
      setActualId(nueva.id)
    }
    setTocado(true)
    irA('quienes')
  }
  const quitarAsignacion = (id: string) => {
    const quedan = asignaciones.filter((a) => a.id !== id)
    const final = quedan.length ? quedan : [nuevaAsignacion()]
    setAsignaciones(final)
    if (id === actualId) setActualId(final[0].id)
    notify('Asignación quitada', undefined, 'success')
  }

  const saliendo = useRef(false)
  const bloqueo = useBlocker(({ currentLocation, nextLocation }) => tocado && !saliendo.current && currentLocation.pathname !== nextLocation.pathname)
  const salidaBloqueada = bloqueo.state === 'blocked' ? bloqueo : null

  const guardar = () => {
    if (!datosListos || !datos.inicio || !datos.fin) {
      irA('datos')
      return avisarPendiente('datos')
    }
    const incompleta = validas.find((a) => !asignacionLista(a) || pasaTope(a))
    if (!validas.length || incompleta) {
      const destino = incompleta ?? actual
      setActualId(destino.id)
      setErrores((previos) => new Set([...previos, 'revisar']))
      const sinPersonas = !miembrosDe(destino).length
      const numero = asignaciones.indexOf(destino) + 1
      const detalle = sinPersonas ? `La Asignación ${numero} no le llega a nadie todavía.` : `A la Asignación ${numero} le faltan ${textos.items}.`
      irA(sinPersonas ? 'quienes' : 'que')
      return notify('Falta completar el plan', detalle, 'warning')
    }
    const id = `p-${Date.now()}`
    // Empieza hoy: ya está Vigente. Si no, Planeado hasta la fecha de inicio (RN-04).
    const guardado: Plan = {
      ...plan,
      id,
      estado: aIso(datos.inicio) <= aIso(HOY) ? 'Vigente' : 'Planeado',
      asignaciones: validas.map((a) => ({ ...a, personas: miembrosDe(a).length })),
      tocado: Date.now(),
    }
    cambiarPlanes((todos) => [guardado, ...todos])
    saliendo.current = true
    setCreado(guardado)
  }

  // «Crear otro plan» desde la pantalla de creado: todo vuelve a empezar.
  const empezarDeNuevo = () => {
    const nueva = nuevaAsignacion()
    setDatos({ nombre: '', inicio: undefined, fin: undefined, horas: 8 })
    setDescripcion('')
    setConDescripcion(false)
    setAsignaciones([nueva])
    setActualId(nueva.id)
    setPaso('datos')
    setVisitados(new Set(['datos']))
    setErrores(new Set())
    setTocado(false)
    setCreado(null)
    saliendo.current = false
  }

  if (creado) return <PlanCreado plan={creado} onVer={() => navigate(rutaPlan(creado.id))} onOtro={empezarDeNuevo} onVolver={() => navigate(lista)} />

  const ultimo = paso === 'revisar'
  const conResumen = paso !== 'que'
  const completos = new Set(PASOS.map((p) => p.id).filter((id) => visitados.has(id) && id !== paso && completo(id)))
  const bloqueados = new Set(PASOS.filter((_, i) => PASOS.slice(0, i).some((q) => !completo(q.id))).map((p) => p.id))
  const fallidos = new Set([...errores].filter((id) => !completo(id)))

  return (
    <PageShell>
      <span ref={marca} aria-hidden="true" />
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Aprendizaje' }, { label: 'Planes de formación', path: lista }, { label: 'Crear plan' }]}
        title="Crear plan de formación"
        description={`Paso ${indiceDe(paso) + 1} de ${PASOS.length} · ${PASOS[indiceDe(paso)].descripcion}`}
        actions={
          <>
            <BotonSalirCreacion onClick={() => navigate(lista)} />
            {agente.disponible ? <ReopenAgentButton onClick={agente.abrir} /> : null}
          </>
        }
      />

      <PageContent className="@container">
        <span role="status" className="sr-only">
          Paso {indiceDe(paso) + 1} de {PASOS.length}: {PASOS[indiceDe(paso)].titulo}
        </span>
        <div className="flex flex-col gap-6">
          <PasosPlan paso={paso} completos={completos} bloqueados={bloqueados} fallidos={fallidos} onPaso={pedirPaso} />

          <div className={conResumen ? 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]' : 'min-w-0'}>
            <div className="flex min-w-0 flex-col gap-4">
              {paso === 'datos' ? (
                <PasoDatos
                  tipo={tipo}
                  datos={datos}
                  descripcion={descripcion}
                  conDescripcion={conDescripcion}
                  conErrores={errores.has('datos')}
                  onDatos={cambiarDatos}
                  onTipo={cambiarTipo}
                  onDescripcion={(texto) => {
                    setDescripcion(texto)
                    setTocado(true)
                  }}
                  onConDescripcion={setConDescripcion}
                />
              ) : paso === 'quienes' ? (
                <>
                  <SelectorAsignaciones asignaciones={asignaciones} actual={actual.id} onElegir={setActualId} onOtra={otraAsignacion} />
                  <PasoQuienes key={actual.id} asignacion={actual} numero={numeroActual} tipo={tipo} planNombre={datos.nombre} conErrores={errores.has('quienes')} onCambio={cambiarAsignacion} />
                </>
              ) : paso === 'que' ? (
                <PasoQueVen
                  tipo={tipo}
                  horas={datos.horas}
                  inicio={datos.inicio}
                  fin={datos.fin}
                  asignaciones={asignaciones}
                  activa={actual.id}
                  conErrores={errores.has('que')}
                  onActiva={setActualId}
                  onCambio={(todas) => {
                    setAsignaciones(todas)
                    setTocado(true)
                  }}
                  onOtra={otraAsignacion}
                  onQuienes={(id) => {
                    setActualId(id)
                    irA('quienes')
                  }}
                />
              ) : (
                <PasoRevisar
                  tipo={tipo}
                  horas={datos.horas}
                  asignaciones={asignaciones}
                  conErrores={errores.has('revisar')}
                  aviso={`Al guardar, el plan queda ${datos.inicio && aIso(datos.inicio) <= aIso(HOY) ? 'Vigente' : 'Planeado'}. El ${datos.inicio ? fechaCorta(aIso(datos.inicio)) : 'día de inicio'} les llega a ${n(totalPersonas)} ${plural(totalPersonas, 'persona', 'personas')}. Después lo sigues cambiando en la página del plan.`}
                  onEditar={(id, destino) => {
                    setActualId(id)
                    irA(destino)
                  }}
                  onOtra={otraAsignacion}
                  onQuitar={quitarAsignacion}
                />
              )}
            </div>
            {conResumen ? (
              <aside aria-label="Así va el plan" className="lg:sticky lg:top-6">
                <ResumenPlan
                  paso={paso}
                  nombre={datos.nombre.trim()}
                  descripcion={descripcion}
                  tipo={tipo}
                  inicio={datos.inicio}
                  fin={datos.fin}
                  horas={datos.horas}
                  asignaciones={asignaciones}
                  actual={actual}
                  totalPersonas={totalPersonas}
                />
              </aside>
            ) : null}
          </div>
        </div>

        {/* «mt-auto!», como en Encuestas: con un paso corto la barra baja hasta el final; el margen del tema le gana a la clase suelta. */}
        <PageActionBar className="mt-auto!">
          {tocado ? <ChipGuardado estado="editando" /> : null}
          {/* En «Qué ven» no hay panel a la derecha: el recuento del plan va aquí. */}
          {paso === 'que' ? (
            <Text as="span" size="sm" variant="muted" role="status" className="tabular-nums">
              {n(validas.length)} {plural(validas.length, 'asignación', 'asignaciones')} · {n(totalPersonas)} {plural(totalPersonas, 'persona', 'personas')} · {n(distintos)}{' '}
              {tipo === 'competencias' ? plural(distintos, 'competencia distinta', 'competencias distintas') : plural(distintos, 'contenido distinto', 'contenidos distintos')}
            </Text>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" disabled={indiceDe(paso) === 0} onClick={() => irA(PASOS[indiceDe(paso) - 1].id)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Atrás
            </Button>
            {ultimo ? (
              <Button onClick={guardar}>Guardar plan</Button>
            ) : (
              <Button onClick={continuar}>
                Continuar
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </Button>
            )}
          </div>
        </PageActionBar>
      </PageContent>

      {/* Salir con cambios: las tres salidas de Encuestas y Nuevo grupo. */}
      <DialogoConfirmar
        abierto={salidaBloqueada !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
        icono={Logout01Icon}
        titulo="¿Salir de la creación?"
        descripcion={plano ? 'El plan todavía no está guardado. Guárdalo para no perderlo.' : 'El plan todavía no está completo, así que no se puede guardar. Si sales, se pierde.'}
        cancelar="Seguir editando"
        otra={plano ? { texto: 'Salir sin guardar', onClick: () => salidaBloqueada?.proceed() } : undefined}
        accion={plano ? 'Guardar y salir' : 'Salir sin guardar'}
        destructiva={!plano}
        onConfirmar={() => {
          if (plano) {
            salidaBloqueada?.reset()
            guardar()
          } else salidaBloqueada?.proceed()
        }}
      >
        <RegistroConfirmar nombre={datos.nombre.trim() || 'Plan sin nombre'} detalle={`${textos.singular} · nuevo`} estado="Sin guardar" />
      </DialogoConfirmar>

      {agente.portal(
        <AgentePlanes
          pantalla="formulario"
          tipo={tipo}
          nombre={datos.nombre}
          asignaciones={validas}
          falta={falta}
          onAgregar={(asignacion) => {
            setAsignaciones((todas) => [...todas.filter((a) => !asignacionVacia(a)), asignacion])
            setActualId(asignacion.id)
            setTocado(true)
          }}
          onQuitar={(id) => {
            const quedan = asignaciones.filter((a) => a.id !== id)
            const final = quedan.length ? quedan : [nuevaAsignacion()]
            setAsignaciones(final)
            if (id === actualId) setActualId(final[0].id)
          }}
          onClose={agente.cerrar}
        />,
      )}
    </PageShell>
  )
}
