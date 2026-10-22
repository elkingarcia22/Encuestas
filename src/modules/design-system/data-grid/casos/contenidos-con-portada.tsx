import { useMemo, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Calendar03Icon, Mortarboard01Icon, Route01Icon } from '@hugeicons/core-free-icons'
import { Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { SinResultados } from '@/shared/components/SinResultados'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import {
  CambioDeVista,
  MarcoCuadricula,
  type VistaLista,
} from '@/modules/admin/aprendizaje/lms-creator/contenidos/components/controles-lista'
import { CeldaTitulo } from '../celda-titulo'
import { TablaDatos } from '../tabla-datos'
import { Demo } from '../../patrones/piezas'

// Una lista de contenidos con portada: tabla o tarjetas, con el cambio Tabla/Cuadrícula (regla
// «contenidos-tabla-o-tarjetas», 9-oct; documentada aquí el 13-oct). El modo tabla es TablaDatos con CeldaTitulo y
// miniatura; la cuadrícula va en el marco gris (MarcoCuadricula) con las tarjetas y el paginador del sistema. Cada vista
// lleva su buscador y se vacía al cambiar de una a otra. En el portal del colaborador arranca en Cuadrícula; en
// LMS Creator, también (la tabla se pide con `#tabla`).

type Contenido = {
  id: string
  titulo: string
  tipo: 'Curso' | 'Ruta de aprendizaje' | 'Evento'
  duracion: string
  visibilidad: 'Público' | 'Privado' | 'Borrador'
  inscritos: number
}

const ICONO: Record<Contenido['tipo'], IconSvgElement> = {
  Curso: Mortarboard01Icon,
  'Ruta de aprendizaje': Route01Icon,
  Evento: Calendar03Icon,
}

const COLOR: Record<Contenido['visibilidad'], 'success-light' | 'info-light' | 'secondary'> = {
  Público: 'success-light',
  Privado: 'info-light',
  Borrador: 'secondary',
}

const CONTENIDOS: Contenido[] = [
  { id: 'c1', titulo: 'Onboarding comercial Q3', tipo: 'Curso', duracion: '2 horas', visibilidad: 'Público', inscritos: 312 },
  { id: 'c2', titulo: 'Ruta para nuevos líderes', tipo: 'Ruta de aprendizaje', duracion: '6 horas', visibilidad: 'Público', inscritos: 128 },
  { id: 'c3', titulo: 'Protocolos en sitio', tipo: 'Evento', duracion: '9:00 a 11:00', visibilidad: 'Privado', inscritos: 48 },
  { id: 'c4', titulo: 'Seguridad de la información 2026', tipo: 'Curso', duracion: '3 horas', visibilidad: 'Público', inscritos: 640 },
  { id: 'c5', titulo: 'Excel para análisis de datos', tipo: 'Curso', duracion: '4 horas', visibilidad: 'Borrador', inscritos: 0 },
  { id: 'c6', titulo: 'Inducción corporativa', tipo: 'Ruta de aprendizaje', duracion: '5 horas', visibilidad: 'Público', inscritos: 1184 },
]

const COLUMNAS: DataGridListConfig<Contenido>['columns'] = [
  {
    accessorKey: 'titulo',
    header: 'Contenido',
    size: 420,
    cell: ({ row }) => (
      <CeldaTitulo
        titulo={row.original.titulo}
        detalle={`${row.original.tipo} · ${row.original.duracion}`}
        sinImagen={<HugeiconsIcon icon={ICONO[row.original.tipo]} size={18} aria-hidden="true" />}
      />
    ),
  },
  {
    accessorKey: 'visibilidad',
    header: 'Visibilidad',
    size: 160,
    cell: ({ row }) => (
      <Badge variant={COLOR[row.original.visibilidad]} size="sm">
        {row.original.visibilidad}
      </Badge>
    ),
  },
  {
    accessorKey: 'inscritos',
    header: 'Inscritos',
    size: 140,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.inscritos ? 'default' : 'muted'} className="tabular-nums">
        {row.original.inscritos ? row.original.inscritos.toLocaleString('es-CO') : '—'}
      </Text>
    ),
  },
]

export function ContenidosConPortada() {
  const [vista, setVista] = useState<VistaLista>('cuadricula')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return q ? CONTENIDOS.filter((contenido) => contenido.titulo.toLowerCase().includes(q)) : CONTENIDOS
  }, [busqueda])
  const paginacion = { pagina, setPagina, porPagina, setPorPagina, total: visibles.length }
  const limpiar = () => setBusqueda('')

  const config: DataGridListConfig<Contenido> = {
    columns: COLUMNAS,
    search: { placeholder: 'Buscar contenidos', onSearch: setBusqueda },
    emptyState: { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} onLimpiar={limpiar} /> },
  }

  return (
    <Demo
      title="Contenidos con portada: tabla o tarjetas"
      description="La misma lista se puede ver como tabla (TablaDatos con CeldaTitulo y miniatura) o como tarjetas (TarjetaContenido en MarcoCuadricula), con el cambio Tabla/Cuadrícula arriba a la derecha. En el portal del colaborador y en LMS Creator arranca en Cuadrícula. Cada vista lleva su buscador y se vacía al cambiar de una a otra."
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <CambioDeVista
            vista={vista}
            onCambio={(siguiente) => {
              setVista(siguiente)
              setBusqueda('')
              setPagina(1)
            }}
          />
        </div>
        {vista === 'tabla' ? (
          <TablaDatos config={config} data={visibles} paginacion={paginacion} nombre="contenidos" singular="contenido" id="contenidos-portada" />
        ) : (
          <MarcoCuadricula busqueda={busqueda} onBuscar={setBusqueda} marcador="Buscar contenidos" paginacion={paginacion} nombre="contenidos" singular="contenido" id="contenidos-portada">
            {visibles.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibles.map((contenido) => (
                  <TarjetaContenido
                    key={contenido.id}
                    titulo={contenido.titulo}
                    tipo={contenido.tipo}
                    visibilidad={contenido.visibilidad}
                    visibilidadColor={COLOR[contenido.visibilidad]}
                    duracion={contenido.duracion}
                  />
                ))}
              </div>
            ) : (
              <SinResultados busqueda={busqueda} onLimpiar={limpiar} />
            )}
          </MarcoCuadricula>
        )}
      </div>
    </Demo>
  )
}

// El vacío por defecto de TablaDatos (13-oct): sin `emptyState` propio, la tabla trae la ilustración glass de buscar y
// «No hay … para mostrar», sin botón (no sabe cómo limpiar). Lo mejor sigue siendo pasar SinResultados con la búsqueda y
// «Limpiar», como Diagnóstico.
export function TablaConVacioPorDefecto() {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const config: DataGridListConfig<Contenido> = { columns: COLUMNAS }
  return (
    <Demo
      title="El vacío que trae la tabla"
      description="Si no le pasas un vacío propio, TablaDatos muestra el del sistema (ilustración glass y «No hay … para mostrar», sin botón), no el de línea de la librería. Para una búsqueda o un filtro que lo deja todo fuera, pásale SinResultados con «Limpiar»; para una lista que todavía no tiene nada, PrimeraVez."
    >
      <TablaDatos
        config={config}
        data={[]}
        paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: 0 }}
        nombre="contenidos"
        singular="contenido"
        id="contenidos-vacia"
      />
    </Demo>
  )
}
