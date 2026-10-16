import { Avatar, AvatarFallback, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { ROWS, type Candidate } from './data'

// Tabla del agente: un criterio por fila y una columna por finalista; «Mejor» en el valor más alto de la fila.
// Es una matriz de comparación, no un listado de registros: se queda con la Table de la librería y no pasa a
// TablaDatos (auditoría 5-oct: la tabla única es para listados con conteo, buscador y paginador).
export function ComparisonTable({ candidates, className }: { candidates: Candidate[]; className?: string }) {
  return (
    // Con el panel angosto la tabla se desplaza de lado: el desplazamiento va en este marco (no en el de la librería) para
    // que se pueda enfocar y mover con las flechas del teclado.
    <div
      role="region"
      aria-label="Comparación de finalistas"
      tabIndex={0}
      className={cn(
        'overflow-x-auto rounded-[12px] border outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_[data-slot=table-container]]:overflow-visible!',
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4! text-muted-foreground!">Criterio</TableHead>
            {candidates.map((candidate) => (
              <TableHead key={candidate.id}>
                <div className="flex items-center gap-2">
                  <Avatar size="sm" aria-hidden="true">
                    <AvatarFallback>{candidate.initials}</AvatarFallback>
                  </Avatar>
                  {candidate.first}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => {
            const best = Math.max(...candidates.map((candidate) => row.values[candidate.id].score))
            return (
              <TableRow key={row.label}>
                {/* Encabezado de fila: cada valor se lee con su criterio y su finalista. Se ve igual que una celda. */}
                <TableHead scope="row" className="h-auto! py-2.5! pl-4! font-normal! text-muted-foreground!">
                  {row.label}
                </TableHead>
                {candidates.map((candidate) => {
                  const value = row.values[candidate.id]
                  const isBest = value.score === best
                  return (
                    <TableCell key={candidate.id} className="py-2.5!">
                      <div className="flex items-center gap-1.5">
                        <span className={isBest ? 'font-medium' : 'text-foreground/80'}>{value.text}</span>
                        {isBest ? (
                          <Badge variant="secondary" size="xs">
                            Mejor
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
