import { Fragment, useState, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, DragDropVerticalIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
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
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { notifyAction } from '@/shared/components/notify'
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
// · la sección (nivel 1) es un contenedor, como los de Participantes: cabecera con sus acciones y, al
//   pie, UNA sola barra «Agregar» que crea preguntas, subsecciones o una nueva sección;
// · las subsecciones son acordeones sin caja, separados por una línea, con sus preguntas debajo y con sangría;
// · las preguntas son filas (lista-preguntas).
// El título y la descripción se editan dándole clic directamente donde se leen.
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

// Título y descripción: se leen en la cabecera y, al hacer clic sobre ellos, se editan ahí mismo sin botones adicionales.
function Titulo({
  entrada,
  editando,
  bloqueado,
  focoInicial,
  onIniciar,
  onTerminar,
}: {
  entrada: SectionTreeEntry
  editando: boolean
  bloqueado: boolean
  focoInicial: 'titulo' | 'descripcion'
  onIniciar: (campo: 'titulo' | 'descripcion') => void
  onTerminar: () => void
}) {
  const { secciones, cambiar, recien } = useArbol()
  const { section: seccion, depth, numbering } = entrada
  const nombre = seccion.title.trim() || `${NIVEL[depth]} ${numbering}`
  const terminarConTecla = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'Enter' || evento.key === 'Escape') {
      evento.currentTarget.blur()
      onTerminar()
    }
  }
  if (editando && !bloqueado) {
    return (
      <div
        className="flex min-w-0 flex-1 flex-col gap-1.5"
        onClick={(evento) => evento.stopPropagation()}
        onBlur={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) {
            onTerminar()
          }
        }}
      >
        {/* «!» en los dos campos: el fondo sólido, que la librería deja transparente y se pierde sobre el gris de la fila
            (diferencias.json › input-group-fondo-solido). */}
        <Input
          aria-label={depth === 1 ? 'Título de la sección' : `Título de la ${NIVEL[depth].toLowerCase()}`}
          className="w-full bg-background! font-medium"
          value={seccion.title}
          maxLength={LIMITE_TITULO_SECCION.max}
          placeholder={`${NIVEL[depth]} ${numbering}`}
          autoFocus={focoInicial === 'titulo'}
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
          autoFocus={focoInicial === 'descripcion'}
          onKeyDown={terminarConTecla}
          onChange={(evento) => cambiar(patchSection(secciones, seccion.id, { description: evento.target.value }))}
        />
      </div>
    )
  }
  // Debajo del título, en gris: la descripción y el conteo. Hacer clic en el título o en la descripción activa la edición en el sitio;
  // el resto del encabezado queda libre para abrir o cerrar el acordeón.
  const textoDescripcion = seccion.description.trim() || (!bloqueado ? 'Agrega una descripción (opcional)' : '')
  const detalle = [textoDescripcion, resumen(seccion)].filter(Boolean).join(' · ')
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
      <div
        role={bloqueado ? undefined : 'button'}
        tabIndex={bloqueado ? undefined : 0}
        aria-label={bloqueado ? undefined : `Editar título de ${nombre}`}
        onClick={(evento) => {
          if (bloqueado) return
          evento.stopPropagation()
          onIniciar('titulo')
        }}
        onKeyDown={(evento) => {
          if (bloqueado) return
          if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault()
            evento.stopPropagation()
            onIniciar('titulo')
          }
        }}
        className={cn(
          'max-w-full rounded-md transition-colors',
          !bloqueado && '-mx-1.5 -my-0.5 cursor-text px-1.5 py-0.5 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {/* «!»: el título sin escribir en gris; la clase sola no le gana al color del Heading (diferencias.json › instalacion-estilos-sin-capa). */}
        <TextoCompleto texto={nombre}><Heading as={depth === 1 ? 'h3' : 'h4'} level={6} className={cn('truncate', !seccion.title.trim() && 'text-muted-foreground!')}>
          {nombre}
        </Heading></TextoCompleto>
      </div>
      <div
        role={bloqueado ? undefined : 'button'}
        tabIndex={bloqueado ? undefined : 0}
        aria-label={bloqueado ? undefined : `Editar descripción de ${nombre}`}
        onClick={(evento) => {
          if (bloqueado) return
          evento.stopPropagation()
          onIniciar('descripcion')
        }}
        onKeyDown={(evento) => {
          if (bloqueado) return
          if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault()
            evento.stopPropagation()
            onIniciar('descripcion')
          }
        }}
        className={cn(
          'max-w-full rounded-md transition-colors',
          !bloqueado && '-mx-1.5 -my-0.5 cursor-text px-1.5 py-0.5 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <TextoCompleto texto={detalle}><Text as="p" size="sm" variant="muted" className="truncate">
          {detalle}
        </Text></TextoCompleto>
      </div>
      {/* El título es opcional; escrito, debe llegar al mínimo. Mientras no llegue, el paso no se da por completo. */}
      {cortoDeMinimo(seccion.title, LIMITE_TITULO_SECCION.min) ? <FieldError>{mensajeMinimo(LIMITE_TITULO_SECCION.min)}</FieldError> : null}
    </div>
  )
}

// Botón unificado para agregar: permite crear preguntas en la sección, subsecciones o una nueva sección en la encuesta.
export function MenuAnadir({ entrada }: { entrada: SectionTreeEntry }) {
  const { crearSeccion, crearSubseccion, crearPregunta, bloqueado } = useArbol()
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
          Agregar
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
        </Button>
      </EnCurso>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="shrink-0" />}>
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
        Agregar
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          {opcion(plus, 'Agregar pregunta', paraPreguntas, crearPregunta)}
          {opcion(plus, 'Agregar subsección', paraSubsecciones, crearSubseccion, (destino) => (destino.depth === 1 ? `En ${etiquetaDe(destino)}` : `Dentro de ${etiquetaDe(destino)}`))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={crearSeccion}>
            {plus}
            Agregar sección
          </DropdownMenuItem>
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
  const { section: seccion, depth } = entrada
  const conPreguntas = seccion.questions.length > 0 || (depth > 1 && seccion.children.length === 0)
  return (
    <div className="flex flex-col">
      {conPreguntas ? (
        <div>
          <ListaPreguntas entrada={entrada} />
        </div>
      ) : null}
      <Hijas entrada={entrada} />
    </div>
  )
}

export function NodoSeccion({ entrada, esUltimaRaiz }: { entrada: SectionTreeEntry; esUltimaRaiz: boolean }) {
  const { secciones, cambiar, abiertas, alternar, seleccionar, pedirBorrado, editando, setEditando, editandoSeccion, setEditandoSeccion, bloqueado, creandoIa } = useArbol()
  const motivo = useMotivoBloqueo()
  const { section: seccion, depth } = entrada
  const abierta = abiertas.includes(seccion.id)
  const vacia = seccion.questions.length === 0 && seccion.children.length === 0
  const nombre = seccion.title.trim() || `${NIVEL[depth]} ${entrada.numbering}`
  const editandoDatos = editandoSeccion === seccion.id
  // Solo cuando hay una pregunta abierta en edición queda apagado lo demás.
  const ocupado = editando !== null
  const [focoInicial, setFocoInicial] = useState<'titulo' | 'descripcion'>('titulo')
  const setEditandoDatos = (editar: boolean, campo: 'titulo' | 'descripcion' = 'titulo') => {
    setFocoInicial(campo)
    setEditandoSeccion(editar ? seccion.id : null)
  }

  // Eliminar siempre pide confirmar, con el diálogo del design system (lo abre el paso).
  const pedirBorradoDeEsta = () => pedirBorrado({ tipo: 'seccion', id: seccion.id })

  const alternarSeccion = () => {
    seleccionar(seccion.id)
    alternar(entrada)
  }

  // «!» en el asa: el gris del icono; el ghost de la librería no trae tono gris (diferencias.json › button-ghost-tonos).
  const asa = bloqueado ? (
    <EnCurso bloqueado className="flex">
      <BotonIcono size="icon-xs" aria-label={`Mover ${nombre}`} className="text-muted-foreground!" disabled onClick={(evento) => evento.stopPropagation()}>
        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
      </BotonIcono>
    </EnCurso>
  ) : (
    // «!»: gris del asa; el ghost no trae tono gris (diferencias.json › button-ghost-tonos).
    <KanbanItemHandle render={<BotonIcono size="icon-xs" aria-label={`Mover ${nombre}`} className="text-muted-foreground!" onClick={(evento) => evento.stopPropagation()} />}>
      <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
    </KanbanItemHandle>
  )
  const plegar = (
    <BotonIcono
      aria-label={abierta ? `Contraer ${nombre}` : `Expandir ${nombre}`}
      aria-expanded={abierta}
      onClick={(evento) => {
        evento.stopPropagation()
        alternarSeccion()
      }}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', abierta ? 'rotate-180' : depth > 1 && '-rotate-90')} />
    </BotonIcono>
  )

  // ── Subsección: una fila de acordeón, sin caja ──
  if (depth > 1) {
    const destinos = bloqueado ? [] : moveDestinationsForSection(secciones, entrada)
    const destinosDentro = bloqueado ? [] : moveIntoDestinationsForSection(secciones, entrada)
    return (
      <div id={`seccion-${seccion.id}`} className="flex flex-col">
        {/* «!»: la fila del acordeón alineada arriba, a ras y sin el fondo al pasar de la librería (diferencias.json ›
            instalacion-estilos-sin-capa). */}
        <Item
          size="sm"
          inert={ocupado}
          // «!»: alineada arriba, a ras y sin fondo al pasar; la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa).
          className={cn('cursor-pointer items-start! px-0! hover:bg-transparent!', ocupado && APAGADO)}
          onClick={alternarSeccion}
        >
          <span className={cn('flex shrink-0 items-center gap-2', editandoDatos ? 'h-9' : 'h-6')}>
            {plegar}
            {asa}
            <Badge variant="outline" size="sm" className="tabular-nums">
              {entrada.numbering}
            </Badge>
          </span>
          <Titulo
            entrada={entrada}
            editando={editandoDatos}
            bloqueado={bloqueado}
            focoInicial={focoInicial}
            onIniciar={(campo) => {
              seleccionar(seccion.id)
              setEditandoDatos(true, campo)
            }}
            onTerminar={() => setEditandoDatos(false)}
          />
          <div className={cn('h-6 shrink-0 items-center gap-1', AL_PASAR)} onClick={(evento) => evento.stopPropagation()}>
            <MoverA
              que={nombre}
              destinos={destinos}
              sinDestinos={bloqueado ? motivo : 'No hay otra sección o subsección donde moverla'}
              destinosDentro={destinosDentro}
              onMoverDentro={(destino) => {
                setEditando(null)
                cambiar(moveSectionInto(secciones, seccion.id, destino.section.id))
                seleccionar(seccion.id)
                notifyAction('Subsección movida', `Ahora está dentro de ${etiquetaDe(destino)}.`, { label: 'Deshacer', onClick: () => cambiar([...secciones]) }, 'success')
              }}
              onMover={(destino) => {
                setEditando(null)
                cambiar(moveSectionTo(secciones, seccion.id, destino.section.id))
                seleccionar(seccion.id)
                // Mover se deshace: «Deshacer» devuelve el árbol a como estaba antes de moverla.
                notifyAction('Subsección movida', `Quedó debajo de ${etiquetaDe(destino)}.`, { label: 'Deshacer', onClick: () => cambiar([...secciones]) }, 'success')
              }}
            />
            <BotonBorrar que={nombre} bloqueo={bloqueado ? motivo : null} onBorrar={pedirBorradoDeEsta} />
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
        <div
          inert={ocupado}
          className={cn('group/item flex cursor-pointer items-start gap-2 px-5 py-4', ocupado && APAGADO)}
          onClick={alternarSeccion}
        >
          <span className={cn('flex shrink-0 items-center gap-2', editandoDatos ? 'h-9' : 'h-6')}>
            {asa}
            <Badge size="sm" className="tabular-nums">
              {entrada.numbering}
            </Badge>
          </span>
          {seccion.isAiGenerated ? <EtiquetaIA>{creandoIa === seccion.id ? 'Creando…' : 'Creada con IA'}</EtiquetaIA> : null}
          <Titulo
            entrada={entrada}
            editando={editandoDatos}
            bloqueado={bloqueado}
            focoInicial={focoInicial}
            onIniciar={(campo) => {
              seleccionar(seccion.id)
              setEditandoDatos(true, campo)
            }}
            onTerminar={() => setEditandoDatos(false)}
          />
          <div className={cn('flex shrink-0 items-center gap-1', editandoDatos ? 'h-9' : 'h-6')} onClick={(evento) => evento.stopPropagation()}>
            <div className={cn('items-center gap-1', AL_PASAR)}>
              <BotonBorrar que={nombre} bloqueo={bloqueado ? motivo : esUltimaRaiz ? 'La encuesta debe tener al menos una sección' : null} onBorrar={pedirBorradoDeEsta} />
            </div>
            {plegar}
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
                  <EmptyDescription>Agrega una pregunta, una subsección o una nueva sección desde el menú.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row justify-center gap-2">
                  <MenuAnadir entrada={entrada} />
                </EmptyContent>
              </Empty>
            ) : (
              <Fragment>
                <div className="px-5 py-3">
                  <Contenido entrada={entrada} />
                </div>
                <Separator />
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
