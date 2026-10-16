import { useState } from 'react'
import { Delete02Icon, Layers01Icon } from '@hugeicons/core-free-icons'
import { Button, cn } from '@ubits/flux-ui'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { AgentNote, AgentThinking, ContextPanel, UndoRow, UserBubble } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { PILL, PILL_XS } from '@/modules/design-system/agente-contextual/components/agent-styles'
import styles from '@/modules/design-system/agente-contextual/components/agent.module.css'
import { useConversacion, type Sesion } from './use-conversacion'

// El agente que crea la encuesta, acoplado a la derecha del constructor (como en la vacante). Es el mismo panel del resto
// del producto (ContextPanel): cabecera con el orbe, franja «Contexto:», el hilo y la caja de escribir. Mientras crea,
// cuenta en el hilo qué va haciendo y la encuesta crece a la izquierda. Solo las opciones del último mensaje siguen
// activas: una de hace tres turnos contesta una pregunta que ya pasó.

type Props = Sesion & { nombreEncuesta: string; onClose: () => void }

export function PanelCrearConIa({ nombreEncuesta, onClose, ...sesion }: Props) {
  const { mensajes, fase, enviar, elegir, hayDeLaIa, nombresDeLaIa, confirmarDescarte, setConfirmarDescarte, descartar } = useConversacion(sesion)
  const [deshechos, setDeshechos] = useState<ReadonlySet<number>>(() => new Set())
  const ultimo = mensajes[mensajes.length - 1]

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">{nombreEncuesta.trim() || 'Encuesta sin título'}</span> · secciones y preguntas
        </>
      }
      contextIcon={Layers01Icon}
      onClose={onClose}
      placeholder={fase === 'creando' ? 'Creando la encuesta…' : fase === 'lista' ? 'Pide un ajuste: «quita Bienestar»…' : 'Escribe lo que quieres medir…'}
      onSend={enviar}
      scrollKey={`${mensajes.length}-${fase}`}
    >
      {mensajes.map((mensaje) =>
        mensaje.rol === 'persona' ? (
          <UserBubble key={mensaje.id} className={cn('mt-4', styles.msgIn)}>
            {mensaje.texto}
          </UserBubble>
        ) : (
          <div key={mensaje.id} className={cn('mt-4 flex flex-col gap-3', styles.msgIn)}>
            <AgentNote>{mensaje.texto}</AgentNote>
            {mensaje.opciones ? (
              <div className="flex flex-wrap gap-1.5 ps-8">
                {mensaje.opciones.map((opcion) => (
                  <Button key={opcion.value} variant="outline" className={PILL_XS} disabled={mensaje !== ultimo || fase === 'creando'} onClick={() => elegir(opcion)}>
                    {opcion.label}
                  </Button>
                ))}
              </div>
            ) : null}
            {/* Quitar una sección por chat va directo, con «Deshacer» (regla «preguntar-antes»: un cambio simple que se deshace). */}
            {mensaje.deshacer && !deshechos.has(mensaje.id) ? (
              <div className="ps-8">
                <UndoRow
                  onUndo={() => {
                    mensaje.deshacer?.hacer()
                    setDeshechos((previos) => new Set([...previos, mensaje.id]))
                  }}
                >
                  {mensaje.deshacer.texto}
                </UndoRow>
              </div>
            ) : null}
          </div>
        ),
      )}

      {fase === 'creando' ? <AgentThinking className={cn('mt-4', styles.msgIn)} label="Creando las secciones y sus preguntas…" /> : null}

      {/* Lo que crea la IA queda en la encuesta desde el principio: no hay «quedarse con la propuesta». Lo único que se
          ofrece es echarlo atrás entero, y eso siempre pregunta. */}
      {fase !== 'creando' && hayDeLaIa ? (
        <div className={cn('mt-4 flex flex-wrap gap-2 ps-8', styles.msgIn)}>
          <Button variant="outline" className={PILL} onClick={() => setConfirmarDescarte(true)}>
            Descartar lo que hizo la IA
          </Button>
        </div>
      ) : null}

      <DialogoConfirmar
        abierto={confirmarDescarte}
        onAbiertoChange={(abierto) => (abierto ? undefined : setConfirmarDescarte(false))}
        icono={Delete02Icon}
        titulo="¿Descartar lo que hizo la IA?"
        descripcion={`${nombresDeLaIa} ${nombresDeLaIa.includes(' y ') || nombresDeLaIa.startsWith('Las ') ? 'salen' : 'sale'} de la encuesta, también con lo que les cambiaste a mano. Esta acción no se puede deshacer.`}
        cancelar="Volver"
        accion="Descartar"
        destructiva
        onConfirmar={descartar}
      />
    </ContextPanel>
  )
}
