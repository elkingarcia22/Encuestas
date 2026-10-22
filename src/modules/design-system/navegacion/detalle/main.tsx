import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase06Icon,
  Building03Icon,
  Calendar03Icon,
  Cancel01Icon,
  Location01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconTile,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../drawers/components/drawer-styles'
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { CaseFrame } from '../components/case-frame'
import { VACANCIES } from './components/data'
import { ActivityPanel, CandidatesPanel, RecordAside, SummaryPanel } from './components/record-panels'

type TabId = 'resumen' | 'candidatos' | 'actividad'

// Patrón · Detalle de registro: la ficha de una vacante abierta desde la lista del shell básico.
export function Component() {
  const [index, setIndex] = useState(0)
  const [tab, setTab] = useState<TabId>('resumen')
  const [cerrando, setCerrando] = useState(false)
  const [cerradas, setCerradas] = useState<string[]>([])
  const vacancy = VACANCIES[index]

  const tabs: { value: TabId; label: string; count?: number }[] = [
    { value: 'resumen', label: 'Resumen' },
    { value: 'candidatos', label: 'Candidatos', count: vacancy.candidates.length },
    { value: 'actividad', label: 'Actividad', count: vacancy.activity.length },
  ]

  const meta = [
    { icon: Building03Icon, text: vacancy.area },
    { icon: UserIcon, text: vacancy.owner },
    { icon: Location01Icon, text: vacancy.location },
    { icon: Calendar03Icon, text: vacancy.published },
  ]

  return (
    <CaseFrame title="Detalle de registro" hint="Trabajar un registro y pasar al siguiente sin volver a la lista">
      <PageShell>
        <PageHeader
          back={{ label: 'Vacantes', to: '/design-system/navegacion/basica' }}
          media={
            <IconTile variant="soft" size="lg">
              <HugeiconsIcon icon={Briefcase06Icon} />
            </IconTile>
          }
          title={vacancy.name}
          badge={<Badge variant="secondary">{cerradas.includes(vacancy.name) ? 'Cerrada' : vacancy.status}</Badge>}
          meta={meta.map((item) => (
            <span key={item.text} className="flex items-center gap-1.5">
              <HugeiconsIcon icon={item.icon} size={15} />
              {item.text}
            </span>
          ))}
          actions={
            <>
              <div data-region="Anterior / siguiente" className="flex items-center gap-2.5">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {index + 1} de {VACANCIES.length} abiertas
                </span>
                <ButtonGroup>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Vacante anterior"
                    disabled={index === 0}
                    onClick={() => setIndex((i) => i - 1)}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Vacante siguiente"
                    disabled={index === VACANCIES.length - 1}
                    onClick={() => setIndex((i) => i + 1)}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </ButtonGroup>
              </div>
              <Separator orientation="vertical" className="mx-1.5 h-6!" />
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono size="icon" className={WS} aria-label="Más acciones" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
                </DropdownMenuTrigger>
                {/* El «⋯» va primero de los botones y su menú abre hacia adentro de la fila (decisión 15 de la auditoría). */}
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem onClick={() => notify('Vacante duplicada', undefined, 'success')}>Duplicar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => notify('Enlace copiado', undefined, 'success')}>Copiar enlace</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => notify('Vacante pausada', undefined, 'success')}>Pausar publicación</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Cerrar una vacante le llega a quienes se postularon: pregunta antes (13-oct, regla «preguntar-antes»). */}
                  <DropdownMenuItem variant="destructive" onClick={() => setCerrando(true)}>
                    Cerrar vacante
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button data-region="Botón secundario" variant="outline" className={WS} onClick={() => notify('Editar vacante', undefined, 'info')}>
                <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
                Editar
              </Button>
              <Button data-region="Botón primario" className={WS} onClick={() => notify('Agendar entrevista', undefined, 'info')}>
                <HugeiconsIcon icon={Calendar03Icon} size={16} />
                Agendar entrevista
              </Button>
            </>
          }
          tabs={
            <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
              <TabsList variant="line">
                {tabs.map((item) => (
                  <TabsTrigger key={item.value} value={item.value} className="flex-none gap-2 px-3">
                    {item.label}
                    {item.count !== undefined ? (
                      <Badge variant="secondary" size="xs" className="tabular-nums">
                        {item.count}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        />

        <PageContent>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {tab === 'resumen' ? <SummaryPanel vacancy={vacancy} /> : null}
              {tab === 'candidatos' ? <CandidatesPanel vacancy={vacancy} /> : null}
              {tab === 'actividad' ? <ActivityPanel vacancy={vacancy} /> : null}
            </div>
            <RecordAside vacancy={vacancy} />
          </div>
        </PageContent>

        {/* Dice qué se toca y a cuántas personas llega, con los números de la vacante. */}
        <DialogoConfirmar
          abierto={cerrando}
          onAbiertoChange={setCerrando}
          icono={Cancel01Icon}
          titulo="¿Cerrar la vacante?"
          descripcion={`Deja de recibir postulaciones y se avisa por correo a quienes siguen en proceso (${vacancy.candidates.length} candidatos). No se puede reabrir desde aquí.`}
          cancelar="Seguir abierta"
          accion="Cerrar vacante"
          destructiva
          onConfirmar={() => {
            setCerrando(false)
            setCerradas((antes) => [...antes, vacancy.name])
            notify('Vacante cerrada', `Se avisó a ${vacancy.candidates.length} candidatos.`, 'success')
          }}
        >
          <RegistroConfirmar nombre={vacancy.name} detalle={`${vacancy.area} · ${vacancy.location}`} estado={vacancy.status} tono="neutro" icono={Briefcase06Icon} />
        </DialogoConfirmar>
      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationDetailPage'
