import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Skeleton,
  TrafficLight,
} from '@ubits/flux-ui'
import { GraficoArea } from '@/modules/design-system/metricas/graficos'
import type { Resumen } from './datos'

// Cuántos aplican con el tiempo, y cuántos de ellos pasan el filtro del CV.

const SERIES = [
  { clave: 'aplicaron', nombre: 'Aplicaron', color: 'var(--chart-1)' },
  {
    clave: 'pasaron',
    nombre: 'Pasaron el CV',
    color: 'var(--chart-4)',
  },
]

// Cuántos aplican en el tiempo. Sin «De dónde llegan» al lado (8 oct, VP de producto: el canal no se sabe).
export function Llegadas({ resumen, cargando }: { resumen: Resumen; cargando: boolean }) {
  const { serie, porSemana, dias, candidatos, embudo } = resumen
  const pico = [...serie].sort((a, b) => b.aplicaron - a.aplicaron)[0]
  const ultimo = serie.at(-1)
  const cuando =
    pico === ultimo ? `${porSemana ? 'esta semana' : 'hoy'}` : porSemana ? `la semana que terminó el ${pico?.tramo}` : `el ${pico?.tramo}`

  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>Cuántos aplican</FrameTitle>
        <FrameDescription>
          {porSemana ? 'Por semana' : 'Por día'}, en los últimos {dias} días.{' '}
          {!cargando && pico?.aplicaron ? `Donde más llegaron fue ${cuando}: ${pico.aplicaron}.` : ''}
        </FrameDescription>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col justify-between gap-3">
        {cargando ? (
          <Skeleton className="h-60 w-full rounded-xl" aria-hidden="true" />
        ) : (
          <GraficoArea datos={serie} eje="tramo" series={SERIES} unidad=" personas" />
        )}
        <TrafficLight
          data={{
            label: `En los últimos ${dias} días`,
            items: [
              // Los totales son los de las cifras y el embudo de arriba, para que todo sume lo mismo.
              {
                label: SERIES[0].nombre,
                value: cargando ? '' : candidatos.toLocaleString('es-CO'),
                color: SERIES[0].color,
              },
              {
                label: SERIES[1].nombre,
                value: cargando ? '' : (embudo[1]?.llegaron ?? 0).toLocaleString('es-CO'),
                color: SERIES[1].color,
              },
            ],
          }}
        />
      </FramePanel>
    </Frame>
  )
}
