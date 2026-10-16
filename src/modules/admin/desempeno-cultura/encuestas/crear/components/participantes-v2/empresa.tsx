import { useMemo, useState } from 'react'
import {
  Field,
  FieldLabel,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { COLLABORATOR_COUNT } from '../../../modelo/collaborators'
import { SEGMENT_LABELS, formatCount, segmentCounts } from '../../../modelo/participants'
import type { ParticipantsSelection, SegmentKey } from '../../../modelo/surveyBuilderTypes'
import { Sincronizar } from './sincronizar'

// «Toda la empresa»: todos los colaboradores que hay hoy en la plataforma. No hay nada que elegir,
// así que el panel muestra a quién alcanza, desglosado por el grupo que se quiera mirar.

const SEGMENTOS = (Object.entries(SEGMENT_LABELS) as [SegmentKey, string][]).map(([value, label]) => ({ value, label }))
const MAXIMO_FILAS = 8

export function ParticipantesEmpresa({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const [verPor, setVerPor] = useState<SegmentKey>('area')
  const grupos = useMemo(() => [...segmentCounts(verPor).entries()].sort((a, b) => b[1] - a[1]), [verPor])
  const visibles = grupos.slice(0, MAXIMO_FILAS)
  const resto = grupos.slice(MAXIMO_FILAS).reduce((suma, [, cuantos]) => suma + cuantos, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <Text as="span" size="xl" weight="semibold" className="tabular-nums">
            {formatCount(COLLABORATOR_COUNT)} colaboradores
          </Text>
          <Text as="span" size="sm" variant="muted">
            Recibirán la encuesta todas las personas que hoy están en la plataforma.
          </Text>
        </div>
        <Field orientation="horizontal" className="w-auto!">
          <FieldLabel htmlFor="empresa-ver-por">Ver por</FieldLabel>
          <Select value={verPor} onValueChange={(valor) => setVerPor(valor as SegmentKey)} items={SEGMENTOS}>
            <SelectTrigger id="empresa-ver-por" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTOS.map((segmento) => (
                <SelectItem key={segmento.value} value={segmento.value}>
                  {segmento.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Lista y no tabla, igual que las otras tres formas de elegir: cada grupo, cuántos son y qué parte del total. */}
      <ItemGroup className="gap-0! rounded-xl border">
        {visibles.map(([grupo, cuantos], indice) => {
          const porcentaje = Math.round((cuantos / COLLABORATOR_COUNT) * 100)
          return (
            <div key={grupo}>
              {indice > 0 ? <ItemSeparator /> : null}
              <Item size="sm" className="gap-3">
                <ItemContent>
                  <ItemTitle>{grupo}</ItemTitle>
                </ItemContent>
                <ItemActions className="gap-3">
                  <Text as="span" size="sm" className="tabular-nums">
                    {formatCount(cuantos)}
                  </Text>
                  <Progress value={porcentaje} className="hidden w-24 sm:flex" aria-label={`${porcentaje}% del total`} />
                  <Text as="span" size="xs" variant="muted" className="w-8 text-right tabular-nums">
                    {porcentaje}%
                  </Text>
                </ItemActions>
              </Item>
            </div>
          )
        })}
        {resto > 0 ? (
          <div>
            <ItemSeparator />
            <Item size="sm" className="gap-3">
              <ItemContent>
                <Text as="span" size="sm" variant="muted">
                  {grupos.length - MAXIMO_FILAS} grupos más
                </Text>
              </ItemContent>
              <ItemActions>
                <Text as="span" size="sm" variant="muted" className="tabular-nums">
                  {formatCount(resto)}
                </Text>
              </ItemActions>
            </Item>
          </div>
        ) : null}
      </ItemGroup>

      <Sincronizar
        id="empresa"
        alcance="la empresa"
        activo={seleccion.companyAutoInclude}
        cuentaQuienSale={seleccion.companyCountLeavers}
        onActivo={(activo) => onCambio({ companyAutoInclude: activo })}
        onCuentaQuienSale={(cuenta) => onCambio({ companyCountLeavers: cuenta })}
      />
    </div>
  )
}
