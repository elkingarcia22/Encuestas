import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  InformationCircleIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Checkbox,
  Field,
  FieldLabel,
  FieldTitle,
  Input,
  Item,
  RadioGroup,
  Rating,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import type { Pregunta, TipoPregunta } from '../borrador'
import { EditorTexto } from '../editor-texto'
import {
  CARAS,
  MAX_OPCIONES,
  NPS_MAXIMO,
  NPS_MINIMO,
  ayudaDe,
  cambiarTipo,
  etiquetaDe,
  faltaEnPregunta,
  tipoDe,
  tiposDe,
} from './logica'

// Tarjeta de una pregunta del editor de evaluación. Hay una sola en edición (la activa); las demás se leen y se abren
// con un clic. El menú de tres puntos mueve la pregunta o pide eliminarla (lo confirma el editor).

export type AccionPregunta = 'subir' | 'bajar' | 'eliminar'

type Props = {
  numero: number
  pregunta: Pregunta
  /** En una encuesta se ofrecen dos tipos más y «Pregunta corta» se llama «Texto abierto». */
  encuesta?: boolean
  onCambio: (pregunta: Pregunta) => void
  /** Se intentó guardar esta pregunta incompleta: lo que falta se marca en rojo y se dice debajo. */
  conErrores?: boolean
  /** Sube en cada intento fallido: vuelve a enfocar lo que falta aunque ya estuviera marcado. */
  intento?: number
}

/**
 * **El formulario de una pregunta**, y nada más.
 *
 * El marco, el asa, el icono del tipo, el número y el menú los pone **la fila del árbol de secciones**, que es quien
 * sabe dónde está la pregunta y cómo se reordena. Hasta el 9-oct esta pieza traía además una cabecera propia que ya
 * no montaba nadie: sobrevivía solo como camino muerto. Se quitó para que haya **una sola** cabecera (Dave, 9-oct).
 */
export function TarjetaPregunta({ numero, pregunta, encuesta = false, onCambio, conErrores = false, intento = 0 }: Props) {
  // Editar una pregunta la saca de «generada con IA».
  const cambiar = (cambio: Partial<Pregunta>) => onCambio({ ...pregunta, ...cambio, generadaConIA: false })

  return (
    <div className="flex flex-col gap-4 px-2 pb-2" data-pregunta-id={pregunta.id} aria-label={`Pregunta ${numero}`}>
      <Edicion pregunta={pregunta} encuesta={encuesta} cambiar={cambiar} onCambio={onCambio} conErrores={conErrores} intento={intento} />
    </div>
  )
}

// ── Edición ──────────────────────────────────────────────────────────────────────────────────────────────────────

type EdicionProps = {
  pregunta: Pregunta
  cambiar: (cambio: Partial<Pregunta>) => void
  onCambio: (pregunta: Pregunta) => void
}

function Edicion({
  pregunta,
  encuesta = false,
  cambiar,
  onCambio,
  conErrores = false,
  intento = 0,
}: EdicionProps & { encuesta?: boolean; conErrores?: boolean; intento?: number }) {
  // Lo que falta, **solo después de intentar guardar**: marcarlo desde el primer momento es regañar antes de tiempo.
  const falta = conErrores ? faltaEnPregunta(pregunta) : []
  const campoEnunciado = useRef<HTMLTextAreaElement>(null)
  // En cada intento fallido, el cursor vuelve al enunciado, que es lo primero que suele faltar.
  useEffect(() => {
    if (intento > 0 && falta.length > 0) campoEnunciado.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento])
  const id = useId()
  const ayuda = ayudaDe(pregunta, encuesta)

  return (
    <>
      <Field>
        <FieldLabel htmlFor={`${id}-tipo`}>Tipo de pregunta</FieldLabel>
        <Select
          value={pregunta.tipo}
          onValueChange={(valor) => {
            if (valor) onCambio({ ...cambiarTipo(pregunta, valor as TipoPregunta), generadaConIA: false })
          }}
        >
          <SelectTrigger id={`${id}-tipo`} className="w-full">
            {/* El tipo elegido lleva su icono, igual que en la lista: si el icono solo sale al abrir el menú, no
                ayuda a reconocer de un vistazo qué clase de pregunta es esta (Dave, 9-oct).
                El nombre es el que le toca aquí: «Pregunta corta» en una evaluación, «Texto abierto» en una encuesta. */}
            <SelectValue>
              {(valor: TipoPregunta) => (
                <span className="flex min-w-0 items-center gap-2">
                  <HugeiconsIcon icon={tipoDe(valor).icono} size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{etiquetaDe(valor, encuesta)}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {tiposDe(encuesta).map((t) => (
              <SelectItem key={t.valor} value={t.valor}>
                <HugeiconsIcon icon={t.icono} size={16} aria-hidden="true" />
                {t.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {pregunta.tipo !== 'instruction' ? (
        <Field data-invalid={conErrores && !pregunta.enunciado.trim() ? 'true' : undefined}>
          <FieldLabel htmlFor={`${id}-enunciado`}>Pregunta o enunciado</FieldLabel>
          <Textarea
            ref={campoEnunciado}
            id={`${id}-enunciado`}
            rows={2}
            value={pregunta.enunciado}
            aria-invalid={conErrores && !pregunta.enunciado.trim() ? true : undefined}
            placeholder={pregunta.tipo === 'fill_blank' ? 'Oración a completar' : 'Escribe la pregunta aquí...'}
            onChange={(e) => cambiar({ enunciado: e.target.value })}
          />
        </Field>
      ) : null}

      {/**
       * **Un solo aviso, que cambia de cara.** Mientras se escribe dice en azul qué pide este tipo de pregunta; si
       * se intenta guardar y falta algo, el mismo aviso se vuelve rojo y dice qué falta. Antes eran dos cosas
       * distintas —una línea de texto gris con su icono y, encima, un error aparte— y la instrucción se leía como
       * letra pequeña (Dave, 9-oct).
       */}
      {falta.length > 0 || ayuda ? (
        <Alert variant={falta.length > 0 ? 'destructive' : 'info'}>
          <HugeiconsIcon icon={falta.length > 0 ? AlertCircleIcon : InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>{falta.length > 0 ? `Para guardar falta ${falta.join(', ')}.` : ayuda}</AlertDescription>
        </Alert>
      ) : null}

      <EdicionPorTipo id={id} pregunta={pregunta} encuesta={encuesta} cambiar={cambiar} conErrores={conErrores} />
    </>
  )
}

/**
 * **«Así lo verá el estudiante».** La muestra del editor: el mismo control que verá quien responda, sobre gris y
 * **tocable** —se puede marcar una opción para ver cómo queda—. Lo que se marque aquí no se guarda en la pregunta.
 * Es la misma muestra que tiene el creador de encuestas de Desempeño y cultura (Dave, 9-oct).
 */
function MuestraEstudiante({ children }: { children: (valor: string, elegir: (v: string) => void) => ReactNode }) {
  const [valor, setValor] = useState('')
  return (
    <Item variant="muted" className="flex-col items-stretch! gap-3">
      <Text as="p" size="xs" variant="muted">
        Así lo verá el estudiante
      </Text>
      {children(valor, setValor)}
    </Item>
  )
}

function EdicionPorTipo({
  id,
  pregunta,
  encuesta,
  cambiar,
  conErrores = false,
}: {
  id: string
  pregunta: Pregunta
  encuesta: boolean
  cambiar: (cambio: Partial<Pregunta>) => void
  /** Se intentó guardar incompleta: **cada campo que falta se marca**, no solo el enunciado (Dave, 9-oct). */
  conErrores?: boolean
}) {
  const t = pregunta.tipo
  // Un campo vacío solo se marca después de intentar guardar.
  const malo = (vacio: boolean) => (conErrores && vacio ? true : undefined)

  if (t === 'instruction') {
    return (
      <EditorTexto
        id={`${id}-instruccion`}
        basico
        alto={120}
        valor={pregunta.instruccion}
        placeholder="Escribe una instrucción para el colaborador..."
        onCambio={(html) => cambiar({ instruccion: html })}
      />
    )
  }

  if (t === 'true_false') {
    return (
      <RadioGroup
        value={encuesta ? null : pregunta.verdaderoFalso || null}
        onValueChange={encuesta ? undefined : (v) => cambiar({ verdaderoFalso: String(v) })}
        // En una encuesta no se marca ninguna: las dos opciones están ahí para enseñar cómo se verá, no para
        // señalar cuál es la buena (Creator real, 7-oct).
        disabled={encuesta}
        aria-label={encuesta ? 'Opciones de respuesta' : 'Respuesta correcta'}
      >
        {[
          { valor: 'true', etiqueta: 'Verdadero' },
          { valor: 'false', etiqueta: 'Falso' },
        ].map((o) => (
          <Field key={o.valor} orientation="horizontal" data-disabled={encuesta ? 'true' : undefined}>
            <RadioGroupItem value={o.valor} id={`${id}-vf-${o.valor}`} />
            <FieldLabel htmlFor={`${id}-vf-${o.valor}`}>
              {o.etiqueta}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    )
  }

  if (t === 'multiple_choice_single' || t === 'multiple_choice_multiple' || t === 'dropdown') {
    const multiple = t === 'multiple_choice_multiple'
    /* La lista desplegable son las mismas opciones, **sin marca de correcta**: solo en encuestas, donde no se
       califica. Se edita con esta misma fila para que añadir y quitar opciones se haga igual en los tres. */
    const sinMarca = t === 'dropdown'
    const opciones = pregunta.opciones
    const texto = (i: number, valor: string) => cambiar({ opciones: opciones.map((o, j) => (j === i ? { ...o, texto: valor } : o)) })
    const marcar = (i: number, marcada: boolean) =>
      cambiar({
        opciones: opciones.map((o, j) => (multiple ? (j === i ? { ...o, correcta: marcada } : o) : { ...o, correcta: j === i })),
      })
    const quitar = (i: number) => opciones.length > 2 && cambiar({ opciones: opciones.filter((_, j) => j !== i) })

    const filas = opciones.map((o, i) => (
      <div key={i} className="flex items-center gap-3">
        {/* La marca de «correcta» solo tiene sentido donde se califica: en una encuesta se ve apagada, como en
            producción, para que se entienda la forma de la pregunta sin pedir una respuesta buena. */}
        {sinMarca ? null : multiple ? (
          <Checkbox
            checked={!encuesta && o.correcta}
            disabled={encuesta}
            onCheckedChange={encuesta ? undefined : (v) => marcar(i, v)}
            aria-label={encuesta ? `Opción ${i + 1}` : `Marcar la opción ${i + 1} como correcta`}
          />
        ) : (
          <RadioGroupItem value={String(i)} disabled={encuesta} aria-label={encuesta ? `Opción ${i + 1}` : `Marcar la opción ${i + 1} como correcta`} />
        )}
        <Input
          value={o.texto}
          placeholder="Opción de respuesta"
          aria-label={`Opción de respuesta ${i + 1}`}
          aria-invalid={malo(!o.texto.trim())}
          onChange={(e) => texto(i, e.target.value)}
          // Las flechas se quedan en el campo: si no, el grupo de radios las toma para moverse y cambia la correcta.
          onKeyDown={(e) => e.stopPropagation()}
          className="min-w-0 flex-1"
        />
        {/* Igual que los objetivos del roleplay: papelera en rojo, siempre visible, y en el mínimo queda
            deshabilitada explicando por qué. El `span` recibe el cursor, que un botón apagado no lo hace. */}
        <Hint label={opciones.length > 2 ? 'Quitar opción' : 'Se necesitan al menos dos opciones'}>
          <span className="inline-flex">
            <BotonIcono
              aria-label={opciones.length > 2 ? `Quitar la opción ${i + 1}` : 'No se puede quitar: se necesitan al menos dos opciones'}
              disabled={opciones.length <= 2}
              onClick={() => quitar(i)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} className="text-destructive" />
            </BotonIcono>
          </span>
        </Hint>
      </div>
    ))

    const correcta = opciones.findIndex((o) => o.correcta)
    return (
      <>
        {sinMarca || multiple ? (
          <div className="flex flex-col gap-3">{filas}</div>
        ) : (
          <RadioGroup
            value={encuesta || correcta < 0 ? null : String(correcta)}
            onValueChange={encuesta ? undefined : (v) => marcar(Number(v), true)}
            disabled={encuesta}
            aria-label={encuesta ? 'Opciones de respuesta' : 'Opción correcta'}
            className="gap-3"
          >
            {filas}
          </RadioGroup>
        )}
        <div>
          <Button
            variant="outline"
            size="xs"
            disabled={opciones.length >= MAX_OPCIONES}
            onClick={() => cambiar({ opciones: [...opciones, { texto: '', correcta: false }] })}
          >
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            Añadir opción
          </Button>
        </div>
      </>
    )
  }

  if (t === 'short_answer') {
    const r = pregunta.respuestaCorta
    // En una encuesta es «Texto abierto»: se pregunta y punto. No hay respuesta correcta que escribir ni exactitud
    // que ajustar, porque no se califica (Creator real, 7-oct).
    if (encuesta) return null
    return (
      <>
        <Field data-invalid={malo(!r.respuesta.trim()) ? 'true' : undefined}>
          <FieldLabel htmlFor={`${id}-corta`}>Escribe la respuesta correcta</FieldLabel>
          <Input
            id={`${id}-corta`}
            value={r.respuesta}
            placeholder="Respuesta correcta..."
            aria-invalid={malo(!r.respuesta.trim())}
            onChange={(e) => cambiar({ respuestaCorta: { ...r, respuesta: e.target.value } })}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <FieldTitle id={`${id}-exactitud`}>Define la exactitud de la respuesta</FieldTitle>
          <RadioGroup
            aria-labelledby={`${id}-exactitud`}
            value={r.exactitud}
            onValueChange={(v) => cambiar({ respuestaCorta: { ...r, exactitud: v as typeof r.exactitud } })}
          >
            {(
              [
                { valor: 'exact', etiqueta: 'Exacta' },
                { valor: 'ignore_accents', etiqueta: 'Ignorar acentos' },
                { valor: 'any', etiqueta: 'Cualquier respuesta' },
              ] as const
            ).map((o) => (
              <Field key={o.valor} orientation="horizontal">
                <RadioGroupItem value={o.valor} id={`${id}-exactitud-${o.valor}`} />
                <FieldLabel htmlFor={`${id}-exactitud-${o.valor}`}>
                  {o.etiqueta}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </div>
      </>
    )
  }

  if (t === 'essay') {
    return (
      <Field>
        <FieldLabel htmlFor={`${id}-palabras`}>
          Número mínimo de palabras
          <Badge variant="secondary" size="xs">
            Opcional
          </Badge>
        </FieldLabel>
        <Input
          id={`${id}-palabras`}
          type="number"
          min={1}
          max={100}
          value={pregunta.ensayo.minimoPalabras}
          onChange={(e) => cambiar({ ensayo: { minimoPalabras: e.target.value } })}
          className="sm:max-w-60"
        />
        <Text as="p" size="xs" variant="muted">
          Ingresa un número entre 1 y 100 para el mínimo de palabras.
        </Text>
      </Field>
    )
  }

  if (t === 'matching') {
    const parejas = pregunta.parejas
    const escribir = (i: number, lado: 'a' | 'b', valor: string) =>
      cambiar({ parejas: parejas.map((p, j) => (j === i ? { ...p, [lado]: valor } : p)) })
    return (
      <>
        {parejas.map((p, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Text as="span" size="xs" weight="semibold">
                Pareja {i + 1}
              </Text>
              <Hint label={parejas.length > 2 ? 'Quitar pareja' : 'Se necesitan al menos dos parejas'}>
                <span className="inline-flex">
                  <BotonIcono
                    aria-label={parejas.length > 2 ? `Quitar la pareja ${i + 1}` : 'No se puede quitar: se necesitan al menos dos parejas'}
                    disabled={parejas.length <= 2}
                    onClick={() => parejas.length > 2 && cambiar({ parejas: parejas.filter((_, j) => j !== i) })}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} className="text-destructive" />
                  </BotonIcono>
                </span>
              </Hint>
            </div>
            {/* Se marca el lado que falta: una pareja a medias no se puede calificar. Las dos primeras hacen falta
                siempre; de la tercera en adelante, solo si una se dejó a medias. */}
            <Input
              value={p.a}
              placeholder="Escribe una opción"
              aria-label={`Opción de la pareja ${i + 1}`}
              aria-invalid={malo(!p.a.trim() && (i < 2 || Boolean(p.b.trim())))}
              onChange={(e) => escribir(i, 'a', e.target.value)}
            />
            <Input
              value={p.b}
              placeholder="Escribe su par"
              aria-label={`Par de la pareja ${i + 1}`}
              aria-invalid={malo(!p.b.trim() && (i < 2 || Boolean(p.a.trim())))}
              onChange={(e) => escribir(i, 'b', e.target.value)}
            />
          </div>
        ))}
        <div>
          <Button variant="outline" size="xs" onClick={() => cambiar({ parejas: [...parejas, { a: '', b: '' }] })}>
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            Añadir pareja
          </Button>
        </div>
      </>
    )
  }

  if (t === 'fill_blank') {
    const opciones = pregunta.palabraFaltante.opciones
    const poner = (siguiente: string[]) => cambiar({ palabraFaltante: { opciones: siguiente } })
    return (
      <>
        <div className="flex flex-col gap-3">
          {opciones.map((texto, i) => (
            <div key={i} className="flex items-center gap-3">
              <Badge variant="secondary" className="shrink-0 tabular-nums">{`{{${i + 1}}}`}</Badge>
              <Input
                value={texto}
                placeholder="Opción de respuesta"
                aria-label={`Opción de respuesta ${i + 1}`}
                // La primera es la que de verdad hace falta: sin ella el hueco no tiene respuesta.
                aria-invalid={malo(i === 0 && !opciones.some((o) => o.trim()))}
                onChange={(e) => poner(opciones.map((o, j) => (j === i ? e.target.value : o)))}
                className="min-w-0 flex-1"
              />
              <Hint label={opciones.length > 2 ? 'Quitar opción' : 'Se necesitan al menos dos opciones'}>
                <span className="inline-flex">
                  <BotonIcono
                    aria-label={opciones.length > 2 ? `Quitar la opción ${i + 1}` : 'No se puede quitar: se necesitan al menos dos opciones'}
                    disabled={opciones.length <= 2}
                    onClick={() => opciones.length > 2 && poner(opciones.filter((_, j) => j !== i))}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} className="text-destructive" />
                  </BotonIcono>
                </span>
              </Hint>
            </div>
          ))}
        </div>
        <div>
          <Button variant="outline" size="xs" onClick={() => poner([...opciones, ''])}>
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            Añadir opción
          </Button>
        </div>
      </>
    )
  }

  /* **Las cuatro escalas se configuran igual**: primero lo que las define (sus valores), después los extremos
     escritos y, al final, la muestra de cómo queda. La muestra va siempre la última porque es la consecuencia de lo
     de arriba: con el ejemplo encima, se cambiaba una etiqueta y había que subir la vista para ver el efecto
     (Dave, 9-oct). Es el orden del creador de encuestas de Desempeño y cultura. */

  // Estrellas: cuántas y los extremos; el resto lo pone el tipo.
  if (t === 'rating_stars') {
    const e = pregunta.escala
    const poner = (cambio: Partial<typeof e>) => cambiar({ escala: { ...e, ...cambio } })
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-etq-min-estrellas`}>
              Etiqueta mínimo
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </FieldLabel>
            <Input id={`${id}-etq-min-estrellas`} value={e.etiquetaMinimo} placeholder="Ej: Muy malo" onChange={(ev) => poner({ etiquetaMinimo: ev.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-etq-max-estrellas`}>
              Etiqueta máximo
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </FieldLabel>
            <Input id={`${id}-etq-max-estrellas`} value={e.etiquetaMaximo} placeholder="Ej: Excelente" onChange={(ev) => poner({ etiquetaMaximo: ev.target.value })} />
          </Field>
        </div>
        <Field className="sm:w-56">
          <FieldLabel htmlFor={`${id}-estrellas`}>Número de estrellas</FieldLabel>
          <SelectorNumero id={`${id}-estrellas`} desde={2} hasta={MAX_ESCALA} valor={e.maximo} onCambio={(v) => poner({ maximo: v })} />
        </Field>
        <MuestraEstudiante>
          {(valor, elegir) => <EscalaEstrellas cantidad={Number(e.maximo) || 5} escala={e} valor={valor} onElegir={elegir} />}
        </MuestraEstudiante>
      </div>
    )
  }

  // Recomendabilidad: de 0 a 10 siempre; lo único ajustable son los extremos escritos.
  if (t === 'nps') {
    const e = pregunta.escala
    const poner = (cambio: Partial<typeof e>) => cambiar({ escala: { ...e, ...cambio } })
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-nps-min`}>
              Etiqueta del 0
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </FieldLabel>
            <Input id={`${id}-nps-min`} value={e.etiquetaMinimo} placeholder="Ej: Nada probable" onChange={(ev) => poner({ etiquetaMinimo: ev.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-nps-max`}>
              Etiqueta del 10
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </FieldLabel>
            <Input id={`${id}-nps-max`} value={e.etiquetaMaximo} placeholder="Ej: Muy probable" onChange={(ev) => poner({ etiquetaMaximo: ev.target.value })} />
          </Field>
        </div>
        <MuestraEstudiante>{(valor, elegir) => <EscalaNps escala={e} valor={valor} onElegir={elegir} />}</MuestraEstudiante>
      </div>
    )
  }

  // Caras: las cinco son fijas; lo que se escribe son los extremos, que es lo que dice hacia dónde va la escala.
  if (t === 'emoji') {
    const e = pregunta.escala
    const poner = (cambio: Partial<typeof e>) => cambiar({ escala: { ...e, ...cambio } })
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-emoji-min`}>
              Etiqueta mínimo
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </FieldLabel>
            <Input id={`${id}-emoji-min`} value={e.etiquetaMinimo} placeholder="Ej: Muy insatisfecho" onChange={(ev) => poner({ etiquetaMinimo: ev.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-emoji-max`}>
              Etiqueta máximo
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </FieldLabel>
            <Input id={`${id}-emoji-max`} value={e.etiquetaMaximo} placeholder="Ej: Muy satisfecho" onChange={(ev) => poner({ etiquetaMaximo: ev.target.value })} />
          </Field>
        </div>
        <MuestraEstudiante>{(valor, elegir) => <EscalaCaras escala={e} valor={valor} onElegir={elegir} />}</MuestraEstudiante>
      </div>
    )
  }

  if (t === 'rating_scale') {
    const e = pregunta.escala
    const poner = (cambio: Partial<typeof e>) => cambiar({ escala: { ...e, ...cambio } })
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-min`}>Valor mínimo</FieldLabel>
            <SelectorNumero id={`${id}-min`} desde={1} hasta={MAX_ESCALA - 1} valor={e.minimo} onCambio={(v) => poner({ minimo: v })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-max`}>Valor máximo</FieldLabel>
            <SelectorNumero id={`${id}-max`} desde={2} hasta={MAX_ESCALA} valor={e.maximo} onCambio={(v) => poner({ maximo: v })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-etq-min`}>Etiqueta mínimo</FieldLabel>
            <Input
              id={`${id}-etq-min`}
              value={e.etiquetaMinimo}
              placeholder="Ej: Muy malo"
              aria-invalid={malo(!e.etiquetaMinimo.trim())}
              onChange={(ev) => poner({ etiquetaMinimo: ev.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-etq-max`}>Etiqueta máximo</FieldLabel>
            <Input
              id={`${id}-etq-max`}
              value={e.etiquetaMaximo}
              placeholder="Ej: Excelente"
              aria-invalid={malo(!e.etiquetaMaximo.trim())}
              onChange={(ev) => poner({ etiquetaMaximo: ev.target.value })}
            />
          </Field>
        </div>
        <MuestraEstudiante>
          {(valor, elegir) => <EscalaNumerica minimo={Number(e.minimo) || 1} maximo={Number(e.maximo) || 5} escala={e} valor={valor} onElegir={elegir} />}
        </MuestraEstudiante>
      </div>
    )
  }

  return null
}


/**
 * Los extremos de una escala y el número de estrellas se **eligen de una lista**, no se escriben: así nadie pone una
 * escala de 1 a 300. El tope es **10**, el mismo del Creator de producción —la escala numérica va de 1-9 hasta 2-10 y
 * las estrellas, de 2 a 10— (Dave, 7-oct).
 */
const MAX_ESCALA = 10

function SelectorNumero({ id, desde, hasta, valor, onCambio }: { id: string; desde: number; hasta: number; valor: string; onCambio: (v: string) => void }) {
  const valores = Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) => String(desde + i))
  return (
    <Select value={valores.includes(valor) ? valor : null} onValueChange={(v) => onCambio(String(v ?? ''))}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Elige" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {valores.map((v) => (
          <SelectItem key={v} value={v}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Lectura ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * **Las respuestas de una pregunta cerrada, en letra pequeña**, debajo de su enunciado en la lista del editor. Buena
 * parte de las evaluaciones las escribe la IA, y quien crea tiene que poder repasar qué opciones puso y cuál marcó
 * como correcta **sin abrir pregunta por pregunta** (el jefe de Dave, 14-oct). No es la vista del estudiante: sin
 * radios ni casillas, una línea por opción y la correcta con su visto, para que veinte preguntas no se vuelvan una
 * pared. En el creador de encuestas de Elkin no hace falta, porque ahí cada quien escribe sus preguntas.
 */
export function RespuestasEnLectura({ pregunta, encuesta = false }: { pregunta: Pregunta; encuesta?: boolean }) {
  const t = pregunta.tipo
  const conCorrecta = !encuesta

  const opcion = (texto: string, correcta: boolean, clave: string | number) => (
    <li key={clave} className="flex items-start gap-1.5">
      {/* El visto en círculo de la correcta, el que usa el resto del proyecto para «listo»: el visto suelto, a este
          tamaño, casi no se veía (el jefe de Dave, 14-oct). Las demás dejan su hueco para que los textos queden
          alineados. */}
      {correcta ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} aria-hidden="true" className="mt-px shrink-0 text-success" />
      ) : (
        <span aria-hidden="true" className="size-3.5 shrink-0" />
      )}
      <Text as="span" size="xs" variant={correcta ? undefined : 'muted'} weight={correcta ? 'medium' : undefined} className="min-w-0">
        {texto.trim() || '—'}
        {correcta ? <span className="sr-only"> (respuesta correcta)</span> : null}
      </Text>
    </li>
  )
  const lista = (hijos: ReactNode) => <ul className="flex flex-col gap-0.5">{hijos}</ul>
  const linea = (texto: ReactNode) => (
    <Text as="p" size="xs" variant="muted">
      {texto}
    </Text>
  )

  if (t === 'multiple_choice_single' || t === 'multiple_choice_multiple' || t === 'dropdown')
    return lista(pregunta.opciones.map((o, i) => opcion(o.texto, conCorrecta && o.correcta, i)))
  if (t === 'true_false')
    return lista(
      [
        { valor: 'true', etiqueta: 'Verdadero' },
        { valor: 'false', etiqueta: 'Falso' },
      ].map((o) => opcion(o.etiqueta, conCorrecta && pregunta.verdaderoFalso === o.valor, o.valor)),
    )
  if (t === 'short_answer') return conCorrecta ? lista(opcion(pregunta.respuestaCorta.respuesta, true, 0)) : null
  if (t === 'fill_blank')
    return lista(pregunta.palabraFaltante.opciones.map((palabra, i) => opcion(`Hueco ${i + 1}: ${palabra.trim() || '—'}`, conCorrecta, i)))
  if (t === 'matching')
    return lista(
      pregunta.parejas.map((par, i) => (
        // El concepto, la flecha y su pareja en la misma fila: la pareja suele ser una definición larga y, si bajaba
        // sola de renglón, la flecha se quedaba colgando.
        // Sin el hueco del visto: aquí no hay opción correcta que marcar, así que la pareja arranca al borde.
        <li key={i} className="flex items-start gap-1.5">
          <Text as="span" size="xs" weight="medium" className="max-w-[40%] shrink-0">
            {par.a.trim() || '—'}
          </Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} aria-label="se empareja con" className="mt-0.5 shrink-0 text-muted-foreground" />
          <Text as="span" size="xs" variant="muted" className="min-w-0 flex-1">
            {par.b.trim() || '—'}
          </Text>
        </li>
      )),
    )
  if (t === 'essay')
    return linea(pregunta.ensayo.minimoPalabras.trim() ? `Respuesta abierta, de mínimo ${pregunta.ensayo.minimoPalabras.trim()} palabras` : 'Respuesta abierta, sin mínimo de palabras')

  // Las escalas no tienen respuesta correcta: se cuenta de qué a qué va, con sus extremos escritos si los hay.
  const extremos = [pregunta.escala.etiquetaMinimo.trim(), pregunta.escala.etiquetaMaximo.trim()].filter(Boolean).join(' – ')
  const conExtremos = (base: string) => (extremos ? `${base} · ${extremos}` : base)
  if (t === 'rating_scale') return linea(conExtremos(`Escala de ${Number(pregunta.escala.minimo) || 1} a ${Number(pregunta.escala.maximo) || 5}`))
  if (t === 'rating_stars') return linea(conExtremos(`${Number(pregunta.escala.maximo) || 5} estrellas`))
  if (t === 'nps') return linea(conExtremos(`Escala de ${NPS_MINIMO} a ${NPS_MAXIMO}`))
  if (t === 'emoji') return linea(`Cinco caras, de «${CARAS[0].etiqueta}» a «${CARAS[CARAS.length - 1].etiqueta}»`)
  return null
}


/**
 * ── Las escalas, montadas ────────────────────────────────────────────────────────────────────────────────────────
 *
 * Mismo reparto que en el creador de encuestas de Desempeño y cultura (Dave, 9-oct): cada paso es un botón del mismo
 * ancho, así la escala se lee **como una regla** y no como botones sueltos, y los extremos escritos van debajo en
 * letra pequeña. Sus piezas no son públicas, así que aquí está armado con los mismos componentes de la librería.
 *
 * Se usan en los dos sitios: en la muestra del editor («Así lo verá el estudiante») y en la vista del colaborador.
 * Sin `onElegir` se ven pero no se tocan.
 */

/** El paso elegido toma el color de marca. */
const PASO_ELEGIDO = 'data-pressed:border-primary! data-pressed:bg-primary/10! data-pressed:text-primary!'

type Paso = { valor: string; nombre: string; contenido: ReactNode; tono?: string }

function Extremos({ min, max }: { min: string; max: string }) {
  if (!min.trim() && !max.trim()) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <Text as="span" size="xs" variant="muted">
        {min.trim()}
      </Text>
      <Text as="span" size="xs" variant="muted" className="text-right">
        {max.trim()}
      </Text>
    </div>
  )
}

function Pasos({
  pasos,
  valor,
  onElegir,
  etiqueta,
  apretado = false,
}: {
  pasos: readonly Paso[]
  valor?: string
  onElegir?: (v: string) => void
  etiqueta: string
  /** Muchos pasos (los once del NPS): en el teléfono bajan a dos filas en vez de encogerse hasta no leerse. */
  apretado?: boolean
}) {
  return (
    <ToggleGroup
      aria-label={etiqueta}
      variant="outline"
      size="lg"
      spacing={2}
      disabled={!onElegir}
      value={valor ? [valor] : []}
      onValueChange={onElegir ? (elegidos) => onElegir((elegidos as string[])[0] ?? '') : undefined}
      className={apretado ? 'grid w-full grid-cols-6 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none' : 'grid w-full auto-cols-fr grid-flow-col'}
    >
      {pasos.map((paso) => (
        <ToggleGroupItem key={paso.valor} value={paso.valor} aria-label={paso.nombre} className={cn('h-auto min-h-10 w-full whitespace-normal', paso.tono ?? PASO_ELEGIDO)}>
          {paso.contenido}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** **Recomendabilidad**: del 0 al 10, con sus extremos escritos. Los once valores, siempre. */
export function EscalaNps({ escala, valor, onElegir }: { escala: Pregunta['escala']; valor?: string; onElegir?: (v: string) => void }) {
  return (
    <EscalaNumerica
      minimo={NPS_MINIMO}
      maximo={NPS_MAXIMO}
      // Los extremos del NPS nunca van en blanco: sin ellos, «0» y «10» no dicen hacia dónde va la escala.
      escala={{ ...escala, etiquetaMinimo: escala.etiquetaMinimo.trim() || 'Nada probable', etiquetaMaximo: escala.etiquetaMaximo.trim() || 'Muy probable' }}
      valor={valor}
      onElegir={onElegir}
    />
  )
}

/**
 * **La escala de emociones**: cinco caras, de peor a mejor, cada una con su color al elegirse. El nombre de cada
 * cara lo oye quien usa lector de pantalla; en pantalla lo que orienta son los extremos escritos.
 */
export function EscalaCaras({ escala, valor, onElegir }: { escala?: Pregunta['escala']; valor?: string; onElegir?: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Pasos
        etiqueta="Elige una cara"
        valor={valor}
        onElegir={onElegir}
        pasos={CARAS.map((cara, i) => ({
          valor: String(i + 1),
          nombre: cara.etiqueta,
          tono: cara.tono,
          contenido: <HugeiconsIcon icon={cara.icono} size={26} aria-hidden="true" />,
        }))}
      />
      <Extremos min={escala?.etiquetaMinimo ?? ''} max={escala?.etiquetaMaximo ?? ''} />
    </div>
  )
}

/** **La escala numérica**: un botón por valor, todos del mismo ancho, y los extremos escritos debajo. */
export function EscalaNumerica({
  minimo,
  maximo,
  escala,
  valor,
  onElegir,
}: {
  minimo: number
  maximo: number
  escala: Pregunta['escala']
  valor?: string
  onElegir?: (v: string) => void
}) {
  const valores = Array.from({ length: Math.max(0, maximo - minimo + 1) }, (_, i) => String(minimo + i))
  return (
    <div className="flex flex-col gap-2">
      <Pasos
        etiqueta={`Del ${minimo} al ${maximo}`}
        valor={valor}
        onElegir={onElegir}
        apretado={valores.length > 7}
        pasos={valores.map((n) => ({ valor: n, nombre: n, contenido: <span className="tabular-nums">{n}</span> }))}
      />
      <Extremos min={escala.etiquetaMinimo} max={escala.etiquetaMaximo} />
    </div>
  )
}

/**
 * La escala de calificación: las estrellas y las etiquetas de los extremos.
 *
 * Usa el **`Rating` de la librería**, que es la pieza oficial para esto y la que ya usa Encuestas: contorno cuando no
 * está marcada y relleno amarillo cuando sí. Antes se pintaba a mano con dos iconos, y el de «sin marcar» era el de
 * **media estrella**, así que las vacías salían partidas por la mitad y la marcada se veía solo contorneada de
 * amarillo, al revés de lo que se espera (Dave, 7-oct).
 *
 * **Se reparten todo el ancho**, como el resto de las escalas: así la fila de estrellas y la de números se leen
 * igual, y con diez estrellas no queda media escala pegada a la izquierda (Dave, 9-oct).
 */
export function EscalaEstrellas({
  cantidad,
  escala,
  valor,
  onElegir,
}: {
  cantidad: number
  escala: Pregunta['escala']
  valor?: string
  onElegir?: (v: string) => void
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Rating
        rating={Number(valor) || 0}
        maxRating={Math.max(1, cantidad)}
        size="lg"
        className="w-full [&>div]:w-full [&>div]:justify-between [&_[data-slot^=rating-star]]:size-9"
        editable={Boolean(onElegir)}
        // Volver a tocar la estrella elegida quita la respuesta: es la única forma de deshacer una valoración.
        onRatingChange={onElegir ? (puntos: number) => onElegir(puntos === Number(valor) ? '' : String(puntos)) : undefined}
      />
      <Extremos min={escala.etiquetaMinimo} max={escala.etiquetaMaximo} />
    </div>
  )
}
