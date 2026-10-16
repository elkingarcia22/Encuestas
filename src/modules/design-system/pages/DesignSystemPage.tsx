import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { PageContent, PageHeader, PageSection } from '@/shared/components/PageShell'
import { sidebarNavs } from '@/shared/layouts/nav-config'

const STORYBOOK_URL =
  'https://libraries-ui.dev.sandteck.com/flux-ui/index.html?path=/story/getting-started-introduction--welcome'

// Las secciones salen del menú lateral (nav-config), así la portada y el menú no se desordenan entre sí.
// Aquí solo se suma la bajada de cada grupo y de cada página.
const BAJADA_GRUPO: Record<string, string> = {
  Empezar: 'Si es tu primera vez, arranca por aquí.',
  Fundamentos: 'Las bases: color, tipografía, espacio y esquinas, e iconos.',
  Componentes: 'Todas las piezas: las que customizó el equipo, cada una con su ficha, y las de la librería tal cual.',
  Patrones: 'Cómo se arma una pantalla: el marco que la rodea y la navegación dentro de ella.',
  'Por revisar': 'Lo que todavía se hace de formas distintas en el proyecto y falta unificar.',
  Orbit: 'Lo que en el producto dice «esto lo hace la IA»: piezas, superficies y el agente dentro de cada pantalla.',
  Pantallas: 'Pantallas completas del producto armadas con todo lo anterior.',
}

const BAJADA: Record<string, string> = {
  '/design-system/get-started': 'Las cinco reglas del playground y dónde está cada cosa.',
  '/design-system/flujo-de-trabajo': 'Cómo se suma una pantalla nueva, de la carpeta al enlace publicado.',
  '/design-system/manifiesto': 'Por qué existe BOLD+ y los cuatro principios que guían cómo diseñamos y construimos.',
  '/design-system/trabajar-con-ia': 'Qué sabe la IA de este proyecto: sus procedimientos, el catálogo y el mapa del producto.',
  '/design-system/grafo': 'Todo el playground en un mapa para la IA: piezas, pantallas, qué usa cada una y el producto real.',
  '/design-system/color': 'Los colores del tema con su clase y su valor, en claro y oscuro.',
  '/design-system/tipografia': 'Inter y las escalas de títulos y texto de la librería.',
  '/design-system/espacio': 'Anchos del contenido, regla de 8 px y escala de esquinas.',
  '/design-system/icons': 'Hugeicons para la interfaz y los 50 iconos Glass.',
  '/design-system/marco': 'Barra lateral, header y pie: configuradores, piezas en vivo y medidas, en una sola página.',
  '/design-system/componentes': 'Las piezas customizadas con su ficha, las 89 de flux tal cual, las reglas globales y lo del dev de flux.',
  '/design-system/botones': 'Primario, secundario, terciario, tamaños y el botón de IA.',
  '/design-system/navegacion': 'Cómo se arma una página: shell básico, detalle, tablero, pasos y más.',
  '/design-system/estados': 'Pantallas vacías, carga, avisos, confirmaciones y errores.',
  '/design-system/data-grid': 'La tabla completa, con todo encendible desde la pantalla.',
  '/design-system/formularios': 'Campos, mensajes de error y formularios por pasos.',
  '/design-system/drawers': 'Paneles laterales: detalle, filtros, avisos y agente.',
  '/design-system/modales': 'Ventanas para decidir o completar algo corto, pieza por pieza.',
  '/design-system/ia': 'Botones, superficies, estados y vocabulario de la IA.',
  '/design-system/agente-contextual': 'La IA dentro del flujo: resumir, explicar, comparar y completar.',
  '/design-system/templates': 'Todas las pantallas del producto, agrupadas por rol.',
  '/design-system/templates/admin': 'Home, gestión de usuarios, planes de formación y encuestas.',
  '/design-system/templates/producto': 'Tareas, avisos internos, detalle de vacante y configuración, ya dentro de /admin.',
  '/design-system/templates/colaborador': 'El recorrido «Estudiar un contenido asignado».',
  '/design-system/templates/auth': 'La entrada a la plataforma, sin menú.',
  '/design-system/templates/suite-ai': 'El concepto de Orbit de Nicolás, con sus siete casos.',
  '/design-system/templates/home-suite-ai': 'El Home operativo dentro del marco de Orbit.',
  '/design-system/templates/archivo': 'Exploraciones y copias del concepto, solo para consulta.',
}

// Admin y Archivo solo agrupan en el menú (no tienen página): desde la portada llevan a Pantallas.
const destino = (ruta: string, conHijos: boolean) =>
  conHijos && ruta.startsWith('/design-system/templates/') ? '/design-system/templates' : ruta

// La IA tiene su propio menú (pestaña Suite AI); en la portada va como un grupo más, antes de Pantallas.
const gruposIa = sidebarNavs['design-system-ai'].groups
const grupos = [
  ...sidebarNavs['design-system'].groups.filter((grupo) => grupo.label !== 'Pantallas'),
  {
    label: 'Orbit',
    items: [
      { title: 'Piezas de IA', path: '/design-system/ia', icon: sidebarNavs['design-system-ai'].groups[0].items[0].icon },
      ...gruposIa.slice(1).flatMap((grupo) => grupo.items),
    ],
  },
  ...sidebarNavs['design-system'].groups.filter((grupo) => grupo.label === 'Pantallas'),
]

type Cifra = { valor: string; etiqueta: string }

const cifras: Cifra[] = [
  { valor: '89', etiqueta: 'Componentes en la librería' },
  { valor: '6.000+', etiqueta: 'Iconos Hugeicons' },
  { valor: '50', etiqueta: 'Iconos Glass' },
  { valor: '8', etiqueta: 'Estilos de marca' },
]

type EstadoPatron = 'listo' | 'en-curso' | 'pendiente'

type Patron = {
  title: string
  description: string
  estado: EstadoPatron
  path?: string
}

const patrones: Patron[] = [
  {
    title: 'Fundamentos: color, tipografía, espacio y esquinas',
    description: 'Lo que Carlos pidió empezar. Faltan decidir los tamaños de letra y esquinas propios del marco.',
    estado: 'listo',
    path: '/design-system/color',
  },
  {
    title: 'Botones: jerarquía y botón de IA',
    description: 'Primario, secundario, terciario y el de IA. Falta la variante de IA en la librería y alinear «Crear ahora».',
    estado: 'listo',
    path: '/design-system/botones',
  },
  {
    title: 'Estados, data grid y formularios',
    description: 'Con ejemplos que se pueden probar y enlaces a las pantallas reales donde se usan.',
    estado: 'listo',
    path: '/design-system/estados',
  },
  {
    title: 'Letra puesta a mano',
    description: '618 textos deciden su tamaño por su cuenta en vez de usar Text y Heading. Es lo que frena el ritmo vertical.',
    estado: 'en-curso',
    path: '/design-system/unificacion',
  },
  {
    title: 'Pedidos a la librería',
    description: 'Botón de IA, menús opacos, progreso circular y el estado «pensando» del historial: cinco piezas que hoy se fuerzan.',
    estado: 'pendiente',
    path: '/design-system/componentes/dev',
  },
]

const etiquetasEstado: Record<EstadoPatron, { texto: string; variant: 'success-light' | 'info-light' | 'secondary' }> = {
  listo: { texto: 'Maquetado', variant: 'success-light' },
  'en-curso': { texto: 'En curso', variant: 'info-light' },
  pendiente: { texto: 'Pendiente', variant: 'secondary' },
}

export function Component() {
  return (
    <>
      <PageHeader
        breadcrumbs={false}
        kicker="Flux UI · v0.5.5"
        title="El sistema de diseño de UBITS"
        description="Este playground sirve para armar pantallas rápido con la librería interna. Todo lo que se ve en las maquetas sale de aquí: nada dibujado a mano, nada traído de otra librería."
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={STORYBOOK_URL} target="_blank" rel="noreferrer" />}
            >
              Abrir el Storybook
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button nativeButton={false} render={<Link to="/design-system/get-started" />}>
              Empezar aquí
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
            </Button>
          </>
        }
      />

      <PageContent className="gap-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cifras.map((cifra) => (
            <Card key={cifra.etiqueta}>
              <CardContent className="flex flex-col gap-1">
                <Text as="span" size="xl" weight="semibold">
                  {cifra.valor}
                </Text>
                <Text variant="muted" size="sm">
                  {cifra.etiqueta}
                </Text>
              </CardContent>
            </Card>
          ))}
        </div>

        {grupos.map((grupo) => (
          <PageSection key={grupo.label} title={grupo.label} description={BAJADA_GRUPO[grupo.label]}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {grupo.items.map((seccion) => (
                <Item
                  key={seccion.path}
                  variant="outline"
                  render={<Link to={destino(seccion.path, Boolean(seccion.children?.length))} />}
                  className="h-full items-start"
                >
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={seccion.icon} strokeWidth={2} aria-hidden="true" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{seccion.title}</ItemTitle>
                    {BAJADA[seccion.path] ? <ItemDescription>{BAJADA[seccion.path]}</ItemDescription> : null}
                  </ItemContent>
                  <ItemActions>
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
                  </ItemActions>
                </Item>
              ))}
            </div>
          </PageSection>
        ))}

        <PageSection title="Patrones en curso" description="Lo que el equipo está resolviendo, con el estado real de cada tema.">
          <ItemGroup>
            {patrones.map((patron, index) => {
              const etiqueta = etiquetasEstado[patron.estado]

              return (
                <div key={patron.title} className="contents">
                  {index > 0 ? <ItemSeparator /> : null}
                  <Item
                    variant="default"
                    render={patron.path ? <Link to={patron.path} /> : undefined}
                    className="items-start"
                  >
                    <ItemContent>
                      <ItemTitle>{patron.title}</ItemTitle>
                      <ItemDescription>{patron.description}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Badge variant={etiqueta.variant}>{etiqueta.texto}</Badge>
                    </ItemActions>
                  </Item>
                </div>
              )
            })}
          </ItemGroup>
        </PageSection>
      </PageContent>
    </>
  )
}

Component.displayName = 'DesignSystemPage'
