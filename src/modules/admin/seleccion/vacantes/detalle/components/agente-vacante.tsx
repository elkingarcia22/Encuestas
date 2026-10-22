import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, GitCompareIcon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import {
  AgentCard,
  AgentList,
  AgentNote,
  AgentSuggestions,
  AgentThread,
  ContextPanel,
  SourcePills,
  UndoRow,
  UserBubble,
} from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { plural } from '@/modules/design-system/patrones/formato'
import {
  CRITERIOS,
  NOMBRE_ETAPA,
  pesos,
  respuestaComparar,
  respuestaResumen,
  type Candidato,
  type Hallazgo,
  type SeccionId,
  type Vacante,
} from './data'

// Qué está haciendo el agente: presentarse, resumir al candidato abierto o comparar a los seleccionados.
export type Tarea = { tipo: 'inicio' } | { tipo: 'resumen'; candidatoId: string } | { tipo: 'comparar'; ids: string[] }

type Marco = {
  onClose: () => void
}

const ESTADO_REQUISITO = { Cumple: 'success-outline', Parcial: 'warning-outline', 'Por validar': 'outline', 'No cumple': 'destructive-outline' } as const

const nombreCorto = (candidato: Candidato) => candidato.nombre.split(' ')[0]

// Fortalezas o riesgos: cada afirmación con sus fuentes debajo.
function Hallazgos({ items, riesgo = false, onFuente }: { items: Hallazgo[]; riesgo?: boolean; onFuente: (seccion: SeccionId) => void }) {
  if (!items.length) {
    return (
      <Text as="p" variant="muted" size="sm">
        {riesgo ? 'No encontré riesgos en la información que hay.' : 'No encontré fortalezas claras todavía.'}
      </Text>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.texto} className="flex gap-2">
          <HugeiconsIcon
            icon={riesgo ? Alert02Icon : CheckmarkCircle02Icon}
            size={16}
            className={riesgo ? 'mt-0.5 shrink-0 text-muted-foreground' : 'mt-0.5 shrink-0 text-primary'}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Text as="span" size="sm">
              {item.texto}
            </Text>
            {item.fuentes.length ? (
              <SourcePills sources={item.fuentes.map((fuente) => ({ label: fuente.etiqueta, onClick: () => onFuente(fuente.seccion) }))} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Inicio ──

export function AgenteInicio({
  vacante,
  candidatos,
  seleccionados,
  abierto,
  onResumir,
  onComparar,
  onAbrir,
  ...marco
}: Marco & {
  vacante: Vacante
  candidatos: Candidato[]
  seleccionados: number
  abierto: Candidato | null
  onResumir: () => void
  onComparar: () => void
  onAbrir: (id: string) => void
}) {
  const thread = useAgentThread()
  const pendientes = candidatos.filter((c) => c.accion)

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Vacante {vacante.titulo}</span> · {candidatos.length} {plural(candidatos.length, 'candidato', 'candidatos')} en proceso
        </>
      }
      {...marco}
      placeholder="Pregunta sobre esta vacante"
      onSend={(texto) =>
        thread.ask(
          texto,
          'Puedo resumir a un candidato (abre su ficha) o comparar entre 2 y 3 que marques en el tablero. ¿Por cuál empezamos?',
        )
      }
      scrollKey={thread.msgs.length ? thread.scrollKey : undefined}
    >
      <AgentNote>
        Estoy mirando la vacante {vacante.titulo}: {candidatos.length} {plural(candidatos.length, 'candidato', 'candidatos')} en proceso y {pendientes.length} con acción requerida.
      </AgentNote>

      {pendientes.length ? (
        <AgentCard title="Acción requerida" className="mt-4">
          <ItemGroup className="gap-1">
            {pendientes.map((c) => (
              <Item key={c.id} size="xs">
                <ItemMedia>
                  <Avatar size="sm">
                    <AvatarFallback>{c.iniciales}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{c.nombre}</ItemTitle>
                  <ItemDescription>
                    {NOMBRE_ETAPA[c.etapa]} · {c.accion}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="xs" onClick={() => onAbrir(c.id)}>
                    Ver ficha
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </AgentCard>
      ) : null}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} thinkingLabel="Revisando la vacante…" />

      <AgentSuggestions
        title="Sobre esta vacante"
        className="mt-8"
        items={[
          {
            label: abierto ? `Resumir a ${abierto.nombre}` : 'Resumir candidato',
            onClick: abierto
              ? onResumir
              : () => thread.ask('Resume a un candidato', 'Abre la ficha de un candidato en el tablero y lo resumo para el comité.', 600),
          },
          {
            label: seleccionados >= 2 ? `Comparar a los ${seleccionados} seleccionados` : 'Comparar finalistas',
            onClick:
              seleccionados >= 2
                ? onComparar
                : () =>
                    thread.ask(
                      'Compara a los finalistas',
                      `Marca entre 2 y 3 candidatos en el tablero (llevas ${seleccionados}) y armo la comparación.`,
                      600,
                    ),
          },
        ]}
      />
    </ContextPanel>
  )
}

// ── Resumir candidato ──

export function AgenteResumen({
  vacante,
  candidato,
  notaGuardada,
  onFuente,
  onGuardarNota,
  onDeshacerNota,
  ...marco
}: Marco & {
  vacante: Vacante
  candidato: Candidato
  notaGuardada: boolean
  onFuente: (seccion: SeccionId) => void
  onGuardarNota: () => void
  onDeshacerNota: () => void
}) {
  const thread = useAgentThread()

  const responder = (pregunta: string) => {
    const respuesta = respuestaResumen(pregunta, candidato, vacante)
    return (
      <div className="flex flex-col gap-2.5">
        <Text as="p" size="sm">
          {respuesta.texto}
        </Text>
        {respuesta.fuentes.length ? (
          <SourcePills sources={respuesta.fuentes.map((fuente) => ({ label: fuente.etiqueta, onClick: () => onFuente(fuente.seccion) }))} />
        ) : null}
      </div>
    )
  }

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Ficha de {candidato.nombre}</span> · {vacante.titulo}
        </>
      }
      contextIcon={UserIcon}
      {...marco}
      placeholder={`Pregunta sobre ${nombreCorto(candidato)}`}
      onSend={(texto) => thread.ask(texto, () => responder(texto))}
      scrollKey={notaGuardada || thread.msgs.length ? `${thread.scrollKey}-${notaGuardada}` : undefined}
    >
      <UserBubble>Resume a {nombreCorto(candidato)} para el comité</UserBubble>
      <AgentNote className="mt-4">
        Leí la hoja de vida{candidato.serena !== undefined ? ', la entrevista con Serena AI' : ''} y las notas. Toca una fuente para verla en la
        ficha.
      </AgentNote>

      <AgentCard title="Resumen" className="mt-4">
        <Progress value={candidato.ajuste}>
          <ProgressLabel>Ajuste con el cargo</ProgressLabel>
          <ProgressValue className="ms-auto" />
        </Progress>

        <div className="mt-5 mb-3">
          <Text as="span" variant="muted" size="xs" weight="medium">
            Fortalezas
          </Text>
        </div>
        <Hallazgos items={candidato.fortalezas} onFuente={onFuente} />

        <div className="mt-5 mb-3">
          <Text as="span" variant="muted" size="xs" weight="medium">
            Riesgos
          </Text>
        </div>
        <Hallazgos items={candidato.riesgos} riesgo onFuente={onFuente} />
      </AgentCard>

      <AgentCard title="Requisitos del cargo" className="mt-4">
        <div className="flex flex-col gap-2.5">
          {vacante.requisitos.map((requisito, indice) => (
            <div key={requisito} className="flex items-start justify-between gap-3">
              <Text as="span" size="sm">
                {requisito}
              </Text>
              <Badge variant={ESTADO_REQUISITO[candidato.requisitos[indice]]} className="shrink-0">
                {candidato.requisitos[indice]}
              </Badge>
            </div>
          ))}
        </div>
        <SourcePills className="mt-3" sources={[{ label: 'Hoja de vida · requisitos', onClick: () => onFuente('cv') }]} />
      </AgentCard>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => notify('Resumen copiado', 'Listo para pegar en el acta del comité', 'success')}>Copiar para el comité</Button>
        <Button variant="outline" onClick={notaGuardada ? () => onFuente('notas') : onGuardarNota}>
          {notaGuardada ? 'Ver la nota' : 'Guardar como nota'}
        </Button>
      </div>
      {notaGuardada ? (
        <UndoRow className="mt-3" onUndo={onDeshacerNota}>
          Guardado en las notas de {nombreCorto(candidato)}
        </UndoRow>
      ) : null}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} thinkingLabel="Buscando en la ficha…" />

      <AgentSuggestions
        title={`Sobre ${nombreCorto(candidato)}`}
        className="mt-8"
        items={[
          { label: '¿Cuánto pide y cómo queda frente al rango?', onClick: () => thread.ask('¿Cuánto pide?', () => responder('pretensión')) },
          { label: '¿Cómo le fue con Serena AI?', onClick: () => thread.ask('¿Cómo le fue con Serena AI?', () => responder('serena')) },
          {
            label: '¿Qué preguntar en la revisión?',
            onClick: () =>
              thread.ask(
                '¿Qué preguntar en la revisión?',
                <AgentCard title="Para la revisión">
                  <AgentList
                    items={[
                      ...candidato.riesgos.map((riesgo) => `Profundiza en esto: ${riesgo.texto.charAt(0).toLowerCase()}${riesgo.texto.slice(1)}`),
                      `Pide un ejemplo reciente de su trabajo en ${candidato.empresa} con resultados medibles.`,
                    ]}
                  />
                </AgentCard>,
              ),
          },
        ]}
      />
    </ContextPanel>
  )
}

// ── Comparar finalistas ──

export function AgenteComparar({
  vacante,
  candidatos,
  movidos,
  onMoverRevision,
  onDeshacerMover,
  ...marco
}: Marco & {
  vacante: Vacante
  candidatos: Candidato[]
  // Candidatos que el agente pasó a Para revisión (para deshacer).
  movidos: string[]
  onMoverRevision: (ids: string[]) => void
  onDeshacerMover: () => void
}) {
  const thread = useAgentThread()
  const suficientes = candidatos.length >= 2
  const ordenados = [...candidatos].sort((a, b) => b.ajuste - a.ajuste)
  const mejor = ordenados[0]
  const segundo = ordenados[1]
  // Solo se pueden pasar a Para revisión los que siguen en etapas anteriores.
  const antes = candidatos.filter((c) => c.etapa === 'cv' || c.etapa === 'serena')

  const salvedades = [
    ...candidatos.filter((c) => c.serena === undefined).map((c) => `${nombreCorto(c)} no ha pasado por Serena AI: su ajuste sale solo de la hoja de vida.`),
    ...candidatos
      .filter((c) => c.pretension > vacante.rango[1])
      .map((c) => `${nombreCorto(c)} pide ${pesos(c.pretension)}, por encima del tope de ${pesos(vacante.rango[1])}.`),
    ...candidatos
      .filter((c) => c.requisitos.includes('Por validar'))
      .map((c) => `${nombreCorto(c)} tiene requisitos por validar en la revisión.`),
  ]

  return (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Seleccionados de {vacante.titulo}</span> · {candidatos.length} en la comparación
        </>
      }
      contextIcon={GitCompareIcon}
      {...marco}
      placeholder="Pregunta sobre los seleccionados"
      onSend={(texto) => thread.ask(texto, respuestaComparar(texto, candidatos, vacante))}
      scrollKey={movidos.length || thread.msgs.length ? `${thread.scrollKey}-${movidos.length}` : undefined}
    >
      <UserBubble>Compara a {candidatos.map(nombreCorto).join(', ')}</UserBubble>
      <AgentNote className="mt-4">
        Las pongo lado a lado. Desliza la tabla para ver todas las columnas.
      </AgentNote>

      {!suficientes ? (
        <AgentCard className="mt-4">
          <Text as="p" size="sm">
            Marca entre 2 y 3 candidatos en el tablero para compararlos.
          </Text>
        </AgentCard>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterio</TableHead>
                  {candidatos.map((c) => (
                    <TableHead key={c.id}>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{c.iniciales}</AvatarFallback>
                        </Avatar>
                        {nombreCorto(c)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Text as="span" variant="muted" size="sm">
                      Etapa
                    </Text>
                  </TableCell>
                  {candidatos.map((c) => (
                    <TableCell key={c.id}>{NOMBRE_ETAPA[c.etapa]}</TableCell>
                  ))}
                </TableRow>
                {CRITERIOS.map((criterio) => {
                  const valores = candidatos.map((c) => criterio.valor(c, vacante))
                  const tope = Math.max(...valores.map((valor) => valor.puntaje))
                  const empate = valores.every((valor) => valor.puntaje === tope)
                  return (
                    <TableRow key={criterio.etiqueta}>
                      <TableCell>
                        <Text as="span" variant="muted" size="sm">
                          {criterio.etiqueta}
                        </Text>
                      </TableCell>
                      {valores.map((valor, indice) => (
                        <TableCell key={candidatos[indice].id}>
                          <div className="flex items-center gap-1.5">
                            <Text as="span" size="sm" weight={valor.puntaje === tope && !empate ? 'medium' : 'normal'}>
                              {valor.texto}
                            </Text>
                            {valor.puntaje === tope && !empate ? (
                              <Badge variant="secondary">
                                Mejor
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <AgentCard title="Recomendación" className="mt-4">
            <Text as="p" size="sm" weight="medium">
              {mejor.nombre}
            </Text>
            <Text as="p" size="sm" className="mt-1">
              Tiene el mejor ajuste con el cargo ({mejor.ajuste} % frente a {segundo.ajuste} % de {nombreCorto(segundo)}) y cumple{' '}
              {mejor.requisitos.filter((estado) => estado === 'Cumple').length} de {vacante.requisitos.length} requisitos.
            </Text>
            <AgentList
              className="mt-3"
              items={[
                `${nombreCorto(mejor)}: ${mejor.anios} años de experiencia${mejor.serena !== undefined ? ` y ${mejor.serena}/100 en Serena AI` : ''}.`,
                `${nombreCorto(segundo)} queda segundo; la diferencia es de ${mejor.ajuste - segundo.ajuste} puntos de ajuste.`,
              ]}
            />
            <div className="mt-4 rounded-xl bg-muted px-3.5 py-3">
              <Text as="div" variant="muted" size="xs" weight="medium" className="mb-2">
                Lo que no sé
              </Text>
              <AgentList
                items={
                  salvedades.length
                    ? salvedades
                    : ['No veo vacíos en la información, pero la recomendación no reemplaza la revisión del equipo.']
                }
              />
            </div>
          </AgentCard>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {movidos.length ? (
              <Button variant="outline" disabled>
                Ya están en Para revisión
              </Button>
            ) : antes.length ? (
              <Button onClick={() => onMoverRevision(antes.map((c) => c.id))}>
                Mover {plural(antes.length, `a ${nombreCorto(antes[0])}`, `a los ${antes.length}`)} a Para revisión
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Todos están en Para revisión o más adelante
              </Button>
            )}
            <Button variant="outline" onClick={() => notify('Comparación copiada', 'Lista para compartir con el líder del área', 'success')}>
              Copiar comparación
            </Button>
          </div>
          {movidos.length ? (
            <UndoRow className="mt-3" onUndo={onDeshacerMover}>
              {movidos.length} {plural(movidos.length, 'candidato pasó', 'candidatos pasaron')} a Para revisión
            </UndoRow>
          ) : null}
        </>
      )}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} thinkingLabel="Revisando a los seleccionados…" />
    </ContextPanel>
  )
}
