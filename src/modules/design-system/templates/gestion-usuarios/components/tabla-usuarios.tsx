import { createContext, useContext } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit02Icon, LockPasswordIcon, MoreHorizontalIcon, UserBlock01Icon, UserCheck01Icon, ViewIcon } from '@hugeicons/core-free-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { Persona } from '../../../data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '../../../data-grid/casos/sin-arrastre'
import { fechaCorta } from '../../../patrones/formato'
import { AREAS, ROLES, nombreCompleto, type EstadoProceso, type EstadoUsuario, type Rol, type Usuario } from './datos'

// La tabla de usuarios: columnas, filtros y menú de cada fila. La usan la lista de Gestión de usuarios y la carga de
// pantalla de Estados, para que el esqueleto que se ve mientras llega sea la misma tabla que después aparece.

export const BADGE_ESTADO: Record<EstadoUsuario, 'success-light' | 'secondary'> = { Activo: 'success-light', Suspendido: 'secondary' }
export const BADGE_ROL: Record<Rol, 'primary-light' | 'outline'> = { Administrador: 'primary-light', Colaborador: 'outline' }
// Lo rojo va en destructive-outline: destructive-light no se lee en el tema claro.
const BADGE_PROCESO: Record<EstadoProceso, 'success-light' | 'info-light' | 'destructive-outline'> = {
  Finalizado: 'success-light',
  'En proceso': 'info-light',
  'Con error': 'destructive-outline',
}

export const BUSCAR_USUARIOS = 'Buscar por nombre, apellido o username…'

// ── Menú de cada fila ──
// Suspender o Activar depende del estado de la fila; el menú de la tabla (actions.item) es el
// mismo para todas, así que va en una columna propia que lee las acciones de un contexto (igual
// que en el caso «Evaluaciones 360°» de Data-grid).

export type AccionFila = 'ver' | 'editar' | 'contrasena' | 'suspender' | 'activar'
export const AccionContexto = createContext<(accion: AccionFila, usuario: Usuario) => void>(() => undefined)

function MenuDeFila({ usuario }: { usuario: Usuario }) {
  const ejecutar = useContext(AccionContexto)
  const activo = usuario.estado === 'Activo'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${nombreCompleto(usuario)}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => ejecutar('ver', usuario)}>
            <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
            Ver usuario
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => ejecutar('editar', usuario)}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
            Editar usuario
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => ejecutar('contrasena', usuario)} disabled={!activo}>
            <HugeiconsIcon icon={LockPasswordIcon} aria-hidden="true" />
            Cambiar contraseña
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => ejecutar(activo ? 'suspender' : 'activar', usuario)}>
          <HugeiconsIcon icon={activo ? UserBlock01Icon : UserCheck01Icon} aria-hidden="true" />
          {activo ? 'Suspender' : 'Activar'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Columnas y filtros (fuera del componente: si no, el filtro se cierra al marcar) ──
// Cabecera de la tabla del sistema (decisión 1 de la auditoría): encabezados de 40 px con asidero para mover cada
// columna, y la de los tres puntos con su encabezado «Acciones» (esa no se mueve).

export const COLUMNAS_USUARIOS: DataGridListConfig<Usuario>['columns'] = [
  {
    // Nombres y apellidos en una sola columna, con el username debajo: la tabla cabe en el cuerpo
    // de 1.140 px sin deslizarse. El correo está en «Ver usuario».
    accessorKey: 'nombres',
    header: 'Nombre y username',
    size: 260,
    cell: ({ row }) => <Persona nombre={nombreCompleto(row.original)} detalle={row.original.username} />,
  },
  {
    accessorKey: 'area',
    header: 'Área',
    size: 180,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" className="truncate">
          {row.original.area}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {row.original.cargo}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'rol',
    header: 'Rol',
    size: 130,
    cell: ({ row }) => (
      <Badge variant={BADGE_ROL[row.original.rol]} size="sm">
        {row.original.rol}
      </Badge>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 120,
    cell: ({ row }) => (
      <Badge variant={BADGE_ESTADO[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
  {
    accessorKey: 'creado',
    header: 'Fecha de creación',
    size: 140,
    cell: ({ row }) => (
      <Text as="span" size="sm">
        {fechaCorta(row.original.creado)}
      </Text>
    ),
  },
  {
    accessorKey: 'proceso',
    header: 'Estado del proceso',
    size: 150,
    cell: ({ row }) => (
      <Badge variant={BADGE_PROCESO[row.original.proceso]} size="sm">
        {row.original.proceso}
      </Badge>
    ),
  },
  {
    id: 'acciones',
    header: 'Acciones',
    size: 96,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <MenuDeFila usuario={row.original} />,
  },
]

export const FILTROS_USUARIOS: DataGridListConfig<Usuario>['columnFilters'] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: (['Activo', 'Suspendido'] as EstadoUsuario[]).map((v) => ({ label: v, value: v })) },
  { id: 'rol', label: 'Rol', type: 'select', multiple: true, options: ROLES.map((v) => ({ label: v, value: v })) },
  { id: 'area', label: 'Área', type: 'select', multiple: true, searchable: true, options: AREAS.map((v) => ({ label: v, value: v })) },
  {
    id: 'proceso',
    label: 'Estado del proceso',
    type: 'select',
    multiple: true,
    options: (['Finalizado', 'En proceso', 'Con error'] as EstadoProceso[]).map((v) => ({ label: v, value: v })),
  },
]
