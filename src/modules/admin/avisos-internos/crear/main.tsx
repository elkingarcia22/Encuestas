import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, Image01Icon, Megaphone01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldLabel,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { formatBytes, useFileUpload } from '@ubits/flux-ui/hooks'
import { notify } from '@/shared/components/notify'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ChipGuardado, useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'
import { BotonSalirCreacion, VentanaSalir } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { COSTO, useBorrador } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/borrador'
import { GeneradorImagenIa } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/generador-imagen-ia'
import { TokenBadge } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/tokens'
import { USUARIO_ACTUAL, VIDEO_DE_PRUEBA, type Multimedia } from '../components/datos'
import { VistaPrevia } from '../components/piezas'
import { buscarAviso, guardarAviso, hoy, nuevoId, registro } from '../components/estado'

// Avisos internos › Crear aviso (y editar): **una pantalla**, no un diálogo.
//
// Antes era un modal, de cuando todavía no teníamos la receta de formulario seccionado + vista previa. Con ella, el
// modal se quedaba corto: un formulario de cuatro campos, una vista previa y tres pestañas de multimedia no caben en
// una caja centrada sin que algo se apriete, y encima el modal no puede decir qué falta (Dave, 2-oct).
//
// Es la misma receta de Crear contenido y Crear ruta, con la única diferencia de que **aquí no hay pasos**: un aviso
// se llena de una. Por eso no lleva stepper ni barra de avance entre pasos, pero sí todo lo demás:
//
//  · El formulario a la izquierda, **en secciones**: cada una en su marco, con el título y la bajada sobre el fondo
//    gris y los campos dentro del panel blanco, para que se lean como dos tareas y no como una lista de campos.
//  · La **vista previa a la derecha**, pegada al hacer scroll, con la tarjeta tal como la verán los colaboradores y
//    debajo lo que falta para poder publicar.
//  · La **barra de acciones** abajo y la salida arriba a la derecha, con su confirmación.
//
// Un aviso **sí puede quedar en borrador** —es uno de sus cuatro estados, junto a Publicado, Programado y
// Archivado—. Como en los demás flujos de creación, el borrador **se guarda solo** desde lo primero que se escribe:
// la barra queda homologada con ellas, el chip de guardado a la izquierda y «Publicar aviso» a la derecha, y nada
// más (Dave, 7-oct). Por eso salir no advierte que algo se pierde: cuenta dónde quedó. La excepción es editar un
// aviso que ya se ve: ahí no se autoguarda —cada tecla saldría en el inicio de todos—, los cambios se aplican con
// «Guardar cambios» y salir sí avisa que se pierden.

const MAX_TITULO = 50
const MAX_DESCRIPCION = 400
const MAX_PESO = 5 * 1024 * 1024
const FORMATOS = 'image/png,image/jpeg'

// El hook de la librería avisa en inglés; aquí se dice en español lo que puede fallar con estos ajustes.
function mensajeDeError(error: string) {
  if (error.includes('exceeds')) return `La imagen supera el máximo de ${formatBytes(MAX_PESO, 0)}.`
  if (error.includes('not an accepted')) return 'Formato no admitido: elige un PNG o un JPEG.'
  return 'No se pudo cargar la imagen.'
}

type Datos = { titulo: string; descripcion: string; link: string; multimedia: Multimedia | null }

type Pestana = 'ia' | 'imagen' | 'video'

const VACIO: Datos = { titulo: '', descripcion: '', link: '', multimedia: null }

const RUTA_LISTA = '/admin/avisos-internos'

export function Component() {
  const navigate = useNavigate()
  // Con `id` en la dirección se está editando uno que ya existe; sin él, creando uno nuevo.
  const { id } = useParams()
  const aviso = useMemo(() => buscarAviso(id), [id])
  const editando = Boolean(aviso)
  // Un aviso que ya se vio (publicado, programado o archivado) solo se edita; uno en borrador todavía puede publicarse.
  const publicado = Boolean(aviso) && aviso?.estado !== 'Borrador'

  const [datos, setDatos] = useState<Datos>(() =>
    aviso ? { titulo: aviso.titulo, descripcion: aviso.descripcion, link: aviso.link, multimedia: aviso.multimedia } : VACIO,
  )
  const [pestana, setPestana] = useState<Pestana>(() => {
    const m = aviso?.multimedia
    return m?.tipo === 'video' ? 'video' : m?.tipo === 'imagen' && m.prompt ? 'ia' : 'imagen'
  })
  // El borrador que se va guardando solo: el que se abrió, o el que se crea con lo primero que se escribe.
  const borradorId = useRef<string | null>(publicado ? null : (aviso?.id ?? null))
  const [hayBorrador, setHayBorrador] = useState(Boolean(borradorId.current))
  const [estadoGuardado, avisarCambio] = useGuardadoSimulado()
  const { tokens } = useBorrador()
  // Salida deliberada (confirmada o recién publicada): el guardia no vuelve a preguntar.
  const saliendo = useRef(false)

  useEffect(() => {
    document.title = `${editando ? 'Editar' : 'Crear'} aviso · Playground UX`
  }, [editando])

  // Si se escribió algo. Lo que decide si salir pregunta: quien solo entró a mirar se va de una.
  const tocado = editando
    ? datos.titulo !== aviso?.titulo || datos.descripcion !== aviso?.descripcion || datos.link !== aviso?.link || datos.multimedia !== aviso?.multimedia
    : Boolean(datos.titulo.trim() || datos.descripcion.trim() || datos.link.trim() || datos.multimedia)

  // La imagen que está puesta, según de dónde vino: cada pestaña muestra solo la suya y la última que se elige gana.
  const imagenIa = datos.multimedia?.tipo === 'imagen' && datos.multimedia.prompt ? datos.multimedia : null
  const imagenSubida = datos.multimedia?.tipo === 'imagen' && !datos.multimedia.prompt ? datos.multimedia : null

  // Carga de archivos con el hook oficial de flux-ui: arrastrar y soltar, tope de peso, formatos y errores.
  const [{ isDragging, errors }, archivos] = useFileUpload({
    accept: FORMATOS,
    maxSize: MAX_PESO,
    onFilesAdded: ([elegido]) => {
      if (!elegido || !(elegido.file instanceof File)) return
      setDatos((d) => ({
        ...d,
        multimedia: {
          tipo: 'imagen',
          src: elegido.preview ?? '',
          nombre: elegido.file.name,
          peso: formatBytes((elegido.file as File).size, 0),
        },
      }))
    },
  })

  const quitarImagen = () => {
    archivos.clearFiles()
    setDatos((d) => ({ ...d, multimedia: null }))
  }

  // Autoguardado: cada cambio va al borrador. Se compara con lo anterior, no con «el primer render», para que el doble
  // efecto del modo estricto no cuente como un cambio.
  const datosPrevios = useRef(datos)
  useEffect(() => {
    if (datosPrevios.current === datos) return
    datosPrevios.current = datos
    if (publicado || saliendo.current) return
    const actual = borradorId.current ? buscarAviso(borradorId.current) : undefined
    if (actual) {
      guardarAviso({ ...actual, ...datos })
    } else {
      if (!tocado) return
      const nuevo = nuevoAviso('Borrador')
      borradorId.current = nuevo.id
      guardarAviso(nuevo)
      setHayBorrador(true)
    }
    avisarCambio()
    // Solo reacciona a lo escrito; lo demás se lee en el momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos])

  const cambiar = (campo: 'titulo' | 'descripcion' | 'link', valor: string) => setDatos((d) => ({ ...d, [campo]: valor }))

  // Lo obligatorio, dicho igual que en el resumen de Crear contenido: la lista de lo que falta y cuánto llevas.
  const falta = [!datos.titulo.trim() && 'Título del aviso', !datos.descripcion.trim() && 'Descripción'].filter(Boolean) as string[]
  const listo = falta.length === 0

  // ── Salir ──
  // El guardia atrapa las salidas que no pasan por el botón: la barra lateral, el «atrás» del navegador, un enlace.
  const bloqueo = useBlocker(({ nextLocation }) => !saliendo.current && tocado && nextLocation.pathname !== window.location.pathname)
  const salidaBloqueada = bloqueo.state === 'blocked' ? bloqueo : null
  const salir = () => {
    saliendo.current = true
    navigate(RUTA_LISTA)
  }
  function nuevoAviso(estado: 'Publicado' | 'Borrador') {
    return {
      ...datos,
      id: nuevoId(),
      // El icono de la miniatura cuando el aviso no trae imagen; los creados a mano salen con el megáfono.
      icono: Megaphone01Icon,
      fecha: hoy(),
      autor: USUARIO_ACTUAL,
      estado,
      vistas: 0,
      likes: 0,
      clics: 0,
      historial: [registro(estado === 'Borrador' ? 'Guardó el aviso como borrador' : 'Creó la publicación')],
    }
  }

  const publicar = () => {
    saliendo.current = true
    if (aviso && publicado) {
      // Uno que ya se ve: se aplican los cambios y sigue en el estado que tenía.
      guardarAviso({ ...aviso, ...datos, historial: [registro('Editó la publicación'), ...aviso.historial] })
      notify('Aviso actualizado', `Se guardaron los cambios de «${datos.titulo.trim()}».`, 'success')
    } else {
      const borrador = borradorId.current ? buscarAviso(borradorId.current) : undefined
      guardarAviso(
        borrador
          ? { ...borrador, ...datos, estado: 'Publicado', historial: [registro('Publicó el aviso'), ...borrador.historial] }
          : nuevoAviso('Publicado'),
      )
      notify(editando ? 'Aviso publicado' : 'Aviso creado', `«${datos.titulo.trim()}» ya se ve en el inicio de los colaboradores.`, 'success')
    }
    navigate(RUTA_LISTA)
  }

  // Lo que dice la ventana de salir (VentanaSalir, war room del 13-oct). Un aviso en borrador se guarda solo y la bajada
  // cuenta dónde queda. Editando uno publicado no hay borrador: la bajada avisa que los cambios se pierden.
  const salida = {
    conCambios: tocado,
    retomarEn: 'Avisos internos',
    mensaje: publicado ? 'Los cambios que hiciste se perderán y el aviso se queda como está.' : undefined,
  }

  return (
    <PageShell width="default">
      {/* Sin flecha de volver a la izquierda del título: la salida es una sola y está a la derecha, con su nombre
          completo, como en los demás asistentes (Carlos, 1-oct). */}
      <PageHeader
        title={editando ? 'Editar aviso' : 'Crear aviso'}
        description={
          editando
            ? 'Los cambios se ven de inmediato en el inicio de tus colaboradores.'
            : 'Aparece en el inicio de todos tus colaboradores apenas lo publiques.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* La insignia de tokens solo cuando se está usando la IA, como en «Agregar portada». */}
            {pestana === 'ia' ? <TokenBadge tokens={tokens} /> : null}
            <BotonSalirCreacion
              texto={editando ? 'Salir de la edición' : 'Salir de la creación'}
              onClick={salir}
              salida={{ ...salida, alGuardarYSalir: publicado ? undefined : salir }}
            />
          </div>
        }
      />

      <PageContent>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <Frame>
              <FrameHeader>
                <FrameTitle>El aviso</FrameTitle>
                <FrameDescription>Qué quieres contarle a tu equipo y a dónde lo lleva.</FrameDescription>
              </FrameHeader>
              <FramePanel className="flex flex-col gap-4">
                <Field>
                  {/* El contador a la derecha dentro del propio label, como en el nombre del contenido. */}
                  <FieldLabel htmlFor="aviso-titulo">
                    Título del aviso
                    <Text as="span" size="xs" variant="muted" className="ml-auto tabular-nums" aria-live="polite">
                      {datos.titulo.length}/{MAX_TITULO}
                    </Text>
                  </FieldLabel>
                  <Input
                    id="aviso-titulo"
                    placeholder="Ej. Nueva política de trabajo híbrido"
                    maxLength={MAX_TITULO}
                    value={datos.titulo}
                    onChange={(e) => cambiar('titulo', e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="aviso-descripcion">
                    Descripción
                    <Text as="span" size="xs" variant="muted" className="ml-auto tabular-nums" aria-live="polite">
                      {datos.descripcion.length}/{MAX_DESCRIPCION}
                    </Text>
                  </FieldLabel>
                  <Textarea
                    id="aviso-descripcion"
                    placeholder="Cuenta de qué se trata, en pocas líneas"
                    maxLength={MAX_DESCRIPCION}
                    rows={5}
                    value={datos.descripcion}
                    onChange={(e) => cambiar('descripcion', e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="aviso-link">
                    Link de redirección
                    <Badge variant="secondary" size="xs">
                      Opcional
                    </Badge>
                  </FieldLabel>
                  <Input id="aviso-link" placeholder="https://..." value={datos.link} onChange={(e) => cambiar('link', e.target.value)} />
                </Field>
              </FramePanel>
            </Frame>

            <Frame>
              <FrameHeader>
                <FrameTitle>Imagen o video</FrameTitle>
                <FrameDescription>Lo que acompaña al aviso en el inicio. Puedes subir una imagen, crearla con IA o pegar un video.</FrameDescription>
              </FrameHeader>
              <FramePanel>
                <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)}>
                  <TabsList variant="line">
                    <TabsTrigger value="imagen" className="flex-none">
                      Subir imagen
                    </TabsTrigger>
                    <TabsTrigger value="ia" className="flex-none">
                      Imagen con IA
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex-none">
                      Video
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="imagen" className="pt-3">
                    {/* El cuadro de archivo del equipo (Design system › Estados › Procesos largos), a todo el ancho. */}
                    <AdjuntoCsv
                      estado={imagenSubida ? 'done' : errors.length > 0 ? 'error' : 'idle'}
                      vacio={{
                        titulo: isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para elegirla',
                        descripcion: `PNG o JPEG, hasta ${formatBytes(MAX_PESO, 0)}, mínimo 350 × 196 px`,
                      }}
                      nombre={imagenSubida ? imagenSubida.nombre : 'No se pudo cargar la imagen'}
                      descripcion={imagenSubida ? imagenSubida.peso : errors.length > 0 ? mensajeDeError(errors[0]) : ''}
                      icono={Image01Icon}
                      imagen={imagenSubida?.src}
                      className={cn('w-full!', isDragging && 'border-primary bg-primary/5')}
                      zona={{
                        onDragEnter: archivos.handleDragEnter,
                        onDragLeave: archivos.handleDragLeave,
                        onDragOver: archivos.handleDragOver,
                        onDrop: archivos.handleDrop,
                      }}
                      onElegir={archivos.openFileDialog}
                      onQuitar={quitarImagen}
                      onReintentar={() => {
                        archivos.clearErrors()
                        archivos.openFileDialog()
                      }}
                    />
                    <Input {...archivos.getInputProps({ className: 'hidden', tabIndex: -1, 'aria-hidden': true })} />
                  </TabsContent>

                  <TabsContent value="ia" className="pt-3">
                    <GeneradorImagenIa
                      nombre="imagen"
                      frase={false}
                      resultado={imagenIa?.src ?? ''}
                      promptInicial={imagenIa?.prompt ?? ''}
                      costo={COSTO.imagenAviso}
                      onGenerado={(src, prompt) => {
                        archivos.clearFiles()
                        setDatos((d) => ({ ...d, multimedia: { tipo: 'imagen', src, nombre: 'imagen-generada.jpg', peso: '', prompt } }))
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="video" className="pt-3">
                    <Field>
                      <FieldLabel htmlFor="aviso-video">Enlace del video</FieldLabel>
                      <Input
                        id="aviso-video"
                        placeholder="www.youtube.com/example"
                        value={datos.multimedia?.tipo === 'video' ? datos.multimedia.nombre : ''}
                        onChange={(e) =>
                          setDatos((d) => ({ ...d, multimedia: e.target.value ? { ...VIDEO_DE_PRUEBA, nombre: e.target.value } : null }))
                        }
                      />
                      <Text as="span" size="xs" variant="muted">
                        Pega el enlace de YouTube o Vimeo.
                      </Text>
                    </Field>
                  </TabsContent>
                </Tabs>
              </FramePanel>
            </Frame>
          </div>

          {/* La vista previa, pegada al hacer scroll: el mismo panel de apoyo de Crear contenido —la pieza real que
              verá el colaborador arriba y lo que falta debajo—, no una caja de texto aparte. */}
          <div className="lg:sticky lg:top-0">
            <Frame>
              {/* Solo «Vista previa», sin bajada: es como va en todas nuestras pantallas. */}
              <FrameHeader>
                <FrameTitle>Vista previa</FrameTitle>
              </FrameHeader>
              <div className="px-1 pb-1">
                <VistaPrevia titulo={datos.titulo} descripcion={datos.descripcion} link={datos.link} multimedia={datos.multimedia} />
              </div>
              <FramePanel className="flex flex-col gap-4">
                {falta.length ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Alert02Icon} size={16} className="shrink-0 text-warning" aria-hidden="true" />
                        <Text as="span" size="sm" weight="medium">
                          {falta.length === 1 ? 'Falta un dato' : `Faltan ${falta.length} datos`}
                        </Text>
                      </div>
                      <Text as="span" variant="muted" size="xs" className="tabular-nums">
                        {2 - falta.length} de 2
                      </Text>
                    </div>
                    <Progress value={((2 - falta.length) / 2) * 100} aria-label={`${2 - falta.length} de 2 datos obligatorios`} />
                    <Text as="ul" variant="muted" size="sm" className="ml-6 list-disc">
                      {falta.map((campo) => (
                        <li key={campo}>{campo}</li>
                      ))}
                    </Text>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 text-success" aria-hidden="true" />
                    <Text as="span" size="sm">
                      Todo lo obligatorio está listo.
                    </Text>
                  </div>
                )}
              </FramePanel>
            </Frame>
          </div>
        </div>

        {/* La barra de todos nuestros flujos de creación: el guardado a la izquierda, la acción a la derecha y nada más.
            El chip aparece en cuanto existe el borrador; antes de escribir no hay nada que guardar. */}
        <PageActionBar className="mb-1">
          {hayBorrador ? <ChipGuardado estado={estadoGuardado} /> : <span />}
          <Button className="ml-auto" disabled={!listo} onClick={publicar}>
            {publicado ? 'Guardar cambios' : 'Publicar aviso'}
          </Button>
        </PageActionBar>
      </PageContent>

      {/* La misma ventana del botón, para las salidas que no pasan por él (la barra lateral, «atrás» del navegador). */}
      <VentanaSalir
        abierto={salidaBloqueada !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
        texto={editando ? 'Salir de la edición' : 'Salir de la creación'}
        borrador={!publicado}
        retomarEn={salida.retomarEn}
        mensaje={salida.mensaje}
        onSalir={() => salidaBloqueada?.proceed()}
      />
    </PageShell>
  )
}

Component.displayName = 'AdminAvisosCrearPage'
