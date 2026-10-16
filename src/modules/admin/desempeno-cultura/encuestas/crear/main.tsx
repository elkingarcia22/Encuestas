import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowLeft01Icon, ArrowRight01Icon, Logout01Icon, UserGroupIcon, ViewIcon } from '@hugeicons/core-free-icons'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { Alert, AlertDescription, Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Text } from '@ubits/flux-ui'
import { OPENING_SOON_DAYS as DIAS_AVISO_SIN_PARTICIPANTES } from '../modelo/riesgos'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { notify, notifyAction } from '@/shared/components/notify'
import { fechaCorta } from '@/modules/design-system/patrones/formato'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { useHuecoDerecho, usePantallaGrande } from '@/modules/admin/seleccion/vacantes/detalle/components/agente-acoplado'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ChipGuardado, type EstadoGuardado } from '@/shared/components/ChipGuardado'
import { agregarEncuesta, encuestaPorId, useEncuestas } from '../components/almacen'
import { nombreRepetido } from '../components/demograficos/nombre-repetido'

import { VistaPrevia } from '../components/vista-previa/vista-previa'
import { activateAllCatalogDemographics } from '../modelo/demographics'
import { buildLibraryDemographic, getLibraryDemographics } from '../modelo/demographicsLibrary'
import { totalParticipantCount } from '../modelo/participants'
import { respondieronEn } from '../modelo/respuestas-previas'
import { canPreview } from '../modelo/previewModel'
import { STEPPER_ORDER, esNom035 } from '../modelo/stepper'
import { createBlankSurveyDraft } from '../modelo/surveyBuilderMocks'
import { SURVEY_KIND_LABELS, type SurveyDraft, type SurveyKind, type SurveySection } from '../modelo/surveyBuilderTypes'
import { createPublishedSurveyDraft } from '../modelo/surveyPreviewMocks'
import { fallaEnQA } from '../modelo/surveyCasos'
import { findTemplateByName } from '../modelo/templateCatalog'
import { PanelCrearConIa } from './components/agente/panel-crear-con-ia'
import { PasoDemograficos } from './components/paso-demograficos'
import { PasoGeneral } from './components/paso-general'
import { PasoParticipantes } from './components/paso-participantes'
import { PasoPaginas } from './components/paso-paginas'
import { PasoSecciones } from './components/secciones/paso-secciones'
import { PASOS, estadoDelBorrador, indiceDe, pasoAlcanzable, pasoCompleto, preguntasIncompletas, primeraIncompleta, primerPendiente, resumenFinalizar, type PasoId } from './components/pasos'
import { PasosEncuesta } from './components/pasos-encuesta'
import { AvisoInicioVencido } from './components/aviso-inicio-vencido'
import { ResumenEncuesta } from './components/resumen-encuesta'

// El constructor de encuestas: cinco pasos en su propia pantalla, armado igual que «Crear vacante»: los
// pasos en una fila arriba, el trabajo a la izquierda, el panel «Así va la encuesta» a la derecha y la
// barra de acciones fija abajo. Los pasos obligatorios se recorren en orden —el candado es real— y
// «Finalizar» revisa los cinco a la vez. Se abre en blanco, desde una plantilla o para editar una
// encuesta de la lista.
import { ImagenGlass } from '@/shared/components/ImagenGlass'

const RUTA_ENCUESTAS = '/admin/desempeno-cultura/encuestas'
const SEGUNDOS_AUTOGUARDADO = 3
const MS_GUARDANDO = 700

// El tipo del borrador, como lo escribe la lista.
const TIPO_EN_LISTA: Record<NonNullable<SurveyDraft['kind']>, string> = {
  cultura: 'Cultura',
  clima: 'Clima',
  enps: 'NPS',
  ia: 'Adopción de IA',
  otros: 'Otros',
}

// «aaaa-mm-dd» del borrador → «9 sep 2026» de la lista: la forma única de fechas del sistema (fechaCorta, decisión 19).
const fechaDeLista = (valor: string) => (valor ? fechaCorta(valor) : '-')

// El nombre que pone el agente cuando crea la encuesta desde cero (el paso 1 vacío): el tema y el mes.
const NOMBRE_POR_TIPO: Record<SurveyKind, string> = { clima: 'Clima laboral', cultura: 'Cultura organizacional', enps: 'eNPS', ia: 'Adopción de IA', otros: 'Encuesta' }

function contenedorDeScroll(nodo: Element | null) {
  let actual = nodo?.parentElement ?? null
  while (actual && !/(auto|scroll)/.test(getComputedStyle(actual).overflowY)) actual = actual.parentElement
  return actual
}

// El borrador con el que abre: el de la encuesta que se edita, una plantilla (con todos los
// demográficos del módulo activos, como en el prototipo) o uno en blanco.
function borradorInicial(id: string | undefined, plantilla: string | undefined): SurveyDraft {
  if (id) {
    const encuesta = encuestaPorId(id)
    if (encuesta) return encuesta.draft ?? createPublishedSurveyDraft(encuesta)
  }
  const base = findTemplateByName(plantilla)
  if (!base) return createBlankSurveyDraft()
  const copia: SurveyDraft = structuredClone(base)
  return {
    ...copia,
    status: 'draft',
    demographics: { ...copia.demographics, fields: activateAllCatalogDemographics(copia.demographics.fields, getLibraryDemographics(), buildLibraryDemographic) },
  }
}

// Guarda la encuesta en la lista (la crea o reemplaza la que se editaba): como borrador mientras se
// autoguarda y, con `publicar` (al «Finalizar»), como «Por iniciar». Una que ya está en marcha o terminada
// conserva su estado al editarla. Una nueva sin nombre todavía no entra: sería una fila vacía en la lista.
function guardarEnLista(idLista: string, actual: SurveyDraft, publicar = false) {
  const existente = encuestaPorId(idLista)
  if (!existente && actual.name.trim() === '') return
  const sigueBorrador = !existente || existente.status === 'Borrador'
  const porIniciar = publicar && sigueBorrador
  agregarEncuesta({
    id: idLista,
    name: actual.name.trim() || 'Encuesta sin título',
    type: actual.kind ? TIPO_EN_LISTA[actual.kind] : 'Otros',
    status: porIniciar ? 'Por iniciar' : (existente?.status ?? 'Borrador'),
    statusVariant: porIniciar ? 'warning' : (existente?.statusVariant ?? 'neutral'),
    startDate: fechaDeLista(actual.startDate),
    endDate: fechaDeLista(actual.endDate),
    participants: existente && existente.status !== 'Borrador' ? existente.participants : String(totalParticipantCount(actual.participants)),
    progress: existente?.progress ?? 0,
    draft: actual,
  })
}

// Un enlace de edición de una encuesta que ya no está, o una plantilla que se quitó del catálogo: no se abre en blanco
// (al guardar crearía otra encuesta). Se dice que no se encontró y se vuelve a la lista, como en Resultados (CRE-008).
function NoEncontrada({ plantilla }: { plantilla: boolean }) {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader back={{ label: 'Encuestas', to: RUTA_ENCUESTAS }} title={plantilla ? 'Crear encuesta' : 'Editar encuesta'} />
      <PageContent>
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-search" />
            </EmptyMedia>
            <EmptyTitle>{plantilla ? 'No encontramos esta plantilla' : 'No encontramos esta encuesta'}</EmptyTitle>
            <EmptyDescription>{plantilla ? 'Puede que se haya quitado del catálogo. Vuelve a la lista para elegir otra.' : 'Puede que se haya eliminado. Vuelve a la lista para elegir otra.'}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => navigate(RUTA_ENCUESTAS)}>
              Volver a encuestas
            </Button>
          </EmptyContent>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

// Una encuesta finalizada no se edita por ningún camino (Elkin, 14-oct): ya cerró y sus resultados no pueden cambiar. El
// menú de la fila no ofrece «Editar»; si se llega por la dirección, este vacío lo explica y lleva a sus resultados.
function Finalizada({ id }: { id: string }) {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader back={{ label: 'Encuestas', to: RUTA_ENCUESTAS }} title="Editar encuesta" />
      <PageContent>
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-lock" />
            </EmptyMedia>
            <EmptyTitle>Esta encuesta ya finalizó</EmptyTitle>
            <EmptyDescription>No se puede editar porque ya cerró y sus resultados no pueden cambiar. Puedes ver sus resultados o duplicarla desde la lista para hacer una nueva.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(RUTA_ENCUESTAS)}>
              Volver a encuestas
            </Button>
            <Button onClick={() => navigate(`${RUTA_ENCUESTAS}/${id}/resultados`)}>Ver resultados</Button>
          </EmptyContent>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

export function Component() {
  const { id } = useParams()
  const plantilla = (useLocation().state as { plantilla?: string } | null)?.plantilla
  if (id && !encuestaPorId(id)) return <NoEncontrada plantilla={false} />
  if (id && encuestaPorId(id)?.status === 'Finalizado') return <Finalizada id={id} />
  if (!id && plantilla !== undefined && !findTemplateByName(plantilla)) return <NoEncontrada plantilla />
  return <Constructor />
}

function Constructor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  // `agente`: viene del agente del inicio de Encuestas («Crear una encuesta con IA»), con lo que se le pidió allí.
  const pedido = location.state as { plantilla?: string; paso?: PasoId; agente?: { pedido?: string } } | null

  const [borrador, setBorrador] = useState<SurveyDraft>(() => borradorInicial(id, pedido?.plantilla))
  const [paso, setPaso] = useState<PasoId>(pedido?.paso ?? 'general')
  const [visitados, setVisitados] = useState<ReadonlySet<PasoId>>(() => new Set([pedido?.paso ?? 'general']))
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('guardado')
  // Como en Crear contenido: el chip del guardado aparece cuando ya hay algo escrito; antes no hay nada que guardar y
  // decir «Guardado» sería mentir. Una encuesta que ya existe sí lo muestra desde el principio.
  const [tocado, setTocado] = useState(Boolean(id))
  // El guardado que falló (la encuesta de prueba que falla, CRE-061): el chip se queda en «Cambios sin guardar», nunca
  // dice «Guardado», y no vuelve a intentar solo: espera a «Reintentar», junto al chip o en el aviso.
  const [falloGuardado, setFalloGuardado] = useState(false)
  const falla = fallaEnQA(id)
  const [conErrores, setConErrores] = useState(false)
  const [fallidos, setFallidos] = useState<ReadonlySet<PasoId>>(() => new Set())
  // Las preguntas que estaban incompletas al intentar avanzar: solo esas salen en rojo. Una pregunta nueva nace normal.
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(() => new Set())
  // La pregunta incompleta que «Finalizar» manda a revisar (el paso 4 la abre y la lleva a la vista).
  const [senalada, setSenalada] = useState<string | null>(null)
  const [descripcionActiva, setDescripcionActiva] = useState(() => borrador.description.trim() !== '')
  const [conVistaPrevia, setConVistaPrevia] = useState(false)
  // Sin datos demográficos los resultados solo se leen en total: al salir de ese paso apagado (o al finalizar así) se
  // pregunta una vez si se agregan o se sigue sin ellos. Elegir seguir no vuelve a preguntar en esta edición.
  const [avisoSinDemograficos, setAvisoSinDemograficos] = useState<'continuar' | 'finalizar' | null>(null)
  const [sinDemograficosAceptado, setSinDemograficosAceptado] = useState(false)
  // La ventana de los demográficos cierra igual con Escape que con su botón de cancelar; solo el botón agrega los datos.
  const cerradoConEscape = useRef(false)
  useEffect(() => {
    if (avisoSinDemograficos === null) return
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerradoConEscape.current = true
    }
    window.addEventListener('keydown', alPulsar, true)
    return () => window.removeEventListener('keydown', alPulsar, true)
  }, [avisoSinDemograficos])
  // «Sin datos» es tanto el interruptor apagado como ninguno activo (PAR-107). Una NOM 035 no puede seguir así: la norma
  // pide al menos uno, y en vez de la ventana el paso marca el error.
  const sinDatosActivos = !borrador.demographics.enabled || borrador.demographics.fields.length === 0
  const normaSinDatos = esNom035(borrador) && sinDatosActivos
  const [faltaNorma, setFaltaNorma] = useState(false)
  const faltaDecidirDemograficos = sinDatosActivos && !normaSinDatos && !sinDemograficosAceptado
  // Días que faltan para abrir si el borrador no tiene a nadie y la fecha está a una semana o menos (o ya pasó); si no, null.
  const sinParticipantesCerca = useMemo(() => {
    if (!borrador.startDate || totalParticipantCount(borrador.participants) > 0) return null
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const dias = Math.round((new Date(`${borrador.startDate}T00:00:00`).getTime() - hoy.getTime()) / 86_400_000)
    return Number.isNaN(dias) || dias > DIAS_AVISO_SIN_PARTICIPANTES ? null : dias
  }, [borrador.startDate, borrador.participants])

  // El agente que crea la encuesta, acoplado a la derecha: llega abierto desde el agente del inicio de Encuestas.
  // Cerrarlo solo lo esconde: la conversación (y lo que esté creando) sigue en memoria.
  const [agente, setAgente] = useState<{ abierto: boolean } | null>(() => (pedido?.agente ? { abierto: true } : null))
  const [revelar, setRevelar] = useState<{ id: string; vez: number } | null>(null)
  // La sección que la IA está creando ahora: su etiqueta dice «Creando…».
  const [creandoIa, setCreandoIa] = useState<string | null>(null)
  // El nombre y el tipo que puso la IA en el paso 1: si nadie los cambia, «Descartar» los quita también.
  const puestosPorIa = useRef<{ nombre?: string; tipo?: SurveyKind }>({})
  const grande = usePantallaGrande()
  const hueco = useHuecoDerecho()
  const acoplado = grande && agente?.abierto === true
  useEffect(() => {
    setRightPanelOpen(acoplado)
    return () => setRightPanelOpen(false)
  }, [acoplado])

  // El id con que la encuesta queda en la lista: el suyo si se edita, uno nuevo si se crea.
  const [idNuevo] = useState(() => `encuesta-${Date.now()}`)
  const idEnLista = useRef(id ?? idNuevo)
  const todas = useEncuestas()
  const nombreDuplicado = nombreRepetido(borrador.name, todas.filter((encuesta) => encuesta.id !== idEnLista.current).map((encuesta) => encuesta.name))
  // El estado que muestra el encabezado: el de la encuesta en la lista, o Borrador si es nueva.
  const [estadoEnLista] = useState(() => (id ? encuestaPorId(id)?.status : undefined) ?? 'Borrador')
  // En curso ya tiene respuestas: sus preguntas, su visibilidad y sus datos demográficos se ven, pero no se cambian.
  const enCurso = estadoEnLista === 'En progreso' || borrador.status === 'live'
  const saliendo = useRef(false)
  // Toda salida del constructor pregunta, aunque ya se haya autoguardado; solo Finalizar sale directo.
  const bloqueoSalida = useBlocker(({ currentLocation, nextLocation }) => !saliendo.current && currentLocation.pathname !== nextLocation.pathname)
  const salidaBloqueada = bloqueoSalida.state === 'blocked' ? bloqueoSalida : null

  const estado = useMemo(() => estadoDelBorrador(borrador, visitados), [borrador, visitados])
  const completos = new Set(PASOS.map((item) => item.id).filter((item) => visitados.has(item) && pasoCompleto(item, estado)))
  const bloqueados = new Set(PASOS.map((item) => item.id).filter((item) => !pasoAlcanzable(item, estado)))

  // Los pasos que se arreglan dejan de estar en rojo solos, sin volver a pulsar Finalizar.
  const fallidosVivos = new Set([...fallidos].filter((item) => !pasoCompleto(item, estado)))

  const cambiar = (cambio: Partial<SurveyDraft>) => {
    setBorrador((actual) => ({ ...actual, ...cambio }))
    setTocado(true)
    setEstadoGuardado('editando')
  }

  useEffect(() => {
    if (estadoGuardado !== 'editando' || falloGuardado) return
    const temporizador = window.setTimeout(() => setEstadoGuardado('guardando'), SEGUNDOS_AUTOGUARDADO * 1000)
    return () => window.clearTimeout(temporizador)
  }, [borrador, estadoGuardado, falloGuardado])

  // Al terminar de guardar, la encuesta queda en la lista como borrador: salir por cualquier lado no la pierde.
  useEffect(() => {
    if (estadoGuardado !== 'guardando') return
    const temporizador = window.setTimeout(() => {
      if (falla) return avisarFalloGuardado()
      guardarEnLista(idEnLista.current, borrador)
      setEstadoGuardado('guardado')
    }, MS_GUARDANDO)
    return () => window.clearTimeout(temporizador)
  }, [estadoGuardado, borrador, falla])

  function avisarFalloGuardado() {
    setEstadoGuardado('editando')
    setFalloGuardado(true)
    notifyAction('No se pudo guardar', 'Tus cambios siguen aquí, pero todavía no quedaron guardados.', { label: 'Reintentar', onClick: reintentarGuardado }, 'error')
  }

  function reintentarGuardado() {
    setFalloGuardado(false)
    setEstadoGuardado('guardando')
  }

  const irA = (destino: PasoId) => {
    // Una encuesta sin secciones llega al paso 4 con su primera sección, lista para escribirle el nombre.
    if (destino === 'sections' && borrador.sections.length === 0) {
      setBorrador((actual) => ({ ...actual, sections: [{ id: `section-${Date.now()}`, title: '', description: '', questions: [], children: [] }] }))
    }
    // La pregunta señalada solo vale para la visita en la que se señaló: al cambiar de paso se olvida, y al volver a «Secciones» no se abre sola.
    setSenalada(null)
    setPaso(destino)
    setVisitados((previos) => new Set([...previos, destino]))
  }

  // Da igual cómo se intente saltar un paso: se busca el primero incompleto y se dice qué falta.
  const pedirPaso = (destino: PasoId) => {
    if (indiceDe(destino) <= indiceDe(paso) || pasoAlcanzable(destino, estado)) return irA(destino)
    const pendiente = primerPendiente(estado, destino)
    if (pendiente?.paso === 'general') setConErrores(true)
    notify(pendiente?.mensaje ?? 'Completa los pasos anteriores para desbloquear este paso.')
  }

  const siguiente = STEPPER_ORDER[indiceDe(paso) + 1]
  const ultimo = siguiente === undefined

  // Otra encuesta ya se llama así: no se continúa ni se finaliza hasta cambiarlo.
  const avisarNombreRepetido = () => {
    setConErrores(true)
    notify('Ya existe una encuesta con este nombre', 'Cámbialo para distinguirlas en la lista y en los resultados.', 'error')
  }
  const avisarNorma = () => {
    setFallidos((previos) => new Set([...previos, 'demographics']))
    setFaltaNorma(true)
    notify('La NOM 035 pide al menos un dato demográfico', 'Activa uno para continuar: la norma pide leer los resultados por grupo.', 'error')
  }
  const continuar = () => {
    if (paso === 'general' && nombreDuplicado) return avisarNombreRepetido()
    if (paso === 'demographics' && normaSinDatos) return avisarNorma()
    if (paso !== 'pages' && !pasoCompleto(paso, estado)) {
      const pendiente = primerPendiente(estado, paso)
      if (paso === 'general') setConErrores(true)
      // En el paso 4 se marcan las preguntas incompletas y se abre la primera.
      if (paso === 'sections') {
        setFallidos((previos) => new Set([...previos, 'sections']))
        setMarcadas(new Set(preguntasIncompletas(borrador.sections)))
        setSenalada(primeraIncompleta(borrador.sections))
      }
      return notify(pendiente?.mensaje ?? 'Completa este paso para continuar.')
    }
    if (paso === 'demographics' && faltaDecidirDemograficos) return setAvisoSinDemograficos('continuar')
    if (siguiente) irA(siguiente)
  }

  // «Finalizar» revisa los cinco pasos a la vez: los que fallan quedan en rojo, deja en el primero y
  // sale un solo mensaje que resume.
  const finalizar = () => {
    if (nombreDuplicado) {
      irA('general')
      return avisarNombreRepetido()
    }
    const todos = estadoDelBorrador(borrador, new Set(STEPPER_ORDER))
    const { fallidos: pendientes, mensaje } = resumenFinalizar(todos)
    if (pendientes.length > 0) {
      setFallidos(new Set(pendientes))
      if (pendientes.includes('general')) setConErrores(true)
      irA(pendientes[0])
      if (pendientes.includes('sections')) setMarcadas(new Set(preguntasIncompletas(borrador.sections)))
      if (pendientes[0] === 'sections') setSenalada(primeraIncompleta(borrador.sections))
      if (pendientes[0] === 'demographics' && normaSinDatos) return avisarNorma()
      return notify(mensaje)
    }
    if (faltaDecidirDemograficos) return setAvisoSinDemograficos('finalizar')
    publicar()
  }

  const publicar = () => {
    if (falla) return avisarFalloGuardado()
    saliendo.current = true
    guardarEnLista(idEnLista.current, borrador, true)
    notify(
      'Encuesta guardada',
      estadoEnLista === 'Borrador' ? `«${borrador.name.trim()}» quedó en la lista como «Por iniciar».` : `Los cambios de «${borrador.name.trim()}» quedaron guardados.`,
    )
    navigate(RUTA_ENCUESTAS)
  }

  // El encabezado se queda fijo y el contenido se recorta justo debajo al hacer scroll (como Vacantes).
  const marca = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    contenedorDeScroll(marca.current)?.scrollTo({ top: 0 })
  }, [paso])
  useEffect(() => {
    const encabezado = marca.current?.nextElementSibling as HTMLElement | null
    const contenido = encabezado?.nextElementSibling as HTMLElement | null
    const contenedor = contenedorDeScroll(marca.current)
    if (!encabezado || !contenido || !contenedor) return
    const recortar = () => {
      const corte = encabezado.getBoundingClientRect().bottom - contenido.getBoundingClientRect().top
      if (corte > 0) contenido.style.setProperty('clip-path', `inset(${corte}px -100vmax -100vmax -100vmax)`)
      else contenido.style.removeProperty('clip-path')
    }
    recortar()
    contenedor.addEventListener('scroll', recortar, { passive: true })
    window.addEventListener('resize', recortar)
    return () => {
      contenedor.removeEventListener('scroll', recortar)
      window.removeEventListener('resize', recortar)
    }
  }, [])

  // Lo que hace el agente cae en el árbol como cualquier cambio: se marca para el autoguardado.
  const cambiarPorIa = (cambio: (actual: SurveySection[]) => SurveySection[]) => {
    setBorrador((actual) => ({ ...actual, sections: cambio(actual.sections as SurveySection[]) }))
    setTocado(true)
    setEstadoGuardado('editando')
  }

  // Empezar a crear: la encuesta pasa a «Secciones y preguntas» para verla crecer. Si el paso 1 está vacío, el agente le
  // pone nombre y tipo (salen de lo pedido); las fechas y los participantes son decisiones de la persona y no los toca.
  const empezarPorIa = (tipo: SurveyKind) => {
    const puesto: { nombre?: string; tipo?: SurveyKind } = {}
    if (borrador.kind === null) puesto.tipo = tipo
    if (borrador.name.trim() === '') {
      const base = `${NOMBRE_POR_TIPO[borrador.kind ?? tipo]} · ${new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })}`
      const usados = todas.filter((encuesta) => encuesta.id !== idEnLista.current).map((encuesta) => encuesta.name)
      let nombre = base
      for (let vez = 2; nombreRepetido(nombre, usados); vez += 1) nombre = `${base} (${vez})`
      puesto.nombre = nombre
    }
    puestosPorIa.current = puesto
    if (puesto.nombre !== undefined || puesto.tipo !== undefined) cambiar({ ...(puesto.nombre ? { name: puesto.nombre } : {}), ...(puesto.tipo ? { kind: puesto.tipo } : {}) })
    if (paso !== 'sections') irA('sections')
    return { nombre: puesto.nombre, tipo: puesto.tipo ? SURVEY_KIND_LABELS[puesto.tipo] : undefined }
  }

  const deshacerGeneralesPorIa = () => {
    const { nombre, tipo } = puestosPorIa.current
    puestosPorIa.current = {}
    setBorrador((actual) => ({ ...actual, name: nombre && actual.name === nombre ? '' : actual.name, kind: tipo && actual.kind === tipo ? null : actual.kind }))
  }

  const pendientesParaFinalizar = [
    ...(borrador.startDate && borrador.endDate ? [] : ['las fechas']),
    ...(totalParticipantCount(borrador.participants) > 0 ? [] : ['los participantes']),
  ]

  // Sin ni una pregunta no hay nada que ensayar.
  // «Vista previa» solo aparece cuando la encuesta ya tiene algo que responder: una pregunta o un dato demográfico que el participante ve.
  const conPreguntas = canPreview(borrador)

  return (
    <PageShell>
      <span ref={marca} aria-hidden="true" />
      <PageHeader
        className="pb-4"
        // El título no cambia con el nombre (ese se escribe en «Datos generales»); la bajada dice qué se decide en el paso.
        title={id ? 'Editar encuesta' : 'Crear encuesta'}
        description={`Paso ${indiceDe(paso) + 1} de ${PASOS.length} · ${PASOS[indiceDe(paso)].descripcion}`}
        actions={
          <>
            {/* «Vista previa» va arriba, junto a «Salir de la creación» (o «Salir de la edición» si la encuesta ya existe), y solo cuando ya hay preguntas; los botones de abajo son para avanzar. */}
            {conPreguntas ? (
              <Button variant="outline" onClick={() => setConVistaPrevia(true)}>
                <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
                Vista previa
              </Button>
            ) : null}
            {/* Pasa por el mismo freno que cualquier otra salida: siempre pregunta antes de salir. */}
            <Button variant="outline" onClick={() => navigate(RUTA_ENCUESTAS)}>
              <HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />
              {id ? 'Salir de la edición' : 'Salir de la creación'}
            </Button>
          </>
        }
      />

      <PageContent>
        {/* Anuncia el paso al avanzar o retroceder: el foco se queda en el botón y el cambio no se oiría. */}
        <span role="status" className="sr-only">
          Paso {indiceDe(paso) + 1} de {PASOS.length}: {PASOS[indiceDe(paso)].titulo}
        </span>

        <div className="flex flex-col gap-6">
          <AvisoInicioVencido borrador={borrador} />
          <PasosEncuesta paso={paso} completos={completos} bloqueados={bloqueados} fallidos={fallidosVivos} onPaso={pedirPaso} />

          {/* El trabajo a la izquierda y «Así va la encuesta» a la derecha, que se queda a la vista al bajar.
              Con el agente de IA acoplado el panel se oculta: el agente ya ocupa ese lado. */}
          <div className={acoplado ? 'min-w-0' : 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'}>
          <div className="min-w-0">
            {paso === 'general' ? (
              <PasoGeneral borrador={borrador} onCambio={cambiar} enCurso={enCurso} conErrores={conErrores} descripcionActiva={descripcionActiva} onDescripcionActiva={setDescripcionActiva} nombreDuplicado={nombreDuplicado} />
            ) : paso === 'participants' ? (
              <div className="flex flex-col gap-4">
                {/* Un borrador se guarda sin participantes, pero sin ellos no pasa a «Por iniciar»: si la fecha de inicio ya
                    está cerca (o pasó), se dice aquí, donde se resuelve. Lo mismo sale en «Para atender» del inicio. */}
                {sinParticipantesCerca !== null ? (
                  <Alert variant="warning">
                    <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                    <AlertDescription>
                      {sinParticipantesCerca < 0 ? 'La fecha de inicio ya pasó' : sinParticipantesCerca === 0 ? 'Esta encuesta abre hoy' : `Esta encuesta abre en ${sinParticipantesCerca} ${sinParticipantesCerca === 1 ? 'día' : 'días'}`} y todavía no tiene participantes. Sin ellos no puede pasar a «Por iniciar» ni abrir.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <PasoParticipantes seleccion={borrador.participants} respondieron={id ? respondieronEn(estadoEnLista) : null} minimoPorGrupo={borrador.visibility === 'anonymous' ? borrador.anonymityThreshold : null} onCambio={(cambio) => cambiar({ participants: { ...borrador.participants, ...cambio } })} />
              </div>
            ) : paso === 'demographics' ? (
              <PasoDemograficos
                config={borrador.demographics}
                onCambio={(demographics) => cambiar({ demographics })}
                importados={borrador.participants.importedDemographics}
                importadosNuevos={borrador.participants.importedNewCount}
                enCurso={enCurso}
                errorNorma={faltaNorma && normaSinDatos}
              />
            ) : paso === 'sections' ? (
              <PasoSecciones
                secciones={borrador.sections}
                onSecciones={(sections) => cambiar({ sections })}
                marcadas={marcadas}
                senalada={senalada}
                revelar={revelar}
                creandoIa={creandoIa}
                enCurso={enCurso}
                normativa={borrador.isReadOnly === true}
              />
            ) : (
              <PasoPaginas borrador={borrador} onCambio={cambiar} falla={falla} />
            )}
          </div>
          {acoplado ? null : (
            <aside aria-label="Así va la encuesta" className="lg:sticky lg:top-4">
              <ResumenEncuesta borrador={borrador} paso={paso} estado={estado} onCambio={cambiar} />
            </aside>
          )}
          </div>
        </div>

        {/* La barra de acciones del Workspace (la de Crear contenido): flotante al fondo, con el estado del guardado a la
            izquierda —es automático, solo se informa— y Atrás y Continuar o Finalizar a la derecha. Con la sombra
            suave, para que no se vea ajena al resto de la interfaz. Sticky: con un paso corto baja hasta el final (mt-auto). */}
        <PageActionBar className="mt-auto!">
          {tocado ? <ChipGuardado estado={estadoGuardado} /> : null}
          {falloGuardado ? (
            <>
              <Text as="span" size="sm" variant="destructive" role="alert">
                No se pudo guardar
              </Text>
              <Button variant="outline" size="sm" onClick={reintentarGuardado}>
                Reintentar
              </Button>
            </>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {/* Como en Crear contenido: «Volver» siempre a la vista, apagado en el primer paso. */}
            <Button variant="outline" disabled={indiceDe(paso) === 0} onClick={() => irA(STEPPER_ORDER[indiceDe(paso) - 1])}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Volver
            </Button>
            {ultimo ? (
              <Button onClick={finalizar}>Finalizar</Button>
            ) : (
              <Button onClick={continuar}>
                Continuar
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </Button>
            )}
          </div>
        </PageActionBar>
      </PageContent>

      {/* Cerrado, el panel se esconde pero sigue montado: la conversación y lo que esté creando no se pierden. */}
      {hueco && agente
        ? createPortal(
            <div className={acoplado ? 'flex h-full shrink-0' : 'hidden'}>
              <PanelCrearConIa
                nombreEncuesta={borrador.name}
                tipo={borrador.kind}
                pedidoInicial={pedido?.agente?.pedido ?? null}
                desdeInicio={pedido?.agente !== undefined}
                secciones={borrador.sections}
                pendientes={pendientesParaFinalizar}
                falla={falla}
                onSecciones={cambiarPorIa}
                onRevelar={(seccion) => setRevelar((previo) => ({ id: seccion, vez: (previo?.vez ?? 0) + 1 }))}
                onCreando={setCreandoIa}
                onEmpezar={empezarPorIa}
                onDeshacerGenerales={deshacerGeneralesPorIa}
                onClose={() => setAgente({ abierto: false })}
              />
            </div>,
            hueco,
          )
        : null}

      <VistaPrevia borrador={borrador} open={conVistaPrevia} onOpenChange={setConVistaPrevia} />

      {/* Sin datos demográficos (apagados o ninguno activo, PAR-107): dos botones (Elkin, 14-oct, la estructura de «¿Salir de la creación?»). Cancelar es lo
          recomendado: «Agregar datos demográficos» los activa y lleva al paso 3. Escape solo cierra, sin hacer nada. */}
      <DialogoConfirmar
        abierto={avisoSinDemograficos !== null}
        onAbiertoChange={(abierto) => {
          if (abierto) return
          const soloCerrar = cerradoConEscape.current
          cerradoConEscape.current = false
          setAvisoSinDemograficos(null)
          if (soloCerrar) return
          cambiar({ demographics: { ...borrador.demographics, enabled: true } })
          irA('demographics')
        }}
        icono={UserGroupIcon}
        titulo="¿Continuar sin datos demográficos?"
        descripcion={`Sin ellos no podrás filtrar los resultados de «${borrador.name.trim() || 'Encuesta sin título'}» por área, sede, antigüedad u otro dato: solo verás los datos generales de la encuesta.`}
        cancelar="Agregar datos demográficos"
        accion="Continuar sin ellos"
        onConfirmar={() => {
          const motivo = avisoSinDemograficos
          setSinDemograficosAceptado(true)
          setAvisoSinDemograficos(null)
          if (motivo === 'finalizar') publicar()
          else if (siguiente) irA(siguiente)
        }}
      />

      {/* Salir del constructor: la estructura de «¿Salir de la creación?» de Crear contenido (Elkin, 14-oct): icono, título,
          descripción y dos botones. Si hay cambios sin guardar, salir los guarda; con la encuesta de prueba que falla, si no
          se puede guardar, no sale. La X (o Escape) cierra y se queda en el constructor. */}
      <DialogoConfirmar
        abierto={salidaBloqueada !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
        icono={Logout01Icon}
        titulo={id ? '¿Salir de la edición?' : '¿Salir de la creación?'}
        descripcion={
          estadoEnLista !== 'Borrador'
            ? `Los cambios de «${borrador.name.trim() || 'Encuesta sin título'}» quedan guardados. Puedes retomarla cuando quieras desde Encuestas.`
            : encuestaPorId(id ?? idNuevo) || (estadoGuardado !== 'guardado' && borrador.name.trim() !== '')
              ? 'La encuesta queda guardada como borrador. Puedes retomarla cuando quieras desde Encuestas.'
              : 'Todavía no has hecho cambios, así que esta encuesta no se guardará.'
        }
        cancelar="Seguir aquí"
        accion={id ? 'Salir de la edición' : 'Salir de la creación'}
        onConfirmar={() => {
          if (estadoGuardado !== 'guardado') {
            if (falla) {
              salidaBloqueada?.reset()
              return avisarFalloGuardado()
            }
            guardarEnLista(idEnLista.current, borrador)
          }
          salidaBloqueada?.proceed()
        }}
      />
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaEncuestasCrearPage'
