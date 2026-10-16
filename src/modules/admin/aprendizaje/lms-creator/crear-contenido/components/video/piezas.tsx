import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { Text, cn, toast } from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { InstruccionGrande } from '../marco-inmersivo'
import { TokenCost } from '../tokens'

// Piezas compartidas del recurso Video: el envoltorio de las pestañas de «Agregar video», los avisos,
// la insignia de tokens con su cuenta regresiva, la capa de «la IA está trabajando» y el botón de escuchar una muestra.

// ── El envoltorio de una pestaña de «Agregar video» ──────────────────────────────────────────────────────────────

// Las cuatro pestañas arrancan igual: una línea que dice qué se hace ahí y, debajo, lo suyo. Antes cada una traía su
// propio ancho, su relleno y su separación —tres anchos distintos que además ya no se aplicaban, porque el modal
// recorta antes—, y el encabezado iba de un título grande a nada según la pestaña. El ancho lo pone el modal; aquí no
// se vuelve a fijar. El relleno de arriba es de 8px y no más: sumado al aire de la tira de pestañas deja los mismos
// 20px entre la cabecera y la instrucción que tienen Agregar PDF, embebido y SCORM. Abajo no pone nada, porque el
// cuerpo del modal ya trae el suyo. Sin alto mínimo: cada pestaña mide lo que ocupa su contenido. Se probó fijarlo
// para que el modal no cambiara de tamaño entre pestañas y salió peor, con aire muerto abajo (1-oct). Sin ilustración: la que tenían Enlace y Subir entró para tapar el vacío de la pantalla completa,
// y desde que el modal se ajusta a su contenido sobra.
export function PestanaVideo({
  antes,
  clave,
  despues,
  children,
}: {
  antes: string
  clave: string
  /** La cola después de la palabra resaltada; vacía si la frase termina ahí. */
  despues: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full min-w-0 flex-col items-center gap-6 overflow-x-clip pt-2">
      <InstruccionGrande antes={antes} clave={clave} despues={despues} />
      {/* Lo propio de cada pestaña: a lo ancho, y alineado como le toque (el formulario del avatar va a la izquierda). */}
      <div className="flex w-full min-w-0 flex-col gap-5">{children}</div>
    </div>
  )
}

/** Avisos con tono (el `notify` del proyecto no lleva tipo): advertencia, información, éxito. */
export function aviso(tipo: 'warning' | 'info' | 'success' | 'error', titulo: string, descripcion?: string) {
  toast.add({ type: tipo, title: titulo, description: descripcion })
}

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** Texto de un botón de IA con su costo: «Generar video 🪙 320» (moneda y número, como en los secundarios). */
export const conCosto = (texto: string, costo: number) => (
  <>
    {texto}
    <TokenCost cost={costo} />
  </>
)

// ── La IA trabajando ─────────────────────────────────────────────────────────────────────────────────────────────

/** Capa sobre una vista previa o un panel: «Generando escena 3» / «3 de 30». */
export function CapaIA({ titulo, detalle, className }: { titulo: string; detalle?: string; className?: string }) {
  return (
    <div className={cn('absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-background/85 p-4 text-center backdrop-blur-sm', className)}>
      <AiThinking label={titulo} />
      {detalle ? (
        <Text as="p" size="xs" variant="muted">
          {detalle}
        </Text>
      ) : null}
    </div>
  )
}

// ── Escuchar una muestra ─────────────────────────────────────────────────────────────────────────────────────────

let sonando: HTMLAudioElement | null = null

/** Solo suena una muestra a la vez en toda la pantalla. */
export function useMuestra() {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(
    () => () => {
      sonando?.pause()
      sonando = null
    },
    [],
  )
  const alternar = (url: string, loop = false) => {
    if (sonando && src === url) {
      sonando.pause()
      sonando = null
      setSrc(null)
      return
    }
    sonando?.pause()
    const audio = new Audio(url)
    audio.loop = loop
    audio.onended = () => setSrc(null)
    sonando = audio
    setSrc(url)
    void audio.play().catch(() => setSrc(null))
  }
  const detener = () => {
    sonando?.pause()
    sonando = null
    setSrc(null)
  }
  return { sonando: src, alternar, detener }
}

export function IconoReproducir({ activo, cargando }: { activo: boolean; cargando?: boolean }) {
  if (cargando) return <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" aria-hidden="true" />
  return <HugeiconsIcon icon={activo ? PauseIcon : PlayIcon} size={16} aria-hidden="true" />
}
