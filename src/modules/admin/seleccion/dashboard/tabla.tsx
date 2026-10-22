import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Progress, Text, Tooltip, TooltipContent, TooltipTrigger, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { plural } from '@/modules/design-system/patrones/formato'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import type { VacanteUI } from '../propuestas/datos'
import { DIAS_ESTANCADA } from '../vacantes/components/datos'
import { ETAPAS_EMBUDO, nombreCorto, type FilaVacante, type Resumen } from './datos'

// Las vacantes que más gente movieron en el periodo: el «Top vacantes» de hoy (nombre, un número y una barra igual en
// todas las filas) hecho tabla, con lo que se compara entre vacantes. Solo las cinco primeras: la lista completa vive en
// Vacantes y no se repite aquí (1 oct, Nicolás: «no repetir lo que vive en otra vista»); el botón lleva allá.
// Las columnas son las de «Tus vacantes» en el inicio de Vacantes, con el embudo en miniatura de la lista: así la misma
// vacante se lee igual en las dos pantallas. Sin avatares de iniciales (5 oct).
// 16 oct: en la tabla del sistema (TablaDatos) con su título en lo gris, como Vacantes. La trae Orbit en «Habla con tus
// datos» cuando se le pregunta por las vacantes con más gente o se le pide un tablero con ellas.

const RUTA_VACANTES = '/admin/seleccion/exploraciones/uno'
const RUTA_VACANTE = (id: string) => `${RUTA_VACANTES}/${id}`
const CUANTAS = 5

type Estado = 'Publicada' | 'Oculta del portal' | 'Borrador' | 'Cerrada'
const ESTADO_INSIGNIA: Record<Estado, 'success-light' | 'warning-light' | 'secondary' | 'outline'> = {
  Publicada: 'success-light',
  'Oculta del portal': 'warning-light',
  Borrador: 'secondary',
  Cerrada: 'outline',
}
const estadoDe = (vacante: VacanteUI): Estado => (vacante.estado === 'Publicada' && vacante.oculta ? 'Oculta del portal' : vacante.estado)

// `id`: lo que la tabla usa para reconocer cada fila.
type Fila = FilaVacante & { id: string }

const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  {
    id: 'vacante',
    accessorFn: (fila) => fila.vacante.titulo,
    header: 'Vacante',
    size: 260,
    cell: ({ row }) => (
      <CeldaTitulo
        titulo={row.original.vacante.titulo}
        detalle={`${row.original.vacante.area} · ${row.original.vacante.sede.split(' · ')[0]}`}
        to={RUTA_VACANTE(row.original.vacante.id)}
      />
    ),
  },
  {
    id: 'estado',
    accessorFn: (fila) => estadoDe(fila.vacante),
    header: 'Estado',
    size: 150,
    cell: ({ row }) => {
      const estado = estadoDe(row.original.vacante)
      return <Badge variant={ESTADO_INSIGNIA[estado]}>{estado}</Badge>
    },
  },
  { accessorKey: 'candidatos', header: 'Candidatos', size: 130, cell: ({ row }) => <CeldaCandidatos fila={row.original} /> },
  {
    id: 'avance',
    header: 'Cómo avanza',
    size: 240,
    enableSorting: false,
    cell: ({ row }) => {
      const { llegaron, candidatos, vacante, cierre } = row.original
      return <Avance llegaron={llegaron} candidatos={candidatos} vacante={vacante} contrato={cierre?.contratados ? cierre.como : null} />
    },
  },
  { id: 'dias', accessorFn: (fila) => fila.vacante.diasAbierta, header: 'Días abierta', size: 130, cell: ({ row }) => <CeldaDias vacante={row.original.vacante} /> },
  {
    id: 'reclutador',
    accessorFn: (fila) => fila.vacante.reclutador.nombre,
    header: 'Reclutador',
    size: 140,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="block w-0 min-w-full truncate">
        {nombreCorto(row.original.vacante.reclutador.nombre)}
      </Text>
    ),
  },
]

// En el chat de Orbit solo caben vacante, candidatos y el avance del proceso (630 px); estado, días y reclutador viven
// en Vacantes, adonde lleva «Ver todas en Vacantes».
const EN_EL_CHAT = new Set(['vacante', 'candidatos', 'avance'])
const COLUMNAS_CHAT = COLUMNAS.filter((columna) => EN_EL_CHAT.has(String(columna.id ?? ('accessorKey' in columna ? columna.accessorKey : ''))))

// `id`: cada respuesta de la conversación lleva la suya, para que no se repita en la página.
export function TablaDashboard({
  resumen,
  cargando,
  id = 'vacantes-con-mas-candidatos',
  enElChat = false,
}: {
  resumen: Resumen
  cargando: boolean
  id?: string
  enElChat?: boolean
}) {
  const navigate = useNavigate()
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const filas = useMemo<Fila[]>(() => {
    const primeras = resumen.conGente.slice(0, CUANTAS).map((fila) => ({ ...fila, id: fila.vacante.id }))
    if (!orden) return primeras
    const alReves = orden.startsWith('-')
    const campo = alReves ? orden.slice(1) : orden
    const valor = (fila: Fila): number | string =>
      campo === 'vacante' ? fila.vacante.titulo : campo === 'estado' ? estadoDe(fila.vacante) : campo === 'dias' ? fila.vacante.diasAbierta : campo === 'reclutador' ? fila.vacante.reclutador.nombre : fila.candidatos
    return [...primeras].sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return alReves ? -r : r
    })
  }, [resumen.conGente, orden])
  if (!cargando && !filas.length) return null

  const config: DataGridListConfig<Fila> = {
    columns: enElChat ? COLUMNAS_CHAT : COLUMNAS,
    sort: { onSortChange: setOrden },
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    frame: {
      description: `${filas.length === 1 ? 'La que más gente recibió' : `Las ${filas.length} que más gente recibieron`} en los últimos ${resumen.dias} días.`,
    },
    // La lista completa vive en Vacantes: el botón lleva allá.
    actions: {
      secondary: [{ id: 'ver-todas', label: 'Ver todas en Vacantes', icon: <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />, onClick: () => navigate(RUTA_VACANTES) }],
    },
  }

  return (
    <TablaDatos
      titulo="Las vacantes con más candidatos"
      config={config}
      data={filas}
      isLoading={cargando}
      paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: filas.length }}
      nombre="vacantes"
      singular="vacante"
      id={id}
      pieSoloSiHaceFalta
    />
  )
}

function CeldaCandidatos({ fila }: { fila: Fila }) {
  const { vacante, candidatos } = fila
  return (
    <span className="flex flex-col gap-0.5">
      <Text as="span" size="sm" className="tabular-nums">
        {candidatos.toLocaleString('es-CO')}
      </Text>
      {/* Debajo, lo que no dice la cifra: el total si el periodo deja gente fuera; si no, cuántos llegaron esta semana. */}
      <Text as="span" variant="muted" size="xs" className="truncate tabular-nums">
        {candidatos < vacante.aplicaciones
          ? `de ${vacante.aplicaciones} en total`
          : vacante.estado === 'Cerrada'
            ? 'Ya no recibe'
            : vacante.ultimaSemana
              ? `${vacante.ultimaSemana} esta semana`
              : 'Nadie esta semana'}
      </Text>
    </span>
  )
}

function CeldaDias({ vacante }: { vacante: VacanteUI }) {
  if (vacante.estado === 'Borrador')
    return (
      <Text as="span" variant="muted" size="sm">
        Sin publicar
      </Text>
    )
  return (
    <span className="flex flex-col items-start gap-0.5">
      <Text as="span" size="sm" variant={vacante.estado === 'Cerrada' ? 'muted' : undefined} className="tabular-nums">
        {vacante.diasAbierta}
      </Text>
      {vacante.estado === 'Cerrada' ? (
        <Text as="span" variant="muted" size="xs">
          Cerrada
        </Text>
      ) : vacante.diasAbierta >= DIAS_ESTANCADA ? (
        <Badge variant="warning-light">Estancada</Badge>
      ) : null}
    </span>
  )
}

// El embudo en miniatura: una barra por etapa, del tamaño de la parte de los que aplicaron que llegó a ella. Bajan de
// izquierda a derecha; si se caen de golpe en una, ahí se queda la gente. Debajo, lo que más importa en una frase.
function Avance({
  llegaron,
  candidatos,
  vacante,
  contrato,
}: {
  llegaron: number[]
  candidatos: number
  vacante: VacanteUI
  contrato: string | null
}) {
  if (!candidatos) {
    return (
      <Text as="span" variant="muted" size="sm">
        {vacante.estado === 'Borrador' ? 'Sin publicar' : 'Nadie aplicó en el periodo'}
      </Text>
    )
  }
  const revision = llegaron[2] ?? 0
  const frase = contrato
    ? contrato.replace(/^se contrató a /, 'Contrató a ').replace(/^se contrataron /, 'Contrató a ')
    : `${revision} ${plural(revision, 'llegó', 'llegaron')} a revisión`
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="flex w-full max-w-56 flex-col gap-1.5">
            <span className="flex items-end gap-1">
              {ETAPAS_EMBUDO.map((etapa, indice) => (
                <Progress
                  key={etapa.id}
                  value={(llegaron[indice] / candidatos) * 100}
                  aria-label={`${llegaron[indice]} llegaron a ${etapa.titulo}`}
                  className="min-w-0 flex-1"
                />
              ))}
            </span>
            <Text as="span" variant="muted" size="xs" className="truncate">
              {frase}
            </Text>
          </span>
        }
      />
      <TooltipContent>{ETAPAS_EMBUDO.map((etapa, indice) => `${llegaron[indice]} ${etapa.titulo}`).join(' · ')}</TooltipContent>
    </Tooltip>
  )
}
