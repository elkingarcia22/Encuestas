import { type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Briefcase06Icon, Database01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Button, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { AgentMessage } from '@/modules/admin/suite-ai/chat/components/agent-message'
import type { ReplySource } from '@/modules/admin/suite-ai/shared/reply-details'
import {
  AgentNote,
  AgentSuggestions,
  AgentThread,
  ContextPanel,
  OrbeEnRespuesta,
  useMensajeAgente,
} from '@/modules/design-system/agente-contextual/components/agent-kit'
import { PILL_XS } from '@/modules/design-system/agente-contextual/components/agent-styles'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { CANDIDATURAS, ESPERA_RESPUESTA, type VacanteUI } from '../datos'
import { afinesEnLaBase, normalizar } from '../agente-vacante'
import { coincideTexto, posiblesDuplicados, type PersonaViva } from '../base'
import { QUIEN_MUEVE } from '../movimientos'

// Orbit fuera de una vacante (OF-58, OF-59): en el inicio de Vacantes responde sobre todas las vacantes y en «Mis
// candidatos» sobre la base. Es el mismo panel, con las mismas acciones del mensaje, y lo que encuentra se abre o se
// filtra en la pantalla de trabajo. No cambia nada por su cuenta.

const FILA = 'w-full text-left hover:bg-accent/50 [[data-slot=item]&]:rounded-[12px]!'
const plural = (n: number, uno: string, varios: string) => (n === 1 ? `1 ${uno}` : `${n} ${varios}`)
const tiene = (texto: string, patron: RegExp) => patron.test(normalizar(texto))

// Preguntas que no se responden aquí tampoco (OF-51).
export const SENSIBLE = /\b(edad|cuantos anos tiene|hijos?|embaraz|casad[oa]|solter[oa]|estado civil|religion|orientacion sexual|raza|etnia|mujeres|hombres|nacionalidad)\b/

function Respuesta({ fuentes = [], seguir = [], onSeguir, children }: { fuentes?: ReplySource[]; seguir?: string[]; onSeguir: (texto: string) => void; children: ReactNode }) {
  const mensaje = useMensajeAgente()
  return (
    <AgentMessage
      text=""
      body={<OrbeEnRespuesta.Provider value>{children}</OrbeEnRespuesta.Provider>}
      latest={mensaje?.ultimo ?? false}
      details={{ sources: fuentes, followups: seguir, alternates: [] }}
      onFollowup={onSeguir}
    />
  )
}

/* El inicio de Vacantes (OF-58) -------------------------------------------------------------------------------- */

type Fila = { vacante: VacanteUI; enProceso: number; esperan: number }

const filasDe = (vacantes: VacanteUI[]): Fila[] =>
  vacantes.map((vacante) => {
    const suyas = CANDIDATURAS.filter((c) => c.vacante.id === vacante.id)
    return { vacante, enProceso: suyas.length, esperan: suyas.filter(ESPERA_RESPUESTA).length }
  })

function ListaVacantes({ filas, detalle, onAbrir }: { filas: Fila[]; detalle: (fila: Fila) => string; onAbrir: (id: string) => void }) {
  return (
    <ItemGroup className="mt-3 gap-1!">
      {filas.map((fila) => (
        <Item key={fila.vacante.id} size="sm" render={<button type="button" />} onClick={() => onAbrir(fila.vacante.id)} className={FILA} aria-label={`Abrir ${fila.vacante.titulo}`}>
          <ItemContent className="min-w-0!">
            <ItemTitle className="w-full!">
              <span className="truncate">{fila.vacante.titulo}</span>
            </ItemTitle>
            <ItemDescription className="truncate">{detalle(fila)}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}

const SUGERENCIAS_INICIO = ['¿Qué vacantes están atascadas?', '¿Dónde tengo más gente esperando?', '¿Cuáles no reciben aplicaciones?', '¿Cuáles siguen en borrador?']

export function AgenteInicio({ vacantes, onClose, onAbrir }: { vacantes: VacanteUI[]; onClose: () => void; onAbrir: (id: string) => void }) {
  const hilo = useAgentThread([], { clave: 'seleccion:inicio' })
  const filas = filasDe(vacantes)
  const publicadas = filas.filter((fila) => fila.vacante.estado === 'Publicada')
  const fuente: ReplySource = { label: 'Tus vacantes', detail: `${plural(vacantes.length, 'vacante', 'vacantes')} · al día`, icon: Briefcase06Icon }

  const responder = (texto: string): ReactNode => {
    const r = (contenido: ReactNode, seguir: string[] = []) => (
      <Respuesta fuentes={[fuente]} seguir={seguir} onSeguir={escribir}>
        {contenido}
      </Respuesta>
    )
    if (tiene(texto, SENSIBLE))
      return r(<AgentNote>Eso no te lo respondo: la edad, los hijos, el estado civil o el origen no pueden pesar en una contratación.</AgentNote>)
    if (tiene(texto, /(atasc|estanc|frenad|lent|mas tiempo|demor)/)) {
      const atascadas = [...publicadas].filter((fila) => fila.esperan > 0 || fila.vacante.diasAbierta > 30).sort((a, b) => b.esperan - a.esperan || b.vacante.diasAbierta - a.vacante.diasAbierta)
      if (!atascadas.length) return r(<AgentNote>Ninguna vacante publicada se ve atascada: nadie espera una respuesta y ninguna pasa de 30 días.</AgentNote>)
      return r(
        <>
          <AgentNote>{plural(atascadas.length, 'vacante se ve atascada', 'vacantes se ven atascadas')}: tienen gente esperando una respuesta tuya o llevan más de 30 días abiertas.</AgentNote>
          <ListaVacantes filas={atascadas.slice(0, 6)} onAbrir={onAbrir} detalle={(fila) => `${plural(fila.esperan, 'espera', 'esperan')} · ${plural(fila.vacante.diasAbierta, 'día', 'días')} abierta`} />
        </>,
        ['¿Dónde tengo más gente esperando?'],
      )
    }
    if (tiene(texto, /(espera|pendiente|respuesta|responder)/)) {
      const con = [...filas].filter((fila) => fila.esperan > 0).sort((a, b) => b.esperan - a.esperan)
      if (!con.length) return r(<AgentNote>Nadie espera una respuesta tuya en ninguna vacante.</AgentNote>)
      return r(
        <>
          <AgentNote>
            {plural(con.reduce((suma, fila) => suma + fila.esperan, 0), 'persona espera', 'personas esperan')} una respuesta tuya en {plural(con.length, 'vacante', 'vacantes')}. Donde más: {con[0].vacante.titulo}.
          </AgentNote>
          <ListaVacantes filas={con.slice(0, 6)} onAbrir={onAbrir} detalle={(fila) => `${plural(fila.esperan, 'espera', 'esperan')} de ${fila.enProceso} en proceso`} />
        </>,
        ['¿Qué vacantes están atascadas?'],
      )
    }
    if (tiene(texto, /(sin aplicaciones|no reciben|no llega|pocas aplicaciones|nadie aplica|sin gente|no aplica nadie)/)) {
      const secas = publicadas.filter((fila) => fila.vacante.ultimaSemana === 0).sort((a, b) => b.vacante.diasAbierta - a.vacante.diasAbierta)
      if (!secas.length) return r(<AgentNote>Todas las vacantes publicadas recibieron aplicaciones esta semana.</AgentNote>)
      return r(
        <>
          <AgentNote>{plural(secas.length, 'vacante publicada no recibió', 'vacantes publicadas no recibieron')} aplicaciones esta semana. Revisa su descripción o compártela otra vez.</AgentNote>
          <ListaVacantes filas={secas.slice(0, 6)} onAbrir={onAbrir} detalle={(fila) => `${plural(fila.vacante.diasAbierta, 'día', 'días')} abierta · ${plural(fila.vacante.aplicaciones, 'aplicación', 'aplicaciones')} en total`} />
        </>,
      )
    }
    if (tiene(texto, /(borrador|sin publicar|no publicad)/)) {
      const borradores = filas.filter((fila) => fila.vacante.estado === 'Borrador')
      if (!borradores.length) return r(<AgentNote>No tienes vacantes en borrador.</AgentNote>)
      return r(
        <>
          <AgentNote>{plural(borradores.length, 'vacante sigue', 'vacantes siguen')} en borrador: nadie las ve fuera del equipo.</AgentNote>
          <ListaVacantes filas={borradores} onAbrir={onAbrir} detalle={(fila) => `${fila.vacante.area} · ${fila.vacante.sede}`} />
        </>,
      )
    }
    if (tiene(texto, /(cerrad|contrat|termin)/)) {
      const cerradas = filas.filter((fila) => fila.vacante.estado === 'Cerrada')
      return r(
        <>
          <AgentNote>{cerradas.length ? `${plural(cerradas.length, 'vacante está cerrada', 'vacantes están cerradas')}:` : 'No tienes vacantes cerradas.'}</AgentNote>
          {cerradas.length ? <ListaVacantes filas={cerradas} onAbrir={onAbrir} detalle={(fila) => fila.vacante.desenlace ?? 'Cerrada'} /> : null}
        </>,
      )
    }
    if (tiene(texto, /(resum|como van|como vamos|panorama|cuantas vacantes)/))
      return r(
        <AgentNote>
          Tienes {plural(vacantes.length, 'vacante', 'vacantes')}: {publicadas.length} publicadas, {filas.filter((fila) => fila.vacante.estado === 'Borrador').length} en borrador y{' '}
          {filas.filter((fila) => fila.vacante.estado === 'Cerrada').length} cerradas. {filas.reduce((suma, fila) => suma + fila.esperan, 0)} personas esperan una respuesta tuya.
        </AgentNote>,
        ['¿Qué vacantes están atascadas?'],
      )
    return r(
      <>
        <AgentNote>Todavía no sé responder eso. Aquí te ayudo con todas tus vacantes; dentro de cada una, con su gente.</AgentNote>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGERENCIAS_INICIO.map((pedido) => (
            <Button key={pedido} variant="outline" className={PILL_XS} onClick={() => escribir(pedido)}>
              {pedido}
            </Button>
          ))}
        </div>
      </>,
    )
  }
  const escribir = (texto: string) => hilo.ask(texto, responder(texto), 1300)

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Tus vacantes</span> · {publicadas.length} publicadas
        </>
      }
      contextIcon={Briefcase06Icon}
      onClose={onClose}
      placeholder="Pregunta algo sobre tus vacantes"
      onSend={escribir}
      scrollKey={hilo.msgs.length ? hilo.scrollKey : undefined}
      attach={false}
      dictar
    >
      <AgentNote>
        Hola, {QUIEN_MUEVE.split(' ')[0]}. Estoy mirando tus {vacantes.length} vacantes: {publicadas.length} publicadas y{' '}
        {plural(filas.reduce((suma, fila) => suma + fila.esperan, 0), 'persona espera', 'personas esperan')} una respuesta tuya. Pregúntame lo que quieras.
      </AgentNote>
      <AgentSuggestions title="Sobre tus vacantes" className="mt-6" items={SUGERENCIAS_INICIO.map((pedido) => ({ label: pedido, onClick: () => escribir(pedido) }))} />
      <AgentThread msgs={hilo.msgs} thinking={hilo.thinking} thinkingLabel="Revisando tus vacantes…" clave={hilo.clave} onDetener={() => hilo.detener()} />
    </ContextPanel>
  )
}

/* Mis candidatos (OF-59) --------------------------------------------------------------------------------------- */

// 13 oct (reunión con la PM y el TL): «Comparar con una vacante» salió de la tabla y vive aquí, en el chat: se elige la
// vacante y Orbit Flow arma la búsqueda con lo que ella pide, sin volver a escribir los requisitos.
const SUGERENCIAS_BASE = ['Busca candidatos para una de mis vacantes', 'Busca analistas con Power BI en Bogotá', '¿Hay duplicados en la base?', '¿Quién pidió no recibir correos?']
const RELLENO = new Set(['busca', 'buscame', 'encuentra', 'quien', 'quienes', 'hay', 'personas', 'gente', 'con', 'en', 'de', 'que', 'sepan', 'sepa', 'tengan', 'a', 'los', 'las', 'el', 'la', 'y', 'mi', 'base'])

function ListaPersonasBase({ personas, detalle, onAbrir }: { personas: PersonaViva[]; detalle: (persona: PersonaViva) => string; onAbrir: (id: string) => void }) {
  return (
    <ItemGroup className="mt-3 gap-1!">
      {personas.map((persona) => (
        <Item key={persona.id} size="sm" render={<button type="button" />} onClick={() => onAbrir(persona.id)} className={FILA} aria-label={`Abrir la ficha de ${persona.nombre}`}>
          <ItemContent className="min-w-0!">
            <ItemTitle className="w-full!">
              <span className="truncate">{persona.nombre}</span>
            </ItemTitle>
            <ItemDescription className="truncate">{detalle(persona)}</ItemDescription>
          </ItemContent>
          {persona.noContactar ? (
            <ItemActions>
              <Badge variant="secondary">
                No recibe correos
              </Badge>
            </ItemActions>
          ) : null}
        </Item>
      ))}
    </ItemGroup>
  )
}

export function AgenteBase({
  personas,
  vacantes,
  onClose,
  onAbrir,
  onBuscar,
  onCompararCon,
}: {
  personas: PersonaViva[]
  vacantes: VacanteUI[]
  onClose: () => void
  onAbrir: (personaId: string) => void
  // Llevar lo encontrado a la tabla: la búsqueda o la comparación con una vacante.
  onBuscar: (texto: string) => void
  onCompararCon: (vacanteId: string) => void
}) {
  const hilo = useAgentThread([], { clave: 'seleccion:base' })
  const fuente: ReplySource = { label: 'Mis candidatos', detail: `${plural(personas.length, 'persona', 'personas')} en la base`, icon: Database01Icon }

  const responder = (texto: string): ReactNode => {
    const r = (contenido: ReactNode, seguir: string[] = []) => (
      <Respuesta fuentes={[fuente]} seguir={seguir} onSeguir={escribir}>
        {contenido}
      </Respuesta>
    )
    if (tiene(texto, SENSIBLE))
      return r(<AgentNote>Eso no lo busco: la edad, los hijos, el estado civil o el origen no pueden pesar en una contratación. Búscame por lo que la persona sabe hacer.</AgentNote>)
    if (tiene(texto, /duplicad|repetid|dos veces/)) {
      const pares = [...posiblesDuplicados(personas)].slice(0, 6)
      if (!pares.length) return r(<AgentNote>No veo personas repetidas en tu base.</AgentNote>)
      const porId = new Map(personas.map((persona) => [persona.id, persona]))
      return r(
        <>
          <AgentNote>{plural(pares.length, 'persona parece estar', 'personas parecen estar')} dos veces en tu base. Ábrelas y únelas desde su ficha.</AgentNote>
          <ListaPersonasBase
            personas={pares.map(([id]) => porId.get(id)).filter((persona): persona is PersonaViva => persona !== undefined)}
            onAbrir={onAbrir}
            detalle={(persona) => `Se parece a ${porId.get(pares.find(([id]) => id === persona.id)?.[1] ?? '')?.nombre ?? 'otra ficha'} · ${persona.correo}`}
          />
        </>,
      )
    }
    if (tiene(texto, /(no recib|no contactar|no quiere(n)? correos|pidio no)/)) {
      const no = personas.filter((persona) => persona.noContactar)
      return r(
        <>
          <AgentNote>{no.length ? `${plural(no.length, 'persona pidió', 'personas pidieron')} no recibir correos de la empresa. Los envíos a varias las dejan fuera.` : 'Nadie pidió no recibir correos.'}</AgentNote>
          {no.length ? <ListaPersonasBase personas={no.slice(0, 8)} onAbrir={onAbrir} detalle={(persona) => `${persona.cargo} · ${persona.ciudad}`} /> : null}
        </>,
      )
    }
    const vacante = vacantes.find((una) => una.estado !== 'Cerrada' && normalizar(texto).includes(normalizar(una.titulo)))
    // Sin decir cuál: se elige de las abiertas y se busca con lo que pide.
    if (!vacante && tiene(texto, /para una (de mis )?vacante/)) {
      const abiertas = vacantes.filter((una) => una.estado === 'Publicada').slice(0, 8)
      return r(
        <>
          <AgentNote>¿Para cuál? Leo lo que pide y busco en tu base a quien encaja, sin que tengas que escribir los requisitos.</AgentNote>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {abiertas.map((una) => (
              <Button key={una.id} variant="outline" className={PILL_XS} onClick={() => escribir(`Busca candidatos para ${una.titulo}`)}>
                {una.titulo}
              </Button>
            ))}
          </div>
        </>,
      )
    }
    if (vacante && tiene(texto, /(invit|postul|sirve|encaja|para|agrega)/)) {
      const ctx = { vacante, dentro: CANDIDATURAS.filter((c) => c.vacante.id === vacante.id), rechazadas: [] }
      const afines = afinesEnLaBase(ctx, personas, 6)
      return r(
        <>
          <AgentNote>
            {afines.length
              ? `Leí lo que pide ${vacante.titulo}: ${plural(afines.length, 'persona de tu base encaja', 'personas de tu base encajan')} y no ${afines.length === 1 ? 'está' : 'están'} en ella.`
              : `No encontré en tu base a nadie que comparta lo que pide ${vacante.titulo}.`}
          </AgentNote>
          {afines.length ? <ListaPersonasBase personas={afines.map((una) => una.persona as PersonaViva)} onAbrir={onAbrir} detalle={(persona) => `${persona.cargo} · ${persona.ciudad}`} /> : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button variant="outline" className={PILL_XS} onClick={() => onCompararCon(vacante.id)}>
              Verlas en la tabla, de la que más encaja a la que menos
            </Button>
          </div>
        </>,
      )
    }
    const palabras = normalizar(texto)
      .split(/[^a-zñ0-9+#.]+/)
      .filter((palabra) => palabra.length > 1 && !RELLENO.has(palabra))
    const consulta = palabras.join(' ')
    // «analistas» también encuentra «Analista»: se prueba la palabra y su singular.
    const encaja = (persona: PersonaViva, palabra: string) =>
      [palabra, palabra.replace(/es$/, ''), palabra.replace(/s$/, '')].some((forma) => forma.length > 1 && (coincideTexto(persona, forma) || normalizar(persona.ciudad).includes(forma)))
    const halladas = consulta ? personas.filter((persona) => palabras.every((palabra) => encaja(persona, palabra))) : []
    if (consulta && halladas.length)
      return r(
        <>
          <AgentNote>
            Encontré {plural(halladas.length, 'persona', 'personas')} con «{consulta}».{halladas.length > 8 ? ' Te muestro las primeras 8.' : ''}
          </AgentNote>
          <ListaPersonasBase personas={halladas.slice(0, 8)} onAbrir={onAbrir} detalle={(persona) => `${persona.cargo} · ${persona.ciudad} · ${persona.anios} años`} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button variant="outline" className={PILL_XS} onClick={() => onBuscar(consulta)}>
              Verlas en la tabla
            </Button>
          </div>
        </>,
        ['¿Hay duplicados en la base?'],
      )
    return r(
      <>
        <AgentNote>{consulta ? `No encontré a nadie con «${consulta}» en tu base.` : 'Todavía no sé responder eso.'} Puedo buscar por lo que la persona sabe hacer, su cargo o su ciudad:</AgentNote>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGERENCIAS_BASE.map((pedido) => (
            <Button key={pedido} variant="outline" className={PILL_XS} onClick={() => escribir(pedido)}>
              {pedido}
            </Button>
          ))}
        </div>
      </>,
    )
  }
  const escribir = (texto: string) => hilo.ask(texto, responder(texto), 1300)

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Mis candidatos</span> · {plural(personas.length, 'persona', 'personas')}
        </>
      }
      contextIcon={UserGroupIcon}
      onClose={onClose}
      placeholder="Busca o pregunta algo sobre tu base"
      onSend={escribir}
      scrollKey={hilo.msgs.length ? hilo.scrollKey : undefined}
      attach={false}
      dictar
    >
      <AgentNote>
        Hola, {QUIEN_MUEVE.split(' ')[0]}. Estoy mirando tu base: {plural(personas.length, 'persona', 'personas')}. Búscame a alguien por lo que sabe hacer o pregúntame a quién invitar a una
        vacante.
      </AgentNote>
      <AgentSuggestions title="Sobre tu base" className="mt-6" items={SUGERENCIAS_BASE.map((pedido) => ({ label: pedido, onClick: () => escribir(pedido) }))} />
      <AgentThread msgs={hilo.msgs} thinking={hilo.thinking} thinkingLabel="Buscando en tu base…" clave={hilo.clave} onDetener={() => hilo.detener()} />
    </ContextPanel>
  )
}
