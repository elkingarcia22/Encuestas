import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, File01Icon } from '@hugeicons/core-free-icons'
import { Input, Text, cn } from '@ubits/flux-ui'
import { formatBytes, useFileUpload, type FileWithPreview } from '@ubits/flux-ui/hooks'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'

// Carga de un archivo: lo que se ve es el AdjuntoCsv del equipo (Design system › Estados › Procesos largos), a todo el
// ancho del campo. Aquí solo va la lógica: el hook `useFileUpload` de flux-ui (arrastrar y soltar, selector, formatos
// y tope de peso), los mensajes del producto en español y la barra de subida simulada (el playground no tiene servidor).

export type ArchivoCargado = { nombre: string; peso: number; url: string; archivo: File }

type Props = {
  /** Lo que acepta el selector de archivos (`accept`). */
  acepta: string
  /** Peso máximo en MB. */
  maximoMb: number
  /** Texto de formatos: «PDF · Hasta 250 MB». */
  formatos: string
  titulo?: string
  /** Simula la barra de subida (PDF, video). Sin ella el archivo queda listo de una vez. */
  conProgreso?: boolean
  /** Mensaje de éxito; `false` para no mostrarlo. */
  exito?: string | false
  archivo: ArchivoCargado | null
  onArchivo: (archivo: ArchivoCargado | null) => void
  /** Avisa si la subida simulada está en curso (para deshabilitar el botón de confirmar). */
  onSubiendo?: (subiendo: boolean) => void
  compacta?: boolean
}

export const formatoPeso = (bytes: number) => formatBytes(bytes, 1).replace('.', ',')

/** Los formatos para el mensaje de error: solo las extensiones («.pdf», «.zip»). */
const extensiones = (acepta: string) =>
  acepta
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.startsWith('.') || !r.includes('/'))
    .join(', ')

/** Los mensajes del hook vienen en inglés: aquí van los del producto. */
export function mensajeDeError(error: string, acepta: string, maximoMb: number) {
  if (error.includes('exceeds')) return `El archivo es demasiado grande. El límite es ${maximoMb} MB.`
  if (error.includes('not an accepted')) return `El archivo no es compatible. Solo se aceptan: ${extensiones(acepta)}.`
  return 'No se pudo cargar el archivo. Intenta de nuevo.'
}

export function FileUpload({
  acepta,
  maximoMb,
  formatos,
  titulo = 'Archivo',
  conProgreso = false,
  exito = 'Archivo validado. Puedes continuar.',
  archivo,
  onArchivo,
  onSubiendo,
}: Props) {
  const [progreso, setProgreso] = useState<number | null>(null)
  // El archivo que está subiendo (su nombre se ve en la barra) y los pasos pendientes, para poder cancelar.
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const pasos = useRef<number[]>([])
  useEffect(() => () => pasos.current.forEach((t) => window.clearTimeout(t)), [])

  const recibir = (elegido: FileWithPreview | undefined) => {
    if (!elegido || !(elegido.file instanceof File)) return
    const file = elegido.file
    // La dirección se crea aquí y no se reusa la `preview` del hook: `useFileUpload` revoca al desmontarse todas las
    // que él creó, y estos modales se cierran justo después de confirmar. Con la suya, el archivo quedaba muerto antes
    // de que la página lo pintara (el PDF no abría hasta reemplazarlo). La nuestra vive lo que viva la pestaña, que es
    // lo que dura el borrador.
    const cargado = { nombre: file.name, peso: file.size, url: URL.createObjectURL(file), archivo: file }
    if (!conProgreso) {
      onArchivo(cargado)
      return
    }
    // La subida del prototipo: 12 → 28 → 45 → 62 → 78 → 92 → 100 %, un paso cada 70 ms.
    onSubiendo?.(true)
    onArchivo(null)
    setSubiendo(file.name)
    setProgreso(0)
    pasos.current = [12, 28, 45, 62, 78, 92, 100].map((valor, i) => window.setTimeout(() => setProgreso(valor), 70 * (i + 1)))
    pasos.current.push(
      window.setTimeout(() => {
        setProgreso(null)
        setSubiendo(null)
        onSubiendo?.(false)
        onArchivo(cargado)
      }, 70 * 7 + 120),
    )
  }

  const [{ isDragging, errors }, acciones] = useFileUpload({
    accept: acepta,
    maxSize: maximoMb * 1024 * 1024,
    onFilesAdded: ([elegido]) => recibir(elegido),
  })

  const quitar = () => {
    // Quitar a mitad de la subida la cancela: el archivo no vuelve a aparecer al terminar la barra.
    pasos.current.forEach((t) => window.clearTimeout(t))
    pasos.current = []
    setProgreso(null)
    setSubiendo(null)
    onSubiendo?.(false)
    acciones.clearFiles()
    onArchivo(null)
  }

  const error = errors[0] ? mensajeDeError(errors[0], acepta, maximoMb) : null
  const esImagen = Boolean(archivo?.archivo.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(archivo?.nombre ?? ''))

  return (
    <div className="flex w-full flex-col gap-2">
      <AdjuntoCsv
        estado={progreso !== null ? 'uploading' : archivo ? 'done' : error ? 'error' : 'idle'}
        vacio={{ titulo: isDragging ? 'Suelta el archivo aquí' : titulo, descripcion: `Arrástralo aquí o elígelo · ${formatos}` }}
        nombre={archivo?.nombre ?? subiendo ?? 'No se pudo cargar el archivo'}
        descripcion={progreso !== null ? `Subiendo · ${progreso} %` : error ?? (archivo?.peso ? formatoPeso(archivo.peso) : formatos)}
        porcentaje={progreso ?? 0}
        icono={File01Icon}
        imagen={archivo && esImagen ? archivo.url : undefined}
        className={cn('w-full!', isDragging && 'border-primary bg-primary/5')}
        zona={{ onDragEnter: acciones.handleDragEnter, onDragLeave: acciones.handleDragLeave, onDragOver: acciones.handleDragOver, onDrop: acciones.handleDrop }}
        onElegir={acciones.openFileDialog}
        onQuitar={quitar}
        onReintentar={() => {
          acciones.clearErrors()
          acciones.openFileDialog()
        }}
      />
      <Input {...acciones.getInputProps({ className: 'hidden', tabIndex: -1, 'aria-hidden': true })} />

      {archivo && exito && !error ? (
        <Text as="p" size="sm" className="flex items-center gap-1.5 text-success" role="status">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} aria-hidden="true" />
          {exito}
        </Text>
      ) : null}
    </div>
  )
}
