import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { comentariosPorSeccion, type ComentariosSeccion, type Comparativo } from '../../modelo/comparativo/lectura'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { LeyendaEscala } from '../../resultados/components/controles'
import { COLUMNA_FIJA } from '../../resultados/components/mapa-calor'
import { numero } from '../../resultados/components/escala'
import { DetalleSeccion } from './detalle-seccion'
import { MarcaBase } from './variacion'
import { Cambio } from '@/modules/admin/seleccion/propuestas/components/cifras'

// «Comentarios» del comparativo: qué tanto de lo que la gente escribió en cada sección es positivo,
// medición por medición. La base se lee de sus comentarios reales; cada sección abre su análisis
// cualitativo con el reparto de los tres tonos y los comentarios de la base.

const LEYENDA = [
  { id: 'up', label: 'Más positivo', range: 'sube frente a la base', tone: 'positive' as const },
  { id: 'flat', label: 'Igual', range: 'menos de 0,1 pp', tone: 'nsnr' as const },
  { id: 'down', label: 'Menos positivo', range: 'baja frente a la base', tone: 'negative' as const },
]

export function PestanaComentarios({ comparativo }: { comparativo: Comparativo }) {
  const secciones = useMemo(() => comentariosPorSeccion(comparativo), [comparativo])
  const [abierta, setAbierta] = useState<ComentariosSeccion | null>(null)
  const { columnas, olas } = comparativo
  const base = olas[0]

  if (secciones.length === 0) {
    return <PrimeraVez icono="glass-chat" titulo="Sin comentarios que comparar" descripcion="La encuesta base no tiene preguntas abiertas con respuestas." />

  }

  return (
    <>
      <Frame spacing="sm" className="[--frame-gap:0px]">
        {/* Los «!» ponen la cabecera en fila (título a la izquierda, controles a la derecha): la del marco es una columna y las
            clases normales no le ganan al tema (ficha instalacion-estilos-sin-capa en ai-tools/flux-ui/diferencias.json). */}
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <FrameTitle>Positividad por sección</FrameTitle>
            <FrameDescription>
              {secciones.length} secciones con comentarios abiertos · {numero(secciones.reduce((suma, seccion) => suma + seccion.comentarios.length, 0))} comentarios en {base.shortLabel}
            </FrameDescription>
          </div>
          <LeyendaEscala
            titulo="Cómo leer la positividad"
            descripcion="El porcentaje de comentarios que la IA leyó como positivos en cada sección. En las comparadas, la diferencia frente a la base; n es cuántos comentarios hay detrás."
            escala={LEYENDA}
          />
        </FrameHeader>
        <FramePanel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cn(COLUMNA_FIJA, 'min-w-72')}>Sección</TableHead>
                {columnas.map((columna) => (
                  <TableHead key={columna.id} className="w-44">
                    {/* El nombre completo de la medición en el globo del producto (Hint), no en el del navegador (decisión 16). */}
                    <Hint label={columna.label}>
                      <div className="flex items-center gap-1.5" tabIndex={0}>
                        {columna.shortLabel}
                        {columna.isBase ? <MarcaBase /> : null}
                      </div>
                    </Hint>
                  </TableHead>
                ))}
                <TableHead className="w-10">
                  <span className="sr-only">Ver análisis</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secciones.map((seccion) => {
                const enBase = seccion.porColumna[base.id]
                return (
                  // Como las filas de Accionables: toda la fila abre su análisis y la flecha lo dice.
                  <TableRow key={seccion.numbering} className="group/fila cursor-pointer" onClick={() => setAbierta(seccion)}>
                    <TableCell className={COLUMNA_FIJA}>
                      <div className="flex items-center gap-1.5 whitespace-normal">
                        <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
                          {seccion.numbering}
                        </Text>
                        <Text as="span" size="sm" weight="bold">
                          {seccion.label}
                        </Text>
                      </div>
                    </TableCell>
                    {columnas.map((columna) => {
                      const reparto = seccion.porColumna[columna.id]
                      if (!reparto) return <TableCell key={columna.id}>—</TableCell>
                      return (
                        <TableCell key={columna.id}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <Text as="span" size="sm" weight="semibold" className={columna.isBase ? 'text-primary tabular-nums' : 'tabular-nums'}>
                                {reparto.positivo} %
                              </Text>
                              {columna.isBase || !enBase ? null : <Cambio valor={reparto.positivo - enBase.positivo} sufijo=" pp" decimales={1} frente="la base" enCelda ayuda="Diferencia frente a la base" />}
                            </div>
                            <Text as="span" size="xs" variant="muted" className="tabular-nums">
                              n={numero(reparto.n)}
                            </Text>
                          </div>
                        </TableCell>
                      )
                    })}
                    <TableCell>
                      <BotonIcono
                        size="icon-xs"
                        aria-label={`Ver el análisis de ${seccion.label}`}
                        onClick={(evento) => {
                          evento.stopPropagation()
                          setAbierta(seccion)
                        }}
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                      </BotonIcono>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>
      <DetalleSeccion seccion={abierta} comparativo={comparativo} onCerrar={() => setAbierta(null)} />
    </>
  )
}
