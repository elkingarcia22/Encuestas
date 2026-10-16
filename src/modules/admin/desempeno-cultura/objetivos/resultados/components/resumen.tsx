import { useState } from 'react'
import { Progress, Text } from '@ubits/flux-ui'
import { ColumnaIndicador, DetalleIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { AnilloAvance } from '@/modules/design-system/graficos/piezas'
import { QueMide } from '../../../encuestas/components/que-mide'
import { TarjetaResumen } from '../../../encuestas/resultados/components/tarjeta-resumen'
import { formatoAvance } from '../../modelo/ciclos'
import { findComplianceState } from '../../modelo/constructor/complianceStates'
import { NIVELES, type ResultadosCiclo } from '../../modelo/resultados/seguimiento'
import { parseSurveyDate } from '../../../encuestas/modelo/surveyListDates'
import { SelectorVista } from '../../../encuestas/resultados/components/controles'
import { alineacionPersonas, alineacionPorGrupo, aprobacion, avancePorGrupo, estados, nombreCorte, pesoPorEmpresa, pesoPorGrupo, porGrupo, porLider, riesgo, ritmoSemanal, tiposDeMedida, type Corte, type Dimension } from '../../modelo/resultados/lecturas'
import { Barras, Bloque, Panel, Reparto } from './bloques'
import { Pendientes } from './pendientes'

// Resultados › Resumen (primera parte, 9-oct): «Avance general del ciclo» con la tarjeta de resumen de Resultados de
// Encuestas (la cifra con su anillo, el reparto por niveles de cumplimiento y las tres áreas con menor avance) y, debajo,
// «Cuánto del ciclo está vivo» con la fila de indicadores del home: reportes, objetivos en meta y conversación. Después,
// como en el prototipo: pendientes, «¿Va a llegar?», «Cómo van los objetivos», «Dónde se está jugando el ciclo»,
// «Alineación con la estrategia» y «Con qué se mide y cuándo se mueve».

const parte = (valor: number, total: number) => (total === 0 ? 0 : Math.round((valor / total) * 1000) / 10)
const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-CO')} ${n === 1 ? uno : varios}`

/** El estado que resuelve el avance general. Con el ciclo abierto se lee en curso («En progreso»); cerrado, por su resultado. */
function lecturaDe(resultados: ResultadosCiclo): string {
  const avance = Math.round(resultados.avanceGeneral)
  if (resultados.abierto) return avance >= 100 ? 'Cumplido' : avance > 0 ? 'En progreso' : 'Por iniciar'
  const estados = findComplianceState(avance)
  return estados?.name ?? 'Sin reportes'
}

const DIA = 86_400_000

/** Días corridos de los totales y cuántos puntos va el avance por delante o por detrás del calendario. */
function TiempoDelCiclo({ resultados }: { resultados: ResultadosCiclo }) {
  const inicio = parseSurveyDate(resultados.ciclo.inicio)
  const cierre = parseSurveyDate(resultados.ciclo.cierre)
  const totales = inicio && cierre ? Math.max(1, Math.round((cierre.getTime() - inicio.getTime()) / DIA)) : 0
  const corridos = Math.round((resultados.calendario / 100) * totales)
  const diferencia = Math.round(resultados.avanceGeneral - resultados.calendario)
  return (
    <Panel titulo="Tiempo del ciclo" detalle={`${corridos} de ${totales} días corridos`}>
      <div className="flex flex-col gap-2">
        <Progress value={Math.min(100, resultados.avanceGeneral)} aria-label={`Avance ${formatoAvance(resultados.avanceGeneral)}`} />
        <div className="flex justify-between gap-2">
          <Text as="span" size="xs" variant="muted">
            Avance {formatoAvance(resultados.avanceGeneral)}
          </Text>
          <Text as="span" size="xs" variant="muted">
            Calendario {resultados.calendario}%
          </Text>
        </div>
      </div>
      <Text as="p" size="sm">
        {!resultados.abierto
          ? `El ciclo cerró con ${formatoAvance(resultados.avanceGeneral)} de avance.`
          : diferencia === 0
            ? 'El avance va al ritmo del calendario.'
            : `El avance va ${Math.abs(diferencia)} ${Math.abs(diferencia) === 1 ? 'punto' : 'puntos'} ${diferencia > 0 ? 'por delante' : 'por detrás'} del calendario.`}
      </Text>
    </Panel>
  )
}

export function Resumen({ resultados, corte, onTramo }: { resultados: ResultadosCiclo; corte: Corte; onTramo: (dimension: Dimension, tramo: string, etiqueta: string) => void }) {
  const { ciclo, personas, porNivel } = resultados
  const porArea = porGrupo(resultados, corte).map((fila) => ({ area: fila.grupo, avance: fila.avance, personas: fila.personas }))
  const grupo = nombreCorte(corte)
  const grupoMinuscula = grupo.toLowerCase()
  const total = personas.length
  const [orden, setOrden] = useState<'menor' | 'mayor'>('menor')
  const aprobacionTramos = aprobacion(resultados)
  const aprobados = aprobacionTramos.find((tramo) => tramo.id === 'aprobado')?.cantidad ?? 0
  const pesoEmpresa = pesoPorEmpresa(resultados)
  const alineacion = alineacionPorGrupo(resultados, corte)

  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Avance general del ciclo"
        ayuda="Es el promedio del avance de las personas que reportaron. El avance de cada persona pondera sus objetivos por su peso: un objetivo que pesa 40 % mueve el doble que uno de 20 %."
        cifra={formatoAvance(resultados.avanceGeneral)}
        lectura={lecturaDe(resultados)}
        pie={
          resultados.abierto
            ? `${resultados.calendario}% del calendario corrido · ${plural(resultados.diasRestantes, 'día restante', 'días restantes')}`
            : `Cerró el ${ciclo.cierre} · ${plural(total, 'persona', 'personas')}`
        }
        grafico={<AnilloAvance valor={Math.min(100, resultados.avanceGeneral)} color="var(--primary)" etiqueta="Avance general" tamano={48} />}
        tituloAnillos="Niveles de cumplimiento"
        totalAnillos={`${total.toLocaleString('es-CO')} personas`}
        anillos={NIVELES.map((nivel) => ({ id: nivel.id, etiqueta: nivel.etiqueta, porcentaje: parte(porNivel[nivel.id], total), color: nivel.color, cantidad: porNivel[nivel.id].toLocaleString('es-CO') }))}
        tituloTop={`${grupo} con menor avance`}
        // Como el prototipo: el top solo tiene sentido con tres áreas o más para comparar.
        top={porArea.length >= 3 ? porArea.slice(0, 3).map((fila) => ({ id: fila.area, etiqueta: fila.area, valor: 100 - Math.min(100, fila.avance), texto: formatoAvance(fila.avance) })) : []}
        sinTop={`Hacen falta al menos tres grupos por ${grupoMinuscula} para comparar`}
        pieTop={porArea.length >= 3 ? porArea.slice(0, 3).map((fila) => `${fila.area} ${formatoAvance(fila.avance)}`).join(' · ') : undefined}
      />

      <Pendientes resultados={resultados} />

      <FilaIndicadores etiqueta="Cuánto del ciclo está vivo">
        <ColumnaIndicador
          titulo="Reportaron avance"
          ayuda={<QueMide etiqueta="Reportaron avance" texto="Personas del ciclo con al menos un objetivo con avance reportado, sobre todas las personas del ciclo." />}
          cifra={formatoAvance(parte(resultados.reportaron, total))}
          grafico={<AnilloAvance valor={parte(resultados.reportaron, total)} color="var(--primary)" etiqueta="Reportaron avance" tamano={48} />}
          pie={<DetalleIndicador>{`${resultados.reportaron.toLocaleString('es-CO')} de ${plural(total, 'persona', 'personas')}`}</DetalleIndicador>}
        />
        <ColumnaIndicador
          titulo="Objetivos en meta"
          ayuda={<QueMide etiqueta="Objetivos en meta" texto="Objetivos que ya llegaron al 100 % de su meta (o la pasaron), sobre todos los objetivos del ciclo." />}
          cifra={formatoAvance(parte(resultados.enMeta, resultados.objetivos))}
          grafico={<AnilloAvance valor={parte(resultados.enMeta, resultados.objetivos)} color="var(--success)" etiqueta="Objetivos en meta" tamano={48} />}
          pie={<DetalleIndicador>{`${resultados.enMeta.toLocaleString('es-CO')} de ${plural(resultados.objetivos, 'objetivo', 'objetivos')}`}</DetalleIndicador>}
        />
        <ColumnaIndicador
          titulo="Objetivos con conversación"
          ayuda={<QueMide etiqueta="Objetivos con conversación" texto="Objetivos con al menos un comentario entre la persona y su líder, sobre todos los objetivos del ciclo." />}
          cifra={formatoAvance(parte(resultados.conConversacion, resultados.objetivos))}
          grafico={<AnilloAvance valor={parte(resultados.conConversacion, resultados.objetivos)} color="var(--primary)" etiqueta="Objetivos con conversación" tamano={48} />}
          pie={<DetalleIndicador>{`${resultados.conConversacion.toLocaleString('es-CO')} de ${plural(resultados.objetivos, 'objetivo', 'objetivos')}`}</DetalleIndicador>}
        />
      </FilaIndicadores>

      <Bloque titulo="¿Va a llegar?" descripcion="El avance frente al calendario, quién va atrasado y qué objetivos esperan visto bueno." columnas={resultados.abierto ? 3 : 2}>
        <TiempoDelCiclo resultados={resultados} />
        {resultados.abierto ? (
          <Panel titulo="Riesgo" detalle="Qué tan atrás va cada persona frente al calendario">
            <Reparto tramos={riesgo(resultados)} total={String(total)} onTramo={(tramo) => onTramo('riesgo', tramo.id, tramo.etiqueta)} />
          </Panel>
        ) : null}
        <Panel titulo="Aprobación de objetivos" detalle="Un objetivo sin revisión cuenta como aprobado">
          <Reparto tramos={aprobacionTramos} total={String(resultados.objetivos)} onTramo={(tramo) => onTramo('aprobacion', tramo.id, tramo.etiqueta)} />
        </Panel>
      </Bloque>

      {resultados.abierto ? (
        <Bloque titulo="Aprobaciones pendientes" descripcion="Quién tiene objetivos esperando y quién los devolvió para ajustar.">
          <Panel titulo="Aprobaciones pendientes por líder">
            <Barras filas={porLider(resultados, 'por-aprobar')} formato={formatoAvance} vacio="Ningún líder tiene objetivos esperando visto bueno." />
          </Panel>
          <Panel titulo="Devueltos sin corregir, por líder">
            <Barras filas={porLider(resultados, 'por-ajustar')} formato={formatoAvance} vacio="Nada devuelto esperando corrección." />
          </Panel>
        </Bloque>
      ) : null}

      <Bloque titulo="Cómo van los objetivos" descripcion={`El estado de los objetivos aprobados y el avance por ${grupoMinuscula}.`}>
        <Panel titulo="Estado de los objetivos" detalle={`${aprobados.toLocaleString('es-CO')} aprobados`}>
          <Reparto tramos={estados(resultados)} total={String(aprobados)} onTramo={(tramo) => onTramo('estado', tramo.id, tramo.etiqueta)} />
        </Panel>
        <Panel
          titulo={`Avance por ${grupoMinuscula}`}
          detalle={resultados.abierto ? `Calendario corrido: ${resultados.calendario}%` : undefined}
          extra={
            <SelectorVista
              etiqueta="Orden"
              valor={orden}
              onCambio={setOrden}
              opciones={[
                { value: 'menor', label: 'Menor avance' },
                { value: 'mayor', label: 'Mayor avance' },
              ]}
            />
          }
        >
          <Barras filas={avancePorGrupo(resultados, corte, orden)} formato={formatoAvance} vacio="Nadie reportó avance todavía." />
        </Panel>
      </Bloque>

      <Bloque titulo="Dónde se está jugando el ciclo" descripcion={`Cómo se reparte el peso de los objetivos por ${grupoMinuscula} y entre los objetivos de empresa.`}>
        <Panel titulo={`Reparto del peso por ${grupoMinuscula}`}>
          <Barras filas={pesoPorGrupo(resultados, corte)} formato={formatoAvance} />
        </Panel>
        <Panel titulo="Peso por objetivo de empresa">
          <Reparto tramos={pesoEmpresa} total="100%" unidad={() => ''} />
        </Panel>
      </Bloque>

      <Bloque titulo="Alineación con la estrategia" descripcion="Cuánto del esfuerzo cuelga de un objetivo de empresa.">
        <Panel titulo="Colaboradores por alineación">
          <Reparto tramos={alineacionPersonas(resultados)} total={String(total)} onTramo={(tramo) => onTramo('alineacion', tramo.id, tramo.etiqueta)} />
        </Panel>
        <Panel titulo={`Alineación por ${grupoMinuscula}`} detalle={`Promedio del ciclo: ${formatoAvance(alineacion.promedio)}`}>
          <Barras filas={alineacion.filas} formato={formatoAvance} />
        </Panel>
      </Bloque>

      <Bloque titulo="Con qué se mide y cuándo se mueve" descripcion="Los tipos de medida de los objetivos y qué días se reporta avance.">
        <Panel titulo="Tipo de medida">
          <Reparto tramos={tiposDeMedida(resultados)} total={String(resultados.objetivos)} onTramo={(tramo) => onTramo('medida', tramo.id, tramo.etiqueta)} />
        </Panel>
        <Panel titulo="Ritmo de actividad" detalle="Avances reportados por día de la semana">
          <Barras filas={ritmoSemanal(resultados)} formato={(valor) => `${Math.round(valor)}%`} />
        </Panel>
      </Bloque>
    </div>
  )
}
