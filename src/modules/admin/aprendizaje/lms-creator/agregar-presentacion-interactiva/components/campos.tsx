import { useState } from 'react'
import { Image01Icon } from '@hugeicons/core-free-icons'
import {
  Input,
  cn,
} from '@ubits/flux-ui'
import { mensajeDeError } from '../../crear-contenido/components/file-upload'
import { useFileUpload } from '@ubits/flux-ui/hooks'
import { ACENTO_POR_DEFECTO, acento as buscarAcento, type AcentoId } from '../../crear-contenido/components/presentacion/datos'
import { CampoColorLibre } from '../../crear-contenido/components/color-libre'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'

// Campos compartidos por el setup y por «Ajustes de la presentación» del editor: el color y el logo.

/**
 * Color de la presentación: el input de color de flux-ui, libre como en el prototipo. Arranca en el color de la marca
 * (el token del tema) y cambia en vivo al elegir otro; «Usar el de la marca» vuelve al token (ver color-libre).
 */
export function CampoColor({
  valor,
  onCambio,
  id = 'pi-color',
  ocultarEtiqueta,
}: {
  valor: AcentoId
  onCambio: (id: AcentoId) => void
  id?: string
  ocultarEtiqueta?: boolean
}) {
  return (
    <CampoColorLibre
      id={id}
      etiqueta="Color"
      descripcion="Se aplica a todas las diapositivas."
      valor={valor}
      claseToken={buscarAcento(valor).fondo}
      porDefecto={ACENTO_POR_DEFECTO}
      onCambio={onCambio}
      ocultarEtiqueta={ocultarEtiqueta}
    />
  )
}

const ACEPTA_LOGO = 'image/png,.png'

/** Logo PNG de la empresa (opcional, hasta 2 MB). Se guarda como data URL para que viaje con la presentación. */
export function CampoLogo({ logo, onCambio }: { logo: string | null; onCambio: (logo: string | null) => void }) {
  const [nombre, setNombre] = useState('Logo de la empresa')

  // El hook oficial de flux-ui (el del FileUpload del Storybook): selector, arrastrar y soltar, formato y peso.
  const [{ isDragging, errors }, acciones] = useFileUpload({
    accept: ACEPTA_LOGO,
    maxSize: 2 * 1024 * 1024,
    onFilesAdded: ([elegido]) => {
      const archivo = elegido?.file
      if (!(archivo instanceof File)) return
      const lector = new FileReader()
      lector.onload = () => {
        setNombre(archivo.name)
        onCambio(typeof lector.result === 'string' ? lector.result : null)
      }
      lector.readAsDataURL(archivo)
    },
  })

  // Lo que se ve es el AdjuntoCsv del equipo (Design system › Estados › Procesos largos), a todo el ancho.
  return (
    <div className="flex flex-col gap-2">
      <Input {...acciones.getInputProps({ className: 'hidden', tabIndex: -1, 'aria-hidden': true })} />
      <AdjuntoCsv
        estado={logo ? 'done' : errors.length ? 'error' : 'idle'}
        vacio={{ titulo: isDragging ? 'Suelta el logo aquí' : 'Subir logo', descripcion: 'PNG · hasta 2 MB' }}
        nombre={logo ? nombre : 'No se pudo cargar el logo'}
        descripcion={logo ? 'PNG · hasta 2 MB' : errors[0] ? mensajeDeError(errors[0], ACEPTA_LOGO, 2) : ''}
        icono={Image01Icon}
        imagen={logo ?? undefined}
        className={cn('w-full!', isDragging && 'border-primary bg-primary/5')}
        zona={{ onDragEnter: acciones.handleDragEnter, onDragLeave: acciones.handleDragLeave, onDragOver: acciones.handleDragOver, onDrop: acciones.handleDrop }}
        onElegir={acciones.openFileDialog}
        onQuitar={() => {
          acciones.clearFiles()
          onCambio(null)
        }}
        onReintentar={() => {
          acciones.clearErrors()
          acciones.openFileDialog()
        }}
      />
    </div>
  )
}
