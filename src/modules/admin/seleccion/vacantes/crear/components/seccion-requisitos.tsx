import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon,
  Calendar03Icon,
  ComputerIcon,
  HardHatIcon,
  Idea01Icon,
  Infinity01Icon,
  LaptopIcon,
  MinusSignIcon,
  Mortarboard01Icon,
  PlusSignIcon,
  Timer02Icon,
  TranslateIcon,
} from '@hugeicons/core-free-icons'
import {
  Checkbox,
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { CONTRATOS, EXPERIENCIA_MAX, EXPERIENCIA_MIN, EXPERIENCIA_PASO, HABILIDADES_SUGERIDAS, IDIOMAS, SENIORITY } from './datos'
import type { CamposSeccion, Modalidad } from './formulario'
import { REJILLA } from './rejilla'
import { SelectorEtiquetas } from './selectores'

/* ------------------------------------------------------------ requisitos del puesto */

// Dos bloques con su título: cómo se contrata (contrato y modalidad) y a quién se busca (nivel,
// experiencia e idiomas). Todos los campos miden lo mismo y van en la misma rejilla de dos columnas,
// para que la sección se lea en filas y no como un mosaico de tarjetas de tamaños distintos.

// Cada contrato con su icono (en el desplegable) y su explicación, que sale debajo solo del elegido.
const CONTRATO: Record<string, { detalle: string; icono: IconSvgElement }> = {
  'Término indefinido': { detalle: 'Sin fecha de fin.', icono: Infinity01Icon },
  'Término fijo': { detalle: 'Con fecha de fin pactada desde el inicio.', icono: Calendar03Icon },
  'Por obra o labor': { detalle: 'Termina cuando se entrega la obra.', icono: HardHatIcon },
  'Ocasional, accidental o transitorio': { detalle: 'Trabajos cortos, de hasta 30 días.', icono: Timer02Icon },
  Aprendizaje: { detalle: 'Formación práctica con apoyo de sostenimiento.', icono: Mortarboard01Icon },
}

// Desplegable como el del contrato (y no botones segmentados): el elegido se ve con claridad en claro y
// en oscuro, y los dos campos de la fila quedan iguales. Su explicación sale debajo, como la del contrato.
const MODALIDADES: { valor: Modalidad; titulo: string; icono: IconSvgElement }[] = [
  { valor: 'remoto', titulo: 'Remoto', icono: ComputerIcon },
  { valor: 'presencial', titulo: 'Presencial', icono: Building03Icon },
  { valor: 'hibrido', titulo: 'Híbrido', icono: LaptopIcon },
]

const MODALIDAD_DETALLE: Record<Modalidad, string> = {
  remoto: 'Trabaja desde donde quiera.',
  presencial: 'Todos los días en la sede.',
  hibrido: 'Combina sede y casa.',
}

export function Requisitos({ vacante, onCambio }: CamposSeccion) {
  return (
    <div className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend>Contratación</FieldLegend>
        <div className={REJILLA}>
          <Field>
            <FieldLabel htmlFor="vacante-contrato">Tipo de contrato</FieldLabel>
            <Select value={vacante.contrato || null} onValueChange={(contrato) => onCambio({ contrato: contrato ?? '' })}>
              <SelectTrigger id="vacante-contrato">
                <SelectValue placeholder="Elige el tipo de contrato">
                  {(valor: string | null) =>
                    valor && CONTRATO[valor] ? (
                      <>
                        <HugeiconsIcon icon={CONTRATO[valor].icono} aria-hidden="true" />
                        {valor}
                      </>
                    ) : (
                      'Elige el tipo de contrato'
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CONTRATOS.map((contrato) => (
                  <SelectItem key={contrato} value={contrato}>
                    <HugeiconsIcon icon={CONTRATO[contrato].icono} aria-hidden="true" />
                    {contrato}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription aria-live="polite">
              {vacante.contrato ? CONTRATO[vacante.contrato]?.detalle : 'Al elegirlo verás en qué consiste.'}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="vacante-modalidad">Modalidad</FieldLabel>
            <Select
              value={vacante.modalidad || null}
              onValueChange={(modalidad) => modalidad && onCambio({ modalidad: modalidad as Modalidad })}
            >
              <SelectTrigger id="vacante-modalidad">
                {/* Sin esto el campo muestra el valor interno («hibrido») en vez del nombre con su icono. */}
                <SelectValue placeholder="Elige la modalidad">
                  {(valor: string | null) => {
                    const opcion = MODALIDADES.find((modalidad) => modalidad.valor === valor)
                    return opcion ? (
                      <>
                        <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                        {opcion.titulo}
                      </>
                    ) : (
                      'Elige la modalidad'
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MODALIDADES.map((opcion) => (
                  <SelectItem key={opcion.valor} value={opcion.valor}>
                    <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                    {opcion.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription aria-live="polite">
              {vacante.modalidad ? MODALIDAD_DETALLE[vacante.modalidad] : 'Dónde trabajará la persona.'}
            </FieldDescription>
          </Field>
        </div>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Perfil del candidato</FieldLegend>
        <div className={REJILLA}>
          <Field>
            <FieldLabel htmlFor="vacante-seniority">Seniority</FieldLabel>
            <Select value={vacante.seniority || null} onValueChange={(seniority) => onCambio({ seniority: seniority ?? '' })}>
              <SelectTrigger id="vacante-seniority">
                <SelectValue placeholder="Elige el nivel" />
              </SelectTrigger>
              <SelectContent>
                {SENIORITY.map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>
                    {nivel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="vacante-idiomas">Idiomas</FieldLabel>
            <SelectorEtiquetas
              id="vacante-idiomas"
              icono={TranslateIcon}
              opciones={IDIOMAS}
              valor={vacante.idiomas}
              onCambio={(idiomas) => onCambio({ idiomas })}
              placeholder="Elige uno o varios"
            />
          </Field>
        </div>

        <CampoExperiencia vacante={vacante} onCambio={onCambio} />
      </FieldSet>

      <FieldSeparator />

      {/* Antes estaba en «Configuración» (29 sep, reunión con Elkin): las habilidades son de lo que se le pide a la
          persona, no un ajuste de la vacante. */}
      <FieldSet>
        <FieldLegend>Habilidades clave</FieldLegend>
        <FieldDescription>Con ellas la IA evalúa a cada candidato y arma las preguntas de filtro.</FieldDescription>
        <SelectorEtiquetas
          id="vacante-habilidades"
          icono={Idea01Icon}
          opciones={HABILIDADES_SUGERIDAS}
          valor={vacante.habilidades}
          onCambio={(habilidades) => onCambio({ habilidades })}
          placeholder="Escribe una habilidad y presiona Enter"
          creable
        />
      </FieldSet>
    </div>
  )
}

// La experiencia, dicha como se lee (29 sep, reunión con Elkin: la barra de 0 a 15 años «no se entiende»): los rangos
// que más se piden como opciones de un toque y, debajo, «Entre _ y _ años» para cualquier otro. La frase de abajo
// repite en palabras lo que quedó. El tope es «Sin máximo», no un número que haya que adivinar.
const RANGOS_EXPERIENCIA = [
  { id: 'sin', titulo: 'Sin experiencia', desde: 0, hasta: 0 },
  { id: '1-3', titulo: '1 a 3 años', desde: 1, hasta: 3 },
  { id: '3-5', titulo: '3 a 5 años', desde: 3, hasta: 5 },
  { id: '5+', titulo: 'Más de 5 años', desde: 5, hasta: EXPERIENCIA_MAX },
]

// Lo más que se escribe a mano: un año menos que el tope, que es «Sin máximo».
const ANIOS_MAX = EXPERIENCIA_MAX - EXPERIENCIA_PASO

function fraseExperiencia(desde: number, hasta: number) {
  if (desde === 0 && hasta === 0) return 'No pide experiencia: sirve para quien está empezando.'
  if (hasta >= EXPERIENCIA_MAX) return `Pide ${desde} ${desde === 1 ? 'año' : 'años'} o más de experiencia.`
  if (desde === hasta) return `Pide ${desde} ${desde === 1 ? 'año' : 'años'} de experiencia.`
  return `Pide entre ${desde} y ${hasta} años de experiencia.`
}

function CampoExperiencia({ vacante, onCambio }: CamposSeccion) {
  const { experienciaDesde: desde, experienciaHasta: hasta } = vacante
  const sinMaximo = hasta >= EXPERIENCIA_MAX
  const rango = RANGOS_EXPERIENCIA.find((opcion) => opcion.desde === desde && opcion.hasta === hasta)

  // El mínimo nunca pasa al máximo: si se cruzan, el otro campo lo sigue.
  const cambiarDesde = (valor: number | null) => {
    if (valor === null) return
    const nuevo = Math.min(Math.max(valor, EXPERIENCIA_MIN), ANIOS_MAX)
    onCambio({ experienciaDesde: nuevo, experienciaHasta: sinMaximo ? hasta : Math.max(hasta, nuevo) })
  }
  const cambiarHasta = (valor: number | null) => {
    if (valor === null) return
    const nuevo = Math.min(Math.max(valor, EXPERIENCIA_MIN), ANIOS_MAX)
    onCambio({ experienciaHasta: nuevo, experienciaDesde: Math.min(desde, nuevo) })
  }

  return (
    <Field>
      <FieldLabel id="vacante-experiencia-etiqueta">Experiencia requerida</FieldLabel>
      <div className="flex flex-col gap-3">
        <ToggleGroup
          variant="outline"
          size="sm"
          value={rango ? [rango.id] : []}
          onValueChange={(valor) => {
            const elegido = RANGOS_EXPERIENCIA.find((opcion) => opcion.id === valor[0])
            if (elegido) onCambio({ experienciaDesde: elegido.desde, experienciaHasta: elegido.hasta })
          }}
          aria-labelledby="vacante-experiencia-etiqueta"
          className="flex-wrap"
        >
          {RANGOS_EXPERIENCIA.map((opcion) => (
            <ToggleGroupItem key={opcion.id} value={opcion.id}>
              {opcion.titulo}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Text as="span" size="sm">
            Entre
          </Text>
          <div className="w-32">
            <NumberField value={desde} min={EXPERIENCIA_MIN} max={ANIOS_MAX} onValueChange={cambiarDesde}>
              <NumberFieldGroup>
                <NumberFieldDecrement>
                  <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
                </NumberFieldDecrement>
                <NumberFieldInput aria-label="Años de experiencia, desde" />
                <NumberFieldIncrement>
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                </NumberFieldIncrement>
              </NumberFieldGroup>
            </NumberField>
          </div>
          <Text as="span" size="sm">
            y
          </Text>
          <div className="w-32">
            <NumberField value={sinMaximo ? null : hasta} min={EXPERIENCIA_MIN} max={ANIOS_MAX} disabled={sinMaximo} onValueChange={cambiarHasta}>
              <NumberFieldGroup>
                <NumberFieldDecrement>
                  <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
                </NumberFieldDecrement>
                <NumberFieldInput aria-label="Años de experiencia, hasta" placeholder="Sin máx." />
                <NumberFieldIncrement>
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                </NumberFieldIncrement>
              </NumberFieldGroup>
            </NumberField>
          </div>
          <Text as="span" size="sm">
            años
          </Text>
          <Field orientation="horizontal" className="w-auto">
            <Checkbox
              id="vacante-experiencia-sin-maximo"
              checked={sinMaximo}
              onCheckedChange={(marcado) =>
                onCambio({ experienciaHasta: marcado ? EXPERIENCIA_MAX : Math.min(Math.max(desde, 1) + 2, ANIOS_MAX) })
              }
            />
            <FieldLabel htmlFor="vacante-experiencia-sin-maximo">
              Sin máximo
            </FieldLabel>
          </Field>
        </div>
      </div>
      <FieldDescription aria-live="polite">{fraseExperiencia(desde, hasta)}</FieldDescription>
    </Field>
  )
}
