import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Clock01Icon, Edit02Icon, Queue02Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  DataGridList,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
  Toggle,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import type { Ajuste } from './main'
import { ConNota } from './demos'
import { Badge } from '@/shared/components/Badge'
import { PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
import { ProcessCenter } from '@/shared/components/ProcessCenter'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { Filas, Marco } from '@/modules/design-system/patrones/ficha'
import { FiltroChip } from '@/modules/design-system/navegacion/filtro-chip'

// Fichas de las piezas del marco y de datos (7-oct): el marco de página, el centro de procesos, la tabla, la persona en
// una celda, la lista de dato y valor, el bloque con título y el chip de filtro. Del lado de la librería, lo que sale
// armándolo directo con flux-ui; del lado de UBITS, la pieza real importada (no una copia). Los datos son de mentira y
// cortos: cada ejemplo cabe en medio panel.

// ── Marco de página ──
function PaginaLibreria() {
  return (
    <ConNota nota="Título, bajada y botones sueltos: cada pantalla decidía el tamaño, el aire y dónde iban los botones.">
      <div className="flex w-full flex-col gap-2 rounded-lg border p-4">
        <Heading as="h3" level={4}>
          Planes de formación
        </Heading>
        <Text as="p" variant="muted" size="sm">
          Asigna rutas de aprendizaje a tus equipos.
        </Text>
        <div>
          <Button size="sm">Crear plan</Button>
        </div>
      </div>
    </ConNota>
  )
}

function PaginaUbits() {
  return (
    <ConNota nota="Es el marco real, en pequeño: un detalle con volver, estado y botones en la fila del título, y una sección. En un flujo de creación no va la flecha: la salida es «Salir de la creación» (regla del 6-oct).">
      <div className="w-full rounded-lg border p-4">
        <PageShell>
          <PageHeader
            titleSize="sm"
            back={{ label: 'Planes de formación', onClick: () => undefined }}
            title="Onboarding comercial"
            badge={
              <Badge variant="success-light" size="sm">
                Activo
              </Badge>
            }
            description="Ruta para quienes entran a Ventas."
            actions={
              <Button variant="outline" size="sm">
                Editar
              </Button>
            }
          />
          <PageSection title="Contenidos" description="3 cursos · 4 h" className="pt-4">
            <Text as="p" variant="muted" size="sm">
              Aquí va el contenido de la sección.
            </Text>
          </PageSection>
        </PageShell>
      </div>
    </ConNota>
  )
}

// ── Centro de procesos ──
function ProcesosLibreria() {
  return (
    <ConNota nota="Item y Progress de la librería, sin marco ni resumen: una lista suelta.">
      <div className="flex w-64 items-center gap-3 rounded-lg border p-3">
        <HugeiconsIcon icon={Queue02Icon} size={18} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="span" size="sm" weight="medium" className="truncate">
            Importación de usuarios
          </Text>
          <Text as="span" variant="muted" size="xs">
            234 de 300 filas · 78 %
          </Text>
        </div>
      </div>
    </ConNota>
  )
}

function ProcesosUbits() {
  const [lleno, setLleno] = useState(false)
  const [vacio, setVacio] = useState(false)
  return (
    <ConNota nota="Ábrelo: sale arriba a la derecha, bajo el encabezado, como en el producto.">
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setLleno(true)}>
          Con procesos
        </Button>
        <Button variant="outline" size="sm" onClick={() => setVacio(true)}>
          Sin procesos
        </Button>
      </div>
      <ProcessCenter open={lleno} onOpenChange={setLleno} ejemplos />
      <ProcessCenter open={vacio} onOpenChange={setVacio} />
    </ConNota>
  )
}

// ── Tabla ──
type FilaDemo = { id: string; nombre: string; area: string; estado: string }

const FILAS_DEMO: FilaDemo[] = [
  { id: '1', nombre: 'Laura Méndez', area: 'Ventas', estado: 'Activa' },
  { id: '2', nombre: 'Julián Rojas', area: 'Operaciones', estado: 'Activa' },
  { id: '3', nombre: 'Sara Gómez', area: 'Talento', estado: 'Inactiva' },
]

const COLUMNAS_DEMO: DataGridListConfig<FilaDemo>['columns'] = [
  { accessorKey: 'nombre', header: 'Nombre', size: 170 },
  { accessorKey: 'area', header: 'Área', size: 130 },
  { accessorKey: 'estado', header: 'Estado', size: 110 },
]

function TablaLibreria() {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  return (
    <ConNota nota="DataGridList con su paginación: «Rows per page» y «1 - 3 of 3», en inglés.">
      <div className="w-full">
        <DataGridList
          data={FILAS_DEMO}
          config={{
            columns: COLUMNAS_DEMO,
            frame: { title: 'Personas' },
            pagination: { total: FILAS_DEMO.length, current: pagina, pageSize: porPagina, onPageChange: setPagina, onPageSizeChange: setPorPagina },
          }}
        />
      </div>
    </ConNota>
  )
}

function TablaUbits() {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  return (
    <ConNota nota="Es la tabla real: conteo arriba, encabezados con asidero y el paginador en español.">
      <div className="w-full">
        <TablaDatos
          data={FILAS_DEMO}
          config={{ columns: COLUMNAS_DEMO, search: { placeholder: 'Buscar persona', onSearch: () => undefined } }}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: FILAS_DEMO.length }}
          nombre="personas"
          singular="persona"
          id="ficha-tabla-datos"
        />
      </div>
    </ConNota>
  )
}

// ── Persona en una celda ──
function PersonaLibreria() {
  return (
    <ConNota nota="Avatar normal y el nombre al lado: cada tabla ponía su tamaño y su segunda línea.">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>LM</AvatarFallback>
        </Avatar>
        <Text as="span">Laura Méndez</Text>
      </div>
    </ConNota>
  )
}

function PersonaUbits() {
  return (
    <ConNota nota="Iniciales en avatar pequeño, nombre y la línea gris del detalle; los dos se cortan con «…».">
      <div className="flex w-56 flex-col gap-3">
        <Persona nombre="Laura Méndez" detalle="Analista de datos · Ventas" />
        <Persona nombre="Julián Rojas" detalle="julian.rojas@meta.com" />
      </div>
    </ConNota>
  )
}

// ── Lista de dato y valor ──
const DATOS_DEMO = [
  { termino: 'Etapa', valor: 'Entrevista' },
  { termino: 'Postuló', valor: 'hace 3 días' },
  { termino: 'Origen', valor: 'LinkedIn' },
]

function FilasLibreria() {
  return (
    <ConNota nota="Con Table: líneas entre filas y el valor pegado al dato.">
      <div className="w-64">
        <Table>
          <TableBody>
            {DATOS_DEMO.map((fila) => (
              <TableRow key={fila.termino}>
                <TableCell>{fila.termino}</TableCell>
                <TableCell>{fila.valor}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ConNota>
  )
}

function FilasUbits() {
  return (
    <ConNota nota="Es texto, no una tabla: el dato en gris y el valor alineado a la derecha.">
      <div className="w-64">
        <Filas filas={DATOS_DEMO} />
      </div>
    </ConNota>
  )
}

// ── Bloque con título ──
function MarcoLibreria() {
  return (
    <ConNota nota="Frame con su cabecera: no tiene sitio para una acción a la derecha ni marca de IA.">
      <Frame className="w-full">
        <FrameHeader>
          <FrameTitle>Resumen del perfil</FrameTitle>
          <FrameDescription>Lo que dice la hoja de vida.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <Text as="p" size="sm">
            Seis años en análisis comercial.
          </Text>
        </FramePanel>
      </Frame>
    </ConNota>
  )
}

function MarcoUbits() {
  return (
    <ConNota nota="Es el bloque real del expediente: acción arriba a la derecha y el orbe porque lo hizo la IA.">
      <Marco
        className="w-full"
        titulo="Resumen del perfil"
        descripcion="Lo que dice la hoja de vida."
        ia
        accion={
          <Button variant="ghost" size="sm">
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" data-icon="inline-start" />
            Editar
          </Button>
        }
      >
        <FramePanel>
          <Filas filas={DATOS_DEMO.slice(0, 2)} />
        </FramePanel>
      </Marco>
    </ConNota>
  )
}

// ── Chip de filtro ──
function FiltroLibreria() {
  const [puesto, setPuesto] = useState(false)
  return (
    <ConNota nota="Toggle de contorno: prendido cambia de fondo, pero no dice cómo se quita.">
      <Toggle variant="outline" pressed={puesto} onPressedChange={setPuesto}>
        <HugeiconsIcon icon={Clock01Icon} size={16} aria-hidden="true" />
        Esperan respuesta
      </Toggle>
    </ConNota>
  )
}

function FiltroUbits() {
  const [espera, setEspera] = useState(true)
  const [listos, setListos] = useState(false)
  return (
    <ConNota nota="Tócalos: el puesto lleva la «x» y, al pasar el cursor, «Quitar el filtro».">
      <div className="flex flex-wrap justify-center gap-2">
        <FiltroChip activo={espera} onCambiar={setEspera} icono={Clock01Icon} texto="Esperan respuesta" cuenta={4} ayuda="Ver solo a quien espera una respuesta" />
        <FiltroChip activo={listos} onCambiar={setListos} icono={CheckmarkCircle02Icon} texto="Listos" cuenta={12} ayuda="Ver solo a quien ya terminó" />
      </div>
    </ConNota>
  )
}

export const FICHAS_MARCO_DATOS: Ajuste[] = [
  {
    id: 'pieza-pageshell',
    titulo: 'Marco de página',
    estado: 'variante',
    resumen: 'El ancho, la cabecera (título, volver, estado, bajada y botones), las secciones y la barra de guardar de cada pantalla.',
    piezas: [
      { nombre: 'Heading', slug: 'typography' },
      { nombre: 'Text', slug: 'typography' },
      { nombre: 'Breadcrumb', slug: 'breadcrumb' },
      { nombre: 'Button', slug: 'button' },
    ],
    hechoAMano: 'La librería no trae marco de página: la cabecera, las secciones y la barra de abajo son un envoltorio propio (PageShell, PageHeader, PageSection, PageActionBar) sobre Heading, Text y Button.',
    libreria: <PaginaLibreria />,
    ubits: <PaginaUbits />,
    cambia: [
      'Cuatro anchos fijos: 720, 1.140 (el de siempre), 1.600 y completo; nadie pone el ancho a mano',
      'Botones en la fila del título, a la derecha; el estado pegado al título y la flecha de volver a su izquierda',
      'Tres tamaños de título, todos del tema; la miga de pan vive arriba, en la barra superior',
      'Barra de acciones flotante al fondo para guardar o avanzar',
    ],
    porque: 'Cada pantalla armaba su cabecera con otro tamaño de título, otro aire y los botones en otro sitio; con una sola pieza todas se leen igual y el ancho no se desajusta.',
    donde: ['PageShell (compartido): src/shared/components/PageShell.tsx', 'Casi todas las pantallas: Inicio, Selección › Vacantes, Aprendizaje › Planes de formación, Encuestas, Tareas, Avisos internos, Configuración'],
    usar: 'Toda pantalla nueva: PageShell por fuera, PageHeader arriba y PageSection por bloque. Crear y editar, con PageActionBar al fondo.',
    evitar: 'Armar el título con Heading suelto o con un Frame, poner un ancho máximo a mano o dibujar la miga de pan encima del título.',
  },
  {
    id: 'pieza-process-center',
    titulo: 'Centro de procesos',
    estado: 'variante',
    resumen: 'La tarjeta flotante con lo que está corriendo en segundo plano: importaciones, cargas y descargas, con su avance.',
    piezas: [
      { nombre: 'Item', slug: 'item' },
      { nombre: 'Progress', slug: 'progress' },
      { nombre: 'Button', slug: 'button' },
    ],
    hechoAMano: 'La tarjeta flotante de 320 px, el resumen que se cuenta solo y el aviso de abajo son propios; las filas son el Item de la librería.',
    libreria: <ProcesosLibreria />,
    ubits: <ProcesosUbits />,
    cambia: [
      'Tarjeta de 320 px colgada bajo el encabezado, con el resumen «2 en curso · 1 en espera»',
      'Baldosa por fila: azul si corre, verde si terminó y gris si espera turno',
      'Sin procesos, el vacío «No hay nada en proceso» con su ilustración',
      'Cada pantalla publica sus procesos y decide qué abre «Historial»',
    ],
    porque: 'Los procesos largos siguen aunque la persona cambie de pantalla o cierre el chat: hacía falta un solo sitio para verlos, igual desde cualquier parte.',
    donde: ['ProcessCenter y process-store (compartidos): src/shared/components/ProcessCenter.tsx', 'Lo monta el encabezado (AppHeader) y se abre desde Notificaciones; también el chat de Suite AI', 'Publican procesos: Selección › Importar hojas de vida, Encuestas › Cargar y Encuestas › Resultados › Descargas'],
    usar: 'Cuando una pantalla lanza algo que tarda (importar, cargar, generar un archivo): se publica el proceso y el centro lo muestra.',
    evitar: 'Una lista de progreso propia en la pantalla o un botón de procesos en el encabezado: no tiene botón, se abre desde Notificaciones.',
  },
  // Variante y no pedido (Cristian, 7-oct: «debe quedar como lo tenemos modificado en el DS»).
  {
    id: 'pieza-tabla-datos',
    titulo: 'Tabla',
    estado: 'variante',
    resumen: 'La única tabla del sistema: la de la librería con la cabecera de Vacantes y el paginador en español.',
    piezas: [
      { nombre: 'DataGridList', slug: 'data-grid' },
      { nombre: 'Frame', slug: 'frame' },
    ],
    hechoAMano: 'El paginador es el de Selección (PiePaginacion), montado dentro del marco de la tabla.',
    libreria: <TablaLibreria />,
    ubits: <TablaUbits />,
    cambia: [
      'Paginador en español: «Filas por página», «Viendo 1–10 de 84», «Anterior / Siguiente»',
      'Arriba, solo el conteo a la izquierda y el buscador y «Personalizar columnas» a la derecha; sin título dentro del marco',
      'Un solo borde (sin la caja doble dentro del marco) y sin «Fijar a la izquierda» en el menú de cada columna',
      'Los menús de la tabla traducidos y el asidero para mover cada columna',
    ],
    porque: 'Es una decisión del equipo: todas las listas se leen igual, con la cabecera de Vacantes, un solo borde y el paginador en español. Se queda aunque la librería traduzca su paginación; lo que cambie en la librería se toma dentro de esta pieza.',
    donde: ['TablaDatos: src/modules/design-system/data-grid/tabla-datos.tsx', 'Las partes de las tablas de producto: src/modules/design-system/data-grid/partes-tabla.tsx', 'Selección › Vacantes, Aprendizaje › Planes y Grupos, LMS Creator › Contenidos, Encuestas, Tareas, Avisos internos, Objetivos, Créditos', 'Design system › Data grid'],
    usar: 'Cualquier tabla o listado, con o sin paginación. La celda que nombra algo va con CeldaTitulo y la de una persona con Persona.',
    evitar: 'DataGridList o Table sueltos, otro paginador o una cuadrícula de tarjetas dentro de un marco de tabla.',
  },
  {
    id: 'pieza-persona',
    titulo: 'Persona en una celda',
    estado: 'variante',
    resumen: 'Avatar con iniciales, nombre y una línea gris con el cargo, el área o el usuario.',
    piezas: [{ nombre: 'Avatar', slug: 'avatar' }],
    libreria: <PersonaLibreria />,
    ubits: <PersonaUbits />,
    cambia: ['Avatar pequeño con las iniciales sacadas del nombre', 'Segunda línea en gris y más pequeña para el detalle', 'Nombre y detalle se cortan con «…» sin romper la fila'],
    porque: 'Cada tabla armaba su propio avatar con texto y ninguna se parecía; con una sola pieza todas las personas se leen igual en cualquier lista.',
    donde: ['Persona: src/modules/design-system/data-grid/casos/seguimiento.tsx', 'Tareas, Avisos internos, Selección › Vacantes, Aprendizaje › Planes de formación, Encuestas › Participantes y Resultados, Objetivos'],
    usar: 'Una persona en una celda de tabla o en una lista de un panel.',
    evitar: 'Copiarla para añadirle foto o enlace: si le falta algo, se amplía Persona. Tampoco para el perfil de quien usa la plataforma.',
  },
  {
    id: 'pieza-filas',
    titulo: 'Lista de dato y valor',
    estado: 'variante',
    resumen: 'El resumen de una ficha: el dato en gris a la izquierda y el valor alineado a la derecha, sin líneas.',
    piezas: [],
    hechoAMano: 'Es texto del tema (Text) en una lista; no usa ningún componente de la librería más allá de la tipografía.',
    libreria: <FilasLibreria />,
    ubits: <FilasUbits />,
    cambia: ['Sin líneas entre filas: se lee como texto, no como tabla', 'Dato en gris y valor alineado a la derecha', 'Si el valor es largo, baja de renglón sin empujar el dato'],
    porque: 'En la columna de resumen una tabla pesaba demasiado; la lista se lee de un vistazo y ocupa menos.',
    donde: ['Filas: src/modules/design-system/patrones/ficha.tsx', 'Expediente del candidato (perfil y columna del proceso)', 'Selección › propuestas: bloque de importada y de rechazo'],
    usar: 'Un resumen corto de datos dentro de una ficha o un panel lateral.',
    evitar: 'Datos que se comparan entre muchas filas: eso es una tabla. Configuración usa otra lista (con líneas y «Sin dato»); falta decidir si se juntan.',
  },
  {
    id: 'pieza-marco',
    titulo: 'Bloque con título',
    estado: 'variante',
    resumen: 'Un bloque gris con título, bajada y una acción arriba a la derecha, y sus paneles blancos adentro.',
    piezas: [{ nombre: 'Frame', slug: 'frame' }],
    libreria: <MarcoLibreria />,
    ubits: <MarcoUbits />,
    cambia: ['Acción arriba a la derecha, en la fila del título', 'El orbe junto al título cuando lo hizo la IA', 'Late cuando el agente lo cita, para ubicarlo en la ficha'],
    porque: 'Cada ficha armaba la cabecera del Frame a mano y la acción caía en otro sitio; el bloque deja la misma cabecera en todo el expediente.',
    donde: ['Marco: src/modules/design-system/patrones/ficha.tsx', 'Expediente del candidato (todas las pestañas)', 'Selección › propuestas: ficha de la base, ficha de la persona, perfil del candidato, requisitos y bloque de importada'],
    usar: 'Cada bloque de una ficha o un detalle que lleva título y, a veces, una acción.',
    evitar: 'Un Frame con la cabecera armada a mano, o usarlo como tarjeta suelta en un tablero: ahí va la tarjeta del tablero.',
  },
  {
    id: 'pieza-filtro-chip',
    titulo: 'Chip de filtro rápido',
    estado: 'variante',
    resumen: 'Un filtro que se prende y se apaga: dice qué filtra y cuántos hay, y puesto lleva la «x» para quitarlo.',
    piezas: [
      { nombre: 'Toggle', slug: 'toggle' },
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Tooltip', slug: 'tooltip' },
    ],
    libreria: <FiltroLibreria />,
    ubits: <FiltroUbits />,
    cambia: ['Cuenta en una insignia al final', 'Puesto: «x» al final y el globo «Quitar el filtro»', 'Todo el chip prende y quita; sin chip «Todas»'],
    porque: 'El Toggle solo no parecía un filtro y no se sabía cómo quitarlo (Nicolás, 25-sep).',
    donde: ['FiltroChip: src/modules/design-system/navegacion/filtro-chip.tsx', 'Selección (bandeja, tablero de candidatos, base, importar hojas de vida), Créditos › Historial, Encuestas › Resultados, Universidad corporativa', 'Design system › Estructura de página (Filtros rápidos)'],
    usar: 'Filtros rápidos encima de una lista o tabla, también una fila de opciones que se excluyen (las etapas).',
    evitar: 'Un Toggle o un ToggleGroup sueltos, o una insignia con una «x» aparte. Tampoco para cambiar de vista: eso son pestañas.',
  },
]
