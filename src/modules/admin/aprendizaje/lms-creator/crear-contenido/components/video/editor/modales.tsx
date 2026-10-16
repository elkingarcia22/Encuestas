import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, MusicNote01Icon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
  Button,
  Checkbox,
  cn,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Heading,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Switch,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { BotonIa } from '@/shared/components/BotonIa'
import { BotonMuestra } from '@/modules/admin/aprendizaje/lms-creator/compartido/boton-muestra'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { useBorrador } from '../../borrador'
import { FileUpload, type ArchivoCargado } from '../../file-upload'
import { COSTO_VIDEO, PISTAS, TRANSICIONES, VOLUMENES, musicaHabilitada, type TransicionId } from '../datos'
import { CuadroEscena, Escalado } from '../lienzo'
import { conCosto, useMuestra } from '../piezas'
import { pistaPorId, type Escena, type Proyecto } from '../proyecto'
import { clasesTransicion } from './reproductor'
import { Resaltado, TextoResaltado } from '@/modules/design-system/tipografia/texto-resaltado'
import { TokenBadge } from '../../tokens'
import { ActionDialog } from '@/shared/components/ActionDialog'

// Las ventanas del editor: Ajustes del video (subtítulos, logo y música), Transición (15 entradas con su vista previa
// al pasar el cursor) y Generar/Regenerar imagen o canvas. Con la única ventana del sistema (ActionDialog, decisión 4
// de la auditoría, 5-oct).

// ── Ajustes ──────────────────────────────────────────────────────────────────────────────────────────────────────

const aDataUrl = (archivo: File) =>
  new Promise<string>((resolver) => {
    const lector = new FileReader()
    lector.onload = () => resolver(String(lector.result))
    lector.readAsDataURL(archivo)
  })

type AjustesProps = {
  abierto: boolean
  proyecto: Proyecto
  onCerrar: () => void
  onCambio: (cambio: Partial<Proyecto>) => void
}

export function ModalAjustes({ abierto, proyecto, onCerrar, onCambio }: AjustesProps) {
  const [vista, setVista] = useState<'ajustes' | 'musica'>('ajustes')
  const [logo, setLogo] = useState<ArchivoCargado | null>(null)
  const muestra = useMuestra()
  const conMusica = musicaHabilitada()
  const pista = pistaPorId(proyecto.musica.pista)
  const volumen = VOLUMENES.find((v) => v.id === proyecto.musica.volumen) ?? VOLUMENES[1]

  useEffect(() => {
    if (abierto) setVista('ajustes')
  }, [abierto])

  const cerrar = () => {
    muestra.detener()
    onCerrar()
  }

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) cerrar()
      }}
      size="wide"
      title={vista === 'musica' ? 'Música de fondo' : 'Ajustes del video'}
      onBack={
        vista === 'musica'
          ? () => {
              muestra.detener()
              setVista('ajustes')
            }
          : undefined
      }
      footer={<Button onClick={cerrar}>Listo</Button>}
    >
      {vista === 'ajustes' ? (
        <div className="flex flex-col gap-5">
          <Text size="sm" variant="muted">
            Opciones globales de la vista previa y el video final.
          </Text>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Subtítulos</FieldTitle>
              <FieldDescription>Muestra el guion de cada escena abajo, con sombra marcada. Aplica en vista previa y al generar.</FieldDescription>
            </FieldContent>
            <Switch checked={proyecto.subtitulos} onCheckedChange={(v) => onCambio({ subtitulos: Boolean(v) })} aria-label="Subtítulos" />
          </Field>
          <Separator />
          <div className="flex flex-col gap-2">
            <Heading as="h3" level={6} className="flex items-center gap-2">
              Logo de la empresa
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </Heading>
            <Text size="sm" variant="muted">
              Aparece en la esquina superior derecha de todas las escenas.
            </Text>
            {proyecto.logo ? (
              <Item variant="outline" size="sm">
                <ItemMedia variant="image">
                  <img src={proyecto.logo} alt="Logo de la empresa" className="object-contain" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Logo cargado</ItemTitle>
                  <ItemDescription>Se ve al 70 % sobre cada escena.</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLogo(null)
                      onCambio({ logo: null })
                    }}
                  >
                    Cambiar
                  </Button>
                </ItemActions>
              </Item>
            ) : (
              <FileUpload
                acepta="image/png,.png"
                maximoMb={2}
                formatos="PNG · hasta 2 MB"
                titulo="Logo de la empresa"
                exito={false}
                compacta
                archivo={logo}
                onArchivo={(a) => {
                  setLogo(a)
                  if (a) void aDataUrl(a.archivo).then((url) => onCambio({ logo: url }))
                }}
              />
            )}
          </div>
          {conMusica ? (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <Heading as="h3" level={6}>
                  Música de fondo
                </Heading>
                <Text size="sm" variant="muted">
                  Se reproduce en loop bajo la locución y baja al final de la última escena.
                </Text>
                <Item variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={MusicNote01Icon} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{pista.label}</ItemTitle>
                    <ItemDescription>{pista.id === 'none' ? pista.descripcion : `Volumen ${volumen.label.toLowerCase()}`}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button variant="outline" size="sm" onClick={() => setVista('musica')}>
                      {pista.id === 'none' ? 'Elegir' : 'Cambiar'}
                    </Button>
                  </ItemActions>
                </Item>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <RadioGroup
            value={proyecto.musica.pista}
            onValueChange={(v) => onCambio({ musica: { ...proyecto.musica, pista: String(v) } })}
            aria-label="Música de fondo"
            className="flex flex-col gap-2"
          >
            {PISTAS.map((t) => (
              <FieldLabel key={t.id} htmlFor={`pista-${t.id}`}>
                <Field orientation="horizontal" className="items-center">
                  <FieldContent>
                    <FieldTitle>{t.label}</FieldTitle>
                    <FieldDescription>{t.descripcion}</FieldDescription>
                  </FieldContent>
                  {t.src ? (
                    <BotonMuestra
                      disponible
                      sonando={muestra.sonando === t.src}
                      onAlternar={() => muestra.alternar(t.src, true)}
                      etiqueta={`Escuchar ${t.label}`}
                    />
                  ) : null}
                  <RadioGroupItem value={t.id} id={`pista-${t.id}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
          <div className="flex flex-col gap-2">
            <Heading as="h3" level={6}>
              Volumen
            </Heading>
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={2}
              value={[proyecto.musica.volumen]}
              onValueChange={(v) => {
                const elegido = (v as string[])[0]
                if (elegido) onCambio({ musica: { ...proyecto.musica, volumen: elegido } })
              }}
              aria-label="Volumen de la música"
              className="flex-wrap"
            >
              {VOLUMENES.map((v) => (
                <ToggleGroupItem key={v.id} value={v.id}>
                  {v.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Text size="sm" variant="muted">
              Estándar queda por debajo de la locución. Alto se escucha más presente; Discreto, menos; Mínimo, casi un susurro.
            </Text>
          </div>
        </div>
      )}
    </ActionDialog>
  )
}

// ── Transición ───────────────────────────────────────────────────────────────────────────────────────────────────

function MuestraTransicion({ proyecto, desde, hacia, id, activa }: { proyecto: Proyecto; desde: Escena; hacia: Escena; id: TransicionId; activa: boolean }) {
  const clases = clasesTransicion(id, true)
  return (
    <Escalado className="rounded-md">
      <div className={cn('relative size-full', clases.escenario)}>
        <div className={cn('absolute inset-0', activa && clases.sale)}>
          <CuadroEscena proyecto={proyecto} escena={desde} miniatura />
        </div>
        <div className={cn('absolute inset-0', activa && clases.entra)}>
          <CuadroEscena proyecto={proyecto} escena={hacia} miniatura />
        </div>
      </div>
    </Escalado>
  )
}

type TransicionProps = {
  abierto: boolean
  proyecto: Proyecto
  indice: number
  onCerrar: () => void
  onGuardar: (id: TransicionId, aTodas: boolean) => void
}

export function ModalTransicion({ abierto, proyecto, indice, onCerrar, onGuardar }: TransicionProps) {
  const hacia = proyecto.escenas[indice]
  const desde = proyecto.escenas[indice - 1]
  const [eleccion, setEleccion] = useState<TransicionId>(hacia?.transicion ?? 'soft-dissolve')
  const [aTodas, setATodas] = useState(false)
  const [encima, setEncima] = useState<string | null>(null)

  useEffect(() => {
    if (!abierto || !hacia) return
    setEleccion(hacia.transicion)
    setATodas(false)
    setEncima(null)
  }, [abierto, hacia])

  if (!hacia || !desde) return null

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="wide"
      title="Transición"
      dismissible={false}
      footer={
        <>
          {/* `order-first`: la casilla va a la izquierda del pie, antes del hueco que deja la nota vacía. */}
          <div className="order-first flex items-center gap-2">
            <Checkbox id="transicion-a-todas" checked={aTodas} onCheckedChange={(v) => setATodas(Boolean(v))} />
            <Label htmlFor="transicion-a-todas">Aplicar a todas las escenas</Label>
          </div>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onGuardar(eleccion, aTodas)
              onCerrar()
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text size="sm" variant="muted">
          Entrada a esta escena. Por defecto: disolución suave.
        </Text>
        <RadioGroup value={eleccion} onValueChange={(v) => setEleccion(v as TransicionId)} aria-label="Transición" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRANSICIONES.map((t) => (
            <FieldLabel
              key={t.id}
              htmlFor={`transicion-${t.id}`}
              onMouseEnter={() => setEncima(t.id)}
              onMouseLeave={() => setEncima(null)}
              onFocus={() => setEncima(t.id)}
              onBlur={() => setEncima(null)}
            >
              <Field className="gap-2">
                <MuestraTransicion proyecto={proyecto} desde={desde} hacia={hacia} id={t.id} activa={encima === t.id} />
                <div className="flex items-center gap-2">
                  <FieldContent>
                    <FieldTitle>{t.label}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem value={t.id} id={`transicion-${t.id}`} />
                </div>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </div>
    </ActionDialog>
  )
}

// ── Generar / regenerar imagen o canvas ──────────────────────────────────────────────────────────────────────────

const palabras = (texto: string) => texto.trim().split(/\s+/).filter(Boolean).length

type RegenerarProps = {
  abierto: boolean
  tipo: 'imagen' | 'canvas'
  regenerar: boolean
  /** Texto provisional al regenerar una imagen. */
  semilla?: string
  onCerrar: () => void
  onGenerar: (idea: string) => void
}

export function ModalRegenerar({ abierto, tipo, regenerar, semilla = '', onCerrar, onGenerar }: RegenerarProps) {
  const { tokens } = useBorrador()
  const [idea, setIdea] = useState('')
  const [adjuntos, setAdjuntos] = useState<{ nombre: string; url: string }[]>([])
  const entrada = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!abierto) return
    setIdea(tipo === 'imagen' && regenerar ? semilla : '')
    setAdjuntos([])
  }, [abierto, tipo, regenerar, semilla])

  const cuenta = palabras(idea)
  const valida = cuenta >= 6 && cuenta <= 120 && tokens >= COSTO_VIDEO.imagen
  const nombre = tipo === 'imagen' ? 'imagen' : 'canvas'

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="wide"
      title={`${regenerar ? 'Regenerar' : 'Generar'} ${nombre}`}
      headerActions={<TokenBadge tokens={tokens} />}
      dismissible={false}
      // Como en «Agregar portada»: el botón de generar va dentro de la caja de texto; el pie solo cierra («Cancelar»).
    >
      <div className="flex flex-col gap-4">
        <TextoResaltado className="pt-4 text-center">
          Tú lo imaginas, nosotros <Resaltado ia>lo generamos</Resaltado>
        </TextoResaltado>
        <Field>
          <Input
            ref={entrada}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const lista = Array.from(e.target.files ?? []).map((f) => ({ nombre: f.name, url: URL.createObjectURL(f) }))
              setAdjuntos((p) => [...p, ...lista])
              e.target.value = ''
            }}
          />
          {/* La caja para escribirle a la IA es la del chat de Suite AI (Design system › Suite AI chat), con el botón de
              generar dentro, como en «Agregar portada». */}
          <Composer
            value={idea}
            onChange={setIdea}
            onSend={() => {
              if (!valida) return
              onGenerar(idea.trim())
              onCerrar()
            }}
            onVoice={() => undefined}
            ariaLabel={tipo === 'imagen' ? 'Descripción de la imagen' : 'Idea de la diapositiva'}
            rows={4}
            placeholder={
              tipo === 'imagen'
                ? 'Describe la imagen de forma específica'
                : // Que quede claro que se llena la plantilla ya elegida, no una diapositiva nueva. Genérico a propósito, sin el
                  // nombre de la plantilla: un texto fijo es más fácil para desarrollo (Dave, 14-oct).
                  'Describe tu idea y la IA rellenará con ella la plantilla seleccionada: tema, mensaje clave o lo que quieres que vea la audiencia'
            }
            onAttach={() => entrada.current?.click()}
            attachLabel="Adjuntar referencia"
            voice={false}
            footerStart={
              <>
                <Text as="span" size="xs" variant={cuenta && (cuenta < 6 || cuenta > 120) ? 'destructive' : 'muted'} className="tabular-nums">
                  Mínimo 6 · Máximo 120 palabras · {cuenta}
                </Text>
              </>
            }
            action={
              <BotonIa
                disabled={!valida}
                onClick={() => {
                  onGenerar(idea.trim())
                  onCerrar()
                }}
              >
                {conCosto(`${regenerar ? 'Regenerar' : 'Generar'} ${nombre}`, COSTO_VIDEO.imagen)}
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
