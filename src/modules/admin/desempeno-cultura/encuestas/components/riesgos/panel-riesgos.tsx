import { useMemo, useState } from 'react'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '@ubits/flux-ui'
import { surveyRisks, type RiskGroup, type SurveyRisk } from '../../modelo/riesgos'
import type { SurveyListItem } from '../../modelo/types'
import { GRUPOS, esRiesgo } from './columnas'
import { ColumnaRiesgo, FilaRiesgo } from './fila-riesgo'
import type { Solucion } from './soluciones'

// Lo que hay que atender, arriba de las métricas. Como en la Super Home (20-oct, Elkin): cada espacio es UN caso con
// la acción que lo resuelve de una vez —«Recordar a 34», «Finalizar encuesta», «Crear 3 planes con IA»—, sin contadores,
// sin «Ver todos», sin panel lateral y sin detalle. Los tres espacios se llenan con uno de cada prioridad (alta, media y
// baja), el más urgente de cada una; si una prioridad no tiene casos, su lugar lo toma el siguiente más urgente, así que
// pueden salir dos altas o dos medias. Lo resuelto sale y entra el siguiente (en esta maqueta, hasta recargar). Con
// menos de tres casos las columnas se reparten el ancho, y con uno va en una fila entera.

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
  const riesgos = useMemo(() => surveyRisks(encuestas, new Date()).filter((riesgo) => esRiesgo(riesgo.group) && (prioridad === null || riesgo.group === prioridad) && !resueltos.has(riesgo.id)).slice(0, limite ?? undefined), [encuestas, prioridad, limite, resueltos])

  if (riesgos.length === 0) return null

  const resolver = (riesgo: SurveyRisk, solucion: Solucion) => {
    onSolucion(riesgo, solucion)
    // Una acción que cambia la encuesta (reabrir, finalizar…) saca el caso sola, porque el caso sale de los datos; las que no
    // cambian nada (recordar a todos, crear los planes, copiar el enlace, bajar el QR) se dan por atendidas aquí.
    const atendido = solucion.tipo === 'planes' || solucion.tipo === 'lista' || (solucion.tipo === 'accion' && (solucion.accion === 'compartirEnlace' || solucion.accion === 'descargarQr'))
    if (atendido) setResueltos((previos) => new Set(previos).add(riesgo.id))
  }

  const enLaFila = destacados(riesgos)

  return (
    <section aria-label="Para atender">
      <Frame>
        {/* Sin bajada ni contadores: el título y los casos ya dicen qué es. */}
        <FrameHeader>
          <FrameTitle>Para atender</FrameTitle>
        </FrameHeader>
        {/* En fila, como las métricas del home: un caso por columna con divisores. */}
        {enLaFila.length === 1 ? (
          <FramePanel className="py-1!">
            <FilaRiesgo riesgo={enLaFila[0]} onResolver={resolver} />
          </FramePanel>
        ) : (
          <FramePanel className={`divide-border grid gap-5 lg:gap-0 lg:divide-x ${COLUMNAS[enLaFila.length]}`}>
            {enLaFila.map((riesgo) => (
              <ColumnaRiesgo key={riesgo.id} riesgo={riesgo} onResolver={resolver} />
            ))}
          </FramePanel>
        )}
      </Frame>
    </section>
  )
}
