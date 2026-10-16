import { useMemo, useState } from 'react'
import {
  Field,
  FieldLabel,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{SEGMENT_LABELS[verPor]}</TableHead>
            <TableHead className="text-right">Colaboradores</TableHead>
            <TableHead className="w-56">% del total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibles.map(([grupo, cuantos]) => {
            const porcentaje = Math.round((cuantos / COLLABORATOR_COUNT) * 100)
            return (
              <TableRow key={grupo}>
                <TableCell>{grupo}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCount(cuantos)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Progress value={porcentaje} className="w-32" aria-label={`${porcentaje}% del total`} />
                    <Text as="span" size="xs" variant="muted" className="tabular-nums">
                      {porcentaje}%
                    </Text>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {resto > 0 ? (
            <TableRow>
              <TableCell>
                <Text as="span" size="sm" variant="muted">
                  {grupos.length - MAXIMO_FILAS} grupos más
                </Text>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCount(resto)}</TableCell>
              <TableCell />
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

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
