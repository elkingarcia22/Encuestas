import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Cancel01Icon, PlusSignIcon, Search01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SinResultados } from '@/shared/components/SinResultados'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { notify } from '@/shared/components/notify'
import { PiePaginacion, usePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'
import { plural } from '@/modules/design-system/patrones/formato'
import { Marco } from '@/modules/design-system/patrones/ficha'
import { CATALOGO_COMPETENCIAS, CONTENIDOS, competenciaDe, contenidoDe, duracionTexto, fichaDe } from './catalogo'
import { MAXIMO_COMPETENCIAS, TIPOS, miembrosDe, type Asignacion, type TipoPlan } from './planes-datos'

// Paso 3 · Qué ven. Arriba, TODAS las asignaciones lado a lado («Qué ve cada asignación»): cada tarjeta con su lista de
// contenidos en orden, quitar con «x» y la duración total. La activa (borde azul y «Agregando aquí») es la que recibe lo
// que se toca en el catálogo; tocar otra tarjeta la vuelve activa. Abajo, el catálogo en tarjetas: tocar una la suma o la
// quita de la activa, sus insignias dicen qué asignaciones ya la tienen y «Agregar a…» la reparte en varias de una vez.
// Así se ve de un vistazo qué ve cada grupo y qué comparten, sin ir y volver entre asignaciones.

const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`
const minutosDe = (items: string[]) => items.reduce((suma, titulo) => suma + (contenidoDe(titulo)?.minutos ?? 0), 0)

// Semanas entre las fechas del plan (al menos una), para decir cuánto toma por semana.
export function semanasEntre(inicio?: Date, fin?: Date) {
  if (!inicio || !fin) return null
  return Math.max(1, Math.round(((fin.getTime() - inicio.getTime()) / 86_400_000 + 1) / 7))
}

export function PasoQueVen({
  tipo,
  horas,
  inicio,
  fin,
  asignaciones,
  activa,
  conErrores,
  onActiva,
  onCambio,
  onOtra,
  onQuienes,
}: {
  tipo: TipoPlan
  horas: number
  inicio?: Date
  fin?: Date
  asignaciones: Asignacion[]
  activa: string
  conErrores: boolean
  onActiva: (id: string) => void
  onCambio: (asignaciones: Asignacion[]) => void
  onOtra: () => void
  onQuienes: (id: string) => void
}) {
  const textos = TIPOS[tipo]
  const competencias = tipo === 'competencias'
  const semanas = semanasEntre(inicio, fin)
  const numeroDe = (id: string) => asignaciones.findIndex((a) => a.id === id) + 1

  // Sumar o quitar un ítem de una asignación. En competencias, una asignación llena (RN-03: máximo 8) no recibe más.
  const conItem = (asignacion: Asignacion, titulo: string, tener: boolean): Asignacion | null => {
    const tiene = asignacion.items.includes(titulo)
    if (tiene === tener) return asignacion
    if (tener && competencias && asignacion.items.length >= MAXIMO_COMPETENCIAS) return null
    return { ...asignacion, items: tener ? [...asignacion.items, titulo] : asignacion.items.filter((t) => t !== titulo) }
  }
  const aplicar = (titulo: string, ids: string[], tener: boolean) => {
    const llenas: number[] = []
    onCambio(
      asignaciones.map((a) => {
        if (!ids.includes(a.id)) return a
        const siguiente = conItem(a, titulo, tener)
        if (siguiente) return siguiente
        llenas.push(numeroDe(a.id))
        return a
      }),
    )
    if (!llenas.length) return
    const cuales = llenas.map((x) => `Asignación ${x}`).join(', ')
    const detalle = `${cuales} ya ${plural(llenas.length, 'tiene', 'tienen')} ${MAXIMO_COMPETENCIAS}. Quita una para sumar otra.`
    notify(`Máximo ${MAXIMO_COMPETENCIAS} competencias por asignación`, detalle, 'warning')
  }
  const alternarEnActiva = (titulo: string) => {
    const actual = asignaciones.find((a) => a.id === activa)
    if (actual) aplicar(titulo, [activa], !actual.items.includes(titulo))
  }
  const copiarDe = (destino: string, origen: Asignacion) => onCambio(asignaciones.map((a) => (a.id === destino ? { ...a, items: [...origen.items], habilidades: origen.habilidades } : a)))

  return (
    <div className="flex flex-col gap-4">
      <Marco
        titulo="Qué ve cada asignación"
        descripcion="Toca una tarjeta para elegir a cuál le agregas. Lo que marques en el catálogo entra a la que dice «Agregando aquí», en ese orden."
        accion={
          <Button variant="outline" size="sm" className="shrink-0" onClick={onOtra}>
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
            Otra asignación
          </Button>
        }
      >
        {/* Las tarjetas van sobre el gris del marco, sin otra caja blanca alrededor (como los contenedores de Participantes). */}
        <div className="grid gap-3 px-(--frame-panel-header-px) pb-(--frame-panel-header-py) [grid-template-columns:repeat(auto-fill,minmax(18.75rem,1fr))]">
          {asignaciones.map((asignacion, indice) => (
            <TarjetaAsignacion
              key={asignacion.id}
              asignacion={asignacion}
              numero={indice + 1}
              tipo={tipo}
              horas={horas}
              semanas={semanas}
              activa={asignacion.id === activa}
              conErrores={conErrores}
              otras={asignaciones.filter((a) => a.id !== asignacion.id)}
              numeroDe={numeroDe}
              onActiva={() => onActiva(asignacion.id)}
              onQuitar={(titulo) => aplicar(titulo, [asignacion.id], false)}
              onCopiar={(origen) => copiarDe(asignacion.id, origen)}
              onQuienes={() => onQuienes(asignacion.id)}
            />
          ))}
        </div>
      </Marco>

      <Catalogo tipo={tipo} asignaciones={asignaciones} activa={activa} numeroDe={numeroDe} onAlternar={alternarEnActiva} onAplicar={aplicar} textos={textos} />
    </div>
  )
}

function TarjetaAsignacion({
  asignacion,
  numero,
  tipo,
  horas,
  semanas,
  activa,
  conErrores,
  otras,
  numeroDe,
  onActiva,
  onQuitar,
  onCopiar,
  onQuienes,
}: {
  asignacion: Asignacion
  numero: number
  tipo: TipoPlan
  horas: number
  semanas: number | null
  activa: boolean
  conErrores: boolean
  otras: Asignacion[]
  numeroDe: (id: string) => number
  onActiva: () => void
  onQuitar: (titulo: string) => void
  onCopiar: (origen: Asignacion) => void
  onQuienes: () => void
}) {
  const textos = TIPOS[tipo]
  const competencias = tipo === 'competencias'
  const cuantas = miembrosDe(asignacion).length
  const minutos = minutosDe(asignacion.items)
  const conItems = otras.find((a) => a.items.length)
  const sinItems = asignacion.items.length === 0

  return (
    // Toda la tarjeta la vuelve activa al tocarla; «Agregar aquí» hace lo mismo con el teclado. La activa lleva el contorno
    // azul (el color primario del tema) en su envoltorio: el anillo propio de la Card no se deja cambiar con una clase.
    <div className={cn('rounded-xl', activa && SELECCIONADA)}>
    <Card size="sm" className="h-full cursor-pointer" onClick={activa ? undefined : onActiva}>
      <CardHeader>
        <CardTitle className="truncate">{asignacion.nombre?.trim() || `Asignación ${numero}`}</CardTitle>
        <CardDescription className="tabular-nums">
          Asignación {numero} · {cuantas ? personas(cuantas) : 'Sin personas'}
        </CardDescription>
        <CardAction>
          {activa ? (
            <Badge variant="info-light" size="sm">
              Agregando aquí
            </Badge>
          ) : (
            <Button variant="outline" size="xs" onClick={onActiva}>
              Agregar aquí
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sinItems ? (
          <div className="flex flex-col items-start gap-1">
            <Text as="p" size="sm" variant={conErrores && cuantas ? 'destructive' : 'muted'} role={conErrores && cuantas ? 'alert' : undefined}>
              {activa ? `Todavía no ve nada. Marca ${textos.items} en el catálogo de abajo.` : `Todavía no ve nada. Toca la tarjeta para agregarle ${textos.items}.`}
            </Text>
            {conItems ? (
              <Button
                variant="link"
                size="xs"
                onClick={(evento) => {
                  evento.stopPropagation()
                  onCopiar(conItems)
                }}
              >
                Copiar los de Asignación {numeroDe(conItems.id)}
              </Button>
            ) : null}
          </div>
        ) : (
          <ol className="-mx-2 flex flex-col">
            {asignacion.items.map((titulo, indice) => {
              const contenido = contenidoDe(titulo)
              const habilidades = competenciaDe(titulo)?.habilidades.length ?? 0
              const tambien = otras.filter((a) => a.items.includes(titulo)).map((a) => `Asignación ${numeroDe(a.id)}`)
              const detalle = [
                competencias ? `${habilidades} ${plural(habilidades, 'habilidad', 'habilidades')} · ${horas} h` : contenido ? `${contenido.tipo} · ${duracionTexto(contenido.minutos)}` : 'Contenido',
                tambien.length ? `también en ${tambien.join(' y ')}` : '',
              ]
                .filter(Boolean)
                .join(' · ')
              return (
                <li key={titulo}>
                  <Item size="xs">
                    <ItemContent className="min-w-0">
                      <ItemTitle className="w-full">
                        <span className="truncate">
                          <span className="tabular-nums text-muted-foreground">{indice + 1}.</span> {titulo}
                        </span>
                      </ItemTitle>
                      <ItemDescription className="truncate">{detalle}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <BotonIcono
                        size="icon-xs"
                        aria-label={`Quitar ${titulo} de la asignación ${numero}`}
                        onClick={(evento) => {
                          evento.stopPropagation()
                          onQuitar(titulo)
                        }}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                      </BotonIcono>
                    </ItemActions>
                  </Item>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <Text as="span" size="xs" variant="muted" className="tabular-nums">
          {competencias
            ? `${asignacion.items.length} de ${MAXIMO_COMPETENCIAS} competencias · ${horas} ${plural(horas, 'hora', 'horas')} cada una`
            : sinItems
              ? '0 contenidos'
              : `${n(asignacion.items.length)} ${plural(asignacion.items.length, 'contenido', 'contenidos')} · ${duracionTexto(minutos)}${semanas && minutos ? ` · a unas ${duracionTexto(Math.round(minutos / semanas))} por semana` : ''}`}
        </Text>
        <Button
          variant="link"
          size="xs"
          onClick={(evento) => {
            evento.stopPropagation()
            onQuienes()
          }}
        >
          {cuantas ? 'Cambiar a quiénes' : 'Elegir a quiénes'}
        </Button>
      </CardFooter>
    </Card>
    </div>
  )
}

// Lo elegido (la asignación activa, o un contenido que ya está en ella): contorno primario del tema alrededor de la tarjeta,
// en su envoltorio. Las tarjetas de la librería traen su propio anillo y una clase suelta no le gana.
const SELECCIONADA = 'outline-2 outline-offset-2 outline-primary'

// El catálogo en tarjetas (la tarjeta de contenido del equipo). Tocar una la suma o la quita de la asignación activa.
function Catalogo({
  tipo,
  asignaciones,
  activa,
  numeroDe,
  onAlternar,
  onAplicar,
  textos,
}: {
  tipo: TipoPlan
  asignaciones: Asignacion[]
  activa: string
  numeroDe: (id: string) => number
  onAlternar: (titulo: string) => void
  onAplicar: (titulo: string, ids: string[], tener: boolean) => void
  textos: (typeof TIPOS)[TipoPlan]
}) {
  const competencias = tipo === 'competencias'
  const [busqueda, setBusqueda] = useState('')
  const [soloActiva, setSoloActiva] = useState(false)
  const actual = asignaciones.find((a) => a.id === activa)
  const enActiva = actual?.items ?? []
  if (soloActiva && !enActiva.length) setSoloActiva(false)
  const q = busqueda.trim().toLowerCase()
  const filas = competencias
    ? CATALOGO_COMPETENCIAS.map((c) => ({ id: c.titulo, buscar: `${c.titulo} ${c.habilidades.join(' ')}` }))
    : CONTENIDOS.map((c) => ({ id: c.titulo, buscar: `${c.titulo} ${c.autor} ${c.tipo}` }))
  const resultado = filas.filter((f) => (!soloActiva || enActiva.includes(f.id)) && (!q || f.buscar.toLowerCase().includes(q)))
  const paginacion = usePaginacion(resultado, 20)
  const nombreActiva = actual?.nombre?.trim() || `Asignación ${numeroDe(activa)}`

  return (
    <Marco
      titulo={competencias ? 'Catálogo de competencias' : 'Catálogo de contenidos'}
      descripcion={`Toca ${competencias ? 'una competencia' : 'un contenido'} para sumarlo a «${nombreActiva}» o quitarlo. Con «Agregar a…» lo repartes en varias asignaciones.`}
    >
      <div className="flex flex-col gap-4 px-(--frame-panel-header-px) pb-(--frame-panel-header-py)">
        <div className="flex flex-wrap items-center gap-2">
          {/* «bg-background!», la forzada de ListaElegible: sobre el gris del marco el fondo del tema se pierde y el campo no se ve. */}
          <InputGroup className="min-w-56 flex-1 bg-background!">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value)
                paginacion.alFiltrar()
              }}
              placeholder={competencias ? 'Buscar competencia o habilidad' : 'Buscar por título, autor o tipo'}
              aria-label={competencias ? 'Buscar competencias' : 'Buscar contenidos'}
            />
          </InputGroup>
          <Button
            variant={soloActiva ? 'secondary' : 'outline'}
            aria-pressed={soloActiva}
            disabled={!soloActiva && !enActiva.length}
            onClick={() => {
              setSoloActiva(!soloActiva)
              paginacion.alFiltrar()
            }}
          >
            {soloActiva ? `Ver todo el catálogo` : `Ver los de esta asignación (${enActiva.length})`}
          </Button>
        </div>

        {resultado.length ? (
          <>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(14rem,1fr))]">
              {paginacion.filas.map((fila) => {
                const tienen = asignaciones.filter((a) => a.items.includes(fila.id))
                const enEsta = enActiva.includes(fila.id)
                return (
                  <div key={fila.id} className={cn('rounded-xl', enEsta && SELECCIONADA)}>
                  <TarjetaContenido
                    {...fichaDe(tipo, fila.id)}
                    className="h-full"
                    onClick={() => onAlternar(fila.id)}
                    // Qué asignaciones ya lo tienen, sobre la portada: insignias sólidas, que se leen sobre cualquier foto.
                    encimaIzquierda={
                      tienen.length ? (
                        <div className="flex flex-wrap gap-1">
                          {tienen.map((a) => (
                            <Badge key={a.id} variant="success" size="xs">
                              <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
                              Asig. {numeroDe(a.id)}
                            </Badge>
                          ))}
                        </div>
                      ) : undefined
                    }
                    acciones={
                      asignaciones.length > 1 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="xs" />}>
                            Agregar a…
                            <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Agregar a</DropdownMenuLabel>
                              {asignaciones.map((a, indice) => (
                                <DropdownMenuCheckboxItem key={a.id} checked={a.items.includes(fila.id)} onCheckedChange={(marcado) => onAplicar(fila.id, [a.id], marcado === true)}>
                                  {a.nombre?.trim() ? `${a.nombre.trim()} (Asignación ${indice + 1})` : `Asignación ${indice + 1}`}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                disabled={tienen.length === asignaciones.length}
                                onClick={() =>
                                  onAplicar(
                                    fila.id,
                                    asignaciones.map((a) => a.id),
                                    true,
                                  )
                                }
                              >
                                A todas las asignaciones
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : undefined
                    }
                  />
                  </div>
                )
              })}
            </div>
            <PiePaginacion estado={paginacion} nombre={textos.items} id={`catalogo-crear-${tipo}`} />
          </>
        ) : (
          <SinResultados
            busqueda={busqueda}
            filtrosActivos={soloActiva ? 1 : 0}
            onLimpiar={() => {
              setBusqueda('')
              setSoloActiva(false)
            }}
          />
        )}
      </div>
    </Marco>
  )
}
