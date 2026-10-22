import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowDown01Icon, CheckmarkCircle02Icon, PlayCircleIcon } from '@hugeicons/core-free-icons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Heading,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ScrollArea,
  ScrollBar,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PageHeader } from '@/shared/components/PageShell'

import { EN_ACCION } from './en-accion'

// Piezas compartidas por las tres pantallas de patrones (estados, data-grid y formularios).
// Solo combinan componentes de flux-ui para que todos los ejemplos se lean igual.

export function Demo({
  title,
  description,
  children,
  centrado = false,
}: {
  title: string
  description: string
  children: ReactNode
  centrado?: boolean
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={centrado ? 'flex flex-1 flex-col justify-center' : 'flex flex-1 flex-col'}>
        {children}
      </CardContent>
    </Card>
  )
}

export function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Heading as="h3" level={4}>
        {title}
      </Heading>
      <Text variant="muted" size="sm">
        {description}
      </Text>
    </div>
  )
}

export type Regla = { titulo: string; detalle: string }

// Lista de reglas en una tarjeta, una por fila (la bajada de Item se corta en dos renglones: en dos columnas no
// cabía completa). «pendiente» cambia el visto por un aviso para lo que falta decidir.
export function Reglas({ titulo, reglas, pendiente = false }: { titulo: string; reglas: Regla[]; pendiente?: boolean }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-2">
          {reglas.map((regla) => (
            <Item key={regla.titulo} variant="outline" size="sm" className="items-start">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={pendiente ? Alert02Icon : CheckmarkCircle02Icon} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{regla.titulo}</ItemTitle>
                <ItemDescription>{regla.detalle}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

// Cabecera de un caso de uso tomado del producto: en qué rol y en qué pantalla de UBITS vive,
// qué resuelve, y al final las reglas de negocio de su historia de usuario que la maqueta cumple.
export function CasoUbits({
  rol,
  donde,
  titulo,
  descripcion,
  historia,
  reglas,
  children,
}: {
  rol: string
  donde: string[]
  titulo: string
  descripcion: string
  historia: string
  reglas: Regla[]
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info-light" size="sm">
            {rol}
          </Badge>
          <Breadcrumb>
            <BreadcrumbList>
              {donde.map((paso, indice) => (
                <Fragment key={paso}>
                  {indice > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {indice === donde.length - 1 ? <BreadcrumbPage>{paso}</BreadcrumbPage> : paso}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Heading as="h3" level={4}>
          {titulo}
        </Heading>
        <Text variant="muted" size="sm">
          {descripcion}
        </Text>
      </header>

      {children}

      <Card size="sm">
        <CardHeader>
          <CardTitle>Reglas del producto que cumple</CardTitle>
          <CardDescription>Tomadas de {historia}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup className="grid gap-2 md:grid-cols-2">
            {reglas.map((regla) => (
              // items-start: si la vecina ocupa dos líneas, el icono y el título siguen arriba.
              <Item key={regla.titulo} variant="outline" size="sm" className="items-start">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{regla.titulo}</ItemTitle>
                  <ItemDescription>{regla.detalle}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    </section>
  )
}

// Pestañas de las pantallas de patrones. Son cinco o seis y en pantallas angostas no caben:
// van dentro de un ScrollArea para deslizarlas en horizontal en vez de cortarlas.
// «flex-none» alinea las pestañas a la izquierda (la variante line las estira) y
// «w-max min-w-full» deja que la línea de abajo acompañe a todas.
export function PestanasDePatron({ items }: { items: { valor: string; etiqueta: string }[] }) {
  return (
    <ScrollArea className="w-full">
      <TabsList variant="line" className="w-max min-w-full">
        {items.map((item) => (
          <TabsTrigger key={item.valor} value={item.valor} className="flex-none">
            {item.etiqueta}
          </TabsTrigger>
        ))}
      </TabsList>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

// Botón «Ver en acción» de cada página del design system: un menú con las pantallas navegables donde la pieza
// se usa de verdad (reunión del 2026-09-14; nombre y alcance del 2026-09-16).
//
// Todo sale de en-accion.ts y de ningún otro sitio. Antes una página podía sumar las suyas en `pantallas`, y
// tres lo hacían: se juntaban las dos listas y salían menús de doce entradas con el mismo caso repetido bajo
// otro nombre (el filtro solo quitaba los títulos idénticos). Si falta un destino, se añade allí.
export type PantallaReal = { titulo: string; detalle: string; ruta: string }

export function VerEnAccion({ pagina }: { pagina: string }) {
  const todas = EN_ACCION[pagina] ?? []
  if (!todas.length) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <HugeiconsIcon icon={PlayCircleIcon} aria-hidden="true" data-icon="inline-start" />
        Ver en acción
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Dónde se usa</DropdownMenuLabel>
          {todas.map((pantalla) => (
            // La clave es el título: varias entradas pueden llevar a la misma pantalla (p. ej. Encuestas).
            <DropdownMenuItem key={pantalla.titulo} render={<Link to={pantalla.ruta} />}>
              <div className="flex flex-col gap-1">
                <Text as="span" size="sm">
                  {pantalla.titulo}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {pantalla.detalle}
                </Text>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Encabezado de las páginas del design system: la cabecera de página del marco general (migas,
// antetítulo, título, etiqueta y bajada), la misma que usan Navegación y Agente contextual.
// «acciones» (opcional) va a la derecha, p. ej. el botón que abre el patrón en pantallas reales.
export function EncabezadoPatron({
  titulo,
  // 13-oct: el antetítulo por defecto es el grupo del menú donde viven estas páginas (Componentes: Estados, Tablas,
  // Formularios, Métricas); las de otro grupo lo dicen. La etiqueta ya no presume de «todo en la librería»: las páginas
  // documentan piezas del proyecto (BotonIcono, DialogoConfirmar, TablaDatos…) hechas sobre ella.
  antetitulo = 'Design system · Componentes',
  etiqueta = <Badge variant="success-light">Piezas del proyecto sobre la librería</Badge>,
  acciones,
  children,
}: {
  titulo: string
  antetitulo?: string
  etiqueta?: ReactNode
  acciones?: ReactNode
  children: ReactNode
}) {
  return <PageHeader kicker={antetitulo} title={titulo} badge={etiqueta} description={children} actions={acciones} />
}
