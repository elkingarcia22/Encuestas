import { useState, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowUp02Icon,
  Attachment01Icon,
  AudioLinesIcon,
  Cancel01Icon,
  FolderAddIcon,
  Link02Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, IconTile, Switch, Textarea, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import styles from './composer.module.css'
import { CONNECTORS } from './data'
import { CloseButton } from '@/shared/components/CloseButton'

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  onVoice: () => void
  news?: boolean
  onDismissNews?: () => void
  onOpenNews?: () => void
  contextChip?: string
  // Texto junto a la pastilla de contexto; en paneles angostos (agente contextual) va uno más corto.
  contextNote?: string
  onRemoveContext?: () => void
  // Piezas que se pueden apagar (configurador del agente contextual). Por defecto van, como en el chat.
  attach?: boolean
  voice?: boolean
  // Nombres de las piezas en la anatomía de los configuradores. Solo agrega atributos; no cambia cómo se ve.
  regions?: ComposerRegions
  // Para devolver el foco al campo (p. ej. después de editar un mensaje, que desaparece al enviarse).
  inputRef?: Ref<HTMLTextAreaElement>
  // Como campo de prompt fuera del chat (LMS Creator: portada, regenerar imagen…). Todo opcional: sin estas props
  // el composer es el mismo del chat.
  ariaLabel?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  invalid?: boolean
  // A la izquierda de la fila de abajo: adjuntar una referencia, archivos adjuntos, contador de palabras.
  footerStart?: ReactNode
  // Reemplaza el botón de enviar (p. ej. «Generar portada · 50 tokens»); con null no va ninguno.
  action?: ReactNode | null
  // Habilita enviar aunque no haya texto (p. ej. con un archivo adjunto). Por defecto, solo con texto.
  canSend?: boolean
  // Fuera del chat no hay conectores: con onAttach, el «+» abre directo el selector de archivos, sin el menú.
  onAttach?: () => void
  attachLabel?: string
}

export type ComposerRegions = Partial<Record<'news' | 'context' | 'attach' | 'voice' | 'send' | 'input', string>>

// Los botones van pegados al borde de abajo de la tarjeta, que recorta lo que sobresale: en la anatomía su nombre
// va arriba.
const buttonChip = (name?: string) => (name ? 'top' : undefined)

// Icono encerrado del menú «+»: la misma cajita de la barra lateral (esquina de 8px, filo fino y fondo claro),
// para que «Conectores» y «Agregar archivos» se lean como dos opciones con peso propio.
function MenuIcon({ icon }: { icon: IconSvgElement }) {
  return (
    <IconTile variant="outline" className="size-7! rounded-[0.5rem]! bg-background/70! text-muted-foreground dark:bg-muted/40!">
      <HugeiconsIcon icon={icon} strokeWidth={1.6} className="size-4!" />
    </IconTile>
  )
}

// Menú «+»: conectores (con su interruptor de conectado) y agregar archivos.
function AttachMenu({ region }: { region?: string }) {
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONNECTORS.map((connector) => [connector.name, true])),
  )

  const toggleConnector = (name: string) => {
    setConnected((current) => ({ ...current, [name]: !current[name] }))
  }

  return (
    <DropdownMenu>
      {/* Con el menú abierto el «+» se pinta en azul con fondo suave, como los botones del header al seleccionarlos. En
          círculo, como el botón de enviar: es una superficie de IA y la pastilla es su marca. */}
      <DropdownMenuTrigger
        render={
          <Button
            data-region={region}
            data-chip={buttonChip(region)}
            variant="outline"
            size="icon"
            aria-label="Agregar archivos o conectores"
            className="[--radius:calc(infinity*1px)] aria-expanded:border-primary/25! aria-expanded:bg-primary/10! aria-expanded:text-primary! aria-expanded:hover:bg-primary/15! aria-expanded:hover:text-primary!"
          />
        }
      >
        <HugeiconsIcon icon={PlusSignIcon} size={18} />
      </DropdownMenuTrigger>
      {/* Conectores arriba; debajo de la línea, «Agregar archivos» junto con su límite de archivos. */}
      {/* Fondo sólido: el del componente es translúcido y se leía el texto del composer por detrás. */}
      <DropdownMenuContent align="start" side="top" className="w-72 bg-popover!">
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <MenuIcon icon={Link02Icon} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span>Conectores</span>
                <span className="text-[13px] text-muted-foreground">Gmail, Slack y Google Drive</span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64 bg-popover!">
              <DropdownMenuItem onClick={() => notify('Catálogo de conectores')}>
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                Agregar conectores
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[length:13px]">Conectados</DropdownMenuLabel>
                {/* Cada conector es una opción de marcar: el lector de pantalla anuncia si está conectado. El interruptor
                    solo lo muestra a la vista (inerte: ni foco ni lectura, para no anidar un control dentro de otro). */}
                {CONNECTORS.map((connector) => (
                  <DropdownMenuItem
                    key={connector.name}
                    role="menuitemcheckbox"
                    aria-checked={connected[connector.name]}
                    closeOnClick={false}
                    onClick={() => toggleConnector(connector.name)}
                  >
                    <HugeiconsIcon icon={connector.icon} size={16} />
                    <span className="flex-1">{connector.name}</span>
                    <span inert className="flex">
                      <Switch checked={connected[connector.name]} tabIndex={-1} className="pointer-events-none" />
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => notify('Agregar archivos · PDF, Excel o CSV')}>
            <MenuIcon icon={Attachment01Icon} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span>Agregar archivos</span>
              <span className="text-[13px] text-muted-foreground">PDF, Excel o CSV de tu equipo</span>
            </div>
            <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {/* El límite es una nota del menú, no una opción: franja gris al pie, de borde a borde (el menú tiene 4px
            de aire y 12px de esquina, de ahí los márgenes negativos y la esquina de 8px). */}
        <p className="-mx-1! -mb-1! flex items-center gap-2 rounded-b-[8px] border-t bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground">
          <HugeiconsIcon icon={FolderAddIcon} size={14} />
          Hasta 10 archivos · 25 MB cada uno
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Tarjeta del composer: franja de novedad, contexto, textarea y fila de controles.
// Como en el prototipo, la fila solo tiene "+", Voz y Enviar.
export function Composer({
  value,
  onChange,
  onSend,
  placeholder,
  onVoice,
  news,
  onDismissNews,
  onOpenNews,
  contextChip,
  contextNote = 'en contexto · el agente responde sobre este objeto',
  onRemoveContext,
  attach = true,
  voice = true,
  regions,
  inputRef,
  ariaLabel = 'Mensaje para el agente',
  rows = 2,
  maxLength,
  disabled,
  invalid,
  footerStart,
  action,
  canSend: canSendProp,
  onAttach,
  attachLabel = 'Adjuntar archivos',
}: ComposerProps) {
  const [focused, setFocused] = useState(false)
  const canSend = canSendProp ?? value.trim().length > 0

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSend) onSend()
    }
  }

  // Textarea de flux-ui sin borde, sombra ni anillo: la superficie (aura y foco) es la del composer.
  const textarea = (
    <Textarea
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      disabled={disabled}
      // El error no se pinta en la caja: su borde ya se mueve solo (el aura) y dos bordes compitiendo se ven mal.
      // Queda la marca para el lector de pantalla y el texto de error debajo del campo (Dave, 1-oct).
      aria-invalid={invalid ? true : undefined}
      aria-label={ariaLabel}
      className="relative z-1 block! min-h-20! w-full resize-none rounded-none! border-0! bg-transparent! px-5! pt-4! pb-2! text-base! leading-relaxed! shadow-none! [field-sizing:fixed]! focus-visible:ring-0! md:text-base! dark:bg-transparent!"
    />
  )

  return (
    <div
      data-focused={focused}
      className={cn(
        styles.composer,
        'relative isolate flex w-full flex-col overflow-hidden rounded-[1.25rem] border bg-card text-card-foreground shadow-xs',
      )}
    >
      {/* Aura al enfocar, como en el prototipo: manchas que derivan y un haz que gira por el borde. */}
      <div aria-hidden="true" className={styles.wash}>
        <span className={styles.blob} />
        <span className={styles.blob} />
        <span className={styles.blob} />
        <span className={styles.blob} />
      </div>
      <div aria-hidden="true" className={styles.glow}>
        <span className={styles.beam} />
      </div>

      {news ? (
        <div data-region={regions?.news} className="relative z-1 flex items-center gap-2 border-b px-4 py-2 text-sm">
          {/* La marca de IA es el orbe, no la varita (auditoría, 5-oct). */}
          <IconoIA className="shrink-0" />
          <Badge>Nuevo</Badge>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            Ya ejecuta acciones en <span className="font-medium text-foreground">Selección</span>.
          </span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={onOpenNews}>
            Ver qué cambió
          </Button>
          <CloseButton label="Cerrar novedad" onClick={onDismissNews} />
        </div>
      ) : null}

      {contextChip ? (
        <div className="relative z-1 flex items-center gap-2.5 border-b bg-muted/60 px-4 py-2.5 text-sm text-foreground/70">
          {/* Objeto en contexto, como en el prototipo: pastilla con el orbe sobre una franja gris (antes una estrella
              dibujada; auditoría, 5-oct). */}
          {/* Nombres largos se recortan con «…» en vez de empujar el texto de al lado. */}
          <span
            data-region={regions?.context}
            className="flex min-w-0 items-center gap-2 rounded-full border bg-card py-1 pr-1.5 pl-3 text-foreground"
          >
            <IconoIA className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">{contextChip}</span>
            <BotonIcono size="icon-xs" className="size-5! shrink-0" aria-label="Quitar contexto" onClick={onRemoveContext}>
              <HugeiconsIcon icon={Cancel01Icon} size={12} />
            </BotonIcono>
          </span>
          {contextNote ? <span>{contextNote}</span> : null}
        </div>
      ) : null}

      {/* Un textarea no puede mostrar su nombre (no admite ::after): en la anatomía va envuelto. */}
      {regions?.input ? (
        <div data-region={regions.input} className="relative z-1">
          {textarea}
        </div>
      ) : (
        textarea
      )}

      {attach || voice || footerStart || action !== null ? (
      <div className="relative z-1 flex items-center gap-1.5 px-3 pb-3">
        {attach ? (
          onAttach ? (
            <Button
              data-region={regions?.attach}
              data-chip={buttonChip(regions?.attach)}
              variant="outline"
              size="icon"
              aria-label={attachLabel}
              disabled={disabled}
              onClick={onAttach}
              className="[--radius:calc(infinity*1px)]"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={18} />
            </Button>
          ) : (
            <AttachMenu region={regions?.attach} />
          )
        ) : null}
        {footerStart}

        <div className="ml-auto flex items-center gap-2">
          {voice ? (
            <Button data-region={regions?.voice} data-chip={buttonChip(regions?.voice)} variant="outline" size="sm" onClick={onVoice}>
              <HugeiconsIcon icon={AudioLinesIcon} size={16} />
              Voz
            </Button>
          ) : null}
          {action !== undefined ? action : (
          /* Anillo metálico del prototipo: gira siempre, tenue sin texto y encendido cuando hay algo que enviar. */
          <span className={styles.metal} style={{ '--on': canSend ? 1 : 0.34 } as CSSProperties}>
            <span aria-hidden="true" className={styles.halo} />
            <span aria-hidden="true" className={styles.ring} />
            <span aria-hidden="true" className={styles.spec} />
            {/* Sin texto va deshabilitado, con el mismo primary apagado que usa la librería en todo el sistema. En
                círculo, como el anillo que lo rodea: es un botón de IA y la pastilla es su marca. */}
            <Button
              data-region={regions?.send}
              data-chip={buttonChip(regions?.send)}
              size="icon"
              className="relative z-1 [--radius:calc(infinity*1px)]"
              aria-label="Enviar"
              disabled={!canSend}
              onClick={onSend}
            >
              <HugeiconsIcon icon={ArrowUp02Icon} size={18} />
            </Button>
          </span>
          )}
        </div>
      </div>
      ) : null}
    </div>
  )
}
