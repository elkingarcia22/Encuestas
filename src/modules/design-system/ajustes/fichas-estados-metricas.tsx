import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Folder01Icon, RefreshIcon, Search01Icon, WifiDisconnected01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  IconTile,
  Skeleton,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useComboboxAnchor,
} from '@ubits/flux-ui'
import type { Ajuste } from './main'
import { ConNota } from './demos'
import { Indicadores, type Cifra } from '@/modules/design-system/metricas/cifras'
import { TableroAtencion, type AsuntoTablero } from '@/modules/design-system/metricas/tablero-atencion'
import { AvatarEsqueleto, Esqueleto, LineaEsqueleto, useCarga } from '@/modules/design-system/estados/carga'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { EJEMPLOS_ERROR } from '@/modules/design-system/estados/errores-sistema-datos'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { SelectorMultiple } from '@/modules/design-system/formularios/asignacion'

// Fichas de las piezas de estados y métricas (7-oct): cifras de un tablero, «Lo que necesita tu atención», estados
// vacíos, pantalla de error, esqueletos, ilustraciones Glass, texto que se corta y selector múltiple. Del lado de la
// librería, lo que sale armándolo directo con flux-ui; del lado de UBITS, la pieza real importada (no una copia).

/* ── Cifras de un tablero ── */

const CIFRAS: Cifra[] = [
  { etiqueta: 'Abiertas', valor: '24', detalle: 'Este mes' },
  { etiqueta: 'Vencidas', valor: '3', detalle: 'Hace más de 7 días' },
  { etiqueta: 'Cerradas', valor: '58', detalle: '+12 vs. agosto' },
]

function CifrasLibreria() {
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {CIFRAS.map((cifra) => (
        <Card key={cifra.etiqueta} size="sm">
          <CardContent className="flex flex-col gap-1">
            <Text as="span" variant="muted" size="sm">
              {cifra.etiqueta}
            </Text>
            <Text as="span" size="xl" weight="semibold">
              {cifra.valor}
            </Text>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CifrasUbits() {
  return (
    <div className="w-full">
      <Indicadores cifras={CIFRAS} columnas="grid-cols-3" />
    </div>
  )
}

/* ── Lo que necesita tu atención ── */

const ASUNTOS: AsuntoTablero[] = [
  { id: 'a1', grupo: 'critico', titulo: 'Analista de datos cierra hoy sin finalistas', resumen: '' },
  { id: 'a2', grupo: 'atencion', titulo: '5 candidatos esperan respuesta hace 4 días', resumen: '' },
  { id: 'a3', grupo: 'atencion', titulo: 'Diseñador UX sin entrevistas agendadas', resumen: '' },
  { id: 'a4', grupo: 'ia', titulo: 'Mover 2 candidatos a entrevista', resumen: '' },
]

function AtencionLibreria() {
  return (
    <Alert variant="warning" className="w-full">
      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
      <AlertTitle>4 asuntos necesitan tu atención</AlertTitle>
      <AlertDescription>
        <ul className="ml-4 list-disc">
          {ASUNTOS.map((asunto) => (
            <li key={asunto.id}>{asunto.titulo}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

function AtencionUbits() {
  const [expandido, setExpandido] = useState(false)
  return (
    <ConNota nota="En media pantalla las cuatro columnas se apilan; desde 896 px van en una fila.">
      <div className="w-full">
        <TableroAtencion pendientes={ASUNTOS} expandido={expandido} onExpandido={setExpandido} onAbrir={() => undefined} onVerGrupo={() => undefined} />
      </div>
    </ConNota>
  )
}

/* ── Estados vacíos ── */

function VacioLibreria() {
  return (
    <Empty className="py-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No se encontraron resultados</EmptyTitle>
        <EmptyDescription>El mismo texto sirve para una lista nueva y para un filtro que no encuentra nada.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function VacioUbits() {
  const [caso, setCaso] = useState<'primera' | 'sin'>('primera')
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <ToggleGroup variant="outline" size="sm" value={[caso]} onValueChange={(valor) => valor[0] && setCaso(valor[0] as 'primera' | 'sin')} aria-label="Elegir el estado vacío">
        <ToggleGroupItem value="primera">Primera vez</ToggleGroupItem>
        <ToggleGroupItem value="sin">Sin resultados</ToggleGroupItem>
      </ToggleGroup>
      {caso === 'primera' ? (
        <PrimeraVez
          className="py-4"
          icono="glass-paper-plus"
          titulo="Todavía no hay planes"
          descripcion="Los planes que crees aparecen aquí."
          accion={{ texto: 'Crear plan', onClick: () => undefined }}
        />
      ) : (
        <SinResultados busqueda="liderazgo" filtrosActivos={2} onLimpiar={() => setCaso('primera')} />
      )}
    </div>
  )
}

/* ── Pantalla de error ── */

const SIN_CONEXION = EJEMPLOS_ERROR.find((error) => error.id === 'offline') ?? EJEMPLOS_ERROR[0]

function ErrorLibreria() {
  return (
    <Empty className="py-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={WifiDisconnected01Icon} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Sin conexión</EmptyTitle>
        <EmptyDescription>Cada pantalla escribe su texto y elige su botón.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" />
          Reintentar
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function ErrorUbits() {
  return (
    <ConNota nota="Va a pantalla completa, sin barra lateral ni encabezado. Prueba el botón.">
      <div className="w-full">
        <PantallaDeError error={SIN_CONEXION} />
      </div>
    </ConNota>
  )
}

/* ── Esqueletos y espera ── */

const PERSONAS = [
  { nombre: 'Ana Gómez', cargo: 'Analista de datos' },
  { nombre: 'Luis Pardo', cargo: 'Diseñador UX' },
]

function CargaLibreria() {
  return (
    <ConNota nota="Skeleton suelto: la silueta, cuánto dura y el aviso al lector de pantalla los pone cada pantalla.">
      <div className="flex w-64 flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </ConNota>
  )
}

function CargaUbits() {
  const [vuelta, setVuelta] = useState(0)
  const cargando = useCarga(vuelta)
  return (
    <div className="flex w-64 flex-col items-center gap-3">
      {cargando ? (
        <Esqueleto etiqueta="Cargando candidatos" className="flex w-full flex-col gap-3">
          {PERSONAS.map((persona) => (
            <div key={persona.nombre} className="flex items-center gap-3">
              <AvatarEsqueleto size="sm" />
              <div className="flex flex-1 flex-col">
                <LineaEsqueleto ancho="w-24" />
                <LineaEsqueleto ancho="w-32" tamano="chico" />
              </div>
            </div>
          ))}
        </Esqueleto>
      ) : (
        <div className="flex w-full flex-col gap-3">
          {PERSONAS.map((persona) => (
            <div key={persona.nombre} className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>{persona.nombre.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Text as="span" size="sm" weight="medium">
                  {persona.nombre}
                </Text>
                <Text as="span" size="xs" variant="muted">
                  {persona.cargo}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={() => setVuelta((n) => n + 1)}>
        Volver a cargar
      </Button>
    </div>
  )
}

/* ── Ilustración Glass ── */

function GlassLibreria() {
  return (
    <ConNota nota="La librería no trae ilustraciones: lo más cercano es un icono de línea en baldosa.">
      <IconTile variant="soft" size="lg">
        <HugeiconsIcon icon={Folder01Icon} aria-hidden="true" />
      </IconTile>
    </ConNota>
  )
}

function GlassUbits() {
  return (
    <ConNota nota="glass-folder, glass-calendar y glass-chart, a 56 y 72 px.">
      <div className="flex items-end gap-4">
        <ImagenGlass nombre="glass-folder" tamano={56} />
        <ImagenGlass nombre="glass-calendar" />
        <ImagenGlass nombre="glass-chart" tamano={56} />
      </div>
    </ConNota>
  )
}

/* ── Texto que se corta ── */

const CORTO = 'Clima Q3 2026'
const LARGO = 'Encuesta de clima organizacional del tercer trimestre para todas las sedes'

function TextoLibreria() {
  return (
    <ConNota nota="Tooltip suelto: abre aunque el texto quepa entero, y tarda más.">
      <div className="flex w-56 flex-col gap-1">
        {[CORTO, LARGO].map((texto) => (
          <Tooltip key={texto}>
            <TooltipTrigger render={<Text as="span" size="sm" className="block truncate" />}>{texto}</TooltipTrigger>
            <TooltipContent>{texto}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </ConNota>
  )
}

function TextoUbits() {
  return (
    <ConNota nota="Pasa el cursor por los dos: solo el cortado abre el globo.">
      <div className="flex w-56 flex-col gap-1">
        {[CORTO, LARGO].map((texto) => (
          <TextoCompleto key={texto} texto={texto}>
            <Text as="span" size="sm" className="block truncate">
              {texto}
            </Text>
          </TextoCompleto>
        ))}
      </div>
    </ConNota>
  )
}

/* ── Selector múltiple ── */

const OPCIONES = ['Ana Gómez', 'Luis Pardo', 'Marta Ríos', 'Pedro Salas', 'Sofía Vega']

function SelectorLibreria() {
  const ancla = useComboboxAnchor()
  return (
    <ConNota nota="Escribe algo que no esté: la lista queda en blanco, y el texto de ayuda no se va al elegir.">
      <div className="w-80">
        <Combobox multiple items={OPCIONES} defaultValue={['Ana Gómez']}>
          <ComboboxChips ref={ancla}>
            <ComboboxValue>
              {(elegidos: string[]) => (
                <>
                  {elegidos.map((elegido) => (
                    <ComboboxChip key={elegido}>{elegido}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput aria-label="Personas (librería)" placeholder="Busca por nombre…" />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={ancla}>
            <ComboboxList>
              {(opcion: string) => (
                <ComboboxItem key={opcion} value={opcion}>
                  {opcion}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </ConNota>
  )
}

function SelectorUbits() {
  const [valor, setValor] = useState<string[]>(['Ana Gómez'])
  return (
    <ConNota nota="Escribe algo que no esté para ver el aviso en español.">
      <div className="w-80">
        <SelectorMultiple id="ficha-selector-multiple" opciones={OPCIONES} valor={valor} onCambio={setValor} placeholder="Busca por nombre…" />
      </div>
    </ConNota>
  )
}

/* ── Las fichas ── */

export const FICHAS_ESTADOS_METRICAS: Ajuste[] = [
  {
    id: 'pieza-indicadores',
    titulo: 'Cifras de un tablero',
    estado: 'variante',
    resumen: 'Las métricas de una pantalla en una sola fila, partida por líneas, dentro de un marco.',
    piezas: [{ nombre: 'Frame', slug: 'frame' }, { nombre: 'Badge', slug: 'badge' }],
    libreria: <CifrasLibreria />,
    ubits: <CifrasUbits />,
    cambia: [
      'Una sola tarjeta partida por líneas verticales, no una tarjeta por cifra',
      'Nombre arriba en gris, número en seminegrita y detalle debajo',
      'Insignia opcional «Requiere atención» junto al número',
      'Dentro de una tarjeta que ya tiene marco va FilaCifras, sin el marco',
    ],
    porque: 'Acuerdo de la reunión del 14-sep: las métricas van en una tarjeta partida, no en tarjetas sueltas que compiten entre sí y ocupan el doble.',
    donde: [
      'Indicadores, FilaCifras y CeldaCifra (design-system/metricas/cifras.tsx)',
      'Tareas (pestaña Tareas), Inicio del admin, Datos de la empresa, detalle de la vacante y Progreso del colaborador',
      'Design system › Métricas, Tablero y Menú horizontal',
    ],
    usar: 'Las cifras de una pantalla sin comparación. Si se comparan con el periodo anterior, la fila de Selección (FilaIndicadores con Cambio).',
    evitar: 'Una Card por cifra o un número grande armado a mano.',
  },
  {
    id: 'pieza-tablero-atencion',
    titulo: 'Lo que necesita tu atención',
    estado: 'variante',
    resumen: 'Los asuntos por resolver arriba de una pantalla, en cuatro columnas: Críticas, Necesitan atención, Acción manual y Sugerencias de la IA.',
    piezas: [
      { nombre: 'Frame', slug: 'frame' },
      { nombre: 'Alert', slug: 'alert' },
      { nombre: 'Item', slug: 'item' },
      { nombre: 'IconTile', slug: 'icon-tile' },
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Empty', slug: 'empty' },
      { nombre: 'Skeleton', slug: 'skeleton' },
    ],
    libreria: <AtencionLibreria />,
    ubits: <AtencionUbits />,
    cambia: [
      'Una columna por grupo con su icono, su nombre y la cuenta',
      'Lo crítico en el aviso rojo con una flecha; lo demás en filas blancas que abren su panel',
      'Entra recogido con lo más urgente de cada columna; «Expandir» enseña hasta tres',
      'Cuando no queda nada lo celebra: «No tienes nada por hacer», con ilustración',
    ],
    porque:
      'Reunión con Elkin del 29-sep y Nicolás el 5-oct: Vacantes y Créditos debían tener el mismo tablero. Un aviso amarillo con la lista no dice qué es más urgente ni deja resolver desde ahí; compacto desde el 5-oct para no comerse la pantalla.',
    donde: [
      'TableroAtencion (design-system/metricas/tablero-atencion.tsx), con ListaAsuntos, TarjetaSugerencia y MediaGrupo para el panel',
      'Selección › Exploración 1, inicio de Vacantes',
      'Selección › Créditos',
    ],
    usar: 'Arriba de una pantalla operativa con asuntos que alguien tiene que resolver. Cada asunto se resuelve en el panel lateral de su pantalla.',
    evitar: 'Un aviso con la lista o un tablero propio. Para una franja plegable encima de una lista va BloqueAtencion.',
  },
  {
    id: 'pieza-primera-vez',
    titulo: 'Estados vacíos',
    estado: 'variante',
    resumen: 'PrimeraVez cuando todavía no hay nada; SinResultados cuando la búsqueda o los filtros no encuentran nada.',
    piezas: [{ nombre: 'Empty', slug: 'empty' }, { nombre: 'Button', slug: 'button' }],
    hechoAMano: 'La ilustración es un icono Glass (ImagenGlass), una imagen PNG que la librería no trae.',
    libreria: <VacioLibreria />,
    ubits: <VacioUbits />,
    cambia: [
      'Ilustración Glass en vez de la lupa de línea',
      'Dos casos con su texto: «Todavía no hay…» con la acción para crear, o «Sin resultados para «…»» con lo buscado entre comillas',
      'SinResultados cuenta los filtros puestos y su botón nombra lo que va a quitar («Limpiar búsqueda y filtros»)',
    ],
    porque: 'Un «No se encontraron resultados» a secas obliga a mirar la barra para entender por qué la lista está vacía, y no distingue una lista nueva de un filtro que deja todo fuera.',
    donde: [
      'PrimeraVez y SinResultados (src/shared/components/)',
      'Más de 50 pantallas: Planes de formación, Contenidos de LMS Creator, Encuestas, Objetivos, Avisos internos, Diagnóstico y Selección',
      'Design system › Estados',
    ],
    usar: 'Toda lista o bloque vacío. Si nunca hubo nada, PrimeraVez; si hay datos pero el filtro los deja fuera, SinResultados.',
    evitar: 'Armar un Empty con texto fijo, o poner «crear» como salida de una búsqueda sin resultados.',
  },
  {
    id: 'pieza-pantalla-error',
    titulo: 'Pantalla de error',
    estado: 'variante',
    resumen: 'Cuando la plataforma no puede mostrar lo pedido: sin conexión, sin acceso, licencia terminada, falla del servidor o un registro que no existe.',
    piezas: [{ nombre: 'Button', slug: 'button' }, { nombre: 'Spinner', slug: 'spinner' }],
    hechoAMano: 'La ilustración Glass a la izquierda y el texto a la derecha son una composición propia; la librería no trae una pantalla de error.',
    libreria: <ErrorLibreria />,
    ubits: <ErrorUbits />,
    cambia: [
      'Ilustración a la izquierda y texto con su acción a la derecha; en móvil se apilan',
      'Títulos, cuerpos y acciones fijos para cada error, sacados de la historia de usuario',
      'Una sola salida por error (o ninguna); «Volver a intentar» enseña que está intentando',
    ],
    porque: 'La historia de errores de sistema pide un mismo texto para cada caso, sin códigos ni jerga, y distinguir «Sin acceso» de «No existe». Con un Empty cada pantalla escribía el suyo.',
    donde: [
      'PantallaDeError (design-system/estados/errores-sistema.tsx); los textos, en errores-sistema-datos.ts',
      'Detalle de vacante y expediente del candidato que no existen',
      'Detalle y formularios de Planes de formación',
      'Templates: Gestión de usuarios, Encuestas, Planes de formación y Estados',
    ],
    usar: 'Cuando la pantalla entera no se puede mostrar. Para un registro que no existe, registroQueNoExiste con su nombre y su lista.',
    evitar: 'Un Empty con texto propio, o enseñar códigos como «403» o «500».',
  },
  {
    id: 'pieza-carga',
    titulo: 'Esqueletos y espera',
    estado: 'variante',
    resumen: 'Mientras un bloque carga se ve su silueta en gris, con la misma forma que tendrá; el resto de la pantalla sigue quieto.',
    piezas: [{ nombre: 'Skeleton', slug: 'skeleton' }, { nombre: 'Avatar', slug: 'avatar' }],
    libreria: <CargaLibreria />,
    ubits: <CargaUbits />,
    cambia: [
      'Una sola espera para todo Selección: 0,8 segundos al entrar y cada vez que cambia un filtro, una pestaña o la búsqueda',
      'Piezas con la medida exacta del texto, la cara, la insignia o el botón que van a llegar, para que nada salte',
      'El lector de pantalla oye «Cargando…» una vez, no cada pieza gris',
      'Una acción (guardar, mover, enviar) no lleva esqueleto: va en el botón con «Guardando…»',
    ],
    porque: 'Nicolás, 25-sep: cada componente con su esqueleto para que las cargas se vean bien. La maqueta no tiene servidor, así que la espera se simula en un solo lugar.',
    donde: [
      'useCarga, useAccion, Esqueleto, LineaEsqueleto y AvatarEsqueleto (design-system/estados/carga.tsx)',
      'Selección: bandeja, tablero de candidatos, Vacantes de Exploración 1 y 2, historial de Créditos y perfil del candidato',
      'Design system › Estados',
    ],
    usar: 'En Selección, todo bloque que llega o cambia. Fuera de Selección, Skeleton de la librería con la silueta real.',
    evitar: 'Un spinner a pantalla completa, otro temporizador de carga o un esqueleto que no se parece a lo que llega.',
  },
  {
    id: 'pieza-imagen-glass',
    titulo: 'Ilustración Glass',
    estado: 'pedido',
    resumen: 'Los 50 iconos de vidrio que se usan como ilustraciones pequeñas en estados vacíos, atajos y tarjetas.',
    piezas: [],
    hechoAMano: 'Es una imagen PNG en tres densidades (public/iconos-glass); la librería no trae ilustraciones.',
    libreria: <GlassLibreria />,
    ubits: <GlassUbits />,
    cambia: [
      'Se pide por su nombre y su tamaño; ya trae las versiones nítidas para pantallas de alta densidad',
      'Un nombre que no existe no rompe la pantalla: no se pinta nada',
      'Queda oculta para el lector de pantalla: es decoración',
    ],
    porque: 'Excepción aprobada por UX a «solo Hugeicons» mientras la librería no publique los Glass. Había cuatro copias que armaban la ruta del PNG cada una a su manera.',
    donde: [
      'ImagenGlass (src/shared/components/ImagenGlass.tsx); el catálogo, en design-system/icons/glass.ts',
      'Estados vacíos (PrimeraVez, SinResultados), Lo que necesita tu atención, accesos rápidos del Inicio, LMS Creator y templates del colaborador',
      'Design system › Icons',
    ],
    usar: 'Donde hay sitio para una ilustración: un estado vacío, una tarjeta de atajo, una promoción.',
    evitar: 'Dentro de botones, filas de tabla o menús: ahí van los iconos de línea de Hugeicons.',
  },
  {
    id: 'pieza-texto-completo',
    titulo: 'Texto que se corta',
    estado: 'variante',
    resumen: 'Un texto cortado con «…» que enseña el texto entero en un globo al pasar el cursor o al enfocarlo.',
    piezas: [{ nombre: 'Tooltip', slug: 'tooltip' }],
    hechoAMano: 'Va sobre Hint, el globo del sistema, que ya ajusta esquinas, letra y tiempo del Tooltip.',
    libreria: <TextoLibreria />,
    ubits: <TextoUbits />,
    cambia: [
      'El globo solo aparece si el texto de verdad está cortado',
      'Abre a los 200 ms, como el resto de los globos del producto',
      'Globo de hasta 320 px que parte el texto en renglones',
    ],
    porque: 'Un texto cortado que no se puede leer entero es información perdida, y el globo que abre aunque el texto quepa estorba. Pieza oficial desde el 7-oct.',
    donde: [
      'TextoCompleto (src/shared/components/TextoCompleto.tsx), sobre Hint',
      'Encuestas (crear, resultados, plantillas, vista previa), Objetivos (tabla de usuarios, plantillas, alertas) y el resumen de Crear vacante',
      'Design system › Data grid (Textos que no caben)',
    ],
    usar: 'Cualquier texto que pueda no caber y se corta con «…». En una celda angosta de tabla, CeldaTitulo con dos líneas.',
    evitar: 'El globo del navegador (title) o un Tooltip suelto armado en cada pantalla.',
  },
  {
    id: 'pieza-selector-multiple',
    titulo: 'Selector múltiple',
    estado: 'variante',
    resumen: 'Elegir varias opciones con buscador: las elegidas quedan como fichas dentro del campo.',
    piezas: [{ nombre: 'Combobox', slug: 'combobox' }],
    libreria: <SelectorLibreria />,
    ubits: <SelectorUbits />,
    cambia: [
      'Textos en español: «No encontramos nada con ese nombre» cuando la búsqueda no da nada',
      'El texto de ayuda se va en cuanto hay una ficha',
      'Marca el campo en rojo cuando falta elegir',
      'Se usa en una línea: opciones, valor y qué hacer al cambiar',
    ],
    porque: 'La librería no trae ningún texto propio y cada pantalla armaba el Combobox con fichas a su manera.',
    donde: [
      'SelectorMultiple (design-system/formularios/asignacion.tsx)',
      'Tareas › Crear tarea',
      'Templates: Planes de formación (agregar asignación) y editor de Encuestas',
      'Design system › Formularios',
    ],
    usar: 'Elegir varias personas, grupos, contenidos o competencias de una lista con buscador.',
    evitar: 'Un Combobox con fichas armado en la pantalla, o el SelectorEtiquetas de Selección.',
  },
]
