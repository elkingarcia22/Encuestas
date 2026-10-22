import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Text,
  TooltipProvider,
  type BulkAction,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Persona as CeldaPersona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { channeledRoster } from '../../modelo/descargas/canalizados'
import { fileStamp, slugify } from '../../modelo/descargas/libro'
import type { Respondent } from '../../modelo/questionResponses'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import type { SurveyResults } from '../../modelo/surveyResults'
import { imprimir } from '../descargas/imprimir'
import { CartasCanalizacion } from '../descargas/reportes-nom035'
import { numero } from './escala'
import { TarjetaResumen } from './tarjeta-resumen'

// NOM 035 · Canalización (Guía I, acontecimientos traumáticos severos): quién reportó un
// acontecimiento y presenta síntomas persistentes. La norma obliga a canalizar a esas personas a
// atención médica, así que la pregunta de esta pestaña es una sola: ¿a quién hay que canalizar?

const POR_CANALIZAR = 'Por canalizar'
const SIN_INDICADORES = 'Sin indicadores'

type Persona = Respondent & { canalizar: boolean; afirmativas: number; resultado: string }
type Filtro = 'area' | 'leader' | 'resultado'

function ordenar(filas: Persona[], orden?: string) {
  if (!orden) return filas
  const campo = orden.replace('-', '') as 'name' | 'area' | 'leader' | 'resultado'
  const signo = orden.startsWith('-') ? -1 : 1
  return [...filas].sort((a, b) => String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'es') * signo)
}

const cartas = (cuantas: number) => `${cuantas} ${cuantas === 1 ? 'carta' : 'cartas'} de canalización`

// Las cartas se bajan de verdad: es el mismo documento que Descargar › Cartas de canalización, solo con las personas
// elegidas, y se guarda con «Guardar como PDF» del diálogo de impresión (como todos los PDF de Resultados).
function descargarCartas(borrador: SurveyDraft, resultados: SurveyResults, personas: Persona[]) {
  const canalizadas = personas.filter((persona) => persona.canalizar)
  if (canalizadas.length === 0) return
  const titulo = `cartas-canalizacion-nom035-${slugify(borrador.name)}-${fileStamp()}`
  const listo = imprimir(<CartasCanalizacion borrador={borrador} resultados={resultados} pedido={{ responsible: null }} soloIds={canalizadas.map((persona) => persona.id)} />, titulo)
  if (listo) notify(canalizadas.length === 1 ? 'Carta lista para guardar' : `${cartas(canalizadas.length)} listas para guardar`, 'Elige «Guardar como PDF» en el diálogo de impresión.', 'success')
  else notify('No pudimos preparar las cartas', 'Vuelve a intentarlo o descárgalas desde Descargar › Cartas de canalización.', 'error')
}

// El menú de cada fila, como en Data grid del design system. La carta solo existe para quien hay que canalizar.
function MenuFila({ persona, onCarta }: { persona: Persona; onCarta: (persona: Persona) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${persona.name}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={!persona.canalizar} onClick={() => onCarta(persona)}>
            <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
            Descargar carta de canalización
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// La tabla es la del sistema (TablaDatos, auditoría 5-oct, decisiones 1 y 2): buscador, orden y filtro en cada columna
// y el pie en español de todo el admin. Las columnas van fuera del componente: si no, el filtro se cierra al marcar.
const columnas = (onCarta: (persona: Persona) => void): DataGridListConfig<Persona>['columns'] => [
  { accessorKey: 'name', header: 'Participante', size: 240, cell: ({ row }) => <CeldaPersona nombre={row.original.name} /> },
  { accessorKey: 'area', header: 'Área', size: 160, cell: ({ row }) => <Text as="span" size="sm">{row.original.area ?? '—'}</Text> },
  { accessorKey: 'leader', header: 'Líder', size: 170, cell: ({ row }) => <Text as="span" size="sm">{row.original.leader ?? '—'}</Text> },
  {
    accessorKey: 'resultado',
    header: 'Resultado',
    size: 150,
    cell: ({ row }) => (
      <Badge variant={row.original.canalizar ? 'destructive-outline' : 'success-light'} size="sm">
        {row.original.resultado}
      </Badge>
    ),
  },
  { id: 'acciones', header: 'Acciones', size: 100, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuFila persona={row.original} onCarta={onCarta} /> },
]

const SIN_FILTROS: Record<Filtro, string[]> = { area: [], leader: [], resultado: [] }

export function Canalizacion({ borrador, resultados }: { borrador: SurveyDraft; resultados: SurveyResults }) {
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>('resultado')
  const [filtros, setFiltros] = useState<Record<Filtro, string[]>>(SIN_FILTROS)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [marcadas, setMarcadas] = useState<Persona[]>([])
  // Cambia para montar la tabla de nuevo al limpiar: así se vacían también su buscador y sus filtros.
  const [version, setVersion] = useState(0)

  // La misma lista que usan el Excel y las cartas de canalización: pantalla y archivo no pueden discrepar.
  const personas = useMemo<Persona[]>(
    () => channeledRoster(borrador, resultados).map((persona) => ({ ...persona, afirmativas: persona.affirmatives, canalizar: persona.channeled, resultado: persona.channeled ? POR_CANALIZAR : SIN_INDICADORES })),
    [borrador, resultados],
  )

  // Las columnas se arman una vez por encuesta (no en cada pintado): si no, el filtro de la columna se cierra al marcar.
  const columnasTabla = useMemo(() => columnas((persona) => descargarCartas(borrador, resultados, [persona])), [borrador, resultados])

  const casos = personas.filter((persona) => persona.canalizar)
  const { invited, completed } = resultados.participation
  const areasAfectadas = new Set(casos.map((persona) => persona.area).filter(Boolean)).size
  const porArea = Object.entries(casos.reduce<Record<string, number>>((cuenta, persona) => ({ ...cuenta, [persona.area ?? 'Sin área']: (cuenta[persona.area ?? 'Sin área'] ?? 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // El filtro de cada columna, con las opciones que hay en la lista. Se recalcula solo si cambia la lista: si no, el
  // filtro se cerraría al marcar.
  const filtrosColumna = useMemo<DataGridListConfig<Persona>['columnFilters']>(() => {
    const valores = (campo: 'area' | 'leader') =>
      [...new Set(personas.map((persona) => persona[campo]).filter((valor): valor is string => Boolean(valor)))].sort((a, b) => a.localeCompare(b, 'es')).map((valor) => ({ label: valor, value: valor }))
    return [
      { id: 'area', label: 'Área', type: 'select', multiple: true, searchable: true, options: valores('area') },
      { id: 'leader', label: 'Líder', type: 'select', multiple: true, searchable: true, options: valores('leader') },
      { id: 'resultado', label: 'Resultado', type: 'select', multiple: true, options: [POR_CANALIZAR, SIN_INDICADORES].map((valor) => ({ label: valor, value: valor })) },
    ]
  }, [personas])

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return ordenar(
      personas.filter(
        (persona) =>
          (!q || persona.name.toLowerCase().includes(q)) &&
          (filtros.area.length === 0 || filtros.area.includes(persona.area ?? '')) &&
          (filtros.leader.length === 0 || filtros.leader.includes(persona.leader ?? '')) &&
          (filtros.resultado.length === 0 || filtros.resultado.includes(persona.resultado)),
      ),
      orden,
    )
  }, [personas, busqueda, filtros, orden])
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])
  const filtrosActivos = Object.values(filtros).filter((valores) => valores.length > 0).length

  const cartasMarcadas = marcadas.filter((persona) => persona.canalizar).length
  // Con filas marcadas, su acción va en la cabecera junto al buscador, como en Data grid del design system.
  const accionesSeleccion: BulkAction<Persona>[] = [
    {
      id: 'cartas',
      label: cartasMarcadas === 0 ? 'Ninguna de las personas marcadas está por canalizar' : `Descargar ${cartas(cartasMarcadas)}`,
      icon: <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />,
      visibility: 'always',
      disabled: cartasMarcadas === 0,
      onClick: () => descargarCartas(borrador, resultados, marcadas),
    },
  ]

  const limpiar = () => {
    setBusqueda('')
    setFiltros(SIN_FILTROS)
    setActual(1)
    setVersion((previa) => previa + 1)
  }

  const config: DataGridListConfig<Persona> = {
    columns: columnasTabla,
    columnFilters: filtrosColumna,
    onColumnFiltersChange: (nuevos) => {
      const valores = (id: Filtro) => {
        const valor = nuevos.find((filtro) => filtro.id === id)?.value
        return Array.isArray(valor) ? valor.map(String) : []
      }
      setFiltros({ area: valores('area'), leader: valores('leader'), resultado: valores('resultado') })
      setActual(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setActual(1)
      },
    },
    search: {
      placeholder: 'Buscar por nombre',
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    selection: { onSelectionChange: setMarcadas },
    bulkActions: accionesSeleccion,
    // Los vacíos del sistema, con ilustración (decisión 14): «Sin resultados» con lo buscado y el botón para limpiar.
    emptyState:
      busqueda.trim() || filtrosActivos > 0
        ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} /> }
        : {
            type: 'empty',
            customComponent: <PrimeraVez icono="glass-profile" titulo="Todavía no hay personas que revisar" descripcion="Cuando alguien responda la Guía I, aquí verás si hay que canalizarlo a atención médica." />,
          },
  }

  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Casos por canalizar"
        ayuda="Personas que reportaron un acontecimiento traumático severo y presentan síntomas persistentes. La norma obliga a canalizarlas a atención médica: personas con indicadores ÷ personas que respondieron."
        cifra={String(casos.length)}
        lectura={casos.length === 0 ? 'Sin casos' : casos.length === 1 ? '1 caso' : `${casos.length} casos`}
        pie={`${areasAfectadas} ${areasAfectadas === 1 ? 'área afectada' : 'áreas afectadas'}`}
        tituloAnillos="Estado de los invitados"
        totalAnillos={`${numero(invited)} en total`}
        anillos={[
          {
            id: 'canalizar',
            etiqueta: POR_CANALIZAR,
            porcentaje: invited === 0 ? 0 : Math.round((casos.length / invited) * 100),
            color: 'var(--destructive)',
            cantidad: numero(casos.length),
          },
          {
            id: 'sin',
            etiqueta: SIN_INDICADORES,
            porcentaje: invited === 0 ? 0 : Math.round(((completed - casos.length) / invited) * 100),
            color: 'var(--success)',
            cantidad: numero(Math.max(0, completed - casos.length)),
          },
          { id: 'faltan', etiqueta: 'Sin responder', porcentaje: invited === 0 ? 0 : Math.round(((invited - completed) / invited) * 100), color: 'var(--muted-foreground)', cantidad: numero(Math.max(0, invited - completed)) },
        ]}
        tituloTop="Área con más casos"
        sinTop="Ningún área con casos"
        top={porArea.map(([area, cuenta]) => ({ id: area, etiqueta: area, valor: casos.length === 0 ? 0 : (cuenta / casos.length) * 100, texto: cuenta === 1 ? '1 caso' : `${cuenta} casos` }))}
      />

      {/* Los globos de las acciones de lo marcado salen a los 200 ms, como los del resto del playground. */}
      <TooltipProvider delay={200}>
        <TablaDatos
          key={version}
          config={config}
          data={visibles}
          paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
          nombre="participantes"
          singular="participante"
          id="canalizacion"
        />
      </TooltipProvider>
    </div>
  )
}
