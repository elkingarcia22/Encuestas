import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Attachment01Icon,
  BankIcon,
  Briefcase01Icon,
  BubbleChatIcon,
  Building03Icon,
  BulbIcon,
  Clock01Icon,
  ComputerIcon,
  CrownIcon,
  CustomerService01Icon,
  Delete02Icon,
  Exchange01Icon,
  Factory01Icon,
  File01Icon,
  FlashIcon,
  Globe02Icon,
  Hospital01Icon,
  InformationCircleIcon,
  JusticeScale01Icon,
  Layers01Icon,
  Megaphone01Icon,
  MoreHorizontalIcon,
  Mortarboard01Icon,
  PaintBoardIcon,
  Plant01Icon,
  Restaurant01Icon,
  Rocket01Icon,
  SchoolTieIcon,
  Shield01Icon,
  ShoppingBasket01Icon,
  SlidersHorizontalIcon,
  Store01Icon,
  Target02Icon,
  TruckIcon,
  UserAdd01Icon,
  UserGroupIcon,
  Wallet01Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertAction,
  AlertDescription,
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Text,
  Textarea,
  cn,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { AiThinking } from '@/shared/components/AiThinking'
import { BASE_LMS, cancelarRecurso, gastarTokens, getBorrador, useBorrador, volverAAnadirPagina } from '../borrador'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { MenuIdeas } from '@/modules/admin/aprendizaje/lms-creator/compartido/menu-ideas'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { MarcoInmersivo } from '../marco-inmersivo'
import { BarraEditor, type AccionPrincipal } from '../barras'
import { enLista } from '@/modules/design-system/patrones/formato'
import { formatoPeso, mensajeDeError } from '../file-upload'
import { useFileUpload } from '@ubits/flux-ui/hooks'
import { BorradorEscenas } from './borrador-escenas'
import {
  AUDIENCIAS,
  CONTEXTOS,
  COSTO_VIDEO,
  DURACIONES,
  IDEAS_EJEMPLO,
  MAXIMO_CONTEXTO,
  OBJETIVOS,
  OTRO,
  SECTORES_ALFABETICO,
  TIEMPO,
  TONOS,
  admiteAvatar,
  avatarPorDefecto,
  numero,
  vozPorId,
  type DuracionId,
  type ModoContexto,
} from './datos'
import { aviso } from './piezas'
import { CampoAvatar, CampoEstilo, CampoVoz } from './selectores'
import {
  SETUP_VACIO,
  crearProyecto,
  encolar,
  guardarSesion,
  guardarSetup,
  huellaSetup,
  leerSesion,
  leerSetupGuardado,
  marcarActiva,
  sesionActiva,
  type Proyecto,
  type Sesion,
  type Setup,
} from './proyecto'

// «Crear video con IA» (HU-LMS-001, recurso Video): el setup a la izquierda y el borrador de escenas a la derecha.
// «Preparar escenas» (gratis) arma el borrador; cualquier cambio posterior del setup pide regenerarlo; «Continuar al
// editor» cuesta 320 tokens y abre el editor con las escenas en cola. Cerrar no crea página: el borrador queda en «Tus
// videos recientes».

const ACEPTA_CONTEXTO = '.pdf,.txt,.md'

type Adjunto = { nombre: string; peso: number }

function estadoInicial(draftId: string | null): { setup: Setup; sesion: Sesion | null } {
  const sesion = leerSesion(draftId) ?? leerSesion(sesionActiva())
  if (sesion && sesion.fase === 'borrador') return { setup: sesion.setup, sesion }
  return { setup: leerSetupGuardado() ?? { ...SETUP_VACIO }, sesion: null }
}

/** Selector simple con su etiqueta: Objetivo, Audiencia, Tono, Sector, Contexto, Duración. */
// Las ideas de ejemplo son chips: pastillas pequeñas sobre la caja de la idea, no botones de tamaño normal.
// Íconos de las opciones del setup (todas son del sistema).
const ICONOS_CONTEXTO: Record<string, typeof Clock01Icon> = { internet: Globe02Icon, archivos: Attachment01Icon, ambos: Layers01Icon }
const ICONOS_OBJETIVO: Record<string, typeof Clock01Icon> = {
  comprender: BulbIcon,
  aplicar: Wrench01Icon,
  conducta: Exchange01Icon,
  sensibilizar: Megaphone01Icon,
  onboarding: UserAdd01Icon,
  politica: JusticeScale01Icon,
  otro: MoreHorizontalIcon,
}
const ICONOS_AUDIENCIA: Record<string, typeof Clock01Icon> = {
  empresa: Building03Icon,
  liderazgo: CrownIcon,
  nuevos: UserAdd01Icon,
  operativos: Factory01Icon,
  staff: Briefcase01Icon,
  mixtos: UserGroupIcon,
  otro: MoreHorizontalIcon,
}
const ICONOS_TONO: Record<string, typeof Clock01Icon> = {
  cercano: BubbleChatIcon,
  formal: SchoolTieIcon,
  didactico: Mortarboard01Icon,
  motivador: Rocket01Icon,
  directo: Target02Icon,
  otro: MoreHorizontalIcon,
}
const ICONOS_SECTOR: Record<string, typeof Clock01Icon> = {
  staff: Briefcase01Icon,
  agro: Plant01Icon,
  propiedad: Building03Icon,
  consumo: ShoppingBasket01Icon,
  creatividad: PaintBoardIcon,
  energia: FlashIcon,
  gobierno: BankIcon,
  hosteleria: Restaurant01Icon,
  industria: Factory01Icon,
  retail: Store01Icon,
  salud: Hospital01Icon,
  seguridad: Shield01Icon,
  seguros: Wallet01Icon,
  servicios: CustomerService01Icon,
  tech: ComputerIcon,
  transporte: TruckIcon,
}

function Selector({
  id,
  etiqueta,
  valor,
  opciones,
  onValor,
  deshabilitado,
  icono,
  ayuda,
  iconos,
  opcional,
}: {
  id: string
  etiqueta: string
  valor: string
  opciones: readonly { id: string; label: string }[]
  onValor: (v: string) => void
  /** Ícono por opción (solo opciones del sistema): el campo muestra el de la elegida y la lista repite cada uno. */
  iconos?: Record<string, typeof Clock01Icon>
  deshabilitado?: boolean
  icono?: typeof Clock01Icon
  ayuda?: string
  /** Se puede dejar sin elegir. Va con la insignia «Opcional» del design system, no con un «(opcional)» en el texto. */
  opcional?: boolean
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {etiqueta}
        {opcional ? (
          <Badge variant="secondary" size="xs">
            Opcional
          </Badge>
        ) : null}
      </FieldLabel>
      <Select value={valor} onValueChange={(v) => onValor(String(v))} disabled={deshabilitado}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue>
            {(v) => {
              const deOpcion = iconos?.[String(v)] ?? icono
              return (
                <span className="flex min-w-0 items-center gap-2">
                  {deOpcion ? <HugeiconsIcon icon={deOpcion} size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" /> : null}
                  <span className="truncate">{opciones.find((o) => o.id === v)?.label ?? ''}</span>
                </span>
              )
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {opciones.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {iconos?.[o.id] ? <HugeiconsIcon icon={iconos[o.id]} size={16} aria-hidden="true" className="text-muted-foreground" /> : null}
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {ayuda ? <FieldDescription>{ayuda}</FieldDescription> : null}
    </Field>
  )
}

function TextoConContador({
  valor,
  onValor,
  placeholder,
  etiqueta,
  deshabilitado,
}: {
  valor: string
  onValor: (v: string) => void
  placeholder: string
  etiqueta: string
  deshabilitado?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <Textarea aria-label={etiqueta} rows={3} maxLength={MAXIMO_CONTEXTO} placeholder={placeholder} value={valor} disabled={deshabilitado} onChange={(e) => onValor(e.target.value)} />
      <Text as="span" size="xs" variant="muted" className="self-end tabular-nums">
        {numero(valor.length)}/{numero(MAXIMO_CONTEXTO)}
      </Text>
    </div>
  )
}

export function VistaSetup() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { tokens, intencion } = useBorrador()
  const inicial = useMemo(() => estadoInicial(params.get('draftId')), [params])
  const [setup, setSetup] = useState<Setup>(inicial.setup)
  const [sesion, setSesion] = useState<Sesion | null>(inicial.sesion)
  const [preparando, setPreparando] = useState(false)
  const [abriendo, setAbriendo] = useState(false)
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>(() => inicial.setup.adjuntos.map((nombre) => ({ nombre, peso: 0 })))
  const [errorAdjunto, setErrorAdjunto] = useState<string | null>(null)
  const tiempos = useRef<number[]>([])

  useEffect(() => {
    document.title = 'Crear video con IA · UBITS'
    const pendientes = tiempos.current
    return () => pendientes.forEach((t) => window.clearTimeout(t))
  }, [])

  // Sin borrador todavía, el formulario se autoguarda para rehidratarse al volver.
  useEffect(() => {
    if (!sesion) guardarSetup(setup)
  }, [setup, sesion])

  const ocupado = preparando || abriendo
  const conArchivos = setup.contexto !== 'internet'
  const desactualizado = Boolean(sesion && sesion.snapshot !== huellaSetup(setup))
  const listo = setup.idea.trim().length > 0 && (!conArchivos || adjuntos.length > 0) && (setup.objetivo !== OTRO || setup.objetivoOtro.trim().length > 0)

  const cambiar = (cambio: Partial<Setup>) =>
    setSetup((previo) => {
      const siguiente = { ...previo, ...cambio }
      // Con el avatar prendido, cambiar la voz de género, el sector o el estilo reasigna el avatar por defecto.
      if (!admiteAvatar(siguiente.estilo)) siguiente.avatarId = null
      else if (previo.avatarId != null && !('avatarId' in cambio)) {
        const generoAntes = vozPorId(previo.voz).genero
        const generoAhora = vozPorId(siguiente.voz).genero
        if (generoAntes !== generoAhora || previo.sector !== siguiente.sector) siguiente.avatarId = avatarPorDefecto(siguiente.sector, generoAhora).id
      }
      return siguiente
    })

  const guardarProyecto = (p: Proyecto) => {
    if (!sesion) return
    const siguiente = { ...sesion, proyecto: p }
    setSesion(siguiente)
    guardarSesion(siguiente)
  }

  const preparar = () => {
    if (!listo || ocupado) return
    const final = { ...setup, adjuntos: adjuntos.map((a) => a.nombre) }
    // Atajo del playground: la idea «Dave» salta directo al editor con una sola escena de imagen, sin cobro.
    if (final.idea.trim().toLowerCase() === 'dave') {
      const base = crearProyecto(final, intencion?.titulo)
      const proyecto = { ...base, escenas: base.escenas.slice(0, 1) }
      const nueva: Sesion = { id: sesion?.id ?? proyecto.id, fase: 'editor', setup: final, proyecto, snapshot: huellaSetup(final) }
      guardarSesion(nueva)
      marcarActiva(nueva.id)
      guardarSetup(null)
      navigate(`${BASE_LMS}/agregar-video/editor?draftId=${encodeURIComponent(nueva.id)}`)
      return
    }
    setPreparando(true)
    tiempos.current.push(
      window.setTimeout(() => {
        const proyecto = crearProyecto(final, getBorrador().intencion?.titulo)
        // Regenerar actualiza el mismo borrador: no duplica «Tus videos recientes».
        const nueva: Sesion = { id: sesion?.id ?? proyecto.id, fase: 'borrador', setup: final, proyecto, snapshot: huellaSetup(final) }
        guardarSesion(nueva)
        marcarActiva(nueva.id)
        guardarSetup(null)
        setSesion(nueva)
        setPreparando(false)
      }, TIEMPO.borrador),
    )
  }

  const continuar = () => {
    if (!sesion?.proyecto || desactualizado || ocupado) return
    if (!gastarTokens(COSTO_VIDEO.editor)) {
      aviso('warning', `No tienes suficientes tokens (${COSTO_VIDEO.editor} requeridos).`)
      return
    }
    setAbriendo(true)
    const siguiente: Sesion = { ...sesion, fase: 'editor', proyecto: encolar(sesion.proyecto, Date.now() + TIEMPO.abrirEditor) }
    guardarSesion(siguiente)
    tiempos.current.push(window.setTimeout(() => navigate(`${BASE_LMS}/agregar-video/editor?draftId=${encodeURIComponent(siguiente.id)}`), TIEMPO.abrirEditor))
  }

  // El hook oficial de flux-ui (el del FileUpload del Storybook): selector múltiple, formato y peso por archivo.
  const [{ errors: erroresArchivo }, cargaArchivos] = useFileUpload({
    accept: ACEPTA_CONTEXTO,
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    onFilesAdded: (agregados) => {
      const nuevos: Adjunto[] = agregados
        .map((a) => a.file)
        .filter((f): f is File => f instanceof File)
        .map((f) => ({ nombre: f.name, peso: f.size }))
      if (!nuevos.length) return
      setErrorAdjunto(null)
      const todos = [...adjuntos, ...nuevos]
      setAdjuntos(todos)
      cambiar({ adjuntos: todos.map((a) => a.nombre) })
    },
  })

  useEffect(() => {
    if (erroresArchivo[0]) setErrorAdjunto(mensajeDeError(erroresArchivo[0], ACEPTA_CONTEXTO, 5))
  }, [erroresArchivo])

  const quitarAdjunto = (i: number) => {
    const quedan = adjuntos.filter((_, j) => j !== i)
    setAdjuntos(quedan)
    cambiar({ adjuntos: quedan.map((a) => a.nombre) })
  }

  const tieneBorrador = Boolean(sesion?.proyecto)
  const principal: AccionPrincipal = tieneBorrador
    ? {
        ia: true,
        texto: abriendo ? 'Abriendo editor' : 'Continuar',
        costo: abriendo ? undefined : COSTO_VIDEO.editor,
        deshabilitado: desactualizado || ocupado || tokens < COSTO_VIDEO.editor,
        onClick: continuar,
      }
    : { ia: true, texto: preparando ? 'Preparando escenas' : 'Preparar escenas', deshabilitado: !listo || ocupado, onClick: preparar }

  // Qué falta para seguir, en la barra: los obligatorios del setup o el estado del borrador.
  const faltan = [
    !setup.idea.trim() && 'la idea del video',
    conArchivos && !adjuntos.length && 'los archivos de contexto',
    setup.objetivo === OTRO && !setup.objetivoOtro.trim() && 'el objetivo',
  ].filter((f): f is string => Boolean(f))
  const mensaje = ocupado
    ? null
    : faltan.length
      ? { texto: `Te falta ${enLista(faltan)}.`, problema: true }
      : desactualizado
        ? { texto: 'Cambiaste el setup: regenera el borrador para continuar al editor.', problema: true }
        : tieneBorrador && tokens < COSTO_VIDEO.editor
          ? { texto: `No tienes suficientes tokens (${COSTO_VIDEO.editor} requeridos).`, problema: true }
          : tieneBorrador
            ? { texto: 'Revisa el guion de cada escena y continúa al editor.', problema: false }
            : { texto: 'Preparar las escenas es gratis.', problema: false }

  // Llega desde «Añadir página»: volver lo reabre; si no, cerrar sin crear página.
  const cancelar = () => navigate(cancelarRecurso())

  return (
    <MarcoInmersivo
      // Pantalla completa de verdad: el setup y el borrador de escenas se reparten el ancho en dos columnas.
      lleno
      titulo="Crear video con IA"
      subtitulo={intencion?.titulo?.trim() || undefined}
      tokens={tokens}
      // Una sola salida: la X en círculo de la cabecera, como en las demás experiencias inmersivas (el jefe de Dave,
      // 14-oct). Si se llegó desde «Añadir página» vuelve a ese selector; si no, sale sin crear página.
      cerrar={
        intencion
          ? { etiqueta: 'Volver a añadir página', onClick: () => navigate(volverAAnadirPagina()) }
          : { etiqueta: 'Salir de la creación', onClick: cancelar }
      }
      barra={
        <BarraEditor
          mensaje={mensaje}
          principal={principal}
        />
      }
    >
      {/* El mismo reparto que el setup de Presentación interactiva, que es la experiencia hermana: se parte en dos
          columnas en `lg` (1024) y no en un 1101 escrito a mano, las columnas llevan `minmax(0,…)` para que puedan
          encogerse, y la alineación va en la rejilla y no suelta en cada tarjeta. Antes, entre 1024 y 1100, una
          pantalla iba en dos columnas y la otra en una. */}
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] lg:items-start">
        <Frame>
          <FrameHeader>
            <FrameTitle>Qué quieres contar</FrameTitle>
            <FrameDescription>Con esto la IA escribe el guion y arma las escenas.</FrameDescription>
          </FrameHeader>
          <FramePanel>
        <FieldGroup className="gap-5" inert={ocupado || undefined}>
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>
                Idea del video
                {/* Ámbar, no gris: gris es el de «Opcional», y los dos juntos en la misma pantalla —aquí el logo de
                    la empresa lo es— se leían igual. Ámbar porque es el color con el que el playground ya dice
                    «obligatorio»: la insignia de un contenido obligatorio del plan, en la vista del colaborador, es
                    `warning-light` en todas las ramas del equipo (Dave, 5-oct). */}
                <Badge variant="warning-light" size="xs">
                  Obligatorio
                </Badge>
              </FieldLabel>
              <MenuIdeas ideas={IDEAS_EJEMPLO.map((i) => ({ label: i.label, prompt: i.texto }))} onElegir={(idea) => cambiar({ idea })} />
            </div>
            {/* La caja del chat de Suite AI, como en el setup del roleplay. El 1-oct era un campo de texto normal,
                con el argumento de que aquí no se le habla a la IA; al ver las dos pantallas juntas gana que lo que
                se le pide a la IA se escriba siempre en el mismo sitio (Dave, 5-oct). Se sigue generando desde el
                pie: enviar hace lo mismo que el botón principal. */}
            <Composer
              value={setup.idea}
              onChange={(v) => cambiar({ idea: v })}
              onSend={() => !principal.deshabilitado && principal.onClick()}
              onVoice={() => undefined}
              ariaLabel="Idea del video"
              placeholder="Describe la idea del video"
              rows={4}
              attach={false}
              voice={false}
              action={null}
            />
          </Field>

          <Selector
            id="video-contexto"
            etiqueta="Contexto"
            valor={setup.contexto}
            opciones={CONTEXTOS}
            iconos={ICONOS_CONTEXTO}
            ayuda="Elige cómo complementar la idea del video."
            onValor={(v) => {
              cambiar({ contexto: v as ModoContexto, ...(v === 'internet' ? { adjuntos: [] } : {}) })
              if (v === 'internet') setAdjuntos([])
            }}
          />
          {conArchivos ? (
            <div className="-mt-2 flex flex-col gap-2">
              <Input {...cargaArchivos.getInputProps({ className: 'hidden', tabIndex: -1, 'aria-hidden': true })} />
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={cargaArchivos.openFileDialog}>
                  <HugeiconsIcon icon={Attachment01Icon} data-icon="inline-start" aria-hidden="true" />
                  Adjuntar archivos
                </Button>
                <Text as="span" size="xs" variant="muted">
                  PDF, TXT, MD • Hasta 5 MB
                </Text>
              </div>
              {adjuntos.length ? (
                <AttachmentGroup className="flex flex-col gap-2">
                  {adjuntos.map((a, i) => (
                    <Attachment key={`${a.nombre}-${i}`} size="sm">
                      <AttachmentMedia>
                        <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{a.nombre}</AttachmentTitle>
                        {a.peso ? <AttachmentDescription>{formatoPeso(a.peso)}</AttachmentDescription> : null}
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction aria-label={`Quitar ${a.nombre}`} onClick={() => quitarAdjunto(i)}>
                          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </AttachmentGroup>
              ) : null}
              {errorAdjunto ? (
                <Text as="p" size="sm" variant="destructive" role="alert">
                  {errorAdjunto}
                </Text>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Selector id="video-objetivo" etiqueta="Objetivo" valor={setup.objetivo} opciones={OBJETIVOS} iconos={ICONOS_OBJETIVO} onValor={(v) => cambiar({ objetivo: v })} />
            {setup.objetivo === OTRO ? (
              <TextoConContador
                etiqueta="Otro objetivo"
                placeholder="¿Qué debe saber o poder hacer la persona después de ver el video?"
                valor={setup.objetivoOtro}
                onValor={(v) => cambiar({ objetivoOtro: v })}
              />
            ) : null}
          </div>

          <Selector
            id="video-duracion"
            etiqueta="Duración"
            valor={setup.duracion}
            opciones={DURACIONES}
            icono={Clock01Icon}
            onValor={(v) => cambiar({ duracion: v as DuracionId })}
          />

          <CampoEstilo valor={setup.estilo} onValor={(estilo) => cambiar({ estilo })} deshabilitado={ocupado} />
          <CampoVoz valor={setup.voz} onValor={(voz) => cambiar({ voz })} deshabilitado={ocupado} />

          {/* El acordeón de flux-ui en su variante «Advanced accordion with custom icons and badges»: el ítem en su
              propia tarjeta con borde, el icono en un cuadro gris, el título en semibold y una insignia al lado. */}
          <Accordion className="border-0">
            <AccordionItem value="avanzada" className="rounded-lg border bg-card px-2 **:data-[slot=accordion-content]:p-0!">
              <AccordionTrigger className="items-center px-1 py-3 font-semibold hover:no-underline">
                <span className="flex min-w-0 items-center gap-3 text-left">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <HugeiconsIcon icon={SlidersHorizontalIcon} size={16} aria-hidden="true" className="text-muted-foreground" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      Configuración avanzada
                      <Badge variant="secondary" size="xs">
                        Opcional
                      </Badge>
                    </span>
                    <Text as="span" size="xs" variant="muted" weight="normal">
                      {admiteAvatar(setup.estilo)
                        ? 'Personaliza la audiencia, el tono, el sector, el avatar y qué evitar.'
                        : 'Personaliza la audiencia, el tono, el sector y qué evitar.'}
                    </Text>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5 pt-2 pb-4 pl-11">
                  <div className="flex flex-col gap-2">
                    <Selector id="video-audiencia" etiqueta="Audiencia" opcional valor={setup.audiencia} opciones={AUDIENCIAS} iconos={ICONOS_AUDIENCIA} onValor={(v) => cambiar({ audiencia: v })} />
                    {setup.audiencia === OTRO ? (
                      <TextoConContador
                        etiqueta="Otra audiencia"
                        placeholder="¿Para quién es? Cargo, nivel de experiencia, contexto del equipo."
                        valor={setup.audienciaOtro}
                        onValor={(v) => cambiar({ audienciaOtro: v })}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Selector id="video-tono" etiqueta="Tono" opcional valor={setup.tono} opciones={TONOS} iconos={ICONOS_TONO} onValor={(v) => cambiar({ tono: v })} />
                    {setup.tono === OTRO ? (
                      <TextoConContador
                        etiqueta="Otro tono"
                        placeholder="¿Cómo debe sonar? Cercano, formal, retador, con humor…"
                        valor={setup.tonoOtro}
                        onValor={(v) => cambiar({ tonoOtro: v })}
                      />
                    ) : null}
                  </div>
                  <Selector id="video-sector" etiqueta="Sector" opcional valor={setup.sector} opciones={SECTORES_ALFABETICO} iconos={ICONOS_SECTOR} onValor={(v) => cambiar({ sector: v })} />
                  {admiteAvatar(setup.estilo) ? (
                    <CampoAvatar
                      valor={setup.avatarId}
                      estilo={setup.estilo}
                      sector={setup.sector}
                      genero={vozPorId(setup.voz).genero}
                      onValor={(avatarId) => cambiar({ avatarId })}
                      deshabilitado={ocupado}
                    />
                  ) : null}
                  <Field>
                    <FieldLabel>
                      Qué evitar
                      <Badge variant="secondary" size="xs">
                        Opcional
                      </Badge>
                    </FieldLabel>
                    <TextoConContador
                      etiqueta="Qué evitar"
                      placeholder="Temas, ejemplos o palabras que prefieres dejar por fuera."
                      valor={setup.evitar}
                      onValor={(v) => cambiar({ evitar: v })}
                    />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FieldGroup>
          </FramePanel>
        </Frame>

        <Frame
          className={cn(
            // La tarjeta de la librería trae overflow-hidden: sin forzarlo, las escenas de abajo quedan cortadas y no hay scroll.
            'relative min-h-80 gap-0 overflow-y-auto! py-0!',
            // Queda a la vista mientras baja el formulario, con el mismo aire arriba (top-6) y abajo (el mt-8 de la barra):
            // si fuera más alto, al llegar al final la columna lo empujaría hacia la cabecera.
          'lg:sticky lg:top-6 lg:h-[calc(100dvh-12.5rem)]',
          )}
        >
          {/* Un solo encabezado para la columna: el panel ya no lo repite dentro (Dave, 9-oct). */}
          <FrameHeader>
            <FrameTitle>Borrador de escenas</FrameTitle>
            <FrameDescription>
              {sesion?.proyecto ? 'Echa un vistazo y cambia lo que necesites.' : 'El guion y las escenas, antes de pasar al editor.'}
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-1 flex-col p-0!">
          {desactualizado && !preparando ? (
            <div className="sticky top-0 z-10 bg-card p-6 pb-0">
              <Alert variant="info">
                <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
                <AlertDescription>
                  <p>Cambiaste el setup. Regenera el borrador (gratis) para continuar al editor.</p>
                </AlertDescription>
                <AlertAction>
                  {/* Lo hace la IA: el secundario de IA (el orbe ya marca la acción; sin el icono de recargar). */}
                  <BotonIaSecundario size="sm" disabled={!listo} onClick={preparar}>
                    Regenerar borrador
                  </BotonIaSecundario>
                </AlertAction>
              </Alert>
            </div>
          ) : null}
          {preparando ? (
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia>
                  <AiThinking label={sesion ? 'Regenerando borrador' : 'Preparando escenas'} size="md" />
                </EmptyMedia>
                <EmptyDescription>Preparando el guion y las escenas…</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : sesion?.proyecto ? (
            <BorradorEscenas proyecto={sesion.proyecto} onProyecto={guardarProyecto} deshabilitado={desactualizado || abriendo} />
          ) : (
            <Empty className="flex-1">
              <EmptyHeader>
                {/* Icono glass, como en los demás estados vacíos: hay sitio para una ilustración y se lee más amable
                    que un símbolo de línea. */}
                <EmptyMedia variant="default">
                  <ImagenGlass nombre="glass-video" />
                </EmptyMedia>
                <EmptyTitle>Aquí verás el borrador de tus escenas</EmptyTitle>
                <EmptyDescription>Cuando prepares las escenas, podrás revisar el guion, el tipo y el orden antes de continuar al editor.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          </FramePanel>
        </Frame>
      </div>
    </MarcoInmersivo>
  )
}
