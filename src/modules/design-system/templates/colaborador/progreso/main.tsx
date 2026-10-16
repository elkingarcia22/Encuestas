import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Mail01Icon, Medal01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
  toast,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { AiThinking } from '@/shared/components/AiThinking'
import { BotonIa } from '@/shared/components/BotonIa'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { Indicadores } from '@/modules/design-system/metricas/cifras'

import { BASE, CONTENIDOS, EQUIPO, RANKING_AREAS, RANKING_PERSONAS, type Integrante } from '../components/data'
import { EncabezadoPantalla } from '../components/piezas'
import { diasDesde, fechaCorta, iniciales } from '../../../patrones/formato'

// Progreso (vista líder). Hoy: /learn/progress, con planes vigentes, fecha de cierre y porcentaje.
// HU «Progreso del colaborador (vista de líder)»: hero de persona con foco cambiable, KPIs,
// planes vigentes, rankings del mes, recordatorios y «Generar Plan con IA» (RN-01 a RN-05).

function Persona({ integrante, tamano = 'sm' }: { integrante: Pick<Integrante, 'nombre' | 'foto'>; tamano?: 'sm' | 'default' | 'lg' }) {
  return (
    <Avatar size={tamano}>
      <AvatarImage src={integrante.foto} alt="" />
      <AvatarFallback>{iniciales(integrante.nombre)}</AvatarFallback>
    </Avatar>
  )
}

function Recordatorio({ abierto, onAbierto }: { abierto: boolean; onAbierto: (v: boolean) => void }) {
  const atrasados = EQUIPO.filter((p) => p.id !== 'maria' && p.planes.some((plan) => plan.avance < 50))
  const [elegidos, setElegidos] = useState<Set<string>>(new Set(atrasados.map((p) => p.id)))

  return (
    // La ventana de acción del sistema: la X arriba y el pie gris con la nota, Cancelar y enviar.
    <ActionDialog
      open={abierto}
      onOpenChange={onAbierto}
      title="Enviar recordatorio"
      sub="Les llega un correo y un aviso en su inicio."
      note="Ya marcamos a quienes van por debajo del 50 %."
      confirmLabel={`Enviar a ${elegidos.size}`}
      confirmDisabled={elegidos.size === 0}
      onConfirm={() => toast.add({ type: 'success', title: `Recordatorio enviado a ${elegidos.size} ${elegidos.size === 1 ? 'persona' : 'personas'}` })}
    >
        <FieldGroup>
          <FieldSet>
            <FieldLegend variant="label">Para quién</FieldLegend>
            {EQUIPO.filter((p) => p.id !== 'maria').map((p) => (
              <Field key={p.id} orientation="horizontal">
                <Checkbox
                  id={`rec-${p.id}`}
                  checked={elegidos.has(p.id)}
                  onCheckedChange={(marcado) =>
                    setElegidos((previos) => {
                      const nuevos = new Set(previos)
                      if (marcado) nuevos.add(p.id)
                      else nuevos.delete(p.id)
                      return nuevos
                    })
                  }
                />
                <FieldContent>
                  <FieldLabel htmlFor={`rec-${p.id}`}>{p.nombre}</FieldLabel>
                  <FieldDescription>
                    {p.planes.length ? `${p.planes[0].nombre} · ${p.planes[0].avance} %` : 'Sin planes vigentes'}
                  </FieldDescription>
                </FieldContent>
              </Field>
            ))}
          </FieldSet>
          <Field>
            <FieldLabel htmlFor="rec-mensaje">Mensaje</FieldLabel>
            <Textarea
              id="rec-mensaje"
              rows={3}
              defaultValue="Hola, el plan cierra el 30 de septiembre. ¿Te ayudo a organizar lo que falta?"
            />
          </Field>
        </FieldGroup>
    </ActionDialog>
  )
}

// RN-05: «Generar Plan con IA» abre el panel de IA de esta vista, no Modo estudio IA.
function PlanConIA({ abierto, onAbierto, foco }: { abierto: boolean; onAbierto: (v: boolean) => void; foco: Integrante }) {
  const [paso, setPaso] = useState<'brief' | 'pensando' | 'propuesta'>('brief')
  const propuesta = CONTENIDOS.filter((c) => ['atencion-omnicanal', 'retroalimentacion', 'simulador-ventas'].includes(c.id))

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(valor) => {
        onAbierto(valor)
        if (!valor) setPaso('brief')
      }}
      ai
      title="Generar plan con IA"
      description={`Para ${foco.nombre}. La IA propone; tú decides qué se asigna.`}
      footer={
        paso === 'propuesta' ? (
            <Button
              onClick={() => {
                onAbierto(false)
                setPaso('brief')
                toast.add({ type: 'success', title: 'Plan asignado', description: `${foco.nombre} lo verá en su Zona de estudio.` })
              }}
            >
              Asignar este plan
            </Button>
          ) : (
            <BotonIaSecundario
              disabled={paso === 'pensando'}
              onClick={() => {
                setPaso('pensando')
                window.setTimeout(() => setPaso('propuesta'), 1600)
              }}
            >
              Generar propuesta
            </BotonIaSecundario>
          )
      }
    >
      <div className="flex flex-col gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ia-objetivo">¿Qué debería aprender?</FieldLabel>
              <Textarea id="ia-objetivo" rows={3} defaultValue="Mejorar la atención de reclamos por chat y dar mejor retroalimentación a su equipo." />
            </Field>
            <Field>
              <FieldLabel htmlFor="ia-tiempo">Tiempo disponible</FieldLabel>
              <Select defaultValue="4">
                <SelectTrigger id="ia-tiempo" className="w-full">
                  <SelectValue>{(v) => `${v} horas en las próximas 4 semanas`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {['2', '4', '8'].map((h) => (
                    <SelectItem key={h} value={h}>
                      {h} horas en las próximas 4 semanas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {paso === 'pensando' ? (
            // La espera de la IA es la del sistema: el orbe respira y el texto brilla.
            <div className="flex flex-col gap-1">
              <AiThinking label="Buscando en el catálogo…" />
              <Text variant="muted" size="sm" className="pl-8">
                Cruza su área, su historial y lo que ya terminó.
              </Text>
            </div>
          ) : null}

          {paso === 'propuesta' ? (
            <div className="flex flex-col gap-2">
              <Text size="sm" weight="medium">
                Propuesta · 3 contenidos, 3 h 28 min
              </Text>
              <ItemGroup className="flex flex-col gap-2">
                {propuesta.map((c) => (
                  <Item key={c.id} variant="outline" size="sm">
                    <ItemMedia variant="image">
                      <img src={c.imagen} alt="" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{c.titulo}</ItemTitle>
                      <ItemDescription>
                        {c.tipo} · {c.duracion}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            </div>
          ) : null}
      </div>
    </DrawerShell>
  )
}

export function Component() {
  const navigate = useNavigate()
  const [focoId, setFocoId] = useState('maria')
  const [recordatorio, setRecordatorio] = useState(false)
  const [ia, setIa] = useState(false)
  const foco = EQUIPO.find((p) => p.id === focoId) ?? EQUIPO[0]
  const maxArea = Math.max(...RANKING_AREAS.map((a) => a.horas))

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPantalla
        titulo="Progreso"
        descripcion="Tu avance y el de tu equipo este mes. Se actualiza cada 30 minutos."
        acciones={
          <>
            <Button variant="outline" onClick={() => setRecordatorio(true)}>
              <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
              Enviar recordatorio
            </Button>
            {/* La única acción de IA de la vista: el primario de IA, al final de la fila (decisión 10 de la auditoría). */}
            <BotonIa onClick={() => setIa(true)}>Generar plan con IA</BotonIa>
          </>
        }
      />

      {/* Hero de persona (RN-02): por defecto María; se puede cambiar el foco al equipo. */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Persona integrante={foco} tamano="lg" />
            <div className="flex min-w-0 flex-col gap-1">
              <Text weight="semibold" className="truncate">
                {foco.nombre}
              </Text>
              <Text variant="muted" size="sm">
                {foco.cargo}
              </Text>
            </div>
          </div>
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel htmlFor="foco">Ver progreso de</FieldLabel>
            <Select value={focoId} onValueChange={(v) => setFocoId(String(v))}>
              <SelectTrigger id="foco" className="w-64">
                <SelectValue>{(v) => EQUIPO.find((p) => p.id === v)?.nombre}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EQUIPO.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id === 'maria' ? `${p.nombre} (tú)` : p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* Las cuatro cifras en una sola fila partida por líneas (decisión 11 de la auditoría), no en tarjetas sueltas. */}
      <Indicadores
        cifras={[
          { etiqueta: 'Horas de estudio', valor: `${foco.horasMes.toLocaleString('es-CO')} h`, detalle: 'En septiembre' },
          { etiqueta: 'Contenidos terminados', valor: String(foco.terminados), detalle: 'En el año' },
          { etiqueta: 'Certificados', valor: String(foco.certificados), detalle: 'Descargables en Zona de estudio' },
          { etiqueta: 'Planes vigentes', valor: String(foco.planes.length), detalle: 'Con fecha de cierre' },
        ]}
      />

      <section className="flex flex-col gap-3" aria-labelledby="planes-vigentes">
        <Text weight="semibold" id="planes-vigentes">
          Planes vigentes
        </Text>
        {foco.planes.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {foco.planes.map((plan) => (
              <Card key={plan.nombre} size="sm">
                <CardHeader>
                  <CardTitle>{plan.nombre}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} aria-hidden="true" />
                    Cierra el {fechaCorta(plan.cierre)} · faltan {-diasDesde(plan.cierre)} días
                  </CardDescription>
                  <CardAction>
                    <Badge variant={plan.avance >= 65 ? 'success-light' : plan.avance >= 40 ? 'info-light' : 'warning-light'} size="sm">
                      {plan.avance >= 65 ? 'Al día' : plan.avance >= 40 ? 'En curso' : 'Atrasado'}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <Progress value={plan.avance}>
                    <ProgressLabel>Avance del plan</ProgressLabel>
                    <ProgressValue className="ms-auto" />
                  </Progress>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // RN-04: sin planes vigentes, con salida al catálogo. Es el «Primera vez» del sistema, con ilustración
          // (decisión 14 de la auditoría), como en la pantalla real de Progreso.
          <Card>
            <CardContent>
              <PrimeraVez
                icono="glass-document"
                titulo="Sin planes vigentes"
                descripcion={`${foco.nombre} no tiene planes con fecha de cierre por delante.`}
                accion={{ texto: 'Explorar catálogo', icono: Search01Icon, onClick: () => navigate(`${BASE}/catalogo`) }}
              />
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Tu equipo</CardTitle>
            <CardDescription>{EQUIPO.length - 1} personas a tu cargo</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="flex flex-col gap-1">
              {EQUIPO.filter((p) => p.id !== 'maria').map((p) => {
                const plan = p.planes[0]
                return (
                  <Item key={p.id} size="sm" variant={p.id === focoId ? 'muted' : 'default'}>
                    <ItemMedia>
                      <Persona integrante={p} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>{p.nombre}</ItemTitle>
                      <ItemDescription>{plan ? plan.nombre : 'Sin planes vigentes'}</ItemDescription>
                    </ItemContent>
                    <ItemActions className="w-40">
                      {plan ? (
                        <Progress value={plan.avance} className="w-full gap-1">
                          <ProgressValue className="ms-auto" />
                        </Progress>
                      ) : (
                        <Badge variant="outline" size="sm">
                          Sin plan
                        </Badge>
                      )}
                    </ItemActions>
                    <ItemActions>
                      <Button variant="ghost" size="sm" onClick={() => setFocoId(p.id)}>
                        Ver
                      </Button>
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Ranking de estudio del mes</CardTitle>
              <CardDescription>Horas de estudio en toda la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup className="flex flex-col gap-1">
                {RANKING_PERSONAS.map((p, indice) => (
                  <Item key={p.nombre} size="xs" variant={p.nombre === EQUIPO[0].nombre ? 'muted' : 'default'}>
                    <ItemMedia>
                      <Badge variant={indice < 3 ? 'warning-light' : 'outline'} size="sm">
                        {indice < 3 ? <HugeiconsIcon icon={Medal01Icon} aria-hidden="true" /> : null}
                        {indice + 1}
                      </Badge>
                    </ItemMedia>
                    <ItemMedia>
                      <Persona integrante={p} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>{p.nombre === EQUIPO[0].nombre ? 'Tú' : p.nombre}</ItemTitle>
                      <ItemDescription>{p.area}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Text as="span" size="sm" weight="medium" className="tabular-nums">
                        {p.horas.toLocaleString('es-CO')} h
                      </Text>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Ranking entre áreas este mes</CardTitle>
              <CardDescription>Horas promedio por persona</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {RANKING_AREAS.map((a) => (
                <Progress key={a.area} value={Math.round((a.horas / maxArea) * 100)}>
                  <ProgressLabel>{a.area}</ProgressLabel>
                  <ProgressValue className="ms-auto">{() => `${a.horas.toLocaleString('es-CO')} h`}</ProgressValue>
                </Progress>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Recordatorio abierto={recordatorio} onAbierto={setRecordatorio} />
      <PlanConIA abierto={ia} onAbierto={setIa} foco={foco} />
    </div>
  )
}

Component.displayName = 'TemplateColaboradorProgreso'
