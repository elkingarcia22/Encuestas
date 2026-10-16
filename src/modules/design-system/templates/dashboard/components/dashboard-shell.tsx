import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  BuildingIcon,
  GroupLayersIcon,
  MoreHorizontalIcon,
  PaintBrush01Icon,
  SecurityLockIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { feedbackItem, sidebarNavs } from '@/shared/layouts/nav-config'
import { ShellUbits, type GrupoNav } from '../../../shell/shell-ubits'
import { DashboardView } from './dashboard-view'
import { EMPRESA, USUARIO } from './data'

// Los dashboards usan el marco único del playground (ShellUbits): mismas medidas que el design
// system y que el resto de templates. El menú es el del administrador del nuevo UBITS; como sus
// pantallas no existen en este template, las entradas marcan la selección sin navegar.

const nav = sidebarNavs.admin

const GRUPOS: GrupoNav[] = nav.groups.map((grupo) => ({
  etiqueta: grupo.label,
  items: grupo.items.map((item) => ({
    titulo: item.title,
    icono: item.icon,
    badge: item.badge,
    hijos: item.children?.map((hijo) => ({ titulo: hijo.title })),
  })),
}))

// Menú de empresa del nuevo UBITS: la configuración sale del encabezado y vive junto al logo.
const AJUSTES = [
  { titulo: 'Gestión de usuarios', icono: UserGroupIcon },
  { titulo: 'Personalización', icono: PaintBrush01Icon },
  { titulo: 'Organigrama', icono: GroupLayersIcon },
  { titulo: 'Datos de empresa', icono: BuildingIcon },
  { titulo: 'Roles y permisos', icono: SecurityLockIcon },
]

function MenuEmpresa() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <BotonIcono
            aria-label="Opciones de la empresa"
            className="shrink-0 group-data-[collapsible=icon]:hidden"
          />
        }
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Configuración</DropdownMenuLabel>
          {AJUSTES.map((ajuste) => (
            <DropdownMenuItem key={ajuste.titulo}>
              <HugeiconsIcon icon={ajuste.icono} aria-hidden="true" />
              {ajuste.titulo}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardShell({
  pagina = 'Dashboard',
  children = <DashboardView />,
}: {
  pagina?: string
  children?: ReactNode
}) {
  return (
    <ShellUbits
      marca={{ nombre: EMPRESA.nombre, inicial: EMPRESA.inicial, logo: EMPRESA.logo, menu: <MenuEmpresa /> }}
      inicio={{ titulo: 'Inicio', icono: nav.home.icon }}
      grupos={GRUPOS}
      migas={[{ etiqueta: 'Inicio', ruta: '#' }, { etiqueta: pagina }]}
      usuario={{ nombre: USUARIO.nombre, detalle: 'Administrador', iniciales: USUARIO.iniciales }}
      pie={[
        { titulo: feedbackItem.title, icono: feedbackItem.icon },
        { titulo: 'Volver a Templates', icono: ArrowLeft01Icon, ruta: '/design-system/templates' },
      ]}
      acciones={
        <Button variant="outline" size="sm">
          Novedades
        </Button>
      }
      notificaciones={6}
    >
      {children}
    </ShellUbits>
  )
}
