import { useMemo } from 'react'
import { Message01Icon } from '@hugeicons/core-free-icons'
import {
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { BarraSegmentada } from '@/modules/design-system/metricas/graficos'
import { FilasSeparadas, MarcoLista } from '../../components/marco-lista'
import type { ComentariosSeccion, Comparativo, Reparto } from '../../modelo/comparativo/lectura'
import type { OpenComment, Sentiment } from '../../modelo/questionResponses'
import { SENTIMENT_LABELS } from '../../modelo/sentimiento'
import { numero } from '../../resultados/components/escala'
import { InsigniaSentimiento } from '../../resultados/components/sentimiento'
import { Dato } from '../../resultados/components/ia-secciones'
import { MarcaBase } from './variacion'
import { Cambio } from '@/modules/admin/seleccion/propuestas/components/cifras'

// El análisis cualitativo de una sección en el comparativo: cómo se reparten los comentarios en cada
// medición, qué los separa de la base y, por tono, lo que la gente escribió en la base. La lectura
// de la IA se escribe con esas mismas cifras. Con la forma de los drawers del módulo (Crear con plantilla):
// cada sección es un marco con su título y, dentro, una tarjeta con las filas separadas por una línea.

// Cuántos comentarios de cada tono se muestran; el resto está en Resultados › Preguntas.
const MAXIMO_COMENTARIOS = 20
const TONOS: readonly { id: Sentiment; campo: keyof Omit<Reparto, 'n'>; sentido: 'normal' | 'neutro' | 'inverso' }[] = [
  { id: 'positive', campo: 'positivo', sentido: 'normal' },
  { id: 'neutral', campo: 'neutral', sentido: 'neutro' },
  { id: 'negative', campo: 'negativo', sentido: 'inverso' },
]
const nombre = (tono: Sentiment) => SENTIMENT_LABELS[tono].plural.charAt(0).toUpperCase() + SENTIMENT_LABELS[tono].plural.slice(1)

function Lectura({ seccion, comparativo }: { seccion: ComentariosSeccion; comparativo: Comparativo }) {
  const [base, previa] = comparativo.olas
  const hoy = seccion.porColumna[base.id]
  const antes = seccion.porColumna[previa.id]
  if (!hoy || !antes) return null
  const subePositivo = hoy.positivo - antes.positivo
  const subeNegativo = hoy.negativo - antes.negativo
  const mejora = subePositivo >= 0 && subeNegativo <= 0
  const empeora = subePositivo < 0 && subeNegativo > 0
  const titulo = mejora ? 'La conversación mejora' : empeora ? 'La conversación empeora' : 'La conversación se mueve en dos sentidos'
  const signo = (valor: number) => `${valor > 0 ? '+' : ''}${valor} pp`
  return (
    <MarcoLista
      titulo={
        <span className="inline-flex items-center gap-2">
          <IconoIA />
          {titulo}
        </span>
      }
      descripcion="Lectura de la IA sobre estas cifras"
    >
      <FramePanel className="flex flex-col gap-3">
        <Text size="sm">
          Frente a {previa.shortLabel}, los comentarios positivos {subePositivo >= 0 ? 'ganan' : 'pierden'} {Math.abs(subePositivo)} pp y los negativos {subeNegativo <= 0 ? 'ceden' : 'suman'} {Math.abs(subeNegativo)} pp en «{seccion.label}
          ».
        </Text>
        {/* Evidencia y volumen con la misma pieza que la Lectura IA (Dato): cada uno en su caja gris, lado a lado. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Dato nombre="Evidencia">
            Positivo {hoy.positivo} % · Negativo {hoy.negativo} % en {base.shortLabel} ({signo(subePositivo)} / {signo(subeNegativo)})
          </Dato>
          <Dato nombre="Volumen">
            {numero(hoy.n)} comentarios, {numero(Math.abs(hoy.n - antes.n))} {hoy.n >= antes.n ? 'más' : 'menos'} que en {previa.shortLabel}
          </Dato>
        </div>
      </FramePanel>
    </MarcoLista>
  )
}

// Cada medición en una fila: su reparto en una sola barra partida (verde, amarillo, rojo) para compararlas de un
// vistazo, y debajo las tres cifras en su color con la diferencia frente a la base.
const COLOR_TONO: Record<Sentiment, { barra: string; texto: string }> = {
  positive: { barra: 'var(--success)', texto: 'text-success' },
  neutral: { barra: 'var(--warning)', texto: 'text-warning' },
  negative: { barra: 'var(--destructive)', texto: 'text-destructive' },
}

function Medicion({ etiqueta, reparto, base, esBase }: { etiqueta: string; reparto: Reparto; base: Reparto | undefined; esBase: boolean }) {
  return (
    <Item size="sm">
      <ItemContent className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <ItemTitle>
            {etiqueta}
            {esBase ? <MarcaBase /> : null}
          </ItemTitle>
          <Text as="span" size="xs" variant="muted" className="tabular-nums">
            n={numero(reparto.n)}
          </Text>
        </div>
        <BarraSegmentada segmentos={TONOS.map((tono) => ({ id: tono.id, etiqueta: nombre(tono.id), valor: reparto[tono.campo], color: COLOR_TONO[tono.id].barra }))} />
        {/* Las tres cifras en tres columnas fijas, para que positivos, neutrales y negativos queden alineados de una medición a
            otra y no salten de renglón según lo largo de la diferencia. */}
        <div className="grid grid-cols-3 gap-2">
          {TONOS.map((tono) => (
            <span key={tono.id} className="inline-flex flex-wrap items-center gap-1.5">
              <Text as="span" size="sm" weight="semibold" className={`tabular-nums ${COLOR_TONO[tono.id].texto}`}>
                {reparto[tono.campo]} %
              </Text>
              <Text as="span" size="xs" variant="muted">
                {SENTIMENT_LABELS[tono.id].plural.toLowerCase()}
              </Text>
              {esBase || !base ? null : <Cambio valor={reparto[tono.campo] - base[tono.campo]} sufijo=" pp" decimales={1} frente="la base" enCelda menosEsMejor={tono.sentido === 'inverso'} sinColor={tono.sentido === 'neutro'} />}
            </span>
          ))}
        </div>
      </ItemContent>
    </Item>
  )
}

function Comentarios({ comentarios, tono }: { comentarios: readonly OpenComment[]; tono: Sentiment }) {
  const propios = comentarios.filter((comentario) => comentario.aiSentiment === tono)
  if (propios.length === 0) {
    return (
      <PrimeraVez className="py-8" icono="glass-chat" titulo={`Sin comentarios ${SENTIMENT_LABELS[tono].plural.toLowerCase()}`} descripcion="Nadie escribió algo con este tono en esta sección de la encuesta base." />
    )
  }
  return (
    <MarcoLista
      titulo={
        <span className="inline-flex items-center gap-2">
          Comentarios {SENTIMENT_LABELS[tono].plural.toLowerCase()}
          <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
            {numero(propios.length)}
          </Badge>
        </span>
      }
      descripcion={`${propios.length > MAXIMO_COMENTARIOS ? `Los primeros ${MAXIMO_COMENTARIOS} comentarios` : 'Todos los comentarios'} con este tono en la encuesta base. Los de cada pregunta están en Resultados › Preguntas.`}
    >
      {/* py-1!: el panel del marco no deja cambiar su relleno con una clase normal; las filas llevan el suyo (ficha
          frame-panel-relleno-no-se-quita en ai-tools/flux-ui/diferencias.json). */}
      <FramePanel className="py-1!">
        <FilasSeparadas>
          {propios.slice(0, MAXIMO_COMENTARIOS).map((comentario) => (
            <Item key={comentario.id} size="sm">
              <ItemContent>
                <Text size="sm" className="whitespace-normal">
                  «{comentario.text}»
                </Text>
                <ItemDescription>
                  {comentario.anonymous ? 'Participante anónimo' : comentario.respondentName}
                  {comentario.area ? ` · ${comentario.area}` : ''} · {comentario.questionStatement}
                </ItemDescription>
              </ItemContent>
              <InsigniaSentimiento sentimiento={comentario.aiSentiment} />
            </Item>
          ))}
        </FilasSeparadas>
      </FramePanel>
    </MarcoLista>
  )
}

export function DetalleSeccion({ seccion, comparativo, onCerrar }: { seccion: ComentariosSeccion | null; comparativo: Comparativo; onCerrar: () => void }) {
  const base = comparativo.olas[0]
  const total = useMemo(() => (seccion ? comparativo.columnas.reduce((suma, columna) => suma + (seccion.porColumna[columna.id]?.n ?? 0), 0) : 0), [seccion, comparativo.columnas])
  return (
    <DrawerShell
      open={seccion !== null}
      onOpenChange={(abierto) => !abierto && onCerrar()}
      size="lg"
      icon={Message01Icon}
      kicker="Análisis cualitativo"
      title={seccion?.label ?? ''}
      badge={<Badge variant="outline">{numero(total)} comentarios</Badge>}
    >
      {seccion ? (
        <Tabs defaultValue="detalle" className="flex flex-col gap-4">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="detalle" className="flex-none">
              Detalle
            </TabsTrigger>
            {TONOS.map((tono) => (
              <TabsTrigger key={tono.id} value={tono.id} className="flex-none">
                {nombre(tono.id)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="detalle" className="flex flex-col gap-6">
            <MarcoLista titulo="Reparto por medición" descripcion="Cómo se reparten los comentarios de esta sección en cada medición y qué separa a cada una de la base.">
              {/* py-1!: mismo caso que en Comentarios (ficha frame-panel-relleno-no-se-quita). */}
              <FramePanel className="py-1!">
                <FilasSeparadas>
                  {comparativo.columnas.flatMap((columna) => {
                    const reparto = seccion.porColumna[columna.id]
                    return reparto ? [<Medicion key={columna.id} etiqueta={columna.shortLabel} reparto={reparto} base={seccion.porColumna[base.id]} esBase={columna.isBase} />] : []
                  })}
                </FilasSeparadas>
              </FramePanel>
            </MarcoLista>
            <Lectura seccion={seccion} comparativo={comparativo} />
          </TabsContent>
          {TONOS.map((tono) => (
            <TabsContent key={tono.id} value={tono.id}>
              <Comentarios comentarios={seccion.comentarios} tono={tono.id} />
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </DrawerShell>
  )
}
