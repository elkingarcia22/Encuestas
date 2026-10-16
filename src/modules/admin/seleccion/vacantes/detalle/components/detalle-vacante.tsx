import { HugeiconsIcon } from '@hugeicons/react'
import { Briefcase01Icon, Clock01Icon, LanguageSkillIcon, Money03Icon, Tick02Icon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@ubits/flux-ui'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { etapasDe, pesos, type Candidato, type Vacante } from './data'

// Pestaña «Detalle de la vacante»: lo que se llenó al crearla (información básica y flujo del candidato).
export function DetalleVacante({ vacante, candidatos }: { vacante: Vacante; candidatos: Candidato[] }) {
  const etapas = etapasDe(vacante)
  const condiciones = [
    { icono: Money03Icon, etiqueta: 'Rango salarial', valor: `${pesos(vacante.rango[0])} – ${pesos(vacante.rango[1])} al mes` },
    { icono: Briefcase01Icon, etiqueta: 'Contrato', valor: vacante.contrato },
    { icono: UserIcon, etiqueta: 'Seniority', valor: vacante.seniority },
    { icono: Clock01Icon, etiqueta: 'Experiencia', valor: vacante.experiencia },
    { icono: LanguageSkillIcon, etiqueta: 'Idioma', valor: vacante.idioma },
  ]

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Frame>
          <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
            <FrameTitle>Descripción</FrameTitle>
            <FrameDescription>Lo que ven los candidatos en la publicación</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-3">
            {vacante.descripcion.map((parrafo) => (
              <Text key={parrafo} as="p" size="sm">
                {parrafo}
              </Text>
            ))}
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
            <FrameTitle>Requisitos</FrameTitle>
            <FrameDescription>La Evaluación CV y el agente los usan para medir el ajuste</FrameDescription>
          </FrameHeader>
          <FramePanel>
            <ItemGroup className="gap-2">
              {vacante.requisitos.map((requisito) => (
                <Item key={requisito} size="sm">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={Tick02Icon} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{requisito}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
            <FrameTitle>Condiciones</FrameTitle>
          </FrameHeader>
          <FramePanel>
            <div className="grid gap-2 sm:grid-cols-2">
              {condiciones.map((condicion) => (
                <Item key={condicion.etiqueta} variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={condicion.icono} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription>{condicion.etiqueta}</ItemDescription>
                    <ItemTitle>{condicion.valor}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </div>
          </FramePanel>
        </Frame>
      </div>

      <Frame>
        <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
          <FrameTitle>Flujo del candidato</FrameTitle>
          <FrameDescription>{etapas.length} etapas, en el orden en que el candidato las completa</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <Timeline value={etapas.length}>
            {etapas.map((etapa, indice) => {
              const cantidad = candidatos.filter((c) => c.etapa === etapa.id).length
              return (
                <TimelineItem key={etapa.id} step={indice + 1}>
                  <TimelineHeader>
                    <TimelineSeparator />
                    <TimelineTitle className="flex flex-wrap items-center gap-2">
                      {indice + 1}. {etapa.titulo}
                      {etapa.ia ? (
                        <EtiquetaIA size="sm">Con IA</EtiquetaIA>
                      ) : null}
                    </TimelineTitle>
                    <TimelineIndicator />
                  </TimelineHeader>
                  <TimelineContent className="flex flex-col gap-1">
                    <span>{etapa.descripcion}</span>
                    <Text as="span" variant="muted" size="xs">
                      {cantidad} {plural(cantidad, 'candidato', 'candidatos')} hoy
                    </Text>
                  </TimelineContent>
                </TimelineItem>
              )
            })}
          </Timeline>
        </FramePanel>
      </Frame>
    </div>
  )
}
