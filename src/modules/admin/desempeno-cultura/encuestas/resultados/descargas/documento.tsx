import type { ReactNode } from 'react'
import { Card, CardContent, Heading, Separator, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { fechaCorta } from '@/modules/design-system/patrones/formato'

// Las piezas comunes de los reportes impresos: portada, secciones numeradas, cifras y pie. Todo con
// los componentes de la pantalla, así el papel y la herramienta se leen igual. Lo único propio del
// papel es el corte de página (`break-inside-avoid`, `break-before-page`): es maquetación de la hoja.

export type Dato = { etiqueta: string; valor: string }

// Cuántas columnas de grupo caben a lo ancho de un A4 antes de que el número deje de leerse: pasado
// ese ancho la grilla se parte en tandas («Grupo A», «Grupo B») en vez de encoger la letra.
export const MAX_COLUMNAS = 5
export const TANDAS = ['A', 'B', 'C', 'D', 'E', 'F']
export const partir = <T,>(lista: readonly T[], tamano: number): T[][] => Array.from({ length: Math.ceil(lista.length / tamano) }, (_, i) => lista.slice(i * tamano, i * tamano + tamano))

/** La hoja: el ancho útil de un A4 y la tipografía del tema. */
export function Documento({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-8 bg-background px-2 py-4 text-foreground">{children}</div>
}

/** La portada: qué es, de qué medición y los datos que la ubican. */
export function Portada({ tipo, rotulo, titulo, corte, datos }: { tipo: string; rotulo: string; titulo: string; corte?: string | null; datos: readonly Dato[] }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="primary-light">{tipo}</Badge>
        <Text as="span" size="sm" variant="muted" weight="semibold">
          {rotulo}
        </Text>
      </div>
      <div className="flex flex-col gap-1">
        <Heading level={1}>{titulo}</Heading>
        {corte ? (
          <Text size="lg" variant="muted">
            {corte}
          </Text>
        ) : null}
      </div>
      <dl className="grid grid-cols-4 gap-4">
        {datos.map((dato) => (
          <div key={dato.etiqueta} className="flex flex-col gap-0.5">
            <Text as="span" size="xs" variant="muted" weight="medium">
              {dato.etiqueta}
            </Text>
            <Text as="span" size="sm" weight="semibold">
              {dato.valor}
            </Text>
          </div>
        ))}
      </dl>
      <Separator />
    </header>
  )
}

/** Una sección del reporte. El número lo pone quien arma el documento, no la sección. */
export function SeccionDocumento({ numero, titulo, icono, junta, nuevaHoja, children }: { numero?: number; titulo: string; icono?: ReactNode; junta?: boolean; nuevaHoja?: boolean; children: ReactNode }) {
  return (
    <section className={[junta ? 'break-inside-avoid' : '', nuevaHoja ? 'break-before-page' : '', 'flex flex-col gap-4'].join(' ')}>
      <div className="flex items-center gap-2">
        {numero !== undefined ? (
          <Badge variant="default" className="tabular-nums">
            {numero}
          </Badge>
        ) : null}
        {icono}
        <Heading level={2}>{titulo}</Heading>
      </div>
      {children}
    </section>
  )
}

/** El subtítulo de un bloque dentro de una sección. */
export function Bloque({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {titulo ? <Heading level={4}>{titulo}</Heading> : null}
      {children}
    </div>
  )
}

/** Una fila de cifras de titular. */
export function Cifras({ cifras }: { cifras: readonly { etiqueta: string; valor: string; detalle: string }[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {cifras.map((cifra) => (
        <Card key={cifra.etiqueta} className="break-inside-avoid">
          <CardContent className="flex flex-col gap-1">
            <Text as="span" size="xs" variant="muted" weight="medium">
              {cifra.etiqueta}
            </Text>
            <Heading level={3} className="tabular-nums">
              {cifra.valor}
            </Heading>
            <Text as="span" size="xs" variant="muted">
              {cifra.detalle}
            </Text>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Deja partir el texto dentro de una celda: las celdas del tema van en una sola línea. */
export function Ajusta({ children }: { children: ReactNode }) {
  return <div className="whitespace-normal">{children}</div>
}

/** Una nota al pie de un bloque. */
export function Nota({ children }: { children: ReactNode }) {
  return (
    <Text size="xs" variant="muted">
      {children}
    </Text>
  )
}

/** Una leyenda de escala: el rótulo y una insignia por tramo. */
export function Leyenda({ titulo, tramos }: { titulo: string; tramos: readonly { etiqueta: string; rango?: string; variante: Parameters<typeof Badge>[0]['variant'] }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Text as="span" size="xs" variant="muted" weight="semibold">
        {titulo}
      </Text>
      {tramos.map((tramo) => (
        <Badge key={tramo.etiqueta} variant={tramo.variante} size="sm">
          {tramo.etiqueta}
          {tramo.rango ? ` · ${tramo.rango}` : ''}
        </Badge>
      ))}
    </div>
  )
}

/** El cierre del documento: qué es y la regla de anonimato con la que se leyó. */
export function Pie({ izquierda, derecha }: { izquierda: string; derecha: string }) {
  return (
    <footer className="flex flex-col gap-2 break-inside-avoid">
      <Separator />
      <div className="flex items-start justify-between gap-6">
        <Text as="span" size="xs" variant="muted">
          {izquierda}
        </Text>
        <Text as="span" size="xs" variant="muted" className="text-right">
          {derecha}
        </Text>
      </div>
    </footer>
  )
}

// Las fechas del reporte, de una sola forma y la del resto del producto (fechaCorta, «2 oct 2026»; decisión 19 de la
// auditoría): en el período de la portada, en «Generado» y en el pie. Antes salían de tres formas distintas.

/** Una fecha del borrador («aaaa-mm-dd») como se escribe en un reporte: «1 sep 2026»; sin fecha, «—». */
export const fechaReporte = (iso: string) => (iso ? fechaCorta(iso) : '—')

/** La fecha de hoy como se escribe en un reporte: «2 oct 2026». */
export const hoyReporte = () => {
  const hoy = new Date()
  return fechaCorta(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`)
}
