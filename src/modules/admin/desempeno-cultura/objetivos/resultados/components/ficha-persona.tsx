import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Notification01Icon, UnavailableIcon, UserIcon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Progress, Text } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { ColumnaIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { Badge } from '@/shared/components/Badge'
import { formatoAvance, type Ciclo } from '../../modelo/ciclos'
import { ETAPAS, MEDIDAS, haceCuanto, riesgoDePersona, ultimaDe } from '../../modelo/resultados/personas'
import { OBJETIVOS_EMPRESA, type ObjetivoSeguido, type PersonaSeguida } from '../../modelo/resultados/seguimiento'
import { DialogoRecordar } from './dialogo-recordar'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { notify } from '@/shared/components/notify'
import { activarObjetivos } from '../../components/ajustes-ciclo'

// La ficha de una persona del ciclo (9-oct, la «PersonImpactSheet» del prototipo; desde el 21-oct cada objetivo se puede
// activar o inactivar mientras el ciclo cambie): arriba sus
// cuatro cifras (avance, estado, riesgo y objetivos en meta) y debajo cada objetivo con su peso, su medida, a qué objetivo
// de empresa empuja, cuándo se actualizó y cuánto lleva. Con el ciclo abierto, el pie deja recordarle que reporte.

const empresaDe = (id: string | null) => OBJETIVOS_EMPRESA.find((objetivo) => objetivo.id === id)?.titulo

function FilaObjetivo({ objetivo, accion }: { objetivo: ObjetivoSeguido; accion?: ReactNode }) {
  const empresa = empresaDe(objetivo.empresa)
  const detalle = [`Peso ${objetivo.peso} %`, MEDIDAS[objetivo.medida], haceCuanto(objetivo.ultimaActualizacion), objetivo.comentarios ? `${objetivo.comentarios} ${objetivo.comentarios === 1 ? 'comentario' : 'comentarios'}` : null].filter(Boolean).join(' · ')
  return (
    <Item size="sm" className="items-start">
      <ItemContent className="min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ItemTitle>{objetivo.titulo}</ItemTitle>
          {!objetivo.activo ? (
            <Badge variant="outline" size="sm">
              Inactivo
            </Badge>
          ) : null}
          {objetivo.etapa !== 'aprobado' ? (
            <Badge variant={ETAPAS[objetivo.etapa].tono} size="sm">
              {ETAPAS[objetivo.etapa].etiqueta}
            </Badge>
          ) : null}
        </div>
        <ItemDescription>{detalle}</ItemDescription>
        <Text as="span" size="xs" variant="muted">
          {objetivo.activo ? (empresa ? `Empuja «${empresa}»` : 'Sin alinear a un objetivo de empresa') : 'No cuenta para su avance; el suyo se conserva.'}
        </Text>
        {accion ? <div className="pt-1">{accion}</div> : null}
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

export function FichaPersona({ persona, ciclo, abierto, editable, onCerrar }: { persona: PersonaSeguida | null; ciclo: Ciclo; abierto: boolean; editable: boolean; onCerrar: () => void }) {
  // El recordatorio se pregunta dentro de este panel, como vista del mismo (regla «preguntar-dentro-del-panel»).
  const [recordar, setRecordar] = useState(false)
  // Inactivar un objetivo pregunta antes (deja de contar para la persona); activarlo no: vuelve con el avance que traía.
  const [porInactivar, setPorInactivar] = useState<ObjetivoSeguido | null>(null)
  const cambiaObjetivos = editable && persona !== null && !persona.retirado
  const activar = (objetivo: ObjetivoSeguido) => {
    activarObjetivos(ciclo.id, [objetivo.id], true)
    notify('Objetivo activado', `Vuelve a contar para ${persona?.colaborador.name ?? 'la persona'} con el avance que traía.`, 'success')
  }
  const colaborador = persona?.colaborador
  const enMeta = persona ? persona.objetivos.filter((objetivo) => (objetivo.cumplimiento ?? 0) >= 100).length : 0
  const riesgo = persona ? riesgoDePersona(persona.riesgo) : null

  return (
    <DrawerShell
      open={persona !== null}
      onOpenChange={(valor) => {
        if (valor) return
        setRecordar(false)
        onCerrar()
      }}
      size="lg"
      icon={UserIcon}
      kicker="Colaborador"
      title={colaborador?.name ?? ''}
      description={colaborador ? `${colaborador.role} · ${colaborador.area} · Líder: ${colaborador.leader ?? 'sin asignar'}` : undefined}
      footer={
        persona && abierto ? (
          <Button variant="outline" onClick={() => setRecordar(true)}>
            <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
            Recordar actualizar avance
          </Button>
        ) : undefined
      }
    >
      {persona && riesgo ? (
        <div className="flex flex-col gap-4">
          <FilaIndicadores etiqueta={`Cifras de ${persona.colaborador.name}`} columnas={2}>
            <ColumnaIndicador titulo="Avance" cifra={persona.avance === null ? 'Sin avance' : formatoAvance(persona.avance)} pie={<Badge variant={persona.nivel.badge}>{persona.nivel.etiqueta}</Badge>} />
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
                    <FilaObjetivo
                      objetivo={objetivo}
                      accion={
                        cambiaObjetivos ? (
                          <Button variant="ghost" size="sm" onClick={() => (objetivo.activo ? setPorInactivar(objetivo) : activar(objetivo))}>
                            <HugeiconsIcon icon={objetivo.activo ? UnavailableIcon : CheckmarkCircle02Icon} aria-hidden="true" />
                            {objetivo.activo ? 'Inactivar' : 'Activar'}
                          </Button>
                        ) : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </FramePanel>
          </Frame>
        </div>
      ) : null}
      <DialogoRecordar ciclo={ciclo} personas={recordar && persona ? [persona] : null} onCerrar={() => setRecordar(false)} />
      <DialogoConfirmar
        abierto={porInactivar !== null}
        onAbiertoChange={(valor) => (valor ? undefined : setPorInactivar(null))}
        icono={UnavailableIcon}
        titulo="¿Inactivar este objetivo?"
        descripcion={
          <>
            <strong className="font-semibold">{porInactivar?.titulo}</strong> deja de contar para <strong className="font-semibold">{persona?.colaborador.name}</strong> y sale del ponderado. Su avance se conserva y puedes volver a activarlo.
          </>
        }
        accion="Inactivar objetivo"
        onConfirmar={() => {
          if (!porInactivar) return
          activarObjetivos(ciclo.id, [porInactivar.id], false)
          setPorInactivar(null)
          notify('Objetivo inactivado', `Ya no cuenta para el avance de ${persona?.colaborador.name ?? 'la persona'}.`, 'success')
        }}
      />
    </DrawerShell>
  )
}
