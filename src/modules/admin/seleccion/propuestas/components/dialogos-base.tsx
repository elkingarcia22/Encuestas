import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Delete02Icon, Mail01Icon, UserSharingIcon } from '@hugeicons/core-free-icons'
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
  ItemContent,
  ItemDescription,
  ItemTitle,
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
  Spinner,
  Switch,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { useAccion } from '@/modules/design-system/estados/carga'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { primeraEtapaDe, tituloEtapa, type VacanteUI } from '../datos'
import { nombreDeLista, personasTexto } from '../movimientos'
import {
  CAMPOS_UNIBLES,
  MOTIVOS_ELIMINAR,
  PLANTILLAS_BASE,
  type PlantillaBase,
  SITUACION_TEXTO,
  ajusteParaVacante,
  cupoEn,
  describirFiltros,
  destinatarios,
  vacantesAbiertas,
  type CampoUnible,
  type FiltrosBase,
  type PersonaViva,
} from '../base'
import { SelectorEtiquetas } from './selector-etiquetas'

// Las ventanas de la base global («Mis candidatos»), las mismas en las tres exploraciones: postular, etiquetas,
// escribirles, eliminar sus datos, unir dos fichas y guardar una búsqueda. Las reglas están en `base.ts`.

const primerNombre = (persona: PersonaViva) => persona.nombre.split(' ')[0]
const quienes = (personas: PersonaViva[]) => (personas.length === 1 ? personas[0].nombre : personasTexto(personas.length))

/* Postular a una vacante ------------------------------------------------------------------------------------------ */

export type DecisionPostular = { vacante: VacanteUI; etapa: string; aviso: string | null; entran: PersonaViva[] }

const TEXTO_AVISO_POSTULAR =
  'Hola {nombre}, queremos tenerte en cuenta para la vacante de {vacante}. Revisamos tu perfil y pasaste a la etapa «{etapa}». Pronto te contamos los siguientes pasos.'

// A qué vacante entran: solo las publicadas. Con una persona, cada vacante dice qué tanto sirve (la IA la compara con sus
// requisitos) y si no puede entrar, por qué. Con varias, cuántas entran y cuántas no.
export function DialogoPostular({
  personas,
  vacanteInicial,
  onOpenChange,
  onConfirmar,
}: {
  personas: PersonaViva[]
  vacanteInicial?: string
  onOpenChange: (abierto: boolean) => void
  onConfirmar: (decision: DecisionPostular) => void
}) {
  const una = personas.length === 1 ? personas[0] : null
  const abiertas = useMemo(() => {
    const lista = vacantesAbiertas().map((vacante) => {
      const cupos = personas.map((persona) => ({ persona, cupo: cupoEn(persona.vivos, vacante) }))
      const ajustes = personas.map((persona) => ajusteParaVacante(persona, vacante))
      return {
        vacante,
        cupos,
        entran: cupos.filter((uno) => uno.cupo.puede).length,
        ajuste: una ? ajustes[0] : null,
        sirven: ajustes.filter((ajuste) => ajuste.cumple * 2 >= ajuste.total).length,
      }
    })
    // Con una persona, primero donde más sirve; con varias, donde más sirven.
    return lista.sort((a, b) => (a.entran ? 0 : 1) - (b.entran ? 0 : 1) || (b.ajuste ? b.ajuste.cumple : b.sirven) - (a.ajuste ? a.ajuste.cumple : a.sirven))
  }, [personas, una])
  const [vacanteId, setVacanteId] = useState<string | null>(vacanteInicial ?? abiertas.find((una) => una.entran)?.vacante.id ?? null)
  const elegida = abiertas.find((una) => una.vacante.id === vacanteId)
  const [etapa, setEtapa] = useState<string>(elegida ? primeraEtapaDe(elegida.vacante.etapas) : '')
  const [avisar, setAvisar] = useState(false)
  const [aviso, setAviso] = useState(TEXTO_AVISO_POSTULAR)

  const elegir = (id: string) => {
    setVacanteId(id)
    const vacante = abiertas.find((una) => una.vacante.id === id)?.vacante
    if (vacante) setEtapa(primeraEtapaDe(vacante.etapas))
  }

  const entran = elegida ? elegida.cupos.filter((uno) => uno.cupo.puede).map((uno) => uno.persona) : []
  const noEntran = elegida ? elegida.cupos.filter((uno) => !uno.cupo.puede) : []
  const etapaElegida = elegida?.vacante.etapas.find((una) => una.id === etapa)
  const indiceEtapa = elegida ? elegida.vacante.etapas.findIndex((una) => una.id === etapa) : 0
  const saltadas = elegida ? elegida.vacante.etapas.slice(0, Math.max(indiceEtapa, 0)).map((una) => una.titulo) : []
  const { fuera: sinCorreo } = destinatarios(entran)

  // La acción dice qué está pasando en su botón mientras corre.
  const accion = useAccion()
  return (
    <VentanaDeAccion
      open
      onOpenChange={onOpenChange}
      size="wide"
      title={una ? `Postular a ${una.nombre}` : `Postular a ${personasTexto(personas.length)}`}
      sub={
        una
          ? 'Entra a la vacante que elijas con la misma ficha y aparece en su tablero.'
          : 'Entran a la vacante que elijas con su misma ficha. Quien ya está ahí o se descartó ahí no entra otra vez.'
      }
      note="Se puede deshacer desde el aviso."
      footer={
        <>
          <Button variant="outline" disabled={accion.enCurso} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!elegida || !entran.length || (avisar && !aviso.trim()) || accion.enCurso}
            onClick={() => elegida && accion.correr(() => onConfirmar({ vacante: elegida.vacante, etapa, aviso: avisar ? aviso.trim() : null, entran }))}
          >
            {accion.enCurso ? <Spinner /> : <HugeiconsIcon icon={UserSharingIcon} size={16} />}
            {accion.enCurso ? 'Postulando…' : una ? 'Postular' : entran.length ? `Postular a ${personasTexto(entran.length)}` : 'Postular'}
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel>A qué vacante</FieldLabel>
        <RadioGroup value={vacanteId} onValueChange={(valor) => elegir(valor as string)} className="max-h-[17rem] gap-2 overflow-y-auto pr-1">
          {abiertas.map(({ vacante, entran: cuantas, ajuste, sirven, cupos }) => {
            const cupo = una ? cupos[0].cupo : null
            const cerrada = una ? !cupo?.puede : !cuantas
            return (
              <FieldLabel key={vacante.id} htmlFor={`postular-${vacante.id}`} className={cerrada ? 'opacity-60' : undefined}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle className="flex flex-wrap items-center gap-1.5">
                      {vacante.titulo}
                      {ajuste ? (
                        <Badge
                          variant={ajuste.cumple === ajuste.total ? 'success-light' : ajuste.cumple * 2 >= ajuste.total ? 'warning-light' : 'outline'}
                          size="xs"
                          className="tabular-nums"
                        >
                          <IconoIA />
                          {ajuste.cumple} de {ajuste.total} {ajuste.total === 1 ? 'requisito' : 'requisitos'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="tabular-nums">
                          {sirven} de {personas.length} cumplen la mitad o más
                        </Badge>
                      )}
                      {vacante.oculta ? (
                        <Badge variant="outline">
                          Oculta del portal
                        </Badge>
                      ) : null}
                    </FieldTitle>
                    <FieldDescription>
                      {cupo && !cupo.puede
                        ? cupo.texto
                        : una
                          ? `${vacante.area} · ${vacante.sede} · ${ajuste?.razones[0]}`
                          : `${vacante.area} · ${vacante.sede}${cuantas < personas.length ? ` · ${personasTexto(personas.length - cuantas)} no ${personas.length - cuantas === 1 ? 'entra' : 'entran'}` : ''}`}
                      {cupo?.puede && cupo.tambien ? ` · también está en ${nombreDeLista(cupo.tambien)}` : ''}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={vacante.id} id={`postular-${vacante.id}`} disabled={cerrada} />
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>
        <FieldDescription>Las vacantes cerradas y los borradores no reciben gente.</FieldDescription>
      </Field>

      {elegida ? (
        <>
          <Field>
            <FieldLabel>Entra{una ? '' : 'n'} a</FieldLabel>
            <Select value={etapa} onValueChange={(valor) => setEtapa(valor as string)}>
              <SelectTrigger className="w-full" aria-label="Etapa a la que entran">
                <SelectValue>{(valor: string) => tituloEtapa(valor)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Etapas de {elegida.vacante.titulo}</SelectLabel>
                  {elegida.vacante.etapas.map((una, indice) => (
                    <SelectItem key={una.id} value={una.id}>
                      <Text as="span" variant="muted" className="tabular-nums">
                        {indice + 1}
                      </Text>
                      <span className="min-w-0 flex-1 truncate">{una.titulo}</span>
                      {una.ia ? <IconoIA /> : null}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              {saltadas.length ? `Se salta${una ? '' : 'n'} ${nombreDeLista(saltadas)}: nadie la${una ? '' : 's'} filtra antes. ` : ''}
              Entra{una ? '' : 'n'} ya comparada{una ? '' : 's'} con los requisitos de la vacante.
            </FieldDescription>
          </Field>

          {etapaElegida?.ia ? (
            <Alert variant="info">
              <HugeiconsIcon icon={Mail01Icon} size={16} />
              <AlertTitle className="flex items-center gap-1.5">
                <IconoIA />
                {etapaElegida.titulo} le{una ? '' : 's'} escribe al entrar
              </AlertTitle>
              <AlertDescription>Le{una ? '' : 's'} llega la invitación a la entrevista en unos segundos. Si deshaces a tiempo, no sale.</AlertDescription>
            </Alert>
          ) : null}

          {/* Con varias: quién no entra y por qué, antes de confirmar. */}
          {noEntran.length && !una ? (
            <Alert>
              <HugeiconsIcon icon={Alert02Icon} size={16} />
              <AlertTitle>
                {noEntran.length === 1 ? 'No entra 1 persona' : `No entran ${noEntran.length} personas`}
              </AlertTitle>
              <AlertDescription>
                {noEntran
                  .slice(0, 4)
                  .map((uno) => `${uno.persona.nombre} (${uno.cupo.puede ? '' : uno.cupo.texto.toLowerCase()})`)
                  .join(' · ')}
                {noEntran.length > 4 ? ` · y ${noEntran.length - 4} más` : ''}
              </AlertDescription>
            </Alert>
          ) : null}

          <Separator />

          <div className="flex flex-col gap-3">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{una ? `Avisarle a ${primerNombre(una)}` : 'Avisarles'}</FieldTitle>
                <FieldDescription>
                  {avisar
                    ? `Sale en unos segundos${sinCorreo.length ? `; ${personasTexto(sinCorreo.length)} pidieron no recibir correos y no les llega` : ''}.`
                    : 'Apagado: nadie recibe correo por entrar.'}
                </FieldDescription>
              </FieldContent>
              <Switch checked={avisar} onCheckedChange={setAvisar} aria-label="Avisarles que entraron a la vacante" />
            </Field>
            {avisar ? (
              <Field>
                <FieldLabel>Mensaje</FieldLabel>
                <Textarea value={aviso} onChange={(evento) => setAviso(evento.target.value)} rows={3} />
                <FieldDescription>
                  {'{nombre}'}, {'{vacante}'} y {'{etapa}'} se cambian por sus datos.
                </FieldDescription>
              </Field>
            ) : null}
          </div>
        </>
      ) : null}
    </VentanaDeAccion>
  )
}

/* Etiquetas ------------------------------------------------------------------------------------------------------ */

export function DialogoEtiquetas({
  personas,
  disponibles,
  onOpenChange,
  onConfirmar,
}: {
  personas: PersonaViva[]
  disponibles: string[]
  onOpenChange: (abierto: boolean) => void
  onConfirmar: (poner: string[], quitar: string[]) => void
}) {
  return (
    <VentanaEtiquetas
      titulo={`Etiquetas de ${quienes(personas)}`}
      sub="Sirven para encontrarlas después y para guardar búsquedas."
      deCada={personas.map((persona) => persona.etiquetas)}
      disponibles={disponibles}
      onOpenChange={onOpenChange}
      onConfirmar={onConfirmar}
    />
  )
}

// Poner, crear y quitar etiquetas a una o a varias: la misma ventana para las personas de Mis candidatos y para las
// vacantes (las carpetas del producto). Una etiqueta nueva nace al escribirla en «Poner»; «Quitar» lista las que ya
// tienen, con cuántas la tienen, para sacarla de todas de una vez.
export function VentanaEtiquetas({
  titulo,
  sub,
  deCada,
  disponibles,
  onOpenChange,
  onConfirmar,
}: {
  titulo: string
  sub: string
  // Las etiquetas de cada una de las elegidas.
  deCada: string[][]
  disponibles: string[]
  onOpenChange: (abierto: boolean) => void
  onConfirmar: (poner: string[], quitar: string[]) => void
}) {
  const [poner, setPoner] = useState<string[]>([])
  const [quitar, setQuitar] = useState<string[]>([])
  // Las que ya tienen, con cuántas la tienen: se pueden quitar a todas de una vez.
  const tienen = useMemo(() => {
    const cuenta = new Map<string, number>()
    deCada.forEach((etiquetas) => etiquetas.forEach((etiqueta) => cuenta.set(etiqueta, (cuenta.get(etiqueta) ?? 0) + 1)))
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])
  }, [deCada])
  const total = deCada.length

  return (
    <VentanaDeAccion
      open
      onOpenChange={onOpenChange}
      title={titulo}
      sub={sub}
      note="Se puede deshacer desde el aviso."
      confirmLabel="Aplicar"
      confirmDisabled={!poner.length && !quitar.length}
      onConfirm={() => onConfirmar(poner, quitar)}
      pendingLabel="Aplicando…"
    >
      <Field>
        <FieldLabel htmlFor="etiquetas-poner">Poner</FieldLabel>
        <SelectorEtiquetas id="etiquetas-poner" valor={poner} onCambiar={setPoner} disponibles={disponibles} />
        <FieldDescription>Si no existe, escríbela y se crea.</FieldDescription>
      </Field>
      {tienen.length ? (
        <Field>
          <FieldLabel>Quitar</FieldLabel>
          <div className="flex flex-col gap-2">
            {tienen.map(([etiqueta, cuantas]) => (
              <Field key={etiqueta} orientation="horizontal">
                <Checkbox
                  id={`quitar-${etiqueta}`}
                  checked={quitar.includes(etiqueta)}
                  onCheckedChange={(valor) => setQuitar((antes) => (valor === true ? [...antes, etiqueta] : antes.filter((una) => una !== etiqueta)))}
                />
                <FieldLabel htmlFor={`quitar-${etiqueta}`} className="font-normal!">
                  {etiqueta}
                  {total > 1 ? (
                    <Text as="span" variant="muted" size="sm">
                      {cuantas === total ? 'la tienen todas' : `la tienen ${cuantas} de ${total}`}
                    </Text>
                  ) : null}
                </FieldLabel>
              </Field>
            ))}
          </div>
        </Field>
      ) : null}
    </VentanaDeAccion>
  )
}

/* Escribirles ---------------------------------------------------------------------------------------------------- */

export function DialogoCorreo({
  personas,
  onOpenChange,
  onConfirmar,
  plantillas = PLANTILLAS_BASE,
  vacante,
}: {
  personas: PersonaViva[]
  onOpenChange: (abierto: boolean) => void
  onConfirmar: (decision: { asunto: string; texto: string; reciben: PersonaViva[] }) => void
  // Desde un proceso (el inicio de Vacantes) van las plantillas del proceso, no las de buscar candidatos (IN-02).
  plantillas?: PlantillaBase[]
  // La vacante del proceso, para el «{vacante}» de las plantillas.
  vacante?: string
}) {
  const delProceso = plantillas !== PLANTILLAS_BASE
  const conVacante = (texto: string) => texto.replaceAll('{vacante}', vacante ?? 'la vacante')
  const [plantilla, setPlantilla] = useState(plantillas[0].id)
  const elegida = plantillas.find((una) => una.id === plantilla) ?? plantillas[0]
  const [asunto, setAsunto] = useState(conVacante(elegida.asunto))
  const [texto, setTexto] = useState(conVacante(elegida.texto))
  const { reciben, fuera } = destinatarios(personas)
  const una = personas.length === 1 ? personas[0] : null

  const cambiarPlantilla = (id: string) => {
    const nueva = plantillas.find((una) => una.id === id) ?? plantillas[0]
    setPlantilla(nueva.id)
    setAsunto(conVacante(nueva.asunto))
    setTexto(conVacante(nueva.texto))
  }

  // La acción dice qué está pasando en su botón mientras corre.
  const accion = useAccion()
  return (
    <VentanaDeAccion
      open
      onOpenChange={onOpenChange}
      size="wide"
      title={una ? `Escribirle a ${una.nombre}` : `Escribirles a ${personasTexto(personas.length)}`}
      sub={
        delProceso
          ? una
            ? 'Le llega con su nombre y queda en el rastro de su ficha.'
            : 'Les llega a cada una por separado, con su nombre, y queda en el rastro de su ficha.'
          : una
            ? 'Le llega con su nombre. No entra a ninguna vacante por esto.'
            : 'Les llega a cada una por separado, con su nombre. No entran a ninguna vacante por esto.'
      }
      note="Sale en unos segundos: si deshaces a tiempo, no sale."
      footer={
        <>
          <Button variant="outline" disabled={accion.enCurso} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!reciben.length || !asunto.trim() || !texto.trim() || accion.enCurso}
            onClick={() => accion.correr(() => onConfirmar({ asunto: asunto.trim(), texto: texto.trim(), reciben }))}
          >
            {accion.enCurso ? <Spinner /> : <HugeiconsIcon icon={Mail01Icon} size={16} />}
            {accion.enCurso ? 'Enviando…' : reciben.length === 1 ? 'Enviar' : `Enviar a ${reciben.length}`}
          </Button>
        </>
      }
    >
      {fuera.length ? (
        <Alert variant={reciben.length ? 'warning' : 'destructive'}>
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>
            {fuera.length === 1 ? `${fuera[0].nombre} pidió no recibir correos` : `${fuera.length} personas pidieron no recibir correos`}
          </AlertTitle>
          <AlertDescription>{reciben.length ? 'Quedan fuera de este envío.' : 'No hay a quién escribirle.'}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Plantilla</FieldLabel>
          <Select value={plantilla} onValueChange={(valor) => cambiarPlantilla(valor as string)}>
            <SelectTrigger aria-label="Plantilla">
              <SelectValue>{() => elegida.titulo}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {plantillas.map((una) => (
                <SelectItem key={una.id} value={una.id}>
                  {una.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Asunto</FieldLabel>
          <Input value={asunto} onChange={(evento) => setAsunto(evento.target.value)} />
        </Field>
      </div>
      <Field>
        <FieldLabel>Mensaje</FieldLabel>
        <Textarea value={texto} onChange={(evento) => setTexto(evento.target.value)} rows={4} />
        <FieldDescription>
          {'{nombre}'} y {'{cargo}'} se cambian por los datos de cada persona.
        </FieldDescription>
      </Field>
    </VentanaDeAccion>
  )
}

/* Eliminar candidato ------------------------------------------------------------------------------------------- */

// Derecho de supresión (Ley 1581): se dice de qué procesos sale y qué se borra. Siempre se escribe «eliminar» y no tiene
// «Deshacer» (13 oct, PM: «eliminar un candidato necesita una súper acción de confirmación, porque una vez eliminado no
// hay vuelta atrás»), como eliminar una vacante. Queda el rastro de quién lo hizo.
export function DialogoEliminar({
  personas,
  onOpenChange,
  onConfirmar,
}: {
  personas: PersonaViva[]
  onOpenChange: (abierto: boolean) => void
  onConfirmar: (motivo: string) => void
}) {
  const [motivo, setMotivo] = useState(MOTIVOS_ELIMINAR[0])
  const [otro, setOtro] = useState('')
  const [escrito, setEscrito] = useState('')
  const vivos = personas.flatMap((persona) => persona.vivos.filter((proceso) => proceso.estado === 'En proceso').map((proceso) => ({ persona, proceso })))
  const una = personas.length === 1 ? personas[0] : null

  // La acción dice qué está pasando en su botón mientras corre.
  const accion = useAccion()
  return (
    <VentanaDeAccion
      open
      onOpenChange={onOpenChange}
      title={una ? 'Eliminar candidato' : 'Eliminar candidatos'}
      sub={`${una ? una.nombre : personasTexto(personas.length)}: se ${una ? 'borra' : 'borran'} de la base y de las vacantes donde ${una ? 'esté' : 'estén'}, con su CV, sus documentos y las notas del equipo.`}
      note="No se puede deshacer. Queda registrado quién lo eliminó y cuándo."
      footer={
        <>
          <Button variant="outline" disabled={accion.enCurso} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={(motivo === 'Otro motivo' && !otro.trim()) || escrito.trim().toLowerCase() !== 'eliminar' || accion.enCurso}
            onClick={() => accion.correr(() => onConfirmar(motivo === 'Otro motivo' ? otro.trim() : motivo))}
          >
            {accion.enCurso ? <Spinner /> : <HugeiconsIcon icon={Delete02Icon} size={16} />}
            {accion.enCurso ? 'Eliminando…' : una ? 'Eliminar candidato' : `Eliminar ${personasTexto(personas.length)}`}
          </Button>
        </>
      }
    >
      {vivos.length ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>{una ? 'Sale de un proceso en curso' : `${vivos.length} ${vivos.length === 1 ? 'proceso en curso se cierra' : 'procesos en curso se cierran'}`}</AlertTitle>
          <AlertDescription>
            {vivos
              .slice(0, 4)
              .map((uno) => `${una ? '' : `${uno.persona.nombre}: `}${uno.proceso.vacante} (${uno.proceso.etapa})`)
              .join(' · ')}
            {vivos.length > 4 ? ` · y ${vivos.length - 4} más` : ''}. No se le escribe.
          </AlertDescription>
        </Alert>
      ) : null}
      <Field>
        <FieldLabel>Por qué</FieldLabel>
        <RadioGroup value={motivo} onValueChange={(valor) => setMotivo(valor as string)} className="gap-2">
          {MOTIVOS_ELIMINAR.map((uno) => (
            <Field key={uno} orientation="horizontal">
              <RadioGroupItem value={uno} id={`eliminar-${uno}`} />
              <FieldLabel htmlFor={`eliminar-${uno}`} className="font-normal!">
                {uno}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
        {motivo === 'Otro motivo' ? <Input value={otro} onChange={(evento) => setOtro(evento.target.value)} placeholder="Escribe el motivo" /> : null}
        <FieldDescription>Queda en el registro de la empresa; la persona no lo ve.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="eliminar-escrito">Escribe «eliminar» para confirmar</FieldLabel>
        <Input id="eliminar-escrito" value={escrito} autoComplete="off" onChange={(evento) => setEscrito(evento.target.value)} />
      </Field>
    </VentanaDeAccion>
  )
}

/* Unir dos fichas ---------------------------------------------------------------------------------------------- */

// La misma persona dos veces: se elige qué dato se queda de cada lado. Lo demás se suma.
export function DialogoUnir({
  principal,
  otra,
  onOpenChange,
  onConfirmar,
}: {
  principal: PersonaViva
  otra: PersonaViva
  onOpenChange: (abierto: boolean) => void
  onConfirmar: (elegido: Record<CampoUnible, 'principal' | 'otra'>) => void
}) {
  const [elegido, setElegido] = useState<Record<CampoUnible, 'principal' | 'otra'>>(() =>
    Object.fromEntries(CAMPOS_UNIBLES.map(({ campo }) => [campo, principal[campo] ? 'principal' : 'otra'])) as Record<CampoUnible, 'principal' | 'otra'>,
  )
  const lado = (persona: PersonaViva, titulo: string) => (
    <Item variant="muted" size="sm">
      <ItemContent>
        <ItemTitle>{titulo}</ItemTitle>
        <ItemDescription>
          {persona.entrada} · {SITUACION_TEXTO[persona.situacion].toLowerCase()}
        </ItemDescription>
      </ItemContent>
    </Item>
  )

  return (
    <VentanaDeAccion
      open
      onOpenChange={onOpenChange}
      size="wide"
      title="Unir en una sola ficha"
      sub="Parecen la misma persona: mismo nombre y mismo cargo, con otro correo. Elige qué dato se queda; lo demás se suma."
      note="Se puede deshacer desde el aviso."
      confirmLabel="Unir en una sola ficha"
      pendingLabel="Uniendo…"
      onConfirm={() => onConfirmar(elegido)}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {lado(principal, 'Esta ficha')}
        {lado(otra, 'La otra ficha')}
      </div>
      <div className="flex flex-col gap-3">
        {CAMPOS_UNIBLES.map(({ campo, texto }) => (
          <Field key={campo}>
            <FieldLabel>{texto}</FieldLabel>
            <RadioGroup
              value={elegido[campo]}
              onValueChange={(valor) => setElegido((antes) => ({ ...antes, [campo]: valor as 'principal' | 'otra' }))}
              className="grid gap-2 sm:grid-cols-2"
            >
              {(['principal', 'otra'] as const).map((cual) => {
                const valor = (cual === 'principal' ? principal : otra)[campo]
                return (
                  <FieldLabel key={cual} htmlFor={`unir-${campo}-${cual}`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle className="font-normal!">{valor || 'Vacío'}</FieldTitle>
                      </FieldContent>
                      <RadioGroupItem value={cual} id={`unir-${campo}-${cual}`} disabled={!valor} />
                    </Field>
                  </FieldLabel>
                )
              })}
            </RadioGroup>
          </Field>
        ))}
      </div>
      <Text as="p" variant="muted" size="sm" className="text-pretty">
        Se suman las etiquetas, lo que sabe hacer y los procesos de las dos
        {otra.vivos.length || principal.vivos.length ? ` (${[...principal.vivos, ...otra.vivos].map((proceso) => proceso.vacante).join(', ')})` : ''}. El correo que
        no quede queda como correo alterno: se sigue encontrando por él.
      </Text>
    </VentanaDeAccion>
  )
}

/* Guardar una búsqueda --------------------------------------------------------------------------------------- */

export function DialogoGuardarBusqueda({
  filtros,
  cuantas,
  onOpenChange,
  onConfirmar,
}: {
  filtros: FiltrosBase
  cuantas: number
  onOpenChange: (abierto: boolean) => void
  onConfirmar: (nombre: string, avisar: boolean) => void
}) {
  const sugerido = describirFiltros(filtros)
  const [nombre, setNombre] = useState(sugerido.length > 48 ? '' : sugerido)
  const [avisar, setAvisar] = useState(true)
  return (
    <VentanaDeAccion
      open
      onOpenChange={onOpenChange}
      title="Guardar esta búsqueda"
      sub={`${sugerido} · hoy son ${personasTexto(cuantas)}.`}
      confirmLabel="Guardar"
      pendingLabel="Guardando…"
      confirmDisabled={!nombre.trim()}
      onConfirm={() => onConfirmar(nombre.trim(), avisar)}
    >
      <Field>
        <FieldLabel>Nombre</FieldLabel>
        <Input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Por ejemplo: Analítica libre en Bogotá" />
        <FieldDescription>La encuentras en «Búsquedas guardadas», en las tres vistas de Mis candidatos.</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Avisarme cuando entre alguien así</FieldTitle>
          <FieldDescription>Te llega una notificación cuando alguien nuevo cumple esta búsqueda (por un lote, una postulación o a mano).</FieldDescription>
        </FieldContent>
        <Switch checked={avisar} onCheckedChange={setAvisar} aria-label="Avisarme cuando entre alguien así" />
      </Field>
    </VentanaDeAccion>
  )
}
