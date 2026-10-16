import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserMultipleIcon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Field,
  FieldLabel,
  Frame,
  FramePanel,
  Heading,
  IconTile,
  Separator,
  Switch,
  Text,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { COLLABORATOR_COUNT } from '../../../modelo/collaborators'
import { formatCount, participantCountForMode, participantsGroupBreakdown, segmentCounts, totalParticipantCount } from '../../../modelo/participants'
import type { ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { ListaDeGrupos, ListaDePersonas } from './directorio'
import { ParticipantesImportar } from './importar'

// COPIA de la versión del 28 sep 2026 (patrón de Datos demográficos: interruptor «Enviar a toda la empresa» y
// secciones desplegables en un solo contenedor), guardada antes de separar en tres contenedores. No se usa.
//
// Paso 2 · Participantes: a quién se le pregunta. Va antes que el contenido a propósito: decidir a
// quién se le pregunta cambia qué vale la pena preguntar.
//
// Mismo patrón que «Datos demográficos»: un interruptor en la cabecera, secciones desplegables con su
// conteo y, al pie, el resumen con la acción. El interruptor es «Enviar a toda la empresa»: va sola y
// no pide nada más. Apagado, se arma la lista combinando grupos enteros, personas una a una y un archivo
// importado con IA; todo se suma sin repetir a nadie y se conserva aunque se vuelva a toda la empresa.
// Las versiones anteriores están en participantes-v1/ a -v4/.

type Seccion = 'grupos' | 'personas' | 'archivo'

const personas = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'persona' : 'personas'}`

function Cabecera({ titulo, detalle, conteo }: { titulo: string; detalle: string; conteo: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pe-2 text-left">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Text as="span" size="sm" weight="semibold">
          {titulo}
        </Text>
        <Text as="span" size="xs" variant="muted" weight="normal">
          {detalle}
        </Text>
      </div>
      <Badge variant="outline" size="sm" className="shrink-0 tabular-nums">
        {conteo}
      </Badge>
    </div>
  )
}

export function PasoParticipantes({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const todaLaEmpresa = seleccion.mode === 'company'
  const total = totalParticipantCount(seleccion)
  const [importando, setImportando] = useState(false)
  const [abiertas, setAbiertas] = useState<Seccion[]>(() => {
    const conDatos: Seccion[] = [
      ...(seleccion.selectedGroups.length ? (['grupos'] as const) : []),
      ...(seleccion.selectedIds.length ? (['personas'] as const) : []),
    ]
    return conDatos.length ? conDatos : ['grupos']
  })

  // Lo que suman grupos, personas y archivo, aunque esté elegida toda la empresa (se conserva por si se vuelve).
  const sinEmpresa: ParticipantsSelection = todaLaEmpresa ? { ...seleccion, mode: 'groups' } : seleccion
  const { groups, outsideCount, importedCount } = participantsGroupBreakdown(sinEmpresa)
  const personasDeGrupos = participantCountForMode('groups', sinEmpresa)
  const totalSinEmpresa = totalParticipantCount(sinEmpresa)
  const conArchivo = seleccion.importedUsers.length > 0
  const gruposPosibles = segmentCounts(seleccion.groupSegmentBy).size

  const desglose = [
    groups.length ? `${personas(personasDeGrupos)} de ${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}` : '',
    outsideCount ? `${personas(outsideCount)} ${outsideCount === 1 ? 'elegida' : 'elegidas'} una a una` : '',
    importedCount ? `${personas(importedCount)} del archivo` : '',
  ].filter(Boolean)

  const guardado = [
    groups.length ? `${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}` : '',
    outsideCount ? personas(outsideCount) : '',
    conArchivo ? 'el archivo' : '',
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
          <div className="flex items-center gap-3">
            <Badge variant="secondary" size="lg" className="tabular-nums">
              {formatCount(total)} {total === 1 ? 'participante' : 'participantes'}
            </Badge>
            <Field orientation="horizontal" className="w-auto!">
              <FieldLabel htmlFor="toda-la-empresa">Enviar a toda la empresa</FieldLabel>
              <Switch id="toda-la-empresa" checked={todaLaEmpresa} onCheckedChange={(activo) => onCambio({ mode: activo ? 'company' : 'groups' })} />
            </Field>
          </div>
        </div>
        <Separator />

        <div className="flex flex-col gap-4 px-5 py-5">
          {todaLaEmpresa ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyTitle>La encuesta llegará a toda la empresa</EmptyTitle>
                <EmptyDescription>
                  {`Las ${formatCount(COLLABORATOR_COUNT)} personas que hoy están en la plataforma. No hay que elegir nada más.`}
                  {guardado.length ? ` Lo que habías armado (${guardado.join(', ')}) se guarda: si apagas esta opción, lo encuentras como estaba.` : ''}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <Text as="p" size="sm" variant="muted">
                Puedes combinarlos a la vez: elige grupos enteros, marca personas una a una o importa una lista con IA. Se suman sin repetir a nadie.
              </Text>

              <Accordion multiple value={abiertas} onValueChange={(valor) => setAbiertas(valor as Seccion[])}>
                <AccordionItem value="grupos">
                  <AccordionTrigger>
                    <Cabecera
                      titulo="Por grupos"
                      detalle="Áreas, líderes u otros grupos. Un grupo entra completo."
                      conteo={groups.length ? `${groups.length}/${gruposPosibles} · ${personas(personasDeGrupos)}` : `0/${gruposPosibles} elegidos`}
                    />
                  </AccordionTrigger>
                  <AccordionContent>
                    <ListaDeGrupos seleccion={seleccion} onCambio={onCambio} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="personas">
                  <AccordionTrigger>
                    <Cabecera
                      titulo="Por persona"
                      detalle="Busca y marca a quien quieras, una a una. Quien entró por un grupo ya sale marcado."
                      conteo={outsideCount ? `${personas(outsideCount)} ${outsideCount === 1 ? 'elegida' : 'elegidas'}` : 'Ninguna elegida'}
                    />
                  </AccordionTrigger>
                  <AccordionContent>
                    <ListaDePersonas seleccion={seleccion} onCambio={onCambio} />
                  </AccordionContent>
                </AccordionItem>

                {conArchivo ? (
                  <AccordionItem value="archivo">
                    <AccordionTrigger>
                      <Cabecera
                        titulo="Personas del archivo"
                        detalle={`${seleccion.importedFileName ?? 'Archivo importado'}: se cruzó con el directorio y los nuevos se suman.`}
                        conteo={personas(importedCount)}
                      />
                    </AccordionTrigger>
                    <AccordionContent>
                      <ParticipantesImportar seleccion={seleccion} onCambio={onCambio} />
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
              </Accordion>

              {/* El pie, como en «Datos demográficos»: cómo se suma todo y la acción para traer más gente. */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Text as="p" size="sm" variant="muted" aria-live="polite">
                  {totalSinEmpresa === 0
                    ? 'Todavía no hay nadie: elige grupos, marca personas o importa un archivo.'
                    : `Suman ${personas(totalSinEmpresa)}: ${desglose.join(', ')}${desglose.length > 1 ? ', sin repetir a nadie' : ''}.`}
                </Text>
                <BotonIaSecundario className="shrink-0" onClick={() => setImportando(true)}>
                  {conArchivo ? 'Importar otro archivo' : 'Importar con IA'}
                </BotonIaSecundario>
              </div>
            </>
          )}
        </div>
      </FramePanel>

      <DrawerShell
        open={importando}
        onOpenChange={(abierto) => {
          setImportando(abierto)
          // Al cerrar con un archivo cargado, su sección queda abierta para ver lo que trajo.
          if (!abierto && seleccion.importedUsers.length > 0) setAbiertas((previas) => [...new Set([...previas, 'archivo' as const])])
        }}
        size="lg"
        ai
        title="Importar con IA"
        description="Sube la lista desde un archivo. Cruzamos cada fila con el directorio y las columnas de más quedan como datos demográficos."
        footer={
          <Button
            className="ml-auto"
            onClick={() => {
              setImportando(false)
              if (seleccion.importedUsers.length > 0) setAbiertas((previas) => [...new Set([...previas, 'archivo' as const])])
            }}
          >
            Listo
          </Button>
        }
      >
        <ParticipantesImportar seleccion={seleccion} onCambio={onCambio} />
      </DrawerShell>
    </Frame>
  )
}
