import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Cancel01Icon, FilterIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Checkbox,
  Field,
  FieldLabel,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { AMBITION_META, AMBITION_ORDER, type AmbitionLevel } from '../../../modelo/constructor/aiObjectiveGenerator'
import { MEASURE_META, MEASURE_ORDER, type MeasureType } from '../../../modelo/constructor/cicloBuilderTypes'
import { MEASURE_VISUAL } from '../../../modelo/constructor/measureVisual'
import { ANY, type ObjectiveBankController } from '../../../modelo/constructor/objectiveBankBrowse'
import { bankItemValues, type ObjectiveBankItem } from '../../../modelo/constructor/objectiveBankTypes'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'

// Las piezas del banco de objetivos, compartidas por el drawer (`BancoObjetivos`) y el panel de asignación: la franja
// de filtros (área y buscador; tema, medida y nivel de la meta) y la lista, en acordeón de marcos por tema como el banco
// de preguntas de Encuestas, con «Elegir los N» y una casilla por objetivo. Las cifras de cada fila cambian con el nivel
// de la meta.

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const conSimbolo = (medida: MeasureType, valor: string) => (valor === '' ? '' : medida === 'money' ? `$${valor}` : medida === 'percentage' ? `${valor} %` : valor)

function CampoFiltro({ id, etiqueta, valor, items, onCambio, deshabilitado = false }: { id: string; etiqueta: string; valor: string; items: readonly { value: string; label: string }[]; onCambio: (valor: string) => void; deshabilitado?: boolean }) {
  return (
    <Field orientation="horizontal">
      <FieldLabel htmlFor={id} className="w-24 flex-none!">
        {etiqueta}
      </FieldLabel>
      <Select value={valor} onValueChange={(nuevo) => onCambio(nuevo as string)} items={[...items]} disabled={deshabilitado}>
        <SelectTrigger id={id} size="sm" className="min-w-0 w-full! flex-1 bg-background!">
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
}

/**
 * Como «Filtros» de Resultados en Encuestas: el buscador y un solo botón que abre un popover con todo lo que acota el
 * banco (área, tema, tipo de medida y nivel de la meta), con la cuenta de lo activo. El nivel de la meta no es una
 * carpeta del banco sino un ajuste de las cifras que trae cada objetivo; cuenta como filtro solo si no es el de partida.
 */
export function FiltrosBanco({ banco }: { banco: ObjectiveBankController }) {
  const areas = banco.areas.map((area) => ({ value: area.id, label: area.name }))
  const temas = [{ value: ANY, label: 'Todos los temas' }, ...banco.themes.map((tema) => ({ value: tema.id, label: tema.name }))]
  const medidas = [{ value: ANY, label: 'Todas las medidas' }, ...MEASURE_ORDER.map((medida) => ({ value: medida, label: MEASURE_META[medida].label }))]
  const niveles = AMBITION_ORDER.map((nivel) => ({ value: nivel, label: AMBITION_META[nivel].label }))
  const activos = [!banco.isSearching && banco.themeId !== ANY, banco.measure !== ANY, banco.ambition !== AMBITION_ORDER[0]].filter(Boolean).length
  const limpiar = () => {
    banco.setThemeId(ANY)
    banco.setMeasure(ANY)
    banco.setAmbition(AMBITION_ORDER[0])
  }

  return (
    <div className="flex items-center gap-2">
      <InputGroup className="min-w-0 w-full! flex-1 bg-background!">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput value={banco.query} onChange={(evento) => banco.setQuery(evento.target.value)} placeholder="Buscar objetivo o tema…" aria-label="Buscar en el banco" />
        {banco.isSearching ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Limpiar búsqueda" onClick={() => banco.setQuery('')}>
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>
          <HugeiconsIcon icon={FilterIcon} aria-hidden="true" />
          Filtros
          {activos > 0 ? (
            <Badge size="xs" className="tabular-nums">
              {activos}
            </Badge>
          ) : null}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96!">
          <PopoverHeader>
            <PopoverTitle>Filtrar el banco</PopoverTitle>
            <PopoverDescription>Acota los objetivos por área, tema o tipo de medida, y elige qué tan exigentes son las metas.</PopoverDescription>
          </PopoverHeader>
          <div className="flex flex-col gap-3">
            <CampoFiltro id="banco-area" etiqueta="Área" valor={banco.areaId} items={areas} onCambio={banco.setAreaId} deshabilitado={banco.isSearching} />
            <CampoFiltro id="banco-tema" etiqueta="Tema" valor={banco.themeId} items={temas} onCambio={banco.setThemeId} deshabilitado={banco.isSearching} />
            <CampoFiltro id="banco-medida" etiqueta="Medida" valor={banco.measure} items={medidas} onCambio={(valor) => banco.setMeasure(valor as MeasureType | typeof ANY)} />
            <CampoFiltro id="banco-nivel" etiqueta="Nivel de la meta" valor={banco.ambition} items={niveles} onCambio={(valor) => banco.setAmbition(valor as AmbitionLevel)} />
            <Text size="xs" variant="muted">
              {AMBITION_META[banco.ambition].tagline} · cambia las cifras que traen los objetivos.
            </Text>
            {activos > 0 ? (
              <Button variant="ghost" size="sm" className="self-start" onClick={limpiar}>
                Quitar filtros
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function FilaBanco({ entrada, nivel, marcada, onAlternar, contexto }: { entrada: ObjectiveBankItem; nivel: AmbitionLevel; marcada: boolean; onAlternar: () => void; contexto?: string }) {
  const valores = bankItemValues(entrada, nivel)
  const id = `banco-objetivo-${entrada.id}`
  return (
    <Item variant={marcada ? 'muted' : 'default'} size="sm" render={<label htmlFor={id} />} className="cursor-pointer items-start gap-3 hover:bg-muted/60">
      <Checkbox id={id} checked={marcada} onCheckedChange={onAlternar} className="mt-0.5" />
      <ItemContent className="gap-1">
        <Text as="span" size="sm" weight="medium">
          {entrada.title}
        </Text>
        <ItemDescription>{entrada.origin === 'custom' ? `${entrada.description} · Guardado por tu equipo` : entrada.description}</ItemDescription>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Text as="span" size="xs" variant="muted" className="flex items-center gap-1">
            <HugeiconsIcon icon={MEASURE_VISUAL[entrada.measure].icon} size={14} aria-hidden="true" />
            {MEASURE_META[entrada.measure].label}
          </Text>
          {entrada.measure === 'boolean' ? (
            <Text as="span" size="xs" variant="muted">
              Se cumple o no se cumple
            </Text>
          ) : (
            <Text as="span" size="xs" weight="medium" className="flex items-center gap-1 tabular-nums">
              {conSimbolo(entrada.measure, valores.initialValue)}
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} aria-hidden="true" />
              {conSimbolo(entrada.measure, valores.targetValue)}
            </Text>
          )}
          {contexto ? (
            <Badge variant="primary-light" size="xs" className="ms-auto">
              {contexto}
            </Badge>
          ) : null}
        </div>
      </ItemContent>
    </Item>
  )
}

function Filas({ banco, entradas, conContexto }: { banco: ObjectiveBankController; entradas: readonly ObjectiveBankItem[]; conContexto: boolean }) {
  return (
    <ItemGroup className="gap-0!">
      {entradas.map((entrada, indice) => (
        <div key={entrada.id}>
          {indice > 0 ? <ItemSeparator /> : null}
          <FilaBanco entrada={entrada} nivel={banco.ambition} marcada={banco.selectedIds.has(entrada.id)} onAlternar={() => banco.toggle(entrada.id)} contexto={conContexto ? banco.locationById.get(entrada.id) : undefined} />
        </div>
      ))}
    </ItemGroup>
  )
}

/** Sin coincidencias en el catálogo: «Sin resultados» con lo buscado y los filtros puestos (al buscar, el tema no cuenta). */
function SinCoincidencias({ banco }: { banco: ObjectiveBankController }) {
  const filtros = (!banco.isSearching && banco.themeId !== ANY ? 1 : 0) + (banco.measure !== ANY ? 1 : 0)
  if (!banco.isSearching && filtros === 0) {
    return <PrimeraVez icono="glass-search" titulo="No hay objetivos que coincidan" descripcion="Prueba con otro término, otro tema, u otro tipo de medida." className="" />
  }
  return (
    <SinResultados
      busqueda={banco.query}
      filtrosActivos={filtros}
      onLimpiar={() => {
        banco.setQuery('')
        banco.setThemeId(ANY)
        banco.setMeasure(ANY)
      }}
    />
  )
}

// «Elegir los N» en vez de una casilla a medias, como en el banco de preguntas de Encuestas.
function ElegirTodos({ banco, entradas }: { banco: ObjectiveBankController; entradas: readonly ObjectiveBankItem[] }) {
  if (entradas.length < 2) return null
  const todos = entradas.every((entrada) => banco.selectedIds.has(entrada.id))
  return (
    <div className="flex">
      <Button variant="ghost" size="xs" className="-ms-2" onClick={() => banco.setMany(entradas, !todos)}>
        {todos ? `Quitar los ${entradas.length}` : `Elegir los ${entradas.length}`}
      </Button>
    </div>
  )
}

/** La lista del banco: un marco por tema en acordeón (uno abierto a la vez), con «Elegir los N» y una casilla por
 * objetivo. Cuántos van marcados lo dice el pie del panel. */
export function ListaBanco({ banco }: { banco: ObjectiveBankController }) {
  const [abiertas, setAbiertas] = useState<string[]>([])
  const grupos = banco.groups
  // Si ninguna de las abiertas sigue a la vista (cambió el área o la búsqueda), se abre la primera.
  const abiertasAhora = grupos.some((grupo) => abiertas.includes(grupo.theme.id)) ? abiertas : grupos[0] ? [grupos[0].theme.id] : []

  if (grupos.length === 0) return <SinCoincidencias banco={banco} />

  return (
    <Accordion value={abiertasAhora} onValueChange={(valor) => setAbiertas(valor as string[])} className="gap-3">
      {grupos.map((grupo) => {
        const elegidos = grupo.items.filter((entrada) => banco.selectedIds.has(entrada.id)).length
        const nombre = banco.isSearching ? `${grupo.area.name} · ${grupo.theme.name}` : grupo.theme.name
        return (
          <Frame key={`${grupo.area.id}-${grupo.theme.id}`}>
            <AccordionItem value={grupo.theme.id} className="border-0!">
              <FrameHeader className="py-0!">
                <AccordionTrigger>
                  <div className="flex min-w-0 flex-1 items-center gap-2 pe-2 text-left">
                    <TextoCompleto texto={nombre}>
                      <FrameTitle className="truncate">{nombre}</FrameTitle>
                    </TextoCompleto>
                    <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
                      {grupo.items.length}
                    </Badge>
                    {grupo.theme.origin === 'custom' ? (
                      <Badge variant="outline" size="xs">
                        De tu equipo
                      </Badge>
                    ) : null}
                    {elegidos > 0 ? (
                      <Badge variant="primary-light" size="xs" className="ms-auto tabular-nums">
                        {plural(elegidos, 'elegido', 'elegidos')}
                      </Badge>
                    ) : null}
                  </div>
                </AccordionTrigger>
              </FrameHeader>
              <AccordionContent className="pb-0!">
                <FramePanel className="flex flex-col gap-1">
                  <ElegirTodos banco={banco} entradas={grupo.items} />
                  <Filas banco={banco} entradas={grupo.items} conContexto={false} />
                </FramePanel>
              </AccordionContent>
            </AccordionItem>
          </Frame>
        )
      })}
    </Accordion>
  )
}
