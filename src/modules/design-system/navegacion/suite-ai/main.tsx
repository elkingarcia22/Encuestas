import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowUp02Icon,
  Notification03Icon,
  RefreshIcon,
  Task01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
import { PILL } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'
import { ROLES, SOURCES } from './components/data'
import { RoleCard } from './components/proposal'
import { HistoryTab, SourcesTab } from './components/sources-history'

type Tab = 'propuesta' | 'fuentes' | 'historial'

const QUICK_ADJUSTMENTS = ['Solo candidatos internos', 'Horizonte de 12 meses', 'Priorizar diversidad']

const IMPACT = [
  { icon: Notification03Icon, text: '3 jefes directos reciben el plan por correo y en su portal.' },
  { icon: UserGroupIcon, text: '5 colaboradores quedan marcados como sucesores. A ellos no se les notifica.' },
  { icon: Task01Icon, text: 'Se crean 5 planes de desarrollo en borrador para revisar con cada jefe.' },
]

// Patrón · Resultado de Suite AI: una página que armó el agente y que la persona revisa, ajusta y aprueba.
export function Component() {
  const [tab, setTab] = useState<Tab>('propuesta')
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [version, setVersion] = useState(2)
  const [confirm, setConfirm] = useState(false)
  const [published, setPublished] = useState(false)

  const regenerate = () => {
    setRegenerating(true)
    window.setTimeout(() => {
      setRegenerating(false)
      setVersion((v) => v + 1)
      notify('El agente generó una versión nueva')
    }, 1400)
  }

  const sendAdjustment = (text: string) => {
    if (!text.trim()) return
    setAdjustOpen(false)
    setPrompt('')
    notify(`Ajustando: «${text.trim()}»`)
    regenerate()
  }

  return (
    <CaseFrame title="Resultado de Orbit" hint="Revisar, ajustar y aprobar lo que armó el agente">
      <PageShell>
        <PageHeader
          breadcrumbs={[{ label: 'Orbit', path: '/suite-ai' }, { label: 'Planes de sucesión' }, { label: 'Área comercial' }]}
          media={<Orb className="size-12" />}
          kicker="Generado por Orbit · hace 2 min"
          title="Plan de sucesión · Área comercial"
          badge={
            // Azul y no morado (info-light): en modo oscuro el morado sobre su tinte daba 4.0:1.
            <Badge variant={published ? 'success-light' : 'primary-light'} radius="full">
              {published ? 'Publicado' : 'Borrador del agente'}
            </Badge>
          }
          description="Sucesores propuestos para los cargos críticos del área, a partir de evaluaciones 360, la matriz de talento y los planes de desarrollo."
          meta={
            <>
              <span>Pedido por Carolina Ruiz</span>
              <span>{ROLES.length} cargos · 5 candidatos</span>
              <span>Versión {version}</span>
            </>
          }
          actions={
            <>
              <Button variant="outline" className={PILL} disabled={regenerating || published} onClick={regenerate}>
                {regenerating ? <Spinner className="size-4" /> : <HugeiconsIcon icon={RefreshIcon} size={16} />}
                {regenerating ? 'Generando…' : 'Regenerar'}
              </Button>
              <Button className={PILL} disabled={published} onClick={() => setConfirm(true)}>
                {published ? 'Publicado' : 'Aprobar y publicar'}
              </Button>
              {/* La acción de IA va al final de la fila y con el orbe, la única marca de la IA: es el secundario de IA del
                  sistema (BotonIaSecundario), no un botón con varita (decisiones 8 y 10 de la auditoría). */}
              <Popover open={adjustOpen} onOpenChange={setAdjustOpen}>
                <PopoverTrigger render={<BotonIaSecundario disabled={published} />}>
                  Ajustar con el agente
                </PopoverTrigger>
                <PopoverContent align="end" className="w-96 gap-3 rounded-2xl">
                  <PopoverHeader>
                    <PopoverTitle>¿Qué quieres cambiar?</PopoverTitle>
                    <PopoverDescription>El agente rehace la propuesta y guarda la versión anterior.</PopoverDescription>
                  </PopoverHeader>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ADJUSTMENTS.map((text) => (
                      <Button key={text} variant="outline" size="xs" className={PILL} onClick={() => sendAdjustment(text)}>
                        {text}
                      </Button>
                    ))}
                  </div>
                  <InputGroup className="rounded-2xl">
                    <InputGroupTextarea
                      rows={2}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendAdjustment(prompt)
                        }
                      }}
                      placeholder="Ej.: incluye a quien terminó el programa de líderes"
                      className="resize-none"
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupButton
                        variant="default"
                        size="icon-sm"
                        className={`ml-auto ${PILL}`}
                        aria-label="Enviar ajuste"
                        disabled={!prompt.trim()}
                        onClick={() => sendAdjustment(prompt)}
                      >
                        <HugeiconsIcon icon={ArrowUp02Icon} size={16} />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </PopoverContent>
              </Popover>
            </>
          }
          tabs={
            <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
              <TabsList variant="line">
                <TabsTrigger value="propuesta" className="flex-none px-3">
                  Propuesta
                </TabsTrigger>
                <TabsTrigger value="fuentes" className="flex-none gap-2 px-3">
                  Fuentes
                  <Badge variant="secondary" size="xs">
                    {SOURCES.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="historial" className="flex-none px-3">
                  Historial de versiones
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />

        <PageContent>
          {tab === 'propuesta' ? (
            <>
              {published ? null : (
                <Alert>
                  <HugeiconsIcon icon={Alert02Icon} />
                  <AlertTitle>Revisa antes de aprobar</AlertTitle>
                  <AlertDescription>
                    El agente no tiene acceso a las evaluaciones 360 de 2024: la preparación de cada candidato se calculó solo con datos de 2025.
                  </AlertDescription>
                  <AlertAction>
                    <Button variant="outline" size="sm" className={PILL} onClick={() => notify('Solicitud de acceso enviada a Gestión humana')}>
                      Pedir acceso
                    </Button>
                  </AlertAction>
                </Alert>
              )}
              <PageSection title="Sucesores propuestos" description="Acepta a quien estés de acuerdo o pide al agente otra opción.">
                <div aria-busy={regenerating} className={`flex flex-col gap-4 transition-opacity ${regenerating ? 'opacity-50' : ''}`}>
                  {ROLES.map((role) => (
                    <RoleCard key={`${role.title}-${version}`} role={role} />
                  ))}
                </div>
              </PageSection>
            </>
          ) : null}
          {tab === 'fuentes' ? <SourcesTab /> : null}
          {tab === 'historial' ? <HistoryTab /> : null}
        </PageContent>

      </PageShell>

      {/* Confirmar algo corto va en la ventana única del sistema, en su tamaño chico (decisión 4 de la auditoría). Los
          botones del pie siguen en pastilla, como el resto de esta pantalla de Orbit. */}
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        title="¿Aprobar y publicar el plan?"
        sub="Esto tiene efecto real en el área comercial:"
        footer={
          <>
            <Button variant="outline" className={PILL} onClick={() => setConfirm(false)}>
              Seguir revisando
            </Button>
            <Button
              className={PILL}
              onClick={() => {
                setConfirm(false)
                setPublished(true)
                notify('Plan de sucesión publicado')
              }}
            >
              Aprobar y publicar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {IMPACT.map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <HugeiconsIcon icon={item.icon} size={18} className="mt-px shrink-0 text-muted-foreground" />
              <Text as="span" size="sm">
                {item.text}
              </Text>
            </div>
          ))}
        </div>
      </ActionDialog>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationAiResultPage'
