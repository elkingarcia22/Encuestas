import { useMemo, useState } from 'react'
import { Badge, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { AiThinking } from '@/shared/components/AiThinking'
import { Hint } from '@/shared/components/Hint'
import { FallaIa } from '../../components/falla-ia'
import { Tendencia } from '../../components/graficos'
import { lecturaIa, type Confianza, type TipoHallazgo } from '../../modelo/comparativo/lectura-ia'
import type { Comparativo } from '../../modelo/comparativo/lectura'
import { fallaEnQA } from '../../modelo/surveyCasos'
import { BloquePlegable, SobreGris } from '../../resultados/components/arbol-resultados'
import { Dato, FilaDesplegable, Numero, ResumenGeneral, useAbiertas } from '../../resultados/components/ia-secciones'

// «Insights IA» del comparativo, con la misma forma que Análisis con IA en Resultados: un marco «Lectura de la IA» y,
// sobre el gris, el resumen y los bloques plegables. Los hallazgos van en tabla y cada fila se abre sobre su evidencia
// y su impacto. Todo sale de las cifras del mismo comparativo.

const TIPO: Record<TipoHallazgo, { texto: string; variante: 'success-light' | 'destructive-outline' | 'info-light' | 'secondary' }> = {
  mejora: { texto: 'Mejora', variante: 'success-light' },
  riesgo: { texto: 'Riesgo', variante: 'destructive-outline' },
  oportunidad: { texto: 'Oportunidad', variante: 'info-light' },
  recomendacion: { texto: 'Recomendación', variante: 'secondary' },
}
// Las mismas insignias de confiabilidad que Análisis con IA (las de contorno verde y amarillo no llegan al contraste).
const CONFIANZA: Record<Confianza, { texto: string; variante: 'success-light' | 'warning-light' | 'outline' }> = {
  alta: { texto: 'Alta', variante: 'success-light' },
  media: { texto: 'Media', variante: 'warning-light' },
  baja: { texto: 'Baja', variante: 'outline' },
}

// Caso IA-039: con la encuesta que falla en QA la IA no logra generar la lectura. Solo cambia esta pestaña: el resumen,
// las secciones y los comentarios siguen igual. Va el vacío de falla de la IA (FallaIa), sin nada que ella haya hecho, y
// «Reintentar» vuelve a pedirla.
const ESPERA_REINTENTO_MS = 1400

function LecturaFallida({ comparativo }: { comparativo: Comparativo }) {
  const [reintentando, setReintentando] = useState(false)
  const reintentar = () => {
    setReintentando(true)
    setTimeout(() => setReintentando(false), ESPERA_REINTENTO_MS)
  }
  return (
    <Frame spacing="sm">
      <FrameHeader>
        <div className="flex items-center gap-2">
          <IconoIA />
          <FrameTitle>Lectura de la IA</FrameTitle>
        </div>
        <FrameDescription>Sobre las {comparativo.columnas.length} encuestas comparadas</FrameDescription>
      </FrameHeader>
      <FramePanel>
        {reintentando ? (
          <div className="flex justify-center py-10">
            <AiThinking label="Generando la lectura" size="md" />
          </div>
        ) : (
          <FallaIa titulo="No pudimos generar la lectura de la IA" descripcion="La IA no respondió. El resto del comparativo sigue disponible; vuelve a intentarlo en un momento." onReintentar={reintentar} />
        )}
      </FramePanel>
    </Frame>
  )
}

export function PestanaInsights({ comparativo }: { comparativo: Comparativo }) {
  return fallaEnQA(...comparativo.columnas.map((columna) => columna.id)) ? <LecturaFallida comparativo={comparativo} /> : <LecturaComparativo comparativo={comparativo} />
}

function LecturaComparativo({ comparativo }: { comparativo: Comparativo }) {
  const lectura = useMemo(() => lecturaIa(comparativo), [comparativo])
  const proyectadas = lectura.proyeccion.filter((punto) => !punto.real)
  const [abiertas, alternar] = useAbiertas(lectura.hallazgos[0] ? [lectura.hallazgos[0].id] : [])
  const niveles = (['alta', 'media', 'baja'] as const).map((nivel) => ({ nivel, cuantos: lectura.hallazgos.filter((hallazgo) => hallazgo.confianza === nivel).length })).filter((fila) => fila.cuantos > 0)
  const metrica = lectura.metrica.nombre === 'eNPS' ? 'el eNPS' : 'la favorabilidad'

  return (
    <Frame spacing="sm" className="[--frame-gap:0px]">
      <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
        <div>
          <div className="flex items-center gap-2">
            <IconoIA />
            <FrameTitle>Lectura de la IA</FrameTitle>
            <Badge variant="secondary" size="sm" className="tabular-nums">
              {lectura.hallazgos.length}
            </Badge>
          </div>
          <FrameDescription>Sobre las {comparativo.columnas.length} encuestas comparadas</FrameDescription>
        </div>
      </FrameHeader>
      <SobreGris>
        <div className="flex flex-col gap-3">
          <ResumenGeneral texto={lectura.resumen} origen={`Generado a partir de las ${comparativo.columnas.length} encuestas comparadas`} />

          <BloquePlegable
            id="hallazgos"
            numero="1"
            titulo="Hallazgos de alto impacto"
            subtitulo="Qué cambió entre las mediciones, cuánto pesa y en qué se apoya"
            metrica={
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Text as="span" size="xs" variant="muted" weight="medium">
                  {lectura.hallazgos.length} {lectura.hallazgos.length === 1 ? 'hallazgo' : 'hallazgos'}
                </Text>
                {niveles.map(({ nivel, cuantos }) => (
                  <Hint key={nivel} label={`Confiabilidad ${nivel}`}>
                    <Badge variant={CONFIANZA[nivel].variante} size="sm" className="tabular-nums" tabIndex={0}>
                      {cuantos} {nivel}
                    </Badge>
                  </Hint>
                ))}
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Hallazgo</TableHead>
                  <TableHead className="w-36">Tipo</TableHead>
                  <TableHead className="w-32">Confiabilidad</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Ver detalle</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lectura.hallazgos.map((hallazgo, indice) => (
                  <FilaDesplegable
                    key={hallazgo.id}
                    abierta={abiertas.has(hallazgo.id)}
                    onAlternar={() => alternar(hallazgo.id)}
                    columnas={5}
                    etiqueta={hallazgo.titulo}
                    celdas={
                      <>
                        <Numero n={indice + 1} />
                        <TableCell className="whitespace-normal!">
                          <Text as="span" size="sm" weight="medium">
                            {hallazgo.titulo}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Badge variant={TIPO[hallazgo.tipo].variante} size="sm">
                            {TIPO[hallazgo.tipo].texto}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={CONFIANZA[hallazgo.confianza].variante} size="sm">
                            {CONFIANZA[hallazgo.confianza].texto}
                          </Badge>
                        </TableCell>
                      </>
                    }
                    detalle={
                      <>
                        <Text as="p" size="sm" className="text-pretty">
                          {hallazgo.cuerpo}
                        </Text>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Dato nombre="Evidencia">{hallazgo.evidencia}</Dato>
                          <Dato nombre="Impacto">{hallazgo.impacto}</Dato>
                        </div>
                      </>
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </BloquePlegable>

          <BloquePlegable id="proyeccion" numero="2" titulo={`Hacia dónde va ${metrica}`} subtitulo={`La tendencia de las mediciones comparadas, proyectada ${proyectadas.length} mediciones hacia adelante si nada cambia`}>
            <div className="flex flex-col gap-3">
              <div className="h-40">
                <Tendencia etiqueta={lectura.metrica.nombre === 'eNPS' ? 'eNPS' : 'Favorabilidad'} puntos={lectura.proyeccion.map((punto) => ({ id: punto.etiqueta, name: punto.etiqueta, value: punto.valor }))} meta={lectura.metrica.meta} color="var(--primary)" formato={lectura.metrica.formato} />
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                {lectura.proyeccion.map((punto) => (
                  <div key={punto.etiqueta} className="flex flex-col items-center gap-0.5">
                    <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                      {lectura.metrica.formato(punto.valor)}
                    </Text>
                    <Text as="span" size="xs" variant="muted">
                      {punto.etiqueta}
                    </Text>
                    {punto.real ? null : (
                      <Badge variant="outline" size="xs">
                        Proyección
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <Text size="xs" variant="muted" className="text-pretty">
                Es una recta ajustada a las mediciones comparadas ({lectura.metrica.diferencia(lectura.pendiente)} por medición), no una predicción: sirve para ver si el ritmo actual alcanza la meta de{' '}
                {lectura.metrica.formato(lectura.metrica.meta)}.
              </Text>
            </div>
          </BloquePlegable>
        </div>
      </SobreGris>
    </Frame>
  )
}
