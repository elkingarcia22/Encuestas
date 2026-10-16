import { Fragment, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, DragDropVerticalIcon, PencilEdit02Icon, PlusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FieldDescription,
  FieldError,
  Frame,
  FramePanel,
  Heading,
  Input,
  Item,
  Separator,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { notify } from '@/shared/components/notify'
import {
  childEntries,
  countDescendants,
  countQuestions,
  moveDestinationsForSection,
  moveIntoDestinationsForSection,
  moveSectionInto,
  moveSectionTo,
  patchSection,
  type SectionTreeEntry,
} from '../../../modelo/sectionTree'
import { MAX_SECTION_DEPTH, type SurveySection } from '../../../modelo/surveyBuilderTypes'
import { hijasDe } from '../../../modelo/arrastre'
import { APAGADO, NIVEL, useArbol } from './contexto'
import { AL_PASAR, ListaPreguntas } from './lista-preguntas'
import { BotonBorrar, MoverA } from './piezas-arbol'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { EnCurso } from '../aviso-en-curso'
import { useMotivoBloqueo } from '../en-curso'
import { LIMITE_TITULO_SECCION, cercaDelTope, contador, cortoDeMinimo, mensajeMinimo } from '../../../modelo/limites-texto'

// Una sección con todo lo que cuelga de ella. Tres piezas, de mayor a menor:
// · la sección (nivel 1) es un contenedor, como los de Participantes: cabecera con sus acciones siempre visibles y, al
//   pie, UNA sola barra «Añadir» que crea preguntas y subsecciones en cualquier punto de la sección;
// · las subsecciones son acordeones sin caja, separados por una línea, con sus preguntas debajo y con sangría;
// · las preguntas son filas (lista-preguntas).
// En subsecciones y preguntas las acciones (editar, mover, eliminar) salen al pasar el cursor. El título y la
// descripción se editan en el mismo sitio donde se leen. La numeración sale de la posición.
import { ImagenGlass } from '@/shared/components/ImagenGlass'

const resumen = (seccion: SurveySection) => {
  const subsecciones = countDescendants(seccion)
  const preguntas = countQuestions([seccion])
  return [subsecciones > 0 ? `${subsecciones} ${subsecciones === 1 ? 'subsección' : 'subsecciones'}` : null, `${preguntas} ${preguntas === 1 ? 'pregunta' : 'preguntas'}`]
    .filter(Boolean)
    .join(' · ')
}

const etiquetaDe = (entrada: SectionTreeEntry) => `${entrada.numbering} ${entrada.section.title.trim() || NIVEL[entrada.depth]}`

function descendientes(entrada: SectionTreeEntry): SectionTreeEntry[] {
  return childEntries(entrada).flatMap((hija) => [hija, ...descendientes(hija)])
}

// Título y descripción: se leen en la cabecera y, con el lápiz, se editan ahí mismo.
function Titulo({ entrada, editando, onTerminar }: { entrada: SectionTreeEntry; editando: boolean; onTerminar: () => void }) {
  const { secciones, cambiar, recien } = useArbol()
  const { section: seccion, depth, numbering } = entrada
  const nombre = seccion.title.trim() || `${NIVEL[depth]} ${numbering}`
  const terminarConTecla = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'Enter' || evento.key === 'Escape') onTerminar()
  }
  if (editando) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Input
          aria-label={depth === 1 ? 'Título de la sección' : `Título de la ${NIVEL[depth].toLowerCase()}`}
          className="w-full bg-background! font-medium"
          value={seccion.title}
          maxLength={LIMITE_TITULO_SECCION.max}
          placeholder={`${NIVEL[depth]} ${numbering}`}
          autoFocus
          onFocus={(evento) => {
            if (recien === seccion.id) evento.target.select()
          }}
          onKeyDown={terminarConTecla}
          onChange={(evento) => cambiar(patchSection(secciones, seccion.id, { title: evento.target.value.slice(0, LIMITE_TITULO_SECCION.max) }))}
        />
        {/* Campo corto: el contador sale al acercarse al tope. */}
        {cercaDelTope(seccion.title.length, LIMITE_TITULO_SECCION.max) ? <FieldDescription>{contador(seccion.title.length, LIMITE_TITULO_SECCION.max)}</FieldDescription> : null}
        <Input
          aria-label="Descripción"
          className="w-full bg-background!"
          value={seccion.description}
          placeholder="Descripción (opcional)"
          onKeyDown={terminarConTecla}
          onChange={(evento) => cambiar(patchSection(secciones, seccion.id, { description: evento.target.value }))}
        />
      </div>
    )
  }
  // Debajo del título, en gris: la descripción y el conteo. Van aquí y no a la derecha para que, al aparecer las
  // acciones con el cursor, nada se mueva.
  const detalle = [seccion.description.trim(), resumen(seccion)].filter(Boolean).join(' · ')
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <TextoCompleto texto={nombre}><Heading as={depth === 1 ? 'h3' : 'h4'} level={6} className={cn('truncate', !seccion.title.trim() && 'text-muted-foreground!')}>
        {nombre}
      </Heading></TextoCompleto>
      <TextoCompleto texto={detalle}><Text as="p" size="sm" variant="muted" className="truncate">
        {detalle}
      </Text></TextoCompleto>
      {/* El título es opcional; escrito, debe llegar al mínimo. Mientras no llegue, el paso no se da por completo. */}
      {cortoDeMinimo(seccion.title, LIMITE_TITULO_SECCION.min) ? <FieldError>{mensajeMinimo(LIMITE_TITULO_SECCION.min)}</FieldError> : null}
    </div>
  )
}

// La única barra de crear de la sección. Con una sola opción de destino, crea directo; con varias, pregunta dónde.
function MenuAnadir({ entrada }: { entrada: SectionTreeEntry }) {
  const { crearSubseccion, crearPregunta, bloqueado } = useArbol()
  const todas = descendientes(entrada)
  // Las preguntas van en las secciones que no tienen subsecciones: en cuanto una las tiene, sus preguntas viven en ellas.
  const paraPreguntas = [entrada, ...todas].filter((destino) => destino.section.children.length === 0)
  const paraSubsecciones = [entrada, ...todas.filter((hija) => hija.depth < MAX_SECTION_DEPTH)]

  const destinos = (lista: SectionTreeEntry[], alElegir: (destino: SectionTreeEntry) => void, texto: (destino: SectionTreeEntry) => string) =>
    lista.map((destino) => (
      <DropdownMenuItem key={destino.section.id} onClick={() => alElegir(destino)}>
        <span className={cn('truncate', destino.depth > 1 && 'ps-3')}>{texto(destino)}</span>
      </DropdownMenuItem>
    ))

  const opcion = (icono: ReactNode, etiqueta: string, lista: SectionTreeEntry[], alElegir: (destino: SectionTreeEntry) => void, texto = etiquetaDe) =>
    lista.length === 1 ? (
      <DropdownMenuItem onClick={() => alElegir(lista[0])}>
        {icono}
        {etiqueta}
      </DropdownMenuItem>
    ) : (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {icono}
          {etiqueta}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-64">
          <DropdownMenuGroup>{destinos(lista, alElegir, texto)}</DropdownMenuGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )

  const plus = <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
  if (bloqueado) {
    return (
      <EnCurso bloqueado className="shrink-0">
        <Button variant="outline" className="shrink-0" disabled>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
          Añadir
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
        </Button>
      </EnCurso>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="shrink-0" />}>
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
        Añadir
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          {opcion(plus, 'Pregunta', paraPreguntas, crearPregunta)}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {opcion(plus, 'Subsección', paraSubsecciones, crearSubseccion, (destino) => (destino.depth === 1 ? `En ${etiquetaDe(destino)}` : `Dentro de ${etiquetaDe(destino)}`))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Hijas({ entrada }: { entrada: SectionTreeEntry }) {
  const hijas = childEntries(entrada)
  if (hijas.length === 0) return null
  return (
    <KanbanColumnContent value={hijasDe(entrada.section.id)} className="gap-0">
      {hijas.map((hija, indice) => (
        <KanbanItem key={hija.section.id} value={hija.section.id}>
          {indice > 0 || entrada.section.questions.length > 0 ? <Separator /> : null}
          <NodoSeccion entrada={hija} esUltimaRaiz={false} />
        </KanbanItem>
      ))}
    </KanbanColumnContent>
  )
}

// El contenido de una sección o subsección: sus preguntas y, debajo, sus subsecciones.
function Contenido({ entrada }: { entrada: SectionTreeEntry }) {
  const { editandoSeccion } = useArbol()
  const { section: seccion, depth } = entrada
  const conPreguntas = seccion.questions.length > 0 || (depth > 1 && seccion.children.length === 0)
  return (
    <div className="flex flex-col">
      {conPreguntas ? (
        // Las preguntas se apagan mientras se edita cualquier título; las subsecciones de abajo deciden por sí mismas.
        <div inert={editandoSeccion !== null} className={editandoSeccion ? APAGADO : undefined}>
          <ListaPreguntas entrada={entrada} />
        </div>
      ) : null}
      <Hijas entrada={entrada} />
    </div>
  )
}

export function NodoSeccion({ entrada, esUltimaRaiz }: { entrada: SectionTreeEntry; esUltimaRaiz: boolean }) {
  const { secciones, cambiar, abiertas, alternar, seleccionar, pedirBorrado, editando, setEditando, editandoSeccion, setEditandoSeccion, crearSubseccion, crearPregunta, bloqueado, creandoIa } = useArbol()
  const motivo = useMotivoBloqueo()
  const { section: seccion, depth } = entrada
  const abierta = abiertas.includes(seccion.id)
  const vacia = seccion.questions.length === 0 && seccion.children.length === 0
  const nombre = seccion.title.trim() || `${NIVEL[depth]} ${entrada.numbering}`
  // Una sola edición de título a la vez en todo el paso: mientras dura, lo demás queda apagado (APAGADO).
  const editandoDatos = editandoSeccion === seccion.id
  // Otra cosa en edición: otro título o cualquier pregunta abierta. Entonces esta cabecera queda apagada.
  const otraEditando = (editandoSeccion !== null && !editandoDatos) || editando !== null
  const ocupado = editandoSeccion !== null || editando !== null
  const setEditandoDatos = (editar: boolean) => setEditandoSeccion(editar ? seccion.id : null)

  // Eliminar siempre pide confirmar, con el diálogo del design system (lo abre el paso).
  const pedirBorradoDeEsta = () => pedirBorrado({ tipo: 'seccion', id: seccion.id })

  // En curso, el asa, el lápiz, mover y eliminar se ven apagados y dicen por qué (en curso, o pregunta oficial en una NOM-035).
  const asa = bloqueado ? (
    <EnCurso bloqueado className="flex">
      <BotonIcono size="icon-xs" aria-label={`Mover ${nombre}`} className="text-muted-foreground!" disabled>
        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
      </BotonIcono>
    </EnCurso>
  ) : (
    <KanbanItemHandle render={<BotonIcono size="icon-xs" aria-label={`Mover ${nombre}`} className="text-muted-foreground!" />}>
      <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
    </KanbanItemHandle>
  )
  const plegar = (
    <BotonIcono aria-label={abierta ? `Contraer ${nombre}` : `Expandir ${nombre}`} aria-expanded={abierta} onClick={() => alternar(entrada)}>
      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', abierta ? 'rotate-180' : depth > 1 && '-rotate-90')} />
    </BotonIcono>
  )
  const editar = bloqueado ? (
    <EnCurso bloqueado className="flex">
      <BotonIcono aria-label={`Editar ${nombre}`} disabled>
        <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" />
      </BotonIcono>
    </EnCurso>
  ) : (
    <Hint label={editandoDatos ? 'Listo' : 'Editar título y descripción'}>
      {/* Editando, el check es un secundario (con borde) del alto del campo; si no, el terciario redondo de siempre. */}
      {editandoDatos ? (
        <Button variant="outline" size="icon" aria-label={`Terminar de editar ${nombre}`} onClick={() => setEditandoDatos(false)}>
          <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
        </Button>
      ) : (
        <BotonIcono aria-label={`Editar ${nombre}`} onClick={() => setEditandoDatos(true)}>
          <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" />
        </BotonIcono>
      )}
    </Hint>
  )

  // ── Subsección: una fila de acordeón, sin caja ──
  if (depth > 1) {
    const destinos = bloqueado ? [] : moveDestinationsForSection(secciones, entrada)
    const destinosDentro = bloqueado ? [] : moveIntoDestinationsForSection(secciones, entrada)
    return (
      <div id={`seccion-${seccion.id}`} className="flex flex-col">
        <Item size="sm" inert={otraEditando} className={cn('items-start! px-0! hover:bg-transparent!', otraEditando && APAGADO)} onClick={() => seleccionar(seccion.id)}>
          <span className={cn('flex shrink-0 items-center gap-2', editandoDatos ? 'h-9' : 'h-6')}>
            {plegar}
            {asa}
            <Badge variant="outline" size="sm" className="tabular-nums">
              {entrada.numbering}
            </Badge>
          </span>
          <Titulo entrada={entrada} editando={editandoDatos} onTerminar={() => setEditandoDatos(false)} />
          <div className={cn('shrink-0 items-center gap-1', editandoDatos ? 'flex h-9' : cn('h-6', AL_PASAR))}>
            {editar}
            {/* Editando se quita «Mover a…» (no es de la cabecera); eliminar se queda, como en la sección. */}
            {editandoDatos ? null : (
              <>
                <MoverA
                  que={nombre}
                  destinos={destinos}
                  sinDestinos={bloqueado ? motivo : 'No hay otra sección o subsección donde moverla'}
                  destinosDentro={destinosDentro}
                  onMoverDentro={(destino) => {
                    setEditando(null)
                    cambiar(moveSectionInto(secciones, seccion.id, destino.section.id))
                    seleccionar(seccion.id)
                    notify('Subsección movida', `Ahora está dentro de ${etiquetaDe(destino)}.`)
                  }}
                  onMover={(destino) => {
                    setEditando(null)
                    cambiar(moveSectionTo(secciones, seccion.id, destino.section.id))
                    seleccionar(seccion.id)
                    notify('Subsección movida', `Quedó debajo de ${etiquetaDe(destino)}.`)
                  }}
                />
              </>
            )}
            <BotonBorrar que={nombre} bloqueo={bloqueado ? motivo : null} onBorrar={pedirBorradoDeEsta} secundario={editandoDatos} />
          </div>
        </Item>
        {abierta ? (
          <div className="ps-9 pb-2">
            <Contenido entrada={entrada} />
          </div>
        ) : null}
      </div>
    )
  }

  // ── Sección: un contenedor ──
  return (
    <Frame id={`seccion-${seccion.id}`}>
      <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
        {/* Editando, todo se alinea con el primer campo (el título), no con el centro de los dos. */}
        <div inert={otraEditando} className={cn('group/item flex items-start gap-2 px-5 py-4', otraEditando && APAGADO)} onClick={() => seleccionar(seccion.id)}>
          {/* Todo arriba, a la altura de la línea del título (o del campo del título al editar), nunca centrado. */}
          <span className={cn('flex shrink-0 items-center gap-2', editandoDatos ? 'h-9' : 'h-6')}>
            {asa}
            <Badge size="sm" className="tabular-nums">
              {entrada.numbering}
            </Badge>
          </span>
          {/* La marca de IA es la etiqueta del sistema: gris, en pastilla y con el orbe (auditoría, decisión 8). Mientras el
              agente la arma dice «Creando…»; después, «Creada con IA» (ya no es una propuesta: queda en la encuesta). */}
          {seccion.isAiGenerated ? <EtiquetaIA>{creandoIa === seccion.id ? 'Creando…' : 'Creada con IA'}</EtiquetaIA> : null}
          <Titulo entrada={entrada} editando={editandoDatos} onTerminar={() => setEditandoDatos(false)} />
          <div className={cn('flex shrink-0 items-center gap-1', editandoDatos ? 'h-9' : 'h-6')}>
            {/* Editar y eliminar salen al pasar el cursor (siempre, mientras se edita); plegar se ve siempre. */}
            <div className={cn('items-center gap-1', editandoDatos ? 'flex' : AL_PASAR)}>
              {editar}
              <BotonBorrar que={nombre} bloqueo={bloqueado ? motivo : esUltimaRaiz ? 'La encuesta debe tener al menos una sección' : null} onBorrar={pedirBorradoDeEsta} secundario={editandoDatos} />
            </div>
            {/* Editando el título no se pliega la sección: solo quedan el check y la papelera. */}
            {editandoDatos ? null : plegar}
          </div>
        </div>
        {abierta ? (
          <>
            <Separator />
            {vacia ? (
              <Empty inert={ocupado} className={cn('py-8', ocupado && APAGADO)}>
                <EmptyHeader>
                  <EmptyMedia variant="default">
                    <ImagenGlass nombre="glass-add" />
                  </EmptyMedia>
                  <EmptyTitle>Esta sección está vacía</EmptyTitle>
                  <EmptyDescription>Agrega una subsección o una pregunta para empezar.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row justify-center gap-2">
                  <EnCurso bloqueado={bloqueado}>
                    <Button variant="outline" disabled={bloqueado} onClick={() => crearSubseccion(entrada)}>
                      Crear subsección
                    </Button>
                  </EnCurso>
                  <EnCurso bloqueado={bloqueado}>
                    <Button variant="outline" disabled={bloqueado} onClick={() => crearPregunta(entrada)}>
                      Crear pregunta
                    </Button>
                  </EnCurso>
                </EmptyContent>
              </Empty>
            ) : (
              <Fragment>
                <div className="px-5 py-3">
                  <Contenido entrada={entrada} />
                </div>
                <Separator />
                {/* El pie, como el de «Agregar etapa» en Crear vacante: qué tiene la sección a la izquierda y la
                    acción para sumar a la derecha. */}
                <div inert={ocupado} className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-3', ocupado && APAGADO)}>
                  <Text as="p" size="sm" variant="muted" aria-live="polite">
                    {`Esta sección tiene ${resumen(seccion)}.`}
                  </Text>
                  <MenuAnadir entrada={entrada} />
                </div>
              </Fragment>
            )}
          </>
        ) : null}
      </FramePanel>
    </Frame>
  )
}
