import { Button, Heading, Item, ItemActions, ItemContent, Progress, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import type { Participante } from '@/modules/design-system/templates/planes-formacion/components/datos'
import { personasDelPlan, progresoDe, type Plan } from './planes-datos'

// El avance de las personas de un plan: en qué punto va cada una (Completado, En curso, Sin iniciar) y la franja de
// resumen que queda arriba de las demás pestañas. La pestaña «Avance» (detalle-plan.tsx) arma lo suyo con «Para atender»,
// la fila de cifras y la tabla; aquí ya no vive la dona de antes (15-oct).

export type Avance = 'Completado' | 'En curso' | 'Sin iniciar'
export const avanceDe = (p: Participante): Avance => (p.progreso === 100 ? 'Completado' : p.progreso > 0 ? 'En curso' : 'Sin iniciar')
export const BADGE_AVANCE: Record<Avance, 'success-light' | 'info-light' | 'outline'> = {
  Completado: 'success-light',
  'En curso': 'info-light',
  'Sin iniciar': 'outline',
}

// Lo esencial del avance, siempre a la vista arriba del plan mientras se edita (war room del 14-oct: «la gente entra a
// ver el estado, no a editar»). Separa las dos preguntas: cómo va el plan (sus fechas, en la cabecera) y cómo van las
// personas (aquí: cuántas terminaron todo, cuántas van a mitad de camino y cuántas no lo han empezado).
export function ResumenAvance({ plan, onVer }: { plan: Plan; onVer: () => void }) {
  const filas = personasDelPlan(plan)
  const cuenta = (avance: Avance) => filas.filter((f) => avanceDe(f) === avance).length
  const progreso = Math.round(progresoDe(plan))
  return (
    <Item variant="outline" size="sm" className="flex-wrap">
      <ItemContent className="min-w-48 flex-1 gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Heading as="h2" level={5} className="tabular-nums">
            {progreso} %
          </Heading>
          <Text as="span" size="sm" variant="muted">
            de las personas terminó todo lo suyo
          </Text>
        </div>
        <Progress value={progreso} aria-label={`${progreso} % de las personas terminó todo`} />
      </ItemContent>
      <ItemActions className="flex-wrap gap-2">
        <Badge variant={BADGE_AVANCE.Completado} size="sm" className="tabular-nums">
          {cuenta('Completado').toLocaleString('es-CO')} terminaron
        </Badge>
        <Badge variant={BADGE_AVANCE['En curso']} size="sm" className="tabular-nums">
          {cuenta('En curso').toLocaleString('es-CO')} en curso
        </Badge>
        <Badge variant={BADGE_AVANCE['Sin iniciar']} size="sm" className="tabular-nums">
          {cuenta('Sin iniciar').toLocaleString('es-CO')} sin iniciar
        </Badge>
        <Button variant="link" size="sm" onClick={onVer}>
          Ver el avance
        </Button>
      </ItemActions>
    </Item>
  )
}
