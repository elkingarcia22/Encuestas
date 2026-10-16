import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { COLLABORATORS, type Collaborator } from '../../../modelo/collaborators'
import { SEGMENT_LABELS, effectiveIndividualIds, formatCount, groupMemberIds, withGroupConvertedToIndividuals, withGroupDeselected } from '../../../modelo/participants'
import type { ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { Paginacion } from '../../../components/tabla-piezas'

// «Por colaborador»: el directorio entero para armar una lista a la medida. Quien entró por un grupo
// elegido en «Por grupos» aparece ya marcado. Como un grupo entra completo, desmarcar a una de sus
// personas pregunta qué hacer: quitar el grupo entero o quitar solo a esa persona.

export function ParticipantesColaboradores({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [enGrupo, setEnGrupo] = useState<Collaborator | null>(null)

  const marcados = effectiveIndividualIds(seleccion)
  const deGrupos = groupMemberIds(seleccion.groupSegmentBy, seleccion.selectedGroups)

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return COLLABORATORS
    return COLLABORATORS.filter((persona) => `${persona.name} ${persona.email} ${persona.area} ${persona.leader ?? ''}`.toLowerCase().includes(q))
  }, [busqueda])
  const visibles = pagina([...resultado], actual, porPagina)
  const paginaCompleta = visibles.length > 0 && visibles.every((persona) => marcados.has(persona.id))

  const marcar = (ids: readonly string[]) => onCambio({ selectedIds: [...new Set([...seleccion.selectedIds, ...ids])] })
  // Desmarcar en lote solo quita a quienes se eligieron a mano: los de un grupo siguen hasta que se quite el grupo.
  const desmarcar = (ids: readonly string[]) => {
    const fuera = new Set(ids)
    onCambio({ selectedIds: seleccion.selectedIds.filter((id) => !fuera.has(id)) })
  }

  const alternar = (persona: Collaborator) => {
    if (!marcados.has(persona.id)) return marcar([persona.id])
    if (deGrupos.has(persona.id)) return setEnGrupo(persona)
    desmarcar([persona.id])
  }

  const grupoDe = (persona: Collaborator) => persona[seleccion.groupSegmentBy] ?? 'Sin asignar'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text as="span" size="sm" weight="medium">
          {formatCount(marcados.size)} {marcados.size === 1 ? 'colaborador seleccionado' : 'colaboradores seleccionados'}
        </Text>
        <InputGroup className="w-80">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value)
              setActual(1)
            }}
            placeholder="Busca por nombre, correo, área o líder"
            aria-label="Buscar colaborador"
          />
        </InputGroup>
      </div>

      {resultado.length === 0 ? (
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyTitle>No encontramos a nadie</EmptyTitle>
            <EmptyDescription>Ningún colaborador coincide con «{busqueda}».</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">
                    <div className="flex items-center">
                      <Checkbox
                        checked={paginaCompleta}
                        onCheckedChange={() => (paginaCompleta ? desmarcar(visibles.map((persona) => persona.id)) : marcar(visibles.map((persona) => persona.id)))}
                        aria-label="Seleccionar esta página"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Opciones de selección" />}>
                          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => marcar(visibles.map((persona) => persona.id))}>Seleccionar esta página</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => desmarcar(visibles.map((persona) => persona.id))}>Desmarcar esta página</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => marcar(resultado.map((persona) => persona.id))}>
                              Seleccionar todo ({formatCount(resultado.length)})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCambio({ selectedIds: [] })}>Desmarcar todo</DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Correo electrónico</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Líder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((persona) => (
                  <TableRow key={persona.id} data-state={marcados.has(persona.id) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox checked={marcados.has(persona.id)} onCheckedChange={() => alternar(persona)} aria-label={`Seleccionar a ${persona.name}`} />
                    </TableCell>
                    <TableCell>
                      <Persona nombre={persona.name} detalle={deGrupos.has(persona.id) ? `Por el grupo ${grupoDe(persona)}` : undefined} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{persona.username}</TableCell>
                    <TableCell className="text-muted-foreground">{persona.email}</TableCell>
                    <TableCell>{persona.area}</TableCell>
                    <TableCell>{persona.leader ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Paginacion
            id="colaboradores"
            actual={actual}
            total={resultado.length}
            porPagina={porPagina}
            onCambiarPagina={setActual}
            onCambiarPorPagina={(valor) => {
              setPorPagina(valor)
              setActual(1)
            }}
          />
        </>
      )}

      <ActionDialog
        open={enGrupo !== null}
        onOpenChange={(abierto) => (abierto ? undefined : setEnGrupo(null))}
        title={`${enGrupo?.name ?? ''} entró por un grupo`}
        sub={
          enGrupo
            ? `Está en la encuesta porque elegiste el grupo «${grupoDe(enGrupo)}» (${SEGMENT_LABELS[seleccion.groupSegmentBy]}). Un grupo entra completo: para quitar a una persona, el grupo deja de estar elegido como tal.`
            : undefined
        }
        footer={
          enGrupo ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onCambio(withGroupDeselected(seleccion, grupoDe(enGrupo)))
                  setEnGrupo(null)
                }}
              >
                Quitar todo el grupo
              </Button>
              <Button
                onClick={() => {
                  onCambio(withGroupConvertedToIndividuals(seleccion, grupoDe(enGrupo), enGrupo.id))
                  setEnGrupo(null)
                }}
              >
                Quitar solo a esta persona
              </Button>
            </>
          ) : undefined
        }
      />
    </div>
  )
}
