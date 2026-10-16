import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Clock01Icon,
  Upload01Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Heading,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Text,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { useBorrador } from '../../borrador'
import {
  COSTO_VIDEO,
  acento,
  camposDesdeIdea,
  camposVacios,
  vozPorId,
} from '../datos'
import { MiniaturaEscena } from '../lienzo'
import { CampoColorLibre, esColorLibre, hexDeClase } from '../../color-libre'
import { AiThinking } from '@/shared/components/AiThinking'
import { aviso, conCosto } from '../piezas'
import { ModalAvatar, TarjetaAvatarEscena } from '../selectores'
import { avatarDeEscena, ocupada, sincronizada, tieneLocucionVigente, vozDe, type Escena, type Proyecto, type TipoEscena } from '../proyecto'
import { ModalRegenerar } from './modales'
import { SelectorPlantilla } from './selector-plantilla'
import { TIPOS } from './tipos-escena'
import { CampoFondo, ListaCapas, PropiedadesCapa } from './panel-capas'
import { capasDe, colorVigente, enOtraPlantilla, fondoDe, type Capa } from '../capas'

// Inspector «Propiedades»: tipo de escena, media (reemplazar, generar, cargar clip), avatar y su sincronización,
// personalización y plantilla del canvas, y la duración.


function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      {/* Un escalón por encima de las etiquetas de los campos (14 px): en 12 px gris, el título de la sección se leía
          más chico que lo que agrupa (Dave, 14-oct). */}
      <Heading as="h3" level={6}>
        {titulo}
      </Heading>
      {children}
    </section>
  )
}

/** Lee la duración de un clip subido (tope de 600 s). */
// La duración se guarda en segundos y se escribe como minutos:segundos («0:09», «1:30»).
const aReloj = (segundos: number) => {
  const total = Math.round(segundos)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
function deReloj(valor: string) {
  const limpio = valor.trim()
  if (/^\d+$/.test(limpio)) return Number(limpio)
  const m = limpio.match(/^(\d+):(\d{1,2})$/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

function CampoDuracion({ segundos, onCambio }: { segundos: number; onCambio: (segundos: number) => void }) {
  const [texto, setTexto] = useState(aReloj(segundos))
  useEffect(() => setTexto(aReloj(segundos)), [segundos])
  const confirmar = () => {
    const valor = deReloj(texto)
    if (valor == null) setTexto(aReloj(segundos))
    else onCambio(valor)
  }
  return (
    <InputGroup>
      <InputGroupInput
        inputMode="numeric"
        aria-label="Duración de la escena, en minutos y segundos"
        placeholder="0:00"
        value={texto}
        onChange={(ev) => setTexto(ev.target.value.replace(/[^\d:]/g, ''))}
        onBlur={confirmar}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') confirmar()
        }}
        className="tabular-nums"
      />
      <InputGroupAddon align="inline-end">
        <HugeiconsIcon icon={Clock01Icon} size={16} aria-hidden="true" />
      </InputGroupAddon>
    </InputGroup>
  )
}

function duracionDeClip(url: string) {
  return new Promise<number>((resolver) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => resolver(Math.min(600, Number.isFinite(v.duration) ? Math.round(v.duration * 10) / 10 : 5))
    v.onerror = () => resolver(5)
    v.src = url
  })
}

type Props = {
  proyecto: Proyecto
  escena: Escena | undefined
  ahora: number
  onEscena: (cambio: Partial<Escena>) => void
  onTipo: (tipo: TipoEscena) => void
  onRegenerarImagen: (idea: string) => void
  onGenerarCanvas: (idea: string) => void
  onAvatar: (id: number, aTodas: boolean) => void
  onSincronizar: () => void
  /** La capa del canvas elegida: la comparten la vista previa y Propiedades. */
  capaElegida?: string | null
  onCapaElegida?: (id: string | null) => void
}

export function Inspector({ proyecto, escena, ahora, onEscena, onTipo, onRegenerarImagen, onGenerarCanvas, onAvatar, onSincronizar, capaElegida = null, onCapaElegida }: Props) {
  const { tokens } = useBorrador()
  const [modal, setModal] = useState<'imagen' | 'canvas' | 'avatar' | null>(null)
  const imagenes = useRef<HTMLInputElement>(null)
  const clips = useRef<HTMLInputElement>(null)
  const subirImagenCapa = useRef<HTMLInputElement>(null)

  if (!escena) return null
  const e = escena
  const trabajando = ocupada(e, ahora)
  const motivo = trabajando ? e.ocupada?.motivo : undefined
  const conAvatar = proyecto.escenas.filter((x) => x.tipo === 'avatar').length > 1
  // Las capas del canvas: las guardadas o las de su plantilla. Guardarlas deja la lista en la escena.
  const foto = e.imagen || '/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg'
  const capas = e.canvas ? capasDe(e.canvas, foto) : []
  const capaActual = capas.find((c) => c.id === capaElegida)
  const guardarCapas = (capasLibres: Capa[]) => e.canvas && onEscena({ canvas: { ...e.canvas, capasLibres } })
  const minimo = e.duracionLocucion ? Math.ceil(e.duracionLocucion) : 1
  const ayudaDuracion =
    e.tipo === 'video'
      ? e.clip
        ? 'La escena toma la duración del video cargado. Puedes ajustarla después.'
        : 'Al cargar un video, la escena toma esa duración.'
      : e.duracionLocucion
        ? 'Si alargas más que la locución, el resto queda en silencio.'
        : 'Define cuánto dura esta escena en el video final.'

  const puedeSincronizar = e.tipo === 'avatar' && tieneLocucionVigente(e, proyecto) && !sincronizada(e, proyecto) && !trabajando && tokens >= COSTO_VIDEO.sincronizar

  return (
    <div className="flex flex-col gap-6">
      <Seccion titulo="Tipo de escena">
        {/* Un selector con el icono de cada tipo, no cuatro tarjetas (Dave, 14-oct): las tarjetas ocupaban casi un tercio
            del panel para una sola elección. */}
        <Select value={e.tipo ?? null} onValueChange={(v) => v && onTipo(v as TipoEscena)}>
          <SelectTrigger aria-label="Tipo de escena" className="w-full">
            <SelectValue placeholder="Elige el tipo de escena">
              {(v: TipoEscena | null) => {
                const t = TIPOS.find((x) => x.id === v)
                return t ? (
                  <span className="flex items-center gap-2">
                    <HugeiconsIcon icon={t.icono} size={16} aria-hidden="true" />
                    {t.label}
                  </span>
                ) : null
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <HugeiconsIcon icon={t.icono} size={16} aria-hidden="true" />
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Seccion>

      {e.tipo === 'imagen' || e.tipo === 'video' || e.tipo === 'canvas' ? (
        <>
          <Separator />
          <Seccion titulo="Media">
            {/* El canvas solo trae «Generar canvas»: su miniatura ya la enseña el campo Plantilla (Dave, 14-oct). */}
            {e.tipo === 'canvas' ? (
              <div>
                <BotonIaSecundario size="sm" disabled={trabajando} onClick={() => setModal('canvas')}>
                  {e.canvas?.idea ? 'Regenerar canvas' : 'Generar canvas'}
                </BotonIaSecundario>
              </div>
            ) : (
            // La miniatura manda de ancho y las acciones se apilan a su lado, como en playground-react: debajo dejaban
            // un hueco a la derecha de la miniatura y estiraban la sección de más.
            <div className="flex items-start gap-3">
              <div className="relative w-32 shrink-0 overflow-hidden rounded-md">
                <MiniaturaEscena proyecto={proyecto} escena={e} className="border" />
                {motivo && motivo !== 'audio' ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <AiThinking label={motivo === 'cola' ? 'Generando' : 'Regenerando'} orb={false} />
                  </span>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {e.tipo === 'imagen' ? (
                  <>
                    <Input
                      ref={imagenes}
                      type="file"
                      accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                      className="hidden"
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(ev) => {
                        const f = ev.target.files?.[0]
                        ev.target.value = ''
                        if (!f) return
                        if (!/^image\/(jpeg|png)$/.test(f.type)) {
                          aviso('warning', f.type.startsWith('image/') ? 'Solo se permiten imágenes JPG o PNG.' : 'Selecciona una imagen JPG o PNG.')
                          return
                        }
                        onEscena({ imagen: URL.createObjectURL(f) })
                      }}
                    />
                    <Button variant="outline" size="sm" disabled={trabajando} onClick={() => imagenes.current?.click()}>
                      <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" aria-hidden="true" />
                      {/* Sin imagen todavía no hay nada que reemplazar: «Cargar», como el video (14-oct). */}
                      {e.imagen ? 'Reemplazar' : 'Cargar'}
                    </Button>
                    <BotonIaSecundario size="sm" disabled={trabajando} onClick={() => setModal('imagen')}>
                      {e.imagenGenerada ? 'Regenerar' : 'Generar'}
                    </BotonIaSecundario>
                  </>
                ) : null}
                {e.tipo === 'video' ? (
                  <>
                    <Input
                      ref={clips}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
                      className="hidden"
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(ev) => {
                        const f = ev.target.files?.[0]
                        ev.target.value = ''
                        if (!f) return
                        if (!f.type.startsWith('video/') && !/\.(mp4|webm|ogg|mov)$/i.test(f.name)) {
                          aviso('warning', 'Selecciona un archivo de video.')
                          return
                        }
                        const src = URL.createObjectURL(f)
                        void duracionDeClip(src).then((duracion) => onEscena({ clip: { src, nombre: f.name, duracion }, duracion }))
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => clips.current?.click()}>
                      <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" aria-hidden="true" />
                      {e.clip ? 'Reemplazar' : 'Cargar'}
                    </Button>
                    {e.clip ? (
                      <Text size="xs" variant="muted" className="truncate">
                        {e.clip.nombre}
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
            )}
          </Seccion>
        </>
      ) : null}

      {e.tipo === 'avatar' ? (
        <>
          <Separator />
          <Seccion titulo="Avatar">
            <TarjetaAvatarEscena id={avatarDeEscena(e, proyecto).id} onElegir={() => setModal('avatar')} deshabilitado={trabajando} />
            <div>
              <BotonIaSecundario size="sm" disabled={!puedeSincronizar} onClick={onSincronizar}>
                {motivo === 'sincronizar' ? 'Sincronizando avatar' : conCosto('Sincronizar avatar', COSTO_VIDEO.sincronizar)}
              </BotonIaSecundario>
            </div>
            {!tieneLocucionVigente(e, proyecto) ? (
              <Text size="xs" variant="muted">
                Genera el audio de la escena para poder sincronizar el avatar.
              </Text>
            ) : sincronizada(e, proyecto) ? (
              <Text size="xs" variant="muted">
                El avatar está sincronizado con el audio de esta escena.
              </Text>
            ) : null}
          </Seccion>
        </>
      ) : null}

      {e.tipo === 'canvas' && e.canvas ? (
        <>
          <Separator />
          <Seccion titulo="Personalización">
            {/* La plantilla, como en el editor de AI Studio: un campo con su miniatura que abre un buscador agrupado
                (el jefe de Dave, 14-oct). Antes era una cuadrícula de diez tarjetas con icono que ocupaba medio panel. */}
            <Field>
              <FieldLabel htmlFor="canvas-plantilla">Plantilla</FieldLabel>
              <SelectorPlantilla
                id="canvas-plantilla"
                proyecto={proyecto}
                escena={e}
                onElegir={(plantilla) => {
                  if (!e.canvas) return
                  // Conserva el contenido compatible y vuelve a generar las capas, como en el editor de AI Studio: los
                  // textos de las capas vuelven a sus campos (el título sigue siendo el título) y la plantilla nueva los
                  // acomoda con sus medidas. Lo agregado a mano y lo que se movió no viaja; el fondo vuelve al suyo.
                  const base = e.canvas.idea ? camposDesdeIdea(plantilla, e.canvas.idea) : camposVacios(plantilla)
                  onEscena({ canvas: enOtraPlantilla(e.canvas, plantilla, base, foto) })
                }}
              />
            </Field>
            {/* Color libre con el selector de color del sistema (SelectorColor, 14-oct). */}
            <CampoColorLibre
              id="canvas-acento"
              etiqueta="Color de acento"
              valor={e.canvas.acento}
              claseToken={acento(e.canvas.acento).fondo}
              porDefecto="primary"
              onCambio={(v) => e.canvas && onEscena({ canvas: { ...e.canvas, acento: v } })}
            />
            <CampoFondo fondo={fondoDe(e.canvas)} onFondo={(fondo) => e.canvas && onEscena({ canvas: { ...e.canvas, fondo } })} />
          </Seccion>
          <Separator />
          {/* Las capas, como en el editor de AI Studio (14-oct). Cualquier cambio guarda la lista entera en la escena:
              desde ahí manda ella y no la plantilla. */}
          <ListaCapas
            capas={capas}
            foto={foto}
            elegida={capaElegida}
            onElegir={(id) => onCapaElegida?.(id)}
            onCapas={guardarCapas}
          />
          {capaActual ? (
            <>
              <Separator />
              <PropiedadesCapa
                capa={capaActual}
                colorPorDefecto={colorVigente(capaActual, fondoDe(e.canvas), esColorLibre(e.canvas.acento) ? e.canvas.acento : hexDeClase(acento(e.canvas.acento).fondo))}
                onCambio={(cambio) => guardarCapas(capas.map((c) => (c.id === capaActual.id ? { ...c, ...cambio } : c)))}
                onSubirImagen={() => subirImagenCapa.current?.click()}
              />
              <Input
                ref={subirImagenCapa}
                type="file"
                accept="image/*"
                // `hidden` y no `sr-only`: el Input de la librería le gana al ancho de `sr-only` y seguía midiendo lo
                // del panel, que salía con scroll horizontal al elegir una capa (14-oct).
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(ev) => {
                  const archivo = ev.target.files?.[0]
                  ev.target.value = ''
                  if (!archivo) return
                  const lector = new FileReader()
                  lector.onload = () => typeof lector.result === 'string' && guardarCapas(capas.map((c) => (c.id === capaActual.id ? { ...c, src: lector.result as string } : c)))
                  lector.readAsDataURL(archivo)
                }}
              />
            </>
          ) : null}
        </>
      ) : null}

      {/* El sonido de la escena, cada cosa por su lado (14-oct): la locución que ya se generó y el audio del clip. Antes
          era una sola «mezcla» y el interruptor de la voz vivía en la tarjeta del guion; Dave lo quiso aquí. */}
      {e.guionLocucion != null || (e.tipo === 'video' && e.clip) ? (
        <>
          <Separator />
          <Seccion titulo="Sonido">
            {e.guionLocucion != null ? (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="escena-locucion-silenciada">Silenciar la locución</FieldLabel>
                  <FieldDescription>La voz generada se conserva y no suena. No se vuelve a cobrar.</FieldDescription>
                </FieldContent>
                <Switch
                  id="escena-locucion-silenciada"
                  checked={Boolean(e.locucionSilenciada ?? e.mezcla === 'clip-only')}
                  onCheckedChange={(v) => onEscena({ locucionSilenciada: Boolean(v) })}
                />
              </Field>
            ) : null}
            {e.tipo === 'video' && e.clip ? (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="escena-video-silenciado">Silenciar el audio del video</FieldLabel>
                  <FieldDescription>El video se ve, pero su sonido no suena. La locución sigue.</FieldDescription>
                </FieldContent>
                <Switch
                  id="escena-video-silenciado"
                  checked={Boolean(e.videoSilenciado ?? e.mezcla === 'voice-only')}
                  onCheckedChange={(v) => onEscena({ videoSilenciado: Boolean(v) })}
                />
              </Field>
            ) : null}
          </Seccion>
        </>
      ) : null}

      {e.tipo ? (
        <>
          <Separator />
          <Seccion titulo="Duración">
            <Field>
              {/* Se ve como el «Input with time type» de la librería (el valor y el reloj a la derecha), pero en minutos y
                  segundos: el campo de hora nativo muestra la hora del día («12:00:09 a. m.») y no sirve para una duración. */}
              <CampoDuracion
                segundos={e.duracion}
                onCambio={(segundos) => onEscena({ duracion: Math.max(minimo, Math.min(600, segundos)) })}
              />
              <FieldDescription>{ayudaDuracion}</FieldDescription>
            </Field>
          </Seccion>
        </>
      ) : null}

      <ModalRegenerar
        abierto={modal === 'imagen' || modal === 'canvas'}
        tipo={modal === 'canvas' ? 'canvas' : 'imagen'}
        regenerar={modal === 'canvas' ? Boolean(e.canvas?.idea) : e.imagenGenerada}
        semilla={e.guion.split(/(?<=[.!?])\s/)[0] ?? ''}
        onCerrar={() => setModal(null)}
        onGenerar={(idea) => (modal === 'canvas' ? onGenerarCanvas(idea) : onRegenerarImagen(idea))}
      />
      <ModalAvatar
        abierto={modal === 'avatar'}
        valor={e.tipo === 'avatar' ? avatarDeEscena(e, proyecto).id : null}
        genero={vozPorId(vozDe(e, proyecto)).genero}
        conAplicarATodas={conAvatar}
        onCerrar={() => setModal(null)}
        onGuardar={onAvatar}
      />
    </div>
  )
}
