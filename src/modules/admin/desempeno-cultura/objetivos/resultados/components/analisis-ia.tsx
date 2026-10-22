import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Progress, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { AnilloAvance } from '@/modules/design-system/graficos/piezas'
import { AiThinking } from '@/shared/components/AiThinking'
import { Badge } from '@/shared/components/Badge'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { FallaIa } from '../../../encuestas/components/falla-ia'
import { CONFIDENCE_LEGEND } from '../../../encuestas/modelo/insightConfidence'
import { BloquePlegable, SobreGris } from '../../../encuestas/resultados/components/arbol-resultados'
import { LeyendaEscala } from '../../../encuestas/resultados/components/controles'
import { GrupoLecturas, ResumenGeneral } from '../../../encuestas/resultados/components/ia-secciones'
import { TarjetaResumen } from '../../../encuestas/resultados/components/tarjeta-resumen'
import { formatoAvance } from '../../modelo/ciclos'
import { MINIMO_CORTE, analizar, type BrechaCorte } from '../../modelo/resultados/analisis'
import { avancePorGrupo, nombreCorte, type Corte } from '../../modelo/resultados/lecturas'
import type { ResultadosCiclo } from '../../modelo/resultados/seguimiento'

// La pestaña Análisis con IA (9-oct, como el prototipo y con la forma de la de Resultados de Encuestas): la tarjeta de
// resumen con cuántas lecturas hizo la IA, y debajo el marco «Lectura de la IA» con el resumen general, los bloques de
// hallazgos, riesgos y qué hacer (cada lectura se abre en su explicación y su evidencia) y las brechas entre grupos.
// Re-analizar vuelve a leer el ciclo con los filtros puestos.

type Tipo = 'finding' | 'risk' | 'recommendation'
const TIPOS: readonly { id: Tipo; titulo: string; pregunta: string; anillo: string; color: string }[] = [
  { id: 'finding', titulo: 'Hallazgos', pregunta: 'qué está pasando en el ciclo', anillo: 'Hallazgos', color: 'var(--primary)' },
  { id: 'risk', titulo: 'Riesgos', pregunta: 'qué está en juego si no se atiende', anillo: 'Riesgos', color: 'var(--destructive)' },
  { id: 'recommendation', titulo: 'Qué hacer', pregunta: 'por dónde empezar', anillo: 'Acciones sugeridas', color: 'var(--success)' },
]
const PASOS = ['Leyendo el avance de cada persona…', 'Comparando el avance con el calendario…', 'Buscando brechas entre grupos…', 'Revisando aprobaciones y conversaciones…']
const MS_PASO = 200

function Brechas({ numero, brechas }: { numero: number; brechas: readonly BrechaCorte[] }) {
  return (
    <BloquePlegable id="brechas" numero={String(numero)} titulo="Brechas entre grupos" subtitulo={`Dónde se separa el avance (grupos de ${MINIMO_CORTE} personas o más)`} metrica={<Text as="span" size="xs" variant="muted" weight="medium">{brechas.length} {brechas.length === 1 ? 'corte' : 'cortes'}</Text>} abiertoAlInicio={false}>
      {brechas.length === 0 ? (
        <Text as="p" size="sm" variant="muted" className="py-2">
          No hay grupos de {MINIMO_CORTE} personas o más para comparar.
        </Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Por</TableHead>
              <TableHead>Más rezagado</TableHead>
              <TableHead>Más adelantado</TableHead>
              <TableHead className="w-24 text-right">Brecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brechas.map((fila) => (
              <TableRow key={fila.corte}>
                <TableCell>
                  <Text as="span" size="sm" weight="medium">
                    {fila.etiqueta}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text as="span" size="sm">
                    {fila.bajo.grupo} · {formatoAvance(fila.bajo.avance)}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text as="span" size="sm">
                    {fila.alto.grupo} · {formatoAvance(fila.alto.avance)}
                  </Text>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={fila.brecha >= 15 ? 'destructive-light' : fila.brecha >= 5 ? 'warning-light' : 'outline'} className="tabular-nums">
                    {fila.brecha.toLocaleString('es-CO')} pts
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </BloquePlegable>
  )
}

export function AnalisisIa({ resultados, corte }: { resultados: ResultadosCiclo; corte: Corte }) {
  const [analizando, setAnalizando] = useState(false)
  const [avance, setAvance] = useState(0)
  // Como en Encuestas (IA-031): si la IA no responde, la pestaña queda en el vacío de falla, sin nada de lo que ella hizo,
  // y «Reintentar» lo vuelve a pedir. Se ve con `?simular=falla-ia`: el primer «Re-analizar» falla; el reintento sí sale.
  const [parametros] = useSearchParams()
  const simulaFalla = (parametros.get('simular') ?? '').split(',').includes('falla-ia')
  const [fallo, setFallo] = useState(false)
  const yaFallo = useRef(false)
  const reloj = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearInterval(reloj.current), [])

  const analisis = useMemo(() => analizar(resultados), [resultados])
  const total = analisis.lecturas.length
  const porTipo = (tipo: Tipo) => analisis.lecturas.filter((lectura) => lectura.kind === tipo).length
  const solidas = total ? Math.round((analisis.lecturas.filter((lectura) => lectura.confidence === 'high').length / total) * 100) : 0
  const grupos = TIPOS.map((tipo) => ({ ...tipo, lecturas: analisis.lecturas.filter((lectura) => lectura.kind === tipo.id) })).filter((grupo) => grupo.lecturas.length > 0)
  const focos = avancePorGrupo(resultados, corte, 'menor')
    .slice(0, 3)
    .map((fila) => ({ id: fila.id, etiqueta: fila.etiqueta, valor: 100 - Math.min(100, fila.valor), texto: formatoAvance(fila.valor) }))

  const reanalizar = () => {
    setAnalizando(true)
    setAvance(0)
    window.clearInterval(reloj.current)
    reloj.current = window.setInterval(() => {
      setAvance((previo) => {
        const siguiente = Math.min(100, previo + 12)
        if (siguiente >= 100) {
          window.clearInterval(reloj.current)
          window.setTimeout(() => {
            const falla = simulaFalla && !yaFallo.current
            if (falla) yaFallo.current = true
            setAnalizando(false)
            setFallo(falla)
          }, 500)
        }
        return siguiente
      })
    }, MS_PASO)
  }
  const paso = PASOS[Math.min(PASOS.length - 1, Math.floor(avance / 25))]

  if (fallo)
    return (
      <Frame spacing="sm">
        <FrameHeader>
          <div className="flex items-center gap-2">
            <IconoIA />
            <FrameTitle>Lectura de la IA</FrameTitle>
          </div>
        </FrameHeader>
        <FramePanel>
          {analizando ? (
            <div className="flex flex-col gap-3 py-4">
              <AiThinking label={paso} />
              <Progress value={avance} aria-label="Avance del análisis" />
            </div>
          ) : (
            <FallaIa titulo="No pudimos completar el análisis" descripcion="La IA no respondió. Vuelve a intentarlo en un momento." onReintentar={reanalizar} />
          )}
        </FramePanel>
      </Frame>
    )

  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Lecturas de la IA"
        ayuda="Cuántas lecturas hizo la IA sobre el ciclo y de qué tipo. Cada una viaja con la cifra que la sostiene: alta viene de un número del ciclo; media, de un grupo mediano; baja, de muy pocas personas, y conviene confirmarla."
        cifra={total.toLocaleString('es-CO')}
        pie={`${solidas} % con confiabilidad alta`}
        grafico={<AnilloAvance valor={solidas} color="var(--primary)" etiqueta="Confiabilidad alta" tamano={48} />}
        tituloAnillos="Qué contiene la lectura"
        totalAnillos={`${total.toLocaleString('es-CO')} en total`}
        anillos={TIPOS.map((tipo) => ({ id: tipo.id, etiqueta: tipo.anillo, porcentaje: Math.round((porTipo(tipo.id) / Math.max(total, 1)) * 100), color: tipo.color, cantidad: porTipo(tipo.id).toLocaleString('es-CO') }))}
        tituloTop={`${nombreCorte(corte)} donde enfocarse`}
        top={focos}
        pieTop={focos.length ? focos.map((foco) => `${foco.etiqueta} ${foco.texto}`).join(' · ') : undefined}
      />

      <Frame spacing="sm" className="[--frame-gap:0px]">
        {/* «!»: la misma cabecera en fila de las cajas de Resultados de Encuestas (título a la izquierda, controles a la derecha). */}
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <div className="flex items-center gap-2">
              <IconoIA />
              <FrameTitle>Lectura de la IA</FrameTitle>
            </div>
            <FrameDescription>
              {total} {total === 1 ? 'lectura' : 'lecturas'} sobre {resultados.personas.length.toLocaleString('es-CO')} personas
            </FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BotonIaSecundario size="sm" onClick={reanalizar} disabled={analizando}>
              {analizando ? 'Analizando…' : 'Re-analizar'}
            </BotonIaSecundario>
            <LeyendaEscala
              titulo="Confiabilidad de la lectura"
              descripcion="Cada lectura dice qué tan firme es la cifra en la que se apoya: alta, de 20 personas o más; media, de 8 a 19; baja, de menos de 8. Las bajas conviene confirmarlas en las demás pestañas."
              escala={CONFIDENCE_LEGEND.map((nivel) => ({ ...nivel, range: nivel.label, label: nivel.range }))}
            />
          </div>
        </FrameHeader>
        <SobreGris>
          {analizando ? (
            <FramePanel>
              <div className="flex flex-col gap-3 py-4">
                <AiThinking label={paso} />
                <Progress value={avance} aria-label="Avance del análisis" />
              </div>
            </FramePanel>
          ) : (
            <div className="flex flex-col gap-3">
              <ResumenGeneral texto={analisis.resumen} origen="Generado a partir de los resultados de este ciclo" />
              {grupos.map((grupo, indice) => (
                <GrupoLecturas key={grupo.id} id={grupo.id} numero={indice + 1} titulo={grupo.titulo} pregunta={grupo.pregunta} lecturas={grupo.lecturas} />
              ))}
              <Brechas numero={grupos.length + 1} brechas={analisis.brechas} />
            </div>
          )}
        </SobreGris>
      </Frame>
    </div>
  )
}
