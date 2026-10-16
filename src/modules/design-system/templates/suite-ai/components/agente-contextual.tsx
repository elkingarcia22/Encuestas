import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Note01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@ubits/flux-ui'
import {
  AgentCard,
  AgentList,
  AgentNote,
  AgentSuggestions,
  AgentThread,
  ContextPanel,
  ProposalCard,
  UndoRow,
  UserBubble,
} from '@/modules/design-system/agente-contextual/components/agent-kit'

import { EXTRAS, PROPUESTAS, TONOS } from './data'
import { useSuite } from './estado'

// Panel acoplado del caso 03: el agente trabaja sobre el campo que tienes abierto. Propone, no
// guarda nada hasta que aplicas, y se puede deshacer. Es el panel del agente contextual del design
// system (ContextPanel y sus piezas), el mismo de Avisos, la vacante y el editor de LMS.

export function AgenteContextual() {
  const suite = useSuite()
  const { editor } = suite

  return (
    // El marco de Suite AI ya pone la columna de la derecha (ancho y borde): el panel la llena.
    <ContextPanel
      className="min-h-0 w-full flex-1 border-l-0"
      context={
        <>
          <span className="text-foreground">{editor.nombre}</span> · campo Descripción
        </>
      }
      contextIcon={Note01Icon}
      onClose={() => suite.panelEditor('cerrado')}
      placeholder="Pide un cambio sobre este campo"
      onSend={suite.pedirCambio}
      scrollKey={editor.extras.length + editor.mensajes.length}
    >
      <div className="flex flex-col gap-4">
        <UserBubble>Mejora la descripción para que un operario entienda qué va a lograr.</UserBubble>
        <AgentNote>{editor.aplicado ? 'Apliqué el cambio. Puedes deshacerlo o pedir otra versión.' : 'Propuse un cambio. Nada se guarda hasta que lo apliques.'}</AgentNote>

        <ProposalCard current={editor.descripcion} proposal={PROPUESTAS[editor.propuesta]} proposalLabel={`Propuesta ${editor.propuesta + 1}/${PROPUESTAS.length}`} />

        <div className="flex flex-wrap items-center gap-2">
          <Button data-undo-focus="" size="sm" variant={editor.aplicado ? 'outline' : 'default'} disabled={editor.aplicado} onClick={suite.aplicarPropuesta}>
            {editor.aplicado ? 'Aplicado' : 'Aplicar al campo'}
          </Button>
          <Button size="sm" variant="outline" onClick={suite.otraVersion}>
            Otra versión
          </Button>
          {/* El tono de la propuesta iba en la caja de escribir; la del panel oficial no recibe piezas extra. */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
              Tono: {editor.tono}
              <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Tono de la propuesta</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={editor.tono} onValueChange={(tono) => suite.elegirTono(String(tono))}>
                  {TONOS.map((tono) => (
                    <DropdownMenuRadioItem key={tono} value={tono} closeOnClick>
                      {tono[0].toUpperCase() + tono.slice(1)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {editor.aplicado ? <UndoRow onUndo={suite.deshacer}>Aplicado al campo Descripción</UndoRow> : null}

        <AgentSuggestions
          items={[
            { label: 'Resumir en 3 puntos clave', onClick: () => suite.agregarExtra('resumen') },
            { label: 'Generar evaluación de 5 preguntas', onClick: () => suite.agregarExtra('evaluacion') },
          ]}
        />

        {editor.extras.map((extra, indice) => (
          <AgentCard key={`${extra}-${indice}`} title={EXTRAS[extra].titulo}>
            <AgentList items={EXTRAS[extra].lineas} />
          </AgentCard>
        ))}
      </div>
      <AgentThread msgs={editor.mensajes.map((mensaje, indice) => ({ id: indice, role: mensaje.autor === 'persona' ? 'user' : 'agent', content: mensaje.texto }))} />
    </ContextPanel>
  )
}
