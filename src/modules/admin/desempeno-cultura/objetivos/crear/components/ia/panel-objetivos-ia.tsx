import { Target02Icon } from '@hugeicons/core-free-icons'
import { Button, cn } from '@ubits/flux-ui'
import { AgentNote, AgentThinking, ContextPanel, UserBubble } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { PILL, PILL_XS } from '@/modules/design-system/agente-contextual/components/agent-styles'
import styles from '@/modules/design-system/agente-contextual/components/agent.module.css'
import { Hint } from '@/shared/components/Hint'
import type { CicloDraft } from '../../../modelo/constructor/cicloBuilderTypes'
import { TITULO_POR_ALCANCE } from './conversacion-objetivos'
import type { PedidoIa } from './pedido'
import { useConversacionObjetivos } from './use-conversacion-objetivos'

// El agente que propone objetivos, acoplado a la derecha del constructor. Es el mismo panel que el de Encuestas
// (ContextPanel): cabecera con el orbe, franja «Contexto:» con qué se crea y para quién, el hilo y la caja de escribir.
// Las opciones de cada pregunta van como pastillas bajo el mensaje y solo las del último siguen activas: una de hace tres
// turnos contesta una pregunta que ya pasó. Lo que en el prototipo era la línea gris de cada opción («Lo habitual: cubre
// el ciclo sin dispersarlo») queda como texto al pasar el cursor, para no convertir las pastillas en filas.

type Props = {
  borrador: CicloDraft
  pedido: PedidoIa
  /** Por si hace falta tocar el borrador; la propuesta entra y sale por los callbacks del pedido. */
  onCambio: (cambio: Partial<CicloDraft>) => void
  onClose: () => void
}

export function PanelObjetivosIa({ borrador, pedido, onClose }: Props) {
  const { mensajes, fase, etapa, sinCupo, enviar, elegir, conservar, otraPropuesta, modificar, descartar } = useConversacionObjetivos(borrador, pedido, onClose)
  const ultimo = mensajes[mensajes.length - 1]
  const conOpciones = ultimo?.rol === 'agente' && Boolean(ultimo.opciones?.length) && fase !== 'generando'
  // Para la empresa, el contexto es el ciclo; para un grupo o una persona, a quién se le escribe.
  const quien = pedido.alcance === 'empresa' ? borrador.name.trim() || 'Ciclo sin título' : pedido.audiencia?.trim()

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">{TITULO_POR_ALCANCE[pedido.alcance]}</span>
          {quien ? ` · ${quien}` : null}
        </>
      }
      contextIcon={Target02Icon}
      onClose={onClose}
      placeholder={conOpciones ? 'Elige una opción o escribe tu respuesta…' : 'Escribe tu mensaje…'}
      onSend={enviar}
      scrollKey={`${mensajes.length}-${fase}-${etapa ?? ''}`}
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
                {mensaje.opciones.map((opcion) => {
                  const boton = (
                    <Button
                      key={opcion.value}
                      variant="outline"
                      className={PILL_XS}
                      disabled={mensaje !== ultimo || fase === 'generando' || sinCupo}
                      onClick={() => elegir(opcion)}
                    >
                      {opcion.label}
                    </Button>
                  )
                  return opcion.description ? (
                    <Hint key={opcion.value} label={opcion.description}>
                      {boton}
                    </Hint>
                  ) : (
                    boton
                  )
                })}
              </div>
            ) : null}
          </div>
        ),
      )}

      {fase === 'generando' ? <AgentThinking className={cn('mt-4', styles.msgIn)} label={etapa ?? 'Leyendo tu contexto…'} /> : null}

      {fase === 'revisando' ? (
        <div className={cn('mt-4 flex flex-wrap gap-2 ps-8', styles.msgIn)}>
          <Button className={PILL} onClick={conservar}>
            Conservar todos
          </Button>
          <Button variant="outline" className={PILL} onClick={otraPropuesta}>
            Otra propuesta
          </Button>
          <Button variant="outline" className={PILL} onClick={modificar}>
            Modificar
          </Button>
          <Button variant="destructive" className={PILL} onClick={descartar}>
            Descartar
          </Button>
        </div>
      ) : null}
    </ContextPanel>
  )
}
