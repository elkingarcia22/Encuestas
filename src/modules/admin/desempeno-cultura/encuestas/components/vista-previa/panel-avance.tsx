import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowRight01Icon, CheckmarkCircle02Icon, Flag01Icon, Home01Icon } from '@hugeicons/core-free-icons'
import { Button, Progress, Text, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { CLOSING_PAGE_ID, WELCOME_PAGE_ID, type PreviewPage } from '../../modelo/previewModel'
import { BloqueResumen, TarjetaResumen } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { SURVEY_KIND_LABELS, depthLabel, type SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { type AvancePorPagina } from './contenido'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Las dos piezas del marco de la vista previa en pantalla completa: el panel de avance de la derecha
// (progreso de respuestas e índice navegable, con el diseño del panel «Así va…» de la creación) y la
// etiqueta de ubicación de la barra superior.

// ── Panel derecho de avance ────────────────────────────────────────────────────────────────────────

type Progreso = { answered: number; total: number }

// Lo que dice cada fila de su avance, a la derecha: el visto verde cuando ya está
// toda respondida y, mientras tanto, cuántas lleva («1/3»), apagado si todavía no empezó. El visto es
// solo el icono, sin texto, para no recortar el nombre de la sección.
function EstadoFila({ progreso }: { progreso: Progreso | undefined }) {
  if (!progreso || progreso.total === 0) return null
  if (progreso.answered === progreso.total) {
    return <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="shrink-0 text-success" aria-label="Completa" />
  }
  return (
    <Text as="span" size="xs" variant="muted" weight={progreso.answered > 0 ? 'semibold' : 'normal'} className="shrink-0 tabular-nums">
      {progreso.answered}/{progreso.total}
    </Text>
  )
}

const sumar = (items: readonly (Progreso | undefined)[]): Progreso =>
  items.reduce<Progreso>((acc, item) => ({ answered: acc.answered + (item?.answered ?? 0), total: acc.total + (item?.total ?? 0) }), { answered: 0, total: 0 })

function FilaIndice({
  etiqueta,
  numero,
  nivel = 1,
  activa = false,
  progreso,
  sinPagina = false,
  onIr,
}: {
  etiqueta: string
  numero?: string
  nivel?: number
  activa?: boolean
  progreso?: Progreso
  sinPagina?: boolean
  onIr?: () => void
}) {
  const cuerpo = (
    <>
      {numero ? (
        <Text
          as="span"
          size="xs"
          weight={nivel === 1 ? 'bold' : 'semibold'}
          variant={nivel === 1 ? 'default' : 'muted'}
          className="min-w-5 w-auto shrink-0 text-left tabular-nums"
        >
          {numero}
        </Text>
      ) : null}
      <TextoCompleto texto={etiqueta}><Text
        as="span"
        size="sm"
        weight={nivel === 1 ? 'semibold' : 'normal'}
        className={cn('min-w-0 flex-1 truncate text-left', nivel > 1 && 'text-muted-foreground')}
      >
        {etiqueta}
      </Text></TextoCompleto>
      <EstadoFila progreso={progreso} />
    </>
  )

  if (sinPagina || !onIr) {
    return (
      <div className={cn('flex items-center gap-2 px-2.5 py-1', nivel > 1 && 'ml-4')}>
        {cuerpo}
      </div>
    )
  }
  return (
    <Button
      variant={activa ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={activa ? 'step' : undefined}
      onClick={onIr}
      className={cn('w-full justify-start gap-2', nivel > 1 && 'ml-4 w-[calc(100%-1rem)]')}
    >
      {cuerpo}
    </Button>
  )
}

type PaginaSeccion = Extract<PreviewPage, { kind: 'section' }>
type GrupoSeccion = { clave: string; numero: string; titulo: string; paginas: PaginaSeccion[] }

// Las páginas de sección agrupadas por su sección raíz, en el orden de la encuesta. El título y el
// número de la raíz salen de la ruta de cada página: la raíz puede no tener página propia.
function agruparPorRaiz(secciones: readonly PreviewPage[]): GrupoSeccion[] {
  const grupos: GrupoSeccion[] = []
  for (const pagina of secciones) {
    if (pagina.kind !== 'section') continue
    const raiz = pagina.trail[0]
    const clave = raiz?.numbering ?? pagina.numbering
    let grupo = grupos.find((g) => g.clave === clave)
    if (!grupo) {
      grupo = { clave, numero: clave, titulo: raiz?.title ?? pagina.title, paginas: [] }
      grupos.push(grupo)
    }
    grupo.paginas.push(pagina)
  }
  return grupos
}

function FilaGrupo({ grupo, abierto, progreso, onAlternar }: { grupo: GrupoSeccion; abierto: boolean; progreso: Progreso; onAlternar: () => void }) {
  return (
    <Button variant="ghost" size="sm" aria-expanded={abierto} onClick={onAlternar} className="w-full justify-start gap-2">
      <HugeiconsIcon icon={abierto ? ArrowDown01Icon : ArrowRight01Icon} size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      <Text as="span" size="xs" weight="bold" className="shrink-0 tabular-nums">
        {grupo.numero}
      </Text>
      <TextoCompleto texto={grupo.titulo}><Text as="span" size="sm" weight="semibold" className="min-w-0 flex-1 truncate text-left">
        {grupo.titulo}
      </Text></TextoCompleto>
      <EstadoFila progreso={progreso} />
    </Button>
  )
}

export function PanelAvance({
  borrador,
  paginas,
  activa,
  avance,
  totales,
  porcentaje,
  onIr,
}: {
  borrador: SurveyDraft
  paginas: readonly PreviewPage[]
  activa: PreviewPage | undefined
  avance: AvancePorPagina
  totales: { answered: number; total: number }
  porcentaje: number
  onIr: (id: string) => void
}) {
  const ids = new Set(paginas.map((p) => p.id))

  const grupos = agruparPorRaiz(paginas)
  const demograficos = paginas.find((p) => p.kind === 'demographics')

  // Solo está abierta la sección que se está recorriendo; las otras se abren a mano. Al pasar a otra
  // sección, las que se abrieron a mano se cierran, y el panel no crece con la encuesta.
  const grupoActivo = activa?.kind === 'section' ? (activa.trail[0]?.numbering ?? activa.numbering) : null
  const [manual, setManual] = useState<{ para: string | null; abiertas: readonly string[] }>({ para: grupoActivo, abiertas: [] })
  if (manual.para !== grupoActivo) setManual({ para: grupoActivo, abiertas: [] })
  const estaAbierto = (clave: string) => clave === grupoActivo || manual.abiertas.includes(clave)
  const alternar = (clave: string) =>
    setManual((previo) => ({ ...previo, abiertas: previo.abiertas.includes(clave) ? previo.abiertas.filter((c) => c !== clave) : [...previo.abiertas, clave] }))

  // El mismo panel «Así va…» de los asistentes de creación: el nombre en la caja, el avance debajo
  // y, bajo una línea, el índice para saltar de página.
  return (
    <TarjetaResumen
      kicker="Tu avance"
      nombre={borrador.name.trim()}
      sinNombre="Encuesta sin título"
      insignias={
        borrador.kind ? (
          <Badge variant="secondary" size="xs">
            {SURVEY_KIND_LABELS[borrador.kind]}
          </Badge>
        ) : null
      }
    >
      {totales.total > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Text as="span" size="sm" weight="medium">
              {totales.answered === totales.total ? 'Todo respondido' : 'Preguntas respondidas'}
            </Text>
            <Text as="span" variant="muted" size="xs" className="tabular-nums">
              {totales.answered} de {totales.total}
            </Text>
          </div>
          <Progress value={porcentaje} aria-label={`${totales.answered} de ${totales.total} preguntas respondidas`} />
        </div>
      ) : null}

      <BloqueResumen>
        <Text as="span" size="xs" variant="muted" weight="semibold" className="uppercase tracking-wide">
          Contenido
        </Text>
        <div className="flex flex-col gap-1">
          {ids.has(WELCOME_PAGE_ID) ? (
            <FilaIndice etiqueta="Bienvenida" activa={activa?.id === WELCOME_PAGE_ID} onIr={() => onIr(WELCOME_PAGE_ID)} />
          ) : null}
          {demograficos ? (
            <FilaIndice
              etiqueta="Datos demográficos"
              activa={activa?.id === demograficos.id}
              progreso={avance[demograficos.id]}
              onIr={() => onIr(demograficos.id)}
            />
          ) : null}
          {grupos.map((grupo) => {
            const abierto = estaAbierto(grupo.clave)
            const unica = grupo.paginas.length === 1 && grupo.paginas[0].trail.length === 0
            if (unica) {
              const p = grupo.paginas[0]
              return <FilaIndice key={grupo.clave} numero={p.numbering} etiqueta={p.title} activa={activa?.id === p.id} progreso={avance[p.id]} onIr={() => onIr(p.id)} />
            }
            return (
              <div key={grupo.clave} className="flex flex-col gap-1">
                <FilaGrupo grupo={grupo} abierto={abierto} progreso={sumar(grupo.paginas.map((p) => avance[p.id]))} onAlternar={() => alternar(grupo.clave)} />
                {abierto
                  ? grupo.paginas.map((p) => (
                      <FilaIndice key={p.id} numero={p.numbering} etiqueta={p.title} nivel={Math.max(p.depth, 2)} activa={activa?.id === p.id} progreso={avance[p.id]} onIr={() => onIr(p.id)} />
                    ))
                  : null}
              </div>
            )
          })}
          {ids.has(CLOSING_PAGE_ID) ? (
            <FilaIndice etiqueta="Cierre" activa={activa?.id === CLOSING_PAGE_ID} onIr={() => onIr(CLOSING_PAGE_ID)} />
          ) : null}
        </div>
      </BloqueResumen>
    </TarjetaResumen>
  )
}

// ── Chip de ubicación en la barra superior ─────────────────────────────────────────────────────────

export function Ubicacion({ pagina }: { pagina: PreviewPage | undefined }) {
  if (!pagina) return null
  if (pagina.kind === 'welcome')
    return (
      <Badge variant="secondary">
        <HugeiconsIcon icon={Home01Icon} size={12} aria-hidden="true" />
        Bienvenida
      </Badge>
    )
  if (pagina.kind === 'closing')
    return (
      <Badge variant="secondary">
        <HugeiconsIcon icon={Flag01Icon} size={12} aria-hidden="true" />
        Cierre
      </Badge>
    )
  if (pagina.kind === 'demographics')
    return <Badge variant="secondary">Datos demográficos</Badge>
  // section
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {pagina.trail.map((miga) => (
        <span key={miga.numbering} className="hidden items-center gap-1.5 sm:flex">
          <TextoCompleto texto={`${miga.numbering}. ${miga.title}`}><Text as="span" size="xs" variant="muted" className="truncate">
            {miga.numbering}. {miga.title}
          </Text></TextoCompleto>
          <Text as="span" size="xs" variant="muted">
            /
          </Text>
        </span>
      ))}
      <TextoCompleto texto={`${depthLabel(pagina.depth)} ${pagina.numbering} · ${pagina.title}`}><Text as="span" size="xs" weight="semibold" className="truncate">
        {depthLabel(pagina.depth)} {pagina.numbering} · {pagina.title}
      </Text></TextoCompleto>
    </div>
  )
}
