import { Fragment, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, LockIcon } from '@hugeicons/core-free-icons'
import { Badge, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { COLUMNA_FIJA, LineasGuia, SANGRIA } from '../../../encuestas/resultados/components/mapa-calor'
import { COLOR_POR_TONO, FONDO_ESCALA, TEXTO_ESCALA } from '../../../encuestas/resultados/components/escala'
import { formatoAvance } from '../../modelo/ciclos'
import { bandaDe, type CeldaMapa, type FilaMapa } from '../../modelo/resultados/cumplimiento'
import { MINIMO_GRUPO } from '../../modelo/resultados/ranking'

// Cumplimiento › Mapa de calor (9-oct): el mismo mapa que Favorabilidad en Encuestas —la primera columna fija, el total
// a su lado y una celda de color por grupo—, con la escala del cumplimiento. Una fila por objetivo de empresa, que se abre
// en sus objetivos. Un cruce de menos de tres personas sale reservado, con candado.

function Celda({ celda, fila, grupo }: { celda: CeldaMapa; fila: string; grupo: string }) {
  const nombre = `${fila} · ${grupo}`
  if (celda.avance === null) {
    return (
      <Hint label="Nadie de este grupo lleva este objetivo">
        <Badge variant="outline" className="m-0 h-full min-h-8 w-full justify-center rounded-sm" aria-label={`${nombre}: sin objetivos`}>
          —
        </Badge>
      </Hint>
    )
  }
  if (celda.reservada) {
    return (
      <Hint label={`Reservado · ${celda.personas} ${celda.personas === 1 ? 'persona' : 'personas'}: con menos de ${MINIMO_GRUPO} sería el resultado de una sola.`}>
        <Badge variant="secondary" className="m-0 h-full min-h-8 w-full justify-center rounded-sm" aria-label={`${nombre}: reservado`}>
          <HugeiconsIcon icon={LockIcon} aria-hidden="true" />
        </Badge>
      </Hint>
    )
  }
  const banda = bandaDe(celda.avance)
  return (
    <Hint label={`${banda.label} · ${celda.personas} personas`}>
      <Badge variant="outline" className="m-0 h-full min-h-8 w-full justify-center rounded-sm !border-0 tabular-nums" style={{ backgroundColor: FONDO_ESCALA[banda.tone], color: TEXTO_ESCALA[banda.tone] }}>
        {formatoAvance(celda.avance)}
      </Badge>
    </Hint>
  )
}

function Fila({ fila, columnas, abiertas, onAlternar }: { fila: FilaMapa; columnas: readonly string[]; abiertas: ReadonlySet<string>; onAlternar: (id: string) => void }) {
  const abierta = abiertas.has(fila.id)
  const raiz = fila.nivel === 1
  return (
    <>
      <TableRow className="group/fila h-[1px] border-transparent !border-b-0">
        <TableHead scope="row" className={cn(COLUMNA_FIJA, 'w-80 min-w-80 !border-b-0')}>
          <LineasGuia depth={fila.nivel} />
          <div className={cn('flex items-center gap-1.5 py-1 whitespace-normal', SANGRIA[fila.nivel - 1])}>
            {raiz && fila.hijas.length > 0 ? (
              <BotonIcono size="icon-xs" aria-expanded={abierta} aria-label={abierta ? `Contraer ${fila.etiqueta}` : `Expandir ${fila.etiqueta}`} onClick={() => onAlternar(fila.id)}>
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
              </BotonIcono>
            ) : (
              <span className="w-6 shrink-0" aria-hidden="true" />
            )}
            <Text as="span" size={raiz ? 'sm' : 'xs'} weight={raiz ? 'bold' : 'normal'} className="min-w-0 flex-1">
              {fila.etiqueta}
            </Text>
          </div>
        </TableHead>
        <TableCell className="w-20 border-r border-border text-center !border-b-0">
          <span className="text-sm font-medium tabular-nums" style={{ color: COLOR_POR_TONO[bandaDe(fila.total).tone] }}>
            {formatoAvance(fila.total)}
          </span>
        </TableCell>
        {fila.celdas.map((celda, indice) => (
          <TableCell key={columnas[indice]} className="relative h-full min-w-16 p-0 !border-b-0">
            <div className="absolute inset-0 flex flex-col p-0.5 [&>*]:flex-1 [&_button]:h-full [&_button]:w-full">
              <Celda celda={celda} fila={fila.etiqueta} grupo={columnas[indice] ?? ''} />
            </div>
          </TableCell>
        ))}
      </TableRow>
      {abierta ? fila.hijas.map((hija) => <Fila key={hija.id} fila={hija} columnas={columnas} abiertas={abiertas} onAlternar={onAlternar} />) : null}
    </>
  )
}

export function MapaCumplimiento({ columnas, filas }: { columnas: readonly string[]; filas: readonly FilaMapa[] }) {
  // Arranca cerrado, solo con los objetivos de empresa: abiertos, casi todos los cruces de un objetivo por grupo son de
  // menos de tres personas y salen reservados, y la primera lectura se volvía una pared de candados.
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => new Set())
  const alternar = (id: string) =>
    setAbiertas((actuales) => {
      const siguientes = new Set(actuales)
      if (siguientes.has(id)) siguientes.delete(id)
      else siguientes.add(id)
      return siguientes
    })
  return (
    <div className="overflow-x-auto">
      <Table className="border-collapse border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className={cn(COLUMNA_FIJA, 'w-80 min-w-80 text-xs tracking-wider uppercase')}>Objetivo</TableHead>
            <TableHead className="w-20 border-r border-border text-center text-xs tracking-wider uppercase">Total</TableHead>
            {columnas.map((columna) => (
              <TableHead key={columna} className="min-w-16 px-0.5 py-2 text-center text-xs tracking-wider uppercase">
                <Hint label={columna}>
                  <span className="mx-auto block w-20 truncate" tabIndex={0}>
                    {columna}
                  </span>
                </Hint>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <Fragment key={fila.id}>
              <Fila fila={fila} columnas={columnas} abiertas={abiertas} onAlternar={alternar} />
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
