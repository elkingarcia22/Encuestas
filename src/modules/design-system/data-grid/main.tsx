import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  Archive02Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  Mail01Icon,
  PlusSignIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Progress,
  ProgressValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  toast,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { TablaDatos } from './tabla-datos'
import { TextosCortados } from './textos-cortados'
import { EncabezadoPatron, PestanasDePatron, Reglas, VerEnAccion, type Regla } from '../patrones/piezas'
import { fechaCorta, iniciales } from '../patrones/formato'
import { CasoContenidos } from './casos/contenidos'
import { CasoEvaluaciones360 } from './casos/evaluaciones-360'
import { CasoResultados } from './casos/resultados'
import { CasoSeguimiento } from './casos/seguimiento'
import { AREAS, COLABORADORES, ESTADOS, type Colaborador } from './data'

type Escenario = 'normal' | 'cargando' | 'vacio' | 'error'
type Filtro = { id: string; value: unknown }

const ESCENARIOS: { id: Escenario; label: string }[] = [
  { id: 'normal', label: 'Con datos' },
  { id: 'cargando', label: 'Cargando' },
  { id: 'vacio', label: 'Sin datos' },
  { id: 'error', label: 'Error' },
]

const SIN_DATOS: Colaborador[] = []

function badgeDeEstado(estado: Colaborador['estado']) {
  if (estado === 'Activo') return 'success-light' as const
  if (estado === 'En onboarding') return 'info-light' as const
  return 'secondary' as const
}

function inicioDelDia(fecha: Date) {
  const copia = new Date(fecha)
  copia.setHours(0, 0, 0, 0)
  return copia
}

function finDelDia(fecha: Date) {
  const copia = new Date(fecha)
  copia.setHours(23, 59, 59, 999)
  return copia
}

// El grid no ordena, filtra ni pagina por su cuenta: avisa del cambio y espera
// recibir los datos ya resueltos. En una pantalla real esto lo haría el backend;
// aquí se resuelve en memoria sobre los datos de ejemplo.
function filtrar(filas: Colaborador[], busqueda: string, filtros: Filtro[]) {
  const q = busqueda.trim().toLowerCase()

  return filas.filter((fila) => {
    if (q && ![fila.nombre, fila.cargo, fila.area].some((campo) => campo.toLowerCase().includes(q))) {
      return false
    }

    for (const filtro of filtros) {
      const valor = filtro.value
      if (valor === undefined || valor === null || valor === '') continue

      if (filtro.id === 'nombre' && typeof valor === 'string') {
        if (!fila.nombre.toLowerCase().includes(valor.toLowerCase())) return false
      }

      if (filtro.id === 'area' && Array.isArray(valor) && valor.length > 0) {
        if (!valor.map(String).includes(fila.area)) return false
      }

      if (filtro.id === 'estado' && typeof valor === 'string') {
        if (fila.estado !== valor) return false
      }

      if (filtro.id === 'ingreso' && Array.isArray(valor)) {
        const [desde, hasta] = valor as (Date | undefined)[]
        const fecha = new Date(`${fila.ingreso}T00:00:00`)
        if (desde && fecha < inicioDelDia(new Date(desde))) return false
        if (hasta && fecha > finDelDia(new Date(hasta))) return false
      }
    }

    return true
  })
}

function ordenar(filas: Colaborador[], orden: string | undefined) {
  if (!orden) return filas

  const descendente = orden.startsWith('-')
  const campo = (descendente ? orden.slice(1) : orden) as keyof Colaborador

  return [...filas].sort((a, b) => {
    const valorA = a[campo]
    const valorB = b[campo]
    const comparacion =
      typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'es')

    return descendente ? -comparacion : comparacion
  })
}

// Columnas y filtros viven fuera del componente a propósito. Si se declaran
// dentro, cambian de identidad en cada render: el grid rehace los encabezados,
// el desplegable de filtros se cierra al marcar la primera opción y el menú de
// columnas entra en bucle de renderizado.
const COLUMNAS: DataGridListConfig<Colaborador>['columns'] = [
    {
      accessorKey: 'nombre',
      header: 'Colaborador',
      size: 260,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{iniciales(row.original.nombre)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <Text as="span" size="sm" weight="medium" className="truncate">
              {row.original.nombre}
            </Text>
            <Text as="span" variant="muted" size="xs" className="truncate">
              {row.original.cargo}
            </Text>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'area',
      header: 'Área',
      size: 140,
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      size: 150,
      cell: ({ row }) => (
        <Badge variant={badgeDeEstado(row.original.estado)}>{row.original.estado}</Badge>
      ),
    },
    {
      accessorKey: 'progreso',
      header: 'Avance',
      size: 160,
      cell: ({ row }) => (
        <Progress value={row.original.progreso} className="w-full gap-1.5">
          <ProgressValue className="ms-auto" />
        </Progress>
      ),
    },
    {
      accessorKey: 'ingreso',
      header: 'Ingreso',
      size: 130,
      cell: ({ row }) => (
        <Text as="span" variant="muted" size="sm" className="tabular-nums">
          {fechaCorta(row.original.ingreso)}
        </Text>
      ),
    },
]

const FILTROS_COLUMNA: DataGridListConfig<Colaborador>['columnFilters'] = [
    { id: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Buscar por nombre' },
    {
      id: 'area',
      label: 'Área',
      type: 'select',
      multiple: true,
      searchable: true,
      options: AREAS.map((area) => ({ label: area, value: area })),
    },
    {
      id: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS.map((estado) => ({ label: estado, value: estado })),
    },
    { id: 'ingreso', label: 'Ingreso', type: 'date', mode: 'range' },
]

function PruebaDeOpciones() {
  const [escenario, setEscenario] = useState<Escenario>('normal')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [seleccion, setSeleccion] = useState<Colaborador[]>([])

  // Arranca como la tabla de Vacantes, que es la del sistema desde el 5-oct: encabezados normales, con asidero para mover
  // y cambiar el ancho, y sin «Fijar». Los interruptores prueban lo demás.
  const [denso, setDenso] = useState(false)
  const [rayado, setRayado] = useState(false)
  const [reordenable, setReordenable] = useState(true)
  const [redimensionable, setRedimensionable] = useState(true)
  const [fijable, setFijable] = useState(false)
  const [barraFlotante, setBarraFlotante] = useState(false)
  const [encabezadoFijo, setEncabezadoFijo] = useState(false)

  const base = escenario === 'normal' ? COLABORADORES : SIN_DATOS

  const resultado = useMemo(() => ordenar(filtrar(base, busqueda, filtros), orden), [
    base,
    busqueda,
    filtros,
    orden,
  ])

  const paginaActual = useMemo(
    () => resultado.slice((pagina - 1) * porPagina, pagina * porPagina),
    [resultado, pagina, porPagina],
  )

  const hayFiltrosActivos = busqueda.trim() !== '' || filtros.length > 0

  const limpiarTodo = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
  }

  const emptyState: DataGridListConfig<Colaborador>['emptyState'] =
    escenario === 'error'
      ? {
          type: 'error',
          title: 'No pudimos cargar la lista',
          description: 'Se perdió la conexión con el servidor. Vuelve a intentarlo en unos segundos.',
          action: {
            id: 'reintentar',
            label: 'Reintentar',
            variant: 'outline',
            onClick: () => setEscenario('normal'),
          },
        }
      : hayFiltrosActivos
        ? {
            type: 'no-results',
            title: 'Ningún colaborador coincide',
            description: 'Prueba con otra búsqueda o quita alguno de los filtros activos.',
            action: {
              id: 'limpiar',
              label: 'Limpiar filtros',
              variant: 'outline',
              onClick: limpiarTodo,
            },
          }
        : {
            type: 'empty',
            title: 'Todavía no hay colaboradores',
            description: 'Agrega el primero y aparecerá aquí con su avance de formación.',
            action: {
              id: 'agregar',
              label: 'Agregar colaborador',
              onClick: () => setEscenario('normal'),
            },
          }

  const config: DataGridListConfig<Colaborador> = {
    columns: COLUMNAS,
    columnFilters: FILTROS_COLUMNA,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setPagina(1)
      },
    },
    search: {
      placeholder: 'Buscar colaborador…',
      onSearch: (query) => {
        setBusqueda(query)
        setPagina(1)
      },
    },
    refresh: {
      onRefresh: () => toast.add({ type: 'info', title: 'Lista actualizada' }),
    },
    selection: {
      onSelectionChange: setSeleccion,
    },
    actions: {
      primary: {
        id: 'agregar',
        label: 'Agregar colaborador',
        icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />,
        onClick: () => toast.add({ type: 'info', title: 'Aquí se abriría el formulario' }),
      },
      secondary: [
        {
          id: 'exportar',
          label: 'Exportar',
          variant: 'outline',
          icon: <HugeiconsIcon icon={Download01Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: () => toast.add({ type: 'success', title: 'Exportación generada' }),
        },
      ],
      item: [
        {
          id: 'ver',
          label: 'Ver perfil',
          icon: <HugeiconsIcon icon={ViewIcon} strokeWidth={2} aria-hidden="true" />,
          onClick: (filas) =>
            toast.add({ type: 'info', title: `Perfil de ${filas[0]?.nombre ?? 'la persona'}` }),
        },
        {
          id: 'editar',
          label: 'Editar',
          icon: <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: (filas) =>
            toast.add({ type: 'info', title: `Editando a ${filas[0]?.nombre ?? 'la persona'}` }),
        },
        {
          id: 'archivar',
          label: 'Archivar',
          variant: 'destructive',
          icon: <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: (filas) =>
            toast.add({
              type: 'success',
              title: `${filas[0]?.nombre ?? 'La persona'} pasó a archivados`,
              actionProps: {
                children: 'Deshacer',
                onClick: () => toast.add({ type: 'info', title: 'Se restauró el registro' }),
              },
            }),
        },
      ],
      bulk: [
        {
          id: 'recordatorio',
          label: 'Enviar recordatorio',
          icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: (filas) =>
            toast.add({
              type: 'success',
              title: `Recordatorio enviado a ${filas.length} personas`,
            }),
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          variant: 'destructive',
          icon: <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: (filas) =>
            toast.add({ type: 'error', title: `Se eliminarían ${filas.length} registros` }),
        },
      ],
    },
    emptyState,
    layout: {
      dense: denso,
      stripped: rayado,
      reorderable: reordenable,
      resizable: redimensionable,
      pinnable: fijable,
      headerSticky: encabezadoFijo,
    },
    // Sin título dentro del marco: el título es el de la página y arriba a la izquierda va el conteo (lo pone TablaDatos).
    frame: {
      toolbar: barraFlotante ? 'floating' : 'header',
      toolbarPosition: 'absolute',
    },
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Probar las opciones</CardTitle>
          <CardDescription>
            Cambia cualquier interruptor y mira cómo responde la tabla de abajo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Text size="sm" weight="medium">
              Qué se está mostrando
            </Text>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[escenario]}
              onValueChange={(valor) => {
                if (valor[0]) {
                  setEscenario(valor[0] as Escenario)
                  limpiarTodo()
                }
              }}
              aria-label="Qué se está mostrando"
              className="flex-wrap"
            >
              {ESCENARIOS.map((item) => (
                <ToggleGroupItem key={item.id} value={item.id}>
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <Switch id="denso" checked={denso} onCheckedChange={setDenso} />
              <Label htmlFor="denso">Densidad compacta</Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch id="rayado" checked={rayado} onCheckedChange={setRayado} />
              <Label htmlFor="rayado">Filas alternas</Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch id="reordenable" checked={reordenable} onCheckedChange={setReordenable} />
              <Label htmlFor="reordenable">Reordenar columnas</Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch
                id="redimensionable"
                checked={redimensionable}
                onCheckedChange={setRedimensionable}
              />
              <Label htmlFor="redimensionable">Cambiar el ancho</Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch id="fijable" checked={fijable} onCheckedChange={setFijable} />
              <Label htmlFor="fijable">Fijar columnas</Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch id="flotante" checked={barraFlotante} onCheckedChange={setBarraFlotante} />
              <Label htmlFor="flotante">Barra de selección flotante</Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch
                id="encabezado"
                checked={encabezadoFijo}
                onCheckedChange={setEncabezadoFijo}
              />
              <Label htmlFor="encabezado">Encabezado fijo al hacer scroll</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <TablaDatos
        config={config}
        data={escenario === 'cargando' ? [] : paginaActual}
        isLoading={escenario === 'cargando'}
        status={escenario === 'error' ? 'failed' : undefined}
        paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }}
        nombre="colaboradores"
        singular="colaborador"
        id="colaboradores"
      />

      <Alert variant="info">
        <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
        <AlertTitle>
          {seleccion.length > 0
            ? `Tienes ${seleccion.length} ${seleccion.length === 1 ? 'fila seleccionada' : 'filas seleccionadas'}`
            : 'La tabla avisa, no calcula'}
        </AlertTitle>
        <AlertDescription>
          El componente no ordena ni filtra por su cuenta: informa lo que la persona pidió y
          espera recibir los datos ya resueltos. En una pantalla real eso lo responde el servidor;
          aquí se resuelve en memoria sobre {COLABORADORES.length} registros de ejemplo.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
        <AlertTitle>Tres detalles para hablar con el equipo de librería</AlertTitle>
        <AlertDescription>
          <p>
            Quedaron textos en inglés que no se pueden traducir desde la pantalla: el encabezado
            del menú de columnas («Toggle Columns») y lo que oye un lector de pantalla en las
            casillas de selección y en el asa para arrastrar columnas («Select row», «Select all»,
            «Drag to reorder»).
          </p>
          <p>
            Al encender el encabezado fijo, la tabla pasa a una altura fija de 360 píxeles, así
            que muestra menos filas de las que trae la página. Es decisión del componente, no de
            esta maqueta.
          </p>
          <p>
            Las columnas y los filtros hay que definirlos por fuera de la pantalla. Si se
            declaran dentro, el desplegable de filtros se cierra al marcar la primera opción y el
            menú de columnas se rompe. Aquí ya está resuelto.
          </p>
          <p>
            El menú de acciones de cada fila es el mismo para todas. Cuando las acciones dependen
            del estado (finalizar solo lo que está en progreso), hoy se arma una columna propia
            con el menú desplegable de la librería: está en la pestaña «Evaluaciones 360°».
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

const PESTANAS = [
  { valor: 'opciones', etiqueta: 'Probar opciones' },
  { valor: 'evaluaciones', etiqueta: 'Evaluaciones 360°' },
  { valor: 'contenidos', etiqueta: 'Contenidos' },
  { valor: 'seguimiento', etiqueta: 'Seguimiento de tareas' },
  { valor: 'resultados', etiqueta: 'Resultados de un contenido' },
]

// La tabla única del sistema (decisiones 1 y 2 de la auditoría, 5-oct). Cristian: «la tabla del sistema (Data grid) es
// la única, pero quiero cambiar el header de la tabla para hacerlo como en Vacantes», y «también existe la tabla que
// tiene en la fila un título y descripción, es la misma que se debe usar cuando hay una imagen».
const REGLAS_TABLA: Regla[] = [
  {
    titulo: 'Es la única tabla',
    detalle: 'Toda lista del producto es TablaDatos. MarcoTabla se retiró, y DataGridList o Table sueltos no se usan en una pantalla.',
  },
  {
    titulo: 'Cabecera como Vacantes',
    detalle: 'Arriba, en lo gris, el conteo a la izquierda y el buscador y «Personalizar columnas» a la derecha. Sin título dentro del marco: lo da la página. Si una pantalla tiene dos tablas, cada una va en su sección con título.',
  },
  {
    titulo: 'Encabezados con asidero',
    detalle: 'De 40 px, con el asidero para mover cada columna y el borde para cambiarle el ancho, y orden y filtro en cada una. Los filtros van en la columna, no en una ventana aparte.',
  },
  {
    titulo: 'La fila que nombra algo, con o sin imagen',
    detalle: 'Título y debajo una línea gris (CeldaTitulo). Cuando hay portada, la misma fila con la miniatura a la izquierda: una lista de contenidos con imagen es una tabla, no una cuadrícula de tarjetas. En una columna angosta (un panel lateral) el título puede ir en dos renglones con dosLineas.',
  },
  {
    // 7-oct: TextoCompleto pasa a ser pieza oficial.
    titulo: 'Lo cortado se puede leer entero',
    detalle: 'Un texto que se corta con «…» va dentro de TextoCompleto: al pasar el cursor o enfocarlo, el texto entero sale en el globo del sistema (Hint), y solo si de verdad está cortado. Hint acepta open y onOpenChange para abrirlo y cerrarlo desde afuera; sin ellos se abre solo, como siempre.',
  },
  {
    // Decisión 21 de la auditoría (5-oct): una sola pieza para la persona en una fila.
    titulo: 'Una persona en una fila',
    detalle: 'Persona: el círculo con sus iniciales, el nombre y debajo una línea gris (cargo, área o usuario). Es la misma en todas las tablas (la usan Seguimiento de tareas y Resultados de un contenido); si le falta algo, se amplía, no se arma otra.',
  },
  {
    titulo: 'Un solo paginador, en español',
    detalle: '«Filas por página» (10, 20 o 50), «Viendo 1–10 de 84 …» y «Anterior / Siguiente» con números, dentro del marco. Lo pone la tabla sola.',
  },
]

// Las tablas de los templates del administrador que usan este data-grid.
// Decidido por Carlos el 24-sep, para todas las tablas del producto.
const REGLAS_ACCIONES: Regla[] = [
  {
    titulo: 'Lleva su encabezado, como las demás',
    detalle: 'Dice «Acciones» y se escribe igual que el resto de encabezados. Nada de dejarlo en blanco ni solo para el lector de pantalla.',
  },
  {
    titulo: 'Dentro va el botón de tres puntos',
    detalle: 'Terciario de solo icono (BotonIcono) con los tres puntos horizontales. No un botón secundario con la palabra «Acciones»: repite lo que ya dice el encabezado y pesa más que el contenido de la fila.',
  },
]

export function Component() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <EncabezadoPatron
          titulo="Tablas"
          acciones={<VerEnAccion pagina="data-grid" />}
        >
          La única tabla del sistema: orden, búsqueda, filtros por columna, paginación en español,
          selección múltiple con acciones masivas y la cabecera de Vacantes. Pruébala en la primera
          pestaña; las demás son listados reales de UBITS resueltos con ella, cada uno con las reglas
          de su historia de usuario.
        </EncabezadoPatron>

        <Reglas titulo="Cómo es la tabla" reglas={REGLAS_TABLA} />
        <Reglas titulo="La columna de acciones" reglas={REGLAS_ACCIONES} />
        <TextosCortados />

        <Tabs defaultValue="opciones">
          <PestanasDePatron items={PESTANAS} />
          <TabsContent value="opciones" className="pt-6">
            <PruebaDeOpciones />
          </TabsContent>
          <TabsContent value="evaluaciones" className="pt-6">
            <CasoEvaluaciones360 />
          </TabsContent>
          <TabsContent value="contenidos" className="pt-6">
            <CasoContenidos />
          </TabsContent>
          <TabsContent value="seguimiento" className="pt-6">
            <CasoSeguimiento />
          </TabsContent>
          <TabsContent value="resultados" className="pt-6">
            <CasoResultados />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

Component.displayName = 'DesignSystemDataGridPage'
