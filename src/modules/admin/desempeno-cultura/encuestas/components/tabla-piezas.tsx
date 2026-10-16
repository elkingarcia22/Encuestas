import { useEffect, useRef, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUpDownIcon, FilterIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PiePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'

// Piezas de la tabla de encuestas, con el mismo comportamiento que la tabla de Vacantes: el
// encabezado ordena al hacer clic (ascendente, descendente y nada), el embudo filtra la columna
// desde su propio encabezado y el pie pagina o carga más al bajar.

export function EncabezadoOrdenable({
  etiqueta,
  campo,
  ordenActual,
  onOrdenar,
}: {
  etiqueta: string
  campo: string
  ordenActual?: string
  onOrdenar: (campo: string) => void
}) {
  const activo = ordenActual === campo || ordenActual === `-${campo}`
  const descendente = ordenActual === `-${campo}`
  return (
    <Button variant="ghost" size="sm" onClick={() => onOrdenar(campo)} className={cn('-ms-2 h-8 gap-1.5 px-2 font-medium', !activo && 'text-muted-foreground')}>
      {etiqueta}
      <HugeiconsIcon
        icon={activo ? (descendente ? ArrowDown01Icon : ArrowUp01Icon) : ArrowUpDownIcon}
        size={14}
        aria-hidden="true"
        className={activo ? undefined : 'opacity-40'}
      />
    </Button>
  )
}

export function FiltroColumna({
  etiqueta,
  opciones,
  seleccion,
  onCambiar,
}: {
  etiqueta: string
  opciones: readonly string[]
  seleccion: readonly string[]
  onCambiar: (valores: string[]) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Filtrar por ${etiqueta}`} />}>
        <HugeiconsIcon icon={FilterIcon} size={14} aria-hidden="true" className={seleccion.length > 0 ? 'text-primary' : 'text-muted-foreground'} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          {opciones.map((opcion) => (
            <DropdownMenuCheckboxItem
              key={opcion}
              checked={seleccion.includes(opcion)}
              onCheckedChange={(activo) => onCambiar(activo ? [...seleccion, opcion] : seleccion.filter((valor) => valor !== opcion))}
            >
              {opcion}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        {seleccion.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCambiar([])}>Quitar filtro</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// El botón carga más filas al hacer clic y también solo, cuando entra en pantalla al bajar.
export function BotonCargarMas({ onCargarMas }: { onCargarMas: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) onCargarMas()
      },
      { rootMargin: '200px' },
    )
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [onCargarMas])
  return (
    <div className="flex justify-center">
      <Button ref={ref} variant="outline" size="sm" onClick={onCargarMas}>
        Cargar más
      </Button>
    </div>
  )
}

// El pie de las listas de Encuestas que aún no están en TablaDatos (auditoría 5-oct, decisiones 2 y 21): ya no es un
// paginador propio (5/10/25, «1–10 de 84») sino el de todo el admin, PiePaginacion («Filas por página» 10/20/50,
// «Viendo 1–10 de 84 encuestas», «Anterior / Siguiente»). Conserva sus props para no tocar a quien lo usa.
export function Paginacion({
  id,
  actual,
  total,
  porPagina,
  onCambiarPagina,
  onCambiarPorPagina,
  nombre = 'resultados',
}: {
  id: string
  actual: number
  total: number
  porPagina: number
  onCambiarPagina: (pagina: number) => void
  onCambiarPorPagina: (porPagina: number) => void
  // Lo que se pagina, en plural, para «Viendo 1–10 de 84 personas».
  nombre?: string
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const pagina = Math.min(actual, paginas)
  return (
    <PiePaginacion
      id={id}
      nombre={nombre}
      // Va en el pie gris de un marco o suelto bajo una lista: en los dos casos sin relleno propio, como antes.
      enMarco
      estado={{
        porPagina,
        setPorPagina: (valor) => onCambiarPorPagina(typeof valor === 'function' ? valor(porPagina) : valor),
        pagina,
        setPagina: (valor) => onCambiarPagina(typeof valor === 'function' ? valor(pagina) : valor),
        paginas,
        desde: total ? (pagina - 1) * porPagina + 1 : 0,
        hasta: Math.min(pagina * porPagina, total),
        total,
      }}
    />
  )
}

export type AccionSeleccion = { id: string; etiqueta: string; icono: ReactNode; destructiva?: boolean; deshabilitada?: boolean; motivo?: string; onClick: () => void }

// Las acciones de lo marcado, en la cabecera junto al buscador: botones de solo icono con su nombre al pasar el cursor.
// Igual que la franja de selección de DataGridList en Vacantes y en la lista de encuestas, para que las tablas armadas
// a mano se vean y se usen igual que las de la librería.
export function AccionesSeleccion({ acciones }: { acciones: AccionSeleccion[] }) {
  return (
    <div className="flex items-center gap-1">
      {acciones.map((accion) => (
        <Hint key={accion.id} label={accion.deshabilitada && accion.motivo ? accion.motivo : accion.etiqueta}>
          {/* El span deja abrir la ayuda aunque el botón esté apagado: un botón deshabilitado no recibe el cursor. */}
          <span className="inline-flex">
            <Button variant={accion.destructiva ? 'destructive' : 'outline'} size="icon-sm" aria-label={accion.etiqueta} disabled={accion.deshabilitada} onClick={accion.onClick}>
              {accion.icono}
            </Button>
          </span>
        </Hint>
      ))}
    </div>
  )
}
