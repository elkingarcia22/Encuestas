import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, InformationCircleIcon, PartyIcon, Queue02Icon, Search01Icon } from '@hugeicons/core-free-icons'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  Text,
} from '@ubits/flux-ui'
import { ConfiguradorBarraLateral } from '../barra-lateral/main'
import { ConfiguradorHeader } from '../header/main'
import { Demo, EncabezadoPatron, PestanasDePatron, Reglas, SectionIntro, VerEnAccion, type Regla } from '../patrones/piezas'
import { BarraEnVivo } from '../barra-lateral/components/barra-en-vivo'
import { HEADER_CASES } from '../header/components/header-config'
import { HeaderPreview } from '../header/components/header-preview'
import { AccountPopover } from '@/shared/components/AccountPopover'
import { ChangelogDialog } from '@/shared/components/Announcements'
import { AppFooter } from '@/shared/components/AppFooter'
import { CommandPalette } from '@/shared/components/CommandPalette'
import { NotificationsPopover } from '@/shared/components/NotificationsPopover'
import { ProcessCenter } from '@/shared/components/ProcessCenter'
import { ProfilePopover } from '@/shared/components/ProfilePopover'

// Fundamentos › Marco: la barra lateral, la barra superior y el pie que pone el marco general en cada
// pantalla. Son capturas del marco real (Admin y Suite AI, 2026-09-15); la demo que prende y apaga cada
// pieza es el «Shell básico» de Navegación. Las imágenes van dentro de tarjetas de flux-ui.

// Una sola página para todo el marco (decisión del 17-sep): los configuradores de la barra y del header, las capturas,
// las medidas y lo que falta. Cada pestaña tiene su dirección. Los ajustes propios pasaron a las fichas de
// Componentes (7-oct).
const PESTANAS = [
  { valor: 'barra-lateral', etiqueta: 'Barra lateral' },
  { valor: 'header', etiqueta: 'Header' },
  { valor: 'capturas', etiqueta: 'Piezas en vivo' },
  { valor: 'medidas', etiqueta: 'Medidas' },
  { valor: 'pendientes', etiqueta: 'Pendientes' },
]

// Medidas propias del marco (diseño de Nicolás) frente al estilo «vega» de flux-ui con el tema del proyecto
// (--radius de 14 px). Son la especificación oficial hasta que la librería tenga un estilo UBITS.
type Medida = { pieza: string; libreria: string; marco: string }

const MEDIDAS: { grupo: string; filas: Medida[] }[] = [
  {
    grupo: 'Barra superior',
    filas: [
      { pieza: 'Alto de la barra', libreria: 'No la trae', marco: '60 px, con línea abajo' },
      { pieza: 'Botones de icono (notificaciones)', libreria: '32 px, esquina 10 px', marco: '32 px, como la librería; icono gris y, con su menú abierto, azul con fondo al 10 %' },
      { pieza: 'Botón para abrir y cerrar el menú', libreria: '32 px', marco: '30 px' },
      { pieza: 'Buscador', libreria: 'Botón de 32 px de alto', marco: '36 px de alto, hasta 340 px de ancho, siempre al centro' },
      { pieza: 'Novedades', libreria: 'Botón de contorno gris', marco: 'Azul suave: fondo al 10 %, borde al 28 %, texto azul; 32 px de alto (ver Ajustes propios)' },
      { pieza: 'Foto de perfil', libreria: 'Avatar de 32 px', marco: '34 px, sin borde; con su menú abierto la rodea un anillo azul. Es la única acción de la derecha que no mide 32' },
    ],
  },
  {
    grupo: 'Barra lateral',
    filas: [
      { pieza: 'Ancho', libreria: '256 px', marco: '288 px abierta, 72 px cerrada (riel)' },
      { pieza: 'Botón de la empresa', libreria: '36 px de alto', marco: 'Cerca de 50 px de alto: logo de 28 px en baldosa cuadrada, nombre y, debajo, el plan en insignia (Esencial en azul, Pro en violeta); sombra mínima' },
      { pieza: 'Selector Workspace / Orbit', libreria: 'Bandeja de 36 px', marco: 'Bandeja de 40 px con filo; la opción activa en blanco con sombra mínima' },
      { pieza: 'Fila del menú', libreria: '32 px, texto 14 px', marco: '36 px, esquina 14 px, texto en medio peso y en el color normal de la barra; solo la activa va en azul' },
      { pieza: 'Fila activa', libreria: 'Fondo gris del tema', marco: 'Fondo azul al 10 %, texto azul en medio peso y marca azul de 3 px pegada al borde' },
      { pieza: 'Fila de segundo nivel', libreria: '28 px', marco: '32 px, esquina 14 px' },
      { pieza: 'Título de grupo', libreria: '32 px, texto 12 px al 70 %', marco: '28 px, texto 13 px en el gris del tema' },
      { pieza: 'Etiqueta «Nuevo»', libreria: 'Badge primary-light, tamaño xs', marco: 'Igual que la librería (desde la revisión ReUI del 16-sep)' },
    ],
  },
  {
    grupo: 'Pie y menús flotantes',
    filas: [
      { pieza: 'Pie', libreria: 'No lo trae', marco: 'Texto 13 px gris, separadores de 14 px, 48 px de aire arriba' },
      { pieza: 'Menú del riel', libreria: 'Ancho según contenido', marco: '240 px, esquinas del tema, título 13 px' },
      { pieza: 'Notificaciones', libreria: 'Texto 14 px', marco: 'Título 15 px, texto 13 px, hora 11 px' },
    ],
  },
]

// Esquinas que aparecen en el marco y en sus patrones (en px, convertidas desde rem cuando hacía falta).
const ESQUINAS_EN_USO = [2, 3, 4, 5, 6, 8, 10, 11, 12, 14, 16, 18, 20, 28]
const ESCALA_TEMA = [
  { nombre: 'sm', px: 10 },
  { nombre: 'md', px: 12 },
  { nombre: 'lg', px: 14 },
  { nombre: 'xl', px: 20 },
  { nombre: '2xl', px: 25 },
]

const ACTIVO: Regla[] = [
  { titulo: 'Fondo azul al 10 %', detalle: 'Fila activa de la barra lateral, botón de la barra superior con su menú abierto y etiqueta «Nuevo».' },
  { titulo: 'Texto e icono en azul', detalle: 'Lo mismo que el fondo: todo lo que está seleccionado o abierto se tiñe del azul primario.' },
  { titulo: 'Borde azul al 25–28 %', detalle: 'Botones de la barra superior abiertos, etiqueta «Nuevo» y Novedades.' },
  { titulo: 'Marca azul de 3 px', detalle: 'Solo en la barra lateral: señala la página abierta pegada al borde.' },
]

const REGLAS_BARRA_LATERAL: Regla[] = [
  { titulo: 'La empresa arriba', detalle: 'Logo y nombre del cliente; al tocarlo abre el menú de empresa con licencias, créditos de IA y configuración.' },
  { titulo: 'Workspace o Orbit', detalle: 'Las pestañas cambian todo el menú. En Orbit el menú es el historial de conversaciones.' },
  { titulo: 'Grupos en gris, activo en azul', detalle: 'Cada grupo lleva su título en gris; la página abierta se marca en azul con una línea a la izquierda.' },
  { titulo: 'Tercer nivel con «volver»', detalle: 'Una sección con páginas propias (LMS Creator, Planes, Certificados) abre su panel con la ruta para regresar.' },
  { titulo: 'Cerrada queda el riel', detalle: 'Al cerrarla quedan los iconos con las mismas opciones. Recuerda si la persona la dejó abierta o cerrada.' },
  { titulo: 'Pie de la barra', detalle: 'Tarjeta de invitación, que se puede cerrar, y «Enviar feedback». En Orbit no aparecen.' },
]

const REGLAS_BARRA_SUPERIOR: Regla[] = [
  { titulo: 'Qué hay a la izquierda', detalle: 'El botón para abrir o cerrar el menú y, pegada a él, la miga de pan: dónde estás y cómo subir de nivel. Es su único sitio; nunca va encima del título de la pantalla.' },
  { titulo: 'Buscador siempre al centro', detalle: 'Con ⌘K se va a una página, se abre un objeto o se le pregunta al agente. Si falta espacio queda como lupa.' },
  { titulo: 'Acciones a la derecha', detalle: 'Novedades, Notificaciones y Perfil, en ese orden. Centro de ayuda va en el menú de perfil y el Centro de procesos se abre desde Notificaciones.' },
  { titulo: 'Cada botón con su ayuda', detalle: 'Todos los iconos llevan su nombre en una ayuda flotante, la misma en todo el producto.' },
  { titulo: 'Iconos grises parejos', detalle: 'Mismo gris y mismo efecto al pasar el cursor en todos los botones. Solo Novedades va en azul suave.' },
  { titulo: 'Perfil aparte', detalle: 'La foto de la persona en círculo, separada de los demás botones, con su rol debajo del nombre.' },
  {
    titulo: 'Procesos en vivo',
    detalle:
      'Una pantalla puede publicar en el Centro de procesos lo que está haciendo, como las hojas de vida que lee una vacante. Va arriba, con la misma fila que los demás: avance mientras corre y, al terminar, qué quedó pendiente con su acción («Revisar», «Ver»). Si el trabajo sigue corriendo, se queda aunque se salga de esa pantalla, y su acción lleva de vuelta.',
  },
  {
    titulo: 'Sin procesos, el vacío',
    detalle:
      'Si ninguna pantalla publicó nada, el centro muestra el vacío de primera vez (PrimeraVez): los procesos de ejemplo solo viven en este design system. Lo terminado se queda como «procesado». «Historial» abre la pantalla que lo tenga (p. ej., las descargas de una encuesta); si no hay ninguna, solo avisa.',
  },
]

const REGLAS_PIE: Regla[] = [
  { titulo: 'Qué dice', detalle: '«Con la tecnología de UBITS» con el logo, Términos y condiciones de uso y Política de privacidad.' },
  { titulo: 'Gris y centrado', detalle: 'Todo en gris, al final del contenido de cada pantalla; no queda fijo abajo.' },
  { titulo: 'No va en Orbit', detalle: 'El chat y el modo voz ocupan toda la altura, así que ahí no hay pie.' },
  { titulo: 'Encuestas y Objetivos: solo en el inicio', detalle: 'Va en la pantalla que abre el menú, no en los procesos (crear, editar, cargar) ni en las vistas internas (resultados, comparativo, detalle).' },
  { titulo: 'Una sola excepción al marco', detalle: 'Toda pantalla va en PageShell con PageHeader (auditoría, 5-oct). La excepción es el modo voz de Orbit: a pantalla completa y oscuro, tapa la barra lateral y la superior y lleva su propio foco.' },
  { titulo: 'UBITS solo aquí', detalle: 'La marca UBITS ya no va en la barra lateral: vive solo en este pie.' },
]

const PENDIENTES: Regla[] = [
  { titulo: 'Marca del cliente', detalle: 'El marco usa Meta Colombia, la marca del concepto de Nicolás. Falta decidir si queda Meta o Google.' },
  { titulo: 'Estilo UBITS en la librería', detalle: 'Las medidas del marco se aplican encima de la librería. Pedir un estilo UBITS, como los ocho que ya trae, para que vivan ahí.' },
  { titulo: 'Escala de esquinas', detalle: 'El marco, Orbit y los patrones de Nicolás usan 14 esquinas distintas, de 2 a 28 px. Conviene reducirlas a la escala del tema: 10, 12, 14, 20 y 25 px.' },
  { titulo: 'Tamaños de letra del marco', detalle: 'Usa 9, 10, 11, 13 y 15 px, que no están en la escala del tema (12, 14, 16 y 18 px). Decidir si se suman a la escala o se ajustan.' },
  { titulo: 'Dos títulos principales', detalle: 'La barra superior repite el nombre de la página como título principal y compite con el de la página.' },
  { titulo: 'Menú de empresa sin enlaces', detalle: '«Gestión de usuarios» y el resto de Configuración solo muestran un aviso. En las plantillas se llega por el menú lateral.' },
]

// Todo en vivo, nada de capturas (follow up del 17-sep: una imagen no cambia cuando cambia el tema o el modo oscuro).
// La barra lateral y la superior son las mismas vistas previas de Patrones › Barra lateral y Header, que leen el menú de
// nav-config; los menús y ventanas son los componentes del marco: se abren al tocarlos, igual que en el producto.

function Abre({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
      {children}
      <Text as="span" variant="muted" size="xs">
        Tócalo para abrirlo
      </Text>
    </div>
  )
}

function BarraLateral() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Barra lateral"
        description="El menú de todo el producto: empresa, cambio entre Workspace y Orbit, secciones y pie de la barra. Mide 288 px abierta y 72 px cerrada."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="Workspace" description="Inicio, grupos del producto y herramientas.">
          <BarraEnVivo id="workspace" />
        </Demo>
        <Demo title="Orbit" description="Historial de conversaciones con su estado y «Nueva conversación».">
          <BarraEnVivo id="suite-ai" />
        </Demo>
        <Demo title="Tercer nivel" description="Una sección con páginas propias abre su panel con «volver».">
          <BarraEnVivo id="tercer-nivel" />
        </Demo>
        <Demo title="Cerrada" description="Queda el riel de iconos con las mismas opciones." centrado>
          <BarraEnVivo id="workspace-riel" />
        </Demo>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Demo title="Menú de empresa" description="Licencias, créditos de IA, configuración y cambio de empresa.">
          <Abre>
            <AccountPopover />
          </Abre>
        </Demo>
        <Reglas titulo="Reglas de la barra lateral" reglas={REGLAS_BARRA_LATERAL} />
      </div>
    </div>
  )
}

function BarraSuperior() {
  const [buscador, setBuscador] = useState(false)
  const [novedades, setNovedades] = useState(false)
  const [procesos, setProcesos] = useState(false)
  const [procesosVacio, setProcesosVacio] = useState(false)
  const volver = useRef<HTMLElement | null>(null)
  const general = HEADER_CASES[0]

  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Barra superior"
        description="60 px de alto, fija arriba del contenido. Ubica a la persona y reúne lo que sirve en cualquier pantalla."
      />
      <Demo title="Completa" description="Menú y nombre de la página, buscador al centro y acciones a la derecha.">
        <HeaderPreview config={general.config} sample={general.sample} names={false} onOpen={() => undefined} bare />
      </Demo>
      <CommandPalette open={buscador} onOpenChange={setBuscador} returnFocus={volver} />
      <ChangelogDialog open={novedades} onOpenChange={setNovedades} />
      <ProcessCenter open={procesos} onOpenChange={setProcesos} ejemplos />
      <ProcessCenter open={procesosVacio} onOpenChange={setProcesosVacio} />
      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Demo title="Buscador (⌘K)" description="Ir a una página, abrir un objeto o preguntarle al agente.">
          <Abre>
            <Button variant="outline" size="sm" onClick={() => setBuscador(true)}>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" data-icon="inline-start" />
              Abrir el buscador
            </Button>
          </Abre>
        </Demo>
        <Demo title="Novedades" description="Lo que cambió en la semana. Se publica los jueves.">
          <Abre>
            <Button variant="outline" size="sm" onClick={() => setNovedades(true)}>
              <HugeiconsIcon icon={PartyIcon} aria-hidden="true" data-icon="inline-start" />
              Abrir novedades
            </Button>
          </Abre>
        </Demo>
        <Demo title="Notificaciones" description="Bandeja con pestañas; lo sin leer va marcado.">
          <Abre>
            <NotificationsPopover onOpenProcesses={() => setProcesos(true)} onOpenChangelog={() => setNovedades(true)} />
          </Abre>
        </Demo>
        <Demo title="Centro de procesos" description="Lo que está corriendo y lo que quedó a medias. Sin botón en el header: se abre desde Notificaciones.">
          <Abre>
            <Button variant="outline" size="sm" onClick={() => setProcesos(true)}>
              <HugeiconsIcon icon={Queue02Icon} aria-hidden="true" data-icon="inline-start" />
              Abrir el centro de procesos
            </Button>
          </Abre>
        </Demo>
        <Demo title="Centro de procesos vacío" description="Sin nada en proceso. Lo que termina se queda en la lista como procesado, con su resultado.">
          <Abre>
            <Button variant="outline" size="sm" onClick={() => setProcesosVacio(true)}>
              <HugeiconsIcon icon={Queue02Icon} aria-hidden="true" data-icon="inline-start" />
              Abrir sin procesos
            </Button>
          </Abre>
        </Demo>
        <Demo title="Perfil" description="Portal colaborador, centro de ayuda, contraseña, tema y cerrar sesión.">
          <Abre>
            <ProfilePopover />
          </Abre>
        </Demo>
      </div>
      <Reglas titulo="Reglas de la barra superior" reglas={REGLAS_BARRA_SUPERIOR} />
    </div>
  )
}

function Medidas() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Medidas del marco"
        description="El marco no usa las medidas de la librería tal como vienen: tiene las suyas, calibradas sobre el prototipo. Esta es la especificación oficial."
      />

      {MEDIDAS.map((grupo) => (
        <Card key={grupo.grupo}>
          <CardHeader>
            <CardTitle>{grupo.grupo}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Pieza</TableHead>
                  <TableHead className="w-1/4">Librería (vega)</TableHead>
                  <TableHead>Marco UBITS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupo.filas.map((fila) => (
                  <TableRow key={fila.pieza}>
                    {/* El texto baja de renglón en el propio Text: la celda de la librería fija nowrap y le gana a la clase. */}
                    <TableCell className="align-top">
                      <Text as="span" size="sm" className="whitespace-normal">
                        {fila.pieza}
                      </Text>
                    </TableCell>
                    <TableCell className="align-top">
                      <Text as="span" variant="muted" size="sm" className="whitespace-normal">
                        {fila.libreria}
                      </Text>
                    </TableCell>
                    <TableCell className="align-top">
                      <Text as="span" size="sm" className="whitespace-normal">
                        {fila.marco}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Reglas titulo="Receta del estado activo" reglas={ACTIVO} />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Esquinas</CardTitle>
          <CardDescription>
            El tema parte de 14 px y de ahí salen las cinco medidas de la librería. El marco y sus patrones usan más
            medidas; unificarlas está en Pendientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text as="span" size="sm" weight="medium">
              Escala del tema
            </Text>
            <div className="flex flex-wrap gap-2">
              {ESCALA_TEMA.map((esquina) => (
                <Badge key={esquina.nombre} variant="primary-light">
                  {esquina.nombre} · {esquina.px} px
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Text as="span" size="sm" weight="medium">
              En uso en el marco, Orbit y los patrones de Nicolás
            </Text>
            <div className="flex flex-wrap gap-2">
              {ESQUINAS_EN_USO.map((px) => (
                <Badge key={px} variant={ESCALA_TEMA.some((esquina) => esquina.px === px) ? 'primary-light' : 'outline'}>
                  {px} px
                </Badge>
              ))}
            </div>
            <Text as="span" variant="muted" size="xs">
              En azul, las que coinciden con la escala del tema.
            </Text>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Pie() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro title="Pie" description="Cierra cada pantalla del Workspace con la marca UBITS y los enlaces legales." />
      <Demo title="Pie general" description="Al final del contenido, centrado y en gris.">
        <AppFooter />
      </Demo>
      <Reglas titulo="Reglas del pie" reglas={REGLAS_PIE} />
    </div>
  )
}

export function Component() {
  const { pestana } = useParams()
  const navigate = useNavigate()
  const activa = PESTANAS.find((item) => item.valor === pestana)?.valor ?? 'barra-lateral'

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPatron
        titulo="Marco"
        antetitulo="Design system · Fundamentos"
        etiqueta={<Badge variant="info-light">Igual en todo el producto</Badge>}
        acciones={
          <>
            <VerEnAccion pagina="marco" />
            <Button nativeButton={false} render={<Link to="/design-system/navegacion/basica" />}>
              Ver shell básico
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
            </Button>
          </>
        }
      >
        Barra lateral, barra superior y pie: las tres piezas que rodean cada pantalla. Se ponen una sola vez en el
        marco general, así que una pantalla nueva no las vuelve a armar; si cambia el logo, se cambia en un solo lugar.
      </EncabezadoPatron>

      <Tabs value={activa} onValueChange={(valor) => navigate(`/design-system/marco/${valor}`)}>
        <PestanasDePatron items={PESTANAS} />
        <TabsContent value="barra-lateral" className="pt-6">
          <ConfiguradorBarraLateral />
        </TabsContent>
        <TabsContent value="header" className="pt-6">
          <ConfiguradorHeader />
        </TabsContent>
        <TabsContent value="capturas" className="pt-6">
          <div className="flex flex-col gap-10">
            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              <AlertTitle>Todo en vivo</AlertTitle>
              <AlertDescription>
                <p>
                  Nada de esta pestaña es una imagen: si cambia un color, el modo oscuro o el menú, cambia aquí también.
                  Los menús y ventanas se abren al tocarlos. Para prender y apagar cada pieza, usa las pestañas Barra
                  lateral y Header.
                </p>
              </AlertDescription>
            </Alert>
            <Alert variant="info">
                <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
                      <AlertTitle>Solo para el marco</AlertTitle>
                      <AlertDescription>
                  <p>
                    Estas medidas se aplican encima del estilo «vega» de flux-ui, el que usa el proyecto. Valen para la barra lateral,
                    la barra superior, el pie y sus menús. Las pantallas no las copian: usan las piezas como vienen de la librería.
                    Cuando exista un estilo UBITS en la librería, estas medidas pasan a vivir ahí.
                  </p>
                  <p>
                    Qué cambia en cada pieza, por qué y cuándo usarla está en{' '}
                    la ficha de cada una, en <Link to="/design-system/componentes">Componentes › Todos los componentes</Link>.
                  </p>
                </AlertDescription>
                    </Alert>
            <BarraLateral />
            <BarraSuperior />
            <Pie />
          </div>
        </TabsContent>
        <TabsContent value="medidas" className="pt-6">
          <Medidas />
        </TabsContent>
        <TabsContent value="pendientes" className="pt-6">
          <div className="flex flex-col gap-6">
            <SectionIntro title="Pendientes" description="Lo que falta decidir o alinear antes de dar el marco por cerrado." />
            <Reglas titulo="Por resolver" reglas={PENDIENTES} pendiente />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

Component.displayName = 'DesignSystemMarcoPage'
