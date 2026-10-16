import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, LibraryIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, cn, Kanban, KanbanColumnContent, KanbanItem, KanbanOverlay, Text } from '@ubits/flux-ui'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { notify } from '@/shared/components/notify'
import { buildBlankQuestion, buildQuestion, isQuestionComplete } from '../../../modelo/questionCatalog'
import { appendChild, countDescendants, countQuestions, findSection, flattenSections, patchSection, pathIds, removeSection, type SectionTreeEntry } from '../../../modelo/sectionTree'
import { MAX_SECTION_DEPTH, type SurveyQuestion, type SurveySection } from '../../../modelo/surveyBuilderTypes'
import { RAIZ, arbolDesde, buscarPregunta, contenedoresDe, moverAlSoltar, type Contenedores } from '../../../modelo/arrastre'
import { APAGADO, ArbolContexto, NIVEL, type Arbol, type PedidoBorrado } from './contexto'
import { BancoPreguntas } from './banco-preguntas'
import { ImportarSecciones } from './importar-secciones'
import { FilaFantasma } from './lista-preguntas'
import { NodoSeccion } from './nodo-seccion'
import { AvisoEnCurso, EnCurso } from '../aviso-en-curso'
import { MOTIVO_EN_CURSO, MOTIVO_NORMATIVA, MotivoBloqueo } from '../en-curso'

// Paso 4 · Secciones y preguntas. Hasta tres niveles: sección → subsección → sub-subsección. Cada sección es un
// contenedor con sus propias acciones de crear. El banco de preguntas añade a la sección que se tocó por última vez.

const nuevaId = (prefijo: string) => `${prefijo}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`
const nuevaSeccion = (titulo = ''): SurveySection => ({ id: nuevaId('section'), title: titulo, description: '', questions: [], children: [] })

// Las preguntas viven en secciones sin subsecciones: si la elegida tiene, van a la primera de ellas.
const primeraHoja = (seccion: SurveySection): SurveySection => (seccion.children.length > 0 ? primeraHoja(seccion.children[0]) : seccion)

// La sección dueña de una pregunta, según las listas del arrastre.
const seccionDe = (contenedores: Contenedores, preguntaId: string) => {
  const clave = Object.entries(contenedores).find(([nombre, lista]) => nombre.startsWith('preguntas:') && lista.some((elemento) => elemento.id === preguntaId))?.[0]
  return clave ? clave.slice('preguntas:'.length) : null
}

export function PasoSecciones({
  secciones,
  onSecciones,
  marcadas,
  senalada,
  revelar,
  creandoIa = null,
  enCurso = false,
  normativa = false,
}: {
  secciones: readonly SurveySection[]
  onSecciones: (secciones: SurveySection[]) => void
  /** Ya se intentó avanzar: se marcan las preguntas que estaban incompletas en ese momento, no las que se crean después. */
  marcadas: ReadonlySet<string>
  /** La pregunta incompleta que «Finalizar» manda a revisar: se abre y se lleva a la vista. */
  senalada: string | null
  /** Lo que acaba de proponer la IA: se abre su rama y se lleva a la vista. */
  revelar: { id: string; vez: number } | null
  /** La sección que el agente de IA está creando ahora mismo. */
  creandoIa?: string | null
  /** La encuesta ya está en curso: las secciones y preguntas se ven, pero no se cambian. */
  enCurso?: boolean
  /** Viene de una plantilla NOM-035: sus secciones y preguntas son las oficiales y se ven, pero no se cambian. */
  normativa?: boolean
}) {
  const bloqueo = enCurso || normativa
  const [abiertas, setAbiertas] = useState<string[]>(() => (secciones[0] ? [secciones[0].id] : []))
  const [seleccionada, setSeleccionada] = useState<string | null>(secciones[0]?.id ?? null)
  const [editando, setEditandoId] = useState<string | null>(null)
  // La pregunta recién creada que todavía no se agregó, y cómo estaba la que se edita al abrirla: con eso «Cancelar» descarta la
  // nueva o devuelve la existente a su estado de antes.
  const [nueva, setNueva] = useState<string | null>(null)
  const original = useRef<SurveyQuestion | null>(null)
  // Las preguntas en las que se intentó «Agregar» o «Guardar» estando incompletas: se marcan en rojo junto con las que
  // marca el paso al intentar avanzar. Una pregunta nueva nace sin marca.
  const [intentadas, setIntentadas] = useState<readonly string[]>([])
  const [intento, setIntento] = useState(0)
  // Cada vez que el paso marca preguntas al intentar avanzar (llega un conjunto nuevo), cuenta como un intento más.
  const [marcadasVistas, setMarcadasVistas] = useState(marcadas)
  if (marcadas !== marcadasVistas) {
    setMarcadasVistas(marcadas)
    setIntento((previo) => previo + 1)
  }
  const [pedidoBorrado, setPedidoBorrado] = useState<PedidoBorrado | null>(null)
  // Una sección que llega vacía y sin nombre (la primera de una encuesta en blanco) nace con el título listo para escribir.
  const [recien, setRecien] = useState<string | null>(() => (secciones.length === 1 && secciones[0].title === '' && secciones[0].children.length === 0 ? secciones[0].id : null))
  const [editandoSeccion, setEditandoSeccion] = useState<string | null>(recien)
  const [banco, setBanco] = useState(false)
  const [importar, setImportar] = useState(false)
  const [conIa, setConIa] = useState<string | null>(null)

  const entradas = useMemo(() => flattenSections(secciones), [secciones])
  const elegida = entradas.find((entrada) => entrada.section.id === seleccionada) ?? entradas[0] ?? null

  const dePregunta = (id: string) => entradas.find((entrada) => entrada.section.questions.some((pregunta) => pregunta.id === id))

  // Abrir o cerrar un formulario de pregunta: al abrir una existente se guarda cómo estaba, para poder cancelar.
  const setEditando = (id: string | null) => {
    original.current = id ? structuredClone(dePregunta(id)?.section.questions.find((pregunta) => pregunta.id === id) ?? null) : null
    if (id !== nueva) setNueva(null)
    setEditandoId(id)
  }


  const abrirHasta = (id: string, lista: readonly SurveySection[] = secciones) => setAbiertas(pathIds(lista, id))

  // «Finalizar» con una pregunta incompleta: se abre su rama y su formulario, y se lleva a la vista.
  const [senalAtendida, setSenalAtendida] = useState<string | null>(null)
  if (senalada !== senalAtendida) {
    setSenalAtendida(senalada)
    const duena = senalada ? flattenSections(secciones).find((entrada) => entrada.section.questions.some((pregunta) => pregunta.id === senalada)) : undefined
    if (senalada && duena) {
      setAbiertas(pathIds(secciones, duena.section.id))
      setEditando(senalada)
    }
  }
  useEffect(() => {
    if (!senalada) return
    const temporizador = window.setTimeout(() => document.getElementById(`pregunta-${senalada}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150)
    return () => window.clearTimeout(temporizador)
  }, [senalada])

  // Lo que va creando la IA: se abre su rama y se selecciona, para verlo aparecer. Si la persona está editando un título
  // o una pregunta mientras tanto, no se le cierra ni se le mueve la vista: lo que crea la IA entra igual.
  // Un título en edición cuya sección ya no está (la sección en blanco que reemplaza la IA al crear) deja de contar.
  if (editandoSeccion !== null && !findSection(secciones, editandoSeccion)) setEditandoSeccion(null)
  const [revelada, setRevelada] = useState<number | null>(null)
  const [aLaVista, setALaVista] = useState<{ id: string; vez: number } | null>(null)
  if (revelar && revelar.vez !== revelada && findSection(secciones, revelar.id)) {
    setRevelada(revelar.vez)
    if (editando === null && editandoSeccion === null) {
      setAbiertas(pathIds(secciones, revelar.id))
      setSeleccionada(revelar.id)
      setALaVista(revelar)
    }
  }
  useEffect(() => {
    if (!aLaVista) return
    const temporizador = window.setTimeout(() => document.getElementById(`seccion-${aLaVista.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150)
    return () => window.clearTimeout(temporizador)
  }, [aLaVista])

  const alternar = (entrada: SectionTreeEntry) => {
    if (abiertas.includes(entrada.section.id)) setAbiertas(abiertas.slice(0, entrada.depth - 1))
    else abrirHasta(entrada.section.id)
  }

  const cambiar = (siguientes: SurveySection[]) => onSecciones(siguientes)

  const crearSubseccionEn = (lista: SurveySection[], nueva: SurveySection) => {
    cambiar(lista)
    abrirHasta(nueva.id, lista)
    setSeleccionada(nueva.id)
    setRecien(nueva.id)
    setEditandoSeccion(nueva.id)
  }

  const crearSubseccion = (padre: SectionTreeEntry) => {
    if (padre.depth >= MAX_SECTION_DEPTH) return notify(`Alcanzaste el máximo de ${MAX_SECTION_DEPTH} niveles`)
    // Una sección con preguntas sueltas que recibe su primera subsección las pasa a ella: sección o subsección tienen
    // preguntas, no las dos cosas mezcladas.
    const sueltas = padre.section.questions
    const nueva = { ...nuevaSeccion(), questions: sueltas }
    const conHija = appendChild(secciones, padre.section.id, nueva)
    crearSubseccionEn(sueltas.length > 0 ? patchSection(conHija, padre.section.id, { questions: [] }) : conHija, nueva)
    if (sueltas.length > 0) notify(`Las ${sueltas.length} ${sueltas.length === 1 ? 'pregunta pasó' : 'preguntas pasaron'} a la nueva subsección`)
  }

  const agregarPreguntas = (duena: SectionTreeEntry, preguntas: ReturnType<typeof buildQuestion>[]) => {
    // Una sección con subsecciones no lleva preguntas propias: van a su primera subsección. Nunca se crea una por su cuenta.
    const id = primeraHoja(duena.section).id
    const actual = findSection(secciones, id)
    if (!actual) return
    const siguiente = patchSection(secciones, id, { questions: [...actual.section.questions, ...preguntas] })
    cambiar(siguiente)
    abrirHasta(id, siguiente)
    setSeleccionada(id)
    return id
  }

  const crearPregunta = (duena: SectionTreeEntry) => {
    const pregunta = buildBlankQuestion()
    agregarPreguntas(duena, [pregunta])
    original.current = null
    setNueva(pregunta.id)
    setEditandoId(pregunta.id)
    setConIa(null)
  }

  const crearPreguntaConIa = (duena: SectionTreeEntry) => {
    const pregunta = buildBlankQuestion()
    agregarPreguntas(duena, [pregunta])
    original.current = null
    setNueva(pregunta.id)
    setEditandoId(pregunta.id)
    setConIa(pregunta.id)
  }

  // «Agregar» o «Guardar» dejan la pregunta como está; «Cancelar» descarta la nueva o devuelve la existente a como estaba.
  const terminarEdicion = (guardar: boolean) => {
    const id = editando
    const duena = id ? dePregunta(id) : undefined
    // «Agregar» y «Guardar» piden la pregunta completa: si falta algo, el formulario sigue abierto y marca lo que falta.
    if (guardar && id && duena) {
      const actual = duena.section.questions.find((pregunta) => pregunta.id === id)
      if (actual && !isQuestionComplete({ ...actual, statement: actual.statement.replace(/<[^>]*>/g, '').trim() })) {
        setIntentadas((previas) => [...new Set([...previas, id])])
        setIntento((previo) => previo + 1)
        notify('Completa los campos obligatorios', 'La pregunta necesita enunciado, tipo y lo que depende de ese tipo.')
        return
      }
    }
    if (!guardar && id && duena) {
      if (id === nueva) cambiar(patchSection(secciones, duena.section.id, { questions: duena.section.questions.filter((pregunta) => pregunta.id !== id) }))
      else if (original.current) cambiar(patchSection(secciones, duena.section.id, { questions: duena.section.questions.map((pregunta) => (pregunta.id === id ? original.current! : pregunta)) }))
    }
    original.current = null
    setNueva(null)
    setEditandoId(null)
    setConIa(null)
  }

  const arbol: Arbol = {
    secciones,
    cambiar,
    abiertas,
    alternar,
    seleccionada: elegida?.section.id ?? null,
    seleccionar: setSeleccionada,
    editando,
    setEditando,
    esNueva: editando !== null && editando === nueva,
    terminarEdicion,
    pedirBorrado: setPedidoBorrado,
    marcadas: new Set([...marcadas, ...intentadas]),
    intento,
    recien,
    editandoSeccion,
    setEditandoSeccion,
    crearSubseccion,
    crearPregunta,
    conIa,
    crearPreguntaConIa,
    creandoIa,
    bloqueado: bloqueo,
  }

  // ── Borrar: siempre se confirma, con el diálogo del design system ──
  const seccionPorBorrar = pedidoBorrado?.tipo === 'seccion' ? entradas.find((entrada) => entrada.section.id === pedidoBorrado.id) : undefined
  const preguntaPorBorrar =
    pedidoBorrado?.tipo === 'pregunta' ? findSection(secciones, pedidoBorrado.seccionId)?.section.questions.find((pregunta) => pregunta.id === pedidoBorrado.id) : undefined
  const nombreDe = (entrada: SectionTreeEntry) => entrada.section.title.trim() || `${NIVEL[entrada.depth]} ${entrada.numbering}`
  const textoPlano = (html: string) => html.replace(/<[^>]*>/g, '').trim()
  const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

  const confirmarBorrado = () => {
    if (!pedidoBorrado) return
    if (pedidoBorrado.tipo === 'seccion' && seccionPorBorrar) {
      cambiar(removeSection(secciones, seccionPorBorrar.section.id))
      if (editandoSeccion === seccionPorBorrar.section.id) setEditandoSeccion(null)
      setEditando(null)
      notify(seccionPorBorrar.depth === 1 ? 'Sección eliminada' : 'Subsección eliminada')
    }
    if (pedidoBorrado.tipo === 'pregunta' && preguntaPorBorrar) {
      const duena = findSection(secciones, pedidoBorrado.seccionId)
      if (duena) cambiar(patchSection(secciones, duena.section.id, { questions: duena.section.questions.filter((pregunta) => pregunta.id !== pedidoBorrado.id) }))
      setEditando(null)
      notify('Pregunta eliminada')
    }
    setPedidoBorrado(null)
  }

  const contenidoDe = (entrada: SectionTreeEntry) => {
    const subsecciones = countDescendants(entrada.section)
    const preguntas = countQuestions([entrada.section])
    const lleva = [subsecciones > 0 ? plural(subsecciones, 'subsección', 'subsecciones') : null, preguntas > 0 ? plural(preguntas, 'pregunta', 'preguntas') : null].filter(Boolean)
    const nombre = `«${nombreDe(entrada)}»`
    return lleva.length ? `${nombre} se eliminará junto con ${lleva.join(' y ')}. Esta acción no se puede deshacer.` : `${nombre} se eliminará. Esta acción no se puede deshacer.`
  }

  const raices = entradas.filter((entrada) => entrada.depth === 1)
  // Mientras se edita un título o una pregunta, lo demás del paso queda apagado.
  const ocupado = editandoSeccion !== null || editando !== null
  const destinoBanco = elegida ? findSection(secciones, primeraHoja(elegida.section).id) : null
  const nombreElegida = destinoBanco ? `${destinoBanco.numbering} ${destinoBanco.section.title.trim() || NIVEL[destinoBanco.depth]}` : 'la encuesta'
  const contenedores = useMemo(() => contenedoresDe(secciones), [secciones])

  return (
    <MotivoBloqueo.Provider value={enCurso ? MOTIVO_EN_CURSO : MOTIVO_NORMATIVA}>
    <ArbolContexto.Provider value={arbol}>
      {/* Como Participantes y Datos demográficos: sin marco que lo envuelva todo. Arriba el resumen y las herramientas
          que traen preguntas de fuera; debajo, cada sección en su propio contenedor, y al final «Añadir sección». Las
          acciones de crear viven en cada sección, así no dependen de cuál esté seleccionada. */}
      {/* Un solo contexto de arrastre para todo el árbol: así una pregunta se puede soltar en otra sección. Nada se mueve
          hasta soltar (onMove); las secciones solo se reordenan entre hermanas y lo que no vale se ignora. */}
      <Kanban
        className="flex flex-col gap-4"
        value={contenedores}
        onValueChange={() => undefined}
        onMove={({ event, activeContainer, overContainer, overIndex }) => {
          if (bloqueo) return
          const siguientes = moverAlSoltar(contenedores, { activoId: String(event.active.id), origen: activeContainer, destino: overContainer, indice: overIndex, sobreId: String(event.over?.id ?? '') })
          if (!siguientes) return
          cambiar(arbolDesde(secciones, siguientes))
          const ahora = seccionDe(siguientes, String(event.active.id))
          const destino = ahora && ahora !== seccionDe(contenedores, String(event.active.id)) ? findSection(secciones, ahora) : null
          if (destino) notify('Pregunta movida', `Ahora está en ${destino.numbering} ${destino.section.title.trim() || NIVEL[destino.depth].toLowerCase() + ' sin título'}.`)
        }}
        getItemValue={(elemento) => elemento.id}
      >
        {bloqueo ? <AvisoEnCurso que="Las secciones y preguntas" normativa={!enCurso} /> : null}
        <div className={cn('flex flex-wrap items-center justify-between gap-3', ocupado && APAGADO)} inert={ocupado}>
          {/* El recuento de secciones y preguntas ya lo lleva el panel «Así va la encuesta»; aquí va qué hacen los botones. */}
          {bloqueo ? null : (
            <Text as="p" variant="muted" size="sm">
              Suma preguntas ya hechas, del banco o desde un archivo.
            </Text>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <EnCurso bloqueado={bloqueo}>
              <Button variant="outline" disabled={bloqueo} onClick={() => setBanco(true)}>
                <HugeiconsIcon icon={LibraryIcon} aria-hidden="true" />
                Banco de preguntas
              </Button>
            </EnCurso>
            {/* El botón de IA va al final de la fila, redondeado y con el orbe, como «Importar con IA» de participantes. */}
            <EnCurso bloqueado={bloqueo}>
              <BotonIaSecundario disabled={bloqueo} onClick={() => setImportar(true)}>Importar con IA</BotonIaSecundario>
            </EnCurso>
            {/* «Crear con IA» ya no va aquí (Elkin, 14-oct): la encuesta la crea el agente (desde el
                inicio de Encuestas) y se ve crecer en este paso. */}
          </div>
        </div>
        <KanbanColumnContent value={RAIZ} className="gap-4">
          {raices.map((entrada) => (
            <KanbanItem key={entrada.section.id} value={entrada.section.id}>
              <NodoSeccion entrada={entrada} esUltimaRaiz={raices.length === 1} />
            </KanbanItem>
          ))}
        </KanbanColumnContent>
        <div className={ocupado ? APAGADO : undefined} inert={ocupado}>
          <EnCurso bloqueado={bloqueo}>
            <Button
              variant="outline"
              disabled={bloqueo}
              onClick={() => {
                const nueva = nuevaSeccion()
                crearSubseccionEn([...secciones, nueva], nueva)
              }}
            >
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Añadir sección
            </Button>
          </EnCurso>
        </div>
        {/* Lo que se ve bajo el cursor: solo la pregunta; una sección se mueve ella misma. */}
        <KanbanOverlay>{({ value }) => <FilaFantasma pregunta={buscarPregunta(contenedores, String(value))} />}</KanbanOverlay>
      </Kanban>

      {/* Preguntar antes de borrar: la ventana de confirmar del sistema (DialogoConfirmar), como «¿Salir de la creación?» de
          Crear contenido: icono, título, descripción y dos botones. El nombre de lo que se elimina va en la descripción, entre «». */}
      <DialogoConfirmar
        abierto={pedidoBorrado !== null && (seccionPorBorrar !== undefined || preguntaPorBorrar !== undefined)}
        onAbiertoChange={(abierto) => (abierto ? undefined : setPedidoBorrado(null))}
        icono={Delete02Icon}
        titulo={seccionPorBorrar ? (seccionPorBorrar.depth === 1 ? '¿Eliminar la sección?' : '¿Eliminar la subsección?') : '¿Eliminar la pregunta?'}
        descripcion={
          seccionPorBorrar
            ? contenidoDe(seccionPorBorrar)
            : `«${(preguntaPorBorrar ? textoPlano(preguntaPorBorrar.statement) : '') || 'Pregunta sin enunciado'}» sale de la encuesta. Esta acción no se puede deshacer.`
        }
        accion={seccionPorBorrar ? (seccionPorBorrar.depth === 1 ? 'Eliminar sección' : 'Eliminar subsección') : 'Eliminar pregunta'}
        destructiva
        onConfirmar={confirmarBorrado}
      />

      <BancoPreguntas
        abierto={banco}
        onAbiertoChange={setBanco}
        destino={nombreElegida}
        onAgregar={(textos) => {
          if (!destinoBanco) return notify('Selecciona una sección para añadir preguntas.')
          agregarPreguntas(
            destinoBanco,
            textos.map((texto) => buildQuestion({ statement: texto, isBankQuestion: true })),
          )
          notify(textos.length === 1 ? 'Se añadió 1 pregunta.' : `Se añadieron ${textos.length} preguntas.`)
        }}
      />

      <ImportarSecciones
        abierto={importar}
        onAbiertoChange={setImportar}
        onImportar={(nuevas) => {
          const lista = [...secciones, ...nuevas]
          cambiar(lista)
          abrirHasta(nuevas[0].id, lista)
          setSeleccionada(nuevas[0].id)
          window.setTimeout(() => document.getElementById(`seccion-${nuevas[0].id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 150)
        }}
      />
    </ArbolContexto.Provider>
    </MotivoBloqueo.Provider>
  )
}
