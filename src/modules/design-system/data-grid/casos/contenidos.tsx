import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  Copy01Icon,
  Edit02Icon,
  HeadphonesIcon,
  Link01Icon,
  LockKeyIcon,
  Mortarboard01Icon,
  PlusSignIcon,
  Route01Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'

import { CasoUbits } from '../../patrones/piezas'
import { fechaCorta, plural } from '../../patrones/formato'

// Caso: listado de contenidos del LMS Creator.
// Fuente: HU «Listado de contenidos LMS Creator» (RN-01 a RN-06) y vocabulario de producto.

type Visibilidad = 'Borrador' | 'Público' | 'Privado' | 'Oculto' | 'Archivado'
type Tipo = 'Curso' | 'Ruta de aprendizaje' | 'Evento' | 'Podcast'
type Filtro = { id: string; value: unknown }

type Contenido = {
  id: string
  titulo: string
  tipo: Tipo
  partes: number
  visibilidad: Visibilidad
  inscritos: number
  editado: string
  editadoPor: string
}

const VISIBILIDADES: Visibilidad[] = ['Borrador', 'Público', 'Privado', 'Oculto', 'Archivado']
const TIPOS: Tipo[] = ['Curso', 'Ruta de aprendizaje', 'Evento', 'Podcast']

const ICONO: Record<Tipo, typeof Mortarboard01Icon> = {
  Curso: Mortarboard01Icon,
  'Ruta de aprendizaje': Route01Icon,
  Evento: Calendar03Icon,
  Podcast: HeadphonesIcon,
}

// Lo que tiene cada tipo por dentro: páginas en un curso, contenidos en una ruta…
const PARTES: Record<Tipo, [string, string]> = {
  Curso: ['página', 'páginas'],
  'Ruta de aprendizaje': ['contenido', 'contenidos'],
  Evento: ['sesión', 'sesiones'],
  Podcast: ['episodio', 'episodios'],
}

const BADGE: Record<Visibilidad, 'secondary' | 'success-light' | 'info-light' | 'warning-light' | 'outline'> = {
  Borrador: 'secondary',
  Público: 'success-light',
  Privado: 'info-light',
  Oculto: 'warning-light',
  Archivado: 'outline',
}

type Fila = [string, Tipo, number, Visibilidad, number, string, string]

const FILAS: Fila[] = [
  ['Onboarding comercial Q3', 'Curso', 8, 'Público', 312, '2026-09-09', 'Ana Restrepo'],
  ['Protocolos en sitio', 'Evento', 3, 'Privado', 48, '2026-09-08', 'Ana Restrepo'],
  ['Ruta para nuevos líderes', 'Ruta de aprendizaje', 6, 'Público', 128, '2026-09-05', 'Gabriela Nieto'],
  ['Seguridad de la información 2026', 'Curso', 12, 'Público', 640, '2026-08-30', 'Tomás Herrera'],
  ['Cultura Meta Colombia en cinco historias', 'Podcast', 5, 'Oculto', 0, '2026-08-28', 'Camila Bravo'],
  ['Excel para análisis de datos', 'Curso', 4, 'Borrador', 0, '2026-09-10', 'Ana Restrepo'],
  ['Inducción corporativa', 'Ruta de aprendizaje', 9, 'Público', 1184, '2026-07-14', 'Gabriela Nieto'],
  ['Atención al cliente omnicanal', 'Curso', 10, 'Privado', 86, '2026-08-19', 'Julia Moreno'],
  ['Taller de comunicación asertiva', 'Evento', 2, 'Borrador', 0, '2026-09-07', 'Daniela Soto'],
  ['Política de datos personales 2024', 'Curso', 6, 'Archivado', 902, '2025-01-20', 'Tomás Herrera'],
  ['Ventas consultivas', 'Curso', 7, 'Público', 214, '2026-06-02', 'Óscar Delgado'],
  ['Bienestar y pausas activas', 'Podcast', 8, 'Público', 377, '2026-05-11', 'Camila Bravo'],
  ['Primeros auxilios en planta', 'Evento', 4, 'Archivado', 64, '2025-10-03', 'Isabel Fuentes'],
  ['Gestión del cambio', 'Ruta de aprendizaje', 3, 'Borrador', 0, '2026-09-02', 'Andrés Cabrera'],
]

const CONTENIDOS: Contenido[] = FILAS.map(([titulo, tipo, partes, visibilidad, inscritos, editado, editadoPor], i) => ({
  id: `cnt-${i + 1}`,
  titulo,
  tipo,
  partes,
  visibilidad,
  inscritos,
  editado,
  editadoPor,
}))

// RN-01: qué se abre según la visibilidad.
const DESTINO: Record<Visibilidad, { titulo: string; detalle: string }> = {
  Borrador: { titulo: 'Asistente de creación', detalle: 'Se retoma con lo que ya se había llenado.' },
  Público: { titulo: 'Editor del contenido', detalle: 'Con Recursos, Ajustes y Resultados.' },
  Privado: { titulo: 'Editor del contenido', detalle: 'Con Recursos, Ajustes y Resultados.' },
  Oculto: { titulo: 'Editor del contenido', detalle: 'Con Recursos, Ajustes y Resultados.' },
  Archivado: { titulo: 'Editor en solo lectura', detalle: 'Se consulta, pero no se cambia nada.' },
}

const LEYENDA: { visibilidad: Visibilidad; etiqueta: string; icono: typeof ViewIcon }[] = [
  { visibilidad: 'Borrador', etiqueta: 'Borrador', icono: Edit02Icon },
  { visibilidad: 'Público', etiqueta: 'Público, privado u oculto', icono: ViewIcon },
  { visibilidad: 'Archivado', etiqueta: 'Archivado', icono: LockKeyIcon },
]

const SIN_ARRASTRE = { enableColumnOrdering: false }

// El ítem recién editado se marca con esta propiedad al volver del editor (RN-02).
type FilaVisible = Contenido & { recien?: boolean }

const COLUMNAS: DataGridListConfig<FilaVisible>['columns'] = [
  {
    accessorKey: 'titulo',
    header: 'Contenido',
    size: 340,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <IconTile variant="soft" size="sm">
          <HugeiconsIcon icon={ICONO[row.original.tipo]} aria-hidden="true" />
        </IconTile>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <Text as="span" size="sm" weight="medium" className="truncate">
              {row.original.titulo}
            </Text>
            {row.original.recien ? (
              <Badge variant="info-outline" size="xs" className="shrink-0">
                Recién editado
              </Badge>
            ) : null}
          </div>
          <Text as="span" variant="muted" size="xs" className="truncate">
            {row.original.tipo} · {row.original.partes}{' '}
            {plural(row.original.partes, ...PARTES[row.original.tipo])}
          </Text>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'visibilidad',
    header: 'Visibilidad',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE[row.original.visibilidad]} size="sm">
        {row.original.visibilidad}
      </Badge>
    ),
  },
  {
    accessorKey: 'inscritos',
    header: 'Inscritos',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.inscritos ? 'default' : 'muted'} className="tabular-nums">
        {row.original.inscritos ? row.original.inscritos.toLocaleString('es-CO') : '—'}
      </Text>
    ),
  },
  {
    accessorKey: 'editado',
    header: 'Última edición',
    size: 190,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm">
          {fechaCorta(row.original.editado)}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          por {row.original.editadoPor}
        </Text>
      </div>
    ),
  },
]

const FILTROS: DataGridListConfig<FilaVisible>['columnFilters'] = [
  {
    id: 'visibilidad',
    label: 'Visibilidad',
    type: 'select',
    multiple: true,
    options: VISIBILIDADES.map((v) => ({ label: v, value: v })),
  },
]

function resolver(busqueda: string, filtros: Filtro[], tipo: string, orden: string | undefined, fijado: string | null) {
  const q = busqueda.trim().toLowerCase()
  let resultado: FilaVisible[] = CONTENIDOS.filter((fila) => {
    if (tipo !== 'Todos' && fila.tipo !== tipo) return false
    if (q && ![fila.titulo, fila.editadoPor].some((c) => c.toLowerCase().includes(q))) return false
    for (const { id, value } of filtros) {
      if (Array.isArray(value) && value.length > 0 && !value.map(String).includes(String(fila[id as keyof Contenido]))) {
        return false
      }
    }
    return true
  })

  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof Contenido
    resultado = [...resultado].sort((a, b) => {
      const va = a[campo]
      const vb = b[campo]
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }

  // RN-02: el que se acaba de editar queda primero, marcado.
  const indice = fijado ? resultado.findIndex((fila) => fila.id === fijado) : -1
  if (indice > -1) {
    const [elegido] = resultado.splice(indice, 1)
    resultado = [{ ...elegido, recien: true }, ...resultado]
  }

  return resultado
}

export function CasoContenidos() {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [tipo, setTipo] = useState('Todos')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [fijado, setFijado] = useState<string | null>(null)

  const resultado = useMemo(() => resolver(busqueda, filtros, tipo, orden, fijado), [busqueda, filtros, tipo, orden, fijado])
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])

  const abrir = (contenido: Contenido) => {
    const destino = DESTINO[contenido.visibilidad]
    notify(
      `Se abre: ${destino.titulo.toLowerCase()}`,
      contenido.visibilidad === 'Archivado'
        ? `${contenido.titulo} está archivado: se puede leer, pero no editar.`
        : `${contenido.titulo} está en ${contenido.visibilidad.toLowerCase()}. Al volver, queda primero en la lista.`,
      'info',
    )
    if (contenido.visibilidad !== 'Archivado') {
      setFijado(contenido.id)
      setPagina(1)
    }
  }

  const config: DataGridListConfig<FilaVisible> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar contenido…',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    actions: {
      // RN-06: el botón principal abre un menú con los tres flujos de creación.
      primary: {
        id: 'crear',
        label: 'Crear contenido',
        icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />,
        isDropdown: true,
        dropdownGroups: [
          {
            items: [
              { id: 'contenido', label: 'Crear contenido', icon: <HugeiconsIcon icon={Mortarboard01Icon} aria-hidden="true" />, onClick: () => undefined },
              { id: 'ruta', label: 'Crear ruta de aprendizaje', icon: <HugeiconsIcon icon={Route01Icon} aria-hidden="true" />, onClick: () => undefined },
              { id: 'evento', label: 'Crear evento', icon: <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" />, onClick: () => undefined },
            ],
          },
        ],
        onDropdownItemClick: (id) => {
          const nombres: Record<string, string> = {
            contenido: 'Crear contenido: Portada, Recursos, Certificado y Ajustes.',
            ruta: 'Crear ruta de aprendizaje.',
            evento: 'Crear evento: igual que Crear contenido, con Asistencia en Recursos.',
          }
          notify('Se abre el asistente', nombres[id], 'info')
        },
        onClick: () => undefined,
      },
      item: [
        { id: 'abrir', label: 'Abrir', icon: <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />, onClick: ([fila]) => fila && abrir(fila) },
        { id: 'vista', label: 'Ver como colaborador', icon: <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />, onClick: ([fila]) => notify('Vista previa', fila?.titulo, 'info') },
        { id: 'duplicar', label: 'Duplicar', icon: <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />, onClick: ([fila]) => notify('Contenido duplicado como borrador', fila?.titulo, 'success') },
        { id: 'enlace', label: 'Copiar enlace', icon: <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />, onClick: () => notify('Enlace copiado', undefined, 'success') },
      ],
    },
    // RN-03: título y acción fijos para el vacío de búsqueda.
    emptyState: {
      type: 'no-results',
      title: 'No se encontraron resultados',
      description: 'Revisa cómo lo escribiste o prueba con otra palabra.',
      action: {
        id: 'limpiar',
        label: 'Limpiar búsqueda',
        variant: 'outline',
        onClick: () => {
          setBusqueda('')
          setFiltros([])
          setTipo('Todos')
        },
      },
    },
    frame: { toolbar: 'header' },
    // RN-05: el contador nombra lo que cuenta.
    labels: {
      resultCount: (_visibles, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'contenido', 'contenidos')}`,
    },
  }

  return (
    <CasoUbits
      rol="Creador"
      donde={['Aprendizaje', 'LMS Creator']}
      titulo="Listado que abre cosas distintas según el estado del ítem"
      descripcion="Ana busca un contenido entre decenas para seguir un borrador o editar uno publicado. Usa «Abrir» en el menú de cualquier fila (o clic derecho sobre ella) y mira a dónde la lleva según la visibilidad."
      historia="la historia «Listado de contenidos LMS Creator»"
      reglas={[
        { titulo: 'Se abre según la visibilidad', detalle: 'Borrador va al asistente; público, privado u oculto, al editor; archivado, a solo lectura.' },
        { titulo: 'Lo último editado queda primero', detalle: 'Al volver del editor, el contenido aparece arriba y marcado.' },
        { titulo: 'Tres formas de crear', detalle: 'El botón principal despliega Crear contenido, Crear ruta de aprendizaje y Crear evento.' },
        { titulo: 'El contador dice qué cuenta', detalle: 'Arriba dice «14 contenidos», no «14 resultados».' },
        { titulo: 'Vacío de búsqueda con salida', detalle: '«No se encontraron resultados» con el botón «Limpiar búsqueda».' },
      ]}
    >
      <ItemGroup className="grid gap-2 md:grid-cols-3">
        {LEYENDA.map((item) => (
          <Item key={item.visibilidad} variant="muted" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={item.icono} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{item.etiqueta}</ItemTitle>
              <ItemDescription>
                Abre el {DESTINO[item.visibilidad].titulo.toLowerCase()}. {DESTINO[item.visibilidad].detalle}
              </ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>

      <div className="flex flex-col gap-3">
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[tipo]}
          onValueChange={(valor) => {
            if (valor[0]) {
              setTipo(String(valor[0]))
              setPagina(1)
            }
          }}
          aria-label="Filtrar por tipo de contenido"
        >
          {['Todos', ...TIPOS].map((opcion) => (
            <ToggleGroupItem key={opcion} value={opcion}>
              {opcion}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <TablaDatos config={config} data={visibles} paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="contenidos" id="contenidos" />
      </div>
    </CasoUbits>
  )
}
