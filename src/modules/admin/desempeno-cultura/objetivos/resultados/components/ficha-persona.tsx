import { HugeiconsIcon } from '@hugeicons/react'
import { Notification01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Progress, Text } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { ColumnaIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { Badge } from '@/shared/components/Badge'
import { formatoAvance } from '../../modelo/ciclos'
import { ETAPAS, MEDIDAS, TONO_NIVEL, etiquetaNivel, haceCuanto, riesgoDePersona, ultimaDe } from '../../modelo/resultados/personas'
import { OBJETIVOS_EMPRESA, type ObjetivoSeguido, type PersonaSeguida } from '../../modelo/resultados/seguimiento'

// La ficha de una persona del ciclo (9-oct, la «PersonImpactSheet» del prototipo, por ahora de solo lectura): arriba sus
// cuatro cifras (avance, estado, riesgo y objetivos en meta) y debajo cada objetivo con su peso, su medida, a qué objetivo
// de empresa empuja, cuándo se actualizó y cuánto lleva. Con el ciclo abierto, el pie deja recordarle que reporte.

const empresaDe = (id: string | null) => OBJETIVOS_EMPRESA.find((objetivo) => objetivo.id === id)?.titulo

function FilaObjetivo({ objetivo }: { objetivo: ObjetivoSeguido }) {
  const empresa = empresaDe(objetivo.empresa)
  const detalle = [`Peso ${objetivo.peso}%`, MEDIDAS[objetivo.medida], haceCuanto(objetivo.ultimaActualizacion), objetivo.comentarios ? `${objetivo.comentarios} ${objetivo.comentarios === 1 ? 'comentario' : 'comentarios'}` : null].filter(Boolean).join(' · ')
  return (
    <Item size="sm" className="items-start">
      <ItemContent className="min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ItemTitle>{objetivo.titulo}</ItemTitle>
          {objetivo.etapa !== 'aprobado' ? (
            <Badge variant={ETAPAS[objetivo.etapa].tono} size="sm">
              {ETAPAS[objetivo.etapa].etiqueta}
            </Badge>
          ) : null}
        </div>
        <ItemDescription>{detalle}</ItemDescription>
        <Text as="span" size="xs" variant="muted">
          {empresa ? `Empuja «${empresa}»` : 'Sin alinear a un objetivo de empresa'}
        </Text>
      </ItemContent>
      <ItemActions className="w-32 shrink-0 flex-col items-end gap-1.5 self-center">
        {objetivo.cumplimiento === null ? (
          <Text as="span" size="xs" variant="muted">
            Sin avance
          </Text>
        ) : (
          <>
            <Text as="span" size="sm" weight="semibold" className="tabular-nums">
              {formatoAvance(objetivo.cumplimiento)}
            </Text>
            <Progress value={Math.min(100, objetivo.cumplimiento)} className="w-full" aria-label={`Cumplimiento ${formatoAvance(objetivo.cumplimiento)}`} />
          </>
        )}
      </ItemActions>
    </Item>
  )
}

export function FichaPersona({ persona, abierto, onCerrar, onRecordar }: { persona: PersonaSeguida | null; abierto: boolean; onCerrar: () => void; onRecordar: (persona: PersonaSeguida) => void }) {
  const colaborador = persona?.colaborador
  const enMeta = persona ? persona.objetivos.filter((objetivo) => (objetivo.cumplimiento ?? 0) >= 100).length : 0
  const riesgo = persona ? riesgoDePersona(persona.riesgo) : null

  return (
    <DrawerShell
      open={persona !== null}
      onOpenChange={(valor) => (valor ? undefined : onCerrar())}
      size="lg"
      icon={UserIcon}
      kicker="Colaborador"
      title={colaborador?.name ?? ''}
      description={colaborador ? `${colaborador.role} · ${colaborador.area} · Líder: ${colaborador.leader ?? 'sin asignar'}` : undefined}
      footer={
        persona && abierto ? (
          <Button variant="outline" onClick={() => onRecordar(persona)}>
            <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
            Recordar actualizar avance
          </Button>
        ) : undefined
      }
    >
      {persona && riesgo ? (
        <div className="flex flex-col gap-4">
          <FilaIndicadores etiqueta={`Cifras de ${persona.colaborador.name}`} columnas={2}>
            <ColumnaIndicador titulo="Avance" cifra={persona.avance === null ? 'Sin avance' : formatoAvance(persona.avance)} pie={<Badge variant={TONO_NIVEL[persona.nivel]}>{etiquetaNivel(persona.nivel)}</Badge>} />
            <ColumnaIndicador
              titulo="Objetivos en meta"
              cifra={`${enMeta} de ${persona.objetivos.length}`}
              pie={
                abierto ? (
                  <Badge variant={riesgo.tono}>{persona.riesgo === 'sin' ? riesgo.etiqueta : `Riesgo ${riesgo.etiqueta.toLowerCase()}`}</Badge>
                ) : (
                  <Text as="span" size="xs" variant="muted">
                    Último reporte: {haceCuanto(ultimaDe(persona)).toLowerCase()}
                  </Text>
                )
              }
            />
          </FilaIndicadores>

          <Frame>
            <FrameHeader>
              <FrameTitle>Sus objetivos</FrameTitle>
              <FrameDescription>El avance de la persona es la suma de cada cumplimiento por su peso.</FrameDescription>
            </FrameHeader>
            <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
              <div className="divide-y">
                {persona.objetivos.map((objetivo) => (
                  <div key={objetivo.id}>
                    <FilaObjetivo objetivo={objetivo} />
                  </div>
                ))}
              </div>
            </FramePanel>
          </Frame>
        </div>
      ) : null}
    </DrawerShell>
  )
}
