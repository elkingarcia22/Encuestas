import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Frame, FrameHeader, FramePanel, FrameTitle } from '@ubits/flux-ui'
import { surveyRisks, type RiskGroup, type SurveyRisk } from '../../modelo/riesgos'
import type { SurveyListItem } from '../../modelo/types'
import { GRUPOS, esRiesgo } from './columnas'
import { DrawerRiesgos, type Solucion } from './drawer-riesgo'
import { ColumnaRiesgo, FilaRiesgo } from './fila-riesgo'

// Lo que hay que atender, arriba de las métricas. Antes eran tres tarjetas por tipo que abrían un panel, y de ahí había
// que entrar al detalle para actuar: tres pasos para algo urgente. Ahora son tres casos en fila, UNO DE CADA PRIORIDAD
// (alta, media y baja; Elkin, 13-oct), el más urgente de cada una (el que cierra antes). Si una prioridad no tiene casos,
// su lugar lo toma el siguiente más urgente. Cada uno con la acción que lo resuelve de una vez —«Recordar a 34»,
// «Finalizar encuesta», «Crear 3 planes con IA»—. La flecha abre el detalle para lo que pide decidir algo (a quién sí,
// una fecha nueva), y «Ver todos» abre el panel con todos los casos agrupados por prioridad.
// Lo resuelto sale de la lista (en esta maqueta, hasta recargar).
// Con una sola prioridad (15-oct) la fila no deja huecos: muestra los tres más urgentes de esa prioridad, cada uno con
// su insignia, y el contador nombra solo esa. Si quedan menos de tres, las columnas se reparten el ancho; con un solo
// caso va en una fila entera, con su resumen, como en el panel. Y «Ver todos» sale solo si hay más de lo que se ve.

const EN_EL_HOME = 3

// Las columnas según cuántos casos hay en la fila: sin columnas vacías.
const COLUMNAS: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' }

/** Los casos de la fila: el primero de cada prioridad y, si falta alguna, los siguientes más urgentes. */
function destacados(riesgos: readonly SurveyRisk[]): SurveyRisk[] {
  const uno = GRUPOS.map((grupo) => riesgos.find((riesgo) => riesgo.group === grupo.grupo)).filter((riesgo): riesgo is SurveyRisk => riesgo !== undefined)
  const resto = riesgos.filter((riesgo) => !uno.includes(riesgo))
  return [...uno, ...resto].slice(0, EN_EL_HOME).sort((a, b) => GRUPOS.findIndex((g) => g.grupo === a.group) - GRUPOS.findIndex((g) => g.grupo === b.group))
}

export function PanelRiesgos({ encuestas, prioridad = null, limite = null, onSolucion }: { encuestas: readonly SurveyListItem[]; /** Solo los casos de esta prioridad (escenarios del menú escondido). */ prioridad?: RiskGroup | null; /** Deja solo los N más urgentes (escenarios de uno o dos casos). */ limite?: number | null; onSolucion: (riesgo: SurveyRisk, solucion: Solucion) => void }) {
  const [resueltos, setResueltos] = useState<ReadonlySet<string>>(new Set())
  const [panel, setPanel] = useState<{ visible: boolean; id: string | null }>({ visible: false, id: null })
  const riesgos = useMemo(() => surveyRisks(encuestas, new Date()).filter((riesgo) => esRiesgo(riesgo.group) && (prioridad === null || riesgo.group === prioridad) && !resueltos.has(riesgo.id)).slice(0, limite ?? undefined), [encuestas, prioridad, limite, resueltos])

  if (riesgos.length === 0 && !panel.visible) return null

  const resolver = (riesgo: SurveyRisk, solucion: Solucion) => {
    onSolucion(riesgo, solucion)
    // Ir a otra pantalla o lanzar una acción de la encuesta (reabrir, finalizar, editar…) cierra el panel.
    if (solucion.tipo === 'resultados' || solucion.tipo === 'planes' || solucion.tipo === 'accion') setPanel((previo) => ({ ...previo, visible: false }))
    // Una acción que cambia la encuesta (reabrir, finalizar…) saca el caso sola, porque el caso sale de los datos; solo las que no cambian
    // nada (copiar el enlace, bajar el QR) se dan por atendidas aquí. Una lista a medias sigue abierta hasta resolver todo lo que traía.
    const atendido =
      solucion.tipo === 'planes' ||
      solucion.tipo === 'extension' ||
      (solucion.tipo === 'lista' && solucion.completa) ||
      (solucion.tipo === 'accion' && (solucion.accion === 'compartirEnlace' || solucion.accion === 'descargarQr'))
    if (atendido) setResueltos((previos) => new Set(previos).add(riesgo.id))
  }

  const cuantos = (grupo: string) => riesgos.filter((riesgo) => riesgo.group === grupo).length
  const enLaFila = destacados(riesgos)
  const abrirDetalle = (elegido: SurveyRisk) => setPanel({ visible: true, id: elegido.id })

  return (
    <section aria-label="Para atender">
      <Frame>
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3!">
          {/* Sin bajada (13-oct): el título y los casos ya dicen qué es; menos texto en el inicio. */}
          <FrameTitle>Para atender</FrameTitle>
          <div className="flex flex-wrap items-center gap-2">
            {GRUPOS.filter((grupo) => cuantos(grupo.grupo) > 0).map((grupo) => (
              <Badge key={grupo.grupo} variant={grupo.insignia} size="sm" className="tabular-nums">
                {cuantos(grupo.grupo)} {grupo.titulo.toLowerCase()}
              </Badge>
            ))}
            {riesgos.length > enLaFila.length ? (
              <Button variant="ghost" size="sm" onClick={() => setPanel({ visible: true, id: null })}>
                Ver todos ({riesgos.length})
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </FrameHeader>
        {/* En fila, como las métricas del home: uno de cada prioridad, uno por columna con divisores. */}
        {enLaFila.length === 1 ? (
          <FramePanel className="py-1!">
            <FilaRiesgo riesgo={enLaFila[0]} onResolver={resolver} onDetalle={abrirDetalle} />
          </FramePanel>
        ) : enLaFila.length > 1 ? (
          <FramePanel className={`divide-border grid gap-5 lg:gap-0 lg:divide-x ${COLUMNAS[enLaFila.length]}`}>
            {enLaFila.map((riesgo) => (
              <ColumnaRiesgo key={riesgo.id} riesgo={riesgo} onResolver={resolver} onDetalle={abrirDetalle} />
            ))}
          </FramePanel>
        ) : null}
      </Frame>
      <DrawerRiesgos
        riesgos={riesgos}
        abierto={panel.visible}
        idAbierto={panel.id}
        onIdAbierto={(id) => setPanel((previo) => ({ ...previo, id }))}
        onAbierto={(visible) => setPanel((previo) => ({ ...previo, visible }))}
        onResolver={resolver}
      />
    </section>
  )
}
