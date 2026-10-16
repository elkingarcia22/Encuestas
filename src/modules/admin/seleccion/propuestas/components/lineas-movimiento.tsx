import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, BubbleChatIcon } from '@hugeicons/core-free-icons'
import { FramePanel, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import type { Candidatura, EtapaVacante } from '../datos'
import { entrevistaDe, ultimoCambio, type MarcaCambio, type Movimiento } from '../movimientos'

const TONO: Record<MarcaCambio['tono'], 'warning-light' | 'info-light' | 'secondary'> = {
  aviso: 'warning-light',
  info: 'info-light',
  neutro: 'secondary',
}

// Dos renglones del bloque «Dónde va» de la ficha, iguales en las tres exploraciones:
// - el último cambio de etapa de la sesión («Llegó hoy a las 8:12 a. m. desde Evaluación CV · la moviste tú»), con lo
//   que pasó y el comentario (el rastro completo está en la pestaña «Etapas»);
// - cómo va su entrevista con la IA si está en una y no la ha terminado, porque moverla la cancela.
export function LineasMovimiento({
  candidatura,
  etapas,
  movimientos,
}: {
  candidatura: Candidatura
  etapas: EtapaVacante[]
  movimientos: Movimiento[]
}) {
  const cambio = ultimoCambio(movimientos, etapas)
  const etapa = etapas.find((una) => una.id === candidatura.etapa)
  const entrevista = etapa ? entrevistaDe(candidatura, etapa, etapas, movimientos) : null
  return (
    <>
      {cambio ? (
        <FramePanel className="flex items-start gap-2.5 py-3!">
          <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex min-w-0 flex-col gap-1.5">
            <Text as="span" size="sm">
              {cambio.texto}
            </Text>
            {cambio.marcas.length ? (
              <span className="flex flex-wrap gap-1.5">
                {cambio.marcas.map((marca) => (
                  <Badge key={marca.texto} variant={TONO[marca.tono]}>
                    {marca.texto}
                  </Badge>
                ))}
              </span>
            ) : null}
            {cambio.comentario ? (
              <Text as="span" variant="muted" size="sm" className="flex items-start gap-1.5">
                <HugeiconsIcon icon={BubbleChatIcon} size={14} className="mt-0.5 shrink-0" aria-hidden />«{cambio.comentario}»
              </Text>
            ) : null}
          </span>
        </FramePanel>
      ) : null}
      {entrevista?.tipo === 'a-medias' ? (
        <FramePanel className="flex items-center gap-2.5 py-3!">
          <IconoIA />
          <Text as="span" size="sm">
            Va a medias en la entrevista con {etapa?.titulo}: respondió {entrevista.respondidas} de {entrevista.total} preguntas.
          </Text>
        </FramePanel>
      ) : entrevista?.tipo === 'sin-abrir' && !candidatura.candidato.accion ? (
        <FramePanel className="flex items-center gap-2.5 py-3!">
          <IconoIA />
          <Text as="span" size="sm">
            Le llegó la invitación a {etapa?.titulo}; todavía no la abre.
          </Text>
        </FramePanel>
      ) : null}
    </>
  )
}
