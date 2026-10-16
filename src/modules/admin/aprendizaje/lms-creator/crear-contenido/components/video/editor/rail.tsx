import { useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowDownDoubleIcon,
  ArrowLeftRightIcon,
  ArrowUp01Icon,
  ArrowUpDoubleIcon,
  Copy01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  MoreVerticalIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Sortable,
  SortableItem,
  SortableItemHandle,
  cn,
} from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { minutos, nombreTransicion } from '../datos'
import { MiniaturaEscena } from '../lienzo'
import { duracionTotal, nombreEscena, ocupada, tituloCorto, type Escena, type Proyecto, type TipoEscena } from '../proyecto'
import { TIPOS } from './tipos-escena'

// Rail «Escenas» del editor: la lista con miniatura, título corto y duración; entre cada par, el botón de la
// transición de entrada; y el menú de cada escena (mover, duplicar, eliminar). Se reordena arrastrando, salvo mientras
// corre la cola inicial o se genera el video.

type Props = {
  proyecto: Proyecto
  seleccion: string | null
  ahora: number
  bloqueado: boolean
  onElegir: (id: string) => void
  /** Una escena nueva del tipo elegido, en el lugar elegido (al inicio, al final o junto a la seleccionada). */
  onAgregar: (tipo: TipoEscena, donde: DondeEscena) => void
  onOrden: (escenas: Escena[]) => void
  onMover: (i: number, delta: number) => void
  onDuplicar: (id: string) => void
  onEliminar: (id: string) => void
  onTransicion: (i: number) => void
}

export type DondeEscena = 'inicio' | 'antes' | 'despues' | 'final'

/**
 * Dónde entra la escena nueva, como en el editor de AI Studio («Al inicio», «Al final») más las dos que pidió Dave
 * (14-oct): arriba y abajo de la que está seleccionada.
 */
const DONDE: { id: DondeEscena; label: string; icono: typeof Add01Icon }[] = [
  { id: 'inicio', label: 'Al inicio', icono: ArrowUpDoubleIcon },
  { id: 'antes', label: 'Arriba de la seleccionada', icono: ArrowUp01Icon },
  { id: 'despues', label: 'Debajo de la seleccionada', icono: ArrowDown01Icon },
  { id: 'final', label: 'Al final', icono: ArrowDownDoubleIcon },
]

function estadoCarga(e: Escena, ahora: number) {
  if (!ocupada(e, ahora) || !e.ocupada) return null
  if (e.ocupada.motivo === 'cola') return 'Generando'
  if (e.ocupada.motivo === 'sincronizar') return 'Sincronizando'
  if (e.ocupada.motivo === 'audio') return null
  return 'Regenerando'
}

export function RailEscenas({ proyecto, seleccion, ahora, bloqueado, onElegir, onAgregar, onOrden, onMover, onDuplicar, onEliminar, onTransicion }: Props) {
  const lista = useRef<HTMLDivElement>(null)
  const escenas = proyecto.escenas

  // La escena elegida (también la que avanza sola al reproducir) queda a la vista.
  useEffect(() => {
    lista.current?.querySelector(`[data-escena="${seleccion}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [seleccion])

  return (
    <Frame spacing="sm" className="h-full min-h-0">
      {/* El nombre de la columna y su total viven en el gris; el panel blanco es solo la lista (Dave, 9-oct). */}
      <FrameHeader className="flex shrink-0 flex-row items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <FrameTitle>Escenas ({escenas.length})</FrameTitle>
          <FrameDescription>{minutos(duracionTotal(proyecto))} min en total</FrameDescription>
        </div>
      </FrameHeader>

      <FramePanel className="flex min-h-0 flex-1 flex-col overflow-hidden px-0!">
      <div ref={lista} className="min-h-0 flex-1 overflow-auto px-2">
        {/* Cada escena es una sola tarjeta (Item «outline»): asa, miniatura, título y menú dentro del mismo borde; la
            elegida pasa entera a «muted». Entre dos tarjetas hay aire, y la transición va encima de ese aire,
            montada sobre el filo de las dos, sin ocupar un renglón propio. */}
        <Sortable value={escenas} onValueChange={onOrden} getItemValue={(e) => e.id} className="flex flex-col gap-3 py-1">
          {escenas.map((e, i) => {
            const carga = estadoCarga(e, ahora)
            const siguiente = escenas[i + 1]
            const elegida = seleccion === e.id
            return (
              <SortableItem key={e.id} value={e.id} data-escena={e.id} className="relative">
                <Item variant={elegida ? 'muted' : 'outline'} size="xs" className={cn('relative flex-nowrap gap-1.5 pl-1.5', elegida && 'border-border!')}>
                  {/* La escena elegida lleva una línea azul a la izquierda, para ubicarla de un vistazo. 36 px fijos,
                      los mismos que la página activa del índice de Crear contenido: antes iba con 8 px de aire arriba
                      y abajo, que aquí daba siempre lo mismo porque las tarjetas de escena miden todas igual, pero
                      dejaba la medida atada al alto de la tarjeta en vez de ser una sola para las dos listas
                      (Dave, 6-oct). */}
                  {elegida ? (
                    <span aria-hidden="true" className="absolute top-1/2 left-0 h-9 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                  ) : null}
                  {bloqueado ? null : (
                    <SortableItemHandle aria-label={`Arrastrar escena ${i + 1} para reordenar`} className="flex text-muted-foreground">
                      <HugeiconsIcon icon={DragDropVerticalIcon} size={14} aria-hidden="true" />
                    </SortableItemHandle>
                  )}
                  <button
                    type="button"
                    aria-current={elegida ? 'true' : undefined}
                    aria-label={`${nombreEscena(i)}: ${tituloCorto(e, i)}`}
                    onClick={() => onElegir(e.id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
                  >
                    <ItemMedia className="relative w-16 shrink-0 self-center overflow-hidden rounded-md border">
                      <MiniaturaEscena proyecto={proyecto} escena={e} />
                      {carga ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <AiThinking label={carga} orb={false} />
                        </span>
                      ) : null}
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="w-full tabular-nums">{nombreEscena(i)}</ItemTitle>
                      <ItemDescription className="tabular-nums">{minutos(e.duracion)}</ItemDescription>
                    </ItemContent>
                  </button>
                  <DropdownMenu>
                    <Hint label="Opciones">
                      <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Opciones de la escena ${i + 1}`} />}>
                        <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                      </DropdownMenuTrigger>
                    </Hint>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuGroup>
                        {/* Todas con su icono, no solo «Eliminar» (Dave, 14-oct). */}
                        <DropdownMenuItem disabled={i === 0 || bloqueado} onClick={() => onMover(i, -1)}>
                          <HugeiconsIcon icon={ArrowUp01Icon} size={16} aria-hidden="true" />
                          Mover arriba
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={i === escenas.length - 1 || bloqueado} onClick={() => onMover(i, 1)}>
                          <HugeiconsIcon icon={ArrowDown01Icon} size={16} aria-hidden="true" />
                          Mover abajo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicar(e.id)}>
                          <HugeiconsIcon icon={Copy01Icon} size={16} aria-hidden="true" />
                          Duplicar
                        </DropdownMenuItem>
                        {escenas.length > 1 ? (
                          <DropdownMenuItem variant="destructive" onClick={() => onEliminar(e.id)}>
                            <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                            Eliminar
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Item>
                {siguiente ? (
                  // Centrado sobre los 12 px de aire que separan esta tarjeta de la siguiente (-bottom-1.5 = la mitad).
                  <div className="absolute -bottom-1.5 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
                    <Hint label={`Transición: ${nombreTransicion(siguiente.transicion)}`}>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        aria-label={`Elegir transición hacia escena ${i + 2}: ${nombreTransicion(siguiente.transicion)}`}
                        disabled={ocupada(e, ahora) || ocupada(siguiente, ahora)}
                        onClick={() => onTransicion(i + 1)}
                      >
                        <HugeiconsIcon icon={ArrowLeftRightIcon} size={14} />
                      </Button>
                    </Hint>
                  </div>
                ) : null}
              </SortableItem>
            )
          })}
        </Sortable>
      </div>

      {/* Un solo «Añadir escena», secundario y con su menú, como en el editor de AI Studio (Dave, 14-oct). Antes había dos
          botones que hacían lo mismo (este y un «+» en el encabezado). */}
      <div className="shrink-0 border-t px-2 pt-2 pb-0">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="w-full" disabled={bloqueado} />}>
            <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" aria-hidden="true" />
            Añadir escena
          </DropdownMenuTrigger>
          {/* Con submenús, como en producción (Dave, 14-oct): el tipo en una fila y, al pasar o al entrar, dónde entra. */}
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuGroup>
              {TIPOS.map((tipo) => (
                <DropdownMenuSub key={tipo.id}>
                  <DropdownMenuSubTrigger>
                    <HugeiconsIcon icon={tipo.icono} size={16} aria-hidden="true" />
                    {tipo.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-60">
                    <DropdownMenuGroup>
                      {DONDE.map((d) => (
                        <DropdownMenuItem
                          key={d.id}
                          // Arriba o abajo de la seleccionada solo con una escena elegida.
                          disabled={(d.id === 'antes' || d.id === 'despues') && !seleccion}
                          onClick={() => onAgregar(tipo.id, d.id)}
                        >
                          <HugeiconsIcon icon={d.icono} size={16} aria-hidden="true" />
                          {d.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </FramePanel>
    </Frame>
  )
}
