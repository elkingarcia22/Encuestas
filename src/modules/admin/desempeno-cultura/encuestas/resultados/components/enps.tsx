import { useMemo, useState } from 'react'
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from '@ubits/flux-ui'
import { MedidorEnps } from '../../components/graficos'
import { NPS_SCORE_BANDS, toneForNps } from '../../modelo/favorabilityScale'
import { npsDepthBySection, npsDepthTotals } from '../../modelo/npsDepth'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { npsBySection, npsBySegmentData, type NpsSectionDetail, type NpsSegmentCell, type SegmentDefinition, type SurveyResults } from '../../modelo/surveyResults'
import { SobreGris } from './arbol-resultados'
import { AvisoSinDemograficos } from './aviso-sin-demograficos'
import { ChipsFiltro, Filtros, LeyendaEscala, Personalizar, SelectorVista, VerPor } from './controles'
import { conSigno, numero } from './escala'
import { useFiltrosResultados } from './filtros'
import { ProfundidadNps, SeccionesNps, SegmentoNps } from './enps-vistas'
import { BotonPantallaCompleta } from './pantalla-completa'
import { TarjetaResumen } from './tarjeta-resumen'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { plural } from '@/modules/design-system/patrones/formato'

// eNPS: ¿nos recomiendan? Arriba el puntaje, de −100 a +100, con el reparto de promotores, neutros
// y detractores (tocar un anillo resalta ese grupo abajo). Tres vistas: por secciones, que va
// primero porque el puntaje global no dice dónde actuar; por segmento; y la profundidad, lo que
// escribió cada banda en su pregunta de seguimiento.

type VistaNps = 'secciones' | 'segmento' | 'profundidad'

const LECTURA = { positive: 'Bueno', warning: 'Neutro', negative: 'Crítico' } as const
const ANILLO_A_BANDA: Record<string, string> = { promoter: 'promotores', passive: 'neutros', detractor: 'detractores' }
const TITULO: Record<VistaNps, string> = {
  secciones: 'Detalle por secciones eNPS',
  segmento: 'eNPS por segmento demográfico',
  profundidad: 'Preguntas de profundidad',
}
const ESCALA_NPS = NPS_SCORE_BANDS.map((banda) => ({ id: banda.id, label: banda.label, range: banda.range, tone: banda.tone }))

const contar = (secciones: readonly NpsSectionDetail[]): number => secciones.reduce((suma, seccion) => suma + seccion.questions.length + contar(seccion.children), 0)

// Sin `segmento` la encuesta no recogió datos demográficos: puntaje total, secciones y profundidad, sin «Por segmento».
type Props = { borrador: SurveyDraft; resultados: SurveyResults; segmento?: SegmentDefinition; onSegmento: (clave: string) => void }

export function Enps({ borrador, resultados, segmento, onSegmento }: Props) {
  const [vista, setVista] = useState<VistaNps>('secciones')
  const [resaltadas, setResaltadas] = useState<ReadonlySet<string>>(() => new Set())

  const segmentos = resultados.segments.filter((opcion) => !opcion.perPerson)
  const activo = segmentos.find((opcion) => opcion.key === segmento?.key) ?? segmentos[0] ?? segmento
  const sinDemograficos = segmentos.length === 0
  const estado = useFiltrosResultados(activo, segmentos, onSegmento)

  const secciones = useMemo(() => npsBySection(resultados, estado.filtros), [resultados, estado.filtros])
  const profundidad = useMemo(() => npsDepthBySection(borrador, resultados, estado.filtros), [borrador, resultados, estado.filtros])
  const cobertura = useMemo(() => npsDepthTotals(profundidad), [profundidad])
  const porSegmento = useMemo(() => (activo ? npsBySegmentData(resultados, activo, estado.filtros) : null), [resultados, activo, estado.filtros])
  const porArea = useMemo(() => {
    const area = segmentos.find((opcion) => opcion.key === 'area') ?? segmentos[0]
    return area ? npsBySegmentData(resultados, area, estado.filtros) : null
  }, [resultados, segmentos, estado.filtros])

  const nps = resultados.nps
  if (!nps) {
    return (
      <PrimeraVez icono="glass-chart" titulo="Esta encuesta no midió recomendabilidad" descripcion="El eNPS aparece cuando la encuesta incluye una pregunta de tipo NPS. Puedes agregarla en la siguiente medición." />
    )
  }

  const tono = toneForNps(nps.score)
  const parte = (valor: number) => (nps.n > 0 ? Math.round((valor / nps.n) * 100) : 0)
  const alternarBanda = (anillo: string) =>
    setResaltadas((actuales) => {
      const banda = ANILLO_A_BANDA[anillo]
      const siguientes = new Set(actuales)
      if (siguientes.has(banda)) siguientes.delete(banda)
      else siguientes.add(banda)
      return siguientes
    })
  const anillo = (id: string, etiqueta: string, valor: number, color: string) => ({
    id,
    etiqueta,
    porcentaje: parte(valor),
    color,
    cantidad: numero(valor),
    activo: resaltadas.has(ANILLO_A_BANDA[id]),
    onAlternar: () => alternarBanda(id),
  })

  // Las áreas más detractoras, sin contar las reservadas.
  const detractoras = porArea
    ? porArea.columns
        .map((columna, indice) => ({ columna, celda: porArea.totalRow.cells[indice] }))
        .filter((fila): fila is { columna: (typeof porArea.columns)[number]; celda: NpsSegmentCell } => fila.celda !== null && !fila.celda.belowThreshold && fila.celda.n > 0)
        .sort((a, b) => a.celda.score - b.celda.score)
        .slice(0, 3)
    : []

  // Todas las vistas arrancan con todos los niveles, preguntas incluidas.
  const nivelesVista = estado.niveles
  const estadoNiveles = estado

  const descripcion =
    vista === 'secciones'
      ? `${contar(secciones)} ${plural(contar(secciones), 'pregunta', 'preguntas')}`
      : vista === 'segmento'
        ? `${porSegmento?.columns.length ?? 0} ${plural(porSegmento?.columns.length ?? 0, 'grupo', 'grupos')}`
        : `${numero(cobertura.answered)} ${plural(cobertura.answered, 'respuesta', 'respuestas')} de ${numero(cobertura.people)} ${plural(cobertura.people, 'persona', 'personas')}${cobertura.coverage === null ? '' : ` · ${cobertura.coverage.toFixed(1).replace('.', ',')} % de cobertura`}`

  // Ver por, filtros, personalizar y la leyenda: en la cabecera de la caja y, igual, dentro de la pantalla completa.
  const controles = (
    <>
      {vista === 'segmento' && activo ? <VerPor segmentos={segmentos} activo={activo} onCambio={estado.cambiarSegmento} /> : null}
      {/* Sin datos demográficos no hay por qué filtrar: el aviso de la pestaña ya lo explica. */}
      {sinDemograficos ? null : (
        <Filtros
          estado={vista === 'segmento' ? estado : { ...estado, filtrables: segmentos }}
          activo={vista === 'segmento' && activo ? activo : { key: '', label: 'el eNPS', preloaded: false, perPerson: false, options: [] }}
        />
      )}
      {/* En Profundidad no hay puntajes que resaltar ni niveles que apagar: sería un menú vacío. */}
      {vista !== 'profundidad' ? (
        <Personalizar
          estado={estadoNiveles}
          escala={ESCALA_NPS}
          resaltadas={resaltadas.size === 0 ? new Set(ESCALA_NPS.map((banda) => banda.id)) : resaltadas}
          onResaltar={(id) =>
            setResaltadas((actuales) => {
              const base = actuales.size === 0 ? new Set(ESCALA_NPS.map((banda) => banda.id)) : new Set(actuales)
              if (base.has(id)) base.delete(id)
              else base.add(id)
              return base.size === ESCALA_NPS.length ? new Set() : base
            })
          }
          onRestablecerResaltado={() => setResaltadas(new Set())}
          ajustesResaltado={resaltadas.size === 0 ? 0 : ESCALA_NPS.length - resaltadas.size}
        />
      ) : null}
      <LeyendaEscala titulo="Escala del eNPS" descripcion="El puntaje va de −100 a +100 y se lee en tres bandas." escala={ESCALA_NPS} />
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Puntaje eNPS"
        ayuda="Es el % de promotores menos el % de detractores, de −100 a +100. Detractores: 0 a 6; neutros: 7 y 8; promotores: 9 y 10."
        cifra={conSigno(nps.score)}
        lectura={LECTURA[tono]}
        pie={`${numero(nps.n)} ${plural(nps.n, 'respuesta', 'respuestas')}`}
        tituloAnillos="Distribución de respuestas"
        totalAnillos={`${numero(nps.n)} en total`}
        anillos={[
          anillo('promoter', 'Promotores', nps.promoters, 'var(--success)'),
          anillo('passive', 'Neutros', nps.passives, 'var(--warning)'),
          anillo('detractor', 'Detractores', nps.detractors, 'var(--destructive)'),
        ]}
        tituloTop={sinDemograficos ? undefined : 'Área más detractora'}
        top={detractoras.map(({ columna, celda }) => ({ id: columna.id, etiqueta: columna.label, valor: Math.max(0, Math.min(100, (100 - celda.score) / 2)), texto: conSigno(celda.score) }))}
        // Como el detalle de «Estado de los invitados»: cada área con su eNPS, de la más detractora a la menos.
        pieTop={detractoras.length > 0 ? detractoras.map(({ columna, celda }) => `${columna.label} ${conSigno(celda.score)}`).join(' · ') : undefined}
        grafico={<MedidorEnps valor={nps.score} ancho={88} cifra={false} />}
      />

            <div className="flex flex-col gap-4">
      {sinDemograficos ? <AvisoSinDemograficos /> : null}
      <Frame spacing="sm" className="[--frame-gap:0px]">
        {/* Cabecera del marco en fila (título a la izquierda, controles a la derecha): con el tema sin capa solo obedece con «!». Ficha: diferencias.json › instalacion-estilos-sin-capa. */}
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <FrameTitle>{TITULO[vista]}</FrameTitle>
            <FrameDescription>{descripcion}</FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* La pastilla del cambio de vista, primer control de la cabecera (Elkin, 9-oct, como el comparativo). */}
            <SelectorVista
              valor={vista}
              onCambio={setVista}
              opciones={[
                { value: 'secciones', label: 'Secciones' },
                // Por segmento compara grupos: sin datos demográficos no hay ninguno.
                ...(sinDemograficos ? [] : [{ value: 'segmento' as const, label: 'Por segmento' }]),
                { value: 'profundidad', label: 'Profundidad' },
              ]}
            />
            {controles}
            {vista === 'segmento' && porSegmento && activo ? (
              <BotonPantallaCompleta titulo={TITULO.segmento} descripcion={descripcion} acciones={controles}>
                {/* Los controles y la leyenda («cómo leer») van en la cabecera de la ventana; aquí, los filtros puestos y la grilla. */}
                <div className="flex flex-col gap-3">
                  {estado.filtros.length > 0 ? <ChipsFiltro estado={estado} segmentos={segmentos} /> : null}
                  <SegmentoNps key={activo.key} datos={porSegmento} niveles={nivelesVista} resaltadas={resaltadas} />
                </div>
              </BotonPantallaCompleta>
            ) : null}
          </div>
        </FrameHeader>
        {estado.filtros.length > 0 ? (
          <FramePanel>
            <ChipsFiltro estado={estado} segmentos={segmentos} />
          </FramePanel>
        ) : null}
        {vista === 'segmento' && porSegmento && activo ? (
          <FramePanel
            // Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita.
            className="p-0!"
          >
            <SegmentoNps key={activo.key} datos={porSegmento} niveles={nivelesVista} resaltadas={resaltadas} />
          </FramePanel>
        ) : (
          <SobreGris>{vista === 'secciones' ? <SeccionesNps secciones={secciones} niveles={nivelesVista} resaltadas={resaltadas} filtrosActivos={estado.filtros.length} onLimpiar={estado.limpiarFiltros} /> : <ProfundidadNps secciones={profundidad} />}</SobreGris>
        )}
      </Frame>
      </div>
    </div>
  )
}
