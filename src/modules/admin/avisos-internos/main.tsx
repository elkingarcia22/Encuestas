import { createContext, useContext, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Archive01Icon,
  Edit02Icon,
  HelpCircleIcon,
  MoreHorizontalIcon,
  PlusSignIcon,
  WorkHistoryIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Item,
  ItemContent,
  ItemTitle,
  Text,
  toast,
} from '@ubits/flux-ui'
import type { DataGridListConfig } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { pagina, resolver } from '@/modules/design-system/templates/admin-compartido/lista'
import { MetricasDestacadas, type Metrica } from '@/shared/components/MetricasDestacadas'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ESTADOS, type Aviso } from './components/datos'
import { archivarAviso, useAvisos } from './components/estado'
import { PrimeraVez, demoVacia } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { EstadoBadge, GuiaDialog, HistorialSheet, Miniatura } from './components/piezas'

// Herramientas › Avisos internos (en la plataforma actual, «Comunicaciones» en /admin-hr/comunications).
// Cifras del mes, tabla con filtro por estado y búsqueda por título, menú por fila (Editar, Ver
// historial, Archivar) y la guía de uso que la plataforma muestra la primera vez.

// ── Menú de cada fila (sus opciones dependen del estado, por eso va en una columna propia) ──

type AccionFila = 'editar' | 'historial' | 'archivar'
const AccionContexto = createContext<(accion: AccionFila, aviso: Aviso) => void>(() => undefined)

function MenuDeFila({ aviso }: { aviso: Aviso }) {
  const ejecutar = useContext(AccionContexto)
  const archivable = aviso.estado === 'Publicado' || aviso.estado === 'Programado'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${aviso.titulo}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => ejecutar('editar', aviso)} disabled={aviso.estado === 'Archivado'}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => ejecutar('historial', aviso)}>
            <HugeiconsIcon icon={WorkHistoryIcon} aria-hidden="true" />
            Ver historial
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => ejecutar('archivar', aviso)} disabled={!archivable}>
          <HugeiconsIcon icon={Archive01Icon} aria-hidden="true" />
          Archivar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Columnas y filtros (fuera del componente para que el filtro no se cierre al marcar) ──

const numero = (valor: number) => valor.toLocaleString('es-CO')

// Las columnas que se pueden mostrar u ocultar desde el botón de configuración. «Contenido» y «Acciones» no entran:
// la miniatura y el menú de la fila van siempre.
// La tabla es `TablaDatos`, la del `DataGridList` de la librería: la única del sistema desde el 5-oct (MarcoTabla se
// retiró). Aquí se pasó el 2-oct (Dave).
const numeroCelda = (valor: number) => (
  <Text as="span" size="sm" className="block tabular-nums">
    {numero(valor)}
  </Text>
)

const COLUMNAS: DataGridListConfig<Aviso>['columns'] = [
  {
    id: 'miniatura',
    header: 'Contenido',
    size: 90,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Miniatura multimedia={row.original.multimedia} icono={row.original.icono} titulo={row.original.titulo} />,
  },
  {
    accessorKey: 'titulo',
    header: 'Título del aviso',
    size: 300,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" weight="medium" className="line-clamp-2 whitespace-normal">
        {row.original.titulo}
      </Text>
    ),
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha de publicación',
    size: 170,
    ...SIN_ARRASTRE,
    // Un borrador no tiene fecha de publicación: no se inventa una, se dice que no está publicado.
    cell: ({ row }) =>
      row.original.estado === 'Borrador' ? (
        <Text as="span" variant="muted" size="sm">
          Sin publicar
        </Text>
      ) : (
        <Text as="span" size="sm">
          {fechaCorta(row.original.fecha)}
        </Text>
      ),
  },
  { accessorKey: 'autor', header: 'Autor', size: 200, ...SIN_ARRASTRE, cell: ({ row }) => <Persona nombre={row.original.autor} /> },
  { accessorKey: 'estado', header: 'Estado', size: 140, ...SIN_ARRASTRE, cell: ({ row }) => <EstadoBadge estado={row.original.estado} /> },
  { accessorKey: 'vistas', header: 'Visualizaciones', size: 150, ...SIN_ARRASTRE, cell: ({ row }) => numeroCelda(row.original.vistas) },
  { accessorKey: 'likes', header: 'Likes', size: 110, ...SIN_ARRASTRE, cell: ({ row }) => numeroCelda(row.original.likes) },
  { accessorKey: 'clics', header: 'Clicks', size: 110, ...SIN_ARRASTRE, cell: ({ row }) => numeroCelda(row.original.clics) },
  {
    id: 'acciones',
    header: 'Acciones',
    size: 96,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    // Con las nueve columnas la tabla es más ancha que el marco de 1.140 px (solo los encabezados con su orden, filtro y
    // asidero ocupan ~1.400 px), y la RN-02 pide que todas se puedan ocultar, no que falten. El menú de la fila va
    // siempre a la vista: se queda pegado a la derecha mientras el resto se desplaza. Se fuerza con «!» porque la
    // librería deja el estilo en línea; el borde izquierdo es el mismo de sus columnas fijadas.
    meta: {
      headerClassName: 'sticky! right-0 z-10 bg-card shadow-[inset_1px_0_0_0_var(--border)]',
      cellClassName: 'sticky! right-0 z-10 bg-card shadow-[inset_1px_0_0_0_var(--border)]',
    },
    cell: ({ row }) => <MenuDeFila aviso={row.original} />,
  },
]

// Todos los filtros van en su columna (decisión 1 de la auditoría, 5-oct): autor y estado eligen varios, la fecha de
// publicación un rango. La ventana «Filtrar» aparte se retiró: eran dos sitios para filtrar lo mismo.
type FiltrosAvisos = { autores: string[]; estados: string[]; desde?: Date; hasta?: Date }
const SIN_FILTROS: FiltrosAvisos = { autores: [], estados: [] }
const contarFiltros = (f: FiltrosAvisos) => [f.autores.length, f.estados.length, f.desde || f.hasta].filter(Boolean).length

// La fecha del aviso se guarda como texto AAAA-MM-DD; el rango de la columna llega en días.
const aIso = (fecha?: Date) =>
  fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : ''


export function Component() {
  const todos = useAvisos()
  // Empresa que estrena el módulo: `?demo=vacio` enseña el estado de primera vez.
  const [consulta] = useSearchParams()
  const sinNada = demoVacia(consulta)
  const avisos = sinNada ? [] : todos
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<FiltrosAvisos>(SIN_FILTROS)
  // Al limpiar desde «Sin resultados», la tabla se vuelve a montar para que sus filtros de columna también se borren.
  const [version, setVersion] = useState(0)
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const navigate = useNavigate()
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [historial, setHistorial] = useState<Aviso | null>(null)
  const [archivando, setArchivando] = useState<Aviso | null>(null)
  // La guía no interrumpe al entrar: se abre desde el botón de ayuda del título.
  const [guia, setGuia] = useState(false)

  const resultado = useMemo(() => {
    const desde = aIso(filtros.desde)
    const hasta = aIso(filtros.hasta)
    const acotados = avisos.filter((aviso) => {
      if (filtros.autores.length && !filtros.autores.includes(aviso.autor)) return false
      if (filtros.estados.length && !filtros.estados.includes(aviso.estado)) return false
      if (desde && aviso.fecha < desde) return false
      if (hasta && aviso.fecha > hasta) return false
      return true
    })
    return resolver(acotados, busqueda, ['titulo'], [], orden)
  }, [avisos, busqueda, filtros, orden])

  // Los autores que de verdad tienen publicaciones, para no ofrecer filtros vacíos.
  const autores = useMemo(() => [...new Set(avisos.map((aviso) => aviso.autor))].sort(), [avisos])
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])

  // Las métricas salen de los avisos reales. La tendencia importa en las dos de abajo: un aviso se publica una vez,
  // pero sus visualizaciones y sus clics dicen si la gente los está leyendo o si dejaron de funcionar.
  const metricas: Metrica[] = useMemo(() => {
    const publicados = avisos.filter((aviso) => aviso.estado === 'Publicado')
    const suma = (lista: Aviso[], campo: 'vistas' | 'clics') => lista.reduce((total, aviso) => total + aviso[campo], 0)

    // Lo publicado y lo visto en cada uno de los últimos seis meses.
    const hoy = new Date()
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    const delMes = (mes: string) => publicados.filter((aviso) => aviso.fecha.startsWith(mes))
    const vistasPorMes = meses.map((mes) => suma(delMes(mes), 'vistas'))
    const clicsPorMes = meses.map((mes) => suma(delMes(mes), 'clics'))
    const publicadosPorMes = meses.map((mes) => delMes(mes).length)
    const vistasTotales = suma(publicados, 'vistas')
    const clicsTotales = suma(publicados, 'clics')

    return [
      {
        id: 'publicados',
        titulo: 'Publicados',
        valor: numero(publicados.length),
        ayuda: 'Avisos visibles hoy en el inicio de los colaboradores. Los archivados salen del inicio pero conservan sus métricas.',
        detalle: 'visibles hoy en el inicio',
        serie: publicadosPorMes,
      },
      {
        id: 'visualizaciones',
        titulo: 'Visualizaciones',
        valor: numero(vistasTotales),
        ayuda: 'Cuántas veces se han visto los avisos publicados. Si cae mes a mes, los avisos están pasando desapercibidos en el inicio.',
        detalle: 'en todos los avisos publicados',
        serie: vistasPorMes,
      },
      {
        id: 'clics',
        titulo: 'Clics en los links',
        valor: numero(clicsTotales),
        ayuda: 'De los que vieron el aviso, cuántos entraron al link. Es lo que dice si el aviso movió a alguien a hacer algo.',
        detalle: `${Math.round((clicsTotales / Math.max(1, vistasTotales)) * 100)} % de las visualizaciones`,
        serie: clicsPorMes,
      },
      {
        id: 'archivados',
        titulo: 'Archivados',
        valor: numero(avisos.filter((aviso) => aviso.estado === 'Archivado').length),
        ayuda: 'Ya no se ven en el inicio, pero siguen en esta lista con sus métricas.',
        detalle: 'conservan sus métricas',
      },
    ]
  }, [avisos])

  const ejecutar = (accion: AccionFila, aviso: Aviso) => {
    if (accion === 'editar') navigate(`/admin/avisos-internos/${aviso.id}/editar`)
    if (accion === 'historial') setHistorial(aviso)
    if (accion === 'archivar') setArchivando(aviso)
  }

  // Crear y editar son una pantalla aparte; desde aquí solo se navega.
  const crear = () => navigate('/admin/avisos-internos/crear')

  const archivar = () => {
    if (!archivando) return
    archivarAviso(archivando.id)
    toast.add({
      type: 'success',
      title: 'Aviso archivado',
      description: `«${archivando.titulo}» ya no se ve en el inicio de los colaboradores.`,
    })
    setArchivando(null)
  }


  return (
    <PageShell>
      <PageHeader
        title="Avisos internos"
        titleAction={
          <BotonIcono aria-label="Ver guía de uso" onClick={() => setGuia(true)}>
            <HugeiconsIcon icon={HelpCircleIcon} aria-hidden="true" />
          </BotonIcono>
        }
        description="Aquí gestionas las comunicaciones internas publicadas a los colaboradores."
        actions={
          <Button onClick={crear}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
            Crear aviso
          </Button>
        }
      />

      <PageContent>
        {sinNada ? null : <MetricasDestacadas metricas={metricas} etiqueta="Resumen de avisos" />}

        <AccionContexto.Provider value={ejecutar}>
          {sinNada ? (
            <Card>
              <PrimeraVez
                icono="glass-add"
                titulo="Todavía no hay avisos"
                descripcion="Cuando publiques el primero aparecerá aquí, con su estado y cuántas personas lo vieron."
                accion={{ texto: 'Crear aviso', icono: PlusSignIcon, onClick: crear }}
              />
            </Card>
          ) : (
          <TablaDatos
            key={version}
            id="avisos"
            nombre="avisos"
            singular="aviso"
            data={visibles}
            paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
            config={{
              columns: COLUMNAS,
              // Todos los filtros en su columna, también la fecha de publicación (antes estaba en la ventana «Filtrar»).
              columnFilters: [
                { id: 'fecha', label: 'Fecha de publicación', type: 'date', mode: 'range' },
                { id: 'autor', label: 'Autor', type: 'select', multiple: true, options: autores.map((a) => ({ label: a, value: a })) },
                { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS.map((e) => ({ label: e, value: e })) },
              ],
              onColumnFiltersChange: (nuevos) => {
                const valor = (id: string) => nuevos.find((f) => f.id === id)?.value
                const lista = (id: string) => {
                  const v = valor(id)
                  return Array.isArray(v) ? v.map(String) : []
                }
                const rango = valor('fecha')
                const [desde, hasta] = Array.isArray(rango) ? (rango as (Date | string | undefined)[]) : []
                setFiltros({
                  autores: lista('autor'),
                  estados: lista('estado'),
                  desde: desde ? new Date(desde) : undefined,
                  hasta: hasta ? new Date(hasta) : undefined,
                })
                setActual(1)
              },
              sort: { onSortChange: setOrden },
              search: {
                placeholder: 'Buscar avisos',
                onSearch: (texto) => {
                  setBusqueda(texto)
                  setActual(1)
                },
              },
              emptyState: {
                type: 'no-results',
                customComponent: (
                  <SinResultados
                    busqueda={busqueda}
                    filtrosActivos={contarFiltros(filtros)}
                    onLimpiar={() => {
                      setBusqueda('')
                      setFiltros(SIN_FILTROS)
                      setActual(1)
                      setVersion((v) => v + 1)
                    }}
                  />
                ),
              },
              // Sin título dentro del marco: el de la página ya dice qué es (cabecera como Vacantes).
              frame: { toolbar: 'header' },
              labels: {
                resultCount: () => `${numero(resultado.length)} de ${numero(avisos.length)} ${plural(avisos.length, 'aviso', 'avisos')}`,
              },
              globalTotal: resultado.length,
            }}
          />
          )}
        </AccionContexto.Provider>
      </PageContent>

      <HistorialSheet aviso={historial} onCerrar={() => setHistorial(null)} />

      {/* Cuál es el aviso va en el cuerpo, no en la bajada: título y descripción se quedan fijos (Carlos, 1-oct). */}
      <DialogoConfirmar
        abierto={archivando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setArchivando(null))}
        icono={Archive01Icon}
        titulo="¿Archivar este aviso?"
        descripcion="Dejará de verse en el inicio de los colaboradores. Sus visualizaciones, likes y clicks se conservan y lo sigues viendo en esta lista."
        accion="Archivar aviso"
        onConfirmar={archivar}
      >
        {archivando ? (
          <Item variant="muted" size="sm">
            <ItemContent>
              <ItemTitle className="whitespace-normal">{archivando.titulo}</ItemTitle>
            </ItemContent>
          </Item>
        ) : null}
      </DialogoConfirmar>

      <GuiaDialog abierta={guia} onAbiertaChange={setGuia} />
    </PageShell>
  )
}

Component.displayName = 'AdminAvisosInternosPage'
