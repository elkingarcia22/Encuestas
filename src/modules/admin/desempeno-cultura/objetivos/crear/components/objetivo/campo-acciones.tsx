import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Flag02Icon, HashtagIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Badge, Button, Field, FieldLabel, Input, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, Item, ItemGroup, ItemSeparator, Switch, Text, ToggleGroup, ToggleGroupItem } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { CampoFecha } from '@/modules/design-system/formularios/rango-de-fechas'
import { KEY_ACTION_KIND_META, TOTAL_WEIGHT, createKeyAction, distributeWeights, keyActionsTotal, type KeyAction, type KeyActionKind, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import type { ObjectiveModelVocab } from '../../../modelo/constructor/objectiveModel'

// Paso 7 · Acciones / resultados clave (solo asignados), con el vocabulario del modelo: «Resultados clave» en OKR,
// «Tareas de seguimiento» en KPI, «Hitos» en MBO… Cada fila: qué hay que hacer, si es un hito o una cantidad (y cuántas
// veces), la fecha límite y, si las acciones mueven el avance, cuánto aporta. Mover el avance es un interruptor solo
// cuando el modelo lo deja elegir: los resultados clave siempre lo mueven y las tareas de seguimiento nunca.

export type ModoAvance = 'siempre' | 'nunca' | 'eleccion'

const ICONO_TIPO: Record<KeyActionKind, typeof Flag02Icon> = { hito: Flag02Icon, cantidad: HashtagIcon }

const aFecha = (valor: string): Date | undefined => {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  return partes ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])) : undefined
}
const aTexto = (fecha: Date | undefined) => (fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : '')

function FilaAccion({
  accion,
  posicion,
  hijo,
  mueve,
  conErrores,
  onCambio,
  onQuitar,
}: {
  accion: KeyAction
  posicion: number
  hijo: string
  mueve: boolean
  conErrores: boolean
  onCambio: (cambio: Partial<KeyAction>) => void
  onQuitar: () => void
}) {
  const sinNombre = conErrores && accion.title.trim() === ''
  const sinCantidad = conErrores && accion.kind === 'cantidad' && accion.targetCount.trim() === ''
  return (
    <Item size="sm" className="flex-col items-stretch! gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" radius="full" size="xs" className="shrink-0 tabular-nums">
          {posicion}
        </Badge>
        <Input
          className="min-w-0 flex-1 bg-background!"
          value={accion.title}
          aria-label={`${hijo} ${posicion}`}
          aria-invalid={sinNombre || undefined}
          placeholder="Qué hay que hacer: “Cerrar 10 demos con clientes nuevos”"
          onChange={(evento) => onCambio({ title: evento.target.value })}
        />
        <Hint label="Eliminar acción">
          <BotonIcono aria-label={`Eliminar ${hijo.toLowerCase()} ${posicion}`} className="text-destructive!" onClick={onQuitar}>
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          </BotonIcono>
        </Hint>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ps-8">
        <ToggleGroup aria-label="Cómo se verifica" value={[accion.kind]} onValueChange={(valor) => valor.length && onCambio({ kind: valor[0] as KeyActionKind })} variant="outline" size="sm" spacing={0}>
          {(Object.keys(KEY_ACTION_KIND_META) as KeyActionKind[]).map((tipo) => (
            <Hint key={tipo} label={KEY_ACTION_KIND_META[tipo].tagline}>
              <ToggleGroupItem value={tipo} className="px-3">
                <HugeiconsIcon icon={ICONO_TIPO[tipo]} aria-hidden="true" />
                {KEY_ACTION_KIND_META[tipo].label}
              </ToggleGroupItem>
            </Hint>
          ))}
        </ToggleGroup>
        {accion.kind === 'cantidad' ? (
          <div className="flex items-center gap-2">
            <Text as="span" size="sm" variant="muted">
              Meta
            </Text>
            <Input
              className="w-16 bg-background! text-center tabular-nums"
              inputMode="numeric"
              value={accion.targetCount}
              placeholder="10"
              aria-label={`Cuántas veces se hace la acción ${posicion}`}
              aria-invalid={sinCantidad || undefined}
              onChange={(evento) => onCambio({ targetCount: evento.target.value.replace(/[^0-9.,]/g, '') })}
            />
            <Text as="span" size="sm" variant="muted">
              veces
            </Text>
          </div>
        ) : null}
        <div className="w-52">
          <CampoFecha valor={aFecha(accion.dueDate)} onCambio={(fecha) => onCambio({ dueDate: aTexto(fecha) })} placeholder="Fecha límite: sin definir" />
        </div>
        {mueve ? (
          <div className="ms-auto flex items-center gap-2">
            <Text as="span" size="sm" variant="muted">
              Aporta
            </Text>
            <div className="w-20">
              <InputGroup className="bg-background!">
                <InputGroupInput
                  inputMode="numeric"
                  className="text-end tabular-nums"
                  value={String(accion.contribution)}
                  aria-label={`Aporte de la acción ${posicion}`}
                  onChange={(evento) => {
                    const leido = Number.parseInt(evento.target.value.replace(/[^0-9]/g, ''), 10)
                    onCambio({ contribution: Number.isNaN(leido) ? 0 : Math.max(0, Math.min(TOTAL_WEIGHT, leido)) })
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>%</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        ) : null}
      </div>
    </Item>
  )
}

export function CampoAcciones({
  objetivo,
  onCambio,
  vocab,
  modo,
  conErrores,
}: {
  objetivo: Objective
  onCambio: (cambio: Partial<Objective>) => void
  vocab: ObjectiveModelVocab
  modo: ModoAvance
  conErrores: boolean
}) {
  const acciones = objetivo.keyActions
  const total = keyActionsTotal(acciones)
  const exacto = total === TOTAL_WEIGHT
  const hijo = vocab.child ?? 'Acción clave'
  const hijos = (vocab.children ?? 'Acciones clave').toLowerCase()
  const masculino = vocab.childrenGender === 'm'
  const mueve = modo === 'siempre' ? true : modo === 'nunca' ? false : objetivo.keyActionsDriveProgress

  const cambiarAccion = (id: string, cambio: Partial<KeyAction>) => onCambio({ keyActions: acciones.map((accion) => (accion.id === id ? { ...accion, ...cambio } : accion)) })
  const repartir = () => {
    const partes = distributeWeights(acciones.length, TOTAL_WEIGHT)
    onCambio({ keyActions: acciones.map((accion, indice) => ({ ...accion, contribution: partes[indice] })) })
  }
  // Al encender el avance sin aportes, se reparte por igual: si no, el interruptor deja el objetivo roto de inmediato.
  const cambiarAvance = (activo: boolean) => {
    if (activo && acciones.length > 0 && total === 0) {
      const partes = distributeWeights(acciones.length, TOTAL_WEIGHT)
      onCambio({ keyActionsDriveProgress: true, keyActions: acciones.map((accion, indice) => ({ ...accion, contribution: partes[indice] })) })
      return
    }
    onCambio({ keyActionsDriveProgress: activo })
  }

  return (
    <>
      {modo === 'eleccion' ? (
        <Field orientation="horizontal" className="w-auto!">
          <Switch id={`objetivo-${objetivo.id}-avance`} checked={objetivo.keyActionsDriveProgress} onCheckedChange={cambiarAvance} />
          <FieldLabel htmlFor={`objetivo-${objetivo.id}-avance`}>
            El avance se calcula con {masculino ? 'estos' : 'estas'} {hijos}
          </FieldLabel>
        </Field>
      ) : null}
      <Text as="p" size="sm" variant="muted">
        {mueve
          ? `${masculino ? 'Cada uno' : 'Cada una'} suma su aporte al avance del objetivo. Entre ${masculino ? 'todos' : 'todas'} deben cubrir el ${TOTAL_WEIGHT} %.`
          : `${masculino ? 'Los' : 'Las'} ${hijos} son el plan de trabajo: quedan a la vista del equipo, pero el avance lo sigue marcando la cifra del objetivo.`}
      </Text>

      {acciones.length > 0 ? (
        <ItemGroup className="gap-0! rounded-lg border">
          {acciones.map((accion, indice) => (
            <div key={accion.id}>
              {indice > 0 ? <ItemSeparator /> : null}
              <FilaAccion
                accion={accion}
                posicion={indice + 1}
                hijo={hijo}
                mueve={mueve}
                conErrores={conErrores}
                onCambio={(cambio) => cambiarAccion(accion.id, cambio)}
                onQuitar={() => onCambio({ keyActions: acciones.filter((otra) => otra.id !== accion.id) })}
              />
            </div>
          ))}
        </ItemGroup>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => onCambio({ keyActions: [...acciones, createKeyAction(mueve ? Math.max(0, TOTAL_WEIGHT - total) : 0)] })}>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
          {acciones.length === 0 ? `Añadir ${masculino ? 'un' : 'una'} ${hijo.toLowerCase()}` : `Añadir ${masculino ? 'otro' : 'otra'} ${hijo.toLowerCase()}`}
        </Button>
        {mueve && acciones.length > 0 ? (
          <div className="flex items-center gap-2">
            {exacto ? null : (
              <Button variant="ghost" size="sm" onClick={repartir}>
                Repartir por igual
              </Button>
            )}
            <Badge variant={exacto ? 'success-light' : conErrores ? 'destructive-light' : 'secondary'} className="tabular-nums">
              {total} / {TOTAL_WEIGHT} %
            </Badge>
          </div>
        ) : null}
      </div>
    </>
  )
}
