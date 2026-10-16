import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Location01Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  NoteAddIcon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FramePanel,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import type { PanelState } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { registroQueNoExiste } from '@/modules/design-system/estados/errores-sistema-datos'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { DialogoEscribir } from '@/modules/admin/seleccion/propuestas/components/dialogo-escribir'
import { useHuecoDerecho, usePantallaGrande } from '../../components/agente-acoplado'
import { AgenteResumen } from '../../components/agente-vacante'
import { NOMBRE_ETAPA, type Candidato, type EtapaId, type SeccionId, type Vacante } from '../../components/data'
import { hoy, notaDelResumen, useEstadoVacante } from '../../components/estado-vacante'
import { SECCION_PESTANA, evaluadasDe, pestanasDe, type PestanaId } from './expediente-data'
import { DrawerComentario, ListaNotas } from './notas'
import { PestanaPerfil } from './pestana-perfil'
import { PestanaPostulaciones } from './pestana-postulaciones'
import { PestanaCV, PestanaPsicometrica, PestanaRoleplay, PestanaSerena } from './pestanas-evaluacion'
import { ColumnaProceso } from './columna-proceso'
import { Marco, type Destacado } from './piezas'

// Selección › Vacantes › :id › candidatos › :candidatoId: el expediente del candidato en pantalla propia.
//
// Antes era solo el panel lateral del tablero (36 rem de ancho). Con siete contenidos —perfil, historial y
// cuatro evaluaciones con transcripciones— ese panel se volvía un muro de scroll en pantallas de ~660 px de
// alto. Aquí cada contenido es una pestaña corta y lo profundo (transcripciones, comentarios) va en paneles
// laterales. El panel del tablero sigue como vista rápida y trae aquí con «Ver expediente».
//
// El patrón es el caso «Resumen de un registro» del design system: el agente cita una fuente, la pantalla
// cambia de pestaña, baja hasta la sección y la resalta.

const RUTA = (vacante: Vacante, candidatoId: string) => `/admin/seleccion/vacantes/${vacante.id}/candidatos/${candidatoId}`

export function ExpedienteView({ vacante, candidatoId }: { vacante: Vacante; candidatoId: string }) {
  const navigate = useNavigate()
  const { candidatos, setCandidatos, setDescartados } = useEstadoVacante(vacante)
  const candidato = candidatos.find((c) => c.id === candidatoId)

  if (!candidato) {
    return (
      <PageShell>
        <PageHeader back={{ label: `Volver a ${vacante.titulo}`, to: `/admin/seleccion/vacantes/${vacante.id}` }} title="Candidato" />
        <PageContent>
          <PantallaDeError
            error={registroQueNoExiste('este candidato', vacante.titulo)}
            onAccion={() => navigate(`/admin/seleccion/vacantes/${vacante.id}`)}
          />
        </PageContent>
      </PageShell>
    )
  }

  return (
    <Expediente
      // La clave reinicia pestaña, agente y paneles al pasar al candidato siguiente.
      key={candidato.id}
      vacante={vacante}
      candidato={candidato}
      candidatos={candidatos}
      setCandidatos={setCandidatos}
      setDescartados={setDescartados}
    />
  )
}

type ExpedienteProps = {
  vacante: Vacante
  candidato: Candidato
  candidatos: Candidato[]
  setCandidatos: (cambio: (lista: Candidato[]) => Candidato[]) => void
  setDescartados: (cambio: (n: number) => number) => void
}

function Expediente({ vacante, candidato, candidatos, setCandidatos, setDescartados }: ExpedienteProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pestanas = pestanasDe(vacante)
  const pedida = params.get('pestana') as PestanaId | null
  const pestana: PestanaId = pestanas.some((p) => p.id === pedida) ? (pedida as PestanaId) : 'perfil'

  const [destacado, setDestacado] = useState<Destacado>(null)
  const [comentar, setComentar] = useState<EtapaId | 'libre' | null>(null)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const [escribiendo, setEscribiendo] = useState(false)

  // Agente contextual: el mismo «Resumir candidato» del tablero, acoplado a la derecha.
  const [panel, setPanel] = useState<PanelState>('closed')
  const [notaResumen, setNotaResumen] = useState<number | null>(null)
  const grande = usePantallaGrande()
  const hueco = useHuecoDerecho()
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  // El panel se abre y se cierra, nada más (22 sep): sin ampliar ni minimizar.
  const acoplado = grande && panel === 'open'
  useEffect(() => {
    setRightPanelOpen(acoplado)
    return () => setRightPanelOpen(false)
  }, [acoplado])

  const irAPestana = (id: PestanaId) => setParams(id === 'perfil' ? {} : { pestana: id }, { replace: true })

  const cambiar = (cambio: (c: Candidato) => Candidato) => setCandidatos((lista) => lista.map((c) => (c.id === candidato.id ? cambio(c) : c)))

  // Anterior y siguiente, en el orden del tablero: se trabaja el proceso sin volver a la lista.
  const indice = candidatos.findIndex((c) => c.id === candidato.id)
  const irA = (paso: number) => {
    const otro = candidatos[indice + paso]
    if (otro) navigate({ pathname: RUTA(vacante, otro.id), search: params.toString() })
  }

  const irASeccion = (seccion: SeccionId) => {
    irAPestana(SECCION_PESTANA[seccion])
    setDestacado({ id: `exp-${seccion}`, tick: Date.now() })
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(
      () => document.getElementById(`exp-${seccion}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      80,
    )
  }

  const moverEtapa = (etapa: EtapaId) => {
    if (etapa === candidato.etapa) return
    cambiar((c) => ({ ...c, etapa, dias: 0 }))
    notify(`${candidato.nombre} pasó a ${NOMBRE_ETAPA[etapa]}`, etapa === 'seleccionado' ? 'Al enviar la oferta se cierra el proceso de la vacante.' : undefined)
  }

  const publicar = (texto: string, etapa: EtapaId | undefined) => {
    cambiar((c) => ({ ...c, notas: [...c.notas, { id: Date.now(), autor: vacante.reclutador.nombre, fecha: hoy(), texto, etapa }] }))
    notify(etapa ? `Comentario publicado en ${NOMBRE_ETAPA[etapa]}` : 'Nota publicada', 'Solo la ve el equipo de selección.')
  }

  const descartar = () => {
    setCandidatos((lista) => lista.filter((c) => c.id !== candidato.id))
    setDescartados((n) => n + 1)
    setConfirmarDescarte(false)
    notify(`${candidato.nombre} quedó descartado`, 'Recibirá el correo automático de rechazo configurado en la vacante.')
    navigate(`/admin/seleccion/vacantes/${vacante.id}`)
  }

  const guardarNota = () => {
    const id = Date.now()
    cambiar((c) => ({ ...c, notas: [...c.notas, notaDelResumen(candidato, id)] }))
    setNotaResumen(id)
    irASeccion('notas')
  }

  const deshacerNota = () => {
    if (notaResumen === null) return
    cambiar((c) => ({ ...c, notas: c.notas.filter((n) => n.id !== notaResumen) }))
    setNotaResumen(null)
    notify('Nota eliminada del expediente')
  }

  const agente = (
    <AgenteResumen
      onClose={() => setPanel('closed')}
      vacante={vacante}
      candidato={candidato}
      notaGuardada={notaResumen !== null}
      onFuente={irASeccion}
      onGuardarNota={guardarNota}
      onDeshacerNota={deshacerNota}
    />
  )

  return (
    <PageShell>
      <PageHeader
        // Flecha junto al título en vez del enlace de arriba: con ~660 px de alto cada renglón cuenta.
        back={{ label: vacante.titulo, to: `/admin/seleccion/vacantes/${vacante.id}`, variant: 'icon' }}
        // La miga de la barra de arriba: sin esto la armaba con la dirección («Laura mendez», sin tilde).
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Selección' },
          { label: 'Vacantes', path: '/admin/seleccion/vacantes' },
          { label: vacante.titulo, path: `/admin/seleccion/vacantes/${vacante.id}` },
          { label: candidato.nombre },
        ]}
        media={
          <Avatar size="lg">
            <AvatarFallback>{candidato.iniciales}</AvatarFallback>
          </Avatar>
        }
        title={candidato.nombre}
        badge={
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {NOMBRE_ETAPA[candidato.etapa]} · {candidato.dias === 0 ? 'hoy' : `${candidato.dias} ${plural(candidato.dias, 'día', 'días')}`}
            </Badge>
            {candidato.accion ? <Badge variant="warning-outline">{candidato.accion}</Badge> : null}
          </span>
        }
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Briefcase01Icon} size={16} />
              {candidato.cargo} · {candidato.empresa}
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Mail01Icon} size={16} />
              {candidato.correo}
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} size={16} />
              {candidato.ciudad}
            </span>
          </>
        }
        actions={
          <>
            <ButtonGroup aria-label={`Candidato ${indice + 1} de ${candidatos.length}`}>
              <Button variant="outline" size="icon-sm" aria-label="Candidato anterior" disabled={indice <= 0} onClick={() => irA(-1)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Candidato siguiente"
                disabled={indice >= candidatos.length - 1}
                onClick={() => irA(1)}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            </ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label="Más acciones" />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setEscribiendo(true)}>Enviar correo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setComentar('libre')}>Agregar nota</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmarDescarte(true)}>
                  Descartar candidato
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* El botón de IA siempre es el último de la fila, a la derecha de todo (regla del 23 sep). Con el panel
                abierto se esconde, como en el detalle de la vacante. */}
            {grande && panel === 'closed' ? <ReopenAgentButton onClick={() => setPanel('open')} /> : null}
          </>
        }
        tabs={
          <Tabs value={pestana} onValueChange={(valor) => irAPestana(valor as PestanaId)}>
            {/* Con poco ancho las pestañas se desplazan de lado en vez de cortarse. */}
            <TabsList variant="line" className="max-w-full overflow-x-auto">
              {pestanas.map((item) => (
                <TabsTrigger key={item.id} value={item.id} className="flex-none gap-2 px-3">
                  {item.ia ? <IconoIA /> : null}
                  {item.titulo}
                  {item.id === 'notas' ? (
                    <Badge variant="secondary" className="tabular-nums">
                      {candidato.notas.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {/* Trabajo a la izquierda y el proceso a la derecha, como «Agent Run Detail» de ReUI y la columna de resumen de
          crear vacante. @container: las rejillas responden al ancho del cuerpo, que cambia al abrir el agente; con
          poco ancho la columna del proceso baja al final. */}
      <PageContent className="@container pb-10">
        <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="@container/main flex min-w-0 flex-col gap-4">
            {pestana === 'perfil' ? <PestanaPerfil candidato={candidato} vacante={vacante} destacado={destacado} /> : null}
            {pestana === 'cv' ? <PestanaCV candidato={candidato} vacante={vacante} /> : null}
            {pestana === 'psicometricas' ? <PestanaPsicometrica candidato={candidato} vacante={vacante} /> : null}
            {pestana === 'serena' ? (
              <PestanaSerena candidato={candidato} vacante={vacante} notas={candidato.notas} destacado={destacado} onComentar={setComentar} />
            ) : null}
            {pestana === 'roleplay' ? (
              <PestanaRoleplay candidato={candidato} vacante={vacante} notas={candidato.notas} destacado={destacado} onComentar={setComentar} />
            ) : null}
            {pestana === 'postulaciones' ? (
              <PestanaPostulaciones candidato={candidato} vacante={vacante} etapaActual={NOMBRE_ETAPA[candidato.etapa]} />
            ) : null}
            {pestana === 'notas' ? (
              <Marco
                id="exp-notas"
                destacado={destacado}
                titulo="Notas del equipo"
                descripcion="Las generales y las de cada etapa. Solo las ve el equipo de selección."
                accion={
                  <Button variant="outline" size="sm" onClick={() => setComentar('libre')}>
                    <HugeiconsIcon icon={NoteAddIcon} />
                    Agregar nota
                  </Button>
                }
              >
                <FramePanel>
                  <ListaNotas notas={candidato.notas} conEtapa vacia="Todavía no hay notas sobre este candidato." />
                </FramePanel>
              </Marco>
            ) : null}
          </div>
          <aside aria-label="El candidato en el proceso" className="@4xl:sticky @4xl:top-0">
            <ColumnaProceso candidato={candidato} vacante={vacante} pestana={pestana} destacado={destacado} onMover={moverEtapa} />
          </aside>
        </div>
      </PageContent>

      <DrawerComentario
        open={comentar !== null}
        onOpenChange={(abierto) => (abierto ? undefined : setComentar(null))}
        etapa={comentar === 'libre' || comentar === null ? undefined : comentar}
        // Solo las etapas cuya pestaña muestra notas: una nota atada a otra no aparecería en ningún lado.
        etapas={evaluadasDe(vacante).filter((etapa) => etapa === 'serena' || etapa === 'roleplay')}
        onPublicar={publicar}
      />

      {/* «Enviar correo» abre la misma ventana de «Escribirle a…» de la vacante: plantilla y mensaje antes de mandarlo. */}
      <DialogoEscribir
        abierto={escribiendo}
        onOpenChange={setEscribiendo}
        destinatarios={[{ ini: candidato.iniciales, title: candidato.nombre, meta: NOMBRE_ETAPA[candidato.etapa] }]}
        onEnviar={(plantilla) => notify('Enviaste 1 correo', plantilla, 'success')}
      />

      {/* La confirmación de un descarte es la del design system (Estados › Confirmaciones): destructiva y corta. */}
      <DialogoConfirmar
        abierto={confirmarDescarte}
        onAbiertoChange={setConfirmarDescarte}
        icono={UserRemove01Icon}
        titulo={`¿Descartar a ${candidato.nombre}?`}
        descripcion={`Sale del proceso de ${vacante.titulo} y recibe el correo automático de rechazo. Sigue en la bolsa de candidatos para otras vacantes.`}
        accion="Descartar"
        destructiva
        onConfirmar={descartar}
      />

      {/* El agente va en el hueco derecho del marco: debajo del header, y la página se acorta. */}
      {hueco && acoplado
        ? createPortal(
            <div className="flex h-full shrink-0">{agente}</div>,
            hueco,
          )
        : null}
    </PageShell>
  )
}
