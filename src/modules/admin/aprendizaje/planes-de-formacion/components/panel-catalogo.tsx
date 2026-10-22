import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleIcon,
  BookOpen01Icon,
  GridViewIcon,
  LeftToRightListBulletIcon,
  Search01Icon,
  Target02Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
  Text,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { PiePaginacion, usePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'
import { Badge } from '@/shared/components/Badge'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { plural } from '@/modules/design-system/patrones/formato'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { CATALOGO_COMPETENCIAS, CONTENIDOS, DURACIONES, IDIOMAS, TIPOS_CONTENIDO, competenciaDe, duracionTexto, fichaDe, portadaDe } from './catalogo'
import { MAXIMO_COMPETENCIAS, marcadosEn, type TipoPlan } from './planes-datos'
import { TablaSeleccion, type Filtro } from './tabla-seleccion'

// El catálogo de contenidos y el de competencias: lo que se elige para una asignación o para una persona. Como la
// «Lista de contenidos» de UBITS: tabla con casillas, buscador, filtros por columna y «Seleccionados (N)».
// (UBITS también la muestra en cuadrícula con la portada de cada contenido; aquí no hay portadas, así que va en tabla.)

type FilaContenido = { id: string; titulo: string; autor: string; tipo: string; minutos: number; idioma: string; origen: string }
type FilaCompetencia = { id: string; titulo: string; habilidades: string[]; cuantas: number; imagen?: string }

const FILAS_CONTENIDOS: FilaContenido[] = CONTENIDOS.map((c) => ({
  id: c.titulo,
  titulo: c.titulo,
  autor: c.autor,
  tipo: c.tipo,
  minutos: c.minutos,
  idioma: c.idioma,
  origen: c.origen === 'Universidad corporativa' ? 'De la empresa' : 'UBITS',
}))
const FILAS_COMPETENCIAS: FilaCompetencia[] = CATALOGO_COMPETENCIAS.map((c) => ({ id: c.titulo, titulo: c.titulo, habilidades: c.habilidades, cuantas: c.habilidades.length, imagen: c.imagen }))

const titulo = (principal: string, detalle: string) => (
  <div className="flex min-w-0 flex-col gap-1">
    <Text as="span" size="sm" weight="medium" className="truncate">
      {principal}
    </Text>
    <Text as="span" variant="muted" size="xs" className="truncate">
      {detalle}
    </Text>
  </div>
)
const texto = (valor: string) => (
  <Text as="span" size="sm" className="block truncate">
    {valor}
  </Text>
)
const opciones = (valores: readonly string[]) => valores.map((v) => ({ label: v, value: v }))

const COLUMNAS_CONTENIDOS: DataGridListConfig<FilaContenido>['columns'] = [
  // La fila que nombra algo es CeldaTitulo, con su portada (o el icono de contenido si no la tiene).
  {
    accessorKey: 'titulo',
    header: 'Nombre',
    size: 320,
    ...SIN_ARRASTRE,
    // Con tantas columnas con filtro, la tabla reparte el ancho por lo que ocupa cada cabecera y la celda del nombre
    // (que se corta con «…») se quedaba en 140 px: el ancho mínimo le guarda sitio al nombre.
    cell: ({ row }) => (
      <div className="min-w-48">
        <CeldaTitulo
          titulo={row.original.titulo}
          detalle={row.original.autor}
          imagen={portadaDe(row.original.titulo)}
          sinImagen={<HugeiconsIcon icon={BookOpen01Icon} size={16} aria-hidden="true" />}
        />
      </div>
    ),
  },
  { accessorKey: 'tipo', header: 'Tipo de contenido', size: 150, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.tipo) },
  { accessorKey: 'minutos', header: 'Duración', size: 110, ...SIN_ARRASTRE, cell: ({ row }) => texto(duracionTexto(row.original.minutos)) },
  { accessorKey: 'idioma', header: 'Idioma', size: 110, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.idioma) },
  {
    accessorKey: 'origen',
    header: 'Origen',
    size: 130,
    ...SIN_ARRASTRE,
    cell: ({ row }) =>
      row.original.origen === 'UBITS' ? (
        texto('UBITS')
      ) : (
        <Badge variant="outline" size="xs">
          De la empresa
        </Badge>
      ),
  },
]
const SIN_REORDENAR = { reorderable: false }
const FILTROS_CONTENIDOS: DataGridListConfig<FilaContenido>['columnFilters'] = [
  { id: 'tipo', label: 'Tipo de contenido', type: 'select', multiple: true, options: opciones(TIPOS_CONTENIDO) },
  { id: 'duracion', columnId: 'minutos', label: 'Duración', type: 'select', multiple: true, options: DURACIONES.map((d) => ({ label: d.etiqueta, value: d.id })) },
  { id: 'idioma', label: 'Idioma', type: 'select', multiple: true, options: opciones(IDIOMAS) },
  { id: 'origen', label: 'Origen', type: 'select', multiple: true, options: opciones(['UBITS', 'De la empresa']) },
]
const coincideContenido = (f: FilaContenido, q: string, filtros: Filtro[]) => {
  for (const campo of ['tipo', 'idioma', 'origen'] as const) {
    const elegidos = marcadosEn(filtros, campo)
    if (elegidos.length && !elegidos.includes(f[campo])) return false
  }
  const duraciones = marcadosEn(filtros, 'duracion')
  if (duraciones.length && !DURACIONES.some((d) => duraciones.includes(d.id) && d.cumple(f.minutos))) return false
  return !q || `${f.titulo} ${f.autor}`.toLowerCase().includes(q)
}

// La competencia con su imagen del catálogo y, al lado, sus habilidades: lo que de verdad se va a estudiar.
const COLUMNAS_COMPETENCIAS: DataGridListConfig<FilaCompetencia>['columns'] = [
  {
    accessorKey: 'titulo',
    header: 'Competencia',
    size: 250,
    ...SIN_ARRASTRE,
    // El mismo ancho mínimo que el nombre de los contenidos, para que la competencia no se quede en «…».
    cell: ({ row }) => (
      <div className="min-w-48">
        <CeldaTitulo titulo={row.original.titulo} imagen={row.original.imagen} sinImagen={<HugeiconsIcon icon={Target02Icon} size={16} aria-hidden="true" />} />
      </div>
    ),
  },
  {
    accessorKey: 'cuantas',
    header: 'Habilidades',
    size: 340,
    ...SIN_ARRASTRE,
    // El ancho lo pone la columna: la lista de habilidades se corta con «…» dentro de ella.
    cell: ({ row }) => titulo(`${row.original.cuantas} ${plural(row.original.cuantas, 'habilidad', 'habilidades')}`, row.original.habilidades.join(' · ')),
  },
]
// Se busca por la competencia o por cualquiera de sus habilidades («hablar en público» encuentra Comunicación).
const coincideCompetencia = (f: FilaCompetencia, q: string) => !q || `${f.titulo} ${f.habilidades.join(' ')}`.toLowerCase().includes(q)

// ── Vista «Cuadrícula» (UBITS: «Ver como: Tabla | Cuadrícula») ──
// Cada tarjeta lleva la portada del contenido o la imagen de la competencia; la tarjeta entera se marca al tocarla.


function Cuadricula({ tipo, marcados, onCambio }: { tipo: TipoPlan; marcados: string[]; onCambio: (marcados: string[]) => void }) {
  const competencias = tipo === 'competencias'
  const [busqueda, setBusqueda] = useState('')
  const [soloMarcados, setSoloMarcados] = useState(false)
  const q = busqueda.trim().toLowerCase()
  const filas = competencias
    ? FILAS_COMPETENCIAS.map((f) => ({ id: f.id, buscar: `${f.titulo} ${f.habilidades.join(' ')}` }))
    : FILAS_CONTENIDOS.map((f) => ({ id: f.id, buscar: `${f.titulo} ${f.autor} ${f.tipo}` }))
  const resultado = filas.filter((f) => (!soloMarcados || marcados.includes(f.id)) && (!q || f.buscar.toLowerCase().includes(q)))
  const paginacion = usePaginacion(resultado)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-56 flex-1">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value)
              paginacion.setPagina(1)
            }}
            placeholder={competencias ? 'Buscar competencia o habilidad' : 'Buscar por título, autor o tipo'}
            aria-label={competencias ? 'Buscar competencias' : 'Buscar contenidos'}
          />
        </InputGroup>
        <Toggle
          variant="outline"
          pressed={soloMarcados}
          disabled={!soloMarcados && !marcados.length}
          onPressedChange={(activo) => {
            setSoloMarcados(activo)
            paginacion.setPagina(1)
          }}
        >
          Seleccionados ({marcados.length})
        </Toggle>
      </div>

      {resultado.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginacion.filas.map((c) => {
              const marcado = marcados.includes(c.id)
              const alternar = () => onCambio(marcado ? marcados.filter((m) => m !== c.id) : [...marcados, c.id])
              return (
                // La tarjeta entera se marca al tocarla, como en UBITS. Es la tarjeta de contenido del equipo, con la
                // casilla en el sitio de sus acciones (decisión 17 de la auditoría, 5-oct).
                <TarjetaContenido
                  key={c.id}
                  {...fichaDe(tipo, c.id)}
                  className="h-full"
                  acciones={<Checkbox checked={marcado} onCheckedChange={alternar} aria-label={c.id} />}
                  onClick={alternar}
                />
              )
            })}
          </div>
          <PiePaginacion estado={paginacion} nombre={competencias ? 'competencias' : 'contenidos'} id={`cuadricula-${tipo}`} />
        </>
      ) : (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Search01Icon} size={20} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{soloMarcados ? `Sin ${competencias ? 'competencias elegidas' : 'contenidos elegidos'}` : 'No se encontraron resultados'}</EmptyTitle>
            <EmptyDescription>{soloMarcados ? 'Vuelve a la lista completa y marca los que quieras sumar.' : 'Revisa la ortografía o busca por otro dato.'}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

// RN-03: más de 8 competencias no se pueden guardar. La tabla deja marcar (no sabe de topes); el aviso dice cuántas
// sobran y el botón para seguir queda apagado.
export const pasaElTope = (tipo: TipoPlan, marcados: string[]) => tipo === 'competencias' && marcados.length > MAXIMO_COMPETENCIAS

// El catálogo en sí. Lo usan el paso «Contenido» de Agregar asignación y el panel de «Gestionar contenidos» de una
// persona. Los elegidos viven en quien lo usa.
// Enfoque por habilidades (opcional): de cada competencia elegida, en qué habilidades se estudia. Sin tocar nada, todas.
// Producción aún no lo tiene; David pidió dejar la interfaz lista (30 sep). Lo elegido vive en quien usa el catálogo.
export type Enfoque = Record<string, string[]>

function EnfoqueHabilidades({ marcados, enfoque, onEnfoque }: { marcados: string[]; enfoque: Enfoque; onEnfoque: (enfoque: Enfoque) => void }) {
  const elegidas = marcados.map(competenciaDe).filter((c): c is NonNullable<typeof c> => Boolean(c?.habilidades.length))
  if (!elegidas.length) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text as="div" size="sm" weight="semibold" role="heading" aria-level={3}>
          Enfoque por habilidades (opcional)
        </Text>
        <Text as="p" size="sm" variant="muted">
          Cada competencia agrupa habilidades. Deja todas o quédate solo con las que importan; las personas estudian contenidos de esas.
        </Text>
      </div>
      <ItemGroup className="gap-2">
        {elegidas.map((c) => {
          const enfocadas = enfoque[c.titulo] ?? c.habilidades
          const cambiar = (valor: string[]) => {
            const siguiente = { ...enfoque }
            // Todas o ninguna = sin enfoque: se estudia la competencia completa.
            if (!valor.length || valor.length === c.habilidades.length) delete siguiente[c.titulo]
            else siguiente[c.titulo] = c.habilidades.filter((h) => valor.includes(h))
            onEnfoque(siguiente)
          }
          return (
            <Item key={c.titulo} variant="outline" size="sm" className="items-start">
              <ItemContent className="gap-2">
                <ItemTitle>
                  {c.titulo}
                  <Text as="span" size="xs" variant="muted" weight="normal">
                    {enfocadas.length === c.habilidades.length ? `Todas sus ${c.habilidades.length} habilidades` : `${enfocadas.length} de ${c.habilidades.length} habilidades`}
                  </Text>
                </ItemTitle>
                <ToggleGroup multiple variant="outline" size="sm" value={enfocadas} onValueChange={(valor) => cambiar(valor as string[])} aria-label={`Habilidades de ${c.titulo}`} className="flex-wrap">
                  {c.habilidades.map((h) => (
                    <ToggleGroupItem key={h} value={h}>
                      {h}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </ItemContent>
            </Item>
          )
        })}
      </ItemGroup>
    </section>
  )
}

// El catálogo en sí. Lo usan el paso «Contenido» o «Competencias» de Agregar asignación y el panel de «Gestionar
// contenidos» de una persona. Los elegidos (y el enfoque, en competencias) viven en quien lo usa.
export function ListaCatalogo({
  tipo,
  marcados,
  onCambio,
  enfoque,
  onEnfoque,
}: {
  tipo: TipoPlan
  marcados: string[]
  onCambio: (marcados: string[]) => void
  enfoque?: Enfoque
  onEnfoque?: (enfoque: Enfoque) => void
}) {
  const [vista, setVista] = useState<'tabla' | 'cuadricula'>('tabla')
  const competencias = tipo === 'competencias'
  const sobran = competencias ? marcados.length - MAXIMO_COMPETENCIAS : 0
  return (
    <div className="flex flex-col gap-4">
      {sobran > 0 ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <AlertDescription>
            <p>
              Máximo 8 competencias por asignación. Quita {sobran} {plural(sobran, 'competencia', 'competencias')} para seguir.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <Text as="span" variant="muted" size="sm">
          Ver como:
        </Text>
        <ToggleGroup variant="outline" size="sm" value={[vista]} onValueChange={(valor) => valor[0] && setVista(valor[0] as typeof vista)} aria-label="Ver como">
          <ToggleGroupItem value="tabla">
            <HugeiconsIcon icon={LeftToRightListBulletIcon} aria-hidden="true" />
            Tabla
          </ToggleGroupItem>
          <ToggleGroupItem value="cuadricula">
            <HugeiconsIcon icon={GridViewIcon} aria-hidden="true" />
            Cuadrícula
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {vista === 'cuadricula' ? (
        <Cuadricula tipo={tipo} marcados={marcados} onCambio={onCambio} />
      ) : competencias ? (
        <TablaSeleccion
          id="elegir-competencias"
          titulo="Lista de competencias"
          sustantivo={['competencia', 'competencias']}
          femenino
          filas={FILAS_COMPETENCIAS}
          columnas={COLUMNAS_COMPETENCIAS}
          coincide={coincideCompetencia}
          buscar="Buscar competencia o habilidad"
          marcados={marcados}
          onCambio={onCambio}
        />
      ) : (
        <TablaSeleccion
          id="elegir-contenidos"
          titulo="Lista de contenidos"
          sustantivo={['contenido', 'contenidos']}
          filas={FILAS_CONTENIDOS}
          columnas={COLUMNAS_CONTENIDOS}
          filtros={FILTROS_CONTENIDOS}
          coincide={coincideContenido}
          // Para elegir no hace falta mover columnas: sin el asidero, las cinco caben en el panel.
          layout={SIN_REORDENAR}
          buscar="Buscar por título o autor"
          marcados={marcados}
          onCambio={onCambio}
        />
      )}
      {competencias && enfoque && onEnfoque ? <EnfoqueHabilidades marcados={marcados} enfoque={enfoque} onEnfoque={onEnfoque} /> : null}
    </div>
  )
}

export function PanelCatalogo({
  abierto,
  onAbiertoChange,
  tipo,
  para,
  elegidos,
  onGuardar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  tipo: TipoPlan
  // A quién son los contenidos, para la bajada: «Ana Restrepo · Equipo comercial Q3».
  para: string
  elegidos: string[]
  onGuardar: (items: string[]) => void
}) {
  const competencias = tipo === 'competencias'
  // La selección vive aquí mientras el panel está abierto; «Cancelar» la descarta.
  const [marcados, setMarcados] = useState(elegidos)

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="xl"
      icon={competencias ? Target02Icon : BookOpen01Icon}
      title={competencias ? 'Gestionar competencias' : 'Gestionar contenidos'}
      description={para}
      footerClassName="justify-between!"
      footer={
        <>
          <Text as="span" role="status" variant="muted" size="sm" className="tabular-nums">
            {competencias
              ? `${marcados.length} de ${MAXIMO_COMPETENCIAS} competencias`
              : `${marcados.length} ${plural(marcados.length, 'contenido elegido', 'contenidos elegidos')}`}
          </Text>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onAbiertoChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!marcados.length || pasaElTope(tipo, marcados)} onClick={() => onGuardar(marcados)}>
              Guardar cambios
            </Button>
          </div>
        </>
      }
    >
      <ListaCatalogo tipo={tipo} marcados={marcados} onCambio={setMarcados} />
    </DrawerShell>
  )
}
