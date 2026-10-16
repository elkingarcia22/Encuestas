import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button, Progress, Text, Tooltip, TooltipContent, TooltipTrigger, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PageSection } from '@/shared/components/PageShell'
import { plural } from '@/modules/design-system/patrones/formato'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import type { VacanteUI } from '../propuestas/datos'
import { DIAS_ESTANCADA } from '../vacantes/components/datos'
import { ETAPAS_EMBUDO, nombreCorto, type FilaVacante, type Resumen } from './datos'

// Las vacantes que más gente movieron en el periodo: el «Top vacantes» de hoy (nombre, un número y una barra igual en
// todas las filas) hecho tabla, con lo que se compara entre vacantes. Solo las cinco primeras: la lista completa vive en
// Vacantes y no se repite aquí (1 oct, Nicolás: «no repetir lo que vive en otra vista»); el botón lleva allá.
// Las columnas son las de «Tus vacantes» en el inicio de Vacantes, con el embudo en miniatura de la lista: así la misma
// vacante se lee igual en las dos pantallas. Sin avatares de iniciales (5 oct).
// Es la tabla del sistema (`TablaDatos`; decisión 4a de Cristian, 9 oct), en su sección con título: son cinco filas ya
// ordenadas por quien más gente movió, así que no se reordena ni se pagina.

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

// La tabla lee cada fila por su `id`.
type Fila = FilaVacante & { id: string }

// El «w-0 min-w-full» de cada celda: la tabla mide cada columna por lo que lleva y, sin esto, un texto largo la ensancha en
// vez de cortarse con «…».
const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  {
    accessorKey: 'vacante',
    header: 'Vacante',
    size: 280,
    enableSorting: false,
    cell: ({ row }) => {
      const { vacante } = row.original
      return (
        <div className="w-0 min-w-full" title={vacante.titulo}>
          <CeldaTitulo titulo={vacante.titulo} detalle={`${vacante.area} · ${vacante.sede.split(' · ')[0]}`} to={RUTA_VACANTE(vacante.id)} />
        </div>
      )
    },
  },
  {
    id: 'estado',
    accessorFn: (fila) => estadoDe(fila.vacante),
    header: 'Estado',
    size: 140,
    enableSorting: false,
    cell: ({ row }) => {
      const estado = estadoDe(row.original.vacante)
      return <Badge variant={ESTADO_INSIGNIA[estado]}>{estado}</Badge>
    },
  },
  {
    accessorKey: 'candidatos',
    header: 'Candidatos',
    size: 130,
    enableSorting: false,
    cell: ({ row }) => {
      const { vacante, candidatos } = row.original
      return (
        <span className="flex w-0 min-w-full flex-col gap-0.5">
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
    },
  },
  {
    id: 'avance',
    accessorFn: (fila) => fila.llegaron.join(','),
    header: 'Cómo avanza',
    size: 260,
    enableSorting: false,
    cell: ({ row }) => {
      const { vacante, candidatos, llegaron, cierre } = row.original
      return <Avance llegaron={llegaron} candidatos={candidatos} vacante={vacante} contrato={cierre?.contratados ? cierre.como : null} />
    },
  },
  {
    id: 'dias',
    accessorFn: (fila) => fila.vacante.diasAbierta,
    header: 'Días abierta',
    size: 130,
    enableSorting: false,
    cell: ({ row }) => {
      const { vacante } = row.original
      return vacante.estado === 'Borrador' ? (
        <Text as="span" variant="muted" size="sm">
          Sin publicar
        </Text>
      ) : (
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
    },
  },
  {
    id: 'reclutador',
    accessorFn: (fila) => fila.vacante.reclutador.nombre,
    header: 'Reclutador',
    size: 140,
    enableSorting: false,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="block w-0 min-w-full truncate" title={row.original.vacante.reclutador.nombre}>
        {nombreCorto(row.original.vacante.reclutador.nombre)}
      </Text>
    ),
  },
]

export function TablaDashboard({ resumen, cargando }: { resumen: Resumen; cargando: boolean }) {
  const filas = resumen.conGente.slice(0, CUANTAS).map<Fila>((fila) => ({ ...fila, id: fila.vacante.id }))
  if (!cargando && !filas.length) return null

  return (
    <PageSection
      title="Las vacantes con más candidatos"
      description={`${filas.length === 1 ? 'La que más gente recibió' : `Las ${filas.length} que más gente recibieron`} en los últimos ${resumen.dias} días.`}
      actions={
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to={RUTA_VACANTES} />}>
          Ver todas en Vacantes
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
        </Button>
      }
    >
      <TablaDatos
        id="vacantes-con-mas-candidatos"
        nombre="vacantes"
        singular="vacante"
        config={{ columns: COLUMNAS }}
        data={filas}
        isLoading={cargando}
        paginacion={{ pagina: 1, setPagina: () => {}, porPagina: CUANTAS, setPorPagina: () => {}, total: filas.length }}
        pieSoloSiHaceFalta
      />
    </PageSection>
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
          <span className="flex w-0 min-w-full flex-col gap-1.5">
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
