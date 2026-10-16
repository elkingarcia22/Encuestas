import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon, UserMultipleIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Frame,
  FramePanel,
  Heading,
  IconTile,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { COLLABORATOR_COUNT } from '../../../modelo/collaborators'
import { PARTICIPANT_MODE_COPY, formatCount, participantCountForMode, participantsGroupBreakdown, totalParticipantCount } from '../../../modelo/participants'
import type { ParticipantMode, ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { ParticipantesColaboradores } from './colaboradores'
import { ParticipantesEmpresa } from './empresa'
import { ParticipantesGrupos } from './grupos'
import { ParticipantesImportar } from './importar'

// COPIA de la versión del 28 sep 2026 (tarjetas «Toda la empresa / Una parte» y, dentro, pestañas Por grupos ·
// Por colaborador · Importar con IA), guardada antes de unificar grupos y colaboradores en una sola lista. No se
// usa en la pantalla.
//
// Paso 2 · Participantes: a quién se le pregunta. Va antes que el contenido a propósito: decidir a
// quién se le pregunta cambia qué vale la pena preguntar.
//
// Son dos decisiones distintas y se ven distintas. Primero, con dos tarjetas de selección: toda la
// empresa (va sola: ignora cualquier otra elección) o una parte. Después, solo si es una parte, las
// tres fuentes con que se arma —grupos, colaboradores elegidos a mano y un archivo—, que no se excluyen
// sino que se suman sin repetir a nadie; por eso van en pestañas, cada una con lo que aporta. Cada
// fuente guarda lo suyo aunque se cambie a toda la empresa y se vuelva. La versión anterior está en
// participantes-v1/.

type Fuente = Exclude<ParticipantMode, 'company'>
const FUENTES: Fuente[] = ['groups', 'individual', 'import']

const personas = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'persona' : 'personas'}`

export function PasoParticipantes({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const total = totalParticipantCount(seleccion)
  const todaLaEmpresa = seleccion.mode === 'company'
  // La pestaña que se abre al volver a «Una parte»: la última fuente que se usó.
  const [ultimaFuente, setUltimaFuente] = useState<Fuente>(todaLaEmpresa ? 'groups' : (seleccion.mode as Fuente))

  // Lo que sumaría «Una parte» con lo armado hasta ahora, aunque esté elegida toda la empresa.
  const conUnaParte: ParticipantsSelection = todaLaEmpresa ? { ...seleccion, mode: ultimaFuente } : seleccion
  const totalDeUnaParte = totalParticipantCount(conUnaParte)
  const { groups, outsideCount, importedCount } = participantsGroupBreakdown(conUnaParte)
  const aporte: Record<Fuente, number> = { groups: groups.length, individual: outsideCount, import: importedCount }

  const elegir = (valor: string) => onCambio({ mode: valor === 'company' ? 'company' : ultimaFuente })
  const abrirFuente = (fuente: Fuente) => {
    setUltimaFuente(fuente)
    onCambio({ mode: fuente })
  }

  // Lo que se conserva al pasar a toda la empresa, para decirlo debajo de las tarjetas.
  const guardado = [
    seleccion.selectedGroups.length ? `${seleccion.selectedGroups.length} ${seleccion.selectedGroups.length === 1 ? 'grupo' : 'grupos'}` : '',
    seleccion.selectedIds.length ? personas(seleccion.selectedIds.length) : '',
    seleccion.importedCount ? 'el archivo' : '',
  ].filter(Boolean)

  const desglose = [
    groups.length ? `${personas(participantCountForMode('groups', conUnaParte))} de ${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}` : '',
    outsideCount ? `${personas(outsideCount)} ${outsideCount === 1 ? 'elegida' : 'elegidas'} a mano` : '',
    importedCount ? `${personas(importedCount)} del archivo` : '',
  ].filter(Boolean)

  return (
    <Frame>
      <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <IconTile variant="soft" size="sm" className="text-primary">
              <HugeiconsIcon icon={UserMultipleIcon} aria-hidden="true" />
            </IconTile>
            <div className="flex flex-col gap-0.5">
              <Heading as="h2" level={5}>
                Participantes
              </Heading>
              <Text as="p" variant="muted" size="sm">
                Elige quién recibirá la encuesta.
              </Text>
            </div>
          </div>
          <Badge variant="secondary" size="lg" className="tabular-nums">
            {formatCount(total)} {total === 1 ? 'participante' : 'participantes'}
          </Badge>
        </div>
        <Separator />

        <div className="flex flex-col gap-6 px-5 py-5">
          <RadioGroup value={todaLaEmpresa ? 'company' : 'parte'} onValueChange={(valor) => elegir(valor as string)} className="grid gap-3 sm:grid-cols-2">
            <TarjetaEleccion
              valor="company"
              icono={Building03Icon}
              titulo="Toda la empresa"
              descripcion="Todos los colaboradores que tengas hoy en la plataforma."
              cuantas={personas(COLLABORATOR_COUNT)}
            />
            <TarjetaEleccion
              valor="parte"
              icono={UserMultipleIcon}
              titulo="Una parte de la empresa"
              descripcion="Arma la lista con grupos, colaboradores o un archivo. Se suman sin repetir a nadie."
              cuantas={totalDeUnaParte > 0 ? personas(totalDeUnaParte) : 'Sin elegir'}
            />
          </RadioGroup>

          {todaLaEmpresa ? (
            <>
              {guardado.length ? (
                <Text as="p" size="sm" variant="muted">
                  Lo que armaste en «Una parte» ({guardado.join(', ')}) se conserva por si vuelves, pero no cuenta mientras esté elegida toda la empresa.
                </Text>
              ) : null}
              <ParticipantesEmpresa seleccion={seleccion} onCambio={onCambio} />
            </>
          ) : (
            <Tabs value={seleccion.mode} onValueChange={(valor) => abrirFuente(valor as Fuente)} className="gap-4">
              <div className="flex flex-col gap-2">
                <TabsList variant="line" aria-label="Con qué se arma la lista">
                  {FUENTES.map((fuente) => (
                    <TabsTrigger key={fuente} value={fuente} className="flex-none gap-1.5">
                      {PARTICIPANT_MODE_COPY[fuente].title}
                      {aporte[fuente] > 0 ? <span className="tabular-nums">({formatCount(aporte[fuente])})</span> : null}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {/* Cómo se suman las tres: cada una cuenta lo suyo y el total no repite a nadie. */}
                <Text as="p" size="sm" variant="muted" aria-live="polite">
                  {totalDeUnaParte === 0
                    ? 'Todavía no hay nadie: elige grupos, marca colaboradores o sube un archivo. Se suman entre sí.'
                    : `Suman ${personas(totalDeUnaParte)}: ${desglose.join(', ')}${desglose.length > 1 ? ', sin repetir a nadie' : ''}.`}
                </Text>
              </div>
              <TabsContent value="groups">
                <ParticipantesGrupos seleccion={seleccion} onCambio={onCambio} />
              </TabsContent>
              <TabsContent value="individual">
                <ParticipantesColaboradores seleccion={seleccion} onCambio={onCambio} />
              </TabsContent>
              <TabsContent value="import">
                <ParticipantesImportar seleccion={seleccion} onCambio={onCambio} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </FramePanel>
    </Frame>
  )
}

function TarjetaEleccion({
  valor,
  icono,
  titulo,
  descripcion,
  cuantas,
}: {
  valor: string
  icono: typeof Building03Icon
  titulo: string
  descripcion: string
  cuantas: string
}) {
  const id = `participantes-${valor}`
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal" className="items-start!">
        <FieldContent>
          <div className="flex items-center gap-2">
            <IconTile variant="soft" size="xs" className="text-primary">
              <HugeiconsIcon icon={icono} aria-hidden="true" />
            </IconTile>
            <FieldTitle>{titulo}</FieldTitle>
          </div>
          <FieldDescription>{descripcion}</FieldDescription>
          <FieldDescription className="tabular-nums">{cuantas}</FieldDescription>
        </FieldContent>
        <RadioGroupItem value={valor} id={id} />
      </Field>
    </FieldLabel>
  )
}
