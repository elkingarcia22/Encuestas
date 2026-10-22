import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  FileImportIcon,
  GridViewIcon,
  PlayCircleIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
} from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { PILL, WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'

const FIRST_STEPS = [
  { id: 'personas', title: 'Carga tus colaboradores', text: '1.240 personas importadas desde nómina el 2 de septiembre.' },
  { id: 'competencias', title: 'Define las competencias', text: 'Las preguntas salen de aquí. Puedes partir del modelo UBITS.' },
  { id: 'plantilla', title: 'Elige una plantilla de preguntas', text: 'Hay 12 plantillas por tipo de cargo; todas se pueden editar.' },
  { id: 'programar', title: 'Programa la primera evaluación', text: 'Define quién evalúa a quién y cuándo cierra.' },
]

const HELP: { title: string; text: string; cta: string; icon?: IconSvgElement; ai?: boolean }[] = [
  { title: 'Guía de evaluaciones 360', text: 'Cómo elegir evaluadores, cuántas preguntas usar y cómo leer los resultados.', cta: 'Leer la guía', icon: BookOpen01Icon },
  { title: 'Plantillas listas', text: 'Líderes, equipos comerciales, operación y cargos de entrada.', cta: 'Ver plantillas', icon: GridViewIcon },
  { title: 'Hablar con Orbit', text: 'Cuéntale qué quieres medir y el agente arma la evaluación contigo.', cta: 'Preguntar al agente', ai: true },
]

const EVALUATIONS = [
  { name: 'Líderes 2026 · II', people: 124, progress: 64, status: 'En curso', closes: 'Cierra el 30 de septiembre' },
  { name: 'Equipo comercial Bogotá', people: 58, progress: 12, status: 'En curso', closes: 'Cierra el 15 de octubre' },
  { name: 'Líderes 2026 · I', people: 118, progress: 100, status: 'Cerrada', closes: 'Cerró el 30 de marzo' },
]

// Patrón · Primer uso: la sección todavía no tiene datos y la pantalla enseña qué hacer primero.
export function Component() {
  const navigate = useNavigate()
  const [done, setDone] = useState<string[]>(['personas'])
  const [simulated, setSimulated] = useState(false)

  const toggle = (id: string) => setDone((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  return (
    <CaseFrame title="Primer uso" hint="Secciones sin datos todavía: explicar, guiar y ofrecer atajos">
      <PageShell>
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Desempeño y cultura' }, { label: 'Evaluaciones 360' }]}
          title="Evaluaciones 360"
          description="Recoge la mirada de jefes, pares y equipo sobre cada colaborador y conviértela en planes de desarrollo."
          actions={
            <>
              <Button variant="ghost" className={`${WS} text-muted-foreground!`} onClick={() => setSimulated((v) => !v)}>
                {simulated ? 'Ver estado vacío' : 'Simular datos'}
              </Button>
              <Button variant="outline" className={WS} onClick={() => notify('Importar evaluaciones desde Excel', undefined, 'info')}>
                <HugeiconsIcon icon={FileImportIcon} size={16} />
                Importar desde Excel
              </Button>
              <Button className={WS} onClick={() => notify('Crear evaluación', undefined, 'info')}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Crear evaluación
              </Button>
            </>
          }
        />

        <PageContent className="gap-10">
          {simulated ? (
            <PageSection title="Evaluaciones" description={`${EVALUATIONS.length} evaluaciones · 2 en curso`}>
              <Card className="py-2">
                <CardContent className="px-2">
                  <ItemGroup>
                    {/* Cada fila es un botón (se abre con teclado) dentro de su elemento de lista. */}
                    {EVALUATIONS.map((evaluation) => (
                      <div key={evaluation.name} role="listitem">
                        <Item render={<button type="button" />} className="cursor-pointer text-left" onClick={() => notify(`Abrir «${evaluation.name}»`, undefined, 'info')}>
                          <ItemMedia>
                            <IconTile variant="soft" size="sm">
                              <HugeiconsIcon icon={UserGroupIcon} />
                            </IconTile>
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{evaluation.name}</ItemTitle>
                            <ItemDescription>
                              {evaluation.people} personas · {evaluation.closes}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions className="gap-4">
                            <div className="hidden w-40 items-center gap-2 sm:flex">
                              <Progress value={evaluation.progress} aria-label={`Avance de ${evaluation.name}`} className="flex-1" />
                              <span className="w-9 text-right text-sm text-muted-foreground tabular-nums">{evaluation.progress}%</span>
                            </div>
                            <Badge variant={evaluation.progress === 100 ? 'outline' : 'secondary'} className="font-normal">
                              {evaluation.status}
                            </Badge>
                          </ItemActions>
                        </Item>
                      </div>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>
            </PageSection>
          ) : (
            <>
              {/* El vacío «Primera vez» del sistema, con su ilustración y una sola acción, la que empieza (decisión 14 de
                  la auditoría). «Importar desde Excel» ya está arriba, en la cabecera, y el video pasó a «¿Necesitas ayuda?». */}
              <PrimeraVez
                className="flex-none rounded-2xl border border-dashed py-16"
                icono="glass-add"
                titulo="Todavía no hay evaluaciones 360"
                descripcion="Crea la primera en unos minutos: eliges a quién evaluar, quién opina y cuándo cierra. Las preguntas salen de las competencias de tu empresa."
                accion={{ texto: 'Crear evaluación', icono: Add01Icon, onClick: () => notify('Crear evaluación', undefined, 'info') }}
              />

              <Card>
                <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle id="first-steps-title" role="heading" aria-level={2}>
                      Primeros pasos
                    </CardTitle>
                    <CardDescription>Cuatro pasos para lanzar tu primera evaluación.</CardDescription>
                  </div>
                  <div className="flex w-48 items-center gap-3">
                    <Progress value={(done.length / FIRST_STEPS.length) * 100} aria-labelledby="first-steps-title" className="flex-1" />
                    <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                      {done.length} de {FIRST_STEPS.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-3">
                  <ItemGroup>
                    {FIRST_STEPS.map((item, index) => {
                      const checked = done.includes(item.id)
                      return (
                        // El botón va dentro de su elemento de lista: un botón no puede ser hijo directo de una lista.
                        <div key={item.id} role="listitem">
                          <Item render={<button type="button" />} className="cursor-pointer text-left" onClick={() => toggle(item.id)}>
                            <ItemMedia>
                              <HugeiconsIcon
                                icon={checked ? CheckmarkCircle02Icon : CircleIcon}
                                size={22}
                                className={checked ? 'text-primary' : 'text-muted-foreground'}
                              />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle className={checked ? 'text-muted-foreground line-through' : undefined}>
                                {index + 1}. {item.title}
                              </ItemTitle>
                              <ItemDescription>{item.text}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                              {checked ? (
                                <Badge variant="outline" className="font-normal">
                                  Hecho
                                </Badge>
                              ) : (
                                <span className="flex items-center gap-1 text-sm font-medium">
                                  Empezar
                                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                                </span>
                              )}
                            </ItemActions>
                          </Item>
                        </div>
                      )
                    })}
                  </ItemGroup>
                </CardContent>
              </Card>

              <PageSection
                title="¿Necesitas ayuda?"
                description="Todo lo que suele consultar quien lanza su primera evaluación."
                actions={
                  <Button variant="ghost" size="sm" className={`${WS} text-muted-foreground!`} onClick={() => notify('Video: cómo funciona una evaluación 360', undefined, 'info')}>
                    <HugeiconsIcon icon={PlayCircleIcon} size={16} />
                    Ver cómo funciona · 2 min
                  </Button>
                }
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {HELP.map((card) => (
                    <Card key={card.title} className="gap-3">
                      <CardHeader className="flex flex-col gap-3">
                        {card.ai ? (
                          <Orb className="size-9" />
                        ) : card.icon ? (
                          <IconTile variant="soft" size="sm">
                            <HugeiconsIcon icon={card.icon} />
                          </IconTile>
                        ) : null}
                        <div className="flex flex-col gap-1">
                          <CardTitle role="heading" aria-level={3}>
                            {card.title}
                          </CardTitle>
                          <CardDescription>{card.text}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardFooter className="mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className={card.ai ? PILL : WS}
                          onClick={() =>
                            card.ai
                              ? navigate('/suite-ai?draft=Ay%C3%BAdame%20a%20crear%20mi%20primera%20evaluaci%C3%B3n%20360')
                              : notify(card.cta, undefined, 'info')
                          }
                        >
                          {card.cta}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </PageSection>
            </>
          )}
        </PageContent>

      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationFirstUsePage'
