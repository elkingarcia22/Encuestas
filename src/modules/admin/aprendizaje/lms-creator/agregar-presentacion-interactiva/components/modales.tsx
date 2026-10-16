import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
  Button,
  Field,
  Input,
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { BotonIa } from '@/shared/components/BotonIa'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { CATALOGO_TIPOS, COSTO_REGENERAR, type AcentoId } from '../../crear-contenido/components/presentacion/datos'
import { CampoColor, CampoLogo } from './campos'
import { Resaltado, TextoResaltado } from '@/modules/design-system/tipografia/texto-resaltado'
import { TokenBadge, TokenCost } from '../../crear-contenido/components/tokens'
import { ActionDialog } from '@/shared/components/ActionDialog'

// Ventanas del editor de diapositivas: añadir, ajustes (color y logo) y regenerar con IA, con la única ventana del
// sistema (ActionDialog, decisión 4 de la auditoría, 5-oct). La confirmación de eliminar usa el DialogoConfirmar del
// sistema de diseño y la de generar, ConfirmarGeneracion.

/** «Añadir diapositiva»: todos los tipos menos la portada (RN-09). La plantilla nace vacía. */
export function ModalAnadir({ abierto, onCerrar, onElegir }: { abierto: boolean; onCerrar: () => void; onElegir: (tipo: string) => void }) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="wide"
      title="Añadir diapositiva"
      sub="Elige el tipo. La plantilla nace vacía para que escribas el contenido."
    >
      <div className="-mx-1 grid min-h-0 grid-cols-2 gap-2 overflow-auto px-1 min-[1101px]:grid-cols-3" role="list" aria-label="Tipos de diapositiva">
        {CATALOGO_TIPOS.filter((t) => t.type !== 'intro').map((t) => (
          <Item key={t.type} role="listitem" variant="outline" size="sm" render={<button type="button" />} className="text-left" onClick={() => onElegir(t.type)}>
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={t.icon} size={20} />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>{t.label}</ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </div>
    </ActionDialog>
  )
}

/** «Ajustes de la presentación»: color y logo para todas las diapositivas. */
export function ModalAjustes({
  abierto,
  onCerrar,
  acento,
  onAcento,
  logo,
  onLogo,
}: {
  abierto: boolean
  onCerrar: () => void
  acento: AcentoId
  onAcento: (id: AcentoId) => void
  logo: string | null
  onLogo: (logo: string | null) => void
}) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      title="Ajustes de la presentación"
      sub="Color y logo que se aplican a todas las diapositivas."
      footer={<Button onClick={onCerrar}>Listo</Button>}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Text size="sm" weight="semibold">
              Color
            </Text>
            <Text size="xs" variant="muted">
              Acento de marca de la presentación.
            </Text>
          </div>
          <CampoColor id="pi-ajustes-color" valor={acento} onCambio={onAcento} ocultarEtiqueta />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <Text size="sm" weight="semibold" className="flex items-center gap-2">
              Logo de la empresa
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </Text>
            <Text size="xs" variant="muted">
              Se muestra en la portada y en el paquete SCORM generado.
            </Text>
          </div>
          <CampoLogo logo={logo} onCambio={onLogo} />
        </div>
      </div>
    </ActionDialog>
  )
}

const MIN_PALABRAS = 6
const MAX_PALABRAS = 120
const contarPalabras = (texto: string) => texto.trim().split(/\s+/).filter(Boolean).length

type Adjunto = { nombre: string; url: string }

/** «Regenerar diapositiva» (P4RegenImageModal, variante diapositiva): una idea de 6 a 120 palabras y 50 tokens. */
export function ModalRegenerar({
  abierto,
  onCerrar,
  tokens,
  ideaPrevia,
  onGenerar,
}: {
  abierto: boolean
  onCerrar: () => void
  tokens: number
  ideaPrevia: string
  onGenerar: (idea: string) => void
}) {
  // Cada apertura monta el contenido de nuevo: parte de la idea previa y sin adjuntos.
  const [vez, setVez] = useState(0)
  const [estabaAbierto, setEstabaAbierto] = useState(abierto)
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto)
    if (abierto) setVez((v) => v + 1)
  }
  return <ContenidoRegenerar key={vez} abierto={abierto} onCerrar={onCerrar} tokens={tokens} ideaPrevia={ideaPrevia} onGenerar={onGenerar} />
}

function ContenidoRegenerar({
  abierto,
  onCerrar,
  tokens,
  ideaPrevia,
  onGenerar,
}: {
  abierto: boolean
  onCerrar: () => void
  tokens: number
  ideaPrevia: string
  onGenerar: (idea: string) => void
}) {
  const [idea, setIdea] = useState(ideaPrevia)
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
  const adjuntar = useRef<HTMLInputElement>(null)
  const cuenta = contarPalabras(idea)
  const fueraDeRango = cuenta > 0 && (cuenta < MIN_PALABRAS || cuenta > MAX_PALABRAS)
  const puede = cuenta >= MIN_PALABRAS && cuenta <= MAX_PALABRAS && tokens >= COSTO_REGENERAR

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      title="Regenerar diapositiva"
      headerActions={<TokenBadge tokens={tokens} />}
      // Como en «Agregar portada»: el botón de generar va dentro de la caja de texto; el pie solo cierra («Cancelar»).
    >
      <div className="flex flex-col gap-4">
        <TextoResaltado className="pt-4 text-center">
          Tú lo imaginas, nosotros <Resaltado ia>lo generamos</Resaltado>
        </TextoResaltado>
        <Field>
          <Input
            ref={adjuntar}
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const archivos = Array.from(e.target.files ?? [])
              setAdjuntos((previos) => [...previos, ...archivos.map((a) => ({ nombre: a.name, url: URL.createObjectURL(a) }))])
              e.target.value = ''
            }}
          />
          {/* La caja para escribirle a la IA es la del chat de Suite AI (Design system › Suite AI chat). El botón de
              generar ya va en el pie del modal. */}
          <Composer
            value={idea}
            onChange={setIdea}
            onSend={() => puede && onGenerar(idea.trim())}
            onVoice={() => undefined}
            ariaLabel="Idea de la diapositiva"
            placeholder="Describe la idea de esta diapositiva: tema, mensaje clave o lo que quieres que vea la audiencia"
            rows={4}
            onAttach={() => adjuntar.current?.click()}
            attachLabel="Adjuntar imagen de referencia"
            voice={false}
            footerStart={
              <>
                <Text as="span" size="xs" variant={fueraDeRango ? 'destructive' : 'muted'} className="tabular-nums">
                  {`${cuenta}/${MAX_PALABRAS} palabras · mínimo ${MIN_PALABRAS}`}
                </Text>
              </>
            }
            action={
              <BotonIa disabled={!puede} onClick={() => onGenerar(idea.trim())}>
                Generar diapositiva
                <TokenCost cost={COSTO_REGENERAR} />
              </BotonIa>
            }
          />
          {adjuntos.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {adjuntos.map((a, i) => (
                <Attachment key={a.url} size="xs">
                  <AttachmentMedia variant="image">
                    <img src={a.url} alt="" />
                  </AttachmentMedia>
                  <AttachmentContent className="max-w-32">
                    <AttachmentTitle>{a.nombre}</AttachmentTitle>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction aria-label={`Quitar ${a.nombre}`} onClick={() => setAdjuntos((p) => p.filter((_, j) => j !== i))}>
                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </div>
          ) : null}
        </Field>
      </div>
    </ActionDialog>
  )
}
