import type { ReactElement, ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDownRight01Icon, ArrowUpRight01Icon, MinusSignIcon } from '@hugeicons/core-free-icons'
import { Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { Hint } from '@/shared/components/Hint'
import { DetalleIndicador } from '@/modules/design-system/graficos/fila-indicadores'

// Las piezas de las cifras de Selección: «Cómo van los procesos» en el inicio de Vacantes y «Cómo va tu base» en Mis
// candidatos (5 oct, Nicolás: «así mismo en forma deben de ser los de mis candidatos»). Cada columna de `FilaIndicadores`
// lleva su ayuda, la cifra con hacia dónde va y dos líneas: frente a qué se compara y qué significa.

// `Variacion` del dashboard con la insignia legible de Selección (10,5 px): la de la librería en `sm` queda en 10 px.
// Desde el 7-oct es también la comparación del comparativo de Encuestas (antes tenía su propia `Variacion`), y para eso
// suma cuatro opciones que no cambian lo de Selección:
// - `decimales`: redondea antes de mostrar (los puntos porcentuales van con uno, «+2,3 pp»; el eNPS, sin decimales); lo
//   que redondea a 0 se lee como «igual».
// - `sinColor`: ni verde ni rojo, para lo que subir no es bueno ni malo (más comentarios neutrales).
// - `enCelda`: en una tabla, «igual» va como insignia gris «0 pp» con el guion, no como la frase «Igual que…».
// - `ayuda`: la nota al pasar el cursor, en el globo del sistema (Hint).
export function Cambio({
  valor: crudo,
  sufijo,
  menosEsMejor = false,
  frente,
  decimales,
  sinColor = false,
  enCelda = false,
  ayuda,
}: {
  valor: number
  sufijo: string
  menosEsMejor?: boolean
  frente: string
  decimales?: number
  sinColor?: boolean
  enCelda?: boolean
  ayuda?: string
}) {
  const valor = decimales === undefined ? crudo : Math.round(crudo * 10 ** decimales) / 10 ** decimales
  const conAyuda = (insignia: ReactElement) => (ayuda ? <Hint label={ayuda}>{insignia}</Hint> : insignia)
  if (valor === 0) {
    return enCelda ? (
      conAyuda(
        <Badge variant="secondary" className="tabular-nums" aria-label={`Igual que ${frente}`} tabIndex={ayuda ? 0 : undefined}>
          <HugeiconsIcon icon={MinusSignIcon} aria-hidden="true" />
          {`0${sufijo}`}
        </Badge>,
      )
    ) : (
      <Text as="span" variant="muted" size="xs">
        Igual que {frente}
      </Text>
    )
  }
  const sube = valor > 0
  const bueno = menosEsMejor ? !sube : sube
  return conAyuda(
    <Badge
      variant={sinColor ? 'secondary' : bueno ? 'success-light' : 'destructive-outline'}
      className="tabular-nums"
      aria-label={`${sube ? 'Subió' : 'Bajó'} ${Math.abs(valor).toLocaleString('es-CO')}${sufijo} frente a ${frente}`}
      tabIndex={ayuda ? 0 : undefined}
    >
      <HugeiconsIcon icon={sube ? ArrowUpRight01Icon : ArrowDownRight01Icon} aria-hidden="true" />
      {`${sube ? '+' : '−'}${Math.abs(valor).toLocaleString('es-CO')}${sufijo}`}
    </Badge>,
  )
}

// Qué mide cada cifra: al tocar la «i» se abre al lado la explicación (5 oct, Nicolás: «ahí hay unos tooltips y no veo
// que cuando uno le dé clic abra algo»). Desde el 6-oct es la ayuda única del sistema, `BotonAyuda` (Cristian: una sola
// pieza de ayuda): abre con clic, con teclado y en pantalla táctil, en el globo oscuro de todas las ayudas, con el nombre
// de la cifra al principio. Si no cabe a la derecha (la última columna), la librería lo pone del otro lado.
export function Ayuda({ titulo, children }: { titulo: string; children: string }) {
  return (
    <BotonAyuda etiqueta={`Qué mide «${titulo}»`} side="right">
      <strong className="font-medium">{titulo}.</strong> {children}
    </BotonAyuda>
  )
}

export function Cifra({ valor, cambio }: { valor: string; cambio: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Text as="span" size="xl" weight="semibold" className="tabular-nums">
        {valor}
      </Text>
      {cambio}
    </div>
  )
}

export function Pie({ frente, significa }: { frente: string; significa: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <DetalleIndicador>{frente}</DetalleIndicador>
      <DetalleIndicador>{significa}</DetalleIndicador>
    </div>
  )
}
