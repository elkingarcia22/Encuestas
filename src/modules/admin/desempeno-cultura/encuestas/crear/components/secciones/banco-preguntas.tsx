import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { LibraryIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Checkbox,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { useQuestionBankLibrary } from '../../../modelo/questionBankLibrary'
import type { QuestionBankItem, QuestionBankSection } from '../../../modelo/questionBankData'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// El banco de preguntas de UBITS: se elige el tipo de encuesta, sus secciones van en acordeón y se
// marcan varias preguntas (o una sección entera) para añadirlas de una vez a la sección elegida.
// Las del banco son de escala Likert de acuerdo.

type Marcadas = ReadonlyMap<string, string>

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

// Un tipo sin secciones propias trae una sola llamada «Sin sección»: se muestra como lista directa.
const esListaSuelta = (secciones: readonly QuestionBankSection[]) => secciones.length === 1 && secciones[0].name === 'Sin sección'

function ListaPreguntas({ preguntas, marcadas, onAlternar }: { preguntas: readonly QuestionBankItem[]; marcadas: Marcadas; onAlternar: (pregunta: QuestionBankItem) => void }) {
  return (
    // Una línea entre pregunta y pregunta: con 20 o más seguidas, el texto solo no dice dónde acaba una. El borde lo pone
    // el marco del banco, así que la lista no lleva el suyo.
    <ItemGroup className="gap-0!">
      {preguntas.map((pregunta, indice) => {
        const marcada = marcadas.has(pregunta.id)
        return (
          <div key={pregunta.id}>
            {indice > 0 ? <ItemSeparator /> : null}
            <Item variant={marcada ? 'muted' : 'default'} size="sm" render={<label htmlFor={`banco-pregunta-${pregunta.id}`} />} className="cursor-pointer items-start gap-3 hover:bg-muted/60">
              <Checkbox id={`banco-pregunta-${pregunta.id}`} checked={marcada} onCheckedChange={() => onAlternar(pregunta)} className="mt-0.5" />
              <ItemContent>
                <Text as="span" size="sm">
                  {pregunta.text}
                </Text>
                {pregunta.origin === 'custom' ? <ItemDescription>Guardada por tu equipo</ItemDescription> : null}
              </ItemContent>
            </Item>
          </div>
        )
      })}
    </ItemGroup>
  )
}

// «Elegir las N» en vez de una casilla a medias: la casilla indeterminada pinta el mismo visto que la marcada.
function ElegirTodas({ preguntas, marcadas, onElegir }: { preguntas: readonly QuestionBankItem[]; marcadas: Marcadas; onElegir: (preguntas: readonly QuestionBankItem[], elegir: boolean) => void }) {
  if (preguntas.length < 2) return null
  const todas = preguntas.every((pregunta) => marcadas.has(pregunta.id))
  const cuantas = `las ${preguntas.length}`
  return (
    <div className="flex">
      <Button variant="ghost" size="xs" className="-ms-2" onClick={() => onElegir(preguntas, !todas)}>
        {todas ? `Quitar ${cuantas}` : `Elegir ${cuantas}`}
      </Button>
    </div>
  )
}

export function BancoPreguntas({
  abierto,
  onAbiertoChange,
  destino,
  onAgregar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  /** Dónde van a quedar, para decirlo antes de añadir. */
  destino: string
  onAgregar: (textos: string[]) => void
}) {
  const banco = useQuestionBankLibrary()
  const [tipo, setTipo] = useState(banco[0]?.id ?? '')
  const [busqueda, setBusqueda] = useState('')
  const [marcadas, setMarcadas] = useState<Marcadas>(() => new Map())
  const [abiertas, setAbiertas] = useState<string[]>(() => (banco[0]?.sections[0] ? [banco[0].sections[0].id] : []))

  const q = busqueda.trim().toLowerCase()
  const secciones = useMemo(() => (banco.find((entrada) => entrada.id === tipo) ?? banco[0])?.sections ?? [], [banco, tipo])
  const visibles = useMemo(
    () =>
      secciones
        .map((actual) => ({ ...actual, questions: actual.questions.filter((pregunta) => !q || `${pregunta.text} ${actual.name}`.toLowerCase().includes(q)) }))
        .filter((actual) => actual.questions.length > 0),
    [secciones, q],
  )
  const totalVisibles = visibles.reduce((suma, actual) => suma + actual.questions.length, 0)
  // Solo una sección abierta a la vez. Si hay una abierta pero la búsqueda la deja sin resultados, se abre la primera que sí; cerrarla a mano la deja cerrada.
  const abiertasAhora = abiertas.length === 0 || visibles.some((actual) => abiertas.includes(actual.id)) ? abiertas : visibles[0] ? [visibles[0].id] : []

  const alternar = (pregunta: QuestionBankItem) =>
    setMarcadas((previas) => {
      const siguientes = new Map(previas)
      if (siguientes.has(pregunta.id)) siguientes.delete(pregunta.id)
      else siguientes.set(pregunta.id, pregunta.text)
      return siguientes
    })

  const elegir = (preguntas: readonly QuestionBankItem[], elegirlas: boolean) =>
    setMarcadas((previas) => {
      const siguientes = new Map(previas)
      for (const pregunta of preguntas) {
        if (elegirlas) siguientes.set(pregunta.id, pregunta.text)
        else siguientes.delete(pregunta.id)
      }
      return siguientes
    })

  const cambiarTipo = (valor: string) => {
    setTipo(valor)
    const primera = banco.find((entrada) => entrada.id === valor)?.sections[0]
    setAbiertas(primera ? [primera.id] : [])
  }

  const cerrar = () => {
    setMarcadas(new Map())
    setBusqueda('')
    onAbiertoChange(false)
  }

  const contarElegidas = (preguntas: readonly QuestionBankItem[]) => preguntas.filter((pregunta) => marcadas.has(pregunta.id)).length

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(valor) => (valor ? onAbiertoChange(true) : cerrar())}
      size="lg"
      icon={LibraryIcon}
      title="Banco de preguntas"
      description="Preguntas de UBITS listas para usar. Elige el tipo de encuesta, abre una sección y marca las que quieras añadir."
      headerExtra={
        <div className="border-b px-5 py-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,16rem)_1fr]">
            <Select value={tipo} onValueChange={(valor) => cambiarTipo(valor as string)} items={banco.map((entrada) => ({ value: entrada.id, label: entrada.name }))}>
              <SelectTrigger aria-label="Tipo de encuesta" className="w-full bg-background!">
                <SelectValue placeholder="Tipo de encuesta" />
              </SelectTrigger>
              <SelectContent>
                {banco.map((entrada) => (
                  <SelectItem key={entrada.id} value={entrada.id}>
                    {entrada.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputGroup className="bg-background!">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar pregunta o sección…" aria-label="Buscar pregunta" />
            </InputGroup>
          </div>
        </div>
      }
      footer={
        <>
          <Text as="span" size="sm" variant="muted" className="mr-auto">
            {marcadas.size === 0 ? `Se añadirán a ${destino}` : `${plural(marcadas.size, 'elegida', 'elegidas')} · irán a ${destino}`}
          </Text>
          <Button variant="outline" onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            disabled={marcadas.size === 0}
            onClick={() => {
              onAgregar([...marcadas.values()])
              cerrar()
            }}
          >
            Añadir {marcadas.size > 0 ? `(${marcadas.size})` : ''}
          </Button>
        </>
      }
    >
      {visibles.length === 0 ? (
        // Los vacíos del sistema, con ilustración (decisión 14): con lo buscado y el botón para limpiar la búsqueda; si
        // no se buscó nada, es que este tipo de encuesta todavía no trae preguntas.
        q ? (
          <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
        ) : (
          <PrimeraVez icono="glass-document" titulo="Este tipo de encuesta aún no tiene preguntas" descripcion="Elige otro tipo de encuesta arriba o escribe tus propias preguntas en la sección." />
        )
      ) : (
        // Cada sección es su propio marco: su nombre y cuántas preguntas tiene en la cabecera (que abre y cierra), y sus
        // preguntas dentro. Sin un marco del tipo encima: el tipo ya está en el selector de arriba.
        esListaSuelta(secciones) ? (
          <Frame>
            <FrameHeader>
              <FrameTitle>Preguntas</FrameTitle>
              <FrameDescription>{plural(totalVisibles, 'pregunta', 'preguntas')}</FrameDescription>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-1">
              <ElegirTodas preguntas={visibles[0].questions} marcadas={marcadas} onElegir={elegir} />
              <ListaPreguntas preguntas={visibles[0].questions} marcadas={marcadas} onAlternar={alternar} />
            </FramePanel>
          </Frame>
        ) : (
          <Accordion value={abiertasAhora} onValueChange={(valor) => setAbiertas(valor as string[])} className="gap-3">
            {visibles.map((actual) => {
              const elegidas = contarElegidas(actual.questions)
              return (
                <Frame key={actual.id}>
                  <AccordionItem value={actual.id} className="border-0!">
                    <FrameHeader className="py-0!">
                      <AccordionTrigger>
                        <div className="flex min-w-0 flex-1 items-center gap-2 pe-2 text-left">
                          <TextoCompleto texto={actual.name}><FrameTitle className="truncate">{actual.name}</FrameTitle></TextoCompleto>
                          <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
                            {actual.questions.length}
                          </Badge>
                          {actual.origin === 'custom' ? (
                            <Badge variant="outline" size="xs">
                              De tu equipo
                            </Badge>
                          ) : null}
                          {elegidas > 0 ? (
                            <Badge variant="primary-light" size="xs" className="ms-auto tabular-nums">
                              {plural(elegidas, 'elegida', 'elegidas')}
                            </Badge>
                          ) : null}
                        </div>
                      </AccordionTrigger>
                    </FrameHeader>
                    <AccordionContent className="pb-0!">
                      <FramePanel className="flex flex-col gap-1">
                        <ElegirTodas preguntas={actual.questions} marcadas={marcadas} onElegir={elegir} />
                        <ListaPreguntas preguntas={actual.questions} marcadas={marcadas} onAlternar={alternar} />
                      </FramePanel>
                    </AccordionContent>
                  </AccordionItem>
                </Frame>
              )
            })}
          </Accordion>
        )
      )}
    </DrawerShell>
  )
}
