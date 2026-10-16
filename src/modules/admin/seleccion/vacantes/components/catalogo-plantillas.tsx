import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Copy01Icon, Delete02Icon, Edit02Icon, GridViewIcon, MoreHorizontalIcon, PlusSignIcon, Route01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  IconTile,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify, notifyAction } from '@/shared/components/notify'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { categoriaDe } from './etapas-plantilla'
import { CATALOGO_PLANTILLAS, CATEGORIAS_PLANTILLA, type PlantillaCatalogo } from './datos'
import { DetallePlantilla } from './detalle-plantilla'
import { creacionDesdePlantilla } from '../../propuestas/desde-creacion'
import { noSeGuardo } from '../../propuestas/simular'
import {
  duplicarPlantilla,
  eliminarPlantillaPropia,
  esMia,
  esPropia,
  sembrarPlantilla,
  useCategoriasPropias,
  usePlantillasPropias,
  type PlantillaPropia,
} from './plantillas-propias'

// «Ver todas» en la fila de plantillas abre este catálogo. Bajo la cabecera queda fijo el buscador; el
// cuerpo muestra cada categoría con sus plantillas en lista, con la descripción en una línea. Abrir una cambia el cuerpo por su detalle, sin salir del panel. Usar una del sistema solo
// avisa (maqueta sin backend). Las «Creadas por ti» van en su categoría (una del catálogo o una que la
// persona creó al armarla), primero dentro de ella y con su insignia: son las únicas que se editan o se
// eliminan (menú «⋯»); las del sistema no.
//
// 7 oct: cada propia dice de quién es y solo quien la creó la edita o la elimina; cualquiera se duplica (también las del
// sistema, desde su detalle) para ajustarla (IN-44). Eliminar se deshace desde el aviso y una categoría que se queda sin
// plantillas sale del filtro (IN-48). En la fila, el «⋯» va primero y «1 etapa» en singular (IN-49).

// Una plantilla de una compañera, para que se vea que cada una dice de quién es.
const ORIGEN_EJEMPLO = CATALOGO_PLANTILLAS.find((plantilla) => plantilla.id === 'representante-de-ventas')
const DE_EJEMPLO = ORIGEN_EJEMPLO ? creacionDesdePlantilla(ORIGEN_EJEMPLO.id) : undefined
if (ORIGEN_EJEMPLO && DE_EJEMPLO) sembrarPlantilla({ ...DE_EJEMPLO, nombre: 'Representante de ventas Medellín', ciudad: 'Medellín' }, 'Sara Gómez', ORIGEN_EJEMPLO.categoriaId)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsar: (plantilla: PlantillaCatalogo) => void
  // Dónde viven «Crear plantilla» y «Editar»: la lista de Vacantes o una exploración que use esta creación.
  base?: string
}

const TODAS = 'todas'
const plegar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export function CatalogoPlantillas({ open, onOpenChange, onUsar, base = '/admin/seleccion/vacantes' }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [abierta, setAbierta] = useState<PlantillaCatalogo | null>(null)
  const [categoria, setCategoria] = useState(TODAS)
  const inicio = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const propias = usePlantillasPropias()
  const categoriasPropias = useCategoriasPropias()
  const [porEliminar, setPorEliminar] = useState<PlantillaPropia | null>(null)
  const editar = (plantilla: PlantillaPropia) => navigate(`${base}/plantillas/${plantilla.id}/editar`)
  // Una copia a tu nombre, en su categoría, con el aviso para ir a ajustarla.
  const duplicar = (plantilla: PlantillaCatalogo) => {
    const vacante = esPropia(plantilla) ? plantilla.vacante : creacionDesdePlantilla(plantilla.id)
    if (!vacante) return
    if (noSeGuardo(`duplicar-plantilla:${plantilla.id}`, `No pudimos duplicar «${plantilla.nombre}»`, () => duplicar(plantilla))) return
    const id = duplicarPlantilla(plantilla, vacante)
    setAbierta(null)
    notifyAction(`Duplicamos «${plantilla.nombre}»`, 'Es tuya: ajústala antes de usarla.', {
      label: 'Editarla',
      onClick: () => navigate(`${base}/plantillas/${id}/editar`),
    }, 'success')
  }

  // Eliminar se deshace desde el aviso; si no se guarda, sigue en el catálogo y el aviso deja reintentar.
  const eliminarPlantilla = (plantilla: PlantillaPropia) => {
    if (noSeGuardo(`eliminar-plantilla:${plantilla.id}`, `No pudimos eliminar «${plantilla.nombre}»`, () => eliminarPlantilla(plantilla), 'Sigue en el catálogo.')) return
    const deshacer = eliminarPlantillaPropia(plantilla.id)
    notifyAction(`Eliminamos la plantilla «${plantilla.nombre}»`, undefined, {
      label: 'Deshacer',
      onClick: () => {
        deshacer()
        notify(`«${plantilla.nombre}» está de vuelta en el catálogo`, undefined, 'success')
      },
    }, 'success')
  }

  // Cada vez que se abre el panel arranca en el listado, aunque se haya cerrado desde un detalle.
  const [abiertoAntes, setAbiertoAntes] = useState(open)
  if (open !== abiertoAntes) {
    setAbiertoAntes(open)
    if (open) {
      setAbierta(null)
      setCategoria(TODAS)
    }
  }

  // Al pasar del listado al detalle (o entre plantillas relacionadas) el cuerpo vuelve arriba.
  useEffect(() => {
    inicio.current?.scrollIntoView({ block: 'start' })
  }, [abierta])

  // El buscador mira solo el nombre, sin tildes ni mayúsculas; la categoría se elige aparte, en el desplegable.
  const q = plegar(busqueda)
  // Una categoría sin plantillas no se ofrece en el filtro (la que quedó vacía al eliminar la única, IN-48).
  const conPlantillas = new Set([...propias, ...CATALOGO_PLANTILLAS].map((plantilla) => plantilla.categoriaId))
  const categorias = [...CATEGORIAS_PLANTILLA, ...categoriasPropias].filter((item) => conPlantillas.has(item.id))
  const categoriaVista = categoria !== TODAS && !conPlantillas.has(categoria) ? TODAS : categoria
  const opcionesCategoria = [{ value: TODAS, label: 'Todas las categorías' }, ...categorias.map((item) => ({ value: item.id, label: item.nombre }))]

  const grupos = useMemo(
    () =>
      [...CATEGORIAS_PLANTILLA, ...categoriasPropias]
        .filter((item) => categoriaVista === TODAS || item.id === categoriaVista)
        .map((item) => ({
          categoria: item,
          plantillas: [...propias, ...CATALOGO_PLANTILLAS].filter((plantilla) => plantilla.categoriaId === item.id && (!q || plegar(plantilla.nombre).includes(q))),
        }))
        .filter((grupo) => grupo.plantillas.length > 0),
    [q, categoriaVista, propias, categoriasPropias],
  )

  const total = grupos.reduce((suma, grupo) => suma + grupo.plantillas.length, 0)

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      // Con una plantilla abierta, la cabecera es la de la plantilla: su icono, su nombre y su categoría.
      icon={GridViewIcon}
      media={
        abierta ? (
          <IconTile variant="soft" size="sm" className={abierta.tono}>
            <HugeiconsIcon icon={abierta.icono} aria-hidden="true" />
          </IconTile>
        ) : undefined
      }
      title={abierta ? abierta.nombre : 'Crear con plantilla'}
      description={abierta ? `Categoría: ${categoriaDe(abierta)?.nombre ?? 'Sin categoría'}` : 'Elige una plantilla para empezar tu vacante.'}
      // La vuelta al catálogo va en la fila de navegación sobre la cabecera, como el «Volver» del design system (Drawers).
      navigation={
        abierta ? (
          <div className="flex items-center border-b px-3 py-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => setAbierta(null)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Todas las plantillas
            </Button>
          </div>
        ) : undefined
      }
      headerExtra={
        abierta ? undefined : (
          <div className="flex flex-col gap-2 border-b px-5 py-3 sm:flex-row sm:items-center">
            <InputGroup className="sm:flex-1">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre…"
                aria-label="Buscar plantilla"
              />
            </InputGroup>
            <Select value={categoriaVista} onValueChange={(valor) => setCategoria(String(valor ?? TODAS))} items={opcionesCategoria}>
              <SelectTrigger className="w-full sm:w-52 sm:shrink-0" aria-label="Filtrar por categoría">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-max min-w-(--anchor-width)">
                {opcionesCategoria.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
      footer={
        abierta ? (
          <>
            {/* Cualquiera se duplica para ajustarla, también las del sistema (IN-44). */}
            <Button variant="outline" onClick={() => duplicar(abierta)}>
              <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
              Duplicar para ajustarla
            </Button>
            <Button onClick={() => onUsar(abierta)}>
              Usar plantilla
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
            </Button>
          </>
        ) : (
          <>
            <Text as="span" variant="muted" size="sm" className="mr-auto">
              {total} {total === 1 ? 'plantilla' : 'plantillas'}
            </Text>
            <Button onClick={() => navigate(`${base}/plantillas/crear`)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Crear plantilla
            </Button>
          </>
        )
      }
    >
      <div ref={inicio} className="scroll-mt-4" />
      {abierta ? (
        <DetallePlantilla key={abierta.id} plantilla={abierta} onAbrir={setAbierta} />
      ) : (
        <div className="flex flex-col gap-6">
          {grupos.length > 0 ? (
            grupos.map(({ categoria, plantillas }) => (
              <section key={categoria.id} aria-labelledby={`cat-${categoria.id}`} className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Text as="p" id={`cat-${categoria.id}`} weight="semibold" size="sm">
                      {categoria.nombre}
                    </Text>
                    {/* La cuenta en texto, no en insignia: una insignia es un estado, no un número (IN-46). */}
                    <Text as="span" variant="muted" size="sm" className="tabular-nums">
                      {plantillas.length}
                    </Text>
                  </div>
                  <Text as="span" variant="muted" size="xs">
                    {categoria.detalle}
                  </Text>
                </div>

                <ItemGroup className="gap-0! rounded-xl border">
                  {plantillas.map((plantilla, indice) => (
                    <div key={plantilla.id}>
                      {indice > 0 ? <ItemSeparator /> : null}
                      {esPropia(plantilla) ? (
                        // Sus acciones van a la vista (no se anida un menú dentro de un botón); el detalle, con «Ver detalle».
                        <Item className="w-full">
                          <ItemMedia>
                            <IconTile variant="soft" size="sm" className={plantilla.tono}>
                              <HugeiconsIcon icon={plantilla.icono} aria-hidden="true" />
                            </IconTile>
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{plantilla.nombre}</ItemTitle>
                            <ItemDescription className="line-clamp-1">{plantilla.detalle}</ItemDescription>
                          </ItemContent>
                          <ItemActions className="gap-2">
                            <PropiaBadge plantilla={plantilla} />
                            <EtapasBadge etapas={plantilla.etapas} />
                            {/* «⋯» primero de los botones: ⋯ · terciario · secundario (IN-49). */}
                            <AccionesPropia plantilla={plantilla} onEditar={editar} onEliminar={setPorEliminar} onDuplicar={duplicar} />
                            <Button variant="ghost" size="sm" onClick={() => setAbierta(plantilla)}>
                              Ver detalle
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onUsar(plantilla)}>
                              Usar plantilla
                            </Button>
                          </ItemActions>
                        </Item>
                      ) : (
                      <Item
                        render={<button type="button" />}
                        onClick={() => setAbierta(plantilla)}
                        className="w-full text-left hover:bg-muted!"
                      >
                        <ItemMedia>
                          <IconTile variant="soft" size="sm" className={plantilla.tono}>
                            <HugeiconsIcon icon={plantilla.icono} aria-hidden="true" />
                          </IconTile>
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{plantilla.nombre}</ItemTitle>
                          <ItemDescription className="line-clamp-1">{plantilla.detalle}</ItemDescription>
                        </ItemContent>
                        <ItemActions className="gap-3">
                          <EtapasBadge etapas={plantilla.etapas} />
                          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                        </ItemActions>
                      </Item>
                      )}
                    </div>
                  ))}
                </ItemGroup>
              </section>
            ))
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No encontramos plantillas</EmptyTitle>
                <EmptyDescription>{busqueda.trim() ? `Ninguna coincide con «${busqueda.trim()}».` : 'No hay plantillas en esta categoría.'} Prueba con otro nombre u otra categoría.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      )}
      <DialogoConfirmar
        abierto={porEliminar !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setPorEliminar(null))}
        icono={Delete02Icon}
        titulo="¿Eliminar esta plantilla?"
        descripcion={`«${porEliminar?.nombre ?? ''}» sale del catálogo. Las vacantes que ya creaste con ella no cambian.`}
        accion="Eliminar plantilla"
        destructiva
        onConfirmar={() => {
          if (!porEliminar) return
          setPorEliminar(null)
          eliminarPlantilla(porEliminar)
        }}
      />
    </DrawerShell>
  )
}

// El menú «⋯» de una plantilla propia: editarla abre el flujo con todo lleno; eliminarla pide confirmar. Solo quien la
// creó la edita o la elimina; duplicarla, cualquiera.
function AccionesPropia({
  plantilla,
  onEditar,
  onEliminar,
  onDuplicar,
}: {
  plantilla: PlantillaPropia
  onEditar: (plantilla: PlantillaPropia) => void
  onEliminar: (plantilla: PlantillaPropia) => void
  onDuplicar: (plantilla: PlantillaPropia) => void
}) {
  const mia = esMia(plantilla)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Más acciones de «${plantilla.nombre}»`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {mia ? (
          <DropdownMenuItem onClick={() => onEditar(plantilla)}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
            Editar
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => onDuplicar(plantilla)}>
          <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
          {mia ? 'Duplicar' : 'Duplicar para ajustarla'}
        </DropdownMenuItem>
        {mia ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onEliminar(plantilla)}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              Eliminar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// De quién es: «Creada por ti» o el nombre de quien la creó (IN-44).
function PropiaBadge({ plantilla }: { plantilla: PlantillaPropia }) {
  return esMia(plantilla) ? (
    <Badge variant="info-light">
      Creada por ti
    </Badge>
  ) : (
    <Badge variant="secondary">
      De {plantilla.duena}
    </Badge>
  )
}

function EtapasBadge({ etapas }: { etapas: number }) {
  return (
    <Badge variant="secondary">
      <HugeiconsIcon icon={Route01Icon} aria-hidden="true" />
      {etapas} {etapas === 1 ? 'etapa' : 'etapas'}
    </Badge>
  )
}
