import { HugeiconsIcon } from '@hugeicons/react'
import { File01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Demo, EncabezadoPatron, VerEnAccion, Reglas, SectionIntro, type Regla } from '../patrones/piezas'

// Fundamentos › Espacio y esquinas: los anchos del contenedor de página (PageShell), la regla de 8 px con la
// escala de Tailwind (1 unidad = 4 px) y la escala de esquinas del tema (--radius de 14 px).

const ANCHOS = [
  { nombre: 'Angosto', medida: '720 px', clase: 'w-[45%]', uso: 'Formularios y asistentes por pasos.' },
  { nombre: 'Normal', medida: '1.140 px', clase: 'w-[71%]', uso: 'La mayoría de las pantallas. Es el ancho por defecto.' },
  { nombre: 'Ancho', medida: '1.600 px', clase: 'w-full', uso: 'Tableros densos con muchas columnas.' },
  // 13-oct: PageShell también ofrece «full» y no estaba explicado; lo usa Maestro-detalle.
  { nombre: 'Completo', medida: 'ancho de la pantalla', clase: 'w-full', uso: 'Maestro-detalle y vistas que ocupan todo el ancho disponible (PageShell width="full").' },
  // La columna del login y sus pasos (7-oct): no es un ancho de página, las pantallas de acceso no llevan PageShell.
  { nombre: 'Acceso', medida: '360 px', clase: 'w-[22.5%]', uso: 'La columna del login y sus pasos. Solo en las pantallas de acceso (ANCHO_ACCESO).' },
]

const ESPACIOS = [
  { px: 4, clase: 'w-1', tailwind: 'gap-1', uso: 'Dentro de una pieza: un título y su bajada, el icono y el número de una etiqueta.' },
  { px: 8, clase: 'w-2', tailwind: 'gap-2', uso: 'Elementos que van juntos: icono y texto, botones vecinos.' },
  { px: 16, clase: 'w-4', tailwind: 'gap-4', uso: 'Dentro de una sección: título y contenido, tarjetas entre sí.' },
  { px: 24, clase: 'w-6', tailwind: 'gap-6', uso: 'Entre bloques de la página y bajo la cabecera.' },
  { px: 32, clase: 'w-8', tailwind: 'gap-8', uso: 'Entre secciones largas que necesitan respirar.' },
  { px: 48, clase: 'w-12', tailwind: 'pt-12', uso: 'Antes del pie de página.' },
]

// Las tres separaciones que se repiten dentro de un bloque. Salen del CSS de la librería: `item-content`,
// `card-header`, `field-content` y `popover-header` usan 4px; `dropdown-menu-item` y `sidebar-menu-button`, 8px.
const RITMO = [
  { px: 4, clase: 'gap-1', que: 'Un título y su bajada', donde: 'Cabecera de página, tarjetas, filas de lista, menús y campos.' },
  { px: 8, clase: 'gap-2', que: 'Un icono (hasta 20 px) y su texto', donde: 'Filas de menú, casillas, y dos acciones vecinas.' },
  { px: 12, clase: 'gap-3', que: 'Una baldosa o un avatar (24 px o más)', donde: 'Barra lateral, tarjeta de empresa, menú de perfil, filas con foto.' },
]

const ESQUINAS = [
  { nombre: 'sm', px: '10 px', clase: 'rounded-sm', uso: 'Botones chicos y de solo icono.' },
  { nombre: 'md', px: '12 px', clase: 'rounded-md', uso: 'Botones, campos, selectores y menús.' },
  { nombre: 'lg', px: '14 px', clase: 'rounded-lg', uso: 'Avisos y bandeja de pestañas. Es la base del tema.' },
  { nombre: 'xl', px: '20 px', clase: 'rounded-xl', uso: 'Tarjetas y diálogos.' },
  { nombre: '2xl', px: '25 px', clase: 'rounded-2xl', uso: 'Superficies grandes, casi sin uso.' },
  { nombre: 'Completa', px: 'pastilla', clase: 'rounded-full', uso: 'Etiquetas y avatares. En botones, solo los de IA.' },
]

const REGLAS: Regla[] = [
  { titulo: 'El ancho lo pone la página', detalle: 'La cabecera y el contenedor de página ya traen los 1.140 px. No se inventan anchos por pantalla; el acceso usa su columna de 360 px.' },
  { titulo: 'Múltiplos de 8', detalle: 'Separaciones de 8, 16, 24, 32 y 48 px. El 4 queda para dentro de piezas chicas.' },
  { titulo: 'Más aire, menos cajas', detalle: 'Separar con espacio antes que con bordes; una caja dentro de otra solo si tiene sentido.' },
  { titulo: 'Un título y su bajada: 4 px', detalle: 'Siempre. Es lo que usa la librería en filas, tarjetas, campos y menús; si el bloque tiene más piezas, el par va junto en su propia columna.' },
  { titulo: 'El espaciado de cada componente es suyo', detalle: 'Si la pieza ya trae su aire por dentro, no se le pisa con clases. `className` es para el layout de afuera: ancho, márgenes, truncado.' },
  { titulo: 'Esquinas de cada componente', detalle: 'Cada pieza trae la suya: no se fuerzan. Lo pidió Carlos para no complicar el sistema.' },
  { titulo: 'Pastilla solo en IA', detalle: 'El radio completo en un botón significa «esto lo hace la IA».' },
]

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Espacio y esquinas" antetitulo="Design system · Fundamentos" etiqueta={<Badge variant="success-light">Del tema</Badge>} acciones={<VerEnAccion pagina="espacio" />}>
        Cuánto mide el contenido, cuánto aire va entre las cosas y qué tan redondas son las esquinas. Todo sale del tema y
        del contenedor de página; nada se mide a ojo.
      </EncabezadoPatron>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Ancho del contenido" description="Cuatro anchos de página y uno para el acceso, siempre centrados. Las barras se dibujan en proporción a 1.600 px." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ANCHOS.map((ancho) => (
            <Demo key={ancho.nombre} title={`${ancho.nombre} · ${ancho.medida}`} description={ancho.uso}>
              {/* Barra proporcional al ancho: una caja con color del tema, solo para ilustrar. */}
              <div className="flex flex-col gap-1">
                <div className={cn('h-3 rounded-full bg-primary', ancho.clase)} />
                <div className="h-3 w-full rounded-full bg-muted" />
              </div>
            </Demo>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Regla de 8 px" description="La escala de Tailwind cuenta de a 4 px: gap-2 son 8 px, gap-4 son 16." />
        <Card>
          <CardContent className="flex flex-col gap-4">
            {ESPACIOS.map((espacio) => (
              <div key={espacio.px} className="grid grid-cols-[3.5rem_4rem_minmax(0,1fr)] items-center gap-4">
                <Text as="span" size="sm" weight="semibold">
                  {espacio.px} px
                </Text>
                {/* Barra de medida sin redondeo: con esquinas, las de 4 y 8 px se leían como puntos. */}
                <div className={cn('h-4 bg-primary', espacio.clase)} />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Badge variant="secondary">{espacio.tailwind}</Badge>
                  <Text as="span" variant="muted" size="sm">
                    {espacio.uso}
                  </Text>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Ritmo dentro de un bloque"
          description="Las tres separaciones que más se repiten. No se inventan: son las que ya trae la librería por dentro."
        />
        <Card>
          <CardContent className="flex flex-col gap-4">
            {RITMO.map((paso) => (
              <div key={paso.px} className="grid grid-cols-[3.5rem_4rem_minmax(0,1fr)] items-center gap-4">
                <Text as="span" size="sm" weight="semibold">
                  {paso.px} px
                </Text>
                <div className={cn('h-4 bg-primary', paso.px === 4 ? 'w-1' : paso.px === 8 ? 'w-2' : 'w-3')} />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Badge variant="secondary">{paso.clase}</Badge>
                  <Text as="span" size="sm" weight="medium">
                    {paso.que}
                  </Text>
                  <Text as="span" variant="muted" size="sm">
                    {paso.donde}
                  </Text>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="En una fila" description="Item de la librería: 4 px del nombre al detalle y la acción a la derecha.">
            {/* Piezas reales, sin clases de espaciado: los 4 px los pone el propio componente. */}
            <Item variant="outline" size="sm">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={File01Icon} size={18} strokeWidth={1.6} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Importación de usuarios</ItemTitle>
                <ItemDescription>78 % · 234 de 300 filas</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="link" size="sm">
                  Ver
                </Button>
              </ItemActions>
            </Item>
          </Demo>
          <Demo title="En una tarjeta" description="La cabecera de Card deja los mismos 4 px entre el título y su bajada.">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Planes de formación</CardTitle>
                <CardDescription>Rutas por cargo y grupos de personas.</CardDescription>
              </CardHeader>
            </Card>
          </Demo>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Esquinas" description="El tema parte de 14 px; de ahí sale una escala. Cada componente ya trae la que le toca." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ESQUINAS.map((esquina) => (
            <Card key={esquina.nombre} size="sm">
              <CardContent className="flex items-center gap-4">
                <div className={cn('size-14 shrink-0 border-2 border-primary bg-primary/10', esquina.clase)} />
                <div className="flex min-w-0 flex-col gap-1">
                  <Text as="span" size="sm" weight="semibold">
                    {esquina.nombre} · {esquina.px}
                  </Text>
                  <Text as="span" variant="muted" size="xs">
                    {esquina.uso}
                  </Text>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertTitle>El marco usa esquinas propias</AlertTitle>
          <AlertDescription>
            <p>La barra lateral, la barra superior y sus menús tienen su propia escala (ver Patrones › Marco › Medidas).</p>
          </AlertDescription>
        </Alert>
      </section>

      <Reglas titulo="Reglas" reglas={REGLAS} />
    </div>
  )
}

Component.displayName = 'DesignSystemEspacioPage'
