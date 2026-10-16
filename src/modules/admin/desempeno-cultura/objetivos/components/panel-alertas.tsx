import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { alertasDe, ciclosConAlerta, type AlertaCiclo, type Prioridad } from '../modelo/alertas'
import type { Ciclo } from '../modelo/ciclos'

// «Para atender», con el mismo armado que el de Encuestas: los tres casos más urgentes en fila (alta primero y, dentro
// de cada prioridad, el que cierra antes), cada uno con la acción que lo resuelve de una vez —«Recordar a 12»— y la
// flecha que lleva al ciclo. «Ver en la lista» deja la tabla de abajo solo con los ciclos que tienen algún caso, que era
// lo que hacía la alerta «Avance bajo» del home original. Lo resuelto sale del panel (en esta maqueta, hasta recargar).

const EN_EL_HOME = 3

const PRIORIDADES: Record<Prioridad, { titulo: string; insignia: 'destructive-outline' | 'warning-light' }> = {
  alta: { titulo: 'Alta', insignia: 'destructive-outline' },
  media: { titulo: 'Media', insignia: 'warning-light' },
}

function ColumnaAlerta({ alerta, onRecordar, onAbrir }: { alerta: AlertaCiclo; onRecordar: (alerta: AlertaCiclo) => void; onAbrir: (ciclo: Ciclo) => void }) {
  const prioridad = PRIORIDADES[alerta.prioridad]
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:px-5 lg:first:ps-0 lg:last:pe-0">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={prioridad.insignia} size="sm" className="shrink-0">
            {prioridad.titulo}
          </Badge>
          <TextoCompleto texto={alerta.ciclo.nombre}>
            <Text as="span" size="sm" variant="muted" className="truncate">
              {alerta.ciclo.nombre}
            </Text>
          </TextoCompleto>
        </div>
        <TextoCompleto texto={alerta.titulo}>
          <Text as="span" size="sm" weight="semibold" className="line-clamp-1">
            {alerta.titulo}
          </Text>
        </TextoCompleto>
        <TextoCompleto texto={alerta.resumen}>
          <Text as="p" size="xs" variant="muted" className="line-clamp-2">
            {alerta.resumen}
          </Text>
        </TextoCompleto>
      </div>
      <div className="mt-auto flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onRecordar(alerta)}>
          Recordar a {alerta.personas}
        </Button>
        <Hint label="Ver ciclo">
          <BotonIcono aria-label={`Ver el ciclo ${alerta.ciclo.nombre}`} onClick={() => onAbrir(alerta.ciclo)}>
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          </BotonIcono>
        </Hint>
      </div>
    </div>
  )
}

export function PanelAlertas({
  ciclos,
  onRecordar,
  onAbrir,
  onVerEnLista,
}: {
  ciclos: readonly Ciclo[]
  onRecordar: (alerta: AlertaCiclo) => void
  onAbrir: (ciclo: Ciclo) => void
  /** Deja la lista solo con estos ciclos. */
  onVerEnLista: (ids: readonly string[]) => void
}) {
  const [resueltas, setResueltas] = useState<ReadonlySet<string>>(new Set())
  const alertas = useMemo(() => alertasDe(ciclos).filter((alerta) => !resueltas.has(alerta.id)), [ciclos, resueltas])

  if (alertas.length === 0) return null

  const recordar = (alerta: AlertaCiclo) => {
    onRecordar(alerta)
    setResueltas((previas) => new Set(previas).add(alerta.id))
  }
  const cuantas = (prioridad: Prioridad) => alertas.filter((alerta) => alerta.prioridad === prioridad).length
  const ids = [...ciclosConAlerta(alertas)]

  return (
    <section aria-label="Para atender">
      <Frame>
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3!">
          <div className="flex min-w-0 flex-col gap-1">
            <FrameTitle>Para atender</FrameTitle>
            <FrameDescription>Lo más urgente de tus ciclos, con la acción que lo resuelve.</FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['alta', 'media'] as const)
              .filter((prioridad) => cuantas(prioridad) > 0)
              .map((prioridad) => (
                <Badge key={prioridad} variant={PRIORIDADES[prioridad].insignia} size="sm" className="tabular-nums">
                  {cuantas(prioridad)} {PRIORIDADES[prioridad].titulo.toLowerCase()}
                </Badge>
              ))}
            <Button variant="ghost" size="sm" onClick={() => onVerEnLista(ids)}>
              Ver en la lista ({ids.length})
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="divide-border grid gap-5 lg:grid-cols-3 lg:gap-0 lg:divide-x">
          {alertas.slice(0, EN_EL_HOME).map((alerta) => (
            <ColumnaAlerta key={alerta.id} alerta={alerta} onRecordar={recordar} onAbrir={onAbrir} />
          ))}
        </FramePanel>
      </Frame>
    </section>
  )
}
