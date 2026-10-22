import { Progress } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { formatMeasureValue, type MeasureType } from '../../../modelo/constructor/cicloBuilderTypes'

// La pista del objetivo con sus marcadores «Inicio», «Piso», «Meta» y «Techo». No hay una barra con marcadores en la
// librería, así que se compone: Progress pinta el tramo de la salida a la meta, y cada marcador es una Badge colgada
// en su posición (la posición es lo único que va en `style`, porque sale del cálculo). Inicio y meta van debajo; piso
// y techo, encima. Dos marcadores en el mismo valor se juntan («Piso y Meta»), y si dos quedan muy cerca el segundo
// baja a otra fila para no taparse. Es el `RangeVisual` del prototipo con piezas de flux-ui.

type Marcador = { clave: string; etiqueta: string; valor: number; posicion: number; variante: 'outline' | 'primary-light' | 'destructive-light' | 'secondary' }

const CHOQUE = 15
const MISMO_VALOR = 1e-6

function juntar(marcadores: Marcador[]): Marcador[] {
  const vistos = new Set<string>()
  const juntos: Marcador[] = []
  for (const marcador of marcadores) {
    if (vistos.has(marcador.clave)) continue
    const grupo = marcadores.filter((otro) => Math.abs(otro.valor - marcador.valor) <= MISMO_VALOR)
    grupo.forEach((miembro) => vistos.add(miembro.clave))
    const conMeta = grupo.find((miembro) => miembro.clave === 'meta')
    juntos.push(grupo.length === 1 ? marcador : { ...marcador, clave: grupo.map((m) => m.clave).join('+'), etiqueta: grupo.map((m) => m.etiqueta).join(' y '), variante: conMeta ? 'primary-light' : marcador.variante })
  }
  return juntos
}

// A cada marcador, la primera fila donde no choca con el anterior.
function enFilas(marcadores: Marcador[]): { marcador: Marcador; fila: number }[] {
  const finales: number[] = []
  return [...marcadores]
    .sort((a, b) => a.posicion - b.posicion)
    .map((marcador) => {
      let fila = finales.findIndex((ultimo) => marcador.posicion - ultimo >= CHOQUE)
      if (fila === -1) {
        fila = finales.length
        finales.push(marcador.posicion)
      } else finales[fila] = marcador.posicion
      return { marcador, fila }
    })
}

function BloqueMarcadores({ marcadores, medida, arriba }: { marcadores: Marcador[]; medida: MeasureType; arriba: boolean }) {
  if (marcadores.length === 0) return null
  const ubicados = enFilas(juntar(marcadores))
  const filas = Math.max(1, ...ubicados.map((u) => u.fila + 1))
  return (
    <div className="flex flex-col relative w-full">
      {Array.from({ length: filas }, (_, indice) => (arriba ? filas - 1 - indice : indice)).map((fila) => (
        <div key={fila} className="relative h-8">
          {ubicados
            .filter((u) => u.fila === fila)
            .map(({ marcador }) => (
              <div
                key={marcador.clave}
                className={`absolute flex flex-col items-center justify-end ${arriba ? 'bottom-0' : 'top-0'}`}
                style={{ left: `${marcador.posicion}%`, transform: 'translateX(-50%)' }}
              >
                {arriba ? (
                  <>
                    <Badge variant={marcador.variante} size="xs" className="whitespace-nowrap tabular-nums z-10 bg-background shadow-xs">
                      {marcador.etiqueta} {formatMeasureValue(marcador.valor, medida)}
                    </Badge>
                    {fila === 0 ? <div className="w-0.5 h-2.5 bg-muted-foreground/30 mt-1" /> : <div className="w-0.5 h-2.5 opacity-0 mt-1" />}
                  </>
                ) : (
                  <>
                    {fila === 0 ? <div className="w-0.5 h-2.5 bg-muted-foreground/30 mb-1" /> : <div className="w-0.5 h-2.5 opacity-0 mb-1" />}
                    <Badge variant={marcador.variante} size="xs" className="whitespace-nowrap tabular-nums z-10 bg-background shadow-xs">
                      {marcador.etiqueta} {formatMeasureValue(marcador.valor, medida)}
                    </Badge>
                  </>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

export function BarraLimites({ medida, inicio, meta, minimo, maximo }: { medida: MeasureType; inicio: number; meta: number; minimo: number | null; maximo: number | null }) {
  const tramo = meta - inicio
  const avanceDe = (valor: number) => (tramo === 0 ? 0 : (valor - inicio) / tramo)
  const crudoMin = minimo === null ? 0 : avanceDe(minimo)
  const crudoMax = maximo === null ? 1 : avanceDe(maximo)
  
  // No necesitamos aire extra a la derecha porque ahora el contenedor tiene padding real (`px-6`).
  // El dominio es el máximo de (inicio=0, meta=1, piso, techo).
  const dominio = Math.max(1, crudoMax, crudoMin)
  const en = (avance: number) => Math.max(0, Math.min(1, avance / dominio)) * 100

  const abajo: Marcador[] = [
    { clave: 'inicio', etiqueta: 'Inicio', valor: inicio, posicion: en(0), variante: 'outline' },
    { clave: 'meta', etiqueta: 'Meta', valor: meta, posicion: en(1), variante: 'primary-light' },
  ]
  const arriba: Marcador[] = [
    ...(minimo !== null ? [{ clave: 'piso', etiqueta: 'Piso', valor: minimo, posicion: en(crudoMin), variante: 'destructive-light' as const }] : []),
    ...(maximo !== null ? [{ clave: 'techo', etiqueta: 'Techo', valor: maximo, posicion: en(crudoMax), variante: 'secondary' as const }] : []),
  ]

  return (
    <figure className="flex flex-col relative w-full pt-4 pb-2 px-6 mt-4" aria-label="Pista del objetivo con sus límites">
      <BloqueMarcadores marcadores={arriba} medida={medida} arriba />
      <Progress value={Math.round(en(1))} aria-label="Tramo de la salida a la meta" className="relative z-0" />
      <BloqueMarcadores marcadores={abajo} medida={medida} arriba={false} />
    </figure>
  )
}
