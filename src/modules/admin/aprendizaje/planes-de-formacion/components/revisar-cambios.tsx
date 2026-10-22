import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, MinusSignCircleIcon, PlusSignCircleIcon } from '@hugeicons/core-free-icons'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Text } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { plural } from '@/modules/design-system/patrones/formato'
import type { LineaCambio, Tono } from './cambios'

// «Revisa los cambios antes de guardar»: con un plan que ya le llegó a la gente, cada cambio le llega a alguien. La
// ventana dice a quién —quién entra, quién sale, qué contenido gana o pierde cada grupo de personas y cuántas ya lo
// habían empezado— y nada se aplica hasta «Guardar» (decisión del 14-oct). Es una ventana con contenido: ActionDialog.

const ICONO: Record<Tono, typeof PlusSignCircleIcon> = {
  suma: PlusSignCircleIcon,
  resta: MinusSignCircleIcon,
  cambio: ArrowDataTransferHorizontalIcon,
}

export function ListaCambios({ lineas }: { lineas: LineaCambio[] }) {
  return (
    <div className="-mx-2 flex flex-col divide-y">
      {lineas.map((linea) => (
        <Item key={linea.id} size="xs">
          <ItemMedia variant="icon">
            <HugeiconsIcon icon={ICONO[linea.tono]} aria-hidden="true" className={linea.tono === 'resta' ? 'text-destructive' : linea.tono === 'suma' ? 'text-success' : undefined} />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="whitespace-normal">{linea.texto}</ItemTitle>
            {linea.detalle ? <ItemDescription>{linea.detalle}</ItemDescription> : null}
          </ItemContent>
        </Item>
      ))}
    </div>
  )
}

export function RevisarCambios({
  abierto,
  onAbiertoChange,
  nombre,
  lineas,
  llega,
  onGuardar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  nombre: string
  lineas: LineaCambio[]
  // Si el plan ya le llegó a la gente (Vigente o Procesando): el cambio se nota de inmediato.
  llega: boolean
  onGuardar: () => void
}) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      title="Revisa los cambios antes de guardar"
      sub={llega ? 'El plan ya les llegó a las personas: lo que guardes lo ven en su Zona de estudio de inmediato.' : 'El plan todavía no empieza: las personas lo verán así el día de inicio.'}
      lead={
        <Text as="p" size="sm" weight="semibold">
          {nombre} · {lineas.length} {plural(lineas.length, 'cambio', 'cambios')}
        </Text>
      }
      cancelLabel="Seguir editando"
      confirmLabel="Guardar cambios"
      pendingLabel="Guardando…"
      onConfirm={onGuardar}
    >
      <ListaCambios lineas={lineas} />
    </ActionDialog>
  )
}
