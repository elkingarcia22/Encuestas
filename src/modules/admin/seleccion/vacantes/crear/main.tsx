import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, CircleIcon, Logout01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import {
  Button,
  Card,
  CardContent,
  Heading,
  Progress,
  Spinner,
  Text,
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { DialogoSalir } from '@/modules/design-system/estados/confirmaciones'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
// El chip de guardado compartido (decisión 21 de la auditoría, 5-oct): el mismo de Crear contenido y Crear assessment.
import { ChipGuardado, type EstadoGuardado } from '@/shared/components/ChipGuardado'
import { pendienteEtapa } from './components/etapas'
import { textoGenerado } from './components/descripcion'
import { DialogoArchivo } from './components/dialogo-archivo'
import { PASOS, VACANTE_VACIA, informacionCompleta, type Modalidad, type VacanteNueva } from './components/formulario'
import type { VacantePublicada } from '../components/datos'
import { PasoDescripcion } from './components/paso-descripcion'
import { PasoInformacion } from './components/paso-informacion'
import { PasoProceso } from './components/paso-proceso'
import { propuestaIa } from './components/propuesta-ia'
import { ResumenVacante } from './components/resumen-vacante'
import { enLista } from './components/secciones-informacion'
import { guardarPlantillaPropia, plantillaPropiaPorId, problemaConNombre } from '../components/plantillas-propias'
import type { Crumb } from '@/shared/layouts/nav-config'
import { noSeGuardo } from '../../propuestas/simular'
import { Deslizar } from '../../propuestas/components/animacion'
import { MotionConfig } from 'motion/react'

const RUTA_VACANTES = '/admin/seleccion/vacantes'

// Cómo se lee la modalidad en la columna del listado.
const MODALIDAD_LISTADO: Record<Modalidad, string> = { remoto: 'Remoto', presencial: 'Presencial', hibrido: 'Híbrido' }

const STEP_INDICATOR =
  'data-[state=inactive]:bg-background! data-[state=inactive]:text-muted-foreground! data-[state=inactive]:shadow-[inset_0_0_0_1px_var(--border)] data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=completed]:bg-primary! data-[state=completed]:text-primary-foreground!'
const STEP_LINE = 'bg-border! data-[state=completed]:bg-primary!'

// Segundos sin cambios antes de autoguardar.
const SEGUNDOS_AUTOGUARDADO = 3

// Los ms que el botón queda en «Guardando…»: lo justo para que el spinner se note antes de pasar a «Guardado».
const MS_GUARDANDO = 700

// «Crear con IA» arma la vacante por partes, y cada parte cae en el formulario a su turno: así se ve llenarse en vez
// de cambiar de golpe. Lo que tarda cada parte en la maqueta y cuánto se queda el «Listo» antes de retirarse.
const FASES_IA: { mensaje: string; campos: (keyof VacanteNueva)[] }[] = [
  { mensaje: 'Leyendo el cargo…', campos: ['area', 'pais', 'ciudad'] },
  { mensaje: 'Armando los requisitos…', campos: ['contrato', 'idiomas', 'seniority', 'experienciaDesde', 'experienciaHasta', 'modalidad', 'habilidades'] },
  { mensaje: 'Calculando la compensación…', campos: ['moneda', 'tipoSalario', 'salarioDesde', 'salarioHasta', 'publicarEnBolsas', 'correoRechazo', 'diasRechazo'] },
  { mensaje: 'Escribiendo la descripción…', campos: ['secciones'] },
  { mensaje: 'Proponiendo las etapas…', campos: ['etapas'] },
]
const MS_FASE_IA = 700
const MS_LISTO_IA = 3500

type EstadoIa = { tipo: 'creando'; fase: number } | { tipo: 'listo'; resumen: string[] }

const pesosCop = (valor: string | undefined) => `$${Number(valor ?? 0).toLocaleString('es-CO')}`

// Lo que quedó armado, en tres líneas: es lo que se mira al terminar para saber qué revisar.
function resumenIa(propuesta: Partial<VacanteNueva>): string[] {
  const etapas = propuesta.etapas ?? []
  const conIa = etapas.filter((etapa) => etapa.conIa).length
  return [
    `${propuesta.area ?? 'Sin área'} en ${propuesta.ciudad ?? 'sin ciudad'}, de ${pesosCop(propuesta.salarioDesde)} a ${pesosCop(propuesta.salarioHasta)} ${propuesta.moneda ?? ''} al mes`.trim(),
    `La descripción en ${propuesta.secciones?.length ?? 0} secciones y ${propuesta.habilidades?.length ?? 0} habilidades clave`,
    `${etapas.length} etapas en el proceso, ${conIa} con IA ya configuradas`,
  ]
}

// Encima del formulario mientras la IA trabaja: el orbe, en qué va, el avance y las partes ya hechas. Al terminar, qué
// armó y el botón para ir a revisarlo. Va pegado a la vista al bajar, como el de «Generar preguntas» del LMS Creator.
// Cubre el formulario pero queda por debajo de la barra de abajo (`PageActionBar`, z-10): antes la tapaba a medias al
// bajar (5 oct, Nicolás: «esa carga tapa esa barra de abajo y es raro»).
function CreandoConIa({ ia, nombre, onCerrar }: { ia: EstadoIa; nombre: string; onCerrar: () => void }) {
  const fase = ia.tipo === 'creando' ? ia.fase : FASES_IA.length
  return (
    <div aria-busy={ia.tipo === 'creando'} className="absolute inset-0 z-5 flex justify-center rounded-xl bg-background/80 backdrop-blur-sm">
      <div className="sticky top-[20vh] mt-16 h-fit w-full px-4 sm:w-[28rem]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Orb className="size-14" />
            <div role="status" className="flex flex-col items-center gap-1">
              <Heading as="h2" level={5}>
                {ia.tipo === 'creando' ? `Armando «${nombre}» con IA` : `Listo: armamos «${nombre}»`}
              </Heading>
              <Text as="p" variant="muted" size="sm">
                {ia.tipo === 'creando' ? 'Mientras tanto el formulario queda quieto.' : 'Revisa cada paso antes de publicar: todo se puede cambiar.'}
              </Text>
            </div>
            {ia.tipo === 'creando' ? (
              <>
                <AiThinking label={FASES_IA[fase].mensaje} orb={false} />
                <Progress value={(fase / FASES_IA.length) * 100} aria-label="Avance de la IA" className="w-full" />
              </>
            ) : null}
            <ul className="flex w-full flex-col gap-2 text-left">
              {(ia.tipo === 'creando' ? FASES_IA.map((una) => una.mensaje.replace('…', '')) : ia.resumen).map((linea, indice) => (
                <li key={linea} className="flex items-start gap-2">
                  {ia.tipo === 'listo' || indice < fase ? (
                    <HugeiconsIcon icon={Tick02Icon} size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  ) : indice === fase ? (
                    <Spinner className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <HugeiconsIcon icon={CircleIcon} size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <Text as="span" size="sm" variant={ia.tipo === 'creando' && indice > fase ? 'muted' : undefined}>
                    {linea}
                  </Text>
                </li>
              ))}
            </ul>
            {ia.tipo === 'listo' ? (
              <Button autoFocus className="w-full" onClick={onCerrar}>
                Revisar la vacante
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// El primer ancestro que hace scroll: la pantalla no se desplaza en window sino en un contenedor del marco.
function contenedorDeScroll(nodo: Element | null) {
  let actual = nodo?.parentElement ?? null
  while (actual && !/(auto|scroll)/.test(getComputedStyle(actual).overflowY)) actual = actual.parentElement
  return actual
}

// Crear una vacante: tres pasos en su propia pantalla, con la columna de pasos a la izquierda.
// Está en una dirección propia (y no en un panel sobre la lista) porque el proceso es largo,
// se puede compartir el enlace de un borrador y el tercer paso necesita todo el ancho.
export function Component() {
  return <CreacionVacante />
}

// La misma creación sirve dentro de una exploración de Selección (30 sep, Nicolás: la exploración 1 de Vacantes crea
// con este flujo). Sin opciones es la de siempre. `volverA` es la lista a la que se sale y vuelve; `migas`, la miga de
// pan de arriba; y `alPublicar` recibe la vacante lista en vez de volver al listado de Vacantes con ella.
export type OpcionesCreacion = {
  volverA?: string
  migas?: Crumb[]
  alPublicar?: (vacante: VacanteNueva) => void
  // Recibe la vacante a medio llenar cuando se sale de la creación: la lista la guarda como borrador (13 oct).
  alSalir?: (vacante: VacanteNueva) => void
  // 1 oct (reunión con Elkin del 29 sep: «Editar» lleva a esta misma experiencia): con lo que ya tiene la vacante, en el
  // paso pedido y con los tres pasos abiertos. El botón final dice «Guardar cambios» y entrega la vacante a `alPublicar`.
  modo?: 'crear' | 'editar'
  // Con qué arranca: la vacante que se edita o una plantilla del catálogo ya puesta en esta forma.
  inicial?: VacanteNueva
  pasoInicial?: number
}

export function CreacionVacante({ volverA = RUTA_VACANTES, migas, alPublicar, alSalir, modo = 'crear', inicial, pasoInicial }: OpcionesCreacion = {}) {
  const navigate = useNavigate()
  // El mismo flujo sirve para tres cosas: crear una vacante (en blanco o desde una plantilla propia),
  // crear una plantilla y editar una plantilla propia. Cambian el título, el botón final y adónde se guarda.
  const { plantillaId } = useParams()
  const { pathname, state } = useLocation()
  const esPlantilla = pathname.includes('/plantillas/')
  const editando = modo === 'editar' && !esPlantilla
  const desdePlantilla = (state as { desdePlantilla?: string } | null)?.desdePlantilla
  const origen = plantillaId ?? (esPlantilla ? undefined : desdePlantilla)
  const [paso, setPaso] = useState(pasoInicial ?? 1)
  // Hacia dónde se fue de paso: «Siguiente» entra desde la derecha y «Atrás» desde la izquierda (se ajusta en el render).
  const [pasoPrevio, setPasoPrevio] = useState(paso)
  const [haciaDonde, setHaciaDonde] = useState(0)
  if (pasoPrevio !== paso) {
    setPasoPrevio(paso)
    setHaciaDonde(Math.sign(paso - pasoPrevio))
  }
  const [vacante, setVacante] = useState<VacanteNueva>(() => inicial ?? (origen ? plantillaPropiaPorId(origen)?.vacante : undefined) ?? VACANTE_VACIA)
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('guardado')
  const [archivoAbierto, setArchivoAbierto] = useState(false)

  // Sin borrador: al editar una vacante que ya existe, y en las plantillas, que entran al catálogo solo con «Guardar
  // plantilla», lo cambiado no se autoguarda (13 oct).
  const sinBorrador = editando || esPlantilla
  const [tocada, setTocada] = useState(false)

  // Salir pregunta con la ventana de salida del sistema, la de Crear contenido (13 oct, Nicolás: en Selección no hay
  // otra). Frena cualquier forma de salir (el botón, la miga, el menú de la izquierda, «atrás» del navegador): con
  // borrador, si ya se escribió algo, para contar dónde queda; sin borrador, si hay cambios sin guardar. Publicar sí sale
  // sin preguntar: la vacante ya queda publicada con todo.
  const publicando = useRef(false)
  const bloqueoSalida = useBlocker(() => !publicando.current && (sinBorrador ? estadoGuardado !== 'guardado' : tocada))
  const salidaBloqueada = bloqueoSalida.state === 'blocked' ? bloqueoSalida : null

  const cambiar = (cambio: Partial<VacanteNueva>) => {
    setVacante((actual) => ({ ...actual, ...cambio }))
    setEstadoGuardado('editando')
    setTocada(true)
  }

  // Solo se puede saltar a un paso que ya se desbloqueó; los de más allá salen con candado. Al editar, todos abiertos.
  const desbloqueado = editando || informacionCompleta(vacante) ? PASOS.length : 1

  // A los pocos segundos sin escribir, arranca el autoguardado. Al editar una vacante que ya existe, o una plantilla, no
  // hay borrador que autoguardar: los cambios quedan con «Guardar cambios» o «Guardar plantilla».
  useEffect(() => {
    if (estadoGuardado !== 'editando' || sinBorrador) return
    const temporizador = window.setTimeout(() => setEstadoGuardado('guardando'), SEGUNDOS_AUTOGUARDADO * 1000)
    return () => window.clearTimeout(temporizador)
  }, [vacante, estadoGuardado, sinBorrador])

  // «Guardando…» se ve un momento (spinner en el botón, como en el resto de la maqueta) antes de
  // pasar a «Guardado»; si mientras tanto hay un cambio nuevo, este temporizador se cancela solo.
  useEffect(() => {
    if (estadoGuardado !== 'guardando') return
    const temporizador = window.setTimeout(() => setEstadoGuardado('guardado'), MS_GUARDANDO)
    return () => window.clearTimeout(temporizador)
  }, [estadoGuardado])

  // «Crear con IA» llena los tres pasos a partir del nombre (29 sep, reunión con Elkin: «bloqueamos todos los inputs,
  // selects, todo, y hacemos algo que esté creando con IA en el medio»). Mientras trabaja, el formulario queda tapado y
  // sin tocar, y la vacante se va llenando por partes (el panel «Así va la vacante» se ve crecer). Al terminar dice qué
  // armó y se retira solo; con «Revisar la vacante» se va antes.
  const [ia, setIa] = useState<EstadoIa | null>(null)
  const creandoConIa = ia !== null
  const relojesIa = useRef<number[]>([])
  useEffect(() => () => relojesIa.current.forEach((reloj) => window.clearTimeout(reloj)), [])
  const cerrarIa = () => {
    relojesIa.current.forEach((reloj) => window.clearTimeout(reloj))
    relojesIa.current = []
    setIa(null)
    contenedorDeScroll(marca.current)?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const crearConIa = () => {
    const propuesta = propuestaIa(vacante.nombre)
    setIa({ tipo: 'creando', fase: 0 })
    FASES_IA.forEach((fase, indice) => {
      relojesIa.current.push(
        window.setTimeout(() => {
          cambiar(Object.fromEntries(fase.campos.map((campo) => [campo, propuesta[campo]])) as Partial<VacanteNueva>)
          setIa(indice < FASES_IA.length - 1 ? { tipo: 'creando', fase: indice + 1 } : { tipo: 'listo', resumen: resumenIa(propuesta) })
        }, MS_FASE_IA * (indice + 1)),
      )
    })
    relojesIa.current.push(window.setTimeout(cerrarIa, MS_FASE_IA * FASES_IA.length + MS_LISTO_IA))
  }

  // Estado global para mostrar AiThinking cuando los subcomponentes generan contenido
  const [mensajeIa, setMensajeIa] = useState<string | null>(null)

  // El botón dice a qué paso lleva, no solo «Siguiente».
  const textoSiguiente: Record<number, string> = { 1: 'Continuar con descripción', 2: 'Continuar con etapas' }
  const siguiente = () => setPaso((actual) => Math.min(PASOS.length, actual + 1))

  // Etapas con configuración que siguen sin configurar: con alguna, no se publica.
  const [intentoPublicar, setIntentoPublicar] = useState(false)
  const pendientes = vacante.etapas.filter((etapa) => pendienteEtapa(etapa) !== null)

  // Vuelve al listado, que la pone arriba y abre «Compartir» para mandar el enlace de una vez.
  const publicar = () => {
    if (pendientes.length > 0) {
      setIntentoPublicar(true)
      notify(
        esPlantilla ? 'Todavía no podemos guardar la plantilla' : editando ? 'Todavía no podemos guardar los cambios' : 'Todavía no podemos publicar la vacante',
        `Configura ${enLista(pendientes.map((etapa) => `«${etapa.nombre}»`))} antes de ${esPlantilla ? 'guardarla' : editando ? 'guardar' : 'publicar'}.`,
        'error',
      )
      // Al editar se puede guardar desde cualquier paso: lo que falta está en el tercero.
      if (editando) setPaso(PASOS.length)
      return
    }
    // Si no se guarda (VA-50), se queda aquí con todo lo llenado y el aviso deja reintentar el mismo paso.
    if (
      noSeGuardo(
        `publicar:${vacante.nombre}:${modo}`,
        esPlantilla ? 'No pudimos guardar la plantilla' : editando ? 'No pudimos guardar los cambios' : 'No pudimos publicar la vacante',
        publicar,
        'Lo que llenaste sigue aquí.',
      )
    )
      return
    publicando.current = true
    // Una plantilla no se publica: queda en «Creadas por ti» y se vuelve al listado con el catálogo abierto. Sin nombre o
    // con el de otra no se guarda: en el catálogo serían dos iguales o una «sin nombre» (IN-43).
    if (esPlantilla) {
      const problema = problemaConNombre(vacante.nombre, plantillaId)
      if (problema) {
        publicando.current = false
        notify('Todavía no podemos guardar la plantilla', problema, 'error')
        setPaso(1)
        return
      }
      guardarPlantillaPropia(plantillaId, vacante)
      notify(plantillaId ? `Guardamos los cambios de «${vacante.nombre.trim()}»` : `Creamos la plantilla «${vacante.nombre.trim()}»`, 'Está en el catálogo, en «Creadas por ti».', 'success')
      navigate(volverA, { state: { abrirCatalogo: true } })
      return
    }
    if (alPublicar) {
      alPublicar(vacante)
      return
    }
    const publicada: VacantePublicada = {
      titulo: vacante.nombre.trim(),
      area: vacante.area,
      sede: vacante.modalidad === 'remoto' ? 'Remoto' : vacante.ciudad || 'Sin sede',
      modalidad: vacante.modalidad ? MODALIDAD_LISTADO[vacante.modalidad] : 'Sin definir',
    }
    navigate(RUTA_VACANTES, { state: { publicada } })
  }
  const anterior = () => setPaso((actual) => Math.max(1, actual - 1))

  // En el paso 1 no se sigue hasta tener lo obligatorio de las cuatro secciones.
  const bloqueadoPaso1 = paso === 1 && !informacionCompleta(vacante)

  // Marca para saber dónde está el inicio del contenido.
  const marca = useRef<HTMLSpanElement>(null)

  // Al cambiar de paso la página vuelve arriba: si no, el paso nuevo aparece a mitad de scroll del anterior.
  useEffect(() => {
    contenedorDeScroll(marca.current)?.scrollTo({ top: 0 })
  }, [paso])

  // Traer la descripción de un archivo o de un texto pegado llena las secciones que ya hay:
  // se conservan sus títulos y su orden, y solo se les pone el contenido.
  const traerDescripcion = (origen: string) => {
    cambiar({ secciones: vacante.secciones.map((seccion) => ({ ...seccion, texto: textoGenerado(seccion) })) })
    notify(`Armamos ${vacante.secciones.length} secciones con ${origen}`, undefined, 'success')
  }

  const salirDe = plantillaId || editando ? 'Salir de la edición' : 'Salir de la creación'

  return (
    // Con «reducir movimiento» en el sistema, el paso cambia sin deslizarse.
    <MotionConfig reducedMotion="user">
    <PageShell>
      <span ref={marca} aria-hidden="true" />
      {/* Título y bajada como en el design system; la bajada dice qué se decide en el paso en que se está.
          Se sale con «Salir de la creación», que pasa por el mismo freno que cualquier otra salida. */}
      <PageHeader
        breadcrumbs={migas}
        // El título es siempre el mismo: el nombre de la vacante se escribe en el paso 1.
        title={esPlantilla ? (plantillaId ? 'Editar plantilla' : 'Crear plantilla') : editando ? 'Editar vacante' : 'Crear vacante'}
        description={PASOS[paso - 1]?.descripcion}
        actions={
          // Desde una plantilla se vuelve al catálogo, que es de donde se llegó.
          <Button variant="outline" onClick={() => navigate(volverA, esPlantilla ? { state: { abrirCatalogo: true } } : undefined)}>
            <HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />
            {salirDe}
          </Button>
        }
      />

      <PageContent>
        {/* Anuncia el paso al avanzar o retroceder: el foco se queda en el botón y el cambio no se oiría. */}
        <span role="status" className="sr-only">
          Paso {paso} de {PASOS.length}: {PASOS[paso - 1]?.titulo}
        </span>

        <Stepper
          value={paso}
          onValueChange={(value) => value <= desbloqueado && setPaso(value)}
          indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}
          className="flex flex-col gap-6"
        >
          {/* Los pasos limpios, en una fila: número, nombre y la línea, como en Crear encuesta (13 oct, Nicolás: «estos
              steps deben ser limpios asi como los de otras secciones como dentro de encuestas»). */}
          <div data-region="Pasos" inert={creandoConIa}>
            <StepperNav className="w-full">
              {PASOS.map((item, index) => (
                <StepperItem
                  key={item.numero}
                  step={item.numero}
                  completed={paso > item.numero}
                  disabled={item.numero > desbloqueado}
                  className="flex-1 last:flex-none"
                >
                  <StepperTrigger className="gap-2" tabIndex={item.numero <= desbloqueado ? 0 : -1}>
                    <StepperIndicator className={STEP_INDICATOR}>{item.numero}</StepperIndicator>
                    <StepperTitle className="text-sm whitespace-nowrap">
                      {item.titulo}
                      {index + 1 !== paso ? <span className="sr-only">{index + 1 < paso ? ', hecho' : ', pendiente'}</span> : null}
                    </StepperTitle>
                  </StepperTrigger>
                  {index < PASOS.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
                </StepperItem>
              ))}
            </StepperNav>
          </div>

          {/* Los tres pasos comparten la rejilla: el trabajo a la izquierda y «Así va la vacante» a la
              derecha, que se queda a la vista al bajar y va sumando lo que se decide. */}
          <StepperContent value={paso}>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="relative min-w-0">
            <div inert={creandoConIa}>
            {/* Cada paso entra desde el lado hacia donde se avanza (16 oct, glow up de movimiento). */}
            <Deslizar clave={`paso-${paso}`} direccion={haciaDonde}>
            {paso === 1 ? (
              <PasoInformacion vacante={vacante} onCambio={cambiar} onCrearConIa={crearConIa} creandoConIa={creandoConIa} />
            ) : paso === 2 ? (
              <PasoDescripcion
                nombreVacante={vacante.nombre.trim()}
                secciones={vacante.secciones}
                onSecciones={(secciones) => cambiar({ secciones })}
                onAbrirArchivo={() => setArchivoAbierto(true)}
                onGenerandoIa={setMensajeIa}
              />
            ) : (
              <PasoProceso
                nombreVacante={vacante.nombre.trim()}
                etapas={vacante.etapas}
                onEtapas={(etapas) => cambiar({ etapas })}
                mostrarErrores={intentoPublicar}
                onGenerandoIa={setMensajeIa}
              />
            )}
            </Deslizar>
            </div>
            {ia ? <CreandoConIa ia={ia} nombre={vacante.nombre.trim()} onCerrar={cerrarIa} /> : null}
            </div>
            <aside aria-label={esPlantilla ? 'Así va la plantilla' : 'Así va la vacante'} className="lg:sticky lg:top-6">
              <ResumenVacante vacante={vacante} paso={paso} kicker={esPlantilla ? 'Así va la plantilla' : undefined} />
            </aside>
            </div>
          </StepperContent>
        </Stepper>

        {/* Siempre al fondo: con un paso corto baja hasta el final de la pantalla en vez de quedar pegada al contenido;
            con uno largo se queda fija abajo mientras se baja. */}
        <PageActionBar className="mt-auto">
          {/* El estado del autoguardado va a la izquierda de la barra; los pasos, a la derecha. Al editar y en las
              plantillas no hay autoguardado: el chip solo aparece para decir que hay cambios sin guardar. */}
          {!sinBorrador || estadoGuardado === 'editando' ? <ChipGuardado estado={estadoGuardado} /> : null}
          {/* Qué falta lo dice el panel «Así va la vacante»: aquí solo se avisa cuando la IA está trabajando en una
              etapa o en la descripción (la vacante entera la anuncia la superposición del formulario). */}
          <div className="ml-auto flex min-w-0 items-center gap-4">
            {mensajeIa ? <AiThinking label={mensajeIa} /> : null}
            {/* «Atrás» con contorno, como en el asistente por pasos del sistema (decisión 6, 5-oct). */}
            {paso > 1 ? (
              <Button variant="outline" disabled={creandoConIa} onClick={anterior}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
                Atrás
              </Button>
            ) : null}
            {/* Al editar, «Guardar cambios» está en los tres pasos: se entra a cambiar una cosa y se guarda ahí mismo. */}
            {paso < PASOS.length ? (
              <Button variant={editando ? 'outline' : 'default'} disabled={bloqueadoPaso1 || creandoConIa} onClick={siguiente}>
                {textoSiguiente[paso] ?? 'Siguiente'}
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
              </Button>
            ) : null}
            {paso === PASOS.length || editando ? (
              // Sin etapas no hay proceso que seguir: el candidato no tendría por dónde avanzar.
              <Button disabled={vacante.etapas.length === 0 || creandoConIa} onClick={publicar}>
                {esPlantilla ? 'Guardar plantilla' : editando ? 'Guardar cambios' : 'Publicar'}
              </Button>
            ) : null}
          </div>
        </PageActionBar>
      </PageContent>

      <DialogoArchivo open={archivoAbierto} onOpenChange={setArchivoAbierto} onUsar={traerDescripcion} />

      {/* La ventana de salida del sistema (13 oct): con borrador cuenta dónde queda la vacante; sin borrador, que lo
          cambiado se pierde. */}
      <DialogoSalir
        abierto={salidaBloqueada !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
        salida={salirDe}
        descripcion={
          !sinBorrador
            ? 'La vacante queda guardada como borrador. Puedes retomarla cuando quieras desde Vacantes.'
            : !esPlantilla
              ? 'Los cambios que hiciste se pierden y la vacante se queda como estaba.'
              : plantillaId
                ? 'Los cambios que hiciste se pierden y la plantilla se queda como estaba.'
                : 'Lo que llenaste se pierde: la plantilla entra al catálogo solo con «Guardar plantilla».'
        }
        onSalir={() => {
          if (!sinBorrador) alSalir?.(vacante)
          salidaBloqueada?.proceed()
        }}
      />
    </PageShell>
    </MotionConfig>
  )
}

Component.displayName = 'AdminSeleccionVacanteCrearPage'
