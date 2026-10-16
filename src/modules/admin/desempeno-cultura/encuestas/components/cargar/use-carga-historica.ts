import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileImportIcon } from '@hugeicons/core-free-icons'
import { notify } from '@/shared/components/notify'
import { publishProcess } from '@/shared/components/process-store'
import {
  PARSE_FAILURE_OUTCOME,
  STEPS_WITH_PENDING_WORK,
  analyzeUploaded,
  buildQueuedSurveyRow,
  buildReviewItems,
  canProceedFromGeneral,
  findExistingDuplicate,
  pendingReviewItems,
  queuedRowProgress,
  willLoadFail,
  type AnalyzeOutcome,
  type ParticipantResolution,
  type ParticipantResolutions,
  type SurveyImportWarning,
  type SurveyReviewItem,
  type UploadStep,
  type UploadTaskState,
} from '../../modelo/carga-historica'
import { stepAfterAnalysis } from '../../modelo/carga-historica/reviewFlow'
import type { SurveyListItem } from '../../modelo/types'
import { actualizarEncuesta, agregarEncuesta } from '../almacen'

// El estado de la carga histórica: archivos → análisis → (elegir encuesta) → datos generales →
// estructura → carga en segundo plano. Vive en la lista de Encuestas y no en el panel: cerrar el
// panel no detiene una carga, y la fila que se agregó a la tabla refleja su avance. Portado del
// prototipo (useSurveyUploadFlow); sin la bandeja flotante: el avance está en la fila y en «Cargas».

// El análisis se ve avanzar aunque el archivo se lea al instante: un salto de 0 a 100 parece que no
// leyó nada. Parte de 35 como el prototipo.
const ANALISIS_INICIO = 35
const ANALISIS_PASO = 2
const ANALISIS_TICK_MS = 70
const CARGA_TICK_MS = 500
// Una carga que va a fallar se queda entre el 62% y el 80%, como en el prototipo.
const FALLA_DESDE = 62
const FALLA_RANGO = 18
// Para revisar el caso de error sin trucos: la segunda carga de la sesión falla sola (y su reintento funciona). Las
// demás fallan solo si el archivo se llama «falla-carga» o «error-carga». Se cuenta fuera del hook para que cerrar y
// abrir el panel no lo reinicie; recargar la página sí.
const CARGA_QUE_FALLA = 2
let cargasLanzadas = 0

// Las cargas son de la sesión, no de la página: siguen avanzando aunque se salga de Encuestas y, al volver, «Cargas» y
// la fila de la tabla muestran dónde van (caso CAR-021 del tablero de QA; antes la carga se congelaba en «Cargando»).
let tareasDeLaSesion: UploadTaskState[] = []
const oyentesTareas = new Set<(tareas: UploadTaskState[]) => void>()
// También el Centro de procesos (arriba, en la barra) es de la sesión: la carga se queda ahí mientras corre y al terminar,
// aunque se esté en otra página (antes la quitaba la pantalla de Encuestas al salir). «Ver» abre «Cargas»: si se está en
// Encuestas, ahí mismo; si no, lleva a Encuestas y la abre al llegar.
const RUTA_ENCUESTAS = '/admin/desempeno-cultura/encuestas'
let abrirCargasEnPantalla: (() => void) | null = null
let navegarA: ((ruta: string) => void) | null = null
let abrirCargasAlLlegar = false
const verCargas = () => {
  if (abrirCargasEnPantalla) return abrirCargasEnPantalla()
  abrirCargasAlLlegar = true
  navegarA?.(RUTA_ENCUESTAS)
}
const publicarEnProcesos = (tareas: readonly UploadTaskState[]) =>
  tareas.forEach((tarea) =>
    publishProcess({
      id: `carga-encuesta-${tarea.id}`,
      title: `Carga de «${tarea.name}»`,
      meta: tarea.status === 'loading' ? 'Cargando respuestas y resultados' : tarea.status === 'completed' ? 'Lista · ya está en la lista de encuestas' : 'No se pudo cargar · reinténtalo desde Cargas',
      progress: tarea.status === 'loading' ? tarea.progress : undefined,
      done: tarea.status !== 'loading',
      icon: FileImportIcon,
      cta: 'Ver',
      onClick: verCargas,
    }),
  )

const cambiarTareas = (cambio: (previas: UploadTaskState[]) => UploadTaskState[]) => {
  tareasDeLaSesion = cambio(tareasDeLaSesion)
  oyentesTareas.forEach((oyente) => oyente(tareasDeLaSesion))
  publicarEnProcesos(tareasDeLaSesion)
}

export type Proposito = 'files' | 'survey'
export type Pestana = 'nueva' | 'cargas'

export function useCargaHistorica(encuestas: readonly SurveyListItem[]) {
  const [abierto, setAbierto] = useState(false)
  const [pestana, setPestana] = useState<Pestana>('nueva')
  const [paso, setPaso] = useState<UploadStep>('dropzone')
  const [archivos, setArchivos] = useState<File[]>([])
  const [analisis, setAnalisis] = useState<{ proposito: Proposito; avance: number } | null>(null)
  const [revision, setRevision] = useState<SurveyReviewItem[]>([])
  const [elegida, setElegida] = useState<string | null>(null)
  const [cargadas, setCargadas] = useState<string[]>([])
  const [resoluciones, setResoluciones] = useState<ParticipantResolutions>({})
  const [avisos, setAvisos] = useState<SurveyImportWarning[]>([])
  const [error, setError] = useState<{ title: string; detail: string } | null>(null)
  const [simulada, setSimulada] = useState(false)
  const [errorNombre, setErrorNombre] = useState(false)
  const [tareas, setTareas] = useState<UploadTaskState[]>(tareasDeLaSesion)
  useEffect(() => {
    oyentesTareas.add(setTareas)
    setTareas(tareasDeLaSesion)
    return () => {
      oyentesTareas.delete(setTareas)
    }
  }, [])
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const navigate = useNavigate()
  const abrirRef = useRef<(en?: Pestana) => void>(() => undefined)
  useEffect(() => {
    navegarA = navigate
    abrirCargasEnPantalla = () => abrirRef.current('cargas')
    if (abrirCargasAlLlegar) {
      abrirCargasAlLlegar = false
      abrirRef.current('cargas')
    }
    return () => {
      abrirCargasEnPantalla = null
    }
  }, [navigate])
  const relojes = useRef<Set<ReturnType<typeof setInterval>>>(new Set())

  useEffect(() => {
    const activos = relojes.current
    return () => activos.forEach((reloj) => clearInterval(reloj))
  }, [])

  const reloj = (funcion: (detener: () => void) => void, ms: number) => {
    const id = setInterval(() => funcion(() => (clearInterval(id), relojes.current.delete(id))), ms)
    relojes.current.add(id)
  }

  const reiniciar = useCallback(() => {
    setArchivos([])
    setPaso('dropzone')
    setRevision([])
    setElegida(null)
    setCargadas([])
    setResoluciones({})
    setAvisos([])
    setError(null)
    setSimulada(false)
    setErrorNombre(false)
    setAnalisis(null)
  }, [])

  const abrir = (en: Pestana = 'nueva') => {
    if (en === 'nueva' && !STEPS_WITH_PENDING_WORK.includes(paso)) reiniciar()
    setPestana(en)
    setAbierto(true)
  }
  useEffect(() => {
    abrirRef.current = abrir
  })

  const cerrarDelTodo = () => {
    setConfirmarSalida(false)
    setAbierto(false)
    reiniciar()
  }

  /** Cerrar a mitad de la revisión pregunta antes: se perdería lo corregido. */
  const cambiarAbierto = (siguiente: boolean) => {
    if (siguiente) return setAbierto(true)
    if (STEPS_WITH_PENDING_WORK.includes(paso)) return setConfirmarSalida(true)
    setAbierto(false)
    if (paso !== 'next-action') reiniciar()
  }

  const terminarLectura = (resultado: AnalyzeOutcome) => {
    setAnalisis(null)
    if (resultado.kind === 'error') {
      setError({ title: resultado.title, detail: resultado.detail })
      setRevision([])
      setAvisos([])
      setPaso('error')
      return
    }
    const items = buildReviewItems(resultado.result)
    setError(null)
    setSimulada(resultado.simulated === true)
    setAvisos(resultado.result.unrecognizedFiles)
    setCargadas([])
    setResoluciones({})
    setRevision(items)
    setElegida(items[0]?.groupKey ?? null)
    setPaso(stepAfterAnalysis(resultado))
  }

  /** Lee los archivos de verdad mientras la barra avanza; termina cuando las dos cosas acaban. */
  const analizar = () => {
    let listo: AnalyzeOutcome | null = null
    let avance = ANALISIS_INICIO
    analyzeUploaded(archivos)
      .then((resultado) => (listo = resultado))
      .catch((falla) => {
        console.error('No se pudieron leer los archivos de la carga histórica', falla)
        listo = PARSE_FAILURE_OUTCOME
      })
    setAnalisis({ proposito: 'files', avance })
    reloj((detener) => {
      avance = Math.min(100, avance + ANALISIS_PASO)
      setAnalisis({ proposito: 'files', avance })
      if (avance < 100 || !listo) return
      detener()
      terminarLectura(listo)
    }, ANALISIS_TICK_MS)
  }

  /** Con varias encuestas en el lote, preparar la elegida también toma un momento. */
  const prepararElegida = () => {
    let avance = ANALISIS_INICIO
    setAnalisis({ proposito: 'survey', avance })
    reloj((detener) => {
      avance = Math.min(100, avance + ANALISIS_PASO * 2)
      setAnalisis({ proposito: 'survey', avance })
      if (avance < 100) return
      detener()
      setAnalisis(null)
      setPaso('general')
    }, ANALISIS_TICK_MS)
  }

  const volverAArchivos = () => {
    setPaso('dropzone')
    setRevision([])
    setElegida(null)
    setCargadas([])
    setAvisos([])
    setSimulada(false)
    setErrorNombre(false)
  }

  const actual = revision.find((item) => item.groupKey === elegida) ?? null
  const duplicada = actual ? findExistingDuplicate(actual.name, null, encuestas) : null
  const puedeSeguir = canProceedFromGeneral(actual)
  const pendientes = pendingReviewItems(revision, cargadas)

  const editar = (cambios: Partial<SurveyReviewItem>) => actual && setRevision((items) => items.map((item) => (item.groupKey === actual.groupKey ? { ...item, ...cambios } : item)))
  const resolver = (identificador: string, decision: ParticipantResolution | null) =>
    setResoluciones((previas) => {
      if (decision !== null) return { ...previas, [identificador]: decision }
      const siguientes = { ...previas }
      delete siguientes[identificador]
      return siguientes
    })

  const irAEstructura = () => {
    if (duplicada) return setErrorNombre(true)
    setErrorNombre(false)
    setPaso('summary')
  }

  /** La carga en segundo plano: la fila de la tabla y la pestaña «Cargas» siguen su avance. */
  const correr = (tarea: UploadTaskState) => {
    const tope = tarea.willFail ? FALLA_DESDE + Math.random() * FALLA_RANGO : 100
    let avance = 0
    // Sin `reloj`: ese se apaga al salir de la página y la carga tiene que seguir.
    const id = setInterval(() => {
      const detener = () => clearInterval(id)
      avance = Math.min(tope, avance + Math.random() * 20)
      const llego = avance >= tope
      const estado: UploadTaskState['status'] = llego ? (tarea.willFail ? 'failed' : 'completed') : 'loading'
      const redondeado = Math.round(avance)
      cambiarTareas((previas) => previas.map((otra) => (otra.id === tarea.id ? { ...otra, progress: redondeado, status: estado } : otra)))
      actualizarEncuesta(`up-${tarea.id}`, queuedRowProgress(redondeado, estado))
      if (!llego) return
      detener()
      if (estado === 'completed') notify(`«${tarea.name}» ya está cargada`, 'Sus resultados están en la lista de encuestas.', 'success')
      else notify(`No se pudo terminar la carga de «${tarea.name}»`, 'Reinténtala desde la fila de la encuesta o desde Cargar encuestas › Cargas.', 'error')
    }, CARGA_TICK_MS)
  }

  const cargar = () => {
    if (!actual) return
    const id = Date.now()
    cargasLanzadas += 1
    const tarea: UploadTaskState = { id, name: actual.name, progress: 0, status: 'loading', willFail: willLoadFail(actual) || cargasLanzadas === CARGA_QUE_FALLA }
    setArchivos([])
    cambiarTareas((previas) => [tarea, ...previas])
    setCargadas((previas) => [...previas, actual.groupKey])
    const quedan = pendientes.filter((item) => item.groupKey !== actual.groupKey)
    if (quedan.length > 0) setPaso('next-action')
    else {
      setPaso('loading')
      setPestana('cargas')
    }
    agregarEncuesta(buildQueuedSurveyRow(actual, id))
    correr(tarea)
  }

  const cargarPendiente = () => {
    const siguiente = pendientes[0]
    if (!siguiente) return
    setErrorNombre(false)
    setElegida(siguiente.groupKey)
    if (pendientes.length > 1) return setPaso('select')
    prepararElegida()
  }

  const volver = () => {
    if (paso === 'summary') return setPaso('general')
    if (cargadas.length > 0) return setPaso('next-action')
    volverAArchivos()
  }

  /** Reintenta una carga caída, desde «Cargas» o desde la fila de la tabla (`up-<id>`). */
  const reintentar = (idTarea: number) => {
    const tarea = tareas.find((otra) => otra.id === idTarea)
    if (!tarea) return
    // En la maqueta el reintento funciona: el prototipo volvía a fallar siempre y dejaba la carga sin salida.
    const reiniciada = { ...tarea, progress: 0, status: 'loading' as const, willFail: false }
    cambiarTareas((previas) => previas.map((otra) => (otra.id === idTarea ? reiniciada : otra)))
    actualizarEncuesta(`up-${idTarea}`, queuedRowProgress(0, 'loading'))
    correr(reiniciada)
  }

  return {
    abierto,
    abrir,
    cambiarAbierto,
    pestana,
    /** Volver a «Nueva carga» con una carga ya lanzada empieza otra desde cero. */
    setPestana: (siguiente: Pestana) => {
      if (siguiente === 'nueva' && paso === 'loading') reiniciar()
      setPestana(siguiente)
    },
    paso,
    archivos,
    setArchivos,
    analisis,
    analizar,
    revision,
    elegida,
    setElegida,
    prepararElegida,
    actual,
    editar,
    duplicada,
    errorNombre,
    puedeSeguir,
    irAEstructura,
    setPaso,
    resoluciones,
    resolver,
    avisos,
    error,
    simulada,
    cargar,
    pendientes,
    cargadas,
    cargarPendiente,
    volver,
    volverAArchivos,
    empezarDeNuevo: () => {
      reiniciar()
      setPestana('nueva')
    },
    tareas,
    reintentar,
    confirmarSalida,
    cancelarSalida: () => setConfirmarSalida(false),
    cerrarDelTodo,
  }
}

export type CargaHistorica = ReturnType<typeof useCargaHistorica>
