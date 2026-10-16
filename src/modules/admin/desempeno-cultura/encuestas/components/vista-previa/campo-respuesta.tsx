import { HugeiconsIcon } from '@hugeicons/react'
import { AngryIcon, LaughingIcon, NeutralIcon, Sad01Icon, SmileIcon } from '@hugeicons/core-free-icons'
import {
  Checkbox,
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
  Rating,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
  ToggleGroup,
  cn,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { EMOJI_STEPS, LINEAR_STEPS, NPS_MAX, NPS_MIN, STAR_STEPS, likertSteps } from '../../modelo/questionCatalog'
import type { QuestionOption, SurveyQuestion } from '../../modelo/surveyBuilderTypes'

// Los controles que toca quien responde. Son de verdad: en la vista previa se puede contestar la
// propia encuesta y ver cómo se comporta cada escala. Nada se guarda: al cerrar se tira.
//
// Todos ocupan el ancho de la columna del formulario: las escalas reparten sus pasos en partes
// iguales (en el teléfono, las de texto se apilan) y las opciones cortas van en dos columnas.

export type Respuesta = string | readonly string[] | null

export const NO_SABE = 'No sabe / no responde'

const CARAS = [AngryIcon, Sad01Icon, NeutralIcon, SmileIcon, LaughingIcon]
// Cada cara, al elegirse, toma su color: de la más triste (rojo) a la más feliz (verde).
const TONO_CARA = [
  'data-pressed:border-destructive! data-pressed:bg-destructive/10! data-pressed:text-destructive!',
  'data-pressed:border-warning! data-pressed:bg-warning/10! data-pressed:text-warning!',
  'data-pressed:border-border! data-pressed:bg-muted! data-pressed:text-foreground!',
  'data-pressed:border-info! data-pressed:bg-info/10! data-pressed:text-info!',
  'data-pressed:border-success! data-pressed:bg-success/10! data-pressed:text-success!',
]
// El resto de los pasos: el elegido en el color de marca, para que se note cuál quedó.
// Las tarjetas de opción responden al puntero: el borde toma el color de marca y, si todavía no están
// elegidas, el fondo se apaga un poco. La elegida ya trae su propio fondo y solo cambia el borde.
const HOVER_OPCION = 'cursor-pointer transition-colors hover:border-primary/40 not-has-[[data-checked]]:hover:bg-muted/50'
const ELEGIDO = 'data-pressed:border-primary! data-pressed:bg-primary/10! data-pressed:text-primary!'

const comoLista = (valor: Respuesta): readonly string[] => (Array.isArray(valor) ? valor : typeof valor === 'string' && valor ? [valor] : [])
const comoTexto = (valor: Respuesta): string => (typeof valor === 'string' ? valor : '')
const etiquetaDe = (opcion: QuestionOption, indice: number) => opcion.label.trim() || `Opción ${indice + 1}`

type Props = {
  pregunta: SurveyQuestion
  valor: Respuesta
  onCambio: (valor: Respuesta) => void
}

// Los mismos controles en la vista previa y en la muestra del editor («Así lo verá el participante»): una sola versión.
export function CampoRespuesta({ pregunta, valor, onCambio }: Props) {
  if (pregunta.type === 'open') {
    return <Textarea aria-label="Tu respuesta" rows={4} placeholder="Escribe tu respuesta" value={comoTexto(valor)} onChange={(evento) => onCambio(evento.target.value)} />
  }
  if (pregunta.type === 'dropdown') return <Desplegable pregunta={pregunta} valor={comoTexto(valor)} onCambio={onCambio} />
  if (pregunta.type === 'single' || pregunta.type === 'multiple') return <Opciones pregunta={pregunta} elegidas={comoLista(valor)} onCambio={onCambio} />
  return <Escala pregunta={pregunta} valor={comoTexto(valor)} onCambio={onCambio} />
}

function SinOpciones() {
  return (
    <Text size="sm" variant="muted">
      Esta pregunta todavía no tiene opciones de respuesta.
    </Text>
  )
}

function Desplegable({ pregunta, valor, onCambio }: { pregunta: SurveyQuestion; valor: string; onCambio: (valor: Respuesta) => void }) {
  if (pregunta.options.length === 0) return <SinOpciones />
  return (
    <div className="sm:w-1/2">
      <Select value={valor || null} onValueChange={(elegido) => onCambio((elegido as string | null) || null)}>
        <SelectTrigger className="w-full" aria-label="Tu respuesta">
          <SelectValue placeholder="Selecciona una opción">{(id: string | null) => pregunta.options.find((opcion) => opcion.id === id)?.label ?? 'Selecciona una opción'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {pregunta.options.map((opcion, indice) => (
            <SelectItem key={opcion.id} value={opcion.id}>
              {etiquetaDe(opcion, indice)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Cómo se reparten las opciones en el ancho del formulario. Las muy cortas (hasta cuatro, como
// «Presencial / Híbrido / Remoto») van en una fila; con más, si ninguna es larga, en dos columnas;
// las largas, una debajo de otra. En el teléfono siempre se apilan.
const MAX_OPCIONES_EN_FILA = 4
const LARGO_OPCION_EN_FILA = 20
const LARGO_OPCION_CORTA = 40
const OPCIONES_EN_DOS_COLUMNAS = 4

const EN_FILA: Record<number, string> = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }

function rejillaDe(etiquetas: readonly string[]): string {
  const largo = Math.max(...etiquetas.map((etiqueta) => etiqueta.length))
  if (etiquetas.length <= MAX_OPCIONES_EN_FILA && largo <= LARGO_OPCION_EN_FILA) return cn('grid gap-2', EN_FILA[etiquetas.length])
  if (etiquetas.length >= OPCIONES_EN_DOS_COLUMNAS && largo <= LARGO_OPCION_CORTA) return 'grid gap-2 sm:grid-cols-2'
  return 'grid gap-2'
}

// Elegir una entre varias, en tarjetas: la elegida se marca con el punto y el borde del tema. Sirve
// para las opciones de una pregunta de opción única.
function Unica({
  base,
  opciones,
  valor,
  onCambio,
  rejilla,
  etiqueta,
}: {
  base: string
  opciones: readonly { id: string; etiqueta: string }[]
  valor: string
  onCambio: (valor: Respuesta) => void
  rejilla: string
  etiqueta?: string
}) {
  return (
    <RadioGroup aria-label={etiqueta} value={valor} onValueChange={(elegido) => onCambio((elegido as string) || null)} className={rejilla}>
      {opciones.map((opcion) => (
        <FieldLabel key={opcion.id} htmlFor={`${base}-${opcion.id}`} className={HOVER_OPCION}>
          <Field orientation="horizontal">
            <RadioGroupItem value={opcion.id} id={`${base}-${opcion.id}`} />
            <FieldContent>
              <FieldTitle>{opcion.etiqueta}</FieldTitle>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}

function Opciones({ pregunta, elegidas, onCambio }: { pregunta: SurveyQuestion; elegidas: readonly string[]; onCambio: (valor: Respuesta) => void }) {
  if (pregunta.options.length === 0) return <SinOpciones />
  const base = `respuesta-${pregunta.id}`
  const opciones = pregunta.options.map((opcion, indice) => ({ id: opcion.id, etiqueta: etiquetaDe(opcion, indice) }))
  const rejilla = rejillaDe(opciones.map((opcion) => opcion.etiqueta))

  if (pregunta.type === 'single') return <Unica base={base} opciones={opciones} valor={elegidas[0] ?? ''} onCambio={onCambio} rejilla={rejilla} />

  const alternar = (id: string, marcada: boolean) => onCambio(marcada ? [...elegidas, id] : elegidas.filter((actual) => actual !== id))
  return (
    <div className={rejilla}>
      {opciones.map((opcion) => (
        <FieldLabel key={opcion.id} htmlFor={`${base}-${opcion.id}`} className={HOVER_OPCION}>
          <Field orientation="horizontal">
            <Checkbox id={`${base}-${opcion.id}`} checked={elegidas.includes(opcion.id)} onCheckedChange={(marcada) => alternar(opcion.id, marcada === true)} />
            <FieldContent>
              <FieldTitle>{opcion.etiqueta}</FieldTitle>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </div>
  )
}

function Extremos({ min, max }: { min: string; max: string }) {
  if (!min && !max) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <Text as="span" size="xs" variant="muted">
        {min}
      </Text>
      <Text as="span" size="xs" variant="muted" className="text-right">
        {max}
      </Text>
    </div>
  )
}

// Cómo se reparten los pasos: los cortos (números, caras) siempre en fila, y el NPS parte sus once
// en dos filas en el teléfono.
const REPARTO = {
  corto: 'grid w-full grid-flow-col auto-cols-fr',
  nps: 'grid w-full grid-cols-6 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr',
} as const

// Una fila de pasos para elegir uno solo: Likert, NPS, lineal y emociones. Los pasos se reparten
// el ancho en partes iguales, así la escala se lee como una regla y no como botones sueltos.
function Pasos({
  pasos,
  valor,
  onCambio,
  etiqueta,
  icono,
  tono,
  reparto = 'corto',
}: {
  pasos: readonly string[]
  valor: string
  onCambio: (valor: Respuesta) => void
  etiqueta: string
  icono?: (indice: number) => React.ReactNode
  tono?: (indice: number) => string
  reparto?: keyof typeof REPARTO
}) {
  return (
    <ToggleGroup
      aria-label={etiqueta}
      variant="outline"
      size="lg"
      spacing={2}
      value={valor ? [valor] : []}
      onValueChange={(elegidos) => onCambio((elegidos as string[])[0] ?? null)}
      className={REPARTO[reparto]}
    >
      {pasos.map((paso, indice) => (
        <ToggleGroupItem key={paso} value={paso} aria-label={icono ? `${indice + 1} de ${pasos.length}` : paso} className={cn('h-auto min-h-10 w-full whitespace-normal', tono ? tono(indice) : ELEGIDO)}>
          {icono ? icono(indice) : paso}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// La escala Likert de la vista previa: cinco segmentos pegados que forman una sola barra; el elegido se
// rellena con el color de marca. El nombre va dentro de cada segmento y, si es largo, se parte en dos líneas.
function BarraLikert({ pasos, valor, onCambio }: { pasos: readonly string[]; valor: string; onCambio: (valor: Respuesta) => void }) {
  return (
    <ToggleGroup
      aria-label="Tu respuesta"
      variant="outline"
      size="lg"
      spacing={0}
      value={valor ? [valor] : []}
      onValueChange={(elegidos) => onCambio((elegidos as string[])[0] ?? null)}
      className="grid w-full grid-flow-col auto-cols-fr items-stretch"
    >
      {pasos.map((paso) => (
        <ToggleGroupItem key={paso} value={paso} aria-label={paso} className={cn('h-auto! min-h-12 w-full min-w-0 self-stretch whitespace-normal px-2 py-2 text-center wrap-anywhere', ELEGIDO)}>
          {paso}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

const numeros = (desde: number, hasta: number) => Array.from({ length: hasta - desde + 1 }, (_, indice) => String(desde + indice))

function Escala({ pregunta, valor, onCambio }: { pregunta: SurveyQuestion; valor: string; onCambio: (valor: Respuesta) => void }) {
  const { kind, minLabel, maxLabel, allowDontKnow } = pregunta.scale

  if (kind === 'likert' || kind === 'likert-nom035') {
    const pasos = likertSteps(pregunta)
    // Una barra de segmentos pegados, en la vista previa y en la muestra del editor.
    return <BarraLikert pasos={allowDontKnow ? [...pasos, NO_SABE] : pasos} valor={valor} onCambio={onCambio} />
  }
  if (kind === 'nps') {
    return (
      <div className="flex flex-col gap-2">
        <Pasos etiqueta="Del 0 al 10" reparto="nps" pasos={numeros(NPS_MIN, NPS_MAX)} valor={valor} onCambio={onCambio} />
        <Extremos min={minLabel || 'Nada probable'} max={maxLabel || 'Muy probable'} />
      </div>
    )
  }
  // Las estrellas no se estiran: cinco iconos repartidos en todo el ancho ya no se leen como una valoración.
  if (kind === 'stars') {
    return (
      <div className="flex w-fit max-w-full flex-col gap-2">
        {/* La librería las pinta pegadas: llevan un espacio fijo entre sí. */}
        <Rating
          rating={Number(valor) || 0}
          maxRating={STAR_STEPS}
          size="lg"
          className="[&>div]:gap-4 [&_[data-slot^=rating-star]]:size-9"
          editable
          onRatingChange={(puntos) => onCambio(puntos === Number(valor) ? null : String(puntos))}
        />
        <Extremos min={minLabel} max={maxLabel} />
      </div>
    )
  }
  if (kind === 'emoji') {
    return (
      <div className="flex flex-col gap-2">
        <Pasos
          etiqueta="Elige una cara"
          pasos={numeros(1, EMOJI_STEPS)}
          valor={valor}
          onCambio={onCambio}
          icono={(indice) => <HugeiconsIcon icon={CARAS[indice] ?? NeutralIcon} size={26} aria-hidden="true" />}
          tono={(indice) => TONO_CARA[indice] ?? ELEGIDO}
        />
        <Extremos min={minLabel} max={maxLabel} />
      </div>
    )
  }
  if (kind === 'linear') {
    return (
      <div className="flex flex-col gap-2">
        <Pasos etiqueta="Del 1 al 5" pasos={numeros(1, LINEAR_STEPS)} valor={valor} onCambio={onCambio} />
        <Extremos min={minLabel} max={maxLabel} />
      </div>
    )
  }
  return (
    <Text size="sm" variant="muted">
      Esta pregunta todavía no tiene un tipo de escala configurado.
    </Text>
  )
}
