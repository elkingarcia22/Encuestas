import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon, Cancel01Icon, File01Icon, UserMultipleIcon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
  Button,
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
  Text,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { COLLABORATOR_COUNT, COLLABORATORS } from '../../../modelo/collaborators'
import { formatCount, participantCountForMode, participantsGroupBreakdown, resolveImportedRows, totalParticipantCount } from '../../../modelo/participants'
import type { ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { ParticipantesDirectorio } from './directorio'
import { ParticipantesEmpresa } from './empresa'
import { ParticipantesImportar, VACIO_IMPORTACION } from './importar'

// COPIA de la versión del 28 sep 2026 (tarjetas «Toda la empresa / Una parte», grupos y personas en una sola
// lista desplegable, «Importar con IA» en panel lateral), guardada antes de pasar a tres tarjetas. No se usa.
//
// Paso 2 · Participantes: a quién se le pregunta. Va antes que el contenido a propósito: decidir a
// quién se le pregunta cambia qué vale la pena preguntar.
//
// Dos decisiones que se ven distintas. Primero, con dos tarjetas de selección: toda la empresa (va sola:
// ignora cualquier otra elección) o una parte. Si es una parte, una sola lista junta grupos y personas
// —se marca un grupo entero o se despliega para elegir sueltas— y un archivo puede sumar más gente desde
// «Importar con IA», que abre su propio panel. Todo se suma sin repetir a nadie, y se conserva aunque se
// pase a toda la empresa y se vuelva. Las versiones anteriores están en participantes-v1/ y participantes-v2/.

const personas = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'persona' : 'personas'}`

export function PasoParticipantes({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const [importando, setImportando] = useState(false)
  const total = totalParticipantCount(seleccion)
  const todaLaEmpresa = seleccion.mode === 'company'

  // Lo que suma «Una parte» con lo armado hasta ahora, aunque esté elegida toda la empresa.
  const conUnaParte: ParticipantsSelection = todaLaEmpresa ? { ...seleccion, mode: 'groups' } : seleccion
  const totalDeUnaParte = totalParticipantCount(conUnaParte)
  const { groups, outsideCount, importedCount } = participantsGroupBreakdown(conUnaParte)
  const conArchivo = seleccion.importedUsers.length > 0
  const nuevosDelArchivo = conArchivo ? resolveImportedRows(seleccion.importedUsers, COLLABORATORS).filter((fila) => fila.person === null).length : 0

  // Lo que se conserva al pasar a toda la empresa, para decirlo debajo de las tarjetas.
  const guardado = [
    seleccion.selectedGroups.length ? `${seleccion.selectedGroups.length} ${seleccion.selectedGroups.length === 1 ? 'grupo' : 'grupos'}` : '',
    seleccion.selectedIds.length ? personas(seleccion.selectedIds.length) : '',
    conArchivo ? 'el archivo' : '',
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
          <RadioGroup
            value={todaLaEmpresa ? 'company' : 'parte'}
            onValueChange={(valor) => onCambio({ mode: valor === 'company' ? 'company' : 'groups' })}
            className="grid gap-3 sm:grid-cols-2"
          >
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
              descripcion="Arma la lista con grupos, personas o un archivo. Se suman sin repetir a nadie."
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
            <div className="flex flex-col gap-4">
              {/* Cómo se suma todo: cada fuente cuenta lo suyo y el total no repite a nadie. */}
              <Text as="p" size="sm" variant="muted" aria-live="polite">
                {totalDeUnaParte === 0
                  ? 'Todavía no hay nadie: marca grupos o personas, o importa un archivo. Todo se suma.'
                  : `Suman ${personas(totalDeUnaParte)}: ${desglose.join(', ')}${desglose.length > 1 ? ', sin repetir a nadie' : ''}.`}
              </Text>

              {conArchivo ? (
                <Attachment state="done" className="w-full">
                  <AttachmentMedia>
                    <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{seleccion.importedFileName}</AttachmentTitle>
                    <AttachmentDescription>
                      {personas(seleccion.importedCount)} del archivo · {formatCount(nuevosDelArchivo)} {nuevosDelArchivo === 1 ? 'nueva' : 'nuevas'} en UBITS
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <Button variant="outline" size="sm" onClick={() => setImportando(true)}>
                      Ver
                    </Button>
                    <AttachmentAction aria-label="Quitar el archivo" onClick={() => onCambio(VACIO_IMPORTACION)}>
                      <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ) : null}

              <ParticipantesDirectorio
                seleccion={seleccion}
                onCambio={onCambio}
                accion={
                  <BotonIaSecundario className="shrink-0" onClick={() => setImportando(true)}>
                    Importar con IA
                  </BotonIaSecundario>
                }
              />
            </div>
          )}
        </div>
      </FramePanel>

      <DrawerShell
        open={importando}
        onOpenChange={setImportando}
        size="lg"
        ai
        title="Importar con IA"
        description="Sube la lista desde un archivo. Cruzamos cada fila con el directorio y las columnas de más quedan como datos demográficos."
        footer={
          <Button className="ml-auto" onClick={() => setImportando(false)}>
            Listo
          </Button>
        }
      >
        <ParticipantesImportar seleccion={seleccion} onCambio={onCambio} />
      </DrawerShell>
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
