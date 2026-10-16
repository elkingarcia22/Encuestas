import { Badge, Frame, FrameHeader, FramePanel, FrameTitle, Heading, Separator } from '@ubits/flux-ui'
// Las filas de datos y la barra «Falta un dato» son las mismas piezas del panel «Así va…» de Vacantes y Encuestas
// (decisión 21 de la auditoría, 5-oct): antes se repetían aquí a mano.
import { AvanceObligatorios, ListaDatos } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import type { Plan } from './planes'
import { MINUTOS_POR_COMPETENCIA, PREGUNTAS_POR_COMPETENCIA } from './banco'
import { textoMedida, type Medida } from './programacion'

// «Vista previa»: el mismo panel de apoyo de Crear contenido, con su misma anatomía —marco con cabecera gris,
// arriba cómo va quedando, después los datos y al final lo que falta con su barra—;
// abajo, lo que ya se decidió, sumándose paso a paso.

type Fila = { termino: string; valor: string }

type Props = {
  plan: Plan | null
  nombre: string
  personas: number
  competencias: string[]
  resultadosVisibles: boolean
  inicial: Medida
  seguimiento: Medida
  planTermino: boolean
  /** El paso más lejano al que se llegó. */
  paso: number
  falta: string[]
  total: number
}

export function ResumenAssessment({ plan, nombre, personas, competencias, resultadosVisibles, inicial, seguimiento, planTermino, paso, falta, total }: Props) {
  const n = competencias.length
  const filas: Fila[] = [
    ...(plan
      ? [
          { termino: 'Plan', valor: plan.nombre },
          { termino: 'Personas', valor: personas.toLocaleString('es-CO') },
          { termino: 'Competencias', valor: n.toLocaleString('es-CO') },
          { termino: 'Tiempo por persona', valor: `Unos ${(n * MINUTOS_POR_COMPETENCIA).toLocaleString('es-CO')} min` },
        ]
      : []),
    ...(paso >= 2 ? [{ termino: 'Resultados', valor: resultadosVisibles ? 'Visibles para el colaborador' : 'No visibles para el colaborador' }] : []),
    ...(paso >= 3
      ? [
          // «Inicial» y «Seguimiento», sin repetir «Assessment»: ya se sabe de qué se está hablando, el panel entero
          // es de este assessment. Con el nombre largo la etiqueta se comía la columna y el rango de fechas caía en
          // dos renglones, partido por la mitad (Dave, 1-oct).
          { termino: 'Inicial', valor: textoMedida(inicial, planTermino) },
          { termino: 'Seguimiento', valor: textoMedida(seguimiento) },
        ]
      : []),
  ]

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Vista previa</FrameTitle>
      </FrameHeader>

      <FramePanel className="flex flex-col gap-4">
        {/* Arriba, cómo va quedando: el nombre y de qué plan sale. */}
        <div className="flex flex-col gap-2">
          <Heading as="h3" level={5} className={nombre.trim() ? 'break-words' : 'text-muted-foreground'}>
            {nombre.trim() || 'Sin nombre todavía'}
          </Heading>
          {/* Nada del estado del plan aquí: colgar «Plan vigente» del nombre del assessment mezcla dos cosas que no
              son la misma. De qué plan sale ya se dice abajo, en su fila. */}
          {plan && n ? (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" size="xs">
                {(n * PREGUNTAS_POR_COMPETENCIA).toLocaleString('es-CO')} preguntas
              </Badge>
            </div>
          ) : null}
        </div>

        <ListaDatos filas={filas} />

        {/* Lo que falta cierra el panel, siempre: igual que en Crear contenido. */}
        {filas.length ? <Separator /> : null}

        <AvanceObligatorios falta={falta} total={total} />
      </FramePanel>
    </Frame>
  )
}
