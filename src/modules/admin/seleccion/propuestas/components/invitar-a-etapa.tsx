import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Mail01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from '@ubits/flux-ui'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { costoDeEtapa, creditos } from '../creditos'
import type { Candidatura } from '../datos'
import { useSinInvitacion } from '../movimientos'

// Quien entró a una etapa con IA sin invitación —se eligió «Solo moverla» o no alcanzaban los créditos— la recibe
// después (13 oct, PM: «la opción de solo moverlo de etapa o de ejecutar el agente en esa etapa»). Desde su tarjeta
// («⋯ › Enviar la invitación…») o su ficha (el aviso de arriba), con lo que cuesta a la vista antes de confirmar. Lo
// que hace al confirmar vive en `invitaciones.ts`.

const RUTA_CREDITOS = '/admin/seleccion/creditos/uno'

export function DialogoInvitar({
  abierto,
  onOpenChange,
  candidatura,
  borrador,
  onConfirmar,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  candidatura: Candidatura
  borrador: boolean
  onConfirmar: () => void
}) {
  const navegar = useNavigate()
  const etapa = useSinInvitacion(candidatura)
  if (!etapa) return null
  const costo = costoDeEtapa(etapa.id)
  const sinCupo = Boolean(costo && !borrador && !costo.alcanza)
  // El título dice qué es la ventana, siempre el mismo; a quién y dónde está, la bajada (títulos fijos, 1-oct).
  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      title="Enviar la invitación"
      // En la bajada y no en el cuerpo: dentro del panel de la ficha la vista solo lleva título y bajada.
      sub={`${candidatura.candidato.nombre} está en ${etapa.titulo} sin invitación: todavía no le ha escrito nadie.`}
      note="Queda en su historial y en Créditos, con tu nombre."
      confirmLabel="Enviar la invitación"
      confirmDisabled={sinCupo}
      pendingLabel="Enviando…"
      onConfirm={onConfirmar}
    >
      <Alert variant="info">
        <HugeiconsIcon icon={Mail01Icon} size={16} />
        <AlertTitle className="flex items-center gap-1.5">
          <IconoIA />
          {etapa.titulo} le escribe
        </AlertTitle>
        <AlertDescription>
          {borrador
            ? 'La vacante está en borrador: le llega la invitación a la entrevista cuando la publiques, no antes.'
            : 'Le llega la invitación a la entrevista unos segundos después de enviarla. Si deshaces a tiempo, no sale.'}
          {costo ? ` Cuesta ${creditos(costo.total)} créditos de ${costo.agente.nombre}; quedan ${creditos(costo.libre)} libres.` : ' No usa créditos.'}
        </AlertDescription>
      </Alert>
      {sinCupo && costo ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>No alcanzan los créditos de {costo.agente.nombre}</AlertTitle>
          <AlertDescription>
            Cuesta {creditos(costo.total)} y quedan {creditos(costo.libre)} libres. Pídelos o repártelos en Créditos y vuelve a
            enviarla.
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => navegar(RUTA_CREDITOS)}>
              Ir a Créditos
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
    </VentanaDeAccion>
  )
}

// El aviso de la ficha: está en la etapa sin invitación, no se han usado créditos y, si se puede, el botón para
// enviarla. Sin `onInvitar` (la ficha abierta donde no se mueve a nadie) solo lo dice.
export function AvisoSinInvitacion({ candidatura, onInvitar }: { candidatura: Candidatura; onInvitar?: () => void }) {
  const etapa = useSinInvitacion(candidatura)
  if (!etapa) return null
  const costo = costoDeEtapa(etapa.id)
  return (
    <Alert variant="warning">
      <HugeiconsIcon icon={Mail01Icon} size={16} />
      <AlertTitle>Está en {etapa.titulo} sin invitación</AlertTitle>
      <AlertDescription>
        {etapa.titulo} no le ha escrito y no se han usado créditos.
        {costo ? ` Invitarla cuesta ${creditos(costo.total)} créditos de ${costo.agente.nombre}.` : ''}
      </AlertDescription>
      {onInvitar ? (
        <AlertAction>
          <Button variant="outline" size="sm" onClick={onInvitar}>
            Enviar la invitación
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  )
}
