import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BookOpen01Icon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  InformationCircleIcon,
  Logout03Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Target02Icon,
  Undo02Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconTile,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { notify, notifyAction } from '@/shared/components/notify'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ConfirmarEliminar } from '@/modules/design-system/data-grid/casos/seguimiento'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { registroQueNoExiste } from '@/modules/design-system/estados/errores-sistema-datos'
import { fechaCorta, fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import type { Participante } from '@/modules/design-system/templates/planes-formacion/components/datos'
import { AgentePlanes, useAgente } from './agente-aprendizaje'
import { TablaAsignaciones } from './tabla-asignaciones'
import { cambiosEntre, resumenCambios, type LineaCambio } from './cambios'
import { CamposPlan, aFecha, aIso, erroresDe, type DatosPlan } from './datos-plan'
import { Progreso, SinEmpezar } from './detalle-plan'
import { PanelColaborador } from './panel-colaborador'
import { PestanaContenidos } from './pestana-contenidos'
import { PestanaPersonas } from './pestana-personas'
import { NOMBRE_REPORTE, descargarReporte } from './reportes'
import { RevisarCambios } from './revisar-cambios'
import { AgregarAlPlan } from './agregar-al-plan'
import { ResumenAvance } from './avance-plan'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { AYUDA_ESTADO, BADGE_ESTADO, NOMBRE_ESTADO, SALIDA_PANEL, TIPOS, buscarPlan, cambiarPlanes, miembrosDe, momentoDe, personasDelPlan, rutaPlan, usePlanes, type Plan } from './planes-datos'

// La página del plan (/…/planes/:id): el plan se edita aquí mismo, sin «modo editar» (decisión del 14-oct). Cuatro
// pestañas miran el mismo plan desde lados distintos, y cada una cambia lo que le toca:
// - «Quién ve qué»: las asignaciones, cada una con sus personas y lo que ven. Para reorganizar el plan.
// - «Personas»: una fila por persona. Para ajustar a una (sus propios contenidos), pasarla a otra asignación o quitarla.
// - «Contenidos»: una fila por contenido. Para dárselo a más gente, reemplazarlo o quitarlo de todo el plan (HU-LMS-021).
// - «Avance»: quién va cómo. De solo lectura, con recordatorios.
// Los cambios se juntan y nada le llega a nadie hasta «Guardar»; la barra de abajo dice cuántos van y, con el plan ya
// corriendo, «Guardar» muestra antes a quién le cambia qué (RevisarCambios). Un plan No vigente se ve, pero no se cambia.

// El avance va primero (war room del 14-oct: «la gente entra a ver el estado actual, no a editar»): con el plan corriendo
// abre en Avance; antes de empezar, en Quién ve qué, que es lo único que hay para mirar.
type Pestana = 'avance' | 'quien' | 'personas' | 'items'
const PESTANAS: Pestana[] = ['avance', 'quien', 'personas', 'items']

export function PaginaPlan() {
  const { id } = useParams()
  usePlanes()
  const plan = buscarPlan(id)
  const navigate = useNavigate()
  if (!plan) {
    return (
      <PageShell>
        <PageContent>
          <PantallaDeError error={registroQueNoExiste('este plan', 'planes')} onAccion={() => navigate(rutaPlan())} />
        </PageContent>
      </PageShell>
    )
  }
  return <EspacioPlan key={plan.id} guardado={plan} />
}

// Algo cambió aunque nadie gane ni pierda contenidos (se duplicó una asignación, se cambió un enfoque…).
const firma = (plan: Plan) => JSON.stringify([plan.nombre, plan.inicio, plan.fin, plan.horas, plan.asignaciones, plan.itemsPersona ?? {}, plan.quitados ?? []])

function EspacioPlan({ guardado }: { guardado: Plan }) {
  const navigate = useNavigate()
  const agente = useAgente()
  const textos = TIPOS[guardado.tipo]
  const Items = textos.items.charAt(0).toUpperCase() + textos.items.slice(1)
  const volver = guardado.tipo === 'competencias' ? `${rutaPlan()}?tipo=competencias` : rutaPlan()
  const empezo = guardado.estado === 'Vigente' || guardado.estado === 'No vigente'
  const soloLectura = guardado.estado === 'No vigente'
  // Ya les llegó: lo que se guarde se nota de inmediato.
  const llega = guardado.estado === 'Vigente' || guardado.estado === 'Procesando'

  const [borrador, setBorrador] = useState<Plan>(guardado)
  // El estado lo pone la plataforma (Procesando avanza solo): el borrador lo sigue.
  useEffect(() => {
    setBorrador((actual) => (actual.estado === guardado.estado && actual.procesando === guardado.procesando ? actual : { ...actual, estado: guardado.estado, procesando: guardado.procesando }))
  }, [guardado.estado, guardado.procesando])

  const lineas = useMemo<LineaCambio[]>(() => {
    const encontradas = cambiosEntre(guardado, borrador)
    if (encontradas.length || firma(guardado) === firma(borrador)) return encontradas
    return [{ id: 'orden', tono: 'cambio', texto: 'Cambia cómo están armadas las asignaciones', detalle: 'Nadie gana ni pierde contenidos.' }]
  }, [guardado, borrador])
  const sucio = lineas.length > 0
  const [conErrores, setConErrores] = useState(false)

  const [parametros, setParametros] = useSearchParams()
  const porDefecto: Pestana = empezo ? 'avance' : 'quien'
  const pestana: Pestana = PESTANAS.find((p) => p === parametros.get('tab')) ?? porDefecto
  const irA = (destino: Pestana) => setParametros(destino === porDefecto ? {} : { tab: destino }, { replace: true })
  const [agregando, setAgregando] = useState<number | null>(null)

  const [revisando, setRevisando] = useState(false)
  const [descartando, setDescartando] = useState(false)
  const [editandoDatos, setEditandoDatos] = useState<DatosPlan | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [recordando, setRecordando] = useState<Participante[]>([])
  const [viendo, setViendo] = useState<{ participante: Participante; vez: number } | null>(null)
  const [cerrandoPanel, setCerrandoPanel] = useState(false)

  // Salir con cambios pregunta (como Encuestas); cambiar de pestaña no es salir.
  const saliendo = useRef(false)
  const bloqueo = useBlocker(({ currentLocation, nextLocation }) => sucio && !saliendo.current && currentLocation.pathname !== nextLocation.pathname)
  const salidaBloqueada = bloqueo.state === 'blocked' ? bloqueo : null

  const personas = personasDelPlan(borrador).length
  const pendientes = empezo ? personasDelPlan(guardado).filter((p) => p.progreso < 100) : []

  // Una asignación sin personas o sin contenidos no se guarda: se marca en su tarjeta.
  const incompletas = borrador.asignaciones.filter((a) => !miembrosDe(a).length || !a.items.length)

  const pedirGuardar = () => {
    if (incompletas.length) {
      setConErrores(true)
      irA('quien')
      return notify(
        incompletas.length === 1 ? 'Hay una asignación sin completar' : `Hay ${incompletas.length} asignaciones sin completar`,
        `Cada asignación necesita personas y ${textos.items}. Complétala o elimínala para guardar.`,
        'warning',
      )
    }
    // Con el plan corriendo se revisa antes; si todavía no empieza, se guarda directo.
    if (llega) setRevisando(true)
    else guardar()
  }

  const guardar = () => {
    const nuevo: Plan = { ...borrador, asignaciones: borrador.asignaciones.map((a) => ({ ...a, personas: miembrosDe(a).length })), tocado: Date.now() }
    cambiarPlanes((todos) => todos.map((p) => (p.id === nuevo.id ? nuevo : p)))
    setBorrador(nuevo)
    setConErrores(false)
    const detalle = llega ? `Ya los ven las ${personas.toLocaleString('es-CO')} personas del plan.` : `Las personas lo verán así desde el ${fechaCorta(nuevo.inicio)}.`
    notify('Cambios guardados', detalle, 'success')
  }

  const descartar = () => {
    setBorrador(guardado)
    setConErrores(false)
    notify('Cambios descartados', 'El plan quedó como estaba guardado.', 'info')
  }

  const duplicar = () => {
    const copia: Plan = { ...guardado, id: `p-${Date.now()}`, nombre: `Copia de ${guardado.nombre}`, estado: 'Planeado', procesando: undefined, tocado: Date.now() }
    cambiarPlanes((todos) => [copia, ...todos])
    notifyAction('Plan duplicado', `«${copia.nombre}» quedó Planeado para que le cambies las fechas.`, {
      label: 'Deshacer',
      onClick: () => cambiarPlanes((todos) => todos.filter((p) => p.id !== copia.id)),
    })
  }

  const cerrarPanel = () => {
    setCerrandoPanel(true)
    window.setTimeout(() => {
      setViendo(null)
      setCerrandoPanel(false)
    }, SALIDA_PANEL)
  }

  const conteo = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-CO')} ${plural(n, uno, varios)}`

  return (
    <PageShell>
      <Tabs value={pestana} onValueChange={(valor) => irA(valor as Pestana)}>
        <PageHeader
          back={{ label: 'Volver a planes', to: volver }}
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Aprendizaje' }, { label: 'Planes de formación', path: volver }, { label: guardado.nombre }]}
          kicker={textos.singular}
          media={
            <IconTile variant="soft" size="lg">
              <HugeiconsIcon icon={guardado.tipo === 'competencias' ? Target02Icon : BookOpen01Icon} aria-hidden="true" />
            </IconTile>
          }
          title={borrador.nombre}
          badge={
            // El estado es del plan (sus fechas), no de las personas: la ayuda dice qué significa.
            <span className="flex items-center gap-1">
              <Badge variant={BADGE_ESTADO[guardado.estado]} size="sm">
                {guardado.estado === 'Procesando' ? `Procesando ${guardado.procesando ?? 0} %` : NOMBRE_ESTADO[guardado.estado]}
              </Badge>
              <BotonAyuda etiqueta={`Qué significa «${NOMBRE_ESTADO[guardado.estado]}»`} side="bottom">
                {AYUDA_ESTADO[guardado.estado]}
              </BotonAyuda>
            </span>
          }
          meta={
            <>
              <span>
                {fechaSinAnio(borrador.inicio)} – {fechaCorta(borrador.fin)} · {momentoDe(borrador)}
              </span>
              <span className="tabular-nums">{conteo(personas, 'persona', 'personas')}</span>
              <span className="tabular-nums">{conteo(borrador.asignaciones.length, 'asignación', 'asignaciones')}</span>
              {guardado.tipo === 'competencias' && borrador.horas ? <span>{borrador.horas} h por competencia</span> : null}
            </>
          }
          actions={
            <>
              {/* Orden de la cabecera (5-oct): «⋯» primero; después Datos del plan y Enviar recordatorio; el agente, de último. */}
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del plan" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {/* La cabecera deja a la vista solo «Agregar personas» (lo que más se hace); lo demás vive aquí. */}
                  <DropdownMenuGroup>
                    {soloLectura ? null : (
                      <DropdownMenuItem onClick={() => setEditandoDatos({ nombre: borrador.nombre, inicio: aFecha(borrador.inicio), fin: aFecha(borrador.fin), horas: borrador.horas ?? 8 })}>
                        <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                        Editar nombre y fechas
                      </DropdownMenuItem>
                    )}
                    {guardado.estado === 'Vigente' && pendientes.length ? (
                      <DropdownMenuItem onClick={() => setRecordando(pendientes)}>
                        <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
                        Enviar recordatorio
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={duplicar}>
                      <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                      Duplicar
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  {/* HU-LMS-016 / 022: dos reportes, solo con el plan Vigente o No vigente. */}
                  {empezo ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        {(['por-colaborador', 'detallado'] as const).map((tipo) => (
                          <DropdownMenuItem
                            key={tipo}
                            onClick={() => {
                              descargarReporte(guardado, tipo)
                              notify(`${NOMBRE_REPORTE[tipo]} descargado.`, undefined, 'success')
                            }}
                          >
                            <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
                            {NOMBRE_REPORTE[tipo]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setEliminando(true)}>
                    <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                    Eliminar plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Lo que más se hace con un plan que corre: sumar a quien acaba de llegar, con lo mismo que los demás. */}
              {soloLectura ? null : (
                <Button onClick={() => setAgregando(Date.now())}>
                  <HugeiconsIcon icon={UserAdd01Icon} aria-hidden="true" />
                  Agregar personas
                </Button>
              )}
              {agente.disponible ? <ReopenAgentButton onClick={agente.abrir} /> : null}
            </>
          }
          tabs={
            <TabsList variant="line">
              <TabsTrigger value="avance" className="flex-none px-3">
                Avance
              </TabsTrigger>
              <TabsTrigger value="quien" className="flex-none px-3">
                Asignaciones
              </TabsTrigger>
              <TabsTrigger value="personas" className="flex-none px-3">
                Personas
              </TabsTrigger>
              <TabsTrigger value="items" className="flex-none px-3">
                {Items}
              </TabsTrigger>
            </TabsList>
          }
        />

        <PageContent>
          {soloLectura ? (
            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              <AlertDescription>
                <p>Este plan ya terminó: se puede ver, pero no cambiar. Para volver a usarlo, duplícalo desde «⋯».</p>
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Mientras se edita, el avance sigue a la vista (el del plan guardado: lo que no se guarda no le ha llegado a nadie). */}
          {empezo && pestana !== 'avance' ? <ResumenAvance plan={guardado} onVer={() => irA('avance')} /> : null}

          <TabsContent value="quien">
            <TablaAsignaciones plan={borrador} guardado={guardado} onCambio={setBorrador} soloLectura={soloLectura} conErrores={conErrores} onIrA={irA} />
          </TabsContent>
          <TabsContent value="personas">
            <PestanaPersonas plan={borrador} guardado={guardado} onCambio={setBorrador} soloLectura={soloLectura} />
          </TabsContent>
          <TabsContent value="items">
            <PestanaContenidos plan={borrador} onCambio={setBorrador} soloLectura={soloLectura} />
          </TabsContent>
          {/* El avance es el del plan guardado: lo que todavía no se guarda no le ha llegado a nadie. */}
          <TabsContent value="avance" className="flex flex-col gap-6">
            {empezo ? <Progreso plan={guardado} onVer={(participante) => setViendo({ participante, vez: Date.now() })} onRecordar={setRecordando} /> : <SinEmpezar plan={guardado} />}
          </TabsContent>

          {/* La barra fija de abajo: cuántos cambios van, verlos, descartarlos o guardarlos. Sin cambios, «Guardado». */}
          {soloLectura ? null : (
            <PageActionBar className="mt-auto!">
              <span role="status" className="flex min-w-0 items-center gap-2">
                {sucio ? (
                  <>
                    <ChipGuardado estado="editando" />
                    <Text as="span" size="sm" variant="muted" className="tabular-nums">
                      {resumenCambios(lineas)}
                    </Text>
                    <Button variant="link" size="sm" onClick={() => setRevisando(true)}>
                      Ver cambios
                    </Button>
                  </>
                ) : (
                  <ChipGuardado estado="guardado" />
                )}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" disabled={!sucio} onClick={() => setDescartando(true)}>
                  <HugeiconsIcon icon={Undo02Icon} aria-hidden="true" />
                  Descartar
                </Button>
                <Button disabled={!sucio} onClick={pedirGuardar}>
                  Guardar
                </Button>
              </div>
            </PageActionBar>
          )}
        </PageContent>
      </Tabs>

      <RevisarCambios
        abierto={revisando}
        onAbiertoChange={setRevisando}
        nombre={borrador.nombre}
        lineas={lineas}
        llega={llega}
        onGuardar={() => {
          if (incompletas.length) return pedirGuardar()
          guardar()
          if (saliendo.current) salidaBloqueada?.proceed()
        }}
      />

      {/* «Datos del plan»: nombre, fechas y horas, en una ventana con su formulario. Se aplican al guardar el plan. */}
      {editandoDatos ? (
        <ActionDialog
          open
          onOpenChange={(abierto) => (abierto ? undefined : setEditandoDatos(null))}
          title="Datos del plan"
          sub="Los cambios se aplican al guardar el plan."
          confirmLabel="Aplicar"
          dismissible={false}
          onConfirm={() => {
            const errores = erroresDe(editandoDatos)
            if (errores.nombre || errores.fin || !editandoDatos.inicio || !editandoDatos.fin) return notify('Revisa los datos del plan', errores.nombre ?? errores.fin ?? 'Elige las fechas.', 'warning')
            setBorrador({ ...borrador, nombre: editandoDatos.nombre.trim(), inicio: aIso(editandoDatos.inicio), fin: aIso(editandoDatos.fin), horas: guardado.tipo === 'competencias' ? editandoDatos.horas : borrador.horas })
          }}
        >
          <div className="@container">
            <CamposPlan
              tipo={guardado.tipo}
              datos={editandoDatos}
              onCambio={(cambio) => setEditandoDatos({ ...editandoDatos, ...cambio })}
              conErrores
              inicioBloqueado={empezo || guardado.estado === 'Procesando'}
            />
          </div>
        </ActionDialog>
      ) : null}

      <DialogoConfirmar
        abierto={descartando}
        onAbiertoChange={setDescartando}
        size="sm"
        icono={Undo02Icon}
        titulo="¿Descartar los cambios?"
        descripcion={`Se pierden ${resumenCambios(lineas).replace(' sin guardar', '')} y el plan queda como estaba guardado.`}
        cancelar="Seguir editando"
        accion="Descartar"
        destructiva
        onConfirmar={() => {
          descartar()
          setDescartando(false)
        }}
      />

      {/* Salir con cambios: tres salidas, como Encuestas y Nuevo grupo. «Revisar y guardar» pasa por el resumen. */}
      <DialogoConfirmar
        abierto={salidaBloqueada !== null && !revisando}
        onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
        icono={Logout03Icon}
        titulo="¿Salir sin guardar los cambios?"
        descripcion={`Tienes ${resumenCambios(lineas)}. Si sales ahora, se pierden.`}
        cancelar="Seguir editando"
        otra={{
          texto: 'Salir sin guardar',
          onClick: () => {
            saliendo.current = true
            salidaBloqueada?.proceed()
          },
        }}
        accion={llega ? 'Revisar y guardar' : 'Guardar y salir'}
        onConfirmar={() => {
          saliendo.current = true
          if (llega && !incompletas.length) return setRevisando(true)
          if (incompletas.length) {
            saliendo.current = false
            salidaBloqueada?.reset()
            return pedirGuardar()
          }
          guardar()
          salidaBloqueada?.proceed()
        }}
      >
        <RegistroConfirmar nombre={borrador.nombre} detalle={`${textos.singular} · ${NOMBRE_ESTADO[guardado.estado]}`} estado="Cambios sin guardar" />
      </DialogoConfirmar>

      {agregando !== null ? <AgregarAlPlan key={agregando} plan={borrador} onCambio={setBorrador} onCerrar={() => setAgregando(null)} /> : null}

      {viendo ? (
        <PanelColaborador
          key={viendo.vez}
          abierto={!cerrandoPanel}
          onAbiertoChange={(abierto) => (abierto ? undefined : cerrarPanel())}
          plan={guardado}
          participante={viendo.participante}
          onRecordar={() => setRecordando([viendo.participante])}
        />
      ) : null}

      {/* Le llega a otras personas: dice a cuántas antes de enviar. */}
      <DialogoConfirmar
        abierto={recordando.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : setRecordando([]))}
        icono={Mail01Icon}
        titulo="Enviar recordatorio"
        descripcion={
          recordando.length === 1
            ? `Le llegará un correo a ${recordando[0].nombre} con lo que le falta de «${guardado.nombre}» y la fecha de cierre (${fechaCorta(guardado.fin)}).`
            : `Le llegará un correo a ${recordando.length.toLocaleString('es-CO')} personas que no han terminado «${guardado.nombre}», con lo que les falta y la fecha de cierre (${fechaCorta(guardado.fin)}).`
        }
        accion={recordando.length === 1 ? 'Enviar recordatorio' : `Enviar a ${recordando.length.toLocaleString('es-CO')} personas`}
        onConfirmar={() => {
          const destino = recordando.length === 1 ? recordando[0].nombre : `${recordando.length.toLocaleString('es-CO')} personas`
          notify('Recordatorio enviado', `Va en camino a ${destino}.`, 'success')
          setRecordando([])
        }}
      />

      {/* RN-07: eliminar se confirma escribiendo «eliminar». */}
      <ConfirmarEliminar
        abierto={eliminando}
        onAbiertoChange={setEliminando}
        cantidad={1}
        sustantivo={['plan', 'planes']}
        titulo="Eliminar plan de formación"
        descripcion={`¿Deseas eliminar «${guardado.nombre}»? ${personasDelPlan(guardado).length.toLocaleString('es-CO')} ${plural(personasDelPlan(guardado).length, 'persona lo pierde', 'personas lo pierden')} de su Zona de estudio. Su avance en los ${textos.items} se conserva, pero el plan no se puede recuperar.`}
        accion="Eliminar plan"
        onConfirmar={() => {
          saliendo.current = true
          cambiarPlanes((todos) => todos.filter((p) => p.id !== guardado.id))
          notify('Plan eliminado', `«${guardado.nombre}» ya no aparece en la Zona de estudio de nadie.`, 'success')
          navigate(volver)
        }}
      />
      {agente.portal(<AgentePlanes pantalla="detalle" plan={guardado} onRecordar={setRecordando} onClose={agente.cerrar} />)}
    </PageShell>
  )
}
