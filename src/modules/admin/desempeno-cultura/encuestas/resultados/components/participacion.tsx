import { useMemo, useState } from 'react'
import { AnilloAvance } from '../../components/graficos'
import { COLLABORATORS } from '../../modelo/collaborators'
import { formatPercent, toneForParticipation } from '../../modelo/favorabilityScale'
import { PARTICIPATION_TARGET } from '../../modelo/surveyListFilters'
import { participationBySegment, type SegmentDefinition, type SurveyResults } from '../../modelo/surveyResults'
import { AvisoSinDemograficos } from './aviso-sin-demograficos'
import { COLOR_POR_LECTURA, numero } from './escala'
import { TablaParticipacion } from './tabla-participacion'
import { TarjetaResumen } from './tarjeta-resumen'

// Participación: ¿quién respondió y quién falta? Arriba el total y el estado de los invitados
// (tocar un anillo filtra la tabla por ese estado); abajo la tabla por el demográfico elegido, la
// única vista que acepta «Colaborador», donde cada fila es una persona.

const LECTURA = { positive: 'Buena', warning: 'Regular', negative: 'Baja' } as const

type Props = {
  resultados: SurveyResults
  /** Sin él, la encuesta no recogió datos demográficos: la tabla va por colaborador y sin «Ver por». */
  segmento?: SegmentDefinition
  onSegmento: (clave: string) => void
}

// Sin datos demográficos la pregunta «¿quién falta?» sigue en pie: se responde persona por persona. La lista es la de
// los invitados de la encuesta (tantas filas como invitados), armada igual que el demográfico «Colaborador» de las
// encuestas que sí lo tienen, para que la tabla se vea y se comporte igual. No entra en `resultados.segments`: no es un
// demográfico, así que no aparece como «Ver por» ni como filtro en ninguna otra pestaña.
function porColaborador(invitados: number): SegmentDefinition {
  return {
    key: 'collaborator',
    label: 'Colaborador',
    preloaded: true,
    perPerson: true,
    options: COLLABORATORS.slice(0, invitados).map((persona) => ({ id: persona.id, label: persona.name })),
  }
}

export function Participacion({ resultados, segmento, onSegmento }: Props) {
  // La selección vive solo en esta pestaña: al cambiar de pestaña se pierde, no significa nada en las otras.
  const [seleccion, setSeleccion] = useState<ReadonlySet<string>>(() => new Set())
  const [estados, setEstados] = useState<string[]>([])

  const { completed, inProgress, invited, rate } = resultados.participation
  const sinDemograficos = !segmento
  const vista = useMemo(() => segmento ?? porColaborador(invited), [segmento, invited])
  const filas = useMemo(() => participationBySegment(resultados, vista), [resultados, vista])
  const sinResponder = Math.max(0, invited - completed - inProgress)
  const tono = toneForParticipation(rate)
  const porcentaje = (valor: number) => (invited === 0 ? 0 : Math.round((valor / invited) * 100))

  // El top 3 es por área (o el primer demográfico por grupos), aunque la tabla esté por persona.
  const porGrupos = resultados.segments.find((opcion) => opcion.key === 'area') ?? resultados.segments.find((opcion) => !opcion.perPerson)
  const top = useMemo(() => (porGrupos ? participationBySegment(resultados, porGrupos) : filas), [resultados, porGrupos, filas])
  // Lo que hay que empujar: los tres grupos con menor participación, el más bajo primero.
  const menores = useMemo(() => [...top].filter((fila) => fila.invited > 0).sort((a, b) => a.rate - b.rate).slice(0, 3), [top])

  const cambiarSegmento = (clave: string) => {
    setSeleccion(new Set())
    onSegmento(clave)
  }


  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Total de participación"
        ayuda="Es el porcentaje de personas invitadas que completaron la encuesta: personas que completaron ÷ personas invitadas."
        cifra={formatPercent(rate)}
        lectura={LECTURA[tono]}
        pie={`${numero(completed)} de ${numero(invited)} · meta ${PARTICIPATION_TARGET}%`}
        tituloAnillos="Estado de los invitados"
        totalAnillos={`${numero(invited)} en total`}
        anillos={[
          { id: 'completadas', etiqueta: 'Completadas', porcentaje: porcentaje(completed), color: 'var(--success)', cantidad: numero(completed) },
          { id: 'progreso', etiqueta: 'En progreso', porcentaje: porcentaje(inProgress), color: 'var(--warning)', cantidad: numero(inProgress) },
          { id: 'faltan', etiqueta: 'Faltan', porcentaje: porcentaje(sinResponder), color: 'var(--destructive)', cantidad: numero(sinResponder) },
        ]}
        // Sin demográficos no hay grupos que comparar: la tarjeta se queda con el total y el estado de los invitados.
        tituloTop={sinDemograficos ? undefined : `${porGrupos ? porGrupos.label : 'Grupo'} con menor participación`}
        top={menores.map((fila) => ({ id: fila.id, etiqueta: fila.label, valor: fila.rate, texto: formatPercent(fila.rate) }))}
        // Como el detalle de «Estado de los invitados»: cada grupo con su porcentaje, del más bajo al más alto.
        pieTop={menores.length > 0 ? menores.map((fila) => `${fila.label} ${formatPercent(fila.rate)}`).join(' · ') : undefined}
        grafico={<AnilloAvance valor={rate} color={COLOR_POR_LECTURA[tono]} etiqueta="Total de participación" tamano={48} />}
      />

      {sinDemograficos ? <AvisoSinDemograficos /> : null}

      <TablaParticipacion
        filas={filas}
        segmentos={resultados.segments}
        segmento={vista}
        onSegmento={cambiarSegmento}
        seleccion={seleccion}
        onSeleccion={setSeleccion}
        estados={estados}
        onEstados={setEstados}
      />
    </div>
  )
}
