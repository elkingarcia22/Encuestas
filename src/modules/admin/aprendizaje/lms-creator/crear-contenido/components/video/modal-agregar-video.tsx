import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Field, FieldDescription, FieldError, Input, Tabs } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIa } from '@/shared/components/BotonIa'
import { PestanasDePatron } from '@/modules/design-system/patrones/piezas'
import { BASE_LMS, confirmarRecurso, useBorrador } from '../borrador'
import { FileUpload, type ArchivoCargado } from '../file-upload'
import { botonListo } from '../modales-recurso'
import { PanelTodos, PanelVideoConIA } from './biblioteca'
import { COSTO_VIDEO, enlaceEmbebido, enlaceValido, type ItemBiblioteca } from './datos'
import { PanelAvatar, usePanelAvatar, type DisposicionAvatar } from './panel-avatar'
import { PestanaVideo, conCosto } from './piezas'
import { leerSesion, marcarActiva, nuevoVideo } from './proyecto'
import { TokenBadge } from '../tokens'

// Ventana «Agregar video» (HU-LMS-001, recurso Video): cuatro pestañas para llegar al video de la página. Video con IA
// abre el flujo por escenas (pantalla aparte) o reusa uno de «Tus videos»; Video Avatar IA lo genera con un presentador;
// Enlace y Subir lo cargan tal cual. La intención (a qué sección va, o qué página reemplaza) ya la guardó el asistente
// con `abrirIntencion`, y `confirmarRecurso` la resuelve.

type Pestana = 'ia' | 'avatar' | 'enlace' | 'subir'

// El ancho de la ventana del sistema (ActionDialog, decisión 4 de la auditoría, 5-oct): «wide», 736 px, el tamaño de
// en medio. A pantalla completa quedaba media ventana en blanco y a 576 se sentía chiquito; el alto se ajusta a lo que
// haya dentro y solo deja de crecer en 650 (Carlos y Dave, 1 y 2-oct; antes eran 768 de ancho).
type AnchoVentana = 'default' | 'wide' | 'full'

const PESTANAS: { valor: Pestana; etiqueta: string }[] = [
  { valor: 'ia', etiqueta: 'Video con IA' },
  { valor: 'avatar', etiqueta: 'Video Avatar IA' },
  { valor: 'enlace', etiqueta: 'Enlace de video' },
  { valor: 'subir', etiqueta: 'Subir video' },
]

type Props = {
  abierto: boolean
  onCerrar: () => void
  /** «Volver» a «Añadir página»; sin él no se muestra la flecha. */
  onVolver?: () => void
  onListo: (paginaId: string) => void
  // ── Las perillas del lab (`/admin/aprendizaje/lms-creator/lab-modal-video`) ──
  // El modal sin perillas es lo que se eligió: ancho «wide», techo de 650 y «Video Avatar IA» en secciones plegables
  // con su vista previa al lado. Estas props solo existen para que el lab siga pudiendo enseñar las otras dos
  // propuestas al lado de la elegida (Dave, 2-oct).
  /** Ancho del modal. */
  ancho?: AnchoVentana
  /** Cómo reparte sus secciones la pestaña «Video Avatar IA». */
  disposicion?: DisposicionAvatar
  /** Alto fijo del modal entero: mide siempre lo mismo y el cuerpo hace scroll dentro. */
  altoModal?: boolean
}

export function ModalAgregarVideo({ abierto, onCerrar, onVolver, onListo, ancho = 'wide', disposicion = 'acordeon', altoModal }: Props) {
  const navigate = useNavigate()
  const { tokens, videosRecientes } = useBorrador()
  const [pestana, setPestana] = useState<Pestana>('ia')
  const [todos, setTodos] = useState(false)
  const [enlace, setEnlace] = useState('')
  const [archivo, setArchivo] = useState<ArchivoCargado | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const avatar = usePanelAvatar()
  const { reiniciar } = avatar

  // Cada vez que se abre empieza limpio y en Video con IA.
  useEffect(() => {
    if (!abierto) return
    setPestana('ia')
    setTodos(false)
    setEnlace('')
    setArchivo(null)
    setSubiendo(false)
    reiniciar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const valido = enlaceValido(enlace)

  const crearConIA = () => {
    nuevoVideo()
    navigate(`${BASE_LMS}/agregar-video`)
  }

  const elegirDeBiblioteca = (item: ItemBiblioteca) => {
    if (item.estado === 'listo') {
      onListo(confirmarRecurso({ tipo: 'video', src: item.src, generadoConIA: true, origenVideo: 'ia' }, item.titulo))
      return
    }
    // Un borrador propio se retoma donde quedó; los de ejemplo abren el proyecto listo del editor.
    const sesion = item.propio ? leerSesion(item.id) : undefined
    if (sesion && sesion.fase === 'borrador') {
      marcarActiva(sesion.id)
      navigate(`${BASE_LMS}/agregar-video?draftId=${encodeURIComponent(sesion.id)}`)
      return
    }
    marcarActiva(sesion?.id ?? null)
    navigate(`${BASE_LMS}/agregar-video/editor${sesion ? `?draftId=${encodeURIComponent(sesion.id)}` : ''}`)
  }

  const cargarEnlace = () => {
    if (!valido) return
    onListo(confirmarRecurso({ tipo: 'video', src: enlaceEmbebido(enlace), origenVideo: 'enlace' }))
  }

  const cargarArchivo = () => {
    if (!archivo) return
    onListo(confirmarRecurso({ tipo: 'video', src: archivo.url, archivo: archivo.nombre, origenVideo: 'subido' }))
  }

  // «Video con IA» no lleva pie: su acción vive dentro de la pestaña, donde contrasta con las tarjetas de «Tus videos
  // recientes». Se probó bajarla al pie para igualar el alto de las cuatro y se descartó: se veía mal (1-oct).
  const pie =
    todos || pestana === 'ia' ? undefined : pestana === 'avatar' ? (
      <div>
        <BotonIa
          onClick={() => {
            const id = avatar.generar()
            if (id) onListo(id)
          }}
        >
          {conCosto('Generar video', COSTO_VIDEO.avatarVideo)}
        </BotonIa>
      </div>
    ) : pestana === 'enlace' ? (
      <Button variant={botonListo(valido)} disabled={!valido} onClick={cargarEnlace}>
        Cargar video
      </Button>
    ) : (
      <Button variant={botonListo(Boolean(archivo) && !subiendo)} disabled={!archivo || subiendo} onClick={cargarArchivo}>
        Cargar video
      </Button>
    )

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size={ancho}
      // En píxeles y no en porcentaje: así el modal mide lo mismo en el portátil de cada quien y no cambia de forma
      // según el monitor (Dave, 2-oct).
      //
      // Con `altoModal` mide **siempre** 550: las cuatro pestañas quedan iguales y el modal deja de dar saltos.
      // Sin él, 650 es un **techo**: el modal se ajusta a lo que haya dentro —«Subir video» mide 336— y solo deja de
      // crecer al llegar ahí. El `min()` mete en la misma regla el tope de pantalla de la ventana, que se abre a 120 px
      // del borde de arriba; el `!` le gana al tope propio de la ventana.
      className={altoModal ? 'h-[550px]' : 'max-h-[min(650px,calc(100svh-10rem))]!'}
      title={todos ? 'Tus videos' : 'Agregar video'}
      onBack={todos ? () => setTodos(false) : onVolver}
      headerActions={!todos && pestana === 'avatar' ? <TokenBadge tokens={tokens} /> : undefined}
      footer={pie}
      hideFooter={!pie}
      dismissible={false}
    >
      {todos ? (
        <PanelTodos propios={videosRecientes ?? []} onElegir={elegirDeBiblioteca} />
      ) : (
        <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)} className="min-w-0 flex-1 gap-0! overflow-x-clip">
          {/* Pestañas subrayadas, como la ventana con pestañas de Design system › Modales; la pastilla gris queda para
              casos especiales (decisión 13 de la auditoría, 5-oct). */}
          <div className="pb-3">
            <PestanasDePatron items={PESTANAS} />
          </div>

          {pestana === 'ia' ? (
            <PanelVideoConIA propios={videosRecientes ?? []} onCrear={crearConIA} onVerTodos={() => setTodos(true)} onElegir={elegirDeBiblioteca} />
          ) : null}

          {pestana === 'avatar' ? <PanelAvatar estado={avatar} disposicion={disposicion} /> : null}

          {pestana === 'enlace' ? (
            <PestanaVideo antes="Pega el " clave="enlace del video" despues=" que quieres cargar">
              {/* 530 px de tope y centrado, no todo el ancho del modal. Es la medida que tiene el campo en «Agregar
                  PDF» (ahí el cuerpo del modal mide 528) y que a Dave le gusta: un campo de una línea estirado a los
                  720 px del modal se lee como una franja, no como un campo (Dave, 2-oct). El modal sigue midiendo 768. */}
              <Field className="mx-auto w-full max-w-[530px]" data-invalid={enlace.trim() && !valido ? 'true' : undefined}>
                <Input
                  aria-label="Enlace del video"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={enlace}
                  onChange={(e) => setEnlace(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') cargarEnlace()
                  }}
                  aria-invalid={enlace.trim() && !valido ? true : undefined}
                  className="h-11"
                />
                {enlace.trim() && !valido ? (
                  <FieldError>Solo se admiten enlaces de YouTube, Vimeo, Google Drive y OneDrive.</FieldError>
                ) : (
                  <FieldDescription>Solo se admiten enlaces de YouTube, Vimeo, Google Drive y OneDrive.</FieldDescription>
                )}
              </Field>
            </PestanaVideo>
          ) : null}

          {pestana === 'subir' ? (
            <PestanaVideo antes="Sube el " clave="video" despues=" que quieres usar en esta página">
              {/* Mismo tope de 530 que el enlace, por lo mismo: la medida del de «Agregar PDF». */}
              <div className="mx-auto flex w-full max-w-[530px] flex-col gap-5">
              <FileUpload
                titulo="Video MP4"
                acepta="video/mp4,.mp4"
                maximoMb={500}
                formatos="MP4 · Hasta 500 MB"
                conProgreso
                exito="Video listo. Haz clic en «Usar video» para continuar."
                archivo={archivo}
                onArchivo={setArchivo}
                onSubiendo={setSubiendo}
              />
              {archivo ? <video src={archivo.url} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-muted" /> : null}
              </div>
            </PestanaVideo>
          ) : null}
        </Tabs>
      )}
    </ActionDialog>
  )
}
