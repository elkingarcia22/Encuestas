import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowDown01Icon, Cancel01Icon, UserRemove01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Text,
} from '@ubits/flux-ui'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { notify } from '@/shared/components/notify'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SinResultados } from '@/shared/components/SinResultados'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { FilaElegible, ListaElegible } from '@/modules/design-system/listas/lista-elegible'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { COLLABORATOR_COUNT, COLLABORATORS, type Collaborator } from '../../../modelo/collaborators'
import { SEGMENT_LABELS, effectiveIndividualIds, excludedByGroup, formatCount, groupMemberIds, segmentCounts, withPeopleExcluded, withPeopleIncluded, withPersonExcluded } from '../../../modelo/participants'
import type { ParticipantsSelection, SegmentKey } from '../../../modelo/surveyBuilderTypes'
import { PersonasExcluidas } from './excluidas'
import { BotonFiltros } from './filtros-personas'
import { camposDePersona, conFiltro, cumpleFiltros, type FiltrosPersona } from '../../../modelo/filtrosPersona'
import { Sincronizar } from './sincronizar'

// Las dos listas de «Por grupos» y «Por persona». Son del mismo directorio y se suman: quien entra por un
// grupo aparece marcado en «Por persona» con «Por el grupo…», y desmarcarlo ahí pregunta si dejar fuera solo a
// esa persona (el grupo entero se quita desmarcándolo, 14-oct). Quien queda fuera no se pierde de vista: el grupo sigue elegido y su
// fila en «Por grupos» dice cuántas personas faltan y quiénes son, con un botón para devolverlas. Mismo estilo
// de lista en las dos.
//
// Las dos viven dentro de un acordeón, así que son una ListaElegible y no una TablaDatos (Elkin, 9-oct): la tabla
// trae su propio marco y dentro del acordeón quedaba contenedor dentro de contenedor dentro de contenedor. Aquí es el
// acordeón y, dentro, un solo panel con las filas, de una línea (la propuesta B que se escogió el 9-oct), y encima lo
// elegido como fichas que se quitan con su «x». La casilla de cada fila decide quién responde, y desmarcar a alguien
// que entró por un grupo pregunta antes.

type Props = { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }

export type FiltroGrupoEnfocado = { grupo: string; segmento: SegmentKey }

// Edad y sexo no se ofrecen para agrupar a quién responde (Elkin, 14-oct): son datos demográficos para leer los resultados,
// no para elegir participantes. Siguen en Resultados y en Datos demográficos.
const NO_AGRUPAN: ReadonlySet<SegmentKey> = new Set(['age', 'gender'])
const SEGMENTOS = (Object.entries(SEGMENT_LABELS) as [SegmentKey, string][])
  .filter(([value]) => !NO_AGRUPAN.has(value))
  .map(([value, label]) => ({ value, label }))

const coincide = (persona: Collaborator, q: string) =>
  `${persona.name} ${persona.username} ${persona.email} ${persona.area} ${persona.leader ?? ''}`.toLowerCase().includes(q)

const porcentaje = (valor: number) => `${valor.toFixed(1).replace('.', ',')} %`
const POR_ID = new Map(COLLABORATORS.map((persona) => [persona.id, persona]))
const MAS_FICHAS = 12

// Lo elegido, encima de la lista y siempre a la vista: una ficha por grupo o persona que se quita con su «x», para no tener
// que buscarlo entre las páginas. Con muchas, las primeras y «y N más» (el resto se ve con «Ver elegidos»).
function Fichas({ etiqueta, items }: { etiqueta: string; items: { id: string; texto: string; onQuitar: () => void }[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-(--frame-panel-header-px)">
      <Text as="span" size="sm" variant="muted">
        {etiqueta}
      </Text>
      {items.slice(0, MAS_FICHAS).map((item) => (
        <Button key={item.id} variant="secondary" size="xs" onClick={item.onQuitar} aria-label={`Quitar ${item.texto}`}>
          {item.texto}
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
        </Button>
      ))}
      {items.length > MAS_FICHAS ? (
        <Text as="span" size="sm" variant="muted">
          y {formatCount(items.length - MAS_FICHAS)} más
        </Text>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ grupos */

// El título de la lista nombra lo que se lista según «Agrupar por» («Áreas»); el acordeón ya dice la forma de elegir
// («Por grupos»), así que no se repite.
const LISTA_DE: Record<SegmentKey, { titulo: string; uno: string }> = {
  area: { titulo: 'Áreas', uno: 'área' },
  leader: { titulo: 'Equipos por líder', uno: 'equipo' },
  country: { titulo: 'Países', uno: 'país' },
  age: { titulo: 'Rangos de edad', uno: 'rango' },
  gender: { titulo: 'Sexo', uno: 'grupo' },
  customGroup: { titulo: 'Grupos personalizados', uno: 'grupo' },
}

// Con la encuesta anónima, un grupo solo ve sus resultados cuando responden al menos `minimo` personas (PAR-019). Un grupo
// elegido que ni completo llega a ese número nunca los verá: se avisa arriba de la lista y en su fila, sin impedir elegirlo
// (sus respuestas siguen contando en el total y en los grupos más grandes).
export function ListaDeGrupos({
  seleccion,
  onCambio,
  minimo = null,
  onExcluirUsuarios,
}: Props & { minimo?: number | null; onExcluirUsuarios?: (grupo: string, segmento: SegmentKey) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  // Filas de una línea: caben 20 por página sin que la lista se haga larga.
  const [porPagina, setPorPagina] = useState(20)
  const elegidos = new Set(seleccion.selectedGroups)
  // Si al quitar marcas ya no queda ninguna, «Ver elegidos» se apaga y vuelve la lista completa en vez de un vacío.
  if (soloElegidos && elegidos.size === 0) {
    setSoloElegidos(false)
    setActual(1)
  }
  const excluidas = excludedByGroup(seleccion)
  const tamanos = segmentCounts(seleccion.groupSegmentBy)
  const bajoMinimo = (grupo: string, cuantos: number) => minimo !== null && cuantos - (excluidas.get(grupo)?.length ?? 0) < minimo
  const pequenos = minimo === null ? [] : seleccion.selectedGroups.filter((grupo) => bajoMinimo(grupo, tamanos.get(grupo) ?? 0))

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return [...segmentCounts(seleccion.groupSegmentBy).entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .filter(([grupo]) => !q || grupo.toLowerCase().includes(q))
      .filter(([grupo]) => !soloElegidos || seleccion.selectedGroups.includes(grupo))
  }, [seleccion.groupSegmentBy, seleccion.selectedGroups, busqueda, soloElegidos])
  const visibles = pagina(grupos, actual, porPagina)
  const enPagina = visibles.filter(([grupo]) => elegidos.has(grupo)).length
  const todaLaPagina = visibles.length > 0 && enPagina === visibles.length

  // Quitar un grupo borra también a quienes se habían dejado fuera de él: sin grupo no hay de qué quedar fuera.
  const sinExcluidasDe = (grupos: ReadonlySet<string>) => {
    const fuera = new Set([...grupos].flatMap((grupo) => (excluidas.get(grupo) ?? []).map((persona) => persona.id)))
    return seleccion.excludedIds.filter((id) => !fuera.has(id))
  }
  const alternar = (grupo: string) =>
    elegidos.has(grupo)
      ? onCambio({ selectedGroups: seleccion.selectedGroups.filter((otro) => otro !== grupo), excludedIds: sinExcluidasDe(new Set([grupo])) })
      : onCambio({ selectedGroups: [...seleccion.selectedGroups, grupo] })
  const alternarPagina = () => {
    const enLaPagina = new Set(visibles.map(([grupo]) => grupo))
    onCambio(
      todaLaPagina
        ? { selectedGroups: seleccion.selectedGroups.filter((grupo) => !enLaPagina.has(grupo)), excludedIds: sinExcluidasDe(enLaPagina) }
        : { selectedGroups: [...new Set([...seleccion.selectedGroups, ...enLaPagina])] },
    )
  }

  // Los grupos son de una sola categoría a la vez (un área no es un líder): cambiarla quita los elegidos, y se dice.
  const cambiarCategoria = (siguiente: SegmentKey) => {
    if (siguiente === seleccion.groupSegmentBy) return
    if (seleccion.selectedGroups.length) {
      notify(
        `Quitamos ${seleccion.selectedGroups.length === 1 ? 'el grupo elegido' : `los ${seleccion.selectedGroups.length} grupos elegidos`} por ${SEGMENT_LABELS[seleccion.groupSegmentBy].toLowerCase()}`,
        'Los grupos son de una sola categoría a la vez. Las personas elegidas una a una se quedan.',
        'info',
      )
    }
    onCambio({ groupSegmentBy: siguiente, selectedGroups: [], excludedIds: [] })
    setActual(1)
  }

  const limpiar = () => {
    setBusqueda('')
    setSoloElegidos(false)
    setActual(1)
  }


  return (
    <div className="flex flex-col gap-4">
      {/* Arriba y siempre a la vista: es una decisión sobre los grupos, no sobre la página de la lista. */}
      <div className="px-(--frame-panel-header-px)">
        <Sincronizar
          id="grupos"
          alcance="la agrupación"
          activo={seleccion.groupsAutoInclude}
          cuentaQuienSale={seleccion.groupsCountLeavers}
          onActivo={(activo) => onCambio({ groupsAutoInclude: activo })}
          onCuentaQuienSale={(cuenta) => onCambio({ groupsCountLeavers: cuenta })}
        />
      </div>
      <Fichas etiqueta="Elegidos:" items={seleccion.selectedGroups.map((grupo) => ({ id: grupo, texto: grupo, onQuitar: () => alternar(grupo) }))} />
      {pequenos.length > 0 ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertDescription>
            {pequenos.length === 1 ? `«${pequenos[0]}» tiene` : `${pequenos.length} grupos elegidos (${pequenos.slice(0, 3).map((grupo) => `«${grupo}»`).join(', ')}${pequenos.length > 3 ? '…' : ''}) tienen`} menos de {minimo} personas, el mínimo de respuestas de esta encuesta anónima.{' '}
            {pequenos.length === 1 ? 'No podrá ver sus resultados por separado' : 'No podrán ver sus resultados por separado'}; sus respuestas sí cuentan en el total.
          </AlertDescription>
        </Alert>
      ) : null}
      <ListaElegible
        id="grupos"
        nombre="grupos"
        herramientasEnCabecera
        titulo={{ texto: LISTA_DE[seleccion.groupSegmentBy].titulo }}
        buscador={{
          valor: busqueda,
          placeholder: `Busca un ${LISTA_DE[seleccion.groupSegmentBy].uno}`,
          onValor: (valor) => {
            setBusqueda(valor)
            setActual(1)
          },
        }}
        herramientas={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                Agrupar por {SEGMENT_LABELS[seleccion.groupSegmentBy].toLowerCase()}
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Agrupar por</DropdownMenuLabel>
                  {SEGMENTOS.map((segmento) => (
                    <DropdownMenuItem key={segmento.value} onClick={() => cambiarCategoria(segmento.value)}>
                      {segmento.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant={soloElegidos ? 'secondary' : 'outline'}
              aria-pressed={soloElegidos}
              onClick={() => {
                setSoloElegidos(!soloElegidos)
                setActual(1)
              }}
            >
              {soloElegidos ? 'Ver todos los grupos' : `Ver elegidos (${formatCount(seleccion.selectedGroups.length)})`}
            </Button>
          </>
        }
        casillaPagina={{ marcada: todaLaPagina, parcial: enPagina > 0 && !todaLaPagina, onCambio: alternarPagina, etiqueta: 'Marcar los grupos de esta página' }}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: grupos.length }}
        vacio={<SinResultados busqueda={busqueda} filtrosActivos={soloElegidos ? 1 : 0} onLimpiar={limpiar} />}
      >
        {visibles.map(([grupo, cuantos]) => {
          const fuera = excluidas.get(grupo) ?? []
          return (
            <FilaElegible
              key={grupo}
              marcada={elegidos.has(grupo)}
              onCambio={() => alternar(grupo)}
              etiqueta={`Marcar el grupo ${grupo}`}
              tamano="xs"
              contenido={
                <Text as="span" size="sm">
                  {grupo}{' '}
                  <Text as="span" size="sm" variant="muted">
                    · {fuera.length ? `${formatCount(cuantos - fuera.length)} de ${formatCount(cuantos)} personas` : `${formatCount(cuantos)} ${cuantos === 1 ? 'persona' : 'personas'}`}
                  </Text>
                </Text>
              }
              lateral={
                <>
                  {elegidos.has(grupo) && bajoMinimo(grupo, cuantos) ? (
                    <Badge variant="warning-light" size="sm">
                      Menos de {minimo} personas
                    </Badge>
                  ) : null}
                  {fuera.length ? <PersonasExcluidas grupo={grupo} personas={fuera} onIncluir={(ids) => onCambio(withPeopleIncluded(seleccion, ids))} /> : null}
                  {elegidos.has(grupo) && onExcluirUsuarios ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={(evento) => {
                        evento.stopPropagation()
                        onExcluirUsuarios(grupo, seleccion.groupSegmentBy)
                      }}
                    >
                      <HugeiconsIcon icon={UserRemove01Icon} aria-hidden="true" />
                      Excluir usuarios
                    </Button>
                  ) : null}
                  <Text as="span" size="sm" variant="muted" className="tabular-nums">
                    {porcentaje((cuantos / COLLABORATOR_COUNT) * 100)}
                  </Text>
                </>
              }
            />
          )
        })}
      </ListaElegible>
    </div>
  )
}

/* ---------------------------------------------------------------- personas */

export function ListaDePersonas({
  seleccion,
  onCambio,
  filtroGrupo = null,
  onLimpiarFiltroGrupo,
}: Props & {
  filtroGrupo?: FiltroGrupoEnfocado | null
  onLimpiarFiltroGrupo?: () => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  // Filas de una línea: caben 20 por página sin que la lista se haga larga.
  const [porPagina, setPorPagina] = useState(20)
  const [enGrupo, setEnGrupo] = useState<Collaborator | null>(null)
  const [filtros, setFiltros] = useState<FiltrosPersona>({})

  useEffect(() => {
    if (!filtroGrupo) return
    const clave = filtroGrupo.segmento === 'leader' ? 'leader' : filtroGrupo.segmento === 'country' ? 'country' : 'area'
    setFiltros({ [clave]: filtroGrupo.grupo })
    setSoloElegidos(false)
    setBusqueda('')
    setActual(1)
  }, [filtroGrupo])

  const marcados = effectiveIndividualIds(seleccion)
  // Si al quitar marcas ya no queda ninguna, «Ver elegidas» se apaga y vuelve la lista completa en vez de un vacío.
  if (soloElegidos && marcados.size === 0) {
    setSoloElegidos(false)
    setActual(1)
  }
  const deGrupos = groupMemberIds(seleccion.groupSegmentBy, seleccion.selectedGroups, COLLABORATORS, seleccion.excludedIds)
  const dejadas = new Set([...excludedByGroup(seleccion).values()].flat().map((persona) => persona.id))
  const grupoDe = (persona: Collaborator) => persona[seleccion.groupSegmentBy] ?? 'Sin asignar'

  const q = busqueda.trim().toLowerCase()
  const resultado = COLLABORATORS.filter((persona) => (!q || coincide(persona, q)) && cumpleFiltros(persona, filtros) && (!soloElegidos || marcados.has(persona.id)))
  const visibles = pagina([...resultado], actual, porPagina)
  const ids = visibles.map((persona) => persona.id)
  const enPagina = visibles.filter((persona) => marcados.has(persona.id)).length
  const enResultado = resultado.filter((persona) => marcados.has(persona.id)).length
  const paginaCompleta = visibles.length > 0 && enPagina === visibles.length
  // Con una búsqueda, un filtro o el de elegidas, «todo» son los resultados de la lista, no toda la empresa.
  const filtrosActivos = Object.values(filtros).filter(Boolean).length
  const filtrada = q !== '' || filtrosActivos > 0 || soloElegidos

  // Marcar a alguien que se había dejado fuera de su grupo lo devuelve: la exclusión se borra.
  const marcar = (lista: readonly string[]) => onCambio({ selectedIds: [...new Set([...seleccion.selectedIds, ...lista])], ...withPeopleIncluded(seleccion, lista) })
  // Desmarcar en lote quita a quienes se eligieron a mano y deja fuera de su grupo a quienes entraron por uno: el grupo sigue
  // elegido y su fila dice quiénes quedaron fuera.
  const desmarcar = (lista: readonly string[]) => {
    const fuera = new Set(lista)
    onCambio({ ...withPeopleExcluded(seleccion, lista.filter((id) => deGrupos.has(id))), selectedIds: seleccion.selectedIds.filter((id) => !fuera.has(id)) })
  }
  const alternar = (persona: Collaborator) => {
    if (!marcados.has(persona.id)) return dejadas.has(persona.id) ? onCambio(withPeopleIncluded(seleccion, [persona.id])) : marcar([persona.id])
    if (deGrupos.has(persona.id)) return setEnGrupo(persona)
    desmarcar([persona.id])
  }
  const detalle = (persona: Collaborator) =>
    [persona.email, deGrupos.has(persona.id) ? `Por el grupo ${grupoDe(persona)}` : dejadas.has(persona.id) ? `Excluida del grupo ${grupoDe(persona)}` : null].filter(Boolean).join(' · ')

  const limpiar = () => {
    setBusqueda('')
    setFiltros({})
    setSoloElegidos(false)
    setActual(1)
    onLimpiarFiltroGrupo?.()
  }

  // Al lado de la casilla de la página, lo que se puede marcar de una vez. Las opciones dependen de lo que ya está
  // marcado: solo se ofrece lo que tiene efecto.
  const opcionesSeleccion = (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label="Opciones de selección" />}>
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          {enPagina < visibles.length ? <DropdownMenuItem onClick={() => marcar(ids)}>Seleccionar esta página</DropdownMenuItem> : null}
          {enPagina > 0 ? <DropdownMenuItem onClick={() => desmarcar(ids)}>Desmarcar esta página ({formatCount(enPagina)})</DropdownMenuItem> : null}
        </DropdownMenuGroup>
        {resultado.length > visibles.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {enResultado < resultado.length ? (
                <DropdownMenuItem onClick={() => marcar(resultado.map((persona) => persona.id))}>
                  {filtrada ? `Seleccionar los ${formatCount(resultado.length)} resultados` : `Seleccionar todo (${formatCount(resultado.length)})`}
                </DropdownMenuItem>
              ) : null}
              {enResultado > 0 ? (
                <DropdownMenuItem onClick={() => desmarcar(resultado.map((persona) => persona.id))}>
                  {filtrada ? `Desmarcar los resultados (${formatCount(enResultado)})` : `Desmarcar todo (${formatCount(enResultado)})`}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-col gap-4">
      {filtroGrupo && filtros[filtroGrupo.segmento === 'leader' ? 'leader' : filtroGrupo.segmento === 'country' ? 'country' : 'area'] === filtroGrupo.grupo ? (
        <div className="px-(--frame-panel-header-px)">
          <Alert variant="info" className="flex items-center justify-between gap-3">
            <AlertDescription>
              Viendo personas de «{filtroGrupo.grupo}». Puedes excluir a quienes no deban responder.
            </AlertDescription>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setFiltros({})
                onLimpiarFiltroGrupo?.()
              }}
            >
              Ver todas las personas
            </Button>
          </Alert>
        </div>
      ) : null}
      <Fichas
        etiqueta="Elegidas una a una:"
        items={seleccion.selectedIds.flatMap((id) => {
          const persona = POR_ID.get(id)
          return persona ? [{ id, texto: persona.name, onQuitar: () => alternar(persona) }] : []
        })}
      />
      <ListaElegible
        id="personas"
        nombre="personas"
        herramientasEnCabecera
        titulo={{ texto: 'Personas' }}
        buscador={{
          valor: busqueda,
          placeholder: 'Busca a una persona',
          onValor: (valor) => {
            setBusqueda(valor)
            setActual(1)
          },
        }}
        herramientas={
          <>
            <BotonFiltros
              campos={camposDePersona(COLLABORATORS, filtros)}
              descripcion="Acota la lista por líder, rol, área, país o ciudad."
              onCambio={(id, valor) => {
                setFiltros((actuales) => conFiltro(actuales, id, valor))
                setActual(1)
              }}
            />
            <Button
              variant={soloElegidos ? 'secondary' : 'outline'}
              aria-pressed={soloElegidos}
              onClick={() => {
                setSoloElegidos(!soloElegidos)
                setActual(1)
              }}
            >
              {soloElegidos ? 'Ver a todas' : `Ver elegidas (${formatCount(marcados.size)})`}
            </Button>
          </>
        }
        resumen={`${formatCount(resultado.length)} ${resultado.length === 1 ? 'persona' : 'personas'}`}
        casillaPagina={{ marcada: paginaCompleta, parcial: enPagina > 0 && !paginaCompleta, onCambio: () => (paginaCompleta ? desmarcar(ids) : marcar(ids)), etiqueta: 'Seleccionar esta página' }}
        opcionesSeleccion={opcionesSeleccion}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        vacio={<SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos + (soloElegidos ? 1 : 0)} onLimpiar={limpiar} />}
      >
        {visibles.map((persona) => (
          <FilaElegible
            key={persona.id}
            marcada={marcados.has(persona.id)}
            onCambio={() => alternar(persona)}
            etiqueta={`Seleccionar a ${persona.name}`}
            tamano="xs"
            contenido={
              <TextoCompleto texto={`${persona.name} · ${detalle(persona)}`}>
                <Text as="span" size="sm" className="truncate">
                  {persona.name}{' '}
                  <Text as="span" size="sm" variant="muted">
                    · {detalle(persona)}
                  </Text>
                </Text>
              </TextoCompleto>
            }
            lateral={
              <div className="flex items-center gap-2">
                <Text as="span" size="sm" variant="muted">
                  {persona.area}
                </Text>
                {deGrupos.has(persona.id) ? (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={(evento) => {
                      evento.stopPropagation()
                      setEnGrupo(persona)
                    }}
                  >
                    Excluir del grupo
                  </Button>
                ) : dejadas.has(persona.id) ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(evento) => {
                      evento.stopPropagation()
                      onCambio(withPeopleIncluded(seleccion, [persona.id]))
                    }}
                  >
                    Incluir en el grupo
                  </Button>
                ) : null}
              </div>
            }
          />
        ))}
      </ListaElegible>

      {/* La persona entró por un grupo: dos formas de sacarla, en la ventana de confirmar del sistema. */}
      <DialogoConfirmar
        abierto={enGrupo !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setEnGrupo(null))}
        icono={UserRemove01Icon}
        titulo="¿Excluir a esta persona del grupo?"
        descripcion={
          enGrupo
            ? `«${enGrupo.name}» está en la encuesta porque elegiste el grupo «${grupoDe(enGrupo)}» (${SEGMENT_LABELS[seleccion.groupSegmentBy]}). El grupo sigue elegido y su fila dirá quién quedó fuera. Para quitar el grupo entero, desmarca el grupo en «Por grupos».`
            : ''
        }
        accion="Excluir del grupo"
        onConfirmar={() => {
          if (enGrupo) onCambio(withPersonExcluded(seleccion, enGrupo.id))
          setEnGrupo(null)
        }}
      />
    </div>
  )
}
