import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CubeIcon, Mic01Icon, Pdf01Icon, Task01Icon, Video01Icon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Progress, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { FilaPaginaIndice, type EstadoPaginaIndice } from '../../compartido/fila-pagina'
import { fecha, porcentaje } from './datos'

// El temario del contenido leído desde una persona: el panel que abre una fila de Progreso.
//
// Es **el mismo índice que ve quien estudia** —la misma fila, los mismos iconos de estado, la misma baldosa—, porque
// es el mismo contenido mirado desde el otro lado. Antes esta pantalla dibujaba sus propias filas y no se parecía en
// nada a la del estudiante (Dave, 13-oct).
//
// Dos cosas sí cambian, y por el mismo motivo —aquí no se estudia, se revisa—:
//
// - **Las secciones nacen todas abiertas**, aunque se puedan plegar: quien revisa quiere ver el recorrido completo de
//   un vistazo, no ir abriéndolas una por una.
// - **Las páginas ocultas se ven**, marcadas. Para quien estudia no existen; para quien revisa son justo lo que
//   explica por qué a alguien le falta algo. Ocultar páginas pasa al editar, no al crear, así que esto no sale en el
//   asistente.

type Recurso = {
  nombre: string
  tipo: string
  icono: IconSvgElement
  /** Desde cuándo está oculta. */
  oculta?: string
}

type SeccionTemario = { id: string; titulo: string; recursos: readonly Recurso[] }

// El temario del curso de ejemplo, el mismo que recorre el estudiante.
const TEMARIO: readonly SeccionTemario[] = [
  {
    id: 's1',
    titulo: 'Sección 1: Fundamentos',
    recursos: [
      { nombre: 'Comunicación para desescalar un conflicto', tipo: 'Video', icono: Video01Icon },
      { nombre: 'Conversaciones difíciles según Thomas-Kilmann', tipo: 'SCORM', icono: CubeIcon, oculta: '2026-10-12' },
      { nombre: 'Evaluación Sección 1', tipo: 'Evaluación', icono: Task01Icon },
    ],
  },
  {
    id: 's2',
    titulo: 'Sección 2: Herramientas para resolver conflictos',
    recursos: [
      { nombre: 'Simulador de conversación difícil', tipo: 'SCORM', icono: CubeIcon },
      { nombre: 'Practica la conversación con tu equipo', tipo: 'Roleplay', icono: Mic01Icon },
      { nombre: 'Guía mapa de conflicto', tipo: 'Documento', icono: Pdf01Icon },
      { nombre: 'Evaluación Sección 2', tipo: 'Evaluación', icono: Task01Icon },
      { nombre: 'Evaluación de cierre', tipo: 'Evaluación', icono: Task01Icon, oculta: '2026-10-12' },
    ],
  },
]

/**
 * Cuántos recursos tiene el contenido. Lo usa también la tabla de Progreso, para que el avance que enseña sea el
 * mismo que cuenta el panel: con ocho recursos, el avance solo puede ir de 12,5 en 12,5, y un «45 %» suelto no
 * corresponde a ningún estado real del temario.
 */
export const TOTAL_RECURSOS = TEMARIO.reduce((suma, seccion) => suma + seccion.recursos.length, 0)

/**
 * El temario leído desde una persona.
 *
 * `hechos` es **la verdad del panel**, y de ahí sale todo lo demás: el estado de cada recurso, cuál está en curso y la
 * barra de arriba. Antes la barra venía del porcentaje de la tabla y la lista de una constante, así que las dos decían
 * cosas distintas sobre la misma persona.
 */
export function TemarioPersona({ nombre, email, hechos, inicio, fin }: { nombre: string; email: string; hechos: number; inicio: string; fin: string | null }) {
  // Todas abiertas de entrada; a partir de ahí manda lo que quien revisa abra o cierre.
  const [abiertas, setAbiertas] = useState<string[]>(() => TEMARIO.map((seccion) => seccion.id))
  const avance = TOTAL_RECURSOS === 0 ? 0 : (hechos / TOTAL_RECURSOS) * 100

  // Las fechas de lo completado se reparten entre el día que empezó y el día que terminó (o hoy, si sigue): el panel
  // no las tiene recurso a recurso, y ponerlas todas el mismo día haría pensar que lo hizo de una sentada.
  const desde = new Date(`${inicio}T12:00:00`).getTime()
  const hasta = new Date(fin ? `${fin}T12:00:00` : Date.now()).getTime()
  const diaDe = (indice: number) => {
    if (hechos <= 1) return inicio
    return new Date(desde + ((hasta - desde) * indice) / Math.max(1, hechos - 1)).toISOString().slice(0, 10)
  }

  let contados = -1

  return (
    <div className="flex flex-col gap-5">
      {/* El nombre va en el cuerpo y no en el título del panel: la cabecera dice qué es la ventana, no de quién habla. */}
      <div className="flex flex-col gap-2">
        <Text as="p" size="sm" weight="semibold">
          {nombre}
        </Text>
        <Text as="p" size="sm" variant="muted">
          {email}
        </Text>
        <div className="mt-1 flex items-center gap-3">
          <Progress value={avance} aria-label={`Avance de ${nombre}`} className="flex-1" />
          <Text as="span" size="sm" weight="semibold" className="tabular-nums">
            {porcentaje(avance)}
          </Text>
        </div>
        <Text as="p" size="xs" variant="muted">
          {hechos} de {TOTAL_RECURSOS} {TOTAL_RECURSOS === 1 ? 'recurso completado' : 'recursos completados'}
        </Text>
      </div>

      <Accordion value={abiertas} onValueChange={(valor) => setAbiertas(valor as string[])} className="flex flex-col gap-3">
        {TEMARIO.map((seccion) => (
          <AccordionItem key={seccion.id} value={seccion.id}>
            <AccordionTrigger className="gap-2">
              <span className="min-w-0 flex-1 text-left">{seccion.titulo}</span>
              <Badge variant="secondary" size="sm" className="shrink-0 tabular-nums">
                {seccion.recursos.length}
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              {seccion.recursos.map((recurso) => {
                contados += 1
                const indice = contados
                // Lo recorrido va en orden: lo hecho primero, después donde se quedó y lo que sigue, bloqueado.
                const estado: EstadoPaginaIndice = indice < hechos ? 'vista' : indice === hechos ? 'actual' : 'bloqueada'
                return (
                  <FilaPaginaIndice
                    key={recurso.nombre}
                    titulo={recurso.nombre}
                    // Debajo del nombre, de qué es y —si ya lo hizo— cuándo lo completó.
                    descripcion={estado === 'vista' ? `${recurso.tipo} · completado el ${fecha(diaDe(indice))}` : recurso.tipo}
                    icono={recurso.icono}
                    estado={estado}
                    extra={
                      recurso.oculta ? (
                        // Que la página esté oculta explica por qué a alguien le falta: sin esto parece un error.
                        <Badge variant="warning-light" size="xs">
                          <HugeiconsIcon icon={ViewOffSlashIcon} aria-hidden="true" />
                          Oculta
                        </Badge>
                      ) : null
                    }
                  />
                )
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
