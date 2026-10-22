import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { useHuecoDerecho, usePantallaGrande } from '@/modules/admin/seleccion/vacantes/detalle/components/agente-acoplado'
import {
  AgentCard,
  AgentList,
  AgentNote,
  AgentSuggestions,
  AgentThread,
  AgentDock,
  ContextPanel,
  ProposalCard,
  UndoRow,
} from '@/modules/design-system/agente-contextual/components/agent-kit'
import { PILL_SOFT } from '@/modules/design-system/agente-contextual/components/agent-styles'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { fechaCorta, fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import type { Grupo } from './grupos-datos'
import { NOMBRE_ESTADO, TIPOS, momentoDe, personasDelPlan, porTiempoSinEntrar, progresoDe, totalPersonas, type Asignacion, type Participante, type Plan } from './planes-datos'

// La IA de Planes y Grupos es el agente contextual, no otra página (Cristian, 28 sep: «debe ser contextual, no otra
// pagina»). En UBITS los botones «Asistente IA para planes» y «Asistente IA para grupos» abren el chat de agentes en otra
// pestaña; aquí el botón es «Orbit» (Cristian, 28 sep: todos los que abren el agente contextual se llaman igual; el nombre es «Orbit» desde la auditoría del 5-oct) y abre el panel del agente sobre la pantalla que se está mirando, como en el expediente del candidato, y lo
// que propone se aplica ahí mismo.

// El panel se acopla en el hueco derecho del marco (debajo del header, y la página se acorta). Solo en pantallas
// grandes, como en el expediente: en chicas el botón no aparece.
export function useAgente() {
  const [abierto, setAbierto] = useState(false)
  const grande = usePantallaGrande()
  const hueco = useHuecoDerecho()
  const acoplado = grande && abierto

  useEffect(() => {
    setRightPanelOpen(acoplado)
    return () => setRightPanelOpen(false)
  }, [acoplado])

  return {
    disponible: grande,
    abrir: () => setAbierto(true),
    cerrar: () => setAbierto(false),
    // El hueco de Orbit del sistema (AgentDock, regla «orbit-un-solo-panel», 13-oct): entra y sale igual en todas las
    // pantallas, con el contenido encogiéndose, y trae el asidero para cambiarle el ancho.
    portal: (panel: ReactNode) => (hueco ? createPortal(<AgentDock open={acoplado}>{panel}</AgentDock>, hueco) : null),
  }
}

// Opciones que se usan una vez: al elegir una, las de esa respuesta quedan apagadas (HU-LMS-009, RN-06).
function Opciones({ titulo, opciones, onElegir }: { titulo: string; opciones: string[]; onElegir: (opcion: string) => void }) {
  const [usada, setUsada] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <Text as="p" size="sm">
        {titulo}
      </Text>
      <div className="flex flex-col items-start gap-2.5">
        {opciones.map((opcion) => (
          <Button
            key={opcion}
            variant="outline"
            className={PILL_SOFT}
            disabled={usada !== null}
            aria-pressed={usada === opcion}
            onClick={() => {
              setUsada(opcion)
              onElegir(opcion)
            }}
          >
            {opcion}
          </Button>
        ))}
      </div>
    </div>
  )
}

// ── Grupos (HU-LMS-009) ──

type Intencion = 'Crear grupos' | 'Editar grupos' | 'Consultar grupos'
const INTENCIONES: Intencion[] = ['Crear grupos', 'Editar grupos', 'Consultar grupos']
// RN-03 a RN-05, literales.
const SUBOPCIONES: Record<Intencion, string[]> = {
  'Crear grupos': ['Crear grupos personalizados', 'Crear grupos por área', 'Crear grupos por cargo'],
  'Editar grupos': ['Agregar usuarios a un grupo', 'Eliminar usuarios de un grupo', 'Recomendar optimización estratégica'],
  'Consultar grupos': ['Ver detalles de un grupo existente', 'Consultar si alguien no está en un grupo', 'Listar todos los grupos existentes'],
}

function intencionDe(texto: string): Intencion | null {
  const t = texto.toLowerCase()
  if (/crear|armar|nuevo/.test(t)) return 'Crear grupos'
  if (/editar|agregar|quitar|eliminar|sumar/.test(t)) return 'Editar grupos'
  if (/consultar|ver|listar|qui[eé]n|cu[aá]nt/.test(t)) return 'Consultar grupos'
  return null
}

export function AgenteGrupos({ grupo, grupos, onClose }: { grupo?: Grupo; grupos: Grupo[]; onClose: () => void }) {
  const thread = useAgentThread()

  // RN-06: la subopción responde «Próximamente…»: crear o editar grupos desde el agente aún no existe en el producto.
  const elegirSubopcion = (opcion: string) => thread.ask(opcion, 'Próximamente te daré la información detallada para esta opción.', 1600)

  const elegirIntencion = (intencion: Intencion) =>
    thread.ask(intencion, <Opciones titulo="¡Sí, encantado! Dentro de esta opción te puedo ayudar a:" opciones={SUBOPCIONES[intencion]} onElegir={elegirSubopcion} />, 1600)

  return (
    <ContextPanel
      context={
        grupo ? (
          <>
            <span className="text-foreground">{grupo.nombre}</span> · {grupo.integrantes.length} {plural(grupo.integrantes.length, 'integrante', 'integrantes')}
          </>
        ) : (
          <>
            <span className="text-foreground">Grupos</span> · {grupos.length} de la empresa
          </>
        )
      }
      contextIcon={UserGroupIcon}
      onClose={onClose}
      placeholder={grupo ? `Pregunta o pide algo sobre ${grupo.nombre}` : 'Pide crear, editar o consultar un grupo'}
      onSend={(texto) => {
        const intencion = intencionDe(texto)
        if (intencion) elegirIntencion(intencion)
        else
          thread.ask(
            texto,
            <Opciones titulo="Por ahora te puedo ayudar a crear, editar o consultar grupos. ¿Por dónde empezamos?" opciones={INTENCIONES} onElegir={(o) => elegirIntencion(o as Intencion)} />,
            1600,
          )
      }}
      scrollKey={thread.msgs.length ? thread.scrollKey : undefined}
    >
      <AgentNote>
        Hola, Carolina. Te ayudo a crear, editar o consultar grupos{grupo ? `, empezando por «${grupo.nombre}»` : ''}.
      </AgentNote>
      <AgentSuggestions className="mt-4" title="¿Qué quieres hacer?" items={INTENCIONES.map((intencion) => ({ label: intencion, onClick: () => elegirIntencion(intencion) }))} />
      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )
}

// ── Planes ──

export type Borrador = { nombre: string; inicio: string; fin: string; asignaciones: Asignacion[] }

// Lo que el agente propone al armar un plan: la cohorte que acaba de entrar, con la inducción de la empresa.
const BORRADOR: Borrador = {
  nombre: 'Inducción cohorte octubre',
  inicio: '2026-10-01',
  fin: '2026-10-31',
  asignaciones: [
    {
      id: 'a-agente',
      alcance: 'grupos',
      destinatarios: ['Cohorte agosto'],
      personas: 46,
      items: ['Inducción corporativa', 'Seguridad de la información 2026', 'Código de ética Meta Colombia', 'Bienestar y pausas activas'],
    },
  ],
}

// Contenidos que el agente sugiere según lo que el plan ya tiene: los que suelen acompañar a esos.
const SUGERIDOS = ['Comunicación efectiva', 'Gestión del tiempo en equipos remotos', 'Feedback que sí sirve']

type PantallaPlanes =
  | { pantalla: 'lista'; planes: Plan[]; onUsarBorrador: (borrador: Borrador) => void; onAbrir: (plan: Plan) => void }
  | {
      pantalla: 'formulario'
      tipo: Plan['tipo']
      nombre: string
      asignaciones: Asignacion[]
      falta: string[]
      onAgregar: (asignacion: Asignacion) => void
      onQuitar: (id: string) => void
    }
  | { pantalla: 'detalle'; plan: Plan; onRecordar: (personas: Participante[]) => void }

export function AgentePlanes({ onClose, ...props }: PantallaPlanes & { onClose: () => void }) {
  const thread = useAgentThread()

  const contexto =
    props.pantalla === 'lista' ? (
      <>
        <span className="text-foreground">Planes de formación</span> · {props.planes.filter((p) => p.estado === 'Vigente').length} vigentes
      </>
    ) : props.pantalla === 'formulario' ? (
      <>
        <span className="text-foreground">{props.nombre.trim() || 'Plan sin nombre'}</span> · {TIPOS[props.tipo].singular.toLowerCase()}
      </>
    ) : (
      <>
        <span className="text-foreground">{props.plan.nombre}</span> · {NOMBRE_ESTADO[props.plan.estado].toLowerCase()}
      </>
    )

  // ── Respuestas, según la pantalla ──

  const armarPlan = () => (
    <div className="flex flex-col gap-3">
      <Text as="p" size="sm">
        La cohorte de agosto todavía no tiene su inducción. Te propongo este borrador; lo abro en «Crear plan» para que lo revises
        antes de guardar.
      </Text>
      <AgentCard title="Borrador">
        <div className="flex flex-col gap-1.5">
          <Text as="span" size="sm" weight="medium">
            {BORRADOR.nombre}
          </Text>
          <Text as="span" variant="muted" size="sm">
            {fechaSinAnio(BORRADOR.inicio)} – {fechaCorta(BORRADOR.fin)} · Cohorte agosto · 46 personas
          </Text>
        </div>
        <AgentList className="mt-3" items={BORRADOR.asignaciones[0].items} />
      </AgentCard>
      {props.pantalla === 'lista' ? (
        <Button className="self-start" onClick={() => props.onUsarBorrador(BORRADOR)}>
          Abrir en «Crear plan»
        </Button>
      ) : null}
    </div>
  )

  const terminanPronto = () => {
    if (props.pantalla !== 'lista') return null
    const pronto = props.planes.filter((p) => p.estado === 'Vigente' && /Termina en ([0-9]|[12][0-9]|30) d/.test(momentoDe(p)))
    if (!pronto.length) return 'Ningún plan vigente cierra en los próximos 30 días.'
    return (
      <div className="flex flex-col gap-3">
        <Text as="p" size="sm">
          {pronto.length} {plural(pronto.length, 'plan cierra', 'planes cierran')} en los próximos 30 días:
        </Text>
        <AgentList items={pronto.map((p) => `${p.nombre}: ${momentoDe(p).toLowerCase()}, ${Math.round(progresoDe(p))} % terminó completo.`)} />
      </div>
    )
  }

  const masAtrasado = () => {
    if (props.pantalla !== 'lista') return null
    const vigentes = props.planes.filter((p) => p.estado === 'Vigente')
    if (!vigentes.length) return 'No hay planes vigentes para comparar.'
    const peor = [...vigentes].sort((a, b) => progresoDe(a) - progresoDe(b))[0]
    return (
      <div className="flex flex-col gap-3">
        <Text as="p" size="sm">
          «{peor.nombre}» es el que va más atrás: {Math.round(progresoDe(peor))} % de sus {totalPersonas(peor).toLocaleString('es-CO')} personas terminó
          completo, y {momentoDe(peor).toLowerCase()}.
        </Text>
        <Button variant="outline" className="self-start" onClick={() => props.onAbrir(peor)}>
          Ver el plan
        </Button>
      </div>
    )
  }

  const sugerirContenidos = () => {
    if (props.pantalla !== 'formulario') return null
    const { onAgregar, onQuitar } = props
    return <SugerenciaAsignacion onAgregar={onAgregar} onQuitar={onQuitar} />
  }

  const revisar = () => {
    if (props.pantalla !== 'formulario') return null
    const personas = totalPersonas({ asignaciones: props.asignaciones })
    const repetidos = props.asignaciones.flatMap((a) => a.items).filter((item, i, todos) => todos.indexOf(item) !== i)
    const avisos = [
      ...props.falta.map((campo) => `Falta ${campo.charAt(0).toLowerCase()}${campo.slice(1)}.`),
      ...(props.nombre.trim() ? [] : ['No tiene nombre: se guardaría como «Plan sin nombre».']),
      ...(repetidos.length ? [`«${repetidos[0]}» está en más de una asignación: a quien esté en las dos le cuenta una sola vez.`] : []),
    ]
    return avisos.length ? (
      <div className="flex flex-col gap-3">
        <Text as="p" size="sm">
          Antes de guardar:
        </Text>
        <AgentList items={avisos} />
      </div>
    ) : (
      `Todo en orden: ${props.asignaciones.length} ${plural(props.asignaciones.length, 'asignación', 'asignaciones')} para ${personas.toLocaleString('es-CO')} personas. Al guardar queda Planeado.`
    )
  }

  const quienNoEmpieza = () => {
    if (props.pantalla !== 'detalle') return null
    const sinIniciar = porTiempoSinEntrar(personasDelPlan(props.plan).filter((p) => p.progreso === 0))
    if (!sinIniciar.length) return 'Todas las personas ya empezaron el plan.'
    return (
      <div className="flex flex-col gap-3">
        <Text as="p" size="sm">
          {sinIniciar.length} {plural(sinIniciar.length, 'persona no ha empezado', 'personas no han empezado')}. Las que llevan más tiempo sin entrar:
        </Text>
        <AgentList items={sinIniciar.slice(0, 5).map((p) => `${p.nombre} (${p.area}): ${p.ultimoAcceso ? `entró ${p.ultimoAcceso}` : 'nunca ha entrado'}`)} />
        {props.plan.estado === 'Vigente' ? (
          <Button className="self-start" onClick={() => props.onRecordar(sinIniciar)}>
            Enviar recordatorio a {plural(sinIniciar.length, 'esta persona', `las ${sinIniciar.length}`)}
          </Button>
        ) : null}
      </div>
    )
  }

  const resumir = () => {
    if (props.pantalla !== 'detalle') return null
    const filas = personasDelPlan(props.plan)
    const terminaron = filas.filter((f) => f.progreso === 100).length
    const enCurso = filas.filter((f) => f.progreso > 0 && f.progreso < 100).length
    return `${terminaron} de ${filas.length} personas terminaron todo lo asignado (${Math.round(progresoDe(props.plan))} %), ${enCurso} van a mitad de camino y ${filas.length - terminaron - enCurso} no han empezado. ${momentoDe(props.plan)}.`
  }

  const redactar = () => {
    if (props.pantalla !== 'detalle') return null
    return (
      <div className="flex flex-col gap-3">
        <ProposalCard
          proposalLabel="Borrador del recordatorio"
          proposal={`Hola: tu plan «${props.plan.nombre}» cierra el ${fechaCorta(props.plan.fin)}. Te faltan algunos ${TIPOS[props.plan.tipo].items}; con 20 minutos al día alcanzas a terminar. Entra desde tu Zona de estudio.`}
        />
        <Button variant="outline" className="self-start" onClick={() => notify('Texto copiado', 'Pégalo al enviar el recordatorio.', 'success')}>
          Copiar texto
        </Button>
      </div>
    )
  }

  const atajos: { label: string; respuesta: () => ReactNode }[] =
    props.pantalla === 'lista'
      ? [
          { label: 'Arma un plan para la cohorte que acaba de entrar', respuesta: armarPlan },
          { label: '¿Qué planes cierran pronto?', respuesta: terminanPronto },
          { label: '¿Qué plan va más atrasado?', respuesta: masAtrasado },
        ]
      : props.pantalla === 'formulario'
        ? [
            { label: 'Sugiéreme una asignación', respuesta: sugerirContenidos },
            { label: 'Revisa el plan antes de guardar', respuesta: revisar },
          ]
        : [
            { label: '¿Quién no ha empezado?', respuesta: quienNoEmpieza },
            { label: 'Resume cómo va el plan', respuesta: resumir },
            { label: 'Redacta el recordatorio', respuesta: redactar },
          ]

  const responderLibre = (texto: string) => {
    const t = texto.toLowerCase()
    const atajo = atajos.find((a) => a.label.toLowerCase().split(' ').some((palabra) => palabra.length > 5 && t.includes(palabra)))
    return atajo ? atajo.respuesta() : `Sobre esta pantalla te puedo ayudar con: ${atajos.map((a) => a.label.toLowerCase()).join('; ')}.`
  }

  return (
    <ContextPanel
      context={contexto}
      contextIcon={BookOpen01Icon}
      onClose={onClose}
      placeholder={props.pantalla === 'lista' ? 'Pregunta o pide algo sobre tus planes' : 'Pregunta o pide algo sobre este plan'}
      onSend={(texto) => thread.ask(texto, () => responderLibre(texto))}
      scrollKey={thread.msgs.length ? thread.scrollKey : undefined}
    >
      <AgentNote>
        {props.pantalla === 'lista'
          ? 'Hola, Carolina. Miro los planes de la empresa: te ayudo a armar uno nuevo o a ver cuáles necesitan atención.'
          : props.pantalla === 'formulario'
            ? 'Estoy viendo este plan mientras lo armas. Puedo sugerirte a quién asignarlo y revisarlo antes de guardar.'
            : 'Estoy viendo el avance de este plan. Te digo quién va atrasado y te ayudo con el recordatorio.'}
      </AgentNote>
      <AgentSuggestions className="mt-4" title="Sobre esta pantalla" items={atajos.map((a) => ({ label: a.label, onClick: () => thread.ask(a.label, a.respuesta) }))} />
      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )
}

// Una asignación propuesta que se aplica al plan abierto y se puede deshacer.
function SugerenciaAsignacion({ onAgregar, onQuitar }: { onAgregar: (asignacion: Asignacion) => void; onQuitar: (id: string) => void }) {
  const [aplicada, setAplicada] = useState<string | null>(null)
  const asignacion: Asignacion = { id: `a-sugerida-${Date.now()}`, alcance: 'grupos', destinatarios: ['Mandos medios'], personas: 71, items: SUGERIDOS }
  return (
    <div className="flex flex-col gap-3">
      <ProposalCard
        proposalLabel="Asignación propuesta"
        proposal={
          <>
            <Text as="span" size="sm" weight="medium">
              Mandos medios · 71 personas
            </Text>
            <AgentList className="mt-2" items={SUGERIDOS} />
          </>
        }
      />
      {aplicada ? (
        <UndoRow
          onUndo={() => {
            onQuitar(aplicada)
            setAplicada(null)
          }}
        >
          Agregada a las asignaciones del plan
        </UndoRow>
      ) : (
        <Button
          className="self-start"
          onClick={() => {
            onAgregar(asignacion)
            setAplicada(asignacion.id)
          }}
        >
          Agregar al plan
        </Button>
      )}
    </div>
  )
}

