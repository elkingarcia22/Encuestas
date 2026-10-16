import { useMemo } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Flag01Icon, Home01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { CLOSING_PAGE_ID, DEMOGRAPHICS_PAGE_ID, WELCOME_PAGE_ID, groupOutline, type PreviewOutlineRow, type PreviewPage } from '../../modelo/previewModel'
import { TEXTO_POR_TONO } from '../tonos'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// El índice de la encuesta. Una sola pieza con dos trabajos: el mapa de la bienvenida (de qué está
// hecha la encuesta antes de responder nada) y la lista para saltar detrás de «Contenido» durante el
// recorrido. Misma numeración que el árbol del constructor. Las secciones que solo agrupan no tienen
// página: salen como encabezado de su bloque, sin enlace.

export type AvancePorPagina = Readonly<Record<string, { answered: number; total: number }>>

type Props = {
  paginas: readonly PreviewPage[]
  indice: readonly PreviewOutlineRow[]
  /** La página en pantalla; nula en el índice de la bienvenida. */
  activa?: string | null
  avance?: AvancePorPagina
  onIr: (idPagina: string) => void
  /** Filas más juntas y con bienvenida y cierre: el índice del encabezado. */
  compacto?: boolean
}

type FilaProps = {
  etiqueta: string
  numero?: string
  icono?: IconSvgElement
  nivel?: number
  cuenta?: number
  activa?: boolean
  completa?: boolean
  onIr?: () => void
}

function Fila({ etiqueta, numero, icono, nivel = 1, cuenta, activa = false, completa = false, onIr }: FilaProps) {
  const cuerpo = (
    <>
      {icono ? (
        <HugeiconsIcon icon={icono} size={16} aria-hidden="true" />
      ) : numero ? (
        <Text as="span" size="xs" weight={nivel === 1 ? 'bold' : 'semibold'} variant={nivel === 1 ? 'default' : 'muted'} className="tabular-nums">
          {numero}
        </Text>
      ) : null}
      <TextoCompleto texto={etiqueta}><Text as="span" size="sm" weight={nivel === 1 ? 'semibold' : 'normal'} className="min-w-0 flex-1 truncate text-left">
        {etiqueta}
      </Text></TextoCompleto>
      {completa ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className={TEXTO_POR_TONO.positive} aria-label="Completa" />
      ) : cuenta !== undefined ? (
        <Text as="span" size="xs" variant="muted" className="tabular-nums">
          {cuenta}
        </Text>
      ) : null}
    </>
  )
  if (!onIr) return <div className="flex items-center gap-2 px-2.5 py-1.5">{cuerpo}</div>
  return (
    <Button variant={activa ? 'secondary' : 'ghost'} size="sm" aria-current={activa ? 'step' : undefined} onClick={onIr} className="w-full justify-start gap-2">
      {cuerpo}
    </Button>
  )
}

export function Contenido({ paginas, indice, activa = null, avance = {}, onIr, compacto = false }: Props) {
  const grupos = useMemo(() => groupOutline(indice), [indice])
  const ids = new Set(paginas.map((pagina) => pagina.id))
  const demograficos = paginas.find((pagina) => pagina.kind === 'demographics')
  const completa = (id: string) => {
    const progreso = avance[id]
    return Boolean(progreso && progreso.total > 0 && progreso.answered === progreso.total)
  }

  return (
    <ol className={compacto ? 'flex flex-col gap-0.5' : 'flex flex-col gap-3'}>
      {compacto && ids.has(WELCOME_PAGE_ID) ? (
        <li>
          <Fila icono={Home01Icon} etiqueta="Bienvenida" activa={activa === WELCOME_PAGE_ID} onIr={() => onIr(WELCOME_PAGE_ID)} />
        </li>
      ) : null}
      {demograficos?.kind === 'demographics' ? (
        <li>
          <Fila
            icono={UserGroupIcon}
            etiqueta="Datos demográficos"
            cuenta={demograficos.fields.length}
            activa={activa === DEMOGRAPHICS_PAGE_ID}
            completa={completa(DEMOGRAPHICS_PAGE_ID)}
            onIr={() => onIr(DEMOGRAPHICS_PAGE_ID)}
          />
        </li>
      ) : null}
      {grupos.map((grupo) => (
        <li key={grupo.root.sectionId} className="flex flex-col gap-0.5">
          <Fila
            numero={grupo.root.numbering}
            etiqueta={grupo.root.label}
            cuenta={grupo.root.questionCount || undefined}
            activa={activa === grupo.root.sectionId}
            completa={grupo.root.pageId ? completa(grupo.root.sectionId) : false}
            onIr={grupo.root.pageId ? () => onIr(grupo.root.sectionId) : undefined}
          />
          {grupo.children.length > 0 ? (
            <ul className="ms-4 flex flex-col gap-0.5">
              {grupo.children.map((hija) => (
                <li key={hija.sectionId} className={hija.depth > 2 ? 'ps-3' : undefined}>
                  <Fila
                    numero={hija.numbering}
                    etiqueta={hija.label}
                    nivel={hija.depth}
                    cuenta={hija.questionCount || undefined}
                    activa={activa === hija.sectionId}
                    completa={hija.pageId ? completa(hija.sectionId) : false}
                    onIr={hija.pageId ? () => onIr(hija.sectionId) : undefined}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
      {compacto && ids.has(CLOSING_PAGE_ID) ? (
        <li>
          <Fila icono={Flag01Icon} etiqueta="Cierre" activa={activa === CLOSING_PAGE_ID} onIr={() => onIr(CLOSING_PAGE_ID)} />
        </li>
      ) : null}
    </ol>
  )
}
