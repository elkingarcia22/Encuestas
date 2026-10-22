import { useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckListIcon, Clock01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Frame,
  FrameHeader,
  FramePanel,
  Field,
  FieldError,
  FieldLabel,
  Heading,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { toPreviewQuestion, type PreviewPage } from '../../modelo/previewModel'
import { supportsDepthWhy, supportsFollowUps } from '../../modelo/questionCatalog'
import { MINUTES_PER_QUESTION, depthLabel, type SurveyQuestion } from '../../modelo/surveyBuilderTypes'
import { textoPlano } from '../../modelo/textoPagina'
import { CampoRespuesta, type Respuesta } from './campo-respuesta'

// Una página de preguntas: una subsección o el bloque de datos demográficos. Abre con una portada
// que dice qué parte de la encuesta es, dónde está y cuánto toma; debajo, una tarjeta por pregunta.
// Las Likert también van una a una, aunque compartan escala: cada enunciado con su regla completa
// se lee y se contesta mejor que una fila de una tabla con los pasos escritos arriba.

type PaginaDePreguntas = Extract<PreviewPage, { kind: 'section' | 'demographics' }>

type Props = {
  pagina: PaginaDePreguntas
  respuestas: Readonly<Record<string, Respuesta>>
  seguimientos: Readonly<Record<string, string>>
  /** Las obligatorias que quedaron sin responder al pulsar «Continuar». */
  senaladas: ReadonlySet<string>
  onResponder: (id: string, valor: Respuesta) => void
  onSeguimiento: (id: string, valor: string) => void
}

// Qué pregunta de seguimiento le toca a una valoración. Las bandas del NPS son las del producto
// (0-6, 7-8, 9-10); las escalas de cinco pasos se parten igual en tres.
function seguimientoDe(pregunta: SurveyQuestion, valor: Respuesta): string | null {
  // La pregunta de profundidad de una sola línea sale en cuanto hay una respuesta, sea cual sea.
  if (pregunta.depthWhyEnabled && supportsDepthWhy(pregunta)) return respondida(valor) ? (pregunta.depthWhyText ?? '').trim() || 'Cuéntanos por qué elegiste esta respuesta' : null
  const { kind, followUpEnabled, followUps } = pregunta.scale
  if (!followUpEnabled || !supportsFollowUps(kind) || typeof valor !== 'string' || valor === '') return null
  const puntos = Number(valor)
  if (Number.isNaN(puntos)) return null
  const banda =
    kind === 'nps' ? (puntos <= 6 ? 'detractors' : puntos <= 8 ? 'neutrals' : 'promoters') : puntos <= 2 ? 'detractors' : puntos === 3 ? 'neutrals' : 'promoters'
  return followUps[banda].trim() || 'Cuéntanos por qué elegiste esta respuesta'
}

const respondida = (valor: Respuesta) => (Array.isArray(valor) ? valor.length > 0 : Boolean(valor))

// El encabezado de la página vive sobre el marco gris, sin panel blanco propio: es el título de un
// bloque, no una pregunta. Más pequeño que el enunciado y con los datos en una línea de texto
// apagado, deja que los paneles blancos de abajo sean lo primero que se ve.
function Portada({ pagina, preguntas }: { pagina: PaginaDePreguntas; preguntas: number }) {
  const minutos = Math.max(1, Math.round(preguntas * MINUTES_PER_QUESTION))
  return (
    <FrameHeader className="gap-2">
      {pagina.kind === 'section' ? (
        <Breadcrumb aria-label="Ubicación en la encuesta">
          <BreadcrumbList>
            {pagina.trail.map((miga) => (
              <BreadcrumbItem key={miga.numbering}>
                <Text as="span" size="xs" variant="muted">
                  {miga.numbering}. {miga.title}
                </Text>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Badge variant="primary-light" size="sm">
                  {depthLabel(pagina.depth)} {pagina.numbering}
                </Badge>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : (
        <Badge variant="primary-light" size="sm" className="w-fit">
          <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
          Sobre ti
        </Badge>
      )}
      <Heading level={4}>{pagina.title}</Heading>
      {pagina.description.trim() ? (
        <Text size="sm" variant="muted">
          {pagina.description}
        </Text>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Text as="span" size="xs" variant="muted" className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={CheckListIcon} size={14} aria-hidden="true" />
          {preguntas} {preguntas === 1 ? 'pregunta' : 'preguntas'}
        </Text>
        <Text as="span" size="xs" variant="muted" className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={Clock01Icon} size={14} aria-hidden="true" />
          {minutos} min aprox.
        </Text>
      </div>
    </FrameHeader>
  )
}

function TarjetaPregunta({
  pregunta,
  numero,
  valor,
  onCambio,
  seguimiento,
  onSeguimiento,
  falta,
}: {
  pregunta: SurveyQuestion
  numero: number
  valor: Respuesta
  onCambio: (valor: Respuesta) => void
  seguimiento: string
  onSeguimiento: (valor: string) => void
  falta: boolean
}) {
  const enunciado = textoPlano(pregunta.statement)
  const pedido = seguimientoDe(pregunta, valor)
  // El error se va en cuanto se responde: no hace falta volver a pulsar «Continuar» para que desaparezca.
  const conError = falta && !respondida(valor)
  return (
    <FramePanel id={`pregunta-${pregunta.id}`} className="flex scroll-mt-6 flex-col gap-4">
        <div className="flex items-start gap-3">
          {/* Un círculo de 24 px, la altura de la primera línea del enunciado, para que el número quede centrado con ella. */}
          <Badge variant={respondida(valor) ? 'default' : 'secondary'} radius="full" className="size-6 shrink-0 justify-center px-0 tabular-nums">
            {numero}
          </Badge>
          <div className="flex min-w-0 flex-col gap-0.5">
            <Text as="p" weight="semibold">
              {enunciado || 'Pregunta sin enunciado'}
            </Text>
            {pregunta.required ? null : (
              <Text as="span" size="xs" variant="muted">
                Opcional
              </Text>
            )}
          </div>
        </div>
        <CampoRespuesta pregunta={pregunta} valor={valor} onCambio={onCambio} />
        {/* Sin envolver el control en un campo inválido: las opciones no se tiñen de rojo, solo aparece el error debajo. */}
        {conError ? <FieldError>Esta pregunta es obligatoria. Respóndela para continuar.</FieldError> : null}
        {pedido ? (
          <Field>
            <FieldLabel htmlFor={`seguimiento-${pregunta.id}`}>{pedido}</FieldLabel>
            <Textarea id={`seguimiento-${pregunta.id}`} rows={3} placeholder="Escribe tu respuesta" value={seguimiento} onChange={(evento) => onSeguimiento(evento.target.value)} />
          </Field>
        ) : null}
    </FramePanel>
  )
}

export function PaginaPreguntas({ pagina, respuestas, seguimientos, senaladas, onResponder, onSeguimiento }: Props) {
  const preguntas = useMemo(() => (pagina.kind === 'section' ? pagina.questions : pagina.fields.map(toPreviewQuestion)), [pagina])

  return (
    <Frame className="gap-3">
      <Portada pagina={pagina} preguntas={preguntas.length} />
      {preguntas.map((pregunta, indice) => (
        <TarjetaPregunta
          key={pregunta.id}
          pregunta={pregunta}
          numero={indice + 1}
          valor={respuestas[pregunta.id] ?? null}
          onCambio={(valor) => onResponder(pregunta.id, valor)}
          seguimiento={seguimientos[pregunta.id] ?? ''}
          onSeguimiento={(valor) => onSeguimiento(pregunta.id, valor)}
          falta={senaladas.has(pregunta.id)}
        />
      ))}
    </Frame>
  )
}
