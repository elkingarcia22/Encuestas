import { useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ChartDecreaseIcon, ChartIncreaseIcon, Delete02Icon, PencilEdit02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Button, Heading, Input, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, Text, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { MEASURE_META, formatRawValue, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { MAX_TITULO } from './campo-titulo'

// La cabecera de la tarjeta, siempre a la vista: plegar, el estado (lista, pendiente o con error), «Objetivo 2» con el
// vocabulario del modelo, las marcas de IA y, a la derecha, eliminar. Plegada, debajo van el
// título (que se edita en el sitio con el lápiz, como el de una sección en encuestas) y el resumen: medida, desde →
// hasta, peso y lo que falta.

export type EstadoTarjeta = 'completa' | 'pendiente' | 'error'

function Resumen({ objetivo, conPeso, incidencia }: { objetivo: Objective; conPeso: boolean; incidencia: string | null }) {
  const { measure, direction } = objetivo
  if (measure === null) {
    return (
      <Text as="p" size="sm" variant="muted">
        {incidencia ?? 'Sin configurar'}
      </Text>
    )
  }
  const desde = formatRawValue(objetivo.initialValue, measure)
  const hasta = formatRawValue(objetivo.targetValue, measure)
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge variant="secondary" size="xs">
        {MEASURE_META[measure].label}
      </Badge>
      {measure !== 'boolean' && direction !== null ? (
        <Text as="span" size="sm" variant="muted" className="flex items-center gap-1 tabular-nums">
          <HugeiconsIcon icon={direction === 'increase' ? ChartIncreaseIcon : ChartDecreaseIcon} size={14} aria-hidden="true" />
          {desde && hasta ? `${desde} → ${hasta}` : direction === 'increase' ? 'Aumentar' : 'Reducir'}
        </Text>
      ) : null}
      {conPeso && objetivo.weight > 0 ? (
        <Text as="span" size="sm" weight="medium" className="tabular-nums">
          Peso {objetivo.weight} %
        </Text>
      ) : null}
      {incidencia ? (
        <Text as="span" size="sm" variant="destructive">
          · {incidencia}
        </Text>
      ) : null}
    </div>
  )
}

export function CabeceraTarjeta({
  objetivo,
  etiqueta,
  abierta,
  onAlternar,
  plegable = true,
  incidencia,
  conPeso,
  tituloInvalido,
  onTitulo,
  onEliminar,
  confirmarEliminar,
}: {
  objetivo: Objective
  /** «Objetivo 2», «Indicador 1», «Objetivo de la empresa 3»… */
  etiqueta: string
  abierta: boolean
  onAlternar: () => void
  /** Sin la flecha de plegar: la tarjeta va siempre abierta (el detalle de la ventana de la asignación). */
  plegable?: boolean
  incidencia: string | null
  conPeso: boolean
  tituloInvalido: boolean
  onTitulo: (titulo: string) => void
  onEliminar: () => void
  /** La pregunta antes de eliminar, en un globo pegado a la papelera (Elkin, 20-oct): ni ventana al centro ni el panel
   *  entero. Sin ella (una tarjeta en blanco), la papelera elimina directo con `onEliminar`. */
  confirmarEliminar?: { abierto: boolean; onAbierto: (abierto: boolean) => void; titulo: string; descripcion: string; onConfirmar: () => void }
}) {
  const [editando, setEditando] = useState(false)
  const nombre = objetivo.title.trim() || etiqueta
  const terminar = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'Enter' || evento.key === 'Escape') setEditando(false)
  }

  return (
    <div className="group/item flex items-start gap-3 px-5 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">

        {editando ? (
          <Input
            aria-label="Título del objetivo"
            // Fondo blanco: el campo es transparente y se pierde sobre el gris (diferencias.json › input-group-fondo-solido).
            className="w-full bg-background! font-medium"
            value={objetivo.title}
            maxLength={MAX_TITULO}
            placeholder={etiqueta}
            autoFocus
            aria-invalid={tituloInvalido || undefined}
            onKeyDown={terminar}
            onBlur={() => setEditando(false)}
            onChange={(evento) => onTitulo(evento.target.value.slice(0, MAX_TITULO))}
          />
        ) : (
          <>
            <TextoCompleto texto={nombre}>
              {/* Sin título, el nombre provisional va en gris: el color del tema del Heading no se cambia sin «!» (diferencias.json › instalacion-estilos-sin-capa). */}
              <Heading as="h3" level={6} className={cn('truncate', !objetivo.title.trim() && 'text-muted-foreground!')}>
                {nombre}
              </Heading>
            </TextoCompleto>
            {abierta ? null : <Resumen objetivo={objetivo} conPeso={conPeso} incidencia={incidencia} />}
          </>
        )}
      </div>

      <div className="flex h-6 shrink-0 items-center gap-1">
        <div className={cn('items-center gap-1', editando ? 'flex' : 'flex invisible opacity-0 group-hover/item:visible group-hover/item:opacity-100 focus-within:visible focus-within:opacity-100')}>
          {abierta || editando ? null : (
            <Hint label="Editar título">
              <BotonIcono aria-label={`Editar el título de ${nombre}`} onClick={() => setEditando(true)}>
                <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" />
              </BotonIcono>
            </Hint>
          )}
          {editando ? (
            <Button variant="outline" size="icon" aria-label={`Terminar de editar ${nombre}`} onClick={() => setEditando(false)}>
              <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
            </Button>
          ) : null}
          {/* Rojo de borrar: los botones sin borde no traen tono rojo (diferencias.json › button-ghost-tonos). */}
          {confirmarEliminar ? (
            <Popover open={confirmarEliminar.abierto} onOpenChange={confirmarEliminar.onAbierto}>
              <PopoverTrigger render={<BotonIcono aria-label={`Eliminar ${nombre}`} className="text-destructive!" />}>
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <PopoverHeader>
                  <PopoverTitle>{confirmarEliminar.titulo}</PopoverTitle>
                  <PopoverDescription>{confirmarEliminar.descripcion}</PopoverDescription>
                </PopoverHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => confirmarEliminar.onAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={confirmarEliminar.onConfirmar}>
                    Eliminar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Hint label="Eliminar">
              <BotonIcono aria-label={`Eliminar ${nombre}`} className="text-destructive!" onClick={onEliminar}>
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              </BotonIcono>
            </Hint>
          )}
        </div>
        {editando || !plegable ? null : (
          <BotonIcono aria-label={abierta ? 'Contraer objetivo' : 'Expandir objetivo'} aria-expanded={abierta} onClick={onAlternar}>
            <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', abierta && 'rotate-180')} />
          </BotonIcono>
        )}
      </div>
    </div>
  )
}
