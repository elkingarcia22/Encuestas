import { Badge, Button, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Text } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { planConIa } from '@/modules/admin/tareas/components/plan-con-ia'
import type { SurveyRisk } from '../../modelo/riesgos'
import { grupoDe } from './columnas'
import { MANERAS, type Solucion } from './soluciones'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// La acción de un caso, que se hace de una vez y sin abrir nada (desde el 20-oct no hay detalle). Sale de soluciones.ts:
// - si el caso trae una lista con acción, se hace con toda la lista: «Recordar a 34», «Crear 3 planes con IA»;
// - si no, el botón del caso: «Finalizar encuesta», «Copiar enlace», «Ver canalización»…;
// - y si no trae ninguno, lleva a la participación de la encuesta, que es donde se ve qué falta.

export type AccionRapida = { etiqueta: string; ia: boolean; solucion: () => Solucion }

export function accionRapida(riesgo: SurveyRisk): AccionRapida {
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
  if (!boton) return { etiqueta: 'Ver participación', ia: false, solucion: () => ({ tipo: 'resultados', pestana: 'participation' }) }
  return {
    etiqueta: boton.etiqueta,
    ia: false,
    solucion: () => (boton.accion === 'resultados' ? { tipo: 'resultados', pestana: boton.pestana } : { tipo: 'accion', accion: boton.accion, paso: boton.paso }),
  }
}

/** El botón que resuelve el caso: el de IA si la acción es de IA. */
function BotonAccion({ riesgo, onResolver }: { riesgo: SurveyRisk; onResolver: (riesgo: SurveyRisk, solucion: Solucion) => void }) {
  const rapida = accionRapida(riesgo)
  return rapida.ia ? (
    <BotonIaSecundario onClick={() => onResolver(riesgo, rapida.solucion())}>{rapida.etiqueta}</BotonIaSecundario>
  ) : (
    <Button variant="outline" size="sm" onClick={() => onResolver(riesgo, rapida.solucion())}>
      {rapida.etiqueta}
    </Button>
  )
}

/** Un caso en una fila entera (cuando es el único): su prioridad, qué pasa, en qué encuesta y la acción de una vez. */
export function FilaRiesgo({ riesgo, onResolver }: { riesgo: SurveyRisk; onResolver: (riesgo: SurveyRisk, solucion: Solucion) => void }) {
  const prioridad = grupoDe(riesgo.group)
  return (
    <Item size="sm" className="gap-3 px-0!">
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <Badge variant={prioridad.insignia} size="sm" className="shrink-0">
            {prioridad.titulo}
          </Badge>
          <TextoCompleto texto={riesgo.title}><span className="truncate">{riesgo.title}</span></TextoCompleto>
        </ItemTitle>
        <TextoCompleto texto={`${riesgo.survey.name} · ${riesgo.summary}`}><ItemDescription className="line-clamp-1!">
          {riesgo.survey.name} · {riesgo.summary}
        </ItemDescription></TextoCompleto>
      </ItemContent>
      <ItemActions>
        <BotonAccion riesgo={riesgo} onResolver={onResolver} />
      </ItemActions>
    </Item>
  )
}

/** El mismo caso en columna, para la fila horizontal del home: prioridad y qué pasa en una línea, la encuesta debajo y la
 *  acción de una vez. Sin el resumen (13-oct, Elkin: «se ve mucho texto»). */
export function ColumnaRiesgo({ riesgo, onResolver }: { riesgo: SurveyRisk; onResolver: (riesgo: SurveyRisk, solucion: Solucion) => void }) {
  const prioridad = grupoDe(riesgo.group)
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
        <BotonAccion riesgo={riesgo} onResolver={onResolver} />
      </div>
    </div>
  )
}
