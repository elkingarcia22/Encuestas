import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowReloadHorizontalIcon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Comment01Icon,
  Delete02Icon,
  Link01Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  TaskEdit01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { fechaCorta, fechaHora, iniciales } from '@/modules/design-system/patrones/formato'
import { BADGE_PRIORIDAD, BADGE_TAREA, textoVencimiento, type Evento, type Tarea } from './datos'
import { CambiarFecha } from './piezas'

// Detalle de la tarea elegida (HU «Detalle de tarea y subtarea»): atributos, subtareas con avance,
// historial filtrable y acciones. Tipo Aprendizaje no se cierra a mano (RN-04); una vencida pide
// cambiar la fecha para reabrirla (RN-05).

type FiltroHistorial = 'todo' | 'comentarios' | 'cambios'

const FILTROS_HISTORIAL: { valor: FiltroHistorial; etiqueta: string }[] = [
  { valor: 'todo', etiqueta: 'Todo' },
  { valor: 'comentarios', etiqueta: 'Solo comentarios' },
  { valor: 'cambios', etiqueta: 'Solo historial de cambios' },
]

export type AccionesTarea = {
  onFinalizar: (tarea: Tarea) => void
  onReabrir: (tarea: Tarea) => void
  onCambiarFecha: (tarea: Tarea, fecha: Date) => void
  onSubtarea: (tarea: Tarea, subtareaId: string, hecha: boolean) => void
  onComentar: (tarea: Tarea, texto: string) => void
  onRecordatorio: (tarea: Tarea) => void
  onCopiarEnlace: (tarea: Tarea) => void
  onEliminar: (tarea: Tarea) => void
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Text as="span" variant="muted" size="xs">
        {etiqueta}
      </Text>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function EntradaHistorial({ evento }: { evento: Evento }) {
  const comentario = evento.tipo === 'comentario'
  return (
    <Item size="xs" className="items-start">
      <ItemMedia>
        {comentario ? (
          <Avatar size="sm">
            <AvatarFallback>{iniciales(evento.autor)}</AvatarFallback>
          </Avatar>
        ) : (
          <HugeiconsIcon icon={TaskEdit01Icon} size={18} aria-hidden="true" />
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{evento.autor}</ItemTitle>
        {comentario ? (
          <Text as="p" size="sm">
            {evento.texto}
          </Text>
        ) : (
          <Text as="p" variant="muted" size="sm">
            {evento.texto}
          </Text>
        )}
        <ItemDescription>{fechaHora(evento.cuando)}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

export function DetalleTarea({ tarea, acciones }: { tarea: Tarea | undefined; acciones: AccionesTarea }) {
  const [filtro, setFiltro] = useState<FiltroHistorial>('todo')
  const [comentario, setComentario] = useState('')

  if (!tarea) {
    return (
      <Frame>
        <FramePanel>
          {/* Vacío con su ilustración glass (13-oct). */}
          <PrimeraVez icono="glass-paper" titulo="Elige una tarea" descripcion="Su detalle, sus subtareas y su historial aparecen aquí." />
        </FramePanel>
      </Frame>
    )
  }

  const hechas = tarea.subtareas.filter((s) => s.hecha).length
  const total = tarea.subtareas.length
  const aprendizaje = tarea.tipo === 'Aprendizaje'
  const vencida = tarea.estado === 'Vencida'
  const finalizada = tarea.estado === 'Finalizada'
  const eventos = [...tarea.historial]
    .reverse()
    .filter((e) => filtro === 'todo' || (filtro === 'comentarios' ? e.tipo === 'comentario' : e.tipo === 'cambio'))

  const comentar = () => {
    if (!comentario.trim()) return
    acciones.onComentar(tarea, comentario.trim())
    setComentario('')
  }

  return (
    <Frame stacked>
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={BADGE_TAREA[tarea.estado]} size="sm">
              {tarea.estado}
            </Badge>
            <Badge variant={BADGE_PRIORIDAD[tarea.prioridad]} size="sm">
              Prioridad {tarea.prioridad.toLowerCase()}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <FrameTitle>
              <Heading as="h2" level={5}>
                {tarea.titulo}
              </Heading>
            </FrameTitle>
            <FrameDescription>{tarea.descripcion}</FrameDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones de la tarea" />}>
            <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => acciones.onRecordatorio(tarea)} disabled={finalizada}>
                <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
                Enviar recordatorio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => acciones.onCopiarEnlace(tarea)}>
                <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />
                Copiar enlace
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => acciones.onEliminar(tarea)}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              Eliminar tarea
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </FrameHeader>

      {/* Acción principal según el estado y el tipo. */}
      <FramePanel className="flex flex-col gap-3">
        {aprendizaje ? (
          <Alert variant="info">
            <HugeiconsIcon icon={BookOpen01Icon} aria-hidden="true" />
            <AlertTitle>{finalizada ? 'El curso ya está completado' : 'Finaliza al completar el contenido'}</AlertTitle>
            <AlertDescription>
              <p>
                {finalizada
                  ? `${tarea.asignado} terminó «${tarea.contenido}» y la tarea se cerró sola.`
                  : `Esta tarea se cierra sola cuando ${tarea.asignado} termine «${tarea.contenido}». No se puede finalizar a mano.`}
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
        {vencida ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertTitle>Venció el {fechaCorta(tarea.finaliza)}</AlertTitle>
            <AlertDescription>
              <p>Para reabrirla o finalizarla, cambia la fecha de finalización.</p>
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {vencida ? (
            <CambiarFecha variante="default" etiqueta="Cambiar fecha" onElegir={(fecha) => acciones.onCambiarFecha(tarea, fecha)} />
          ) : finalizada ? (
            aprendizaje ? null : (
              <Button size="sm" variant="outline" onClick={() => acciones.onReabrir(tarea)}>
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} aria-hidden="true" />
                Reabrir tarea
              </Button>
            )
          ) : aprendizaje ? null : (
            <Button size="sm" onClick={() => acciones.onFinalizar(tarea)}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
              Finalizar tarea
            </Button>
          )}
          {finalizada ? null : (
            <Button size="sm" variant="outline" onClick={() => acciones.onRecordatorio(tarea)}>
              <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
              Recordatorio
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => acciones.onCopiarEnlace(tarea)}>
            <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />
            Copiar enlace
          </Button>
        </div>
      </FramePanel>

      <FramePanel className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Dato etiqueta="Asignado a">
            <Persona nombre={tarea.asignado} detalle={tarea.area} />
          </Dato>
        </div>
        <Dato etiqueta="Plan">
          <Text as="span" size="sm" className="line-clamp-2">
            {tarea.plan}
          </Text>
        </Dato>
        <Dato etiqueta="Tipo">
          <Text as="span" size="sm">
            {tarea.tipo}
          </Text>
        </Dato>
        <Dato etiqueta="Finaliza el:">
          <Text as="span" size="sm">
            {fechaCorta(tarea.finaliza)}
          </Text>
        </Dato>
        <Dato etiqueta="Tiempo">
          <Text as="span" size="sm" variant={vencida ? 'destructive' : 'default'}>
            {textoVencimiento(tarea.estado, tarea.finaliza)}
          </Text>
        </Dato>
      </FramePanel>

      {aprendizaje ? null : (
        <FramePanel className="flex flex-col gap-3">
          <Heading as="h3" level={6}>
            Subtareas
          </Heading>
          {total ? (
            <>
              <Progress value={Math.round((hechas / total) * 100)}>
                <ProgressLabel>Avance</ProgressLabel>
                <ProgressValue className="ms-auto">{() => `${hechas} de ${total} completadas`}</ProgressValue>
              </Progress>
              <div className="flex flex-col gap-2">
                {tarea.subtareas.map((s) => (
                  <Field key={s.id} orientation="horizontal">
                    <Checkbox
                      id={`sub-${s.id}`}
                      checked={s.hecha}
                      disabled={vencida}
                      onCheckedChange={(marcada) => acciones.onSubtarea(tarea, s.id, Boolean(marcada))}
                    />
                    <FieldLabel htmlFor={`sub-${s.id}`}>{s.titulo}</FieldLabel>
                  </Field>
                ))}
              </div>
            </>
          ) : (
            <Text as="p" variant="muted" size="sm">
              Esta tarea no tiene subtareas.
            </Text>
          )}
        </FramePanel>
      )}

      <FramePanel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Heading as="h3" level={6}>
            Historial
          </Heading>
          <Select value={filtro} onValueChange={(valor) => setFiltro(valor as FiltroHistorial)}>
            <SelectTrigger size="sm" className="w-52" aria-label="Qué mostrar en el historial">
              <SelectValue>{(valor) => FILTROS_HISTORIAL.find((f) => f.valor === valor)?.etiqueta}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FILTROS_HISTORIAL.map((f) => (
                <SelectItem key={f.valor} value={f.valor}>
                  {f.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {eventos.length ? (
          <ItemGroup className="gap-1">
            {eventos.map((e) => (
              <EntradaHistorial key={e.id} evento={e} />
            ))}
          </ItemGroup>
        ) : (
          <Text as="p" variant="muted" size="sm">
            {filtro === 'comentarios' ? 'Todavía no hay comentarios.' : 'Todavía no hay cambios registrados.'}
          </Text>
        )}
        <Field>
          <FieldLabel htmlFor={`comentario-${tarea.id}`}>Comentar</FieldLabel>
          <Textarea
            id={`comentario-${tarea.id}`}
            value={comentario}
            placeholder="Escribe un comentario para quien tiene la tarea"
            onChange={(e) => setComentario(e.target.value)}
          />
        </Field>
        <Button size="sm" variant="outline" className="self-end" disabled={!comentario.trim()} onClick={comentar}>
          <HugeiconsIcon icon={Comment01Icon} aria-hidden="true" />
          Comentar
        </Button>
      </FramePanel>
    </Frame>
  )
}
