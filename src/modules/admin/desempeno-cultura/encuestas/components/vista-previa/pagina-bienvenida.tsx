import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Calendar03Icon, CheckListIcon, Clock01Icon, Layers01Icon, SquareLock02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import { Badge, Frame, FrameHeader, FramePanel, FrameTitle, Heading, IconTile, Text } from '@ubits/flux-ui'
import { formatPreviewDate, type PreviewOutlineRow, type PreviewPage, type PreviewSummary } from '../../modelo/previewModel'
import { SURVEY_KIND_LABELS, SURVEY_VISIBILITY_LABELS, type SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { enBlanco } from '../../modelo/textoPagina'
import { TEXTO_POR_TONO } from '../tonos'
import { Contenido, type AvancePorPagina } from './contenido'
import { TextoPagina } from './texto-pagina'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Lo primero que ve quien responde: qué es la encuesta, cuánto le cuesta en tiempo y en privacidad,
// qué abarca y lo que el autor quiso decir antes de empezar. No es una página de preguntas y no
// se parece a una: arriba la identidad, sin contenedor y sobre el fondo azul del modal; debajo los
// datos en una tira y al final el mensaje junto al índice, cada bloque en un marco gris con su
// panel blanco, como las tarjetas del Inicio. Los cuatro datos llevan el icono en azul: son
// información, no estados, así que ninguno se pinta de verde o amarillo.

type Props = {
  borrador: SurveyDraft
  resumen: PreviewSummary
  paginas: readonly PreviewPage[]
  indice: readonly PreviewOutlineRow[]
  avance: AvancePorPagina
  onIr: (idPagina: string) => void
}

function Dato({ icono, valor, etiqueta }: { icono: IconSvgElement; valor: string; etiqueta: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 lg:px-4 lg:first:ps-0 lg:last:pe-0">
      <IconTile variant="soft" size="sm" className={TEXTO_POR_TONO.brand}>
        <HugeiconsIcon icon={icono} aria-hidden="true" />
      </IconTile>
      <div className="flex min-w-0 flex-col">
        <TextoCompleto texto={valor}><Text as="span" size="lg" weight="bold" className="truncate">
          {valor}
        </Text></TextoCompleto>
        <Text as="span" size="xs" variant="muted">
          {etiqueta}
        </Text>
      </div>
    </div>
  )
}

export function PaginaBienvenida({ borrador, resumen, paginas, indice, avance, onIr }: Props) {
  const anonima = borrador.visibility === 'anonymous'
  const abre = formatPreviewDate(borrador.startDate)
  const cierra = formatPreviewDate(borrador.endDate)
  const conMensaje = !enBlanco(borrador.welcomeDescription)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 px-1 pt-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {borrador.kind ? <Badge variant="primary-light">{SURVEY_KIND_LABELS[borrador.kind]}</Badge> : null}
          <Badge variant="outline">
            <HugeiconsIcon icon={anonima ? SquareLock02Icon : ViewIcon} aria-hidden="true" />
            {SURVEY_VISIBILITY_LABELS[borrador.visibility]}
          </Badge>
        </div>
        <Heading level={2}>{borrador.name.trim() || 'Encuesta sin título'}</Heading>
        {borrador.description.trim() ? <Text variant="lead">{borrador.description}</Text> : null}
        {abre || cierra ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {abre ? (
              <Text as="span" size="sm" variant="muted" className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={14} aria-hidden="true" />
                Abre el {abre}
              </Text>
            ) : null}
            {cierra ? (
              <Text as="span" size="sm" variant="muted" className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={14} aria-hidden="true" />
                Cierra el {cierra}
              </Text>
            ) : null}
          </div>
        ) : null}
      </header>

      <Frame>
        <FramePanel className="grid grid-cols-2 gap-5 divide-border lg:grid-cols-4 lg:gap-0 lg:divide-x">
          <Dato icono={Layers01Icon} valor={String(resumen.rootSections)} etiqueta={resumen.rootSections === 1 ? 'Sección' : 'Secciones'} />
          <Dato icono={CheckListIcon} valor={String(resumen.questionCount)} etiqueta={resumen.questionCount === 1 ? 'Pregunta' : 'Preguntas'} />
          <Dato icono={Clock01Icon} valor={`${resumen.estimatedMinutes} min`} etiqueta="Tiempo estimado" />
          <Dato
            icono={anonima ? SquareLock02Icon : ViewIcon}
            valor={SURVEY_VISIBILITY_LABELS[borrador.visibility]}
            etiqueta={anonima ? `Mínimo ${borrador.anonymityThreshold} respuestas` : 'Respuestas con nombre'}
        />
        </FramePanel>
      </Frame>

      {conMensaje ? (
        <Frame>
          <FrameHeader>
            <FrameTitle>Antes de empezar</FrameTitle>
          </FrameHeader>
          <FramePanel>
            <TextoPagina contenido={borrador.welcomeDescription} />
          </FramePanel>
        </Frame>
      ) : null}

      <Frame>
        <FrameHeader>
          <FrameTitle>Contenido de la encuesta</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <Contenido paginas={paginas} indice={indice} avance={avance} onIr={onIr} />
        </FramePanel>
      </Frame>
    </div>
  )
}
