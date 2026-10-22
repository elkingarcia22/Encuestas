import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowUp01Icon, Copy01Icon, Delete02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Item,
  Text,
} from '@ubits/flux-ui'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CampoRespuesta, type Respuesta } from '../../../components/vista-previa/campo-respuesta'
import { CampoEnunciado } from './campo-enunciado'
import {
  MIN_OPTIONS,
  QUESTION_TYPES,
  RATING_TYPES,
  SCALE_TYPES,
  buildOption,
  changeQuestionType,
  changeScaleType,
  hasEndLabels,
  DEPTH_WHY_DEFAULT,
  hasOptions,
  needsRatingType,
  supportsDepthWhy,
  supportsDontKnow,
  supportsFollowUps,
  supportsOther,
} from '../../../modelo/questionCatalog'
import type { QuestionType, RatingType, ScaleType, SurveyQuestion } from '../../../modelo/surveyBuilderTypes'
import { LIMITE_ENUNCIADO, LIMITE_OPCION_PREGUNTA, cercaDelTope, contador, cortoDeMinimo } from '../../../modelo/limites-texto'

// El formulario de una pregunta, abierto en su propio sitio de la lista. No hay «guardar»: cada
// tecla se escribe en la encuesta. Cambiar el tipo no borra lo configurado: apaga lo que no aplica
// y lo recupera al volver. Los errores aparecen cuando ya se intentó finalizar.

// Los «!» de este formulario son tres, siempre los mismos: el fondo sólido de los campos (bg-background!), que la
// librería deja transparentes y se pierden sobre el gris de la fila (diferencias.json › input-group-fondo-solido y
// select-trigger-fondo-solido); el rojo de los botones de quitar (text-destructive!), que los botones sin borde no traen
// (diferencias.json › button-ghost-tonos); y el ancho y la alineación de las filas con interruptor (w-auto!,
// items-center!, items-stretch!), que la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa).

// Cada opción lleva el icono del catálogo (el mismo que marca la fila de la pregunta): ayuda a reconocerla en la lista.
const aOpciones = <T extends string>(lista: readonly { value: T; label: string; icon?: IconSvgElement }[]) => lista.map(({ value, label, icon }) => ({ value, label, icon }))
const TIPOS = aOpciones(QUESTION_TYPES)
const ESCALAS = aOpciones(SCALE_TYPES)
const VALORACIONES = aOpciones(RATING_TYPES)

function Selector<T extends string>({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  invalido,
  className,
}: {
  id: string
  etiqueta: string
  /** Solo layout: cuántas columnas ocupa en la rejilla. */
  className?: string
  valor: T | null
  opciones: { value: T; label: string; icon?: IconSvgElement }[]
  onCambio: (valor: T) => void
  invalido?: boolean
}) {
  return (
    <Field data-invalid={invalido || undefined} className={className}>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Select value={valor ?? ''} onValueChange={(nuevo) => onCambio(nuevo as T)} items={opciones}>
        {/* «!»: fondo sólido; la librería lo deja transparente (diferencias.json › select-trigger-fondo-solido). */}
        <SelectTrigger className="bg-background!" id={id} aria-invalid={invalido}>
          {/* El valor elegido lleva su icono, como en la lista de opciones. */}
          <SelectValue placeholder={etiqueta}>
            {(elegido: string | null) => {
              const opcion = opciones.find((entrada) => entrada.value === elegido)
              if (!opcion) return <span className="text-muted-foreground">{etiqueta}</span>
              return (
                <span className="flex min-w-0 items-center gap-2">
                  {opcion.icon ? <HugeiconsIcon icon={opcion.icon} aria-hidden="true" className="shrink-0 text-muted-foreground" /> : null}
                  <span className="truncate">{opcion.label}</span>
                </span>
              )
            }}
          </SelectValue>
        </SelectTrigger>
        {/* El menú se ensancha lo que pida su texto más largo: si no, «Likert (escala de preferencias)» choca con el check. */}
        <SelectContent className="w-max min-w-(--anchor-width)">
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.icon ? <HugeiconsIcon icon={opcion.icon} aria-hidden="true" className="text-muted-foreground" /> : null}
              {opcion.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalido ? <FieldError>Este campo es obligatorio</FieldError> : null}
    </Field>
  )
}

export function EditorPregunta({
  pregunta,
  onCambio,
  onDuplicar,
  onEliminar,
  onCerrar,
  conErrores,
  intento = 0,
  pedirContexto = false,
  enPanel = false,
}: {
  pregunta: SurveyQuestion
  onCambio: (pregunta: SurveyQuestion) => void
  onDuplicar: () => void
  onEliminar: () => void
  onCerrar: () => void
  conErrores: boolean
  /** Cuenta los intentos de avanzar, agregar o guardar: cada uno vuelve a marcar lo que falte en ese momento. */
  intento?: number
  /** La pregunta nació con «Redactar con IA»: el enunciado abre pidiendo el contexto. */
  pedirContexto?: boolean
  /** Dentro del panel lateral: duplicar, eliminar y cerrar van en el pie del panel, no aquí. */
  enPanel?: boolean
}) {
  const id = pregunta.id
  const escala = pregunta.scale
  const sinTipo = pregunta.typePending === true
  const esEscala = !sinTipo && pregunta.type === 'scale'
  const conNoSabe = esEscala && supportsDontKnow(escala.kind)
  // La respuesta de prueba en «Así lo verá el participante»: solo en pantalla, no se guarda en la pregunta.
  const [muestra, setMuestra] = useState<Respuesta>(null)
  const cambiarEscala = (cambio: Partial<SurveyQuestion['scale']>) => onCambio({ ...pregunta, scale: { ...escala, ...cambio } })

  // Lo rojo se marca al intentar avanzar, agregar o guardar, y solo lo que ya estaba en pantalla en ese momento: si después se cambia
  // el tipo de pregunta o de escala y aparecen campos nuevos, salen normales hasta el siguiente intento.
  const estructura = `${pregunta.type}|${sinTipo}|${escala.kind}|${escala.followUpEnabled}|${pregunta.depthWhyEnabled === true}`
  const [visto, setVisto] = useState({ intento, estructura })
  if (visto.intento !== intento) setVisto({ intento, estructura })
  const conErroresVivos = conErrores && visto.estructura === estructura

  const sinEnunciado = conErrores && (pregunta.statement.trim() === '' || cortoDeMinimo(pregunta.statement, LIMITE_ENUNCIADO.min))
  const sinEscala = conErroresVivos && esEscala && escala.kind === null
  const sinValoracion = conErroresVivos && esEscala && needsRatingType(escala.kind) && escala.ratingType === null
  // Lo que cuelga de la escala también es obligatorio: las etiquetas de los extremos y, con la profundidad encendida, sus tres preguntas.
  const sinEtiquetaMinima = conErroresVivos && esEscala && hasEndLabels(escala.kind) && escala.minLabel.trim() === ''
  const sinEtiquetaMaxima = conErroresVivos && esEscala && hasEndLabels(escala.kind) && escala.maxLabel.trim() === ''
  const profundidadVacia = (banda: 'detractors' | 'neutrals' | 'promoters') => conErroresVivos && esEscala && escala.followUpEnabled && escala.followUps[banda].trim() === ''
  const conPorQue = !sinTipo && supportsDepthWhy(pregunta)
  const porQueVacia = conErroresVivos && conPorQue && pregunta.depthWhyEnabled === true && (pregunta.depthWhyText ?? '').trim() === ''
  const opcionesMal = conErroresVivos && hasOptions(pregunta.type) && (pregunta.options.length < MIN_OPTIONS || pregunta.options.some((opcion) => opcion.label.trim() === ''))

  return (
    <div
      className={enPanel ? 'flex flex-col gap-5' : 'flex flex-col gap-5 p-4'}
      onKeyDown={(evento) => {
        if (evento.key === 'Escape') onCerrar()
      }}
    >
      <CampoEnunciado pregunta={pregunta} onCambio={onCambio} invalido={sinEnunciado} pedirContexto={pedirContexto} />

      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        {/* De a uno: la escala aparece al elegir el tipo, y la valoración al elegir una escala que la pide. El tipo va
            solo en su fila; escala y valoración comparten la de abajo. */}
        <Selector
          id={`pregunta-${id}-tipo`}
          className="sm:col-span-2"
          etiqueta="Tipo de pregunta"
          valor={sinTipo ? null : pregunta.type}
          opciones={TIPOS}
          invalido={conErroresVivos && sinTipo}
          onCambio={(tipo: QuestionType) => {
            const cambiada = { ...changeQuestionType(pregunta, tipo), typePending: false }
            // En una pregunta nueva, la escala y la valoración no se rellenan solas: se eligen después, de a una.
            onCambio(sinTipo ? { ...cambiada, scale: { ...cambiada.scale, kind: null, ratingType: null } } : cambiada)
          }}
        />
        {esEscala ? (
          <Selector
            id={`pregunta-${id}-escala`}
            // Sola, la escala ocupa toda la fila; con la valoración, van mitad y mitad. Así no quedan huecos.
            className={needsRatingType(escala.kind) ? undefined : 'sm:col-span-2'}
            etiqueta="Tipo de escala"
            valor={escala.kind}
            opciones={ESCALAS}
            invalido={sinEscala}
            onCambio={(kind: ScaleType) => onCambio(changeScaleType(pregunta, kind))}
          />
        ) : null}
        {esEscala && needsRatingType(escala.kind) ? (
          <Selector
            id={`pregunta-${id}-valoracion`}
            etiqueta="Tipo de valoración"
            valor={escala.ratingType}
            opciones={VALORACIONES}
            invalido={sinValoracion}
            onCambio={(ratingType: RatingType) => cambiarEscala({ ratingType })}
          />
        ) : null}
      </FieldGroup>

      {esEscala && hasEndLabels(escala.kind) ? (
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={sinEtiquetaMinima || undefined}>
            <FieldLabel htmlFor={`pregunta-${id}-minimo`}>Etiqueta mínima</FieldLabel>
            {/* «!»: fondo sólido; la librería lo deja transparente (diferencias.json › input-group-fondo-solido). */}
            <Input className="bg-background!" id={`pregunta-${id}-minimo`} value={escala.minLabel} aria-invalid={sinEtiquetaMinima} placeholder="Escribe aquí la etiqueta mínima" onChange={(evento) => cambiarEscala({ minLabel: evento.target.value })} />
            {sinEtiquetaMinima ? <FieldError>Este campo es obligatorio</FieldError> : null}
          </Field>
          <Field data-invalid={sinEtiquetaMaxima || undefined}>
            <FieldLabel htmlFor={`pregunta-${id}-maximo`}>Etiqueta máxima</FieldLabel>
            {/* «!»: fondo sólido; la librería lo deja transparente (diferencias.json › input-group-fondo-solido). */}
            <Input className="bg-background!" id={`pregunta-${id}-maximo`} value={escala.maxLabel} aria-invalid={sinEtiquetaMaxima} placeholder="Escribe aquí la etiqueta máxima" onChange={(evento) => cambiarEscala({ maxLabel: evento.target.value })} />
            {sinEtiquetaMaxima ? <FieldError>Este campo es obligatorio</FieldError> : null}
          </Field>
        </FieldGroup>
      ) : null}

      {/* Cómo se verá la escala elegida, con el mismo campo de la vista previa del participante. Solo de muestra. */}
      {esEscala && escala.kind && (!needsRatingType(escala.kind) || escala.ratingType) ? (
        <Item variant="muted" className="flex-col items-stretch! gap-3">
          <Text as="p" size="xs" variant="muted">
            Así lo verá el participante
          </Text>
          {/* Se puede probar: elegir una opción la marca con su color, como lo verá quien responda. */}
          <CampoRespuesta key={`${escala.kind}-${escala.ratingType}`} pregunta={pregunta} valor={muestra} onCambio={setMuestra} />
        </Item>
      ) : null}

      {hasOptions(pregunta.type) ? (
        <FieldSet data-invalid={opcionesMal || undefined}>
          <FieldLegend variant="label">Opciones de respuesta</FieldLegend>
          <div className="flex flex-col gap-2">
            {pregunta.options.map((opcion, indice) => (
              <div key={opcion.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Input
                  // «!»: fondo sólido; la librería lo deja transparente (diferencias.json › input-group-fondo-solido).
                  className="bg-background!"
                  value={opcion.label}
                  maxLength={LIMITE_OPCION_PREGUNTA.max}
                  aria-label={`Opción ${indice + 1}`}
                  aria-invalid={conErroresVivos && opcion.label.trim() === ''}
                  placeholder="Escribe una opción de respuesta"
                  onChange={(evento) => onCambio({ ...pregunta, options: pregunta.options.map((actual) => (actual.id === opcion.id ? { ...actual, label: evento.target.value.slice(0, LIMITE_OPCION_PREGUNTA.max) } : actual)) })}
                />
                <BotonIcono
                  aria-label={`Eliminar opción ${indice + 1}`}
                  // «!»: rojo de quitar; el ghost no trae tono rojo (diferencias.json › button-ghost-tonos).
                  className="text-destructive!"
                  disabled={pregunta.options.length <= MIN_OPTIONS}
                  onClick={() => onCambio({ ...pregunta, options: pregunta.options.filter((actual) => actual.id !== opcion.id) })}
                >
                  <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                </BotonIcono>
              </div>
              {/* Campo corto: el contador sale al acercarse al tope. */}
              {cercaDelTope(opcion.label.length, LIMITE_OPCION_PREGUNTA.max) ? <FieldDescription>{contador(opcion.label.length, LIMITE_OPCION_PREGUNTA.max)}</FieldDescription> : null}
              </div>
            ))}
            {/* «Otro» va al final de la lista, fijo: no se reescribe. Quitarlo apaga el interruptor de abajo. */}
            {pregunta.allowOther ? (
              <div className="flex items-center gap-2">
                <Input className="bg-background!" value="Otro" disabled aria-label="Opción Otro" />
                <BotonIcono aria-label="Quitar la opción Otro" className="text-destructive!" onClick={() => onCambio({ ...pregunta, allowOther: false })}>
                  <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                </BotonIcono>
              </div>
            ) : null}
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => onCambio({ ...pregunta, options: [...pregunta.options, buildOption()] })}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Agregar opción
            </Button>
          </div>
          {opcionesMal ? <FieldError>Necesitas al menos {MIN_OPTIONS} opciones, y ninguna vacía.</FieldError> : null}
        </FieldSet>
      ) : null}

      {conPorQue && pregunta.depthWhyEnabled ? (
        <FieldSet>
          {pregunta.depthWhyEnabled ? (
            <Field data-invalid={porQueVacia || undefined}>
              <FieldLabel htmlFor={`pregunta-${id}-por-que-texto`}>Pregunta de seguimiento</FieldLabel>
              <Input
                // «!»: fondo sólido; la librería lo deja transparente (diferencias.json › input-group-fondo-solido).
                className="bg-background!"
                id={`pregunta-${id}-por-que-texto`}
                aria-invalid={porQueVacia}
                value={pregunta.depthWhyText ?? ''}
                placeholder={DEPTH_WHY_DEFAULT}
                onChange={(evento) => onCambio({ ...pregunta, depthWhyText: evento.target.value })}
              />
              {porQueVacia ? <FieldError>Este campo es obligatorio</FieldError> : null}
            </Field>
          ) : null}
        </FieldSet>
      ) : null}

      {esEscala && supportsFollowUps(escala.kind) ? (
        <FieldSet>
          {/* Como los demás interruptores del editor: el interruptor, el nombre y la explicación en la ayuda (i). */}
          <Field orientation="horizontal" className="w-auto! items-center!">
            <Switch id={`pregunta-${id}-profundidad`} checked={escala.followUpEnabled} onCheckedChange={(followUpEnabled) => cambiarEscala({ followUpEnabled })} />
            <FieldLabel className="whitespace-nowrap" htmlFor={`pregunta-${id}-profundidad`}>Preguntas de profundidad</FieldLabel>
            <BotonAyuda etiqueta="Qué son las preguntas de profundidad">Un seguimiento distinto para quien califica bajo, medio o alto. Alimenta la vista «Profundidad» de los resultados.</BotonAyuda>
          </Field>
          {escala.followUpEnabled ? (
            <div className="flex flex-col gap-3">
              {(
                [
                  ['detractors', 'Pregunta para detractores'],
                  ['neutrals', 'Pregunta para neutrales'],
                  ['promoters', 'Pregunta para promotores'],
                ] as const
              ).map(([banda, etiqueta]) => (
                <Field key={banda} data-invalid={profundidadVacia(banda) || undefined}>
                  <FieldLabel htmlFor={`pregunta-${id}-${banda}`}>{etiqueta}</FieldLabel>
                  <Input
                    // «!»: fondo sólido; la librería lo deja transparente (diferencias.json › input-group-fondo-solido).
                    className="bg-background!"
                    id={`pregunta-${id}-${banda}`}
                    aria-invalid={profundidadVacia(banda)}
                    value={escala.followUps[banda]}
                    placeholder="¿Qué te llevó a dar esa calificación?"
                    onChange={(evento) => cambiarEscala({ followUps: { ...escala.followUps, [banda]: evento.target.value } })}
                  />
                  {profundidadVacia(banda) ? <FieldError>Este campo es obligatorio</FieldError> : null}
                </Field>
              ))}
            </div>
          ) : null}
        </FieldSet>
      ) : null}

      {/* Todos los interruptores de la pregunta en una sola fila (se parte solo si el panel es angosto); cada etiqueta, en una línea. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {supportsOther(pregunta.type) && !sinTipo ? (
            <Field orientation="horizontal" className="w-auto! items-center!">
              <Switch id={`pregunta-${id}-otro`} checked={pregunta.allowOther === true} onCheckedChange={(allowOther) => onCambio({ ...pregunta, allowOther })} />
              <FieldLabel className="whitespace-nowrap" htmlFor={`pregunta-${id}-otro`}>Habilitar «Otro»</FieldLabel>
              <BotonAyuda etiqueta="Qué hace la opción Otro">Suma «Otro» al final de las opciones. Quien la elija verá un campo para escribir la suya.</BotonAyuda>
            </Field>
          ) : null}
          {conPorQue ? (
            // «!»: la fila del interruptor a su ancho; la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa).
            <Field orientation="horizontal" className="w-auto! items-center!">
              <Switch
                id={`pregunta-${id}-por-que`}
                checked={pregunta.depthWhyEnabled === true}
                onCheckedChange={(depthWhyEnabled) => onCambio({ ...pregunta, depthWhyEnabled, depthWhyText: depthWhyEnabled && !(pregunta.depthWhyText ?? '').trim() ? DEPTH_WHY_DEFAULT : pregunta.depthWhyText })}
              />
              <FieldLabel className="whitespace-nowrap" htmlFor={`pregunta-${id}-por-que`}>Pregunta de profundidad</FieldLabel>
              <BotonAyuda etiqueta="Qué es la pregunta de profundidad">Después de responder, pregunta por qué eligió esa opción u opciones. Alimenta la vista «Profundidad» de los resultados.</BotonAyuda>
            </Field>
          ) : null}
          {conNoSabe ? (
            // «!»: la fila del interruptor a su ancho; la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa).
            <Field orientation="horizontal" className="w-auto!">
              <Switch id={`pregunta-${id}-nsnr`} checked={escala.allowDontKnow} onCheckedChange={(allowDontKnow) => cambiarEscala({ allowDontKnow })} />
              <FieldLabel className="whitespace-nowrap" htmlFor={`pregunta-${id}-nsnr`}>Agregar opción no sabe / no responde</FieldLabel>
            </Field>
          ) : null}
          {/* «!»: la fila del interruptor a su ancho; la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa). */}
          <Field orientation="horizontal" className="w-auto!">
            <Switch id={`pregunta-${id}-obligatoria`} checked={pregunta.required} onCheckedChange={(required) => onCambio({ ...pregunta, required })} />
            <FieldLabel className="whitespace-nowrap" htmlFor={`pregunta-${id}-obligatoria`}>Obligatoria</FieldLabel>
          </Field>
        </div>
        {enPanel ? null : (
        <div className="flex items-center justify-end gap-1 sm:col-span-2">
          <Button variant="ghost" size="sm" onClick={onDuplicar}>
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
            Duplicar
          </Button>
          {/* «!»: rojo de quitar; el ghost no trae tono rojo (diferencias.json › button-ghost-tonos). */}
          <Button variant="ghost" size="sm" className="text-destructive!" onClick={onEliminar}>
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
            Eliminar pregunta
          </Button>
          <Button variant="ghost" size="sm" onClick={onCerrar}>
            <HugeiconsIcon icon={ArrowUp01Icon} aria-hidden="true" />
            Contraer edición
          </Button>
        </div>
        )}
      </div>
    </div>
  )
}
