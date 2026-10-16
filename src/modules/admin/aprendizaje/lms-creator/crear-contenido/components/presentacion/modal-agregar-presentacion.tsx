import { useNavigate } from 'react-router'
import { Heading } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIa } from '@/shared/components/BotonIa'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { InstruccionGrande } from '../marco-inmersivo'
import { MiniaturaDiapositiva } from './diapositiva'
import type { AcentoId, DatosDiapositiva } from './datos'
import { leerSesion, limpiarSesionPresentacion, RUTA_EDITOR_PRESENTACION, RUTA_SETUP_PRESENTACION, sembrarPresentacion } from './sesion'

// Modal «Agregar presentación interactiva»: la puerta del recurso, igual que la de «Agregar video».
//
// Antes, elegir «Presentación interactiva» en «Añadir página» caía directo en el setup, con la idea en blanco. El de
// video, en cambio, primero ofrece crear uno nuevo **o retomar uno que ya existe**, y una presentación se retoma
// igual: casi siempre se parte de una que ya se armó (Dave, 5-oct).
//
// Una sola vía —la IA—, así que no hay pestañas: la invitación arriba y las recientes debajo.

export type PresentacionReciente = { id: string; titulo: string; subtitulo: string; acento: AcentoId; foto: string; borrador?: boolean }

/** La misma fototeca de las escenas; la portada de un deck casi siempre lleva una. */
const FOTO = (n: number) => `/images/lms-creator/video-ia-escenas/fotografia/escena-${String(n).padStart(2, '0')}.png`

/** Las de ejemplo del prototipo. El borrador en curso, si lo hay, va delante. */
export const PRESENTACIONES_RECIENTES: PresentacionReciente[] = [
  { id: 'pi-cultura', titulo: 'Inducción a la cultura y valores', subtitulo: 'Quiénes somos y cómo trabajamos', acento: 'primary', foto: FOTO(2), borrador: true },
  { id: 'pi-comunicacion', titulo: 'Comunicación asertiva para líderes', subtitulo: 'Decir lo difícil sin romper la relación', acento: 'invert', foto: FOTO(7) },
  { id: 'pi-agiles', titulo: 'Proyectos con metodologías ágiles', subtitulo: 'Del tablero a la entrega', acento: 'success', foto: FOTO(12) },
]

/**
 * La portada de cada una, para la miniatura. Es **una diapositiva de verdad**, pintada con el mismo lienzo del
 * editor: una foto de archivo no se parece en nada a lo que se va a retomar, y lo que se retoma es un deck
 * (Dave, 5-oct).
 */
function portada(p: PresentacionReciente): DatosDiapositiva {
  return { id: `portada-${p.id}`, type: 'intro', tagLabel: 'Presentación', title: p.titulo, subtitle: p.subtitulo, image: p.foto, imagePosition: 'right' }
}

// El ancho del modal «Agregar video», que es su hermano y donde caben tres tarjetas en fila: «wide» (736 px) de
// ActionDialog, la ventana de contenido del sistema. Con 448 las tarjetas se apilaban de a una y el modal se veía como
// otra cosa (Dave, 5-oct).

export function ModalAgregarPresentacion({ abierto, onCerrar, onVolver }: { abierto: boolean; onCerrar: () => void; onVolver?: () => void }) {
  const navigate = useNavigate()

  // El borrador en curso se ofrece de primero: es lo que se estaba haciendo.
  const enCurso = leerSesion()
  const recientes: PresentacionReciente[] = [
    ...(enCurso?.diapositivas.length
      ? [
          {
            id: 'en-curso',
            titulo: enCurso.tituloEditor.trim() || enCurso.idea.trim() || 'Presentación sin título',
            subtitulo: 'Sin terminar',
            acento: enCurso.acento,
            foto: enCurso.diapositivas.find((d) => d.image)?.image ?? FOTO(2),
            borrador: true,
          },
        ]
      : []),
    ...PRESENTACIONES_RECIENTES,
  ].slice(0, 3)

  const crear = () => {
    limpiarSesionPresentacion()
    navigate(RUTA_SETUP_PRESENTACION)
  }

  const retomar = (item: PresentacionReciente) => {
    // En el prototipo todas abren el mismo deck de muestra; la que está en curso abre la suya tal cual.
    if (item.id !== 'en-curso') sembrarPresentacion(item.titulo)
    navigate(RUTA_EDITOR_PRESENTACION)
  }

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="wide"
      className="max-h-[min(650px,calc(100svh-10rem))]!"
      title="Agregar presentación interactiva"
      sub="Crea una presentación con IA o retoma una que ya empezaste."
      onBack={onVolver}
      // Sin el saldo de créditos: aquí no se gasta nada —se elige por dónde empezar— y el cobro se explica donde
      // de verdad ocurre, en el botón de generar del setup (Dave, 5-oct). Sin pie: se sigue desde el cuerpo.
      hideFooter
      dismissible={false}
    >
      <div className="mx-auto flex w-full min-w-0 flex-col items-center gap-6 overflow-x-clip pt-2">
        <InstruccionGrande antes="Convierte una idea en una " clave="presentación interactiva" despues="" />
        <div className="flex w-full min-w-0 flex-col gap-5">
          <div className="flex justify-center">
            <BotonIa onClick={crear}>Crear presentación con IA</BotonIa>
          </div>
          <section className="flex flex-col gap-3" aria-labelledby="presentaciones-recientes">
            <Heading as="h4" level={6} id="presentaciones-recientes">
              Tus presentaciones recientes
            </Heading>
            {/* La rejilla mide su propio ancho (`@container`), no el de la ventana: vive dentro del modal. */}
            <div className="@container">
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @lg:grid-cols-3 [&>*]:min-w-0">
                {recientes.map((item) => (
                  <TarjetaContenido
                    key={item.id}
                    titulo={item.titulo}
                    // Sin `imagen`: en su hueco va la portada del deck, no una foto.
                    sinImagen={<MiniaturaDiapositiva diapositiva={portada(item)} acento={item.acento} className="size-full" />}
                    visibilidad={item.borrador ? 'Borrador' : 'Presentación'}
                    visibilidadColor={item.borrador ? 'info-light' : 'success-light'}
                    onClick={() => retomar(item)}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </ActionDialog>
  )
}
