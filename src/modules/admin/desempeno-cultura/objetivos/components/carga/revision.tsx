import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
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
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import type { Collaborator } from '../../../encuestas/modelo/collaborators'
import { PESTANAS, erroresDe, erroresDelGrupo, pestanaDe, sumaPesos, type FilaObjetivo, type GrupoPersona, type Modo, type Pestana } from '../../modelo/carga/carga-objetivos'

// La revisión de una carga de objetivos (9-oct, como el prototipo): lo que se leyó del archivo, agrupado por persona y
// repartido en cuatro pestañas por lo que le falta a cada una para poder cargarse, en el orden en que se resuelve:
// encontrar a la persona, confirmar la propuesta, corregir los datos y, al final, lo que ya está listo. Los datos se
// corrigen en la misma fila y las reglas corren a cada tecla: al quedar bien, la persona pasa sola a «Listos».

export type CambioGrupo = (identificador: string, cambio: (grupo: GrupoPersona) => GrupoPersona) => void

function Numero({ valor, onCambio, etiqueta, invalido }: { valor: number | null | undefined; onCambio: (valor: number | null) => void; etiqueta: string; invalido?: boolean }) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      value={valor ?? ''}
      aria-label={etiqueta}
      aria-invalid={invalido || undefined}
      className="w-20 tabular-nums"
      onChange={(evento) => onCambio(evento.target.value === '' ? null : Number(evento.target.value))}
    />
  )
}

function TablaObjetivos({ grupo, modo, onCambio }: { grupo: GrupoPersona; modo: Modo; onCambio: CambioGrupo }) {
  const cambiar = (id: string, parche: Partial<FilaObjetivo>) => onCambio(grupo.identificador, (actual) => ({ ...actual, objetivos: actual.objetivos.map((objetivo) => (objetivo.id === id ? { ...objetivo, ...parche } : objetivo)) }))
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">Fila</TableHead>
          <TableHead>{modo === 'editar' ? 'Objetivo · nombre nuevo' : 'Objetivo'}</TableHead>
          {modo === 'actualizar' ? (
            <>
              <TableHead className="w-28 text-right">Avance hoy</TableHead>
              <TableHead className="w-28">Avance nuevo</TableHead>
            </>
          ) : (
            <>
              <TableHead className="w-24">Peso %</TableHead>
              <TableHead className="w-24">Inicial</TableHead>
              <TableHead className="w-24">Meta</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {grupo.objetivos.map((objetivo) => {
          const errores = erroresDe(objetivo, modo)
          return (
            <TableRow key={objetivo.id}>
              <TableCell className="align-top tabular-nums">
                <Text as="span" size="xs" variant="muted">
                  {objetivo.fila}
                </Text>
              </TableCell>
              {/* «!»: la celda de la librería no parte el texto; el nombre y su error van enteros. */}
              <TableCell className="whitespace-normal! align-top">
                <div className="flex flex-col gap-1.5">
                  <Text as="span" size="sm" weight="medium" variant={modo === 'editar' ? 'muted' : 'default'}>
                    {objetivo.titulo}
                  </Text>
                  {modo === 'editar' ? <Input value={objetivo.tituloNuevo ?? ''} aria-label={`Nombre nuevo de ${objetivo.titulo}`} aria-invalid={!objetivo.tituloNuevo?.trim() || undefined} onChange={(evento) => cambiar(objetivo.id, { tituloNuevo: evento.target.value })} /> : null}
                  {errores.map((error) => (
                    <Text key={error} as="span" size="xs" variant="destructive">
                      {error}
                    </Text>
                  ))}
                </div>
              </TableCell>
              {modo === 'actualizar' ? (
                <>
                  <TableCell className="text-right align-top tabular-nums">
                    <Text as="span" size="sm" variant="muted">
                      {objetivo.avanceActual ?? 0}%
                    </Text>
                  </TableCell>
                  <TableCell className="align-top">
                    <Numero valor={objetivo.avanceNuevo} etiqueta={`Avance nuevo de ${objetivo.titulo}`} invalido={errores.length > 0} onCambio={(valor) => cambiar(objetivo.id, { avanceNuevo: valor })} />
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="align-top">
                    <Numero valor={objetivo.peso} etiqueta={`Peso de ${objetivo.titulo}`} onCambio={(valor) => cambiar(objetivo.id, { peso: valor ?? 0 })} />
                  </TableCell>
                  <TableCell className="align-top">
                    <Numero valor={objetivo.inicial} etiqueta={`Valor inicial de ${objetivo.titulo}`} onCambio={(valor) => cambiar(objetivo.id, { inicial: valor ?? 0 })} />
                  </TableCell>
                  <TableCell className="align-top">
                    <Numero valor={objetivo.meta} etiqueta={`Meta de ${objetivo.titulo}`} invalido={errores.some((error) => error.includes('meta'))} onCambio={(valor) => cambiar(objetivo.id, { meta: valor ?? 0 })} />
                  </TableCell>
                </>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function ElegirPersona({ grupo, libres, onElegir }: { grupo: GrupoPersona; libres: readonly Collaborator[]; onElegir: (persona: Collaborator) => void }) {
  return (
    <Select value="" onValueChange={(username) => {
      const persona = libres.find((opcion) => opcion.username === username)
      if (persona) onElegir(persona)
    }}>
      <SelectTrigger className="w-56" aria-label={`Elegir a quién corresponde ${grupo.identificador}`}>
        <SelectValue placeholder="Elegir persona" />
      </SelectTrigger>
      <SelectContent>
        {libres.map((persona) => (
          <SelectItem key={persona.username} value={persona.username}>
            {persona.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TarjetaGrupo({ grupo, modo, libres, onCambio, onQuitar }: { grupo: GrupoPersona; modo: Modo; libres: readonly Collaborator[]; onCambio: CambioGrupo; onQuitar: (grupo: GrupoPersona) => void }) {
  const [eligiendo, setEligiendo] = useState(false)
  const pestana = pestanaDe(grupo, modo)
  const meta = PESTANAS.find((opcion) => opcion.id === pestana)
  const delGrupo = erroresDelGrupo(grupo, modo)
  const asignar = (persona: Collaborator) => {
    onCambio(grupo.identificador, (actual) => ({ ...actual, persona, coincidencia: 'exacta' }))
    setEligiendo(false)
  }
  const detalle = [
    // Mientras no coincida exacto, lo que importa es cómo venía en el archivo: es lo que se compara con la propuesta.
    !grupo.persona ? 'No está entre las personas del ciclo' : grupo.persona.email === grupo.identificador ? grupo.persona.email : `En el archivo: ${grupo.identificador}`,
    `${grupo.objetivos.length} ${grupo.objetivos.length === 1 ? 'objetivo' : 'objetivos'}`,
    modo === 'actualizar' ? null : `pesos ${Math.round(sumaPesos(grupo))}%`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Frame spacing="sm">
      {/* «!»: la cabecera en fila (persona a la izquierda, lo que se resuelve a la derecha), como las cajas de Resultados. */}
      <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3!">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FrameTitle>{grupo.coincidencia === 'ninguna' ? grupo.identificador : (grupo.persona?.name ?? grupo.identificador)}</FrameTitle>
            {meta ? <Badge variant={meta.tono}>{meta.etiqueta}</Badge> : null}
          </div>
          <FrameDescription>{detalle}</FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {grupo.coincidencia === 'sugerida' && !eligiendo ? (
            <>
              <Text as="span" size="xs" variant="muted">
                {grupo.motivo}
              </Text>
              <Button variant="outline" size="sm" onClick={() => setEligiendo(true)}>
                Elegir otra
              </Button>
              <Button size="sm" onClick={() => grupo.sugerida && asignar(grupo.sugerida)}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                Confirmar a {grupo.sugerida?.name.split(' ')[0]}
              </Button>
            </>
          ) : null}
          {grupo.coincidencia === 'ninguna' || eligiendo ? <ElegirPersona grupo={grupo} libres={libres} onElegir={asignar} /> : null}
          <Hint label="Quitar a esta persona de la carga">
            <BotonIcono aria-label={`Quitar ${grupo.persona?.name ?? grupo.identificador} de la carga`} onClick={() => onQuitar(grupo)}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
            </BotonIcono>
          </Hint>
        </div>
      </FrameHeader>
      {delGrupo.length ? (
        <Alert variant="destructive">
          <AlertDescription>{delGrupo.join(' ')}</AlertDescription>
        </Alert>
      ) : null}
      <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
        <TablaObjetivos grupo={grupo} modo={modo} onCambio={onCambio} />
      </FramePanel>
    </Frame>
  )
}

export function Revision({ grupos, modo, personas, pestana, onPestana, onCambio, onQuitar }: { grupos: readonly GrupoPersona[]; modo: Modo; personas: readonly Collaborator[]; pestana: Pestana; onPestana: (pestana: Pestana) => void; onCambio: CambioGrupo; onQuitar: (grupo: GrupoPersona) => void }) {
  const cuenta = (id: Pestana) => grupos.filter((grupo) => pestanaDe(grupo, modo) === id).length
  const visibles = grupos.filter((grupo) => pestanaDe(grupo, modo) === pestana)
  // A cada persona del archivo le toca una persona distinta del ciclo: las ya asignadas no se ofrecen otra vez.
  const usadas = new Set(grupos.map((grupo) => grupo.persona?.username).filter(Boolean))
  const libres = personas.filter((persona) => !usadas.has(persona.username))
  const vacio = PESTANAS.find((opcion) => opcion.id === pestana)?.vacio

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={pestana} onValueChange={(valor) => onPestana(valor as Pestana)}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          {PESTANAS.map((opcion) => (
            <TabsTrigger key={opcion.id} value={opcion.id} className="flex-none gap-1.5">
              {opcion.etiqueta}
              <Badge variant={cuenta(opcion.id) ? opcion.tono : 'outline'} className="tabular-nums">
                {cuenta(opcion.id)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {visibles.length === 0 ? (
        <Text as="p" size="sm" variant="muted" className="py-8 text-center">
          {vacio}
        </Text>
      ) : (
        visibles.map((grupo) => <TarjetaGrupo key={grupo.identificador} grupo={grupo} modo={modo} libres={libres} onCambio={onCambio} onQuitar={onQuitar} />)
      )}
    </div>
  )
}
