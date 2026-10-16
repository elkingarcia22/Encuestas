import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  BrainIcon,
  BubbleChatIcon,
  CheckmarkCircle02Icon,
  Download04Icon,
  Mic01Icon,
  NoteAddIcon,
  SecurityCheckIcon,
  TheaterIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { FilaCifras } from '@/modules/admin/inicio/components/bloques'
import { fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import { NOMBRE_ETAPA, type Candidato, type EtapaId, type Nota, type Vacante } from '../../components/data'
import {
  BADGE_EVALUACION,
  TITULO_EVALUACION,
  evaluacionCV,
  psicometricaDe,
  puntajePonderado,
  resumenEvaluacion,
  roleplayDe,
  serenaDe,
  type CriterioPuntaje,
  type EtapaEvaluada,
  type EstadoEvaluacion,
} from './expediente-data'
import { ListaNotas } from './notas'
import { Marco, Rotulo, SinResultado, type Destacado } from './piezas'
import { DrawerTranscripcion } from './transcripcion'

// Las cuatro pestañas de evaluación. Cada una es una pila de Frame: arriba el resultado (cifras y desglose),
// debajo lo que explica el resultado y al final las notas del equipo. Lo profundo (transcripción) va en panel.

type Props = { candidato: Candidato; vacante: Vacante }

function EstadoBadge({ estado }: { estado: EstadoEvaluacion }) {
  return <Badge variant={BADGE_EVALUACION[estado].variant}>{BADGE_EVALUACION[estado].texto}</Badge>
}

const resultado = (puntaje: number, minimo: number) =>
  puntaje >= minimo
    ? { etiqueta: 'Resultado', valor: 'Aprobó', detalle: `${puntaje - minimo} ${plural(puntaje - minimo, 'punto', 'puntos')} sobre el mínimo` }
    : { etiqueta: 'Resultado', valor: 'No alcanza', detalle: `le ${plural(minimo - puntaje, 'falta 1 punto', `faltan ${minimo - puntaje} puntos`)}` }

// Lo que se ve mientras el candidato no presenta la evaluación.
function Pendiente({ etapa, icono, candidato, vacante, texto }: Props & { etapa: EtapaEvaluada; icono: typeof BrainIcon; texto: string }) {
  const { estado } = resumenEvaluacion(etapa, candidato, vacante)
  const nombre = candidato.nombre.split(' ')[0]
  return (
    <Marco ia titulo={TITULO_EVALUACION[etapa]} accion={<EstadoBadge estado={estado} />}>
      <FramePanel>
        <SinResultado
          icono={icono}
          titulo={estado === 'en-curso' ? `${nombre} todavía no presenta esta etapa` : `${nombre} aún no llega a ${NOMBRE_ETAPA[etapa]}`}
          texto={`Hoy está en ${NOMBRE_ETAPA[candidato.etapa]}. ${texto}`}
        />
      </FramePanel>
    </Marco>
  )
}

// Criterios con su barra, en dos columnas cuando hay ancho: el mismo trazo en CV, Serena y Roleplay.
function Criterios({ criterios, valor }: { criterios: CriterioPuntaje[]; valor: (criterio: CriterioPuntaje) => string }) {
  return (
    <div className="grid gap-x-8 gap-y-4 @xl/main:grid-cols-2">
      {criterios.map((criterio) => (
        <div key={criterio.nombre} className="flex flex-col gap-1.5">
          <Progress value={criterio.puntaje}>
            <ProgressLabel>{criterio.nombre}</ProgressLabel>
            <ProgressValue className="ms-auto">{() => valor(criterio)}</ProgressValue>
          </Progress>
          <Text as="span" variant="muted" size="xs">
            {criterio.detalle}
          </Text>
        </div>
      ))}
    </div>
  )
}

function Lista({ items }: { items: string[] }) {
  return (
    <Text as="ul" size="sm" className="ml-5 flex list-disc flex-col gap-1.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Text>
  )
}

function BotonTranscripcion({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <HugeiconsIcon icon={BubbleChatIcon} />
      Ver transcripción
    </Button>
  )
}

// Notas de una etapa, al pie de su resultado.
function NotasDeEtapa({
  etapa,
  titulo,
  boton,
  notas,
  onComentar,
}: {
  etapa: EtapaId
  titulo: string
  boton: string
  notas: Nota[]
  onComentar: (etapa: EtapaId) => void
}) {
  const propias = notas.filter((nota) => nota.etapa === etapa)
  return (
    <Marco
      titulo={titulo}
      descripcion="Solo las ve el equipo de selección."
      accion={
        <Button variant="outline" size="sm" onClick={() => onComentar(etapa)}>
          <HugeiconsIcon icon={NoteAddIcon} />
          {boton}
        </Button>
      }
    >
      <FramePanel>
        <ListaNotas notas={propias} vacia="Nadie ha comentado esta etapa todavía." />
      </FramePanel>
    </Marco>
  )
}

/* Punto 3 · Evaluación CV con IA ------------------------------------------------------------------- */

export function PestanaCV({ candidato, vacante }: Props) {
  const cv = evaluacionCV(candidato, vacante)

  return (
    <div className="flex flex-col gap-4">
      <Marco
        titulo="Compatibilidad de la hoja de vida"
        descripcion={`La IA lee la hoja de vida contra los requisitos de ${vacante.titulo}.`}
        accion={<EstadoBadge estado={cv.pasa ? 'aprobo' : 'no-alcanza'} />}
      >
        <FramePanel>
          <FilaCifras
            columnas="grid-cols-2 lg:grid-cols-4"
            cifras={[
              { etiqueta: 'Match', valor: `${cv.match}%`, detalle: 'con los requisitos' },
              { etiqueta: 'Confianza', valor: cv.confianza, detalle: cv.motivoConfianza },
              { etiqueta: 'Umbral mínimo', valor: `${cv.umbral}%`, detalle: 'de la etapa' },
              resultado(cv.match, cv.umbral),
            ]}
          />
        </FramePanel>
        <FramePanel className="flex flex-col gap-4">
          <Rotulo>Desglose por requisito · cada uno pesa lo mismo y lo que no aparece en la hoja de vida no suma</Rotulo>
          <Criterios
            criterios={cv.criterios.map((c) => ({ nombre: c.nombre, detalle: c.evidencia, peso: c.peso, puntaje: c.puntaje ?? 0 }))}
            valor={(c) => (c.puntaje === 0 ? 'Sin evidencia' : `${c.puntaje} · pesa ${c.peso}%`)}
          />
        </FramePanel>
      </Marco>

      <Marco titulo="Filtros de la etapa" descripcion="Los tres que se configuran en la vacante.">
        <FramePanel className="grid gap-4 @xl/main:grid-cols-3">
          {cv.filtros.map((filtro) => (
            <div key={filtro.nombre} className="flex items-start gap-2">
              <HugeiconsIcon
                icon={filtro.cumple ? CheckmarkCircle02Icon : Alert02Icon}
                size={16}
                className={filtro.cumple ? 'mt-0.5 shrink-0 text-success' : 'mt-0.5 shrink-0 text-warning'}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <Text as="span" size="sm" weight="medium">
                  {filtro.nombre}
                  <span className="sr-only">{filtro.cumple ? ': cumple' : ': no cumple'}</span>
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {filtro.detalle}
                </Text>
              </div>
            </div>
          ))}
        </FramePanel>
      </Marco>
    </div>
  )
}

/* Punto 4 · Evaluación psicométrica --------------------------------------------------------------- */

export function PestanaPsicometrica({ candidato, vacante }: Props) {
  const psico = psicometricaDe(candidato)
  if (!psico) {
    return (
      <Pendiente
        etapa="psicometricas"
        icono={BrainIcon}
        candidato={candidato}
        vacante={vacante}
        texto="Cuando responda las pruebas, aquí verás los factores que destaca la IA y el informe completo."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Marco
        titulo="Pruebas psicométricas"
        descripcion={`${psico.pruebas.length} pruebas · ${psico.minutos} min · presentadas el ${fechaSinAnio(psico.fecha)}`}
        accion={
          <Button variant="outline" size="sm" onClick={() => notify('Descargando informe', psico.informe)}>
            <HugeiconsIcon icon={Download04Icon} />
            Descargar informe
          </Button>
        }
      >
        <FramePanel className="flex flex-col gap-4">
          <Rotulo>Percentil frente a quienes presentaron las mismas pruebas</Rotulo>
          <Criterios
            criterios={psico.pruebas.map((p) => ({ nombre: p.prueba, detalle: p.lectura, peso: 0, puntaje: p.percentil }))}
            valor={(c) => `${psico.pruebas.find((p) => p.prueba === c.nombre)?.nivel} · percentil ${c.puntaje}`}
          />
        </FramePanel>
      </Marco>

      <Marco ia titulo="Factores destacados" descripcion="Lectura de la IA sobre personalidad y conducta. Apoya la decisión; no es un diagnóstico.">
        <FramePanel>
          <ItemGroup className="grid gap-2 @xl/main:grid-cols-2">
            {psico.factores.map((factor) => (
              <Item key={factor.titulo} variant="outline" size="sm" className="items-start">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={factor.tipo === 'fortaleza' ? CheckmarkCircle02Icon : Alert02Icon} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="flex-wrap">
                    {factor.titulo}
                    <Badge variant={factor.tipo === 'fortaleza' ? 'success-outline' : 'warning-outline'}>
                      {factor.tipo === 'fortaleza' ? 'A favor' : 'Para revisar'}
                    </Badge>
                  </ItemTitle>
                  <ItemDescription>{factor.texto}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </FramePanel>
      </Marco>
    </div>
  )
}

/* Punto 5 · Evaluación Serena AI ------------------------------------------------------------------ */

type ConNotas = Props & { notas: Nota[]; destacado: Destacado; onComentar: (etapa: EtapaId) => void }

export function PestanaSerena({ candidato, vacante, notas, destacado, onComentar }: ConNotas) {
  const [transcripcion, setTranscripcion] = useState(false)
  const serena = serenaDe(candidato, vacante)
  if (!serena) {
    return (
      <Pendiente
        etapa="serena"
        icono={Mic01Icon}
        candidato={candidato}
        vacante={vacante}
        texto="Cuando complete la entrevista, aquí verás su puntaje por pregunta, el feedback y la transcripción."
      />
    )
  }

  const cuando = `${serena.canal} · ${serena.duracion} min · ${fechaSinAnio(serena.fecha)}`

  return (
    <div className="flex flex-col gap-4">
      <Marco
        id="exp-serena"
        destacado={destacado}
        ia
        titulo="Entrevista con Serena AI"
        descripcion={cuando}
        accion={<BotonTranscripcion onClick={() => setTranscripcion(true)} />}
      >
        <FramePanel>
          <FilaCifras
            columnas="grid-cols-3"
            cifras={[
              { etiqueta: 'Puntaje general', valor: `${serena.puntaje}/100`, detalle: `aprueba con ${serena.minimo}` },
              resultado(serena.puntaje, serena.minimo),
              { etiqueta: 'Preguntas', valor: String(serena.criterios.length), detalle: 'todas respondidas' },
            ]}
          />
        </FramePanel>
        <FramePanel className="flex flex-col gap-4">
          <Rotulo>Puntaje por pregunta</Rotulo>
          <Criterios criterios={serena.criterios} valor={(c) => `${c.puntaje}/100`} />
        </FramePanel>
      </Marco>

      <Marco ia titulo="Feedback consolidado" descripcion={serena.feedback.resumen}>
        <FramePanel className="grid gap-5 @xl/main:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Rotulo>A favor</Rotulo>
            <Lista items={serena.feedback.fortalezas} />
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Por mejorar</Rotulo>
            <Lista items={serena.feedback.mejorar} />
          </div>
        </FramePanel>
      </Marco>

      <NotasDeEtapa etapa="serena" titulo="Observaciones" boton="Agregar observación" notas={notas} onComentar={onComentar} />

      <DrawerTranscripcion
        open={transcripcion}
        onOpenChange={setTranscripcion}
        kicker="Entrevista con Serena AI"
        descripcion={cuando}
        agente="Serena"
        candidato={candidato.nombre}
        turnos={serena.transcripcion}
      />
    </div>
  )
}

/* Punto 6 · Evaluación Roleplay › Consultar resultados --------------------------------------------- */

export function PestanaRoleplay({ candidato, vacante, notas, destacado, onComentar }: ConNotas) {
  const [transcripcion, setTranscripcion] = useState(false)
  const roleplay = roleplayDe(candidato)
  if (!roleplay) {
    return (
      <Pendiente
        etapa="roleplay"
        icono={TheaterIcon}
        candidato={candidato}
        vacante={vacante}
        texto="Cuando complete la simulación, aquí verás su puntaje ponderado, el control de trampas y la transcripción."
      />
    )
  }

  const puntaje = puntajePonderado(roleplay.criterios)
  const cuando = `Intento ${roleplay.intento} · ${roleplay.duracion} min · ${fechaSinAnio(roleplay.fecha)}`

  return (
    <div className="flex flex-col gap-4">
      <Marco
        id="exp-roleplay"
        destacado={destacado}
        ia
        titulo={`Roleplay AI con ${roleplay.agente}`}
        descripcion={roleplay.escenario}
        accion={<BotonTranscripcion onClick={() => setTranscripcion(true)} />}
      >
        <FramePanel>
          <FilaCifras
            columnas="grid-cols-3"
            cifras={[
              { etiqueta: 'Puntaje general', valor: `${puntaje}/100`, detalle: `aprueba con ${roleplay.minimo}` },
              resultado(puntaje, roleplay.minimo),
              { etiqueta: 'Intento', valor: String(roleplay.intento), detalle: `${roleplay.duracion} min · ${fechaSinAnio(roleplay.fecha)}` },
            ]}
          />
        </FramePanel>
        <FramePanel className="flex flex-col gap-4">
          <Rotulo>Desglose ponderado · cada criterio pesa lo que se configuró en la vacante</Rotulo>
          <Criterios criterios={roleplay.criterios} valor={(c) => `${c.puntaje} · pesa ${c.peso}%`} />
        </FramePanel>
      </Marco>

      <div className="grid items-start gap-4 @xl/main:grid-cols-2">
        <Marco ia titulo="Control de integridad" descripcion="Intentos de trampa o de prompt injection en la conversación.">
          <FramePanel className="flex flex-col gap-3">
            {roleplay.alertas.length ? (
              roleplay.alertas.map((alerta) => (
                <Alert key={alerta.momento} variant="warning">
                  <HugeiconsIcon icon={Alert02Icon} size={18} />
                  <AlertTitle>
                    {alerta.tipo} en el minuto {alerta.momento}
                  </AlertTitle>
                  <AlertDescription>
                    <p>{alerta.detalle}</p>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <div className="flex items-start gap-2">
                <HugeiconsIcon icon={SecurityCheckIcon} size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <Text as="span" size="sm" weight="medium">
                    Sin intentos de trampa ni de prompt injection
                  </Text>
                  <Text as="span" variant="muted" size="xs">
                    El control automático revisó toda la conversación.
                  </Text>
                </div>
              </div>
            )}
          </FramePanel>
        </Marco>

        <Marco ia titulo="Fortalezas y habilidades" descripcion="Lo que mostró en la simulación.">
          <FramePanel className="flex flex-col gap-4">
            <Lista items={roleplay.fortalezas} />
            <div className="flex flex-wrap gap-1.5">
              {roleplay.habilidades.map((habilidad) => (
                <Badge key={habilidad.nombre} variant="secondary">
                  {habilidad.nombre} · {habilidad.nivel.toLowerCase()}
                </Badge>
              ))}
            </div>
          </FramePanel>
        </Marco>
      </div>

      <NotasDeEtapa etapa="roleplay" titulo="Notas de evaluadores" boton="Agregar comentario" notas={notas} onComentar={onComentar} />

      <DrawerTranscripcion
        open={transcripcion}
        onOpenChange={setTranscripcion}
        kicker={`Roleplay AI · ${roleplay.agente}`}
        descripcion={cuando}
        agente={roleplay.agente.split(',')[0]}
        candidato={candidato.nombre}
        turnos={roleplay.transcripcion}
      />
    </div>
  )
}
