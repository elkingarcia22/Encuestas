import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowRight01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { COLLABORATORS, type Collaborator } from '../../../modelo/collaborators'
import { SEGMENT_LABELS, effectiveIndividualIds, formatCount, groupMemberIds, withGroupConvertedToIndividuals, withGroupDeselected } from '../../../modelo/participants'
import type { ParticipantsSelection, SegmentKey } from '../../../modelo/surveyBuilderTypes'
import { Paginacion } from '../../../components/tabla-piezas'
import { Sincronizar } from './sincronizar'

// «Una parte de la empresa»: grupos y colaboradores en una sola lista (antes eran dos pestañas).
//
// Agrupada, cada fila es un grupo con su casilla —marca el grupo entero— y una flecha que lo despliega
// para ver a sus personas y marcar sueltas. «Sin agrupar» muestra el directorio completo, persona por
// persona. El buscador encuentra grupos y personas: si alguien coincide, su grupo se abre solo con ella.
//
// Las reglas son las de siempre: un grupo entra completo, así que sus personas salen marcadas «Por el
// grupo…», y desmarcar a una pregunta si quitar el grupo entero o solo a esa persona.

const SIN_AGRUPAR = 'ninguno'
type Vista = SegmentKey | typeof SIN_AGRUPAR
const SEGMENTOS = (Object.entries(SEGMENT_LABELS) as [SegmentKey, string][]).map(([value, label]) => ({ value, label }))
const VISTAS = [{ value: SIN_AGRUPAR, label: 'Sin agrupar' }, ...SEGMENTOS]
// Cuántas personas de un grupo se ven al desplegarlo; el resto, de a tantas con «Mostrar más».
const TANDA_MIEMBROS = 20

const coincide = (persona: Collaborator, q: string) =>
  `${persona.name} ${persona.username} ${persona.email} ${persona.area} ${persona.leader ?? ''}`.toLowerCase().includes(q)

type Props = {
  seleccion: ParticipantsSelection
  onCambio: (cambio: Partial<ParticipantsSelection>) => void
  // La acción de IA de la fila del buscador («Importar con IA»): va al final, como todo botón de IA.
  accion?: ReactNode
}

export function ParticipantesDirectorio({ seleccion, onCambio, accion }: Props) {
  const [vista, setVista] = useState<Vista>(seleccion.groupSegmentBy)
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [abiertos, setAbiertos] = useState<ReadonlySet<string>>(() => new Set())
  const [limites, setLimites] = useState<Record<string, number>>({})
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [enGrupo, setEnGrupo] = useState<Collaborator | null>(null)

  const q = busqueda.trim().toLowerCase()
  const marcados = effectiveIndividualIds(seleccion)
  const deGrupos = groupMemberIds(seleccion.groupSegmentBy, seleccion.selectedGroups)
  const elegidos = new Set(seleccion.selectedGroups)
  const aMano = new Set(seleccion.selectedIds)
  const grupoDe = (persona: Collaborator) => persona[seleccion.groupSegmentBy] ?? 'Sin asignar'

  const marcar = (ids: readonly string[]) => onCambio({ selectedIds: [...new Set([...seleccion.selectedIds, ...ids])] })
  // Desmarcar en lote solo quita a quienes se eligieron a mano: los de un grupo siguen hasta que se quite el grupo.
  const desmarcar = (ids: readonly string[]) => {
    const fuera = new Set(ids)
    onCambio({ selectedIds: seleccion.selectedIds.filter((id) => !fuera.has(id)) })
  }
  const alternarPersona = (persona: Collaborator) => {
    if (!marcados.has(persona.id)) return marcar([persona.id])
    if (deGrupos.has(persona.id)) return setEnGrupo(persona)
    desmarcar([persona.id])
  }
  const alternarGrupo = (grupo: string) =>
    onCambio({ selectedGroups: elegidos.has(grupo) ? seleccion.selectedGroups.filter((otro) => otro !== grupo) : [...seleccion.selectedGroups, grupo] })

  // Pasar a otra categoría descarta los grupos elegidos (un área no es un líder), y se dice. «Sin agrupar»
  // es solo otra forma de mirar: no toca nada.
  const cambiarVista = (siguiente: Vista) => {
    setVista(siguiente)
    setActual(1)
    setAbiertos(new Set())
    if (siguiente === SIN_AGRUPAR || siguiente === seleccion.groupSegmentBy) return
    if (seleccion.selectedGroups.length) {
      notify(
        `Quitamos ${seleccion.selectedGroups.length === 1 ? 'el grupo elegido' : `los ${seleccion.selectedGroups.length} grupos elegidos`} por ${SEGMENT_LABELS[seleccion.groupSegmentBy].toLowerCase()}`,
        'Los grupos son de una sola categoría a la vez. Las personas elegidas a mano se quedan.',
      )
    }
    onCambio({ groupSegmentBy: siguiente, selectedGroups: [] })
  }

  const cambiarBusqueda = (valor: string) => {
    setBusqueda(valor)
    setActual(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="min-w-56 flex-1">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={busqueda}
              onChange={(evento) => cambiarBusqueda(evento.target.value)}
              placeholder={vista === SIN_AGRUPAR ? 'Busca por nombre, usuario, correo, área o líder' : 'Busca un grupo o una persona'}
              aria-label="Buscar grupos o personas"
            />
          </InputGroup>
          {accion}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Field orientation="horizontal" className="w-auto!">
            <FieldLabel htmlFor="directorio-agrupar">Agrupar por</FieldLabel>
            <Select value={vista} onValueChange={(valor) => cambiarVista(valor as Vista)} items={VISTAS}>
              <SelectTrigger id="directorio-agrupar" className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTOS.map((segmento) => (
                  <SelectItem key={segmento.value} value={segmento.value}>
                    {segmento.label}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={SIN_AGRUPAR}>Sin agrupar (persona por persona)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button
            variant={soloElegidos ? 'secondary' : 'outline'}
            size="sm"
            aria-pressed={soloElegidos}
            onClick={() => {
              setSoloElegidos(!soloElegidos)
              setActual(1)
            }}
          >
            Ver seleccionados ({formatCount(marcados.size)})
          </Button>
        </div>
      </div>

      {vista === SIN_AGRUPAR ? (
        <ListaPersonas
          q={q}
          busqueda={busqueda}
          soloElegidos={soloElegidos}
          marcados={marcados}
          deGrupos={deGrupos}
          grupoDe={grupoDe}
          actual={actual}
          porPagina={porPagina}
          onPagina={setActual}
          onPorPagina={(valor) => {
            setPorPagina(valor)
            setActual(1)
          }}
          onAlternar={alternarPersona}
          onMarcar={marcar}
          onDesmarcar={desmarcar}
          onDesmarcarTodo={() => onCambio({ selectedIds: [] })}
        />
      ) : (
        <ListaGrupos
          segmento={vista}
          q={q}
          soloElegidos={soloElegidos}
          elegidos={elegidos}
          aMano={aMano}
          marcados={marcados}
          deGrupos={deGrupos}
          abiertos={abiertos}
          limites={limites}
          actual={actual}
          porPagina={porPagina}
          onPagina={setActual}
          onPorPagina={(valor) => {
            setPorPagina(valor)
            setActual(1)
          }}
          onAbrir={(grupo) =>
            setAbiertos((previos) => {
              const siguientes = new Set(previos)
              if (siguientes.has(grupo)) siguientes.delete(grupo)
              else siguientes.add(grupo)
              return siguientes
            })
          }
          onMostrarMas={(grupo) => setLimites((previos) => ({ ...previos, [grupo]: (previos[grupo] ?? TANDA_MIEMBROS) + TANDA_MIEMBROS }))}
          onAlternarGrupo={alternarGrupo}
          onAlternarPagina={(grupos, todos) =>
            onCambio({
              selectedGroups: todos ? seleccion.selectedGroups.filter((grupo) => !grupos.includes(grupo)) : [...new Set([...seleccion.selectedGroups, ...grupos])],
            })
          }
          onAlternarPersona={alternarPersona}
        />
      )}

      {seleccion.selectedGroups.length > 0 ? (
        <Sincronizar
          id="grupos"
          alcance="la agrupación"
          activo={seleccion.groupsAutoInclude}
          cuentaQuienSale={seleccion.groupsCountLeavers}
          onActivo={(activo) => onCambio({ groupsAutoInclude: activo })}
          onCuentaQuienSale={(cuenta) => onCambio({ groupsCountLeavers: cuenta })}
        />
      ) : null}

      <ActionDialog
        open={enGrupo !== null}
        onOpenChange={(abierto) => (abierto ? undefined : setEnGrupo(null))}
        title={`${enGrupo?.name ?? ''} entró por un grupo`}
        sub={
          enGrupo
            ? `Está en la encuesta porque elegiste el grupo «${grupoDe(enGrupo)}» (${SEGMENT_LABELS[seleccion.groupSegmentBy]}). Un grupo entra completo: para quitar a una persona, el grupo deja de estar elegido como tal.`
            : undefined
        }
        footer={
          enGrupo ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onCambio(withGroupDeselected(seleccion, grupoDe(enGrupo)))
                  setEnGrupo(null)
                }}
              >
                Quitar todo el grupo
              </Button>
              <Button
                onClick={() => {
                  onCambio(withGroupConvertedToIndividuals(seleccion, grupoDe(enGrupo), enGrupo.id))
                  setEnGrupo(null)
                }}
              >
                Quitar solo a esta persona
              </Button>
            </>
          ) : undefined
        }
      />
    </div>
  )
}

/* ------------------------------------------------------------------ agrupada */

function ListaGrupos({
  segmento,
  q,
  soloElegidos,
  elegidos,
  aMano,
  marcados,
  deGrupos,
  abiertos,
  limites,
  actual,
  porPagina,
  onPagina,
  onPorPagina,
  onAbrir,
  onMostrarMas,
  onAlternarGrupo,
  onAlternarPagina,
  onAlternarPersona,
}: {
  segmento: SegmentKey
  q: string
  soloElegidos: boolean
  elegidos: ReadonlySet<string>
  aMano: ReadonlySet<string>
  marcados: ReadonlySet<string>
  deGrupos: ReadonlySet<string>
  abiertos: ReadonlySet<string>
  limites: Record<string, number>
  actual: number
  porPagina: number
  onPagina: (pagina: number) => void
  onPorPagina: (valor: number) => void
  onAbrir: (grupo: string) => void
  onMostrarMas: (grupo: string) => void
  onAlternarGrupo: (grupo: string) => void
  onAlternarPagina: (grupos: string[], todos: boolean) => void
  onAlternarPersona: (persona: Collaborator) => void
}) {
  const porGrupo = useMemo(() => {
    const mapa = new Map<string, Collaborator[]>()
    COLLABORATORS.forEach((persona) => {
      const grupo = persona[segmento] ?? 'Sin asignar'
      mapa.set(grupo, [...(mapa.get(grupo) ?? []), persona])
    })
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'))
  }, [segmento])

  // Qué grupos se ven y con qué personas: si la búsqueda encuentra al grupo por su nombre, entra entero; si
  // solo encuentra personas, entra con ellas y abierto.
  const filas = porGrupo.flatMap(([grupo, miembros]) => {
    const porNombre = !q || grupo.toLowerCase().includes(q)
    let visibles = porNombre ? miembros : miembros.filter((persona) => coincide(persona, q))
    if (soloElegidos) visibles = elegidos.has(grupo) ? visibles : visibles.filter((persona) => marcados.has(persona.id))
    if (!porNombre && visibles.length === 0) return []
    if (soloElegidos && !elegidos.has(grupo) && visibles.length === 0) return []
    return [{ grupo, miembros, visibles, abierto: abiertos.has(grupo) || !porNombre || (soloElegidos && !elegidos.has(grupo)) }]
  })

  if (filas.length === 0) {
    return (
      <Empty className="py-8">
        <EmptyHeader>
          <EmptyTitle>{soloElegidos ? 'Todavía no hay nadie seleccionado' : 'No encontramos grupos ni personas'}</EmptyTitle>
          <EmptyDescription>{soloElegidos ? 'Marca un grupo entero o despliégalo para elegir personas.' : 'Prueba con otra palabra o cambia cómo se agrupa.'}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const enPagina = pagina(filas, actual, porPagina)
  const gruposPagina = enPagina.map((fila) => fila.grupo)
  const todaLaPagina = gruposPagina.every((grupo) => elegidos.has(grupo))

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox checked={todaLaPagina} onCheckedChange={() => onAlternarPagina(gruposPagina, todaLaPagina)} aria-label="Marcar los grupos de esta página" />
          <Text as="span" size="sm" variant="muted">
            {formatCount(filas.length)} {filas.length === 1 ? 'grupo' : 'grupos'} por {SEGMENT_LABELS[segmento].toLowerCase()}
          </Text>
        </div>
        <Text as="span" size="sm" weight="medium" className="tabular-nums" aria-live="polite">
          {formatCount(marcados.size)} {marcados.size === 1 ? 'persona marcada' : 'personas marcadas'}
        </Text>
      </div>

      <ItemGroup className="gap-0! rounded-xl border">
        {enPagina.map(({ grupo, miembros, visibles, abierto }, indice) => {
          const sueltas = miembros.filter((persona) => aMano.has(persona.id)).length
          const entero = elegidos.has(grupo)
          const limite = limites[grupo] ?? TANDA_MIEMBROS
          return (
            <div key={grupo}>
              {indice > 0 ? <ItemSeparator /> : null}
              <Item size="sm" className="gap-3" data-state={entero ? 'selected' : undefined}>
                {/* Sin «a medias»: la casilla de la librería pinta el mismo visto y parecería el grupo entero. Las
                    personas sueltas del grupo las dice la línea de abajo. */}
                <Checkbox
                  checked={entero}
                  onCheckedChange={() => onAlternarGrupo(grupo)}
                  aria-label={`Marcar el grupo ${grupo} completo`}
                />
                <BotonIcono
                  aria-label={abierto ? `Cerrar ${grupo}` : `Ver las personas de ${grupo}`}
                  aria-expanded={abierto}
                  className="-mx-1 text-muted-foreground!"
                  onClick={() => onAbrir(grupo)}
                >
                  <HugeiconsIcon icon={abierto ? ArrowDown01Icon : ArrowRight01Icon} size={18} />
                </BotonIcono>
                <ItemContent>
                  <ItemTitle>{grupo}</ItemTitle>
                  <ItemDescription>
                    {formatCount(miembros.length)} {miembros.length === 1 ? 'persona' : 'personas'}
                    {entero ? ' · el grupo entero' : sueltas > 0 ? ` · ${formatCount(sueltas)} ${sueltas === 1 ? 'elegida' : 'elegidas'} a mano` : ''}
                  </ItemDescription>
                </ItemContent>
              </Item>

              {abierto ? (
                <>
                  {visibles.slice(0, limite).map((persona) => (
                    <div key={persona.id}>
                      <ItemSeparator />
                      <FilaPersona
                        persona={persona}
                        marcada={marcados.has(persona.id)}
                        detalle={deGrupos.has(persona.id) ? 'Por el grupo' : undefined}
                        extra={segmento === 'area' ? persona.leader : persona.area}
                        sangria
                        onAlternar={() => onAlternarPersona(persona)}
                      />
                    </div>
                  ))}
                  {visibles.length > limite ? (
                    <>
                      <ItemSeparator />
                      <div className="flex items-center justify-between gap-3 py-2 ps-20 pe-4">
                        <Text as="span" size="xs" variant="muted">
                          Quedan {formatCount(visibles.length - limite)} personas: búscalas por nombre o muestra más.
                        </Text>
                        <Button variant="ghost" size="sm" onClick={() => onMostrarMas(grupo)}>
                          Mostrar {Math.min(TANDA_MIEMBROS, visibles.length - limite)} más
                        </Button>
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          )
        })}
      </ItemGroup>

      <Paginacion id="directorio-grupos" actual={actual} total={filas.length} porPagina={porPagina} onCambiarPagina={onPagina} onCambiarPorPagina={onPorPagina} />
    </>
  )
}

/* -------------------------------------------------------------- sin agrupar */

function ListaPersonas({
  q,
  busqueda,
  soloElegidos,
  marcados,
  deGrupos,
  grupoDe,
  actual,
  porPagina,
  onPagina,
  onPorPagina,
  onAlternar,
  onMarcar,
  onDesmarcar,
  onDesmarcarTodo,
}: {
  q: string
  busqueda: string
  soloElegidos: boolean
  marcados: ReadonlySet<string>
  deGrupos: ReadonlySet<string>
  grupoDe: (persona: Collaborator) => string
  actual: number
  porPagina: number
  onPagina: (pagina: number) => void
  onPorPagina: (valor: number) => void
  onAlternar: (persona: Collaborator) => void
  onMarcar: (ids: readonly string[]) => void
  onDesmarcar: (ids: readonly string[]) => void
  onDesmarcarTodo: () => void
}) {
  const resultado = COLLABORATORS.filter((persona) => (!q || coincide(persona, q)) && (!soloElegidos || marcados.has(persona.id)))

  if (resultado.length === 0) {
    return (
      <Empty className="py-8">
        <EmptyHeader>
          <EmptyTitle>{soloElegidos ? 'Todavía no hay nadie seleccionado' : 'No encontramos a nadie'}</EmptyTitle>
          <EmptyDescription>{soloElegidos ? 'Marca personas en la lista.' : `Ningún colaborador coincide con «${busqueda}».`}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const visibles = pagina([...resultado], actual, porPagina)
  const paginaCompleta = visibles.every((persona) => marcados.has(persona.id))
  const ids = visibles.map((persona) => persona.id)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Checkbox checked={paginaCompleta} onCheckedChange={() => (paginaCompleta ? onDesmarcar(ids) : onMarcar(ids))} aria-label="Seleccionar esta página" />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Opciones de selección" />}>
              <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onMarcar(ids)}>Seleccionar esta página</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDesmarcar(ids)}>Desmarcar esta página</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMarcar(resultado.map((persona) => persona.id))}>Seleccionar todo ({formatCount(resultado.length)})</DropdownMenuItem>
                <DropdownMenuItem onClick={onDesmarcarTodo}>Desmarcar todo</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Text as="span" size="sm" weight="medium" className="tabular-nums" aria-live="polite">
          {formatCount(marcados.size)} {marcados.size === 1 ? 'persona marcada' : 'personas marcadas'}
        </Text>
      </div>

      <ItemGroup className="gap-0! rounded-xl border">
        {visibles.map((persona, indice) => (
          <div key={persona.id}>
            {indice > 0 ? <ItemSeparator /> : null}
            <FilaPersona
              persona={persona}
              marcada={marcados.has(persona.id)}
              detalle={deGrupos.has(persona.id) ? `Por el grupo ${grupoDe(persona)}` : undefined}
              extra={persona.area}
              onAlternar={() => onAlternar(persona)}
            />
          </div>
        ))}
      </ItemGroup>

      <Paginacion id="directorio-personas" actual={actual} total={resultado.length} porPagina={porPagina} onCambiarPagina={onPagina} onCambiarPorPagina={onPorPagina} />
    </>
  )
}

/* ----------------------------------------------------------------- una fila */

function FilaPersona({
  persona,
  marcada,
  detalle,
  extra,
  sangria = false,
  onAlternar,
}: {
  persona: Collaborator
  marcada: boolean
  // «Por el grupo…»: está porque su grupo entero está elegido.
  detalle?: string
  // Lo que se lee a la derecha: el área o el líder, según cómo se agrupe.
  extra?: string | null
  // Dentro de un grupo desplegado, la fila se corre a la derecha para leerse como parte de él.
  sangria?: boolean
  onAlternar: () => void
}) {
  return (
    <Item size="sm" className={sangria ? 'gap-3 ps-14!' : 'gap-3'} data-state={marcada ? 'selected' : undefined}>
      <Checkbox checked={marcada} onCheckedChange={onAlternar} aria-label={`Seleccionar a ${persona.name}`} />
      <ItemContent>
        <Persona nombre={persona.name} detalle={[persona.email, detalle].filter(Boolean).join(' · ')} />
      </ItemContent>
      {extra ? (
        <ItemActions>
          <Badge variant="outline" size="xs">
            {extra}
          </Badge>
        </ItemActions>
      ) : null}
    </Item>
  )
}
