import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CheckListIcon, Clock01Icon, Layers01Icon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { questionTypeLabel, questionTypeMark, scaleTypeLabel } from '../../modelo/questionCatalog'
import { countQuestions } from '../../modelo/sectionTree'
import type { SurveyDraft, SurveyQuestion, SurveySection } from '../../modelo/surveyBuilderTypes'
import { measureTemplate, pluralize } from '../../modelo/templateCatalog'
import { EncabezadoPaso } from '../pasos-drawer'
import { TEXTO_POR_TONO } from '../tonos'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Una plantilla dentro del catálogo: qué mide, de qué tamaño es y su contenido completo, sección por
// sección con sus subsecciones y preguntas (sin «Otras plantillas que te pueden servir»: Elkin, 14-oct). Mismo armado que la ficha de plantilla de Vacantes, con los marcos del Inicio.

const cuantas = (seccion: SurveySection) => pluralize(countQuestions([seccion]), 'pregunta', 'preguntas')

// Qué tipo de respuesta pide una pregunta, en una etiqueta corta: la escala elegida si es de escala.
const tipoDe = (pregunta: SurveyQuestion) =>
  pregunta.type === 'scale' && pregunta.scale.kind ? scaleTypeLabel(pregunta.scale.kind) : questionTypeLabel(pregunta.type)

// Una cifra del resumen: el número grande y, debajo, qué cuenta, con su icono.
function Cifra({ icono, valor, etiqueta }: { icono: IconSvgElement; valor: string; etiqueta: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 first:ps-0 last:pe-0">
      <Text as="span" size="xl" weight="semibold" className="tabular-nums">
        {valor}
      </Text>
      <Text as="span" size="xs" variant="muted" className="inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={icono} className="size-3.5" aria-hidden="true" />
        {etiqueta}
      </Text>
    </div>
  )
}

// Cada pregunta en su fila, con el mismo distintivo de tipo que tiene en el constructor (icono y color por tipo):
// se ve de un vistazo qué pide sin leer la etiqueta.
function Preguntas({ preguntas, desde = 1 }: { preguntas: readonly SurveyQuestion[]; desde?: number }) {
  if (preguntas.length === 0) return null
  return (
    // gap-0!, px-0! y font-normal!: filas pegadas, a ras del panel y con el número en letra normal; el tema de la lista no
    // se cambia con clases normales (ficha instalacion-estilos-sin-capa en ai-tools/flux-ui/diferencias.json).
    <ItemGroup className="gap-0!">
      {preguntas.map((pregunta, indice) => {
        const marca = questionTypeMark(pregunta.type, pregunta.type === 'scale' ? pregunta.scale.kind : null)
        return (
          <div key={pregunta.id}>
            {indice > 0 ? <ItemSeparator /> : null}
            {/* px-0!: a ras del panel (ficha instalacion-estilos-sin-capa). */}
            <Item size="sm" className="items-start gap-3 px-0!">
              <ItemMedia>
                <IconTile variant="soft" size="sm" className={TEXTO_POR_TONO[marca.tone]}>
                  <HugeiconsIcon icon={marca.icon} aria-hidden="true" />
                </IconTile>
              </ItemMedia>
              <ItemContent className="min-w-0">
                {/* font-normal!: el enunciado en letra normal, no en la negrita del título (ficha instalacion-estilos-sin-capa). */}
                <ItemTitle className="font-normal!">
                  <Text as="span" size="sm" variant="muted" className="tabular-nums">
                    {desde + indice}.
                  </Text>{' '}
                  {pregunta.statement}
                </ItemTitle>
                <ItemDescription>{tipoDe(pregunta)}</ItemDescription>
              </ItemContent>
            </Item>
          </div>
        )
      })}
    </ItemGroup>
  )
}

// Las subsecciones cuelgan como esquema dentro de su sección: título, número de preguntas y las
// preguntas debajo. Así se ven los tres niveles sin abrir un acordeón dentro de otro.
function Subsecciones({ secciones, prefijo }: { secciones: readonly SurveySection[]; prefijo: string }) {
  return (
    <div className="flex flex-col gap-4">
      {secciones.map((seccion, indice) => {
        const numero = `${prefijo}.${indice + 1}`
        return (
          <div key={seccion.id} className="flex flex-col gap-2 border-s ps-4">
            <div className="flex flex-wrap items-center gap-2">
              <Text as="span" size="sm" weight="semibold">
                {numero} {seccion.title || `Subsección ${numero}`}
              </Text>
              <Text as="span" size="xs" variant="muted">
                {cuantas(seccion)}
              </Text>
            </div>
            {seccion.description ? (
              <Text as="p" size="xs" variant="muted">
                {seccion.description}
              </Text>
            ) : null}
            <Preguntas preguntas={seccion.questions} />
            {seccion.children.length > 0 ? <Subsecciones secciones={seccion.children} prefijo={numero} /> : null}
          </div>
        )
      })}
    </div>
  )
}

export function DetallePlantilla({ plantilla }: { plantilla: SurveyDraft }) {
  const tamano = measureTemplate(plantilla)

  return (
    <div className="flex flex-col gap-6">
      {/* El nombre, el icono y «Usar plantilla» van en la cabecera y el pie del panel: aquí solo el contenido. Los marcos son los
          del Inicio («Cómo va cada producto»): título y descripción en la franja de arriba y el contenido en su panel. */}
      <Frame>
        <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
          <FrameTitle className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Target02Icon} className="size-4 text-primary" aria-hidden="true" />
            Objetivo
          </FrameTitle>
          <FrameDescription>{plantilla.description || 'Esta plantilla no tiene un objetivo descrito.'}</FrameDescription>
        </FrameHeader>
        <FramePanel className="grid grid-cols-3 divide-x divide-border">
          <Cifra icono={Layers01Icon} valor={String(tamano.sections)} etiqueta={tamano.sections === 1 ? 'Sección' : 'Secciones'} />
          <Cifra icono={CheckListIcon} valor={String(tamano.questions)} etiqueta={tamano.questions === 1 ? 'Pregunta' : 'Preguntas'} />
          <Cifra icono={Clock01Icon} valor={`${tamano.minutes} min`} etiqueta="Tiempo aproximado" />
        </FramePanel>
      </Frame>

      {/* Cada sección es su propio marco, como en el banco de preguntas: número, nombre y cuántas preguntas en la cabecera,
          que abre y cierra, y las preguntas dentro. */}
      <section className="flex flex-col gap-3">
        <EncabezadoPaso titulo="Contenido" descripcion="Abre una sección para ver sus preguntas y qué tipo de respuesta pide cada una." />
        <Accordion defaultValue={plantilla.sections[0] ? [plantilla.sections[0].id] : []} className="gap-3">
          {plantilla.sections.map((seccion, indice) => (
            <Frame key={seccion.id}>
              {/* border-0!, py-0! y pb-0!: el acordeón vive dentro del marco gris, que ya pone borde y aire; los del acordeón no
                  se quitan con clases normales (ficha instalacion-estilos-sin-capa). */}
              <AccordionItem value={seccion.id} className="border-0!">
                <FrameHeader className="py-0!">
                  <AccordionTrigger>
                    <div className="flex min-w-0 flex-1 items-center gap-3 pe-2 text-left">
                      <Badge variant="primary-light" size="lg" radius="full" className="shrink-0 tabular-nums">
                        {indice + 1}
                      </Badge>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <Text as="span" weight="semibold" size="sm">
                          {seccion.title || `Sección ${indice + 1}`}
                        </Text>
                        <TextoCompleto texto={seccion.description ? `${seccion.description} · ${cuantas(seccion)}` : cuantas(seccion)}><Text as="span" variant="muted" size="xs" weight="normal" className="line-clamp-1">
                          {seccion.description ? `${seccion.description} · ${cuantas(seccion)}` : cuantas(seccion)}
                        </Text></TextoCompleto>
                      </div>
                    </div>
                  </AccordionTrigger>
                </FrameHeader>
                {/* pb-0!: el aire de abajo lo pone el marco (ficha instalacion-estilos-sin-capa). */}
                <AccordionContent className="pb-0!">
                  <FramePanel className="flex flex-col gap-4">
                    <Preguntas preguntas={seccion.questions} />
                    {seccion.children.length > 0 ? <Subsecciones secciones={seccion.children} prefijo={String(indice + 1)} /> : null}
                  </FramePanel>
                </AccordionContent>
              </AccordionItem>
            </Frame>
          ))}
        </Accordion>
      </section>

    </div>
  )
}
