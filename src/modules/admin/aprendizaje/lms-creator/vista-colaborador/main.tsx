import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  BatteryFullIcon,
  Cancel01Icon,
  Certificate01Icon,
  Clock01Icon,
  ComputerIcon,
  Download01Icon,
  Globe02Icon,
  Image01Icon,
  Menu01Icon,
  SignalFull02Icon,
  SignalMedium01Icon,
  SmartPhone01Icon,
  Wifi01Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Empty,
  EmptyHeader,
  EmptyMedia,
  Heading,
  Separator,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { LluviaConfeti } from '@/shared/components/Confeti'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { CONTENIDOS } from '@/shared/bd'
import { CajaCarrusel } from '@/modules/portal-colaborador/aprendizaje/zona-de-estudio/components/carrusel'
import { nombreCategoria, nombreIdioma, nombreNivel, nombreTipo, textoDuracion } from '../crear-contenido/components/ficha'
import { MarcoInmersivo } from '../crear-contenido/components/marco-inmersivo'
import { BarraColaborador } from '../crear-contenido/components/barras'
import {
  CargandoPresentacion,
  VistaDeRecurso,
  VistaEmbebido,
  VistaPdf,
  VistaScorm,
  VistaTexto,
  VistaVideo,
} from '../crear-contenido/components/bloque-recurso'
import { CargandoVideo } from '../crear-contenido/components/video/cargando-video'
import { VistaPresentacion } from '../crear-contenido/components/presentacion/vista-presentacion'
import { RanuraDeRecurso } from '../crear-contenido/components/ranura-recurso'
import { EstudioRoleplay, type AccionLlamada } from '../crear-contenido/components/roleplay/roleplay-colaborador'
import { ESTADO_INICIAL, evaluarIntento, type EstadoRoleplay } from '../crear-contenido/components/roleplay/estudio'
import type { SeccionPreguntas } from '../crear-contenido/components/evaluacion/secciones'
import {
  EvaluacionColaborador,
  calificar,
  preguntasCalificables,
  pasosDeIntento,
  prepararIntento,
  todasRespondidas,
  type Respuestas,
  type FaseEvaluacion,
  type ResultadoEvaluacion,
} from '../crear-contenido/components/evaluacion/vista-colaborador'
import { borradorDemo, estaVacio } from '../crear-contenido/components/demo'
import {
  getBorrador,
  reemplazarBorrador,
  rutaAsistente,
  textoPlano,
  todasLasPaginas,
  useBorrador,
  type Borrador,
  type ConfigEvaluacion,
  type Pagina,
  type Pregunta,
} from '../crear-contenido/components/borrador'
import { IndiceColaborador, type Vista } from './indice'
import { AsistenciaColaborador } from './components/asistencia-colaborador'
import { asistenciaCompletada, asistenciaEnVivo, useAhora, type Confirmaciones } from './components/asistencia-estado'

// **Vista del colaborador**: el contenido que se está creando, recorrido como lo recorrerá quien lo estudie.
//
// Vuelve de `legacy-2`, el asistente WYSIWYG que tuvimos hasta el 1-oct, y se respeta su reparto: a la izquierda lo
// que el colaborador consume —la portada, el recurso de la página o el cierre— y a la derecha su ficha y **el índice
// del contenido con el estado de cada página**: en curso, completada, pendiente o bloqueada. Allá era un modo del
// propio editor; aquí es una pantalla aparte, porque el editor de hoy tiene su propio cromo y conmutarlo entero
// obligaría a que cada pieza viva sepa pintarse de dos formas (Dave, 5-oct).
//
// Lo que se recorre es el borrador tal como está: sin páginas ocultas y, si la navegación es lineal, con las que
// todavía no tocan bloqueadas.


/**
 * **Un enlace que se puede mandar.** La vista previa vive de un borrador en la memoria de la pestaña, así que al
 * abrirla en frío —otra persona, otro computador, una ventana nueva— no había nada que enseñar: tocaba pasar antes
 * por el asistente. Con estos parámetros el enlace se basta solo (Dave, 13-oct):
 *
 * - `?ejemplo` — siembra el contenido de ejemplo si la pestaña no tiene borrador. `?ejemplo=forzar` lo siembra
 *   siempre, aunque haya uno a medias: es lo que hace falta para compartir una pantalla concreta.
 * - `?pagina=<id>` — abre esa página directamente, sin pasar por la portada.
 *
 * El ejemplo se siembra con **navegación libre**: un enlace a la última página no puede toparse con el candado de
 * las que no se han visto. Lo que el creador tenga configurado no se toca; esto solo vale para el ejemplo.
 */
function sembrarEjemplo(modo: string | null): boolean {
  if (modo === null) return false
  const actual = getBorrador()
  if (modo !== 'forzar' && !estaVacio(actual)) return false
  reemplazarBorrador({ ...borradorDemo(), navegacion: 'libre' })
  return true
}

export function Component() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const borrador = useBorrador()
  // De dónde se entró, para devolver al mismo paso. Sin esto el asistente reabría en el paso 1 y parecía que se
  // había perdido el trabajo, igual que pasaba al salir de «Agregar asistencia» (Dave, 2-oct).
  const [volver] = useState(() => parametros.get('volver') ?? '')
  // A dónde sale la X cuando quien abrió la vista previa no es el asistente. `volver` solo guarda el paso del
  // asistente, así que sin esto Resultados mandaba a la vista previa y la X dejaba a la persona dentro del asistente
  // de otro contenido, sin camino de vuelta (13-oct).
  const [destino] = useState(() => parametros.get('destino') ?? '')
  // El ejemplo se siembra **antes del primer pintado**, no en un efecto: si no, la pantalla aparece vacía y da un
  // salto en cuanto llega el contenido. `useBorrador` ya lee lo que acaba de quedar sembrado.
  useState(() => sembrarEjemplo(parametros.get('ejemplo')))

  const orden = useMemo(() => todasLasPaginas(borrador).filter((p) => !p.oculta), [borrador])
  const [vista, setVista] = useState<Vista>('portada')
  const [paginaId, setPaginaId] = useState<string | null>(null)
  const [visitadas, setVisitadas] = useState<string[]>([])
  // El contenido está iniciado: lo enciende «Comenzar ahora» y ya no se apaga. Antes se deducía de las páginas vistas,
  // y como una página solo queda vista al salir de ella, el índice seguía con todo bloqueado mientras la primera
  // estaba abierta (Dave, 6-oct).
  const [empezado, setEmpezado] = useState(false)
  const [respuestas, setRespuestas] = useState<Record<string, Respuestas>>({})
  const [resultados, setResultados] = useState<Record<string, ResultadoEvaluacion>>({})
  // Una evaluación tiene un antes: hasta que no se pulsa «Comenzar», no corre el reloj ni cuenta el intento. Y tiene
  // un después que depende de cómo acabó: por tiempo o enviando, con intentos de sobra o sin ninguno (Dave, 8-oct).
  const [empezadas, setEmpezadas] = useState<string[]>([])
  const [intentos, setIntentos] = useState<Record<string, number>>({})
  const [porTiempo, setPorTiempo] = useState<string[]>([])
  /** Segundos que le quedan a la evaluación abierta. `null` cuando no hay ninguna corriendo. */
  const [restante, setRestante] = useState<number | null>(null)
  /** En qué parte de la evaluación va, cuando está dividida en secciones. Vuelve a cero al cambiar de página. */
  const [pasoEval, setPasoEval] = useState(0)
  // La semilla del barajado de cada página: fija mientras se responde y nueva en cada reintento (ver `prepararIntento`).
  const [semillas, setSemillas] = useState<Record<string, number>>({})
  const semillaDe = (id: string) => semillas[id] ?? 1
  // Las sesiones de asistencia que se confirmaron (id de la sesión → hora de confirmación). Una página de asistencia
  // queda completada con una sola (HU-APR-009).
  const [confirmaciones, setConfirmaciones] = useState<Confirmaciones>({})
  const [roleplays, setRoleplays] = useState<Record<string, EstadoRoleplay>>({})
  /** Lo que la llamada de un roleplay quiere en la barra mientras no ha empezado. Ella sabe del micrófono y de los
      intentos; esta pantalla, no. Fuera de esa página siempre es `null`. */
  const [accionLlamada, setAccionLlamada] = useState<AccionLlamada | null>(null)

  useEffect(() => {
    document.title = 'Vista del colaborador — UBITS'
  }, [])

  /**
   * `?pagina=<id>` abre esa página en cuanto hay contenido. El contenido queda **empezado**, que es lo que haría
   * «Comenzar ahora»: un enlace a una página concreta no puede caer en el candado que llevan todas antes de entrar.
   *
   * Con `&estado=aprobado` la página se abre **ya resuelta y con buena nota**, y con `&estado=reprobado`, sin
   * alcanzarla. Son las pantallas que más cuesta enseñar: en una evaluación hay que responderlo todo (bien o mal), y
   * en un roleplay el primer intento está hecho para quedarse corto y el segundo para aprobar, así que harían falta
   * una o dos llamadas. El veredicto se fabrica aquí mismo, como lo fabrica el propio recurso al terminar.
   */
  useEffect(() => {
    const pedida = parametros.get('pagina')
    if (!pedida || paginaId !== null) return
    const destino = orden.find((p) => p.id === pedida)
    if (!destino) return
    setEmpezado(true)
    setPaginaId(pedida)
    setVista('pagina')

    const pedido = parametros.get('estado')
    if (pedido !== 'aprobado' && pedido !== 'reprobado') return
    const aprueba = pedido === 'aprobado'
    const r = destino.recurso
    if (r?.tipo === 'evaluacion-final') {
      const cfg = r.config ?? borrador.configEvaluacion
      const total = preguntasCalificables(r.preguntas ?? []).length
      // Reprobada: ni una correcta, que es el caso que de verdad hay que poder enseñar.
      const correctas = aprueba ? total : 0
      const porcentaje = total === 0 ? 0 : Math.round((correctas / total) * 100)
      setResultados((x) => ({ ...x, [pedida]: { correctas, total, porcentaje, aprobado: porcentaje >= cfg.aprobacion } }))
      setIntentos((x) => ({ ...x, [pedida]: 1 }))
    }
    if (r?.tipo === 'roleplay' && r.roleplay) {
      // El primer intento está hecho para quedarse corto y el segundo para alcanzar los objetivos: ver
      // `alcanzadosDe` en `estudio.ts`. Así que reprobado es el intento 0 y aprobado, el 1.
      const intento = aprueba ? 1 : 0
      setRoleplays((x) => ({ ...x, [pedida]: { intentosUsados: intento + 1, resultado: evaluarIntento(r.roleplay!, intento) } }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden.length])

  const indice = orden.findIndex((p) => p.id === paginaId)
  const pagina = indice >= 0 ? orden[indice] : null

  // La asistencia pide una sesión confirmada para completarse; las demás páginas no tienen ese freno. Con la
  // Autoasistencia apagada nadie la confirma desde aquí: la libera el administrador y la vista no puede simularlo.
  const paginaCompletada = (p: Pagina) => p.recurso?.tipo !== 'asistencia' || asistenciaCompletada(p.recurso.asistencia, confirmaciones)
  // La hora corre solo si hay una página de asistencia: de ella depende la insignia «En vivo» del índice.
  const hayAsistencia = orden.some((p) => p.recurso?.tipo === 'asistencia')
  const ahora = useAhora(hayAsistencia ? 15000 : 0)

  /** Califica lo respondido, gasta el intento y deja dicho si llegó por tiempo o porque se envió. */
  const enviarEvaluacion = (
    id: string,
    preguntas: Pregunta[],
    cfg: ConfigEvaluacion,
    suyas: Respuestas,
    agotado: boolean,
    secciones?: SeccionPreguntas[],
  ) => {
    setResultados((x) => ({ ...x, [id]: calificar(prepararIntento(preguntas, cfg, semillaDe(id), secciones), suyas, cfg) }))
    setIntentos((x) => ({ ...x, [id]: (x[id] ?? 0) + 1 }))
    if (agotado) setPorTiempo((x) => (x.includes(id) ? x : [...x, id]))
    setRestante(null)
  }

  // La fase de la evaluación abierta, y el reloj.
  const evaluacionActiva = (() => {
    const r = pagina?.recurso
    if (!pagina || r?.tipo !== 'evaluacion-final') return null
    const cfg = r.config ?? borrador.configEvaluacion
    const hechas = intentos[pagina.id] ?? 0
    return { id: pagina.id, cfg, preguntas: r.preguntas ?? [], secciones: r.secciones, intento: hechas + 1, empezada: empezadas.includes(pagina.id) }
  })()

  useEffect(() => {
    const ev = evaluacionActiva
    if (!ev || !ev.empezada || resultados[ev.id] || !ev.cfg.tiempoLimite) {
      setRestante(null)
      return
    }
    setRestante((s) => s ?? ev.cfg.minutos * 60)
    const reloj = window.setInterval(() => setRestante((s) => (s == null ? s : Math.max(0, s - 1))), 1000)
    return () => window.clearInterval(reloj)
  }, [evaluacionActiva?.id, evaluacionActiva?.empezada, resultados, evaluacionActiva?.cfg.tiempoLimite])

  /**
   * **Salir pausa el intento.** Al irse a otra página la evaluación deja de estar empezada, así que al volver se ve
   * la pantalla de retomar con lo respondido y el reloj vuelve a correr cuando el colaborador decide seguir. Es más
   * honesto que dejar corriendo un tiempo que esta maqueta no guarda en ninguna parte (Dave, 8-oct).
   */
  useEffect(() => {
    setEmpezadas((x) => (x.every((id) => id === pagina?.id) ? x : x.filter((id) => id === pagina?.id)))
    setPasoEval(0)
  }, [pagina?.id])

  // Se acabó el tiempo: se califica lo que haya, que es justo lo que pasa en una evaluación de verdad.
  useEffect(() => {
    const ev = evaluacionActiva
    if (restante !== 0 || !ev || resultados[ev.id]) return
    enviarEvaluacion(ev.id, ev.preguntas, ev.cfg, respuestas[ev.id] ?? {}, true, ev.secciones)
  }, [restante])


  /**
   * Con navegación lineal solo se abre lo ya visto y lo que sigue; con la libre, todo. Pero **nada se abre antes de
   * empezar**: hasta que el colaborador pulsa «Comenzar ahora» todas las páginas van con candado, incluida la
   * primera. Ese botón no es un «ir a la página 1»: es lo que le dice al back que alguien inició el contenido, y por
   * eso tiene que ser la única puerta de entrada (Dave, 6-oct).
   */
  const accesible = (id: string) => {
    if (!empezado) return false
    // Asistencia sin confirmar: ni siquiera en la navegación libre se salta a otra página hasta cumplirla (HU-APR-009).
    if (vista === 'pagina' && pagina && id !== pagina.id && !paginaCompletada(pagina)) return false
    if (borrador.navegacion !== 'lineal') return true
    const i = orden.findIndex((p) => p.id === id)
    if (i <= 0) return true
    return orden.slice(0, i).every((p) => visitadas.includes(p.id))
  }
  const pendientes = orden.filter((p) => !visitadas.includes(p.id)).length
  // «Fin del contenido» no se activa mientras falte una asistencia confirmada, ni siquiera en la navegación libre.
  const asistenciasSinConfirmar = orden.filter((p) => !paginaCompletada(p)).length
  const cierreAccesible = !asistenciasSinConfirmar && (borrador.navegacion !== 'lineal' || !pendientes)

  const irAPagina = (id: string) => {
    setEmpezado(true)
    setPaginaId(id)
    setVista('pagina')
  }

  /** Al salir de una página queda vista; es lo que mueve el progreso y abre la siguiente. */
  const marcarVista = (id: string) => setVisitadas((v) => (v.includes(id) ? v : [...v, id]))

  const continuar = () => {
    if (!pagina) return
    marcarVista(pagina.id)
    const siguiente = orden[indice + 1]
    if (siguiente) irAPagina(siguiente.id)
    else setVista('cierre')
  }

  const salir = () => navigate(destino || `${rutaAsistente()}${volver}`)

  // En qué aparato se está mirando. Antes las dos vistas salían a la vez, una al lado de la otra, y la de escritorio
  // se quedaba con el ancho que le sobraba al teléfono; ahora se enseña una sola, la que diga el conmutador de la
  // cabecera, y cada una ocupa lo suyo (Dave, 7-oct).
  const [dispositivo, setDispositivo] = useState<Dispositivo>('computador')
  const enCelular = dispositivo === 'celular'

  // El índice del móvil vive detrás de un botón de su barra: aquí se sabe si está abierto.
  const [indiceMovil, setIndiceMovil] = useState(false)

  // ── La barra de abajo: dónde está, qué falta y qué botón ──
  const progreso = Math.round(((visitadas.length + (vista === 'cierre' ? 1 : 0)) / Math.max(1, orden.length + 1)) * 100)
  const barra = (() => {
    if (vista === 'portada') {
      if (!orden.length) {
        return { principal: { texto: 'Comenzar ahora', deshabilitado: true, onClick: () => undefined }, mensaje: 'Este contenido aún no tiene páginas.' }
      }
      const siguiente = orden.find((p) => !visitadas.includes(p.id)) ?? orden[0]
      return {
        // «Comenzar ahora» mientras no se haya iniciado el contenido, aunque se haya pasado por la portada: volver a
        // ella no deshace el inicio, pero mirarla tampoco lo provoca.
        principal: { texto: empezado ? 'Continuar' : 'Comenzar ahora', onClick: () => irAPagina(siguiente.id) },
      }
    }

    if (vista === 'cierre') {
      return {
        onRegresar: () => (orden.length ? irAPagina(orden[orden.length - 1].id) : setVista('portada')),
        mensaje: pendientes ? 'Aún no has completado todas las páginas de este contenido.' : undefined,
        principal: pendientes
          ? { texto: 'Ir a lo pendiente', onClick: () => irAPagina((orden.find((p) => !visitadas.includes(p.id)) ?? orden[0]).id) }
          : { texto: 'Ver más contenidos', onClick: () => notify('Este botón lleva al colaborador al catálogo de Aprendizaje.', undefined, 'info') },
      }
    }

    if (!pagina) return { principal: { texto: 'Continuar', onClick: () => setVista('portada') } }

    const atras = () => (indice > 0 ? irAPagina(orden[indice - 1].id) : setVista('portada'))
    const r = pagina.recurso

    // Una evaluación se responde y se envía antes de poder seguir; si no se aprueba, se reintenta.
    if (r?.tipo === 'evaluacion-final') {
      const suyas = respuestas[pagina.id] ?? {}
      const resultado = resultados[pagina.id]
      const cfg = r.config ?? borrador.configEvaluacion
      const hayPreguntas = Boolean(r.preguntas?.length)

      // Publicada sin preguntas: ni bienvenida ni intento, se sigue de largo. No gasta nada.
      if (!hayPreguntas) return { onRegresar: atras, principal: { texto: 'Continuar', onClick: continuar } }

      // **El antes.** Hasta que no se pulsa aquí no corre el reloj ni cuenta el intento: entrar a mirar la página no
      // puede costarle un intento a nadie.
      if (!resultado && !empezadas.includes(pagina.id)) {
        const retoma = Object.keys(suyas).length > 0
        // Tras fallar, el botón nombra el intento al que entra: «Comenzar evaluación» en el segundo sonaría a que
        // empieza de cero y no es lo que pasó.
        const numero = (intentos[pagina.id] ?? 0) + 1
        return {
          onRegresar: atras,
          principal: {
            texto: retoma ? 'Continuar evaluación' : numero > 1 ? `Comenzar intento ${numero}` : 'Comenzar evaluación',
            onClick: () => {
              setPasoEval(0)
              setEmpezadas((x) => [...x, pagina.id])
            },
          },
        }
      }
      if (!resultado) {
        /* **Una sección a la vez.** Con la evaluación dividida, la barra del recorrido avanza por sus partes en vez
           de por páginas: «Continuar» lleva a la siguiente sección y solo la última envía. No hace falta una segunda
           navegación dentro de la página porque esta ya estaba (Dave, 8-oct). */
        const lista = prepararIntento(r.preguntas ?? [], cfg, semillaDe(pagina.id), r.secciones)
        const pasos = pasosDeIntento(lista, r.secciones)
        const cual = Math.min(pasoEval, pasos.length - 1)
        const ultima = cual >= pasos.length - 1
        // Para pasar de parte basta con haber respondido **la que se está viendo**: lo que falta más adelante todavía
        // no se ha visto, y bloquear por eso no se entendería.
        const listo = todasRespondidas(pasos[cual]?.preguntas ?? [], suyas)
        return {
          // Atrás sale de la página solo desde la primera parte; dentro, retrocede de sección.
          onRegresar: cual > 0 ? () => setPasoEval(cual - 1) : atras,
          mensaje: listo ? undefined : 'Responde todas las preguntas para continuar.',
          principal: {
            texto: ultima ? 'Enviar respuestas' : 'Continuar',
            deshabilitado: !listo,
            onClick: ultima
              ? () => enviarEvaluacion(pagina.id, r.preguntas ?? [], cfg, suyas, false, r.secciones)
              : () => setPasoEval(cual + 1),
          },
        }
      }

      // **El después.** Sin intentos no se ofrece reintentar: sería prometer algo que no va a pasar.
      if (!resultado.aprobado) {
        const gastados = intentos[pagina.id] ?? 0
        const sinIntentos = cfg.limitarIntentos && gastados >= cfg.intentos
        if (sinIntentos) {
          return {
            onRegresar: atras,
            mensaje: 'Habla con tu administrador si necesitas otra oportunidad.',
            principal: { texto: 'Continuar', deshabilitado: true, onClick: () => undefined },
          }
        }
        return {
          onRegresar: atras,
          mensaje: `No alcanzaste el ${cfg.aprobacion} % para aprobar.`,
          secundario: { texto: 'Ir al inicio', onClick: () => setVista('portada') },
          principal: {
            texto: 'Reintentar',
            onClick: () => {
              setResultados(({ [pagina.id]: _fuera, ...resto }) => resto)
              // Otro intento, otro orden.
              setSemillas((x) => ({ ...x, [pagina.id]: semillaDe(pagina.id) + 1 }))
              setRespuestas(({ [pagina.id]: _tambien, ...resto }) => resto)
              setEmpezadas((x) => x.filter((id) => id !== pagina.id))
              setPorTiempo((x) => x.filter((id) => id !== pagina.id))
              setRestante(null)
              setPasoEval(0)
            },
          },
        }
      }
    }

    /**
     * **Una encuesta también se responde entera antes de seguir** (Dave, 8-oct). No se califica ni se aprueba —por eso
     * no tiene ni bienvenida ni resultado— pero sus respuestas son el dato que alguien va a leer después, y media
     * encuesta en blanco no sirve de nada. La de satisfacción lo dice en el propio Creator: todas sus preguntas son
     * obligatorias.
     */
    if (r?.tipo === 'encuesta-libre' || r?.tipo === 'encuesta-satisfaccion') {
      const suyas = respuestas[pagina.id] ?? {}
      const listo = todasRespondidas(r.preguntas ?? [], suyas)
      return {
        onRegresar: atras,
        mensaje: listo ? undefined : 'Responde todas las preguntas para continuar.',
        principal: { texto: 'Continuar', deshabilitado: !listo, onClick: continuar },
      }
    }

    // Sin una asistencia confirmada no se continúa. Con Autoasistencia, la confirma quien estudia en su sesión; sin ella,
    // la carga el administrador y desde aquí no hay forma de liberarla (RN-05c).
    if (r?.tipo === 'asistencia' && !paginaCompletada(pagina)) {
      return {
        onRegresar: atras,
        mensaje: r.asistencia?.autoasistencia ? 'Confirma tu asistencia para continuar.' : 'Tu administrador confirma esta asistencia: podrás continuar cuando la cargue.',
        principal: { texto: 'Continuar', deshabilitado: true, onClick: () => undefined },
      }
    }

    // El roleplay en modo Evaluación no deja avanzar hasta aprobarlo, y el **reintento vive aquí**, en la navegación
    // del contenido —igual que en las evaluaciones—, no dentro de la tarjeta de resultados: así no hay dos botones
    // primarios compitiendo en la misma pantalla.
    if (r?.tipo === 'roleplay' && r.roleplay && r.roleplay.modo !== 'practica') {
      const suyo = roleplays[pagina.id] ?? ESTADO_INICIAL
      if (!suyo.resultado?.aprobado) {
        const quedan = r.roleplay.intentos - suyo.intentosUsados
        // Antes de la llamada, la barra ofrece **iniciarla**, igual que una evaluación ofrece «Comenzar
        // evaluación»: se empieza siempre desde el mismo sitio (Dave, 13-oct).
        if (accionLlamada) {
          return {
            onRegresar: atras,
            mensaje: accionLlamada.mensaje,
            principal: { texto: accionLlamada.texto, deshabilitado: accionLlamada.deshabilitado, onClick: accionLlamada.onIniciar },
          }
        }
        if (suyo.resultado && quedan > 0) {
          return {
            onRegresar: atras,
            principal: {
              texto: 'Reintentar',
              onClick: () => setRoleplays((x) => ({ ...x, [pagina.id]: { ...suyo, resultado: null } })),
            },
          }
        }
        return {
          onRegresar: atras,
          mensaje: quedan > 0 ? 'Aprueba la llamada para continuar.' : 'Habla con tu administrador para tener otra oportunidad.',
          principal: { texto: 'Continuar', deshabilitado: true, onClick: () => undefined },
        }
      }
    }

    // En modo Práctica no hay nada que aprobar, pero la llamada se inicia igual desde la barra.
    if (accionLlamada) {
      return {
        onRegresar: atras,
        mensaje: accionLlamada.mensaje,
        principal: { texto: accionLlamada.texto, deshabilitado: accionLlamada.deshabilitado, onClick: accionLlamada.onIniciar },
      }
    }

    return { onRegresar: atras, principal: { texto: 'Continuar', onClick: continuar } }
  })()

  // Lo que se está consumiendo ahora —portada, recurso o cierre—. Se saca aparte porque lo pintan dos veces: la
  // columna de escritorio y la ventanita del teléfono.
  const consumo = vista === 'portada'
    ? <Portada borrador={borrador} />
    : vista === 'cierre'
      ? <Cierre borrador={borrador} pendientes={pendientes} />
      : pagina
        ? (
            <RecursoDeLaPagina
              key={pagina.id}
              pagina={pagina}
              borrador={borrador}
              respuestas={respuestas[pagina.id] ?? {}}
              resultado={resultados[pagina.id]}
              semilla={semillaDe(pagina.id)}
              confirmaciones={confirmaciones}
              roleplay={roleplays[pagina.id] ?? ESTADO_INICIAL}
              enTelefono={enCelular}
              evaluacion={{
                fase: resultados[pagina.id]
                  ? 'resultado'
                  : empezadas.includes(pagina.id)
                    ? 'intento'
                    : Object.keys(respuestas[pagina.id] ?? {}).length
                      ? 'retomar'
                      : 'bienvenida',
                intento: (intentos[pagina.id] ?? 0) + 1,
                porTiempo: porTiempo.includes(pagina.id),
                restante: restante ?? undefined,
                paso: pasoEval,
              }}
              onResponder={(preguntaId, valores) =>
                setRespuestas((x) => ({ ...x, [pagina.id]: { ...(x[pagina.id] ?? {}), [preguntaId]: valores } }))
              }
              onConfirmarSesion={(sesionId) => setConfirmaciones((c) => ({ ...c, [sesionId]: Date.now() }))}
              onRoleplay={(estado) => setRoleplays((x) => ({ ...x, [pagina.id]: estado }))}
              onAccionLlamada={setAccionLlamada}
            />
          )
        : null

  const indiceDelContenido = (
    <IndiceColaborador
      borrador={borrador}
      vista={vista}
      paginaId={paginaId}
      colaborador={{
        visitadas,
        accesible,
        cierreAccesible,
        // RN-10: la fila de una asistencia con una sesión en curso, y sin confirmar, lleva «En vivo».
        enVivo: (id) => {
          const recurso = orden.find((p) => p.id === id)?.recurso
          return recurso?.tipo === 'asistencia' && asistenciaEnVivo(recurso.asistencia, confirmaciones, ahora)
        },
      }}
      progreso={progreso}
      empezado={empezado}
      onPortada={() => setVista('portada')}
      onCierre={() => setVista('cierre')}
      onPagina={irAPagina}
    />
  )

  return (
    <MarcoInmersivo
      // **Inmersiva de verdad**, no un modal, y con el mismo ancho que los demás flujos del Creator (1.140): es lo
      // que mide la zona de estudio del colaborador con la barra lateral y el encabezado puestos, así que el
      // contenido se ve del tamaño que va a tener de verdad (Dave, 7-oct).
      lleno
      ancho="default"
      titulo="Vista del colaborador"
      cerrar={{ etiqueta: 'Salir de la vista del colaborador', onClick: salir }}
      // En la cabecera, como el conmutador «Editar | Vista del colaborador» del editor: en qué aparato se mira.
      acciones={<ConmutadorDispositivo valor={dispositivo} onCambio={setDispositivo} />}
      // La pastilla flota **dentro** del scroll, como en roleplay y en los setups: con `pie` se apoyaba sobre una
      // banda blanca al pie de la pantalla y arrastraba su propio margen de arriba, que se veía como un fondo sucio.
      // Es la barra de navegación **de la vista de escritorio**; en el celular no se pinta, porque el teléfono lleva
      // la suya dentro y dos barras a la vez no se entienden.
      barra={enCelular ? undefined : <BarraColaborador {...barra} />}
    >
      {enCelular ? (
        // El teléfono, solo y centrado: ocupa el alto que haya y se escala para caber entero.
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pt-4 pb-6">
          <VistaDeRecurso modo={{ colaborador: true, compacto: true }}>
            <Telefono
              barra={<BarraMovil {...barra} onIndice={() => setIndiceMovil(true)} />}
              panel={indiceMovil ? <PanelIndice onCerrar={() => setIndiceMovil(false)}>{indiceDelContenido}</PanelIndice> : null}
            >
              {/* En el móvil no hay dos columnas y **el índice no está a la vista**: vive detrás del botón de la
                  barra de abajo. De ahí «Página X de Y», que no se ve en ningún otro sitio.
                  El **título de la página ya no va aquí**: lo dice la cabecera gris del propio recurso. Solo se
                  mantiene para el roleplay, que tiene pantalla propia y no lleva ese marco (Dave, 9-oct). */}
              <div className="flex flex-col gap-4">
                {vista === 'pagina' && pagina ? (
                  <div className="flex flex-col gap-1">
                    <Text as="span" size="xs" variant="muted" className="tabular-nums">
                      Página {indice + 1} de {orden.length}
                    </Text>
                    {pagina.recurso?.tipo === 'roleplay' ? (
                      <Heading as="h2" level={5}>
                        {pagina.titulo.trim() || 'Página sin título'}
                      </Heading>
                    ) : null}
                  </div>
                ) : null}
                {/* La ficha va **antes** de la portada: en una sola columna, si va después, el título del
                    contenido acaba debajo de su propia descripción. */}
                {vista === 'portada' ? <FichaPortada borrador={borrador} /> : null}
                {consumo}
              </div>
            </Telefono>
          </VistaDeRecurso>
        </div>
      ) : (
        /* **El scroll es el de la página, no el de una columna**, como la experiencia de estudio de producción. */
        /* **Sin `overflow` aquí**: el que scrollea es el `main` del marco. Esta caja llegó a tenerlo y, aunque
            nunca scrolleaba —crecía con su contenido—, al ser contenedor de scroll capturaba el `sticky` de la
            columna del índice, que entonces se iba con el contenido en vez de quedarse (Dave, 6-oct). El margen
            negativo con su relleno sigue, para que el recorte no se coma el borde ni la sombra de las tarjetas. */
        <div className="-mx-2 px-2 pt-1 pb-2">
          {/* Quien estudia no ve de qué se fabricó el material: `colaborador` quita la marca «Generado con IA». */}
          <VistaDeRecurso modo={{ colaborador: true }}>
            {/* El reparto de legacy-2: lo que se consume a la izquierda y, a la derecha, su ficha y el índice.
                Las dos columnas aguantan desde 861 px y el índice mide lo suyo (340). */}
            <div className="grid gap-6 min-[861px]:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <div className="flex min-w-0 flex-col gap-4">{consumo}</div>

              {/* El índice se queda a la vista mientras se baja: se pega arriba y se recorta al alto de la ventana.
                  La celda va al alto de la fila y lo que se pega es el bloque de dentro: si la celda midiera lo que
                  su contenido, `sticky` no tendría recorrido. */}
              <div className="min-w-0">
                <div className="flex flex-col gap-4 min-[861px]:sticky min-[861px]:top-0 min-[861px]:max-h-[calc(100svh-11rem)]">
                  {/* `shrink-0`: en una columna con alto tope, una Card se encoge por debajo de su contenido —lleva
                      `overflow:hidden`, y eso le pone el mínimo automático en cero— y se veía partida. Lo que cede
                      es el índice, que para eso tiene su propio scroll. */}
                  {vista === 'portada' ? <FichaPortada borrador={borrador} className="shrink-0" /> : null}
                  {vista === 'pagina' && pagina ? (
                    /* En escritorio arriba va **solo el título del contenido**, como texto suelto: sin tarjeta y sin
                       «Página X de Y». El nombre de la página ya está en el índice, justo debajo, y el recuento
                       también sale ahí; encerrarlo en un cajón lo hacía competir con el contenido. En el móvil es al
                       revés y ahí sí va el de la página, con su recuento (Dave, 6-oct). */
                    <Heading as="h1" level={4} className="shrink-0 px-1">
                      {borrador.portada.titulo.trim() || 'Contenido sin título'}
                    </Heading>
                  ) : null}
                  <div className="flex min-h-0 flex-1 flex-col">{indiceDelContenido}</div>
                </div>
              </div>
            </div>
          </VistaDeRecurso>
        </div>
      )}
    </MarcoInmersivo>
  )
}

/** La portada: la imagen 16:9 y, debajo, categoría y descripción. */
function Portada({ borrador }: { borrador: Borrador }) {
  const p = borrador.portada

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="aspect-video w-full">
          {p.imagen ? (
            <img src={p.imagen} alt="Portada del contenido" className="size-full object-cover" />
          ) : (
            // Sin portada queda el espacio con su icono: así se ve qué le falta.
            <Empty className="size-full bg-muted">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Image01Icon} />
                </EmptyMedia>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>

      {nombreCategoria(p.categoria) ? (
        <Frame>
          <FrameHeader>
            <FrameTitle>Categoría</FrameTitle>
          </FrameHeader>
          <FramePanel className="flex flex-wrap items-center gap-2">
            {/* Verde, como la competencia en la app de UBITS: la categoría del Creator es su equivalente para las
                empresas clientes. */}
            <Badge variant="success-light">{nombreCategoria(p.categoria)}</Badge>
          </FramePanel>
        </Frame>
      ) : null}

      <Frame>
        <FrameHeader>
          <FrameTitle>Descripción</FrameTitle>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-3">
          {textoPlano(p.descripcion) ? (
            <Text as="div" size="sm" className="[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: p.descripcion }} />
          ) : (
            <Text as="p" size="sm" variant="muted">
              Este contenido aún no tiene descripción.
            </Text>
          )}
        </FramePanel>
      </Frame>
    </div>
  )
}

/** A la derecha de la portada: el tipo, el título y la fila de datos. */
function FichaPortada({ borrador, className }: { borrador: Borrador; className?: string }) {
  const p = borrador.portada
  const datos = [
    { icono: SignalMedium01Icon, valor: nombreNivel(p.nivel) },
    { icono: Clock01Icon, valor: textoDuracion(p) },
    { icono: Globe02Icon, valor: nombreIdioma(p.idioma) },
    borrador.certificado.habilitado ? { icono: Certificate01Icon, valor: 'Con certificado' } : null,
  ].filter((d): d is { icono: typeof Clock01Icon; valor: string } => Boolean(d?.valor))

  return (
    <Frame className={className}>
      <FramePanel className="flex flex-col gap-3">
        {nombreTipo(p.tipo) ? (
          // El tipo de contenido va en **azul** y la categoría en **verde**, como en la app de UBITS, que es de
          // donde salió todo este rediseño. Se usan las variantes suaves del design system, no los colores de la
          // app a ojo (Dave, 7-oct).
          <Badge variant="primary-light" className="self-start">
            {nombreTipo(p.tipo)}
          </Badge>
        ) : null}
        <Heading as="h1" level={4}>
          {p.titulo.trim() || 'Contenido sin título'}
        </Heading>
        {datos.length ? (
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {datos.map((d) => (
                <span key={d.valor} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <HugeiconsIcon icon={d.icono} size={16} aria-hidden="true" />
                  {d.valor}
                </span>
              ))}
            </div>
          </>
        ) : null}
      </FramePanel>
    </Frame>
  )
}

/** El recurso de la página, con los botones de consumo que corresponden a su tipo. */
function RecursoDeLaPagina({
  pagina,
  borrador,
  respuestas,
  resultado,
  semilla,
  confirmaciones,
  roleplay,
  onResponder,
  onConfirmarSesion,
  onRoleplay,
  onAccionLlamada,
  enTelefono,
  evaluacion,
}: {
  pagina: Pagina
  borrador: Borrador
  respuestas: Respuestas
  resultado?: ResultadoEvaluacion
  /** La semilla del barajado de esta página: la misma con la que se califica (ver `prepararIntento`). */
  semilla: number
  confirmaciones: Confirmaciones
  roleplay: EstadoRoleplay
  onResponder: (preguntaId: string, valores: string[]) => void
  onConfirmarSesion: (sesionId: string) => void
  onRoleplay: (estado: EstadoRoleplay) => void
  onAccionLlamada: (accion: AccionLlamada | null) => void
  enTelefono?: boolean
  /** En qué momento de la evaluación está: antes, durante o después. Las encuestas no lo usan. */
  evaluacion: { fase: FaseEvaluacion; intento: number; porTiempo: boolean; restante?: number; paso: number }
}) {
  const r = pagina.recurso
  if (!r) {
    return (
      <Frame className="aspect-video justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Image01Icon} />
            </EmptyMedia>
          </EmptyHeader>
        </Empty>
      </Frame>
    )
  }

  if (r.tipo === 'evaluacion-final' || r.tipo === 'encuesta-libre' || r.tipo === 'encuesta-satisfaccion') {
    return (
      <EvaluacionColaborador
        titulo={pagina.titulo}
        preguntas={prepararIntento(r.preguntas ?? [], r.config ?? borrador.configEvaluacion, semilla, r.secciones)}
        secciones={r.secciones}
        paso={evaluacion.paso}
        config={r.config ?? borrador.configEvaluacion}
        respuestas={respuestas}
        resultado={resultado}
        onResponder={onResponder}
        encuesta={r.tipo !== 'evaluacion-final'}
        fase={r.tipo === 'evaluacion-final' ? evaluacion.fase : 'intento'}
        intento={evaluacion.intento}
        porTiempo={evaluacion.porTiempo}
        sinIntentos={(() => {
          const cfg = r.config ?? borrador.configEvaluacion
          return cfg.limitarIntentos && evaluacion.intento > cfg.intentos
        })()}
        restante={evaluacion.restante}
      />
    )
  }

  // El título del marco es el de la página, como en la evaluación: dice qué se está viendo sin repetir el tipo de
  // recurso, que ya se sabe por lo que hay dentro (Dave, 9-oct).
  const titulo = pagina.titulo.trim() || undefined

  if (r.generando) return <Lienzo titulo={titulo}>{r.tipo === 'video' ? <CargandoVideo /> : <CargandoPresentacion />}</Lienzo>

  switch (r.tipo) {
    case 'video':
      return (
        <Lienzo titulo={titulo}>
          <VistaVideo recurso={r} />
        </Lienzo>
      )
    case 'pdf':
      // Sin pie de acciones: descargar y ver en pantalla completa ya están en la barra del propio visor, y repetirlos
      // debajo era ofrecer dos veces lo mismo (Dave, 6-oct).
      return (
        <Lienzo titulo={titulo} alto={false}>
          <VistaPdf recurso={r} />
        </Lienzo>
      )
    case 'scorm':
      return (
        <Lienzo titulo={titulo}>
          <VistaScorm recurso={r} />
        </Lienzo>
      )
    case 'presentacion-interactiva':
      return <Lienzo titulo={titulo}>{r.presentacion ? <VistaPresentacion datos={r.presentacion} /> : <VistaScorm recurso={r} />}</Lienzo>
    case 'embebido':
      return (
        <Lienzo titulo={titulo}>
          <VistaEmbebido recurso={r} />
        </Lienzo>
      )
    case 'texto':
      return (
        <Lienzo titulo={titulo} alto={false} relleno>
          <VistaTexto recurso={r} />
        </Lienzo>
      )
    case 'asistencia':
      // Aquí no va la ficha del creador («Quién marca la asistencia»): quien estudia tiene su propia pieza, con una
      // tarjeta por sesión y su estado (HU-APR-009).
      return r.asistencia ? (
        <AsistenciaColaborador datos={r.asistencia} contenido={borrador.portada.titulo} confirmaciones={confirmaciones} onConfirmar={onConfirmarSesion} />
      ) : null
    case 'roleplay':
      // Aquí no va la ficha del creador: el colaborador tiene su propia pantalla, con la prueba de micrófono, la
      // llamada y el resultado por objetivo. Y nunca ve con cuántos objetivos aprueba.
      return r.roleplay ? <EstudioRoleplay titulo={titulo} onAccion={onAccionLlamada} config={r.roleplay} estado={roleplay} onEstado={onRoleplay} enTelefono={enTelefono} /> : null
    default:
      return null
  }
}

/**
 * La superficie del recurso: el marco gris con **el título de la página** arriba y el recurso a sangre en el panel
 * blanco, igual que la evaluación. A la derecha del título, la ranura donde el recurso deja su botón de pantalla
 * completa: un documento, una presentación, un SCORM y un contenido externo se consumen sin el panel alrededor, y
 * antes cada uno ofrecía ese botón en un sitio distinto —o no lo ofrecía (Dave, 9-oct).
 *
 * **Se come el alto que le toca** y el reproductor se ajusta dentro, como en la experiencia de estudio de
 * producción: si la tarjeta solo midiera lo del vídeo, el pie de la columna quedaba vacío (Dave, 5-oct).
 */
function Lienzo({
  titulo,
  children,
  alto = true,
  relleno = false,
}: {
  /** El título de la página, en el gris. Sin él, el marco va sin cabecera. */
  titulo?: string
  children: React.ReactNode
  alto?: boolean
  relleno?: boolean
}) {
  // El nodo se guarda en estado, no en un `ref`: el recurso pinta en él con un portal y hace falta un render más
  // cuando aparece, que un `ref` no dispara.
  const [ranura, setRanura] = useState<HTMLDivElement | null>(null)
  // La cabecera va **también en el teléfono**: ahí el botón de pantalla completa flotaba sobre el recurso y le tapaba
  // la esquina, que es justo lo que se quería quitar. El que se va es el título suelto que iba encima del recurso, que
  // ahora sí estaría dos veces (Dave, 9-oct).
  const cabecera = titulo ? (
    // El título **no se recorta**: es el nombre de la página y recortarlo a una línea se come información que hace
    // falta para saber dónde se está. Si no cabe, baja de renglón (Dave, 9-oct).
    <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
      <FrameTitle className="min-w-0 flex-1">{titulo}</FrameTitle>
      <div ref={setRanura} className="flex shrink-0 items-center gap-1" />
    </FrameHeader>
  ) : null
  return (
    <RanuraDeRecurso ranura={ranura}>
      <LienzoMarco cabecera={cabecera} alto={alto} relleno={relleno}>
        {children}
      </LienzoMarco>
    </RanuraDeRecurso>
  )
}

function LienzoMarco({
  cabecera,
  children,
  alto = true,
  relleno = false,
}: {
  cabecera: React.ReactNode
  children: React.ReactNode
  alto?: boolean
  relleno?: boolean
}) {
  // **Sin sangrado**: el recurso va de borde a borde del panel blanco y así es lo que manda en la pantalla. Solo el
  // texto conserva el relleno, porque un bloque de lectura pegado al borde queda volando (Dave, 6-oct).
  // El marco **sí conserva su relleno**: esos 3 px son el reborde gris, y son los mismos a los cuatro lados. Cuando
  // esto era una `Card` había que anular su relleno vertical —25 px de blanco encima y debajo del video—, pero al
  // arrastrar ese `py-0!` al marco el gris desaparecía arriba y abajo y el recurso se veía cortado (Dave, 9-oct).
  if (!alto) {
    return (
      <Frame className={relleno ? undefined : 'overflow-hidden'}>
        {cabecera}
        <FramePanel className={relleno ? undefined : 'p-0!'}>{children}</FramePanel>
      </Frame>
    )
  }
  return (
    <Frame className="flex flex-col overflow-hidden">
      {cabecera}
      {/* Sin alto mínimo: el recurso trae su propia proporción y, a sangre, llena la tarjeta. El mínimo estaba para
          que el reproductor no quedara chiquito cuando la tarjeta llevaba relleno, pero ahora solo deja una banda
          blanca encima y debajo del video (Dave, 6-oct). */}
      <FramePanel
        className={cn(
          'flex flex-col justify-center [&_iframe]:h-full [&_video]:h-full [&_video]:object-contain',
          relleno ? undefined : 'p-0!',
        )}
      >
        {children}
      </FramePanel>
    </Frame>
  )
}


/** El cierre: «¡Felicidades!» y el certificado, o lo que todavía falta. */
// Los avisos de esta pantalla hablan de **lo que hará el botón**, no le hablan al colaborador: quien los lee es quien
// está revisando la vista previa, y aquí nada de esto ocurre de verdad (Dave, 8-oct).

/**
 * **Fin del contenido.** El cierre que ve quien terminó, con la misma estructura que la experiencia de estudio de
 * producción: la felicitación en grande con su icono, el certificado como algo que se puede llevar —no como una frase
 * suelta— y, debajo, qué estudiar ahora. Y confeti, que es el momento de celebrarlo (Dave, 7-oct).
 *
 * Con páginas sin terminar no hay felicitación ni confeti: ahí el cierre dice qué falta.
 */
function Cierre({ borrador, pendientes }: { borrador: Borrador; pendientes: number }) {
  const titulo = borrador.portada.titulo.trim() || 'este contenido'
  const listo = !pendientes
  const conCertificado = borrador.certificado.habilitado && listo

  return (
    <div className="flex flex-col gap-4">
      {/* Una sola vez, al llegar: la celebración es del momento, no de la pantalla. Es la lluvia de las piezas
          compartidas, sobre toda la pantalla: se comparó con la de Encuestas y Dave se quedó con esta (14-oct). */}
      {listo ? <LluviaConfeti /> : null}
      <Frame className="relative overflow-hidden">
        {/* El verde de la casa cayendo desde la esquina, como en la experiencia de estudio de producción: tiñe la
            parte de arriba y se va antes de llegar al certificado. Sale del token `--success`, no de un verde
            inventado, así que el modo oscuro y un cambio de marca entran solos (Dave, 7-oct). */}
        {listo ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: 'linear-gradient(216deg, color-mix(in oklch, var(--success) 20%, transparent) 0%, transparent 34%)' }}
          />
        ) : null}
        <FramePanel className="relative flex flex-col items-center gap-6 py-8 text-center">
          <div className="flex flex-col items-center gap-4">
            {listo ? (
              <ImagenGlass nombre="glass-tick" tamano={96} />
            ) : (
              <HugeiconsIcon icon={Clock01Icon} size={48} className="text-muted-foreground" aria-hidden="true" />
            )}
            <div className="flex flex-col gap-1.5">
              <Heading as="h1" level={2}>
                {listo ? '¡Felicidades!' : 'Todavía te falta algo'}
              </Heading>
              {listo ? (
                <>
                  <Text as="p" variant="muted">
                    Has culminado con éxito el contenido
                  </Text>
                  <Text as="p" size="lg" weight="medium" className="text-balance">
                    {titulo}
                  </Text>
                </>
              ) : (
                <Text as="p" variant="muted">
                  Te {pendientes === 1 ? 'queda 1 página' : `quedan ${pendientes} páginas`} por completar de «{titulo}».
                </Text>
              )}
            </div>
          </div>

          {/* El certificado, como algo que ya está listo: su archivo, lo que pesa y el botón que lo baja. La descarga
              vive **aquí** y no en la barra de navegación, que es donde se avanza por el contenido: lo que se baja es
              esta tarjeta, no la página (Dave, 7-oct). */}
          {conCertificado ? (
            <div className="bg-muted/50 flex w-full max-w-md items-center gap-3 rounded-xl border p-3 text-left">
              <span className="bg-card flex size-12 shrink-0 items-center justify-center rounded-lg border" aria-hidden="true">
                <HugeiconsIcon icon={Certificate01Icon} size={22} className="text-primary" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <Text as="span" weight="medium">
                  Certificado disponible
                </Text>
                {/* Debajo va **lo que pesa el archivo**, no el nombre del contenido: ese está dos líneas más arriba,
                    en grande, y repetirlo no decía nada nuevo. */}
                <Text as="span" size="sm" variant="muted" className="tabular-nums">
                  {PESO_CERTIFICADO}
                </Text>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => notify('Este botón descarga el certificado del colaborador.', undefined, 'info')}>
                <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden="true" />
                Descargar
              </Button>
            </div>
          ) : borrador.certificado.habilitado ? (
            <Text as="p" size="sm" variant="muted">
              Al completarlo recibirás tu certificado.
            </Text>
          ) : (
            <Text as="p" size="sm" variant="muted">
              Este contenido no entrega certificado.
            </Text>
          )}

        </FramePanel>
      </Frame>

      {/* Qué estudiar ahora. Terminar un contenido es el mejor momento para empezar otro, y así la página deja de ser
          un punto final. */}
      {/* La misma caja de las competencias en la zona de estudio: su marco, el rótulo arriba y las flechas en la
          cabecera. Así los contenidos sugeridos se ven aquí como se ven en el resto del portal. */}
      {listo ? (
        <CajaCarrusel
          etiqueta="Sigue aprendiendo"
          cabecera={
            <Heading as="h2" level={5}>
              Sigue aprendiendo
            </Heading>
          }
          items={SUGERIDOS.map((c) => ({
            clave: c.id,
            nodo: (
              <TarjetaContenido
                titulo={c.titulo}
                imagen={c.imagen}
                tipo={c.tipo}
                competencia={nombreCategoria(c.categoriaId)}
                nivel={nombreNivel(c.nivelId)}
                duracion={`${c.minutos} min`}
                idioma={c.idioma}
              />
            ),
          }))}
        />
      ) : null}
    </div>
  )
}

/** Del catálogo de la empresa, para cerrar con algo que se pueda empezar. */
const SUGERIDOS = CONTENIDOS.filter((c) => c.visibilidad === 'Publicado').slice(0, 8)

/** Lo que pesa el PDF del certificado. Fijo: en el prototipo no se genera ningún archivo. */
const PESO_CERTIFICADO = 'PDF · 248 KB'

Component.displayName = 'LmsVistaColaboradorPage'

type Dispositivo = 'computador' | 'celular'

/**
 * En qué aparato se mira el contenido. Va en la cabecera, con la misma forma que el conmutador
 * «Editar | Vista del colaborador» del editor, porque hace lo mismo: cambia toda la pantalla de debajo.
 *
 * Antes las dos vistas salían juntas, el teléfono pegado al lado de la de escritorio. Se veían las dos de un vistazo,
 * sí, pero el escritorio se quedaba con el ancho que sobraba y acababa enseñando algo más estrecho de lo que el
 * colaborador va a ver (Dave, 7-oct).
 */
function ConmutadorDispositivo({ valor, onCambio }: { valor: Dispositivo; onCambio: (v: Dispositivo) => void }) {
  return (
    // `spacing={0}`: un solo bloque con los dos pegados, como el cambio de vista tabla/cuadrícula de los listados.
    // Separados se leían como dos botones sueltos y no como un interruptor de dos posiciones.
    <ToggleGroup
      data-region="Cambio de aparato"
      aria-label="Mirar en"
      value={[valor]}
      onValueChange={(v) => v.length && onCambio(v[0] as Dispositivo)}
      variant="outline"
      size="sm"
      spacing={0}
    >
      <ToggleGroupItem value="computador" aria-label="Mirar en computador" className="gap-1.5 px-2.5">
        <HugeiconsIcon icon={ComputerIcon} size={15} aria-hidden="true" />
        Computador
      </ToggleGroupItem>
      <ToggleGroupItem value="celular" aria-label="Mirar en celular" className="gap-1.5 px-2.5">
        <HugeiconsIcon icon={SmartPhone01Icon} size={15} aria-hidden="true" />
        Celular
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/** Un móvil corriente: 375 × 812, el de un iPhone normal. */
const MOVIL = { ancho: 375, alto: 812 }

/**
 * La ventanita que simula un teléfono.
 *
 * Se dibuja **siempre a 375 × 812** y se **escala entero** para caber en el alto que haya, como hacen las vistas de
 * dispositivo de cualquier herramienta de diseño. Es lo único que mantiene las dos cosas a la vez: por dentro mide
 * 375, que es lo que tiene que enseñar, y por fuera conserva la silueta de un teléfono.
 *
 * Antes se estiraba al alto disponible y quedaba de 375 × 677 —proporción 0,55 contra el 0,46 de un móvil de
 * verdad—: se veía achatado y engañaba sobre cuánto cabe en pantalla (Dave, 6-oct).
 */
function Telefono({ children, barra, panel }: { children: ReactNode; barra?: ReactNode; panel?: ReactNode }) {
  const hueco = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)

  useEffect(() => {
    const nodo = hueco.current
    if (!nodo) return
    const medir = () => {
      const alto = nodo.clientHeight
      setEscala(alto ? Math.min(1, alto / MOVIL.alto) : 1)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  return (
    // El hueco solo reserva el ancho que ocupa **ya escalado**: si reservara los 375 enteros dejaría un claro a los
    // lados en cuanto el teléfono se achica.
    <div ref={hueco} className="flex min-h-0 flex-1 justify-center" style={{ width: Math.round(MOVIL.ancho * escala) }}>
      <div
        className="relative flex shrink-0 origin-top flex-col overflow-hidden rounded-[2.25rem] border-[10px] border-foreground/80 bg-background shadow-lg"
        style={{ width: MOVIL.ancho, height: MOVIL.alto, transform: `scale(${escala})` }}
      >
        {/* La muesca y la barra del sistema: no son funcionales, son lo que hace que se lea como un teléfono de un
            vistazo. **La barra importa**: sin ella la maqueta se leía como si la pantalla fuera entera del contenido,
            y en un teléfono de verdad la hora, la cobertura y la batería siempre están ahí quitando alto (Dave,
            9-oct). La hora es fija, como en las maquetas de las tiendas de aplicaciones: una que corriera llamaría la
            atención sobre lo que no es. */}
        <div className="relative flex h-10 shrink-0 items-center justify-between px-6 text-foreground" aria-hidden="true">
          <span className="text-[13px] font-semibold tabular-nums">9:41</span>
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <div className="h-6 w-32 rounded-b-xl bg-foreground/80" />
          </div>
          <div className="flex items-center gap-1">
            <HugeiconsIcon icon={SignalFull02Icon} size={14} />
            <HugeiconsIcon icon={Wifi01Icon} size={14} />
            <HugeiconsIcon icon={BatteryFullIcon} size={16} />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:thin]">{children}</div>
        {barra ? <div className="shrink-0">{barra}</div> : null}
        {/* El panel sube **dentro** del teléfono. Un Drawer de la librería se monta en el `body` y saldría por encima
            de toda la pantalla, que es justo lo que rompería la ilusión del aparato (Dave, 6-oct). */}
        {panel}
      </div>
    </div>
  )
}

/**
 * La barra de navegación del móvil: el índice detrás de un botón de solo icono y la acción principal, nada más.
 * En el móvil el índice no cabe a la vista, así que vive aquí y sube en un panel desde abajo.
 *
 * **Sin botón de retroceder**: en el móvil para atrás está el gesto del sistema y el índice, que lleva a cualquier
 * página con un toque. Un tercer botón en una barra de 375 px le quita sitio a lo que de verdad hace avanzar
 * (Dave, 6-oct).
 *
 * **Sin barra de avance**: el porcentaje ya está dentro del índice, que es donde se va a mirar cuánto falta, y en
 * una barra de 375 px se comía el ancho del único botón que hace avanzar. Con ese sitio libre, el principal pasa a
 * `lg` y ocupa lo que queda (Dave, 9-oct).
 */
function BarraMovil({
  principal,
  onIndice,
}: {
  principal: { texto: string; onClick: () => void; deshabilitado?: boolean }
  onIndice: () => void
}) {
  return (
    <div className="flex items-center gap-2 border-t bg-background px-3 py-2">
      {/* El índice sube a `icon-lg` para medir lo mismo que el principal: con dos controles solos en la barra, uno
          más bajo que el otro se nota. */}
      <BotonIcono size="icon-lg" aria-label="Ver el contenido" onClick={onIndice}>
        <HugeiconsIcon icon={Menu01Icon} size={20} />
      </BotonIcono>
      <Button size="lg" disabled={principal.deshabilitado} onClick={principal.onClick} className="min-w-0 flex-1">
        {principal.texto}
        {principal.texto === 'Continuar' ? <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /> : null}
      </Button>
    </div>
  )
}

/** El índice del móvil: sube desde abajo, dentro del teléfono, sobre un velo que lo cierra al tocarlo. */
function PanelIndice({ children, onCerrar }: { children: ReactNode; onCerrar: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      <button type="button" aria-label="Cerrar el contenido" className="absolute inset-0 bg-foreground/40" onClick={onCerrar} />
      <div className="relative flex max-h-[72%] flex-col rounded-t-2xl border-t bg-background shadow-lg">
        {/* Sin título propio: el índice ya trae el suyo («Contenido», con el conteo y la navegación), y repetirlo
            dejaba la palabra dos veces seguidas. Queda el asa, que es lo que dice que esto se arrastra, y la X. */}
        <div className="relative flex shrink-0 items-center justify-center px-3 pt-2 pb-1">
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-border" />
          <BotonIcono aria-label="Cerrar el contenido" onClick={onCerrar} className="absolute right-2">
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </BotonIcono>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">{children}</div>
      </div>
    </div>
  )
}
