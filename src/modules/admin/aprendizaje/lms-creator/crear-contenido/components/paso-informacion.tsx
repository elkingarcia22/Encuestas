import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Book02Icon,
  Briefcase01Icon,
  BulbIcon,
  Clock01Icon,
  Dumbbell01Icon,
  Cancel01Icon,
  File02Icon,
  Folder01Icon,
  Globe02Icon,
  Layers01Icon,
  Mic01Icon,
  Mortarboard01Icon,
  News01Icon,
  PlayIcon,
  PodcastIcon,
  Route01Icon,
  SignalFull01Icon,
  SignalLow01Icon,
  SignalMedium01Icon,
  Timer02Icon,
  Upload01Icon,
  Video02Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import type { ClaseCreacion, Portada } from './borrador'
import { EditorTexto } from './editor-texto'
import { IDIOMAS_CONTENIDO, OPCIONES_CATEGORIA, OPCIONES_NIVEL, OPCIONES_TIPO, UNIDADES, embedDeVideo, textoMinutos, trailerValido } from './ficha'
import { InsigniaIA } from './marco-inmersivo'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { COSTO } from './borrador'
import { GeneradorImagenIa } from './generador-imagen-ia'
import { Selector, type OpcionSelector } from './selector'

// Paso 1 · Información básica: tres conjuntos —Título y descripción, Portada y Ficha técnica—, cada uno en su marco: el título y la
// bajada sobre el fondo gris y los campos dentro del panel blanco, para que se lean como tres tareas y no como una lista. Son los datos
// con los que el colaborador ve y encuentra el contenido en el catálogo. Obligatorios: nombre, portada, descripción,
// tipo (solo en un contenido), nivel, idioma y un tiempo mayor que cero (HU-LMS-001, `faltantesPortada`). El modal
// «Agregar portada» es el de siempre.
//
// En una **ruta** la ficha pierde dos campos: el tipo, que va implícito igual que en un evento, y el tiempo, que no se
// escribe porque es la suma de los contenidos que lleve dentro —un dato que el sistema ya sabe y que se desactualiza
// solo al cambiar la lista (HU-LMS-013)—. La categoría nunca es obligatoria, en ninguna de las tres.

export const MAX_TITULO = 180

// Íconos de las opciones que son del sistema. Las categorías no llevan: las crea cada empresa.
const ICONO_TIPO: Record<string, OpcionSelector['icono']> = {
  Curso: Mortarboard01Icon,
  Short: Video02Icon,
  Charla: Mic01Icon,
  Artículo: News01Icon,
  Podcast: PodcastIcon,
  Libro: Book02Icon,
  'Ideas de libro': BulbIcon,
  'Caso de estudio': Briefcase01Icon,
  'Documento técnico': File02Icon,
  'Ejercicios de práctica': Dumbbell01Icon,
  'Ruta de aprendizaje': Route01Icon,
  Programa: Layers01Icon,
}
const ICONO_NIVEL: Record<string, OpcionSelector['icono']> = {
  Básico: SignalLow01Icon,
  Intermedio: SignalMedium01Icon,
  Avanzado: SignalFull01Icon,
}
const ICONO_UNIDAD: Record<string, OpcionSelector['icono']> = { min: Timer02Icon, h: Clock01Icon }

const TIPOS_CON_ICONO = OPCIONES_TIPO.map((o) => ({ ...o, icono: ICONO_TIPO[o.label] }))
const NIVELES_CON_ICONO = OPCIONES_NIVEL.map((o) => ({ ...o, icono: ICONO_NIVEL[o.label] }))
const IDIOMAS_CON_ICONO = IDIOMAS_CONTENIDO.map((o) => ({ ...o, icono: Globe02Icon }))
const UNIDADES_CON_ICONO = UNIDADES.map((o) => ({ ...o, icono: ICONO_UNIDAD[o.value] }))

const SIN_CATEGORIA = '__ninguna'

type Props = {
  portada: Portada
  clase: ClaseCreacion
  /** Solo en una ruta: lo que suman sus contenidos, para decirlo donde iría el campo de tiempo. */
  minutosRuta?: number
  onCambio: (cambio: Partial<Portada>) => void
}

export function PasoInformacion({ portada, clase, minutosRuta = 0, onCambio }: Props) {
  const evento = clase === 'evento'
  const ruta = clase === 'ruta'
  return (
    <div className="flex flex-col gap-6">
      <Frame>
        <FrameHeader>
          {/* Nombra lo que hay dentro, igual que «Portada» y «Ficha técnica»: los tres marcos se leen como un
              sistema. Antes decía «El contenido» / «La ruta» / «El evento», que además de cambiar según el flujo
              repetía algo que el título de la página ya dice (Dave, 6-oct). */}
          <FrameTitle>Título y descripción</FrameTitle>
          <FrameDescription>Cómo se llama y qué van a aprender.</FrameDescription>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="cc-titulo">
              {ruta ? 'Título de la ruta' : evento ? 'Título del evento' : 'Título del contenido'}
              <Text as="span" size="xs" variant="muted" className="ml-auto tabular-nums" aria-live="polite">
                {portada.titulo.length}/{MAX_TITULO}
              </Text>
            </FieldLabel>
            {/* Input suelto, no un InputGroup sin complementos: el autocompletado del navegador pinta el input de
                adentro, que es cuadrado, y tapaba el borde redondeado del grupo. */}
            <Input
              id="cc-titulo"
              maxLength={MAX_TITULO}
              placeholder={
                ruta
                  ? 'Ej. Ruta de liderazgo para nuevos jefes'
                  : evento
                    ? 'Ej. Taller de comunicación asertiva'
                    : 'Ej. Resolución efectiva de conflictos en equipos de trabajo'
              }
              value={portada.titulo}
              onChange={(e) => onCambio({ titulo: e.target.value.replace(/\n/g, ' ') })}
            />
            <FieldDescription>Máximo 180 caracteres. Es el título que verán los colaboradores en el catálogo.</FieldDescription>
          </Field>

          <EditorTexto
            id="cc-descripcion"
            etiqueta="Descripción"
            placeholder={ruta ? 'Escribe una descripción que invite a recorrer la ruta' : evento ? 'Escribe una descripción que invite a asistir al evento' : 'Escribe una descripción que invite a tomar el contenido'}
            valor={portada.descripcion}
            onCambio={(html) => onCambio({ descripcion: html })}
            alto={160}
          />
        </FramePanel>
      </Frame>

      <Frame>
        <FrameHeader>
          <FrameTitle>Portada</FrameTitle>
          <FrameDescription>Lo primero que ven los colaboradores en el catálogo. Créala con IA, súbela o suma un tráiler.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <CampoPortada portada={portada} onCambio={onCambio} />
        </FramePanel>
      </Frame>

      <Frame>
        <FrameHeader>
          <FrameTitle>Ficha técnica</FrameTitle>
          <FrameDescription>
            {ruta ? 'Ayuda a encontrar la ruta y a saber cuánto toma.' : evento ? 'Ayuda a encontrar el evento y a saber cuánto toma.' : 'Ayuda a encontrar el contenido y a saber cuánto toma.'}
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          {/* En un evento y en una ruta el tipo va implícito: no se muestra ni se elige (HU-LMS-020, HU-LMS-013). */}
          {/* `items-start`: sin esto la rejilla estira las dos celdas de una fila a la altura de la más alta, así que
              el renglón de ayuda de «Duración» le dejaba a «Categoría» 33 px de hueco debajo (Dave, 2-oct). */}
          <div className="grid items-start gap-4 sm:grid-cols-2">
            {clase === 'contenido' ? (
              <Selector id="cc-tipo" etiqueta="Tipo de contenido" valor={portada.tipo} opciones={TIPOS_CON_ICONO} onCambio={(tipo) => onCambio({ tipo })} />
            ) : null}
            <Selector id="cc-nivel" etiqueta="Nivel" valor={portada.nivel} opciones={NIVELES_CON_ICONO} onCambio={(nivel) => onCambio({ nivel })} />
            <Selector id="cc-idioma" etiqueta="Idioma" valor={portada.idioma} opciones={IDIOMAS_CON_ICONO} onCambio={(idioma) => onCambio({ idioma })} />
            {ruta ? (
              /* Donde iría el campo, lo que ya se sabe: una ruta dura lo que duran sus contenidos. Se enseña en vez de
                 esconderse para que no parezca que falta un dato de la ficha. */
              <Field>
                <FieldLabel htmlFor="cc-tiempo-ruta">Duración</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <HugeiconsIcon icon={Clock01Icon} size={16} aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput id="cc-tiempo-ruta" readOnly value={minutosRuta > 0 ? textoMinutos(minutosRuta) : 'Sin contenidos todavía'} />
                </InputGroup>
                {/* En una línea: a dos renglones estiraba toda la fila de la rejilla a 120 px —Nivel e Idioma miden
                    66— y dejaba a Categoría con un hueco debajo (Dave, 2-oct). */}
                <FieldDescription>Suma de los contenidos del paso 2.</FieldDescription>
              </Field>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="cc-tiempo">Tiempo aproximado</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <HugeiconsIcon icon={Clock01Icon} size={16} aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="cc-tiempo"
                    inputMode="decimal"
                    placeholder="Ej. 30"
                    value={portada.tiempo}
                    onChange={(e) => onCambio({ tiempo: e.target.value.replace(/[^\d.,]/g, '') })}
                  />
                </InputGroup>
              </Field>
              <Selector
                id="cc-unidad"
                etiqueta="Unidad de tiempo"
                valor={portada.unidad}
                opciones={UNIDADES_CON_ICONO}
                onCambio={(unidad) => onCambio({ unidad: unidad as Portada['unidad'] })}
              />
            </div>
            )}
            <Selector
              id="cc-categoria"
              etiqueta="Categoría"
              opcional
              // Siempre la carpeta, sin importar cuál se elija: las categorías las crea cada empresa y no tienen un
              // icono propio, así que lo que el icono dice es de qué es la lista.
              icono={Folder01Icon}
              valor={portada.categoria || SIN_CATEGORIA}
              opciones={[{ value: SIN_CATEGORIA, label: 'Sin categoría' }, ...OPCIONES_CATEGORIA]}
              onCambio={(categoria) => onCambio({ categoria: categoria === SIN_CATEGORIA ? '' : categoria })}
            />
          </div>
        </FramePanel>
      </Frame>
    </div>
  )
}

/**
 * La portada, a todo el ancho del panel. Sin modal: lo que antes abría «Agregar portada» ahora se despliega aquí
 * mismo, debajo del recuadro.
 *
 * Por qué se fue el modal: era una caja centrada con tres herramientas de distinto tamaño, así que o saltaba de alto
 * al cambiar de pestaña o se rellenaba y quedaba medio vacía; y obligaba a decidir «por qué vía» antes de empezar.
 * En la página nada de eso ocurre —el bloque crece hacia abajo, como cualquier formulario— y de paso el tráiler deja
 * de ser una tercera pestaña hermana: no es una forma de hacer una portada, es algo que se reproduce sobre ella.
 */
function CampoPortada({ portada, onCambio }: { portada: Portada; onCambio: (cambio: Partial<Portada>) => void }) {
  const [conIa, setConIa] = useState(false)
  const [reproduciendo, setReproduciendo] = useState(false)
  const archivo = useRef<HTMLInputElement>(null)

  const elegirArchivo = () => archivo.current?.click()
  const reproducir = () => {
    const embed = embedDeVideo(portada.trailer)
    if (embed) setReproduciendo(true)
    else window.open(portada.trailer, '_blank', 'noopener')
  }

  const trailerInvalido = Boolean(portada.trailer.trim()) && !trailerValido(portada.trailer)

  return (
    <div className="flex flex-col gap-4">
      <Input
        ref={archivo}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            setReproduciendo(false)
            onCambio({ imagen: URL.createObjectURL(f), imagenIA: false, promptIA: '' })
          }
          e.target.value = ''
        }}
      />

      {/* Con el generador abierto no se pinta la portada aquí: su propio lienzo ya la enseña, y verla dos veces
          duplicaba la imagen y el alto del bloque. */}
      {conIa ? null : !portada.imagen ? (
        // Las dos vías a la vista: antes había un solo botón que abría el modal y allí dentro se decidía.
        // Borde sólido: el punteado es la marca de «suelta un archivo aquí» y el Empty de la librería lo trae de
        // fábrica, así que hay que pisarlo con el signo.
        <Empty className="rounded-xl border border-solid! py-10!">
          <EmptyHeader>
            <EmptyMedia>
              <ImagenGlass nombre="glass-gallery" tamano={64} />
            </EmptyMedia>
            <EmptyTitle>Todavía no tiene portada</EmptyTitle>
            <EmptyDescription>Créala con IA o sube una imagen JPG o PNG de hasta 5 MB en 16:9. El tráiler es opcional.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center gap-2">
            <BotonIaSecundario onClick={() => setConIa(true)}>Crearla con IA</BotonIaSecundario>
            <Button variant="outline" onClick={elegirArchivo}>
              <HugeiconsIcon icon={Upload01Icon} size={16} aria-hidden="true" />
              Subir una imagen
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
          {reproduciendo ? (
            <iframe
              src={embedDeVideo(portada.trailer) ?? ''}
              title="Tráiler del contenido"
              className="size-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img src={portada.imagen} alt="Portada del contenido" className="size-full object-cover" />
              {/* Velo degradado en la franja de arriba: sobre una portada clara, la insignia y los botones se perdían.
                  Cae a transparente antes de la mitad para no ensuciar la imagen, y no intercepta el cursor. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 via-black/15 to-transparent"
              />
              {portada.imagenIA ? <InsigniaIA className="absolute top-3 left-3" /> : null}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={elegirArchivo}>
                  <HugeiconsIcon icon={Upload01Icon} size={14} aria-hidden="true" />
                  Cambiar imagen
                </Button>
                {/* El secundario de IA del sistema de diseño, en pastilla: armado a mano salía con la esquina de la
                    librería (el jefe de Dave, 13-oct). */}
                <BotonIaSecundario size="sm" onClick={() => setConIa(true)}>
                  Editar con IA
                </BotonIaSecundario>
              </div>
              {portada.trailer ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button variant="outline" size="icon-lg" aria-label="Reproducir tráiler" onClick={reproducir}>
                    <HugeiconsIcon icon={PlayIcon} size={22} />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* El generador, desplegado en la página. Su cabecera dice qué es y lo cierra: una X suelta al lado de un campo
          no deja claro a qué pertenece. */}
      {conIa ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <Text as="span" size="sm" weight="medium" className="flex items-center gap-2">
              <IconoIA className="size-3.5" />
              Crear la portada con IA
            </Text>
            <BotonIcono aria-label="Cerrar el generador" onClick={() => setConIa(false)}>
              <HugeiconsIcon icon={Cancel01Icon} size={15} />
            </BotonIcono>
          </div>
          <GeneradorImagenIa
            nombre="portada"
            resultado={portada.imagenIA ? portada.imagen : ''}
            promptInicial={portada.imagenIA ? portada.promptIA : ''}
            costo={COSTO.portada}
            frase={false}
            onGenerado={(imagen, prompt) => {
              setReproduciendo(false)
              onCambio({ imagen, imagenIA: true, promptIA: prompt })
            }}
          />
        </div>
      ) : null}

      <Separator />

      {/* El tráiler, donde le corresponde: un dato más de la portada, no una tercera forma de hacerla. */}
      <Field data-invalid={trailerInvalido ? 'true' : undefined}>
        <FieldLabel htmlFor="cc-portada-trailer">
          Tráiler
          <Badge variant="secondary" size="xs">
            Opcional
          </Badge>
        </FieldLabel>
        <Input
          id="cc-portada-trailer"
          placeholder="https://www.youtube.com/watch?v=..."
          value={portada.trailer}
          onChange={(e) => onCambio({ trailer: e.target.value })}
          aria-invalid={trailerInvalido || undefined}
        />
        {trailerInvalido ? (
          <FieldError>Solo se admiten enlaces de YouTube, Vimeo, Google Drive y OneDrive.</FieldError>
        ) : (
          <FieldDescription>Se reproduce sobre la portada. YouTube, Vimeo, Drive y OneDrive.</FieldDescription>
        )}
      </Field>
    </div>
  )
}
