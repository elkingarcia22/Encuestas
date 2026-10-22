import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, Route01Icon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import type { PlantillaCatalogo } from './datos'
import { etapasDe, relacionadasCon, type EtapaPlantilla } from './etapas-plantilla'
import { esMia, esPropia, usePlantillasPropias } from './plantillas-propias'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'

type Props = {
  plantilla: PlantillaCatalogo
  onAbrir: (plantilla: PlantillaCatalogo) => void
}

// Vista de una plantilla dentro del catálogo: qué busca, cuánto dura y el flujo completo del
// candidato, etapa por etapa. Abajo, otras plantillas para comparar sin volver al listado.
export function DetallePlantilla({ plantilla, onAbrir }: Props) {
  const etapas = etapasDe(plantilla)
  const conIA = etapas.filter((etapa) => etapa.conIA).length
  const dias = etapas.reduce((suma, etapa) => suma + etapa.dias, 0)
  const propias = usePlantillasPropias()
  const relacionadas = relacionadasCon(plantilla, 3, propias)
  // Una propia no tiene un objetivo escrito: su resumen es el área y el nivel de la vacante que guarda (IN-49).
  const propia = esPropia(plantilla) ? plantilla : null

  return (
    <div className="flex flex-col gap-5">
      {/* El nombre, el icono y «Usar plantilla» van en la cabecera y el pie del panel: aquí solo el contenido. */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text as="span" variant="muted" size="xs" weight="semibold" className="inline-flex items-center gap-1.5 uppercase">
              <HugeiconsIcon icon={Target02Icon} className="size-3.5" aria-hidden="true" />
              {propia ? 'Área y nivel' : 'Objetivo'}
            </Text>
            <Text>{plantilla.detalle}</Text>
            {propia ? (
              <Text as="span" variant="muted" size="sm">
                {esMia(propia) ? 'Creada por ti' : `Creada por ${propia.duena}. Solo quien la creó la edita; puedes duplicarla para ajustarla.`}
              </Text>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" size="lg">
              <HugeiconsIcon icon={Route01Icon} aria-hidden="true" />
              {etapas.length} {etapas.length === 1 ? 'etapa' : 'etapas'}
            </Badge>
            {conIA > 0 ? (
              <EtiquetaIA size="lg">{conIA} con IA</EtiquetaIA>
            ) : null}
            <Badge variant="secondary" size="lg">
              <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />
              {dias} días hábiles aprox.
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {etapas.length ? (
            <Accordion multiple defaultValue={etapas[0] ? [etapas[0].id] : []}>
              {etapas.map((etapa, indice) => (
                <Etapa key={etapa.id} etapa={etapa} numero={indice + 1} />
              ))}
            </Accordion>
          ) : (
            // Una plantilla propia guardada sin proceso: se dice, en vez de dejar la tarjeta vacía.
            <Text as="p" variant="muted" size="sm">
              Todavía no tiene etapas. Edítala para armar su proceso de selección.
            </Text>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="otras-plantillas" className="flex flex-col gap-3 pt-2">
        <Text as="p" id="otras-plantillas" weight="semibold" size="sm">
          Otras plantillas que te pueden servir
        </Text>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
          {relacionadas.map((otra) => (
            <Item
              key={otra.id}
              variant="outline"
              size="sm"
              render={<button type="button" />}
              onClick={() => onAbrir(otra)}
              className="h-full text-left"
            >
              <ItemMedia>
                <IconTile variant="soft" size="sm" className={otra.tono}>
                  <HugeiconsIcon icon={otra.icono} aria-hidden="true" />
                </IconTile>
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="line-clamp-1">{otra.nombre}</ItemTitle>
                <ItemDescription className="line-clamp-1">{otra.etapas} {otra.etapas === 1 ? 'etapa' : 'etapas'}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </div>
      </section>
    </div>
  )
}

function Etapa({ etapa, numero }: { etapa: EtapaPlantilla; numero: number }) {
  return (
    <AccordionItem value={etapa.id}>
      <AccordionTrigger>
        <div className="flex min-w-0 flex-1 items-start gap-3 pe-2 text-left">
          <Badge variant="default" radius="full" className="mt-0.5 shrink-0 tabular-nums">
            {numero}
          </Badge>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Text as="span" weight="semibold" size="sm">
              {etapa.nombre}
            </Text>
            <Text as="span" variant="muted" size="xs" weight="normal">
              {etapa.detalle}
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {etapa.conIA ? (
              <EtiquetaIA size="xs">IA</EtiquetaIA>
            ) : null}
            <Badge variant="outline">
              {etapa.tipo}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-3 ps-9 pb-2">
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-[12rem_1fr]">
            {etapa.ajustes.map((ajuste) => (
              <div key={ajuste.etiqueta} className="contents">
                <Text as="span" variant="muted" size="sm">
                  {ajuste.etiqueta}
                </Text>
                <Text as="span" size="sm">
                  {ajuste.valor}
                </Text>
              </div>
            ))}
          </div>
          {etapa.preguntas ? (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <Text as="span" variant="muted" size="sm">
                  {etapa.tituloPreguntas ?? 'Preguntas que hace Serena'}
                </Text>
                <Text as="ol" size="sm" className="flex list-decimal flex-col gap-1.5 ps-5">
                  {etapa.preguntas.map((pregunta) => (
                    <Text as="li" key={pregunta} size="sm">
                      {pregunta}
                    </Text>
                  ))}
                </Text>
              </div>
            </>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
