import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowUpRight01Icon, PlayIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  Label,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { KICKER } from '../../drawers/components/drawer-styles'
import { Orb } from '@/shared/components/Orb'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import slotStyles from '@/shared/components/slot.module.css'
import styles from './anatomy.module.css'

// Una parte de la lista «Partes de este caso»: nombre (igual al que se dibuja en la vista previa) y qué es.
export type PartInfo = { name: string; text: string; slot?: boolean }

// Escenario de la vista previa. `names` dibuja el nombre de cada parte; `hot` resalta la parte señalada en la lista.
// El resaltado se pone directo sobre los elementos marcados (data-region o data-slot-region) de adentro.
export function AnatomyStage({
  names,
  hot,
  className,
  children,
}: {
  names: boolean
  hot: string | null
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    root.querySelectorAll<HTMLElement>('[data-region],[data-slot-region]').forEach((node) => {
      const name = node.getAttribute('data-region') ?? node.getAttribute('data-slot-region') ?? ''
      const match = hot !== null && (name === hot || (hot.startsWith('Contenedor') && name.startsWith('Contenedor')))
      if (match) node.setAttribute('data-hot', '')
      else node.removeAttribute('data-hot')
    })
  })

  return (
    <div ref={ref} className={cn(styles.stage, names && styles.names, className)}>
      {children}
    </div>
  )
}

// El espacio libre de muestra vive en compartidos: lo usan esta anatomía y las pantallas todavía sin maquetar,
// y así las dos se ven igual siempre. Se re-exporta para no cambiar los imports de las páginas del design system.
export { SlotArea } from '@/shared/components/SlotArea'

// Cómo leer la vista previa: lo azul con nombre es del componente; lo gris rayado es libre.
export function AnatomyLegend({ names, onNamesChange }: { names: boolean; onNamesChange: (value: boolean) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border bg-card px-4 py-3">
      <span className="flex items-center gap-2.5 text-sm">
        <span className="rounded-full bg-primary px-2 py-px text-[11px] font-medium text-primary-foreground">Nombre</span>
        <span>
          <span className="font-medium">Parte del componente.</span>{' '}
          <span className="text-muted-foreground">Se ve y se llama igual en todas las pantallas.</span>
        </span>
      </span>
      <span className="flex items-center gap-2.5 text-sm">
        <span className={cn('h-5 w-9 shrink-0 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30', slotStyles.hatch)} />
        <span>
          <span className="font-medium">Slot.</span>{' '}
          <span className="text-muted-foreground">Espacio libre: ahí va lo que la pantalla necesite.</span>
        </span>
      </span>
      <Label className="ml-auto flex items-center gap-2 text-sm font-normal">
        Mostrar nombres
        <Switch checked={names} onCheckedChange={onNamesChange} />
      </Label>
    </div>
  )
}

// Casos de uso: cada uno deja la configuración lista; después se puede prender o apagar lo que se quiera.
export function CasePicker<T extends string>({
  cases,
  value,
  onPick,
  label = 'Casos de uso',
}: {
  cases: { id: T; title: string; icon: IconSvgElement }[]
  value: T
  onPick: (id: T) => void
  // Nombre del grupo para lectores de pantalla (el título visible va fuera del componente).
  label?: string
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        if (next[0]) onPick(next[0] as T)
      }}
      variant="outline"
      spacing={2}
      className="flex flex-wrap"
    >
      {cases.map((item) => (
        <ToggleGroupItem key={item.id} value={item.id} className="gap-2!">
          {/* Los casos de IA llevan el orbe, como en el menú real (ICONO_IA de nav-config, 5-oct). */}
          {item.icon === ICONO_IA ? <Orb className="size-4" /> : <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.6} />}
          {item.title}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// Resumen del caso elegido, con acceso a la pantalla real y «Restablecer» si se tocó algo.
export function CaseSummary({
  summary,
  modified,
  onReset,
  example,
}: {
  summary: string
  modified: boolean
  onReset: () => void
  example?: { label: string; onOpen: () => void }
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="text-muted-foreground">{summary}</span>
      <span className="ml-auto flex items-center gap-2">
        {modified ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <HugeiconsIcon icon={RefreshIcon} size={15} />
            Restablecer el caso
          </Button>
        ) : null}
        {example ? (
          <Button variant="outline" size="sm" onClick={example.onOpen}>
            {example.label}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} />
          </Button>
        ) : null}
      </span>
    </div>
  )
}

// «Probar en pantalla»: el botón que va en las acciones de la página del configurador. Es el Button de flux-ui tal
// como viene, sin tocarle las esquinas: la librería ya da los 12 px que pide la página de Botones del design system.
export function TryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <HugeiconsIcon icon={PlayIcon} size={16} />
      Probar en pantalla
    </Button>
  )
}

// Lo mismo que muestra la vista previa, pero a pantalla completa y sin la anatomía: así se ve de verdad. Se cierra con
// Escape o con el botón de arriba, y el foco vuelve a «Probar en pantalla» (lo hace el Dialog de flux-ui).
export function TryOnScreen({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-svh max-h-svh! w-svw max-w-none! grid-rows-[auto_minmax(0,1fr)] gap-0! overflow-hidden rounded-none! border-0! p-0! sm:max-w-none!"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-2.5">
          <span className="text-sm text-muted-foreground">{title} · así se ve en una pantalla real</span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

// Id del título del bloque: un `Choice` sin etiqueta propia toma ese título como nombre de su grupo.
const SectionTitle = createContext<string | undefined>(undefined)

// Bloque del panel de controles.
export function ControlSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section className="flex flex-col gap-3.5 border-t px-4 py-4 first:border-t-0">
      <div id={id} role="heading" aria-level={2} className={KICKER}>
        {title}
      </div>
      <SectionTitle.Provider value={id}>{children}</SectionTitle.Provider>
    </section>
  )
}

// Elegir una sola opción (grupo de botones de flux-ui).
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const labelId = useId()
  const sectionId = useContext(SectionTitle)
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span id={labelId} className="text-[13px] text-muted-foreground">
          {label}
        </span>
      ) : null}
      <ToggleGroup
        aria-labelledby={label ? labelId : sectionId}
        value={[value]}
        onValueChange={(next) => {
          if (next[0]) onChange(next[0] as T)
        }}
        variant="outline"
        size="sm"
        spacing={1}
        className="flex w-full flex-wrap"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="grow text-[13px]!"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

// Prender o apagar una parte.
export function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <Label className="flex items-center justify-between gap-3 text-sm font-normal">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </Label>
  )
}

// «Partes de este caso»: cada parte con su nombre en la misma pastilla de la vista previa y qué es.
// Al pasar el cursor (o con el teclado) se resalta en la vista previa.
export function PartsList({ parts, hot, onHot }: { parts: PartInfo[]; hot: string | null; onHot: (name: string | null) => void }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <span role="heading" aria-level={2} className="text-sm font-medium">
          Partes de este caso
        </span>
        <span className="text-[13px] text-muted-foreground">Pasa el cursor para verla en la vista previa</span>
      </div>
      <ul className="grid gap-x-6 px-2 py-2 md:grid-cols-2">
        {parts.map((part) => (
          <li key={part.name}>
            {/* Cada parte es el Item de la librería: la pastilla va en su hueco de icono y el texto como bajada. */}
            <Item
              size="sm"
              render={<button type="button" />}
              onMouseEnter={() => onHot(part.name)}
              onMouseLeave={() => onHot(null)}
              onFocus={() => onHot(part.name)}
              onBlur={() => onHot(null)}
              className={cn('text-left', hot === part.name ? 'bg-muted!' : 'hover:bg-muted/60!')}
            >
              <ItemMedia>
                <Badge
                  radius="full"
                  variant={part.slot ? 'outline' : 'default'}
                  className={cn('whitespace-nowrap', part.slot && 'bg-muted! text-muted-foreground!')}
                >
                  {part.slot ? `Slot · ${part.name}` : part.name}
                </Badge>
              </ItemMedia>
              <ItemContent>
                <ItemDescription className="text-[13px]! leading-snug!">{part.text}</ItemDescription>
              </ItemContent>
            </Item>
          </li>
        ))}
      </ul>
    </div>
  )
}
