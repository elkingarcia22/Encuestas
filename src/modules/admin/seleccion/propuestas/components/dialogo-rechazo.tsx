import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Mail01Icon, UserMultipleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Switch,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { VistaPreviaCorreo } from './vista-previa-correo'
import { baseDeCandidatos } from '../base'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { tituloEtapa, type Candidatura, type VacanteUI } from '../datos'
import { entrevistaDe, movimientosDe, nombreDeLista, personasTexto } from '../movimientos'
import { useAccion } from '@/modules/design-system/estados/carga'
import { areasDeMejora } from '../perfil-candidato'
import {
  OTRO_MOTIVO,
  PLANTILLAS_RECHAZO,
  QUIEN_TEXTO,
  motivoSugerido,
  motivosPara,
  plantillaDeRechazo,
  type Quien,
} from '../rechazos'

// Rechazar: una ventana para una persona o para varias, la misma en las tres exploraciones (25 sep, Nicolás: «que
// quede bien completo»). De arriba abajo: a quién, quién decidió (nosotros o la persona se retiró), el motivo (con la
// sugerencia de la IA cuando los datos lo dicen), qué más pasa (entrevista de IA que se cancela, otras vacantes donde
// sigue), el correo con su texto, y una nota para el equipo. Las reglas están en `rechazos.ts`.
//
// El correo sale al instante y NO se puede retirar (decisión de Nicolás, 21 sep): se dice con todas las letras antes de
// confirmar. Con lotes grandes la confirmación se endurece: desde 25 personas hay que escribir la palabra, como en
// Ashby.

const UMBRAL_ESCRITO = 25

export type PedidoRechazo = { id: number; candidaturas: Candidatura[] }

export type DecisionRechazo = {
  quien: Quien
  motivo: string
  // La plantilla y el texto del correo; `null` si no se le escribe.
  correo: { plantilla: string; texto: string } | null
  nota: string
  // Las candidaturas de las mismas personas en otras vacantes que se rechazan también.
  tambienEn: Candidatura[]
}

// «Recordar este motivo para las siguientes» (patrón de Lever): vive fuera de la ventana, que se arma de nuevo cada vez.
// Lo recordado dura hasta que se desmarca, también al rechazar a una sola persona, y guarda el texto de «Otro motivo»
// (VA-38).
let recordado: { quien: Quien; motivo: string; otro: string } | null = null

export function DialogoRechazo({
  abierto,
  onOpenChange,
  pedido,
  vacante,
  lista,
  onConfirmar,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  pedido: PedidoRechazo
  vacante: VacanteUI
  // Toda la gente en proceso, de todas las vacantes: de ahí salen las otras vacantes donde está cada persona.
  lista: Candidatura[]
  onConfirmar: (decision: DecisionRechazo) => void
}) {
  const { candidaturas } = pedido
  const una = candidaturas.length === 1 ? candidaturas[0] : null
  const cuantos = candidaturas.length
  const lote = cuantos >= UMBRAL_ESCRITO
  const nombre = una?.candidato.nombre.split(' ')[0]
  const sugerido = una ? motivoSugerido(una) : null
  const mejora = una ? areasDeMejora(una, movimientosDe(una.id)) : null

  const [quien, setQuien] = useState<Quien>(recordado?.quien ?? 'nosotros')
  const [motivo, setMotivo] = useState(recordado?.motivo ?? sugerido?.motivo ?? '')
  const [otro, setOtro] = useState(recordado?.otro ?? '')
  // Quien pidió no recibir correos no recibe el de rechazo (CA-05): el interruptor arranca apagado y no se prende.
  const sinCorreos = Boolean(una && baseDeCandidatos.deId(una.personaId)?.noContactar)
  const [avisar, setAvisar] = useState(quien === 'nosotros' && !sinCorreos)
  const [plantilla, setPlantilla] = useState<string | null>(null)
  const [texto, setTexto] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [tambien, setTambien] = useState(false)
  const [recordar, setRecordar] = useState(recordado !== null)
  const [escrito, setEscrito] = useState('')

  const motivos = motivosPara(quien, vacante.etapas, candidaturas)
  const motivoFinal = motivo === OTRO_MOTIVO ? otro.trim() : motivo
  const idPlantilla = plantilla ?? plantillaDeRechazo(quien, candidaturas, vacante.etapas)
  const textoCorreo = texto ?? PLANTILLAS_RECHAZO.find((p) => p.id === idPlantilla)?.texto ?? ''

  // Lo que pasa alrededor, persona por persona.
  const ids = new Set(candidaturas.map((c) => c.id))
  const personas = new Set(candidaturas.map((c) => c.personaId))
  const enOtras = lista.filter((c) => personas.has(c.personaId) && !ids.has(c.id) && c.vacante.id !== vacante.id)
  const entrevistaDeUna = (c: Candidatura) => {
    const etapa = vacante.etapas.find((una) => una.id === c.etapa)
    const estado = etapa ? entrevistaDe(c, etapa, vacante.etapas, movimientosDe(c.id)) : null
    return etapa && estado && estado.tipo !== 'hecha' ? { etapa, estado } : null
  }
  const cancelan = candidaturas.filter((c) => entrevistaDeUna(c))

  const cambiarQuien = (valor: Quien) => {
    setQuien(valor)
    setMotivo(valor === 'nosotros' && sugerido ? sugerido.motivo : '')
    setAvisar(valor === 'nosotros' && !sinCorreos)
    setPlantilla(null)
    setTexto(null)
  }

  const listo = Boolean(motivoFinal) && (!lote || escrito.trim().toUpperCase() === 'RECHAZAR') && (!avisar || Boolean(textoCorreo.trim()))
  const confirmar = () => {
    recordado = recordar ? { quien, motivo, otro } : cuantos > 1 || recordado === null ? null : recordado
    onConfirmar({
      quien,
      motivo: motivoFinal,
      correo: avisar ? { plantilla: PLANTILLAS_RECHAZO.find((p) => p.id === idPlantilla)?.titulo ?? '', texto: textoCorreo } : null,
      nota: nota.trim(),
      tambienEn: tambien ? enOtras : [],
    })
    onOpenChange(false)
  }

  // Al confirmar, el botón dice qué está pasando mientras corre (el correo sale en ese momento y no se retira).
  const accion = useAccion()
  const retiro = quien === 'candidato'
  const enCurso = retiro ? 'Registrando el retiro…' : avisar ? 'Rechazando y enviando…' : 'Rechazando…'
  const etiqueta = retiro
    ? una
      ? 'Registrar el retiro'
      : `Registrar el retiro de ${cuantos}`
    : avisar
      ? una
        ? 'Rechazar y enviar el correo'
        : `Rechazar a ${cuantos} y avisarles`
      : una
        ? 'Rechazar sin correo'
        : `Rechazar a ${cuantos} sin correo`

  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title={
        una
          ? retiro
            ? `Registrar que ${una.candidato.nombre} se retiró`
            : `¿Rechazar a ${una.candidato.nombre}?`
          : retiro
            ? `Registrar el retiro de ${personasTexto(cuantos)}`
            : `¿Rechazar a ${personasTexto(cuantos)}?`
      }
      sub={`${una ? 'Sale' : 'Salen'} del proceso de ${vacante.titulo} y ${una ? 'queda' : 'quedan'} en tu base de candidatos, al pie de su etapa, por si hay que volver a considerar${una ? 'la' : 'las'}.`}
      note="Queda registrado quién, cuándo y por qué."
      footer={
        <>
          <Button variant="outline" disabled={accion.enCurso} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={!listo || accion.enCurso} onClick={() => accion.correr(confirmar)}>
            {accion.enCurso ? <Spinner /> : null}
            {accion.enCurso ? enCurso : etiqueta}
          </Button>
        </>
      }
    >
      {/* A quién: se ve antes de confirmar, como en Deel. */}
      {una ? (
        <Item variant="muted">
          <ItemContent>
            <ItemTitle>{una.candidato.nombre}</ItemTitle>
            <ItemDescription>
              {tituloEtapa(una.etapa)} · {una.dias === 0 ? 'llegó hoy' : `lleva ${plural(una.dias, '1 día', `${una.dias} días`)}`}
            </ItemDescription>
          </ItemContent>
        </Item>
      ) : (
        <Field>
          <FieldLabel>A quiénes</FieldLabel>
          <ItemGroup className="gap-1!">
            {candidaturas.map((c) => {
              const otra = enOtras.find((o) => o.personaId === c.personaId)
              return (
                <Item key={c.id} size="xs" variant="outline">
                  <ItemContent className="min-w-0!">
                    <ItemTitle className="w-full! truncate">{c.candidato.nombre}</ItemTitle>
                  </ItemContent>
                  <ItemActions className="flex-wrap justify-end">
                    {entrevistaDeUna(c) ? (
                      <Badge variant="warning-light">
                        Se cancela su entrevista
                      </Badge>
                    ) : null}
                    {otra ? (
                      <Badge variant="info-light">
                        También en {otra.vacante.titulo}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary">
                      {tituloEtapa(c.etapa)}
                    </Badge>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </Field>
      )}

      {/* El informe de la IA con lo que tiene por mejorar, para leerlo antes de decidir (el producto lo muestra al
          registrar un descarte). Solo con una persona: con varias, cada ficha trae el suyo. */}
      {mejora ? (
        <div className="flex flex-col gap-2 rounded-xl bg-muted/60 px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <IconoIA />
            Lo que tiene por mejorar, según la IA
          </span>
          {mejora.puntos.length ? (
            <>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                {mejora.puntos.map((punto) => (
                  <li key={punto}>{punto}</li>
                ))}
              </ul>
              <span className="text-xs text-muted-foreground">Sale de: {mejora.fuentes.join(' y ').toLowerCase()}.</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              No ve nada por mejorar para este cargo: cumple lo que pide la vacante y su CV lo respalda.
            </span>
          )}
        </div>
      ) : null}

      {/* 1 · Quién decidió. Retirarse no es lo mismo que rechazar: cambia el título, los motivos y el correo. */}
      <RadioGroup value={quien} onValueChange={(valor) => cambiarQuien(valor as Quien)} className="grid gap-2 sm:grid-cols-2">
        {(['nosotros', 'candidato'] as Quien[]).map((opcion) => (
          <FieldLabel key={opcion} htmlFor={`rechazo-${opcion}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{QUIEN_TEXTO[opcion]}</FieldTitle>
                <FieldDescription>{opcion === 'nosotros' ? 'Queda como «Rechazada».' : 'Queda como «Se retiró».'}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={opcion} id={`rechazo-${opcion}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>

      {/* 2 · El motivo, obligatorio. La IA lo sugiere cuando los datos lo dicen; no decide. */}
      <Field>
        <FieldLabel>Motivo</FieldLabel>
        <Select value={motivo || null} onValueChange={(valor) => setMotivo(valor as string)}>
          <SelectTrigger className="w-full" aria-label="Motivo">
            <SelectValue placeholder="Elige un motivo" />
          </SelectTrigger>
          <SelectContent>
            {motivos.map((opcion) => (
              <SelectItem key={opcion} value={opcion}>
                {opcion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {motivo === OTRO_MOTIVO ? (
          <Input value={otro} onChange={(evento) => setOtro(evento.target.value)} placeholder="Escribe el motivo" aria-label="Otro motivo" autoFocus />
        ) : null}
        {sugerido && !retiro ? (
          <FieldDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <IconoIA />
            {motivo === sugerido.motivo ? (
              <span>Lo sugiere la IA: {sugerido.razon}</span>
            ) : (
              <>
                <span>
                  La IA sugiere «{sugerido.motivo}»: {sugerido.razon}
                </span>
                <Button variant="link" size="sm" className="h-auto! p-0!" onClick={() => setMotivo(sugerido.motivo)}>
                  Usar ese motivo
                </Button>
              </>
            )}
          </FieldDescription>
        ) : null}
      </Field>

      {/* 3 · Qué más pasa. */}
      {cancelan.length ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>
            {una
              ? `Se cancela su entrevista con ${entrevistaDeUna(una)?.etapa.titulo}`
              : `Se ${cancelan.length === 1 ? 'cancela 1 entrevista' : `cancelan ${cancelan.length} entrevistas`} con la IA`}
          </AlertTitle>
          <AlertDescription>
            {una
              ? (() => {
                  const estado = entrevistaDeUna(una)?.estado
                  return estado?.tipo === 'a-medias'
                    ? `Va a medias: respondió ${estado.respondidas} de ${estado.total} preguntas. El enlace deja de servir; lo que respondió queda en su historial.`
                    : 'Tiene la invitación sin abrir. El enlace deja de servir.'
                })()
              : `${nombreDeLista(cancelan.map((c) => c.candidato.nombre.split(' ')[0]))} no han terminado la entrevista: los enlaces dejan de servir.`}
          </AlertDescription>
        </Alert>
      ) : null}

      {enOtras.length ? (
        <div className="flex flex-col gap-2">
          <Alert variant="info">
            <HugeiconsIcon icon={UserMultipleIcon} size={16} />
            <AlertTitle>
              {una
                ? `${nombre} también está en ${nombreDeLista(enOtras.map((o) => o.vacante.titulo))}`
                : `${personasTexto(enOtras.length)} también ${enOtras.length === 1 ? 'está' : 'están'} en otras vacantes`}
            </AlertTitle>
            <AlertDescription>
              {/* De quién es cada vacante y cómo está, para decidir si tocarla (VA-26). */}
              {`${nombreDeLista(
                enOtras.map(
                  (o) =>
                    `${una ? '' : `${o.candidato.nombre.split(' ')[0]} en `}${o.vacante.titulo} (${tituloEtapa(o.etapa)} · la lleva ${
                      o.vacante.equipo.find((m) => m.permiso === 'Dueña del proceso')?.nombre ?? 'otra persona'
                    } · ${o.vacante.estado === 'Publicada' ? 'abierta' : o.vacante.estado.toLowerCase()})`,
                ),
              )}. Este rechazo es solo de ${vacante.titulo}.`}
              {tambien && avisar ? ` Si la rechazas también allá, le llega un correo por cada vacante (${enOtras.length + 1}).` : ''}
            </AlertDescription>
          </Alert>
          <Label className="flex items-center gap-2.5 text-sm font-normal">
            <Checkbox checked={tambien} onCheckedChange={(valor) => setTambien(valor === true)} />
            {una || enOtras.length === 1 ? 'Rechazarla también allá, con el mismo motivo' : 'Rechazarlas también allá, con el mismo motivo'}
          </Label>
        </div>
      ) : null}

      <Separator />

      {/* 4 · El correo: sale al instante y no se retira. */}
      <div className="flex flex-col gap-3">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>{retiro ? 'Enviarle la confirmación de retiro' : una ? `Enviarle el correo de rechazo a ${nombre}` : 'Enviarles el correo de rechazo'}</FieldTitle>
            <FieldDescription>
              {sinCorreos
                ? `${nombre} pidió no recibir correos: no se le escribe.`
                : `Firmado por ${vacante.reclutador.nombre}. ${una ? 'Le llega' : 'A cada una le llega'} con su nombre.`}
            </FieldDescription>
          </FieldContent>
          <Switch checked={avisar} onCheckedChange={setAvisar} disabled={sinCorreos} aria-label="Enviar el correo" />
        </Field>
        {avisar ? (
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
                  <SelectValue>{(valor: string) => PLANTILLAS_RECHAZO.find((p) => p.id === valor)?.titulo}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLANTILLAS_RECHAZO.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Mensaje</FieldLabel>
              <Textarea value={textoCorreo} onChange={(evento) => setTexto(evento.target.value)} rows={4} />
              <FieldDescription>
                {'{nombre}'} y {'{vacante}'} se cambian por los datos de cada persona.
              </FieldDescription>
            </Field>
            {candidaturas[0] ? (
              <VistaPreviaCorreo
                texto={textoCorreo}
                datos={{ nombre: candidaturas[0].candidato.nombre.split(' ')[0], vacante: vacante.titulo }}
                varias={candidaturas.length - 1}
              />
            ) : null}
            {retiro ? null : (
              <Alert variant="warning">
                <HugeiconsIcon icon={Mail01Icon} size={16} />
                <AlertTitle>El correo sale apenas confirmes</AlertTitle>
                <AlertDescription>
                  No se puede retirar: aunque después {una ? 'la vuelvas' : 'las vuelvas'} a considerar, ya le{una ? '' : 's'} habrá llegado.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : null}
      </div>

      {/* 5 · Para el equipo, no para la persona. */}
      <Field>
        <FieldLabel>
          Nota para el equipo{' '}
          <Text as="span" variant="muted" size="sm" weight="normal">
            (opcional)
          </Text>
        </FieldLabel>
        <Textarea
          value={nota}
          onChange={(evento) => setNota(evento.target.value)}
          rows={2}
          placeholder={retiro ? 'Por ejemplo: aceptó una oferta en otra empresa por más salario.' : 'Por ejemplo: buen perfil, pero le falta experiencia en SQL. Tenerla en cuenta para junior.'}
        />
        <FieldDescription>Queda en su historial. La persona no la ve.</FieldDescription>
      </Field>

      {cuantos > 1 || recordar ? (
        <Label className="flex items-center gap-2.5 text-sm font-normal">
          <Checkbox checked={recordar} onCheckedChange={(valor) => setRecordar(valor === true)} />
          Recordar este motivo para las siguientes
        </Label>
      ) : null}

      {/* Lote grande: hay que escribir la palabra. Evita el clic sin mirar sobre decenas de personas. */}
      {lote ? (
        <Field>
          <FieldLabel>Son {cuantos} personas. Escribe RECHAZAR para confirmar</FieldLabel>
          <Input value={escrito} onChange={(evento) => setEscrito(evento.target.value)} placeholder="RECHAZAR" />
        </Field>
      ) : null}
    </VentanaDeAccion>
  )
}
