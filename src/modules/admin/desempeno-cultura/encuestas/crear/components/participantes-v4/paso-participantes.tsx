import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Building03Icon, Cancel01Icon, File01Icon, UserGroupIcon, UserMultipleIcon, UserSearch01Icon } from '@hugeicons/core-free-icons'
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
  Checkbox,
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
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { COLLABORATOR_COUNT, COLLABORATORS } from '../../../modelo/collaborators'
import { formatCount, participantCountForMode, participantsGroupBreakdown, resolveImportedRows, totalParticipantCount } from '../../../modelo/participants'
import type { ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { ListaDeGrupos, ListaDePersonas } from './directorio'
import { ParticipantesImportar, VACIO_IMPORTACION } from './importar'

// COPIA de la versión del 28 sep 2026 (tres tarjetas: Toda la empresa / Por grupos / Por persona, e «Importar
// con IA» en fila aparte), guardada antes de pasar al patrón de Datos demográficos. No se usa.
//
// Paso 2 · Participantes: a quién se le pregunta. Va antes que el contenido a propósito: decidir a
// quién se le pregunta cambia qué vale la pena preguntar.
//
// Tres tarjetas. «Toda la empresa» se elige sola (círculo) y no pide nada más: apaga las otras dos, pero lo
// que se había armado en ellas se conserva por si se vuelve. «Por grupos» y «Por persona» se pueden marcar
// juntas (casilla), porque se suman sin repetir a nadie: cada una abre su lista debajo. Un archivo puede
// sumar más gente desde «Importar con IA», que abre su propio panel. Las versiones anteriores están en
// participantes-v1/, -v2/ y -v3/.

type Fuente = 'grupos' | 'personas'

const personas = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'persona' : 'personas'}`

export function PasoParticipantes({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const todaLaEmpresa = seleccion.mode === 'company'
  const total = totalParticipantCount(seleccion)

  // Lo que suman grupos, personas y archivo con lo armado hasta ahora, aunque esté elegida toda la empresa.
  const sinEmpresa: ParticipantsSelection = todaLaEmpresa ? { ...seleccion, mode: 'groups' } : seleccion
  const { groups, outsideCount, importedCount } = participantsGroupBreakdown(sinEmpresa)
  const personasDeGrupos = participantCountForMode('groups', sinEmpresa)
  const conArchivo = seleccion.importedUsers.length > 0
  const nuevosDelArchivo = conArchivo ? resolveImportedRows(seleccion.importedUsers, COLLABORATORS).filter((fila) => fila.person === null).length : 0
  const totalSinEmpresa = totalParticipantCount(sinEmpresa)

  const tieneDatos: Record<Fuente, boolean> = { grupos: seleccion.selectedGroups.length > 0, personas: outsideCount > 0 }
  // Una tarjeta está marcada si se abrió o si ya aporta gente (p. ej. al quitar a alguien de un grupo, el resto
  // pasa a «Por persona» y esa tarjeta se marca sola).
  const [abiertas, setAbiertas] = useState<ReadonlySet<Fuente>>(
    () => new Set<Fuente>([...(seleccion.selectedGroups.length ? ['grupos' as const] : []), ...(seleccion.selectedIds.length ? ['personas' as const] : [])]),
  )
  const marcada = (fuente: Fuente) => !todaLaEmpresa && (abiertas.has(fuente) || tieneDatos[fuente])
  const [aQuitar, setAQuitar] = useState<Fuente | null>(null)
  const [importando, setImportando] = useState(false)

  const abrir = (fuente: Fuente) => {
    setAbiertas((previas) => new Set([...previas, fuente]))
    if (todaLaEmpresa) onCambio({ mode: 'groups' })
  }
  const cerrar = (fuente: Fuente) => {
    setAbiertas((previas) => new Set([...previas].filter((otra) => otra !== fuente)))
    onCambio(fuente === 'grupos' ? { selectedGroups: [] } : { selectedIds: [] })
  }
  // Desmarcar una tarjeta que ya aporta gente la vacía: se pregunta antes.
  const alternar = (fuente: Fuente) => {
    if (!marcada(fuente)) return abrir(fuente)
    if (tieneDatos[fuente]) return setAQuitar(fuente)
    cerrar(fuente)
  }

  const desglose = [
    groups.length ? `${personas(personasDeGrupos)} de ${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}` : '',
    outsideCount ? `${personas(outsideCount)} ${outsideCount === 1 ? 'elegida' : 'elegidas'} una a una` : '',
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
          {/* Tres columnas solo si caben (el ancho del recuadro, que se angosta con el panel de la derecha). */}
          <div className="@container">
          <div className="grid gap-3 @xl:grid-cols-3">
            {/* Un solo círculo: se elige y apaga las otras dos. Para salir de ella se marca una de las otras. */}
            <RadioGroup value={todaLaEmpresa ? 'company' : ''} onValueChange={() => onCambio({ mode: 'company' })} className="grid">
              <Tarjeta
                id="participantes-empresa"
                icono={Building03Icon}
                titulo="Toda la empresa"
                descripcion="Todos los colaboradores de hoy. No hay que elegir nada más."
                cuantas={personas(COLLABORATOR_COUNT)}
                control={<RadioGroupItem value="company" id="participantes-empresa" />}
              />
            </RadioGroup>
            <Tarjeta
              id="participantes-grupos"
              icono={UserGroupIcon}
              titulo="Por grupos"
              descripcion="Áreas, líderes u otros grupos enteros."
              cuantas={groups.length ? `${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'} · ${personas(personasDeGrupos)}` : 'Sin elegir'}
              control={<Checkbox id="participantes-grupos" checked={marcada('grupos')} onCheckedChange={() => alternar('grupos')} />}
            />
            <Tarjeta
              id="participantes-personas"
              icono={UserSearch01Icon}
              titulo="Por persona"
              descripcion="Busca y marca a quien quieras, una a una."
              cuantas={outsideCount ? personas(outsideCount) : 'Sin elegir'}
              control={<Checkbox id="participantes-personas" checked={marcada('personas')} onCheckedChange={() => alternar('personas')} />}
            />
          </div>
          </div>

          {todaLaEmpresa ? null : (
            <>
              {/* El archivo es otra forma de sumar gente: fila aparte, con el botón de IA al final. */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Text as="p" size="sm" variant="muted">
                    ¿Ya tienes la lista en un archivo? Súmala con IA: se cruza con el directorio sin repetir a nadie.
                  </Text>
                  <BotonIaSecundario className="shrink-0" onClick={() => setImportando(true)}>
                    Importar con IA
                  </BotonIaSecundario>
                </div>
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
                {/* Cómo se suma todo: cada fuente cuenta lo suyo y el total no repite a nadie. */}
                {totalSinEmpresa > 0 ? (
                  <Text as="p" size="sm" weight="medium" aria-live="polite">
                    {`Suman ${personas(totalSinEmpresa)}: ${desglose.join(', ')}${desglose.length > 1 ? ', sin repetir a nadie' : ''}.`}
                  </Text>
                ) : null}
              </div>

              {marcada('grupos') ? (
                <Seccion titulo="Por grupos">
                  <ListaDeGrupos seleccion={seleccion} onCambio={onCambio} />
                </Seccion>
              ) : null}
              {marcada('personas') ? (
                <Seccion titulo="Por persona">
                  <ListaDePersonas seleccion={seleccion} onCambio={onCambio} />
                </Seccion>
              ) : null}
            </>
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

      <ActionDialog
        open={aQuitar !== null}
        onOpenChange={(abierto) => (abierto ? undefined : setAQuitar(null))}
        title={aQuitar === 'grupos' ? '¿Dejar de elegir por grupos?' : '¿Dejar de elegir por persona?'}
        sub={
          aQuitar === 'grupos'
            ? `${groups.length === 1 ? 'Se quita el grupo elegido' : `Se quitan los ${groups.length} grupos elegidos`} (${personas(personasDeGrupos)}). Lo elegido por persona o por archivo se queda.`
            : `${outsideCount === 1 ? 'Se quita la persona elegida' : `Se quitan las ${formatCount(outsideCount)} personas elegidas`} una a una. Lo elegido por grupos o por archivo se queda.`
        }
        cancelLabel="Seguir eligiendo"
        confirmLabel="Quitar"
        onConfirm={() => {
          if (aQuitar) cerrar(aQuitar)
          setAQuitar(null)
        }}
      />
    </Frame>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t pt-5" aria-label={titulo}>
      <Heading as="h3" level={6}>
        {titulo}
      </Heading>
      {children}
    </section>
  )
}

function Tarjeta({
  id,
  icono,
  titulo,
  descripcion,
  cuantas,
  control,
}: {
  id: string
  icono: IconSvgElement
  titulo: string
  descripcion: string
  cuantas: string
  control: ReactNode
}) {
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
        {control}
      </Field>
    </FieldLabel>
  )
}
