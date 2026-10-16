import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  Image01Icon,
  MoreVerticalIcon,
  Presentation01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Text,
  Textarea,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { cambiarTipo, escenaEnBlanco, type Escena, type Proyecto, type TipoEscena } from './proyecto'

// «Borrador de escenas» (columna derecha del setup): el guion, el tipo y el orden de cada escena antes de pasar al
// editor. Se arrastra para reordenar, se cambia el tipo (Imagen, Avatar si el setup lo prendió, Canvas; el video
// no se ofrece aquí), se mueve o elimina desde el menú y se escribe la voz en off en el sitio.

const TIPOS: { id: TipoEscena; label: string; icono: typeof Image01Icon }[] = [
  { id: 'imagen', label: 'Imagen', icono: Image01Icon },
  { id: 'avatar', label: 'Avatar', icono: UserIcon },
  { id: 'canvas', label: 'Canvas', icono: Presentation01Icon },
]

type Props = {
  proyecto: Proyecto
  onProyecto: (p: Proyecto) => void
  deshabilitado?: boolean
}

export function BorradorEscenas({ proyecto, onProyecto, deshabilitado }: Props) {
  const [eliminar, setEliminar] = useState<string | null>(null)
  const escenas = proyecto.escenas
  const conAvatar = proyecto.setup.avatarId != null

  const cambiar = (id: string, cambio: (e: Escena) => Escena) => onProyecto({ ...proyecto, escenas: escenas.map((e) => (e.id === id ? cambio(e) : e)) })
  const mover = (i: number, delta: number) => {
    const lista = [...escenas]
    const [e] = lista.splice(i, 1)
    lista.splice(i + delta, 0, e)
    onProyecto({ ...proyecto, escenas: lista })
  }

  return (
    <div className={cn('flex flex-col gap-4 p-6', deshabilitado && 'pointer-events-none opacity-50')} inert={deshabilitado || undefined}>
      <Sortable value={escenas} onValueChange={(lista) => onProyecto({ ...proyecto, escenas: lista })} getItemValue={(e) => e.id} className="flex flex-col gap-2">
        {escenas.map((e, i) => {
          const tipo = TIPOS.find((t) => t.id === e.tipo)
          return (
            <SortableItem key={e.id} value={e.id}>
              <Card size="sm">
              <CardContent className="flex gap-2 max-[640px]:px-2">
              {/* El asidero, centrado en el alto de la tarjeta y sin miniatura al lado: en el borrador se trabaja el
                  guion, la imagen llega en el editor (el jefe de Dave, 14-oct). */}
              <SortableItemHandle aria-label={`Arrastrar escena ${i + 1} para reordenar`} className="flex items-center self-stretch text-muted-foreground">
                <HugeiconsIcon icon={DragDropVerticalIcon} size={16} aria-hidden="true" />
              </SortableItemHandle>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Text as="span" size="xs" weight="semibold" variant="muted">
                    Escena {String(i + 1).padStart(2, '0')}
                  </Text>
                  <Text as="span" size="xs" variant="muted">
                    Tipo:
                  </Text>
                  <DropdownMenu>
                    <Hint label="Tipo de escena">
                      <DropdownMenuTrigger render={<Button variant="outline" size="xs" aria-label={`Tipo de escena ${i + 1}: ${tipo?.label ?? 'sin tipo'}`} />}>
                        {tipo ? <HugeiconsIcon icon={tipo.icono} data-icon="inline-start" aria-hidden="true" /> : null}
                        {tipo?.label ?? 'Elegir'}
                        <HugeiconsIcon icon={ArrowDown01Icon} data-icon="inline-end" aria-hidden="true" />
                      </DropdownMenuTrigger>
                    </Hint>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuGroup>
                        <DropdownMenuRadioGroup value={e.tipo ?? ''} onValueChange={(v) => cambiar(e.id, (x) => cambiarTipo(x, v as TipoEscena, proyecto))}>
                          {TIPOS.filter((t) => t.id !== 'avatar' || conAvatar).map((t) => (
                            <DropdownMenuRadioItem key={t.id} value={t.id} closeOnClick>
                              <HugeiconsIcon icon={t.icono} size={16} aria-hidden="true" />
                              {t.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="ml-auto">
                    <DropdownMenu>
                      <Hint label="Opciones">
                        <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Opciones de la escena ${i + 1}`} />}>
                          <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                        </DropdownMenuTrigger>
                      </Hint>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuItem disabled={i === 0} onClick={() => mover(i, -1)}>
                            Mover arriba
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={i === escenas.length - 1} onClick={() => mover(i, 1)}>
                            Mover abajo
                          </DropdownMenuItem>
                          {escenas.length > 1 ? (
                            <DropdownMenuItem variant="destructive" onClick={() => setEliminar(e.id)}>
                              <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                              Eliminar
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <Textarea
                  aria-label={`Voz en off de la escena ${i + 1}`}
                  placeholder="Escribe la voz en off de esta escena"
                  value={e.guion}
                  rows={2}
                  className="field-sizing-content min-h-14"
                  onChange={(ev) => {
                    const guion = ev.target.value
                    cambiar(e.id, (x) => ({ ...x, guion }))
                  }}
                />
              </div>
              </CardContent>
              </Card>
            </SortableItem>
          )
        })}
      </Sortable>

      <div>
        <Button variant="outline" size="sm" onClick={() => onProyecto({ ...proyecto, escenas: [...escenas, escenaEnBlanco()] })}>
          <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" aria-hidden="true" />
          Añadir escena
        </Button>
      </div>

      <DialogoConfirmar
        abierto={eliminar != null}
        onAbiertoChange={(v) => !v && setEliminar(null)}
        icono={Delete02Icon}
        titulo="¿Eliminar esta escena?"
        descripcion="Su guion y su imagen se pierden. No se puede deshacer."
        accion="Eliminar escena"
        destructiva
        onConfirmar={() => {
          onProyecto({ ...proyecto, escenas: escenas.filter((e) => e.id !== eliminar) })
          setEliminar(null)
        }}
      />
    </div>
  )
}
