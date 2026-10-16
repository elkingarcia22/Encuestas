import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { tituloEtapa, type Rechazada, type VacanteUI } from '../datos'
import { TEXTO_RETOMAR, dondeSeQuedo, quienDe } from '../rechazos'
import { entrevistaDe, movimientosDe } from '../movimientos'

// Volver a considerar a alguien que se rechazó o que se retiró. Antes era un clic y un aviso; ahora se decide a qué
// etapa vuelve y, lo más importante, si se le escribe: si ya le llegó el correo de rechazo, cree que está fuera, así que
// escribirle viene prendido. Si no le llegó nada, no se entera del cambio salvo que se le escriba.

export type DecisionReconsiderar = {
  destino: string
  correo: string | null
  comentario: string
}

export function DialogoReconsiderar({
  abierto,
  onOpenChange,
  rechazada,
  vacante,
  onConfirmar,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  rechazada: Rechazada
  vacante: VacanteUI
  onConfirmar: (decision: DecisionReconsiderar) => void
}) {
  const { candidatura, avisada } = rechazada
  const nombre = candidatura.candidato.nombre.split(' ')[0]
  const [destino, setDestino] = useState(candidatura.etapa)
  const [escribir, setEscribir] = useState(avisada)
  const [texto, setTexto] = useState(TEXTO_RETOMAR)
  const [comentario, setComentario] = useState('')
  const etapaDestino = vacante.etapas.find((etapa) => etapa.id === destino)
  // Si vuelve a la etapa de IA donde estaba, la entrevista solo se conserva si ya la había hecho (VA-07).
  const entrevistaHecha = etapaDestino
    ? entrevistaDe(candidatura, etapaDestino, vacante.etapas, movimientosDe(candidatura.id))?.tipo === 'hecha'
    : false
  const retiro = quienDe(rechazada) === 'candidato'

  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title={`Volver a considerar a ${candidatura.candidato.nombre}`}
      sub={`Vuelve al proceso de ${vacante.titulo}, con todo lo que ya hizo.`}
      note="Se puede deshacer desde el aviso."
      confirmLabel="Volver a considerar"
      pendingLabel="Volviendo a considerar…"
      confirmDisabled={escribir && !texto.trim()}
      onConfirm={() => onConfirmar({ destino, correo: escribir ? texto : null, comentario: comentario.trim() })}
    >
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>
            {candidatura.candidato.nombre}
            <Badge variant={retiro ? 'secondary' : 'destructive-outline'}>
              {dondeSeQuedo(rechazada)}
            </Badge>
          </ItemTitle>
          <ItemDescription>Motivo: {rechazada.motivo}</ItemDescription>
        </ItemContent>
      </Item>

      <Field>
        <FieldLabel>A qué etapa vuelve</FieldLabel>
        <Select value={destino} onValueChange={(valor) => setDestino(valor as string)}>
          <SelectTrigger className="w-full" aria-label="Etapa a la que vuelve">
            <SelectValue>{(valor: string) => tituloEtapa(valor)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Etapas de {vacante.titulo}</SelectLabel>
              {vacante.etapas.map((etapa, indice) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  <Text as="span" variant="muted" className="tabular-nums">
                    {indice + 1}
                  </Text>
                  <span className="min-w-0 flex-1 truncate">{etapa.titulo}</span>
                  {etapa.ia ? <IconoIA /> : null}
                  {etapa.id === candidatura.etapa ? (
                    <Badge variant="secondary">
                      Donde se quedó
                    </Badge>
                  ) : null}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {etapaDestino?.ia && (destino !== candidatura.etapa || !entrevistaHecha) ? (
          <FieldDescription className="flex items-center gap-1.5">
            <IconoIA />
            {destino === candidatura.etapa
              ? `La invitación anterior se canceló al rechazarla: ${etapaDestino.titulo} le escribe una nueva unos segundos después.`
              : `${etapaDestino.titulo} le escribe la invitación a la entrevista unos segundos después.`}
          </FieldDescription>
        ) : null}
      </Field>

      {avisada ? (
        <Alert variant="info">
          <HugeiconsIcon icon={Mail01Icon} size={16} />
          <AlertTitle>{retiro ? 'Le llegó la confirmación de su retiro' : 'Ya le llegó el correo de rechazo'}</AlertTitle>
          <AlertDescription>Cree que está fuera del proceso. Escríbele para contarle que sigue; si no, puede que ya no responda.</AlertDescription>
        </Alert>
      ) : (
        <Text as="p" variant="muted" size="sm">
          No le llegó ningún correo: no se entera del cambio, salvo que le escribas.
        </Text>
      )}

      <Separator />

      <div className="flex flex-col gap-3">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Escribirle a {nombre}</FieldTitle>
            <FieldDescription>Sale unos segundos después; si deshaces a tiempo, no sale.</FieldDescription>
          </FieldContent>
          <Switch checked={escribir} onCheckedChange={setEscribir} aria-label={`Escribirle a ${nombre}`} />
        </Field>
        {escribir ? (
          <Field>
            <FieldLabel>Mensaje</FieldLabel>
            <Textarea value={texto} onChange={(evento) => setTexto(evento.target.value)} rows={3} />
            <FieldDescription>
              {'{nombre}'}, {'{vacante}'} y {'{etapa}'} se cambian por sus datos.
            </FieldDescription>
          </Field>
        ) : null}
      </div>

      <Field>
        <FieldLabel>
          Por qué vuelve{' '}
          <Text as="span" variant="muted" size="sm" weight="normal">
            (opcional)
          </Text>
        </FieldLabel>
        <Textarea
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
          rows={2}
          placeholder="Por ejemplo: la persona que elegimos declinó la oferta."
        />
        <FieldDescription>Queda en su historial de etapas. La persona no lo ve.</FieldDescription>
      </Field>
    </VentanaDeAccion>
  )
}
