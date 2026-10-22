import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon, Tick02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  TooltipProvider,
  cn,
} from '@ubits/flux-ui'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'
import { ChipGuardado, useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import {
  BASE_LMS,
  RUTA_CONTENIDOS,
  borradorVacio,
  buscarPagina,
  claseDe,
  faltanPreguntas,
  faltantesPortada,
  getBorrador,
  hashPagina,
  minutosDeRuta,
  pesosSincronizados,
  reemplazarBorrador,
  setBorrador,
  sumaPesos,
  todasLasPaginas,
  useBorrador,
  validarRecursos,
  type Borrador,
  type ClaseCreacion,
  type Portada,
} from './borrador'
import { ANCLA_AJUSTES } from './ajustes'
import { VentanaSalir } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { DOS_COLUMNAS_RESUMEN } from './columna'
import { borradorDemo, estaVacio, rutaDemo } from './demo'
import { sinTocar } from './borrador'
import { Generaciones, useTrabajos } from './panel-generacion'
import { PasoAjustes } from './paso-ajustes'
import { PasoCertificado } from './paso-certificado'
import { PasoContenidos } from './paso-contenidos'
import { PasoInformacion } from './paso-informacion'
import { PasoRecursos } from './paso-recursos'
import { publicarContenido } from './publicar'
import { useRecursos } from './recursos'
import { ResumenContenido } from './resumen-contenido'
import { BarraPasos } from '@/modules/design-system/navegacion/barra-pasos'

// LMS Creator › Crear contenido, Crear evento y Crear ruta: **un solo asistente**, tres clases (`ClaseCreacion`). La
// experiencia definitiva,
// inspirada en la P2 y en «Crear vacante» de Cristian. Va dentro del marco normal de la plataforma (con la barra
// lateral) y es un asistente de cuatro pasos —Información general, Recursos, Certificado y Ajustes— con el resumen
// «Vista previa» a la derecha. Al terminar, el contenido queda creado en borrador y la pantalla final ofrece
// publicarlo.
//
// Cada paso tiene su dirección (#portada, #recursos, #recursos/page/p1, #certificado, #ajustes-pesos…) para enlazarlo
// desde una HU y para que los flujos de recurso (video con IA, presentación, roleplay) vuelvan a la página correcta. Si
// se llega por una de ellas con el borrador vacío, se carga el curso de ejemplo para que la pantalla tenga algo que
// mostrar.

/**
 * Los cuatro pasos. Solo el segundo cambia con la clase: una ruta no arma páginas sino que elige contenidos del
 * catálogo, y por eso tampoco hay pesos de evaluación en el 4 —no hay evaluaciones propias que pesar— (HU-LMS-013).
 */
const pasosDe = (clase: ClaseCreacion) =>
  [
    {
      nombre: 'Información general',
      descripcion:
        clase === 'ruta'
          ? 'Los datos con los que el colaborador ve y encuentra la ruta.'
          : 'Los datos con los que el colaborador ve y encuentra el contenido.',
    },
    {
      nombre: clase === 'ruta' ? 'Contenidos' : 'Recursos',
      descripcion:
        clase === 'ruta'
          ? 'Los contenidos del catálogo que forman el recorrido, en orden.'
          : 'Las páginas que tus colaboradores van a recorrer.',
    },
    { nombre: 'Certificado', descripcion: 'Lo que reciben tus colaboradores al terminar.' },
    {
      nombre: 'Ajustes',
      descripcion: clase === 'ruta' ? 'Quién la verá y cómo se recorre.' : 'Quién lo verá, cuánto cuenta cada evaluación y cómo se recorre.',
    },
  ] as const

type Paso = 1 | 2 | 3 | 4
type AnclaAjustes = keyof typeof ANCLA_AJUSTES
type Destino = {
  paso: Paso
  pagina?: string
  variante: 'normal' | 'eval-80'
  pesosVacio: boolean
  ancla?: AnclaAjustes
  seleccion?: boolean
  /** Solo en una ruta: `#contenidos/agregar` abre el panel para elegir contenidos, para poder enlazarlo. */
  panel?: boolean
}

const ALIAS: Record<string, string> = {
  '': 'portada',
  'crear-contenido': 'portada',
  'crear-contenido-recursos': 'recursos',
  'crear-contenido-step-recursos': 'recursos',
  contenidos: 'recursos',
  'contenidos/agregar': 'recursos/agregar',
  cierre: 'certificado',
  'fin-del-contenido': 'certificado',
  configuracion: 'ajustes',
  visibilidad: 'ajustes-visibilidad',
  publicacion: 'ajustes-visibilidad',
  'configuracion-visibilidad': 'ajustes-visibilidad',
  'configuracion-pesos': 'ajustes-pesos',
  'configuracion-navegacion': 'ajustes-navegacion',
}

/** Qué paso pide una dirección: `#portada` el 1; `#recursos…` el 2; `#certificado` el 3; `#ajustes…` el 4. */
function leerHash(hash: string): Destino {
  const crudo = decodeURIComponent(hash.replace(/^#/, ''))
  const h = ALIAS[crudo] ?? crudo
  const base: Destino = { paso: 1, variante: 'normal', pesosVacio: false }
  // El panel de «Agregar contenidos» tiene su propia dirección, para poder compartir esa pantalla.
  if (h === 'recursos/agregar') return { ...base, paso: 2, panel: true }
  if (h.startsWith('recursos')) {
    if (['recursos/eval-80', 'recursos/borde-80', 'recursos/page/p-eval-80'].includes(h)) return { ...base, paso: 2, variante: 'eval-80', pagina: 'p-eval-80' }
    return { ...base, paso: 2, pagina: h.match(/^recursos\/page\/(.+)$/)?.[1] }
  }
  if (h === 'certificado') return { ...base, paso: 3 }
  if (h === 'ajustes') return { ...base, paso: 4 }
  if (h === 'ajustes-visibilidad') return { ...base, paso: 4, ancla: 'visibilidad' }
  // Directo al caso de uso «contenido privado»: paso 4, la visibilidad en privado y la selección de colaboradores abierta.
  if (h === 'ajustes-colaboradores') return { ...base, paso: 4, ancla: 'visibilidad', seleccion: true }
  if (h === 'ajustes-pesos') return { ...base, paso: 4, ancla: 'pesos' }
  if (h === 'ajustes-pesos-empty') return { ...base, paso: 4, ancla: 'pesos', pesosVacio: true }
  if (h === 'ajustes-navegacion') return { ...base, paso: 4, ancla: 'navegacion' }
  return base
}

/**
 * El paso 2 pide la información básica completa; el 3 y el 4, además, que el paso 2 esté resuelto: en un contenido,
 * recursos sin errores y con preguntas en cada evaluación; en una ruta, al menos un contenido (RN-02).
 */
function paso2Listo(b: Borrador) {
  if (b.ruta) return b.contenidos.length > 0
  const paginas = todasLasPaginas(b)
  return paginas.length > 0 && !validarRecursos(b) && !paginas.some(faltanPreguntas)
}

/** ¿Cambió algo que el creador hizo? El avance de una generación en segundo plano no cuenta como cambio. */
function cambioReal(antes: Borrador, ahora: Borrador) {
  return (Object.keys(ahora) as (keyof Borrador)[]).some((k) => k !== 'trabajos' && antes[k] !== ahora[k])
}

export function AsistenteContenido({ clase = 'contenido' }: { clase?: ClaseCreacion }) {
  const evento = clase === 'evento'
  const ruta = clase === 'ruta'
  const navigate = useNavigate()
  const borrador = useBorrador()
  const [listo, setListo] = useState(false)
  const [paso, setPaso] = useState<Paso>(1)
  // El paso más lejano al que se llegó: marca como hechos los de adelante al volver atrás.
  const [visitado, setVisitado] = useState<Paso>(1)
  if (paso > visitado) setVisitado(paso)
  // Hacia dónde se mueve el asistente: el paso nuevo entra por el lado al que vas.
  const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante')
  const [hoja, setHoja] = useState<string | null>(null)
  const [pesosVacio, setPesosVacio] = useState(false)
  const [ancla, setAncla] = useState<AnclaAjustes | undefined>()
  // `#ajustes-colaboradores`: deja el contenido en privado y abre la selección de colaboradores.
  const [seleccionDemo, setSeleccionDemo] = useState(false)
  // El panel de elegir contenidos de una ruta: vive aquí porque su dirección lo abre y él la escribe.
  const [panelContenidos, setPanelContenidos] = useState(false)
  // Al crear, el borrador se entrega a Contenidos y el asistente queda en blanco: la pantalla final lee esta copia.
  const [guardado, guardar] = useGuardadoSimulado()
  // El borrador existe desde el primer paso: en cuanto se escribe algo ya se está guardando, y por eso el chip aparece
  // en el paso 1 y no en el 2 (Carlos, 1-oct). Lo único que sigue sin existir es el contenido que no se tocó: ahí no
  // hay nada que guardar, no sale el chip y salir no pregunta nada.
  const esBorrador = !sinTocar(borrador, clase)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const terminado = useRef(false)
  // Salida deliberada (ya confirmada o recién creada): el guardia de abajo no vuelve a preguntar por ella.
  const saliendo = useRef(false)
  const inicio = useRef<HTMLDivElement>(null)
  useTrabajos()

  const PASOS = useMemo(() => pasosDe(clase), [clase])
  const cosa = ruta ? 'ruta' : evento ? 'evento' : 'contenido'
  const Cosa = ruta ? 'Ruta' : evento ? 'Evento' : 'Contenido'
  // «La ruta queda guardada», «el contenido queda guardado»: el artículo y el participio van con la palabra.
  const laEl = ruta ? 'La' : 'El'
  const guardadoA = ruta ? 'guardada' : 'guardado'

  // ── Llegada: qué borrador se muestra y en qué paso ──
  const aplicarHash = useCallback(
    (hash: string, sembrar: boolean) => {
      const destino = leerHash(hash)
      let b = getBorrador()
      // Un borrador de evento no sirve para «Crear contenido» (ni al revés): se empieza de nuevo.
      // Un borrador de otra clase no sirve aquí (un evento en «Crear contenido», una ruta en «Crear evento»…).
      if (claseDe(b) !== clase) {
        b = borradorVacio(clase)
        reemplazarBorrador(b)
      }
      if (sembrar && destino.paso !== 1 && (estaVacio(b) || destino.variante === 'eval-80') && !b.intencion && !b.reabrirAnadir) {
        b = ruta ? rutaDemo() : borradorDemo(evento, destino.variante, destino.pagina)
        reemplazarBorrador(b)
      }
      // Un paso bloqueado no se abre aunque se pida por su dirección: se queda en el último disponible.
      const infoLista = faltantesPortada(b.portada, clase).size === 0
      let destinoPaso = destino.paso
      if (destinoPaso >= 2 && !infoLista) destinoPaso = 1
      if (destinoPaso >= 3 && !paso2Listo(b)) destinoPaso = 2
      setPaso(destinoPaso)
      setHoja(destinoPaso === 2 && destino.pagina && buscarPagina(b, destino.pagina) ? destino.pagina : null)
      if (destinoPaso === 2 && destino.pagina && buscarPagina(b, destino.pagina)) setBorrador({ paginaActiva: destino.pagina })
      setPesosVacio(destino.pesosVacio)
      setAncla(destinoPaso === 4 ? destino.ancla : undefined)
      setPanelContenidos(destinoPaso === 2 && Boolean(destino.panel))
      const pideSeleccion = destinoPaso === 4 && Boolean(destino.seleccion)
      setSeleccionDemo(pideSeleccion)
      if (pideSeleccion) setBorrador({ visibilidad: 'privado' })
      setListo(true)
    },
    [evento],
  )

  useEffect(() => {
    aplicarHash(window.location.hash, true)
    document.title = `Crear ${ruta ? 'ruta' : evento ? 'evento' : 'contenido'} · Playground UX`
    // Un cambio de hash a mano no siembra el ejemplo, salvo el caso borde de 80 preguntas (es un enlace de demostración).
    const alCambiar = () => aplicarHash(window.location.hash, leerHash(window.location.hash).variante === 'eval-80')
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [aplicarHash, evento, ruta])

  // El hash sigue al paso y a la página abierta (sin crear entradas de historial).
  useEffect(() => {
    if (!listo || pesosVacio || seleccionDemo) return
    const siguiente =
      paso === 1
        ? '#portada'
        : paso === 2
          ? ruta
            ? panelContenidos
              ? '#contenidos/agregar'
              : '#contenidos'
            : hoja
              ? hashPagina(hoja)
              : '#recursos'
          : paso === 3
            ? '#certificado'
            : '#ajustes'
    if (window.location.hash !== siguiente) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${siguiente}`)
  }, [listo, paso, hoja, pesosVacio, seleccionDemo, ruta, panelContenidos])

  // Al cambiar de paso se vuelve arriba (si no, el paso nuevo empieza a media página); en Ajustes, a la sección pedida.
  useEffect(() => {
    if (!listo) return
    if (paso === 4 && ancla) {
      const id = window.requestAnimationFrame(() => {
        document.getElementById(ANCLA_AJUSTES[ancla])?.scrollIntoView({ block: 'start' })
        setAncla(undefined)
      })
      return () => window.cancelAnimationFrame(id)
    }
    inicio.current?.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, paso])

  // El autoguardado sigue a cualquier cambio del creador; se ignora la carga (o el ejemplo) y lo que pase al crear.
  // La foto previa se toma siempre, también con el contenido en blanco: si solo se tomara al haber borrador, el primer
  // cambio —el que justamente lo crea— se usaría de referencia y el chip no se movería hasta el segundo.
  const previo = useRef<Borrador | null>(null)
  useEffect(() => {
    if (!listo || terminado.current) return
    if (!previo.current) {
      previo.current = borrador
      return
    }
    const hubo = cambioReal(previo.current, borrador)
    previo.current = borrador
    if (!hubo || !esBorrador) return
    guardar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, borrador, esBorrador])

  // ── Estado del contenido ──
  const faltantes = useMemo(() => faltantesPortada(borrador.portada, clase), [borrador.portada, clase])
  const paginas = todasLasPaginas(borrador)
  const problemaRecursos = paginas.length ? validarRecursos(borrador) : null
  const sinPreguntas = paginas.filter(faltanPreguntas)

  // En el paso 2 siempre hay una página a la vista: la primera, si no se eligió otra. Elegir una no es trabajo del
  // creador —lo que quiere es seguir armándolas—, y al borrar la que estaba abierta se pasa sola a la que quede.
  useEffect(() => {
    if (!listo || paso !== 2) return
    if (!paginas.length) {
      if (hoja) setHoja(null)
      return
    }
    if (!hoja || !paginas.some((p) => p.id === hoja)) setHoja(paginas[0].id)
  }, [listo, paso, paginas, hoja])

  // Pesos: se reparten solos cuando cambia el conjunto de evaluaciones.
  const { items, pesos } = useMemo(() => pesosSincronizados(borrador), [borrador])
  useEffect(() => {
    if (pesos !== borrador.pesos) setBorrador({ pesos })
  }, [pesos, borrador.pesos])

  const visibles = items.filter((i) => !i.oculta)
  const validos: Record<Paso, boolean> = {
    1: faltantes.size === 0,
    2: faltantes.size === 0 && paso2Listo(borrador),
    3: true,
    4: !(visibles.length >= 2 && sumaPesos(items, pesos) !== 100) && !(borrador.visibilidad === 'privado' && !borrador.colaboradores.length),
  }

  // ── Navegación del asistente ──
  // En el stepper se vuelve a cualquier paso anterior y se avanza a uno posterior si todos los de antes están completos:
  // con todo lleno se navega libre entre los cuatro.
  const alcanzable = (destino: Paso) => destino <= paso || PASOS.slice(0, destino - 1).every((_, i) => validos[(i + 1) as Paso])
  // Un paso queda «hecho» si ya se pasó por él y sigue completo (también los de adelante, al volver atrás).
  const hecho = (n: Paso) => n < paso || (n > paso && n <= visitado && PASOS.slice(0, n).every((_, i) => validos[(i + 1) as Paso]))

  const irAlPaso = (siguiente: Paso) => {
    setDireccion(siguiente > paso ? 'adelante' : 'atras')
    setPaso(siguiente)
    setHoja(null)
    setPesosVacio(false)
  }

  /** Abrir una página: la de un recurso recién confirmado, la del índice o la de un aviso «Ver página». */
  const verPagina = (id: string) => {
    setBorrador({ paginaActiva: id })
    if (faltantesPortada(getBorrador().portada, clase).size > 0) return
    if (paso !== 2) irAlPaso(2)
    setHoja(id)
  }

  const recursos = useRecursos({ borrador, onVerPagina: verPagina })
  // Lo que dura la ruta: la suma de sus contenidos. Lo enseña el paso 1 y lo guarda «crear».
  const minutosRuta = useMemo(() => (ruta ? minutosDeRuta(borrador) : 0), [ruta, borrador])

  const cambiarPortada = (cambio: Partial<Portada>) => {
    setBorrador((b) => ({ portada: { ...b.portada, ...cambio } }))
  }

  // ── Salir ──
  // El guardia atrapa las salidas que no pasan por el botón: la barra lateral, el «atrás» del navegador, un enlace. Se
  // queda fuera el ir a un flujo de recurso (video, presentación, roleplay), que vuelve aquí y no es salir.
  //
  // Antes frenaba por «cambios sin guardar». Ya no existe ese estado: se guarda desde el primer paso, así que lo único
  // que decide es lo mismo que decide el botón —si se tocó algo o no—, y la pregunta es la misma (Carlos, 1-oct).
  const bloqueo = useBlocker(
    ({ nextLocation }) =>
      !terminado.current &&
      !saliendo.current &&
      esBorrador &&
      nextLocation.pathname !== window.location.pathname &&
      // Los flujos de alta de recurso y la vista del colaborador no son salir de la creación: se va y se vuelve al
      // mismo borrador, así que no hay nada que preguntar.
      !nextLocation.pathname.startsWith(`${BASE_LMS}/agregar-`) &&
      nextLocation.pathname !== `${BASE_LMS}/vista-colaborador`,
  )
  const salidaBloqueada = bloqueo.state === 'blocked' ? bloqueo : null
  const salir = () => {
    // Sin esto el guardia frenaría la salida que el creador acaba de confirmar y volvería a preguntar.
    saliendo.current = true
    navigate(RUTA_CONTENIDOS)
  }
  // Quien solo entró a mirar se va de una: no hay nada que confirmar ni nada guardado.
  const pedirSalir = () => (esBorrador ? setConfirmarSalida(true) : salir())


  // ── Crear y publicar ──
  // Al crear se aterriza en Contenidos, igual que Crear assessment aterriza en Diagnóstico: el aviso cuenta qué quedó
  // y la lista lo muestra de primero. Antes había una pantalla de resumen que repetía lo que ya se acababa de llenar
  // (Dave, 1-oct).
  const crear = () => {
    const final = getBorrador()
    terminado.current = true
    publicarContenido(final)
    setHoja(null)
    if (final.visibilidad !== 'borrador') {
      notify(
        final.visibilidad === 'oculto'
          ? `«${final.portada.titulo.trim()}» quedó ocult${ruta ? 'a' : 'o'}`
          : `«${final.portada.titulo.trim()}» está publicad${ruta ? 'a' : 'o'}`,
        final.visibilidad === 'oculto'
          ? `No aparece en el catálogo: puedes asignarl${ruta ? 'a' : 'o'} directamente.`
          : 'Ya está disponible para tus colaboradores.',
      )
    } else {
      notify(`${Cosa} «${final.portada.titulo.trim()}» cread${ruta ? 'a' : 'o'}`, `Queda en borrador hasta que l${ruta ? 'a' : 'o'} publiques.`)
    }
    navigate(RUTA_CONTENIDOS)
  }

  if (!listo) return null

  const actual = PASOS[paso - 1]
  const ultimo = paso === PASOS.length
  const conResumen = paso === 1 || paso === 4 || (ruta && paso === 2)
  const titulo = `Crear ${cosa}`
  const descripcion = `Paso ${paso} de ${PASOS.length} · ${actual.descripcion}`

  return (
    <TooltipProvider delay={300}>
      <PageShell width="default">
        <div ref={inicio} aria-hidden="true" className="scroll-mt-24" />
        {/* Sin flecha de volver a la izquierda del título: en un paso a paso esa flecha se lee como «paso anterior»
            cuando en realidad sacaba del flujo, y para atrás ya está el botón de la barra de abajo. La salida es una
            sola y está a la derecha, con su nombre completo (Carlos, 1-oct). */}
        <PageHeader
          title={titulo}
          description={descripcion}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Ver el contenido como lo verá quien lo estudie. Va aquí arriba y no en un paso: se puede mirar en
                  cualquier momento de la creación, y no es parte de armarlo (Dave, 5-oct).
                  En una ruta todavía no: una ruta no tiene páginas propias, sino contenidos, y recorrerla es recorrer
                  cada uno de ellos. */}
              {!ruta ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Se va con la página que se está editando, no a la portada: quien está en la séptima quiere ver
                    // **esa**, y obligarle a recorrer las seis anteriores para comprobar un cambio no tiene sentido
                    // (Dave, 14-oct). El id sale del hash, que es donde el asistente guarda dónde está.
                    const hash = window.location.hash
                    const pagina = hash.match(/\/page\/([^/?]+)/)?.[1]
                    navigate(`${BASE_LMS}/vista-colaborador?volver=${encodeURIComponent(hash)}${pagina ? `&pagina=${pagina}` : ''}`)
                  }}
                >
                  <HugeiconsIcon icon={ViewIcon} size={16} aria-hidden="true" />
                  Vista del colaborador
                </Button>
              ) : null}
              {/* Secundario y con el nombre completo, como la salida de Crear vacante: «Salir» a secas, en terciario,
                  se leía como una acción menor al lado del título y no decía de dónde se sale. */}
              <Button variant="outline" onClick={pedirSalir}>
                <HugeiconsIcon icon={Logout01Icon} size={16} aria-hidden="true" />
                Salir de la creación
              </Button>
            </div>
          }
        />

        {/* Más apretado que el resto del playground: en una pantalla de 610 px de alto, el aire de la cabecera y de
            los pasos se lo quita a los paneles, que es donde se trabaja (Dave, 8-oct). */}
        <PageContent className="gap-4! pt-4!">
          <>
              {/* Anuncia el paso al avanzar o retroceder: el foco se queda en el botón y el cambio no se oiría. */}
              <span role="status" className="sr-only">
                Paso {paso} de {PASOS.length}: {actual.nombre}
              </span>

              <Stepper
                value={paso}
                onValueChange={(valor) => valor !== paso && alcanzable(valor as Paso) && irAlPaso(valor as Paso)}
                indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}
                className="flex flex-col gap-4"
              >
                <StepperNav className="w-full">
                  {PASOS.map((item, indice) => (
                    <StepperItem key={item.nombre} step={indice + 1} completed={hecho((indice + 1) as Paso)} className="flex-1 last:flex-none">
                      <StepperTrigger
                        className={cn('gap-2', !alcanzable((indice + 1) as Paso) && 'cursor-default')}
                        tabIndex={indice + 1 !== paso && alcanzable((indice + 1) as Paso) ? 0 : -1}
                      >
                        <StepperIndicator className={STEP_INDICATOR}>{indice + 1}</StepperIndicator>
                        <StepperTitle className="text-sm whitespace-nowrap">
                          {item.nombre}
                          {indice + 1 !== paso ? <span className="sr-only">{hecho((indice + 1) as Paso) ? ', hecho' : ', pendiente'}</span> : null}
                        </StepperTitle>
                      </StepperTrigger>
                      {indice < PASOS.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
                    </StepperItem>
                  ))}
                </StepperNav>

                {/* Los cuatro pasos comparten la rejilla: el trabajo a la izquierda y el resumen a la derecha, que se queda
                    a la vista al hacer scroll y va sumando lo que se decide. */}
                <StepperContent value={paso}>
                  {/* Los pasos 2 y 3 se quedan con todo el ancho: ya enseñan cómo va quedando —la vista previa de la
                      página y el certificado—, y encajarles además el resumen dejaría tres columnas apretadas.
                      La excepción es el paso 2 de una ruta: ahí no hay vista previa que compita, la lista no necesita
                      todo el ancho y es justo donde se mueve el dato que más cambia —la duración, que se va sumando
                      con cada contenido— (Dave, 2-oct). */}
                  <div className={cn('grid items-start gap-4', conResumen && DOS_COLUMNAS_RESUMEN)}>
                    {/* La `key` vuelve a montar la columna en cada paso: así se repite la animación de entrada, por el lado
                        al que vas. `motion-reduce` la apaga para quien pidió menos movimiento. */}
                    <div
                      key={paso}
                      className={cn(
                        'min-w-0 animate-in duration-300 fade-in motion-reduce:animate-none',
                        direccion === 'adelante' ? 'slide-in-from-right-6' : 'slide-in-from-left-6',
                      )}
                    >
                      {paso === 1 ? (
                        <PasoInformacion portada={borrador.portada} clase={clase} minutosRuta={minutosRuta} onCambio={cambiarPortada} />
                      ) : null}
                      {paso === 2 && ruta ? (
                        <PasoContenidos
                          contenidos={borrador.contenidos}
                          panelAbierto={panelContenidos}
                          onPanel={setPanelContenidos}
                          onCambio={(contenidos) => setBorrador({ contenidos })}
                        />
                      ) : null}
                      {paso === 2 && !ruta ? (
                        <PasoRecursos
                          borrador={borrador}
                          paginaAbierta={hoja}
                          problema={problemaRecursos}
                          sinPreguntas={sinPreguntas}
                          onAbrir={verPagina}
                          onAnadirPagina={recursos.anadirPagina}
                          onAlternarSecciones={recursos.alternarSecciones}
                          onEditarSeccion={recursos.editarSeccion}
                          onEliminarSeccion={recursos.pedirEliminarSeccion}
                          onEliminarPagina={recursos.pedirEliminarPagina}
                          acciones={recursos.accionesDe}
                        />
                      ) : null}
                      {paso === 3 ? <PasoCertificado borrador={borrador} onCambio={setBorrador} /> : null}
                      {paso === 4 ? <PasoAjustes borrador={borrador} items={items} pesos={pesos} pesosVacio={pesosVacio} abrirSeleccion={seleccionDemo} onCambio={setBorrador} /> : null}
                    </div>
                    {conResumen ? (
                      <div className="lg:sticky lg:top-0">
                        {/* Hasta el paso más lejano al que se llegó: al volver atrás, lo que ya se llenó adelante sigue en el resumen. */}
                        <ResumenContenido borrador={borrador} paso={visitado} items={items} pesos={pesos} />
                      </div>
                    ) : null}
                  </div>
                </StepperContent>
              </Stepper>

              {/* La barra de los pasos del sistema (BarraPasos, 13-oct). El guardado es automático: no hace falta un
                  botón, basta con decir en qué va. Aparece en cuanto se escribe la primera cosa, también en el paso 1. */}
              <BarraPasos
                className="mb-1"
                inicio={esBorrador ? <ChipGuardado estado={guardado} /> : null}
                paso={paso}
                onAtras={() => irAlPaso((paso - 1) as Paso)}
                principal={{
                  texto: ultimo ? `Crear ${cosa}` : undefined,
                  deshabilitado: !validos[paso],
                  onClick: () => (ultimo ? crear() : irAlPaso((paso + 1) as Paso)),
                }}
              />
          </>
        </PageContent>

        {recursos.modales}
        <Generaciones borrador={borrador} onVerPagina={verPagina} className="right-6 bottom-24 left-auto" />


        {/* Salir del asistente. Una sola pregunta, y no es una advertencia: el contenido se guarda desde el primer
            paso, así que no hay nada que perder. Está para que nadie se salga por haber tocado el botón sin querer, y
            para contarle dónde quedó. Solo aparece si se escribió algo; si no, se sale de una (Carlos, 1-oct). */}
        <VentanaSalir
          abierto={confirmarSalida}
          onAbiertoChange={setConfirmarSalida}
          borrador
          mensaje={`${laEl} ${cosa} queda ${guardadoA} como borrador. Puedes retomarl${ruta ? 'a' : 'o'} cuando quieras desde Contenidos.`}
          onSalir={() => {
            setConfirmarSalida(false)
            salir()
          }}
        />

        {/* La misma pregunta, para las salidas que no pasan por el botón (la barra lateral, «atrás» del navegador). */}
        <VentanaSalir
          abierto={salidaBloqueada !== null}
          onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
          borrador
          mensaje={`${laEl} ${cosa} queda ${guardadoA} como borrador. Puedes retomarl${ruta ? 'a' : 'o'} cuando quieras desde Contenidos.`}
          onSalir={() => salidaBloqueada?.proceed()}
        />
      </PageShell>
    </TooltipProvider>
  )
}
