import { Text } from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { Demo, SectionIntro } from '../patrones/piezas'
import { CeldaTitulo } from './celda-titulo'

// Textos que no caben (7-oct): CeldaTitulo a uno o a dos renglones y TextoCompleto, el texto cortado que se lee entero en
// el globo del sistema. Todo con las piezas reales, en una columna angosta como la del panel «Agregar contenidos».

const TITULO = 'Liderazgo en tiempos de cambio: cómo acompañar a tu equipo en una reestructuración'
const DETALLE = 'Curso · 2 h · Habilidades blandas'

export function TextosCortados() {
  return (
    <section className="flex flex-col gap-4">
      <SectionIntro
        title="Textos que no caben"
        description="En una columna angosta el nombre se corta con «…». Si lo que se compara es el nombre entero, CeldaTitulo lo deja en dos renglones; si no, TextoCompleto lo muestra entero en el globo al pasar el cursor o al enfocarlo."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Demo title="Un renglón" description="CeldaTitulo, como viene: el título se corta en una línea.">
          <div className="w-56 max-w-full">
            <CeldaTitulo titulo={TITULO} detalle={DETALLE} />
          </div>
        </Demo>
        <Demo title="Dos renglones" description="CeldaTitulo con dosLineas: para paneles laterales y columnas angostas.">
          <div className="w-56 max-w-full">
            <CeldaTitulo titulo={TITULO} detalle={DETALLE} dosLineas />
          </div>
        </Demo>
        <Demo title="Texto completo" description="TextoCompleto: pasa el cursor o enfoca el texto. Si cabe entero, el globo no sale.">
          <div className="flex w-56 max-w-full flex-col gap-2">
            <TextoCompleto texto={TITULO}>
              <Text as="span" size="sm" weight="medium" tabIndex={0} className="block truncate">
                {TITULO}
              </Text>
            </TextoCompleto>
            <TextoCompleto texto="Inducción">
              <Text as="span" size="sm" variant="muted" tabIndex={0} className="block truncate">
                Inducción
              </Text>
            </TextoCompleto>
          </div>
        </Demo>
      </div>
    </section>
  )
}
