import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, UserRemove01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { FILA_CLICABLE, FilasSeparadas } from '../../../../encuestas/components/marco-lista'
import { COLLABORATORS } from '../../../../encuestas/modelo/collaborators'
import type { ObjectiveSet } from '../../../modelo/constructor/cicloBuilderTypes'

// Quiénes son la excepción de una agrupación y qué llevan en su lugar. Un solo panel con dos páginas: la lista de
// personas que se sacaron del grupo porque llevan objetivos propios, y al tocar una, sus objetivos individuales;
// «Volver a la lista» regresa sin cerrar.

const PERSONA_POR_ID = new Map(COLLABORATORS.map((persona) => [persona.id, persona]))

export function DrawerExcepciones({
  abierto,
  onAbiertoChange,
  excluidas,
  sets,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  excluidas: readonly string[]
  /** Todo lo repartido: de ahí salen los objetivos individuales de cada quien. */
  sets: readonly ObjectiveSet[]
}) {
  const [elegida, setElegida] = useState<string | null>(null)
  const persona = elegida ? (PERSONA_POR_ID.get(elegida) ?? null) : null
  const propios = useMemo(() => (elegida ? sets.filter((set) => set.kind === 'individual' && set.targetIds.includes(elegida)).flatMap((set) => set.objectives) : []), [sets, elegida])

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(abrir) => {
        // Cada apertura arranca en la lista.
        if (!abrir) setElegida(null)
        onAbiertoChange(abrir)
      }}
      size="sm"
      icon={UserRemove01Icon}
      title={persona ? persona.name : excluidas.length === 1 ? '1 excepción' : `${excluidas.length} excepciones`}
      description={persona ? 'Sus objetivos individuales: por esto se sacó de la agrupación.' : 'Personas del grupo que se sacaron de esta asignación porque llevan objetivos propios.'}
    >
      {persona ? (
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setElegida(null)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
            Volver a la lista
          </Button>
          {propios.length === 0 ? (
            <PrimeraVez
              icono="glass-document"
              titulo="Todavía no tiene objetivos individuales escritos."
              descripcion="Cuando se los escribas en «Por colaborador», aparecerán aquí."
              className="border"
            />
          ) : (
            <FilasSeparadas className="rounded-xl border px-3">
              {propios.map((objetivo, indice) => (
                <Item key={objetivo.id} size="sm">
                  <ItemContent>
                    <ItemTitle className="truncate">
                      {indice + 1}. {objetivo.title.trim() || 'Objetivo sin título'}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant="secondary" size="sm" className="tabular-nums">
                      {objetivo.weight} %
                    </Badge>
                  </ItemActions>
                </Item>
              ))}
            </FilasSeparadas>
          )}
        </div>
      ) : (
        <FilasSeparadas className="px-2">
          {excluidas.map((id) => {
            const quien = PERSONA_POR_ID.get(id)
            return (
              <Item key={id} size="sm" render={<button type="button" />} onClick={() => setElegida(id)} className={FILA_CLICABLE}>
                <ItemContent>
                  <Persona nombre={quien?.name ?? 'Colaborador'} />
                  <ItemDescription className="sr-only">{quien?.area ?? 'Sin área'}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="outline" size="xs">
                    {quien?.area ?? 'Sin área'}
                  </Badge>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground" aria-hidden="true" />
                </ItemActions>
              </Item>
            )
          })}
        </FilasSeparadas>
      )}
    </DrawerShell>
  )
}
