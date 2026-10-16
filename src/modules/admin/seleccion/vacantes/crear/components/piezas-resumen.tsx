import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Badge, Frame, FrameHeader, FramePanel, FrameTitle, Heading, Progress, Text } from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { plural } from '@/modules/design-system/patrones/formato'

// Las piezas del panel «Así va…» de los asistentes de creación (Vacantes y Encuestas): la tarjeta con su
// contexto fijo arriba y las filas con que cada paso cuenta lo suyo. Las dos pantallas las comparten para
// que el panel se lea igual en ambas.

// El marco: «Así va la …» arriba y, en la caja, el nombre, sus insignias y una línea de contexto; debajo, lo del paso.
export function TarjetaResumen({
  kicker,
  nombre,
  sinNombre,
  insignias,
  contexto,
  estado,
  descripcion,
  children,
}: {
  kicker: string
  nombre: string
  sinNombre: string
  insignias?: ReactNode
  /** Una línea de contexto, o varias: cada una va en su renglón, sin mezclar datos distintos. */
  contexto?: string | readonly string[]
  /** A la derecha del título del marco: el estado de guardado, por ejemplo. */
  estado?: ReactNode
  /** Justo debajo del nombre: un texto corto, de máximo dos líneas y con puntos suspensivos si es más largo. */
  descripcion?: string
  children: ReactNode
}) {
  // «Así va la …» va fuera de la caja, en el marco, como el título de «Empieza con una plantilla» en los homes.
  return (
    <Frame>
      <FrameHeader className={estado ? 'flex-row items-center justify-between gap-3' : undefined}>
        <FrameTitle>{kicker}</FrameTitle>
        {estado}
      </FrameHeader>
      <FramePanel className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {/* Un nombre largo se corta en dos líneas con puntos suspensivos y el tooltip lo dice completo. */}
          <TextoCompleto texto={nombre}>
            <Heading as="h2" level={5} className={nombre ? 'line-clamp-2 break-words' : 'text-muted-foreground!'}>
              {nombre || sinNombre}
            </Heading>
          </TextoCompleto>
          {descripcion ? (
            <TextoCompleto texto={descripcion}>
              <Text as="p" variant="muted" size="sm" className="line-clamp-2 break-words">
                {descripcion}
              </Text>
            </TextoCompleto>
          ) : null}
          {nombre && insignias ? <div className="flex flex-wrap gap-1.5">{insignias}</div> : null}
          {[contexto ?? []].flat().map((linea) => (
            <Text key={linea} as="p" variant="muted" size="sm">
              {linea}
            </Text>
          ))}
        </div>
        {children}
      </FramePanel>
    </Frame>
  )
}

// La barra de avance con lo obligatorio que falta, o el aviso de que ya está todo.
export function AvanceObligatorios({ falta, total, listo = 'Todo lo obligatorio está listo.' }: { falta: string[]; total: number; listo?: string }) {
  if (!falta.length) return <Aviso tono="success">{listo}</Aviso>
  const listos = total - falta.length
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Aviso tono="warning">{plural(falta.length, 'Falta un dato', `Faltan ${falta.length} datos`)}</Aviso>
        <Text as="span" variant="muted" size="xs" className="tabular-nums">
          {listos} de {total}
        </Text>
      </div>
      <Progress value={(listos / total) * 100} aria-label={`${listos} de ${total} datos obligatorios`} />
      <Lista items={falta} />
    </div>
  )
}

export function Aviso({ tono, children }: { tono: 'warning' | 'success'; children: string }) {
  return (
    <div className="flex items-center gap-2">
      <HugeiconsIcon
        icon={tono === 'warning' ? Alert02Icon : CheckmarkCircle02Icon}
        size={16}
        className={tono === 'warning' ? 'shrink-0 text-warning' : 'shrink-0 text-success'}
        aria-hidden="true"
      />
      <Text as="span" size="sm" weight={tono === 'warning' ? 'medium' : undefined}>
        {children}
      </Text>
    </div>
  )
}

export function Lista({ items }: { items: string[] }) {
  return (
    <Text as="ul" variant="muted" size="sm" className="ml-6 list-disc">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Text>
  )
}

// Un bloque de filas bajo una línea, para separar lo elegido de lo que falta.
export function BloqueResumen({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 border-t pt-4">{children}</div>
}

// Término a la izquierda y un valor corto a la derecha.
export function FilaDato({ termino, children }: { termino: string; children: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0">
        <Text as="span" variant="muted" size="sm">
          {termino}
        </Text>
      </dt>
      <dd className="min-w-0 text-right">
        <Text as="span" size="sm">
          {children}
        </Text>
      </dd>
    </div>
  )
}

export function ListaDatos({ filas }: { filas: { termino: string; valor: string }[] }) {
  if (!filas.length) return null
  // Lista de término y valor: es texto, no una tabla, y así la lee bien un lector de pantalla.
  return (
    <dl className="flex flex-col gap-2.5">
      {filas.map((fila) => (
        <FilaDato key={fila.termino} termino={fila.termino}>
          {fila.valor}
        </FilaDato>
      ))}
    </dl>
  )
}

// Título arriba y su detalle debajo: el detalle es una frase que puede ocupar varias líneas.
export function ItemDetalle({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text as="div" size="sm" weight="medium">
        {titulo}
      </Text>
      <Text as="div" variant="muted" size="sm">
        {detalle}
      </Text>
    </div>
  )
}

// Título a la izquierda y una insignia de estado a la derecha, como «Completa» en las secciones del
// asistente: dice si ya se hizo, no qué se escribió ahí.
export function ItemEstado({
  titulo,
  completa,
  hecho = 'Completa',
  pendiente = 'Sin escribir',
}: {
  titulo: string
  completa: boolean
  hecho?: string
  pendiente?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Text as="span" size="sm" className="min-w-0 truncate">
        {titulo}
      </Text>
      {completa ? (
        <Badge variant="success-light" className="shrink-0">
          <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
          {hecho}
        </Badge>
      ) : (
        <Badge variant="outline" className="shrink-0">
          {pendiente}
        </Badge>
      )}
    </div>
  )
}
