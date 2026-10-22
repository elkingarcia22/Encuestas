import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Cursor01Icon,
  InformationCircleIcon,
  PaintBoardIcon,
  PaletteIcon,
  PuzzleIcon,
  TaskDone01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeBlock,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { IconoIA } from '../ia/icono-ia'
import { EncabezadoPatron, Reglas, SectionIntro, type Regla } from '../patrones/piezas'

// Empezar › Cómo usar el sistema: las reglas del playground (AGENTS.md / CLAUDE.md) contadas para diseño, con
// enlaces a la página del sistema que resuelve cada una, y la receta para sumar una pantalla (AGENTS.md, paso 5).
// Desde el 13-oct es también el antiguo «Flujo de trabajo»: las dos páginas repetían reglas y pasos.

type Regla5 = { titulo: string; detalle: string; icono: IconSvgElement; enlace: { texto: string; ruta: string } }

const CINCO: Regla5[] = [
  { titulo: 'Primero la pieza del proyecto, después la librería', detalle: 'Primero la pieza que el equipo ya resolvió (TablaDatos, notify, DialogoConfirmar…), después el componente de flux-ui del catálogo. Si no hay ninguno, se para y se pregunta antes de inventarlo.', icono: PuzzleIcon, enlace: { texto: 'Ver todos los componentes', ruta: '/design-system/componentes' } },
  { titulo: 'Iconos de Hugeicons', detalle: 'Se buscan por concepto en español y van dentro de HugeiconsIcon. Nada de SVG pegados ni iconos de Figma.', icono: PaintBoardIcon, enlace: { texto: 'Ver iconos', ruta: '/design-system/icons' } },
  { titulo: 'Colores y letra del tema', detalle: 'Solo clases del tema (bg-primary, text-muted-foreground) y la tipografía que ya trae la librería.', icono: PaletteIcon, enlace: { texto: 'Ver color', ruta: '/design-system/color' } },
  { titulo: 'Las piezas se ven como vienen', detalle: 'Las clases sirven para acomodar (ancho, márgenes, orden), no para cambiar colores, bordes ni esquinas.', icono: Cursor01Icon, enlace: { texto: 'Ver botones', ruta: '/design-system/botones' } },
  { titulo: 'Se cierra con la validación', detalle: 'Antes de decir que algo está listo se corre npm run check. Si falla, se arregla; no se desactiva.', icono: TaskDone01Icon, enlace: { texto: 'Ver los pasos', ruta: '#una-pantalla-nueva' } },
]

const ARCHIVO = `// src/modules/admin/encuestas/main.tsx
import { Button } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'

export function Component() {
  return (
    <PageShell>
      <PageHeader
        title="Encuestas"
        description="Crea encuestas y revisa sus respuestas."
        actions={<Button>Crear encuesta</Button>}
      />
      <PageContent>{/* la maqueta con piezas de flux-ui */}</PageContent>
    </PageShell>
  )
}

Component.displayName = 'AdminEncuestasPage'`

const RUTA = `// src/modules/admin/routes.ts, dentro de children
{
  path: 'encuestas',
  lazy: () => import('./encuestas/main'),
}`

const MENU = `// src/shared/layouts/nav-config.ts, en la sección que corresponda
{ title: 'Encuestas', path: '/admin/encuestas', icon: Comment01Icon },`

const VALIDAR = `npm run check
npm run build`

// Los pasos están en orden: por eso van numerados.
const PASOS = [
  { titulo: 'Crear el archivo de la pantalla', detalle: 'Cada pantalla vive en su carpeta y exporta un Component. El marco de página ya trae las migas, el título, los botones y el ancho de 1.140 px.', codigo: ARCHIVO, lenguaje: 'tsx' },
  { titulo: 'Registrar la ruta', detalle: 'En el routes.ts del módulo. Si el módulo no existe, se crea y se suma a src/app/register-modules.ts.', codigo: RUTA, lenguaje: 'ts' },
  { titulo: 'Sumarla al menú', detalle: 'Solo si debe aparecer en la barra lateral. Es el único archivo del marco que se toca sin hablar con ingeniería.', codigo: MENU, lenguaje: 'ts' },
  { titulo: 'Maquetar con flux-ui', detalle: 'Parte de un patrón que ya funciona (Estados, Tablas, Formularios, Estructura de página) y usa las piezas del catálogo tal como vienen.', codigo: null, lenguaje: 'ts' },
  { titulo: 'Validar y compilar', detalle: 'La validación revisa librerías, colores y archivos protegidos; la compilación, que todo encaje. Las dos en verde antes de entregar.', codigo: VALIDAR, lenguaje: 'bash' },
]

const DONDE: Regla[] = [
  { titulo: 'Tu pantalla, libre', detalle: 'Todo lo que está en src/modules/<módulo>/<pantalla>/ se crea y se edita sin pedir permiso.' },
  { titulo: 'El menú, con cuidado', detalle: 'src/shared/layouts/nav-config.ts se toca solo para sumar una pantalla a la barra lateral.' },
  { titulo: 'El resto, con ingeniería', detalle: 'Router, marco, tema (index.css), configuración y scripts. La validación avisa si se tocaron.' },
]

const ENTREGA: Regla[] = [
  { titulo: 'Se entrega con enlace', detalle: 'Carlos revisa en la versión publicada (Vercel), no por pantalla compartida. Nada se da por listo sin enlace.' },
  { titulo: 'Una sola rama común', detalle: 'El equipo trabaja sobre una rama compartida y cada cambio se junta ahí; se publica solo desde esa rama.' },
  { titulo: 'Los cambios al repo los aprueba Cris Burbano', detalle: 'Sobre todo los que tocan el marco, el tema o la configuración.' },
  { titulo: 'Probar en claro y oscuro', detalle: 'Y en una pantalla angosta. Si se usan piezas y clases del tema, casi siempre sale solo.' },
]

export function Component() {
  // La dirección vieja de Flujo de trabajo llega con #una-pantalla-nueva; la página carga después de leer el #, así que
  // el navegador no baja solo.
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Cómo usar el sistema" antetitulo="Design system · Empezar" etiqueta={<Badge variant="info-light">Primera vez</Badge>}>
        El playground sirve para armar pantallas rápido con la librería interna (flux-ui, basada en ReUI). Estas son las cinco
        reglas que sostienen todo, cómo se suma una pantalla nueva y cómo se entrega.
      </EncabezadoPatron>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Las cinco reglas" description="Si una pantalla las cumple, se ve y se comporta como el resto del producto." />
        <ItemGroup className="grid gap-3 md:grid-cols-2">
          {CINCO.map((regla) => (
            <Item
              key={regla.titulo}
              variant="outline"
              className="items-start"
              render={regla.enlace.ruta.startsWith('#') ? <a href={regla.enlace.ruta} /> : <Link to={regla.enlace.ruta} />}
            >
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={regla.icono} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{regla.titulo}</ItemTitle>
                <ItemDescription>{regla.detalle}</ItemDescription>
                <Text as="span" size="sm" weight="medium">
                  {regla.enlace.texto}
                </Text>
              </ItemContent>
              <ItemActions>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <section id="una-pantalla-nueva" className="flex scroll-mt-20 flex-col gap-4">
        <SectionIntro
          title="Una pantalla nueva"
          description="De la carpeta al enlace publicado, en este orden. El ejemplo arma Encuestas dentro del administrador; con la IA basta con pedirle la pantalla: ella sigue la misma receta."
        />
        <div className="flex flex-col gap-4">
          {PASOS.map((paso, indice) => (
            <Card key={paso.titulo}>
              <CardHeader>
                <CardTitle>
                  {indice + 1}. {paso.titulo}
                </CardTitle>
                <CardDescription>{paso.detalle}</CardDescription>
              </CardHeader>
              {paso.codigo ? (
                <CardContent>
                  <CodeBlock code={paso.codigo} language={paso.lenguaje} />
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>

        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertTitle>Si todavía no vas a maquetar</AlertTitle>
          <AlertDescription>
            <p>
              Deja la pantalla con la página de relleno del repo (createPage): muestra el título y la ruta, y ya aparece en el
              menú para recorrer la navegación.
            </p>
          </AlertDescription>
        </Alert>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reglas titulo="Dónde se trabaja" reglas={DONDE} />
        <Reglas titulo="Cómo se entrega" reglas={ENTREGA} />
      </div>

      <Item variant="outline" render={<Link to="/design-system/trabajar-con-ia" />}>
        <ItemMedia variant="icon">
          <IconoIA />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Trabajar con la IA</ItemTitle>
          <ItemDescription>
            Cómo pedirle una pantalla, qué sabe de este proyecto y qué hacer si la librería deja de responder.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
        </ItemActions>
      </Item>
    </div>
  )
}

Component.displayName = 'DesignSystemGetStartedPage'
