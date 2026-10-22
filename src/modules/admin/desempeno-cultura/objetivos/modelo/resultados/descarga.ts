import { blankRow, dataRow, fileStamp, headRow, hintRow, titleRow, workbook, type SheetSpec } from '../../../encuestas/modelo/descargas/libro'
import { formatoAvance } from '../ciclos'
import { CONFIG_INICIAL, bandaPara } from '../configuracion'
import { nombreCorte, porGrupo, type Corte } from './lecturas'
import { ETAPAS, MEDIDAS, haceCuanto, riesgoDePersona, ultimaDe } from './personas'
import { OBJETIVOS_EMPRESA, type ResultadosCiclo } from './seguimiento'

// Los dos reportes del ciclo en Excel (21-oct, del prototipo), con el mismo libro con estilo de Encuestas (SpreadsheetML,
// sin dependencias) y las mismas cifras que la pantalla:
// - «Detalle del ciclo»: una fila por objetivo de cada persona, con su estado según las bandas del ciclo.
// - «Estado por colaborador»: una fila por persona, con su nivel; y el avance por el grupo de «Ver por».

const redondo = (valor: number) => Math.round(valor * 10) / 10
const fecha = (valor: Date | null) => (valor ? valor.toISOString().slice(0, 10) : '—')

function encabezado(titulo: string, r: ResultadosCiclo, total: number, de: string): SheetSpec['rows'] {
  return [titleRow(`${titulo} · ${r.ciclo.nombre}`), hintRow(`${r.ciclo.periodo} · ${r.ciclo.inicio} – ${r.ciclo.cierre} · ${total.toLocaleString('es-CO')} ${de} · Generado ${fileStamp()}`), blankRow]
}

/** «Detalle del ciclo»: una hoja con una fila por objetivo de cada persona del reporte. */
export function libroDetalle(r: ResultadosCiclo): string {
  const config = r.ciclo.draft?.config ?? CONFIG_INICIAL
  const empresa = (id: string | null) => OBJETIVOS_EMPRESA.find((objetivo) => objetivo.id === id)?.titulo ?? 'Sin alinear'
  const filas = r.personas.flatMap((p) => p.objetivos.map((o) => ({ p, o })))
  const hoja: SheetSpec = {
    name: 'Objetivos',
    columns: [120, 170, 130, 150, 240, 200, 60, 90, 90, 100, 130, 80, 110],
    rows: [
      ...encabezado('Detalle del ciclo', r, filas.length, 'objetivos'),
      headRow(['Usuario', 'Colaborador', 'Área', 'Líder', 'Objetivo', 'Objetivo de empresa', 'Peso %', 'Medida', 'Etapa', 'Cumplimiento %', 'Estado', 'Comentarios', 'Última actualización']),
      ...filas.map(({ p, o }, i) =>
        dataRow(i, [
          { value: p.colaborador.username },
          { value: p.colaborador.name },
          { value: p.colaborador.area },
          { value: p.colaborador.leader ?? 'Sin líder' },
          { value: o.titulo },
          { value: empresa(o.empresa) },
          { value: o.peso },
          { value: MEDIDAS[o.medida] },
          { value: ETAPAS[o.etapa].etiqueta },
          { value: o.cumplimiento === null ? null : redondo(o.cumplimiento) },
          { value: o.cumplimiento === null ? 'Por iniciar' : (bandaPara(o.cumplimiento, config, !r.abierto)?.nombre ?? 'En progreso') },
          { value: o.comentarios },
          { value: fecha(o.ultimaActualizacion) },
        ]),
      ),
    ],
  }
  return workbook([hoja])
}

/** «Estado por colaborador»: una fila por persona y, aparte, el avance por el grupo de «Ver por». */
export function libroEstado(r: ResultadosCiclo, corte: Corte): string {
  const personas: SheetSpec = {
    name: 'Colaboradores',
    columns: [120, 170, 150, 130, 150, 80, 90, 90, 80, 110, 90, 110],
    rows: [
      ...encabezado('Estado por colaborador', r, r.personas.length, 'personas'),
      headRow(['Usuario', 'Colaborador', 'Rol', 'Área', 'Líder', 'Objetivos', 'Con avance', 'Cumplidos', 'Avance %', 'Nivel', 'Riesgo', 'Último reporte']),
      ...r.personas.map((p, i) =>
        dataRow(i, [
          { value: p.colaborador.username },
          { value: p.colaborador.name },
          { value: p.colaborador.role },
          { value: p.colaborador.area },
          { value: p.colaborador.leader ?? 'Sin líder' },
          { value: p.objetivos.length },
          { value: p.objetivos.filter((o) => o.cumplimiento !== null).length },
          { value: p.objetivos.filter((o) => (o.cumplimiento ?? 0) >= 100).length },
          { value: p.avance === null ? null : redondo(p.avance) },
          { value: p.nivel.etiqueta },
          { value: r.abierto ? riesgoDePersona(p.riesgo).etiqueta : '—' },
          { value: haceCuanto(ultimaDe(p)) },
        ]),
      ),
    ],
  }
  const grupo = nombreCorte(corte)
  const grupos: SheetSpec = {
    name: `Por ${grupo.toLowerCase()}`,
    columns: [200, 90, 90],
    rows: [
      titleRow(`Avance por ${grupo.toLowerCase()}`),
      hintRow(`Promedio del avance de quienes reportaron, del menor al mayor. Avance general: ${formatoAvance(r.avanceGeneral)}.`),
      blankRow,
      headRow([grupo, 'Personas', 'Avance %']),
      ...porGrupo(r, corte).map((fila, i) => dataRow(i, [{ value: fila.grupo }, { value: fila.personas }, { value: redondo(fila.avance) }])),
    ],
  }
  return workbook([personas, grupos])
}
