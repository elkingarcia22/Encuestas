import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Edit02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Badge, Button, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ConfirmarEliminar } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { plural } from '@/modules/design-system/patrones/formato'
import { AgenteGrupos, useAgente } from './agente-aprendizaje'
import { cambiarGrupos, useGrupos, type Grupo } from './grupos-datos'
import { ordenarPor, usePlanes, type Plan } from './planes-datos'

// Aprendizaje › Planes de formación › Grupos (/creator/groups, HU-LMS-006). Rediseño parcial: la misma lista de hoy
// —nombre, descripción e integrantes, con el asistente de IA— en la tabla del design system (DataGridList, como Data
// grid › Evaluaciones 360°): buscador, orden por columna, menú por fila y paginación salen de ella.
//
// Como en UBITS: nombre, descripción, integrantes y la fila abre «Edición de grupo» (no hay detalle aparte). Se suma «En
// planes», para saber qué se mueve al editar un grupo. Hallazgo del inventario: hoy «Editar» es un enlace de texto en
// cada fila, distinto al menú de acciones del resto del admin; aquí va en el mismo menú (⋯) que Planes, con «Eliminar».

export const BASE_GRUPOS = '/admin/aprendizaje/planes-de-formacion/grupos'
export const rutaGrupo = (resto = '') => (resto ? `${BASE_GRUPOS}/${resto}` : BASE_GRUPOS)

export const planesConGrupo = (planes: Plan[], grupo: Grupo) =>
  planes.filter((p) => p.asignaciones.some((a) => a.alcance === 'grupos' && a.destinatarios.includes(grupo.nombre)))

type FilaGrupo = Grupo & { cuantos: number; enPlanes: number }

function CeldaGrupo({ grupo }: { grupo: FilaGrupo }) {
  const navigate = useNavigate()
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Button variant="link" size="sm" className="max-w-full px-0!" onClick={() => navigate(rutaGrupo(grupo.id))}>
        <span className="truncate">{grupo.nombre}</span>
      </Button>
      <Text as="span" variant="muted" size="xs" className="max-w-full truncate">
        {grupo.descripcion || 'Sin descripción'}
      </Text>
    </div>
  )
}

const COLUMNAS: DataGridListConfig<FilaGrupo>['columns'] = [
  { accessorKey: 'nombre', header: 'Nombre', size: 660, ...SIN_ARRASTRE, cell: ({ row }) => <CeldaGrupo grupo={row.original} /> },
  {
    accessorKey: 'cuantos',
    header: 'Integrantes',
    size: 180,
    ...SIN_ARRASTRE,
    // El número y no un grupo de avatares: con iniciales, el solapamiento tapa la segunda letra.
    cell: ({ row }) =>
      row.original.cuantos ? (
        <Text as="span" size="sm" className="tabular-nums">
          {row.original.cuantos.toLocaleString('es-CO')} {plural(row.original.cuantos, 'persona', 'personas')}
        </Text>
      ) : (
        <Badge variant="warning-outline" size="sm">
          Sin integrantes
        </Badge>
      ),
  },
  {
    accessorKey: 'enPlanes',
    header: 'En planes',
    size: 180,
    ...SIN_ARRASTRE,
    cell: ({ row }) =>
      row.original.enPlanes ? (
        <Badge variant="secondary" size="sm" className="tabular-nums">
          {row.original.enPlanes} {plural(row.original.enPlanes, 'plan', 'planes')}
        </Badge>
      ) : (
        <Text as="span" size="sm" variant="muted">
          Ninguno
        </Text>
      ),
  },
]

export function ListaGrupos() {
  const navigate = useNavigate()
  const grupos = useGrupos()
  const planes = usePlanes()
  const agente = useAgente()
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [eliminando, setEliminando] = useState<Grupo[]>([])
  // ?vacio en la dirección muestra la lista sin grupos (el estado «Primera vez»), como en Planes.
  const verVacio = useSearchParams()[0].has('vacio')

  // Lo último que se tocó queda arriba.
  const filas = useMemo<FilaGrupo[]>(
    () =>
      verVacio
        ? []
        : [...grupos].sort((a, b) => b.tocado - a.tocado).map((g) => ({ ...g, cuantos: g.integrantes.length, enPlanes: planesConGrupo(planes, g).length })),
    [grupos, planes, verVacio],
  )
  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return ordenarPor(
      filas.filter((g) => !q || `${g.nombre} ${g.descripcion}`.toLowerCase().includes(q)),
      orden,
    )
  }, [filas, busqueda, orden])
  const visibles = resultado.slice((pagina - 1) * porPagina, pagina * porPagina)

  const eliminar = () => {
    const ids = eliminando.map((g) => g.id)
    const nombres = eliminando.map((g) => g.nombre)
    cambiarGrupos((todos) => todos.filter((g) => !ids.includes(g.id)))
    setEliminando([])
    notify(
      nombres.length === 1 ? 'Grupo eliminado' : `${nombres.length} grupos eliminados`,
      'Los planes que ya los tenían asignados conservan a sus personas.',
    )
  }

  const config: DataGridListConfig<FilaGrupo> = {
    columns: COLUMNAS,
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar por nombre o descripción',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    // Editar y eliminar valen para cualquier grupo: el menú de fila de la tabla sirve tal cual.
    actions: {
      item: [
        { id: 'editar', label: 'Editar', icon: <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />, onClick: (filas) => filas[0] && navigate(rutaGrupo(filas[0].id)) },
        { id: 'eliminar', label: 'Eliminar', variant: 'destructive', icon: <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />, onClick: (filas) => setEliminando(filas) },
      ],
    },
    emptyState: busqueda.trim()
      ? {
          type: 'no-results',
          customComponent: (
            <SinResultados
              busqueda={busqueda}
              onLimpiar={() => {
                setBusqueda('')
                setVersion((v) => v + 1)
              }}
            />
          ),
        }
      : {
          // «Primera vez» con ilustración, igual que la lista de planes (decisión 14 de la auditoría, 5-oct).
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-add"
              titulo="Todavía no hay grupos"
              descripcion="Arma un grupo una vez —un área, una sede, una cohorte— y asígnale planes sin elegir a cada persona."
              accion={{ texto: 'Añadir grupo', icono: PlusSignIcon, onClick: () => navigate(rutaGrupo('crear')) }}
            />
          ),
        },
    frame: { title: 'Grupos', toolbar: 'header' },
    labels: { resultCount: (_visibles, total) => `${total} ${plural(total, 'grupo', 'grupos')}` },
  }

  return (
    <PageShell>
      <PageHeader
        title="Grupos"
        description="Conjuntos de colaboradores para asignarles planes de formación sin elegir a cada persona."
        actions={
          <>
            <Button onClick={() => navigate(rutaGrupo('crear'))}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
              Añadir grupo
            </Button>
            {/* Lo de IA va de último y se abre al lado de la lista: no es otra página. */}
            {agente.disponible ? <ReopenAgentButton onClick={agente.abrir} /> : null}
          </>
        }
      />

      <PageContent>
        <TablaDatos key={version} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre="grupos" id="grupos" />
      </PageContent>

      {/* RN-05: eliminar grupos se confirma escribiendo «eliminar»; admite varios a la vez. */}
      <ConfirmarEliminar
        abierto={eliminando.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : setEliminando([]))}
        cantidad={eliminando.length}
        sustantivo={['grupo', 'grupos']}
        titulo={eliminando.length === 1 ? 'Eliminar grupo' : `Eliminar ${eliminando.length} grupos`}
        descripcion={
          eliminando.length === 1
            ? `¿Deseas eliminar «${eliminando[0].nombre}»? Sus ${eliminando[0].integrantes.length} integrantes no se borran de la empresa, y los planes que ya lo tenían asignado conservan a sus personas.`
            : `Vas a eliminar ${eliminando.length} grupos: ${eliminando.map((g) => g.nombre).join(', ')}. Sus integrantes no se borran de la empresa, y los planes que ya los tenían asignados conservan a sus personas.`
        }
        accion={eliminando.length === 1 ? 'Eliminar grupo' : `Eliminar ${eliminando.length} grupos`}
        onConfirmar={eliminar}
      />
      {agente.portal(<AgenteGrupos grupos={grupos} onClose={agente.cerrar} />)}
    </PageShell>
  )
}
