import { Heading, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Ajusta, Bloque, Cifras, Documento, Nota, Pie, Portada, SeccionDocumento, hoyReporte } from '../../../encuestas/resultados/descargas/documento'
import { Firmas } from '../../../encuestas/resultados/descargas/reportes-nom035'
import { formatoAvance } from '../../modelo/ciclos'
import { CONFIG_INICIAL, bandaPara, tonoDe } from '../../modelo/configuracion'
import { BLOQUES_CARTA, type PedidoReporte } from '../../modelo/descargas/tipos'
import { estados, nombreCorte, porGrupo } from '../../modelo/resultados/lecturas'
import { MEDIDAS } from '../../modelo/resultados/personas'
import type { PersonaSeguida, ResultadosCiclo } from '../../modelo/resultados/seguimiento'

// Los dos reportes del ciclo en PDF (21-oct, del prototipo), con las piezas de los reportes impresos de Encuestas: se
// dibujan con los componentes de la pantalla y se imprimen. «Progreso del ciclo» es para leer; el «Reporte individual»
// es una hoja por persona para entregarle y firmar. Sin nombre de empresa escrito a mano: el documento es del ciclo.

const parte = (cantidad: number, total: number) => (total > 0 ? `${Math.round((cantidad / total) * 100)} %` : '—')

function alcanceDe(pedido: PedidoReporte, personas: number): string {
  if (pedido.alcance === 'personas') return `${personas.toLocaleString('es-CO')} ${personas === 1 ? 'persona elegida' : 'personas elegidas'}`
  if (pedido.alcance === 'grupos') return `${nombreCorte(pedido.corte)}: ${pedido.grupos.join(', ')}`
  return 'Todo el ciclo'
}

export function ReporteProgreso({ r, pedido }: { r: ResultadosCiclo; pedido: PedidoReporte }) {
  const total = r.personas.length
  const tramos = estados(r)
  const objetivosEnTramos = tramos.reduce((suma, tramo) => suma + tramo.cantidad, 0)
  return (
    <Documento>
      <Portada
        tipo="Progreso del ciclo"
        rotulo={`Generado ${hoyReporte()}`}
        titulo={r.ciclo.nombre}
        corte={alcanceDe(pedido, total)}
        datos={[
          { etiqueta: 'Periodo', valor: `${r.ciclo.inicio} – ${r.ciclo.cierre}` },
          { etiqueta: 'Estado', valor: r.ciclo.estado },
          { etiqueta: 'Personas', valor: total.toLocaleString('es-CO') },
          { etiqueta: 'Objetivos', valor: r.objetivos.toLocaleString('es-CO') },
        ]}
      />

      <SeccionDocumento numero={1} titulo="Cifras del ciclo" junta>
        <Cifras
          cifras={[
            { etiqueta: 'Avance general', valor: formatoAvance(r.avanceGeneral), detalle: 'Promedio de quienes reportaron' },
            { etiqueta: 'Reportaron', valor: `${r.reportaron.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')}`, detalle: parte(r.reportaron, total) },
            { etiqueta: 'En meta', valor: `${r.enMeta.toLocaleString('es-CO')} de ${r.objetivos.toLocaleString('es-CO')}`, detalle: 'Objetivos al 100 % o más' },
            r.abierto
              ? { etiqueta: 'Calendario', valor: `${r.calendario} %`, detalle: `${r.diasRestantes} días para el cierre` }
              : { etiqueta: 'Con conversación', valor: `${r.conConversacion.toLocaleString('es-CO')}`, detalle: 'Objetivos con comentarios' },
          ]}
        />
      </SeccionDocumento>

      <SeccionDocumento numero={2} titulo="Niveles de desempeño" junta>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nivel</TableHead>
              <TableHead>Rango</TableHead>
              <TableHead className="text-right">Personas</TableHead>
              <TableHead className="text-right">Parte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.niveles.map((nivel) => (
              <TableRow key={nivel.id}>
                <TableCell>
                  <Badge variant={nivel.badge}>{nivel.etiqueta}</Badge>
                </TableCell>
                <TableCell>{nivel.rango}</TableCell>
                <TableCell className="text-right tabular-nums">{(r.porNivel[nivel.id] ?? 0).toLocaleString('es-CO')}</TableCell>
                <TableCell className="text-right tabular-nums">{parte(r.porNivel[nivel.id] ?? 0, total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SeccionDocumento>

      <SeccionDocumento numero={3} titulo="Estado de los objetivos" junta>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Objetivos</TableHead>
              <TableHead className="text-right">Parte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tramos.map((tramo) => (
              <TableRow key={tramo.id}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: tramo.color }} />
                    {tramo.etiqueta}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{tramo.cantidad.toLocaleString('es-CO')}</TableCell>
                <TableCell className="text-right tabular-nums">{parte(tramo.cantidad, objetivosEnTramos)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Nota>Solo cuentan los objetivos aprobados: los que esperan visto bueno o se devolvieron no entran.</Nota>
      </SeccionDocumento>

      <SeccionDocumento numero={4} titulo={`Avance por ${nombreCorte(pedido.corte).toLowerCase()}`} junta>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{nombreCorte(pedido.corte)}</TableHead>
              <TableHead className="text-right">Personas</TableHead>
              <TableHead className="text-right">Avance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {porGrupo(r, pedido.corte).map((fila) => (
              <TableRow key={fila.grupo}>
                <TableCell>
                  <Ajusta>{fila.grupo}</Ajusta>
                </TableCell>
                <TableCell className="text-right tabular-nums">{fila.personas.toLocaleString('es-CO')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatoAvance(fila.avance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Nota>Promedio del avance de quienes reportaron, del menor al mayor.</Nota>
      </SeccionDocumento>

      <Pie izquierda={`Progreso del ciclo · ${r.ciclo.nombre}`} derecha={`Generado ${hoyReporte()}`} />
    </Documento>
  )
}

function HojaIndividual({ r, persona, pedido, ultima }: { r: ResultadosCiclo; persona: PersonaSeguida; pedido: PedidoReporte; ultima: boolean }) {
  const config = r.ciclo.draft?.config ?? CONFIG_INICIAL
  const con = (bloque: (typeof BLOQUES_CARTA)[number]['id']) => pedido.bloques.includes(bloque)
  const cumplidos = persona.objetivos.filter((objetivo) => (objetivo.cumplimiento ?? 0) >= 100).length
  return (
    <article className={ultima ? 'flex flex-col gap-6' : 'flex flex-col gap-6 break-after-page'}>
      <Portada
        tipo="Reporte individual"
        rotulo={`Emitido ${hoyReporte()}`}
        titulo={persona.colaborador.name}
        corte={persona.colaborador.role}
        datos={[
          { etiqueta: 'Ciclo', valor: r.ciclo.nombre },
          { etiqueta: 'Periodo', valor: `${r.ciclo.inicio} – ${r.ciclo.cierre}` },
          { etiqueta: 'Área', valor: persona.colaborador.area },
          { etiqueta: 'Líder directo', valor: persona.colaborador.leader ?? 'Sin líder' },
        ]}
      />
      <Text>
        Estimado(a) <strong>{persona.colaborador.name}</strong>: este es el resumen de tus objetivos en <strong>{r.ciclo.nombre}</strong> a la fecha de emisión.
      </Text>

      {con('avance') ? (
        <Bloque titulo="Avance y nivel de desempeño">
          <Cifras
            cifras={[
              { etiqueta: 'Avance', valor: persona.avance === null ? 'Sin avance' : formatoAvance(persona.avance), detalle: 'Ponderado por el peso de cada objetivo' },
              { etiqueta: 'Nivel', valor: persona.nivel.etiqueta, detalle: persona.nivel.rango },
              { etiqueta: 'Objetivos', valor: persona.objetivos.length.toLocaleString('es-CO'), detalle: `${persona.objetivos.filter((objetivo) => objetivo.cumplimiento !== null).length} con avance` },
              { etiqueta: 'Cumplidos', valor: cumplidos.toLocaleString('es-CO'), detalle: 'Al 100 % o más' },
            ]}
          />
        </Bloque>
      ) : null}

      {con('objetivos') ? (
        <Bloque titulo="Detalle por objetivo">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objetivo</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead>Medida</TableHead>
                <TableHead className="text-right">Cumplimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {persona.objetivos.map((objetivo) => {
                const banda = objetivo.cumplimiento === null ? null : bandaPara(objetivo.cumplimiento, config, !r.abierto)
                return (
                  <TableRow key={objetivo.id}>
                    <TableCell>
                      <Ajusta>{objetivo.titulo}</Ajusta>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{objetivo.peso} %</TableCell>
                    <TableCell>{MEDIDAS[objetivo.medida]}</TableCell>
                    <TableCell className="text-right tabular-nums">{objetivo.cumplimiento === null ? 'Sin avance' : formatoAvance(objetivo.cumplimiento)}</TableCell>
                    <TableCell>{banda ? <Badge variant={tonoDe(banda.tono).badge}>{banda.nombre}</Badge> : <Badge variant="outline">{objetivo.cumplimiento === null ? 'Por iniciar' : 'En progreso'}</Badge>}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Bloque>
      ) : null}

      {con('firmas') ? <Firmas persona={persona.colaborador.name} responsable={null} respaldo={{ nombre: persona.colaborador.leader ?? 'Líder directo', detalle: `Líder directo · ${hoyReporte()}` }} /> : null}
    </article>
  )
}

export function ReportesIndividuales({ r, pedido }: { r: ResultadosCiclo; pedido: PedidoReporte }) {
  return (
    <Documento>
      {r.personas.length === 0 ? <Heading level={2}>Nadie entra en este reporte</Heading> : null}
      {r.personas.map((persona, i) => (
        <HojaIndividual key={persona.id} r={r} persona={persona} pedido={pedido} ultima={i === r.personas.length - 1} />
      ))}
    </Documento>
  )
}
