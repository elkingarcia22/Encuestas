import { FILA_INTERRUPTOR } from '@/shared/components/estilos-propios'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, FileQuestionMarkIcon, ShieldUserIcon, Target02Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Switch,
  Text,
  cn,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { plural } from '@/modules/design-system/patrones/formato'
import { MINUTOS_POR_COMPETENCIA, PREGUNTAS_POR_COMPETENCIA, type PruebaCompetencia } from './banco'

// Paso 2 · Qué se mide. Las competencias salen del plan y sus pruebas vienen armadas del banco de UBITS: no se editan,
// se conocen. En producción esto era una lista muda con «Preguntas por competencia: 12»; aquí cada competencia dice qué
// tipo de habilidad es, cuántas preguntas trae y cuánto toma, y el total dice cuánto tiempo le va a pedir a cada persona.
// El detalle abre en un modal: qué mide, para quién es y el aval de la prueba. **Sin vista previa de preguntas**:
// se quitó el 30-sep-2026 porque enseñaba una sola de las 12 y no ayudaba a decidir nada (acuerdo con producto).

type Props = {
  competencias: PruebaCompetencia[]
  nombrePlan: string
  resultadosVisibles: boolean
  onResultados: (visibles: boolean) => void
}

export function PasoCompetencias({ competencias, nombrePlan, resultadosVisibles, onResultados }: Props) {
  const [abierta, setAbierta] = useState<PruebaCompetencia | null>(null)
  const n = competencias.length
  const preguntas = n * PREGUNTAS_POR_COMPETENCIA
  const minutos = n * MINUTOS_POR_COMPETENCIA

  return (
    <div className="flex flex-col gap-6">
      <Frame>
        <FrameHeader>
          <FrameTitle>Qué se va a medir</FrameTitle>
          <FrameDescription>{`Las ${plural(n, 'competencia', 'competencias')} de «${nombrePlan}». Cada una tiene su prueba del banco de UBITS.`}</FrameDescription>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Dato icono={Target02Icon} valor={`${n.toLocaleString('es-CO')} ${plural(n, 'competencia', 'competencias')}`} />
            <Dato icono={FileQuestionMarkIcon} valor={`${preguntas.toLocaleString('es-CO')} preguntas en total`} />
            <Dato icono={Clock01Icon} valor={`Unos ${minutos.toLocaleString('es-CO')} min por persona`} />
          </div>

          <div className="flex flex-col gap-2">
            {competencias.map((c) => (
              <Item key={c.nombre} variant="outline" size="sm">
                <ItemMedia variant="image">
                  <img src={c.imagen} alt="" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{c.nombre}</ItemTitle>
                  <ItemDescription>
                    {c.tipo} · {PREGUNTAS_POR_COMPETENCIA} preguntas · {MINUTOS_POR_COMPETENCIA} min
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="sm" onClick={() => setAbierta(c)}>
                    Ver detalle
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </div>

          {/* El aval vive aquí y solo aquí: estaba repetido dentro del modal de cada competencia, diciendo media cosa
              en cada sitio. Este texto junta los dos. */}
          <Alert variant="info">
            <HugeiconsIcon icon={ShieldUserIcon} aria-hidden="true" />
            <AlertTitle>Pruebas validadas, no se editan</AlertTitle>
            <AlertDescription>
              <p>
                Cada prueba la desarrolló un equipo de psicómetras y expertos en la competencia, con un marco técnico y conceptual. UBITS sigue
                estándares internacionales para crear, validar, aplicar y calificar cada pregunta. Son las mismas en el assessment inicial y en el
                de seguimiento: así la comparación es justa.
              </p>
            </AlertDescription>
          </Alert>
        </FramePanel>
      </Frame>

      <Frame>
        <FrameHeader>
          <FrameTitle>Resultados</FrameTitle>
          <FrameDescription>Elige si los colaboradores podrán ver sus resultados.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <FieldLabel htmlFor="as-resultados" className={cn('bg-card', FILA_INTERRUPTOR)}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Mostrar el resultado a los colaboradores</FieldTitle>
                <FieldDescription>
                  {resultadosVisibles
                    ? 'Al terminar verán cuántas acertaron y su nivel: Bajo, Medio o Alto.'
                    : 'Al terminar solo verán que la completaron.'}
                </FieldDescription>
              </FieldContent>
              <Switch id="as-resultados" checked={resultadosVisibles} onCheckedChange={onResultados} />
            </Field>
          </FieldLabel>
        </FramePanel>
      </Frame>

      <DetalleCompetencia competencia={abierta} onCerrar={() => setAbierta(null)} />
    </div>
  )
}

function Dato({ icono, valor }: { icono: typeof Clock01Icon; valor: string }) {
  return (
    <Item variant="muted" size="sm">
      <ItemMedia variant="icon">
        <HugeiconsIcon icon={icono} aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{valor}</ItemTitle>
      </ItemContent>
    </Item>
  )
}

/** La prueba de una competencia: qué mide, a quién va y una pregunta de ejemplo tal como la verá el colaborador. */
function DetalleCompetencia({ competencia, onCerrar }: { competencia: PruebaCompetencia | null; onCerrar: () => void }) {

  return (
    // En la ventana única del sistema (ActionDialog, decisión 4 de la auditoría, 5-oct); antes era ConfiguredModal.
    <ActionDialog
      open={Boolean(competencia)}
      onOpenChange={(abierto) => {
        if (abierto) return
        onCerrar()
      }}
      // Título fijo, no el nombre de la competencia: desarrollo prefiere un título que no cambie con el contenido
      // (Carlos, 1-oct). El nombre no se pierde, baja a la primera línea del cuerpo, que es donde está todo lo que
      // sí depende de la competencia abierta.
      title="Detalle de la prueba de esta competencia"
      // De qué competencia estamos hablando y cuánto pesa su prueba, un escalón por debajo del título de la ventana:
      // si fuera igual de grande competirían, y el nombre no es el tema de la ventana, es de qué registro habla (Dave, 1-oct).
      lead={
        competencia ? (
          <>
            <Heading as="h3" level={6}>
              {competencia.nombre}
            </Heading>
            <Text size="sm" variant="muted">
              {competencia.tipo} · {PREGUNTAS_POR_COMPETENCIA} preguntas · {MINUTOS_POR_COMPETENCIA} minutos
            </Text>
          </>
        ) : null
      }
      // «Entendido» y en primario: el modal solo informa, no hay nada que decidir ni nada que se pueda deshacer, así
      // que su único botón es el que cierra y conviene que se vea (Dave, 1-oct).
      footer={<Button onClick={onCerrar}>Entendido</Button>}
    >
      {competencia ? (
            <div className="flex flex-col gap-5">
              <Bloque titulo="Qué mide">{competencia.mide}</Bloque>
              <Bloque titulo="Qué encontrará el colaborador">{competencia.encontraras}</Bloque>
              {/* Sin tarjeta de tiempo: ya está bajo el título del modal. Y sin aval: vive una sola vez, fuera.
                  «Para quién es» va como aviso informativo y no como una fila más: no es otro dato de la prueba, es la
                  advertencia de a quién le va a llegar, y en gris se perdía entre los dos bloques de arriba (Dave, 1-oct). */}
              <Alert variant="info">
                <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
                <AlertTitle>Para quién es</AlertTitle>
                <AlertDescription>{competencia.poblacion}</AlertDescription>
              </Alert>
            </div>
      ) : null}
    </ActionDialog>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Heading as="h3" level={6}>
        {titulo}
      </Heading>
      <Text size="sm" variant="muted">
        {children}
      </Text>
    </div>
  )
}
