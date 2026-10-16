import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Text } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { planConIa } from '@/modules/admin/tareas/components/plan-con-ia'
import type { SurveyRisk } from '../../modelo/riesgos'
import { grupoDe } from './columnas'
import { MANERAS, type Solucion } from './soluciones'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// La acción de un caso que se hace de una vez, sin abrir nada: lo que antes pedía abrir el grupo, entrar al detalle y
// buscar el botón. Sale de lo mismo que el detalle (soluciones.ts):
// - si el caso trae una lista con acción, se hace con toda la lista: «Recordar a 34», «Crear 3 planes con IA»;
// - si no, el botón del caso: «Finalizar encuesta», «Copiar enlace», «Ver canalización»…
// Lo que pide decidir algo (elegir una fecha, a quién sí y a quién no) se sigue haciendo en el detalle.

export type AccionRapida = { etiqueta: string; ia: boolean; solucion: () => Solucion }

export function accionRapida(riesgo: SurveyRisk): AccionRapida | null {
  const manera = MANERAS[riesgo.kind]
  const items = riesgo.items ?? []
  const lista = manera.lista?.accion
  if (lista && items.length > 0) {
    if (lista.ia) {
      return {
        etiqueta: lista.masiva(items.length),
        ia: true,
        solucion: () => {
          const nuevos = items.map((item) => planConIa({ id: `plan-${riesgo.id}-${item.id}`, sujeto: item.title, origen: riesgo.survey.name, area: riesgo.kind === 'brecha' ? item.title : undefined }))
          return { tipo: 'planes', nuevos, elegido: nuevos[0].plan.id }
        },
      }
    }
    return { etiqueta: lista.masiva(items.length), ia: false, solucion: () => ({ tipo: 'lista', aviso: lista.aviso(items.length), completa: true }) }
  }
  const boton = manera.boton
  if (!boton) return null
  return {
    etiqueta: boton.etiqueta,
    ia: false,
    solucion: () => (boton.accion === 'resultados' ? { tipo: 'resultados', pestana: boton.pestana } : { tipo: 'accion', accion: boton.accion, paso: boton.paso }),
  }
}

/** Un caso en una fila: su prioridad, qué pasa y en qué encuesta, la acción de una vez y la flecha al detalle. */
export function FilaRiesgo({ riesgo, conPrioridad = true, onResolver, onDetalle }: { riesgo: SurveyRisk; /** En el panel lateral la prioridad ya la dice su marco. */ conPrioridad?: boolean; onResolver: (riesgo: SurveyRisk, solucion: Solucion) => void; onDetalle: (riesgo: SurveyRisk) => void }) {
  const prioridad = grupoDe(riesgo.group)
  const rapida = accionRapida(riesgo)
  return (
    <Item size="sm" className="gap-3 px-0!">
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          {conPrioridad ? (
            <Badge variant={prioridad.insignia} size="sm" className="shrink-0">
              {prioridad.titulo}
            </Badge>
          ) : null}
          <TextoCompleto texto={riesgo.title}><span className="truncate">{riesgo.title}</span></TextoCompleto>
        </ItemTitle>
        <TextoCompleto texto={`${riesgo.survey.name} · ${riesgo.summary}`}><ItemDescription className="line-clamp-1!">
          {riesgo.survey.name} · {riesgo.summary}
        </ItemDescription></TextoCompleto>
      </ItemContent>
      <ItemActions>
        {rapida ? (
          rapida.ia ? (
            <BotonIaSecundario onClick={() => onResolver(riesgo, rapida.solucion())}>{rapida.etiqueta}</BotonIaSecundario>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onResolver(riesgo, rapida.solucion())}>
              {rapida.etiqueta}
            </Button>
          )
        ) : null}
        <Hint label="Ver detalle">
          <BotonIcono aria-label={`Ver el detalle: ${riesgo.title}, ${riesgo.survey.name}`} onClick={() => onDetalle(riesgo)}>
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          </BotonIcono>
        </Hint>
      </ItemActions>
    </Item>
  )
}

/** El mismo caso en columna, para la fila horizontal del home: prioridad y qué pasa en una línea, la encuesta debajo y la
 *  acción de una vez con la flecha al detalle. Sin el resumen (13-oct, Elkin: «se ve mucho texto»): está en el detalle. */
export function ColumnaRiesgo({ riesgo, onResolver, onDetalle }: { riesgo: SurveyRisk; onResolver: (riesgo: SurveyRisk, solucion: Solucion) => void; onDetalle: (riesgo: SurveyRisk) => void }) {
  const prioridad = grupoDe(riesgo.group)
  const rapida = accionRapida(riesgo)
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:px-5 lg:first:ps-0 lg:last:pe-0">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={prioridad.insignia} size="sm" className="shrink-0">
            {prioridad.titulo}
          </Badge>
          <TextoCompleto texto={riesgo.title}><Text as="span" size="sm" weight="semibold" className="truncate">
            {riesgo.title}
          </Text></TextoCompleto>
        </div>
        <TextoCompleto texto={riesgo.survey.name}><Text as="span" size="xs" variant="muted" className="truncate">
          {riesgo.survey.name}
        </Text></TextoCompleto>
      </div>
      <div className="mt-auto flex items-center gap-1">
        {rapida ? (
          rapida.ia ? (
            <BotonIaSecundario onClick={() => onResolver(riesgo, rapida.solucion())}>{rapida.etiqueta}</BotonIaSecundario>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onResolver(riesgo, rapida.solucion())}>
              {rapida.etiqueta}
            </Button>
          )
        ) : null}
        <Hint label="Ver detalle">
          <BotonIcono aria-label={`Ver el detalle: ${riesgo.title}, ${riesgo.survey.name}`} onClick={() => onDetalle(riesgo)}>
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          </BotonIcono>
        </Hint>
      </div>
    </div>
  )
}
