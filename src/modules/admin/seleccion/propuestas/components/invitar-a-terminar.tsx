import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MailBlock01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { notifyAction } from '@/shared/components/notify'
import { fechaSinAnio, isoHaceDias } from '@/modules/design-system/patrones/formato'
import { anotarCorreo, baseDeCandidatos } from '../base'
import { CANDIDATURAS, PLAZO_ENTREVISTA, tituloEtapa } from '../datos'
import { QUIEN_MUEVE, registroDeMovimientos, useMovimientos, type Movimiento } from '../movimientos'
import { horaDe } from '../perfil-candidato'
import { VistaPreviaCorreo } from './vista-previa-correo'
import { noSeGuardo } from '../simular'

export const ASUNTO_TERMINAR = 'Termina tu entrevista con Serena AI'

// Lo que ya se le envió para terminar la entrevista, si se le envió: el último correo con ese asunto.
export function useInvitacionATerminar(candidaturaId: string) {
  const movimientos = useMovimientos(candidaturaId)
  return [...movimientos].reverse().find((movimiento) => movimiento.tipo === 'correo' && movimiento.aviso === ASUNTO_TERMINAR)
}

// Invitarla a terminar la entrevista con Serena que se cortó (CA-37): retoma en la pregunta donde iba, con el mismo
// plazo de siempre. Se ve el correo antes de enviarlo, queda en su historia y el aviso trae «Deshacer». Lo usan el
// aviso de «Resumen» y la etapa en «Etapas», así que dicen y hacen lo mismo.
export function InvitarATerminar({ candidaturaId, desde }: { candidaturaId: string; desde: number }) {
  const [abierta, setAbierta] = useState(false)
  const enviada = useInvitacionATerminar(candidaturaId)
  const candidatura = CANDIDATURAS.find((una) => una.id === candidaturaId)
  if (!candidatura) return null
  const nombre = candidatura.candidato.nombre.split(' ')[0]
  if (baseDeCandidatos.deId(candidatura.personaId)?.noContactar) {
    return (
      <Badge variant="secondary">
        <HugeiconsIcon icon={MailBlock01Icon} size={12} aria-hidden />
        No recibe correos
      </Badge>
    )
  }
  const texto = `Hola, {nombre}:\n\nTu entrevista con Serena AI para «{vacante}» se cortó antes de terminar. Puedes retomarla desde la pregunta ${desde} con el mismo enlace: lo que ya respondiste queda guardado. Tienes hasta el ${fechaSinAnio(
    isoHaceDias(-PLAZO_ENTREVISTA),
  )}.`
  const enviar = () => {
    if (noSeGuardo(`terminar:${candidatura.id}`, `No pudimos invitar a ${nombre}`, enviar, 'No salió ningún correo.')) {
      setAbierta(false)
      return
    }
    const movimiento: Movimiento = {
      id: `ficha-terminar-${candidatura.id}-${Date.now()}`,
      tipo: 'correo',
      candidaturaId: candidatura.id,
      desde: candidatura.etapa,
      hacia: candidatura.etapa,
      cuando: Date.now(),
      dias: candidatura.dias,
      quien: QUIEN_MUEVE,
      saltadas: [],
      aviso: ASUNTO_TERMINAR,
    }
    registroDeMovimientos.agregar([movimiento])
    const deshacerCorreo = anotarCorreo([candidatura.personaId], ASUNTO_TERMINAR)
    setAbierta(false)
    notifyAction(
      `Invitamos a ${nombre} a terminarla`,
      `Retoma en la pregunta ${desde} · tiene ${PLAZO_ENTREVISTA} días.`,
      {
        label: 'Deshacer',
        onClick: () => {
          registroDeMovimientos.quitar([movimiento.id])
          deshacerCorreo()
        },
      },
      'success',
    )
  }
  return (
    <>
      <Button variant="outline" size="sm" className="w-fit" onClick={() => setAbierta(true)}>
        {enviada ? 'Invitarla otra vez' : 'Invitarla a terminarla'}
      </Button>
      {abierta ? (
        <VentanaDeAccion
          open
          onOpenChange={setAbierta}
          title={`Invitar a ${nombre} a terminar la entrevista`}
          sub={enviada ? `Ya se la enviaste hoy a las ${horaDe(enviada.cuando)}.` : `Le llega a ${candidatura.candidato.correo}.`}
          note="Queda en su historial, con tu nombre."
          confirmLabel="Enviar la invitación"
          pendingLabel="Enviando…"
          onConfirm={enviar}
        >
          <VistaPreviaCorreo
            texto={texto}
            asunto={ASUNTO_TERMINAR}
            datos={{ nombre, vacante: candidatura.vacante.titulo, etapa: tituloEtapa(candidatura.etapa) }}
          />
        </VentanaDeAccion>
      ) : null}
    </>
  )
}
