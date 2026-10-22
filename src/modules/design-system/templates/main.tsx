import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  ChartColumnIcon,
  CheckListIcon,
  DashboardSquare01Icon,
  DashboardSquare02Icon,
  Home01Icon,
  LayoutLeftIcon,
  Login01Icon,
  MortarboardIcon,
  UserGroupIcon,
  UserMultiple02Icon,
  Briefcase06Icon,
  Building03Icon,
  MarketingIcon,
  Note05Icon,
  PaintBrush01Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Heading,
  IconTile,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'

import { EncabezadoPatron } from '../patrones/piezas'
import { IconoIA } from '../ia/icono-ia'

// Índice de pantallas, con los mismos grupos que el menú: Admin, Colaborador e inicio de sesión, y Archivo
// (exploraciones y copias del concepto que ya no se mantienen). Cada una abre a pantalla completa con su marco.

type Template = {
  titulo: string
  ruta: string
  descripcion: string
  // 'ia' pinta el orbe (<IconoIA />): lo que es de IA no lleva chispas ni varitas.
  icono: typeof MortarboardIcon | 'ia'
  etiquetas: string[]
}

const ADMIN: Template[] = [
  {
    titulo: 'Home operativo',
    ruta: '/design-system/templates/home-operativo',
    descripcion:
      'El inicio del administrador: métricas por periodo, lo que necesita atención, accesos rápidos, Orbit, menú de empresa, novedades y feedback.',
    icono: Home01Icon,
    etiquetas: ['Navegable', 'Orbit'],
  },
  {
    titulo: 'Gestión de usuarios',
    ruta: '/design-system/templates/gestion-usuarios',
    descripcion:
      'Lista de usuarios con filtros y menú por fila, Crear usuario con validación, acciones masivas por archivo en cuatro pasos y recordatorios de inicio de sesión.',
    icono: UserMultiple02Icon,
    etiquetas: ['3 pantallas', 'Data grid', 'Formularios', 'Procesos'],
  },
  {
    titulo: 'Planes de formación',
    ruta: '/design-system/templates/planes-formacion',
    descripcion:
      'Planes de contenidos y competencias con acciones según el estado, crear plan con «Agregar asignación» en tres pasos y el detalle de progreso.',
    icono: CheckListIcon,
    etiquetas: ['3 pantallas', 'HU-LMS-005', 'Vacíos', 'Confirmaciones'],
  },
  {
    titulo: 'Encuestas',
    ruta: '/design-system/templates/encuestas',
    descripcion:
      'La tabla de encuestas con búsqueda, recarga, filtros y acciones sobre la selección; crear en blanco o con plantilla, comparar y datos demográficos.',
    icono: ChartColumnIcon,
    etiquetas: ['2 pestañas', 'Data grid', 'Carga', 'Avisos'],
  },
]

// Pantallas nuevas del admin que ya viven en el producto (/admin), armadas desde la plataforma real el 16 de
// septiembre de 2026. Muestran en acción los casos que no tenían dónde verse.
const PRODUCTO: Template[] = [
  {
    titulo: 'Tareas',
    ruta: '/admin/tareas',
    descripcion:
      'Seguimiento de tareas y planes de toda la empresa: periodo, indicadores, selección múltiple y el detalle de la tarea al lado de la lista.',
    icono: Note05Icon,
    etiquetas: ['Maestro-detalle', 'Data grid', 'HU-TAR-003'],
  },
  {
    titulo: 'Avisos internos',
    ruta: '/admin/avisos-internos',
    descripcion:
      'La lista de comunicaciones con métricas, historial y archivar, y el editor con vista previa donde el agente reescribe y revisa antes de publicar.',
    icono: MarketingIcon,
    etiquetas: ['2 pantallas', 'Orbit', 'Formularios'],
  },
  {
    titulo: 'Detalle de vacante',
    ruta: '/admin/seleccion/vacantes/analista-de-datos',
    descripcion:
      'Los candidatos en las 5 etapas del flujo, la ficha de cada uno y el agente que resume un candidato y compara finalistas.',
    icono: Briefcase06Icon,
    etiquetas: ['Tablero', 'Drawer', 'Orbit'],
  },
  {
    titulo: 'Datos de empresa',
    ruta: '/admin/configuracion/datos-empresa',
    descripcion: 'Datos de la empresa y de la suscripción, de solo lectura, desde el menú de empresa.',
    icono: Building03Icon,
    etiquetas: ['Configuración', '2 pestañas'],
  },
  {
    titulo: 'Personalización',
    ruta: '/admin/configuracion/personalizacion',
    descripcion: 'Logos e imagen de fondo del inicio de sesión y del encabezado, con vista previa y vista de celular.',
    icono: PaintBrush01Icon,
    etiquetas: ['Configuración', 'Vista previa'],
  },
]

const COLABORADOR: Template[] = [
  {
    titulo: 'Colaborador',
    ruta: '/design-system/templates/colaborador',
    descripcion:
      'El Workspace del colaborador con el recorrido «Estudiar un contenido asignado»: Inicio, Catálogo, Zona de estudio, Progreso, Ficha de contenido y Experiencia de estudio.',
    icono: MortarboardIcon,
    etiquetas: ['6 pantallas', 'Navegable'],
  },
  {
    titulo: 'Inicio de sesión',
    ruta: '/design-system/templates/auth',
    descripcion: 'Inicio de sesión a pantalla completa, sin menú, con el logo del cliente.',
    icono: Login01Icon,
    etiquetas: ['Sin marco'],
  },
]

const SUITE_AI: Template[] = [
  {
    titulo: 'Orbit (concepto)',
    ruta: '/design-system/templates/suite-ai',
    descripcion: 'La copia en código del concepto de Nicolás, con sus 7 casos. La versión viva de Orbit está en el marco general, en /suite-ai.',
    icono: 'ia',
    etiquetas: ['Concepto', '7 casos'],
  },
  {
    titulo: 'Home Orbit',
    ruta: '/design-system/templates/home-suite-ai',
    descripcion: 'El Home operativo dentro del menú y la barra superior del concepto de Orbit.',
    icono: DashboardSquare02Icon,
    etiquetas: ['Concepto'],
  },
]

const ARCHIVO: Template[] = [
  {
    titulo: 'Dashboard RR.HH.',
    ruta: '/design-system/templates/dashboard-rrhh',
    descripcion: 'Primera versión del inicio de Recursos Humanos en tres vistas: inicio, operativo y métricas.',
    icono: UserGroupIcon,
    etiquetas: ['Exploración'],
  },
  {
    titulo: 'Dashboard',
    ruta: '/design-system/templates/dashboard',
    descripcion: 'Dashboard general con indicadores, gráficos, actividad y pendientes.',
    icono: DashboardSquare01Icon,
    etiquetas: ['Exploración'],
  },
  {
    titulo: 'App shell 2',
    ruta: '/design-system/templates/app-shell-2',
    descripcion: 'Variante temprana del marco con cambio de empresa y tarjeta promocional.',
    icono: LayoutLeftIcon,
    etiquetas: ['Exploración'],
  },
  {
    titulo: 'App shell 3',
    ruta: '/design-system/templates/app-shell-3',
    descripcion: 'Variante del marco con el inicio del administrador y tarjeta de uso.',
    icono: LayoutLeftIcon,
    etiquetas: ['Exploración'],
  },
  {
    titulo: 'Shell test',
    ruta: '/design-system/templates/shell-test',
    descripcion: 'Primera exploración del marco del Workspace.',
    icono: LayoutLeftIcon,
    etiquetas: ['Exploración'],
  },
]

const SECCIONES = [
  { id: 'admin', titulo: 'Admin', descripcion: 'Pantallas del administrador que hoy usa UBITS, con sus columnas, campos y textos reales.', plantillas: ADMIN },
  {
    id: 'producto',
    titulo: 'En el producto',
    descripcion: 'Pantallas nuevas del administrador que ya viven en /admin, con su menú real. Se abren fuera del design system.',
    plantillas: PRODUCTO,
  },
  { id: 'colaborador', titulo: 'Colaborador e inicio de sesión', descripcion: 'El recorrido del colaborador y la entrada a la plataforma.', plantillas: COLABORADOR },
  {
    id: 'suite-ai',
    titulo: 'Orbit',
    descripcion: 'El concepto de Orbit en código. También se llega desde Orbit › Pantallas, donde está todo lo de la IA.',
    plantillas: SUITE_AI,
  },
  { id: 'archivo', titulo: 'Archivo', descripcion: 'Exploraciones viejas que ya no se mantienen. Conservan su marco de entonces y quedan solo para consulta.', plantillas: ARCHIVO },
]

function TarjetaTemplate({ template }: { template: Template }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <IconTile variant="soft">
          {template.icono === 'ia' ? <IconoIA /> : <HugeiconsIcon icon={template.icono} aria-hidden="true" />}
        </IconTile>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle>{template.titulo}</CardTitle>
          <CardDescription>{template.descripcion}</CardDescription>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {template.etiquetas.map((etiqueta) => (
            <Badge key={etiqueta} variant="secondary" size="sm">
              {etiqueta}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to={template.ruta} />}>
          Abrir pantalla
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron
        titulo="Pantallas"
        antetitulo="Design system · Pantallas"
        etiqueta={<Badge variant="info-light">{SECCIONES.reduce((total, seccion) => total + seccion.plantillas.length, 0)} pantallas</Badge>}
      >
        Pantallas completas del nuevo UBITS armadas con el sistema. Las de Admin y Colaborador usan la barra lateral, la
        barra superior y el pie del design system; se vuelve aquí desde «Volver a Pantallas» al final del menú.
      </EncabezadoPatron>

      {SECCIONES.map((seccion) => (
        <section key={seccion.id} className="flex flex-col gap-4" aria-labelledby={seccion.id}>
          <div className="flex flex-col gap-1">
            <Heading as="h2" level={4} id={seccion.id}>
              {seccion.titulo}
            </Heading>
            <Text variant="muted" size="sm">
              {seccion.descripcion}
            </Text>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seccion.plantillas.map((template) => (
              <TarjetaTemplate key={template.ruta} template={template} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

Component.displayName = 'DesignSystemTemplatesPage'
