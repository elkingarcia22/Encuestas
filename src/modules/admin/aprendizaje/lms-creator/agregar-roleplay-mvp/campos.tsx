import { useEffect, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ClipboardCheckIcon,
  Coins01Icon,
  Delete02Icon,
  Image01Icon,
  Dumbbell01Icon,
  InformationCircleIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FramePanel,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  Badge,
  FieldLabel,
  FieldTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
  Textarea,
  Tooltip,
  TooltipTrigger,
} from '@ubits/flux-ui'
import { useFileUpload } from '@ubits/flux-ui/hooks'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint, HintContent } from '@/shared/components/Hint'
import type { RoleplayConfig } from '../crear-contenido/components/borrador'
import {
  COSTO_CREDITOS,
  EJEMPLOS,
  LIMITES,
  MAX_OBJETIVOS,
  MIN_OBJETIVOS,
  nuevoObjetivo,
  objetivosConTexto,
} from '../crear-contenido/components/roleplay/modelo'
import { CaraPersonaje } from '../crear-contenido/components/roleplay/vista-roleplay'

// Campos del evaluador roleplay (MVP), uno por bloque de cada paso.

export type Cambio = (cambio: Partial<RoleplayConfig>) => void

// Alto de las áreas de texto según las filas del prototipo (el Textarea del tema crece con el contenido).
const ALTO_FILAS: Record<number, string> = { 3: 'min-h-20', 4: 'min-h-26', 6: 'min-h-38' }

/** Campo de texto con contador «n/máx» a la derecha de la etiqueta y el error debajo. */
export function CampoTexto({
  id,
  etiqueta,
  valor,
  onCambio,
  maximo,
  error,
  ejemplo,
  filas,
}: {
  id: string
  etiqueta: string
  valor: string
  onCambio: (valor: string) => void
  maximo: number
  error?: string
  ejemplo?: string
  /** Con filas es un área de texto; sin ellas, una línea. */
  filas?: number
}) {
  const cerca = valor.length > maximo * 0.9
  const props = {
    id,
    value: valor,
    maxLength: maximo,
    placeholder: ejemplo,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': `${id}-contador`,
  }
  return (
    <Field data-invalid={error ? 'true' : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
        <Text
          as="span"
          id={`${id}-contador`}
          size="xs"
          variant={cerca ? 'default' : 'muted'}
          weight={cerca ? 'semibold' : undefined}
          className="shrink-0 tabular-nums"
        >
          {valor.length}/{maximo}
        </Text>
      </div>
      {filas ? (
        <Textarea {...props} rows={filas} className={ALTO_FILAS[filas]} onChange={(e) => onCambio(e.target.value.slice(0, maximo))} />
      ) : (
        <Input {...props} onChange={(e) => onCambio(e.target.value.slice(0, maximo))} />
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

/** Imagen del personaje: opcional; sin ella la llamada muestra el orbe del agente. */
export function CampoImagen({ imagen, onCambio }: { imagen: string; onCambio: (imagen: string) => void }) {
  // El patrón «Basic file upload» de la librería (ReUI `c-file-upload-1`, el mismo que documenta el Storybook de
  // flux-ui): miniatura y un botón, sin zona de arrastre. Para una sola imagen pequeña la caja de soltar archivos pesa
  // más que el propio campo. Se apoya en `useFileUpload`, que es lo que ambas librerías publican.
  const [{ files }, { removeFile, openFileDialog, getInputProps }] = useFileUpload({ accept: 'image/*', maxSize: 4 * 1024 * 1024 })
  const subido = files[0]

  // Lo que vale es la dirección que ya está en la configuración: la del hook se revoca al desmontar (ver file-upload).
  useEffect(() => {
    if (subido?.preview) onCambio(subido.preview)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subido?.id])

  const quitar = () => {
    if (subido) removeFile(subido.id)
    onCambio('')
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start">
      <div className="flex flex-col gap-1.5">
        {/* El único campo del roleplay que se puede dejar en blanco: lleva la insignia «Opcional» del design system,
            como el resto de los formularios. Los demás bloquean el paso hasta estar llenos. */}
        <Text as="p" size="sm" weight="medium" className="flex items-center gap-2">
          Imagen del personaje
          <Badge variant="secondary" size="xs">
            Opcional
          </Badge>
        </Text>
        <Text as="p" size="sm" variant="muted">
          Es la cara que verá el colaborador en la llamada. Si no cargas ninguna, se usa el orbe del agente.
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <CaraPersonaje imagen={imagen} className="size-12" />
          <div className="relative inline-block">
            <Button variant="outline" size="sm" onClick={openFileDialog}>
              <HugeiconsIcon icon={Image01Icon} size={16} aria-hidden="true" />
              {imagen ? 'Cambiar imagen' : 'Subir imagen'}
            </Button>
            <input {...getInputProps()} className="sr-only" aria-label="Subir la imagen del personaje" tabIndex={-1} />
          </div>
        </div>
        <Text as="p" size="xs" variant="muted" aria-live="polite">
          {imagen ? (
            <>
              {subido?.file.name ?? 'Imagen cargada'}
              {' · '}
              <button type="button" onClick={quitar} className="cursor-pointer font-medium text-destructive hover:underline">
                Quitar
              </button>
            </>
          ) : (
            'Sin imagen · 1:1, PNG, JPG o WEBP hasta 4 MB'
          )}
        </Text>
      </div>
    </div>
  )
}

/** Lista de objetivos de aprendizaje: entre 3 y 5 (RN-02). */
export function CampoObjetivos({ cfg, onCambio, error }: { cfg: RoleplayConfig; onCambio: Cambio; error?: string }) {
  const puedeAgregar = cfg.objetivos.length < MAX_OBJETIVOS
  const puedeQuitar = cfg.objetivos.length > MIN_OBJETIVOS

  const escribir = (id: string, texto: string) =>
    onCambio({ objetivos: cfg.objetivos.map((o) => (o.id === id ? { ...o, texto: texto.slice(0, LIMITES.objetivo) } : o)) })

  const quitar = (id: string) => {
    const siguientes = cfg.objetivos.filter((o) => o.id !== id)
    onCambio({ objetivos: siguientes, objetivosParaAprobar: Math.min(cfg.objetivosParaAprobar, siguientes.length) })
  }

  return (
    <Field data-invalid={error ? 'true' : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel id="rp-objetivos">Objetivos de aprendizaje</FieldLabel>
        <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
          {cfg.objetivos.length}/{MAX_OBJETIVOS}
        </Text>
      </div>
      <FieldDescription>
        Lo que el colaborador debe lograr en la conversación. Entre {MIN_OBJETIVOS} y {MAX_OBJETIVOS}.
      </FieldDescription>

      <ol className="flex flex-col gap-2" aria-labelledby="rp-objetivos">
        {cfg.objetivos.map((o, i) => {
          const vacio = Boolean(error) && !o.texto.trim()
          return (
            <li key={o.id} className="flex items-center gap-2">
              <Text as="span" size="xs" weight="semibold" variant="muted" className="w-5 shrink-0 text-center tabular-nums" aria-hidden="true">
                {i + 1}
              </Text>
              <Input
                id={`rp-obj-${o.id}`}
                aria-label={`Objetivo ${i + 1}`}
                aria-invalid={vacio ? true : undefined}
                value={o.texto}
                maxLength={LIMITES.objetivo}
                placeholder={EJEMPLOS.objetivo}
                onChange={(e) => escribir(o.id, e.target.value)}
                className="flex-1"
              />
              {/* Siempre visible: en el mínimo queda deshabilitado y explica por qué. El span recibe el cursor. */}
              <Hint label={puedeQuitar ? 'Quitar objetivo' : `Se necesitan al menos ${MIN_OBJETIVOS} objetivos`}>
                <span className="inline-flex">
                  <BotonIcono
                    aria-label={puedeQuitar ? `Quitar objetivo ${i + 1}` : `No se puede quitar: se necesitan al menos ${MIN_OBJETIVOS} objetivos`}
                    disabled={!puedeQuitar}
                    onClick={() => quitar(o.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} className="text-destructive" />
                  </BotonIcono>
                </span>
              </Hint>
            </li>
          )
        })}
      </ol>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" disabled={!puedeAgregar} onClick={() => onCambio({ objetivos: [...cfg.objetivos, nuevoObjetivo()] })}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
          Agregar objetivo
        </Button>
        {!puedeAgregar ? (
          <Text as="span" size="xs" variant="muted">
            Llegaste al máximo de {MAX_OBJETIVOS} objetivos.
          </Text>
        ) : null}
      </div>
    </Field>
  )
}

const MODOS: { id: RoleplayConfig['modo']; titulo: string; descripcion: string; icono: IconSvgElement }[] = [
  { id: 'evaluacion', titulo: 'Evaluación', descripcion: 'Debe alcanzar el umbral de objetivos para poder avanzar.', icono: ClipboardCheckIcon },
  { id: 'practica', titulo: 'Práctica', descripcion: 'El colaborador recibe retroalimentación y puede avanzar siempre.', icono: Dumbbell01Icon },
]

/** Práctica o evaluación, con su consecuencia explicada. Evaluación va primero: es el uso común. */
export function CampoModo({ cfg, onCambio }: { cfg: RoleplayConfig; onCambio: Cambio }) {
  return (
    <Field>
      <FieldLabel id="rp-modo">Modo</FieldLabel>
      <RadioGroup
        value={cfg.modo}
        aria-labelledby="rp-modo"
        onValueChange={(v) => onCambio({ modo: v as RoleplayConfig['modo'] })}
        className="grid gap-3 md:grid-cols-2"
      >
        {MODOS.map((m) => (
          <FieldLabel key={m.id} htmlFor={`rp-modo-${m.id}`}>
            <Field orientation="horizontal" className="items-start!">
              <HugeiconsIcon icon={m.icono} size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
              <FieldContent>
                <FieldTitle>{m.titulo}</FieldTitle>
                <FieldDescription>{m.descripcion}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={m.id} id={`rp-modo-${m.id}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </Field>
  )
}

function Selector({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  error,
}: {
  id: string
  etiqueta: string
  valor: string
  opciones: { value: string; label: string }[]
  onCambio: (valor: string) => void
  error?: string
}) {
  return (
    <Field data-invalid={error ? 'true' : undefined}>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Select value={valor} onValueChange={(v) => v && onCambio(String(v))}>
        <SelectTrigger id={id} className="w-full" aria-invalid={error ? true : undefined}>
          <SelectValue>{(v: string) => opciones.find((o) => o.value === v)?.label ?? ''}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {opciones.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

const DURACIONES = [
  { value: '3', label: '3 minutos' },
  { value: '5', label: '5 minutos' },
  { value: '10', label: '10 minutos' },
]

const INTENTOS = [
  { value: '1', label: '1 intento' },
  { value: '2', label: '2 intentos' },
  { value: '3', label: '3 intentos' },
]

/** Umbral, duración, intentos, modo texto y costo. */
export function CamposConfiguracion({ cfg, onCambio, error }: { cfg: RoleplayConfig; onCambio: Cambio; error?: string }) {
  const total = objetivosConTexto(cfg).length || cfg.objetivos.length
  const umbrales = Array.from({ length: total }, (_, i) => ({ value: String(i + 1), label: `${i + 1} de ${total} objetivos` }))
  const [ayuda, setAyuda] = useState(false)

  return (
    <>
      {cfg.modo === 'evaluacion' ? (
        <Selector
          id="rp-umbral"
          etiqueta="Objetivos requeridos para aprobar"
          valor={String(cfg.objetivosParaAprobar)}
          opciones={umbrales}
          onCambio={(v) => onCambio({ objetivosParaAprobar: Number(v) || 1 })}
          error={error}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Selector
          id="rp-duracion"
          etiqueta="Duración de la llamada"
          valor={String(cfg.duracionMin)}
          opciones={DURACIONES}
          onCambio={(v) => onCambio({ duracionMin: (Number(v) || 5) as RoleplayConfig['duracionMin'] })}
        />
        <Selector
          id="rp-intentos"
          etiqueta="Número de intentos"
          valor={String(cfg.intentos)}
          opciones={INTENTOS}
          onCambio={(v) => onCambio({ intentos: (Number(v) || 3) as RoleplayConfig['intentos'] })}
        />
      </div>

      {/* Un ajuste de encender y apagar: tarjeta con switch, como «Habilitar certificado». */}
      <Frame spacing="sm">
        <FramePanel className="flex items-center gap-4 max-md:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Text as="p" weight="semibold">
              Habilitar modo texto
            </Text>
            <Text as="p" size="sm" variant="muted">
              Si el colaborador no tiene micrófono, puede responder por escrito. Si lo desactivas y falla el audio o se acaban
              los créditos, el colaborador no podrá continuar.
            </Text>
          </div>
          <Switch checked={cfg.modoTexto} onCheckedChange={(v) => onCambio({ modoTexto: v })} aria-label="Habilitar modo texto" />
        </FramePanel>
      </Frame>

      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Coins01Icon} size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
        {/* Como en playground-react: «Costo por intento: 150 créditos» se leía como el total del roleplay; el costo se
            acumula, cada intento del colaborador vuelve a cobrar. */}
        <Text as="p" size="sm">
          <Text as="span" size="sm" weight="semibold">
            {COSTO_CREDITOS} créditos
          </Text>{' '}
          por cada intento que haga el colaborador
        </Text>
        {/* Icono de ayuda: el tooltip se controla para que también abra con clic (solo abre con el cursor). */}
        <Tooltip open={ayuda} onOpenChange={setAyuda}>
          <TooltipTrigger
            render={
              <BotonIcono size="icon-xs" aria-label="Sobre el costo de cada intento" onClick={() => setAyuda((v) => !v)}>
                <HugeiconsIcon icon={InformationCircleIcon} size={16} />
              </BotonIcono>
            }
          />
          <HintContent side="top">Solo se cobran los intentos en los que el colaborador alcanza a interactuar con el evaluador.</HintContent>
        </Tooltip>
      </div>
    </>
  )
}
