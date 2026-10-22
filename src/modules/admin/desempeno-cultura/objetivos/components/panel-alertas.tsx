import { useMemo, useState } from 'react'
import { Notification01Icon } from '@hugeicons/core-free-icons'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '@ubits/flux-ui'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { alertasDe, type AlertaCiclo } from '../modelo/alertas'
import type { Ciclo } from '../modelo/ciclos'
import { GRUPOS } from './alertas/columnas'
import { ColumnaAlerta, FilaAlerta } from './alertas/fila-alerta'

// «Para atender», con el mismo armado que el de Encuestas y la Super Home (20-oct, Elkin): cada espacio es UNA alerta
// con la acción que la resuelve de una vez —«Recordar a 12», «Terminar borrador»—, sin contadores, sin «Ver todos», sin
// panel lateral y sin detalle. Los tres espacios se llenan con una de cada prioridad (alta, media y baja), la más urgente
// de cada una (la que cierra antes); si una prioridad no tiene alertas, su lugar lo toma la siguiente más urgente, así que
// pueden salir dos altas o dos medias. Lo resuelto sale y entra la siguiente (en esta maqueta, hasta recargar). Con menos
// de tres las columnas se reparten el ancho, y con una va en una fila entera.

const EN_EL_HOME = 3
const COLUMNAS: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' }

/** Los casos de la fila: el primero de cada prioridad y, si falta alguna, los siguientes más urgentes. */
function destacados(alertas: readonly AlertaCiclo[]): AlertaCiclo[] {
  const uno = GRUPOS.map((grupo) => alertas.find((alerta) => alerta.prioridad === grupo.grupo)).filter((alerta): alerta is AlertaCiclo => alerta !== undefined)
  const resto = alertas.filter((alerta) => !uno.includes(alerta))
  return [...uno, ...resto].slice(0, EN_EL_HOME).sort((a, b) => GRUPOS.findIndex((g) => g.grupo === a.prioridad) - GRUPOS.findIndex((g) => g.grupo === b.prioridad))
}

export function PanelAlertas({
  ciclos,
  onAccion,
}: {
  ciclos: readonly Ciclo[]
  /** La acción de un caso: recordar, terminar el borrador o ver los resultados. */
  onAccion: (alerta: AlertaCiclo) => void
}) {
  const [resueltas, setResueltas] = useState<ReadonlySet<string>>(new Set())
  // Recordar le llega a otras personas: antes se pregunta (regla «preguntar-antes»); terminar un borrador o ver
  // resultados no envía nada y va directo.
  const [porRecordar, setPorRecordar] = useState<AlertaCiclo | null>(null)
  const alertas = useMemo(() => alertasDe(ciclos).filter((alerta) => !resueltas.has(alerta.id)), [ciclos, resueltas])

  if (alertas.length === 0) return null

  const resolver = (alerta: AlertaCiclo) => {
    if (alerta.accion === 'recordar') return setPorRecordar(alerta)
    onAccion(alerta)
  }
  // Recordar da el caso por atendido; terminar un borrador o ver resultados se va a otra pantalla.
  const recordar = () => {
    if (!porRecordar) return
    onAccion(porRecordar)
    setResueltas((previas) => new Set(previas).add(porRecordar.id))
    setPorRecordar(null)
  }
  const enLaFila = destacados(alertas)

  return (
    <section aria-label="Para atender">
      <Frame>
        <FrameHeader>
          <FrameTitle>Para atender</FrameTitle>
        </FrameHeader>
        {enLaFila.length === 1 ? (
          <FramePanel className="py-1!">
            <FilaAlerta alerta={enLaFila[0]} onResolver={resolver} />
          </FramePanel>
        ) : (
          <FramePanel className={`divide-border grid gap-5 lg:gap-0 lg:divide-x ${COLUMNAS[enLaFila.length]}`}>
            {enLaFila.map((alerta) => (
              <ColumnaAlerta key={alerta.id} alerta={alerta} onResolver={resolver} />
            ))}
          </FramePanel>
        )}
      </Frame>
      <DialogoConfirmar
        abierto={porRecordar !== null}
        onAbiertoChange={(valor) => (valor ? undefined : setPorRecordar(null))}
        icono={Notification01Icon}
        titulo="¿Enviar el recordatorio?"
        descripcion={porRecordar ? `A ${porRecordar.personas} ${porRecordar.personas === 1 ? 'persona le llega' : 'personas les llega'} un aviso para que actualicen el avance de sus objetivos.` : ''}
        accion="Enviar recordatorio"
        onConfirmar={recordar}
      >
        {porRecordar ? <RegistroConfirmar icono={Notification01Icon} nombre={porRecordar.ciclo.nombre} detalle={`${porRecordar.titulo} · ${porRecordar.personas} ${porRecordar.personas === 1 ? 'persona' : 'personas'}`} tono="neutro" /> : null}
      </DialogoConfirmar>
    </section>
  )
}
