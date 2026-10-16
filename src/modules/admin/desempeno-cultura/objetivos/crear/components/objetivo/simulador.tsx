import { useState } from 'react'
import { Badge, Field, FieldDescription, FieldLabel, FieldTitle, Heading, Item, ItemContent, Text, ToggleGroup, ToggleGroupItem } from '@ubits/flux-ui'
import { MEASURE_META, formatMeasureValue, parseAmount, type MeasureType, type ObjectiveDirection } from '../../../modelo/constructor/cicloBuilderTypes'
import { formatoAvance } from '../../../modelo/ciclos'
import { computeCompliance, type ComplianceResult } from '../../../modelo/constructor/complianceRules'
import { ALLOW_NEGATIVE_RESULTS, findComplianceState, type ComplianceStateTone } from '../../../modelo/constructor/complianceStates'
import { soloCifra } from './formato'
import { CampoCifra } from './piezas'

// Paso 8 · El simulador de cumplimiento («Probar objetivo»): se escribe un resultado de ejemplo, o se elige un atajo,
// y se ve qué cumplimiento daría, en qué estado cae y por qué. Es el `ComplianceSimulator` compacto del prototipo. En
// los de «Se cumple / No se cumple» solo hay dos atajos (0 y 1 sobre una pista de 0 a 1).

const VARIANTE_ESTADO: Record<ComplianceStateTone, 'secondary' | 'destructive-light' | 'warning-light' | 'info-light' | 'success-light'> = {
  neutral: 'secondary',
  negative: 'destructive-light',
  warning: 'warning-light',
  info: 'info-light',
  positive: 'success-light',
}

const redondear = (valor: number) => Math.round(valor * 10) / 10

/** La cifra tal como se escribe en el campo (coma decimal, sin símbolo), la misma que `parseAmount` lee de vuelta. */
const cifraEscrita = (valor: number) => formatMeasureValue(valor, null)

function explicar(resultado: ComplianceResult, medida: MeasureType, aumento: boolean, minimo: number | null, maximo: number | null): string {
  if (resultado.blockedByMinimum && minimo !== null) {
    return aumento
      ? `No alcanza el mínimo de ${formatMeasureValue(minimo, medida)}, así que cuenta como 0 % aunque haya avanzado algo.`
      : `No baja hasta el mínimo de ${formatMeasureValue(minimo, medida)}, así que cuenta como 0 % aunque haya bajado algo.`
  }
  if (resultado.truncatedAtZero) {
    return `El resultado quedó por ${aumento ? 'debajo' : 'encima'} del punto de partida, así que el cumplimiento se muestra como 0 % (nunca negativo).`
  }
  if (ALLOW_NEGATIVE_RESULTS && resultado.percent < 0) {
    return `El resultado quedó por ${aumento ? 'debajo' : 'encima'} del punto de partida: como el módulo admite resultados negativos, el cumplimiento se muestra tal cual, sin truncarse en 0 %.`
  }
  if (resultado.cappedByMaximum && maximo !== null) {
    return `Superó el máximo de ${formatMeasureValue(maximo, medida)}, así que se calcula como si el resultado hubiera sido exactamente ese tope.`
  }
  if (resultado.percent === 100) return 'Alcanzó exactamente el valor de la meta, por lo que el cumplimiento es del 100 %.'
  if (resultado.percent > 100) return 'Superó la meta. El cumplimiento excede el 100 % de forma proporcional al avance extra.'
  if (resultado.percent === 0) return 'No hay avance respecto al valor inicial, por lo que el cumplimiento es del 0 %.'
  return 'El avance se calcula proporcionalmente en el trayecto desde el punto de inicio hacia la meta.'
}

export function Simulador({
  id,
  medida,
  direccion,
  inicio,
  meta,
  minimo,
  maximo,
}: {
  id: string
  medida: MeasureType
  direccion: ObjectiveDirection
  inicio: number
  meta: number
  minimo: number | null
  maximo: number | null
}) {
  const booleano = medida === 'boolean'
  // El ejemplo arranca en la meta; si la meta cambia, vuelve a ella.
  // Las cifras se escriben como se leen: con coma decimal («7,5»). Con punto («7.5») la pantalla lo lee como miles y calcula con 75.
  const [ejemplo, setEjemplo] = useState({ texto: cifraEscrita(meta), de: meta })
  const texto = ejemplo.de === meta ? ejemplo.texto : cifraEscrita(meta)
  const elegir = (valor: string) => setEjemplo({ texto: valor, de: meta })

  const atajos = booleano
    ? [
        { etiqueta: 'No se cumple', valor: 0 },
        { etiqueta: 'Se cumple', valor: 1 },
      ]
    : [
        { etiqueta: 'Sin avanzar', valor: inicio },
        { etiqueta: 'A mitad de camino', valor: inicio + (meta - inicio) / 2 },
        { etiqueta: 'Justo en la meta', valor: meta },
        { etiqueta: 'Más allá de la meta', valor: meta + (meta - inicio) * 0.5 },
        ...(ALLOW_NEGATIVE_RESULTS ? [{ etiqueta: 'Retrocedió', valor: inicio - (meta - inicio) * 0.15 }] : []),
      ]

  const actual = parseAmount(texto)
  const resultado = actual === null ? null : computeCompliance({ direction: direccion, target: meta, initial: inicio, min: minimo, max: maximo, actual, allowNegative: ALLOW_NEGATIVE_RESULTS })
  const porcentaje = resultado === null ? null : redondear(resultado.percent)
  const estado = porcentaje === null ? null : findComplianceState(porcentaje)
  const atajoElegido = atajos.find((atajo) => cifraEscrita(atajo.valor) === texto)

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <Field>
        <FieldLabel htmlFor={`${id}-ejemplo`}>Resultado de ejemplo</FieldLabel>
        {booleano ? <FieldDescription>Elige una de las dos opciones.</FieldDescription> : null}
        <div className="flex flex-col items-start gap-4 w-full">
          {booleano ? null : <CampoCifra id={`${id}-ejemplo`} simbolo={MEASURE_META[medida].symbol} valor={texto} className="w-full max-w-[320px]" onCambio={(valor) => elegir(soloCifra(valor, ALLOW_NEGATIVE_RESULTS))} />}
          <ToggleGroup
            aria-label="Resultados de prueba"
            value={atajoElegido ? [atajoElegido.etiqueta] : []}
            onValueChange={(valor) => {
              const atajo = atajos.find((uno) => uno.etiqueta === valor[0])
              if (atajo) elegir(cifraEscrita(atajo.valor))
            }}
            variant="outline"
            size="sm"
            className="grid grid-cols-2 gap-2 w-full"
          >
            {atajos.map((atajo) => (
              <ToggleGroupItem key={atajo.etiqueta} value={atajo.etiqueta} className="px-3 py-1.5 rounded-md! w-full min-w-0 h-auto! whitespace-normal! text-center justify-center">
                {atajo.etiqueta}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </Field>
      <Field>
        <FieldTitle>Cumplimiento</FieldTitle>
        <Item variant="outline" size="sm" className="bg-card">
          <ItemContent className="flex-row! items-center gap-2">
            {porcentaje !== null ? (
              <>
                <Heading as="h5" level={4} className="tabular-nums">
                  {formatoAvance(porcentaje)}
                </Heading>
                {estado ? (
                  <Badge variant={VARIANTE_ESTADO[estado.tone]} size="sm">
                    {estado.name}
                  </Badge>
                ) : null}
              </>
            ) : (
              <Text as="span" variant="muted">
                --
              </Text>
            )}
          </ItemContent>
        </Item>
        {resultado !== null ? <FieldDescription>{explicar(resultado, medida, direccion === 'increase', minimo, maximo)}</FieldDescription> : null}
      </Field>
    </div>
  )
}
