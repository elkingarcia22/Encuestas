import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Alert02Icon, ChevronDownIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Frame,
  FramePanel,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  cn,
} from '@ubits/flux-ui'
import { plural } from '@/modules/design-system/patrones/formato'

// «N cosas necesitan tu atención»: la franja de arriba de una lista con lo que no puede esperar, plegada por defecto y
// con una fila por asunto. Es el patrón que estrenó Vacantes (Elkin); aquí queda como pieza para que las demás listas
// —Contenidos, Diagnóstico, Avisos— no lo vuelvan a armar cada una a su manera.
//
// Lo que va aquí es lo que pide **una acción**, no cualquier dato interesante: eso son las métricas de arriba. Si nada
// necesita atención, la franja no se pinta: una lista vacía de problemas no es una lista, es ruido.

export type AlertaAtencion = {
  id: string
  icono: IconSvgElement
  tono: 'text-destructive' | 'text-warning' | 'text-info'
  /** La frase completa, con el número: «3 colaboradores están bloqueados». */
  titulo: string
  /** Por qué pasa y qué se hace al respecto. */
  detalle: string
  /** Etiqueta corta para la franja plegada, donde van todas separadas por «·». */
  resumen: string
  onVer: () => void
  /** Por defecto, «Ver». */
  etiquetaAccion?: string
}

export function BloqueAtencion({ alertas, etiqueta }: { alertas: AlertaAtencion[]; etiqueta: string }) {
  const [abierto, setAbierto] = useState(false)
  if (!alertas.length) return null

  return (
    <Collapsible open={abierto} onOpenChange={setAbierto} className="flex flex-col gap-2">
      <Frame>
        <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
          <CollapsibleTrigger nativeButton={false} render={<Item className="w-full cursor-pointer" />} aria-label={etiqueta}>
            <ItemMedia>
              {/* El tono del primero: las alertas vienen de la más grave a la menos. */}
              <IconTile variant="soft" size="sm" className={alertas[0].tono}>
                <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
              </IconTile>
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>
                {alertas.length} {plural(alertas.length, 'cosa necesita', 'cosas necesitan')} tu atención
              </ItemTitle>
              <ItemDescription>{alertas.map((alerta) => alerta.resumen).join(' · ')}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <HugeiconsIcon icon={ChevronDownIcon} aria-hidden="true" className={cn('transition-transform', abierto && 'rotate-180')} />
            </ItemActions>
          </CollapsibleTrigger>
        </FramePanel>
      </Frame>

      <CollapsibleContent>
        <Frame stacked>
          {alertas.map((alerta) => (
            <FramePanel key={alerta.id} className="flex items-center [--frame-panel-px:0px] [--frame-panel-py:0px]">
              <Item>
                <ItemMedia>
                  <IconTile variant="soft" size="sm" className={alerta.tono}>
                    <HugeiconsIcon icon={alerta.icono} aria-hidden="true" />
                  </IconTile>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>{alerta.titulo}</ItemTitle>
                  <ItemDescription>{alerta.detalle}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="sm" onClick={alerta.onVer}>
                    {alerta.etiquetaAccion ?? 'Ver'}
                  </Button>
                </ItemActions>
              </Item>
            </FramePanel>
          ))}
        </Frame>
      </CollapsibleContent>
    </Collapsible>
  )
}
