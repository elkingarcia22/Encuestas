import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Clock01Icon } from '@hugeicons/core-free-icons'
import { Frame, FrameHeader, FramePanel, FrameTitle, Heading, Separator, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import type { DatosAsistencia, SesionAsistencia } from '../borrador'
import { textoPlano } from '../borrador'
import { diaDeSesion, horarioDeSesion, nombrePorDefecto } from './sesiones'

// Asistencia montada en Recursos, de solo lectura: las instrucciones, quién confirma la asistencia y la lista de
// sesiones. Los botones («Editar») los pone el bloque de recursos.
//
// Cada sesión es una **tarjeta con su fecha en bloque a la izquierda**, como la tarjeta de evento de la zona de
// estudio: el día y el mes grandes son lo que se busca al mirar una lista de sesiones, y antes eran una línea de
// texto gris igual a todas las demás (Dave, 2-oct).

export function VistaAsistencia({ datos, titulo }: { datos: DatosAsistencia; titulo?: string }) {
  const conInstrucciones = Boolean(textoPlano(datos.instrucciones))

  return (
    <Frame>
      {/* El título de la página, como en los demás recursos de la vista del colaborador. En el editor no se pasa:
          allí la página ya se nombra en el campo de arriba (Dave, 9-oct). */}
      {titulo ? (
        <FrameHeader>
          <FrameTitle>{titulo}</FrameTitle>
        </FrameHeader>
      ) : null}
      <FramePanel className="flex flex-col gap-5">
        {conInstrucciones ? (
          <>
            <section className="flex flex-col gap-2">
              <Heading as="h3" level={6}>
                Instrucciones
              </Heading>
              {/* HTML del editor de texto del propio asistente. */}
              <Text
                as="div"
                size="sm"
                className="[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: datos.instrucciones }}
              />
            </section>
            <Separator />
          </>
        ) : null}

        {/* Quién puede marcar la asistencia. Va como una fila de ficha —término a un lado, valor al otro— y no como
            una tarjeta con icono: no es un estado del recurso, es un dato suyo, y además la tarjeta nombraba una sola
            vía cuando el creador siempre conserva la suya (Dave, 2-oct). */}
        <div className="flex items-baseline justify-between gap-3">
          <Text as="span" size="sm" variant="muted" className="shrink-0">
            Quién marca la asistencia
          </Text>
          <Text as="span" size="sm" className="min-w-0 text-right">
            {datos.autoasistencia ? 'Tú y los participantes' : 'Solo tú, desde Resultados'}
          </Text>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Heading as="h3" level={6}>
              Sesiones
            </Heading>
            {datos.sesiones.length ? (
              <Badge variant="secondary" size="xs" className="font-normal">
                {datos.sesiones.length}
              </Badge>
            ) : null}
          </div>
          {datos.sesiones.length ? (
            <ul className="flex flex-col gap-2">
              {datos.sesiones.map((s, i) => (
                <li key={s.id}>
                  <TarjetaDeSesion sesion={s} indice={i} />
                </li>
              ))}
            </ul>
          ) : (
            <Text as="p" size="sm" variant="muted">
              Sin sesiones
            </Text>
          )}
        </section>
      </FramePanel>
    </Frame>
  )
}

/** Una sesión: la fecha en bloque a la izquierda y, al lado, su nombre, su horario y su descripción. */
function TarjetaDeSesion({ sesion, indice }: { sesion: SesionAsistencia; indice: number }) {
  const { dia, mes } = diaDeSesion(sesion)
  const descripcion = sesion.descripcion.trim()

  return (
    <Frame spacing="sm">
      <FramePanel className="flex items-start gap-3">
        {/* El día y el mes, del tamaño de un dato que se busca. Sin fecha válida todavía, el bloque dice que falta
            en vez de enseñar un hueco. */}
        <div className="flex min-w-13 shrink-0 flex-col items-center rounded-lg border bg-muted px-2 py-1.5">
          {dia ? (
            <>
              <Text as="span" size="lg" weight="semibold" className="leading-tight tabular-nums">
                {dia}
              </Text>
              <Text as="span" size="xs" variant="muted">
                {mes}
              </Text>
            </>
          ) : (
            <HugeiconsIcon icon={Calendar03Icon} size={18} className="my-1.5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="p" size="sm" weight="medium" className="break-words">
            {sesion.nombre.trim() || nombrePorDefecto(indice)}
          </Text>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={14} aria-hidden="true" className="shrink-0" />
            <span className="tabular-nums">{horarioDeSesion(sesion)}</span>
          </span>
          {descripcion ? (
            <Text as="p" size="sm" variant="muted" className="whitespace-pre-line">
              {descripcion}
            </Text>
          ) : null}
        </div>
      </FramePanel>
    </Frame>
  )
}
