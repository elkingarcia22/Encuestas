import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, GridViewIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  FramePanel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { FILA_CLICABLE, FilasSeparadas, MarcoLista } from '../../../encuestas/components/marco-lista'
import { CATEGORIAS, PLANTILLAS_CICLO, categoriaDe, type PlantillaCiclo } from '../../modelo/plantillas'
import { DetallePlantilla, IconoPlantilla, ResumenPlantilla } from './detalle-plantilla'
import { SinResultados } from '@/shared/components/SinResultados'

// «Crear con plantilla»: el mismo panel que el catálogo de Encuestas. Bajo la cabecera quedan fijos el buscador y el
// filtro por categoría; el cuerpo muestra cada categoría (Negocio, Operación, Personas, Producto y tecnología) en su
// marco, con una fila por plantilla. Abrir una cambia el cuerpo por su ficha sin salir del panel, y «Usar plantilla»
// la lleva a crear el ciclo. El buscador también encuentra una plantilla por cualquiera de sus objetivos.

const plegar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const textoDe = (plantilla: PlantillaCiclo) => [plantilla.nombre, plantilla.descripcion, ...[...plantilla.empresa, ...plantilla.grupo, ...plantilla.individual].map((objetivo) => objetivo.nombre)].join(' ')

const TODAS = 'todas'
const opcionesCategoria = [{ value: TODAS, label: 'Todas las categorías' }, ...CATEGORIAS.map((categoria) => ({ value: categoria.id, label: categoria.nombre }))]

export function CatalogoPlantillas({ abierto, onAbiertoChange, onUsar }: { abierto: boolean; onAbiertoChange: (abierto: boolean) => void; onUsar: (plantilla: PlantillaCiclo) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState(TODAS)
  const [abierta, setAbierta] = useState<PlantillaCiclo | null>(null)
  const inicio = useRef<HTMLDivElement>(null)

  // Cada vez que se abre, empieza en el listado y sin filtros.
  const [abiertoAntes, setAbiertoAntes] = useState(abierto)
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto)
    if (abierto) {
      setAbierta(null)
      setBusqueda('')
      setCategoria(TODAS)
    }
  }

  // Al pasar del listado a una ficha (o de una ficha a otra), el cuerpo vuelve arriba.
  useEffect(() => {
    inicio.current?.scrollIntoView({ block: 'start' })
  }, [abierta])

  const grupos = useMemo(() => {
    const q = plegar(busqueda)
    return CATEGORIAS.filter((grupo) => categoria === TODAS || grupo.id === categoria)
      .map((grupo) => ({ categoria: grupo, plantillas: PLANTILLAS_CICLO.filter((plantilla) => plantilla.categoria === grupo.id && (!q || plegar(textoDe(plantilla)).includes(q))) }))
      .filter((grupo) => grupo.plantillas.length > 0)
  }, [busqueda, categoria])
  const total = grupos.reduce((suma, grupo) => suma + grupo.plantillas.length, 0)

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="lg"
      icon={GridViewIcon}
      media={abierta ? <IconoPlantilla plantilla={abierta} /> : undefined}
      title={abierta ? abierta.nombre : 'Crear con plantilla'}
      description={abierta ? categoriaDe(abierta).nombre : 'Elige una para empezar tu ciclo de objetivos.'}
      navigation={
        abierta ? (
          <div className="flex items-center border-b px-3 py-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => setAbierta(null)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Volver a todas las plantillas
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
              <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre u objetivo…" aria-label="Buscar plantilla" />
            </InputGroup>
            <Select value={categoria} onValueChange={(valor) => setCategoria(String(valor ?? TODAS))} items={opcionesCategoria}>
              <SelectTrigger className="w-full sm:w-52 sm:shrink-0"aria-label="Filtrar por categoría">
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
          <Button onClick={() => onUsar(abierta)}>
            Usar plantilla
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          </Button>
        ) : (
          <Text as="span" variant="muted" size="sm" className="mr-auto">
            {total} {total === 1 ? 'plantilla' : 'plantillas'}
          </Text>
        )
      }
    >
      <div ref={inicio} className="scroll-mt-4" />
      {abierta ? (
        <DetallePlantilla key={abierta.id} plantilla={abierta} onAbrir={setAbierta} />
      ) : (
        <div className="flex flex-col gap-6">
          {grupos.length > 0 ? (
            grupos.map(({ categoria: grupo, plantillas }) => (
              <MarcoLista
                key={grupo.id}
                titulo={
                  <span className="inline-flex items-center gap-2">
                    <HugeiconsIcon icon={grupo.icono} size={16} aria-hidden="true" className="text-muted-foreground" />
                    {grupo.nombre}
                    <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
                      {plantillas.length}
                    </Badge>
                  </span>
                }
                descripcion={grupo.descripcion}
              >
                <FramePanel className="py-1!">
                  <FilasSeparadas>
                    {plantillas.map((plantilla) => (
                      <Item key={plantilla.id} size="sm" render={<button type="button" />} onClick={() => setAbierta(plantilla)} className={FILA_CLICABLE}>
                        <ItemMedia>
                          <IconoPlantilla plantilla={plantilla} />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                          <TextoCompleto texto={plantilla.nombre}>
                            <ItemTitle className="truncate">{plantilla.nombre}</ItemTitle>
                          </TextoCompleto>
                          <TextoCompleto texto={plantilla.descripcion}>
                            <ItemDescription className="line-clamp-2!">{plantilla.descripcion}</ItemDescription>
                          </TextoCompleto>
                        </ItemContent>
                        <ItemActions className="gap-3">
                          <ResumenPlantilla plantilla={plantilla} />
                          <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" aria-hidden="true" />
                        </ItemActions>
                      </Item>
                    ))}
                  </FilasSeparadas>
                </FramePanel>
              </MarcoLista>
            ))
          ) : (
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={categoria === TODAS ? 0 : 1}
              onLimpiar={() => {
                setBusqueda('')
                setCategoria(TODAS)
              }}
            />
          )}
        </div>
      )}
    </DrawerShell>
  )
}
