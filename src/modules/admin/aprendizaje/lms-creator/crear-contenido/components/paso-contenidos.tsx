import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  DragDropVerticalIcon,
  Layers01Icon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { BotonCancelarPanel } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { plural } from '@/modules/design-system/patrones/formato'
import { TablaSeleccion } from '../../../planes-de-formacion/components/tabla-seleccion'
import {
  ALIADOS_ELEGIBLES,
  CLASIFICACIONES,
  ELEGIBLES_RUTA,
  HABILIDADES_ELEGIBLES,
  IDIOMAS_ELEGIBLES,
  INGLES_ELEGIBLES,
  NIVELES_ELEGIBLES,
  ORIGENES,
  TIPOS_ELEGIBLES,
  coincideElegible,
  porId,
  type Elegible,
} from './catalogo-ruta'
import { textoMinutos } from './ficha'

// Paso 2 · Contenidos (solo en una ruta): los contenidos del catálogo que forman el recorrido, **en orden**. Es lo
// único que de verdad distingue a «Crear ruta» de «Crear contenido»: donde el contenido arma páginas, la ruta elige
// cosas que ya existen (HU-LMS-013 · RN-01, RN-02, RN-03).
//
// Dos piezas y ninguna nueva:
//
//  · La **lista**, con el mismo `Sortable` del índice de páginas —asidero a la izquierda, arrastrar para reordenar—,
//    porque el orden *es* el recorrido (RN-03) y ya hay una forma de ordenar en este asistente.
//  · El **panel para elegir**, un `DrawerShell` xl como «Seleccionar colaboradores»: es el mismo gesto (escoger varios
//    de una lista larga) dentro del mismo asistente, así que no inventa un tercer modo de elegir.
//
// En la lista la fila es la **tarjeta acostada** (`orientacion="horizontal"`), la misma pieza que el colaborador verá
// dentro de la ruta. En el panel, la tabla del sistema con la portada junto al nombre (CeldaTitulo).
//
// Qué se puede agregar y de dónde sale, en `catalogo-ruta.ts`.

/** Los datos del catálogo, en lo que la tarjeta entiende. */
function comoTarjeta(c: Elegible) {
  return {
    titulo: c.titulo,
    imagen: c.imagen,
    tipo: c.tipo,
    nivel: c.nivel,
    duracion: textoMinutos(c.minutos),
    idioma: c.idioma,
  }
}

type Props = {
  /** Los ids del catálogo, en el orden del recorrido. */
  contenidos: string[]
  /** Si el panel de elegir está abierto. Lo manda el asistente, porque tiene su propia dirección (`#contenidos/agregar`). */
  panelAbierto: boolean
  onPanel: (abierto: boolean) => void
  onCambio: (contenidos: string[]) => void
}

export function PasoContenidos({ contenidos, panelAbierto, onPanel, onCambio }: Props) {

  // Las fichas de la ruta, en su orden. Un id que ya no esté en el catálogo simplemente no se pinta.
  const elegidos = useMemo(() => contenidos.map(porId).filter((c): c is Elegible => Boolean(c)), [contenidos])
  // Quitar un contenido se confirma: el escalón desaparece de la ruta y, con navegación lineal, cambia el orden en
  // que se desbloquea todo lo que venía detrás (Dave, 5-oct).
  const [porQuitar, setPorQuitar] = useState<Elegible | null>(null)
  const quitar = (id: string) => onCambio(contenidos.filter((x) => x !== id))

  return (
    <div className="flex flex-col gap-6">
      <Frame>
        {/* El botón de agregar va con el título, no entre las filas: es lo que se hace con toda la sección, igual que
            «Repartir automáticamente» en los pesos. */}
        <FrameHeader className="flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <FrameTitle>Contenidos de la ruta</FrameTitle>
            {/* Sin cuántos van ni cuánto suman: eso ya lo dice la vista previa de la derecha, y repetirlo obliga a
                mirar dos sitios para el mismo dato (Dave, 2-oct). */}
            {elegidos.length ? <FrameDescription>Arrastra para cambiar el orden del recorrido.</FrameDescription> : null}
          </div>
          {elegidos.length ? (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => onPanel(true)}>
              <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
              Agregar contenidos
            </Button>
          ) : null}
        </FrameHeader>
        <FramePanel>
          {elegidos.length ? (
            <Sortable
              value={contenidos}
              getItemValue={(id) => id}
              onValueChange={onCambio}
              strategy="vertical"
              className="flex flex-col gap-2"
              role="list"
              aria-label="Contenidos de la ruta, en orden"
            >
              {elegidos.map((c, indice) => (
                <Fila
                  key={c.id}
                  contenido={c}
                  posicion={indice + 1}
                  total={elegidos.length}
                  onQuitar={() => setPorQuitar(c)}
                  onMover={(direccion) => {
                    const siguiente = [...contenidos]
                    const destino = indice + direccion
                    if (destino < 0 || destino >= siguiente.length) return
                    ;[siguiente[indice], siguiente[destino]] = [siguiente[destino], siguiente[indice]]
                    onCambio(siguiente)
                  }}
                />
              ))}
            </Sortable>
          ) : (
            // El vacío del sistema, con su ilustración glass, y no un `Empty` armado a mano con un icono de línea.
            <PrimeraVez
              icono="glass-discovery"
              titulo="Agrega contenidos a tu ruta"
              descripcion="Busca cursos y otros formatos del catálogo para armar el recorrido. La duración de la ruta se calcula sola con lo que agregues."
              accion={{ texto: 'Agregar contenidos', icono: Add01Icon, onClick: () => onPanel(true) }}
            />
          )}
        </FramePanel>
      </Frame>

      <DialogoConfirmar
        abierto={porQuitar !== null}
        onAbiertoChange={(abierto) => !abierto && setPorQuitar(null)}
        icono={Delete02Icon}
        titulo="¿Quitar el contenido de la ruta?"
        descripcion="Deja de formar parte del recorrido. El contenido sigue en el catálogo y lo puedes volver a agregar cuando quieras."
        accion="Quitar de la ruta"
        destructiva
        onConfirmar={() => {
          if (porQuitar) quitar(porQuitar.id)
          setPorQuitar(null)
        }}
      >
        {/* Cuál, en el cuerpo y no en el título: el título dice qué es la ventana (acuerdo del 6-oct). */}
        {porQuitar ? (
          <RegistroConfirmar
            nombre={porQuitar.titulo}
            detalle={`${porQuitar.tipo} · paso ${contenidos.indexOf(porQuitar.id) + 1} de ${elegidos.length}`}
            tono="neutro"
          />
        ) : null}
      </DialogoConfirmar>

      <DrawerElegirContenidos
        abierto={panelAbierto}
        yaEnLaRuta={contenidos}
        onCerrar={() => onPanel(false)}
        onAgregar={(nuevos) => {
          // Se suman al final, en el orden en que aparecen en el catálogo: el creador reordena después arrastrando.
          onCambio([...contenidos, ...nuevos])
          onPanel(false)
        }}
      />
    </div>
  )
}

/**
 * Una fila de la ruta: la tarjeta acostada **con todo dentro** —el asidero, el número del escalón y el menú—.
 *
 * Hasta el 5-oct el asidero y el menú iban fuera, haciendo pareja a los lados; se metieron dentro para que la fila
 * de la ruta se lea como una sola pieza y no como una tarjeta con controles pegados (Dave, 5-oct).
 */
function Fila({
  contenido,
  posicion,
  total,
  onQuitar,
  onMover,
}: {
  contenido: Elegible
  posicion: number
  total: number
  onQuitar: () => void
  onMover: (direccion: -1 | 1) => void
}) {
  return (
    <SortableItem value={contenido.id} role="listitem" className="min-w-0">
      <TarjetaContenido
        {...comoTarjeta(contenido)}
        orientacion="horizontal"
        // Aquí ya no importa de dónde salió —eso se decide al elegirlo, en el panel—, sino **a quién le llega**:
        // una ruta con un escalón privado no le llega igual a todo el mundo, y eso hay que verlo armándola
        // (Dave, 2-oct).
        visibilidad={contenido.visibilidad}
        visibilidadColor={contenido.visibilidad === 'Privado' ? 'info-light' : 'success-light'}
        asa={
          <SortableItemHandle aria-label={`Arrastrar ${contenido.titulo} para reordenar`} className="flex cursor-grab items-center text-muted-foreground">
            <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
          </SortableItemHandle>
        }
        // El número dice en qué escalón va: con navegación lineal es el orden en que se desbloquea (RN-03, RN-05).
        posicion={posicion}
        acciones={
          <DropdownMenu>
            <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Opciones de ${contenido.titulo}`} />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Mover de a un paso, como el menú de una página en el índice de Crear contenido: es la vía de
                  teclado y la que no depende del pulso (Dave, 5-oct). */}
              <DropdownMenuGroup>
                {posicion > 1 ? (
                  <DropdownMenuItem onClick={() => onMover(-1)}>
                    <HugeiconsIcon icon={ArrowUp01Icon} size={16} aria-hidden="true" />
                    Mover arriba
                  </DropdownMenuItem>
                ) : null}
                {posicion < total ? (
                  <DropdownMenuItem onClick={() => onMover(1)}>
                    <HugeiconsIcon icon={ArrowDown01Icon} size={16} aria-hidden="true" />
                    Mover abajo
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
              {posicion > 1 || posicion < total ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem variant="destructive" onClick={onQuitar}>
                <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                Quitar de la ruta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <span className="sr-only">
        Contenido {posicion} de {total}
      </span>
    </SortableItem>
  )
}

// ── Elegir contenidos ────────────────────────────────────────────────────────────────────────────────────────────
//
// Dentro de un panel **no se abre un modal** —modal sobre drawer es mala práctica—, así que los filtros van **por
// columna**, en el embudo de cada encabezado, como en Contenidos y en el panel de colaboradores de este mismo
// asistente.
//
// **Solo tabla**, sin cambio de vista: en un panel la cuadrícula queda apretada, y aquí no se hojea un catálogo sino
// que se comparan candidatos para una lista, que es lo que las columnas hacen bien.
//
// Va con la `TablaSeleccion` de Planes de formación, la tabla del sistema con casillas, buscador, filtros por columna
// y «Seleccionados (N)», la misma del panel de colaboradores (decisiones 1 y 2 de la auditoría, 5-oct: MarcoTabla se
// retiró). La librería **no deja arrancar con columnas ocultas**, así que las once arrancan visibles; se acepta, y
// «Personalizar columnas» esconde las que sobren. Antes la mitad empezaba escondida (Dave, 2-oct).
//
// El **origen** —de mi empresa o de UBITS— es el filtro que manda: es lo primero que se pregunta quien arma la ruta,
// y en el catálogo de UBITS está la mayor parte de lo disponible.

type PropsDrawer = {
  abierto: boolean
  /** Lo que ya está en la ruta: no se ofrece dos veces. */
  yaEnLaRuta: string[]
  onCerrar: () => void
  onAgregar: (ids: string[]) => void
}

const texto = (valor: string) => (
  <Text as="span" size="sm" className="block truncate">
    {valor}
  </Text>
)

/**
 * Un dato que **no corresponde** a esa fila: la habilidad, el aliado, los expertos y el nivel de inglés son campos
 * del Creator interno de UBITS, así que en un contenido que creó la empresa no es que falten, es que no existen.
 *
 * En el proyecto hay dos tratamientos y no son intercambiables: la **raya em** es para un dato que podría estar y no
 * está (el último progreso de alguien, su líder), y **«No aplica»** para lo que no corresponde —el certificado de un
 * curso que no entrega, la fecha de un diagnóstico que no se programa—. Este es el segundo caso, y se pinta como en
 * la Zona de estudio: texto apagado, sin insignia, que con tantas filas sería ruido (Dave, 2-oct).
 */
const noAplica = (
  <Text as="span" size="sm" variant="muted" className="block truncate">
    No aplica
  </Text>
)

/** El valor, o «No aplica» si ese campo no existe para esta fila. */
const dato = (valor: string) => (valor ? texto(valor) : noAplica)

type Columnas = DataGridListConfig<Elegible>['columns']

// El orden de las columnas: las cinco primeras bastan para elegir; las demás están para quien las necesite (Dave,
// 2-oct). Fuera del componente: si no, el filtro de una columna se cierra al marcar (trampa de DataGridList).
const COLUMNAS: Columnas = [
  {
    accessorKey: 'titulo',
    header: 'Contenido',
    size: 300,
    cell: ({ row }) => (
      <CeldaTitulo
        titulo={row.original.titulo}
        // En dos líneas, no recortado: es el mismo título a dos líneas de las tarjetas del modal de video, y en el
        // panel el nombre entero es lo que se compara (Dave, 6-oct).
        dosLineas
        imagen={row.original.imagen}
        sinImagen={<HugeiconsIcon icon={Layers01Icon} size={16} aria-hidden="true" />}
        // Bajo el título, a quién le llega: de la empresa se eligen los publicados y los privados; de UBITS, todo lo
        // suyo, que es público.
        detalle={
          <Badge variant={row.original.visibilidad === 'Privado' ? 'info-light' : 'success-light'} size="xs" className="font-normal">
            {row.original.visibilidad}
          </Badge>
        }
      />
    ),
  },
  {
    accessorKey: 'origen',
    header: 'Origen',
    size: 130,
    // Los dos en insignia, no uno en insignia y otro en texto suelto: así la columna se lee pareja.
    cell: ({ row }) => (
      <Badge variant="outline" size="xs">
        {ORIGENES[row.original.origen]}
      </Badge>
    ),
  },
  { accessorKey: 'tipo', header: 'Tipo de contenido', size: 150, cell: ({ row }) => texto(row.original.tipo) },
  // Dos nombres para lo mismo: categoría en lo de la empresa, competencia en lo de UBITS.
  { accessorKey: 'categoria', header: 'Competencia / Categoría', size: 190, cell: ({ row }) => texto(row.original.categoria) },
  { accessorKey: 'nivel', header: 'Nivel', size: 120, cell: ({ row }) => texto(row.original.nivel) },
  { accessorKey: 'habilidad', header: 'Habilidad', size: 170, cell: ({ row }) => dato(row.original.habilidad) },
  { accessorKey: 'aliado', header: 'Aliado', size: 150, cell: ({ row }) => dato(row.original.aliado) },
  { accessorKey: 'minutos', header: 'Duración', size: 110, cell: ({ row }) => texto(textoMinutos(row.original.minutos)) },
  { accessorKey: 'idioma', header: 'Idioma', size: 110, cell: ({ row }) => texto(row.original.idioma) },
  {
    accessorKey: 'expertos',
    header: 'Expertos',
    size: 200,
    enableSorting: false,
    // Uno debajo de otro: son nombre y cargo, y en una línea se leían como una frase sola.
    cell: ({ row }) =>
      row.original.expertos.length ? (
        <div className="flex min-w-0 flex-col">
          {row.original.expertos.map((experto) => (
            <Text key={experto} as="span" size="sm" className="truncate">
              {experto}
            </Text>
          ))}
        </div>
      ) : (
        noAplica
      ),
  },
  // Un contenido en español tampoco lo lleva, aunque sea de UBITS: ahí no es que falte, es que no viene al caso.
  { accessorKey: 'nivelIngles', header: 'Nivel de inglés', size: 140, cell: ({ row }) => dato(row.original.nivelIngles) },
]

const opciones = (valores: readonly string[]) => valores.map((valor) => ({ label: valor, value: valor }))

// Los filtros, cada uno en el encabezado de su columna. El origen se filtra por su nombre («De mi empresa», «UBITS»),
// que es lo que compara `coincideElegible`.
const FILTROS: DataGridListConfig<Elegible>['columnFilters'] = [
  { id: 'origen', label: 'Origen', type: 'select', multiple: true, options: opciones([ORIGENES.empresa, ORIGENES.ubits]) },
  { id: 'tipo', label: 'Tipo de contenido', type: 'select', multiple: true, options: opciones(TIPOS_ELEGIBLES) },
  { id: 'categoria', label: 'Competencia / Categoría', type: 'select', multiple: true, options: opciones(CLASIFICACIONES) },
  { id: 'nivel', label: 'Nivel', type: 'select', multiple: true, options: opciones(NIVELES_ELEGIBLES) },
  { id: 'habilidad', label: 'Habilidad', type: 'select', multiple: true, options: opciones(HABILIDADES_ELEGIBLES) },
  { id: 'aliado', label: 'Aliado', type: 'select', multiple: true, options: opciones(ALIADOS_ELEGIBLES) },
  { id: 'idioma', label: 'Idioma', type: 'select', multiple: true, options: opciones(IDIOMAS_ELEGIBLES) },
  { id: 'nivelIngles', label: 'Nivel de inglés', type: 'select', multiple: true, options: opciones(INGLES_ELEGIBLES) },
]

function DrawerElegirContenidos({ abierto, yaEnLaRuta, onCerrar, onAgregar }: PropsDrawer) {
  const [marcados, setMarcados] = useState<string[]>([])
  // Cada apertura monta la tabla de nuevo: sin búsqueda, sin filtros y sin nada elegido.
  const [vez, setVez] = useState(0)

  useEffect(() => {
    if (!abierto) return
    setMarcados([])
    setVez((v) => v + 1)
  }, [abierto])

  // Lo que ya está en la ruta no se ofrece: no se puede agregar dos veces, y verlo apagado ocupa sitio en una lista de cien.
  const disponibles = useMemo(() => ELEGIBLES_RUTA.filter((c) => !yaEnLaRuta.includes(c.id)), [yaEnLaRuta])

  const cuantos = marcados.length

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(v) => !v && onCerrar()}
      size="xl"
      icon={Layers01Icon}
      title="Agregar contenidos"
      description="Selecciona los contenidos que quieres agregar a esta ruta."
      // 13-oct (I-041): con algo marcado, no se cierra al tocar fuera y pregunta antes de descartar.
      conCambios={cuantos > 0}
      footer={
        <>
          <BotonCancelarPanel alCerrar={onCerrar} />
          {/* Deshabilitado hasta que haya algo elegido, y diciendo cuántos: el número evita abrir y cerrar para contar. */}
          <Button disabled={!cuantos} onClick={() => onAgregar(marcados)}>
            {cuantos ? `Agregar ${cuantos.toLocaleString('es-CO')} ${plural(cuantos, 'contenido', 'contenidos')}` : 'Agregar'}
          </Button>
        </>
      }
    >
      {/* Trae la casilla por fila, el buscador, los filtros por columna y «Seleccionados (N)» para repasar lo elegido
          sin ir buscándolo, como en Planes de formación (Dave, 2-oct). */}
      {/* Sin el asidero que reordena columnas: aquí se viene a marcar contenidos, no a acomodar la tabla, y el
          orden que se elija no se guarda en ninguna parte (Dave, 13-oct). Ordenar y filtrar siguen. */}
      <TablaSeleccion
        key={vez}
        id="elegir-contenidos-ruta"
        titulo="Lista de contenidos"
        sustantivo={['contenido', 'contenidos']}
        filas={disponibles}
        columnas={COLUMNAS}
        filtros={FILTROS}
        layout={{ reorderable: false }}
        coincide={coincideElegible}
        buscar="Buscar contenidos"
        marcados={marcados}
        onCambio={setMarcados}
      />
    </DrawerShell>
  )
}
