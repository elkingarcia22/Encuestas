import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Building03Icon, File01Icon, UserGroupIcon, UserSearch01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Field, FieldLabel, Frame, FramePanel, Heading, IconTile, Separator, Switch, Text } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { COLLABORATOR_COUNT } from '../../../modelo/collaborators'
import { formatCount, participantCountForMode, participantsGroupBreakdown, segmentCounts, totalParticipantCount } from '../../../modelo/participants'
import type { ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { ListaDeGrupos, ListaDePersonas } from './directorio'
import { ParticipantesImportar } from './importar'

// COPIA de la versión del 28 sep 2026 (tres contenedores; solo «Toda la empresa» con interruptor), guardada antes
// de dar un interruptor a cada contenedor. No se usa.
//
// Paso 2 · Participantes: a quién se le pregunta. Va antes que el contenido a propósito: decidir a
// quién se le pregunta cambia qué vale la pena preguntar.
//
// Un contenedor por cada forma de elegir. «Toda la empresa» es solo una cabecera con su interruptor: va
// sola y no pide nada más. «Por grupos» y «Por persona» traen su lista y se suman entre sí (y con el
// archivo que se importe con IA) sin repetir a nadie. Con toda la empresa encendida, los otros dos se
// pliegan pero conservan lo elegido por si se vuelve. Las versiones anteriores están en
// participantes-v1/ a -v5/.

const personas = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'persona' : 'personas'}`

// Un contenedor: cabecera con icono, título, detalle y lo de la derecha; debajo, su contenido si lo tiene.
function Contenedor({
  icono,
  titulo,
  detalle,
  derecha,
  children,
}: {
  icono: IconSvgElement
  titulo: string
  detalle: string
  derecha?: ReactNode
  children?: ReactNode
}) {
  return (
    <Frame>
      <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <IconTile variant="soft" size="sm" className="shrink-0 text-primary">
              <HugeiconsIcon icon={icono} aria-hidden="true" />
            </IconTile>
            <div className="flex min-w-0 flex-col gap-0.5">
              <Heading as="h3" level={6}>
                {titulo}
              </Heading>
              <Text as="p" variant="muted" size="sm">
                {detalle}
              </Text>
            </div>
          </div>
          {derecha ? <div className="shrink-0">{derecha}</div> : null}
        </div>
        {children ? (
          <>
            <Separator />
            <div className="px-5 py-5">{children}</div>
          </>
        ) : null}
      </FramePanel>
    </Frame>
  )
}

export function PasoParticipantes({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const todaLaEmpresa = seleccion.mode === 'company'
  const total = totalParticipantCount(seleccion)
  const [importando, setImportando] = useState(false)

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

  // Con toda la empresa encendida, los otros contenedores lo dicen en vez de mostrar su lista.
  const enPausa = 'No aplica mientras la encuesta vaya a toda la empresa: lo elegido se guarda.'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <Heading as="h2" level={5}>
            Participantes
          </Heading>
          <Text as="p" variant="muted" size="sm">
            Elige quién recibirá la encuesta: toda la empresa, o grupos y personas que se suman sin repetir a nadie.
          </Text>
        </div>
        <Badge variant="secondary" size="lg" className="tabular-nums">
          {formatCount(total)} {total === 1 ? 'participante' : 'participantes'}
        </Badge>
      </div>

      <Contenedor
        icono={Building03Icon}
        titulo="Toda la empresa"
        detalle={`Las ${formatCount(COLLABORATOR_COUNT)} personas que hoy están en la plataforma. No hay que elegir nada más.`}
        derecha={
          <Field orientation="horizontal" className="w-auto!">
            <FieldLabel htmlFor="toda-la-empresa" className="sr-only">
              Enviar a toda la empresa
            </FieldLabel>
            <Switch id="toda-la-empresa" checked={todaLaEmpresa} onCheckedChange={(activo) => onCambio({ mode: activo ? 'company' : 'groups' })} />
          </Field>
        }
      />

      <Contenedor
        icono={UserGroupIcon}
        titulo="Por grupos"
        detalle={todaLaEmpresa ? enPausa : 'Áreas, líderes u otros grupos. Un grupo entra completo.'}
        derecha={
          <Badge variant="outline" size="sm" className="shrink-0 tabular-nums">
            {groups.length ? `${groups.length}/${gruposPosibles} · ${personas(personasDeGrupos)}` : `0/${gruposPosibles} elegidos`}
          </Badge>
        }
      >
        {todaLaEmpresa ? null : <ListaDeGrupos seleccion={seleccion} onCambio={onCambio} />}
      </Contenedor>

      <Contenedor
        icono={UserSearch01Icon}
        titulo="Por persona"
        detalle={todaLaEmpresa ? enPausa : 'Busca y marca a quien quieras, una a una. Quien entró por un grupo ya sale marcado.'}
        derecha={
          <Badge variant="outline" size="sm" className="shrink-0 tabular-nums">
            {outsideCount ? `${personas(outsideCount)} ${outsideCount === 1 ? 'elegida' : 'elegidas'}` : 'Ninguna elegida'}
          </Badge>
        }
      >
        {todaLaEmpresa ? null : <ListaDePersonas seleccion={seleccion} onCambio={onCambio} />}
      </Contenedor>

      {conArchivo ? (
        <Contenedor
          icono={File01Icon}
          titulo="Personas del archivo"
          detalle={todaLaEmpresa ? enPausa : `${seleccion.importedFileName ?? 'Archivo importado'}: se cruzó con el directorio y los nuevos se suman.`}
          derecha={
            <Badge variant="outline" size="sm" className="shrink-0 tabular-nums">
              {personas(importedCount)}
            </Badge>
          }
        >
          {todaLaEmpresa ? null : <ParticipantesImportar seleccion={seleccion} onCambio={onCambio} />}
        </Contenedor>
      ) : null}

      {/* El pie: cómo se suma todo y la acción para traer más gente desde un archivo. */}
      {todaLaEmpresa ? null : (
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
      )}

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
    </div>
  )
}
