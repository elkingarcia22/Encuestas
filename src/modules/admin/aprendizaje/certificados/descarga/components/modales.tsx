import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  HelpCircleIcon,
} from '@hugeicons/core-free-icons'
import { Button, Frame, FrameHeader, FramePanel, FrameTitle, Heading, IconTile, Separator, Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, Text } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Badge } from '@/shared/components/Badge'
import { AvanceObligatorios, ListaDatos } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { ICONO_MODO, contenidoPorId, descripcionFiltro, periodo, personaPorId, TIPOS_CONTENIDO, TITULO_MODO, type Formulario, type Modo } from './logica'

// Las dos ventanas de la descarga, con la única ventana del sistema (ActionDialog, decisión 4 de la auditoría, 5-oct)
// y las filas de resumen del caso «Revisar y confirmar» de Design system › Formularios.

function Fila({ icono, titulo, descripcion }: { icono: IconSvgElement; titulo: string; descripcion?: string }) {
  return (
    <Item variant="muted" size="sm">
      <ItemMedia>
        <IconTile variant="soft" size="sm">
          <HugeiconsIcon icon={icono} aria-hidden="true" />
        </IconTile>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{titulo}</ItemTitle>
        {descripcion ? <ItemDescription>{descripcion}</ItemDescription> : null}
      </ItemContent>
    </Item>
  )
}

/** La fila de qué se pidió: el modo con su filtro y, en global y por colaborador, el tipo de contenidos. */
function FilaFiltro({ f }: { f: Formulario }) {
  const filtro = descripcionFiltro(f)
  const detalle =
    f.modo === 'contenido'
      ? contenidoPorId(f.contenidoId)?.origen
      : f.modo === 'colaborador'
        ? [personaPorId(f.personaId)?.area, TIPOS_CONTENIDO.find((t) => t.valor === f.tipoContenidos)?.etiqueta].filter(Boolean).join(' · ')
        : TIPOS_CONTENIDO.find((t) => t.valor === f.tipoContenidos)?.etiqueta
  return <Fila icono={ICONO_MODO[f.modo]} titulo={filtro ? `${TITULO_MODO[f.modo]} · ${filtro}` : TITULO_MODO[f.modo]} descripcion={detalle} />
}

/**
 * **El resumen de la solicitud**, en la columna de la derecha.
 *
 * Vivía dentro de una ventana de confirmación que había que abrir para leerlo y cerrar para corregir. Puesto al lado
 * del formulario dice lo mismo **mientras se llena**, y cambia con cada campo: así la confirmación sobra y la
 * pantalla se comporta como lo que es, la creación de una solicitud (Dave, 13-oct).
 *
 * **Es el mismo panel de los asistentes de creación** —Crear contenido, Planes de formación, Diagnóstico— con su
 * misma anatomía: el marco gris con su cabecera, arriba cómo va quedando, debajo los datos en término y valor, y al
 * final lo que falta con su barra. Antes eran filas con icono dentro de un cajón, que es el patrón de «Revisar y
 * confirmar» de un formulario, y hacía que este resumen se leyera distinto de todos los demás (Dave, 13-oct).
 */
export function ResumenSolicitud({
  formulario: f,
  certificados,
  falta,
  obligatorios,
}: {
  formulario: Formulario
  certificados: number
  falta: string[]
  obligatorios: number
}) {
  const filtro = descripcionFiltro(f)
  const filas = [
    { termino: 'Rango de fechas', valor: periodo(f.rango) || 'Sin elegir' },
    { termino: 'Certificados encontrados', valor: certificados.toLocaleString('es-CO') },
    { termino: 'Usuarios', valor: f.incluirInactivos ? 'Activos e inactivos' : 'Solo activos' },
    { termino: 'Llega a', valor: f.correo.trim() || 'Sin correo todavía' },
    { termino: 'Tiempo de entrega', valor: 'Aprox. 15 minutos' },
  ]
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Vista previa</FrameTitle>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-4">
        {/* Arriba, cómo va quedando: el alcance y, si ya se eligió, de qué. */}
        <div className="flex flex-col gap-2">
          <Heading as="h3" level={5} className="break-words">
            {TITULO_MODO[f.modo]}
          </Heading>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" size="xs">
              {filtro || TIPOS_CONTENIDO.find((t) => t.valor === f.tipoContenidos)?.etiqueta || 'Sin filtro'}
            </Badge>
          </div>
        </div>

        <ListaDatos filas={filas} />

        {/* Lo que falta cierra el panel, siempre: igual que en Crear contenido. */}
        <Separator />
        <AvanceObligatorios falta={falta} total={obligatorios} listo="Todo lo obligatorio está listo." />
      </FramePanel>
    </Frame>
  )
}

const MOTIVOS: Record<Modo, string[]> = {
  global: [
    'Nadie ha finalizado contenidos en ese periodo.',
    'Los contenidos finalizados no generan certificado.',
    'Revisa si seleccionaste el tipo de contenido correcto (UBITS o creados por tu empresa).',
  ],
  contenido: ['Nadie ha finalizado este contenido en ese periodo.', 'El contenido no genera certificado.'],
  colaborador: [
    'El colaborador no completó cursos en el periodo seleccionado.',
    'Los cursos que completó no generan certificado.',
    'Revisa si seleccionaste el tipo de contenido correcto (UBITS o creados por tu empresa).',
  ],
}

export function ModalSinResultados({ abierto, formulario: f, onCerrar }: { abierto: boolean; formulario: Formulario; onCerrar: () => void }) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="sm"
      title="No se encontraron certificados"
      sub="No encontramos certificados generados para:"
      footer={<Button onClick={onCerrar}>Entendido</Button>}
    >
      <ItemGroup className="flex flex-col gap-2">
        <FilaFiltro f={f} />
        <Fila icono={Calendar03Icon} titulo="Rango de fechas" descripcion={periodo(f.rango)} />
      </ItemGroup>
      <div className="flex flex-col gap-2">
        <Text as="p" size="sm" weight="medium" className="flex items-center gap-2">
          <HugeiconsIcon icon={HelpCircleIcon} size={16} aria-hidden="true" />
          ¿Por qué puede estar pasando esto?
        </Text>
        <ul className="flex list-disc flex-col gap-1 pl-10">
          {MOTIVOS[f.modo].map((motivo) => (
            <Text as="li" key={motivo} size="sm" variant="muted">
              {motivo}
            </Text>
          ))}
        </ul>
      </div>
    </ActionDialog>
  )
}
