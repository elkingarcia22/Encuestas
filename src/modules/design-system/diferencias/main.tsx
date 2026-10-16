import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Download01Icon, LinkSquare02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Reglas, SectionIntro, type Regla } from '../patrones/piezas'
import { REGLAS_GLOBALES } from '../ajustes/main'
import { Indicadores } from '../metricas/cifras'
import datos from '../../../../ai-tools/flux-ui/diferencias.json'
import { aMarkdown } from './markdown'
import { ESTADOS, PRIORIDADES, TIPOS, porPieza, type Diferencia, type Diferencias, type Estado, type Tipo } from './tipos'

// Design system › Diferencias con la librería: todo lo que el playground hace distinto de @ubits/flux-ui, en un solo
// formato y revalidado contra la versión instalada, para mandárselo al dev que mantiene el Storybook. La lista sale de
// ai-tools/flux-ui/diferencias.json; «Descargar» arma el mismo documento que ai-tools/flux-ui/exportar-diferencias.mjs.
// La vista para diseño (librería contra UBITS, lado a lado) es la ficha de cada pieza; cada entrada enlaza a la suya.

const DATOS = datos as Diferencias

const BADGE_ESTADO: Record<Estado, 'info-light' | 'success-light' | 'warning-light'> = {
  pedido: 'info-light',
  propuesta: 'success-light',
  decidir: 'warning-light',
}

const REGLAS: Regla[] = [
  { titulo: 'Una sola lista', detalle: 'Lo que difiere de la librería se escribe aquí (ai-tools/flux-ui/diferencias.json), no en notas sueltas: Ajustes propios, las trampas del catálogo y las reglas vigentes apuntan a esta lista.' },
  { titulo: 'Revalidado contra la versión instalada', detalle: 'Cada entrada dice cómo se comprobó y cuándo. Al subir de versión la librería, se vuelve a comprobar y se quita lo que ya resolvieron.' },
  { titulo: 'Con lo que el dev necesita', detalle: 'Qué hace hoy (la prop o la clase exacta), qué esperamos, el cambio concreto que se pide y cómo reproducirlo en el Storybook.' },
  { titulo: 'Lo nuestro, aparte', detalle: 'Las variantes UBITS son decisiones de marca: se proponen, no se exigen. El equipo de librería decide si las adopta.' },
]

const TODOS = 'todos'

// Los textos marcan el código con comillas invertidas para el documento del dev; en pantalla se leen sin ellas.
const limpio = (texto: string) => texto.replace(/`/g, '')

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <Text as="span" variant="muted" size="sm" weight="medium">
        {etiqueta}
      </Text>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Entrada({ entrada }: { entrada: Diferencia }) {
  const { reproducir, nosotros } = entrada
  const causa = entrada.causa ? DATOS.entradas.find((otra) => otra.id === entrada.causa) : null
  const sintomas = DATOS.entradas.filter((otra) => otra.causa === entrada.id).length
  return (
    <AccordionItem value={entrada.id} id={entrada.id}>
      <AccordionTrigger>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Text as="span" size="sm" weight="medium" className="min-w-0">
            {limpio(entrada.titulo)}
          </Text>
          <Badge variant="outline" size="sm">
            {TIPOS[entrada.tipo].etiqueta}
          </Badge>
          <Badge variant={BADGE_ESTADO[entrada.estado]} size="sm">
            {ESTADOS[entrada.estado].etiqueta}
          </Badge>
          {entrada.prioridad === 'alta' ? (
            <Badge variant="destructive-outline" size="sm">
              Prioridad alta
            </Badge>
          ) : null}
          {sintomas ? (
            <Badge variant="secondary" size="sm">
              Causa de {sintomas} más
            </Badge>
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-3 pb-2">
          <Dato etiqueta="Hoy">
            <Text size="sm">{limpio(entrada.hoy)}</Text>
          </Dato>
          <Dato etiqueta="Esperado">
            <Text size="sm">{limpio(entrada.esperado)}</Text>
          </Dato>
          <Dato etiqueta="Qué se pide">
            <Text size="sm">{limpio(entrada.pedido)}</Text>
          </Dato>
          {causa ? (
            <Dato etiqueta="Causa de fondo">
              <Button variant="link" size="sm" className="self-start" nativeButton={false} render={<a href={`#${causa.id}`} />}>
                {causa.titulo}
              </Button>
            </Dato>
          ) : null}
          {reproducir.storybook || reproducir.props || reproducir.reui ? (
            <Dato etiqueta="Cómo reproducirlo">
              <div className="flex flex-col gap-1.5">
                {reproducir.props ? (
                  <Text size="sm" variant="muted" className="break-words">
                    {limpio(reproducir.props)}
                  </Text>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {reproducir.storybook ? (
                    <Button variant="outline" size="sm" nativeButton={false} render={<a href={reproducir.storybook} target="_blank" rel="noreferrer" />}>
                      <HugeiconsIcon icon={LinkSquare02Icon} aria-hidden="true" data-icon="inline-start" />
                      Storybook
                    </Button>
                  ) : null}
                  {reproducir.reui ? (
                    <Button variant="outline" size="sm" nativeButton={false} render={<a href={reproducir.reui} target="_blank" rel="noreferrer" />}>
                      <HugeiconsIcon icon={LinkSquare02Icon} aria-hidden="true" data-icon="inline-start" />
                      ReUI
                    </Button>
                  ) : null}
                </div>
              </div>
            </Dato>
          ) : null}
          <Dato etiqueta="Cómo lo resolvemos">
            <div className="flex flex-col gap-1">
              <Text size="sm">
                {limpio(nosotros.como)}
                {nosotros.pantallas ? ` (${nosotros.pantallas} pantallas)` : ''}
              </Text>
              {nosotros.donde.length ? (
                <Text size="xs" variant="muted" className="break-all">
                  {nosotros.donde.join(' · ')}
                </Text>
              ) : null}
              {entrada.ajuste ? (
                <Button variant="link" size="sm" className="self-start" nativeButton={false} render={<Link to={REGLAS_GLOBALES.includes(entrada.ajuste) ? `/design-system/componentes/reglas#${entrada.ajuste}` : `/design-system/componentes/ficha/${entrada.ajuste}`} />}>
                  Verlo lado a lado en su ficha
                </Button>
              ) : null}
            </div>
          </Dato>
          <Dato etiqueta="Verificado">
            <Text size="xs" variant="muted">
              {entrada.revisado} · {limpio(entrada.verificado)}
            </Text>
          </Dato>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// Componentes › Todos los componentes › Para el dev de flux (7-oct): antes era la página «Diferencias con la librería».
export function ParaElDev() {
  const [tipo, setTipo] = useState<Tipo | typeof TODOS>(TODOS)
  const [estado, setEstado] = useState<Estado | typeof TODOS>(TODOS)
  const [busqueda, setBusqueda] = useState('')

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es')
    return DATOS.entradas.filter(
      (e) =>
        (tipo === TODOS || e.tipo === tipo) &&
        (estado === TODOS || e.estado === estado) &&
        (!texto || `${e.pieza} ${e.titulo} ${e.hoy}`.toLocaleLowerCase('es').includes(texto)),
    )
  }, [tipo, estado, busqueda])
  const grupos = porPieza(visibles)

  const cuenta = (filtro: (e: Diferencia) => boolean) => String(DATOS.entradas.filter(filtro).length)
  const documento = () => aMarkdown(DATOS)

  const descargar = () => {
    const url = URL.createObjectURL(new Blob([documento()], { type: 'text/markdown;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `diferencias-flux-ui-${DATOS.libreria}.md`
    enlace.click()
    URL.revokeObjectURL(url)
  }
  const copiar = async () => {
    await navigator.clipboard.writeText(documento())
    notify('Documento copiado', 'Pégalo en el issue, en Jira o en Slack para el equipo de librería.')
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionIntro
          title="Para el equipo de librería"
          description={`Todo lo que el playground hace distinto de @ubits/flux-ui ${DATOS.libreria} y de lo que enseña su Storybook, revisado el ${DATOS.revisado} contra la versión instalada. Cada entrada dice qué hace hoy la librería, qué esperamos, qué se pide y cómo reproducirlo; el documento para el dev sale de esta misma lista.`}
        />
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={copiar}>
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" data-icon="inline-start" />
            Copiar documento
          </Button>
          <Button onClick={descargar}>
            <HugeiconsIcon icon={Download01Icon} aria-hidden="true" data-icon="inline-start" />
            Descargar documento
          </Button>
        </div>
      </div>

      <Indicadores
        cifras={[
          { etiqueta: 'Diferencias', valor: String(DATOS.entradas.length), detalle: `En ${porPieza(DATOS.entradas).length} piezas` },
          { etiqueta: 'Pedidos a la librería', valor: cuenta((e) => e.estado === 'pedido'), detalle: 'Errores, valores por defecto, faltantes y textos' },
          { etiqueta: 'Propuestas de variante', valor: cuenta((e) => e.estado === 'propuesta'), detalle: 'Decisiones de marca UBITS' },
          { etiqueta: 'Prioridad alta', valor: cuenta((e) => e.prioridad === 'alta'), detalle: 'Muchas pantallas, accesibilidad o idioma' },
        ]}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <InputGroup className="w-full sm:w-96">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por pieza o por lo que pasa…"
              aria-label="Buscar diferencias"
            />
          </InputGroup>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[tipo]}
              onValueChange={(valor) => valor[0] && setTipo(valor[0] as Tipo | typeof TODOS)}
              aria-label="Filtrar por tipo"
              className="flex-wrap"
            >
              <ToggleGroupItem value={TODOS}>Todos los tipos</ToggleGroupItem>
              {(Object.keys(TIPOS) as Tipo[]).map((clave) => (
                <ToggleGroupItem key={clave} value={clave}>
                  {TIPOS[clave].etiqueta}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[estado]}
              onValueChange={(valor) => valor[0] && setEstado(valor[0] as Estado | typeof TODOS)}
              aria-label="Filtrar por estado"
              className="flex-wrap"
            >
              <ToggleGroupItem value={TODOS}>Todos los estados</ToggleGroupItem>
              {(Object.keys(ESTADOS) as Estado[]).map((clave) => (
                <ToggleGroupItem key={clave} value={clave}>
                  {ESTADOS[clave].etiqueta}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Text size="sm" variant="muted">
            {visibles.length} de {DATOS.entradas.length} diferencias · de más a menos prioridad
          </Text>
        </div>

        {grupos.length ? (
          grupos.map((grupo) => {
            const storybook = grupo.entradas.find((e) => e.reproducir.storybook)?.reproducir.storybook
            return (
              <Frame key={grupo.pieza}>
                <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <FrameTitle>{grupo.pieza}</FrameTitle>
                    <FrameDescription>
                      {grupo.entradas.length === 1 ? '1 diferencia' : `${grupo.entradas.length} diferencias`}
                      {grupo.entradas.some((e) => e.prioridad === 'alta') ? ` · ${PRIORIDADES.alta.etiqueta.toLowerCase()} prioridad` : ''}
                    </FrameDescription>
                  </div>
                  {storybook ? (
                    <Button variant="outline" size="sm" nativeButton={false} render={<a href={storybook} target="_blank" rel="noreferrer" />}>
                      <HugeiconsIcon icon={LinkSquare02Icon} aria-hidden="true" data-icon="inline-start" />
                      Ficha en el Storybook
                    </Button>
                  ) : null}
                </FrameHeader>
                <FramePanel>
                  <Accordion multiple>
                    {grupo.entradas.map((entrada) => (
                      <Entrada key={entrada.id} entrada={entrada} />
                    ))}
                  </Accordion>
                </FramePanel>
              </Frame>
            )
          })
        ) : DATOS.entradas.length ? (
          // Vacíos con las piezas del sistema y su ilustración (decisión 14 de la auditoría, 5-oct): si la búsqueda o los
          // filtros dejaron todo fuera, SinResultados; si la lista está vacía de verdad, PrimeraVez.
          <SinResultados
            busqueda={busqueda}
            filtrosActivos={(tipo === TODOS ? 0 : 1) + (estado === TODOS ? 0 : 1)}
            onLimpiar={() => {
              setBusqueda('')
              setTipo(TODOS)
              setEstado(TODOS)
            }}
          />
        ) : (
          <PrimeraVez
            icono="glass-document"
            titulo="Todavía no hay diferencias cargadas"
            descripcion="La lista se llena desde ai-tools/flux-ui/diferencias.json."
          />
        )}
      </section>

      <Reglas titulo="Cómo se mantiene" reglas={REGLAS} />
    </div>
  )
}
