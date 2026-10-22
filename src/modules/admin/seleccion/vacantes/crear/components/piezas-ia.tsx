import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowLeft01Icon, CheckmarkCircle02Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { CampoNumero } from './piezas'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { LIMITE_PUNTOS } from './etapas'

/* Piezas que comparten los tres paneles de configuración de etapas con IA. */

// Arriba del panel cuando lo abrió «Configurar con IA» desde la fila de la etapa (1 oct): qué pasó, y que nada queda
// guardado hasta guardar.
export function AvisoPropuestaIa({ nombreVacante }: { nombreVacante: string }) {
  return (
    <Alert variant="info" className="mb-4">
      {/* El orbe va en el título: la esquina del Alert solo acomoda iconos de trazo. */}
      <AlertTitle className="flex items-center gap-2">
        <IconoIA />
        La IA armó esta configuración
      </AlertTitle>
      <AlertDescription>
        A partir de «{nombreVacante || 'la vacante'}». Revisa cada parte y guarda; si cancelas, la etapa queda como estaba.
      </AlertDescription>
    </Alert>
  )
}

// Campo con etiqueta y selector: se repite tanto en los paneles que tenerlo suelto ahorra ruido.
export function CampoSelect({
  id,
  etiqueta,
  opciones,
  valor,
  onCambio,
  placeholder,
}: {
  id: string
  etiqueta: string
  opciones: string[]
  valor: string
  onCambio: (valor: string) => void
  placeholder?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Select value={valor} onValueChange={(nuevo) => onCambio(nuevo ?? '')}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder ?? 'Selecciona'} />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion} value={opcion}>
              {opcion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

// Campo de texto largo con el contador de caracteres abajo, como en el paso de la descripción.
export function CampoTexto({
  id,
  etiqueta,
  descripcion,
  limite,
  filas = 4,
  valor,
  onCambio,
  placeholder,
  opcional,
}: {
  id: string
  etiqueta: string
  descripcion?: string
  limite: number
  filas?: number
  valor: string
  onCambio: (valor: string) => void
  placeholder: string
  opcional?: boolean
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {etiqueta}
        {opcional ? (
          <Badge variant="secondary">
            Opcional
          </Badge>
        ) : null}
      </FieldLabel>
      <InputGroup>
        <InputGroupTextarea
          id={id}
          rows={filas}
          maxLength={limite}
          value={valor}
          placeholder={placeholder}
          onChange={(evento) => onCambio(evento.target.value)}
        />
        <InputGroupAddon align="block-end">
          <InputGroupText className="ml-auto tabular-nums">
            {valor.length}/{limite}
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
    </Field>
  )
}

// Reparto de los 100 puntos de una etapa, ya sea entre criterios o entre preguntas. Es la misma
// barra en los tres paneles: verde mientras cuadre y con el aviso en rojo cuando se pasa.
export function DistribucionPuntos({ total, detalle }: { total: number; detalle: string }) {
  const excedido = total > LIMITE_PUNTOS
  const disponibles = Math.max(0, LIMITE_PUNTOS - total)

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={excedido ? Alert02Icon : CheckmarkCircle02Icon}
              size={18}
              aria-hidden="true"
              className="text-muted-foreground"
            />
            <Text as="span" size="sm" weight="medium">
              Distribución de puntos
            </Text>
          </div>
          <Badge variant={excedido ? 'destructive-outline' : 'success-light'} className="tabular-nums">
            {total}/{LIMITE_PUNTOS}
          </Badge>
        </div>
        <Progress value={Math.min(100, total)} aria-label="Puntos repartidos" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text as="span" variant="muted" size="sm">
            Puntos disponibles: {disponibles}
          </Text>
          <Text as="span" variant="muted" size="sm">
            {detalle}
          </Text>
        </div>
        {excedido ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertDescription>
              Te pasaste por {total - LIMITE_PUNTOS} pts. Baja el puntaje de alguna para volver a {LIMITE_PUNTOS}.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}

// `bandera`: las voces de Serena son acentos de un país y se reconocen por su bandera; las de personaje
// (Valentina, Mateo…) no la tienen y llevan la inicial.
export type Voz = { id: string; nombre: string; etiqueta: string; tono: string; bandera?: string }

// Cuánto suena la muestra de una voz.
const MUESTRA_MS = 4000

// Selector de voz con el botón «Escuchar» al lado, del mismo alto que el campo: suena una muestra y se puede detener.
export function SelectorVoz({
  id,
  etiqueta,
  descripcion,
  voces,
  valor,
  onCambio,
}: {
  id: string
  etiqueta: string
  descripcion: string
  voces: Voz[]
  valor: string
  onCambio: (valor: string) => void
}) {
  const elegida = voces.find((voz) => voz.id === valor) ?? voces[0]
  // La muestra de la voz suena unos segundos y se puede detener (8 oct: sin el aviso de «en el playground no suenan»,
  // que no debe llegar a producción). Al cambiar de voz, la que sonaba se detiene.
  const [sonando, setSonando] = useState<string | null>(null)
  useEffect(() => {
    if (!sonando) return
    const reloj = window.setTimeout(() => setSonando(null), MUESTRA_MS)
    return () => window.clearTimeout(reloj)
  }, [sonando])
  const suena = sonando === elegida.id

  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <div className="flex items-center gap-2">
        <Select value={valor} onValueChange={(nuevo) => onCambio(nuevo ?? elegida.id)}>
          <SelectTrigger id={id} className="min-w-0 flex-1">
            <SelectValue>
              {(elegido: string) => <EtiquetaVoz voz={voces.find((voz) => voz.id === elegido) ?? elegida} />}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {voces.map((voz) => (
              <SelectItem key={voz.id} value={voz.id}>
                <EtiquetaVoz voz={voz} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="lg"
          className="shrink-0"
          aria-label={suena ? `Detener la voz ${elegida.nombre}` : `Escuchar la voz ${elegida.nombre}`}
          aria-pressed={suena}
          onClick={() => setSonando(suena ? null : elegida.id)}
        >
          <HugeiconsIcon icon={suena ? PauseIcon : PlayIcon} aria-hidden="true" />
          {suena ? 'Detener' : 'Escuchar'}
        </Button>
      </div>
      <FieldDescription>{descripcion}</FieldDescription>
    </Field>
  )
}

// Nombre en negrita y, en gris, el idioma y el tono: una sola línea, sin insignias sueltas.
function EtiquetaVoz({ voz }: { voz: Voz }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {voz.bandera ? (
        <span aria-hidden="true" className="shrink-0">
          {voz.bandera}
        </span>
      ) : (
        <Avatar size="sm" className="shrink-0">
          <AvatarFallback>{voz.nombre.slice(0, 1)}</AvatarFallback>
        </Avatar>
      )}
      <Text as="span" size="sm" weight="medium" className="shrink-0">
        {voz.nombre}
      </Text>
      <Text as="span" variant="muted" size="sm" className="truncate">
        {voz.etiqueta} · {voz.tono}
      </Text>
    </span>
  )
}

// Peso de cada criterio de evaluación: la misma fila que los demás números del panel (5 oct). Antes era una tarjeta
// alta por criterio, con un relleno doble y un campo «% 20» distinto al de los plazos; ahora se lee igual que «Días para
// presentar» o «Puntaje mínimo»: el criterio y qué mira a la izquierda, su peso con − y + a la derecha.
export function FilaCriterio({
  id,
  nombre,
  descripcion,
  peso,
  onPeso,
}: {
  id: string
  nombre: string
  descripcion: string
  peso: number
  onPeso: (peso: number) => void
}) {
  return <CampoNumero id={id} etiqueta={nombre} descripcion={descripcion} valor={peso} onCambio={onPeso} min={0} max={100} step={5} unidad="%" />
}

// Tarjeta que aparece al pedir «Generar con IA»: recoge un contexto extra y luego espera.
// La IA del playground no escribe de verdad; devuelve un ejemplo tras un momento.
export function GeneradorIa({
  titulo,
  descripcion,
  placeholder,
  extra,
  volverA,
  onGenerar,
  onCerrar,
  onGenerandoIa,
}: {
  titulo: string
  descripcion: string
  placeholder: string
  extra?: ReactNode
  // A qué se vuelve («las preguntas»): arriba sale «← Volver a…», además de «Cancelar» abajo (29 sep, reunión con
  // Elkin: el generador tapa la lista y la única salida era «Cancelar»).
  volverA?: string
  onGenerar: (contexto: string) => void
  onCerrar: () => void
  onGenerandoIa?: (mensaje: string | null) => void
}) {
  const [contexto, setContexto] = useState('')
  const [generando, setGenerando] = useState(false)

  const generar = () => {
    setGenerando(true)
    onGenerandoIa?.(titulo === 'Criterios de evaluación' ? 'Armando criterios con IA…' : 'Armando preguntas con IA…')
    window.setTimeout(() => {
      onGenerar(contexto)
      setGenerando(false)
      onGenerandoIa?.(null)
    }, 1400)
  }

  return (
    <div className="flex flex-col gap-2">
    {volverA ? (
      <Button variant="ghost" size="sm" className="self-start text-muted-foreground!" disabled={generando} onClick={onCerrar}>
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
        Volver a {volverA}
      </Button>
    ) : null}
    <Card size="sm">
      <CardHeader>
        {/* Lo que escribe la IA lleva el orbe, no chispas (regla del 23 sep). */}
        <CardTitle className="flex items-center gap-2">
          <IconoIA />
          {titulo}
        </CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {extra}
        <CampoTexto
          id="generador-contexto"
          etiqueta="Contexto adicional"
          opcional
          limite={500}
          filas={3}
          valor={contexto}
          onCambio={setContexto}
          placeholder={placeholder}
        />
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" disabled={generando} onClick={onCerrar}>
          Cancelar
        </Button>
        <BotonIaSecundario disabled={generando} onClick={generar}>
          {generando ? <Spinner /> : null}
          {generando ? 'Creando…' : 'Crear con IA'}
        </BotonIaSecundario>
      </CardFooter>
    </Card>
    </div>
  )
}
