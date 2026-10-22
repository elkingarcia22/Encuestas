import { useMemo, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Delete02Icon, Edit02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, Field, FieldDescription, FieldLabel, Input, ItemDescription, ItemTitle, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { plural } from '@/modules/design-system/patrones/formato'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { FilaElegible, ListaElegible } from '@/modules/design-system/listas/lista-elegible'
import { formatCount } from '../../../../encuestas/modelo/participants'
import type { ObjectiveSet, ObjectiveSetKind } from '../../../modelo/constructor/cicloBuilderTypes'
import type { AssignmentSetSummary } from '../../../modelo/constructor/assignmentRows'
import { EstadoAgrupacion } from './piezas-asignacion'
import type { Collaborator } from '../../../../encuestas/modelo/collaborators'
import { BotonFiltros } from '../../../../encuestas/crear/components/participantes/filtros-personas'
import { camposDePersona, conFiltro, cumpleFiltros, type FiltrosPersona } from '../../../../encuestas/modelo/filtrosPersona'

// La lista de un nivel del paso, la misma de Participantes (Por grupos / Por persona): ListaElegible dentro del acordeón
// del nivel (21-oct, Elkin: «como en Participantes»), con la casilla de la página, el nombre de la lista, el buscador y los
// filtros en su fila de arriba, las filas con su casilla y el pie de paginación del sistema. Cada fila
// es un grupo o una persona de los que entraron al ciclo, con sus objetivos, el peso repartido, si ya está lista y su
// acción a la derecha: «Crear objetivos» o «Editar». Con algo marcado, las acciones en bloque toman el lugar del conteo.
// La selección vive en el nivel: lo marcado en otras páginas se conserva.

export type FilaAsignado = {
  /** El id de la selección: la agrupación (grupos) o agrupación + persona (colaboradores). */
  id: string
  targetId: string
  nombre: string
  detalle: string
  esGrupo: boolean
  set: ObjectiveSet | null
  resumen: AssignmentSetSummary | null
  /** En colaboradores, la persona: con ella se filtra por líder, rol, área, país y ciudad. */
  persona?: Collaborator
}

const ESTADOS = ['Sin objetivos', 'Lista', 'Por terminar'] as const
const estadoDe = (fila: FilaAsignado) => ((fila.set?.objectives.length ?? 0) === 0 ? 'Sin objetivos' : fila.resumen?.issue ? 'Por terminar' : 'Lista')

/** `principal`: la acción que se queda con texto; las demás van como icono con su etiqueta en la ayuda. */
export type AccionEnBloque = { id: string; etiqueta: string; icono: IconSvgElement; destructiva?: boolean; principal?: boolean; onClick: () => void }

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function Objetivos({ set }: { set: ObjectiveSet | null }) {
  const cuantos = set?.objectives.length ?? 0
  if (!set || cuantos === 0) {
    return (
      <Text as="span" size="sm" variant="muted">
        Sin objetivos
      </Text>
    )
  }
  const titulos = (
    <span className="flex flex-col gap-1">
      {set.objectives.slice(0, 8).map((objetivo, i) => (
        <span key={objetivo.id} className="truncate">
          {i + 1}. {objetivo.title || 'Objetivo sin título'}
          {objetivo.weight !== null ? ` · ${objetivo.weight} %` : ''}
        </span>
      ))}
      {cuantos > 8 ? <span>y {cuantos - 8} más</span> : null}
    </span>
  )
  return (
    <Hint label={titulos}>
      <Text as="span" size="sm" variant="muted" className="tabular-nums" tabIndex={0}>
        {cuantos} {plural(cuantos, 'objetivo', 'objetivos')}
      </Text>
    </Hint>
  )
}

export function ListaRoster({
  tipo,
  filas,
  conErrores,
  onAbrir,
  onEliminar,
  marcadas,
  onMarcadas,
  acciones,
}: {
  tipo: ObjectiveSetKind
  filas: readonly FilaAsignado[]
  conErrores: boolean
  onAbrir: (fila: FilaAsignado) => void
  /** Quita todos los objetivos de esa fila (tras confirmar). */
  onEliminar: (fila: FilaAsignado) => void
  marcadas: ReadonlySet<string>
  onMarcadas: (seleccion: ReadonlySet<string>) => void
  /** Lo que se hace con lo marcado, ya decidido por el nivel según la selección. */
  acciones: readonly AccionEnBloque[]
}) {
  const grupal = tipo === 'grupal'
  const [busqueda, setBusqueda] = useState('')
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [eliminando, setEliminando] = useState<FilaAsignado | null>(null)
  const [estado, setEstado] = useState('')
  const [filtros, setFiltros] = useState<FiltrosPersona>({})
  const personas = useMemo(() => filas.flatMap((fila) => (fila.persona ? [fila.persona] : [])), [filas])
  const campos = [
    { id: 'estado', etiqueta: 'Estado', todos: 'Todos los estados', valor: estado, opciones: ESTADOS },
    ...(grupal ? [] : camposDePersona(personas, filtros)),
  ]
  const cambiarFiltro = (id: string, valor: string) => {
    if (id === 'estado') setEstado(valor)
    else setFiltros((actuales) => conFiltro(actuales, id, valor))
    setActual(1)
  }
  // Para borrar hay que escribir el nombre (como «Escribir para confirmar» del design system): sin mayúsculas ni tildes.
  const [confirmacion, setConfirmacion] = useState('')
  const abrirEliminar = (fila: FilaAsignado) => {
    setConfirmacion('')
    setEliminando(fila)
  }
  const nombreEscrito = eliminando !== null && sinTildes(confirmacion.trim()) === sinTildes(eliminando.nombre.trim())

  const terminos = sinTildes(busqueda).split(/\s+/).filter(Boolean)
  const resultado = filas.filter(
    (fila) =>
      terminos.every((termino) => sinTildes(`${fila.nombre} ${fila.detalle}`).includes(termino)) &&
      (!estado || estadoDe(fila) === estado) &&
      (!fila.persona || cumpleFiltros(fila.persona, filtros)),
  )
  const visibles = pagina([...resultado], actual, porPagina)
  const enPagina = visibles.filter((fila) => marcadas.has(fila.id)).length
  const paginaCompleta = visibles.length > 0 && enPagina === visibles.length

  const alternar = (id: string) => {
    const siguiente = new Set(marcadas)
    if (siguiente.has(id)) siguiente.delete(id)
    else siguiente.add(id)
    onMarcadas(siguiente)
  }
  const alternarPagina = () => {
    const ids = visibles.map((fila) => fila.id)
    onMarcadas(paginaCompleta ? new Set([...marcadas].filter((id) => !ids.includes(id))) : new Set([...marcadas, ...ids]))
  }

  const unidad = grupal ? 'grupo' : 'colaborador'
  const unidades = grupal ? 'grupos' : 'colaboradores'
  const conMarcadas = marcadas.size > 0 && acciones.length > 0
  const filtrosActivos = (estado ? 1 : 0) + Object.values(filtros).filter(Boolean).length

  // Las acciones en bloque, con algo marcado: la principal con texto y las demás en icono con su globo.
  const enBloque = acciones.map((accion) =>
    accion.principal ? (
      <Button key={accion.id} variant="outline" onClick={accion.onClick}>
        <HugeiconsIcon icon={accion.icono} aria-hidden="true" />
        {accion.etiqueta}
      </Button>
    ) : (
      // Rojo de borrar: los botones sin borde no traen tono rojo (diferencias.json › button-ghost-tonos). Solo en las acciones destructivas.
      <Hint key={accion.id} label={accion.etiqueta}>
        <BotonIcono aria-label={accion.etiqueta} className={accion.destructiva ? 'text-destructive!' : undefined} onClick={accion.onClick}>
          <HugeiconsIcon icon={accion.icono} aria-hidden="true" />
        </BotonIcono>
      </Hint>
    ),
  )

  return (
    <>
      {filas.length === 0 ? (
        // Los vacíos van con su ilustración glass (PrimeraVez y SinResultados), no armados a mano (unión del 9-oct).
        <PrimeraVez
          icono="glass-profile"
          titulo={grupal ? 'No hay grupos entre los participantes' : 'No hay colaboradores entre los participantes'}
          descripcion="Elige quiénes entran al ciclo en el paso Participantes."
        />
      ) : (
        // La lista de Participantes (ListaElegible, regla «lista-elegible»): un solo panel blanco con la fila de arriba —la
        // casilla de la página, el nombre de la lista (o cuántos hay marcados), el buscador y los filtros— y debajo las filas,
        // con el pie de paginación solo cuando hay más de una página. Con algo marcado, sus acciones van en esa misma fila.
        <ListaElegible
          id={`asignados-${tipo}`}
          nombre={unidades}
          herramientasEnCabecera
          titulo={{ texto: marcadas.size > 0 ? `${formatCount(marcadas.size)} ${plural(marcadas.size, `${unidad} marcado`, `${unidades} marcados`)}` : grupal ? 'Grupos' : 'Colaboradores' }}
          buscador={{
            valor: busqueda,
            placeholder: grupal ? 'Busca un grupo' : 'Busca por nombre o área',
            onValor: (valor) => {
              setBusqueda(valor)
              setActual(1)
            },
          }}
          herramientas={
            <>
              {conMarcadas ? enBloque : null}
              <BotonFiltros campos={campos} onCambio={cambiarFiltro} descripcion={grupal ? 'Muestra solo los grupos en cierto estado.' : 'Acota por estado, líder, rol, área, país o ciudad.'} />
            </>
          }
          casillaPagina={{ marcada: paginaCompleta, parcial: enPagina > 0 && !paginaCompleta, onCambio: alternarPagina, etiqueta: `Marcar los ${unidades} de esta página` }}
          paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
          vacio={
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={filtrosActivos}
              onLimpiar={() => {
                setBusqueda('')
                setEstado('')
                setFiltros({})
                setActual(1)
              }}
            />
          }
        >
          {visibles.map((fila) => {
            const conObjetivos = (fila.set?.objectives.length ?? 0) > 0
            return (
              <FilaElegible
                key={fila.id}
                marcada={marcadas.has(fila.id)}
                onCambio={() => alternar(fila.id)}
                etiqueta={`Marcar ${grupal ? 'el grupo' : 'a'} ${fila.nombre}`}
                contenido={
                  fila.esGrupo ? (
                    <>
                      <TextoCompleto texto={fila.nombre}>
                        <ItemTitle className="truncate">{fila.nombre}</ItemTitle>
                      </TextoCompleto>
                      <ItemDescription>{fila.detalle}</ItemDescription>
                    </>
                  ) : (
                    <Persona nombre={fila.nombre} detalle={fila.detalle} />
                  )
                }
                // Lo que lleva (objetivos y si ya está lista) y, al final, sus acciones: con objetivos, editar y eliminar en
                // iconos; sin ellos, el botón para crearlos. El peso ya lo dice el estado.
                lateral={
                  <div className="flex items-center gap-3">
                    <Objetivos set={fila.set} />
                    {fila.resumen && conObjetivos ? <EstadoAgrupacion problema={fila.resumen.issue} conErrores={conErrores} /> : null}
                    {conObjetivos ? (
                      <span className="flex items-center gap-1">
                        <Hint label="Editar objetivos">
                          <BotonIcono aria-label={`Editar los objetivos de ${fila.nombre}`} onClick={() => onAbrir(fila)}>
                            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                          </BotonIcono>
                        </Hint>
                        {/* Rojo de borrar: los botones sin borde no traen tono rojo (diferencias.json › button-ghost-tonos). */}
                        <Hint label="Eliminar objetivos">
                          <BotonIcono aria-label={`Eliminar los objetivos de ${fila.nombre}`} className="text-destructive!" onClick={() => abrirEliminar(fila)}>
                            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                          </BotonIcono>
                        </Hint>
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onAbrir(fila)}>
                        <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                        Crear objetivos
                      </Button>
                    )}
                  </div>
                }
              />
            )
          })}
        </ListaElegible>
      )}

      <DialogoConfirmar
        abierto={eliminando !== null}
        onAbiertoChange={(abrir) => (abrir ? undefined : setEliminando(null))}
        icono={Delete02Icon}
        titulo={`¿Eliminar los objetivos de ${eliminando?.nombre ?? ''}?`}
        descripcion={
          eliminando
            ? `${eliminando.esGrupo ? `El grupo ${eliminando.nombre}` : eliminando.nombre} se queda sin ${(eliminando.set?.objectives.length ?? 0) === 1 ? 'su objetivo' : `sus ${eliminando.set?.objectives.length ?? 0} objetivos`} en este ciclo.${
                (eliminando.set?.targetIds.length ?? 0) > 1 ? ' Los demás de su agrupación los conservan.' : ''
              } Esta acción no se puede deshacer.`
            : ''
        }
        accion="Eliminar objetivos"
        destructiva
        deshabilitada={!nombreEscrito}
        onConfirmar={() => {
          if (eliminando) onEliminar(eliminando)
          setEliminando(null)
        }}
      >
        {eliminando ? (
          <RegistroConfirmar
            nombre={eliminando.nombre}
            detalle={`${eliminando.detalle} · ${eliminando.set?.objectives.length ?? 0} ${(eliminando.set?.objectives.length ?? 0) === 1 ? 'objetivo' : 'objetivos'}`}
            tono="neutro"
          />
        ) : null}
        <Field>
          <FieldLabel htmlFor={`asignados-${tipo}-confirmar`}>
            Escribe «{eliminando?.nombre}» para confirmar
          </FieldLabel>
          <Input id={`asignados-${tipo}-confirmar`} value={confirmacion} autoComplete="off" onChange={(evento) => setConfirmacion(evento.target.value)} />
          <FieldDescription>El botón se habilita cuando el nombre coincide.</FieldDescription>
        </Field>
      </DialogoConfirmar>
    </>
  )
}
