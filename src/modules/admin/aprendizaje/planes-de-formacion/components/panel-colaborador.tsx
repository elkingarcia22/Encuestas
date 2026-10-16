import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Progress,
  ProgressLabel,
  ProgressValue,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { iniciales, plural } from '@/modules/design-system/patrones/formato'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { fichaDe } from './catalogo'
import { usuarioDe } from './grupos-datos'
import { TIPOS, aQuien, enfoqueDe, itemsDe, type Plan } from './planes-datos'
import type { Participante } from '@/modules/design-system/templates/planes-formacion/components/datos'

// «Detalle de colaborador»: cómo va una persona en el plan, ítem por ítem, y desde qué asignación le llegó.
// Lo que ya terminó va primero; el que tiene abierto, «En curso»; el resto, sin iniciar.

// El estado de cada ítem en las palabras de la tarjeta de contenido del equipo: «Completado» o «En progreso»; lo que no
// se ha empezado no lleva estado.
const ESTADO_ITEM = { hecho: 'completado', curso: 'en-progreso', pendiente: undefined } as const

export function PanelColaborador({
  abierto,
  onAbiertoChange,
  plan,
  participante,
  onRecordar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  plan: Plan
  participante: Participante
  onRecordar: () => void
}) {
  const textos = TIPOS[plan.tipo]
  // El id es «<asignación>-<usuario>»: de ahí salen su asignación y su ficha.
  const idUsuario = participante.id.match(/(u-\d+)$/)?.[1] ?? ''
  const usuario = usuarioDe(idUsuario)
  const asignacion = plan.asignaciones.find((a) => participante.id.startsWith(`${a.id}-`))
  const items = itemsDe(plan, participante.id)
  const estadoDe = (indice: number) =>
    indice < participante.hechos ? 'hecho' : indice === participante.hechos && participante.ultimoAcceso && participante.progreso < 100 ? 'curso' : 'pendiente'
  const termino = participante.progreso === 100

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="md"
      media={
        <Avatar size="lg">
          <AvatarFallback>{iniciales(participante.nombre)}</AvatarFallback>
        </Avatar>
      }
      title={participante.nombre}
      description={usuario ? `${usuario.cargo} · ${usuario.area} · ${usuario.username}` : participante.area}
      footerClassName="justify-between!"
      footer={
        <>
          <Button variant="outline" onClick={() => onAbiertoChange(false)}>
            Cerrar
          </Button>
          {termino || plan.estado === 'No vigente' ? null : (
            <Button onClick={onRecordar}>
              <HugeiconsIcon icon={Mail01Icon} size={16} aria-hidden="true" />
              Enviar recordatorio
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Progress value={participante.progreso}>
          <ProgressLabel>
            {participante.hechos} de {participante.total} {plural(participante.total, textos.item, textos.items)}
          </ProgressLabel>
          <ProgressValue className="ms-auto" />
        </Progress>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Text as="span" variant="muted" size="sm">
              Último acceso
            </Text>
            <Text as="span" size="sm">
              {participante.ultimoAcceso ?? 'Nunca ha entrado al plan'}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text as="span" variant="muted" size="sm">
              Último avance
            </Text>
            <Text as="span" size="sm">
              {participante.ultimoProgreso ?? '—'}
            </Text>
          </div>
          {asignacion ? (
            <div className="col-span-2 flex flex-col gap-1">
              <Text as="span" variant="muted" size="sm">
                Le llegó por
              </Text>
              <Text as="span" size="sm">
                {asignacion.alcance === 'colaboradores' ? 'Asignación por colaborador' : aQuien(asignacion)}
              </Text>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Text as="div" size="sm" weight="semibold" role="heading" aria-level={3}>
            {textos.items.charAt(0).toUpperCase() + textos.items.slice(1)}
          </Text>
          <div className="grid grid-cols-2 gap-3">
            {items.map((titulo, indice) => (
              // La tarjeta de contenido del equipo (decisión 17 de la auditoría, 5-oct), con el estado de la persona.
              <TarjetaContenido
                key={titulo}
                {...fichaDe(plan.tipo, titulo, { horas: plan.horas, enfoque: enfoqueDe(plan, titulo) })}
                estado={ESTADO_ITEM[estadoDe(indice)]}
                className="h-full"
              />
            ))}
          </div>
        </div>
      </div>
    </DrawerShell>
  )
}
