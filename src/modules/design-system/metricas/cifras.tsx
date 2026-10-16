import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Frame, FramePanel, Text } from '@ubits/flux-ui'

import { Sparkline } from './graficos'

// Design system › Métricas: las cifras de un tablero (fila de cifras y tarjeta con minigráfico). Esta fila va sin
// comparación; cuando la cifra se compara con el periodo anterior se usa la fila de Selección (FilaIndicadores con
// `Cambio` y `Ayuda` de admin/seleccion/propuestas/components/cifras), que volvió el 6-oct con la forma de Nicolás.
// Vivían repartidas en el Inicio (bloques.tsx), en Tareas y en el Dashboard del Archivo; desde el 29-sep están
// aquí y los archivos viejos solo las reenvían. Todas combinan componentes de flux-ui; no dibujan nada propio.
// Documentadas en /design-system/metricas.

// Tarjeta de indicador con minigráfico: valor, tendencia y contra qué se compara.
export function TarjetaIndicador({
  titulo,
  detalle,
  valor,
  comparacion,
  serie,
}: {
  titulo: string
  detalle: string
  valor: string
  comparacion: string
  serie: number[]
}) {
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{detalle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3">
          <Text as="span" size="xl" weight="semibold">
            {valor}
          </Text>
          <div className="h-10 w-28 shrink-0" aria-hidden="true">
            <Sparkline datos={serie} color="var(--primary)" />
          </div>
        </div>
        <Text as="span" variant="muted" size="xs">
          {comparacion}
        </Text>
      </CardContent>
    </Card>
  )
}

// ── Fila de cifras ──
// Una cifra de tablero: nombre arriba, número en seminegrita y detalle gris debajo.
// `atencion` suma la insignia «Requiere atención» (la usaba el caso Seguimiento en sus tarjetas sueltas).
export type Cifra = {
  valor: string
  etiqueta: string
  detalle?: string
  atencion?: boolean
}

export function CeldaCifra({ cifra }: { cifra: Cifra }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Text as="span" variant="muted" size="sm">
        {cifra.etiqueta}
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <Text as="span" size="xl" weight="semibold">
          {cifra.valor}
        </Text>
        {cifra.atencion ? (
          <Badge variant="destructive-outline" size="sm">
            Requiere atención
          </Badge>
        ) : null}
      </div>
      {cifra.detalle ? (
        <Text as="span" variant="muted" size="xs">
          {cifra.detalle}
        </Text>
      ) : null}
    </div>
  )
}

// Fila de cifras separadas por líneas verticales (en pantallas chicas se apilan). Acuerdo del 14-sep: las
// métricas van en una sola tarjeta partida, no en tarjetas sueltas.
export function FilaCifras({ cifras, columnas }: { cifras: Cifra[]; columnas: string }) {
  return (
    <div className={`divide-border grid gap-5 lg:gap-0 lg:divide-x ${columnas}`}>
      {cifras.map((cifra) => (
        <div key={cifra.etiqueta} className="lg:px-5 lg:first:ps-0 lg:last:pe-0">
          <CeldaCifra cifra={cifra} />
        </div>
      ))}
    </div>
  )
}

// La fila de cifras dentro de su marco, sola sobre la página (Tareas, listas del admin). Dentro de una tarjeta que
// ya tiene marco se usa FilaCifras sin esto.
export function Indicadores({ cifras, columnas = 'sm:grid-cols-2 lg:grid-cols-4' }: { cifras: Cifra[]; columnas?: string }) {
  return (
    <Frame>
      <FramePanel>
        <FilaCifras cifras={cifras} columnas={columnas} />
      </FramePanel>
    </Frame>
  )
}
