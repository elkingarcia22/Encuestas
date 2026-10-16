import { Badge, Field, FieldError, FieldLabel, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@ubits/flux-ui'
import type { Objective } from '../../../modelo/constructor/cicloBuilderTypes'

// Paso 6 · «¿A qué objetivo contribuye?». Un desplegable con los objetivos de la empresa y, en individuales, los demás
// del mismo set; con los dos grupos a la vez, cada uno lleva su rótulo («De la empresa» / «Del ciclo»). Si el modelo
// pide alineación, «Sin alineación» deja de ofrecerse y la marca pasa de «Opcional» a «Obligatorio». Un objetivo sin
// título se nombra por su posición.

const NINGUNA = '__ninguna__'

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
  valor: string | null
  empresa: readonly Objective[]
  ciclo?: readonly Objective[]
  onCambio: (alineadoA: string | null) => void
  requerida: boolean
  invalida: boolean
}) {
  const conRotulos = empresa.length > 0 && ciclo.length > 0
  const opciones = [
    ...(requerida ? [] : [{ value: NINGUNA, label: 'Sin alineación' }]),
    ...empresa.map((objetivo, indice) => ({ value: objetivo.id, label: objetivo.title.trim() || `Objetivo de la empresa ${indice + 1}` })),
    ...ciclo.map((objetivo, indice) => ({ value: objetivo.id, label: objetivo.title.trim() || `Objetivo ${indice + 1}` })),
  ]
  const etiqueta = (objetivoId: string) => opciones.find((opcion) => opcion.value === objetivoId)?.label ?? ''

  return (
    <Field data-invalid={invalida || undefined}>
      <div className="flex items-center gap-2">
        <FieldLabel htmlFor={`${id}-alineacion`}>Contribuye a</FieldLabel>
        <Badge variant={requerida ? 'primary-light' : 'secondary'} size="xs">
          {requerida ? 'Obligatorio' : 'Opcional'}
        </Badge>
      </div>
      <Select value={valor ?? (requerida ? '' : NINGUNA)} onValueChange={(elegido) => onCambio(elegido === NINGUNA || !elegido ? null : (elegido as string))} items={opciones}>
        <SelectTrigger id={`${id}-alineacion`} className="w-full bg-background!" aria-invalid={invalida || undefined}>
          <SelectValue placeholder="Elige un objetivo" />
        </SelectTrigger>
        <SelectContent>
          {requerida ? null : <SelectItem value={NINGUNA}>Sin alineación</SelectItem>}
          {empresa.length > 0 ? (
            <SelectGroup>
              {conRotulos ? <SelectLabel>De la empresa</SelectLabel> : null}
              {empresa.map((objetivo) => (
                <SelectItem key={objetivo.id} value={objetivo.id}>
                  {etiqueta(objetivo.id)}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : null}
          {ciclo.length > 0 ? (
            <SelectGroup>
              {conRotulos ? <SelectLabel>Del ciclo</SelectLabel> : null}
              {ciclo.map((objetivo) => (
                <SelectItem key={objetivo.id} value={objetivo.id}>
                  {etiqueta(objetivo.id)}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : null}
        </SelectContent>
      </Select>
      {invalida ? <FieldError>Alinéalo a un objetivo de la empresa</FieldError> : null}
    </Field>
  )
}
