import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowReloadHorizontalIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Button, Frame, FramePanel, Heading, IconTile, Separator, Text } from '@ubits/flux-ui'
import type { PreviewSummary } from '../../modelo/previewModel'
import { enBlanco } from '../../modelo/textoPagina'
import { TEXTO_POR_TONO } from '../tonos'
import { LluviaConfeti } from '@/shared/components/Confeti'
import { TextoPagina } from './texto-pagina'

// La última página. Aquí no se pregunta nada, así que nada compite con el mensaje. Los contadores
// de abajo dicen lo que se respondió en esta prueba: es también la forma más clara de recordar que
// esto fue un ensayo. Al llegar cae confeti: se terminó la encuesta y se celebra.

type Props = { mensaje: string; resumen: PreviewSummary; respondidas: number; onReiniciar: () => void }

function Cifra({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 px-4 py-1 text-left">
      <Text as="span" weight="bold" className="tabular-nums">
        {valor}
      </Text>
      <Text as="span" size="xs" variant="muted">
        {etiqueta}
      </Text>
    </div>
  )
}

export function PaginaCierre({ mensaje, resumen, respondidas, onReiniciar }: Props) {
  const total = resumen.questionCount + resumen.demographicCount
  return (
    <div className="flex w-full flex-col items-center gap-6 py-10 text-center">
      {/* El confeti del marco, el mismo de toda la plataforma: cae sobre toda la pantalla y se apaga solo. */}
      <LluviaConfeti />
      <IconTile variant="soft" size="xl" className={TEXTO_POR_TONO.positive}>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
      </IconTile>
      <div className="flex flex-col gap-2">
        <Heading level={2}>Respuestas enviadas</Heading>
        <Text variant="muted">Esto es lo que verá el participante al terminar.</Text>
      </div>
      {enBlanco(mensaje) ? null : (
        <Frame className="w-full text-left">
          <FramePanel>
            <TextoPagina contenido={mensaje} />
          </FramePanel>
        </Frame>
      )}
      <Frame className="w-full">
        <FramePanel className="flex items-stretch">
          <Cifra valor={`${respondidas}/${total}`} etiqueta="Respondidas en esta prueba" />
          <Separator orientation="vertical" />
          <Cifra valor={String(resumen.rootSections)} etiqueta={resumen.rootSections === 1 ? 'Sección' : 'Secciones'} />
          <Separator orientation="vertical" />
          <Cifra valor={`${resumen.estimatedMinutes} min`} etiqueta="Tiempo estimado" />
        </FramePanel>
      </Frame>
      <Button variant="outline" onClick={onReiniciar}>
        <HugeiconsIcon icon={ArrowReloadHorizontalIcon} aria-hidden="true" />
        Volver a empezar la vista previa
      </Button>
    </div>
  )
}
