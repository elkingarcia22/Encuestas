import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Cancel01Icon, CheckmarkCircle02Icon, UserAdd01Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Text,
  useComboboxAnchor,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { FilaCifras, type Cifra } from '@/modules/design-system/metricas/cifras'
import { UBITS_DIRECTORY, buildStructureSummary, identifierTypeLabel, questionKind, type DetectedParticipant, type ParticipantGroup, type ParticipantResolution, type UbitsDirectoryUser, type SurveyReviewItem, type StructureSummary } from '../../modelo/carga-historica'
import { EncabezadoPaso } from '../pasos-drawer'
import { FilasSeparadas } from '../marco-lista'
import type { CargaHistorica } from './use-carga-historica'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { numero } from '@/modules/design-system/graficos/piezas'

// «Estructura»: lo que encontramos en los archivos antes de cargar. Los indicadores que calculamos,
// con qué usuario de UBITS queda cada participante (solo en una carga pública), y cómo queda armada
// la encuesta: demográficos, secciones y preguntas, y las que no reconocimos.

// Una columna por cifra: la tarjeta partida no deja huecos.
const COLUMNAS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

const VARIANTE_GRUPO: Record<ParticipantGroup['tone'], 'success-light' | 'warning-light' | 'secondary'> = { positive: 'success-light', warning: 'warning-light', neutral: 'secondary' }

const pct = (valor: number) => `${Math.round(valor)} %`

// Las cifras que calculamos, en una sola tarjeta partida (acuerdo del 14-sep: nada de tarjetas sueltas). Solo las que
// el archivo trae: una cifra «N/D» no le dice nada a quien carga. Una encuesta NPS no lleva favorabilidad.
function cifrasDe(item: SurveyReviewItem, resumen: StructureSummary): Cifra[] {
  const { analysis } = item
  const cifras: Cifra[] = [
    {
      etiqueta: 'Participación',
      valor: resumen.participationHeadline,
      detalle:
        resumen.responded === null
          ? 'Sin datos de participación'
          : resumen.notResponded === null
            ? `${numero(resumen.responded)} respondieron`
            : `${numero(resumen.responded)} de ${numero(resumen.responded + resumen.notResponded)} respondieron`,
    },
  ]
  const favorabilidad = analysis.favorabilityBreakdown
  if (item.type !== 'NPS' && resumen.favorabilityNet !== null) {
    cifras.push({
      etiqueta: 'Favorabilidad neta',
      valor: `${resumen.favorabilityNet > 0 ? '+' : ''}${resumen.favorabilityNet}`,
      detalle: favorabilidad ? `${pct(favorabilidad.favorable)} favorable · ${pct(favorabilidad.desfavorable)} desfavorable` : undefined,
    })
  }
  const nps = analysis.npsBreakdown
  if (nps || resumen.enpsHeadline !== 'N/D') {
    cifras.push({
      etiqueta: 'eNPS',
      valor: resumen.enpsHeadline,
      detalle: nps ? `${pct(nps.promotores)} promotores · ${pct(nps.detractores)} detractores` : undefined,
    })
  }
  return cifras
}

const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`

/** Asociar a mano un participante con un usuario de UBITS: un buscador por nombre o username. */
function Asociar({ ocupados, onElegir, onCancelar }: { ocupados: ReadonlySet<string>; onElegir: (username: string) => void; onCancelar: () => void }) {
  const ancla = useComboboxAnchor()
  const opciones = useMemo(() => UBITS_DIRECTORY.filter((usuario) => !ocupados.has(usuario.username)), [ocupados])
  const porEtiqueta = useMemo(() => new Map(opciones.map((usuario) => [`${usuario.name} · ${usuario.username}`, usuario.username])), [opciones])
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1" ref={ancla}>
        <Combobox items={[...porEtiqueta.keys()]} autoHighlight onValueChange={(valor) => valor && onElegir(porEtiqueta.get(valor as string) ?? '')}>
          <ComboboxInput placeholder="Busca el usuario de UBITS" aria-label="Usuario de UBITS" />
          <ComboboxContent anchor={ancla}>
            <ComboboxEmpty>Ningún usuario coincide.</ComboboxEmpty>
            <ComboboxList>
              {(etiqueta: string) => (
                <ComboboxItem key={etiqueta} value={etiqueta}>
                  {etiqueta}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <BotonIcono aria-label="Cancelar asociación" onClick={onCancelar}>
        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
      </BotonIcono>
    </div>
  )
}

function Participante({ persona, resolucion, ocupados, onResolver }: { persona: DetectedParticipant; resolucion?: ParticipantResolution; ocupados: ReadonlySet<string>; onResolver: (decision: ParticipantResolution | null) => void }) {
  const [asociando, setAsociando] = useState(false)
  const vinculado: UbitsDirectoryUser | undefined = resolucion?.kind === 'linked' ? UBITS_DIRECTORY.find((usuario) => usuario.username === resolucion.username) : undefined
  const sugerido = persona.suggestion
  return (
    <Item size="sm">
      <ItemContent className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TextoCompleto texto={persona.name ?? persona.identifier}><ItemTitle className="truncate">{persona.name ?? persona.identifier}</ItemTitle></TextoCompleto>
          <ItemDescription>
            {persona.identifier} · {identifierTypeLabel(persona.identifierType)}
            {persona.matchStatus !== 'matched' ? ' · sin coincidencia en UBITS' : ''}
          </ItemDescription>
        </div>
        {resolucion ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={resolucion.kind === 'linked' ? 'success-light' : 'secondary'}>
              <HugeiconsIcon icon={resolucion.kind === 'linked' ? CheckmarkCircle02Icon : UserAdd01Icon} aria-hidden="true" />
              {resolucion.kind === 'linked' ? `Vinculado a ${vinculado?.name ?? resolucion.username}` : 'Se crea solo en esta encuesta'}
            </Badge>
            <Button variant="ghost" size="xs" onClick={() => onResolver(null)}>
              Deshacer
            </Button>
          </div>
        ) : asociando ? (
          <Asociar
            ocupados={ocupados}
            onElegir={(username) => {
              onResolver({ kind: 'linked', username })
              setAsociando(false)
            }}
            onCancelar={() => setAsociando(false)}
          />
        ) : sugerido ? (
          <div className="flex flex-col gap-2">
            <Text size="xs" variant="muted">
              Mismo nombre y apellido que un usuario de UBITS: <strong>{sugerido.name}</strong> ({sugerido.username} · {sugerido.context})
            </Text>
            {/* El único botón primario del panel es «Cargar encuesta» (Elkin, 15-oct): aquí, dos secundarios y un terciario, y
                las tres acciones se quedan en una sola fila. */}
            <div className="flex flex-nowrap items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => onResolver({ kind: 'linked', username: sugerido.username })}>
                Sí, es el mismo usuario
              </Button>
              <Button size="sm" variant="outline" onClick={() => onResolver({ kind: 'separate' })}>
                Dejar sin match
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAsociando(true)}>
                Asociar otro usuario
              </Button>
            </div>
          </div>
        ) : persona.matchStatus !== 'matched' ? (
          <div>
            <Button size="sm" variant="ghost" onClick={() => setAsociando(true)}>
              <HugeiconsIcon icon={UserAdd01Icon} aria-hidden="true" />
              Asociar usuario
            </Button>
          </div>
        ) : null}
      </ItemContent>
    </Item>
  )
}

export function PasoEstructura({ carga }: { carga: CargaHistorica }) {
  const item = carga.actual
  const resumen = useMemo(() => (item ? buildStructureSummary(item.analysis, carga.resoluciones) : null), [item, carga.resoluciones])
  if (!item || !resumen) return null
  const { analysis } = item
  const publica = item.visibility === 'publica'
  const cifras = cifrasDe(item, resumen)
  const totalPreguntas = resumen.questionGroups.reduce((suma, grupo) => suma + grupo.questions.length, 0)
  // El grupo de participantes que va abierto: el de los posibles match, o el primero si no hay.
  const grupoAbierto = resumen.participantGroups?.find((grupo) => grupo.value === 'participantes-posibles')?.value ?? resumen.participantGroups?.[0]?.value
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPaso titulo="Revisa lo que vamos a cargar" descripcion="Es lo que encontramos en los archivos. Abre una sección para ver sus preguntas." />
      <Frame>
        <FrameHeader>
          <FrameTitle>Indicadores</FrameTitle>
          <FrameDescription>Los calculamos con las respuestas del archivo.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <FilaCifras cifras={cifras} columnas={COLUMNAS[cifras.length]} />
        </FramePanel>
      </Frame>

      {publica && resumen.participantGroups ? (
        <Frame>
          <FrameHeader>
            <FrameTitle>Participantes</FrameTitle>
            <FrameDescription>La encuesta se carga pública: cada respuesta queda a nombre del usuario de UBITS con el que se vincule.</FrameDescription>
          </FrameHeader>
          {/* Cada grupo en su propio panel, como las listas de Comparar (Elkin, 15-oct): un acordeón por contenedor, no todos
              en uno, y adentro las filas planas con una línea entre fila y fila, no una tarjeta por persona. */}
          {resumen.participantGroups.map((grupo) => (
            <FramePanel key={grupo.value} className="py-1!">
              <Accordion defaultValue={grupo.value === grupoAbierto ? [grupo.value] : []}>
                <AccordionItem value={grupo.value}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      {grupo.title}
                      <Badge variant={VARIANTE_GRUPO[grupo.tone]} className="tabular-nums">
                        {grupo.people.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-3">
                    <Text size="xs" variant="muted">
                      {grupo.note}
                    </Text>
                    {grupo.people.length === 0 ? (
                      <Text size="sm" variant="muted">
                        No hay participantes en este grupo.
                      </Text>
                    ) : (
                      <FilasSeparadas>
                        {grupo.people.map((persona) => (
                          <Participante
                            key={persona.identifier}
                            persona={persona}
                            resolucion={carga.resoluciones[persona.identifier]}
                            ocupados={resumen.takenUsernames}
                            onResolver={(decision) => carga.resolver(persona.identifier, decision)}
                          />
                        ))}
                      </FilasSeparadas>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FramePanel>
          ))}
        </Frame>
      ) : null}

      <Frame>
        <FrameHeader>
          <FrameTitle>Estructura</FrameTitle>
          <FrameDescription>
            {plural(resumen.questionGroups.length, 'sección', 'secciones')} · {plural(totalPreguntas, 'pregunta', 'preguntas')}
            {analysis.demographics.length === 0 ? ' · sin datos demográficos' : ''}
          </FrameDescription>
        </FrameHeader>
        {analysis.demographics.length > 0 ? (
          <FramePanel className="flex flex-wrap items-center gap-1.5">
            <Text as="span" size="sm" variant="muted" className="me-1">
              Demográficos
            </Text>
            {analysis.demographics.map((demografico) => (
              <Badge key={demografico} variant="outline">
                {demografico}
              </Badge>
            ))}
          </FramePanel>
        ) : null}
        {resumen.questionGroups.length === 0 ? (
          <FramePanel>
            <Text size="sm" variant="muted">
              No se detectaron secciones ni preguntas.
            </Text>
          </FramePanel>
        ) : (
          // Cada sección en su propio panel y sus preguntas como filas planas con línea entre ellas (Elkin, 15-oct).
          resumen.questionGroups.map((grupo) => (
            <FramePanel key={grupo.name} className="py-1!">
              <Accordion>
                <AccordionItem value={grupo.name}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      {grupo.name}
                      <Badge variant="secondary" className="tabular-nums">
                        {grupo.questions.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2">
                    {grupo.note ? (
                      <Text size="xs" variant="muted">
                        {grupo.note}
                      </Text>
                    ) : null}
                    <FilasSeparadas>
                      {grupo.questions.map((pregunta, indice) => (
                        <Item key={`${pregunta.text}-${indice}`} size="sm">
                          <ItemContent className="min-w-0">
                            <ItemTitle className="whitespace-normal">{pregunta.text}</ItemTitle>
                          </ItemContent>
                          <Badge variant="outline" size="sm" className="shrink-0">
                            {questionKind(pregunta.meta)}
                          </Badge>
                        </Item>
                      ))}
                    </FilasSeparadas>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FramePanel>
          ))
        )}
      </Frame>
      {resumen.unrecognizedQuestions.length > 0 ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertTitle>
              {resumen.unrecognizedQuestions.length} {resumen.unrecognizedQuestions.length === 1 ? 'pregunta sin reconocer' : 'preguntas sin reconocer'}
            </AlertTitle>
            <AlertDescription>No coinciden con ningún tipo de pregunta de UBITS, así que se cargan como texto y no suman a favorabilidad ni a eNPS.</AlertDescription>
          </Alert>
        ) : null}
    </div>
  )
}
