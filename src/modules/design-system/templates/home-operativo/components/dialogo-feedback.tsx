import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Bug01Icon, Cancel01Icon, Idea01Icon, Image01Icon, ThumbsUpIcon, Upload01Icon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  Button,
  Checkbox,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

import { MODULOS_FEEDBACK } from './data'

// Feedback se abre desde el pie del menú lateral: es un modal, no una página (HU-INI-002).
// El formulario sale del concepto de producto; al enviar muestra el agradecimiento y se cierra.

const TIPOS = [
  { valor: 'mejora', etiqueta: 'Mejora', icono: ThumbsUpIcon },
  { valor: 'error', etiqueta: 'Error', icono: Bug01Icon },
  { valor: 'idea', etiqueta: 'Idea', icono: Idea01Icon },
]

const MAXIMO = 500

export function DialogoFeedback({ abierto, onAbierto }: { abierto: boolean; onAbierto: (abierto: boolean) => void }) {
  const [tipo, setTipo] = useState('mejora')
  const [modulo, setModulo] = useState(MODULOS_FEEDBACK[0])
  const [comentario, setComentario] = useState('')
  const [pantallazo, setPantallazo] = useState<'vacio' | 'subiendo' | 'listo'>('vacio')
  const [contexto, setContexto] = useState(true)
  const [contactar, setContactar] = useState(false)
  const [enviado, setEnviado] = useState(false)

  // El agradecimiento se queda un momento y el modal se cierra solo.
  useEffect(() => {
    if (!enviado) return
    const espera = window.setTimeout(() => onAbierto(false), 2200)
    return () => window.clearTimeout(espera)
  }, [enviado, onAbierto])

  useEffect(() => {
    if (pantallazo !== 'subiendo') return
    const espera = window.setTimeout(() => setPantallazo('listo'), 1200)
    return () => window.clearTimeout(espera)
  }, [pantallazo])

  return (
    // La ventana del sistema (`ActionDialog`, decisión 4 de la auditoría): título fijo y la X arriba, el formulario en el
    // cuerpo y el pie gris con Cancelar y Enviar. «Enviar» no cierra: deja el agradecimiento un momento y se cierra sola.
    <ActionDialog
      open={abierto}
      onOpenChange={onAbierto}
      title="Enviar feedback"
      sub={enviado ? undefined : 'Cuéntanos qué funciona bien y qué podemos mejorar.'}
      hideFooter={enviado}
      footer={
        <>
          <Button variant="outline" onClick={() => onAbierto(false)}>
            Cancelar
          </Button>
          <Button disabled={!comentario.trim()} onClick={() => setEnviado(true)}>
            Enviar feedback
          </Button>
        </>
      }
    >
        {enviado ? (
          // «Todo listo» con la ilustración del sistema, no un icono de línea (decisión 14 de la auditoría).
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <ImagenGlass nombre="glass-tick" />
              </EmptyMedia>
              <EmptyTitle>¡Gracias por tu feedback!</EmptyTitle>
              <EmptyDescription>
                Tu comentario llegó al equipo de producto de UBITS. Nos ayuda a priorizar lo que de verdad importa.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <FieldGroup>
              <FieldSet>
                <FieldLegend variant="label">Tipo de feedback</FieldLegend>
                <ToggleGroup
                  variant="outline"
                  size="sm"
                  value={[tipo]}
                  onValueChange={(valor) => valor[0] && setTipo(String(valor[0]))}
                  aria-label="Tipo de feedback"
                >
                  {TIPOS.map((opcion) => (
                    <ToggleGroupItem key={opcion.valor} value={opcion.valor}>
                      <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                      {opcion.etiqueta}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldSet>

              <Field>
                <FieldLabel htmlFor="feedback-modulo">Módulo</FieldLabel>
                <Select value={modulo} onValueChange={(valor) => setModulo(String(valor ?? MODULOS_FEEDBACK[0]))}>
                  <SelectTrigger id="feedback-modulo" className="w-full">
                    <SelectValue>{(valor) => String(valor)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MODULOS_FEEDBACK.map((opcion) => (
                      <SelectItem key={opcion} value={opcion}>
                        {opcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="feedback-comentario">Comentarios</FieldLabel>
                <Textarea
                  id="feedback-comentario"
                  rows={4}
                  maxLength={MAXIMO}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value.slice(0, MAXIMO))}
                  placeholder="Describe el problema, tu idea o lo que quieras contarnos. Entre más contexto, mejor."
                />
                <div className="flex justify-end">
                  <FieldDescription aria-live="polite">
                    {comentario.length}/{MAXIMO}
                  </FieldDescription>
                </div>
              </Field>

              <Field>
                <FieldLabel>Pantallazos (opcional)</FieldLabel>
                {pantallazo === 'vacio' ? (
                  <Attachment state="idle">
                    <AttachmentMedia>
                      <HugeiconsIcon icon={Upload01Icon} aria-hidden="true" />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>Haz clic para adjuntar imágenes</AttachmentTitle>
                      <AttachmentDescription>PNG o JPG, máx. 5</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentTrigger aria-label="Adjuntar imágenes" onClick={() => setPantallazo('subiendo')} />
                  </Attachment>
                ) : (
                  <Attachment state={pantallazo === 'subiendo' ? 'uploading' : 'done'}>
                    <AttachmentMedia>
                      <HugeiconsIcon icon={Image01Icon} aria-hidden="true" />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>pantallazo-inicio.png</AttachmentTitle>
                      <AttachmentDescription>{pantallazo === 'subiendo' ? 'Subiendo…' : '248 KB'}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction aria-label="Quitar pantallazo" onClick={() => setPantallazo('vacio')}>
                        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                )}
              </Field>

              <Field orientation="horizontal">
                <Checkbox id="feedback-contexto" checked={contexto} onCheckedChange={(valor) => setContexto(Boolean(valor))} />
                <FieldLabel htmlFor="feedback-contexto">Incluir contexto técnico (página actual, navegador, resolución)</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="feedback-contactar" checked={contactar} onCheckedChange={(valor) => setContactar(Boolean(valor))} />
                <FieldLabel htmlFor="feedback-contactar">Pueden contactarme sobre este feedback</FieldLabel>
              </Field>
            </FieldGroup>
          </>
        )}
    </ActionDialog>
  )
}
