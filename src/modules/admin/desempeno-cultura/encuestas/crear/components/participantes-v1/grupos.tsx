import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
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
} from '@ubits/flux-ui'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { COLLABORATOR_COUNT } from '../../../modelo/collaborators'
import { SEGMENT_LABELS, formatCount, groupMemberIds, segmentCounts } from '../../../modelo/participants'
import type { ParticipantsSelection, SegmentKey } from '../../../modelo/surveyBuilderTypes'
import { Paginacion } from '../../../components/tabla-piezas'
import { Sincronizar } from './sincronizar'

// «Por grupos»: áreas, líderes u otros grupos enteros. Un grupo elegido entra completo: no hay
// pertenencia a medias, así que quien lo elige recibe a todas sus personas.

const SEGMENTOS = (Object.entries(SEGMENT_LABELS) as [SegmentKey, string][]).map(([value, label]) => ({ value, label }))

export function ParticipantesGrupos({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const elegidos = new Set(seleccion.selectedGroups)

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const marcados = new Set(seleccion.selectedGroups)
    return [...segmentCounts(seleccion.groupSegmentBy).entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .filter(([grupo]) => !q || grupo.toLowerCase().includes(q))
      .filter(([grupo]) => !soloElegidos || marcados.has(grupo))
  }, [seleccion.groupSegmentBy, seleccion.selectedGroups, busqueda, soloElegidos])
  const visibles = pagina(grupos, actual, porPagina)
  const personas = groupMemberIds(seleccion.groupSegmentBy, seleccion.selectedGroups).size
  const todaLaPagina = visibles.length > 0 && visibles.every(([grupo]) => elegidos.has(grupo))

  const alternar = (grupo: string) =>
    onCambio({ selectedGroups: elegidos.has(grupo) ? seleccion.selectedGroups.filter((actual) => actual !== grupo) : [...seleccion.selectedGroups, grupo] })
  const alternarPagina = () => {
    const pagina = new Set(visibles.map(([grupo]) => grupo))
    onCambio({
      selectedGroups: todaLaPagina ? seleccion.selectedGroups.filter((grupo) => !pagina.has(grupo)) : [...new Set([...seleccion.selectedGroups, ...pagina])],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field orientation="horizontal" className="w-auto!">
          <FieldLabel htmlFor="grupos-agrupar-por">Agrupar por</FieldLabel>
          <Select
            value={seleccion.groupSegmentBy}
            // Cambiar de categoría descarta lo elegido: un área no es un líder.
            onValueChange={(valor) => {
              onCambio({ groupSegmentBy: valor as SegmentKey, selectedGroups: [] })
              setActual(1)
            }}
            items={SEGMENTOS}
          >
            <SelectTrigger id="grupos-agrupar-por" className="w-52">
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
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-64">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value)
                setActual(1)
              }}
              placeholder="Busca por nombre del grupo"
              aria-label="Buscar grupo"
            />
          </InputGroup>
          <Button variant={soloElegidos ? 'secondary' : 'outline'} size="sm" aria-pressed={soloElegidos} onClick={() => setSoloElegidos(!soloElegidos)}>
            Ver seleccionados ({seleccion.selectedGroups.length})
          </Button>
        </div>
      </div>

      {grupos.length === 0 ? (
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyTitle>No hay grupos con ese nombre</EmptyTitle>
            <EmptyDescription>Prueba con otra palabra o quita el filtro de seleccionados.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={todaLaPagina} onCheckedChange={alternarPagina} aria-label="Seleccionar los grupos de esta página" />
                </TableHead>
                <TableHead>{SEGMENT_LABELS[seleccion.groupSegmentBy]}</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">% del total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map(([grupo, cuantos]) => (
                <TableRow key={grupo} data-state={elegidos.has(grupo) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox checked={elegidos.has(grupo)} onCheckedChange={() => alternar(grupo)} aria-label={`Seleccionar ${grupo}`} />
                  </TableCell>
                  <TableCell>{grupo}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(cuantos)}</TableCell>
                  <TableCell className="text-right tabular-nums">{((cuantos / COLLABORATOR_COUNT) * 100).toFixed(1).replace('.', ',')}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Paginacion
            id="grupos"
            actual={actual}
            total={grupos.length}
            porPagina={porPagina}
            onCambiarPagina={setActual}
            onCambiarPorPagina={(valor) => {
              setPorPagina(valor)
              setActual(1)
            }}
          />
        </>
      )}

      {seleccion.selectedGroups.length > 0 ? (
        <Sincronizar
          id="grupos"
          alcance="la agrupación"
          activo={seleccion.groupsAutoInclude}
          cuentaQuienSale={seleccion.groupsCountLeavers}
          onActivo={(activo) => onCambio({ groupsAutoInclude: activo })}
          onCuentaQuienSale={(cuenta) => onCambio({ groupsCountLeavers: cuenta })}
        />
      ) : null}

      <span className="sr-only" aria-live="polite">
        {formatCount(personas)} personas en los grupos elegidos
      </span>
    </div>
  )
}
