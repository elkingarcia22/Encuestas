import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowRight01Icon, Calendar03Icon, Flag01Icon, HashtagIcon, Layers01Icon, MoneyBag02Icon, PercentIcon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { FILA_CLICABLE, FilasSeparadas, MarcoLista } from '../../../encuestas/components/marco-lista'
import { EncabezadoPaso } from '../../../encuestas/components/pasos-drawer'
import { TEXTO_POR_TONO } from '../../../encuestas/components/tonos'
import type { Tone } from '../../../encuestas/modelo/tone'
import { NIVELES, categoriaDe, sugerirPlantillas, totalObjetivos, type Medida, type ObjetivoPlantilla, type PlantillaCiclo } from '../../modelo/plantillas'

// Una plantilla dentro del catálogo, con el mismo armado que la ficha de plantilla de Encuestas: arriba qué persigue y
// de qué tamaño es; luego su contenido, un marco que abre y cierra por cada nivel (empresa, grupo, individual) con sus
// objetivos, y abajo otras plantillas para comparar sin volver al listado. Donde Encuestas muestra el tipo de cada
// pregunta, aquí va cómo se mide cada objetivo (dinero, número, porcentaje o hito), con su icono y su color.

const MARCA_MEDIDA: Record<Medida, { icono: IconSvgElement; tono: Tone; etiqueta: string }> = {
  Dinero: { icono: MoneyBag02Icon, tono: 'positive', etiqueta: 'Dinero' },
  Numérico: { icono: HashtagIcon, tono: 'brand', etiqueta: 'Numérico' },
  Porcentaje: { icono: PercentIcon, tono: 'violet', etiqueta: 'Porcentaje' },
  Hito: { icono: Flag01Icon, tono: 'warning', etiqueta: 'Se cumple / No se cumple' },
}

const cuantos = (n: number) => `${n} ${n === 1 ? 'objetivo' : 'objetivos'}`

/** El icono de una plantilla, en el color de su categoría. */
export function IconoPlantilla({ plantilla }: { plantilla: PlantillaCiclo }) {
  return (
    <IconTile variant="soft" size="sm" className={TEXTO_POR_TONO[categoriaDe(plantilla).tono]}>
      <HugeiconsIcon icon={plantilla.icono} aria-hidden="true" />
    </IconTile>
  )
}

/** Tamaño y periodo de una plantilla, en la insignia de su fila. */
export function ResumenPlantilla({ plantilla }: { plantilla: PlantillaCiclo }) {
  return (
    <Badge variant="secondary" size="xs">
      <HugeiconsIcon icon={Target02Icon} aria-hidden="true" />
      {cuantos(totalObjetivos(plantilla))} · {plantilla.periodo}
    </Badge>
  )
}

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

// Cómo se mide en una línea: «Porcentaje · Reducir de 12 % a 6 %», o «Se cumple / No se cumple» si es un hito.
const medicion = (objetivo: ObjetivoPlantilla) =>
  objetivo.sentido ? `${MARCA_MEDIDA[objetivo.medida].etiqueta} · ${objetivo.sentido} de ${objetivo.actual} a ${objetivo.meta}` : MARCA_MEDIDA.Hito.etiqueta

// Cada objetivo en su fila, con el distintivo de cómo se mide y su peso dentro del nivel a la derecha. En grupo e
// individual, a qué objetivo de empresa contribuye.
function Objetivos({ objetivos, empresa }: { objetivos: readonly ObjetivoPlantilla[]; empresa?: readonly ObjetivoPlantilla[] }) {
  return (
    <ItemGroup className="gap-0!">
      {objetivos.map((objetivo, indice) => {
        const marca = MARCA_MEDIDA[objetivo.medida]
        const contribuye = empresa?.[indice]
        return (
          <div key={objetivo.nombre}>
            {indice > 0 ? <ItemSeparator /> : null}
            <Item size="sm" className="items-start gap-3 px-0!">
              <ItemMedia>
                <IconTile variant="soft" size="sm" className={TEXTO_POR_TONO[marca.tono]}>
                  <HugeiconsIcon icon={marca.icono} aria-hidden="true" />
                </IconTile>
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="font-normal!">
                  <Text as="span" size="sm" variant="muted" className="tabular-nums">
                    {indice + 1}.
                  </Text>{' '}
                  {objetivo.nombre}
                </ItemTitle>
                <ItemDescription>{objetivo.descripcion}</ItemDescription>
                <Text as="span" size="xs" variant="muted" className="tabular-nums">
                  {medicion(objetivo)}
                </Text>
                {contribuye ? (
                  <Text as="span" size="xs" variant="muted">
                    Contribuye a «{contribuye.nombre}»
                  </Text>
                ) : null}
              </ItemContent>
              <ItemActions>
                <Badge variant="outline" size="sm" className="tabular-nums">
                  {objetivo.peso} %
                </Badge>
              </ItemActions>
            </Item>
          </div>
        )
      })}
    </ItemGroup>
  )
}

export function DetallePlantilla({ plantilla, onAbrir }: { plantilla: PlantillaCiclo; onAbrir: (plantilla: PlantillaCiclo) => void }) {
  const otras = sugerirPlantillas(plantilla, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* El nombre, el icono y «Usar plantilla» van en la cabecera y el pie del panel: aquí solo el contenido. */}
      <Frame>
        <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
          <FrameTitle className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Target02Icon} className="size-4 text-primary" aria-hidden="true" />
            Objetivo
          </FrameTitle>
          <FrameDescription>{plantilla.descripcion}</FrameDescription>
        </FrameHeader>
        <FramePanel className="grid grid-cols-3 divide-x divide-border">
          <Cifra icono={Target02Icon} valor={String(totalObjetivos(plantilla))} etiqueta="Objetivos en total" />
          <Cifra icono={Layers01Icon} valor={String(NIVELES.length)} etiqueta="Niveles" />
          <Cifra icono={Calendar03Icon} valor={plantilla.periodo} etiqueta="Periodo sugerido" />
        </FramePanel>
      </Frame>

      {/* Cada nivel es su propio marco, como cada sección en la ficha de Encuestas: número, nombre y cuántos objetivos en la
          cabecera, que abre y cierra, y los objetivos dentro. */}
      <section className="flex flex-col gap-3">
        <EncabezadoPaso titulo="Contenido" descripcion="Abre un nivel para ver sus objetivos, cómo se mide cada uno y su meta." />
        <Accordion defaultValue={[NIVELES[0].clave]} className="gap-3">
          {NIVELES.map((nivel, indice) => {
            const objetivos = plantilla[nivel.clave]
            const resumen = `${nivel.descripcion} · ${cuantos(objetivos.length)} · Peso ${objetivos.reduce((suma, objetivo) => suma + objetivo.peso, 0)} %`
            return (
              <Frame key={nivel.clave}>
                <AccordionItem value={nivel.clave} className="border-0!">
                  <FrameHeader className="py-0!">
                    <AccordionTrigger>
                      <div className="flex min-w-0 flex-1 items-center gap-3 pe-2 text-left">
                        <Badge variant="primary-light" size="lg" radius="full" className="shrink-0 tabular-nums">
                          {indice + 1}
                        </Badge>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <Text as="span" weight="semibold" size="sm">
                            {nivel.titulo}
                          </Text>
                          <TextoCompleto texto={resumen}>
                            <Text as="span" variant="muted" size="xs" weight="normal" className="line-clamp-1">
                              {resumen}
                            </Text>
                          </TextoCompleto>
                        </div>
                      </div>
                    </AccordionTrigger>
                  </FrameHeader>
                  <AccordionContent className="pb-0!">
                    <FramePanel>
                      <Objetivos objetivos={objetivos} empresa={nivel.clave === 'empresa' ? undefined : plantilla.empresa} />
                    </FramePanel>
                  </AccordionContent>
                </AccordionItem>
              </Frame>
            )
          })}
        </Accordion>
      </section>

      <MarcoLista titulo="Otras plantillas que te pueden servir" descripcion="Ábrelas para compararlas sin volver al listado.">
        <FramePanel className="py-1!">
          <FilasSeparadas>
            {otras.map((otra) => (
              <Item key={otra.id} size="sm" render={<button type="button" />} onClick={() => onAbrir(otra)} className={FILA_CLICABLE}>
                <ItemMedia>
                  <IconoPlantilla plantilla={otra} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <TextoCompleto texto={otra.nombre}>
                    <ItemTitle className="truncate">{otra.nombre}</ItemTitle>
                  </TextoCompleto>
                  <ItemDescription>
                    {cuantos(totalObjetivos(otra))} · {otra.periodo}
                  </ItemDescription>
                </ItemContent>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              </Item>
            ))}
          </FilasSeparadas>
        </FramePanel>
      </MarcoLista>
    </div>
  )
}
