import type { MouseEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Checkbox,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  Progress,
  ProgressLabel,
  ProgressValue,
  ScrollArea,
  ScrollBar,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import type { Candidato, Etapa, EtapaId } from './data'

type TableroProps = {
  // Las etapas del flujo de la vacante: 5 por defecto, 6 en la comercial.
  etapas: Etapa[]
  candidatos: Candidato[]
  seleccion: string[]
  onSeleccionar: (id: string, marcado: boolean) => void
  onAbrir: (id: string) => void
  onMover: (columnas: Record<EtapaId, Candidato[]>) => void
  // Al soltar un candidato en otra columna.
  onSoltar: (id: string, etapa: EtapaId) => void
}

const columnaDe = (columnas: Record<string, Candidato[]>, id: string) =>
  Object.keys(columnas).find((clave) => columnas[clave].some((c) => c.id === id)) as EtapaId | undefined

const detener = (event: MouseEvent) => event.stopPropagation()

// Una columna por etapa; la clase va entera para que Tailwind la encuentre. Sin ancho fijo (auditoría, 5-oct): el
// tablero ocupa lo que le da la página, y solo se desplaza en horizontal si una columna quedaría por debajo de 176 px.
const COLUMNAS: Record<number, string> = {
  5: 'grid-cols-[repeat(5,minmax(11rem,1fr))] sm:grid-cols-[repeat(5,minmax(11rem,1fr))]',
  6: 'grid-cols-[repeat(6,minmax(11rem,1fr))] sm:grid-cols-[repeat(6,minmax(11rem,1fr))]',
}

function TarjetaCandidato({
  candidato,
  marcado,
  bloqueado,
  onSeleccionar,
  onAbrir,
}: {
  candidato: Candidato
  marcado: boolean
  bloqueado: boolean
  onSeleccionar: (marcado: boolean) => void
  onAbrir: () => void
}) {
  return (
    <KanbanItem value={candidato.id}>
      <KanbanItemHandle>
        <Frame variant="ghost" spacing="sm" className="p-0">
          <FramePanel className="flex cursor-pointer flex-col gap-3 p-3" onClick={onAbrir}>
            <div className="flex items-start gap-2">
              {/* La casilla no abre la ficha: su clic se queda en ella. */}
              <div className="pt-0.5" onClick={detener}>
                <Checkbox
                  checked={marcado}
                  disabled={bloqueado && !marcado}
                  aria-label={`Seleccionar a ${candidato.nombre} para comparar`}
                  onCheckedChange={(valor) => onSeleccionar(Boolean(valor))}
                />
              </div>
              <Avatar size="sm">
                <AvatarFallback>{candidato.iniciales}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Text as="span" size="sm" weight="medium" className="truncate">
                  {candidato.nombre}
                </Text>
                <Text as="span" variant="muted" size="xs" className="truncate">
                  {candidato.cargo} · {candidato.empresa}
                </Text>
              </div>
              <BotonIcono size="icon-xs" aria-label={`Ver ficha de ${candidato.nombre}`}
                onClick={(event) => {
                  detener(event)
                  onAbrir()
                }}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </BotonIcono>
            </div>

            <Progress value={candidato.ajuste}>
              {/* El ajuste lo calcula la IA al leer la hoja de vida: lleva su icono. */}
              <ProgressLabel className="flex items-center gap-1.5">
                <IconoIA />
                Ajuste
              </ProgressLabel>
              <ProgressValue className="ms-auto" />
            </Progress>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline">
                {candidato.origen}
              </Badge>
              <Text as="span" variant="muted" size="xs">
                {candidato.dias === 0 ? 'Llegó hoy' : `${candidato.dias} d en la etapa`}
              </Text>
            </div>

            {candidato.serena !== undefined ? (
              <EtiquetaIA className="w-fit">Serena AI {candidato.serena}/100</EtiquetaIA>
            ) : null}

            {candidato.accion ? (
              <Badge variant="warning-outline" className="w-fit max-w-full">
                <HugeiconsIcon icon={Alert02Icon} />
                <span className="truncate">{candidato.accion}</span>
              </Badge>
            ) : null}
          </FramePanel>
        </Frame>
      </KanbanItemHandle>
    </KanbanItem>
  )
}

// Candidatos por etapa del flujo: se arrastran entre columnas y se marcan para comparar (máximo 3).
export function TableroCandidatos({ etapas, candidatos, seleccion, onSeleccionar, onAbrir, onMover, onSoltar }: TableroProps) {
  const columnas = Object.fromEntries(etapas.map((etapa) => [etapa.id, candidatos.filter((c) => c.etapa === etapa.id)])) as Record<
    EtapaId,
    Candidato[]
  >
  const lleno = seleccion.length >= 3

  return (
    // El ancho lo pone la página (PageShell «wide» para un tablero denso); si la pantalla es angosta, el tablero se
    // desplaza en horizontal, con la barra visible.
    <ScrollArea className="w-full">
      <Kanban
        value={columnas}
        onValueChange={(valor) => onMover(valor as Record<EtapaId, Candidato[]>)}
        getItemValue={(candidato) => candidato.id}
        onValueCommit={(valor, meta) => {
          if (meta.kind !== 'item') return
          const id = String(meta.event.active.id)
          const destino = columnaDe(valor, id)
          if (destino && destino !== columnaDe(meta.previousValue, id)) onSoltar(id, destino)
        }}
      >
        <KanbanBoard className={`w-full items-start gap-3 pb-4 ${COLUMNAS[etapas.length] ?? COLUMNAS[5]}`}>
          {etapas.map((etapa, indice) => {
            const lista = columnas[etapa.id]
            return (
              <KanbanColumn key={etapa.id} value={etapa.id}>
                <Frame spacing="sm" className="h-full">
                  <FrameHeader className="flex flex-row items-center gap-2">
                    <Badge variant="secondary" radius="full">
                      {indice + 1}
                    </Badge>
                    <FrameTitle className="truncate">{etapa.titulo}</FrameTitle>
                    <Badge variant="outline" className="ms-auto">
                      {lista.length}
                    </Badge>
                  </FrameHeader>
                  <KanbanColumnContent value={etapa.id} className="flex min-h-24 flex-col gap-2 p-0.5">
                    {lista.length ? (
                      lista.map((candidato) => (
                        <TarjetaCandidato
                          key={candidato.id}
                          candidato={candidato}
                          marcado={seleccion.includes(candidato.id)}
                          bloqueado={lleno}
                          onSeleccionar={(marcado) => onSeleccionar(candidato.id, marcado)}
                          onAbrir={() => onAbrir(candidato.id)}
                        />
                      ))
                    ) : (
                      <Text as="div" variant="muted" size="xs" className="px-2 py-6 text-center">
                        Sin candidatos en esta etapa
                      </Text>
                    )}
                  </KanbanColumnContent>
                </Frame>
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
        <KanbanOverlay />
      </Kanban>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
