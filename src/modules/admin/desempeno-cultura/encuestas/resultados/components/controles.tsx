import { Fragment } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowDown01Icon, FilterIcon, InformationCircleIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { FiltroChip } from '@/modules/admin/seleccion/propuestas/components/filtro-chip'
import type { ScaleTone } from '../../modelo/favorabilityScale'
import type { SegmentDefinition } from '../../modelo/surveyResults'
import { FONDO_ESCALA, TEXTO_ESCALA } from './escala'
import { NIVELES, type FiltrosResultados } from './filtros'

// Los controles de la esquina de «Secciones» y del mapa de calor. Conviene distinguirlos:
// «Ver por» elige qué forma las columnas (no filtra); «Filtros» recalcula los números para una
// población más estrecha; «Niveles» apaga los números de un nivel sin borrar la fila; «Resaltar»
// atenúa lo que cae fuera de las bandas marcadas sin cambiar ningún número.

/** Una banda de leyenda. «brand» es el azul de la marca, para escalas que no son de favorabilidad. */
export type OpcionEscala = { id: string; label: string; range: string; tone: ScaleTone | 'brand' }

export type Vista = 'secciones' | 'mapa'

const SIN_FILTRO = '__todos__'

// Como el selector de periodo de Navegación › Tablero con vistas: un botón que dice lo elegido («Por área») y abre un
// menú con las opciones. Sin la etiqueta suelta «Ver por» ni un ancho fijo, ocupa la mitad de la barra.
/** «Ver por» como botón con menú («Por área ▾»): el mismo para demográficos, métricas o lo que la vista cambie. */
export function MenuVerPor<T extends string>({ opciones, valor, onCambio }: { opciones: readonly { value: T; label: string }[]; valor: T; onCambio: (valor: T) => void }) {
  const activa = opciones.find((opcion) => opcion.value === valor) ?? opciones[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label={`Ver por: ${activa?.label ?? ''}`} />}>
        Por {activa?.label.toLowerCase()}
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ver por</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={valor} onValueChange={(nuevo) => onCambio(nuevo as T)}>
            {opciones.map((opcion) => (
              <DropdownMenuRadioItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function VerPor({ segmentos, activo, onCambio }: { segmentos: readonly SegmentDefinition[]; activo: SegmentDefinition; onCambio: (clave: string) => void }) {
  return <MenuVerPor opciones={segmentos.map((opcion) => ({ value: opcion.key, label: opcion.label }))} valor={activo.key} onCambio={onCambio} />
}

export function Filtros({ estado, activo, etiqueta = 'Filtros' }: { estado: FiltrosResultados; activo: SegmentDefinition; etiqueta?: string }) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={FilterIcon} aria-hidden="true" />
        {etiqueta}
        {estado.filtros.length > 0 ? (
          <Badge size="xs" className="tabular-nums">
            {estado.filtros.length}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Filtrar a fondo</PopoverTitle>
          <PopoverDescription>Limita la vista de {activo.label.toLowerCase()} a ciertos valores de otros demográficos. Los números se recalculan.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          {estado.filtrables.length === 0 ? (
            <Text size="sm" variant="muted">
              No hay otros demográficos con los que filtrar esta vista.
            </Text>
          ) : (
            estado.filtrables.map((segmento) => {
              const valor = estado.filtros.find((filtro) => filtro.key === segmento.key)?.optionId ?? SIN_FILTRO
              const items = [{ value: SIN_FILTRO, label: 'Sin filtrar' }, ...segmento.options.map((opcion) => ({ value: opcion.id, label: opcion.label }))]
              return (
                <Field key={segmento.key} orientation="horizontal">
                  <FieldLabel htmlFor={`filtro-${segmento.key}`} className="w-24 shrink-0">
                    {segmento.label}
                  </FieldLabel>
                  <Select value={valor} onValueChange={(nuevo) => estado.aplicarFiltro(segmento.key, nuevo === SIN_FILTRO ? '' : (nuevo as string))} items={items}>
                    <SelectTrigger id={`filtro-${segmento.key}`} size="sm" className="min-w-0 flex-1 bg-background!">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )
            })
          )}
          {estado.filtros.length > 0 ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={estado.limpiarFiltros}>
              Quitar filtros
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Casilla({ id, marcada, onCambio, children }: { id: string; marcada: boolean; onCambio: () => void; children: React.ReactNode }) {
  return (
    <Field orientation="horizontal">
      <Checkbox id={id} checked={marcada} onCheckedChange={onCambio} />
      <FieldLabel htmlFor={id} className="flex-1">
        {children}
      </FieldLabel>
    </Field>
  )
}

/** Niveles a mostrar y resaltar por banda, en un solo menú. Sin escala, solo los niveles. */
export function Personalizar({
  estado,
  escala,
  resaltadas,
  onResaltar,
  onRestablecerResaltado,
  ajustesResaltado,
  ajustesExtra = 0,
  children,
}: {
  estado: FiltrosResultados
  escala: readonly OpcionEscala[]
  resaltadas: ReadonlySet<string>
  onResaltar: (id: string) => void
  onRestablecerResaltado: () => void
  /** Cuántas bandas del resaltado se apartan de lo normal (para el contador del botón). */
  ajustesResaltado: number
  /** Lo que la vista suma debajo de los niveles (p. ej. sentimiento y tema en Comentarios) y cuántos ajustes trae. */
  ajustesExtra?: number
  children?: React.ReactNode
}) {
  const nivelesOcultos = NIVELES.filter((nivel) => !estado.niveles.has(nivel.id)).length
  const ajustes = nivelesOcultos + ajustesResaltado + ajustesExtra
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={SlidersHorizontalIcon} aria-hidden="true" />
        Personalizar
        {ajustes > 0 ? (
          <Badge size="xs" className="tabular-nums">
            {ajustes}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Niveles a mostrar</PopoverTitle>
          <PopoverDescription>Desmarca un nivel para ocultar sus totales y resultados; la fila y la anidación se mantienen.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-2">
          {NIVELES.map((nivel) => (
            <Casilla key={nivel.id} id={`nivel-${nivel.id}`} marcada={estado.niveles.has(nivel.id)} onCambio={() => estado.alternarNivel(nivel.id)}>
              {nivel.etiqueta}
            </Casilla>
          ))}
          {estado.nivelesOcultos ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={estado.restablecerNiveles}>
              Restablecer niveles
            </Button>
          ) : null}
        </div>
        {children ? (
          <>
            <Separator />
            {children}
          </>
        ) : null}
        {escala.length > 0 ? (
          <>
            <Separator />
            <PopoverHeader>
              <PopoverTitle>Resaltar por favorabilidad</PopoverTitle>
              <PopoverDescription>Lo que no esté marcado se atenúa; ningún número cambia.</PopoverDescription>
            </PopoverHeader>
            <div className="flex flex-col gap-2">
              {escala.map((banda) => (
                <Casilla key={banda.id} id={`resaltar-${banda.id}`} marcada={resaltadas.has(banda.id)} onCambio={() => onResaltar(banda.id)}>
                  <Badge variant="outline" size="sm" className="!border-0" style={{ backgroundColor: FONDO_ESCALA[banda.tone], color: TEXTO_ESCALA[banda.tone] }}>
                    {banda.range}
                  </Badge>
                  {banda.label}
                </Casilla>
              ))}
              {ajustesResaltado > 0 ? (
                <Button variant="ghost" size="sm" className="self-start" onClick={onRestablecerResaltado}>
                  Restablecer resaltado
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/** «Personalizar» que acota por favorabilidad, con las mismas casillas e insignias que «Resaltar por favorabilidad».
 *  Aquí sí cambia lo que se ve: sin nada marcado salen todos; con algo marcado, solo eso. «Filtros» queda para los
 *  demográficos: todo lo demás que acota o resalta una vista va en «Personalizar». */
export function PersonalizarFavorabilidad({
  escala,
  marcadas,
  cuentas,
  onAlternar,
  onLimpiar,
  descripcion,
}: {
  escala: readonly OpcionEscala[]
  marcadas: ReadonlySet<string>
  cuentas?: Readonly<Record<string, number>>
  onAlternar: (id: string) => void
  onLimpiar: () => void
  descripcion: string
}) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={SlidersHorizontalIcon} aria-hidden="true" />
        Personalizar
        {marcadas.size > 0 ? (
          <Badge size="xs" className="tabular-nums">
            {marcadas.size}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Mostrar por favorabilidad</PopoverTitle>
          <PopoverDescription>{descripcion}</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-2">
          {escala.map((banda) => (
            <Casilla key={banda.id} id={`filtrar-${banda.id}`} marcada={marcadas.has(banda.id)} onCambio={() => onAlternar(banda.id)}>
              <Badge variant="outline" size="sm" className="!border-0" style={{ backgroundColor: FONDO_ESCALA[banda.tone], color: TEXTO_ESCALA[banda.tone] }}>
                {banda.range}
              </Badge>
              {banda.label}
              {cuentas ? (
                <Text as="span" size="xs" variant="muted" className="tabular-nums">
                  {cuentas[banda.id] ?? 0}
                </Text>
              ) : null}
            </Casilla>
          ))}
          {marcadas.size > 0 ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={onLimpiar}>
              Restablecer
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Una opción de un selector de vista: su nombre y, solo si no lleva texto (`soloIcono`), su icono, con el nombre que lee el lector de pantalla. */
export type OpcionVista<T extends string> = { value: T; label: string; icono?: IconSvgElement; soloIcono?: boolean }

/** Cómo se mira lo mismo: pestañas segmentadas, como las de los drawers, no un grupo de botones sueltos junto a Filtros y
 *  Personalizar. Con una sola opción activa y todas visibles.
 *  Desde el 5-oct (decisión 13 de la auditoría), las vistas hermanas de una tabla van en pestañas subrayadas
 *  (`variant="line"`) encima de la caja y fuera de ella; la pastilla (por defecto o `view`) queda para un interruptor
 *  dentro de un panel, como tarjetas o lista en Accionables. */
export function SelectorVista<T extends string>({
  valor,
  opciones,
  onCambio,
  etiqueta = 'Vista',
  variant = 'default',
}: {
  valor: T
  opciones: readonly OpcionVista<T>[]
  onCambio: (vista: T) => void
  etiqueta?: string
  variant?: 'default' | 'view' | 'line'
}) {
  return (
    <Tabs value={valor} onValueChange={(nueva) => onCambio(nueva as T)}>
      <TabsList variant={variant} aria-label={etiqueta}>
        {opciones.map((opcion) => (
          <TabsTrigger key={opcion.value} value={opcion.value} aria-label={opcion.soloIcono ? opcion.label : undefined} className={variant === 'line' ? 'flex-none gap-1.5' : 'gap-1.5'}>
            {/* Solo texto, como pidió diseño: el icono queda únicamente para la opción que no lleva nombre (`soloIcono`). */}
            {opcion.soloIcono && opcion.icono ? <HugeiconsIcon icon={opcion.icono} aria-hidden="true" /> : opcion.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

/** Secciones / Mapa de calor de Favorabilidad: la pastilla, primer control de la cabecera de la caja (Elkin, 9-oct, como el
 *  comparativo): encima ya están las pestañas subrayadas de la página y dos tiras seguidas se confundían. */
export function CambioVista({ valor, onCambio }: { valor: Vista; onCambio: (vista: Vista) => void }) {
  return (
    <SelectorVista
      valor={valor}
      onCambio={onCambio}
      opciones={[
        { value: 'secciones', label: 'Secciones' },
        { value: 'mapa', label: 'Mapa de calor' },
      ]}
    />
  )
}

/** El guion de un total oculto (su nivel está desmarcado en Personalizar), con el porqué al pasar el cursor en el globo
 *  del producto (Hint). Una sola pieza para todas las vistas de Resultados: antes estaba copiada en cinco archivos y
 *  explicaba con el globo del navegador (decisión 16 de la auditoría). */
export function TotalOculto() {
  return (
    <Hint label="Total oculto: este nivel está desmarcado en Personalizar">
      <Text as="span" size="sm" variant="muted">
        —
      </Text>
    </Hint>
  )
}

/** Cómo se lee la escala de la vista, a un clic. */
export function LeyendaEscala({ titulo, descripcion, escala }: { titulo: string; descripcion: string; escala: readonly OpcionEscala[] }) {
  return (
    <Popover>
      <PopoverTrigger render={<BotonIcono aria-label={titulo} />}>
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{titulo}</PopoverTitle>
          <PopoverDescription>{descripcion}</PopoverDescription>
        </PopoverHeader>
        {/* Dos columnas: la insignia toma el ancho de la más larga («sube frente a la base») y las etiquetas quedan
            alineadas, sin que un rango largo se salga de su insignia y pise el texto. */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
          {escala.map((banda) => (
            <Fragment key={banda.id}>
              <Badge variant="outline" size="sm" className="min-w-16 justify-center justify-self-start whitespace-nowrap !border-0" style={{ backgroundColor: FONDO_ESCALA[banda.tone], color: TEXTO_ESCALA[banda.tone] }}>
                {banda.range}
              </Badge>
              <Text as="span" size="sm">
                {banda.label}
              </Text>
            </Fragment>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Los filtros aplicados, a la vista: cada uno es el chip de filtro del sistema (FiltroChip: la «x» va dentro y, al pasar
 *  el cursor, «Quitar el filtro»; decisión 21 de la auditoría). Tocarlo quita ese filtro. */
export function ChipsFiltro({ estado, segmentos }: { estado: FiltrosResultados; segmentos: readonly SegmentDefinition[] }) {
  if (estado.filtros.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado.filtros.map((filtro) => {
        const segmento = segmentos.find((opcion) => opcion.key === filtro.key)
        const opcion = segmento?.options.find((valor) => valor.id === filtro.optionId)
        return (
          <FiltroChip
            key={filtro.key}
            size="sm"
            activo
            texto={`${segmento?.label ?? ''}: ${opcion?.label ?? ''}`}
            ayuda={`Filtrar por ${segmento?.label.toLowerCase() ?? 'este dato'}`}
            onCambiar={(sigue) => (sigue ? undefined : estado.quitarFiltro(filtro.key))}
          />
        )
      })}
      <Button variant="ghost" size="xs" onClick={estado.limpiarFiltros}>
        Quitar todo
      </Button>
    </div>
  )
}
