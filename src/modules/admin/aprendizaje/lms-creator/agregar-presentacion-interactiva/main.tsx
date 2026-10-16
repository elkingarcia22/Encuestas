import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Attachment01Icon,
  BulbIcon,
  Delete02Icon,
  Exchange01Icon,
  File01Icon,
  Globe02Icon,
  JusticeScale01Icon,
  Layers01Icon,
  Megaphone01Icon,
  MoreHorizontalIcon,
  UserAdd01Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
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
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { useTemporizadores } from '@/modules/design-system/estados/temporizadores'
import { COSTO, cancelarRecurso, gastarTokens, useBorrador, volverAAnadirPagina } from '../crear-contenido/components/borrador'
import { aviso } from '../crear-contenido/components/video/piezas'
import { MarcoInmersivo } from '../crear-contenido/components/marco-inmersivo'
import { BarraEditor } from '../crear-contenido/components/barras'
import { enLista } from '@/modules/design-system/patrones/formato'
import { FileUpload, formatoPeso } from '../crear-contenido/components/file-upload'
import {
  ACEPTA_CONTEXTO,
  DURACION_ESTRUCTURA_MS,
  ESTILOS,
  IDEAS_EJEMPLO,
  OPCIONES_CONTEXTO,
  OPCIONES_OBJETIVO,
  contextoUsaArchivos,
  derivarTitulo,
  escenasADiapositivas,
  estilo as buscarEstilo,
  generarEstructura,
  huellaSetup,
  type EstiloId,
  type ModoContexto,
} from '../crear-contenido/components/presentacion/datos'
import {
  RUTA_EDITOR_PRESENTACION,
  guardarSesion,
  leerSesion,
  limpiarSesionPresentacion,
  sesionVacia,
  type SesionPresentacion,
} from '../crear-contenido/components/presentacion/sesion'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { MenuIdeas } from '../compartido/menu-ideas'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { CampoColor, CampoLogo } from './components/campos'
import { PanelEstructura } from './components/panel-estructura'

// «Agregar presentación interactiva» — setup (HU-presentacion-interactiva). A la izquierda la idea y el contexto; a la
// derecha el borrador de diapositivas que arma la IA (mock de 6 s). «Estructurar presentación» es gratis; con el
// borrador vigente el botón pasa a «Generar presentación» y lleva al editor de diapositivas.

// Las ideas de ejemplo son chips: pastillas pequeñas sobre la caja de la idea (igual que en Crear video con IA).
// Íconos de las opciones del setup (todas son del sistema), los mismos de Crear video con IA.
const ICONOS_CONTEXTO: Record<ModoContexto, typeof Globe02Icon> = { internet: Globe02Icon, files: Attachment01Icon, both: Layers01Icon }
const ICONOS_OBJETIVO: Record<string, typeof Globe02Icon> = {
  comprender: BulbIcon,
  aplicar: Wrench01Icon,
  'cambiar-conducta': Exchange01Icon,
  sensibilizar: Megaphone01Icon,
  onboarding: UserAdd01Icon,
  politica: JusticeScale01Icon,
  otro: MoreHorizontalIcon,
}

export function Component() {
  const navigate = useNavigate()
  const { tokens, intencion } = useBorrador()
  const tituloPagina = intencion?.titulo ?? ''
  const programar = useTemporizadores()
  const [sesion, setSesion] = useState<SesionPresentacion>(() => leerSesion() ?? sesionVacia())
  const [estructurando, setEstructurando] = useState(false)
  const actualizar = (cambio: Partial<SesionPresentacion>) => setSesion((s) => ({ ...s, ...cambio }))

  useEffect(() => {
    document.title = 'Agregar presentación interactiva — UBITS'
  }, [])

  // Cada cambio queda en la sesión: ir al editor y volver conserva el borrador.
  useEffect(() => guardarSesion(sesion), [sesion])

  const usaArchivos = contextoUsaArchivos(sesion.contexto)
  const listo = Boolean(sesion.idea.trim()) && (!usaArchivos || sesion.archivosContexto.length > 0)
  const huella = huellaSetup(sesion)
  const conBorrador = sesion.estructura.estado === 'listo' && sesion.estructura.escenas.length > 0
  const desactualizada = conBorrador && sesion.huella != null && sesion.huella !== huella
  const vigente = conBorrador && !desactualizada
  const titulo = derivarTitulo(sesion.idea, tituloPagina)
  const estiloActual = buscarEstilo(sesion.estilo)

  const estructurar = () => {
    if (!listo || estructurando) return
    const estiloPedido = sesion.estilo
    setEstructurando(true)
    programar(() => {
      setSesion((s) => ({ ...s, estructura: { estado: 'listo', escenas: generarEstructura(estiloPedido) }, huella }))
      setEstructurando(false)
    }, DURACION_ESTRUCTURA_MS)
  }

  // Pasar al editor cuesta lo mismo que en Crear video con IA («Continuar»): se cobra al generar.
  const generar = () => {
    if (!vigente || estructurando) return
    if (!gastarTokens(COSTO.presentacion)) {
      aviso('warning', `No tienes suficientes tokens (${COSTO.presentacion} requeridos).`)
      return
    }
    const diapositivas = escenasADiapositivas(sesion.estructura.escenas, sesion.estilo, titulo)
    guardarSesion({ ...sesion, diapositivas, tituloEditor: titulo, activa: 0, contenidoListo: false })
    navigate(RUTA_EDITOR_PRESENTACION)
  }

  const salir = (ruta: string) => {
    limpiarSesionPresentacion()
    navigate(ruta)
  }
  // Sale directo, sin preguntar (el jefe de Dave, 13-oct): la única ventana de salida es la de Crear contenido.
  const destinoSalida = () => (intencion ? volverAAnadirPagina() : cancelarRecurso())
  const pedirSalir = () => salir(destinoSalida())

  // Qué falta para seguir, en la barra: los obligatorios del setup o el estado de la estructura.
  const faltan = [!sesion.idea.trim() && 'la idea de la presentación', usaArchivos && !sesion.archivosContexto.length && 'los archivos de contexto'].filter(
    (f): f is string => Boolean(f),
  )
  const mensaje = estructurando
    ? null
    : faltan.length
      ? { texto: `Te falta ${enLista(faltan)}.`, problema: true }
      : desactualizada
        ? { texto: 'Cambiaste el setup: vuelve a estructurar la presentación para generarla.', problema: true }
        : vigente
          ? { texto: 'Revisa las diapositivas y genera la presentación.', problema: false }
          : { texto: 'Estructurar la presentación es gratis.', problema: false }

  return (
    <MarcoInmersivo
      titulo="Agregar presentación interactiva"
      subtitulo={tituloPagina.trim() || undefined}
      tokens={tokens}
      // Todo el flujo de la presentación vive en la experiencia inmersiva, setup y editor: dos columnas con la
      // estructura al lado no caben en un panel de modal. Mismo marco que el setup del video con IA.
      lleno
      // Una sola salida: la X en círculo de la cabecera, como en las demás experiencias inmersivas (el jefe de Dave,
      // 14-oct). Si se llegó
      // desde «Añadir página», devuelve a ese selector —como en el evaluador roleplay—: salir sin crear nada es volver
      // a elegir, no salir del todo. Sin esa intención no hay a dónde volver y se cancela el recurso.
      cerrar={{ etiqueta: intencion ? 'Volver a añadir página' : 'Salir de la creación', onClick: pedirSalir }}
      barra={
        <BarraEditor
          mensaje={mensaje}
          principal={{
            ia: true,
            texto: estructurando ? 'Estructurando' : vigente ? 'Generar presentación' : 'Estructurar presentación',
            deshabilitado: !listo || estructurando,
            costo: vigente && !estructurando ? COSTO.presentacion : undefined,
            onClick: vigente ? generar : estructurar,
          }}
        />
      }
    >
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] lg:items-start">
        <Frame>
          <FrameHeader>
            <FrameTitle>Qué quieres presentar</FrameTitle>
            <FrameDescription>Con esto la IA arma las diapositivas y sus ideas principales.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-5">
            <Field>
              <div className="flex items-center justify-between gap-2">
                {/* La insignia de obligatorio, hermana de «Opcional». En el design system la norma es marcar solo lo
                    opcional, pero aquí es el único campo del que depende todo el flujo —sin idea no hay nada que
                    estructurar— y conviene que se vea antes de empezar a escribir (Dave, 5-oct). */}
                <FieldLabel>
                  Idea de la presentación
                  <Badge variant="warning-light" size="xs">
                    Obligatorio
                  </Badge>
                </FieldLabel>
                <MenuIdeas ideas={IDEAS_EJEMPLO} onElegir={(idea: string) => actualizar({ idea })} />
              </div>
              {/* La caja del chat de Suite AI, como en el setup del roleplay: lo que se le pide a la IA se escribe
                  siempre en el mismo sitio (Dave, 5-oct). Se sigue generando desde el pie: enviar hace lo mismo que
                  el botón principal. */}
              <Composer
                value={sesion.idea}
                onChange={(v) => actualizar({ idea: v })}
                onSend={() => listo && !estructurando && (vigente ? generar() : estructurar())}
                onVoice={() => undefined}
                ariaLabel="Idea de la presentación"
                placeholder="Describe la idea de la presentación"
                rows={4}
                attach={false}
                voice={false}
                action={null}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="pi-contexto">Contexto</FieldLabel>
              <Select
                value={sesion.contexto}
                onValueChange={(v) => {
                  const modo = v as ModoContexto
                  actualizar(contextoUsaArchivos(modo) ? { contexto: modo } : { contexto: modo, archivosContexto: [] })
                }}
              >
                <SelectTrigger id="pi-contexto" className="w-full">
                  <SelectValue>
                    <HugeiconsIcon icon={ICONOS_CONTEXTO[sesion.contexto]} size={16} aria-hidden="true" className="text-muted-foreground" />
                    {OPCIONES_CONTEXTO.find((o) => o.value === sesion.contexto)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {OPCIONES_CONTEXTO.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <HugeiconsIcon icon={ICONOS_CONTEXTO[o.value]} size={16} aria-hidden="true" className="text-muted-foreground" />
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Elige cómo complementar la idea de la presentación.</FieldDescription>
            </Field>

            {usaArchivos ? (
              <div className="flex flex-col gap-2">
                {sesion.archivosContexto.map((a, i) => (
                  <Attachment key={`${a.nombre}-${i}`} state="done" className="w-full">
                    <AttachmentMedia>
                      <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{a.nombre}</AttachmentTitle>
                      <AttachmentDescription>{formatoPeso(a.peso)}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        aria-label={`Quitar ${a.nombre}`}
                        onClick={() => actualizar({ archivosContexto: sesion.archivosContexto.filter((_, j) => j !== i) })}
                      >
                        <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ))}
                {/* Sin tope de archivos: la zona queda vacía después de cada carga para sumar otro. */}
                <FileUpload
                  compacta
                  acepta={ACEPTA_CONTEXTO}
                  maximoMb={5}
                  formatos="PDF, TXT, MD • Hasta 5 MB"
                  exito={false}
                  archivo={null}
                  onArchivo={(archivo) => {
                    if (archivo) setSesion((s) => ({ ...s, archivosContexto: [...s.archivosContexto, { nombre: archivo.nombre, peso: archivo.peso }] }))
                  }}
                />
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="pi-objetivo">Objetivo</FieldLabel>
              <Select value={sesion.objetivo} onValueChange={(v) => actualizar({ objetivo: String(v) })}>
                <SelectTrigger id="pi-objetivo" className="w-full">
                  <SelectValue>
                    {ICONOS_OBJETIVO[sesion.objetivo] ? (
                      <HugeiconsIcon icon={ICONOS_OBJETIVO[sesion.objetivo]} size={16} aria-hidden="true" className="text-muted-foreground" />
                    ) : null}
                    {OPCIONES_OBJETIVO.find((o) => o.id === sesion.objetivo)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {OPCIONES_OBJETIVO.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      <HugeiconsIcon icon={ICONOS_OBJETIVO[o.id]} size={16} aria-hidden="true" className="text-muted-foreground" />
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sesion.objetivo === 'otro' ? (
                <Textarea
                  aria-label="Otro objetivo"
                  rows={3}
                  placeholder="¿Qué debe saber o poder hacer la persona después de ver el video?"
                  value={sesion.objetivoOtro}
                  onChange={(e) => actualizar({ objetivoOtro: e.target.value })}
                />
              ) : null}
            </Field>

            <Separator />

            <Field>
              <FieldLabel htmlFor="pi-estilo">Estilo de la presentación</FieldLabel>
              <Select value={sesion.estilo} onValueChange={(v) => actualizar({ estilo: v as EstiloId })}>
                <SelectTrigger id="pi-estilo" className="w-full">
                  <SelectValue>
                    <HugeiconsIcon icon={estiloActual.icon} size={16} aria-hidden="true" />
                    {estiloActual.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {ESTILOS.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <HugeiconsIcon icon={e.icon} size={16} aria-hidden="true" />
                      <span className="flex flex-col">
                        <Text as="span" size="sm">
                          {e.label}
                        </Text>
                        <Text as="span" size="xs" variant="muted">
                          {e.descripcion}
                        </Text>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{estiloActual.descripcion}</FieldDescription>
            </Field>

            <Separator />

            <CampoColor valor={sesion.acento} onCambio={(acento) => actualizar({ acento })} />

            <Separator />

            <Field>
              <FieldLabel>
                Logo de la empresa
                <Badge variant="secondary" size="xs">
                  Opcional
                </Badge>
              </FieldLabel>
              <CampoLogo logo={sesion.logo} onCambio={(logo) => actualizar({ logo })} />
              {sesion.logo ? (
                <Text size="xs" variant="muted">
                  Logo listo para la presentación
                </Text>
              ) : null}
            </Field>
          </FramePanel>
        </Frame>

        {/* Queda a la vista mientras baja el formulario, con el mismo aire arriba (top-6) y abajo (el mt-8 de la barra),
            y las diapositivas hacen scroll por dentro. La tarjeta de la librería trae overflow-hidden: se fuerza el scroll. */}
        <div className="lg:sticky lg:top-6">
          <Frame className="gap-0 py-0! lg:h-[calc(100dvh-12.5rem)] lg:overflow-y-auto!">
            {/* Un solo encabezado para la columna: antes el marco decía «Estructura» y el panel repetía
                «Borrador de diapositivas» justo debajo (Dave, 9-oct). */}
            <FrameHeader className="pt-3">
              <FrameTitle>{conBorrador ? 'Borrador de diapositivas' : 'Estructura'}</FrameTitle>
              <FrameDescription>
                {conBorrador ? 'Echa un vistazo y cambia lo que necesites.' : 'Las diapositivas y sus ideas, antes de generar la presentación.'}
              </FrameDescription>
            </FrameHeader>
            <FramePanel className="flex flex-1 flex-col p-6!">
              {estructurando ? (
                <Empty className="min-h-96 flex-1" aria-label="Estructurando presentación">
                  <EmptyHeader>
                    <EmptyMedia>
                      <AiThinking label="Estructurando presentación" size="md" />
                    </EmptyMedia>
                    <EmptyDescription>Preparando las diapositivas y las ideas principales…</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : conBorrador ? (
                <PanelEstructura
                  escenas={sesion.estructura.escenas}
                  estilo={sesion.estilo}
                  tituloPresentacion={titulo}
                  acento={sesion.acento}
                  logo={sesion.logo}
                  desactualizada={desactualizada}
                  onReestructurar={estructurar}
                  onCambiar={(escenas) => actualizar({ estructura: { estado: 'listo', escenas } })}
                />
              ) : (
                <Empty className="min-h-96 flex-1">
                  <EmptyHeader>
                    {/* Icono glass, como en los demás estados vacíos. */}
                    <EmptyMedia variant="default">
                      <ImagenGlass nombre="glass-gallery" />
                    </EmptyMedia>
                    <EmptyTitle>Aquí verás la estructura de tu presentación</EmptyTitle>
                    <EmptyDescription>
                      Cuando estructures la presentación, podrás revisar las diapositivas y las ideas principales antes de generar.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </FramePanel>
          </Frame>
        </div>
      </div>
    </MarcoInmersivo>
  )
}

Component.displayName = 'LmsAgregarPresentacionInteractivaPage'
