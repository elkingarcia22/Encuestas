import { HugeiconsIcon } from '@hugeicons/react'
import { Globe02Icon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { CampoFecha, RangoDeFechas, type Rango } from '@/modules/design-system/formularios/rango-de-fechas'
import { inicioVencidoEnBorrador } from '../../modelo/inicio-vencido'
import { KIND_VISUAL } from '../../modelo/kindVisual'
import { AvisoEnCurso, EnCurso } from './aviso-en-curso'
import { LIMITE_NOMBRE_ENCUESTA, contador, cortoDeMinimo, mensajeMinimo } from '../../modelo/limites-texto'
import type { Tone } from '../../modelo/tone'
import {
  ANONYMITY_THRESHOLD_MIN,
  MAX_DESCRIPTION_LENGTH,
  SURVEY_KIND_LABELS,
  SURVEY_VISIBILITY_HEADLINES,
  SURVEY_VISIBILITY_LABELS,
  SURVEY_VISIBILITY_NOTES,
  type SurveyDraft,
  type SurveyKind,
  type SurveyVisibility,
} from '../../modelo/surveyBuilderTypes'

// Paso 1 · Datos generales: nombre, tipo, fechas y la decisión que gobierna medio producto, si la
// encuesta es pública o anónima. No hay opción intermedia: o el sistema guarda el vínculo entre
// persona y respuesta, o no lo guarda. Los campos vacíos se marcan en rojo solo después de intentar
// avanzar: un formulario en blanco no debe recibirte con errores.

const OBLIGATORIO = 'Este campo es obligatorio'
// Mismos colores que TEXTO_POR_TONO, con «!» escrito completo para que Tailwind genere cada clase.
const TEXTO_FIJO_POR_TONO: Record<Tone, string> = {
  brand: 'text-primary!',
  positive: 'text-success!',
  warning: 'text-warning!',
  neutral: 'text-muted-foreground!',
  ai: 'text-primary!',
  violet: 'text-info!',
}

const TIPOS = Object.entries(SURVEY_KIND_LABELS) as [SurveyKind, string][]
const VISIBILIDADES = Object.entries(SURVEY_VISIBILITY_LABELS) as [SurveyVisibility, string][]

// El borrador guarda las fechas como `aaaa-mm-dd`; el calendario trabaja con Date.
const aFecha = (valor: string): Date | undefined => {
  if (!valor) return undefined
  const [anio, mes, dia] = valor.split('-').map(Number)
  return anio && mes && dia ? new Date(anio, mes - 1, dia) : undefined
}
const aTexto = (fecha: Date | undefined): string => (fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : '')

// Fechas válidas (CRE-037, Elkin 14-oct): el inicio no puede ser anterior a hoy (esos días salen apagados en el calendario) y
// el cierre no puede ser antes del inicio. Se admite una encuesta de un solo día: inicio y cierre el mismo día, pulsando dos
// veces ese día. El primer clic solo marca el inicio: el rango queda a medias («Desde el…»), no cuenta como completo y,
// al intentar avanzar, se pide el cierre.
const hoy = () => {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  return fecha
}
function siguienteRango(nuevo: Rango, inicio: string, cierre: string): { startDate: string; endDate: string } {
  const desde = aTexto(nuevo?.from)
  const hasta = aTexto(nuevo?.to)
  // El calendario da el mismo día como inicio y cierre al primer clic: solo es un día completo si ese día ya era el
  // inicio a medias (segundo clic sobre él). Si no, es el inicio y falta el cierre.
  if (desde && desde === hasta) return inicio === desde && cierre === '' ? { startDate: desde, endDate: desde } : { startDate: desde, endDate: '' }
  return { startDate: desde, endDate: hasta }
}

// El mismo criterio que Cargar encuestas: dos encuestas con el mismo nombre no se distinguen en la lista, en los
// resultados ni en el comparativo (Elkin, 14-oct).
export const NOMBRE_ENCUESTA_REPETIDO = 'Ya existe una encuesta con este nombre. Cámbialo para distinguirlas en la lista y en los resultados.'

export function PasoGeneral({
  borrador,
  onCambio,
  enCurso = false,
  conErrores,
  descripcionActiva,
  onDescripcionActiva,
  nombreDuplicado = false,
}: {
  borrador: SurveyDraft
  onCambio: (cambio: Partial<SurveyDraft>) => void
  /** La encuesta ya está en curso: la visibilidad (y su mínimo de respuestas) se ve, pero no se cambia. */
  enCurso?: boolean
  /** Ya se intentó avanzar sin completar el paso: se marcan los campos vacíos. */
  conErrores: boolean
  descripcionActiva: boolean
  onDescripcionActiva: (activa: boolean) => void
  /** Otra encuesta ya se llama así (sin contar mayúsculas, tildes ni espacios al borde): se avisa mientras se escribe. */
  nombreDuplicado?: boolean
}) {
  const sinNombre = conErrores && borrador.name.trim() === ''
  // Con algo escrito que no llega al mínimo cuenta como incompleto, igual que vacío, pero con su propio mensaje.
  const nombreCorto = conErrores && cortoDeMinimo(borrador.name, LIMITE_NOMBRE_ENCUESTA.min)
  const faltaNombre = sinNombre || nombreCorto || nombreDuplicado
  const faltaTipo = conErrores && borrador.kind === null
  const sinFechas = conErrores && borrador.startDate === ''
  const sinCierre = conErrores && borrador.startDate !== '' && borrador.endDate === ''
  const cierreAntes = borrador.startDate !== '' && borrador.endDate !== '' && borrador.endDate < borrador.startDate
  // CRE-120: un borrador cuyo inicio ya pasó marca la fecha desde que se abre (el aviso de arriba dice por qué).
  const inicioVencido = !enCurso && inicioVencidoEnBorrador(borrador)
  const faltanFechas = sinFechas || sinCierre || cierreAntes || inicioVencido
  const anonima = borrador.visibility === 'anonymous'
  const rango: Rango = borrador.startDate ? { from: aFecha(borrador.startDate), to: aFecha(borrador.endDate) } : undefined

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Datos generales</FrameTitle>
        <FrameDescription>Cómo se llama la encuesta, qué mide, cuándo corre y si es pública o anónima.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Field data-invalid={faltaNombre || undefined}>
              <FieldLabel htmlFor="encuesta-nombre">Nombre de la encuesta</FieldLabel>
              <Input
                id="encuesta-nombre"
                value={borrador.name}
                maxLength={LIMITE_NOMBRE_ENCUESTA.max}
                onChange={(evento) => onCambio({ name: evento.target.value.slice(0, LIMITE_NOMBRE_ENCUESTA.max) })}
                placeholder="Escribe el nombre de la encuesta"
                aria-invalid={faltaNombre}
              />
              <FieldDescription>{contador(borrador.name.length, LIMITE_NOMBRE_ENCUESTA.max)}</FieldDescription>
              {sinNombre ? <FieldError>{OBLIGATORIO}</FieldError> : null}
              {nombreCorto ? <FieldError>{mensajeMinimo(LIMITE_NOMBRE_ENCUESTA.min)}</FieldError> : null}
              {nombreDuplicado && !nombreCorto ? <FieldError>{NOMBRE_ENCUESTA_REPETIDO}</FieldError> : null}
            </Field>
            {/* «!»: la fila del interruptor a su ancho, no al de la columna; la clase sola no le gana a la librería
                (diferencias.json › instalacion-estilos-sin-capa). */}
            <Field orientation="horizontal" className="w-auto!">
              <Switch
                id="encuesta-con-descripcion"
                checked={descripcionActiva}
                onCheckedChange={(activa) => {
                  onDescripcionActiva(activa)
                  if (!activa) onCambio({ description: '' })
                }}
              />
              <FieldLabel htmlFor="encuesta-con-descripcion">Agregar descripción</FieldLabel>
            </Field>
          </div>

          {descripcionActiva ? (
            <Field>
              <FieldLabel htmlFor="encuesta-descripcion">Descripción</FieldLabel>
              <Textarea
                id="encuesta-descripcion"
                value={borrador.description}
                maxLength={MAX_DESCRIPTION_LENGTH}
                onChange={(evento) => onCambio({ description: evento.target.value.slice(0, MAX_DESCRIPTION_LENGTH) })}
                placeholder="Para qué es esta encuesta y qué esperas aprender de ella"
              />
              <FieldDescription>
                {borrador.description.length} de {MAX_DESCRIPTION_LENGTH} caracteres
              </FieldDescription>
            </Field>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <Field data-invalid={faltaTipo || undefined}>
              <FieldLabel htmlFor="encuesta-tipo">Tipo de encuesta</FieldLabel>
              <Select value={borrador.kind ?? ''} onValueChange={(valor) => onCambio({ kind: valor as SurveyKind })}>
                <SelectTrigger id="encuesta-tipo" aria-invalid={faltaTipo}>
                  <SelectValue placeholder="Selecciona un tipo">{(valor: SurveyKind | '') => SURVEY_KIND_LABELS[valor as SurveyKind] ?? 'Selecciona un tipo'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map(([tipo, etiqueta]) => {
                    const visual = KIND_VISUAL[tipo]
                    return (
                      <SelectItem key={tipo} value={tipo}>
                        <div className="flex items-center gap-2">
                          {/* El ítem resaltado pinta todo su contenido con el color del hover; el icono conserva el de su tipo. */}
                          <IconTile variant="soft" size="xs" className={`${TEXTO_FIJO_POR_TONO[visual.tone]} **:text-inherit!`}>
                            <HugeiconsIcon icon={visual.icon} aria-hidden="true" />
                          </IconTile>
                          {etiqueta}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {faltaTipo ? <FieldError>{OBLIGATORIO}</FieldError> : null}
            </Field>

            {enCurso ? (
              // En curso solo se mueve el cierre (Elkin, 21-oct): el inicio ya pasó y se ve apagado; el cierre, desde hoy.
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="encuesta-inicio">Fecha de inicio</FieldLabel>
                  <EnCurso bloqueado className="flex">
                    <div className="flex-1">
                      <CampoFecha id="encuesta-inicio" valor={aFecha(borrador.startDate)} onCambio={() => undefined} deshabilitado />
                    </div>
                  </EnCurso>
                </Field>
                <Field data-invalid={!borrador.endDate || undefined}>
                  <FieldLabel htmlFor="encuesta-cierre">Fecha de cierre</FieldLabel>
                  <CampoFecha id="encuesta-cierre" valor={aFecha(borrador.endDate)} desde={hoy()} invalido={!borrador.endDate} onCambio={(fecha) => onCambio({ endDate: aTexto(fecha) })} />
                  {borrador.endDate ? null : <FieldError>Elige la fecha de cierre.</FieldError>}
                </Field>
              </div>
            ) : (
            <Field data-invalid={faltanFechas || undefined}>
              <FieldLabel htmlFor="encuesta-fechas">Fecha de inicio y de cierre</FieldLabel>
              {/* En curso ya empezó: su inicio puede ser pasado. Si no, desde hoy. */}
              <RangoDeFechas id="encuesta-fechas" valor={rango} invalido={faltanFechas} placeholder="Selecciona las fechas" desde={enCurso ? undefined : hoy()} onCambio={(nuevo) => onCambio(siguienteRango(nuevo, borrador.startDate, borrador.endDate))} />
              {sinFechas ? <FieldError>Elige cuándo empieza y cuándo cierra la encuesta.</FieldError> : null}
              {sinCierre ? <FieldError>Elige también la fecha de cierre. Si la encuesta dura un solo día, pulsa otra vez el mismo día.</FieldError> : null}
              {cierreAntes ? <FieldError>La fecha de cierre no puede ser anterior a la de inicio.</FieldError> : null}
              {inicioVencido ? <FieldError>La fecha de inicio ya pasó. Elige fechas desde hoy para programarla.</FieldError> : null}
              {!faltanFechas && borrador.startDate !== '' && borrador.startDate === borrador.endDate ? <FieldDescription>Encuesta de un solo día: abre y cierra el mismo día.</FieldDescription> : null}
            </Field>
            )}
          </div>

          {enCurso ? <AvisoEnCurso que="El tipo de visibilidad y su mínimo de respuestas" /> : null}
          <FieldSet>
            <FieldLegend variant="label">Tipo de visibilidad</FieldLegend>
            <RadioGroup value={borrador.visibility} disabled={enCurso} onValueChange={(valor) => onCambio({ visibility: valor as SurveyVisibility })} className={`grid gap-3 md:grid-cols-2 ${enCurso ? 'opacity-60' : ''}`}>
              {VISIBILIDADES.map(([visibilidad, etiqueta]) => (
                <EnCurso key={visibilidad} bloqueado={enCurso} className="flex">
                <FieldLabel htmlFor={`encuesta-visibilidad-${visibilidad}`}>
                  {/* «!»: radio, icono y título centrados en la fila; la clase sola no le gana a la librería (diferencias.json ›
                      instalacion-estilos-sin-capa). Lo mismo con la fila del título y su ayuda (flex-row!). */}
                  <Field orientation="horizontal" className="items-center!">
                    <RadioGroupItem value={visibilidad} id={`encuesta-visibilidad-${visibilidad}`} />
                    <IconTile variant="soft" size="sm" className="shrink-0 text-primary">
                      <HugeiconsIcon icon={visibilidad === 'public' ? Globe02Icon : ViewOffSlashIcon} aria-hidden="true" />
                    </IconTile>
                    {/* Sin descripción en la tarjeta: lo que promete cada opción va en la ayuda (i), que abre con clic. */}
                    <FieldContent className="flex-row! items-center gap-1">
                      <FieldTitle>{etiqueta}</FieldTitle>
                      <BotonAyuda etiqueta={`Qué significa ${etiqueta.toLowerCase()}`}>
                        <span className="font-medium">{SURVEY_VISIBILITY_HEADLINES[visibilidad]}</span> {SURVEY_VISIBILITY_NOTES[visibilidad]}
                      </BotonAyuda>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                </EnCurso>
              ))}
            </RadioGroup>
          </FieldSet>

          {anonima ? (
            <Field>
              <FieldLabel htmlFor="encuesta-minimo">Mínimo de respuestas por grupo</FieldLabel>
              <div className="flex items-center gap-4">
                <EnCurso bloqueado={enCurso} className="flex-1">
                <div className={enCurso ? 'flex-1 opacity-60' : 'flex-1'}>
                  <Slider id="encuesta-minimo" disabled={enCurso} value={[borrador.anonymityThreshold]} min={3} max={30} step={1} onValueChange={(valor) => onCambio({ anonymityThreshold: Array.isArray(valor) ? valor[0] : valor })} />
                </div>
                </EnCurso>
                <Text size="sm" weight="medium" className="w-8 tabular-nums">
                  {borrador.anonymityThreshold}
                </Text>
                <Text as="span" variant="muted" size="sm">
                  respuestas
                </Text>
              </div>
              <FieldDescription>
                Un grupo solo verá sus resultados cuando al menos {borrador.anonymityThreshold} personas hayan respondido. El mínimo es {ANONYMITY_THRESHOLD_MIN}: con menos, cada participante podría deducir la respuesta del otro.
              </FieldDescription>
            </Field>
          ) : null}
        </div>
      </FramePanel>
    </Frame>
  )
}
