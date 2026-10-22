import { HugeiconsIcon } from '@hugeicons/react'
import { BubbleChatIcon, UserRemove01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Text } from '@ubits/flux-ui'
import { plural } from '@/modules/design-system/patrones/formato'
import { Filas } from '@/modules/design-system/patrones/ficha'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { tituloEtapa, type Rechazada } from '../datos'
import { areasDeMejora } from '../perfil-candidato'
import { QUIEN_MUEVE, type Movimiento } from '../movimientos'
import { QUIEN_TEXTO, dondeSeQuedo, quienDe } from '../rechazos'

// Arriba del «Resumen» de alguien que está fuera del proceso: dónde se quedó, por qué, quién y cuándo, si le llegó el
// correo y la nota del equipo. Igual en las tres exploraciones.
// Va en el aviso rojo del sistema (`Alert` destructive, el de lo crítico en el inicio de Vacantes), en el mismo sitio
// donde alguien en proceso tiene su aviso de pendiente. Hasta el 1 oct era un bloque gris como los demás y no se notaba
// (Nicolás: «cuando uno entra no ve fácilmente que fue rechazado… en rojo con opacidad»). La etiqueta va junto al nombre,
// en la cabecera de la ficha, para que se vea en todas las pestañas.
export function BloqueRechazo({ rechazada, movimientos }: { rechazada: Rechazada; movimientos: Movimiento[] }) {
  const retiro = quienDe(rechazada) === 'candidato'
  const { candidatura } = rechazada
  // El rechazo de la sesión trae la entrevista que se canceló.
  const suyo = [...movimientos].reverse().find((m) => m.tipo === 'rechazo' || m.tipo === 'retiro')
  const cuando = rechazada.cuando
    ? `hoy a las ${new Date(rechazada.cuando).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`
    : candidatura.dias <= 1
      ? 'ayer'
      : `hace ${plural(candidatura.dias, '1 día', `${candidatura.dias} días`)}`
  const por = rechazada.por ? (rechazada.por === QUIEN_MUEVE ? 'Tú' : rechazada.por) : candidatura.vacante.reclutador.nombre
  // Lo que tiene por mejorar, según la IA: el mismo informe que se leyó al rechazarla.
  const mejora = retiro ? null : areasDeMejora(candidatura, movimientos)

  return (
    <Alert variant="destructive">
      <HugeiconsIcon icon={UserRemove01Icon} size={16} aria-hidden="true" />
      <AlertTitle>{dondeSeQuedo(rechazada)}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>Está fuera del proceso de {candidatura.vacante.titulo}; sigue en tu base de candidatos.</p>
        <Filas
          filas={[
            { termino: 'Motivo', valor: rechazada.motivo },
            { termino: 'Quién decidió', valor: QUIEN_TEXTO[quienDe(rechazada)] },
            { termino: 'Lo registró', valor: `${por} · ${cuando}` },
            {
              termino: 'Correo',
              // El correo sale al confirmar (decisión 4): la fecha en que le llegó es la del registro.
              valor: rechazada.avisada
                ? `Le llegó${rechazada.plantilla ? ` «${rechazada.plantilla}»` : ' el correo de rechazo'} · ${cuando}`
                : 'No se le escribió',
            },
            ...(suyo?.cancelada
              ? [
                  {
                    termino: 'Entrevista con la IA',
                    valor:
                      suyo.cancelada.respondidas !== undefined
                        ? `Cancelada: había respondido ${suyo.cancelada.respondidas} de ${suyo.cancelada.total}`
                        : `Cancelada sin abrir (${tituloEtapa(suyo.cancelada.etapa)})`,
                  },
                ]
              : []),
          ]}
        />
        {mejora ? (
          <div className="flex flex-col gap-1.5">
            <Text as="span" size="sm" weight="medium" className="flex items-center gap-1.5">
              <IconoIA />
              Lo que tiene por mejorar, según la IA
            </Text>
            {mejora.puntos.length ? (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                {mejora.puntos.map((punto) => (
                  <li key={punto}>{punto}</li>
                ))}
              </ul>
            ) : (
              <Text as="p" variant="muted" size="sm">
                No ve nada por mejorar para este cargo: cumple lo que pide la vacante.
              </Text>
            )}
          </div>
        ) : null}
        {rechazada.nota ? (
          <Text as="p" variant="muted" size="sm" className="flex items-start gap-1.5">
            <HugeiconsIcon icon={BubbleChatIcon} size={14} className="mt-0.5 shrink-0" aria-hidden />«{rechazada.nota}»
          </Text>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

// El pie de la ficha de alguien que está fuera: en lugar de «Rechazar / Mover / Avanzar», volver a considerarla.
export function PieRechazada({
  rechazada,
  onReconsiderar,
  onEscribir,
}: {
  rechazada: Rechazada
  onReconsiderar?: () => void
  // Se rechazó sin correo y ahora se le quiere avisar (VA-25).
  onEscribir?: () => void
}) {
  return (
    <>
      <Text as="span" variant="muted" size="sm" className="min-w-0 flex-1 truncate">
        {dondeSeQuedo(rechazada)} · {rechazada.motivo}
      </Text>
      {onEscribir && !rechazada.avisada ? (
        <Button variant="outline" onClick={onEscribir}>
          Enviarle el correo de rechazo
        </Button>
      ) : null}
      {onReconsiderar ? <Button onClick={onReconsiderar}>Volver a considerar</Button> : null}
    </>
  )
}
