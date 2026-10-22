import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, Edit02Icon, UserAdd01Icon } from '@hugeicons/core-free-icons'
import { Button, FramePanel, Heading, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Separator, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { PageContent, PageShell } from '@/shared/components/PageShell'
import { Filas, Marco, Rotulo } from '@/modules/design-system/patrones/ficha'
import { fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { contenidoDe, duracionTexto } from './catalogo'
import { BADGE_ESTADO, NOMBRE_ESTADO, itemsDelPlan, miembrosDe, momentoDe, personasDelPlan, type Plan } from './planes-datos'

// «Plan de formación creado»: lo que se ve al guardar, antes de ir al plan. Dice en una frase qué pasó y a quién le llega,
// resume lo creado (los datos y una fila por asignación) y lo que sigue, y ofrece los tres caminos: ver el plan, crear
// otro o volver a la lista. Es un estado de la página de Crear (no otra ruta), en el ancho angosto del marco.

const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`

const QUE_SIGUE = (plan: Plan, vigente: boolean) => [
  { icono: UserAdd01Icon, texto: 'Si entra alguien nuevo al grupo, recibe el plan solo.' },
  { icono: Edit02Icon, texto: 'Puedes cambiarlo cuando quieras: antes de guardar ves a quién le cambia qué.' },
  { icono: Clock01Icon, texto: vigente ? 'Ya puedes seguir el avance en la pestaña Avance.' : `Desde el ${fechaCorta(plan.inicio)} sigues el avance en la pestaña Avance.` },
]

export function PlanCreado({ plan, onVer, onOtro, onVolver }: { plan: Plan; onVer: () => void; onOtro: () => void; onVolver: () => void }) {
  const total = personasDelPlan(plan).length
  const distintos = itemsDelPlan(plan).length
  const vigente = plan.estado === 'Vigente'
  const momento = momentoDe(plan)

  return (
    <PageShell width="narrow">
      <PageContent>
        <div className="flex flex-col gap-6 py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <ImagenGlass nombre="glass-tick" tamano={72} />
            <Heading as="h1" level={3}>
              Plan de formación creado
            </Heading>
            <Text as="p" variant="muted">
              «{plan.nombre}» quedó {vigente ? 'Vigente' : 'Planeado'}.{' '}
              {vigente
                ? `Ya les llegó a ${personas(total)} en su Zona de estudio, con un aviso por correo y en la plataforma.`
                : `El ${fechaCorta(plan.inicio)} les llega a ${personas(total)} en su Zona de estudio, con un aviso por correo y en la plataforma.`}
            </Text>
          </div>

          <Marco
            titulo="Lo que creaste"
            accion={
              <Badge variant={BADGE_ESTADO[plan.estado]} size="sm" className="shrink-0">
                {NOMBRE_ESTADO[plan.estado]} · {momento.charAt(0).toLowerCase() + momento.slice(1)}
              </Badge>
            }
          >
            <FramePanel className="flex flex-col gap-4">
              <Filas
                filas={[
                  { termino: 'Fechas', valor: `${fechaCorta(plan.inicio)} – ${fechaCorta(plan.fin)}` },
                  { termino: 'Personas', valor: n(total) },
                  { termino: plan.tipo === 'competencias' ? 'Competencias distintas' : 'Contenidos distintos', valor: n(distintos) },
                  { termino: 'Asignaciones', valor: n(plan.asignaciones.length) },
                ]}
              />
              <Separator />
              <div className="flex flex-col gap-2">
                <Rotulo>Asignaciones</Rotulo>
                {plan.asignaciones.map((asignacion, indice) => {
                  const minutos = asignacion.items.reduce((suma, titulo) => suma + (contenidoDe(titulo)?.minutos ?? 0), 0)
                  return (
                    <Item key={asignacion.id} variant="outline" size="sm">
                      <ItemContent className="min-w-0">
                        <ItemTitle>{asignacion.nombre?.trim() || `Asignación ${indice + 1}`}</ItemTitle>
                        <ItemDescription className="line-clamp-2">
                          Asignación {indice + 1} · {personas(miembrosDe(asignacion).length)} · {asignacion.items.join(', ')}
                        </ItemDescription>
                      </ItemContent>
                      <Text as="span" size="sm" variant="muted" className="shrink-0 tabular-nums">
                        {plan.tipo === 'competencias' ? `${asignacion.items.length} ${plural(asignacion.items.length, 'competencia', 'competencias')}` : duracionTexto(minutos)}
                      </Text>
                    </Item>
                  )
                })}
              </div>
            </FramePanel>
          </Marco>

          <Marco titulo="Qué sigue">
            <FramePanel className="flex flex-col gap-1">
              {QUE_SIGUE(plan, vigente).map((linea) => (
                <Item key={linea.texto} size="xs">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={linea.icono} aria-hidden="true" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{linea.texto}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </FramePanel>
          </Marco>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={onOtro}>
                Crear otro plan
              </Button>
              <Button onClick={onVer}>Ver el plan</Button>
            </div>
            <Button variant="link" onClick={onVolver}>
              Volver a Planes de formación
            </Button>
          </div>
        </div>
      </PageContent>
    </PageShell>
  )
}
