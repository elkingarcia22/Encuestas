import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Attachment01Icon, Cancel01Icon, Download01Icon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  Empty,
  EmptyDescription,
  EmptyMedia,
  Input,
  Text,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { BotonIa } from '@/shared/components/BotonIa'
import { AiThinking } from '@/shared/components/AiThinking'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { notify } from '@/shared/components/notify'
import { Resaltado, TextoResaltado } from '@/modules/design-system/tipografia/texto-resaltado'
import { gastarTokens, useBorrador } from './borrador'
import { TokenCost } from './tokens'

// Generar una imagen con IA: la caja del chat para describirla, adjuntar referencias y el botón de IA con su costo; al
// generar, el cuadro 16:9 con el loader y luego el resultado con «Descargar». Nació en «Agregar portada» y es la misma
// pieza en la imagen de un aviso (Avisos internos › Crear aviso): cambia solo el nombre de lo que se genera.
//
// Los tokens son el saldo de IA de la empresa, uno solo para todo el admin.

const IMAGENES_IA = [1, 2, 3, 4, 5, 6, 7].map((n) => `/images/cards-learn/portadas-ia/0${n}-personas-en-oficina.jpg`)

const palabras = (texto: string) => texto.trim().split(/\s+/).filter(Boolean).length

type Props = {
  /** Lo que se genera, en minúscula y femenino: «portada», «imagen». */
  nombre: string
  /** La imagen generada (vacía si aún no hay). */
  resultado: string
  /** Con qué descripción se generó `resultado`: si el texto no cambió, el botón dice «Regenerar». */
  promptInicial: string
  costo: number
  onGenerado: (imagen: string, prompt: string) => void
  /** La frase «Tú lo imaginas, nosotros lo generamos» antes de generar. En el aviso no va: el modal ya es largo. */
  frase?: boolean
}

export function GeneradorImagenIa({ nombre, resultado, promptInicial, costo, onGenerado, frase = true }: Props) {
  const { tokens } = useBorrador()
  const [prompt, setPrompt] = useState(promptInicial)
  const [generando, setGenerando] = useState(false)
  const [adjuntos, setAdjuntos] = useState<{ nombre: string; url: string; imagen: boolean }[]>([])
  const adjuntar = useRef<HTMLInputElement>(null)
  const tiempo = useRef<number | null>(null)

  useEffect(() => () => {
    if (tiempo.current) window.clearTimeout(tiempo.current)
  }, [])

  const cuenta = palabras(prompt)
  const regenerar = Boolean(resultado) && prompt.trim() === promptInicial.trim()
  const puedeGenerar = cuenta >= 6 && cuenta <= 500 && tokens >= costo && !generando

  const generar = () => {
    if (!gastarTokens(costo)) {
      notify(`No tienes suficientes tokens (${costo} requeridos).`, undefined, 'warning')
      return
    }
    setGenerando(true)
    tiempo.current = window.setTimeout(() => {
      const opciones = IMAGENES_IA.filter((url) => url !== resultado)
      onGenerado(opciones[Math.floor(Math.random() * opciones.length)], prompt)
      setGenerando(false)
    }, 3000)
  }

  const expandido = generando || Boolean(resultado)

  return (
    <div className="flex flex-col gap-4">
      {expandido ? (
        <div className="overflow-hidden rounded-xl border bg-muted">
          <div className="relative aspect-video w-full">
            {generando ? (
              <Empty className="size-full gap-2 p-6">
                <EmptyMedia>
                  <AiThinking label={`Generando ${nombre}`} size="md" />
                </EmptyMedia>
                <EmptyDescription>No recargues la página ni cierres el modal mientras generamos tu {nombre}.</EmptyDescription>
              </Empty>
            ) : resultado ? (
              <>
                <img src={resultado} alt={`${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} generada`} className="size-full object-cover" />
                <Button
                  variant="outline"
                  size="xs"
                  className="absolute top-3 right-3"
                  aria-label={`Descargar ${nombre}`}
                  nativeButton={false}
                  render={<a href={resultado} download={`${nombre}-generada.jpg`} />}
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} />
                  Descargar
                </Button>
              </>
            ) : (
              <PrimeraVez className="size-full" icono="glass-gallery" titulo={`Vista previa de la ${nombre}`} descripcion={`Aquí verás la ${nombre} cuando la generes con IA.`} />
            )}
          </div>
        </div>
      ) : frase ? (
        <TextoResaltado className="pt-4 text-center">
          Tú lo imaginas, nosotros <Resaltado ia>lo generamos</Resaltado>
        </TextoResaltado>
      ) : null}

      <Input
        ref={adjuntar}
        type="file"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const archivos = Array.from(e.target.files ?? [])
          setAdjuntos((previos) => [
            ...previos,
            ...archivos.map((a) => ({ nombre: a.name, url: URL.createObjectURL(a), imagen: a.type.startsWith('image/') })),
          ])
          e.target.value = ''
        }}
      />
      {/* La caja para escribirle a la IA es la del chat de Suite AI (Design system › Suite AI chat). */}
      <Composer
        value={prompt}
        onChange={setPrompt}
        onSend={() => puedeGenerar && generar()}
        onVoice={() => undefined}
        placeholder={`Describe tu ${nombre} de forma específica`}
        ariaLabel={`Describe tu ${nombre} de forma específica`}
        rows={3}
        disabled={generando}
        onAttach={() => adjuntar.current?.click()}
        attachLabel="Adjuntar referencia"
        voice={false}
        footerStart={
          <Text as="span" size="xs" variant={cuenta && (cuenta < 6 || cuenta > 500) ? 'destructive' : 'muted'} className="tabular-nums">
            {cuenta}/500 palabras · mínimo 6
          </Text>
        }
        action={
          <BotonIa disabled={!puedeGenerar} onClick={generar}>
            {generando ? 'Generando' : `${regenerar ? 'Regenerar' : 'Generar'} ${nombre}`}
            <TokenCost cost={costo} />
          </BotonIa>
        }
      />
      {adjuntos.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {adjuntos.map((a, i) => (
            <Attachment key={a.url} size="xs">
              <AttachmentMedia variant={a.imagen ? 'image' : 'icon'}>
                {a.imagen ? <img src={a.url} alt="" /> : <HugeiconsIcon icon={Attachment01Icon} aria-hidden="true" />}
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
    </div>
  )
}
