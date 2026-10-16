import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, FolderAddIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, Frame, FramePanel, Text, cn } from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { actualizarPagina, buscarPagina, getBorrador, useBorrador, type Borrador, type Pregunta } from '../borrador'
import { AgenteEvaluaciones, type PedidoGeneracion } from './agente-evaluaciones'
import { usePublicarAccionesEvaluacion } from './acciones-evaluacion'
import { useAbrirAgenteEvaluaciones } from './agente-junto'
import { preguntaVacia } from '../demo'
import { enunciadoDe, faltaEnPregunta, generarPreguntas } from './logica'
import type { AccionPregunta } from './tarjeta-pregunta'
import { ModalConfiguracion } from './modal-configuracion'
import { ArbolSecciones } from './arbol-secciones'
import {
  aplanarPreguntas,
  buscarSeccion,
  contarPreguntas,
  cambiarPregunta,
  cambiarSeccion,
  duenoDe,
  esListaSimple,
  meterPregunta,
  moverPregunta,
  quitarPregunta,
  quitarSeccion,
  seccionVacia,
  seccionesDe,
  type SeccionPreguntas,
} from './secciones'

// Editor de una página de evaluación, debajo de la barra del recurso principal en Recursos: las preguntas —una en edición y las demás en lectura— y el paginador para evaluaciones largas. Lee y escribe
// las preguntas del recurso de la página en el borrador. (El aviso «N preguntas generadas por IA» con Deshacer se quitó
// el 28 sep: en producción nunca se desarrolló.)


/** Lo que tarda la IA simulada en generar. */
const DURACION_GENERACION = 4000

const recursoDe = (b: Borrador, paginaId: string) => buscarPagina(b, paginaId)?.pagina.recurso
const preguntasDe = (b: Borrador, paginaId: string) => recursoDe(b, paginaId)?.preguntas ?? []

/**
 * **Se guardan las dos cosas a la vez.** El árbol es lo que se edita; la lista plana es su espejo, y es lo que leen
 * la vista del colaborador, el conteo del índice y la calificación. Pasan por aquí todos los cambios —también los de
 * la IA— justamente para que nunca se separen.
 */
function guardarSecciones(paginaId: string, secciones: SeccionPreguntas[]) {
  actualizarPagina(paginaId, (p) => ({
    recurso: { ...(p.recurso ?? { tipo: 'evaluacion-final' }), secciones, preguntas: aplanarPreguntas(secciones) },
  }))
}


/**
 * El editor de preguntas. Lo comparten la evaluación y las dos encuestas: son lo mismo —una lista de preguntas— y lo
 * que cambia es qué tipos se ofrecen, si se califica y si se puede editar (Dave, 7-oct).
 */
export function EditorEvaluacion({ paginaId, encuesta = false, soloLectura = false }: { paginaId: string; encuesta?: boolean; soloLectura?: boolean }) {
  // Cambiar de página del índice arranca el editor de cero (pregunta activa, paginador, aviso de la IA).
  return <Editor key={paginaId} paginaId={paginaId} encuesta={encuesta} soloLectura={soloLectura} />
}

function Editor({ paginaId, encuesta, soloLectura }: { paginaId: string; encuesta: boolean; soloLectura: boolean }) {
  const borrador = useBorrador()
  const secciones = seccionesDe(recursoDe(borrador, paginaId))
  const preguntas = preguntasDe(borrador, paginaId)
  // La sección recién creada: su título entra enfocado para escribirlo de una vez.
  const [recien, setRecien] = useState<string | null>(null)
  const raiz = useRef<HTMLDivElement>(null)

  const [activoId, setActivoId] = useState<string | null>(null)
  /**
   * **Una sola pregunta abierta a la vez, y no se cierra a medias.** Mientras una está en edición, el resto del paso
   * queda apagado; «Agregar» o «Guardar» piden la pregunta completa y, si falta algo, el formulario sigue abierto
   * marcando lo que falta; «Cancelar» descarta la nueva o devuelve la existente a como estaba al abrirla. Es el
   * patrón del creador de encuestas (Dave, 9-oct).
   */
  const [nuevaId, setNuevaId] = useState<string | null>(null)
  const original = useRef<Pregunta | null>(null)
  // Las preguntas que ya intentaron guardarse incompletas: sus campos vacíos se marcan.
  const [marcadas, setMarcadas] = useState<string[]>([])
  // Lo que se pidió eliminar, a la espera de que se confirme: borrar una pregunta o una sección no se deshace, así que
  // pregunta antes con la ventana de siempre, la de eliminar página o sección del índice (el jefe de Dave, 14-oct).
  const [porEliminar, setPorEliminar] = useState<{ tipo: 'pregunta' | 'seccion'; id: string } | null>(null)
  const [intento, setIntento] = useState(0)
  const [configAbierta, setConfigAbierta] = useState(false)
  const [agenteAbierto, setAgenteAbierto] = useState(false)
  const [sesionAgente, setSesionAgente] = useState(0)
  const [generando, setGenerando] = useState(false)

  // La activa es la elegida, y **puede no haber ninguna**: al entrar, todas se leen.
  const activa = preguntas.some((p) => p.id === activoId) ? activoId : null

  /**
   * La primera sección que se crea **parte en dos** lo que había: lo que ya estaba escrito pasa a ser «Sección 1» y la
   * nueva entra detrás. Si no, habría preguntas dentro y fuera de secciones a la vez, que es lo que nadie sabe leer.
   */
  /** Subir y bajar mueven la pregunta dentro de su sección, que es donde el orden significa algo. */
  const accionPregunta = (preguntaId: string, que: AccionPregunta) => {
    const dueno = duenoDe(secciones, preguntaId)
    if (!dueno) return
    if (que === 'eliminar') {
      setPorEliminar({ tipo: 'pregunta', id: preguntaId })
      return
    }
    const lista = [...dueno.questions]
    const indice = lista.findIndex((p) => p.id === preguntaId)
    const destino = que === 'subir' ? indice - 1 : indice + 1
    if (destino < 0 || destino >= lista.length) return
    ;[lista[indice], lista[destino]] = [lista[destino], lista[indice]]
    guardarSecciones(paginaId, cambiarSeccion(secciones, dueno.id, { questions: lista }))
  }

  const anadirPreguntaEn = (seccionId: string) => {
    const nueva = preguntaVacia('multiple_choice_single')
    guardarSecciones(paginaId, meterPregunta(secciones, seccionId, nueva))
    original.current = null
    setNuevaId(nueva.id)
    setActivoId(nueva.id)
  }

  /** Abrir una pregunta guarda cómo estaba, para poder devolverla si se cancela. */
  const abrirPregunta = (preguntaId: string | null) => {
    if (preguntaId === null) return
    original.current = preguntas.find((p) => p.id === preguntaId) ?? null
    setNuevaId(null)
    setActivoId(preguntaId)
  }

  const terminarEdicion = (guardar: boolean) => {
    const id = activoId
    if (!id) return
    const actual = preguntas.find((p) => p.id === id)
    if (guardar && actual) {
      // Sin aviso flotante: lo que falta ya se dice **dentro del formulario**, en su aviso rojo y en los campos
      // marcados. Repetirlo arriba en el centro era decir lo mismo dos veces, y encima lejos del problema
      // (Dave, 9-oct).
      if (faltaEnPregunta(actual).length > 0) {
        setMarcadas((previas) => [...new Set([...previas, id])])
        setIntento((n) => n + 1)
        return
      }
    }
    if (!guardar) {
      // La nueva se descarta; la que ya existía vuelve a como estaba al abrirla.
      if (id === nuevaId) guardarSecciones(paginaId, quitarPregunta(secciones, id))
      else if (original.current) guardarSecciones(paginaId, cambiarPregunta(secciones, original.current))
    }
    original.current = null
    setNuevaId(null)
    setActivoId(null)
  }

  /** El estado vacío crea la primera pregunta en la sección que ya existe. */
  const anadirPrimeraPregunta = () => {
    const nueva = preguntaVacia('multiple_choice_single')
    guardarSecciones(paginaId, meterPregunta(secciones, secciones[0].id, nueva))
    setActivoId(nueva.id)
  }

  const anadirSeccion = () => {
    const nueva = seccionVacia()
    const base = esListaSimple(secciones) ? [{ ...secciones[0], title: 'Sección 1' }] : secciones
    guardarSecciones(paginaId, [...base, nueva])
    setRecien(nueva.id)
  }




  // ── IA ──────────────────────────────────────────────────────────────────────────────────────────────────────

  // Dentro de la hoja «Editar página» el agente se abre a su lado (lo monta la hoja); suelto, aquí mismo.
  const abrirJunto = useAbrirAgenteEvaluaciones()
  const abrirAgente = () => {
    if (abrirJunto) return abrirJunto({ paginaId, onGenerar: generar })
    setSesionAgente((s) => s + 1)
    setAgenteAbierto(true)
  }

  // Atajo al caso de uso completo: `?agente=abierto` deja el agente ya abierto sobre esta evaluación, sin tener que
  // recorrer el asistente. Va en la dirección y no en el `#` porque el asistente reescribe el `#` al abrir la página.
  const [consulta] = useSearchParams()
  const pedido = useRef(false)
  useEffect(() => {
    if (consulta.get('agente') !== 'abierto' || pedido.current) return
    pedido.current = true
    abrirAgente()
    // Solo al entrar: después el agente lo abre y lo cierra quien está trabajando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta])

  const generar = (pedido: PedidoGeneracion) => {
    const nuevas = generarPreguntas(pedido.dificultad, pedido.cantidad, pedido.tipos)
    setGenerando(true)
    // Se escribe en la página aunque el creador se haya ido a otra entretanto: los tokens ya se gastaron.
    window.setTimeout(() => {
      // Las preguntas de la IA entran en la última sección, que es donde se estaba trabajando.
      const actuales = seccionesDe(recursoDe(getBorrador(), paginaId))
      const destino = actuales[actuales.length - 1]
      guardarSecciones(paginaId, nuevas.reduce((acumulado, p) => meterPregunta(acumulado, destino.id, p), actuales))
      setGenerando(false)
      notify('Preguntas generadas. Revisa el editor y ajusta lo que necesites.')
    }, DURACION_GENERACION)
  }

  const hayPreguntas = preguntas.length > 0

  // La barra del recurso principal pinta los dos botones de la evaluación; aquí se le dice qué hacen.
  // La de satisfacción no se ajusta ni se genera: es fija. Y el agente escribe preguntas **de evaluación** —con
  // respuesta correcta—, así que tampoco se ofrece en una encuesta (Dave, 7-oct).
  usePublicarAccionesEvaluacion({
    abrirConfiguracion: soloLectura ? undefined : () => setConfigAbierta(true),
    abrirAgente: encuesta ? undefined : abrirAgente,
    generando,
  })

  return (
    <div ref={raiz} className={cn('relative flex flex-col gap-4', generando && 'min-h-72')}>
      {/* «Configuración» y «Orbit Flow» ya no van aquí: viven en la barra del recurso principal, con «Reemplazar». */}
      <Text as="p" size="sm" weight="semibold">
        {encuesta ? 'Contenido de la encuesta' : 'Contenido de la evaluación'}
      </Text>

      {/* La de satisfacción la escribió UBITS y es igual para todos: así sus respuestas se pueden comparar entre
          contenidos en los reportes. Se lee, no se toca (Dave, 7-oct). */}
      {soloLectura ? (
        <Text as="p" size="sm" variant="muted">
          Esta encuesta no se puede editar. Todas las preguntas son obligatorias.
        </Text>
      ) : null}

      {hayPreguntas ? (
        <>
          <div className="flex scroll-mt-6 flex-col gap-3">
            <ArbolSecciones
              secciones={secciones}
              encuesta={encuesta}
              soloLectura={soloLectura}
              activa={activa}
              recien={recien}
              numeroDe={(id) => preguntas.findIndex((p) => p.id === id) + 1}
              onActivar={(id) => !soloLectura && (id === null ? terminarEdicion(true) : abrirPregunta(id))}
              nueva={nuevaId}
              marcadas={marcadas}
              intento={intento}
              onTerminarEdicion={terminarEdicion}
              onCambiarPregunta={(pregunta) => guardarSecciones(paginaId, cambiarPregunta(secciones, pregunta))}
              onAccionPregunta={accionPregunta}
              onAnadirPregunta={anadirPreguntaEn}
              onReordenar={(seccionId, lista) => guardarSecciones(paginaId, cambiarSeccion(secciones, seccionId, { questions: lista }))}
              onReordenarSecciones={(siguientes) => guardarSecciones(paginaId, siguientes)}
              onTitulo={(id, title) => guardarSecciones(paginaId, cambiarSeccion(secciones, id, { title }))}
              onDescripcion={(id, description) => guardarSecciones(paginaId, cambiarSeccion(secciones, id, { description }))}
              onMoverPregunta={(preguntaId, destinoId) => guardarSecciones(paginaId, moverPregunta(secciones, preguntaId, destinoId))}
              onEliminarSeccion={(id) => setPorEliminar({ tipo: 'seccion', id })}
            />
          </div>

          {!generando && !soloLectura ? (
            <div>
              {/* «Sección de preguntas» y no «Sección» a secas: el índice de la izquierda ya tiene secciones —las del
                  contenido, con sus páginas—, y dos botones con el mismo nombre en la misma pantalla hacen pulsar el
                  que no era. */}
              <Button variant="outline" onClick={anadirSeccion}>
                <HugeiconsIcon icon={FolderAddIcon} data-icon="inline-start" />
                Añadir sección de preguntas
              </Button>
            </div>
          ) : null}

        </>
      ) : !generando ? (
        /* El vacío del sistema, el mismo de todo el producto (decisión 14 de la auditoría), con nuestra palabra:
           quien responde es un colaborador, no un estudiante (Dave, 8-oct). */
        <Frame>
          <FramePanel>
          <PrimeraVez
            icono="glass-document"
            titulo="No has creado preguntas"
            descripcion="Añade preguntas para validar que tus colaboradores han comprendido el contenido que has creado."
            accion={{ texto: 'Añadir pregunta', icono: PlusSignIcon, onClick: anadirPrimeraPregunta }}
          />
          </FramePanel>
        </Frame>
      ) : null}

      {/* Mientras la IA trabaja, el editor queda tapado y sin tocar. */}
      {generando ? (
        <div aria-busy="true" className="absolute inset-0 z-10 flex justify-center rounded-xl bg-background/80 backdrop-blur-sm">
          <div className="sticky top-1/3 mt-24 h-fit">
            <AiThinking label="Generando preguntas" size="md" />
          </div>
        </div>
      ) : null}

      <ModalConfiguracion abierto={configAbierta} onCerrar={() => setConfigAbierta(false)} encuesta={encuesta} />

      <DialogoConfirmar
        abierto={porEliminar?.tipo === 'pregunta'}
        onAbiertoChange={(v) => !v && setPorEliminar(null)}
        icono={Delete02Icon}
        titulo="¿Eliminar la pregunta?"
        descripcion="Se pierde con sus opciones de respuesta. No se puede deshacer."
        accion="Eliminar pregunta"
        destructiva
        onConfirmar={() => {
          if (porEliminar?.tipo === 'pregunta') {
            guardarSecciones(paginaId, quitarPregunta(secciones, porEliminar.id))
            setActivoId(null)
          }
          setPorEliminar(null)
        }}
      >
        {/* Cuál, en el cuerpo y no en el título: el título dice qué es la ventana (acuerdo del 6-oct). */}
        {porEliminar?.tipo === 'pregunta' ? (
          <RegistroConfirmar
            nombre={enunciadoDe(preguntas.find((p) => p.id === porEliminar.id) ?? preguntaVacia()).trim() || 'Pregunta sin enunciado'}
            detalle={encuesta ? 'Pregunta de la encuesta' : 'Pregunta de la evaluación'}
            tono="neutro"
          />
        ) : null}
      </DialogoConfirmar>
      <DialogoConfirmar
        abierto={porEliminar?.tipo === 'seccion'}
        onAbiertoChange={(v) => !v && setPorEliminar(null)}
        icono={Delete02Icon}
        titulo="¿Eliminar la sección?"
        descripcion={
          <>
            <strong>Se eliminan también todas las preguntas que tenga dentro</strong>. No se puede deshacer.
          </>
        }
        accion="Eliminar sección"
        destructiva
        onConfirmar={() => {
          if (porEliminar?.tipo === 'seccion') guardarSecciones(paginaId, quitarSeccion(secciones, porEliminar.id))
          setPorEliminar(null)
        }}
      >
        {porEliminar?.tipo === 'seccion'
          ? (() => {
              const seccion = buscarSeccion(secciones, porEliminar.id)
              const n = seccion ? contarPreguntas(seccion) : 0
              return <RegistroConfirmar nombre={seccion?.title.trim() || 'Sección sin título'} detalle={plural(n, '1 pregunta', `${n} preguntas`)} tono="neutro" />
            })()
          : null}
      </DialogoConfirmar>

      {abrirJunto ? null : (
        <AgenteEvaluaciones
          abierto={agenteAbierto}
          onAbiertoChange={setAgenteAbierto}
          sesion={sesionAgente}
          paginaId={paginaId}
          onGenerar={generar}
        />
      )}
    </div>
  )
}
