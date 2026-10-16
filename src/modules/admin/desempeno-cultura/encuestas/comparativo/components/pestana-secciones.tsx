import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { DELTA_LEGEND, DELTA_LEGEND_DESCRIPTION, DELTA_LEGEND_TITLE } from '../../modelo/comparativo/comparativeLegends'
import { sharedStructure, type ComparativeTreeMetric } from '../../modelo/comparativo/comparativeSectionTree'
import { mapaPorGrupo, type Comparativo } from '../../modelo/comparativo/lectura'
import { LeyendaEscala, MenuVerPor, Personalizar, SelectorVista } from '../../resultados/components/controles'
import { useFiltrosResultados } from '../../resultados/components/filtros'
import { SobreGris } from '../../resultados/components/arbol-resultados'
import { BANDAS_BRECHA, MapaGruposComparativo } from './mapa-grupos'
import { BotonPantallaCompleta } from '../../resultados/components/pantalla-completa'
import { TablaSecciones } from './tabla-secciones'

// «Secciones» del comparativo: la tabla (cada medición contra la base, sección por sección y pregunta
// por pregunta) y el mapa de calor (las brechas entre grupos en la base).

type Vista = 'tabla' | 'mapa'

const METRICAS: readonly { value: ComparativeTreeMetric; label: string }[] = [
  { value: 'favorabilidad', label: 'Favorabilidad' },
  { value: 'nps', label: 'eNPS' },
  // Cuánta gente respondió en cada medición (9-oct, como el prototipo): una tasa de toda la encuesta, igual en cada sección.
  { value: 'participacion', label: 'Participación' },
]

export function PestanaSecciones({ comparativo }: { comparativo: Comparativo }) {
  const [vista, setVista] = useState<Vista>('tabla')
  const [metrica, setMetrica] = useState<ComparativeTreeMetric>(comparativo.tipo === 'NPS' ? 'nps' : 'favorabilidad')
  // La escalera de participación que lee la tabla: el índice 0 es la base y los demás siguen la clave de cada columna (p1, p2…).
  const participacion = useMemo(() => {
    const escalera: { participation: number; invited: number }[] = []
    for (const columna of comparativo.columnas) {
      const titular = comparativo.titulares[columna.id]
      if (!titular) continue
      escalera[columna.dataKey === 'currentScore' ? 0 : Number(columna.dataKey.slice(1))] = { participation: titular.participacion, invited: titular.invitados }
    }
    return escalera
  }, [comparativo])
  const segmentos = useMemo(() => comparativo.resultadosBase.segments.filter((segmento) => !segmento.perPerson).map((segmento) => ({ value: segmento.key, label: segmento.label })), [comparativo.resultadosBase.segments])
  const [segmento, setSegmento] = useState(segmentos[0]?.value ?? '')
  const mapa = useMemo(() => (vista === 'mapa' ? mapaPorGrupo(comparativo, segmento) : null), [vista, comparativo, segmento])
  const nombreSegmento = segmentos.find((opcion) => opcion.value === segmento)?.label ?? ''
  // Los niveles de «Personalizar», con el mismo estado que usan las pestañas de Resultados.
  const definiciones = useMemo(() => comparativo.resultadosBase.segments.filter((opcion) => !opcion.perPerson), [comparativo.resultadosBase.segments])
  const estado = useFiltrosResultados(definiciones[0] ?? comparativo.resultadosBase.segments[0], definiciones, () => undefined)
  // Sin grupos no hay mapa: la base no pidió datos demográficos (COM-070).
  const sinDemograficos = segmentos.length === 0
  // Cada medición trae su cuestionario: cuántas secciones están en todas (COM-057).
  const estructura = useMemo(() => sharedStructure(comparativo.arbolConPreguntas, comparativo.columnas), [comparativo])

  return (
    <div className="flex flex-col gap-4">
    {vista === 'tabla' && estructura.shared === 0 ? (
      <Alert variant="warning">
        <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
        <AlertTitle>Estas mediciones no tienen secciones en común</AlertTitle>
        <AlertDescription>Cada una usó un cuestionario distinto, así que no hay nada que comparar sección por sección: cada sección muestra solo la medición que la incluyó. Usa «Cambiar encuestas» para elegir mediciones con el mismo cuestionario.</AlertDescription>
      </Alert>
    ) : vista === 'tabla' && estructura.shared < estructura.total ? (
      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertDescription>
          Las mediciones no usaron el mismo cuestionario: {estructura.total - estructura.shared} de {estructura.total} secciones no están en todas. Donde una medición no incluía una sección o una pregunta verás «—».
        </AlertDescription>
      </Alert>
    ) : null}
    <Frame spacing="sm" className="[--frame-gap:0px]">
      <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
        <div>
          <FrameTitle>{vista === 'tabla' ? 'Detalle por sección y pregunta' : sinDemograficos ? 'Mapa de calor' : `Mapa de calor por ${nombreSegmento.toLowerCase()}`}</FrameTitle>
          <FrameDescription>{vista === 'tabla' ? `${comparativo.arbolConPreguntas.length} secciones · ${comparativo.columnas.length} mediciones` : sinDemograficos ? 'La encuesta base no recogió grupos' : `Brechas frente a toda la empresa en ${comparativo.olas[0].shortLabel}`}</FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Detalle y mapa de calor se cambian con la pastilla, dentro de la cabecera de la caja (Elkin, 9-oct): encima ya
              están las pestañas subrayadas de la página (Secciones · Comentarios · Insights IA) y dos tiras iguales seguidas
              se confundían. El mapa lee brechas de favorabilidad: un comparativo de eNPS no lo tiene. */}
          {comparativo.tipo === 'NPS' ? null : (
            <SelectorVista
              valor={vista}
              onCambio={setVista}
              opciones={[
                { value: 'tabla', label: 'Detalle' },
                { value: 'mapa', label: 'Mapa de calor' },
              ]}
            />
          )}
          {vista === 'tabla' ? (
            <MenuVerPor valor={metrica} opciones={comparativo.tipo === 'NPS' ? METRICAS.filter((opcion) => opcion.value !== 'favorabilidad') : METRICAS} onCambio={setMetrica} />
          ) : sinDemograficos ? null : (
            <MenuVerPor valor={segmento} opciones={segmentos} onCambio={setSegmento} />
          )}
          {vista === 'tabla' ? <Personalizar estado={estado} escala={[]} resaltadas={new Set()} onResaltar={() => undefined} onRestablecerResaltado={() => undefined} ajustesResaltado={0} /> : null}
          {vista === 'tabla' ? (
            <LeyendaEscala titulo={DELTA_LEGEND_TITLE} descripcion={DELTA_LEGEND_DESCRIPTION} escala={DELTA_LEGEND} />
          ) : (
            <LeyendaEscala
              titulo="Cómo leer la brecha"
              descripcion="Cada celda es la favorabilidad del grupo menos la de toda la empresa en esa sección, en la encuesta base. Los grupos con candado tienen menos respuestas que el mínimo de anonimato."
              escala={BANDAS_BRECHA}
            />
          )}
          {vista === 'mapa' && mapa && !sinDemograficos ? (
            <BotonPantallaCompleta
              titulo="Mapa de calor"
              descripcion={`Por ${nombreSegmento.toLowerCase()} · brechas frente a toda la empresa en ${comparativo.olas[0].shortLabel}`}
              acciones={
                <>
                  <MenuVerPor valor={segmento} opciones={segmentos} onCambio={setSegmento} />
                  <LeyendaEscala
                    titulo="Cómo leer la brecha"
                    descripcion="Cada celda es la favorabilidad del grupo menos la de toda la empresa en esa sección, en la encuesta base. Los grupos con candado tienen menos respuestas que el mínimo de anonimato."
                    escala={BANDAS_BRECHA}
                  />
                </>
              }
            >
              <MapaGruposComparativo mapa={mapa} segmento={nombreSegmento} />
            </BotonPantallaCompleta>
          ) : null}
        </div>
      </FrameHeader>
      {/* Como Favorabilidad › Secciones: las secciones como tarjetas sobre el gris; el mapa de calor, en su panel. */}
      {vista === 'tabla' ? (
        <SobreGris>
          <TablaSecciones arbol={comparativo.arbolConPreguntas} columnas={comparativo.columnas} metrica={metrica} niveles={estado.niveles} participacion={participacion} />
        </SobreGris>
      ) : sinDemograficos ? (
        <FramePanel>
          <PrimeraVez
            icono="glass-profile"
            titulo="Esta encuesta no pidió datos demográficos"
            descripcion={`El mapa de calor compara grupos de la encuesta base (área, sede, líder…), y «${comparativo.base.name}» no los recogió. Para verlo, elige como base una medición que sí los pidiera.`}
            accion={{ texto: 'Ver detalle', onClick: () => setVista('tabla') }}
          />
        </FramePanel>
      ) : mapa ? (
        <FramePanel>
          <MapaGruposComparativo mapa={mapa} segmento={nombreSegmento} />
        </FramePanel>
      ) : null}
    </Frame>
    </div>
  )
}
