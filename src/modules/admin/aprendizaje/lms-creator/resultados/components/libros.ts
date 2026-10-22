import { blankRow, dataRow, headRow, hintRow, titleRow, workbook, type SheetSpec } from '@/modules/admin/desempeno-cultura/encuestas/modelo/descargas/libro'
import { fecha, fechaHora, leerEvaluacion, porcentaje, type Resultados } from './datos'
import { TOTAL_RECURSOS } from './temario'

// Los libros de Excel que entrega el panel de descargas.
//
// Se arman con el mismo constructor que usa Resultados de encuestas (`modelo/descargas/libro`): su hoja de estilos, sus
// filas de título y cabecera, su manera de poner la fila cebra. Un XLSX de esta pantalla y uno de aquella tienen que
// abrirse igual, y mantener dos generadores en paralelo acabaría con dos formatos distintos (Dave, 13-oct).

/** La cabecera que lleva toda hoja: de qué contenido es y cuándo se sacó. */
const encabezado = (resultados: Resultados, titulo: string) => [
  titleRow(titulo),
  hintRow(`${resultados.contenido.titulo} · ${resultados.contenido.tipo}`),
  hintRow(`Generado el ${fecha(new Date().toISOString().slice(0, 10))} · ${resultados.iniciaron} personas lo han iniciado`),
  // El periodo va en la hoja, no solo en la pantalla: un archivo sacado con un mes puesto llega al correo de alguien
  // que no vio el filtro, y sin esta línea lo lee como si fuera todo (Dave, 14-oct).
  hintRow(`Periodo: ${resultados.periodo.etiqueta}`),
  blankRow,
]

/** Progreso: una fila por persona, con su avance y su nota. */
function hojaProgreso(resultados: Resultados): SheetSpec {
  const evaluaciones = resultados.datos.evaluaciones
  return {
    name: 'Progreso',
    columns: [190, 190, 90, 90, 90, 70, 80],
    rows: [
      ...encabezado(resultados, 'Progreso por persona'),
      headRow(['Nombre', 'Correo', 'Estado', 'Inicio', 'Finalización', 'Avance', 'Nota final']),
      ...resultados.datos.colaboradores.map((persona, indice) => {
        const hechos = Math.round((persona.progresoPercent / 100) * TOTAL_RECURSOS)
        const avance = TOTAL_RECURSOS === 0 ? 0 : (hechos / TOTAL_RECURSOS) * 100
        let suma = 0
        let peso = 0
        for (const evaluacion of evaluaciones) {
          const lectura = leerEvaluacion(persona.evaluaciones[evaluacion.id], evaluacion)
          if (lectura.logrado == null) continue
          suma += lectura.logrado * evaluacion.peso
          peso += evaluacion.peso
        }
        return dataRow(indice, [
          { value: persona.nombre },
          { value: persona.email },
          { value: avance >= 100 ? 'Completado' : avance > 0 ? 'En progreso' : 'Sin empezar' },
          { value: fecha(persona.fechaInicio) },
          { value: persona.fechaFin ? fecha(persona.fechaFin) : 'No ha finalizado' },
          { value: Math.round(avance) },
          { value: peso === 0 ? null : Math.round(suma / peso) },
        ])
      }),
    ],
  }
}

/** Evaluaciones: una columna por evaluación, con el resultado de cada persona. */
function hojaEvaluaciones(resultados: Resultados): SheetSpec {
  const evaluaciones = resultados.datos.evaluaciones
  return {
    name: 'Evaluaciones',
    columns: [190, 190, ...evaluaciones.flatMap(() => [110, 90]), 80],
    rows: [
      ...encabezado(resultados, 'Resultados de evaluaciones'),
      headRow(['Nombre', 'Correo', ...evaluaciones.flatMap((evaluacion) => [`${evaluacion.nombre} · estado`, `${evaluacion.nombre} · %`]), 'Nota final']),
      ...resultados.datos.colaboradores.map((persona, indice) => {
        let suma = 0
        let peso = 0
        const celdas = evaluaciones.flatMap((evaluacion) => {
          const lectura = leerEvaluacion(persona.evaluaciones[evaluacion.id], evaluacion)
          if (lectura.logrado != null) {
            suma += lectura.logrado * evaluacion.peso
            peso += evaluacion.peso
          }
          return [{ value: lectura.estado }, { value: lectura.logrado == null ? null : Math.round(lectura.logrado) }]
        })
        return dataRow(indice, [{ value: persona.nombre }, { value: persona.email }, ...celdas, { value: peso === 0 ? null : Math.round(suma / peso) }])
      }),
    ],
  }
}

/** Las condiciones de cada evaluación: lo mismo que enseña «Cómo se califica». */
function hojaCondiciones(resultados: Resultados): SheetSpec {
  return {
    name: 'Condiciones',
    columns: [190, 80, 100, 80, 90, 90],
    rows: [
      ...encabezado(resultados, 'Condiciones de las evaluaciones'),
      headRow(['Evaluación', 'Peso', 'Aprueba con', 'Intentos', 'Tiempo límite', 'Preguntas']),
      ...resultados.datos.evaluaciones.map((evaluacion, indice) =>
        dataRow(indice, [
          { value: evaluacion.nombre },
          { value: `${evaluacion.peso}%` },
          { value: evaluacion.porcentajeAprobar == null ? 'Cualquier resultado' : `${evaluacion.porcentajeAprobar}%` },
          { value: evaluacion.limiteIntentos == null ? 'Sin límite' : evaluacion.limiteIntentos },
          { value: evaluacion.tiempoLimiteMinutos == null ? 'Sin límite' : `${evaluacion.tiempoLimiteMinutos} min` },
          { value: evaluacion.totalPreguntas },
        ]),
      ),
    ],
  }
}

/** Quién se quedó sin intentos. */
function hojaBloqueos(resultados: Resultados): SheetSpec {
  return {
    name: 'Sin intentos',
    columns: [190, 190, 190, 110],
    rows: [
      ...encabezado(resultados, 'Personas sin intentos'),
      headRow(['Nombre', 'Correo', 'Evaluación', 'Se bloqueó el']),
      ...resultados.datos.bloqueos.map((bloqueo, indice) =>
        dataRow(indice, [{ value: bloqueo.nombre }, { value: bloqueo.email }, { value: bloqueo.evaluacionNombre }, { value: fecha(bloqueo.fechaBloqueo) }]),
      ),
    ],
  }
}

/** Roleplay: una fila por intento, con sus objetivos. */
function hojaRoleplay(resultados: Resultados): SheetSpec {
  const objetivos = resultados.intentos[0]?.objetivos.map((objetivo) => objetivo.titulo) ?? []
  return {
    name: 'Roleplay',
    columns: [190, 190, 140, 70, 110, ...objetivos.map(() => 150)],
    rows: [
      ...encabezado(resultados, 'Intentos de roleplay'),
      headRow(['Nombre', 'Correo', 'Fecha del intento', 'Intento', 'Resultado', ...objetivos]),
      ...resultados.intentos.map((intento, indice) =>
        dataRow(indice, [
          { value: intento.nombre },
          { value: intento.email },
          { value: fechaHora(intento.fecha) },
          { value: intento.intento },
          { value: intento.aprobado ? 'Aprobado' : 'No aprobado' },
          ...intento.objetivos.map((objetivo) => ({ value: objetivo.alcanzado ? 'Alcanzado' : 'No alcanzado' })),
        ]),
      ),
    ],
  }
}

/** La transcripción de cada intento, una fila por mensaje. */
function hojaConversaciones(resultados: Resultados): SheetSpec {
  const filas = resultados.intentos.flatMap((intento) =>
    intento.conversacion.map((mensaje) => ({
      persona: intento.nombre,
      intento: intento.intento,
      hora: mensaje.hora,
      quien: mensaje.de === 'estudiante' ? intento.nombre : 'Personaje',
      texto: mensaje.texto,
    })),
  )
  return {
    name: 'Conversaciones',
    columns: [190, 70, 70, 150, 420],
    rows: [
      ...encabezado(resultados, 'Conversaciones del roleplay'),
      headRow(['Persona', 'Intento', 'Hora', 'Quién habla', 'Mensaje']),
      ...filas.map((fila, indice) =>
        dataRow(indice, [{ value: fila.persona }, { value: fila.intento }, { value: fila.hora }, { value: fila.quien }, { value: fila.texto, style: 'wrap' }], { autoFitHeight: true }),
      ),
    ],
  }
}

/** Asistencias: una fila por persona y sesión. */
function hojaAsistencias(resultados: Resultados): SheetSpec {
  const asistencias = resultados.datos.asistencias ?? []
  return {
    name: 'Asistencias',
    columns: [190, 150, 260, 140, 150],
    rows: [
      ...encabezado(resultados, 'Asistencia a las sesiones'),
      headRow(['Nombre', 'Usuario', 'Sesión', 'Cómo se confirmó', 'Fecha']),
      ...asistencias.map((asistencia, indice) =>
        dataRow(indice, [
          { value: asistencia.usuario },
          { value: asistencia.username },
          { value: asistencia.sesion },
          { value: asistencia.modo === 'Autoconfirmación' ? 'La persona' : 'Carga manual' },
          { value: asistencia.confirmadoAt ? fechaHora(asistencia.confirmadoAt) : 'Sin confirmar' },
        ]),
      ),
    ],
  }
}

/** La satisfacción, nota por nota. */
function hojaSatisfaccion(resultados: Resultados): SheetSpec | null {
  const satisfaccion = resultados.satisfaccion
  if (!satisfaccion) return null
  return {
    name: 'Satisfacción',
    columns: [120, 110, 110],
    rows: [
      ...encabezado(resultados, 'Encuesta de satisfacción'),
      hintRow(`Promedio ${satisfaccion.promedio.toFixed(1)} de 5 · ${satisfaccion.respuestas} respuestas`),
      blankRow,
      headRow(['Nota', 'Respuestas', 'Porcentaje']),
      ...satisfaccion.reparto.map((cuantos, indice) =>
        dataRow(indice, [
          { value: `${indice + 1} de 5` },
          { value: cuantos },
          { value: satisfaccion.respuestas === 0 ? null : Math.round((cuantos / satisfaccion.respuestas) * 1000) / 10 },
        ]),
      ),
    ],
  }
}

/** Lo que la IA leyó de los resultados, con su nivel de confianza. */
function hojaAnalisis(resultados: Resultados): SheetSpec {
  return {
    name: 'Análisis con IA',
    columns: [260, 420, 110],
    rows: [
      ...encabezado(resultados, 'Análisis con IA'),
      hintRow('Lo que la IA lee de estos mismos datos. Cada punto se puede comprobar en su pestaña.'),
      blankRow,
      headRow(['Hallazgo', 'Detalle', 'Confianza']),
      ...resultados.hallazgos.map((hallazgo, indice) =>
        dataRow(indice, [{ value: hallazgo.titulo }, { value: hallazgo.detalle, style: 'wrap' }, { value: hallazgo.confianza }], { autoFitHeight: true }),
      ),
    ],
  }
}

export type TipoLibro = 'progreso' | 'evaluaciones' | 'respuestas' | 'encuestas' | 'roleplay'

/** El libro de cada reporte: qué hojas lleva. */
export function libroDe(tipo: TipoLibro, resultados: Resultados): string {
  const hojas: (SheetSpec | null)[] =
    tipo === 'progreso'
      ? [hojaProgreso(resultados), resultados.pestanas.includes('asistencias') ? hojaAsistencias(resultados) : null]
      : tipo === 'evaluaciones'
        ? [hojaEvaluaciones(resultados), hojaCondiciones(resultados), hojaBloqueos(resultados)]
        : tipo === 'respuestas'
          ? [hojaEvaluaciones(resultados), hojaCondiciones(resultados), hojaAnalisis(resultados)]
          : tipo === 'encuestas'
            ? [hojaSatisfaccion(resultados), hojaAnalisis(resultados)]
            : [hojaRoleplay(resultados), hojaConversaciones(resultados)]

  const utiles = hojas.filter((hoja): hoja is SheetSpec => hoja !== null)
  // Un libro sin hojas no se abre: si no hay nada que escribir, al menos va la cabecera del contenido.
  return workbook(utiles.length > 0 ? utiles : [{ name: 'Sin datos', rows: encabezado(resultados, 'Sin datos todavía') }])
}

export { porcentaje }
