import { useEffect, useRef } from 'react'
import { Input, Textarea, cn } from '@ubits/flux-ui'

// Edición en línea: un campo que se lee como texto y se edita con solo hacer clic encima. No hay lápiz ni cambio de
// modo; el campo está siempre ahí, sin borde ni fondo, con la tipografía del sitio donde vive. Lo único que anuncia
// que se puede tocar es el fondo que aparece al pasar por encima.
//
// Es el patrón de UBITS para títulos y descripciones que se cambian en el momento, sin abrir un formulario aparte.
//
// Flux-ui no trae una variante sin cromo de Input ni de Textarea, así que aquí se les quita: es un ajuste propio y
// está documentado en Design system › Marco › Ajustes propios como pedido a la librería.

// El campo hereda la tipografía de su contenedor —un Heading, un Text— en vez de traer la suya: así el mismo
// componente sirve para un título grande y para una nota pequeña, y el texto no salta al empezar a editar. La
// herencia va por `style` y no por clase: el atajo de Tailwind para esto cambió en la versión 4 y, sobre todo, así
// gana siempre al tamaño que trae la librería sin depender del orden de las clases.
const HEREDA_TIPOGRAFIA = { font: 'inherit', letterSpacing: 'inherit' } as const
// Los `!` no son capricho: las clases propias de la librería (`cn-input`, `cn-textarea`) traen borde, relleno y
// tamaño de letra, y le ganan a las utilidades sueltas. Sin forzarlas, el campo se sigue viendo como un campo.
const SIN_CROMO = [
  'border-0! bg-transparent! p-0! shadow-none!',
  'text-current!',
  'h-auto! min-h-0! w-full rounded-sm transition-colors',
  'placeholder:text-muted-foreground',
  // El fondo al pasar por encima es lo que dice «esto se puede editar».
  'hover:bg-muted!',
  // El anillo de foco es el del tema, el mismo de cualquier campo: no se fuerza uno propio.
  'focus-visible:bg-muted!',
  'read-only:pointer-events-none read-only:opacity-55 disabled:pointer-events-none disabled:opacity-55',
].join(' ')

type Props = {
  valor: string
  onCambiar: (valor: string) => void
  /** Nombre del campo para lectores de pantalla: «Título del video», «Descripción». */
  etiqueta: string
  /** Lo que se lee cuando está vacío. */
  marcador?: string
  /** Varias líneas: crece con el contenido, sin barra de desplazamiento. */
  multilinea?: boolean
  filas?: number
  maxCaracteres?: number
  invalido?: boolean
  soloLectura?: boolean
  deshabilitado?: boolean
  onBlur?: () => void
  className?: string
}

export function EdicionEnLinea({
  valor,
  onCambiar,
  etiqueta,
  marcador,
  multilinea = false,
  filas = 1,
  maxCaracteres,
  invalido = false,
  soloLectura = false,
  deshabilitado = false,
  onBlur,
  className,
}: Props) {
  const area = useRef<HTMLTextAreaElement>(null)

  // Crece con el contenido: se borra el alto para medir lo que ocupa de verdad y se fija ese.
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [valor, multilinea])

  const comunes = {
    style: HEREDA_TIPOGRAFIA,
    'aria-label': etiqueta,
    'aria-invalid': invalido || undefined,
    placeholder: marcador,
    value: valor,
    maxLength: maxCaracteres,
    readOnly: soloLectura,
    disabled: deshabilitado,
    onBlur,
    className: cn(
      SIN_CROMO,
      // En error sí aparece un borde, porque si no el aviso pasaría desapercibido en un campo sin cromo.
      invalido && 'border! border-destructive! px-2! placeholder:text-destructive/70',
    ),
  }

  if (multilinea) {
    return (
      <Textarea
        {...comunes}
        ref={area}
        rows={filas}
        onChange={(e) => onCambiar(e.target.value)}
        className={cn(comunes.className, 'resize-none overflow-hidden', className)}
      />
    )
  }

  // Una línea: abraza el texto y crece hasta el ancho máximo que le dé `className` (o el de su contenedor). Una copia
  // invisible del texto pone el ancho en la misma celda de la rejilla; el campo la llena. Si no cabe, fuera del foco se
  // corta con «…» y al hacer clic se ve completo para editarlo.
  return (
    <span className={cn('inline-grid max-w-full min-w-0 align-middle', className)}>
      <span aria-hidden="true" style={HEREDA_TIPOGRAFIA} className="invisible col-start-1 row-start-1 overflow-hidden pr-1 whitespace-pre">
        {valor || marcador || ' '}
      </span>
      <Input
        {...comunes}
        size={1}
        className={cn(comunes.className, 'col-start-1 row-start-1 min-w-0 text-ellipsis')}
        onChange={(e) => onCambiar(e.target.value)}
        // Al soltarlo vuelve al inicio del texto: si no, algunos navegadores lo dejan corrido y el «…» no aparece.
        onBlur={(e) => {
          e.currentTarget.scrollLeft = 0
          onBlur?.()
        }}
        // Enter no envía nada aquí: solo suelta el campo, como terminar de escribir un título.
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      />
    </span>
  )
}
