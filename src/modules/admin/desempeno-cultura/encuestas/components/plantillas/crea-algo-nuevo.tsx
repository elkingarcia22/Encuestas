import { Button, Text } from '@ubits/flux-ui'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { clima, cultura, eNPS, universidadCorporativa } from '../../modelo/nom035Templates'

// «Crea algo nuevo» de Encuestas: tarjetas sueltas, sin marco, como las «Acciones rápidas» del Inicio del admin
// (inicio/components/acciones-rapidas.tsx; Elkin, 15-oct): ilustración Glass centrada, el nombre debajo y una línea de qué
// mide. Las plantillas más pedidas a la vista. Primero la NOM 035 (la que más preguntan los clientes de México), después Universidad Corporativa, Cultura, Clima y eNPS. La NOM 035
// tiene tres guías y cuál toca depende del tamaño de la empresa, así que su tarjeta abre el catálogo en su estante; las
// demás abren directo la ficha de su plantilla.

const ESTANTE_NOM035 = 'legales-nom035-mexico'

type Atajo = { titulo: string; descripcion: string; glass: string } & ({ plantilla: SurveyDraft } | { estante: string })

const ATAJOS: readonly Atajo[] = [
  { titulo: 'NOM 035', descripcion: 'Las guías oficiales de la STPS para cumplir la norma en México.', glass: 'glass-shield-done', estante: ESTANTE_NOM035 },
  { titulo: 'Universidad Corporativa', descripcion: 'Qué tan útil es la formación para el día a día.', glass: 'glass-bookmark', plantilla: universidadCorporativa },
  { titulo: 'Cultura', descripcion: 'Valores, misión y coherencia de tu empresa.', glass: 'glass-heart', plantilla: cultura },
  { titulo: 'Clima', descripcion: 'Liderazgo, comunicación y bienestar en el día a día.', glass: 'glass-profile', plantilla: clima },
  { titulo: 'eNPS', descripcion: 'Si tu gente recomendaría la empresa para trabajar.', glass: 'glass-chart', plantilla: eNPS },
]

export function CreaAlgoNuevo({ onPlantilla, onEstante }: { onPlantilla: (plantilla: SurveyDraft) => void; onEstante: (estante: string) => void }) {
  return (
    // Sin marco ni título a la vista, como en el Inicio: el nombre queda para el lector de pantalla.
    <section aria-label="Crea algo nuevo">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ATAJOS.map((atajo) => (
          <li key={atajo.titulo}>
            {/* La tarjeta es el botón de la librería en contorno, con la diagramación del Inicio: ilustración centrada y el
                nombre debajo. Mismo hover: sube 2px, borde azul suave, sombra y la ilustración crece un poco. Los «!» ya
                estaban en este bloque (antes, como en LMS Creator › Contenidos): el tema va sin capa (ficha
                instalacion-estilos-sin-capa en ai-tools/flux-ui/diferencias.json). */}
            <Button
              variant="outline"
              onClick={() => ('plantilla' in atajo ? onPlantilla(atajo.plantilla) : onEstante(atajo.estante))}
              className="group h-full! w-full cursor-pointer flex-col! items-center! justify-center! gap-2! rounded-xl! px-3! py-4! text-center! whitespace-normal! transition-[translate,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card! hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                <ImagenGlass nombre={atajo.glass} tamano={52} className="pointer-events-none select-none" />
              </span>
              <span className="flex flex-col gap-0.5">
                <Text as="span" size="sm" weight="medium" className="text-balance">
                  {atajo.titulo}
                </Text>
                <Text as="span" size="xs" variant="muted" className="text-balance font-normal">
                  {atajo.descripcion}
                </Text>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
