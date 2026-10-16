import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon } from '@hugeicons/core-free-icons'
import { Badge, Bubble, BubbleContent, Button, Message, MessageAvatar, MessageContent, MessageGroup, MessageHeader, Text } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { notify } from '@/shared/components/notify'
import { Orb } from '@/shared/components/Orb'
import type { Turno } from './expediente-data'

// Transcripción de una entrevista con IA (Serena o Roleplay), en panel lateral: es lo profundo de la
// evaluación y no le quita alto a la pestaña. Las frases que el control automático marcó llevan su aviso.
export function DrawerTranscripcion({
  open,
  onOpenChange,
  kicker,
  descripcion,
  agente,
  candidato,
  turnos,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  kicker: string
  descripcion: string
  agente: string
  candidato: string
  turnos: Turno[]
}) {
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      ai
      kicker={kicker}
      title="Transcripción"
      description={descripcion}
      footer={
        <Button variant="outline" onClick={() => notify('Descargando transcripción', `${kicker} · ${candidato}`)}>
          <HugeiconsIcon icon={Download04Icon} />
          Descargar transcripción
        </Button>
      }
    >
      <MessageGroup className="gap-5">
        {turnos.map((turno) =>
          turno.quien === 'agente' ? (
            <Message key={turno.momento} className="gap-3">
              <MessageAvatar>
                <Orb className="size-7" />
              </MessageAvatar>
              <MessageContent className="gap-1">
                <MessageHeader className="gap-2">
                  <Text as="span" size="sm" weight="medium">
                    {agente}
                  </Text>
                  <Text as="span" variant="muted" size="xs" className="tabular-nums">
                    {turno.momento}
                  </Text>
                </MessageHeader>
                <Bubble variant="secondary">
                  <BubbleContent>{turno.texto}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          ) : (
            <Message key={turno.momento} align="end">
              <MessageContent className="items-end gap-1">
                <MessageHeader className="gap-2">
                  {turno.alerta ? (
                    <Badge variant="warning-outline">
                      {turno.alerta}
                    </Badge>
                  ) : null}
                  <Text as="span" variant="muted" size="xs" className="tabular-nums">
                    {turno.momento}
                  </Text>
                  <Text as="span" size="sm" weight="medium">
                    {candidato}
                  </Text>
                </MessageHeader>
                <Bubble align="end">
                  <BubbleContent>{turno.texto}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          ),
        )}
      </MessageGroup>
    </DrawerShell>
  )
}
