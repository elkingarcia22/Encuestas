import { useState } from 'react'
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Frame,
  FramePanel,
  Heading,
  Input,
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
  toast,
} from '@ubits/flux-ui'

import { ESTADOS_VACANTE, type EstadoVacante } from '../components/data'
import { useSuite } from '../components/estado'

// Selección › Vacantes: la pantalla sobre la que se abre el buscador en el caso 06 y a la que
// lleva «Probarlo en Selección». Lista simple con filtro por estado y «Crear vacante».

const ETAPA: Record<string, 'secondary' | 'info-light' | 'primary-light' | 'warning-light' | 'success-light'> = {
  Borrador: 'secondary',
  'Filtro inicial': 'info-light',
  Entrevistas: 'primary-light',
  Oferta: 'success-light',
  Publicada: 'warning-light',
  Cerrada: 'secondary',
}

const mayuscula = (texto: string) => texto[0].toUpperCase() + texto.slice(1)

function DialogoCrear({ abierto, onAbierto, onCrear }: { abierto: boolean; onAbierto: (abierto: boolean) => void; onCrear: (cargo: string, responsable: string) => void }) {
  const suite = useSuite()
  const [cargo, setCargo] = useState('')
  const [responsable, setResponsable] = useState('')

  return (
    <Dialog open={abierto} onOpenChange={onAbierto}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Crear vacante</DialogTitle>
          <DialogDescription>Queda en borrador hasta que la publiques.</DialogDescription>
        </DialogHeader>
        <form
          id="crear-vacante"
          onSubmit={(e) => {
            e.preventDefault()
            onCrear(cargo, responsable)
            onAbierto(false)
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="vacante-cargo">Nombre de la vacante</FieldLabel>
              <Input id="vacante-cargo" placeholder="Ej.: Analista de calidad" value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="vacante-responsable">Responsable</FieldLabel>
              <Input id="vacante-responsable" placeholder="Laura M." value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter className="items-center sm:justify-between">
          <Text as="span" variant="muted" size="xs">
            Selección · {suite.organizacion}
          </Text>
          <div className="flex gap-2">
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" form="crear-vacante">
              Crear vacante
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Component() {
  const suite = useSuite()
  const [estado, setEstado] = useState<EstadoVacante>('abiertas')
  const [crear, setCrear] = useState({ abierto: false, vez: 0 })
  const lista = suite.vacantes.filter((v) => estado === 'todas' || (estado === 'abiertas' ? v.abierta : !v.abierta))

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading as="h1" level={2}>
          Vacantes
        </Heading>
        <div className="flex flex-wrap gap-2">
          <Select
            value={estado}
            onValueChange={(valor) => {
              const nuevo = String(valor) as EstadoVacante
              setEstado(nuevo)
              toast.add({ title: `Filtro: ${nuevo}` })
            }}
          >
            <SelectTrigger className="w-44" aria-label="Estado de las vacantes">
              <SelectValue>{(valor) => `Estado: ${String(valor)}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_VACANTE.map((opcion) => (
                <SelectItem key={opcion} value={opcion}>
                  {mayuscula(opcion)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCrear((c) => ({ abierto: true, vez: c.vez + 1 }))}>Crear vacante</Button>
        </div>
      </div>

      <Frame>
        <FramePanel>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vacante</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((vacante) => (
                  <TableRow key={vacante.cargo}>
                    <TableCell>
                      <Text as="span" size="sm" weight="medium">
                        {vacante.cargo}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ETAPA[vacante.etapa] ?? 'secondary'} size="sm">
                        {vacante.etapa}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text as="span" size="sm">
                        {vacante.responsable}
                      </Text>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="sm" onClick={() => suite.abrirVacante(vacante)}>
                        Ver candidatos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </FramePanel>
      </Frame>

      <DialogoCrear
        key={crear.vez}
        abierto={crear.abierto}
        onAbierto={(abierto) => setCrear((c) => ({ ...c, abierto }))}
        onCrear={suite.crearVacante}
      />
    </div>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiVacantes'
