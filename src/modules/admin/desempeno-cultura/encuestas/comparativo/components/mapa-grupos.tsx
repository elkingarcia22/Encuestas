import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import { Badge, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import type { MapaGrupos } from '../../modelo/comparativo/lectura'
import { formatPercent, type ScaleTone } from '../../modelo/favorabilityScale'
import { FONDO_ESCALA, TEXTO_ESCALA, numero } from '../../resultados/components/escala'
import { COLUMNA_FIJA, LineasGuia, SANGRIA } from '../../resultados/components/mapa-calor'
import { textoVariacion } from './variacion'

// El mapa de calor del comparativo: en la encuesta base, cuánto se aparta cada grupo de la
// favorabilidad de toda la empresa en cada sección. Comparar mediciones es cosa de la tabla; aquí se
// ve dónde está la brecha hoy. Los grupos por debajo del umbral de anonimato no se leen.

// Las cinco bandas de la brecha, en puntos porcentuales: las mismas que explica la leyenda.
export const BANDAS_BRECHA: readonly { id: string; label: string; range: string; tone: ScaleTone; desde: number }[] = [
  { id: 'muy-arriba', label: 'Muy por encima', range: '+5 pp o más', tone: 'deep-positive', desde: 5 },
  { id: 'arriba', label: 'Por encima', range: '+1 a +4,9 pp', tone: 'positive', desde: 1 },
  { id: 'igual', label: 'En el promedio', range: 'entre −1 y +1 pp', tone: 'nsnr', desde: -1 },
  { id: 'abajo', label: 'Por debajo', range: '−1 a −4,9 pp', tone: 'softer-negative', desde: -5 },
  { id: 'muy-abajo', label: 'Muy por debajo', range: '−5 pp o menos', tone: 'negative', desde: -Infinity },
]

const bandaDe = (delta: number) => BANDAS_BRECHA.find((banda) => delta >= banda.desde) ?? BANDAS_BRECHA[BANDAS_BRECHA.length - 1]

// Cada casilla de grupo llena el alto de la fila y se pinta con el color suave de su banda, como en el mapa de calor de
// Favorabilidad › Resultados.
const CELDA = 'h-full min-h-8 w-full m-0 justify-center rounded-sm'

function Casilla({ children }: { children: React.ReactNode }) {
  return (
    <TableCell className="relative h-full min-w-16 p-0 !border-b-0">
      <div className="absolute inset-0 flex flex-col p-0.5 [&>*]:flex-1">{children}</div>
    </TableCell>
  )
}

// Las filas vienen en orden y con su profundidad: una fila «tiene hijas» si la siguiente es más profunda, y se ve si todas
// las secciones de las que cuelga están abiertas. Así el mapa se pliega como el de Resultados.
type FilaMapa = MapaGrupos['filas'][number]

function ancestrosDe(filas: readonly FilaMapa[]): Map<string, string[]> {
  const ancestros = new Map<string, string[]>()
  const pila: FilaMapa[] = []
  for (const fila of filas) {
    while (pila.length > 0 && pila[pila.length - 1].depth >= fila.depth) pila.pop()
    ancestros.set(fila.id, pila.map((padre) => padre.id))
    pila.push(fila)
  }
  return ancestros
}

export function MapaGruposComparativo({ mapa, segmento }: { mapa: MapaGrupos; segmento: string }) {
  const ancestros = useMemo(() => ancestrosDe(mapa.filas), [mapa.filas])
  const conHijas = useMemo(() => new Set(mapa.filas.filter((fila, indice) => (mapa.filas[indice + 1]?.depth ?? 0) > fila.depth).map((fila) => fila.id)), [mapa.filas])
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => {
    const primera = mapa.filas[0]
    if (!primera) return new Set()
    // La primera sección, con todas sus subsecciones abiertas.
    return new Set([primera.id, ...mapa.filas.filter((fila) => ancestros.get(fila.id)?.includes(primera.id) && conHijas.has(fila.id)).map((fila) => fila.id)])
  })
  const alternar = (id: string) => setAbiertas((actuales) => (actuales.has(id) ? new Set([...actuales].filter((otra) => otra !== id)) : new Set([...actuales, id])))
  const visibles = mapa.filas.filter((fila) => (ancestros.get(fila.id) ?? []).every((padre) => abiertas.has(padre)))

  if (mapa.grupos.length === 0) {
    return (
      <PrimeraVez
        icono="glass-chart"
        titulo={`La encuesta base no tiene grupos de ${segmento.toLowerCase()} para leer`}
        descripcion={`Nadie respondió con un grupo de ${segmento.toLowerCase()} en la encuesta base. Elige otro grupo en «Ver por».`}
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <Table className="border-collapse border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className={cn(COLUMNA_FIJA, 'w-80 min-w-80 max-w-80 text-xs tracking-wider uppercase')}>Sección</TableHead>
            <TableHead className="w-20 border-r border-border text-center text-xs tracking-wider uppercase">Empresa</TableHead>
            {mapa.grupos.map((grupo) => (
              <TableHead key={grupo.id} className="min-w-16 px-0.5 py-2 text-center text-xs tracking-wider uppercase">
                {/* Las notas al pasar el cursor, en el globo del producto (Hint) y no en el del navegador (decisión 16 de la auditoría). */}
                <Hint label={grupo.label}>
                  <span className="block max-w-24 truncate">{grupo.label}</span>
                </Hint>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibles.map((fila) => (
            <TableRow key={fila.id} className="group/fila h-[1px] border-transparent !border-b-0 has-aria-expanded:bg-transparent">
              <TableHead scope="row" className={cn(COLUMNA_FIJA, 'w-80 min-w-80 max-w-80 !border-b-0')}>
                <LineasGuia depth={fila.depth} />
                <div className={cn('flex items-center gap-1.5 py-1 whitespace-normal', SANGRIA[Math.min(fila.depth, SANGRIA.length) - 1])}>
                  {conHijas.has(fila.id) ? (
                    <BotonIcono size="icon-xs" aria-expanded={abiertas.has(fila.id)} aria-label={abiertas.has(fila.id) ? `Contraer ${fila.label}` : `Expandir ${fila.label}`} onClick={() => alternar(fila.id)}>
                      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abiertas.has(fila.id) && '-rotate-90')} />
                    </BotonIcono>
                  ) : (
                    <span className="w-6 shrink-0" aria-hidden="true" />
                  )}
                  <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
                    {fila.numbering}
                  </Text>
                  <Text as="span" size={fila.depth === 1 ? 'sm' : 'xs'} weight={fila.depth === 1 ? 'bold' : 'semibold'} className="min-w-0 flex-1">
                    {fila.label}
                  </Text>
                </div>
              </TableHead>
              <TableCell className="w-20 border-r border-border text-center !border-b-0">
                <Text as="span" size="sm" weight="medium" className="tabular-nums">
                  {formatPercent(fila.favorabilidad)}
                </Text>
              </TableCell>
              {fila.celdas.map((celda) => (
                <Casilla key={celda.grupo}>
                  {celda.reservada ? (
                    <Hint label={`Menos de ${mapa.umbral} respuestas: se reserva para proteger el anonimato`}>
                      <Badge variant="secondary" className={CELDA}>
                        <HugeiconsIcon icon={SquareLock02Icon} aria-hidden="true" />
                        <span className="sr-only">Reservado</span>
                      </Badge>
                    </Hint>
                  ) : celda.delta === null ? (
                    <Badge variant="outline" className={CELDA} aria-label="Sin datos">
                      —
                    </Badge>
                  ) : (
                    <Hint label={`${formatPercent(celda.favorabilidad ?? 0)} de favorabilidad · n=${numero(celda.n)}`}>
                      <Badge
                        variant="outline"
                        className={cn(CELDA, 'tabular-nums !border-0')}
                        style={{ backgroundColor: FONDO_ESCALA[bandaDe(celda.delta).tone], color: TEXTO_ESCALA[bandaDe(celda.delta).tone] }}
                      >
                        {textoVariacion(celda.delta, 'pp')}
                      </Badge>
                    </Hint>
                  )}
                </Casilla>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
