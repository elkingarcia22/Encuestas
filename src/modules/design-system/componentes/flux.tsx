import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, LinkSquare02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SinResultados } from '@/shared/components/SinResultados'
import catalogo from '../../../../ai-tools/flux-ui/flux-ui-para-ia.json'
import { SectionIntro } from '../patrones/piezas'

// Componentes › Flux tal cual: la librería sin tocar (muchas piezas tienen su versión del proyecto, que la tarjeta nombra),
// leída del mismo archivo que usan la IA y el equipo
// (ai-tools/flux-ui/flux-ui-para-ia.json), así la página no se desactualiza cuando sube la versión.
// Las categorías del Storybook (Core, ReUI…) no le dicen nada a diseño: aquí se agrupan por uso.

type Pieza = { nombre: string; slug: string; usar_para: string; buscar: string[]; variantes: Record<string, Record<string, string[]> | undefined>; storybook?: { docs?: string } }

const GRUPOS: { titulo: string; descripcion: string; slugs: string[] }[] = [
  { titulo: 'Acciones', descripcion: 'Lo que se toca para hacer algo.', slugs: ['button', 'button-group', 'action-dropdown', 'dropdown-menu', 'context-menu', 'menubar', 'toggle', 'toggle-group', 'floating-action-bar', 'kbd'] },
  {
    titulo: 'Formularios',
    descripcion: 'Campos, selectores y controles para llenar datos.',
    slugs: ['field', 'label', 'input', 'input-group', 'input-otp', 'textarea', 'number-field', 'phone-input', 'select', 'native-select', 'multi-select', 'combobox', 'autocomplete', 'cascader', 'checkbox', 'radio-group', 'switch', 'slider', 'rating', 'date-selector', 'calendar', 'filters', 'attachment'],
  },
  { titulo: 'Contenido', descripcion: 'Contenedores, texto e imágenes.', slugs: ['card', 'item', 'frame', 'avatar', 'badge', 'icon-tile', 'icon-stack', 'heading', 'text', 'separator', 'accordion', 'collapsible', 'aspect-ratio', 'carousel', 'code-block', 'marker', 'timeline'] },
  { titulo: 'Datos', descripcion: 'Tablas, gráficas y vistas de muchos registros.', slugs: ['table', 'data-grid', 'data-grid-list', 'chart', 'kanban', 'gantt', 'event-calendar', 'tree', 'sortable'] },
  { titulo: 'Avisos y estados', descripcion: 'Cómo está algo: vacío, cargando, avisado, avanzando.', slugs: ['alert', 'toast', 'sonner', 'empty', 'skeleton', 'spinner', 'progress', 'traffic-light'] },
  { titulo: 'Navegación', descripcion: 'Moverse entre pantallas y dentro de una.', slugs: ['tabs', 'breadcrumb', 'sidebar', 'navigation-menu', 'pagination', 'scrollspy', 'stepper', 'command', 'scroll-area', 'resizable'] },
  { titulo: 'Ventanas flotantes', descripcion: 'Lo que aparece encima de la pantalla.', slugs: ['dialog', 'alert-dialog', 'sheet', 'drawer', 'popover', 'tooltip', 'hover-card'] },
  { titulo: 'IA y chat', descripcion: 'Conversaciones con el agente.', slugs: ['message', 'message-scroller', 'bubble'] },
]

// Piezas técnicas que no se ven: van en «Otras» para que el catálogo cuente las 89.
const PIEZAS = catalogo.componentes as Pieza[]
const ASIGNADAS = new Set(GRUPOS.flatMap((grupo) => grupo.slugs))
const OTRAS = PIEZAS.filter((pieza) => !ASIGNADAS.has(pieza.slug)).map((pieza) => pieza.slug)
const TODOS = OTRAS.length ? [...GRUPOS, { titulo: 'Otras', descripcion: 'Piezas técnicas que no se ven en pantalla.', slugs: OTRAS }] : GRUPOS
const NO_PUBLICADOS = (catalogo.en_storybook_pero_no_publicados as { nombre: string }[]).map((pieza) => pieza.nombre)

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Cuántas opciones de variante trae una pieza (p. ej. Button: 6 variantes y 8 tamaños).
const opciones = (pieza: Pieza) => Object.values(pieza.variantes).reduce((total, props) => total + Object.values(props ?? {}).flat().length, 0)

// Piezas de la librería que en las pantallas se usan envueltas por una del proyecto (13-oct: salen de «piezas › en_vez_de»
// de ai-tools/reglas/reglas.json). Si una pieza está aquí, la tarjeta dice cuál usar.
const EN_LAS_PANTALLAS: Record<string, string> = {
  sheet: 'DrawerShell',
  drawer: 'DrawerShell',
  toast: 'notify',
  sonner: 'notify',
  table: 'TablaDatos',
  'data-grid': 'TablaDatos',
  'data-grid-list': 'TablaDatos',
  'alert-dialog': 'DialogoConfirmar (preguntar) o ActionDialog (con contenido)',
  dialog: 'ActionDialog',
  empty: 'PrimeraVez, SinResultados o ErrorDeCarga',
  tooltip: 'Hint (o BotonAyuda si abre con clic)',
  badge: 'Badge del proyecto (10,5 px mínimo)',
  'floating-action-bar': 'la barra de acciones de la tabla',
}

function Tarjeta({ pieza }: { pieza: Pieza }) {
  const cuantas = opciones(pieza)
  const envoltura = EN_LAS_PANTALLAS[pieza.slug]
  return (
    <Item variant="outline" className="h-full items-start">
      <ItemContent>
        <ItemTitle>
          {pieza.nombre}
          {cuantas ? <Badge variant="secondary">{cuantas} opciones</Badge> : null}
        </ItemTitle>
        <ItemDescription>{pieza.usar_para}</ItemDescription>
        {envoltura ? (
          <Text as="span" size="xs" weight="medium">
            En las pantallas: {envoltura}
          </Text>
        ) : null}
      </ItemContent>
      {pieza.storybook?.docs ? (
        <ItemActions>
          <BotonIcono
            aria-label={`Abrir ${pieza.nombre} en el Storybook`}
            nativeButton={false}
            render={<a href={pieza.storybook.docs} target="_blank" rel="noreferrer" />}
          >
            <HugeiconsIcon icon={LinkSquare02Icon} aria-hidden="true" />
          </BotonIcono>
        </ItemActions>
      ) : null}
    </Item>
  )
}

// Componentes › Todos los componentes › Flux tal cual (7-oct): antes era la página «Storybook».
export function CatalogoFlux() {
  const [busqueda, setBusqueda] = useState('')

  const grupos = useMemo(() => {
    const q = normalizar(busqueda.trim())
    const coincide = (pieza: Pieza) =>
      !q || [pieza.nombre, pieza.usar_para, ...pieza.buscar].some((texto) => normalizar(texto).includes(q))
    return TODOS.map((grupo) => ({
      ...grupo,
      piezas: grupo.slugs.map((slug) => PIEZAS.find((pieza) => pieza.slug === slug)).filter((pieza): pieza is Pieza => !!pieza && coincide(pieza)),
    })).filter((grupo) => grupo.piezas.length)
  }, [busqueda])

  return (
    <div className="flex flex-col gap-8">
      <InputGroup className="max-w-md">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="buscar-flux"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Busca en español: tabla, fecha, aviso, menú…"
          aria-label="Buscar componente"
        />
      </InputGroup>

      {grupos.length ? (
        grupos.map((grupo) => (
          <section key={grupo.titulo} className="flex flex-col gap-4">
            <SectionIntro title={`${grupo.titulo} · ${grupo.piezas.length}`} description={grupo.descripcion} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {grupo.piezas.map((pieza) => (
                <Tarjeta key={pieza.slug} pieza={pieza} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
      )}

      <Alert variant="warning">
        <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
        <AlertTitle>Están en el Storybook, pero no se pueden usar</AlertTitle>
        <AlertDescription>
          <p>{NO_PUBLICADOS.join(', ')}. Aparecen en el Storybook pero no vienen en la versión instalada: usarlos rompe la pantalla.</p>
        </AlertDescription>
      </Alert>
    </div>
  )
}
