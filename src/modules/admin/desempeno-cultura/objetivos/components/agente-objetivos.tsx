import { Target02Icon } from '@hugeicons/core-free-icons'
import { AgentList, AgentNote, AgentSuggestions, AgentThread, ContextPanel } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { plural } from '@/modules/design-system/patrones/formato'
import { alertasDe } from '../modelo/alertas'
import { formatoAvance, type Ciclo } from '../modelo/ciclos'
import { construirPulso } from '../modelo/pulso'

// El agente contextual del home de Objetivos: el mismo panel que el de Encuestas, acoplado a la derecha. Lee los ciclos
// que hay en pantalla y responde sobre ellos; crear un ciclo lo lleva a crearlo.

const cuantos = (n: number) => `${n} ${plural(n, 'ciclo', 'ciclos')}`

export function AgenteObjetivos({ ciclos, onCrear, onClose }: { ciclos: readonly Ciclo[]; onCrear: () => void; onClose: () => void }) {
  const thread = useAgentThread()
  const enCurso = ciclos.filter((ciclo) => ciclo.estado === 'En curso')
  const atrasados = [...new Map(alertasDe(ciclos).filter((alerta) => alerta.tipo === 'avanceBajo').map((alerta) => [alerta.ciclo.id, alerta.ciclo])).values()]
  const pulso = construirPulso(ciclos)

  const atencion = () =>
    thread.ask(
      '¿Qué ciclos necesitan atención?',
      atrasados.length ? (
        <div className="flex flex-col gap-3">
          <AgentNote>
            {cuantos(atrasados.length)} en curso {plural(atrasados.length, 'va', 'van')} por debajo del avance esperado:
          </AgentNote>
          <AgentList items={atrasados.map((ciclo) => `${ciclo.nombre} · ${formatoAvance(ciclo.avance)}`)} />
          <AgentNote>Un recordatorio para reportar avance antes del cierre suele mover la cifra.</AgentNote>
        </div>
      ) : (
        <AgentNote>Ningún ciclo en curso va por debajo del avance esperado.</AgentNote>
      ),
      1400,
    )

  const avance = () =>
    thread.ask(
      '¿Cómo va el avance?',
      <AgentNote>
        Hay {cuantos(enCurso.length)} en curso. El avance promedio es del {formatoAvance(pulso.avance.valor ?? 0)} y el {formatoAvance(pulso.reportando.valor ?? 0)} de las personas reporta.
      </AgentNote>,
      1400,
    )

  const crear = () => {
    onClose()
    onCrear()
  }

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Objetivos</span> · {cuantos(ciclos.length)}
        </>
      }
      contextIcon={Target02Icon}
      onClose={onClose}
      placeholder="Pregunta algo sobre tus ciclos"
      onSend={(texto) => {
        const t = texto.toLowerCase()
        if (/crear|nuevo|armar/.test(t)) return crear()
        if (/atenci|bajo|riesgo|problema|atras/.test(t)) return atencion()
        if (/avance|reporta|cumpl/.test(t)) return avance()
        thread.ask(texto, <AgentNote>Por ahora te puedo decir qué ciclos necesitan atención, cómo va el avance o llevarte a crear uno.</AgentNote>, 1400)
      }}
      scrollKey={thread.msgs.length ? thread.scrollKey : undefined}
    >
      <AgentNote>Hola, Carolina. Te ayudo a leer tus ciclos de objetivos y a crear uno nuevo.</AgentNote>
      <AgentSuggestions
        className="mt-4"
        title="¿Qué quieres hacer?"
        items={[
          { label: '¿Qué ciclos necesitan atención?', onClick: atencion },
          { label: '¿Cómo va el avance?', onClick: avance },
          { label: 'Crear un ciclo', onClick: crear },
        ]}
      />
      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )
}
