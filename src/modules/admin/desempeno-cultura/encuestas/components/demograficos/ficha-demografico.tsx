import type { ReactElement } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Copy01Icon, Delete02Icon, Edit02Icon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  FieldDescription,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { DEMOGRAPHIC_TYPES, demographicTypeTone } from '../../modelo/demographics'
import { SYSTEM_BLOCK_REASON, formatIsoDay, type DemographicRow } from '../../modelo/demographicRows'
import { TYPE_HINTS } from '../../modelo/demographicTypeHints'
import { TEXTO_POR_TONO } from '../tonos'

// El detalle de un dato demográfico, de solo lectura. Las tres acciones están siempre, también en
// uno del sistema: ahí editar y eliminar se apagan con su razón en vez de desaparecer, para que
// nadie tenga que adivinar si la acción no existe o si no la puede hacer.

export function FichaDemografico({
  fila,
  onCerrar,
  onEditar,
  onDuplicar,
  onEliminar,
}: {
  fila: DemographicRow | null
  onCerrar: () => void
  onEditar: (fila: DemographicRow) => void
  onDuplicar: (fila: DemographicRow) => void
  onEliminar: (fila: DemographicRow) => void
}) {
  const delSistema = fila?.origin === 'system'
  const tipo = fila ? DEMOGRAPHIC_TYPES.find((entrada) => entrada.value === fila.type) : undefined

  // Un botón apagado no recibe el cursor: la razón va en su contenedor.
  const bloqueable = (boton: ReactElement) =>
    delSistema ? (
      <Hint label={SYSTEM_BLOCK_REASON}>
        <span>{boton}</span>
      </Hint>
    ) : (
      boton
    )

  return (
    <DrawerShell
      open={fila !== null}
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      size="md"
      kicker="Dato demográfico"
      title={fila?.name ?? ''}
      description="Detalle del dato demográfico"
      badge={fila ? <Badge variant={delSistema ? 'info-outline' : 'outline'}>{fila.originLabel}</Badge> : undefined}
      footer={
        fila ? (
          <div className="flex w-full items-center justify-between gap-2">
            {/* Eliminar abajo a la izquierda, en el rojo del design system (Botones › Peligro): abre la confirmación. */}
            {bloqueable(
              <Button variant="destructive" disabled={delSistema} onClick={() => onEliminar(fila)}>
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" data-icon="inline-start" />
                Eliminar
              </Button>,
            )}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onDuplicar(fila)}>
                <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                Duplicar
              </Button>
              {bloqueable(
                <Button disabled={delSistema} onClick={() => onEditar(fila)}>
                  <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                  Editar
                </Button>,
              )}
            </div>
          </div>
        ) : undefined
      }
    >
      {fila ? (
        <div className="flex flex-col gap-6">
          <FieldSet>
            <FieldLegend>Origen</FieldLegend>
            <FieldDescription>
              {delSistema
                ? 'Variable propia de la plataforma: sus opciones son fijas porque alimentan datos que ya tiene de cada participante.'
                : 'Creado por una persona de tu equipo para segmentar los resultados.'}
            </FieldDescription>
            {fila.createdAt !== null || fila.createdBy !== null ? (
              // px-0! en las dos filas: a ras del panel, alineadas con el resto de la ficha; el relleno de la fila no se quita con
              // una clase normal (ficha instalacion-estilos-sin-capa en ai-tools/flux-ui/diferencias.json).
              <ItemGroup>
                {fila.createdAt !== null ? (
                  <Item size="xs" className="px-0!">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemDescription>Creado el {formatIsoDay(fila.createdAt)}</ItemDescription>
                    </ItemContent>
                  </Item>
                ) : null}
                {fila.createdBy !== null ? (
                  // px-0!: como la fila de arriba (ficha instalacion-estilos-sin-capa).
                  <Item size="xs" className="px-0!">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={UserIcon} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemDescription>{fila.createdBy}</ItemDescription>
                    </ItemContent>
                  </Item>
                ) : null}
              </ItemGroup>
            ) : null}
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Tipo de respuesta</FieldLegend>
            <Item variant="outline" size="sm">
              {tipo ? (
                <ItemMedia>
                  <IconTile variant="soft" size="sm" className={TEXTO_POR_TONO[demographicTypeTone(fila.type)]}>
                    <HugeiconsIcon icon={tipo.icon} aria-hidden="true" />
                  </IconTile>
                </ItemMedia>
              ) : null}
              <ItemContent>
                <ItemTitle>{fila.typeLabel}</ItemTitle>
                <ItemDescription>{TYPE_HINTS[fila.type]}</ItemDescription>
              </ItemContent>
            </Item>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>
              Opciones de respuesta ({fila.optionLabels.length})
            </FieldLegend>
            <FieldDescription>Los valores que los participantes pueden elegir al responder.</FieldDescription>
            <ItemGroup>
              {fila.optionLabels.map((opcion, indice) => (
                <Item key={opcion} size="xs">
                  <ItemMedia>
                    <Text as="span" size="xs" variant="muted" className="w-4 text-right tabular-nums">
                      {indice + 1}
                    </Text>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{opcion}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </FieldSet>
        </div>
      ) : null}
    </DrawerShell>
  )
}
