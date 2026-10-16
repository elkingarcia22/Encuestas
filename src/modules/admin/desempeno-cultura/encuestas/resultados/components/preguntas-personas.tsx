import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Cancel01Icon, CheckListIcon, Search01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardHeader,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { useCargaProgresiva } from '@/modules/design-system/templates/admin-compartido/lista'
import { BotonCargarMas } from '../../components/tabla-piezas'
import { FAVORABILITY_BANDS, formatScore, tierForScore } from '../../modelo/favorabilityScale'
import {
  buildRespondentAnswers,
  effectiveSentiment,
  respondentsForTally,
  type AnswerMatrix,
  type OpenComment,
  type QuestionBreakdown,
  type Respondent,
  type RespondentAnswer,
  type Sentiment,
} from '../../modelo/questionResponses'
import type { SectionResult } from '../../modelo/surveyResults'
import { ArbolResultados } from './arbol-resultados'
import { INSIGNIA_POR_TONO, numero } from './escala'
import { InsigniaSentimiento } from './sentimiento'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Preguntas › Por persona: una fila por participante, con su promedio, cuántas respondió y cuándo
// la envió; al elegir una se ve su ficha con todo lo que contestó. En una encuesta anónima la ficha
// sigue siendo legible pero no atribuible: «Participante 1» y ningún demográfico, porque un
// demográfico también identifica.
import { ImagenGlass } from '@/shared/components/ImagenGlass'

export type Acotado = { pregunta: string; opcion: string }

const VARIANTE_TIER = { favorable: 'success-light', neutral: 'warning-light', unfavorable: 'destructive-outline' } as const

function Promedio({ persona }: { persona: Respondent }) {
  if (persona.score === null) return null
  return (
    <Badge variant={VARIANTE_TIER[tierForScore(persona.score).id]} className="tabular-nums">
      {formatScore(persona.score)}
    </Badge>
  )
}

function Respuesta({ respuesta, recuento, sentimiento }: { respuesta: RespondentAnswer | undefined; recuento: QuestionBreakdown | undefined; sentimiento?: Sentiment }) {
  if (!respuesta || respuesta.skipped) {
    return (
      <Text as="span" size="sm" variant="muted">
        Sin responder
      </Text>
    )
 }
  if (respuesta.nsnr) return <Badge variant="secondary">No sabe / No responde</Badge>
  if (respuesta.type === 'open') {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <Text as="p" size="sm">
          «{respuesta.display}»
        </Text>
        {sentimiento ? <InsigniaSentimiento sentimiento={sentimiento} /> : null}
      </div>
    )
 }
  if (respuesta.bandIndex !== null) {
    const banda = FAVORABILITY_BANDS[respuesta.bandIndex]
    return <Badge variant={banda ? INSIGNIA_POR_TONO[banda.tone] : 'outline'}>{respuesta.display}</Badge>
 }
  if (recuento?.scaleKind === 'nps' && respuesta.value !== null) {
    return (
      <Badge variant="outline" className="tabular-nums">
        {respuesta.value} de 10
      </Badge>
    )
 }
  return (
    <div className="flex flex-wrap gap-1.5">
      {respuesta.selected.map((etiqueta) => {
        const marcada = recuento?.screening === true && recuento.tallies.some((opcion) => opcion.label === etiqueta && opcion.flagged)
        return (
          <Badge key={etiqueta} variant={marcada ? 'destructive-outline' : 'outline'}>
            {etiqueta}
          </Badge>
        )
     })}
    </div>
  )
}

function Ficha({
  persona,
  secciones,
  recuentos,
  comentarios,
  correcciones,
  matriz,
}: {
  persona: Respondent
  secciones: readonly SectionResult[]
  recuentos: ReadonlyMap<string, QuestionBreakdown>
  comentarios: readonly OpenComment[]
  correcciones: ReadonlyMap<string, Sentiment>
  matriz: AnswerMatrix
}) {
  const respuestas = useMemo(() => buildRespondentAnswers(persona, recuentos, comentarios, matriz), [persona, recuentos, comentarios, matriz])
  const sentimientoDe = (pregunta: string) => {
    const comentario = comentarios.find((uno) => uno.respondentId === persona.id && uno.questionId === pregunta)
    return comentario ? effectiveSentiment(comentario, correcciones) : undefined
 }
  const datos = [persona.area, persona.leader && `Líder: ${persona.leader}`, persona.country, persona.gender, persona.age].filter(Boolean).join(' · ')

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{persona.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <Text as="p" size="lg" weight="semibold">
              {persona.name}
            </Text>
            <Text as="span" size="sm" variant="muted">
              {persona.anonymous ? 'Encuesta anónima: sin datos que la identifiquen' : [persona.email, datos].filter(Boolean).join(' · ')}
            </Text>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {persona.score !== null ? (
            <div className="flex items-center gap-1.5">
              <Text as="span" size="xs" variant="muted">
                Promedio
              </Text>
              <Promedio persona={persona} />
            </div>
          ) : null}
          <Text as="span" size="sm" className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={CheckListIcon} size={16} aria-hidden="true" />
            {numero(persona.answered)} respondidas
          </Text>
          <Badge variant={persona.status === 'complete' ? 'success-light' : 'warning-light'}>{persona.status === 'complete' ? 'Completada' : 'Parcial'}</Badge>
          <Text as="span" size="sm" variant="muted" className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Calendar03Icon} size={16} aria-hidden="true" />
            Enviada el {persona.submittedLabel}
          </Text>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <ArbolResultados
          sobreGris={false}
          secciones={secciones}
          preguntas={(seccion) => (
            <div className="flex flex-col divide-y">
              {seccion.questions.map((pregunta, indice) => (
                <div key={pregunta.id} className="grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Text as="p" size="sm" weight="medium">
                    <Text as="span" size="xs" variant="muted" className="tabular-nums">
                      {seccion.numbering}.{indice + 1}
                    </Text>{' '}
                    {pregunta.statement || 'Pregunta sin enunciado'}
                  </Text>
                  <Respuesta respuesta={respuestas.get(pregunta.id)} recuento={recuentos.get(pregunta.id)} sentimiento={sentimientoDe(pregunta.id)} />
                </div>
              ))}
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}

type Props = {
  secciones: readonly SectionResult[]
  personas: readonly Respondent[]
  recuentos: ReadonlyMap<string, QuestionBreakdown>
  matriz: AnswerMatrix
  comentarios: readonly OpenComment[]
  correcciones: ReadonlyMap<string, Sentiment>
  acotado: Acotado | null
  /** El filtro de favorabilidad de la cabecera: solo quienes tienen su promedio en esos niveles; vacío, todas. */
  favorabilidad: ReadonlySet<string>
  onQuitarAcotado: () => void
}

export function PreguntasPersonas({ secciones, personas, recuentos, matriz, comentarios, correcciones, acotado, favorabilidad, onQuitarAcotado }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const anonima = personas.some((persona) => persona.anonymous)

  // Del recuento a las personas: quienes eligieron esa opción en esa pregunta.
  const idsAcotados = useMemo(() => (acotado ? new Set(respondentsForTally(matriz, acotado.pregunta, acotado.opcion)) : null), [acotado, matriz])
  const textoAcotado = useMemo(() => {
    if (!acotado || !idsAcotados) return null
    const recuento = recuentos.get(acotado.pregunta)
    const opcion = recuento?.tallies.find((una) => una.id === acotado.opcion)
    return recuento && opcion ? `${numero(idsAcotados.size)} personas respondieron «${opcion.label}» en «${recuento.statement}»` : null
 }, [acotado, idsAcotados, recuentos])


  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return personas.filter(
      (persona) =>
        (!idsAcotados || idsAcotados.has(persona.id)) &&
        (!q || persona.name.toLowerCase().includes(q) || (persona.area?.toLowerCase().includes(q) ?? false)) &&
        (favorabilidad.size === 0 || (persona.score !== null && favorabilidad.has(tierForScore(persona.score).id))),
    )
 }, [personas, idsAcotados, busqueda, favorabilidad])

  const [cargadas, cargarMas] = useCargaProgresiva(lista.length, 20)
  const [elegidaId, setElegidaId] = useState<string | null>(() => personas[0]?.id ?? null)
  // Si la persona elegida sale de la lista (al acotar o filtrar), se elige la primera que queda.
  const elegida = lista.find((persona) => persona.id === elegidaId) ?? lista[0] ?? null

  if (personas.length === 0) {
    return <PrimeraVez icono="glass-profile" titulo="Todavía no hay respuestas individuales" descripcion="Cuando alguien complete la encuesta, sus respuestas se podrán abrir una por una desde aquí." />

 }

  return (
    <div className="flex flex-col gap-4">
      {anonima ? (
        <Alert>
          <HugeiconsIcon icon={SquareLock02Icon} aria-hidden="true" />
          <AlertDescription>
            Encuesta anónima: cada persona aparece como «Participante» y sin datos demográficos. Un demográfico también identifica, así que la ficha se puede leer pero no atribuir.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Frame spacing="sm" className="[--frame-gap:0px] lg:sticky lg:top-4">
          <FrameHeader className="gap-3!">
            <div>
              <FrameTitle>Participantes</FrameTitle>
              <FrameDescription>
                {numero(lista.length)} de {numero(personas.length)}
              </FrameDescription>
            </div>
            <InputGroup className="bg-background">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre o área" aria-label="Buscar participantes" />
            </InputGroup>
            {textoAcotado ? (
              <Alert>
                <AlertDescription className="flex items-start justify-between gap-2">
                  {textoAcotado}
                  <BotonIcono size="icon-xs" aria-label="Ver a todas las personas" onClick={onQuitarAcotado}>
                    <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                  </BotonIcono>
                </AlertDescription>
              </Alert>
            ) : null}
          </FrameHeader>
          <FramePanel className="max-h-[36rem] overflow-y-auto p-1!">
            {lista.length === 0 ? (
              // «Sin resultados» del sistema, con ilustración, lo buscado y el botón para limpiar (decisión 14).
              <SinResultados
                busqueda={busqueda}
                filtrosActivos={acotado ? 1 : 0}
                onLimpiar={() => {
                  setBusqueda('')
                  if (acotado) onQuitarAcotado()
               }}
              />
            ) : (
              <div className="flex flex-col gap-0.5">
                {lista.slice(0, cargadas).map((persona) => (
                  <Item
                    key={persona.id}
                    size="sm"
                    variant={elegida?.id === persona.id ? 'muted' : 'default'}
                    render={<button type="button" />}
                    onClick={() => setElegidaId(persona.id)}
                    aria-pressed={elegida?.id === persona.id}
                    className="w-full text-left"
                  >
                    <ItemMedia>
                      <Avatar size="sm">
                        <AvatarFallback>{persona.initials}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <TextoCompleto texto={persona.name}><ItemTitle className="truncate">{persona.name}</ItemTitle></TextoCompleto>
                      <TextoCompleto texto={[persona.area, persona.leader].filter(Boolean).join(" · ")}><ItemDescription className="truncate">{[persona.area, persona.leader].filter(Boolean).join(' · ') || `Enviada el ${persona.submittedLabel}`}</ItemDescription></TextoCompleto>
                    </ItemContent>
                    <ItemActions>
                      {persona.status === 'partial' ? (
                        <Badge variant="warning-light" size="xs">
                          Parcial
                        </Badge>
                      ) : null}
                      <Promedio persona={persona} />
                    </ItemActions>
                  </Item>
                ))}
              </div>
            )}
          </FramePanel>
          {cargadas < lista.length ? (
            <FrameFooter>
              <BotonCargarMas onCargarMas={cargarMas} />
            </FrameFooter>
          ) : null}
        </Frame>

        {elegida ? (
          <Ficha key={elegida.id} persona={elegida} secciones={secciones} recuentos={recuentos} comentarios={comentarios} correcciones={correcciones} matriz={matriz} />
        ) : (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-profile" />
            </EmptyMedia>
              <EmptyTitle>Selecciona una persona</EmptyTitle>
              <EmptyDescription>Elige a alguien de la lista para ver todo lo que respondió.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}
