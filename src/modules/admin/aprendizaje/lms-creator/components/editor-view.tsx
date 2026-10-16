import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Heading,
  Input,
  Label,
  SidebarTrigger,
  Switch,
  Tabs,
  TabsContent,
  Text,
  Textarea,
  TooltipProvider,
  cn,
  useSidebar,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { useAgentPanelFocus } from './agent-focus'
import { AgentPanel, type CardAnim } from './agent-panel'
import { AgentDock, ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { PestanasDePatron } from '@/modules/design-system/patrones/piezas'
import { PROPOSALS } from './agent-replies'
import styles from './editor.module.css'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Hint } from '@/shared/components/Hint'
import { HeaderActions } from '@/shared/components/AppHeader'
import { HEADER_ICON } from '@/shared/components/header-icon'
import { notify } from '@/shared/components/notify'

const ORIGINAL_DESC = 'Curso de inducción para el área operativa. Incluye normas de seguridad y uso de equipos.'
const ALL_COMPS = ['Comunicación', 'Orientación al detalle', 'Prevención de riesgos', 'Liderazgo de turno']
const TABS = ['Información', 'Lecciones', 'Audiencia', 'Resultados']

type Lesson = { title: string; meta: string }
type AudienceRow = { title: string; people: number; on: boolean }

const LESSONS: Lesson[] = [
  { title: 'Bienvenida y reglas del turno', meta: 'Video · 6 min' },
  { title: 'Riesgos de tu línea', meta: 'Video · 9 min' },
  { title: 'Protocolo de seguridad', meta: 'Lectura · 12 min' },
  { title: 'Uso de equipos', meta: 'Video · 11 min' },
  { title: 'Reporte de incidentes', meta: 'Lectura · 8 min' },
  { title: 'Práctica final', meta: 'Tarea · evidencia' },
]

const AUDIENCE: AudienceRow[] = [
  { title: 'Operarios de planta', people: 128, on: true },
  { title: 'Turno tarde', people: 46, on: true },
  { title: 'Nuevos ingresos', people: 12, on: false },
]

const LABEL = 'text-sm font-medium'
// Botones de Workspace: radio de 8px como en el prototipo (patrón reui).
const WS_BUTTON = 'h-9! px-4! text-sm font-medium'
const DASHED = 'h-auto! border-dashed px-4! py-1.75! text-sm font-normal! text-muted-foreground hover:text-foreground'
const TABLE = 'overflow-hidden rounded-[12px] border'
const NOTE = 'bg-muted px-4.5 py-3.5 text-[13px] leading-normal text-muted-foreground'

// Al quitar una competencia o una lección su botón desaparece con el foco adentro: el foco pasa al «Quitar» que quedó en
// ese lugar (o al anterior, si era el último) y, si la lista quedó vacía, a «Agregar».
function focusAfterRemove(button: HTMLElement, index: number) {
  const group = button.closest<HTMLElement>('[data-remove-group]')
  window.requestAnimationFrame(() => {
    const buttons = group?.querySelectorAll<HTMLElement>('[data-remove]')
    const next = buttons?.[index] ?? buttons?.[index - 1] ?? group?.querySelector<HTMLElement>('[data-add]:not(:disabled)')
    next?.focus()
  })
}

// LMS Creator › Contenidos, como en el prototipo «03 Editor + agente»: pantalla completa con riel de
// iconos, cabecera propia con migas, formulario por pestañas y el agente contextual a la derecha.
// Rejilla de 1140px (16 sep): la pantalla del editor y el panel de 452px van juntos en el mismo contenedor centrado que
// usan las demás pantallas: 1140 como máximo, con 24px de aire a cada lado.
export function EditorView() {
  const navigate = useNavigate()
  const [name, setName] = useState('Onboarding operativo')
  // El nombre guardado: el título y la miga no cambian letra a letra al escribir; se actualizan al salir del campo
  // (decisión 5 de la auditoría, 5-oct: título fijo, como en el patrón de detalle).
  const [savedName, setSavedName] = useState(name)
  const [desc, setDesc] = useState(ORIGINAL_DESC)
  const [comps, setComps] = useState(['Seguridad operativa', 'Trabajo en equipo'])
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS)
  const [audience, setAudience] = useState<AudienceRow[]>(AUDIENCE)
  const [published, setPublished] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [preview, setPreview] = useState(false)
  const [agentOpen, setAgentOpen] = useState(true)
  const [applied, setApplied] = useState(false)
  const [propIdx, setPropIdx] = useState(0)
  const [cardAnim, setCardAnim] = useState<CardAnim>(null)
  const [cardTick, setCardTick] = useState(0)
  const [descTick, setDescTick] = useState(0)

  const reach = audience.filter((a) => a.on).reduce((n, a) => n + a.people, 0)
  const available = ALL_COMPS.filter((c) => !comps.includes(c))

  const animateCard = (anim: CardAnim) => {
    setCardAnim(anim)
    setCardTick((t) => t + 1)
  }

  const apply = () => {
    setDesc(PROPOSALS[propIdx])
    setApplied(true)
    setDescTick((t) => t + 1)
    notify('Descripción actualizada · nada más cambió')
  }

  // Estado de la barra lateral del marco: el editor deja libre su ancho (abierta 288px, cerrada 72px del riel).
  const { open: sidebarOpen, isMobile } = useSidebar()
  const layerRef = useRef<HTMLDivElement>(null)
  useAgentPanelFocus(layerRef, agentOpen ? 'open' : 'closed')

  // La capa tapa el header y el pie comunes, pero seguían en el orden del tabulador: el foco pasaba por botones que no
  // se ven. Mientras el editor está abierto, lo que queda debajo de la capa se vuelve inerte (ni foco ni lector).
  useEffect(() => {
    const layer = layerRef.current
    const inset = layer?.closest('[data-slot="sidebar-inset"]')
    if (!layer || !inset) return
    const covered: Element[] = []
    for (let node: Element = layer; node !== inset && node.parentElement; node = node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling === node || sibling.hasAttribute('inert')) continue
        sibling.setAttribute('inert', '')
        covered.push(sibling)
      }
    }
    return () => covered.forEach((element) => element.removeAttribute('inert'))
  }, [])

  const otherVersion = () => {
    setPropIdx((i) => (i + 1) % PROPOSALS.length)
    setApplied(false)
    animateCard('in')
  }

  const suggestion = () => {
    setAgentOpen(true)
    animateCard('nudge')
    notify('Sugerencia lista en el panel del agente')
  }

  return (
    // El editor ocupa todo menos la barra lateral del marco: a su izquierda queda la barra real (abierta, o el riel de
    // iconos si está cerrada) y se corre con su misma animación. Abrir/cerrar va en la cabecera, junto a las migas.
    // En el celular no hay barra ni riel (el menú sale encima): la capa va de borde a borde.
    <div
      ref={layerRef}
      className="@container/editor fixed inset-y-0 right-0 z-40 bg-background text-foreground transition-[left] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{ left: isMobile ? 0 : sidebarOpen ? 'var(--sidebar-width)' : '4.5rem' }}
    >
      {/* Línea bajo la cabecera a todo el ancho de la capa; el panel la corta porque va de arriba abajo. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-15 border-b" />
      {/* El panel del agente va pegado al borde derecho; el que se mueve es el editor, para que los dos sumen 1140.
          Sin el panel, el editor queda centrado con su contenedor de 1140 + 24px de aire a cada lado. */}
      <div className="relative flex h-full w-full flex-col">
        <TooltipProvider delay={200}>
          {/* Cabecera a todo el ancho, como el header del workspace (18 sep): las migas pegadas a la izquierda y el
              perfil pegado a la derecha, sin quedar atados al contenedor de 1140 del contenido. */}
          <div className="flex h-15 shrink-0 items-center gap-2 px-5 text-sm">
              <Hint label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}>
                <SidebarTrigger
                  variant="outline"
                  size="icon-sm"
                  aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
                  className={cn('mr-1.5 size-7.5!', HEADER_ICON)}
                />
              </Hint>
              <nav aria-label="Migas de pan" className="flex min-w-0 items-center gap-2">
                <Button variant="link" className="h-auto! p-0! font-normal text-muted-foreground! no-underline! hover:text-foreground!" onClick={() => navigate('/admin/aprendizaje')}>
                  Aprendizaje
                </Button>
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} aria-hidden="true" className="shrink-0 text-muted-foreground/50" />
                <Button variant="link" className="h-auto! p-0! font-normal text-muted-foreground! no-underline! hover:text-foreground!" onClick={() => navigate('/admin/aprendizaje/lms-creator/contenidos')}>
                  Contenidos
                </Button>
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} aria-hidden="true" className="shrink-0 text-muted-foreground/50" />
                <span aria-current="page" className="min-w-0 truncate font-medium">
                  {savedName}
                </span>
              </nav>
              <span className="ml-auto" />
              {/* Las mismas acciones de la barra superior del workspace (novedades, ayuda, notificaciones, procesos y
                  perfil): esta pantalla es el caso real del agente contextual y no le puede faltar nada (18 sep). */}
              <HeaderActions />
            </div>

            {/* El panel del agente va pegado al borde derecho y la pantalla toma TODO lo que queda a su izquierda; su
                contenido se centra ahí, con el mismo aire a los dos lados (18 sep, Nicolás: «están muy a la derecha y
                debería estar en el medio… y el agente contextual a la derecha pegado siempre»). Antes la pantalla se
                pegaba al panel y dejaba todo el hueco a la izquierda. */}
            <div className="flex min-h-0 flex-1">
              {/* `relative isolate`: el ambiente azul del marco queda debajo del contenido. Esta capa tapa el marco
                  general (y su ambiente), así que lo pinta ella, igual que el resto del Workspace (22 sep). */}
              <div className="relative isolate flex min-w-0 flex-1 flex-col">

            {/* Responde al ancho de esta columna (cambia al abrir/cerrar la barra lateral y el agente), no al de la pantalla:
                angosta, título arriba a lo ancho y botones debajo; con espacio, título a la izquierda y botones a la derecha.
                El scroll empieza 6px antes del borde de la rejilla para que el anillo de foco de los campos no se corte. */}
            <div className="@container -ml-1.5 min-h-0 flex-1 overflow-auto pt-9 pb-10 pl-1.5">
             <div className="mx-auto w-full max-w-[74.25rem] px-6">
              <div className="flex flex-col gap-4 @min-[42rem]:flex-row @min-[42rem]:items-start @min-[42rem]:gap-5">
                <div className="min-w-0 flex-1">
                  {/* Título fijo con la tipografía del tema, como el de PageHeader (Heading de nivel 2): el nombre guardado. */}
                  <Heading as="h1" level={2} className="text-balance">
                    {savedName}
                  </Heading>
                  <Text as="div" variant="muted" className="mt-1">
                    Contenido propio · {lessons.length} lecciones · última edición hace 3 min
                  </Text>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 @min-[42rem]:pt-1.5">
                  <Button variant="outline" className={WS_BUTTON} onClick={() => setPreview(true)}>
                    Previsualizar
                  </Button>
                  <Button
                    variant={published ? 'outline' : 'default'}
                    className={cn(WS_BUTTON, 'px-4.5!')}
                    onClick={() => (published ? notify('Ya está publicado') : setConfirm(true))}
                  >
                    {published ? 'Publicado' : 'Publicar'}
                  </Button>
                  {/* Orbit Flow va siempre a la derecha de la fila, después del primario (18 sep). Con Previsualizar y Publicar son tres
                      llamados a la acción: va solo con el orbe (regla del 5-oct, más de dos llamados). */}
                  {/* El botón del design system, no una copia: aquí había uno propio que además bajaba el peso del
                      texto a 400 cuando el botón trae 500 (18 sep). Solo se le pasa la animación de entrada. */}
                  {!agentOpen ? <ReopenAgentButton compact className={cn('shadow-xs', styles.msgIn)} onClick={() => setAgentOpen(true)} /> : null}
                </div>
              </div>

              <Tabs defaultValue={TABS[0]} className="mt-7.5 gap-0!">
                {/* La pestaña maestra del sistema, subrayada y sin estilos forzados, bajo el título como en PageHeader
                    (decisión 13 de la auditoría, 5-oct). */}
                <PestanasDePatron items={TABS.map((tab) => ({ valor: tab, etiqueta: tab }))} />

                {/* Paneles con controles, fuera del tabulador (se llega directo a sus campos y botones): enfocables contaban
                    como vecinos de los controles chicos de adentro (interruptores, «Quitar») en la regla de tamaño de
                    objetivo. «Resultados» no tiene controles y sigue enfocable para poder llegar a leerlo. */}
                <TabsContent value="Información" tabIndex={-1} className="mt-7.5 max-w-160">
                  <Label htmlFor="c-name" className={cn(LABEL, 'leading-5!')}>Nombre del contenido</Label>
                  <Input
                    id="c-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => name.trim() && setSavedName(name.trim())}
                    className="mt-2.5 h-auto! rounded-[0.625rem]! px-3.5! py-3! text-[15px]! md:text-[15px]!"
                  />

                  <div className="mt-6 flex items-center gap-3">
                    <Label htmlFor="c-desc" className={cn(LABEL, 'leading-5!')}>Descripción</Label>
                    <Button
                      variant="outline"
                      className="h-auto! gap-2! px-2.75! py-1! text-[13px]! font-normal! shadow-xs"
                      onClick={suggestion}
                    >
                      {/* La marca de IA es el orbe, no una estrella dibujada (decisión 8 de la auditoría, 5-oct). */}
                      <IconoIA />
                      Sugerencia lista
                    </Button>
                  </div>
                  <div key={descTick} className={cn('mt-2.5', descTick > 0 && styles.blurPulse)}>
                    <Textarea
                      id="c-desc"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="h-32.5! resize-none rounded-[0.625rem]! p-3.5! text-[15px]! leading-normal text-foreground/80 md:text-[15px]!"
                    />
                  </div>

                  <div id="c-comps" className={cn(LABEL, 'mt-7')}>Competencias asociadas</div>
                  <div role="group" aria-labelledby="c-comps" data-remove-group="" className="mt-3 flex flex-wrap items-center gap-2">
                    {comps.map((c, i) => (
                      <Badge
                        key={c}
                        variant="secondary"
                        radius="full"
                        className="h-auto! gap-2! border-0! bg-muted! py-1.75! pr-3! pl-3.5! font-normal! text-foreground!"
                      >
                        <span className="text-sm">{c}</span>
                        <BotonIcono
                          size="icon-xs"
                          data-remove=""
                          aria-label={`Quitar ${c}`}
                          // 24px de área de toque (mínimo AA) con el mismo tamaño visible: el margen negativo no mueve nada.
                          className="-m-1 size-6! text-muted-foreground hover:bg-transparent! hover:opacity-50"
                          onClick={(event) => {
                            focusAfterRemove(event.currentTarget, i)
                            setComps((x) => x.filter((y) => y !== c))
                          }}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-3.25!" />
                        </BotonIcono>
                      </Badge>
                    ))}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button data-add="" variant="outline" className={DASHED} disabled={!available.length} />}>
                        Agregar
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-70">
                        {available.map((c) => (
                          <DropdownMenuItem key={c} onClick={() => setComps((x) => [...x, c])}>{c}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TabsContent>

                <TabsContent value="Lecciones" tabIndex={-1} className="mt-7.5 max-w-190">
                  <div data-remove-group="" className={cn(TABLE, styles.msgIn)}>
                    <div role="list" aria-label="Lecciones">
                      {lessons.map((lesson, i) => (
                        <div role="listitem" key={lesson.title + i} className="flex items-center gap-3.5 border-b border-border/60 px-4.5 py-3.5 hover:bg-muted/50">
                          <span aria-hidden="true" className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-muted tabular-nums text-[11px] text-foreground/80">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[15px]">{lesson.title}</span>
                          <span className="text-[13px] text-muted-foreground">{lesson.meta}</span>
                          <BotonIcono
                            size="icon-xs"
                            data-remove=""
                            aria-label={`Quitar ${lesson.title}`}
                            // Gris del tema sin transparencia: al 50% la X quedaba por debajo de 3:1 contra el fondo. 24px de área
                            // de toque con el mismo lugar en la fila (el margen negativo compensa los 4px extra).
                            className="-m-0.5 size-6! text-muted-foreground hover:bg-transparent! hover:text-foreground"
                            onClick={(event) => {
                              focusAfterRemove(event.currentTarget, i)
                              setLessons((l) => l.filter((_, j) => j !== i))
                              notify('Lección quitada')
                            }}
                          >
                            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-3.5!" />
                          </BotonIcono>
                        </div>
                      ))}
                    </div>
                    <div className="px-4.5 py-3.5">
                      <Button
                        data-add=""
                        variant="outline"
                        className={DASHED}
                        onClick={() => {
                          setLessons((l) => [...l, { title: 'Lección nueva', meta: 'Sin contenido' }])
                          notify('Lección agregada al final')
                        }}
                      >
                        Agregar lección
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="Audiencia" tabIndex={-1} className="mt-7.5 max-w-175">
                  <div className={cn(TABLE, styles.msgIn)}>
                    {audience.map((row, i) => (
                      <div key={row.title} className="flex items-center gap-4 border-b border-border/60 px-4.5 py-4">
                        <div className="flex-1">
                          <div className="text-[15px]">{row.title}</div>
                          <div className="mt-1 text-[13px] text-muted-foreground">{row.people} personas</div>
                        </div>
                        {/* Interruptor en tinta como en el prototipo: se reapunta el primario al color del texto. */}
                        <Switch
                          className="[--primary:var(--foreground)]"
                          checked={row.on}
                          onCheckedChange={(checked) => setAudience((a) => a.map((r, j) => (j === i ? { ...r, on: checked } : r)))}
                          aria-label={`Incluir ${row.title}`}
                        />
                      </div>
                    ))}
                    <div className={NOTE}>{reach} personas recibirían este contenido al publicar.</div>
                  </div>
                </TabsContent>

                <TabsContent value="Resultados" className="mt-7.5 max-w-190">
                  <div className={cn(TABLE, styles.msgIn)}>
                    <div className="flex divide-x">
                      {[
                        [published ? '128' : '0', 'Inscritos'],
                        [published ? '12%' : '—', 'Terminación'],
                        [published ? '4,6' : '—', 'Satisfacción'],
                      ].map(([value, label]) => (
                        <div key={label} className="flex-1 px-5 py-4.5">
                          <div className="text-[34px] leading-none font-light tracking-[-0.68px]">{value}</div>
                          <div className="mt-1.5 text-[13px] text-muted-foreground">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className={cn(NOTE, 'border-t px-5')}>
                      {published ? 'Datos de las últimas 24 horas · se actualiza cada hora.' : 'Sin datos hasta publicar el contenido.'}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
             </div>
            </div>
              </div>

              {/* Montado siempre: `AgentDock` lo deja entrar y salir deslizándose en vez de aparecer y desaparecer de golpe. */}
              <AgentDock open={agentOpen}>
          <AgentPanel
            // Columna derecha de la rejilla, de arriba abajo, con borde a los dos lados (a su derecha puede quedar aire).
            // Si no caben editor y panel lado a lado (tablet, celular, zoom), el panel va encima del editor a todo lo ancho.
            className="relative border-r @max-[52rem]/editor:absolute @max-[52rem]/editor:inset-y-0 @max-[52rem]/editor:right-0 @max-[52rem]/editor:z-10 @max-[52rem]/editor:w-full @max-[52rem]/editor:border-l-0"
            contentName={name}
            description={desc}
            applied={applied}
            propIdx={propIdx}
            cardAnim={cardAnim}
            cardTick={cardTick}
            onApply={apply}
            onUndo={() => {
              setDesc(ORIGINAL_DESC)
              setApplied(false)
              notify('Cambio deshecho')
            }}
            onOtherVersion={otherVersion}
            onClose={() => {
              setAgentOpen(false)
              notify('Agente cerrado · se puede reabrir')
            }}
          />
              </AgentDock>
            </div>
        </TooltipProvider>
      </div>

      {/* Títulos fijos: de qué contenido se habla va en el cuerpo, no en la cabecera (Carlos, 1-oct). */}
      <ActionDialog
        open={preview}
        onOpenChange={setPreview}
        title="Vista previa del contenido"
        sub="Así lo ve un operario."
        lead={
          <>
            <Heading as="h3" level={6}>
              {name}
            </Heading>
            <Text size="sm" variant="muted">
              {lessons.length} {lessons.length === 1 ? 'lección' : 'lecciones'}
            </Text>
          </>
        }
        text={desc}
        items={lessons.map((l, i) => ({ ini: String(i + 1), title: l.title, meta: l.meta }))}
        cancelLabel="Cerrar"
      />
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Publicar contenido"
        sub="Queda visible para las audiencias activas y se puede asignar. No se envían correos todavía."
        lead={
          <>
            <Heading as="h3" level={6}>
              {name}
            </Heading>
            <Text size="sm" variant="muted">
              {lessons.length} {lessons.length === 1 ? 'lección' : 'lecciones'} · {comps.length} {comps.length === 1 ? 'competencia' : 'competencias'}
            </Text>
          </>
        }
        confirmLabel="Publicar"
        onConfirm={() => {
          setPublished(true)
          notify('Contenido publicado · visible para 128 personas')
        }}
      />
    </div>
  )
}
