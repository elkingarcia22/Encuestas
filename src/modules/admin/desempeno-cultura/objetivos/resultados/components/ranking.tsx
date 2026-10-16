import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpDownIcon, ChampionIcon, ChartDecreaseIcon, LockIcon, Medal01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle, InputGroup, InputGroupAddon, InputGroupInput, Item, ItemActions, ItemContent, ItemMedia, Progress, Text } from '@ubits/flux-ui'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { Badge } from '@/shared/components/Badge'
import { SinResultados } from '@/shared/components/SinResultados'
import { SelectorVista } from '../../../encuestas/resultados/components/controles'
import { formatoAvance } from '../../modelo/ciclos'
import { nombreCorte, type Corte } from '../../modelo/resultados/lecturas'
import { TONO_NIVEL, etiquetaNivel, riesgoDePersona } from '../../modelo/resultados/personas'
import { MINIMO_GRUPO, ranking, type FilaRanking, type ModoRanking } from '../../modelo/resultados/ranking'
import type { PersonaSeguida, ResultadosCiclo } from '../../modelo/resultados/seguimiento'

// La pestaña Ranking (9-oct, como el prototipo): arriba el mejor y el menor desempeño, y debajo la lista de mayor a menor
// avance, por el grupo de «Ver por» o por persona. Los tres primeros llevan medalla; un grupo de menos de tres personas
// sale bloqueado (no se compara) y una persona abre su ficha. Es una lista y no una tabla: se lee de arriba abajo, sin
// columnas que comparar.

const MODOS: readonly { value: ModoRanking; label: string }[] = [
  { value: 'grupo', label: 'Por grupo' },
  { value: 'persona', label: 'Por persona' },
]

function Podio({ titulo, icono, fila, tono }: { titulo: string; icono: typeof ChampionIcon; fila: FilaRanking; tono: 'success' | 'destructive' }) {
  return (
    <FramePanel className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={icono} size={16} className={tono === 'success' ? 'text-success' : 'text-destructive'} aria-hidden="true" />
        <Text as="span" size="sm" variant="muted" weight="medium">
          {titulo}
        </Text>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col">
          <Text as="span" size="lg" weight="semibold" className="truncate">
            {fila.etiqueta}
          </Text>
          <Text as="span" size="xs" variant="muted">
            {fila.detalle}
          </Text>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Text as="span" size="xl" weight="semibold" className="tabular-nums">
            {formatoAvance(fila.avance)}
          </Text>
          <Badge variant={TONO_NIVEL[fila.nivel]}>{etiquetaNivel(fila.nivel)}</Badge>
        </div>
      </div>
    </FramePanel>
  )
}

function Fila({ fila, puesto, abierto, onAbrir }: { fila: FilaRanking; puesto: number; abierto: boolean; onAbrir: (persona: PersonaSeguida) => void }) {
  const medalla = puesto <= 3 && !fila.bloqueada
  const riesgo = riesgoDePersona(fila.riesgo)
  const { persona } = fila
  return (
    <Item size="sm">
      <ItemMedia>
        <Badge variant={medalla ? 'warning-light' : 'outline'} className="min-w-7 justify-center tabular-nums" aria-label={`Puesto ${puesto}`}>
          {medalla ? <HugeiconsIcon icon={Medal01Icon} aria-hidden="true" /> : puesto}
        </Badge>
      </ItemMedia>
      <ItemContent className="min-w-0">
        {persona ? (
          <CeldaTitulo titulo={fila.etiqueta} detalle={fila.detalle} onClick={() => onAbrir(persona)} />
        ) : (
          <CeldaTitulo titulo={fila.etiqueta} detalle={fila.detalle} />
        )}
      </ItemContent>
      <ItemActions className="gap-3">
        {fila.bloqueada ? (
          <Badge variant="outline">
            <HugeiconsIcon icon={LockIcon} aria-hidden="true" />
            Menos de {MINIMO_GRUPO} personas
          </Badge>
        ) : (
          <>
            {abierto ? <Badge variant={riesgo.tono}>{fila.riesgo === 'sin' ? riesgo.etiqueta : `Riesgo ${riesgo.etiqueta.toLowerCase()}`}</Badge> : null}
            <Progress value={Math.min(100, fila.avance)} className="hidden w-40 lg:flex" aria-label={`Avance ${formatoAvance(fila.avance)}`} />
            <Text as="span" size="sm" weight="semibold" className="w-14 text-right tabular-nums">
              {formatoAvance(fila.avance)}
            </Text>
          </>
        )}
      </ItemActions>
    </Item>
  )
}

export function Ranking({ resultados, corte, onAbrir }: { resultados: ResultadosCiclo; corte: Corte; onAbrir: (persona: PersonaSeguida) => void }) {
  const [modo, setModo] = useState<ModoRanking>('grupo')
  const [busqueda, setBusqueda] = useState('')
  const [mayorPrimero, setMayorPrimero] = useState(true)
  const grupo = nombreCorte(corte).toLowerCase()

  const filas = useMemo(() => ranking(resultados, modo, corte), [resultados, modo, corte])
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const buscadas = q ? filas.filter((fila) => fila.etiqueta.toLowerCase().includes(q)) : filas
    return [...buscadas].sort((a, b) => (mayorPrimero ? b.avance - a.avance : a.avance - b.avance))
  }, [filas, busqueda, mayorPrimero])

  // El puesto es el de toda la lista, de mayor a menor: buscar o darle la vuelta no le cambia el número a nadie.
  const puestos = useMemo(() => new Map([...filas].sort((x, y) => y.avance - x.avance).map((fila, indice) => [fila.id, indice + 1])), [filas])

  // El podio sale de lo que se puede comparar (sin las filas bloqueadas), con o sin búsqueda.
  const comparables = [...filas.filter((fila) => !fila.bloqueada)].sort((a, b) => b.avance - a.avance)
  const mejor = comparables[0]
  const menor = comparables.length > 1 ? comparables[comparables.length - 1] : undefined
  const titulo = modo === 'persona' ? 'Ranking de personas' : `Ranking por ${grupo}`

  return (
    <div className="flex flex-col gap-6">
      {mejor ? (
        <Frame>
          <div className="grid gap-(--frame-gap) md:grid-cols-2">
            <Podio titulo="Mejor desempeño" icono={ChampionIcon} fila={mejor} tono="success" />
            {menor ? <Podio titulo="Menor desempeño" icono={ChartDecreaseIcon} fila={menor} tono="destructive" /> : null}
          </div>
        </Frame>
      ) : null}

      <Frame>
        {/* «!»: la misma cabecera en fila (título a la izquierda, controles a la derecha) que las cajas de Resultados de Encuestas. */}
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3!">
          <div>
            <FrameTitle>{titulo}</FrameTitle>
            <FrameDescription>
              {visibles.length.toLocaleString('es-CO')} {visibles.length === 1 ? 'resultado' : 'resultados'} · solo cuenta quien ya reportó avance
            </FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InputGroup className="w-48">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder={modo === 'persona' ? 'Buscar persona' : `Buscar ${grupo}`} aria-label="Buscar en el ranking" />
            </InputGroup>
            <Button variant="outline" size="sm" onClick={() => setMayorPrimero((valor) => !valor)}>
              <HugeiconsIcon icon={ArrowUpDownIcon} aria-hidden="true" />
              {mayorPrimero ? 'Mayor a menor' : 'Menor a mayor'}
            </Button>
            <SelectorVista valor={modo} opciones={MODOS} onCambio={setModo} etiqueta="Qué se compara" />
          </div>
        </FrameHeader>
        <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
          {visibles.length === 0 ? (
            filas.length === 0 ? (
              <Text as="p" size="sm" variant="muted" className="py-8 text-center">
                Con los filtros puestos no queda nadie que haya reportado avance.
              </Text>
            ) : (
              <SinResultados busqueda={busqueda} filtrosActivos={0} onLimpiar={() => setBusqueda('')} />
            )
          ) : (
            <ol className="divide-y">
              {visibles.map((fila, indice) => (
                <li key={fila.id}>
                  <Fila fila={fila} puesto={puestos.get(fila.id) ?? indice + 1} abierto={resultados.abierto} onAbrir={onAbrir} />
                </li>
              ))}
            </ol>
          )}
        </FramePanel>
        {visibles.some((fila) => fila.bloqueada) ? (
          <FrameFooter>
            <Text as="p" size="xs" variant="muted" className="flex items-start gap-2">
              <HugeiconsIcon icon={LockIcon} size={14} aria-hidden="true" className="mt-px shrink-0" />
              Las filas bloqueadas tienen menos de {MINIMO_GRUPO} personas: su promedio sería el resultado de una persona con el nombre de un grupo encima.
            </Text>
          </FrameFooter>
        ) : null}
      </Frame>
    </div>
  )
}
