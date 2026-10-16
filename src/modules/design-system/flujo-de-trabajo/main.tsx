import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, CodeBlock } from '@ubits/flux-ui'
import { EncabezadoPatron, Reglas, SectionIntro, type Regla } from '../patrones/piezas'

// Empezar › Flujo de trabajo: la receta para sumar una pantalla (AGENTS.md, paso 5) con el marco de página del
// marco general, y cómo se entrega. Los pasos están en orden: por eso van numerados.

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

const PASOS = [
  { titulo: 'Crear el archivo de la pantalla', detalle: 'Cada pantalla vive en su carpeta y exporta un Component. El marco de página ya trae las migas, el título, los botones y el ancho de 1.140 px.', codigo: ARCHIVO, lenguaje: 'tsx' },
  { titulo: 'Registrar la ruta', detalle: 'En el routes.ts del módulo. Si el módulo no existe, se crea y se suma a src/app/register-modules.ts.', codigo: RUTA, lenguaje: 'ts' },
  { titulo: 'Sumarla al menú', detalle: 'Solo si debe aparecer en la barra lateral. Es el único archivo del marco que se toca sin hablar con ingeniería.', codigo: MENU, lenguaje: 'ts' },
  { titulo: 'Maquetar con flux-ui', detalle: 'Parte de un patrón que ya funciona (Estados, Data grid, Formularios, Navegación) y usa las piezas del catálogo tal como vienen.', codigo: null, lenguaje: 'ts' },
  { titulo: 'Validar y compilar', detalle: 'La validación revisa librerías, colores y archivos protegidos; la compilación, que todo encaje. Las dos en verde antes de entregar.', codigo: VALIDAR, lenguaje: 'bash' },
]

const ENTREGA: Regla[] = [
  { titulo: 'Se entrega con enlace', detalle: 'Carlos revisa en la versión publicada (Vercel), no por pantalla compartida. Nada se da por listo sin enlace.' },
  { titulo: 'Una sola rama común', detalle: 'El equipo trabaja sobre una rama compartida y cada cambio se junta ahí; se publica solo desde esa rama.' },
  { titulo: 'Los cambios al repo los aprueba Cris Burbano', detalle: 'Sobre todo los que tocan el marco, el tema o la configuración.' },
  { titulo: 'Probar en claro y oscuro', detalle: 'Y en una pantalla angosta. Si se usan piezas y clases del tema, casi siempre sale solo.' },
]

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Flujo de trabajo" antetitulo="Design system · Empezar" etiqueta={<Badge variant="info-light">5 pasos</Badge>}>
        Cómo se suma una pantalla nueva al playground, de la carpeta al enlace publicado. El ejemplo arma Encuestas dentro del
        administrador.
      </EncabezadoPatron>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Una pantalla nueva" description="Los pasos van en este orden. Con la IA, basta con pedirle la pantalla: ella sigue la misma receta." />
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
      </section>

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

      <Reglas titulo="Cómo se entrega" reglas={ENTREGA} />
    </div>
  )
}

Component.displayName = 'DesignSystemFlujoDeTrabajoPage'
