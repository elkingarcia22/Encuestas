import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Search01Icon } from '@hugeicons/core-free-icons'
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
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { COLLABORATOR_COUNT, COLLABORATORS, type Collaborator } from '../../../modelo/collaborators'
import { SEGMENT_LABELS, effectiveIndividualIds, formatCount, groupMemberIds, segmentCounts, withGroupConvertedToIndividuals, withGroupDeselected } from '../../../modelo/participants'
import type { ParticipantsSelection, SegmentKey } from '../../../modelo/surveyBuilderTypes'
import { Paginacion } from '../../../components/tabla-piezas'
import { Sincronizar } from './sincronizar'

// Las dos listas de «Por grupos» y «Por persona». Son del mismo directorio y se suman: quien entra por un
// grupo aparece marcado en «Por persona» con «Por el grupo…», y desmarcarlo ahí pregunta si quitar el grupo
// entero o solo a esa persona (un grupo entra completo). Mismo estilo de lista en las dos.

type Props = { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }

const SEGMENTOS = (Object.entries(SEGMENT_LABELS) as [SegmentKey, string][]).map(([value, label]) => ({ value, label }))

const coincide = (persona: Collaborator, q: string) =>
  `${persona.name} ${persona.username} ${persona.email} ${persona.area} ${persona.leader ?? ''}`.toLowerCase().includes(q)

function Buscador({ id, valor, onValor, placeholder }: { id: string; valor: string; onValor: (valor: string) => void; placeholder: string }) {
  return (
    <InputGroup className="min-w-56 flex-1">
      <InputGroupAddon>
        <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput id={id} value={valor} onChange={(evento) => onValor(evento.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </InputGroup>
  )
}

/* ------------------------------------------------------------------ grupos */

export function ListaDeGrupos({ seleccion, onCambio }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const elegidos = new Set(seleccion.selectedGroups)

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return [...segmentCounts(seleccion.groupSegmentBy).entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .filter(([grupo]) => !q || grupo.toLowerCase().includes(q))
      .filter(([grupo]) => !soloElegidos || seleccion.selectedGroups.includes(grupo))
  }, [seleccion.groupSegmentBy, seleccion.selectedGroups, busqueda, soloElegidos])
  const visibles = pagina(grupos, actual, porPagina)
  const todaLaPagina = visibles.length > 0 && visibles.every(([grupo]) => elegidos.has(grupo))

  const alternar = (grupo: string) =>
    onCambio({ selectedGroups: elegidos.has(grupo) ? seleccion.selectedGroups.filter((otro) => otro !== grupo) : [...seleccion.selectedGroups, grupo] })
  const alternarPagina = () => {
    const enPagina = new Set(visibles.map(([grupo]) => grupo))
    onCambio({
      selectedGroups: todaLaPagina ? seleccion.selectedGroups.filter((grupo) => !enPagina.has(grupo)) : [...new Set([...seleccion.selectedGroups, ...enPagina])],
    })
  }

  // Los grupos son de una sola categoría a la vez (un área no es un líder): cambiarla quita los elegidos, y se dice.
  const cambiarCategoria = (siguiente: SegmentKey) => {
    if (siguiente === seleccion.groupSegmentBy) return
    if (seleccion.selectedGroups.length) {
      notify(
        `Quitamos ${seleccion.selectedGroups.length === 1 ? 'el grupo elegido' : `los ${seleccion.selectedGroups.length} grupos elegidos`} por ${SEGMENT_LABELS[seleccion.groupSegmentBy].toLowerCase()}`,
        'Los grupos son de una sola categoría a la vez. Las personas elegidas una a una se quedan.',
      )
    }
    onCambio({ groupSegmentBy: siguiente, selectedGroups: [] })
    setActual(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Buscador
          id="grupos-buscar"
          valor={busqueda}
          onValor={(valor) => {
            setBusqueda(valor)
            setActual(1)
          }}
          placeholder="Busca un grupo por su nombre"
        />
        <Field orientation="horizontal" className="w-auto!">
          <FieldLabel htmlFor="grupos-agrupar-por" className="sr-only">
            Agrupar por
          </FieldLabel>
          <Select value={seleccion.groupSegmentBy} onValueChange={(valor) => cambiarCategoria(valor as SegmentKey)} items={SEGMENTOS}>
            <SelectTrigger id="grupos-agrupar-por" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTOS.map((segmento) => (
                <SelectItem key={segmento.value} value={segmento.value}>
                  {segmento.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {grupos.length === 0 ? (
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyTitle>{soloElegidos ? 'Todavía no hay grupos elegidos' : 'No hay grupos con ese nombre'}</EmptyTitle>
            <EmptyDescription>{soloElegidos ? 'Quita el filtro y marca los grupos que deben responder.' : 'Prueba con otra palabra o cambia la categoría.'}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={todaLaPagina} onCheckedChange={alternarPagina} aria-label="Marcar los grupos de esta página" />
              <Text as="span" size="sm" variant="muted">
                {formatCount(grupos.length)} {grupos.length === 1 ? 'grupo' : 'grupos'} por {SEGMENT_LABELS[seleccion.groupSegmentBy].toLowerCase()}
              </Text>
            </div>
            <Button variant={soloElegidos ? 'secondary' : 'ghost'} size="sm" aria-pressed={soloElegidos} onClick={() => setSoloElegidos(!soloElegidos)}>
              Ver elegidos ({formatCount(seleccion.selectedGroups.length)})
            </Button>
          </div>
          <ItemGroup className="gap-0! rounded-xl border">
            {visibles.map(([grupo, cuantos], indice) => (
              <div key={grupo}>
                {indice > 0 ? <ItemSeparator /> : null}
                <Item size="sm" className="gap-3" data-state={elegidos.has(grupo) ? 'selected' : undefined}>
                  <Checkbox checked={elegidos.has(grupo)} onCheckedChange={() => alternar(grupo)} aria-label={`Marcar el grupo ${grupo}`} />
                  <ItemContent>
                    <ItemTitle>{grupo}</ItemTitle>
                    <ItemDescription>
                      {formatCount(cuantos)} {cuantos === 1 ? 'persona' : 'personas'}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Text as="span" size="xs" variant="muted" className="tabular-nums">
                      {((cuantos / COLLABORATOR_COUNT) * 100).toFixed(1).replace('.', ',')}% del total
                    </Text>
                  </ItemActions>
                </Item>
              </div>
            ))}
          </ItemGroup>
          <Paginacion
            id="grupos"
            actual={actual}
            total={grupos.length}
            porPagina={porPagina}
            onCambiarPagina={setActual}
            onCambiarPorPagina={(valor) => {
              setPorPagina(valor)
              setActual(1)
            }}
          />
        </>
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
    </div>
  )
}

/* ---------------------------------------------------------------- personas */

export function ListaDePersonas({ seleccion, onCambio }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [enGrupo, setEnGrupo] = useState<Collaborator | null>(null)

  const marcados = effectiveIndividualIds(seleccion)
  const deGrupos = groupMemberIds(seleccion.groupSegmentBy, seleccion.selectedGroups)
  const grupoDe = (persona: Collaborator) => persona[seleccion.groupSegmentBy] ?? 'Sin asignar'

  const q = busqueda.trim().toLowerCase()
  const resultado = COLLABORATORS.filter((persona) => (!q || coincide(persona, q)) && (!soloElegidos || marcados.has(persona.id)))
  const visibles = pagina([...resultado], actual, porPagina)
  const ids = visibles.map((persona) => persona.id)
  const paginaCompleta = visibles.length > 0 && visibles.every((persona) => marcados.has(persona.id))

  const marcar = (lista: readonly string[]) => onCambio({ selectedIds: [...new Set([...seleccion.selectedIds, ...lista])] })
  // Desmarcar en lote solo quita a quienes se eligieron a mano: los de un grupo siguen hasta que se quite el grupo.
  const desmarcar = (lista: readonly string[]) => {
    const fuera = new Set(lista)
    onCambio({ selectedIds: seleccion.selectedIds.filter((id) => !fuera.has(id)) })
  }
  const alternar = (persona: Collaborator) => {
    if (!marcados.has(persona.id)) return marcar([persona.id])
    if (deGrupos.has(persona.id)) return setEnGrupo(persona)
    desmarcar([persona.id])
  }

  return (
    <div className="flex flex-col gap-4">
      <Buscador
        id="personas-buscar"
        valor={busqueda}
        onValor={(valor) => {
          setBusqueda(valor)
          setActual(1)
        }}
        placeholder="Busca por nombre, usuario, correo, área o líder"
      />

      {resultado.length === 0 ? (
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyTitle>{soloElegidos ? 'Todavía no hay nadie elegido' : 'No encontramos a nadie'}</EmptyTitle>
            <EmptyDescription>{soloElegidos ? 'Quita el filtro y marca a las personas.' : `Ningún colaborador coincide con «${busqueda}».`}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Checkbox checked={paginaCompleta} onCheckedChange={() => (paginaCompleta ? desmarcar(ids) : marcar(ids))} aria-label="Seleccionar esta página" />
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Opciones de selección" />}>
                  <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => marcar(ids)}>Seleccionar esta página</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => desmarcar(ids)}>Desmarcar esta página</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => marcar(resultado.map((persona) => persona.id))}>Seleccionar todo ({formatCount(resultado.length)})</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCambio({ selectedIds: [] })}>Desmarcar todo</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Text as="span" size="sm" variant="muted" className="ms-1">
                {formatCount(resultado.length)} {resultado.length === 1 ? 'persona' : 'personas'}
              </Text>
            </div>
            <Button variant={soloElegidos ? 'secondary' : 'ghost'} size="sm" aria-pressed={soloElegidos} onClick={() => setSoloElegidos(!soloElegidos)}>
              Ver elegidas ({formatCount(marcados.size)})
            </Button>
          </div>

          <ItemGroup className="gap-0! rounded-xl border">
            {visibles.map((persona, indice) => {
              const marcada = marcados.has(persona.id)
              return (
                <div key={persona.id}>
                  {indice > 0 ? <ItemSeparator /> : null}
                  <Item size="sm" className="gap-3" data-state={marcada ? 'selected' : undefined}>
                    <Checkbox checked={marcada} onCheckedChange={() => alternar(persona)} aria-label={`Seleccionar a ${persona.name}`} />
                    <ItemContent>
                      <Persona nombre={persona.name} detalle={[persona.email, deGrupos.has(persona.id) ? `Por el grupo ${grupoDe(persona)}` : null].filter(Boolean).join(' · ')} />
                    </ItemContent>
                    <ItemActions>
                      <Badge variant="outline" size="xs">
                        {persona.area}
                      </Badge>
                    </ItemActions>
                  </Item>
                </div>
              )
            })}
          </ItemGroup>

          <Paginacion
            id="personas"
            actual={actual}
            total={resultado.length}
            porPagina={porPagina}
            onCambiarPagina={setActual}
            onCambiarPorPagina={(valor) => {
              setPorPagina(valor)
              setActual(1)
            }}
          />
        </>
      )}

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
