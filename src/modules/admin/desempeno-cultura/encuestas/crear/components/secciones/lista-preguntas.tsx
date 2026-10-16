import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Cancel01Icon, Copy01Icon, DragDropVerticalIcon, Edit02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Item, ItemActions, ItemContent, ItemGroup, ItemSeparator, ItemTitle, KanbanColumn, KanbanColumnContent, KanbanItem, KanbanItemHandle, Separator, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { notify } from '@/shared/components/notify'
import { duplicateQuestion, isQuestionComplete, questionTypeLabel, scaleTypeLabel } from '../../../modelo/questionCatalog'
import { moveDestinationsForQuestion, moveQuestionTo, patchSection, type SectionTreeEntry } from '../../../modelo/sectionTree'
import type { SurveyQuestion } from '../../../modelo/surveyBuilderTypes'
import { preguntasDe } from '../../../modelo/arrastre'
import { APAGADO, NIVEL, useArbol } from './contexto'
import { EditorPregunta } from './editor-pregunta'
import { BotonBorrar, MoverA } from './piezas-arbol'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { EnCurso } from '../aviso-en-curso'
import { useMotivoBloqueo } from '../en-curso'

// Las preguntas de una sección o subsección, como filas simples: número, enunciado y tipo. Mover y eliminar salen al
// pasar el cursor (o al llegar con el teclado), así la lista se lee limpia. Tocar una fila abre su formulario ahí mismo,
// en lugar de la fila: solo hay uno abierto en toda la encuesta y, mientras está abierto, lo demás del paso se apaga. Se reordenan
// arrastrando y se pueden soltar en otra sección o subsección (el contexto de arrastre lo pone el paso); también está «Mover a…».

// El enunciado del banco llega con marcado; en la fila se ve solo el texto.
const textoPlano = (html: string) => html.replace(/<[^>]*>/g, '').trim()

// Lo que se ve bajo el cursor mientras se arrastra una pregunta.
export function FilaFantasma({ pregunta }: { pregunta?: SurveyQuestion }) {
  if (!pregunta) return null
  return (
    <Item variant="outline" size="sm" className="bg-background shadow-lg">
      <ItemContent>
        <TextoCompleto texto={textoPlano(pregunta.statement)}><ItemTitle className="line-clamp-1">{textoPlano(pregunta.statement) || 'Sin enunciado'}</ItemTitle></TextoCompleto>
      </ItemContent>
    </Item>
  )
}

const tipoDe = (pregunta: SurveyQuestion) =>
  pregunta.typePending ? 'Sin tipo' : pregunta.type === 'scale' && pregunta.scale.kind ? scaleTypeLabel(pregunta.scale.kind) : questionTypeLabel(pregunta.type)

// Las acciones de la fila aparecen con el cursor encima o con el foco dentro; en pantallas táctiles siempre se ven.
// Ocultas no ocupan lugar (no solo transparentes): así el enunciado usa todo el ancho de la fila.
// Con un menú abierto (Mover a…) el cursor sale de la fila al ir a la lista: se quedan visibles mientras esté abierto.
export const AL_PASAR = 'hidden group-hover/item:flex group-focus-within/item:flex has-[[aria-expanded=true]]:flex pointer-coarse:flex'

export function ListaPreguntas({ entrada }: { entrada: SectionTreeEntry }) {
  const { secciones, cambiar, editando, setEditando, esNueva, terminarEdicion, editandoSeccion, marcadas, intento, seleccionar, conIa, pedirBorrado, bloqueado } = useArbol()
  const motivo = useMotivoBloqueo()
  const preguntas = entrada.section.questions

  const guardar = (siguientes: readonly SurveyQuestion[]) => cambiar(patchSection(secciones, entrada.section.id, { questions: siguientes }))
  const reemplazar = (pregunta: SurveyQuestion) => guardar(preguntas.map((actual) => (actual.id === pregunta.id ? pregunta : actual)))
  // Eliminar siempre pide confirmar, con el diálogo del design system (lo abre el paso).
  const pedirBorradoDe = (id: string) => pedirBorrado({ tipo: 'pregunta', id, seccionId: entrada.section.id })

  // Los destinos de una pregunta: cualquier sección o subsección.
  const destinos = bloqueado ? [] : moveDestinationsForQuestion(secciones, entrada.section.id)

  // Con una pregunta o un título en edición, las demás filas quedan apagadas.
  const ocupado = editando !== null || editandoSeccion !== null

  // Vacía sigue siendo un sitio donde soltar preguntas de otra sección.
  if (preguntas.length === 0) {
    return (
      <KanbanColumn value={preguntasDe(entrada.section.id)}>
        <KanbanColumnContent value={preguntasDe(entrada.section.id)} className="min-h-9 justify-center">
          <Text as="p" size="sm" variant="muted">
            Todavía no tiene preguntas.
          </Text>
        </KanbanColumnContent>
      </KanbanColumn>
    )
  }

  return (
    <>
      <KanbanColumn value={preguntasDe(entrada.section.id)}>
       <KanbanColumnContent value={preguntasDe(entrada.section.id)} className="gap-0">
        <ItemGroup className="gap-0!">
          {preguntas.map((pregunta, indice) => {
            const conErrores = marcadas.has(pregunta.id)
            const incompleta = conErrores && !isQuestionComplete({ ...pregunta, statement: textoPlano(pregunta.statement) })
            const titulo = textoPlano(pregunta.statement) || 'Sin enunciado'
            if (pregunta.id === editando) {
              return (
                <KanbanItem key={pregunta.id} value={pregunta.id}>
                  {indice > 0 ? <ItemSeparator /> : null}
                  {/* Abierta, la pregunta se edita en su mismo lugar; mientras tanto, lo demás del paso queda apagado. */}
                  <Item variant="outline" id={`pregunta-${pregunta.id}`} className="my-2 flex-col items-stretch! gap-4">
                    <Text as="p" size="sm" weight="medium" className="tabular-nums">
                      Pregunta {entrada.numbering}.{indice + 1}
                    </Text>
                    <EditorPregunta
                      key={pregunta.id}
                      enPanel
                      pregunta={pregunta}
                      conErrores={conErrores}
                      intento={intento}
                      pedirContexto={conIa === pregunta.id}
                      onCambio={reemplazar}
                      onCerrar={() => terminarEdicion(false)}
                      onEliminar={() => pedirBorradoDe(pregunta.id)}
                      onDuplicar={() => undefined}
                    />
                    {/* Al pie: «Cancelar» y, al final, «Agregar» si la pregunta es nueva o «Guardar» si ya existía. Cancelar descarta la
                        nueva o devuelve la existente a como estaba al abrirla. Duplicar y eliminar no van aquí: están en la fila. */}
                    <Separator />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={() => terminarEdicion(false)}>
                        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                        Cancelar
                      </Button>
                      <Button variant="outline" onClick={() => terminarEdicion(true)}>
                        <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
                        {esNueva ? 'Agregar' : 'Guardar'}
                      </Button>
                    </div>
                  </Item>
                </KanbanItem>
              )
            }
            return (
              <KanbanItem key={pregunta.id} value={pregunta.id}>
                {indice > 0 ? <ItemSeparator /> : null}
                <Item inert={ocupado} size="sm" id={`pregunta-${pregunta.id}`} className={`items-start! hover:bg-muted! ${ocupado ? APAGADO : ''}`}>
                  {/* En curso, el asa, duplicar, editar, mover y eliminar se ven apagados y dicen por qué; tocar la fila no la abre. */}
                  {bloqueado ? (
                    <EnCurso bloqueado className="flex">
                      <BotonIcono size="icon-xs" aria-label={`Mover ${titulo}`} className="text-muted-foreground!" disabled>
                        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
                      </BotonIcono>
                    </EnCurso>
                  ) : (
                    <KanbanItemHandle render={<BotonIcono size="icon-xs" aria-label={`Mover ${titulo}`} className="text-muted-foreground!" />}>
                      <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
                    </KanbanItemHandle>
                  )}
                  <ItemContent
                    className={bloqueado ? 'min-w-0' : 'min-w-0 cursor-pointer'}
                    onClick={() => {
                      if (bloqueado) return
                      seleccionar(entrada.section.id)
                      setEditando(pregunta.id)
                    }}
                  >
                    <TextoCompleto texto={titulo}><ItemTitle className="line-clamp-1">
                      <Text as="span" size="sm" variant="muted" className="tabular-nums">
                        {entrada.numbering}.{indice + 1}
                      </Text>{' '}
                      <span className={titulo === 'Sin enunciado' ? 'text-muted-foreground' : undefined}>{titulo}</span>
                    </ItemTitle></TextoCompleto>
                    {/* El tipo y las marcas van debajo del enunciado, no a la derecha: al aparecer las acciones nada se mueve. */}
                    <div className="flex flex-wrap items-center gap-1.5">
                    {/* La marca de IA es la etiqueta del sistema: gris, en pastilla y con el orbe (auditoría, decisión 8). */}
                    {pregunta.isAiGenerated ? <EtiquetaIA>IA</EtiquetaIA> : null}
                    {incompleta ? (
                      <Badge variant="destructive-outline" size="sm">
                        <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                        Incompleta
                      </Badge>
                    ) : null}
                    <Badge variant="outline" size="sm">
                      {tipoDe(pregunta)}
                    </Badge>
                    {pregunta.required ? null : (
                      <Badge variant="secondary" size="sm">
                        Opcional
                      </Badge>
                    )}
                    </div>
                  </ItemContent>
                  {/* Arriba, a la altura del enunciado, como el asa. */}
                  <ItemActions className="h-5 gap-1">
                    <div className={`items-center gap-1 ${AL_PASAR}`}>
                      {/* Un botón apagado no recibe el cursor: el globo lo dispara el span que lo envuelve. */}
                      <Hint label={bloqueado ? motivo : 'Duplicar'}>
                        <span className="flex">
                        <BotonIcono
                          aria-label={`Duplicar ${titulo}`}
                          disabled={bloqueado}
                          onClick={() => {
                            // La copia entra justo debajo y queda abierta para editarla.
                            const copia = duplicateQuestion(pregunta)
                            guardar([...preguntas.slice(0, indice + 1), copia, ...preguntas.slice(indice + 1)])
                            setEditando(copia.id)
                          }}
                        >
                          <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                        </BotonIcono>
                        </span>
                      </Hint>
                      <EnCurso bloqueado={bloqueado} className="flex">
                        <BotonIcono aria-label={`Editar ${titulo}`} disabled={bloqueado} onClick={() => setEditando(pregunta.id)}>
                          <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                        </BotonIcono>
                      </EnCurso>
                      <MoverA
                        que={titulo}
                        destinos={destinos}
                        sinDestinos={bloqueado ? motivo : 'No hay otra sección donde moverla'}
                        onMover={(destino) => {
                          setEditando(null)
                          cambiar(moveQuestionTo(secciones, pregunta.id, destino.section.id))
                          seleccionar(destino.section.id)
                          notify('Pregunta movida', `Ahora está en ${destino.numbering} ${destino.section.title.trim() || NIVEL[destino.depth].toLowerCase() + ' sin título'}.`)
                        }}
                      />
                      <BotonBorrar que={titulo} bloqueo={bloqueado ? motivo : null} onBorrar={() => pedirBorradoDe(pregunta.id)} />
                    </div>
                  </ItemActions>
                </Item>
              </KanbanItem>
            )
          })}
        </ItemGroup>
      </KanbanColumnContent>
      </KanbanColumn>

    </>
  )
}
