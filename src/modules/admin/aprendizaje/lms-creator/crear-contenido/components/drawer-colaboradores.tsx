import { useEffect, useState } from 'react'
import { UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { Avatar, AvatarFallback, AvatarImage, Button, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { BD_MASTER_COLABORADORES } from '@/shared/bd'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { BotonCancelarPanel, mismaSeleccion } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { iniciales } from '@/modules/design-system/patrones/formato'
import { TablaSeleccion, type Filtro } from '../../../planes-de-formacion/components/tabla-seleccion'

// Visibilidad privada: a qué colaboradores de la empresa les llega el contenido. Primera vez «Seleccionar
// colaboradores» (Agregar suma a lo que había); con gente ya elegida, «Editar selección» (Guardar reemplaza la lista).
//
// La tabla es la `TablaSeleccion` de Planes de formación, que es la del `DataGridList` de la librería y la que usa el
// resto del equipo: hace exactamente este gesto —elegir varios de una lista larga, con casillas, buscador, filtros por
// columna y «Seleccionados (N)»— y no hay motivo para tener aquí otra distinta (Dave, 2-oct).

type Persona = { id: string; nombre: string; username: string; area: string; lider: string; avatar?: string; cargo: string }

export const PERSONAS: Persona[] = (
  BD_MASTER_COLABORADORES.colaboradores as { id: string; nombre: string; username?: string; area: string; jefe: string | null; avatar?: string; cargo: string }[]
).map((c) => ({
  id: c.id,
  nombre: c.nombre,
  username: c.username ?? `${iniciales(c.nombre).toLowerCase()}@fiqsha.demo`,
  area: c.area,
  lider: c.jefe ?? '-',
  avatar: c.avatar,
  cargo: c.cargo,
}))

const AREAS = [...new Set(PERSONAS.map((p) => p.area))].sort()
const CARGOS = [...new Set(PERSONAS.map((p) => p.cargo))].sort()

const sinTildes = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const texto = (valor: string, apagado = false) => (
  <Text as="span" size="sm" variant={apagado ? 'muted' : undefined} className="block truncate">
    {valor}
  </Text>
)

const COLUMNAS: DataGridListConfig<Persona>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre del usuario',
    size: 260,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          {row.original.avatar ? <AvatarImage src={row.original.avatar} alt="" /> : null}
          <AvatarFallback>{iniciales(row.original.nombre)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <Text as="span" size="sm" weight="medium" className="truncate">
            {row.original.nombre}
          </Text>
          <Text as="span" variant="muted" size="xs" className="truncate">
            {row.original.username}
          </Text>
        </div>
      </div>
    ),
  },
  { accessorKey: 'area', header: 'Área', size: 160, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.area) },
  { accessorKey: 'cargo', header: 'Cargo', size: 220, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.cargo) },
  { accessorKey: 'lider', header: 'Líder', size: 180, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.lider, true) },
]

const FILTROS: DataGridListConfig<Persona>['columnFilters'] = [
  { id: 'area', label: 'Área', type: 'select', multiple: true, options: AREAS.map((a) => ({ label: a, value: a })) },
  { id: 'cargo', label: 'Cargo', type: 'select', multiple: true, options: CARGOS.map((c) => ({ label: c, value: c })) },
]

const coincidePersona = (p: Persona, busqueda: string, filtros: Filtro[]) => {
  for (const campo of ['area', 'cargo'] as const) {
    const valor = filtros.find((f) => f.id === campo)?.value
    const elegidos = Array.isArray(valor) ? (valor as string[]) : []
    if (elegidos.length && !elegidos.includes(p[campo])) return false
  }
  return !busqueda || sinTildes(`${p.nombre} ${p.username} ${p.area} ${p.cargo}`).includes(sinTildes(busqueda))
}

type Props = { abierto: boolean; onCerrar: () => void; seleccionados: string[]; onGuardar: (ids: string[]) => void }

export function DrawerColaboradores({ abierto, onCerrar, seleccionados, onGuardar }: Props) {
  const editando = seleccionados.length > 0
  const [marcados, setMarcados] = useState<string[]>(seleccionados)

  // Al abrir se parte de lo que ya estaba elegido.
  useEffect(() => {
    if (abierto) setMarcados(seleccionados)
  }, [abierto, seleccionados])

  const guardar = () => {
    // Editando, la lista se reemplaza; la primera vez, se suma a lo que hubiera.
    onGuardar(editando ? marcados : [...new Set([...seleccionados, ...marcados])])
    onCerrar()
  }

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(v) => !v && onCerrar()}
      size="xl"
      icon={UserMultiple02Icon}
      title={editando ? 'Editar selección' : 'Seleccionar colaboradores'}
      description="Solo los colaboradores seleccionados verán el contenido."
      // 13-oct (I-041): con la selección cambiada, no se cierra al tocar fuera y pregunta antes de descartar.
      conCambios={!mismaSeleccion(marcados, seleccionados)}
      footer={
        <>
          <BotonCancelarPanel alCerrar={onCerrar} />
          <Button onClick={guardar}>{editando ? 'Guardar cambios' : 'Agregar'}</Button>
        </>
      }
    >
      <TablaSeleccion
        id="elegir-colaboradores"
        titulo="Colaboradores"
        sustantivo={['colaborador', 'colaboradores']}
        filas={PERSONAS}
        columnas={COLUMNAS}
        filtros={FILTROS}
        coincide={coincidePersona}
        buscar="Buscar colaboradores"
        marcados={marcados}
        onCambio={setMarcados}
      />
    </DrawerShell>
  )
}
