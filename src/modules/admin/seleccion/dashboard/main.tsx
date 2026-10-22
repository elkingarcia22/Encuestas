import { Fragment, useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BubbleChatAddIcon, DashboardSquare01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Heading,
  ScrollArea,
  Text,
  TooltipProvider,
} from '@ubits/flux-ui'
import { PageShell } from '@/shared/components/PageShell'
import { Orb } from '@/shared/components/Orb'
import { notifyAction } from '@/shared/components/notify'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import greet from '@/modules/admin/suite-ai/chat/components/greeting.module.css'
import { AgentThread } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { CLAVE, Conversacion, abrirTablero, olvidar, responder } from './conversacion'
import { SUGERENCIAS, useTableros, type Tablero } from './insights'

// Orbit Data: lo que fue AI Insights (8 oct) pasa a ser una conversación con Orbit sobre los datos de Selección
// (16 oct, VP de producto: «se entiende tal vez el AI Insights, no es la palabra… es el mismo suite de AI que vamos a
// tener, pero que tú puedas hablar con tu data. Y es en selección donde queremos probar… antes de mandarlo a una suite de
// AI Pro… que sea muy conversacional. Y ahí es donde entra… la UI generativa, que genera sus propios dashboards»).
// El nombre lo eligió Nicolás el 16 oct entre opciones cercanas a lo que dijo la VP: es el mismo Orbit, con el foco en los
// datos (como «Orbit Flow»).
//
// Se ve como el chat de Orbit porque es el mismo, solo con los datos de Selección: sin cabecera de página (el saludo dice
// qué es), sin la pastilla de créditos y sin lecturas fijas (16 oct, Nicolás: «no es necesario en esta sección», «¿para qué
// esto?»), y la conversación y la caja de escribir en la columna de lectura del chat («se ve horrible así de ancho»). Como
// en el chat de Orbit, la conversación baja en su propia zona y la caja de escribir queda fija debajo, sin nada que pase
// por detrás; «Tus tableros» va dentro del chat, junto a la caja. Las frases llevan el margen del chat de Orbit y lo que
// Orbit arma (cifras, gráficos, un tablero) mide lo mismo que la caja de escribir, y se acomoda a ese ancho. Un tablero pedido con palabras se
// ajusta conversando y se guarda en «Tus tableros». El código de las respuestas vive en `conversacion.tsx`; el de los tableros,
// en `insights.ts`.

const SALUDO = '¿Qué quieres saber de tu selección?'

function TusTableros({ tableros, onAbrir }: { tableros: Tablero[]; onAbrir: (tablero: Tablero) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={DashboardSquare01Icon} size={16} aria-hidden="true" />
        Tus tableros
        <Text as="span" variant="muted" size="sm" className="tabular-nums">
          {tableros.length}
        </Text>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Los que guardaste se actualizan todos los días a las 7:00 a. m.</DropdownMenuLabel>
          {tableros.length ? (
            tableros.map((tablero) => (
              <DropdownMenuItem key={tablero.id} onClick={() => onAbrir(tablero)} className="flex-col items-start gap-0.5">
                <Text as="span" size="sm" weight="medium" className="line-clamp-2">
                  {tablero.titulo}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  Guardado {tablero.guardado === 'hoy' ? 'hoy' : `el ${tablero.guardado}`}
                </Text>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>Todavía no guardas ninguno. Pídele uno a Orbit y guárdalo.</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// La conversación vacía: el orbe y el saludo que entra palabra por palabra, como en el chat de Orbit.
function Inicio() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
      <span className={greet.orb}>
        <Orb className="size-14" />
      </span>
      <Heading level={2} className="text-balance">
        <span className="sr-only">{SALUDO}</span>
        {SALUDO.split(' ').map((palabra, indice, palabras) => (
          <Fragment key={indice}>
            <span aria-hidden="true" className={greet.word} style={{ animationDelay: `${indice * 60}ms` }}>
              {palabra}
            </span>
            {indice < palabras.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </Heading>
      <Text variant="muted" className="text-balance">
        Te respondo con los datos de tu selección y te armo los tableros que necesites.
      </Text>
    </div>
  )
}

export function Component() {
  const hilo = useAgentThread([], { clave: CLAVE })
  const tableros = useTableros()
  const [borrador, setBorrador] = useState('')
  const vacia = !hilo.msgs.length && !hilo.thinking

  // Mientras Orbit piensa o escribe, el botón de enviar es «Detener» (16 oct, Nicolás: el «Detener» suelto «queda fuera»).
  const [escribiendo, setEscribiendo] = useState<ReadonlySet<number>>(() => new Set())
  const [senalDetener, setSenalDetener] = useState(0)
  const avisarEscritura = useCallback(
    (id: number, si: boolean) =>
      setEscribiendo((antes) => {
        if (antes.has(id) === si) return antes
        const ahora = new Set(antes)
        if (si) ahora.add(id)
        else ahora.delete(id)
        return ahora
      }),
    [],
  )
  const respondiendo = hilo.thinking || escribiendo.size > 0
  const detener = () => {
    if (hilo.thinking) hilo.detener()
    setSenalDetener((antes) => antes + 1)
  }

  const preguntar = (texto: string) => {
    const limpio = texto.trim()
    if (!limpio) return
    hilo.ask(limpio, () => responder(limpio), 1800)
  }

  const rehacer = (pedidoId: number, pedido: string) => hilo.rehacerDesde(pedidoId, pedido, () => responder(pedido), 1800)

  const enviar = () => {
    if (respondiendo) return
    preguntar(borrador)
    setBorrador('')
  }

  const abrir = (tablero: Tablero) => hilo.push('agent', abrirTablero(tablero))

  const empezarDeNuevo = () => {
    const deshacer = hilo.nueva()
    olvidar()
    notifyAction('Empezaste una conversación nueva', 'La anterior se puede recuperar mientras sigas aquí.', { label: 'Deshacer', onClick: deshacer }, 'info')
  }

  // Lo nuevo se ve sin bajar a mano: el pedido, «Razonando…» y el comienzo de la respuesta.
  useEffect(() => {
    if (!vacia) document.getElementById('fin-de-la-conversacion')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [hilo.scrollKey, vacia])

  return (
    // Con «reducir movimiento» en el sistema, las animaciones de Selección se quedan quietas.
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={300}>
        <Conversacion.Provider value={{ preguntar, rehacer, senalDetener, avisarEscritura }}>
          {/* Toda la altura bajo el header, como el chat de Orbit: la conversación baja en su zona y la caja de escribir
              queda fija debajo (se cancela el aire de 24 px del marco y se vuelve a poner dentro). */}
          <div className="-m-6 flex h-[calc(100%+3rem)] min-h-0 flex-1 flex-col">
            {/* Sin cabecera visible: el título queda para el lector de pantalla y la miga de pan ya dice dónde estás. */}
            <Heading level={1} className="sr-only">
              Orbit Data
            </Heading>

            <ScrollArea className="min-h-0 flex-1">
              <div className="flex min-h-full flex-col px-6 pt-6">
                <PageShell>
                  {/* La columna del chat de Orbit: 768 px, lo mismo que la caja de escribir, con 32 px de margen a cada lado
                      para los mensajes. Lo que Orbit arma llega a sus bordes (ver `Generado`). */}
                  <div
                    data-ancho-chat=""
                    role="log"
                    aria-label="Conversación con Orbit"
                    aria-relevant="additions"
                    className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-8 pb-6 ${vacia ? 'justify-center' : ''}`}
                  >
                      {vacia ? (
                        <Inicio />
                      ) : (
                        <AgentThread
                          msgs={hilo.msgs}
                          thinking={hilo.thinking}
                          thinkingLabel="Leyendo tus datos de Selección"
                          clave={hilo.clave}
                          onEditar={rehacer}
                        />
                      )}
                      <div id="fin-de-la-conversacion" className="scroll-mb-6" />
                  </div>
                </PageShell>
              </div>
            </ScrollArea>

            {/* La caja de escribir, fija abajo en la columna del chat de Orbit. Tus tableros y empezar otra conversación
                van dentro, en su fila de abajo. */}
            <div className="shrink-0 px-6 pt-2 pb-5">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
                <div className="flex flex-col gap-2 rounded-[1.75rem] bg-muted p-2">
                  {vacia ? (
                    <div className="flex flex-wrap gap-2 px-1 pt-1">
                      {SUGERENCIAS.map((sugerencia) => (
                        <Button key={sugerencia} variant="outline" size="sm" onClick={() => preguntar(sugerencia)}>
                          {sugerencia}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  <Composer
                    value={borrador}
                    onChange={setBorrador}
                    onSend={enviar}
                    placeholder="Pregúntale a Orbit por tus vacantes y candidatos, o pídele un tablero"
                    onVoice={() => undefined}
                    voice={false}
                    attach={false}
                    onStop={respondiendo ? detener : undefined}
                    footerStart={
                      <div className="flex items-center gap-1.5">
                        <TusTableros tableros={tableros} onAbrir={abrir} />
                        {vacia ? null : (
                          <Button variant="outline" size="sm" onClick={empezarDeNuevo}>
                            <HugeiconsIcon icon={BubbleChatAddIcon} size={16} aria-hidden="true" />
                            Nueva conversación
                          </Button>
                        )}
                      </div>
                    }
                  />
                </div>
                <Text as="p" variant="muted" size="xs" className="text-center">
                  Orbit puede equivocarse. Revisa las cifras importantes antes de decidir.
                </Text>
              </div>
            </div>
          </div>
        </Conversacion.Provider>
      </TooltipProvider>
    </MotionConfig>
  )
}

Component.displayName = 'AdminSeleccionOrbitDataPage'
