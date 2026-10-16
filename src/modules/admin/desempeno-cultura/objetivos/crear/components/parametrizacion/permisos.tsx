import { Field, FieldLabel, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Switch, Text } from '@ubits/flux-ui'
import type { CicloDraft } from '../../../modelo/constructor/cicloBuilderTypes'
import { DEFAULT_CICLO_PERMISSIONS, PERMISSION_ACTION_LABELS, PERMISSION_GROUPS, type CicloPermissionAction, type CicloPermissionScope } from '../../../modelo/constructor/permisos'

// Bloque 4 · Permisos del ciclo: qué puede hacer cada rol con sus objetivos mientras el ciclo corre. Una caja por rol
// (líder y colaborador) con un interruptor por permiso. A diferencia del prototipo, lo que se cambia se guarda con el
// ciclo.

const ROLES = [...new Set(PERMISSION_GROUPS.map((grupo) => grupo.role))]

export function BloquePermisos({ borrador, onCambio }: { borrador: CicloDraft; onCambio: (cambio: Partial<CicloDraft>) => void }) {
  const permisos = borrador.permissions ?? DEFAULT_CICLO_PERMISSIONS
  const cambiar = (alcance: CicloPermissionScope, accion: CicloPermissionAction, activo: boolean) => onCambio({ permissions: { ...permisos, [alcance]: { ...permisos[alcance], [accion]: activo } } })

  return (
    <>
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm" weight="medium">
          Permisos por rol
        </Text>
        <Text as="span" size="sm" variant="muted">
          Qué puede hacer cada rol con sus objetivos durante este ciclo.
        </Text>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((rol) => {
          const grupos = PERMISSION_GROUPS.filter((grupo) => grupo.role === rol)
          return (
            <Frame key={rol}>
              <FrameHeader>
                <FrameTitle>{rol}</FrameTitle>
                <FrameDescription>{grupos[0].roleDetail}</FrameDescription>
              </FrameHeader>
              <FramePanel className="flex flex-col gap-5">
                {grupos.map((grupo) => (
                  <div key={grupo.scope} className="flex flex-col gap-3">
                    <Text as="span" size="xs" weight="semibold" variant="muted">
                      {grupo.title}
                    </Text>
                    {grupo.actions.map((accion) => {
                      const id = `permiso-${grupo.scope}-${accion}`
                      return (
                        <Field key={accion} orientation="horizontal" className="justify-between">
                          <FieldLabel htmlFor={id} className="font-normal!">
                            {PERMISSION_ACTION_LABELS[accion]}
                          </FieldLabel>
                          <Switch id={id} checked={permisos[grupo.scope][accion] ?? false} onCheckedChange={(activo) => cambiar(grupo.scope, accion, activo)} />
                        </Field>
                      )
                    })}
                  </div>
                ))}
              </FramePanel>
            </Frame>
          )
        })}
      </div>
    </>
  )
}
