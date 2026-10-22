import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUp01Icon, ArrowUpDownIcon, Folder01Icon } from '@hugeicons/core-free-icons'
import { Button, ButtonGroup, TableHead, Text, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'

// Las partes de las tablas de producto que no trae la librería (14 oct, Nicolás: «tenemos muchas cosas en las tablas que
// no se manejan» en el design system). Nacieron en Selección (Vacantes y Mis candidatos) y viven aquí para que la página
// de Tablas y las pantallas usen la misma: si una cambia, cambia en las dos. Que toda la fila abra está en abrir-al-tocar.ts.
// 16 oct: Vacantes y Mis candidatos pasaron a la tabla del sistema (TablaDatos), que trae su propia selección y sus
// acciones con las elegidas; la franja de «elegir todas las que coinciden» y la barra de lo elegido se fueron con la
// pestaña «Tabla completa». Quedan el encabezado que ordena (tablas de resultados), las carpetas de una fila y anterior y
// siguiente en un panel.

// ── Encabezado que ordena ──
// Toda la cabecera es el botón; el globo dice cómo ordena antes de tocarla y, una vez puesta, qué pasa si se vuelve a
// tocar (quitar el orden o invertirlo). Cada orden va en una sola dirección, la que se busca: de la A a la Z, de más a
// menos, lo más reciente primero.
export function EncabezadoOrdenable({
  activo,
  sentido = 'descending',
  invertido = false,
  ayuda,
  onOrdenar,
  className,
  children,
}: {
  activo: boolean
  // Lo que oye el lector de pantalla cuando está puesto: la A a la Z es «ascending»; de más a menos, «descending».
  sentido?: 'ascending' | 'descending'
  // Puesto y al revés (la flecha mira arriba).
  invertido?: boolean
  // El texto del globo: «Ordenar por nombre, de la A a la Z» o, puesto, «Quitar este orden».
  ayuda: string
  onOrdenar: () => void
  className?: string
  children: ReactNode
}) {
  const icono = !activo ? ArrowUpDownIcon : invertido ? ArrowUp01Icon : ArrowDown01Icon
  return (
    <TableHead className={className} aria-sort={activo ? sentido : undefined}>
      <Hint label={ayuda}>
        <Button variant="ghost" size="xs" className="-ml-2 max-w-full" onClick={onOrdenar}>
          <span className="flex min-w-0 items-center gap-1.5 truncate">{children}</span>
          <HugeiconsIcon icon={icono} size={14} className={activo ? undefined : 'text-muted-foreground'} aria-hidden="true" />
        </Button>
      </Hint>
    </TableHead>
  )
}

// ── Las carpetas de una fila ──
// La primera y «+N» con las demás en el globo, para que la fila no crezca. El lector de pantalla oye la lista entera.
export function CarpetasDeFila({
  carpetas,
  icono = Folder01Icon,
  nombre = 'Carpetas',
  className,
}: {
  carpetas: string[]
  icono?: IconSvgElement
  nombre?: string
  className?: string
}) {
  if (!carpetas.length) return null
  const [primera, ...resto] = carpetas
  return (
    <span className={cn('flex shrink-0 items-center gap-1', className)}>
      <span className="sr-only">
        {nombre}: {carpetas.join(', ')}
      </span>
      <Badge variant="secondary" aria-hidden="true">
        <HugeiconsIcon icon={icono} size={10} aria-hidden="true" />
        {primera}
      </Badge>
      {resto.length ? (
        <Hint label={resto.join(', ')} side="top">
          <Badge variant="outline" aria-hidden="true" className="tabular-nums">
            +{resto.length}
          </Badge>
        </Hint>
      ) : null}
    </span>
  )
}

// ── Pasar de un registro al siguiente sin cerrar el panel ──
// Arriba del panel que se abrió desde la fila: «3 de 43» y las flechas. La tabla acompaña (pasa a la página de quien se
// está viendo); eso lo hace la pantalla.
export function NavegarRegistros({
  indice,
  total,
  nombre,
  onIr,
}: {
  indice: number
  total: number
  // Qué se recorre, para las flechas: «Persona» → «Persona anterior».
  nombre: string
  onIr: (indice: number) => void
}) {
  return (
    <div className="flex items-center justify-end border-b px-4 py-1.5">
      <div data-region="Anterior / siguiente" className="flex items-center gap-2.5">
        <Text as="span" variant="muted" size="sm" className="tabular-nums">
          {indice + 1} de {total}
        </Text>
        <ButtonGroup>
          <Button variant="outline" size="icon-xs" aria-label={`${nombre} anterior`} disabled={indice <= 0} onClick={() => onIr(indice - 1)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon-xs" aria-label={`${nombre} siguiente`} disabled={indice >= total - 1} onClick={() => onIr(indice + 1)}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}
