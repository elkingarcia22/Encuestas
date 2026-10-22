import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowTurnBackwardIcon, NextIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
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
import { VistaPreviaCorreo } from './vista-previa-correo'
import { baseDeCandidatos } from '../base'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { costoDeEtapa, creditos } from '../creditos'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { siguienteEtapaDe, tituloEtapa, type Candidatura, type VacanteUI } from '../datos'
import {
  PLANTILLAS_MOVER,
  consecuenciasDe,
  movimientosDe,
  nombreDeLista,
  personasTexto,
  plantillaSugerida,
  type Consecuencias,
} from '../movimientos'

// La ventana de «Mover a otra etapa»: la misma en las tres exploraciones, para una persona o para varias. Se abre
// cuando se pide a propósito («Mover a otra etapa…») y cuando el cambio trae algo que decir antes de hacerlo: se salta
// etapas, vuelve atrás, deja una entrevista de IA sin terminar, entra a una etapa con IA o llega a la última.
//
// Entrar a una etapa con IA (13 oct, PM: «está la opción de solo moverlo de etapa o de ejecutar el agente en esa etapa…
// entender, ok, va a costar tantos créditos»): se elige entre que la IA le escriba, con lo que cuesta y lo que queda, o
// solo moverla, sin invitación y sin gastar.
//
// De arriba abajo: a qué etapa, qué pasa con eso (en avisos con nombre), si se le escribe a la persona y un comentario
// para el equipo. Todo lo que se decide aquí queda en la pestaña «Etapas» de la ficha.

export type Cambio = { candidatura: Candidatura; destino: string }

const RUTA_CREDITOS = '/admin/seleccion/creditos/uno'

export type DecisionMover = {
  cambios: Cambio[]
  comentario: string
  // Qué hacer con quien vuelve a una etapa de IA que ya presentó.
  ia: 'conservar' | 'repetir'
  // Con quien entra por primera vez a una etapa con IA: si la IA le escribe (y aparta los créditos) o solo se mueve.
  invitar: boolean
  aviso: { plantilla: string; texto: string } | null
  cerrarVacante: boolean
}

// Lo que se pidió: a quién y, si ya se sabe, a dónde va cada una (arrastrar, el recorrido de la ficha, «Avanzar de etapa»).
// Sin destinos, se elige en la ventana.
export type PedidoMover = { id: number; candidaturas: Candidatura[]; destinos: Record<string, string> | null }

type ConLoQuePasa = Cambio & { pasa: Consecuencias }

// Qué le pasa a cada una, en pocas palabras y con su tono, para la lista de varias.
function situacion(
  cambio: ConLoQuePasa | undefined,
  candidatura: Candidatura,
  invitar: boolean,
): { texto: string; tono: 'warning-light' | 'info-light' | 'secondary' } {
  if (!cambio) return { texto: `Ya está en ${tituloEtapa(candidatura.etapa)}`, tono: 'secondary' }
  const { pasa, destino } = cambio
  if (pasa.deja) return { texto: pasa.deja.entrevista.tipo === 'a-medias' ? 'Se cancela su entrevista' : 'Se cancela su invitación', tono: 'warning-light' }
  if (pasa.saltadas.length) return { texto: `Se salta ${plural(pasa.saltadas.length, '1 etapa', `${pasa.saltadas.length} etapas`)}`, tono: 'warning-light' }
  if (pasa.atras) return { texto: `Vuelve a ${tituloEtapa(destino)}`, tono: 'info-light' }
  if (pasa.entra && pasa.entra.hecha === undefined)
    return invitar ? { texto: `Le escribe ${pasa.entra.etapa.titulo}`, tono: 'info-light' } : { texto: 'Entra sin invitación', tono: 'secondary' }
  return { texto: `Pasa a ${tituloEtapa(destino)}`, tono: 'secondary' }
}

export function DialogoMover({
  abierto,
  onOpenChange,
  pedido,
  vacante,
  dentro,
  onConfirmar,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  pedido: PedidoMover
  vacante: VacanteUI
  // Toda la gente en proceso: si se cierra la vacante, se dice cuántas siguen.
  dentro: Candidatura[]
  onConfirmar: (decision: DecisionMover) => void
}) {
  const { candidaturas, destinos } = pedido
  const una = candidaturas.length === 1 ? candidaturas[0] : null
  // «Avanzar de etapa» con varias: cada una va a la siguiente de la suya, no hay una etapa que elegir.
  const cadaUna = destinos !== null && new Set(Object.values(destinos)).size > 1
  const [destino, setDestino] = useState<string | null>(() =>
    destinos ? (cadaUna ? null : (Object.values(destinos)[0] ?? null)) : una ? siguienteEtapaDe(vacante.etapas, una.etapa) : null,
  )
  const [ia, setIa] = useState<'conservar' | 'repetir'>('conservar')
  const [invitar, setInvitar] = useState(true)
  const navegar = useNavigate()
  const [escribir, setEscribir] = useState(false)
  // Sin tocar, la plantilla y su texto siguen a la etapa elegida.
  const [plantilla, setPlantilla] = useState<string | null>(null)
  const [texto, setTexto] = useState<string | null>(null)
  const [comentario, setComentario] = useState('')
  const [cerrar, setCerrar] = useState(false)

  const cambios: ConLoQuePasa[] = candidaturas.flatMap((candidatura) => {
    const hacia = cadaUna ? destinos?.[candidatura.id] : destino
    if (!hacia || hacia === candidatura.etapa) return []
    return [{ candidatura, destino: hacia, pasa: consecuenciasDe(candidatura, hacia, vacante.etapas, movimientosDe(candidatura.id)) }]
  })
  const n = cambios.length
  const nombre = una?.candidato.nombre.split(' ')[0]

  const saltan = cambios.filter(({ pasa }) => pasa.saltadas.length)
  const vuelven = cambios.filter(({ pasa }) => pasa.atras)
  const dejan = cambios.filter(({ pasa }) => pasa.deja)
  const yaLaHicieron = cambios.filter(({ pasa }) => pasa.entra?.hecha !== undefined)
  // Quienes entran por primera vez a una etapa con IA: aquí se decide si la IA les escribe.
  const entran = cambios.filter(({ pasa }) => pasa.entra && pasa.entra.hecha === undefined)
  // Sin nada libre en el agente no sale ninguna invitación: esa opción se apaga y se dice por qué.
  const libreEntrar = entran.length ? costoDeEtapa(entran[0].destino) : null
  const libreRepetir = yaLaHicieron.length ? costoDeEtapa(yaLaHicieron[0].destino) : null
  const borrador = vacante.estado === 'Borrador'
  const sinCupoEntrar = Boolean(libreEntrar && !borrador && libreEntrar.alcanzaPara === 0)
  const sinCupoRepetir = Boolean(libreRepetir && !borrador && libreRepetir.alcanzaPara === 0)
  const invitarA = invitar && !sinCupoEntrar
  const iaA = sinCupoRepetir ? 'conservar' : ia
  const invitadas = cambios.filter(({ pasa }) => pasa.entra && (pasa.entra.hecha === undefined ? invitarA : iaA === 'repetir'))
  const llegan = cambios.filter(({ pasa }) => pasa.ultima)
  // A quien le escribe la IA no se le escribe además a mano: le llegarían dos correos.
  // Quien pidió no recibir correos tampoco recibe el de mover (CA-05).
  const sinCorreos = cambios.filter((cambio) => baseDeCandidatos.deId(cambio.candidatura.personaId)?.noContactar)
  const escribibles = cambios.filter((cambio) => !invitadas.includes(cambio) && !sinCorreos.includes(cambio))
  const siguen = dentro.filter((c) => !cambios.some(({ candidatura }) => candidatura.id === c.id)).length

  const ultima = vacante.etapas[vacante.etapas.length - 1]
  const etapaIA = [...yaLaHicieron, ...invitadas][0]?.pasa.entra?.etapa
  const etapaEntran = entran[0]?.pasa.entra?.etapa
  // Lo que cuesta en créditos invitar a quienes entran a una etapa con IA que cobra (VA-09). Cada opción dice lo suyo
  // aunque no esté elegida; el aviso de que no alcanza, solo con lo que de verdad se va a invitar.
  const costo = invitadas.length ? costoDeEtapa(invitadas[0].destino, invitadas.length) : null
  const costoEntrar = entran.length ? costoDeEtapa(entran[0].destino, entran.length) : null
  const costoRepetir = yaLaHicieron.length ? costoDeEtapa(yaLaHicieron[0].destino, yaLaHicieron.length) : null
  const idPlantilla = plantilla ?? (cambios[0] ? plantillaSugerida(cambios[0].destino, vacante.etapas, cambios[0].pasa.atras) : 'sigue')
  const textoPlantilla = texto ?? PLANTILLAS_MOVER.find((p) => p.id === idPlantilla)?.texto ?? ''
  const nada = n > 0 && !saltan.length && !vuelven.length && !dejan.length && !yaLaHicieron.length && !entran.length && !llegan.length

  const posicion = una ? vacante.etapas.findIndex((etapa) => etapa.id === una.etapa) : -1
  const etapasDistintas = new Set(candidaturas.map((c) => c.etapa))

  const confirmar = () =>
    onConfirmar({
      cambios: cambios.map(({ candidatura, destino: hacia }) => ({ candidatura, destino: hacia })),
      comentario,
      ia: iaA,
      invitar: invitarA,
      aviso: escribir && escribibles.length ? { plantilla: PLANTILLAS_MOVER.find((p) => p.id === idPlantilla)?.titulo ?? '', texto: textoPlantilla } : null,
      cerrarVacante: llegan.length > 0 && cerrar,
    })

  const etiqueta =
    llegan.length && cerrar
      ? 'Mover y cerrar la vacante'
      : dejan.length && una
        ? 'Mover y cancelar la entrevista'
        : una && cambios[0]
          ? `Mover a ${tituloEtapa(cambios[0].destino)}`
          : `Mover ${personasTexto(n)}`

  // El título dice qué es la ventana, siempre el mismo; a quién se mueve y dónde está abre el cuerpo, debajo (títulos
  // fijos, Carlos, 1-oct; auditoría, 5-oct). Antes el título era «Mover a Laura Méndez» y la bajada, su etapa.
  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title="Mover a otra etapa"
      lead={
        <>
          <Heading as="h3" level={6}>
            {una ? una.candidato.nombre : personasTexto(candidaturas.length)}
          </Heading>
          <Text as="p" variant="muted" size="sm">
            {una
              ? `Está en ${tituloEtapa(una.etapa)} · etapa ${posicion + 1} de ${vacante.etapas.length} · ${
                  una.dias === 0 ? 'llegó hoy' : `lleva ${plural(una.dias, '1 día', `${una.dias} días`)}`
                }.`
              : etapasDistintas.size === 1
                ? `Están en ${tituloEtapa(candidaturas[0].etapa)}.`
                : `Están en ${etapasDistintas.size} etapas distintas: esto es lo que le pasa a cada una.`}
          </Text>
        </>
      }
      note="Se puede deshacer desde el aviso."
      confirmLabel={etiqueta}
      confirmDisabled={!n}
      onConfirm={confirmar}
      pendingLabel="Moviendo…"
    >
      {/* 1 · A qué etapa. */}
      {cadaUna ? (
        <Text as="p" size="sm">
          Cada una pasa a la etapa que le sigue a la suya.
        </Text>
      ) : (
        <Field>
          <FieldLabel>A qué etapa</FieldLabel>
          <Select value={destino} onValueChange={(valor) => setDestino(valor as string)}>
            <SelectTrigger className="w-full" aria-label="Etapa de destino">
              <SelectValue placeholder="Elige la etapa">{(valor: string | null) => (valor ? tituloEtapa(valor) : 'Elige la etapa')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Etapas de {vacante.titulo}</SelectLabel>
                {vacante.etapas.map((etapa, indice) => {
                  const aqui = una?.etapa === etapa.id
                  return (
                    <SelectItem key={etapa.id} value={etapa.id} disabled={aqui}>
                      <Text as="span" variant="muted" className="tabular-nums">
                        {indice + 1}
                      </Text>
                      <span className="min-w-0 flex-1 truncate">{etapa.titulo}</span>
                      {etapa.ia ? <IconoIA /> : null}
                      {aqui ? (
                        <Badge variant="secondary">
                          Aquí está
                        </Badge>
                      ) : una && etapa.id === siguienteEtapaDe(vacante.etapas, una.etapa) ? (
                        <Badge variant="info-light">
                          Siguiente
                        </Badge>
                      ) : null}
                    </SelectItem>
                  )
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      )}

      {/* Con varias, qué le pasa a cada una según la etapa elegida (dentro del cuerpo, que se desplaza entero: en la lista
          de la ventana se apretaba contra el resto). */}
      {una ? null : (
        <Field>
          <FieldLabel>Qué le pasa a cada una</FieldLabel>
          <ItemGroup className="gap-1!">
            {candidaturas.map((candidatura) => {
              const { texto: dice, tono } = situacion(
                cambios.find((cambio) => cambio.candidatura.id === candidatura.id),
                candidatura,
                invitarA,
              )
              return (
                <Item key={candidatura.id} size="xs" variant="outline">
                  <ItemContent className="min-w-0!">
                    <ItemTitle className="w-full! truncate">{candidatura.candidato.nombre}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant={tono}>
                      {dice}
                    </Badge>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </Field>
      )}

      {/* 2 · Qué pasa con eso. Un aviso por caso, con nombre: se lee antes de confirmar. */}
      {candidaturas.length > 1 && !n && destino ? (
        <Text as="p" variant="muted" size="sm">
          Todas ya están en {tituloEtapa(destino)}.
        </Text>
      ) : null}

      {saltan.length ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={NextIcon} size={16} />
          <AlertTitle>
            {una
              ? `Se salta ${nombreDeLista(saltan[0].pasa.saltadas.map((etapa) => etapa.titulo))}`
              : `${personasTexto(saltan.length)} se ${saltan.length === 1 ? 'salta' : 'saltan'} etapas`}
          </AlertTitle>
          <AlertDescription>
            {una
              ? `Llega a ${tituloEtapa(saltan[0].destino)} sin ${saltan[0].pasa.saltadas.length === 1 ? 'ese resultado' : 'esos resultados'}. En su historial ${
                  saltan[0].pasa.saltadas.length === 1 ? 'esa etapa queda' : 'esas etapas quedan'
                } como «Se saltó».`
              : `${nombreDeLista(saltan.map(({ candidatura }) => candidatura.candidato.nombre.split(' ')[0]))} llegan sin el resultado de las etapas intermedias. En su historial quedan como «Se saltó».`}
          </AlertDescription>
        </Alert>
      ) : null}

      {dejan.length ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>
            {una && dejan[0].pasa.deja
              ? dejan[0].pasa.deja.entrevista.tipo === 'a-medias'
                ? `Tiene la entrevista con ${dejan[0].pasa.deja.etapa.titulo} a medias`
                : `Tiene la invitación a ${dejan[0].pasa.deja.etapa.titulo} sin abrir`
              : `${personasTexto(dejan.length)} no ${dejan.length === 1 ? 'ha' : 'han'} terminado su entrevista con la IA`}
          </AlertTitle>
          <AlertDescription>
            {una && dejan[0].pasa.deja
              ? dejan[0].pasa.deja.entrevista.tipo === 'a-medias'
                ? `Respondió ${dejan[0].pasa.deja.entrevista.respondidas} de ${dejan[0].pasa.deja.entrevista.total} preguntas. Si la mueves, la entrevista se cancela y el enlace deja de servir; lo que alcanzó a responder queda en su historial.`
                : `Le llegó ${
                    dejan[0].pasa.deja.entrevista.dias === 0 ? 'hoy' : `hace ${plural(dejan[0].pasa.deja.entrevista.dias, '1 día', `${dejan[0].pasa.deja.entrevista.dias} días`)}`
                  } y no la ha abierto. Si la mueves, el enlace deja de servir.`
              : `${nombreDeLista(dejan.map(({ candidatura }) => candidatura.candidato.nombre.split(' ')[0]))}: si las mueves, sus entrevistas se cancelan y los enlaces dejan de servir. Lo que alcanzaron a responder queda en su historial.`}
          </AlertDescription>
        </Alert>
      ) : null}

      {vuelven.length ? (
        <Alert variant="info">
          <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} />
          <AlertTitle>
            {una ? `Vuelve a ${tituloEtapa(vuelven[0].destino)}` : `${personasTexto(vuelven.length)} ${vuelven.length === 1 ? 'vuelve' : 'vuelven'} a una etapa anterior`}
          </AlertTitle>
          <AlertDescription>
            {una
              ? `Conserva ${nombreDeLista([...vuelven[0].pasa.conserva, 'los comentarios del equipo'])}. Los días en la etapa empiezan de cero.`
              : 'Conservan lo que ya hicieron y los comentarios del equipo. Los días en la etapa empiezan de cero.'}
          </AlertDescription>
        </Alert>
      ) : null}

      {yaLaHicieron.length && etapaIA ? (
        <Field>
          <FieldLabel className="flex items-center gap-1.5">
            <IconoIA />
            {una
              ? `Ya presentó la entrevista con ${etapaIA.titulo} (${yaLaHicieron[0].pasa.entra?.hecha}/100)`
              : `${personasTexto(yaLaHicieron.length)} ya ${yaLaHicieron.length === 1 ? 'presentó' : 'presentaron'} la entrevista con ${etapaIA.titulo}`}
          </FieldLabel>
          <RadioGroup value={iaA} onValueChange={(valor) => setIa(valor as 'conservar' | 'repetir')} className="grid gap-2">
            <FieldLabel htmlFor="mover-ia-conservar">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Conservar {una ? 'su resultado' : 'sus resultados'}</FieldTitle>
                  <FieldDescription>No se le escribe. Vuelve con la entrevista que ya hizo.</FieldDescription>
                </FieldContent>
                <RadioGroupItem value="conservar" id="mover-ia-conservar" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="mover-ia-repetir">
              <Field orientation="horizontal" data-disabled={sinCupoRepetir}>
                <FieldContent>
                  <FieldTitle>Pedirle que la repita</FieldTitle>
                  <FieldDescription>
                    {una ? 'Le llega' : 'Les llega'} una invitación nueva. El resultado anterior queda en su historial.
                    {costoRepetir
                      ? sinCupoRepetir
                        ? ` No se puede: ${costoRepetir.agente.nombre} no tiene créditos libres.`
                        : ` Cuesta ${creditos(costoRepetir.total)} créditos de ${costoRepetir.agente.nombre}.`
                      : ''}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="repetir" id="mover-ia-repetir" disabled={sinCupoRepetir} />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </Field>
      ) : null}

      {entran.length && etapaEntran ? (
        <Field>
          <FieldLabel className="flex items-center gap-1.5">
            <IconoIA />
            {una
              ? `Entra a ${etapaEntran.titulo}`
              : `${personasTexto(entran.length)} ${entran.length === 1 ? 'entra' : 'entran'} a ${etapaEntran.titulo}`}
          </FieldLabel>
          <RadioGroup value={invitarA ? 'invitar' : 'solo'} onValueChange={(valor) => setInvitar(valor === 'invitar')} className="grid gap-2">
            <FieldLabel htmlFor="mover-entra-invitar">
              <Field orientation="horizontal" data-disabled={sinCupoEntrar}>
                <FieldContent>
                  <FieldTitle>
                    Que {etapaEntran.titulo} {una ? 'le' : 'les'} escriba
                  </FieldTitle>
                  <FieldDescription>
                    {/* En un borrador la invitación espera: no le llega nada de una vacante que todavía no existe afuera (VA-45). */}
                    {borrador
                      ? `La invitación a la entrevista sale cuando publiques la vacante, no antes.`
                      : `${una ? 'Le llega' : 'Les llega'} la invitación a la entrevista unos segundos después de ${una ? 'moverla' : 'moverlas'}.`}
                    {costoEntrar
                      ? ` Cuesta ${creditos(costoEntrar.total)} créditos de ${costoEntrar.agente.nombre}; quedan ${creditos(costoEntrar.libre)} libres.`
                      : ' No usa créditos.'}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="invitar" id="mover-entra-invitar" disabled={sinCupoEntrar} />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="mover-entra-solo">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Solo {una ? 'moverla' : 'moverlas'}</FieldTitle>
                  <FieldDescription>
                    {una ? 'Queda' : 'Quedan'} en {etapaEntran.titulo} sin invitación y no se usan créditos. {una ? 'Queda' : 'Quedan'} en «Esperando
                    acción»: la invitación se envía después desde {una ? 'su tarjeta o su ficha' : 'la tarjeta o la ficha de cada una'}.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="solo" id="mover-entra-solo" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </Field>
      ) : null}

      {/* Sin nada libre en el agente: se mueve sin invitación y se dice dónde conseguir los créditos (VA-09). */}
      {(sinCupoEntrar || sinCupoRepetir) && (libreEntrar ?? libreRepetir) ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>{(libreEntrar ?? libreRepetir)!.agente.nombre} no tiene créditos libres</AlertTitle>
          <AlertDescription>
            Cuesta {creditos((libreEntrar ?? libreRepetir)!.total)} por persona. Puedes {una ? 'moverla' : 'moverlas'} sin invitación y enviarla cuando
            repartas créditos.
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => navegar(RUTA_CREDITOS)}>
              Ir a Créditos
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {/* No alcanzan los créditos del agente: se dice antes de mover, con cuántas sí alcanza y dónde pedir más (VA-09). */}
      {costo && !costo.alcanza ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>No alcanzan los créditos de {costo.agente.nombre}</AlertTitle>
          <AlertDescription>
            {costo.alcanzaPara
              ? `Alcanzan para ${personasTexto(costo.alcanzaPara)} de ${personasTexto(invitadas.length)}.`
              : 'No queda nada libre.'}{' '}
            Quien no alcance entra sin invitación y queda en «Esperando acción» hasta que haya créditos. Pídelos o repártelos en
            Créditos.
          </AlertDescription>
        </Alert>
      ) : null}

      {llegan.length ? (
        <>
          <Alert variant="info">
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            <AlertTitle>Es la última etapa: {ultima?.titulo}</AlertTitle>
            <AlertDescription>{ultima?.descripcion}</AlertDescription>
          </Alert>
          <Label className="flex items-start gap-2.5 text-sm font-normal">
            <Checkbox checked={cerrar} onCheckedChange={(valor) => setCerrar(valor === true)} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span>Cerrar la vacante</span>
              <Text as="span" variant="muted" size="sm">
                Deja de recibir aplicaciones y se oculta del portal.
                {siguen
                  ? ` ${personasTexto(siguen)} ${siguen === 1 ? 'sigue' : 'siguen'} en el proceso y no ${siguen === 1 ? 'recibe' : 'reciben'} nada: decides tú qué hacer con ${siguen === 1 ? 'ella' : 'ellas'}.`
                  : ''}
              </Text>
            </span>
          </Label>
        </>
      ) : null}

      {nada ? (
        <Text as="p" variant="muted" size="sm">
          {una ? 'Pasa' : 'Pasan'} a la siguiente etapa. Nadie recibe correo, salvo que {una ? 'le' : 'les'} escribas aquí abajo.
        </Text>
      ) : null}

      {n ? <Separator /> : null}

      {/* 3 · Avisarle a la persona. Sale con el aviso de «Deshacer»: si se deshace a tiempo, no sale. */}
      {escribibles.length ? (
        <div className="flex flex-col gap-3">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>
                {una ? `Escribirle a ${nombre}` : escribibles.length === n ? `Escribirles a las ${personasTexto(n)}` : `Escribirles a ${personasTexto(escribibles.length)}`}
              </FieldTitle>
              <FieldDescription>
                {invitadas.length && !una
                  ? `A ${invitadas.length === 1 ? 'quien le escribe' : `las ${invitadas.length} que les escribe`} la IA no se les manda otro correo.`
                  : 'Sale unos segundos después de moverla; si deshaces a tiempo, no sale.'}
                {sinCorreos.length ? ` ${sinCorreos.map((cambio) => cambio.candidatura.candidato.nombre).join(', ')} pidió no recibir correos: no se le escribe.` : ''}
              </FieldDescription>
            </FieldContent>
            <Switch checked={escribir} onCheckedChange={setEscribir} aria-label={una ? `Escribirle a ${nombre}` : 'Escribirles'} />
          </Field>
          {escribir ? (
            <>
              <Field>
                <FieldLabel>Plantilla</FieldLabel>
                <Select
                  value={idPlantilla}
                  onValueChange={(valor) => {
                    setPlantilla(valor as string)
                    setTexto(null)
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Plantilla del correo">
                    <SelectValue>{(valor: string) => PLANTILLAS_MOVER.find((p) => p.id === valor)?.titulo}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PLANTILLAS_MOVER.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Mensaje</FieldLabel>
                <Textarea value={textoPlantilla} onChange={(evento) => setTexto(evento.target.value)} rows={4} />
                <FieldDescription>
                  {'{nombre}'}, {'{vacante}'} y {'{etapa}'} se cambian por los datos de cada persona.
                </FieldDescription>
              </Field>
              {candidaturas[0] ? (
                <VistaPreviaCorreo
                  texto={textoPlantilla}
                  datos={{ nombre: candidaturas[0].candidato.nombre.split(' ')[0], vacante: vacante.titulo, etapa: destino ? tituloEtapa(destino) : undefined }}
                  varias={candidaturas.length - 1}
                />
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {/* 4 · Por qué: para el equipo, no para la persona. */}
      {n ? (
        <Field>
          <FieldLabel>
            Comentario para el equipo{' '}
            <Text as="span" variant="muted" size="sm" weight="normal">
              (opcional)
            </Text>
          </FieldLabel>
          <Textarea
            value={comentario}
            onChange={(evento) => setComentario(evento.target.value)}
            rows={2}
            placeholder={
              saltan.length
                ? 'Por qué se salta etapas. Por ejemplo: el gerente ya la entrevistó.'
                : vuelven.length
                  ? 'Por qué vuelve. Por ejemplo: falta validar el inglés.'
                  : 'Por ejemplo: la recomendó el líder del equipo.'
            }
          />
          <FieldDescription>Queda en su historial de etapas. La persona no lo ve.</FieldDescription>
        </Field>
      ) : null}
    </VentanaDeAccion>
  )
}
