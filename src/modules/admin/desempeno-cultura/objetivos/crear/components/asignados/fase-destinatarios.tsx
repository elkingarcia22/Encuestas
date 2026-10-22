import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, WeightScaleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@ubits/flux-ui'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { FilaElegible, ListaElegible } from '@/modules/design-system/listas/lista-elegible'
import { Badge } from '@/shared/components/Badge'
import { SinResultados } from '@/shared/components/SinResultados'
import { EncabezadoPaso } from '../../../../encuestas/components/pasos-drawer'
import type { Collaborator } from '../../../../encuestas/modelo/collaborators'
import { SEGMENT_LABELS, formatCount, segmentCounts } from '../../../../encuestas/modelo/participants'
import type { SegmentKey } from '../../../../encuestas/modelo/surveyBuilderTypes'
import { TOTAL_WEIGHT } from '../../../modelo/constructor/cicloBuilderTypes'
import { sourceLabels, type PersonLoad } from '../../../modelo/constructor/weightConflicts'

// Fase 1 del panel de asignación: a quién le llegan estos objetivos. Las listas son la pieza del sistema ListaElegible, la
// de «Participantes» de Encuestas (war room del 13-oct: lista y no tabla), con lo propio de los destinatarios: en grupos, el grupo que ya lleva
// objetivos por otra asignación se puede marcar (sale «Ya tiene objetivos» y el choque se reparte con «Repartir el
// peso»); en individual, quien ya está en otra asignación individual ni aparece. Arriba, el aviso de carga previa
// cuando alguien de los marcados ya reparte peso por otra vía, y en grupos «Sincronizar con el grupo».

const SEGMENTOS = (Object.entries(SEGMENT_LABELS) as [SegmentKey, string][]).map(([value, label]) => ({ value, label }))

const enPagina = <T,>(lista: readonly T[], actual: number, porPagina: number) => lista.slice((actual - 1) * porPagina, actual * porPagina)

/** Lo que reparten ya las personas marcadas, con sus dos salidas: quedarse con el hueco libre o repartir su 100 %. */
export function AvisoCargaPrevia({ cargas, libre, onRepartir, onUsarLibre }: { cargas: readonly PersonLoad[]; libre: number; onRepartir: () => void; onUsarLibre: () => void }) {
  const lleno = libre === 0
  const nombres = cargas.slice(0, 3).map((carga) => carga.name).join(', ')
  const vias = sourceLabels(cargas)
  const por = vias.slice(0, 2).join(' y ') + (vias.length > 2 ? ` y ${vias.length - 2} más` : '')
  const titular =
    cargas.length === 1
      ? lleno
        ? `${nombres} ya reparte todo su ${TOTAL_WEIGHT} % de peso`
        : `A ${nombres} solo le queda ${libre} % de peso libre`
      : lleno
        ? `${cargas.length} personas ya reparten todo su ${TOTAL_WEIGHT} % de peso`
        : `A ${cargas.length} personas solo les queda ${libre} % de peso libre`
  const detalle = lleno
    ? `Ya reciben objetivos por ${por}. Los objetivos de una persona reparten ${TOTAL_WEIGHT} % entre todos, así que aquí no cabe ninguno más hasta que le bajes el peso a esos.`
    : `Ya reciben objetivos por ${por}. Lo que crees aquí solo puede llevarse ese ${libre} %, salvo que le bajes el peso a lo que ya tienen.`

  return (
    <Alert variant="warning">
      <HugeiconsIcon icon={WeightScaleIcon} aria-hidden="true" />
      <AlertTitle>{titular}</AlertTitle>
      <AlertDescription>
        <p>
          {detalle}
          {cargas.length > 1 ? ` (${nombres}${cargas.length > 3 ? ` y ${cargas.length - 3} más` : ''})` : ''}
        </p>
      </AlertDescription>
      <AlertAction className="flex items-center gap-2">
        {libre > 0 ? (
          <Button variant="outline" size="sm" onClick={onUsarLibre}>
            Usar solo ese {libre} %
          </Button>
        ) : null}
        <Button size="sm" onClick={onRepartir}>
          Repartir el peso
        </Button>
      </AlertAction>
    </Alert>
  )
}

export function FaseDestinatarios({
  grupal,
  plantilla,
  aviso,
  sincronizar,
  onSincronizar,
  segmentBy,
  onSegmentBy,
  elegidos,
  onElegidos,
  tomados,
  personas,
}: {
  grupal: boolean
  plantilla: boolean
  aviso: ReactNode
  sincronizar: boolean
  onSincronizar: (activo: boolean) => void
  segmentBy: SegmentKey
  onSegmentBy: (valor: SegmentKey) => void
  elegidos: readonly string[]
  onElegidos: (elegidos: readonly string[]) => void
  /** Grupos con objetivos en otra asignación grupal (se marcan igual, con su insignia). */
  tomados: ReadonlySet<string>
  /** Individual: el directorio menos quien ya está en otra asignación individual. */
  personas: readonly Collaborator[]
}) {
  const quienes = grupal ? 'grupos' : 'personas'
  const descripcion = plantilla
    ? `La plantilla ya trae estos objetivos escritos y con su peso repartido — solo falta decidir a qué ${quienes} pertenecen.`
    : grupal
      ? 'Todo lo que marques aquí compartirá un mismo set de objetivos.'
      : 'Cada persona que marques recibirá el mismo set de objetivos. Quien ya tenga objetivos en otra asignación no aparece aquí.'

  return (
    <section className="flex flex-col gap-4" aria-label={grupal ? 'Elige los grupos' : 'Elige las personas'}>
      <EncabezadoPaso titulo={grupal ? 'Elige los grupos' : 'Elige las personas'} descripcion={descripcion} />
      {aviso}
      {grupal ? (
        <Field orientation="horizontal">
          <Switch id="asignacion-sincronizar" checked={sincronizar} onCheckedChange={(valor) => onSincronizar(valor === true)} />
          <FieldContent>
            <FieldLabel htmlFor="asignacion-sincronizar">Sincronizar con el grupo</FieldLabel>
            <FieldDescription>Sigue el organigrama: quien entre hereda estos objetivos. Quien salga queda inactivo, con los suyos disponibles para consulta pero sin contar en el avance.</FieldDescription>
          </FieldContent>
        </Field>
      ) : null}
      {grupal ? (
        <ListaGrupos segmentBy={segmentBy} onSegmentBy={onSegmentBy} elegidos={elegidos} onElegidos={onElegidos} tomados={tomados} />
      ) : (
        <ListaPersonas personas={personas} elegidos={elegidos} onElegidos={onElegidos} />
      )}
    </section>
  )
}

function ListaGrupos({
  segmentBy,
  onSegmentBy,
  elegidos,
  onElegidos,
  tomados,
}: {
  segmentBy: SegmentKey
  onSegmentBy: (valor: SegmentKey) => void
  elegidos: readonly string[]
  onElegidos: (elegidos: readonly string[]) => void
  tomados: ReadonlySet<string>
}) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const marcados = new Set(elegidos)

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return [...segmentCounts(segmentBy).entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .filter(([grupo]) => !q || grupo.toLowerCase().includes(q))
      .filter(([grupo]) => !soloElegidos || elegidos.includes(grupo))
  }, [segmentBy, elegidos, busqueda, soloElegidos])
  const visibles = enPagina(grupos, actual, porPagina)
  const todaLaPagina = visibles.length > 0 && visibles.every(([grupo]) => marcados.has(grupo))
  const alternar = (grupo: string) => onElegidos(marcados.has(grupo) ? elegidos.filter((otro) => otro !== grupo) : [...elegidos, grupo])
  const alternarPagina = () => {
    const pagina = new Set(visibles.map(([grupo]) => grupo))
    onElegidos(todaLaPagina ? elegidos.filter((grupo) => !pagina.has(grupo)) : [...new Set([...elegidos, ...pagina])])
  }

  // La lista para elegir del sistema (ListaElegible, la de Elkin en Participantes de Encuestas; war room del 13-oct).
  const limpiar = () => {
    setBusqueda('')
    setSoloElegidos(false)
    setActual(1)
  }

  return (
    <ListaElegible
      id="asignacion-grupos"
      nombre="grupos"
      resumen={`${formatCount(grupos.length)} ${grupos.length === 1 ? 'grupo' : 'grupos'} por ${SEGMENT_LABELS[segmentBy].toLowerCase()}`}
      buscador={{
        valor: busqueda,
        placeholder: 'Busca un grupo por su nombre',
        onValor: (valor) => {
          setBusqueda(valor)
          setActual(1)
        },
      }}
      herramientas={
        <>
          {/* Los grupos son de una sola categoría a la vez: cambiarla quita los elegidos. */}
          <Select
            value={segmentBy}
            onValueChange={(valor) => {
              onSegmentBy(valor as SegmentKey)
              setActual(1)
            }}
            items={SEGMENTOS}
          >
            <SelectTrigger className="w-48" aria-label="Agrupar por">
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
          <Button
            variant={soloElegidos ? 'secondary' : 'outline'}
            aria-pressed={soloElegidos}
            onClick={() => {
              setSoloElegidos(!soloElegidos)
              setActual(1)
            }}
          >
            {soloElegidos ? 'Ver todos los grupos' : `Ver elegidos (${formatCount(elegidos.length)})`}
          </Button>
        </>
      }
      casillaPagina={{
        marcada: todaLaPagina,
        parcial: !todaLaPagina && visibles.some(([grupo]) => marcados.has(grupo)),
        onCambio: alternarPagina,
        etiqueta: 'Marcar los grupos de esta página',
      }}
      paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: grupos.length }}
      // «Ver elegidos» cuenta como filtro: limpiar quita la búsqueda y vuelve a la lista completa.
      vacio={<SinResultados busqueda={busqueda} filtrosActivos={soloElegidos ? 1 : 0} onLimpiar={limpiar} />}
    >
      {visibles.map(([grupo, cuantos]) => (
        <FilaElegible
          key={grupo}
          marcada={marcados.has(grupo)}
          onCambio={() => alternar(grupo)}
          etiqueta={`Marcar el grupo ${grupo}`}
          titulo={grupo}
          detalle={`${formatCount(cuantos)} ${cuantos === 1 ? 'persona' : 'personas'}`}
          resaltada
          lateral={
            tomados.has(grupo) ? (
              <Badge variant="warning-light" size="xs">
                <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                Ya tiene objetivos
              </Badge>
            ) : undefined
          }
        />
      ))}
    </ListaElegible>
  )
}
const coincide = (persona: Collaborator, q: string) => `${persona.name} ${persona.username} ${persona.email} ${persona.area} ${persona.leader ?? ''}`.toLowerCase().includes(q)

function ListaPersonas({ personas, elegidos, onElegidos }: { personas: readonly Collaborator[]; elegidos: readonly string[]; onElegidos: (elegidos: readonly string[]) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const marcados = new Set(elegidos)

  const q = busqueda.trim().toLowerCase()
  const resultado = useMemo(() => personas.filter((persona) => (!q || coincide(persona, q)) && (!soloElegidos || elegidos.includes(persona.id))), [personas, q, soloElegidos, elegidos])
  const visibles = enPagina(resultado, actual, porPagina)
  const paginaCompleta = visibles.length > 0 && visibles.every((persona) => marcados.has(persona.id))
  const alternar = (id: string) => onElegidos(marcados.has(id) ? elegidos.filter((otro) => otro !== id) : [...elegidos, id])
  const alternarPagina = () => {
    const pagina = new Set(visibles.map((persona) => persona.id))
    onElegidos(paginaCompleta ? elegidos.filter((id) => !pagina.has(id)) : [...new Set([...elegidos, ...pagina])])
  }

  return (
    <ListaElegible
      id="asignacion-personas"
      nombre="personas"
      buscador={{
        valor: busqueda,
        placeholder: 'Busca por nombre, usuario, correo, área o líder',
        onValor: (valor) => {
          setBusqueda(valor)
          setActual(1)
        },
      }}
      herramientas={
        <Button
          variant={soloElegidos ? 'secondary' : 'outline'}
          aria-pressed={soloElegidos}
          onClick={() => {
            setSoloElegidos(!soloElegidos)
            setActual(1)
          }}
        >
          {soloElegidos ? 'Ver todas las personas' : `Ver elegidas (${formatCount(elegidos.length)})`}
        </Button>
      }
      casillaPagina={{
        marcada: paginaCompleta,
        parcial: !paginaCompleta && visibles.some((persona) => marcados.has(persona.id)),
        onCambio: alternarPagina,
        etiqueta: 'Seleccionar esta página',
      }}
      paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
      vacio={
        <SinResultados
          busqueda={busqueda}
          filtrosActivos={soloElegidos ? 1 : 0}
          onLimpiar={() => {
            setBusqueda('')
            setSoloElegidos(false)
            setActual(1)
          }}
        />
      }
    >
      {visibles.map((persona) => (
        <FilaElegible
          key={persona.id}
          marcada={marcados.has(persona.id)}
          onCambio={() => alternar(persona.id)}
          etiqueta={`Seleccionar a ${persona.name}`}
          contenido={<Persona nombre={persona.name} detalle={persona.email} />}
          resaltada
          lateral={
            <Badge variant="outline" size="xs">
              {persona.area}
            </Badge>
          }
        />
      ))}
    </ListaElegible>
  )
}