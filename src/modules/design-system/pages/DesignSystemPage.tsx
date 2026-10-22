import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
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
  Componentes: 'Las piezas sueltas: el catálogo completo con su ficha y las que más se usan, una por página.',
  Patrones: 'Las piezas combinadas para armar una pantalla: el marco, la estructura de la página, los formularios y los estados.',
  'Por revisar': 'Lo que todavía se hace de formas distintas en el proyecto y falta unificar.',
  Orbit: 'Lo que en el producto dice «esto lo hace la IA»: piezas, superficies y el agente dentro de cada pantalla.',
  Pantallas: 'Pantallas completas del producto armadas con todo lo anterior.',
}

const BAJADA: Record<string, string> = {
  '/design-system/get-started': 'Las cinco reglas, cómo se suma una pantalla nueva y cómo se entrega.',
  '/design-system/manifiesto': 'Por qué existe BOLD+ y los cuatro principios que guían cómo diseñamos y construimos.',
  '/design-system/trabajar-con-ia': 'Cómo pedirle las cosas, qué sabe de este proyecto y los dos mapas: el del producto y el del playground.',
  '/design-system/color': 'Los colores del tema con su clase y su valor, en claro y oscuro.',
  '/design-system/tipografia': 'Inter y las escalas de títulos y texto de la librería.',
  '/design-system/espacio': 'Anchos del contenido, regla de 8 px y escala de esquinas.',
  '/design-system/icons': 'Hugeicons para la interfaz y los 50 iconos Glass.',
  '/design-system/marco': 'Barra lateral, header y pie (el pie, solo en las páginas de inicio): configuradores, piezas en vivo y medidas, en una sola página.',
  '/design-system/componentes': 'Las piezas customizadas con su ficha, las 89 de flux tal cual, las reglas globales y lo del dev de flux.',
  '/design-system/botones': 'Primario, secundario, terciario, tamaños e iconos.',
  '/design-system/navegacion': 'Cómo se arma una página: lista, detalle, tablero, pasos y más, pieza por pieza.',
  '/design-system/estados': 'Pantallas vacías, carga, avisos, confirmaciones y errores.',
  '/design-system/data-grid': 'La tabla completa, con todo encendible desde la pantalla.',
  '/design-system/formularios': 'Campos, mensajes de error y formularios por pasos.',
  '/design-system/drawers': 'Paneles laterales: detalle, filtros, avisos, notas con cambios y agente.',
  '/design-system/modales': 'Ventanas para decidir o completar algo corto, pieza por pieza.',
  '/design-system/ia': 'Botones, superficies, estados y vocabulario de la IA.',
  '/design-system/agente-contextual': 'La IA dentro del flujo: resumir, explicar, comparar y completar.',
  '/design-system/templates': 'Todas las pantallas del producto, agrupadas por rol.',
  '/design-system/templates/admin': 'Home, gestión de usuarios, planes de formación y encuestas.',
  '/design-system/templates/colaborador': 'El recorrido «Estudiar un contenido asignado».',
  '/design-system/templates/auth': 'La entrada a la plataforma, sin menú.',
  '/design-system/templates/suite-ai': 'El concepto de Orbit de Nicolás, con sus siete casos.',
  '/design-system/templates/home-suite-ai': 'El Home operativo dentro del marco de Orbit.',
  '/design-system/templates/archivo': 'Exploraciones y copias del concepto, solo para consulta.',
  '/design-system/templates/estados': 'Los errores de sistema y la carga ocupando la pantalla entera.',
  '/design-system/unificacion': 'Lo que cada persona hace distinto, por tema, y lo que la validación todavía no revisa.',
}

// Admin solo agrupa en el menú (no tiene página): desde la portada lleva a Pantallas.
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

// Las cuatro cifras de arriba (89 componentes, 6.000 iconos…) se quitaron el 13-oct: no llevaban a ninguna parte y
// empujaban el índice hacia abajo.

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
    title: 'Botones: jerarquía y tamaños',
    description: 'Primario, secundario y terciario. Los de IA viven en Orbit y esperan su variante en la librería.',
    estado: 'listo',
    path: '/design-system/botones',
  },
  {
    title: 'Tablas, formularios y estados',
    description: 'Con ejemplos que se pueden probar y enlaces a las pantallas reales donde se usan.',
    estado: 'listo',
    path: '/design-system/estados',
  },
  {
    title: 'Texto escrito sin Heading ni Text',
    description: 'Textos que deciden su tamaño por su cuenta en vez de usar los del tema. Es lo que frena el ritmo vertical.',
    estado: 'en-curso',
    path: '/design-system/unificacion/componentes',
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
        description="Este playground sirve para armar pantallas rápido con la librería interna. Lo que se ve en las maquetas sale de aquí: primero las piezas que el equipo ya resolvió, después la librería; nada armado a mano, nada traído de otra librería."
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
