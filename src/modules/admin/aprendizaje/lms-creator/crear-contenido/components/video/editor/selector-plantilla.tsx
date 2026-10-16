import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldLabel,
  FieldTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Text,
} from '@ubits/flux-ui'
import { SinResultados } from '@/shared/components/SinResultados'
import { PLANTILLAS_CANVAS, camposDesdeIdea, camposVacios, type PlantillaCanvas } from '../datos'
import { MiniaturaEscena } from '../lienzo'
import type { Escena, Proyecto } from '../proyecto'
import { enOtraPlantilla } from '../capas'

// El selector de plantilla del canvas, como el del editor de video de AI Studio (el jefe de Dave, 14-oct): un campo que
// muestra la plantilla con su miniatura y su ayuda, y al abrirlo un buscador con las diez agrupadas por para qué sirven.
// La diferencia con el de ellos: cada miniatura es **tu propia escena** dibujada en esa plantilla, no un esquema gris,
// así se ve cómo quedaría antes de elegirla.

/** Para qué sirve cada plantilla y con qué palabras se encuentra (las mismas del editor de AI Studio). */
const AYUDA: Record<PlantillaCanvas, { ayuda: string; busca: string }> = {
  intro: { ayuda: 'Abre el video con título e imagen', busca: 'inicio intro portada apertura' },
  section: { ayuda: 'Marca el cambio de capítulo', busca: 'separador capitulo transicion modulo' },
  split: { ayuda: 'Texto a un lado, imagen al otro', busca: 'foto media imagen' },
  one_column: { ayuda: 'Imagen arriba y un bloque de texto', busca: 'texto parrafo simple columna' },
  two_columns: { ayuda: 'Compara dos ideas lado a lado', busca: 'comparar antes despues' },
  steps: { ayuda: 'Pasos numerados', busca: 'pasos numerada proceso lista' },
  agenda: { ayuda: 'Temario de lo que viene', busca: 'temario contenido indice' },
  keypoint: { ayuda: 'Una cifra grande con su etiqueta', busca: 'numero metrica cifra dato kpi' },
  quote: { ayuda: 'Testimonio con autor', busca: 'testimonio frase autor cita' },
  title_only: { ayuda: 'Una frase que ocupa la pantalla', busca: 'frase impacto afirmacion' },
}

const GRUPOS: { titulo: string; plantillas: PlantillaCanvas[] }[] = [
  { titulo: 'Apertura y transición', plantillas: ['intro', 'section'] },
  { titulo: 'Contenido', plantillas: ['split', 'one_column', 'two_columns', 'steps', 'agenda'] },
  { titulo: 'Énfasis', plantillas: ['keypoint', 'quote', 'title_only'] },
]

const nombreDe = (id: PlantillaCanvas) => PLANTILLAS_CANVAS.find((p) => p.id === id)?.label ?? id
const sinTildes = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** La escena tal como quedaría en otra plantilla: con su idea si la tiene, si no con los textos de muestra. */
function enPlantilla(escena: Escena, plantilla: PlantillaCanvas): Escena {
  if (!escena.canvas) return escena
  const base = escena.canvas.idea ? camposDesdeIdea(plantilla, escena.canvas.idea) : camposVacios(plantilla)
  return { ...escena, canvas: enOtraPlantilla(escena.canvas, plantilla, base, escena.imagen || '/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg') }
}

export function SelectorPlantilla({
  id,
  proyecto,
  escena,
  onElegir,
}: {
  id?: string
  proyecto: Proyecto
  escena: Escena
  onElegir: (plantilla: PlantillaCanvas) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const actual = escena.canvas?.plantilla ?? 'intro'
  // La búsqueda se limpia al cerrar, también al cerrarse por elegir: si no, al volver a abrir salía filtrada.
  const abrir = (v: boolean) => {
    setAbierto(v)
    if (!v) setBusqueda('')
  }

  const grupos = useMemo(() => {
    const q = sinTildes(busqueda.trim())
    return GRUPOS.map((g) => ({
      ...g,
      plantillas: q ? g.plantillas.filter((p) => sinTildes(`${nombreDe(p)} ${AYUDA[p].ayuda} ${AYUDA[p].busca}`).includes(q)) : g.plantillas,
    })).filter((g) => g.plantillas.length > 0)
  }, [busqueda])

  return (
    <Popover open={abierto} onOpenChange={abrir}>
      {/* Como un select de la librería (Dave, 14-oct): la miniatura de la escena, el nombre y las flechas de abrir; sin la
          ayuda, que repetía lo que ya dice la miniatura. Más alto que un campo normal, para que la miniatura se lea. */}
      {/* `h-auto!` y `py-1.5!`: el Button de la librería se queda en 36 px aunque se le pida alto automático (su estilo va
          sin capa y le gana a la clase; ficha «instalacion-estilos-sin-capa» de diferencias.json) y la miniatura se salía
          del campo (Dave, 14-oct). */}
      <PopoverTrigger render={<Button id={id} variant="outline" className="h-auto! w-full justify-start gap-3 py-1.5! pr-2.5 pl-1.5 text-left" />}>
        <span className="w-18 shrink-0" aria-hidden="true">
          <MiniaturaEscena proyecto={proyecto} escena={escena} className="border" />
        </span>
        <Text as="span" size="sm" weight="medium" className="min-w-0 flex-1 truncate">
          {nombreDe(actual)}
        </Text>
        <HugeiconsIcon icon={UnfoldMoreIcon} size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-0 p-0">
        <div className="border-b p-2">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput autoFocus aria-label="Buscar plantilla" placeholder="Buscar plantilla" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </InputGroup>
        </div>
        {/* Alto fijo (no máximo): si el alto dependía de cuántas quedaban al filtrar, la ventana saltaba de abajo a arriba del campo. */}
        <div className="flex h-[min(60vh,420px)] flex-col gap-4 overflow-y-auto p-3">
          {grupos.length === 0 ? (
            <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
          ) : (
            grupos.map((g) => (
              <section key={g.titulo} className="flex flex-col gap-2" aria-label={g.titulo}>
                <Text as="p" size="xs" weight="semibold" variant="muted">
                  {g.titulo}
                </Text>
                {/* La tarjeta de opción de la librería (FieldLabel + Field + RadioGroupItem), la misma de «Tipo de
                    escena»: crece con su miniatura, cosa que un Button no deja (su alto es fijo). */}
                <RadioGroup
                  value={actual}
                  onValueChange={(v) => {
                    if (v !== actual) onElegir(v as PlantillaCanvas)
                    abrir(false)
                  }}
                  aria-label={g.titulo}
                  className="grid grid-cols-2 gap-2"
                >
                  {g.plantillas.map((p) => (
                    <FieldLabel key={p} htmlFor={`plantilla-${p}`}>
                      <Field className="gap-1.5! p-1.5!">
                        {/* La miniatura es para ver: el lector de pantalla anuncia la plantilla por su nombre y su ayuda. */}
                        <span aria-hidden="true">
                          <MiniaturaEscena proyecto={proyecto} escena={enPlantilla(escena, p)} className="border" />
                        </span>
                        <FieldTitle className="truncate px-0.5 text-xs!">{nombreDe(p)}</FieldTitle>
                        <RadioGroupItem value={p} id={`plantilla-${p}`} aria-label={`${nombreDe(p)}: ${AYUDA[p].ayuda}`} className="sr-only!" />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </section>
            ))
          )}
        </div>
        <div className="border-t px-3 py-2">
          <Text as="p" size="xs" variant="muted">
            Al cambiar de plantilla se conservan tus textos y las capas que agregaste; las piezas de la plantilla se vuelven a acomodar y el fondo vuelve al suyo.
          </Text>
        </div>
      </PopoverContent>
    </Popover>
  )
}
