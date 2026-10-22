import { useNavigate } from 'react-router'
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'
import { PageContent, PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
import { PILL } from '../drawers/components/drawer-styles'
import { AgentSketch, type AgentSketchId } from './components/agent-sketch'
import { VerEnAccion } from '../patrones/piezas'

type AgentCase = { id: AgentSketchId; to: string; title: string; description: string; tags: string[]; cta?: string }

const GROUPS: { label: string; description: string; cases: AgentCase[] }[] = [
  {
    label: 'Entender lo que tienes abierto',
    description: 'El agente lee la pantalla y responde con fuentes que se pueden ver.',
    cases: [
      { id: 'resumen', to: 'resumen-registro', title: 'Resumen de un registro', description: 'Lee la hoja de vida y la entrevista, resume fortalezas y riesgos, y cada afirmación trae su fuente: al tocarla se resalta en la ficha.', tags: ['Fuentes', 'Resaltar en pantalla'] },
      { id: 'dato', to: 'explicar-dato', title: 'Explicar un dato', description: 'Preguntas sobre un indicador o una barra del gráfico: el panel toma ese dato como contexto, explica qué lo mueve y propone qué hacer.', tags: ['Tableros', 'Cambio de contexto'] },
      { id: 'comparar', to: 'comparar', title: 'Comparar opciones', description: 'Tres finalistas lado a lado: una tabla, una recomendación y lo que el agente no sabe.', tags: ['Tabla', 'Recomendación'] },
    ],
  },
  {
    label: 'Crear y editar',
    description: 'El agente propone; la persona aplica, ajusta o deshace.',
    cases: [
      { id: 'formulario', to: 'completar-formulario', title: 'Completar un formulario', description: 'Pegas una descripción o subes un archivo: el agente llena los campos, marca cada uno como sugerido y se acepta o deshace uno por uno.', tags: ['Campos sugeridos', 'Aceptar todo'] },
      { id: 'reescribir', to: 'reescribir-seleccion', title: 'Reescribir una selección', description: 'Seleccionas un párrafo y aparece una barra flotante: mejorar, acortar o cambiar el tono, con el antes y el después.', tags: ['Barra flotante', 'Antes / después'] },
      { id: 'editor', to: '/admin/aprendizaje/lms-creator/contenidos/onboarding-operativo', title: 'Mejorar un campo del editor', description: 'El caso original del prototipo: propuesta actual contra propuesta, otra versión, aplicar y deshacer.', tags: ['Pantalla completa', 'Prototipo'], cta: 'Abrir editor' },
    ],
  },
  {
    label: 'Revisar y actuar',
    description: 'Antes de publicar o de hacer algo con impacto real.',
    cases: [
      { id: 'revision', to: 'revision', title: 'Revisar antes de publicar', description: 'El agente marca problemas en el contenido; el panel los lista por gravedad y los corrige uno por uno o todos juntos.', tags: ['Marcas en el contenido', 'Corregir todo'] },
      { id: 'accion', to: 'accion-masiva', title: 'Actuar sobre una selección', description: 'Con 12 personas elegidas, redacta el recordatorio, muestra a quién le llega y pide confirmación antes de enviar.', tags: ['Impacto real', 'Confirmación'] },
    ],
  },
  {
    label: 'Estados y límites',
    description: 'Lo que pasa cuando el agente piensa, duda, no puede o falla.',
    cases: [
      { id: 'estados', to: 'estados', title: 'Estados del panel', description: 'Razonando, pregunta para aclarar, poca confianza, sin permiso, error y sin créditos; abierto y cerrado.', tags: ['Razonando', 'Error', 'Sin permiso'] },
    ],
  },
]

const GUIDE = [
  { title: 'Usa Orbit para', text: 'trabajar sobre lo que tienes abierto: un registro, un campo, una selección o un dato. No te saca de la pantalla.' },
  { title: 'Mejor el chat de Orbit cuando', text: 'la pregunta es abierta, cruza varios módulos o todavía no sabes en qué pantalla está la respuesta.' },
  { title: 'Reglas que no cambian', text: 'El panel dice qué está mirando · nada se guarda sin que lo apliques · todo se puede deshacer · lo que tiene impacto pide confirmación.' },
]

const ANATOMY = [
  { part: 'Cabecera', text: 'Orbe, «Orbit» y cerrar. Nada más: el panel se abre y se cierra.' },
  { part: 'Contexto', text: 'Franja gris con lo que está mirando. Cambia si seleccionas otra cosa.' },
  { part: 'Pedido y respuesta', text: 'Burbuja gris de la persona; el agente responde en texto, sin burbuja.' },
  { part: 'Propuesta', text: 'Tarjeta «Actual / Propuesta» o bloque de resultado con fuentes.' },
  { part: 'Acciones', text: 'Pastillas: principal llena, secundaria con borde. Después, fila «Deshacer».' },
  { part: 'Atajos', text: '«Sobre este contenido»: dos o tres pedidos frecuentes para esa pantalla.' },
  { part: 'Caja para pedir cambios', text: 'Adjuntar, controles del caso (tono, alcance) y enviar.' },
  { part: 'Estados', text: 'Abierto a 452px · cerrado, con «Orbit» al final de los botones de la pantalla para volver a abrirlo. Entra y sale deslizándose por la derecha y la pantalla se ensancha con él: nunca aparece ni desaparece de golpe.' },
]

// Design system › Agente contextual: casos de uso del panel del agente sobre pantallas del Workspace.
export function Component() {
  const navigate = useNavigate()

  return (
    <PageShell>
      <PageHeader
        kicker="Design system · Orbit"
        title="Orbit"
        description="El agente que acompaña una pantalla del Workspace desde el borde derecho: entiende lo que tienes abierto, propone y actúa con tu permiso. Cada caso es un ejemplo navegable."
        media={<Orb className="size-14" />}
        actions={
          <>
            <VerEnAccion pagina="agente-contextual" />
            <Button className={PILL} onClick={() => navigate('/design-system/agente-contextual/resumen-registro')}>
              Ver el caso completo
            </Button>
          </>
        }
      />

      <PageContent className="gap-12">
        <div className="grid gap-3 md:grid-cols-3">
          {GUIDE.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card px-4 py-3.5">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</div>
            </div>
          ))}
        </div>

        <PageSection title="Anatomía del panel" description="Las mismas piezas en todos los casos, tomadas del prototipo «Editor + agente».">
          <Card className="py-2">
            <CardContent className="grid gap-x-8 px-5 sm:grid-cols-2">
              {ANATOMY.map((item, index) => (
                <div key={item.part} className="flex items-start gap-3 py-3">
                  <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium">{item.part}</span>
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </PageSection>

        {GROUPS.map((group) => (
          <PageSection key={group.label} title={group.label} description={group.description}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.cases.map((item) => {
                const to = item.to.startsWith('/') ? item.to : `/design-system/agente-contextual/${item.to}`
                return (
                  <Card key={item.id} className="gap-4 pt-4">
                    <CardContent className="px-4">
                      <AgentSketch id={item.id} />
                    </CardContent>
                    <CardHeader className="flex flex-col gap-1">
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </CardContent>
                    <CardFooter className="mt-auto">
                      {/* Todos dicen «Ver caso»: el nombre accesible suma cuál. */}
                      <Button variant="outline" className={PILL} aria-label={`${item.cta ?? 'Ver caso'}: ${item.title}`} onClick={() => navigate(to)}>
                        {item.cta ?? 'Ver caso'}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </PageSection>
        ))}
      </PageContent>

    </PageShell>
  )
}

Component.displayName = 'DesignSystemContextAgentPage'
