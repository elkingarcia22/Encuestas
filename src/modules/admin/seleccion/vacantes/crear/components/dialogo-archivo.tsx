import { useEffect, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Cancel01Icon, CloudUploadIcon, File01Icon, TextAlignLeftIcon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Textarea,
} from '@ubits/flux-ui'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'

type Metodo = null | 'archivo' | 'texto'
type EstadoArchivo = 'vacio' | 'subiendo' | 'listo'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Devuelve el texto de partida para armar las secciones de la descripción.
  onUsar: (origen: string) => void
}

// «Crear desde archivo»: primero se elige de dónde sale la descripción y luego se trae.
// Son dos pasos dentro del mismo diálogo, con vuelta atrás a la lista de métodos. Va en la ventana del design system
// (`ActionDialog`, 1 oct), con su ancho y su pie gris; antes era un diálogo de la librería con el ancho puesto a mano.
// La vuelta atrás es la flecha de la propia ventana, junto al título (`onBack`, 5-oct).
export function DialogoArchivo({ open, onOpenChange, onUsar }: Props) {
  const [metodo, setMetodo] = useState<Metodo>(null)
  const [archivo, setArchivo] = useState<EstadoArchivo>('vacio')
  const [pegado, setPegado] = useState('')

  // Al cerrar se vuelve al principio: la próxima vez que se abra no aparece a medio camino.
  useEffect(() => {
    if (open) return
    setMetodo(null)
    setArchivo('vacio')
    setPegado('')
  }, [open])

  const listo = metodo === 'archivo' ? archivo === 'listo' : pegado.trim().length > 0

  return (
    <VentanaDeAccion
      open={open}
      onOpenChange={onOpenChange}
      title={metodo === null ? 'Crear desde archivo' : metodo === 'archivo' ? 'Subir documento' : 'Pegar la descripción'}
      sub={
        metodo === null
          ? 'Trae una descripción que ya tengas escrita y la repartimos en secciones.'
          : metodo === 'archivo'
            ? 'Sube un archivo PDF, Word o TXT con la descripción.'
            : 'Pega el texto tal como lo tengas; nosotros lo separamos en secciones.'
      }
      onBack={metodo === null ? undefined : () => setMetodo(null)}
      confirmLabel="Armar las secciones"
      confirmDisabled={!listo}
      onConfirm={() => onUsar(metodo === 'archivo' ? 'perfil-desarrollador-backend.pdf' : 'el texto que pegaste')}
    >

        {metodo === null ? (
          <div className="flex flex-col gap-3">
            <OpcionMetodo
              icono={File01Icon}
              titulo="Subir un documento"
              detalle="PDF, Word o TXT de hasta 10 MB"
              onElegir={() => setMetodo('archivo')}
            />
            <OpcionMetodo
              icono={TextAlignLeftIcon}
              titulo="Pegar el texto"
              detalle="Si la tienes en un correo o en un documento compartido"
              onElegir={() => setMetodo('texto')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {metodo === 'archivo' ? <ZonaArchivo estado={archivo} onEstado={setArchivo} /> : null}

            {metodo === 'texto' ? (
              <Field>
                <FieldLabel htmlFor="descripcion-pegada">Descripción de la vacante</FieldLabel>
                <Textarea
                  id="descripcion-pegada"
                  rows={8}
                  value={pegado}
                  placeholder="Pega aquí la descripción completa"
                  onChange={(evento) => setPegado(evento.target.value)}
                />
                <FieldDescription>La repartimos en secciones y después puedes moverlas y corregirlas.</FieldDescription>
              </Field>
            ) : null}
          </div>
        )}
    </VentanaDeAccion>
  )
}

// Cada método es una fila de la librería (Item) que se pulsa entera: va sobre un elemento botón, como las demás filas
// clicables del admin, y así no hay que forzarle alto ni salto de línea con «!» (decisión 4 de la auditoría, 5-oct).
function OpcionMetodo({
  icono,
  titulo,
  detalle,
  onElegir,
}: {
  icono: IconSvgElement
  titulo: string
  detalle: string
  onElegir: () => void
}) {
  return (
    <Item variant="outline" render={<button type="button" />} onClick={onElegir} className="w-full cursor-pointer text-left">
      <ItemMedia variant="icon">
        <HugeiconsIcon icon={icono} aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{titulo}</ItemTitle>
        <ItemDescription>{detalle}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

// Recuadro para soltar el archivo. Mientras no haya uno, es un estado vacío con el botón para elegirlo;
// en cuanto lo hay, pasa a ser el adjunto con su estado de subida.
function ZonaArchivo({ estado, onEstado }: { estado: EstadoArchivo; onEstado: (estado: EstadoArchivo) => void }) {
  if (estado === 'vacio') {
    return (
      <Empty className="rounded-xl border border-dashed py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={CloudUploadIcon} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Arrastra tu archivo aquí</EmptyTitle>
          <EmptyDescription>PDF, Word o TXT, hasta 10 MB</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            onClick={() => {
              onEstado('subiendo')
              window.setTimeout(() => onEstado('listo'), 1400)
            }}
          >
            Elegir un archivo
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Attachment state={estado === 'subiendo' ? 'uploading' : 'done'}>
      <AttachmentMedia>
        <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>perfil-desarrollador-backend.pdf</AttachmentTitle>
        <AttachmentDescription>{estado === 'subiendo' ? 'Subiendo…' : 'Encontramos 4 secciones'}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Quitar el archivo" onClick={() => onEstado('vacio')}>
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  )
}
