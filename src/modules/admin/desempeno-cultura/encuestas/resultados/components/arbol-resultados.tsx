import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { Badge, cn, Collapsible, CollapsibleContent, Frame, FramePanel, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

// El árbol de la encuesta tal como lo escribió quien la armó, para leer resultados: cada sección de
// nivel 1 es un bloque que se abre (la primera arranca abierta) y dentro van sus preguntas y sus
// subsecciones, que también se pliegan. Lo usan «Secciones» de Favorabilidad, «Secciones» y
// «Comentarios» de Preguntas y la ficha de cada persona: cada vista pone sus propias filas.
// Lo que va dentro de una sección se corre a la derecha con una línea que baja desde su flecha, y la
// cabecera de cada subsección lleva fondo gris: así se lee qué cuelga de qué.

/** Lo mínimo que necesita el árbol de cada sección: sirve para favorabilidad, eNPS y profundidad. */
export type NodoSeccion = { id: string; title: string; numbering: string; questions: readonly unknown[]; children: readonly NodoSeccion[] }

export const conContenido = (seccion: NodoSeccion): boolean => seccion.questions.length > 0 || seccion.children.some(conContenido)
export const contarPreguntas = (seccion: NodoSeccion): number => seccion.questions.length + seccion.children.reduce((suma, hija) => suma + contarPreguntas(hija), 0)

type Pinta<T extends NodoSeccion> = {
  /** Las preguntas propias de una sección (tabla, lista…). */
  preguntas: (seccion: T) => ReactNode
  /** La cifra de la derecha de cada sección. La cabecera es `group/cabecera`: lo secundario puede salir solo al pasar el cursor. */
  metrica?: (seccion: T) => ReactNode
  /** Lo que va junto al título; por defecto, cuántas preguntas y subsecciones tiene. */
  subtitulo?: (seccion: T) => ReactNode
  /** Una sección se muestra si tiene algo para esta vista. */
  incluir?: (seccion: T) => boolean
}

const subtituloBase = (seccion: NodoSeccion, hijas: number) => `${contarPreguntas(seccion)} preguntas${hijas > 0 ? ` · ${hijas} subsecciones` : ''}`

function Cabecera({ seccion, abierta, onAlternar, raiz, subtitulo, metrica }: { seccion: NodoSeccion; abierta: boolean; onAlternar: () => void; raiz: boolean; subtitulo: ReactNode; metrica: ReactNode }) {
  return (
    <div className={cn('group/cabecera flex items-center gap-2', raiz ? 'gap-3' : 'rounded-md bg-muted/60 px-2 py-1.5')}>
      <BotonIcono size={raiz ? 'icon' : 'icon-xs'} aria-expanded={abierta} aria-label={abierta ? `Contraer ${seccion.title}` : `Expandir ${seccion.title}`} onClick={onAlternar}>
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
      </BotonIcono>
      <Badge variant={raiz ? 'secondary' : 'outline'} size={raiz ? 'default' : 'sm'} className="tabular-nums">
        {seccion.numbering}
      </Badge>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
        <Text as="span" size={raiz ? 'base' : 'sm'} weight={raiz ? 'bold' : 'semibold'}>
          {seccion.title}
        </Text>
        <Text as="span" size="xs" variant="muted">
          {subtitulo}
        </Text>
      </div>
      {metrica}
    </div>
  )
}

function Cuerpo<T extends NodoSeccion>({ seccion, pinta }: { seccion: T; pinta: Pinta<T> }) {
  const incluir = pinta.incluir ?? conContenido
  const hijas = (seccion.children as readonly T[]).filter(incluir)
  return (
    <>
      {seccion.questions.length > 0 ? pinta.preguntas(seccion) : null}
      {hijas.map((hija, indice) => (
        <Subseccion key={hija.id} seccion={hija} pinta={pinta} abiertaAlInicio={indice === 0} />
      ))}
    </>
  )
}

function Subseccion<T extends NodoSeccion>({ seccion, pinta, abiertaAlInicio }: { seccion: T; pinta: Pinta<T>; abiertaAlInicio: boolean }) {
  const [abierta, setAbierta] = useState(abiertaAlInicio)
  const hijas = (seccion.children as readonly T[]).filter(pinta.incluir ?? conContenido)
  return (
    <Collapsible open={abierta} onOpenChange={setAbierta}>
      <Cabecera
        seccion={seccion}
        abierta={abierta}
        onAlternar={() => setAbierta(!abierta)}
        raiz={false}
        subtitulo={pinta.subtitulo ? pinta.subtitulo(seccion) : subtituloBase(seccion, hijas.length)}
        metrica={pinta.metrica?.(seccion)}
      />
      <CollapsibleContent>
        <div className="ms-5 flex flex-col gap-2 border-s pt-2 pb-2 ps-4">
          <Cuerpo seccion={seccion} pinta={pinta} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Una sección plegable suelta con la misma cabecera que las del árbol (número, título, subtítulo y cifra a la derecha) y su
 *  contenido corrido con la línea guía. La usan los bloques de Análisis con IA, que no salen del árbol de la encuesta. */
export function BloquePlegable({ id, numero, titulo, subtitulo, metrica, abiertoAlInicio = true, children }: { id: string; numero: string; titulo: string; subtitulo?: ReactNode; metrica?: ReactNode; abiertoAlInicio?: boolean; children: ReactNode }) {
  const [abierto, setAbierto] = useState(abiertoAlInicio)
  return (
    <Collapsible open={abierto} onOpenChange={setAbierto}>
      <FramePanel>
        <Cabecera seccion={{ id, title: titulo, numbering: numero, questions: [], children: [] }} abierta={abierto} onAlternar={() => setAbierto(!abierto)} raiz subtitulo={subtitulo} metrica={metrica} />
        <CollapsibleContent>
          <div className="ms-4 mt-4 flex flex-col gap-3 border-s ps-4">{children}</div>
        </CollapsibleContent>
      </FramePanel>
    </Collapsible>
  )
}

/** El hueco donde van las secciones dentro de un `Frame`: directo sobre el gris, con el mismo margen lateral que la cabecera.
 *  Así hay dos contenedores (el marco y cada sección), no tres. */
export function SobreGris({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1', className)}>{children}</div>
}

/** `sobreGris` (lo normal): cada sección es una tarjeta blanca que toma sus medidas del `Frame` que la contiene. Fuera de un
 *  `Frame` (p. ej. dentro de la tarjeta de una persona) cada sección lleva el suyo. */
export function ArbolResultados<T extends NodoSeccion>({ secciones, sobreGris = true, ...pinta }: Pinta<T> & { secciones: readonly T[]; sobreGris?: boolean }) {
  const incluir = pinta.incluir ?? conContenido
  const raices = secciones.filter(incluir)
  const [abierta, setAbierta] = useState<string | undefined>(() => raices[0]?.id)
  return (
    <div className="flex flex-col gap-3">
      {raices.map((seccion) => {
        const esta = abierta === seccion.id
        const alternar = () => setAbierta(esta ? undefined : seccion.id)
        const tarjeta = (
          <Collapsible open={esta} onOpenChange={alternar}>
            <FramePanel>
              <Cabecera
                seccion={seccion}
                abierta={esta}
                onAlternar={alternar}
                raiz
                subtitulo={pinta.subtitulo ? pinta.subtitulo(seccion) : subtituloBase(seccion, (seccion.children as readonly T[]).filter(incluir).length)}
                metrica={pinta.metrica?.(seccion)}
              />
              <CollapsibleContent>
                <div className="ms-4 mt-4 flex flex-col gap-2 border-s ps-4">
                  <Cuerpo seccion={seccion} pinta={pinta} />
                </div>
              </CollapsibleContent>
            </FramePanel>
          </Collapsible>
        )
        return sobreGris ? (
          <div key={seccion.id}>{tarjeta}</div>
        ) : (
          <Frame key={seccion.id} spacing="sm">
            {tarjeta}
          </Frame>
        )
      })}
    </div>
  )
}
