import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building03Icon,
  Calendar03Icon,
  GitCompareIcon,
  Home01Icon,
  Location01Icon,
  Mail01Icon,
  PauseIcon,
  PencilEdit02Icon,
  PlayIcon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  FloatingActionBar,
  Frame,
  FramePanel,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { FilaCifras } from '@/modules/admin/inicio/components/bloques'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import { DialogoEscribir } from '@/modules/admin/seleccion/propuestas/components/dialogo-escribir'
import { BotonCompartirVacante } from '@/modules/admin/seleccion/propuestas/components/acciones-vacante'
import { AgentRail, ReopenAgentButton, type PanelState } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { ANCHO_AGENTE, useHuecoDerecho, usePantallaGrande } from './agente-acoplado'
import { AgenteComparar, AgenteInicio, AgenteResumen, type Tarea } from './agente-vacante'
import { NOMBRE_ETAPA, etapasDe, type Candidato, type EstadoVacante, type EtapaId, type SeccionId, type Vacante } from './data'
import { DetalleVacante } from './detalle-vacante'
import { hoy, notaDelResumen, useEstadoVacante } from './estado-vacante'
import { FichaCandidato, type Destacado } from './ficha-candidato'
import { TableroCandidatos } from './tablero-candidatos'

type Pestana = 'candidatos' | 'detalle'

const ESTADO_BADGE: Record<EstadoVacante, 'success-outline' | 'warning-outline' | 'outline'> = {
  Publicada: 'success-outline',
  Pausada: 'warning-outline',
  Borrador: 'outline',
}

// Selección › Vacantes › detalle: cabecera con estado y acciones, cifras, candidatos por etapa, detalle
// de la vacante, ficha del candidato y el agente contextual (resumir candidato y comparar finalistas).
export function VacanteView({ vacante }: { vacante: Vacante }) {
  // Candidatos y descartados se comparten con el expediente del candidato (otra pantalla).
  const { candidatos, setCandidatos, descartados, setDescartados } = useEstadoVacante(vacante)
  const [estado, setEstado] = useState<EstadoVacante>(vacante.estado)
  const [pestana, setPestana] = useState<Pestana>('candidatos')
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [abiertoId, setAbiertoId] = useState<string | null>(null)
  const [destacado, setDestacado] = useState<Destacado>(null)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const [confirmarMover, setConfirmarMover] = useState<string[] | null>(null)
  const [escribiendo, setEscribiendo] = useState(false)

  // Agente contextual.
  const [panel, setPanel] = useState<PanelState>('closed')
  const [tarea, setTarea] = useState<Tarea>({ tipo: 'inicio' })
  const [notaResumen, setNotaResumen] = useState<{ candidatoId: string; notaId: number } | null>(null)
  const [movidos, setMovidos] = useState<{ ids: string[]; previos: Record<string, { etapa: EtapaId; dias: number }> } | null>(null)

  const grande = usePantallaGrande()
  const hueco = useHuecoDerecho()
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  // El header compacta el buscador mientras el agente ocupa la derecha.
  const acoplado = grande && panel !== 'closed'
  useEffect(() => {
    setRightPanelOpen(acoplado)
    return () => setRightPanelOpen(false)
  }, [acoplado])

  const abierto = candidatos.find((c) => c.id === abiertoId) ?? null
  const agenteVisible = grande && panel === 'open'

  const cambiarCandidato = (id: string, cambio: (c: Candidato) => Candidato) =>
    setCandidatos((lista) => lista.map((c) => (c.id === id ? cambio(c) : c)))

  // ── Ficha ──

  const abrirFicha = (id: string) => {
    setAbiertoId(id)
    setDestacado(null)
    // Si el agente está resumiendo, sigue al candidato que se abre.
    if (tarea.tipo === 'resumen' && tarea.candidatoId !== id) setTarea({ tipo: 'resumen', candidatoId: id })
  }

  const irASeccion = (candidatoId: string, seccion: SeccionId) => {
    const yaAbierta = abiertoId === candidatoId
    setAbiertoId(candidatoId)
    setDestacado({ seccion, tick: Date.now() })
    window.clearTimeout(temporizador.current)
    // Si la ficha estaba cerrada, se espera a que entre antes de bajar hasta la sección.
    temporizador.current = window.setTimeout(
      () => document.getElementById(`ficha-${seccion}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      yaAbierta ? 60 : 260,
    )
  }

  const moverEtapa = (id: string, etapa: EtapaId) => {
    const candidato = candidatos.find((c) => c.id === id)
    if (!candidato || candidato.etapa === etapa) return
    cambiarCandidato(id, (c) => ({ ...c, etapa, dias: 0 }))
    notify(
      `${candidato.nombre} pasó a ${NOMBRE_ETAPA[etapa]}`,
      etapa === 'seleccionado' ? 'Al enviar la oferta se cierra el proceso de la vacante.' : undefined, 'success',
    )
  }

  // El tablero cambia las columnas mientras se arrastra; el aviso sale al soltar (onSoltar).
  const moverDesdeTablero = (columnas: Record<EtapaId, Candidato[]>) => {
    const antes = new Map(candidatos.map((c) => [c.id, c.etapa]))
    setCandidatos(
      etapasDe(vacante).flatMap((etapa) =>
        (columnas[etapa.id] ?? []).map((c) => (antes.get(c.id) === etapa.id ? c : { ...c, etapa: etapa.id, dias: 0 })),
      ),
    )
  }

  const descartar = () => {
    if (!abierto) return
    setCandidatos((lista) => lista.filter((c) => c.id !== abierto.id))
    setSeleccion((ids) => ids.filter((id) => id !== abierto.id))
    setDescartados((n) => n + 1)
    setConfirmarDescarte(false)
    setAbiertoId(null)
    if (tarea.tipo === 'resumen' && tarea.candidatoId === abierto.id) setTarea({ tipo: 'inicio' })
    notify(`${abierto.nombre} quedó descartado`, 'Recibirá el correo automático de rechazo configurado en la vacante.', 'success')
  }

  const agregarNota = (texto: string) => {
    if (!abierto) return
    cambiarCandidato(abierto.id, (c) => ({ ...c, notas: [...c.notas, { id: Date.now(), autor: vacante.reclutador.nombre, fecha: hoy(), texto }] }))
    notify('Nota agregada', undefined, 'success')
  }

  // ── Agente ──

  const resumir = () => {
    if (!abiertoId) return
    setTarea({ tipo: 'resumen', candidatoId: abiertoId })
    setPanel('open')
  }

  const comparar = () => {
    if (seleccion.length < 2) return
    setTarea({ tipo: 'comparar', ids: seleccion })
    setMovidos(null)
    setPanel('open')
  }

  const guardarNota = (candidato: Candidato) => {
    const notaId = Date.now()
    cambiarCandidato(candidato.id, (c) => ({ ...c, notas: [...c.notas, notaDelResumen(candidato, notaId)] }))
    setNotaResumen({ candidatoId: candidato.id, notaId })
    irASeccion(candidato.id, 'notas')
  }

  const deshacerNota = () => {
    if (!notaResumen) return
    cambiarCandidato(notaResumen.candidatoId, (c) => ({ ...c, notas: c.notas.filter((n) => n.id !== notaResumen.notaId) }))
    setNotaResumen(null)
    notify('Nota eliminada de la ficha', undefined, 'success')
  }

  const confirmarMovimiento = () => {
    if (!confirmarMover) return
    const previos = Object.fromEntries(
      candidatos.filter((c) => confirmarMover.includes(c.id)).map((c) => [c.id, { etapa: c.etapa, dias: c.dias }]),
    )
    setCandidatos((lista) => lista.map((c) => (confirmarMover.includes(c.id) ? { ...c, etapa: 'revision', dias: 0 } : c)))
    setMovidos({ ids: confirmarMover, previos })
    setConfirmarMover(null)
    notify(`${confirmarMover.length} ${plural(confirmarMover.length, 'candidato pasó', 'candidatos pasaron')} a Para revisión`, undefined, 'success')
  }

  const deshacerMovimiento = () => {
    if (!movidos) return
    setCandidatos((lista) => lista.map((c) => (movidos.previos[c.id] ? { ...c, ...movidos.previos[c.id] } : c)))
    setMovidos(null)
    notify('Los candidatos volvieron a su etapa anterior', undefined, 'success')
  }

  const marco = {
    onClose: () => setPanel('closed'),
  }

  const resumido = tarea.tipo === 'resumen' ? candidatos.find((c) => c.id === tarea.candidatoId) : undefined
  const comparados = tarea.tipo === 'comparar' ? candidatos.filter((c) => tarea.ids.includes(c.id)) : []

  const contenidoAgente = resumido ? (
    <AgenteResumen
      key={`resumen-${resumido.id}`}
      {...marco}
      vacante={vacante}
      candidato={resumido}
      notaGuardada={notaResumen?.candidatoId === resumido.id}
      onFuente={(seccion) => irASeccion(resumido.id, seccion)}
      onGuardarNota={() => guardarNota(resumido)}
      onDeshacerNota={deshacerNota}
    />
  ) : tarea.tipo === 'comparar' ? (
    <AgenteComparar
      key={`comparar-${tarea.ids.join('-')}`}
      {...marco}
      vacante={vacante}
      candidatos={comparados}
      movidos={movidos?.ids ?? []}
      onMoverRevision={setConfirmarMover}
      onDeshacerMover={deshacerMovimiento}
    />
  ) : (
    <AgenteInicio
      key="inicio"
      {...marco}
      vacante={vacante}
      candidatos={candidatos}
      seleccionados={seleccion.length}
      abierto={abierto}
      onResumir={resumir}
      onComparar={comparar}
      onAbrir={abrirFicha}
    />
  )

  // Con la ficha abierta el agente queda por encima de su fondo para poder seguir usándolo.
  const elevar = agenteVisible && abierto !== null && !confirmarDescarte && confirmarMover === null

  const cifras = [
    { etiqueta: 'Candidatos', valor: String(candidatos.length + descartados), detalle: 'desde que se publicó' },
    {
      etiqueta: 'En proceso',
      valor: String(candidatos.filter((c) => c.etapa !== 'seleccionado').length),
      detalle: 'entre Evaluación CV y antecedentes',
    },
    { etiqueta: 'Descartados', valor: String(descartados), detalle: 'con correo de rechazo' },
    { etiqueta: 'Acción requerida', valor: String(candidatos.filter((c) => c.accion).length), detalle: 'esperan una respuesta' },
    { etiqueta: 'Días abierta', valor: String(vacante.diasAbierta), detalle: estado === 'Pausada' ? 'pausada por ahora' : 'publicada en el portal' },
  ]

  return (
    // Ancho amplio: el tablero de candidatos es denso y ya no lleva un ancho fijo propio (auditoría, 5-oct).
    <PageShell width="wide">
      <PageHeader
        back={{ label: 'Volver a vacantes', to: '/admin/seleccion/vacantes' }}
        title={vacante.titulo}
        badge={<Badge variant={ESTADO_BADGE[estado]}>{estado}</Badge>}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Building03Icon} size={16} />
              {vacante.area}
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} size={16} />
              {vacante.sede}
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Home01Icon} size={16} />
              {vacante.modalidad}
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Calendar03Icon} size={16} />
              {vacante.diasAbierta} {plural(vacante.diasAbierta, 'día', 'días')} abierta
            </span>
            <span className="flex items-center gap-1.5">
              <Avatar size="sm">
                <AvatarFallback>{vacante.reclutador.iniciales}</AvatarFallback>
              </Avatar>
              {vacante.reclutador.nombre}
            </span>
          </>
        }
        actions={
          <>
            <BotonCompartirVacante vacante={{ ...vacante, estado }} />
            <Button
              variant="outline"
              onClick={() => {
                const siguiente = estado === 'Pausada' ? 'Publicada' : 'Pausada'
                setEstado(siguiente)
                notify(siguiente === 'Pausada' ? 'Vacante pausada' : 'Vacante publicada de nuevo', siguiente === 'Pausada' ? 'Deja de recibir postulaciones.' : 'Vuelve a recibir postulaciones.', 'success')
              }}
            >
              <HugeiconsIcon icon={estado === 'Pausada' ? PlayIcon : PauseIcon} />
              {estado === 'Pausada' ? 'Reanudar' : 'Pausar'}
            </Button>
            <Button onClick={() => notify('Editar vacante', 'Abre el asistente de 3 pasos: información básica, configurar y visibilidad.')}>
              <HugeiconsIcon icon={PencilEdit02Icon} />
              Editar
            </Button>
            {grande && panel === 'closed' ? <ReopenAgentButton compact onClick={() => setPanel('open')} /> : null}
          </>
        }
        tabs={
          <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)}>
            <TabsList variant="line">
              <TabsTrigger value="candidatos" className="flex-none">
                Candidatos
                <Badge variant="secondary">
                  {candidatos.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="detalle" className="flex-none">
                Detalle de la vacante
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <PageContent className="pb-24">
        <Frame>
          <FramePanel>
            <FilaCifras cifras={cifras} columnas="grid-cols-2 lg:grid-cols-5" />
          </FramePanel>
        </Frame>

        {pestana === 'candidatos' ? (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Text as="p" variant="muted" size="sm">
                Arrastra un candidato para cambiarlo de etapa, ábrelo para ver su ficha o marca entre 2 y 3 para compararlos.
              </Text>
              <Button variant="outline" onClick={() => notify('Agregar candidato', 'Sube su hoja de vida o escribe sus datos; entra por Evaluación CV.')}>
                <HugeiconsIcon icon={UserAdd01Icon} />
                Agregar candidato
              </Button>
            </div>
            <TableroCandidatos
              etapas={etapasDe(vacante)}
              candidatos={candidatos}
              seleccion={seleccion}
              onSeleccionar={(id, marcado) =>
                setSeleccion((ids) => (marcado ? (ids.includes(id) || ids.length >= 3 ? ids : [...ids, id]) : ids.filter((item) => item !== id)))
              }
              onAbrir={abrirFicha}
              onMover={moverDesdeTablero}
              onSoltar={(id, etapa) => {
                const candidato = candidatos.find((c) => c.id === id)
                if (candidato) notify(`${candidato.nombre} pasó a ${NOMBRE_ETAPA[etapa]}`, undefined, 'success')
              }}
            />
          </section>
        ) : (
          <DetalleVacante vacante={vacante} candidatos={candidatos} />
        )}
      </PageContent>

      <FloatingActionBar
        hidden={seleccion.length === 0}
        position="fixed"
        offset={24}
        selectionCount={seleccion.length}
        onClearSelection={() => setSeleccion([])}
        labels={{
          toolbar: 'Acciones sobre los candidatos seleccionados',
          selectionCount: (n) => `${n} ${plural(n, 'seleccionado · marca otro para comparar', 'seleccionados')}`,
          clearSelection: 'Quitar selección',
          collapse: 'Contraer',
          expand: 'Expandir',
          moreActions: 'Más acciones',
          actionWithCount: (label) => label,
        }}
        items={[
          {
            id: 'correo',
            label: 'Enviar correo',
            icon: <HugeiconsIcon icon={Mail01Icon} />,
            onClick: () => setEscribiendo(true),
          },
        ]}
        primaryAction={{
          id: 'comparar',
          label: 'Comparar',
          icon: <HugeiconsIcon icon={GitCompareIcon} />,
          disabled: seleccion.length < 2,
          onClick: comparar,
        }}
      />

      <FichaCandidato
        candidato={abierto}
        vacante={vacante}
        onCerrar={() => {
          setAbiertoId(null)
          setDestacado(null)
        }}
        destacado={destacado}
        agenteAbierto={agenteVisible}
        desplazamiento={ANCHO_AGENTE}
        onMover={(etapa) => abierto && moverEtapa(abierto.id, etapa)}
        onDescartar={() => setConfirmarDescarte(true)}
        onResumir={resumir}
        onNota={agregarNota}
      />

      {/* «Enviar correo» abre la misma ventana de «Escribirle a…» de la vacante nueva: plantilla y mensaje antes de mandarlo. */}
      <DialogoEscribir
        abierto={escribiendo}
        onOpenChange={setEscribiendo}
        destinatarios={candidatos
          .filter((c) => seleccion.includes(c.id))
          .map((c) => ({ ini: c.iniciales, title: c.nombre, meta: NOMBRE_ETAPA[c.etapa] }))}
        onEnviar={(plantilla) => {
          const n = seleccion.length
          notify(`Enviaste ${n === 1 ? '1 correo' : `${n} correos`}`, plantilla, 'success')
        }}
      />

      {/* Las confirmaciones son las del design system (Estados › Confirmaciones), las mismas del expediente. */}
      <DialogoConfirmar
        abierto={confirmarDescarte}
        onAbiertoChange={setConfirmarDescarte}
        titulo={`¿Descartar a ${abierto?.nombre ?? ''}?`}
        descripcion={`Sale del proceso de ${vacante.titulo} y recibe el correo automático de rechazo. Sigue en la bolsa de candidatos para otras vacantes.`}
        accion="Descartar"
        onConfirmar={descartar}
      />

      <DialogoConfirmar
        abierto={confirmarMover !== null}
        onAbiertoChange={(abrir) => (abrir ? undefined : setConfirmarMover(null))}
        titulo="¿Mover a Para revisión?"
        descripcion={
          <>
            {candidatos
              .filter((c) => confirmarMover?.includes(c.id))
              .map((c) => c.nombre)
              .join(', ')}{' '}
            {plural(confirmarMover?.length ?? 0, 'pasa', 'pasan')} a la etapa de revisión humana y se avisa a {vacante.reclutador.nombre}. Puedes deshacerlo
            desde el agente.
          </>
        }
        accion="Mover a Para revisión"
        onConfirmar={confirmarMovimiento}
      />

      {/* El agente va en el hueco derecho del marco: debajo del header, y la página se acorta. */}
      {hueco && acoplado
        ? createPortal(
            <div className={elevar ? 'relative z-60 flex h-full shrink-0' : 'flex h-full shrink-0'}>
              {panel === 'open' ? contenidoAgente : <AgentRail onOpen={() => setPanel('open')} />}
            </div>,
            hueco,
          )
        : null}
    </PageShell>
  )
}
