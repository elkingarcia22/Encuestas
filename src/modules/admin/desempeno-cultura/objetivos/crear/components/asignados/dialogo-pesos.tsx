import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, BalanceScaleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertTitle,
  Button,
  Heading,
  IconTile,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Item,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  Slider,
  Text,
  cn,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { MIN_OBJECTIVE_WEIGHT, TOTAL_WEIGHT, distributeWeights, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { rescaleObjectives } from '../../../modelo/constructor/objectiveSets'
import type { WeightBalanceGroup, WeightBalanceResult } from '../../../modelo/constructor/weightBalance'

// «Ajustar pesos»: cuadrar el reparto de una o varias asignaciones sin abrir los objetivos uno por uno. Es el modal del
// design system (ActionDialog, la ventana con contenido) con una sección por asignación: un deslizador
// y el número por objetivo, «Partes iguales» y «Cuadrar» (estira lo tecleado hasta el cupo conservando proporciones) y,
// al pie de cada una, cuánto falta o sobra. Nada se escribe hasta «Aplicar»: el borrador vive aquí.

type Borrador = Record<string, Record<string, number>>

const borradorDe = (grupos: readonly WeightBalanceGroup[]): Borrador =>
  Object.fromEntries(grupos.map((grupo) => [grupo.setId, Object.fromEntries(grupo.objectives.map((objetivo) => [objetivo.id, objetivo.weight]))]))

export interface DialogoPesosProps {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  grupos: readonly WeightBalanceGroup[]
  onAplicar: (resultado: WeightBalanceResult) => void
  titulo?: string
  descripcion?: string
}

export function DialogoPesos(props: DialogoPesosProps) {
  // Cada apertura arranca del reparto que hay hoy: una sesión nueva por apertura.
  const [sesion, setSesion] = useState({ abierto: props.abierto, cuenta: 0 })
  if (sesion.abierto !== props.abierto) setSesion({ abierto: props.abierto, cuenta: props.abierto ? sesion.cuenta + 1 : sesion.cuenta })
  return <Dialogo key={sesion.cuenta} {...props} />
}

/** Lo que devuelve el reparto: las secciones ya armadas y lo que el pie necesita para decir cómo va y aplicar. */
export interface RepartoPesos {
  borrador: WeightBalanceResult
  cuadra: boolean
  hayGrupos: boolean
  /** «Todo cuadra» o cuántas asignaciones faltan, con su icono. */
  estado: ReactNode
  cuadrarTodo: () => void
  cuerpo: ReactNode
}

/**
 * El reparto sin su ventana: el borrador, las secciones por asignación y el estado. Lo usa la ventana centrada
 * (`DialogoPesos`, desde la vista general) y la página «Ajustar pesos» dentro de la ventana de una asignación (21-oct,
 * Elkin: «que no salga en modal, sino que se vea en el panel derecho»). Con `activo`, cada vez que se abre arranca del
 * reparto que hay hoy.
 */
export function useRepartoPesos(grupos: readonly WeightBalanceGroup[], activo = true): RepartoPesos {
  const [borrador, setBorrador] = useState<Borrador>(() => borradorDe(grupos))
  const [activoAntes, setActivoAntes] = useState(activo)
  if (activoAntes !== activo) {
    setActivoAntes(activo)
    if (activo) setBorrador(borradorDe(grupos))
  }
  const pesoDe = (grupo: WeightBalanceGroup, objetivo: Objective) => borrador[grupo.setId]?.[objetivo.id] ?? objetivo.weight
  const totalDe = (grupo: WeightBalanceGroup) => grupo.objectives.reduce((suma, objetivo) => suma + pesoDe(grupo, objetivo), 0)
  const sinCuadrar = grupos.filter((grupo) => totalDe(grupo) !== grupo.budget)
  const cuadra = sinCuadrar.length === 0

  const fijar = (grupo: WeightBalanceGroup, pesos: readonly number[]) =>
    setBorrador((actual) => ({ ...actual, [grupo.setId]: Object.fromEntries(grupo.objectives.map((objetivo, indice) => [objetivo.id, pesos[indice]])) }))
  const partesIguales = (grupo: WeightBalanceGroup) => fijar(grupo, distributeWeights(grupo.objectives.length, grupo.budget))
  const cuadrar = (grupo: WeightBalanceGroup) =>
    fijar(
      grupo,
      rescaleObjectives(
        grupo.objectives.map((objetivo) => ({ ...objetivo, weight: pesoDe(grupo, objetivo) })),
        grupo.budget,
      ).map((objetivo) => objetivo.weight),
    )

  const estado = (
    <Text as="span" size="sm" variant="muted" className="flex items-center gap-1.5">
      <HugeiconsIcon icon={cuadra ? CheckmarkCircle02Icon : Alert02Icon} className={cn('size-4', cuadra ? 'text-success' : 'text-warning')} aria-hidden="true" />
      {cuadra ? 'Todo cuadra' : sinCuadrar.length === 1 ? '1 asignación sin cuadrar' : `${sinCuadrar.length} asignaciones sin cuadrar`}
    </Text>
  )

  // Las secciones por asignación: las mismas en la ventana centrada y en la página de la asignación.
  const cuerpo =
    grupos.length === 0 ? (
      <Text size="sm" variant="muted">
        No hay objetivos que ajustar todavía.
      </Text>
    ) : (
      grupos.map((grupo) => {
        const total = totalDe(grupo)
        const diferencia = total - grupo.budget
        return (
          <section key={grupo.setId} className="flex flex-col gap-2.5" aria-label={grupo.label}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <Heading as="h4" level={6} className="truncate">
                  {grupo.label}
                </Heading>
                <Text size="xs" variant="muted">
                  {grupo.budget === TOTAL_WEIGHT
                    ? `Cuánto pesa cada objetivo dentro de su ${TOTAL_WEIGHT} %. Sube uno y tendrás que bajarle a otro.`
                    : `Cupo de ${grupo.budget} % — comparte el ciclo con otra asignación.`}
                </Text>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => partesIguales(grupo)}>
                  Partes iguales
                </Button>
                <Button variant="outline" size="sm" onClick={() => cuadrar(grupo)}>
                  Cuadrar
                </Button>
              </div>
            </div>
            {/* Filas pegadas, separadas por su divisor: el gap del tema no se quita sin «!» (diferencias.json › instalacion-estilos-sin-capa). */}
            <ItemGroup className="gap-0! rounded-xl border">
              {grupo.objectives.map((objetivo, indice) => (
                <div key={objetivo.id}>
                  {indice > 0 ? <ItemSeparator /> : null}
                  <FilaPeso
                    numero={indice + 1}
                    objetivo={objetivo}
                    valor={pesoDe(grupo, objetivo)}
                    maximo={grupo.budget}
                    onCambio={(peso) => setBorrador((actual) => ({ ...actual, [grupo.setId]: { ...actual[grupo.setId], [objetivo.id]: peso } }))}
                  />
                </div>
              ))}
            </ItemGroup>
            <Alert variant={diferencia === 0 ? 'success' : diferencia > 0 ? 'destructive' : 'warning'}>
              <HugeiconsIcon icon={diferencia === 0 ? CheckmarkCircle02Icon : Alert02Icon} aria-hidden="true" />
              <AlertTitle className="flex items-center justify-between gap-3">
                <span>{diferencia === 0 ? 'Ya quedó al tope' : diferencia > 0 ? `Te pasaste ${diferencia} % del cupo` : `Faltan ${Math.abs(diferencia)} % por repartir`}</span>
                <span className="tabular-nums">
                  {total} / {grupo.budget} %
                </span>
              </AlertTitle>
            </Alert>
          </section>
        )
      })
    )

  return { borrador, cuadra, hayGrupos: grupos.length > 0, estado, cuadrarTodo: () => grupos.forEach(cuadrar), cuerpo }
}

function Dialogo({
  abierto,
  onAbiertoChange,
  grupos,
  onAplicar,
  titulo = 'Ajustar pesos',
  descripcion = 'Reparte el peso de cada objetivo sin entrar uno por uno. El total tiene que cerrar antes de aplicar.',
}: DialogoPesosProps) {
  const reparto = useRepartoPesos(grupos)
  const aplicar = () => {
    onAplicar(reparto.borrador)
    onAbiertoChange(false)
  }

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      media={
        <IconTile variant="elevated" size="xl">
          <HugeiconsIcon icon={BalanceScaleIcon} aria-hidden="true" />
        </IconTile>
      }
      title={titulo}
      sub={descripcion}
      footer={
          <>
            {/* -order-1: el estado va a la izquierda del pie, antes del hueco que ActionDialog deja para la nota. */}
            <span className="-order-1">{reparto.estado}</span>
            {!reparto.cuadra && reparto.hayGrupos ? (
              <Button variant="outline" onClick={reparto.cuadrarTodo}>
                Ajustar automáticamente
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => onAbiertoChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!reparto.cuadra || !reparto.hayGrupos} onClick={aplicar}>
              Aplicar
            </Button>
          </>
      }
    >
      {reparto.cuerpo}
    </ActionDialog>
  )
}

/** Un objetivo y cuánto pesa: deslizador y número (solo dígitos, se ajusta al salir del campo). */
function FilaPeso({ numero, objetivo, valor, maximo, onCambio }: { numero: number; objetivo: Objective; valor: number; maximo: number; onCambio: (peso: number) => void }) {
  const [texto, setTexto] = useState({ texto: String(valor), de: valor })
  const visible = texto.de === valor ? texto.texto : String(valor)
  const nombre = objetivo.title.trim() || 'Objetivo sin título'
  const confirmar = () => {
    const leido = Number.parseInt(visible, 10)
    const siguiente = Number.isNaN(leido) ? 0 : Math.max(0, Math.min(TOTAL_WEIGHT, leido))
    setTexto({ texto: String(siguiente), de: siguiente })
    onCambio(siguiente)
  }
  return (
    <Item size="sm" className="flex-wrap gap-3">
      <ItemContent className="min-w-48">
        <ItemTitle className="whitespace-normal">
          {numero}. {nombre}
        </ItemTitle>
      </ItemContent>
      <div className="flex items-center gap-3">
        <div className="w-36">
          <Slider
            aria-label={`Peso de ${nombre}`}
            value={[valor]}
            min={0}
            max={Math.max(maximo, MIN_OBJECTIVE_WEIGHT)}
            step={1}
            onValueChange={(nuevo) => onCambio(Array.isArray(nuevo) ? nuevo[0] : nuevo)}
          />
        </div>
        <div className="w-20">
          <InputGroup>
            <InputGroupInput
              inputMode="numeric"
              className="text-end tabular-nums"
              aria-label={`Peso de ${nombre} en porcentaje`}
              value={visible}
              onChange={(evento) => setTexto({ texto: evento.target.value.replace(/[^0-9]/g, ''), de: valor })}
              onBlur={confirmar}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') evento.currentTarget.blur()
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>%</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </Item>
  )
}
