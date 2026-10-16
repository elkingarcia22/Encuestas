import { useState, type RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Button,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Slider,
  Text,
  Textarea,
  cn,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { Hint } from '@/shared/components/Hint'
import { MOVIMIENTOS, minutos, vozPorId, type MovimientoId } from '../datos'
import { CuadroEscena, Escalado } from '../lienzo'
import { CapaIA } from '../piezas'
import { BotonVoz, ModalVoz } from '../selectores'
import { faltaEnEscena, ocupada, tieneLocucionVigente, vozDe, type Escena, type Proyecto } from '../proyecto'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { clasesTransicion, type useReproductor } from './reproductor'

// Centro del editor: la vista previa 16:9 de la escena (con la diapositiva editable en el sitio si es canvas), la
// línea de tiempo con reproducir, el cabezal y la animación, y la tarjeta del guion con su voz y «Generar audio».

type Props = {
  proyecto: Proyecto
  escena: Escena | undefined
  indice: number
  ahora: number
  reproductor: ReturnType<typeof useReproductor>
  renderizando: boolean
  guionRef: RefObject<HTMLTextAreaElement | null>
  onEscena: (cambio: Partial<Escena>) => void
  onGenerarAudio: (voz?: string) => void
  /** La capa del canvas elegida: la comparten la vista previa y Propiedades. */
  capaElegida?: string | null
  onCapaElegida?: (id: string | null) => void
}

function capa(e: Escena, i: number, total: number, ahora: number) {
  if (!ocupada(e, ahora) || !e.ocupada) return null
  switch (e.ocupada.motivo) {
    case 'cola':
      return { titulo: `Generando escena ${i + 1}`, detalle: `${i + 1} de ${total}` }
    case 'sincronizar':
      return { titulo: 'Sincronizando avatar', detalle: `Escena ${i + 1}` }
    case 'canvas':
      return { titulo: e.canvas?.idea ? 'Regenerando canvas' : 'Generando canvas', detalle: `Escena ${i + 1}` }
    case 'imagen':
      return { titulo: 'Regenerando media', detalle: `Escena ${i + 1}` }
    default:
      return null
  }
}

export function VistaPrevia({ proyecto, escena, indice, ahora, reproductor, renderizando, guionRef, onEscena, onGenerarAudio, capaElegida = null, onCapaElegida }: Props) {
  const [modalVoz, setModalVoz] = useState(false)
  const { reproduciendo, tiempo, cruce, reproducir, pausar, buscar } = reproductor

  if (!escena) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const e = escena
  const sobre = renderizando ? null : capa(e, indice, proyecto.escenas.length, ahora)
  const generandoAudio = e.ocupada?.motivo === 'audio' && ocupada(e, ahora)
  const sincronizando = e.ocupada?.motivo === 'sincronizar' && ocupada(e, ahora)
  const voz = vozPorId(vozDe(e, proyecto))
  const vigente = tieneLocucionVigente(e, proyecto)
  const puedeAudio = Boolean(e.guion.trim()) && !vigente && !generandoAudio && !ocupada(e, ahora)
  const regenerar = e.guionLocucion != null
  const anterior = cruce ? proyecto.escenas.find((x) => x.id === cruce.desde) : undefined
  const clases = cruce ? clasesTransicion(cruce.transicion) : null
  const falta = faltaEnEscena(e, proyecto)
  const pistaPlay = generandoAudio ? 'Regenerando audio' : sincronizando ? 'Sincronizando avatar' : reproduciendo ? 'Pausar' : 'Reproducir'
  const t = Math.min(tiempo, e.duracion)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        <Escalado>
          <div className={cn('relative size-full', clases?.escenario)}>
            {anterior && clases ? (
              <div key={`sale-${cruce?.clave}`} className={cn('absolute inset-0', clases.sale)}>
                <CuadroEscena proyecto={proyecto} escena={anterior} tiempo={anterior.duracion} />
              </div>
            ) : null}
            <div key={`entra-${cruce?.clave ?? 'fijo'}`} className={cn('absolute inset-0', clases?.entra)}>
              <CuadroEscena
                proyecto={proyecto}
                escena={e}
                tiempo={t}
                reproduciendo={reproduciendo}
                editable={!reproduciendo && !sobre}
                seleccion={capaElegida}
                onSeleccion={onCapaElegida}
                onCapasLibres={(capasLibres) => e.canvas && onEscena({ canvas: { ...e.canvas, capasLibres } })}
              />
            </div>
          </div>
        </Escalado>
        {sobre ? <CapaIA titulo={sobre.titulo} detalle={sobre.detalle} /> : null}
        {/* Encima de la escena (no dentro del lienzo escalado): así el estado vacío se lee a su tamaño. */}
        {falta && !sobre ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <PrimeraVez
              icono={falta.icono}
              titulo={falta.titulo}
              descripcion={falta.descripcion}
              className="py-4"
              accion={'locucion' in falta && puedeAudio ? { texto: 'Generar locución', onClick: () => onGenerarAudio() } : undefined}
            />
          </div>
        ) : null}
      </div>

      {e.tipo ? (
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 max-[800px]:grid-cols-[auto_1fr] min-[801px]:grid-cols-[auto_1fr_auto]">
          <Hint label={pistaPlay}>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full!"
              aria-label={pistaPlay}
              disabled={generandoAudio || sincronizando || renderizando}
              onClick={() => (reproduciendo ? pausar() : reproducir())}
            >
              <HugeiconsIcon icon={generandoAudio || sincronizando ? Loading03Icon : reproduciendo ? PauseIcon : PlayIcon} className={generandoAudio || sincronizando ? 'animate-spin' : undefined} aria-hidden="true" />
            </Button>
          </Hint>
          <div className="flex min-w-0 flex-col gap-1">
            <Slider
              value={[t]}
              min={0}
              max={Math.max(0.1, e.duracion)}
              step={0.1}
              aria-label="Posición en la escena"
              aria-valuetext={`${minutos(t)} de ${minutos(e.duracion)}`}
              onValueChange={(v) => buscar(Array.isArray(v) ? (v[0] ?? 0) : Number(v))}
              onKeyDown={(ev) => {
                if (ev.key === 'Home') buscar(0)
                if (ev.key === 'End') buscar(e.duracion)
              }}
            />
            <div className="flex justify-between">
              {[0, e.duracion / 2, e.duracion].map((m, i) => (
                <Text key={i} as="span" size="xs" variant="muted" className="tabular-nums">
                  {minutos(m)}
                </Text>
              ))}
            </div>
          </div>
          {e.tipo === 'imagen' || e.tipo === 'avatar' ? (
            <Field orientation="horizontal" className="w-auto items-center gap-2 max-[800px]:col-span-2">
              <FieldLabel htmlFor="escena-animacion" className="shrink-0">
                Animación
              </FieldLabel>
              <Select value={e.movimiento} onValueChange={(v) => onEscena({ movimiento: v as MovimientoId })}>
                <SelectTrigger id="escena-animacion" size="sm" className="w-36 max-[800px]:w-full">
                  <SelectValue>{(v) => MOVIMIENTOS.find((m) => m.id === v)?.label ?? ''}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {MOVIMIENTOS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </div>
      ) : null}

      <Frame spacing="sm">
        <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <FrameTitle>Locución de la escena</FrameTitle>
          <BotonVoz voz={voz} onClick={() => setModalVoz(true)} deshabilitado={generandoAudio} />
        </FrameHeader>
        <FramePanel className="flex flex-col gap-3">
        <Textarea
          ref={guionRef}
          aria-label={`Guion de la escena ${indice + 1}`}
          rows={4}
          placeholder="Escribe el guion que se narrará en esta escena…"
          value={e.guion}
          disabled={generandoAudio}
          onChange={(ev) => onEscena({ guion: ev.target.value })}
        />
        <div className="flex justify-end">
          <BotonIaSecundario size="sm" disabled={!puedeAudio} onClick={() => onGenerarAudio()}>
            {generandoAudio ? (regenerar ? 'Regenerando audio' : 'Generando audio') : regenerar ? 'Regenerar audio' : 'Generar audio'}
          </BotonIaSecundario>
        </div>
        {/* Silenciar la locución solo en esta escena, cuando ya está generada (14-oct): se conserva y no se cobra de
            nuevo; si se vuelve a encender, suena la misma. Como «Esta escena no lleva locución» del editor de producción. */}
        </FramePanel>
      </Frame>

      <ModalVoz
        abierto={modalVoz}
        titulo="Voz de esta escena"
        modo="escena"
        valor={voz.id}
        accion={regenerar ? 'Regenerar audio' : 'Generar audio'}
        onCerrar={() => setModalVoz(false)}
        onElegir={(id) => onGenerarAudio(id)}
      />
    </div>
  )
}
