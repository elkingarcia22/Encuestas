import { Field, FieldDescription, FieldError, FieldLabel } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { SelectorMultiple } from '@/modules/design-system/formularios/asignacion'
import type { Objective } from '../../../modelo/constructor/cicloBuilderTypes'

// Paso 6 · «¿A qué objetivos contribuye?». Desde el 22-oct un objetivo puede contribuir a varios, y pueden ser muchos:
// una lista con autocompletar (SelectorMultiple del sistema, con buscador y fichas) en dos grupos, «De la empresa» y
// «Del ciclo». En «Del ciclo» entran los objetivos de todo el ciclo, también de otras personas o grupos, con su dueño al
// lado: así se distingue el mismo objetivo en dos personas y se busca por el objetivo o por la persona. Si el modelo pide
// alineación, hay que elegir al menos uno y la marca pasa de «Opcional» a «Obligatorio». Un objetivo sin título se
// nombra por su posición.

/** Un objetivo del ciclo al que se puede contribuir, con de quién es (la persona o el grupo que lo lleva). */
export type ObjetivoDelCiclo = { objetivo: Objective; de: string }

export function CampoAlineacion({
  id,
  valor,
  empresa,
  ciclo = [],
  onCambio,
  requerida,
  invalida,
}: {
  id: string
  valor: readonly string[]
  empresa: readonly Objective[]
  ciclo?: readonly ObjetivoDelCiclo[]
  onCambio: (alineadoA: readonly string[]) => void
  requerida: boolean
  invalida: boolean
}) {
  // El selector trabaja con nombres: cada opción lleva un nombre único y se traduce a su id de ida y de vuelta.
  const porNombre = new Map<string, string>()
  const nombreUnico = (base: string, objetivoId: string) => {
    let nombre = base
    for (let n = 2; porNombre.has(nombre); n += 1) nombre = `${base} (${n})`
    porNombre.set(nombre, objetivoId)
    return nombre
  }
  const deEmpresa = empresa.map((objetivo, indice) => nombreUnico(objetivo.title.trim() || `Objetivo de la empresa ${indice + 1}`, objetivo.id))
  const delCiclo = ciclo.map(({ objetivo, de }, indice) => nombreUnico(`${objetivo.title.trim() || `Objetivo ${indice + 1}`} · ${de}`, objetivo.id))
  const nombreDe = new Map([...porNombre.entries()].map(([nombre, objetivoId]) => [objetivoId, nombre]))
  // Solo las que siguen existiendo: una alineación a un objetivo borrado no se muestra ni se cuenta.
  const elegidas = valor.map((destino) => nombreDe.get(destino)).filter((nombre): nombre is string => nombre !== undefined)

  return (
    <Field data-invalid={invalida || undefined}>
      <div className="flex items-center gap-2">
        <FieldLabel htmlFor={`${id}-alineacion`}>Contribuye a</FieldLabel>
        <Badge variant={requerida ? 'primary-light' : 'secondary'} size="xs">
          {requerida ? 'Obligatorio' : 'Opcional'}
        </Badge>
      </div>
      <SelectorMultiple
        id={`${id}-alineacion`}
        opciones={[...deEmpresa, ...delCiclo]}
        grupos={[
          { etiqueta: 'De la empresa', opciones: deEmpresa },
          { etiqueta: 'Del ciclo', opciones: delCiclo },
        ]}
        valor={elegidas}
        onCambio={(nombres) => onCambio(nombres.map((nombre) => porNombre.get(nombre)).filter((objetivoId): objetivoId is string => objetivoId !== undefined))}
        placeholder={delCiclo.length > 0 ? 'Busca por objetivo o por persona' : 'Busca un objetivo'}
        invalido={invalida}
      />
      {invalida ? (
        <FieldError>Alinéalo a al menos un objetivo</FieldError>
      ) : (
        <FieldDescription>{elegidas.length > 1 ? `Contribuye a ${elegidas.length} objetivos.` : 'Puedes elegir varios, de la empresa o de otras personas del ciclo.'}</FieldDescription>
      )}
    </Field>
  )
}
