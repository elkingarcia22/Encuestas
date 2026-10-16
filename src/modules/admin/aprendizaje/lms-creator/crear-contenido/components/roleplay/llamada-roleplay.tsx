import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, Mic01Icon, MicOff01Icon, MessageCancel01Icon, CallEnd01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, MessageScroller, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport, Text, cn } from '@ubits/flux-ui'
import { UserBubble } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import type { RoleplayConfig } from '../borrador'
import { CaraPersonaje } from './vista-roleplay'
import { nombreModo } from './modelo'
import { libretoDe, reloj, type CanalRoleplay } from './estudio'

// ── La llamada, a pantalla completa ──────────────────────────────────────────────────────────────────────────────
//
// Mientras dura no hay índice, ni cabecera del contenido, ni scroll de fondo: no es un recurso que se mira, es una
// conversación. Por eso va en un portal por encima de todo.
//
// Dos canales, y el canal **no cambia a mitad**: con micrófono se entra por voz, sin micrófono directo al chat.
//
// - **Voz**: oscuro siempre, como cualquier app de llamadas, independiente del tema del producto. Se fuerza el mapa
//   de tokens oscuro sobre este subárbol en vez de pintar colores a mano.
// - **Texto**: el mismo lenguaje del Agente IA —orbes de fondo, el campo de escritura sin franja propia y las
//   respuestas del personaje sin caja—, porque es el mismo tipo de conversación. Respeta el tema del usuario.
//
// Los dos comparten cabecera y ancho de cuerpo: al pasar de uno a otro no se mueve nada de sitio.

type Mensaje = { id: string; de: 'personaje' | 'tu'; texto: string }

type Props = {
  config: RoleplayConfig
  canal: CanalRoleplay
  onTerminar: () => void
  /**
   * Dentro de la vista de móvil del creador. Ahí la llamada **no** se monta en el `body`: saldría por encima de
   * toda la pantalla y rompería la ilusión del aparato, igual que pasaría con un Drawer de la librería. Se queda
   * dentro del teléfono, como el panel del índice.
   */
  enTelefono?: boolean
}

export function LlamadaRoleplay({ config, canal, onTerminar, enTelefono }: Props) {
  const libreto = libretoDe(config)
  const personaje = config.nombrePersonaje.trim() || 'el personaje'
  const identidad = [personaje, config.identidadPersonaje.trim()].filter(Boolean).join(' · ')
  const titulo = config.titulo.trim() || 'Llamada'
  const evaluacion = config.modo === 'evaluacion'

  const [segundos, setSegundos] = useState(0)
  const [turno, setTurno] = useState(0)
  const [silenciado, setSilenciado] = useState(false)
  const [nivel, setNivel] = useState(0)
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ id: 'm0', de: 'personaje', texto: libreto[0] }])
  const [borrador, setBorrador] = useState('')

  // El cronómetro de la llamada. Al llegar a la duración que puso el creador, se cierra sola.
  const restante = config.duracionMin * 60 - segundos
  const terminar = useRef(onTerminar)
  terminar.current = onTerminar
  useEffect(() => {
    const reloj = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => window.clearInterval(reloj)
  }, [])
  useEffect(() => {
    if (restante <= 0) terminar.current()
  }, [restante])

  // El micrófono queda abierto durante la llamada por voz: el indicador del botón sigue la voz real, no un latido
  // por temporizador. Al silenciar se cierra de verdad y el navegador deja de señalar que graba.
  useEffect(() => {
    if (canal !== 'voz' || silenciado) {
      setNivel(0)
      return
    }
    let flujo: MediaStream | null = null
    let contexto: AudioContext | null = null
    let cuadro = 0
    let vivo = true
    void (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (!vivo) return
        contexto = new AudioContext()
        const analizador = contexto.createAnalyser()
        analizador.fftSize = 512
        contexto.createMediaStreamSource(flujo).connect(analizador)
        const datos = new Uint8Array(analizador.frequencyBinCount)
        const leer = () => {
          analizador.getByteTimeDomainData(datos)
          let pico = 0
          for (const v of datos) pico = Math.max(pico, Math.abs(v - 128) / 128)
          setNivel(pico)
          cuadro = requestAnimationFrame(leer)
        }
        leer()
      } catch {
        // Sin permiso la llamada sigue: el indicador se queda quieto y no se finge que se está captando algo.
        setNivel(0)
      }
    })()
    return () => {
      vivo = false
      cancelAnimationFrame(cuadro)
      flujo?.getTracks().forEach((t) => t.stop())
      void contexto?.close()
    }
  }, [canal, silenciado])

  // Por voz el personaje va alternando turnos solo; por escrito contesta a lo que se le escribe.
  useEffect(() => {
    if (canal !== 'voz') return
    const paso = window.setInterval(() => setTurno((t) => Math.min(t + 1, libreto.length - 1)), 9000)
    return () => window.clearInterval(paso)
  }, [canal, libreto.length])

  const enviar = () => {
    const texto = borrador.trim()
    if (!texto) return
    setBorrador('')
    const siguiente = Math.min(turno + 1, libreto.length - 1)
    setTurno(siguiente)
    setMensajes((m) => [...m, { id: `tu-${m.length}`, de: 'tu', texto }])
    window.setTimeout(() => setMensajes((m) => [...m, { id: `p-${m.length}`, de: 'personaje', texto: libreto[siguiente] }]), 900)
  }

  // Quién tiene el turno: con el micrófono abierto y sin hablar, el personaje responde.
  const hablaElPersonaje = canal === 'voz' && !silenciado && Math.floor(segundos / 4) % 2 === 0

  const cabecera = (
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-6">
      <CaraPersonaje imagen={config.imagen} className="size-9" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Text as="span" size="sm" weight="medium" className="truncate">
          {titulo}
        </Text>
        <Text as="span" size="xs" variant="muted" className="truncate">
          {identidad || 'Personaje sin definir'}
        </Text>
      </div>
      <Badge variant={evaluacion ? 'warning-outline' : 'info-outline'} size="sm">
        {nombreModo(config.modo)}
      </Badge>
      <Text as="span" size="sm" weight="medium" className="flex items-center gap-1.5 tabular-nums">
        <HugeiconsIcon icon={Clock01Icon} size={16} aria-hidden="true" />
        {reloj(segundos)}
      </Text>
    </header>
  )

  // Nombra lo que se está terminando: por voz una llamada, por escrito un chat. En voz colgar **es** la acción de la
  // pantalla, así que va en rojo sólido; en el chat la acción es enviar —vive dentro del campo— y terminar baja a
  // secundario, que dos botones sólidos compitiendo abajo es puro ruido.
  const finalizar =
    canal === 'voz' ? (
      <Button variant="destructive" onClick={onTerminar}>
        <HugeiconsIcon icon={CallEnd01Icon} size={18} aria-hidden="true" />
        <span className="max-sm:sr-only">Finalizar llamada</span>
      </Button>
    ) : (
      <Button variant="outline" onClick={onTerminar}>
        <HugeiconsIcon icon={MessageCancel01Icon} size={18} aria-hidden="true" />
        Finalizar chat
      </Button>
    )

  const pantalla = (
    <div
      // El canal por voz va oscuro siempre, como Meet o Zoom: no sigue el tema del usuario. Se fuerza el mapa de
      // tokens oscuro sobre este subárbol en vez de pintar colores sueltos.
      className={cn(
        'flex flex-col bg-background text-foreground',
        enTelefono ? 'absolute inset-0 z-20' : 'fixed inset-0 z-[60]',
        canal === 'voz' && 'dark',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Llamada con ${personaje}`}
    >
      {cabecera}
      {canal === 'voz' ? (
        <>
          <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
            <CaraPersonaje
              imagen={config.imagen}
              className={cn('size-32 transition-transform duration-500 sm:size-40', hablaElPersonaje && 'scale-105')}
            />
            <Onda activa={hablaElPersonaje} />
            {/* Lo que se está diciendo, en grande y siempre a la vista: es el equivalente de mirar a la cara. */}
            <Text as="p" size="xl" className="text-center text-balance" aria-live="polite">
              «{libreto[Math.min(turno, libreto.length - 1)]}»
            </Text>
            <Text as="p" size="sm" variant="muted" aria-live="polite">
              {silenciado ? 'Tienes el micrófono silenciado' : hablaElPersonaje ? `${personaje} está hablando…` : 'Te está escuchando…'}
            </Text>
          </main>
          <footer className="mx-auto flex w-full max-w-3xl shrink-0 items-center gap-3 px-4 pb-6 sm:px-6">
            <button
              type="button"
              aria-label={silenciado ? 'Activar micrófono' : 'Silenciar micrófono'}
              onClick={() => setSilenciado((v) => !v)}
              className={cn(
                'relative flex size-12 shrink-0 items-center justify-center rounded-full border transition-colors',
                silenciado ? 'border-destructive/50 bg-destructive/15 text-destructive' : 'bg-card',
              )}
            >
              {/* El halo sigue la voz real. Si latiera solo estaría diciendo «te escucho» sin saber si es cierto. */}
              {!silenciado ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full bg-primary/30"
                  style={{ transform: `scale(${1 + nivel * 0.6})`, opacity: 0.15 + nivel * 0.85 }}
                />
              ) : null}
              <HugeiconsIcon icon={silenciado ? MicOff01Icon : Mic01Icon} size={20} aria-hidden="true" className="relative" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <Text as="span" size="sm" weight="medium">
                {silenciado ? 'Micrófono silenciado' : 'Te escucho'}
              </Text>
              <Text as="span" size="xs" variant="muted" className="truncate">
                <span className="tabular-nums">{reloj(restante)}</span>
                {silenciado ? ' · actívalo para responder' : ' · habla con normalidad'}
              </Text>
            </div>
            {finalizar}
          </footer>
        </>
      ) : (
        <>
          {/* El chat se ve como el Agente IA: fondo con orbes de la paleta de IA y las respuestas sin caja. */}
          <main className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 px-4 pt-4 sm:px-6">
              <MessageScrollerProvider defaultScrollPosition="end">
                <MessageScroller className="min-h-0 flex-1">
                  <MessageScrollerViewport aria-label={`Conversación con ${personaje}`}>
                    <MessageScrollerContent className="gap-6 pt-2 pb-4">
                      {mensajes.map((m) => (
                        <MessageScrollerItem key={m.id} messageId={m.id}>
                          {m.de === 'tu' ? (
                            <UserBubble>{m.texto}</UserBubble>
                          ) : (
                            <div className="flex items-start gap-2.5">
                              <CaraPersonaje imagen={config.imagen} className="mt-0.5 size-7" />
                              <div className="flex min-w-0 flex-col gap-1">
                                {/* Solo se rotula a quien habla del otro lado: marcar «Tú» lo propio no informa de nada. */}
                                <Text as="span" size="xs" weight="medium" variant="muted">
                                  {personaje}
                                </Text>
                                <Text as="p">{m.texto}</Text>
                              </div>
                            </div>
                          )}
                        </MessageScrollerItem>
                      ))}
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                </MessageScroller>
              </MessageScrollerProvider>
            </div>
          </main>
          <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-2 px-4 pb-4 sm:px-6">
            <Composer
              value={borrador}
              onChange={setBorrador}
              onSend={enviar}
              onVoice={() => undefined}
              attach={false}
              voice={false}
              placeholder={`Escribe lo que le dirías a ${personaje}`}
              ariaLabel="Tu respuesta"
            />
            {/* Terminar vive lejos de enviar: son el mismo gesto con final opuesto. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Text as="span" size="xs" variant="muted">
                Enter para enviar · Mayús + Enter para un salto de línea
              </Text>
              {finalizar}
            </div>
          </div>
        </>
      )}
    </div>
  )

  return enTelefono ? pantalla : createPortal(pantalla, document.body)
}

/** La onda de la llamada: marca quién tiene el turno sin necesidad de leer nada. */
function Onda({ activa }: { activa: boolean }) {
  return (
    <div className="flex items-end gap-1" aria-hidden="true">
      {[10, 18, 26, 34, 26, 18, 10].map((alto, i) => (
        <span
          key={i}
          className={cn('w-1 rounded-full bg-muted-foreground/40 transition-all duration-300', activa && 'bg-primary')}
          style={{ height: activa ? alto : 6, transitionDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}
