import { useMemo, useState, type ReactNode } from 'react'
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Item, ItemActions, ItemContent, Progress, Table, TableBody, TableCell, TableHead, TableHeader, Text } from '@ubits/flux-ui'
import { AnilloAvance } from '@/modules/design-system/graficos/piezas'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { Badge } from '@/shared/components/Badge'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { ArbolResultados, SobreGris } from '../../../encuestas/resultados/components/arbol-resultados'
import { LeyendaEscala, SelectorVista } from '../../../encuestas/resultados/components/controles'
import { COLOR_POR_TONO } from '../../../encuestas/resultados/components/escala'
import { FilaDesplegable } from '../../../encuestas/resultados/components/ia-secciones'
import { BotonPantallaCompleta } from '../../../encuestas/resultados/components/pantalla-completa'
import { TarjetaResumen } from '../../../encuestas/resultados/components/tarjeta-resumen'
import { formatoAvance } from '../../modelo/ciclos'
import { arbol, bandaDe, escalaDe, mapa, type NodoCumplimiento, type ObjetivoAgrupado } from '../../modelo/resultados/cumplimiento'
import { avancePorGrupo, estados, nombreCorte, type Corte } from '../../modelo/resultados/lecturas'
import { riesgoDePersona } from '../../modelo/resultados/personas'
import type { PersonaSeguida, ResultadosCiclo } from '../../modelo/resultados/seguimiento'
import { MapaCumplimiento } from './mapa-cumplimiento'
import { EscalaCumplimiento, useEscala } from './escala-cumplimiento'

// La pestaña Cumplimiento (9-oct, como el prototipo): arriba la tarjeta de resumen —el cumplimiento general, en qué
// estado va cada objetivo y los tres grupos con menor avance— y debajo dos lecturas del mismo dato, con la pastilla en la
// cabecera de la caja como en Resultados de Encuestas: el árbol (objetivo de empresa → grupo de «Ver por» → objetivo →
// persona), que se recorre, y el mapa de calor, que se compara. Las dos siguen el «Ver por» y los filtros de arriba.

type Vista = 'arbol' | 'mapa'
const VISTAS: readonly { value: Vista; label: string }[] = [
  { value: 'arbol', label: 'Árbol' },
  { value: 'mapa', label: 'Mapa de calor' },
]

const COMO_LEER = 'Cada cifra es el promedio del cumplimiento de los objetivos de ese cruce; un objetivo sin avance reportado cuenta como 0 %. Un cruce de menos de 3 personas sale reservado.'

/** La cifra de cada rama del árbol: su avance en el color de su tramo y, con el ciclo abierto, su riesgo. */
function Metrica({ nodo, abierto }: { nodo: NodoCumplimiento; abierto: boolean }) {
  const riesgo = riesgoDePersona(nodo.riesgo)
  const escala = useEscala()
  return (
    <div className="flex shrink-0 items-center gap-3">
      {abierto && nodo.riesgo !== 'sin' ? <Badge variant={riesgo.tono}>Riesgo {riesgo.etiqueta.toLowerCase()}</Badge> : null}
      <Progress value={Math.min(100, nodo.avance)} className="hidden w-28 md:flex" aria-label={`Avance ${formatoAvance(nodo.avance)}`} />
      <Text as="span" size="sm" weight="semibold" className="w-14 text-right tabular-nums" style={{ color: COLOR_POR_TONO[bandaDe(nodo.avance, escala).tone] }}>
        {formatoAvance(nodo.avance)}
      </Text>
    </div>
  )
}

/** Los objetivos de un grupo; cada uno se abre en las personas que lo llevan, y el nombre abre su ficha. */
function Objetivos({ objetivos, onAbrir }: { objetivos: readonly ObjetivoAgrupado[]; onAbrir: (persona: PersonaSeguida) => void }) {
  const [abierto, setAbierto] = useState<string | null>(null)
  const escala = useEscala()
  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Objetivo</TableHead>
          <TableHead className="w-24 text-right">Personas</TableHead>
          <TableHead className="w-24 text-right">Avance</TableHead>
          <TableHead className="w-10" aria-label="Detalle" />
        </tr>
      </TableHeader>
      <TableBody>
        {objetivos.map((objetivo) => (
          <FilaDesplegable
            key={objetivo.id}
            abierta={abierto === objetivo.id}
            onAlternar={() => setAbierto(abierto === objetivo.id ? null : objetivo.id)}
            etiqueta={objetivo.titulo}
            columnas={4}
            celdas={
              <>
                {/* «!»: la celda de la librería no parte el texto; el nombre del objetivo va entero, como las preguntas en Encuestas. */}
                <TableCell className="whitespace-normal!">
                  <Text as="span" size="sm" weight="medium">
                    {objetivo.titulo}
                  </Text>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Text as="span" size="sm" variant="muted">
                    {objetivo.entradas.length}
                  </Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text as="span" size="sm" weight="semibold" className="tabular-nums" style={{ color: COLOR_POR_TONO[bandaDe(objetivo.avance, escala).tone] }}>
                    {formatoAvance(objetivo.avance)}
                  </Text>
                </TableCell>
              </>
            }
            detalle={
              <Frame>
                <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
                  <ul className="divide-y">
                    {[...objetivo.entradas]
                      .sort((a, b) => (a.objetivo.cumplimiento ?? -1) - (b.objetivo.cumplimiento ?? -1))
                      .map(({ persona, objetivo: delaPersona }) => (
                        <li key={delaPersona.id}>
                          <Item size="sm">
                            <ItemContent className="min-w-0">
                              <CeldaTitulo titulo={persona.colaborador.name} detalle={`${persona.colaborador.role} · peso ${delaPersona.peso} %`} onClick={() => onAbrir(persona)} />
                            </ItemContent>
                            <ItemActions>
                              <Text as="span" size="sm" weight="medium" variant={delaPersona.cumplimiento === null ? 'muted' : 'default'} className="tabular-nums">
                                {delaPersona.cumplimiento === null ? 'Sin avance' : formatoAvance(delaPersona.cumplimiento)}
                              </Text>
                            </ItemActions>
                          </Item>
                        </li>
                      ))}
                  </ul>
                </FramePanel>
              </Frame>
            }
          />
        ))}
      </TableBody>
    </Table>
  )
}

/** Como Favorabilidad en Encuestas: la tarjeta lee el ciclo entero y los filtros solo acotan la caja de abajo
 *  (`filtrados`), con sus controles (`controles`) en la cabecera y lo filtrado (`chips`) debajo. */
export function Cumplimiento({ resultados, filtrados, corte, controles, chips, onAbrir }: { resultados: ResultadosCiclo; filtrados: ResultadosCiclo; corte: Corte; controles: ReactNode; chips: ReactNode; onAbrir: (persona: PersonaSeguida) => void }) {
  const [vista, setVista] = useState<Vista>('arbol')
  const nodos = useMemo(() => arbol(filtrados, corte), [filtrados, corte])
  const calor = useMemo(() => mapa(filtrados, corte), [filtrados, corte])
  const tramos = estados(resultados)
  const totalObjetivos = tramos.reduce((s, tramo) => s + tramo.cantidad, 0)
  const rezagados = avancePorGrupo(resultados, corte, 'menor').slice(0, 3)
  const grupo = nombreCorte(corte).toLowerCase()
  const plural = nombreCorte(corte)

  const escala = useMemo(() => escalaDe(resultados.niveles), [resultados.niveles])
  const leyenda = <LeyendaEscala titulo="Escala de cumplimiento" descripcion={COMO_LEER} escala={escala} />
  const titulo = vista === 'arbol' ? `Cumplimiento por objetivo de empresa y ${grupo}` : `Mapa de calor por ${grupo}`
  const descripcion = vista === 'arbol' ? `${nodos.length} objetivos de empresa · ${filtrados.objetivos.toLocaleString('es-CO')} objetivos` : `${calor.columnas.length} ${calor.columnas.length === 1 ? 'grupo' : 'grupos'}`

  return (
    <EscalaCumplimiento.Provider value={escala}>
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Cumplimiento general"
        ayuda="El promedio del avance de las personas que reportaron: el de cada persona pondera sus objetivos por su peso. El reparto dice en qué estado va cada objetivo aprobado; los que esperan visto bueno o se devolvieron no entran."
        cifra={formatoAvance(resultados.avanceGeneral)}
        lectura={bandaDe(resultados.avanceGeneral, escala).label}
        pie={`${resultados.enMeta.toLocaleString('es-CO')} de ${resultados.objetivos.toLocaleString('es-CO')} objetivos en meta`}
        grafico={<AnilloAvance valor={Math.min(100, resultados.avanceGeneral)} color="var(--primary)" etiqueta="Cumplimiento general" tamano={48} />}
        tituloAnillos="Estado de los objetivos"
        // Como en el prototipo, el estado se lee solo en los objetivos aprobados: uno que espera visto bueno todavía no cuenta.
        totalAnillos={`${totalObjetivos.toLocaleString('es-CO')} aprobados`}
        anillos={tramos.map((tramo) => ({ id: tramo.id, etiqueta: tramo.etiqueta, porcentaje: totalObjetivos ? Math.round((tramo.cantidad / totalObjetivos) * 100) : 0, color: tramo.color, cantidad: tramo.cantidad.toLocaleString('es-CO') }))}
        tituloTop={`${plural} con menor avance`}
        top={rezagados.length >= 3 ? rezagados.map((fila) => ({ id: fila.id, etiqueta: fila.etiqueta, valor: 100 - Math.min(100, fila.valor), texto: formatoAvance(fila.valor) })) : []}
        sinTop={`Hacen falta al menos tres grupos por ${grupo} para comparar`}
        pieTop={rezagados.length >= 3 ? rezagados.map((fila) => `${fila.etiqueta} ${formatoAvance(fila.valor)}`).join(' · ') : undefined}
      />

      <Frame spacing="sm" className="[--frame-gap:0px]">
        {/* «!»: la misma cabecera en fila de las cajas de Resultados de Encuestas (título a la izquierda, controles a la derecha). */}
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <FrameTitle>{titulo}</FrameTitle>
            <FrameDescription>{descripcion}</FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Como en Favorabilidad: la pastilla de la vista primero, luego «Ver por» y «Filtros», y la leyenda. */}
            <SelectorVista valor={vista} opciones={VISTAS} onCambio={setVista} etiqueta="Cómo se lee el cumplimiento" />
            {controles}
            {leyenda}
            {vista === 'mapa' ? (
              <BotonPantallaCompleta titulo="Mapa de calor" descripcion={`Por ${grupo} · ${descripcion}`} acciones={leyenda}>
                <MapaCumplimiento columnas={calor.columnas} filas={calor.filas} />
              </BotonPantallaCompleta>
            ) : null}
          </div>
        </FrameHeader>
        {chips}
        {nodos.length === 0 ? (
          <FramePanel>
            <PrimeraVez icono="glass-chart" titulo="Sin objetivos que mostrar" descripcion="Con los filtros puestos no queda ningún objetivo en el ciclo." />
          </FramePanel>
        ) : vista === 'arbol' ? (
          <SobreGris>
            <ArbolResultados
              secciones={nodos}
              incluir={(nodo) => nodo.objetivos > 0}
              subtitulo={(nodo) => `${nodo.personas} ${nodo.personas === 1 ? 'persona' : 'personas'} · ${nodo.objetivos} objetivos · ${nodo.reportaron} con avance`}
              metrica={(nodo) => <Metrica nodo={nodo} abierto={filtrados.abierto} />}
              preguntas={(nodo) => <Objetivos objetivos={nodo.questions} onAbrir={onAbrir} />}
            />
          </SobreGris>
        ) : (
          // «!»: el mapa va de borde a borde del panel, como el de Favorabilidad (el panel de la librería trae relleno fijo).
          <FramePanel className="p-0!">
            <MapaCumplimiento columnas={calor.columnas} filas={calor.filas} />
          </FramePanel>
        )}
      </Frame>
    </div>
    </EscalaCumplimiento.Provider>
  )
}
