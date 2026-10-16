import { ClipboardIcon } from '@hugeicons/core-free-icons'
import { AgentList, AgentNote, AgentSuggestions, AgentThread, ContextPanel } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { plural } from '@/modules/design-system/patrones/formato'
import type { SurveyListItem } from '../modelo/types'

// El agente contextual del home de Encuestas: el mismo panel que Planes de formación, acoplado a la derecha. Lee la
// lista que hay en pantalla y responde sobre ella. Crear una encuesta abre «Crear encuesta» con el mismo agente abierto a
// la derecha y lo pedido aquí ya en su chat: allí la arma a la vista (Elkin, 14-oct).

const EN_CURSO = 'En progreso'
const PARTICIPACION_BAJA = 50

const cuantas = (n: number) => `${n} ${plural(n, 'encuesta', 'encuestas')}`

export function AgenteEncuestas({ encuestas, onCrear, onClose }: { encuestas: readonly SurveyListItem[]; onCrear: (pedido?: string) => void; onClose: () => void }) {
  const thread = useAgentThread()
  const enCurso = encuestas.filter((encuesta) => encuesta.status === EN_CURSO)
  const bajas = enCurso.filter((encuesta) => encuesta.progress < PARTICIPACION_BAJA)
  const promedio = enCurso.length ? Math.round(enCurso.reduce((suma, encuesta) => suma + encuesta.progress, 0) / enCurso.length) : 0

  const atencion = () =>
    thread.ask(
      '¿Qué encuestas necesitan atención?',
      bajas.length ? (
        <div className="flex flex-col gap-3">
          <AgentNote>
            {cuantas(bajas.length)} en curso {plural(bajas.length, 'va', 'van')} por debajo del {PARTICIPACION_BAJA}% de participación:
          </AgentNote>
          <AgentList items={bajas.map((encuesta) => `${encuesta.name} · ${encuesta.progress}%`)} />
          <AgentNote>Un recordatorio a quienes no han respondido suele subirla antes del cierre.</AgentNote>
        </div>
      ) : (
        <AgentNote>Ninguna encuesta en curso va por debajo del {PARTICIPACION_BAJA}% de participación.</AgentNote>
      ),
      1400,
    )

  const participacion = () =>
    thread.ask(
      '¿Cómo va la participación?',
      <AgentNote>
        Hay {cuantas(enCurso.length)} en curso, con una participación promedio del {promedio}%.
      </AgentNote>,
      1400,
    )

  // Lo que se escribió aquí («quiero una encuesta de clima…») viaja al chat del constructor; con la sugerencia, sin texto.
  const crear = (pedido?: string) => {
    onClose()
    onCrear(pedido)
  }

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Encuestas</span> · {cuantas(encuestas.length)}
        </>
      }
      contextIcon={ClipboardIcon}
      onClose={onClose}
      placeholder="Pregunta algo sobre tus encuestas"
      onSend={(texto) => {
        const t = texto.toLowerCase()
        if (/crear|nueva|armar|quiero (una encuesta|medir)|encuesta (de|sobre|para)/.test(t)) return crear(texto)
        if (/atenci|baja|riesgo|problema/.test(t)) return atencion()
        if (/participaci|avance|respuesta/.test(t)) return participacion()
        thread.ask(texto, <AgentNote>Por ahora te puedo decir qué encuestas necesitan atención, cómo va la participación o crear una contigo.</AgentNote>, 1400)
      }}
      scrollKey={thread.msgs.length ? thread.scrollKey : undefined}
    >
      <AgentNote>Hola, Carolina. Te ayudo a leer tus encuestas y a crear una nueva.</AgentNote>
      <AgentSuggestions
        className="mt-4"
        title="¿Qué quieres hacer?"
        items={[
          { label: '¿Qué encuestas necesitan atención?', onClick: atencion },
          { label: '¿Cómo va la participación?', onClick: participacion },
          { label: 'Crear una encuesta con IA', onClick: () => crear() },
        ]}
      />
      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )
}
