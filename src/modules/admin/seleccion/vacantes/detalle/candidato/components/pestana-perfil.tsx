import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, Mortarboard01Icon, Pdf01Icon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import type { Candidato, Vacante } from '../../components/data'
import { perfilDe } from './expediente-data'
import { Filas, Marco, Rotulo, type Destacado } from './piezas'

// Punto 1 · Perfil general. La trayectoria arriba, a todo el ancho; debajo formación y habilidades junto a
// contacto y preferencias; al final los documentos. Pretensión, disponibilidad y origen van en la columna del
// proceso, a la derecha, porque se consultan desde cualquier pestaña.
export function PestanaPerfil({ candidato, vacante, destacado }: { candidato: Candidato; vacante: Vacante; destacado: Destacado }) {
  const perfil = perfilDe(candidato, vacante)

  return (
    <div className="flex flex-col gap-4">
      <Marco id="exp-cv" destacado={destacado} titulo="Trayectoria profesional" descripcion={candidato.resumen}>
        <FramePanel>
          <Timeline value={candidato.trayectoria.length}>
            {candidato.trayectoria.map((paso, indice) => (
              <TimelineItem key={`${paso.cargo}-${paso.empresa}`} step={indice + 1}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineDate>{paso.periodo}</TimelineDate>
                  <TimelineTitle>
                    {paso.cargo} · {paso.empresa}
                  </TimelineTitle>
                  <TimelineIndicator />
                </TimelineHeader>
                {perfil.logros[indice] ? <TimelineContent>{perfil.logros[indice]}</TimelineContent> : null}
              </TimelineItem>
            ))}
          </Timeline>
        </FramePanel>
      </Marco>

      <div className="grid items-start gap-4 @xl/main:grid-cols-2">
        <Marco titulo="Formación y habilidades">
          <FramePanel>
            {perfil.formacion.length ? (
              <ItemGroup className="gap-3">
                {perfil.formacion.map((estudio) => (
                  <Item key={estudio.titulo} size="xs">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={Mortarboard01Icon} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{estudio.titulo}</ItemTitle>
                      <ItemDescription>
                        {estudio.institucion} · {estudio.periodo}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            ) : (
              <Text variant="muted" size="sm">
                No registró estudios en la hoja de vida.
              </Text>
            )}
          </FramePanel>
          <FramePanel className="flex flex-col gap-2">
            <Rotulo>Habilidades</Rotulo>
            <div className="flex flex-wrap gap-1.5">
              {candidato.habilidades.map((habilidad) => (
                <Badge key={habilidad} variant="secondary">
                  {habilidad}
                </Badge>
              ))}
            </div>
          </FramePanel>
        </Marco>

        <Marco titulo="Contacto y preferencias">
          <FramePanel>
            <Filas
              filas={[
                { termino: 'Correo', valor: candidato.correo },
                { termino: 'Celular', valor: candidato.celular },
                { termino: 'Ubicación', valor: `${candidato.ciudad}, ${perfil.pais}` },
                { termino: 'Reubicación', valor: perfil.reubicacion ? 'Acepta mudarse' : 'No' },
                { termino: 'Modalidad', valor: perfil.modalidad },
                { termino: 'Contrato', valor: perfil.contrato },
              ]}
            />
          </FramePanel>
        </Marco>
      </div>

      <Marco titulo="Documentos adjuntos" descripcion="Lo que subió con su postulación.">
        <FramePanel>
          <AttachmentGroup className="grid gap-2 @xl/main:grid-cols-2">
            {perfil.documentos.map((documento) => (
              <Attachment key={documento.nombre} state="done" size="sm">
                <AttachmentMedia>
                  <HugeiconsIcon icon={Pdf01Icon} aria-hidden="true" />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{documento.nombre}</AttachmentTitle>
                  <AttachmentDescription>
                    {documento.tipo} · {documento.detalle}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction aria-label={`Descargar ${documento.nombre}`} onClick={() => notify('Descargando documento', documento.nombre)}>
                    <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        </FramePanel>
      </Marco>
    </div>
  )
}
