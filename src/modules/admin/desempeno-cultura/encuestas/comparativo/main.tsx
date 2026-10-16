import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, GitCompareIcon, InformationCircleIcon, RotateLeft01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { useEncuestas } from '../components/almacen'
import { AsistenteComparativo, type Preseleccion } from '../components/comparar/asistente-comparativo'
import { armarComparativo } from '../modelo/comparativo/lectura'
import { descargarComparativo } from '../modelo/comparativo/libro-comparativo'
import { fallaEnQA } from '../modelo/surveyCasos'
import { SURVEYS_LIST } from '../modelo/surveyList'
import type { SurveyListItem } from '../modelo/types'
import { PestanaComentarios } from './components/pestana-comentarios'
import { PestanaInsights } from './components/pestana-insights'
import { PestanaSecciones } from './components/pestana-secciones'
import { ResumenComparativo } from './components/resumen'

// Desempeño y cultura › Encuestas › Comparativo. La lectura de un cruce de 2 a 5 mediciones del mismo
// tipo contra una base: el resumen ejecutivo arriba y, en pestañas, las secciones, los comentarios y
// la lectura de la IA. Lo que se cruzó vive en la dirección (base y comparadas), así que se puede
// recargar o volver sin perderlo. Sin barra flotante: cambiar encuestas y descargar van en la cabecera.
import { ImagenGlass } from '@/shared/components/ImagenGlass'

const RUTA = '/admin/desempeno-cultura/encuestas'
type Pestana = 'secciones' | 'comentarios' | 'insights'

// El cruce tarda: «Reintentar» muestra el mismo respiro antes de contestar.
const REINTENTO_MS = 1500

/** El nombre de una encuesta que ya no está en la lista: los datos de ejemplo lo conservan aunque se haya eliminado. */
const nombreOriginal = (id: string) => SURVEYS_LIST.find((encuesta) => encuesta.id === id)?.name ?? null

const citar = (nombres: readonly string[]) => {
  const citados = nombres.map((nombre) => `«${nombre}»`)
  return citados.length <= 1 ? citados.join('') : `${citados.slice(0, -1).join(', ')} y ${citados[citados.length - 1]}`
}

/** Lo que cuenta el vacío cuando falta alguna encuesta (COM-031): cuál se eliminó, si se sabe, y qué hacer. */
function textoFaltantes(faltantes: readonly string[]): { titulo: string; descripcion: string } {
  const nombres = faltantes.map(nombreOriginal).filter((nombre): nombre is string => nombre !== null)
  const cierre = 'Vuelve a elegir las encuestas para compararlas.'
  if (faltantes.length === 0) return { titulo: 'No encontramos las encuestas de este comparativo', descripcion: `Este enlace no trae las encuestas que se iban a comparar. ${cierre}` }
  const titulo = faltantes.length === 1 ? 'Una de las encuestas ya no está' : 'Algunas encuestas ya no están'
  if (nombres.length === 0) return { titulo, descripcion: `${faltantes.length === 1 ? 'Una de las encuestas elegidas se eliminó' : 'Algunas de las encuestas elegidas se eliminaron'} mientras armabas el comparativo. ${cierre}` }
  return { titulo, descripcion: `Se ${nombres.length === 1 ? 'eliminó' : 'eliminaron'} ${citar(nombres)} mientras armabas el comparativo. ${cierre}` }
}

/** Sin base o sin ninguna comparada que siga en la lista (COM-031): el vacío del sistema con las dos salidas. */
function SinComparativo({ faltantes, onCambiar }: { faltantes: readonly string[]; onCambiar: () => void }) {
  const navigate = useNavigate()
  const { titulo, descripcion } = textoFaltantes(faltantes)
  return (
    <PageShell>
      <PageHeader back={{ label: 'Encuestas', to: RUTA }} title="Comparativo de encuestas" />
      <PageContent>
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-close-square" />
            </EmptyMedia>
            <EmptyTitle>{titulo}</EmptyTitle>
            <EmptyDescription>{descripcion}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(RUTA)}>
              Ir a Encuestas
            </Button>
            <Button onClick={onCambiar}>
              <HugeiconsIcon icon={GitCompareIcon} aria-hidden="true" />
              Cambiar encuestas
            </Button>
          </EmptyContent>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

/**
 * El cruce falló al generarlo (COM-028): el vacío del sistema en lugar de la lectura, con «Reintentar» y «Cambiar
 * encuestas», que vuelve al asistente con lo elegido. Con la encuesta de prueba que falla, reintentar falla siempre.
 */
function NoSeGenero({ onCambiar }: { onCambiar: () => void }) {
  const [reintentando, setReintentando] = useState(false)
  useEffect(() => {
    if (!reintentando) return
    const reloj = setTimeout(() => setReintentando(false), REINTENTO_MS)
    return () => clearTimeout(reloj)
  }, [reintentando])
  return (
    <PageShell>
      <PageHeader back={{ label: 'Encuestas', to: RUTA }} title="Comparativo de encuestas" />
      <PageContent>
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-danger" />
            </EmptyMedia>
            <EmptyTitle>No pudimos generar el comparativo</EmptyTitle>
            <EmptyDescription>No logramos cruzar las mediciones que elegiste. Tu selección sigue guardada: vuelve a intentarlo o cambia las encuestas.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button variant="outline" onClick={onCambiar} disabled={reintentando}>
              <HugeiconsIcon icon={GitCompareIcon} aria-hidden="true" />
              Cambiar encuestas
            </Button>
            <Button onClick={() => setReintentando(true)} disabled={reintentando}>
              {reintentando ? <Spinner /> : <HugeiconsIcon icon={RotateLeft01Icon} aria-hidden="true" />}
              {reintentando ? 'Reintentando' : 'Reintentar'}
            </Button>
          </EmptyContent>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

/** Lo que queda elegido cuando faltan encuestas: las que siguen en la lista, del tipo del comparativo. */
function preseleccionSin(encuestas: readonly SurveyListItem[], baseId: string, conIds: readonly string[]): Preseleccion | null {
  const ids = [baseId, ...conIds]
  const tipo = ids.map((id) => encuestas.find((encuesta) => encuesta.id === id)?.type ?? SURVEYS_LIST.find((encuesta) => encuesta.id === id)?.type).find(Boolean)
  if (!tipo) return null
  const quedan = ids.filter((id) => encuestas.some((encuesta) => encuesta.id === id && encuesta.type === tipo))
  return { tipo, ids: [...new Set(quedan)], base: quedan.includes(baseId) ? baseId : null }
}

export function Component() {
  const [parametros] = useSearchParams()
  const encuestas = useEncuestas()
  const baseId = parametros.get('base') ?? ''
  const conIds = useMemo(() => (parametros.get('con') ?? '').split(',').filter(Boolean), [parametros])
  const comparativo = useMemo(() => armarComparativo(encuestas, baseId, conIds), [encuestas, baseId, conIds])
  // Las que se eliminaron después de elegirlas (COM-031): sin base o sin comparadas no hay lectura; si solo se cayó alguna
  // comparada y quedan al menos dos, se lee con las que quedan y se avisa arriba.
  const faltantes = useMemo(() => [...new Set([baseId, ...conIds])].filter((id) => id && !encuestas.some((encuesta) => encuesta.id === id)), [encuestas, baseId, conIds])
  // Recién pedido desde el asistente: con la encuesta de prueba que falla, el cruce no sale (COM-028).
  const generado = (useLocation().state as { generado?: boolean } | null)?.generado === true
  const fallo = generado && fallaEnQA(baseId, ...conIds)
  const [pestana, setPestana] = useState<Pestana>('secciones')
  const [cambiar, setCambiar] = useState(false)
  const preseleccion = useMemo<Preseleccion | null>(
    () => (comparativo && faltantes.length === 0 ? { tipo: comparativo.tipo, ids: comparativo.columnas.map((columna) => columna.id), base: comparativo.base.id } : preseleccionSin(encuestas, baseId, conIds)),
    [comparativo, faltantes, encuestas, baseId, conIds],
  )
  const asistente = <AsistenteComparativo abierto={cambiar} onAbierto={setCambiar} encuestas={encuestas} inicial={preseleccion} />

  if (!comparativo)
    return (
      <>
        <SinComparativo faltantes={faltantes} onCambiar={() => setCambiar(true)} />
        {asistente}
      </>
    )
  if (fallo)
    return (
      <>
        <NoSeGenero onCambiar={() => setCambiar(true)} />
        {asistente}
      </>
    )
  const nombresFaltantes = faltantes.map(nombreOriginal).filter((nombre): nombre is string => nombre !== null)

  const comparadas = comparativo.olas.slice(1).map((columna) => columna.shortLabel)
  const descargar = () => {
    try {
      // Caso COM-096: con la encuesta que falla en QA el archivo no se puede generar.
      if (fallaEnQA(...comparativo.columnas.map((columna) => columna.id))) throw new Error('Encuesta de casos de error')
      const nombre = descargarComparativo(comparativo)
      notify('Comparativo descargado', nombre)
    } catch (error) {
      console.error('No se pudo generar el Excel del comparativo', error)
      notify('No se pudo descargar el comparativo', 'Vuelve a intentarlo en un momento.', 'error')
    }
  }

  return (
    <PageShell>
      {/* Las pestañas envuelven la página. El resumen ejecutivo es de todo el comparativo, no de una pestaña: va arriba en
          las tres, y la tira de pestañas debajo de él. */}
      <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)}>
      <PageHeader
        back={{ label: 'Encuestas', to: RUTA }}
        title="Comparativo de encuestas"
        description={`${comparativo.tipo} · base ${comparativo.olas[0].shortLabel} frente a ${comparadas.join(', ')}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setCambiar(true)}>
              <HugeiconsIcon icon={GitCompareIcon} aria-hidden="true" />
              Cambiar encuestas
            </Button>
            <Button onClick={descargar}>
              <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
              Descargar Excel
            </Button>
          </>
        }
      />
      <PageContent>
        {faltantes.length > 0 ? (
          <Alert variant="info">
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertTitle>{nombresFaltantes.length > 0 ? `${citar(nombresFaltantes)} ya no ${nombresFaltantes.length === 1 ? 'está' : 'están'} en el comparativo` : 'Una de las encuestas ya no está en el comparativo'}</AlertTitle>
            <AlertDescription>Se eliminó mientras armabas el comparativo. Ves la base frente a las que quedan; para sumar otra, usa «Cambiar encuestas».</AlertDescription>
          </Alert>
        ) : null}
        <ResumenComparativo comparativo={comparativo} />
        {/* Las pestañas van debajo del resumen (Evolución por medición), no en la cabecera (Elkin, 9-oct): el resumen es de
            todo el comparativo y las pestañas cambian solo lo que viene después. */}
        <TabsList variant="line">
          <TabsTrigger value="secciones" className="flex-none">
            Secciones
          </TabsTrigger>
          <TabsTrigger value="comentarios" className="flex-none">
            Comentarios
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex-none">
            Insights IA
          </TabsTrigger>
        </TabsList>
          <TabsContent value="secciones">
            {pestana === 'secciones' ? <PestanaSecciones key={comparativo.columnas.map((columna) => columna.id).join()} comparativo={comparativo} /> : null}
          </TabsContent>
          <TabsContent value="comentarios">
            {pestana === 'comentarios' ? <PestanaComentarios comparativo={comparativo} /> : null}
          </TabsContent>
          <TabsContent value="insights">
            {pestana === 'insights' ? <PestanaInsights comparativo={comparativo} /> : null}
          </TabsContent>
      </PageContent>
      </Tabs>
      {asistente}
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaEncuestasComparativoPage'
