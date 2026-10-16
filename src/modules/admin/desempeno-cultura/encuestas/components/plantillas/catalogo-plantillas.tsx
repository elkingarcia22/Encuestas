import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, CheckListIcon, GridViewIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  FramePanel,
  IconTile,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import {
  TEMPLATE_SHELVES,
  findShelfOf,
  getTemplateDisplayName,
  getTemplateVisual,
  measureTemplate,
  pluralize,
} from '../../modelo/templateCatalog'
import { FILA_CLICABLE, FilasSeparadas, MarcoLista } from '../marco-lista'
import { TEXTO_POR_TONO } from '../tonos'
import { DetallePlantilla } from './detalle-plantilla'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// «Crear con plantilla» y «Ver más plantillas» abren este catálogo. Bajo la cabecera quedan fijos el
// buscador; el cuerpo muestra en lista cada estante (Organizacional y
// Legales › NOM 035 › México). Abrir una cambia el cuerpo por su ficha, sin salir del panel. Mismo
// armado que el catálogo de plantillas de Vacantes.
import { SinResultados } from '@/shared/components/SinResultados'

// Dónde vive la plantilla en el catálogo, para la bajada de la cabecera cuando se abre su detalle.
const rutaDe = (plantilla: SurveyDraft) => {
  const estante = findShelfOf(plantilla)
  return estante ? [estante.category, ...estante.path].join(' › ') : 'Plantilla'
}

// El buscador mira solo el nombre (el corto y el completo), sin tildes ni mayúsculas. La categoría se elige aparte.
const plegar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
const porNombre = (plantilla: SurveyDraft, busqueda: string) => {
  const q = plegar(busqueda)
  return !q || plegar(`${getTemplateDisplayName(plantilla)} ${plantilla.name}`).includes(q)
}

const TODAS = 'todas'
const opcionesCategoria = [
  { value: TODAS, label: 'Todas las categorías' },
  ...TEMPLATE_SHELVES.map((estante) => ({ value: estante.id, label: [estante.category, ...estante.path].join(' › ') })),
]

const Preguntas = ({ plantilla }: { plantilla: SurveyDraft }) => (
  <Badge variant="secondary" size="xs">
    <HugeiconsIcon icon={CheckListIcon} aria-hidden="true" />
    {pluralize(measureTemplate(plantilla).questions, 'pregunta', 'preguntas')}
  </Badge>
)

const Icono = ({ plantilla, tamano = 'sm' }: { plantilla: SurveyDraft; tamano?: 'sm' | 'lg' }) => {
  const visual = getTemplateVisual(plantilla)
  return (
    <IconTile variant="soft" size={tamano} className={TEXTO_POR_TONO[visual.tone]}>
      <HugeiconsIcon icon={visual.icon} aria-hidden="true" />
    </IconTile>
  )
}

export function CatalogoPlantillas({
  abierto,
  onAbiertoChange,
  inicial,
  estante,
  onUsar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  /** Abrir directo en la ficha de esta plantilla (un atajo del home); sin ella, el catálogo. */
  inicial?: SurveyDraft | null
  /** Abrir el listado ya filtrado en este estante (la tarjeta «NOM 035» de «Crea algo nuevo»). */
  estante?: string
  onUsar: (plantilla: SurveyDraft) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState(TODAS)
  const [abierta, setAbierta] = useState<SurveyDraft | null>(inicial ?? null)
  const inicio = useRef<HTMLDivElement>(null)

  // Cada vez que se abre el panel arranca donde lo pidieron: la ficha del atajo o el listado.
  const [abiertoAntes, setAbiertoAntes] = useState(abierto)
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto)
    if (abierto) {
      setAbierta(inicial ?? null)
      setBusqueda('')
      setCategoria(estante ?? TODAS)
    }
  }

  // Al pasar del listado a una ficha (o entre plantillas) el cuerpo vuelve arriba.
  useEffect(() => {
    inicio.current?.scrollIntoView({ block: 'start' })
  }, [abierta])

  const estantes = useMemo(
    () =>
      TEMPLATE_SHELVES.filter((estante) => categoria === TODAS || estante.id === categoria)
        .map((estante) => ({
          estante,
          plantillas: estante.items.filter((plantilla) => porNombre(plantilla, busqueda)),
        }))
        .filter((grupo) => grupo.plantillas.length > 0),
    [busqueda, categoria],
  )
  const total = estantes.reduce((suma, grupo) => suma + grupo.plantillas.length, 0)

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="lg"
      // Con una plantilla abierta, la cabecera es la de la plantilla: su icono, su nombre y dónde vive en el catálogo.
      icon={GridViewIcon}
      media={abierta ? <Icono plantilla={abierta} /> : undefined}
      title={abierta ? getTemplateDisplayName(abierta) : 'Crear con plantilla'}
      description={abierta ? rutaDe(abierta) : 'Elige una para empezar tu encuesta.'}
      // La vuelta al catálogo va en la fila de navegación sobre la cabecera, como el «Volver» del design system (Drawers).
      navigation={
        abierta ? (
          <div className="flex items-center border-b px-3 py-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => setAbierta(null)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Volver a todas las plantillas
            </Button>
          </div>
        ) : undefined
      }
      headerExtra={
        abierta ? undefined : (
          <div className="flex flex-col gap-2 border-b px-5 py-3 sm:flex-row sm:items-center">
            <InputGroup className="sm:flex-1">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar por nombre…"
                aria-label="Buscar plantilla"
              />
            </InputGroup>
            <Select value={categoria} onValueChange={(valor) => setCategoria(String(valor ?? TODAS))} items={opcionesCategoria}>
              <SelectTrigger className="w-full sm:w-52 sm:shrink-0"aria-label="Filtrar por categoría">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-max min-w-(--anchor-width)">
                {opcionesCategoria.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
      footer={
        abierta ? (
          <Button onClick={() => onUsar(abierta)}>
            Usar plantilla
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          </Button>
        ) : (
          <Text as="span" variant="muted" size="sm" className="mr-auto">
            {pluralize(total, 'plantilla', 'plantillas')}
          </Text>
        )
      }
    >
      <div ref={inicio} className="scroll-mt-4" />
      {abierta ? (
        <DetallePlantilla key={abierta.name} plantilla={abierta} />
      ) : (
        <div className="flex flex-col gap-6">
          {estantes.length > 0 ? (
            // Cada estante es su propio marco, como las secciones del banco de preguntas: su nombre y cuántas plantillas tiene
            // arriba, qué trae debajo, y las plantillas en filas con una línea entre cada una.
            estantes.map(({ estante, plantillas }) => (
              <MarcoLista
                key={estante.id}
                titulo={
                  <span className="inline-flex items-center gap-2">
                    <HugeiconsIcon icon={estante.icon} size={16} aria-hidden="true" className="text-muted-foreground" />
                    {[estante.category, ...estante.path].join(' › ')}
                    <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
                      {plantillas.length}
                    </Badge>
                  </span>
                }
                descripcion={estante.description}
              >
                <FramePanel className="py-1!">
                  <FilasSeparadas>
                    {plantillas.map((plantilla) => (
                      <Item key={plantilla.name} size="sm" render={<button type="button" />} onClick={() => setAbierta(plantilla)} className={FILA_CLICABLE}>
                        <ItemMedia>
                          <Icono plantilla={plantilla} />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                          <TextoCompleto texto={getTemplateDisplayName(plantilla)}><ItemTitle className="truncate">{getTemplateDisplayName(plantilla)}</ItemTitle></TextoCompleto>
                          <TextoCompleto texto={plantilla.description}><ItemDescription className="line-clamp-2!">{plantilla.description}</ItemDescription></TextoCompleto>
                        </ItemContent>
                        <ItemActions className="gap-3">
                          <Preguntas plantilla={plantilla} />
                          <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" aria-hidden="true" />
                        </ItemActions>
                      </Item>
                    ))}
                  </FilasSeparadas>
                </FramePanel>
              </MarcoLista>
            ))
          ) : (
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={categoria === TODAS ? 0 : 1}
              onLimpiar={() => {
                setBusqueda('')
                setCategoria(TODAS)
              }}
            />
          )}
        </div>
      )}
    </DrawerShell>
  )
}
