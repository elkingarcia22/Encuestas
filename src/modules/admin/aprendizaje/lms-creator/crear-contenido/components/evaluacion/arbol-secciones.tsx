import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Cancel01Icon, Delete02Icon, DragDropVerticalIcon, Edit02Icon, MoreVerticalIcon, PlusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Heading,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Separator,
  Frame,
  FramePanel,
  Input,
  Item,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Text,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import type { Pregunta } from '../borrador'
import { enunciadoDe, etiquetaDe, tipoDe } from './logica'
import { contarPreguntas, destinosDePregunta, entradasDe, type EntradaSeccion, type SeccionPreguntas } from './secciones'
import { MoverA } from './mover-a'
import { RespuestasEnLectura, TarjetaPregunta, type AccionPregunta } from './tarjeta-pregunta'

/**
 * **El contenido de una evaluación o una encuesta, por secciones.**
 *
 * La estructura y la lógica —mover, ordenar, numerar, contar— son las del creador de encuestas de Desempeño y cultura:
 * se usan **sus** funciones tal cual (ver `secciones.ts`). Lo que no se puede compartir es la fila y su formulario: su
 * componente abre el editor de pregunta de encuesta a fuego, y **no se tocan los archivos de otra persona**
 * (Dave, 8-oct). Así que esta pieza repite su pantalla —comparada contra ella, no contra su código— hasta que esa
 * parte se pueda abrir desde su lado:
 *
 * - **Siempre hay al menos una sección**: la página nace con la suya y lo que se añade entra ahí.
 * - **Un solo botón «Añadir»** por sección, con menú; si tiene subsecciones, la pregunta pregunta en cuál entra.
 * - **Las asas se ven siempre**, y se arrastran secciones, subsecciones y preguntas.
 * - Una pregunta que no se edita es **una fila**: número, enunciado y tipo.
 */

type Props = {
  secciones: SeccionPreguntas[]
  encuesta: boolean
  soloLectura: boolean
  activa: string | null
  numeroDe: (preguntaId: string) => number
  onActivar: (preguntaId: string | null) => void
  onCambiarPregunta: (pregunta: Pregunta) => void
  onAccionPregunta: (preguntaId: string, que: AccionPregunta) => void
  onAnadirPregunta: (seccionId: string) => void
  onReordenar: (seccionId: string, preguntas: Pregunta[]) => void
  onReordenarSecciones: (secciones: SeccionPreguntas[]) => void
  onTitulo: (seccionId: string, titulo: string) => void
  onDescripcion: (seccionId: string, descripcion: string) => void
  onMoverPregunta: (preguntaId: string, destinoId: string) => void
  /** La pregunta que acaba de nacer: su pie dice «Agregar» en vez de «Guardar». */
  nueva: string | null
  /** Las que ya intentaron guardarse incompletas: sus campos vacíos se marcan. */
  marcadas: string[]
  /** Sube en cada intento fallido, para que el formulario vuelva a marcar aunque ya estuviera marcado. */
  intento: number
  onTerminarEdicion: (guardar: boolean) => void
  onEliminarSeccion: (seccionId: string) => void
  recien: string | null
}

/** Con algo abierto, lo demás no se puede tocar: ni se pulsa ni se lee como disponible. */
const APAGADO = 'pointer-events-none opacity-50'

export function ArbolSecciones(props: Props) {
  const { secciones, soloLectura, onReordenarSecciones } = props
  const raices = entradasDe(secciones).filter((e) => e.depth === 1)

  const lista = (
    <div className="flex flex-col gap-3">
      {/* El marco lo pone **la propia sección** (`NodoSeccion`), que es quien sabe dónde van sus líneas y su pie.
          Aquí había otro envolviéndola, así que cada sección salía con dos bordes grises, uno dentro del otro
          (Dave, 9-oct). */}
      {raices.map((entrada) => (
        <SortableItem key={entrada.section.id} value={entrada.section.id}>
          <NodoSeccion {...props} entrada={entrada} />
        </SortableItem>
      ))}
    </div>
  )

  if (soloLectura || secciones.length < 2) return lista
  return (
    <Sortable value={[...secciones]} onValueChange={(x) => onReordenarSecciones([...x])} getItemValue={(s) => s.id}>
      {lista}
    </Sortable>
  )
}

/**
 * **La anatomía es la del creador de encuestas, fila por fila** (comparado contra su pantalla, 9-oct):
 *
 * - **Una sección de primer nivel es un contenedor**: su cabecera con el asa, el número y el título; una línea; su
 *   contenido; otra línea; y un **pie** que dice qué tiene a la izquierda y lleva «Añadir» a la derecha.
 * - **Una subsección es una fila de acordeón sin caja**, con el **chevron antes del asa** y su contenido sangrado.
 * - **El título es un `Heading` de nivel 6** y la descripción, un `Text` de 14 px: antes eran un texto mediano y una
 *   línea de 12, y la fila se leía más floja que la suya.
 * - **Editar, mover y eliminar salen al pasar el cursor**; el asa y el chevron se ven siempre. En pantalla táctil,
 *   donde no hay cursor, todo se queda a la vista.
 */
// Lo mismo que su `AL_PASAR`: `hidden`/`flex` en vez de opacidad —un botón invisible pero presente se puede pulsar
// sin querer— y `pointer-coarse` para que en táctil no desaparezcan.
const AL_PASAR = 'hidden group-hover/fila:flex group-focus-within/fila:flex has-[[data-popup-open]]:flex pointer-coarse:flex'

function NodoSeccion({ entrada, ...props }: Props & { entrada: EntradaSeccion }) {
  const { secciones, soloLectura, onTitulo, onDescripcion, onEliminarSeccion, onAnadirPregunta, recien } = props
  const { section, numbering } = entrada
  const [abierta, setAbierta] = useState(true)
  const [editandoTitulo, setEditandoTitulo] = useState(recien === section.id)
  const nombre = section.title.trim() || `Sección ${numbering}`
  // La última sección no se borra: la página se quedaría sin dónde poner preguntas.
  const ultima = secciones.length === 1
  const vacia = section.questions.length === 0

  const asa = !soloLectura ? (
    // El asa **no se esconde nunca**: escondida hasta pasar el cursor, nadie descubre que esto se reordena (Dave, 8-oct).
    <SortableItemHandle render={<BotonIcono size="icon-xs" aria-label={`Mover ${nombre}`} className="text-muted-foreground!" />}>
      <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
    </SortableItemHandle>
  ) : null

  const plegar = (
    <BotonIcono aria-label={abierta ? `Contraer ${nombre}` : `Expandir ${nombre}`} aria-expanded={abierta} onClick={() => setAbierta((x) => !x)}>
      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', abierta && 'rotate-180')} />
    </BotonIcono>
  )

  const acciones = soloLectura ? null : (
    <>
      <Hint label={editandoTitulo ? 'Listo' : 'Editar título y descripción'}>
        {editandoTitulo ? (
          // Editando, el visto es un secundario con borde, del alto del campo; si no, el terciario redondo de siempre.
          <Button variant="outline" size="icon" aria-label={`Terminar de editar ${nombre}`} onClick={() => setEditandoTitulo(false)}>
            <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
          </Button>
        ) : (
          <BotonIcono aria-label={`Editar ${nombre}`} onClick={() => setEditandoTitulo(true)}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
          </BotonIcono>
        )}
      </Hint>
      {!ultima ? (
        <Hint label="Eliminar sección">
          {editandoTitulo ? (
            <Button variant="outline" size="icon" aria-label={`Eliminar ${nombre}`} className="text-destructive!" onClick={() => onEliminarSeccion(section.id)}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
            </Button>
          ) : (
            <BotonIcono aria-label={`Eliminar ${nombre}`} className="text-destructive!" onClick={() => onEliminarSeccion(section.id)}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
            </BotonIcono>
          )}
        </Hint>
      ) : null}
    </>
  )

  return (
    <Frame id={`seccion-${section.id}`}>
      <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
        <div className="group/fila flex items-start gap-2 px-5 py-4">
          <span className={cn('flex shrink-0 items-center gap-2', editandoTitulo ? 'h-9' : 'h-6')}>
            {asa}
            <Badge size="sm" className="tabular-nums">
              {numbering}
            </Badge>
          </span>
          <TituloSeccion entrada={entrada} editando={editandoTitulo} onTitulo={onTitulo} onDescripcion={onDescripcion} onTerminar={() => setEditandoTitulo(false)} />
          <div className={cn('flex shrink-0 items-center gap-1', editandoTitulo ? 'h-9' : 'h-6')}>
            <div className={cn('items-center gap-1', editandoTitulo ? 'flex' : AL_PASAR)}>{acciones}</div>
            {/* Editando el título no se pliega la sección: quedan solo el visto y la papelera. */}
            {editandoTitulo ? null : plegar}
          </div>
        </div>
        {abierta ? (
          <>
            <Separator />
            {vacia && !soloLectura ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyTitle>Esta sección está vacía</EmptyTitle>
                  <EmptyDescription>Agrega una pregunta para empezar.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row justify-center gap-2">
                  <Button variant="outline" onClick={() => onAnadirPregunta(section.id)}>
                    Crear pregunta
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <div className="px-5 py-3">
                  <FilasPreguntas {...props} entrada={entrada} />
                </div>
                {!soloLectura ? (
                  <>
                    <Separator />
                    {/* El pie: qué tiene la sección a la izquierda y la acción para sumar a la derecha. */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <Text as="p" size="sm" variant="muted" aria-live="polite">
                        {`Esta sección tiene ${contarPreguntas(section) === 1 ? '1 pregunta' : `${contarPreguntas(section)} preguntas`}.`}
                      </Text>
                      <Button variant="outline" className="shrink-0" onClick={() => onAnadirPregunta(section.id)}>
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                        Añadir pregunta
                      </Button>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </FramePanel>
    </Frame>
  )
}

/** «2 subsecciones · 6 preguntas», con el conteo de toda la rama. */
function resumenDe(section: SeccionPreguntas, subsecciones: number) {
  const preguntas = contarPreguntas(section)
  return [subsecciones > 0 ? `${subsecciones} ${subsecciones === 1 ? 'subsección' : 'subsecciones'}` : null, `${preguntas} ${preguntas === 1 ? 'pregunta' : 'preguntas'}`]
    .filter(Boolean)
    .join(' · ')
}

/**
 * El título y la descripción, que se editan **en el mismo sitio donde se leen**. Fuera de edición, el nombre en
 * `Heading` y debajo, en gris, la descripción y el conteo; van ahí y no a la derecha para que, al aparecer las
 * acciones con el cursor, nada se mueva.
 */
function TituloSeccion({
  entrada,
  editando,
  onTitulo,
  onDescripcion,
  onTerminar,
}: {
  entrada: EntradaSeccion
  editando: boolean
  onTitulo: (seccionId: string, titulo: string) => void
  onDescripcion: (seccionId: string, descripcion: string) => void
  onTerminar: () => void
}) {
  const { section, numbering } = entrada
  const nombre = section.title.trim() || `Sección ${numbering}`
  const salir = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') onTerminar()
  }

  if (editando)
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Input
          aria-label="Título de la sección"
          className="w-full font-medium"
          value={section.title}
          placeholder={`Sección ${numbering}`}
          autoFocus
          onFocus={(e) => e.target.select()}
          onKeyDown={salir}
          onChange={(e) => onTitulo(section.id, e.target.value)}
        />
        <Input
          aria-label="Descripción"
          className="w-full"
          value={section.description}
          placeholder="Descripción"
          onKeyDown={salir}
          onChange={(e) => onDescripcion(section.id, e.target.value)}
        />
      </div>
    )

  const detalle = [section.description.trim(), resumenDe(section, section.children.length)].filter(Boolean).join(' · ')
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <Heading as="h3" level={6} className={cn('truncate', !section.title.trim() && 'text-muted-foreground!')}>
        {nombre}
      </Heading>
      {/* **A dos líneas, no a una.** Cortarla con puntos suspensivos se come el final de la descripción y, si es
          larga, el conteo de preguntas entero (Dave, 9-oct). */}
      <Text as="p" size="sm" variant="muted" className="line-clamp-2">
        {detalle}
      </Text>
    </div>
  )
}

/**
 * **La cabecera de una pregunta abierta**: el asa, el icono de su tipo, el número y el menú. El icono dice de un
 * vistazo qué clase de pregunta es sin tener que leer el desplegable, y el menú deja eliminarla sin cerrarla antes.
 * Vive aquí y no en el formulario porque es **la fila** la que sabe dónde está la pregunta y cómo se reordena
 * (Dave, 9-oct).
 *
 * El asa la pone quien la monta, porque es quien sabe si hay algo que reordenar.
 */
function CabeceraPregunta({
  numero,
  jerarquia,
  tipo,
  encuesta = false,
  asa,
  onEliminar,
}: {
  numero: number
  /** «1.2» dentro de la sección 1; «2.1.3» dentro de la subsección 2.1. */
  jerarquia: string
  tipo: Pregunta['tipo']
  encuesta?: boolean
  asa?: ReactNode
  onEliminar?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      {asa}
      <Hint label={etiquetaDe(tipo, encuesta)}>
        <HugeiconsIcon icon={tipoDe(tipo).icono} size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      </Hint>
      <Text as="p" size="sm" weight="medium" className="min-w-0 flex-1 tabular-nums">
        Pregunta {jerarquia}
      </Text>
      {onEliminar ? (
        <DropdownMenu>
          <DropdownMenuTrigger render={<BotonIcono aria-label={`Opciones de la pregunta ${numero}`} />}>
            <HugeiconsIcon icon={MoreVerticalIcon} size={16} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={onEliminar}>
                <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

function FilasPreguntas({
  entrada,
  secciones,
  encuesta,
  soloLectura,
  activa,
  numeroDe,
  onActivar,
  onCambiarPregunta,
  onAccionPregunta,
  onReordenar,
  onMoverPregunta,
  nueva,
  marcadas,
  intento,
  onTerminarEdicion,
}: Props & { entrada: EntradaSeccion }) {
  // Con una pregunta abierta, las demás filas de la lista se apagan.
  const ocupado = activa !== null
  const preguntas = entrada.section.questions

  // Una sección que solo reparte subsecciones no está vacía: decirle que no tiene preguntas es ruido.
  if (preguntas.length === 0) {
    if (entrada.section.children.length > 0) return null
    return (
      <Text as="p" size="sm" variant="muted">
        Todavía no tiene preguntas.
      </Text>
    )
  }

  const filas = (
    <ItemGroup className="gap-0!">
      {preguntas.map((pregunta, indice) => {
        const numero = numeroDe(pregunta.id)
        // «1.2» dentro de la sección 1; «2.1.3» dentro de la subsección 2.1: el número dice **dónde está**.
        const jerarquia = `${entrada.numbering}.${indice + 1}`
        const titulo = enunciadoDe(pregunta).trim() || 'Sin enunciado'

        if (!soloLectura && pregunta.id === activa) {
          return (
            <SortableItem key={pregunta.id} value={pregunta.id}>
              {indice > 0 ? <ItemSeparator /> : null}
              {/* Abierta, la pregunta se edita **en su mismo sitio**, y lo demás del paso queda apagado. Al pie,
                  «Cancelar» y «Agregar» —o «Guardar» si ya existía—: con eso no nacen preguntas a medias
                  (Dave, 9-oct). */}
              <div className="my-2 flex flex-col gap-4 rounded-lg border px-4 py-3">
                <CabeceraPregunta
                  numero={numero}
                  jerarquia={jerarquia}
                  tipo={pregunta.tipo}
                  encuesta={encuesta}
                  asa={
                    <SortableItemHandle render={<BotonIcono size="icon-xs" aria-label={`Mover la pregunta ${numero}`} className="text-muted-foreground!" />}>
                      <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
                    </SortableItemHandle>
                  }
                  onEliminar={() => onAccionPregunta(pregunta.id, 'eliminar')}
                />
                <TarjetaPregunta
                  numero={numero}
                  pregunta={pregunta}
                  encuesta={encuesta}
                  conErrores={marcadas.includes(pregunta.id)}
                  intento={intento}
                  onCambio={onCambiarPregunta}
                />
                <Separator />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => onTerminarEdicion(false)}>
                    <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                    Cancelar
                  </Button>
                  <Button variant="outline" onClick={() => onTerminarEdicion(true)}>
                    <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
                    {nueva === pregunta.id ? 'Agregar' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </SortableItem>
          )
        }

        return (
          <SortableItem key={pregunta.id} value={pregunta.id}>
            {indice > 0 ? <ItemSeparator /> : null}
            <Item
              size="sm"
              data-pregunta-id={pregunta.id}
              inert={ocupado}
              className={cn('group/fila items-start!', !soloLectura && 'hover:bg-muted!', ocupado && APAGADO)}
            >
              {!soloLectura ? (
                <SortableItemHandle render={<BotonIcono size="icon-xs" aria-label={`Mover la pregunta ${numero}`} className="text-muted-foreground!" />}>
                  <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
                </SortableItemHandle>
              ) : null}
              <ItemContent className={cn('min-w-0', !soloLectura && 'cursor-pointer')} onClick={() => !soloLectura && onActivar(pregunta.id)}>
                {/* Arriba, el tipo y, a su derecha, las acciones. Salen **al pasar el cursor**, como en el creador de
                    encuestas: veinte filas con tres iconos encendidos se leen como una pared; en pantalla táctil se
                    quedan a la vista (Dave, 9-oct). Van en su propia fila, encima del enunciado, y no al lado de él: ahí
                    le robaban el ancho y lo partían en varios renglones. Ocultas no ocupan lugar y la fila mide lo mismo
                    con y sin ellas, así que al pasar el cursor no se mueve nada (el jefe de Dave, 14-oct). */}
                <div className="flex h-5 flex-wrap items-center gap-1.5">
                  <Badge variant="outline" size="sm">
                    {etiquetaDe(pregunta.tipo, encuesta)}
                  </Badge>
                  {!soloLectura ? (
                    // Sin el stopPropagation, el clic en una acción subía a la fila y además abría la pregunta. Con
                    // h-5, los botones (32 px) sobresalen parejo de la fila de 20 en vez de agrandarla: si no, al
                    // aparecer empujaban la insignia del tipo 6 px hacia abajo.
                    <div className={cn('ml-auto h-5 items-center gap-1', AL_PASAR)} onClick={(evento) => evento.stopPropagation()}>
                      <MoverA
                        que={`la pregunta ${numero}`}
                        destinos={destinosDePregunta(secciones, entrada.section.id)}
                        sinDestinos="No hay otra sección donde moverla"
                        onMover={(destino) => onMoverPregunta(pregunta.id, destino.section.id)}
                      />
                      <Hint label="Editar">
                        <BotonIcono aria-label={`Editar la pregunta ${numero}`} onClick={() => onActivar(pregunta.id)}>
                          <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                        </BotonIcono>
                      </Hint>
                      <Hint label="Eliminar">
                        <BotonIcono aria-label={`Eliminar la pregunta ${numero}`} onClick={() => onAccionPregunta(pregunta.id, 'eliminar')}>
                          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" className="text-destructive" />
                        </BotonIcono>
                      </Hint>
                    </div>
                  ) : null}
                </div>
                {/* El enunciado **completo**, en los renglones que haga falta: cortado con «…» había que pasar el cursor
                    por cada pregunta para leerla, que es justo lo que el modo lectura quiere evitar (14-oct). */}
                <ItemTitle>
                  {/* Número y enunciado en un solo bloque: sueltos, el título los ponía en dos columnas y el número
                      quedaba aparte, como una sangría. Así va en la misma primera línea del texto. */}
                  <span>
                    <Text as="span" size="sm" variant="muted" className="tabular-nums">
                      {jerarquia}
                    </Text>{' '}
                    <span className={titulo === 'Sin enunciado' ? 'text-muted-foreground' : undefined}>{titulo}</span>
                  </span>
                </ItemTitle>
                {/* Las opciones a la vista, sin abrir la pregunta: el modo lectura del creador (14-oct). */}
                <RespuestasEnLectura pregunta={pregunta} encuesta={encuesta} />
              </ItemContent>
            </Item>
          </SortableItem>
        )
      })}
    </ItemGroup>
  )

  if (soloLectura || preguntas.length < 2) return filas
  return (
    <Sortable value={[...preguntas]} onValueChange={(x) => onReordenar(entrada.section.id, [...x])} getItemValue={(p) => p.id}>
      {filas}
    </Sortable>
  )
}
