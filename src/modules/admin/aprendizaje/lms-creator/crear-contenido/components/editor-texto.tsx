import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Heading01Icon,
  Heading02Icon,
  LeftToRightBlockQuoteIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Toggle,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import styles from './editor-texto.module.css'

// Editor de texto enriquecido: descripción de la portada, recurso Texto, descripción de sección, texto complementario
// e instrucciones de asistencia. flux-ui no trae uno; se arma con la barra de la librería (Toggle y el botón de icono)
// sobre un área editable que copia el borde, el radio y el foco del Textarea del tema.

type Formato = { id: string; etiqueta: string; icono: IconSvgElement; comando: string; valor?: string; estado?: boolean }

const GRUPOS: Formato[][] = [
  [
    { id: 'bold', etiqueta: 'Negrita', icono: TextBoldIcon, comando: 'bold', estado: true },
    { id: 'italic', etiqueta: 'Cursiva', icono: TextItalicIcon, comando: 'italic', estado: true },
    { id: 'underline', etiqueta: 'Subrayado', icono: TextUnderlineIcon, comando: 'underline', estado: true },
  ],
  [
    { id: 'ul', etiqueta: 'Lista con viñetas', icono: LeftToRightListBulletIcon, comando: 'insertUnorderedList' },
    { id: 'ol', etiqueta: 'Lista numerada', icono: LeftToRightListNumberIcon, comando: 'insertOrderedList' },
  ],
  [
    { id: 'h1', etiqueta: 'Título 1', icono: Heading01Icon, comando: 'formatBlock', valor: 'h2' },
    { id: 'h2', etiqueta: 'Título 2', icono: Heading02Icon, comando: 'formatBlock', valor: 'h3' },
    { id: 'quote', etiqueta: 'Cita', icono: LeftToRightBlockQuoteIcon, comando: 'formatBlock', valor: 'blockquote' },
  ],
]

type Props = {
  id?: string
  valor: string
  onCambio: (html: string) => void
  placeholder?: string
  etiqueta?: string
  /** Alto mínimo del área de escritura, en px. */
  alto?: number
  /** Crece para llenar el alto de su contenedor (tarjeta de descripción en Portada). */
  llenar?: boolean
  invalido?: boolean
  /** Solo negrita, cursiva, subrayado y listas (enunciados de evaluación). */
  basico?: boolean
  className?: string
}

export function EditorTexto({ id, valor, onCambio, placeholder, etiqueta, alto = 160, llenar, invalido, basico, className }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const [activos, setActivos] = useState<Record<string, boolean>>({})
  const [vacio, setVacio] = useState(!valor)
  const [enlace, setEnlace] = useState('https://')
  const [enlaceAbierto, setEnlaceAbierto] = useState(false)
  const seleccion = useRef<Range | null>(null)

  // El HTML se pone una vez al montar (y si cambia desde afuera sin haberlo escrito aquí): reescribirlo en cada tecla
  // mueve el cursor al inicio.
  useEffect(() => {
    const nodo = area.current
    if (nodo && nodo.innerHTML !== valor) {
      nodo.innerHTML = valor
      setVacio(!nodo.textContent?.trim())
    }
  }, [valor])

  const leerEstado = () => {
    const siguiente: Record<string, boolean> = {}
    for (const f of GRUPOS[0]) siguiente[f.id] = document.queryCommandState(f.comando)
    setActivos(siguiente)
  }

  const emitir = () => {
    const nodo = area.current
    if (!nodo) return
    setVacio(!nodo.textContent?.trim() && !nodo.querySelector('li,img'))
    onCambio(nodo.innerHTML)
  }

  const aplicar = (f: Formato) => {
    area.current?.focus()
    document.execCommand(f.comando, false, f.valor)
    leerEstado()
    emitir()
  }

  const guardarSeleccion = () => {
    const sel = window.getSelection()
    seleccion.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null
  }

  const insertarEnlace = () => {
    const url = enlace.trim()
    setEnlaceAbierto(false)
    if (!url || url === 'https://') return
    area.current?.focus()
    const sel = window.getSelection()
    if (seleccion.current && sel) {
      sel.removeAllRanges()
      sel.addRange(seleccion.current)
    }
    document.execCommand('createLink', false, url)
    emitir()
  }

  const grupos = basico ? [GRUPOS[0], GRUPOS[1]] : GRUPOS

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', llenar && 'h-full', className)}>
      {etiqueta ? <Label htmlFor={id}>{etiqueta}</Label> : null}
      <div
        data-invalid={invalido ? 'true' : undefined}
        className={cn(
          'flex min-h-0 flex-col overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          invalido && 'border-destructive ring-3 ring-destructive/20',
          llenar && 'flex-1',
        )}
      >
        <div role="toolbar" aria-label="Formato de texto" className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-1.5 py-1">
          {grupos.map((grupo, i) => (
            <div key={i} className="flex items-center gap-0.5">
              {i > 0 ? <Separator orientation="vertical" className="mx-1 h-5!" /> : null}
              {grupo.map((f) =>
                f.estado ? (
                  <Hint key={f.id} label={f.etiqueta} side="top">
                    <Toggle
                      size="sm"
                      aria-label={f.etiqueta}
                      pressed={Boolean(activos[f.id])}
                      onMouseDown={(e) => e.preventDefault()}
                      onPressedChange={() => aplicar(f)}
                    >
                      <HugeiconsIcon icon={f.icono} size={16} />
                    </Toggle>
                  </Hint>
                ) : (
                  <Hint key={f.id} label={f.etiqueta} side="top">
                    <BotonIcono aria-label={f.etiqueta} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar(f)}>
                      <HugeiconsIcon icon={f.icono} size={16} />
                    </BotonIcono>
                  </Hint>
                ),
              )}
              {!basico && i === 1 ? (
                <Popover open={enlaceAbierto} onOpenChange={setEnlaceAbierto}>
                  <Hint label="Enlace" side="top">
                    <PopoverTrigger
                      render={<BotonIcono aria-label="Enlace" onMouseDown={(e) => e.preventDefault()} onClick={guardarSeleccion} />}
                    >
                      <HugeiconsIcon icon={Link01Icon} size={16} />
                    </PopoverTrigger>
                  </Hint>
                  <PopoverContent align="start" className="w-72">
                    <form
                      className="flex flex-col gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        insertarEnlace()
                      }}
                    >
                      <Label htmlFor={`${id ?? 'rte'}-enlace`}>URL del enlace</Label>
                      <Input id={`${id ?? 'rte'}-enlace`} value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…" />
                      <Button type="submit" size="sm" className="self-end">
                        Insertar enlace
                      </Button>
                    </form>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          ))}
        </div>
        <div className={cn('relative min-h-0', llenar ? 'flex-1 overflow-auto' : 'max-h-[min(480px,70vh)] overflow-auto')}>
          {vacio && placeholder ? (
            <span aria-hidden="true" className="pointer-events-none absolute top-2 left-3 text-sm text-muted-foreground">
              {placeholder}
            </span>
          ) : null}
          <div
            id={id}
            ref={area}
            role="textbox"
            aria-multiline="true"
            aria-label={etiqueta ?? placeholder}
            aria-invalid={invalido ? true : undefined}
            contentEditable
            suppressContentEditableWarning
            onInput={emitir}
            onKeyUp={leerEstado}
            onMouseUp={leerEstado}
            style={{ minHeight: alto }}
            className={cn(styles.texto, 'h-full px-3 py-2 text-sm leading-relaxed outline-none')}
          />
        </div>
      </div>
    </div>
  )
}

/** Muestra HTML escrito con el editor, en modo lectura. */
export function TextoEnriquecido({ html, className }: { html: string; className?: string }) {
  return <div className={cn(styles.texto, 'text-sm leading-relaxed', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
