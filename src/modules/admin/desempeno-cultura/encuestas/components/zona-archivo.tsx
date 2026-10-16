import { useRef, useState, type DragEvent } from 'react'
import { Input } from '@ubits/flux-ui'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'

// Para soltar o elegir un archivo de verdad (los importadores del módulo leen el archivo:
// no es una carga simulada). Revisa la extensión y el peso antes de entregarlo, y devuelve el
// motivo del rechazo con el mismo texto que usa el prototipo.

export type RechazoArchivo = { titulo: string; detalle: string }

const MB = 1024 * 1024

export function ZonaArchivo({
  titulo = 'Elige el archivo o arrástralo aquí',
  descripcion,
  extensiones,
  maximoBytes,
  onArchivo,
  onArchivos,
  onRechazo,
}: {
  titulo?: string
  descripcion: string
  /** Con punto: ['.csv', '.xlsx']. */
  extensiones: readonly string[]
  maximoBytes: number
  onArchivo?: (archivo: File) => void
  /** Con esto acepta varios a la vez (la carga histórica): entrega los que pasan la revisión. */
  onArchivos?: (archivos: File[]) => void
  onRechazo: (rechazo: RechazoArchivo) => void
}) {
  const campo = useRef<HTMLInputElement>(null)
  const [encima, setEncima] = useState(false)

  const varios = onArchivos !== undefined
  const aceptable = (archivo: File): boolean => {
    const extension = archivo.name.includes('.') ? archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase() : ''
    if (!extensiones.includes(extension)) {
      onRechazo({ titulo: 'Formato no admitido', detalle: `«${archivo.name}» no es ${extensiones.join(' ni ')}. Sube un archivo en uno de esos formatos.` })
      return false
    }
    if (archivo.size > maximoBytes) {
      onRechazo({ titulo: 'Archivo demasiado grande', detalle: `«${archivo.name}» pesa más de ${Math.round(maximoBytes / MB)} MB.` })
      return false
    }
    return true
  }
  const revisar = (lista: FileList | null | undefined) => {
    const archivos = Array.from(lista ?? [])
    if (archivos.length === 0) return
    if (!varios) {
      if (aceptable(archivos[0])) onArchivo?.(archivos[0])
      return
    }
    const buenos = archivos.filter(aceptable)
    if (buenos.length > 0) onArchivos(buenos)
  }

  const soltar = (evento: DragEvent) => {
    evento.preventDefault()
    setEncima(false)
    revisar(evento.dataTransfer.files)
  }

  // Lo visible es el AdjuntoCsv del design system (Estados › Procesos largos), el mismo de Formularios › «Desde
  // archivo»: el adjunto vacío con su botón de elegir, que también recibe el archivo arrastrado.
  return (
    <>
      <AdjuntoCsv
        estado="idle"
        // A todo el ancho y en azul mientras se arrastra encima, como el cargador del LMS (Ajustes propios › Cargador de archivos).
        className={encima ? 'w-full! border-primary bg-primary/5' : 'w-full!'}
        vacio={{ titulo: encima ? (varios ? 'Suelta los archivos para cargarlos' : 'Suelta el archivo para cargarlo') : titulo, descripcion }}
        nombre=""
        descripcion=""
        etiquetaElegir={varios ? 'Elegir archivos' : 'Elegir un archivo'}
        onElegir={() => campo.current?.click()}
        onQuitar={() => undefined}
        zona={{
          onDragOver: (evento) => {
            evento.preventDefault()
            setEncima(true)
          },
          onDragLeave: () => setEncima(false),
          onDrop: soltar,
        }}
      />
      <Input
        ref={campo}
        type="file"
        accept={extensiones.join(',')}
        multiple={varios}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(evento) => {
          revisar(evento.target.files)
          evento.target.value = ''
        }}
      />
    </>
  )
}
