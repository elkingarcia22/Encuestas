import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  File01Icon,
} from '@hugeicons/core-free-icons'
import { Button, TooltipProvider, cn } from '@ubits/flux-ui'
import { Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { keepFocusNear, useAgentPanelFocus } from '@/modules/admin/aprendizaje/lms-creator/components/agent-focus'
import { AiThinking } from '@/shared/components/AiThinking'
import { Hint } from '@/shared/components/Hint'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { AgentContextStrip, AgentPanelBody, AgentPanelFrame, AgentPanelHeader, ComposerTray } from '@/modules/admin/aprendizaje/lms-creator/components/agent-panel'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { UserMessage } from '@/modules/admin/suite-ai/chat/components/user-message'
import { AGENT_CARD, BUBBLE, KICKER, PILL_SOFT, PILL_XS } from './agent-styles'
import styles from './agent.module.css'
import { estadoDelHilo, type AgentMsg } from './use-agent-thread'

export type PanelState = 'open' | 'min' | 'closed'

// Escenario de cada caso: la pantalla de trabajo a la izquierda y el agente acoplado a la derecha,
// abierto (452px) o cerrado. El riel minimizado (60px) queda por compatibilidad, pero ningún panel lo ofrece desde el
// 22 sep: el agente se abre y se cierra.
export function AgentStage({
  state,
  onOpen,
  panel,
  pending,
  entorno = 'demo',
  children,
}: {
  state: PanelState
  onOpen: () => void
  panel: ReactNode
  // Punto azul en el riel: el agente tiene algo nuevo mientras está minimizado.
  pending?: boolean
  // Dónde se está pintando el escenario:
  //   'demo'     — las páginas del design system, donde va enmarcado y debajo de la franja de demo.
  //   'producto' — una pantalla real (el editor de avisos): sin marco y sin esa franja que no existe,
  //                porque si no el recuadro de la demo se cuela en el producto.
  entorno?: 'demo' | 'producto'
  children: ReactNode
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  useAgentPanelFocus(stageRef, state)

  // La página y el panel hacen scroll por dentro del escenario, para que la caja de pedir cambios quede
  // siempre visible. De dónde sale su alto cambia según dónde esté:
  //   demo     — alto fijo contra la ventana (cabecera + márgenes + franja de demo) y enmarcado.
  //   producto — el que le deje su contenedor, que en el marco general ya viene con la altura resuelta.
  //              Calcularlo contra la ventana dejaba el escenario más alto que su hueco y salían dos
  //              barras de scroll, una dentro de la otra.
  // El fondo va solo en la demo, donde el escenario es una tarjeta sobre la página. En el producto
  // se deja transparente: con `bg-background` opaco tapaba el degradado azul del marco (PageAmbience).
  const medidas =
    entorno === 'producto'
      ? 'min-h-0 flex-1'
      : 'h-[calc(100svh-11.25rem)] min-h-160 shrink-0 rounded-2xl border bg-background'

  return (
    // `@container`: el panel se mide contra este marco, no contra la ventana, y se angosta cuando queda poco espacio.
    <div ref={stageRef} className={cn('@container relative flex overflow-hidden', medidas)}>
      <div className="relative min-w-0 flex-1 overflow-auto">{children}</div>
      <AgentDock open={state === 'open'}>{panel}</AgentDock>
      {state === 'min' ? <AgentRail onOpen={onOpen} pending={pending} /> : null}
    </div>
  )
}

const prefiereSinMovimiento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Hueco del panel a la derecha: entra y sale deslizándose mientras la pantalla se angosta o se ensancha con él
// (Nicolás, 25 sep: «quiero que lo cierre suavemente, no tan brusco como lo hace hoy»). Antes el panel se quitaba de
// golpe y la pantalla saltaba 452px en un cuadro. Ahora la columna se encoge de su ancho a cero (`grid-cols` de 1fr a
// 0fr, así respeta el ancho que tenga el panel: 452 o 360) y el panel, pegado al borde derecho, se va por ese borde
// mientras se desvanece. Sigue montado hasta que termina de irse, sin que se pueda tocar (`inert`). Entra con la curva
// de la barra lateral (rápido y aterriza suave); sale con una pareja y un poco más lenta, porque con esa misma curva
// recorría el 80% en 100 ms y se seguía sintiendo brusco. Si la pantalla arranca con el panel abierto, no entra
// animado: solo lo hace al abrirlo después.
export function AgentDock({ open, className, children }: { open: boolean; className?: string; children: ReactNode }) {
  const [shown, setShown] = useState(open)
  const [entering, setEntering] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)

  if (open && !shown) {
    setShown(true)
    setEntering(true)
  }
  // Sin movimiento (preferencia del sistema) no hay transición que esperar: se va de una.
  if (!open && shown && prefiereSinMovimiento()) setShown(false)

  // El foco estaba en la X del panel que se está yendo: pasa al botón para reabrirlo, que aparece al cerrar. Si no, se
  // quedaba en un panel que ya no se puede tocar y el teclado arrancaba de nuevo desde arriba.
  useEffect(() => {
    if (open) return
    const active = document.activeElement
    if (!(active instanceof HTMLElement) || !dockRef.current?.contains(active)) return
    active.blur()
    document.querySelector<HTMLElement>('[data-agent-reopen]')?.focus()
  }, [open])

  if (!shown) return null

  return (
    <div
      ref={dockRef}
      inert={!open}
      onTransitionEnd={(event) => {
        if (!open && event.target === event.currentTarget && event.propertyName === 'grid-template-columns') setShown(false)
      }}
      className={cn(
        'grid shrink-0 transition-[grid-template-columns] motion-reduce:transition-none',
        open
          ? 'grid-cols-[1fr] duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]'
          : 'grid-cols-[0fr] duration-450 ease-[cubic-bezier(0.4,0,0.2,1)]',
        open && entering && 'starting:grid-cols-[0fr]',
        className,
      )}
    >
      <div
        className={cn(
          'flex min-w-0 justify-end overflow-hidden transition-opacity motion-reduce:transition-none',
          open ? 'opacity-100 duration-250 ease-out' : 'opacity-0 duration-350 ease-in',
          open && entering && 'starting:opacity-0',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function AgentRail({ onOpen, pending }: { onOpen: () => void; pending?: boolean }) {
  return (
    <aside aria-label="Orbit Flow minimizado" className="flex w-15 shrink-0 flex-col items-center gap-3.5 border-l py-4">
      {/* El punto azul también va en el nombre: solo con el color no llega al lector de pantalla. */}
      <BotonIcono
        data-agent-reopen=""
        size="icon"
        aria-label={pending ? 'Abrir Orbit Flow · tiene algo nuevo' : 'Abrir Orbit Flow'}
        className="relative"
        onClick={onOpen}
      >
        <Orb className="size-7.5" />
        {pending ? <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" /> : null}
      </BotonIcono>
      <span aria-hidden="true" className="text-[13px] text-muted-foreground [writing-mode:vertical-rl]">
        Orbit Flow
      </span>
    </aside>
  )
}

// «Orbit Flow»: con el panel cerrado, la forma de volver a abrirlo va en la fila de botones de la pantalla, siempre la
// última, a la derecha del botón primario (auditoría 5-oct). Sin `label`: ya se llama «Orbit Flow». Por defecto va la pastilla entera; en pantallas
// muy cargadas (cabecera larga, botones con mucho texto) va `compact`: solo el orbe, para no competir con la acción
// principal. El nombre sale al pasar el cursor.
export function ReopenAgentButton({
  onClick,
  label = 'Orbit Flow',
  compact,
  pending,
  region,
  chip,
  className,
}: {
  onClick: () => void
  label?: string
  compact?: boolean
  // Tiene algo nuevo que contar (OF-47): punto azul en el orbe, como en el riel. También va en el nombre.
  pending?: boolean
  // Nombre de la parte en los configuradores (anatomía) y dónde va su pastilla (`top`, `inline`…).
  region?: string
  chip?: string
  // Solo layout o animación de entrada de la pantalla que lo usa; el aspecto lo pone el botón.
  className?: string
}) {
  const punto = pending ? <span aria-hidden="true" className="absolute -top-0.5 left-6 size-2.5 rounded-full border-2 border-background bg-primary" /> : null
  const nombre = pending ? `${label} · tiene algo nuevo` : label
  if (compact) {
    return (
      <TooltipProvider delay={200}>
        <Hint label={nombre}>
          <Button data-region={region} data-chip={chip} data-agent-reopen="" variant="outline" size="icon" aria-label={nombre} className="relative size-9! rounded-full! p-0!" onClick={onClick}>
            <Orb className="size-6.5" />
            {punto}
          </Button>
        </Hint>
      </TooltipProvider>
    )
  }
  return (
    <Button
      data-region={region}
      data-chip={chip}
      data-agent-reopen=""
      variant="outline"
      aria-label={pending ? nombre : undefined}
      className={cn('relative h-9! gap-2! rounded-full! pr-4! pl-1.5!', className)}
      onClick={onClick}
    >
      <Orb className="size-6.5" />
      {punto}
      {label}
    </Button>
  )
}

type ContextPanelProps = {
  // Qué está mirando el agente: «Hoja de vida de Laura Méndez · sección Experiencia».
  context: ReactNode
  contextIcon?: IconSvgElement
  onClose?: () => void
  placeholder?: string
  onSend?: (text: string) => void
  // Cuando cambia, el panel baja hasta lo último.
  scrollKey?: string | number
  // El «+» de la caja: sin esto abre los conectores del chat de Orbit; con esto hace lo que sirve en esta pantalla
  // (en la vacante, agregar hojas de vida: OF-26). `attach={false}` lo quita.
  onAttach?: () => void
  attachLabel?: string
  attach?: boolean
  // «Voz» dicta el pedido en la caja (OF-27). Sin esto, avisa que el modo voz está en el chat de Orbit.
  dictar?: boolean
  className?: string
  children: ReactNode
}

type Reconocedor = {
  lang: string
  interimResults: boolean
  onresult: ((evento: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

// El dictado del navegador, si lo tiene (Chrome y Safari lo traen con prefijo).
function reconocedor(): Reconocedor | null {
  const ventana = window as unknown as { SpeechRecognition?: new () => Reconocedor; webkitSpeechRecognition?: new () => Reconocedor }
  const Clase = ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition
  return Clase ? new Clase() : null
}

// Panel del agente contextual. Es el mismo del editor de LMS y del configurador (/design-system/agente-contextual):
// marco de 452px, cabecera con el orbe, el nombre y solo cerrar, franja «Contexto:», hilo y la caja de escribir del
// chat de Suite AI. Antes era una versión paralela con «ampliar» y «minimizar» y una caja hecha a mano, y el agente
// no se veía igual en Avisos, en la vacante y en el editor (Nicolás, 22 sep: «tiene un montón de acciones arriba que
// no son, eso de minimizar y ampliar ¿para qué?»). Se abre y se cierra; nada más.
export function ContextPanel({
  context,
  contextIcon,
  onClose,
  placeholder = 'Pregunta o pide un cambio sobre esto',
  onSend,
  scrollKey,
  onAttach,
  attachLabel,
  attach = true,
  dictar,
  className,
  children,
}: ContextPanelProps) {
  const [draft, setDraft] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const dictado = useRef<Reconocedor | null>(null)
  const lastScrollKey = useRef(scrollKey)

  // Al llegar algo nuevo, el panel deja arriba el último pedido para que la respuesta se lea desde su comienzo
  // (OF-29: antes bajaba hasta el final y una comparación larga quedaba con su comienzo fuera de la vista). Si la
  // respuesta es corta, queda igual que antes: todo a la vista. Al abrir se queda arriba para leer el saludo.
  // Se compara con el último valor (no con «primera vez») porque el modo estricto corre el efecto dos veces.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || scrollKey === undefined || scrollKey === lastScrollKey.current) return
    lastScrollKey.current = scrollKey
    const id = window.setTimeout(() => {
      const pedidos = el.querySelectorAll<HTMLElement>('[data-pedido]')
      const ultimo = pedidos[pedidos.length - 1]
      const destino = ultimo ? ultimo.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 12 : el.scrollHeight
      el.scrollTo({ top: Math.max(0, Math.min(destino, el.scrollHeight)), behavior: 'smooth' })
    }, 40)
    return () => window.clearTimeout(id)
  }, [scrollKey])

  // Esc cierra el panel cuando el foco está dentro y no hay un menú o una ventana abiertos (OF-50). Va en el elemento y
  // no en React: los menús del panel viven en un portal y su Esc no debe cerrar también el panel.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel || !onClose) return
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape' || evento.defaultPrevented) return
      if (document.querySelector('[role=menu], [role=dialog][data-open], [role=alertdialog]')) return
      onClose()
    }
    panel.addEventListener('keydown', alTeclear)
    return () => panel.removeEventListener('keydown', alTeclear)
  }, [onClose])

  useEffect(() => () => dictado.current?.stop(), [])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    onSend?.(text)
  }

  const voz = () => {
    if (!dictar) {
      notify('El modo voz se abre desde el chat de Orbit', undefined, 'info')
      return
    }
    if (escuchando) {
      dictado.current?.stop()
      return
    }
    const uno = reconocedor()
    if (!uno) {
      notify('Tu navegador no permite dictar', 'Escribe el pedido en la caja; en Chrome o Safari puedes dictarlo.', 'info')
      return
    }
    uno.lang = 'es-CO'
    uno.interimResults = true
    const antes = draft ? `${draft.trim()} ` : ''
    uno.onresult = (evento) => setDraft(antes + Array.from(evento.results, (resultado) => resultado[0].transcript).join(''))
    uno.onend = () => setEscuchando(false)
    uno.onerror = () => {
      setEscuchando(false)
      notify('No te pude escuchar', 'Revisa que el navegador tenga permiso para usar el micrófono.', 'info')
    }
    dictado.current = uno
    setEscuchando(true)
    uno.start()
  }

  return (
    <AgentPanelFrame
      ref={panelRef}
      className={cn(
        // Si el marco se queda corto (portátil chico o tablet) baja a 360px para no ahogar la pantalla; en el celular va
        // encima de la pantalla, a todo lo ancho. Lo mide el contenedor que lo recibe (en el producto, la fila de debajo
        // del header: ver RootLayout).
        '@max-[60rem]:w-90 @max-[40rem]:absolute @max-[40rem]:inset-y-0 @max-[40rem]:right-0 @max-[40rem]:z-10 @max-[40rem]:w-full @max-[40rem]:border-l-0',
        className,
      )}
    >
      <AgentPanelHeader onClose={onClose} />
      <AgentContextStrip icon={contextIcon}>{context}</AgentContextStrip>
      {/* Hilo como registro: el lector anuncia lo que se agrega (pedidos, respuestas, propuestas, «Deshacer»), no el
          contenido que ya estaba al abrir ni los números que cambian dentro de algo que ya se leyó. */}
      <AgentPanelBody ref={scrollRef} role="log" aria-label="Conversación con el agente" aria-relevant="additions">
        {children}
      </AgentPanelBody>
      <ComposerTray>
        {escuchando ? (
          <div role="status" className="mb-2 px-1 text-[13px] text-muted-foreground">
            Te escucho: lo que digas se escribe en la caja. Toca «Voz» otra vez para terminar.
          </div>
        ) : null}
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          placeholder={placeholder}
          onVoice={voz}
          contextNote=""
          attach={attach}
          onAttach={onAttach}
          attachLabel={attachLabel}
        />
      </ComposerTray>
    </AgentPanelFrame>
  )
}

export function UserBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-end', className)}>
      <div className={BUBBLE}>{children}</div>
    </div>
  )
}

// Dentro de una respuesta con sus acciones (AgentMessage), el orbe ya va al lado: las notas no repiten el suyo.
export const OrbeEnRespuesta = createContext(false)

// Línea del agente con orbe pequeño: «Propuse un cambio. Nada se guarda hasta que lo apliques».
export function AgentNote({ children, className }: { children: ReactNode; className?: string }) {
  const sinOrbe = useContext(OrbeEnRespuesta)
  if (sinOrbe)
    return (
      <Text as="div" size="sm" variant="muted" className={className}>
        {children}
      </Text>
    )
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <Orb className="mt-px size-5.5" />
      {/* 14px y en gris, como estaba antes del 22 sep (Cristian, 23 sep: los pesos de texto vuelven a como estaban,
          salvo el saludo de Suite AI). */}
      <Text as="span" size="sm" variant="muted">
        {children}
      </Text>
    </div>
  )
}

export function AgentThinking({ label, className }: { label?: string; className?: string }) {
  return <AiThinking label={label} className={className} />
}

// En qué mensaje del hilo está una respuesta: lo leen sus acciones (las sugerencias para seguir van solo en la última)
// y lo que la respuesta recuerda de sí misma (`useEstadoDelMensaje`).
type Mensaje = { clave?: string; id: number; ultimo: boolean; pedido?: string; pedidoId?: number }
const MensajeContexto = createContext<Mensaje | null>(null)
export const useMensajeAgente = () => useContext(MensajeContexto)

const sinSuscripcion = () => () => {}

// Como `useState`, pero dentro de una respuesta del hilo lo guarda la conversación: si el panel se cierra y se vuelve a
// abrir, la respuesta sigue como se dejó (lo que se eligió, si ya se guardó…). Fuera de una respuesta es `useState`.
export function useEstadoDelMensaje<T>(nombre: string, inicial: T | (() => T)) {
  const mensaje = useContext(MensajeContexto)
  const [local, setLocal] = useState<T>(inicial)
  const clave = mensaje?.clave
  const llave = mensaje ? `${mensaje.id}:${nombre}` : ''
  const suscribir = useCallback((oyente: () => void) => (clave ? estadoDelHilo.suscribir(clave)(oyente) : sinSuscripcion()), [clave])
  const guardado = useSyncExternalStore(suscribir, () => (clave ? estadoDelHilo.leer<T>(clave, llave) : undefined))
  // Lo primero que valió también se guarda: si se calculó con los datos de ese momento, al volver vale lo mismo.
  useEffect(() => {
    if (clave && guardado === undefined) estadoDelHilo.guardar(clave, llave, local)
  }, [clave, llave, guardado, local])
  if (!clave) return [local, setLocal] as const
  const valor = guardado === undefined ? local : guardado
  const cambiar = (siguiente: T | ((antes: T) => T)) =>
    estadoDelHilo.guardar(clave, llave, typeof siguiente === 'function' ? (siguiente as (antes: T) => T)(estadoDelHilo.leer<T>(clave, llave) ?? valor) : siguiente)
  return [valor, cambiar] as const
}

// Hilo de pedidos y respuestas (ver useAgentThread). Con `clave` (la de la conversación), cada respuesta recuerda lo
// que se hizo en ella; con `onEditar` el pedido se copia o se corrige (OF-34); con `onDetener`, «Razonando…» trae
// «Detener» (OF-46).
export function AgentThread({
  msgs,
  thinking,
  thinkingLabel,
  clave,
  onEditar,
  onDetener,
}: {
  msgs: AgentMsg[]
  thinking?: boolean
  thinkingLabel?: string
  clave?: string
  onEditar?: (id: number, text: string) => void
  onDetener?: () => void
}) {
  const ultimoAgente = [...msgs].reverse().find((msg) => msg.role === 'agent')?.id
  let pedido: AgentMsg | undefined
  return (
    <>
      {msgs.map((msg) => {
        if (msg.role === 'user') {
          pedido = msg
          return onEditar && typeof msg.content === 'string' ? (
            <div key={msg.id} data-pedido="" className={cn('mt-4', styles.msgIn)}>
              <UserMessage text={msg.content} onEdit={(text) => onEditar(msg.id, text)} />
            </div>
          ) : (
            <UserBubble key={msg.id} className={cn('mt-4', styles.msgIn)}>
              <span data-pedido="">{msg.content}</span>
            </UserBubble>
          )
        }
        return (
          <MensajeContexto.Provider
            key={msg.id}
            value={{ clave, id: msg.id, ultimo: msg.id === ultimoAgente && !thinking, pedido: pedido?.pedido, pedidoId: pedido?.id }}
          >
            <div className={cn('mt-3.5', styles.msgIn)}>
              {typeof msg.content === 'string' ? <div className="text-sm leading-[1.55] text-foreground/80">{msg.content}</div> : msg.content}
            </div>
          </MensajeContexto.Provider>
        )
      })}
      {thinking ? (
        <div className={cn('mt-4 flex flex-wrap items-center gap-3', styles.msgIn)}>
          <AgentThinking label={thinkingLabel} />
          {onDetener ? (
            <Button variant="outline" size="sm" className={PILL_XS} onClick={onDetener}>
              Detener
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

// Tarjeta «Actual / Propuesta». Sin `current` muestra solo la propuesta.
export function ProposalCard({
  current,
  proposal,
  currentLabel = 'Actual',
  proposalLabel = 'Propuesta',
  anim,
  className,
}: {
  current?: ReactNode
  proposal: ReactNode
  currentLabel?: string
  proposalLabel?: string
  anim?: 'in' | 'nudge' | null
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-[16px] border', anim === 'in' && styles.propIn, anim === 'nudge' && styles.nudge, className)}>
      {current !== undefined ? (
        <div className="bg-muted px-4 py-3.5">
          <div className={`${KICKER} text-muted-foreground`}>{currentLabel}</div>
          <div className="mt-2 text-sm leading-normal text-muted-foreground">{current}</div>
        </div>
      ) : null}
      <div className={cn('bg-background px-4 py-3.5', current !== undefined && 'border-t')}>
        <div className={`${KICKER} text-foreground`}>{proposalLabel}</div>
        <div className="mt-2 text-sm leading-[1.55] text-pretty text-foreground/80">{proposal}</div>
      </div>
    </div>
  )
}

export function AgentCard({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn(AGENT_CARD, className)}>
      {title ? <h3 className={`${KICKER} mb-2.5 text-muted-foreground`}>{title}</h3> : null}
      {children}
    </div>
  )
}

// Lista con viñeta, cada línea entra escalonada.
export function AgentList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {items.map((item, index) => (
        <div key={index} className={cn('flex gap-2.5', styles.lineIn)} style={{ animationDelay: `${index * 50}ms` }}>
          <span aria-hidden="true" className="mt-1.75 size-1.25 shrink-0 rounded-full bg-foreground" />
          <span className="text-sm leading-normal text-foreground/80">{item}</span>
        </div>
      ))}
    </div>
  )
}

// «Aplicado al campo Descripción · Deshacer». Al deshacer, la fila se va con el foco: vuelve a la acción marcada con
// `data-undo-focus` (la que hizo el cambio).
export function UndoRow({ children, onUndo, className }: { children: ReactNode; onUndo: () => void; className?: string }) {
  return (
    <Button
      variant="outline"
      className={cn('h-auto! w-full justify-start gap-2.5! rounded-[12px]! px-3.5! py-2.75! font-normal! text-foreground/80', className)}
      onClick={(event) => {
        keepFocusNear(event.currentTarget)
        onUndo()
      }}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground" />
      <span className="flex-1 text-left text-[13px]">{children}</span>
      <span className="text-[13px] font-medium text-foreground underline underline-offset-3">Deshacer</span>
    </Button>
  )
}

// Atajos sobre lo que está abierto («Sobre este contenido»).
export function AgentSuggestions({
  title = 'Sobre este contenido',
  items,
  className,
}: {
  title?: string
  items: { label: string; onClick: () => void }[]
  className?: string
}) {
  return (
    <div className={className}>
      <div className={`${KICKER} text-muted-foreground`}>{title}</div>
      <div className="mt-3 flex flex-col items-start gap-2.5">
        {items.map((item) => (
          <Button key={item.label} variant="outline" className={PILL_SOFT} onClick={item.onClick}>
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Fuentes de una respuesta; al tocarlas se resalta el lugar en la pantalla de trabajo.
export function SourcePills({ sources, className }: { sources: { label: string; onClick?: () => void }[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {sources.map((source) => (
        <Button
          key={source.label}
          variant="outline"
          className={`${PILL_XS} text-muted-foreground!`}
          onClick={source.onClick ?? (() => notify(source.label, undefined, 'info'))}
        >
          <HugeiconsIcon icon={File01Icon} size={14} strokeWidth={1.5} aria-hidden="true" />
          {source.label}
        </Button>
      ))}
    </div>
  )
}
