import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, CircleIcon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  Button,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  MessageScrollerItem,
  Progress,
  Spinner,
  Text,
} from '@ubits/flux-ui'
import { UserBubble } from '@/modules/design-system/agente-contextual/components/agent-kit'

import { Compositor } from '../components/compositor'
import type { Paso } from '../components/data'
import { useSuite } from '../components/estado'
import { MensajeAgente } from '../components/piezas'
import { MensajesHilo, VistaChat } from '../components/vista-chat'

// Caso 05 del concepto: «Política de vacaciones». El agente separa dos acciones con efecto real,
// deja listo lo que no tiene riesgo y espera tu confirmación para publicar. La actividad del
// agente va en el panel de la derecha (ver components/actividad.tsx).

function DetallePaso({ paso }: { paso: Paso }) {
  const suite = useSuite()
  if (paso.borrador) {
    return (
      <Button variant="link" size="xs" onClick={suite.verBorrador}>
        {paso.detalle}
      </Button>
    )
  }
  if (paso.estado === 'ahora' && !suite.publicado) {
    return (
      <Button variant="link" size="xs" onClick={suite.publicarAviso}>
        {paso.detalle}
      </Button>
    )
  }
  return (
    <span className="flex items-center gap-2">
      {paso.estado === 'ahora' ? <Spinner /> : null}
      <Text as="span" variant="muted" size="xs">
        {paso.detalle}
      </Text>
    </span>
  )
}

export function Component() {
  const suite = useSuite()
  const [borrador, setBorrador] = useState('')
  const hechos = suite.pasos.filter((paso) => paso.estado === 'hecho').length
  const resumen = [
    { etiqueta: 'Destinatarios', valor: '312 colaboradores' },
    { etiqueta: 'Correo', valor: suite.publicado ? 'Enviado a 309 personas' : 'Se envía al publicar' },
    { etiqueta: 'Deshacer', valor: 'No disponible' },
  ]

  return (
    <VistaChat
      seguir={(suite.chats.vacaciones?.length ?? 0) * 2 + (suite.pensando === 'vacaciones' ? 1 : 0)}
      compositor={
        <Compositor
          valor={borrador}
          onValor={setBorrador}
          onEnviar={(texto) => suite.preguntar('vacaciones', texto)}
          placeholder="Escribe un ajuste antes de publicar"
          aviso={false}
        />
      }
    >
      <MessageScrollerItem>
        <UserBubble>
          Publica el aviso de la nueva política de vacaciones para la sede Bogotá y asigna el curso de la política.
        </UserBubble>
      </MessageScrollerItem>
      <MessageScrollerItem>
          <MensajeAgente>
            <Text>
              Son dos acciones con efecto real, así que las separé. Ya tengo la audiencia y el borrador; el envío del correo espera tu
              confirmación.
            </Text>

            <Frame>
              <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <FrameTitle>Plan de {suite.pasos.length} pasos</FrameTitle>
                <FrameDescription>
                  {hechos} terminados · {suite.publicado ? '0 pendientes' : '1 requiere revisión'}
                </FrameDescription>
              </FrameHeader>
              <FramePanel className="flex flex-col gap-3">
                <ItemGroup>
                  {suite.pasos.map((paso) => (
                    <Item key={paso.titulo} size="sm" variant={paso.estado === 'ahora' ? 'muted' : 'default'}>
                      <ItemMedia variant="icon">
                        <HugeiconsIcon
                          icon={paso.estado === 'hecho' ? CheckmarkCircle02Icon : CircleIcon}
                          aria-hidden="true"
                          className={paso.estado === 'espera' ? 'text-muted-foreground' : undefined}
                        />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle>
                          <span className="sr-only">{paso.estado === 'hecho' ? 'Terminado: ' : paso.estado === 'ahora' ? 'En curso: ' : 'En espera: '}</span>
                          {paso.titulo}
                        </ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <DetallePaso paso={paso} />
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
                <Progress value={(hechos / suite.pasos.length) * 100} aria-label={`${hechos} de ${suite.pasos.length} pasos terminados`} />
              </FramePanel>
            </Frame>

            <Frame>
              <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
                <FrameTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" className="size-4" />
                  Resumen de la acción
                </FrameTitle>
              </FrameHeader>
              <FramePanel className="divide-border grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x">
                {resumen.map((dato) => (
                  <div key={dato.etiqueta} className="flex flex-col gap-1 sm:px-4 sm:first:ps-0 sm:last:pe-0">
                    <Text as="span" variant="muted" size="xs">
                      {dato.etiqueta}
                    </Text>
                    <Text as="span" size="lg" weight="medium">
                      {dato.valor}
                    </Text>
                  </div>
                ))}
              </FramePanel>
              <FrameFooter className="flex flex-row flex-wrap items-center justify-between gap-3">
                <Text as="span" variant="muted" size="sm">
                  {suite.publicado ? 'Publicado a las 9:43 · correo enviado a 309 personas' : 'Puedes revisar la lista antes. Publicar no se puede deshacer.'}
                </Text>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={suite.revisarAudienciaAviso}>
                    Revisar audiencia
                  </Button>
                  <Button size="sm" disabled={suite.publicado} onClick={suite.publicarAviso}>
                    {suite.publicado ? 'Publicado' : 'Publicar y continuar'}
                  </Button>
                </div>
              </FrameFooter>
            </Frame>

            <Alert>
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              {/* Un solo párrafo: la descripción de la alerta pone cada hijo en su propia fila. */}
              <AlertDescription>
                <p>
                  De 312 personas, <strong>3 no tienen correo válido</strong>. El resto sí recibe el aviso.
                </p>
              </AlertDescription>
              <AlertAction>
                <Button variant="link" size="xs" onClick={suite.verSinCorreo}>
                  Ver las 3
                </Button>
              </AlertAction>
            </Alert>
          </MensajeAgente>
      </MessageScrollerItem>

      <MensajesHilo mensajes={suite.chats.vacaciones ?? []} pensando={suite.pensando === 'vacaciones'} />
    </VistaChat>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiAprobacion'
