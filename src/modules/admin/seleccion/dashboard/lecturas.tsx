import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Chat01Icon,
  ChartIncreaseIcon,
  Clock01Icon,
  FilterIcon,
  PauseIcon,
  PieChart01Icon,
  PlayIcon,
} from '@hugeicons/core-free-icons'
import { Button, Card, CardAction, CardContent, CardHeader, Item, Progress, Text, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import halo from '@/shared/components/tarjeta-ia.module.css'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { Tendencia } from '@/modules/design-system/metricas/graficos'
import { Resaltado, TextoResaltado } from '@/modules/design-system/tipografia/texto-resaltado'
import { plural } from '@/modules/design-system/patrones/formato'
import { CANDIDATURAS, ESPERA_RESPUESTA, tituloEtapa } from '../propuestas/datos'
import { LineaEsqueleto } from '../propuestas/components/carga'
import { DIAS_EN_RIESGO, type Resumen } from './datos'

// Lo que ve la IA (8 oct, Nicolás: «la lectura podría ir primero… el texto un poco más grande y más cosas, que se cambie
// de un insight a otro»; «Lo que ve la IA hoy» y «Lo que encontró la IA» eran lo mismo). Una sola pieza:
// - Arriba, una lectura a la vez en grande: la frase con lo de la IA resaltado, por qué lo dice, qué hacer y, al lado, el
//   dato que la respalda. Pasa sola a la siguiente cada 9 segundos, como historias.
// - Abajo, el índice de todas las lecturas con su cifra: se ven de un vistazo y cualquiera se abre con un clic. La barra
//   de cada una avanza mientras está a la vista.
// Se detiene sola al pasar el cursor o el foco por la tarjeta, con «Pausar» y, si el equipo pidió menos movimiento, desde
// el principio. Todo sale del mismo resumen que el resto de Selección: las cifras cuadran con Vacantes y con la ficha.

const VACANTES = '/admin/seleccion/exploraciones/uno'
const DURACION = 9000
const PASO = 100
const suma = (lista: number[]) => lista.reduce((total, valor) => total + valor, 0)
const por = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)
const dias = (n: number) => (n === 1 ? '1 día' : `${n} días`)

// `marca` señala una fila: en amarillo lo que pide atención; con `bien`, en verde lo que va mejor.
export type Barra = { id: string; etiqueta: string; valor: number; texto: string; marca?: string; bien?: boolean; detalle?: string }

type Lectura = {
  id: string
  tema: string
  icono: IconSvgElement
  /** Pide hacer algo hoy, no solo mirar. */
  paraHoy?: boolean
  // El índice: la cifra y lo que mide, en pocas palabras.
  cifra: string
  dato: string
  frase: React.ReactNode
  porque: string
  accion: { texto: string; ruta: string }
  // Lo que la respalda, al lado de la frase.
  respaldo: { titulo: string; contenido: React.ReactNode }
}

export function Barras({ barras, tope }: { barras: Barra[]; tope: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {barras.map((barra) => (
        <li key={barra.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <Text as="span" size="sm" className="truncate" title={barra.etiqueta}>
                {barra.etiqueta}
              </Text>
              {barra.marca ? (
                <Badge variant={barra.bien ? 'success-light' : 'warning-light'} className="shrink-0">
                  {barra.marca}
                </Badge>
              ) : null}
            </span>
            <Text as="span" size="sm" weight="medium" className="shrink-0 tabular-nums">
              {barra.texto}
            </Text>
          </div>
          {barra.detalle ? (
            <Text as="span" variant="muted" size="xs" className="-mt-1 truncate">
              {barra.detalle}
            </Text>
          ) : null}
          <Progress value={por(barra.valor, tope)} aria-label={`${barra.etiqueta}: ${barra.texto}`} className="**:data-[slot=progress-track]:h-1.5!" />
        </li>
      ))}
    </ul>
  )
}

function lecturasDe(resumen: Resumen): Lectura[] {
  const lista: Lectura[] = []
  const { embudo, serie, filas } = resumen

  // 1 · El periodo en una frase, con la curva de llegadas.
  if (resumen.candidatos) {
    const pico = [...serie].sort((a, b) => b.aplicaron - a.aplicaron)[0]
    lista.push({
      id: 'periodo',
      tema: 'Tu periodo',
      icono: Calendar03Icon,
      cifra: resumen.candidatos.toLocaleString('es-CO'),
      dato: `candidatos en ${resumen.dias} días`,
      frase: (
        <>
          Llegaron <Resaltado ia>{resumen.candidatos.toLocaleString('es-CO')} candidatos</Resaltado> a tus {resumen.publicadas.length}{' '}
          {plural(resumen.publicadas.length, 'vacante publicada', 'vacantes publicadas')}
          {resumen.contratados ? (
            <>
              {' '}y contrataste a <Resaltado>{resumen.contratados} {plural(resumen.contratados, 'persona', 'personas')}</Resaltado>
            </>
          ) : null}
          .
        </>
      ),
      porque: pico
        ? `La semana con más llegadas fue la del ${pico.tramo}, con ${pico.aplicaron}. Las demás lecturas dicen dónde se queda esa gente y qué hacer.`
        : 'Las demás lecturas dicen dónde se queda esa gente y qué hacer.',
      accion: { texto: 'Ir a Vacantes', ruta: VACANTES },
      respaldo: {
        titulo: resumen.porSemana ? 'Candidatos por semana' : 'Candidatos por día',
        contenido: (
          <div className="flex flex-col gap-2">
            {/* El gráfico de recharts se deja enfocar: inert lo saca del teclado; la frase ya dice lo que muestra. */}
            <div className="h-32" aria-hidden="true" inert>
              <Tendencia datos={serie.map((tramo) => tramo.aplicaron)} color="var(--chart-2)" />
            </div>
            <div className="flex justify-between gap-3">
              <Text as="span" variant="muted" size="xs">
                {serie[0]?.tramo}
              </Text>
              <Text as="span" variant="muted" size="xs">
                {serie[serie.length - 1]?.tramo}
              </Text>
            </div>
          </div>
        ),
      },
    })
  }

  // 2 · Quién espera una respuesta del equipo: lo que más se demora es lo que hace perder gente.
  const enEstas = new Set(filas.map((fila) => fila.vacante.id))
  const esperan = CANDIDATURAS.filter((c) => enEstas.has(c.vacante.id) && ESPERA_RESPUESTA(c)).sort((a, b) => b.dias - a.dias)
  const primera = esperan[0]
  if (primera) {
    const tope = Math.max(primera.dias, 1)
    lista.push({
      id: 'esperan',
      tema: 'Las respuestas',
      icono: Chat01Icon,
      paraHoy: true,
      cifra: String(esperan.length),
      dato: 'esperan una respuesta',
      frase: (
        <>
          <Resaltado ia>{esperan.length === 1 ? 'Una persona espera' : `${esperan.length} personas esperan`}</Resaltado> una respuesta del equipo.
          Quien más lleva es <Resaltado>{primera.candidato.nombre}</Resaltado>: {dias(primera.dias)}.
        </>
      ),
      porque: `Está en ${tituloEtapa(primera.etapa)} de ${primera.vacante.titulo}. Quien espera mucho acepta otra oferta: responder primero a quien más lleva es lo que más gente salva.`,
      accion: { texto: 'Ver quién espera', ruta: `${VACANTES}/${primera.vacante.id}` },
      respaldo: {
        titulo: 'Quién lleva más esperando',
        contenido: (
          <div className="flex flex-col gap-3">
            <Barras
              tope={tope}
              barras={esperan.slice(0, 4).map((c) => ({ id: c.id, etiqueta: `${c.candidato.nombre} · ${c.vacante.titulo}`, valor: c.dias, texto: dias(c.dias) }))}
            />
            {esperan.length > 4 ? (
              <Text as="span" variant="muted" size="xs">
                Y {esperan.length - 4} más
              </Text>
            ) : null}
          </div>
        ),
      },
    })
  }

  // 3 · El paso del embudo con menos conversión, de los que tienen gente. Sin la oferta: ahí se contrata a uno por
  // vacante y los demás siguen en proceso, así que «se queda» casi todo el mundo y no dice nada.
  const pasos = embudo
    .slice(1, -1)
    .map((paso, indice) => ({ desde: embudo[indice], hasta: paso, tasa: embudo[indice].llegaron ? paso.llegaron / embudo[indice].llegaron : 1 }))
    .filter((paso) => paso.desde.llegaron >= 5)
  const peor = [...pasos].sort((a, b) => a.tasa - b.tasa)[0]
  const primero = embudo[0]
  const ultimo = embudo[embudo.length - 1]
  if (peor && primero) {
    lista.push({
      id: 'embudo',
      tema: 'El embudo',
      icono: FilterIcon,
      paraHoy: true,
      cifra: `${Math.round(peor.tasa * 100)} %`,
      dato: `pasa de ${peor.desde.etapa.titulo}`,
      frase: (
        <>
          {ultimo?.llegaron ? (
            <>
              De cada <Resaltado>{Math.round(primero.llegaron / ultimo.llegaron)}</Resaltado> que entran, uno llega a {ultimo.etapa.titulo}.{' '}
            </>
          ) : null}
          Donde más se frena es en <Resaltado ia>{peor.desde.etapa.titulo}</Resaltado>: solo pasa el {Math.round(peor.tasa * 100)} %.
        </>
      ),
      porque: `Siguen ${peor.hasta.llegaron} de ${peor.desde.llegaron}. Revisa a quién tienes en ${peor.desde.etapa.titulo} antes de buscar más candidatos.`,
      accion: { texto: 'Ver en Vacantes', ruta: VACANTES },
      respaldo: {
        titulo: 'Cuántos llegan a cada etapa',
        contenido: (
          <Barras
            tope={primero.llegaron}
            barras={embudo.map((paso) => ({
              id: paso.etapa.id,
              etiqueta: paso.etapa.titulo,
              valor: paso.llegaron,
              texto: paso.llegaron.toLocaleString('es-CO'),
              marca: paso === peor.desde ? 'Aquí se frena' : undefined,
            }))}
          />
        ),
      },
    })
  }

  // 4 · La vacante abierta que más lleva y menos recibe.
  const quieta = resumen.publicadas
    .filter((vacante) => vacante.diasAbierta >= DIAS_EN_RIESGO)
    .sort((a, b) => b.diasAbierta - a.diasAbierta || a.ultimaSemana - b.ultimaSemana)[0]
  if (quieta) {
    const promedio = Math.round(suma(resumen.publicadas.map((vacante) => vacante.diasAbierta)) / resumen.publicadas.length)
    const llegada =
      quieta.aplicaciones === 0
        ? 'todavía no le llega nadie'
        : quieta.ultimaSemana === 0
          ? 'esta semana no le llegó nadie'
          : quieta.ultimaSemana === 1
            ? 'esta semana solo le llegó 1 persona'
            : `esta semana solo le llegaron ${quieta.ultimaSemana} personas`
    lista.push({
      id: 'vacante',
      tema: 'Las vacantes',
      icono: Briefcase01Icon,
      paraHoy: true,
      cifra: dias(quieta.diasAbierta),
      dato: `abierta: ${quieta.titulo}`,
      frase: (
        <>
          <Resaltado>{quieta.titulo}</Resaltado> lleva <Resaltado ia>{dias(quieta.diasAbierta)}</Resaltado> abierta y {llegada}.
        </>
      ),
      porque: 'Es la que más lleva de tus vacantes publicadas. Revisa la publicación o compártela con tu red para que le llegue gente.',
      accion: { texto: 'Abrir la vacante', ruta: `${VACANTES}/${quieta.id}` },
      respaldo: {
        titulo: 'Días abierta',
        contenido: (
          <Barras
            tope={Math.max(quieta.diasAbierta, promedio, 1)}
            barras={[
              { id: quieta.id, etiqueta: quieta.titulo, valor: quieta.diasAbierta, texto: dias(quieta.diasAbierta), marca: quieta.aplicaciones === 0 ? 'Sin candidatos' : undefined },
              { id: 'promedio', etiqueta: 'Promedio de tus vacantes', valor: promedio, texto: dias(promedio) },
            ]}
          />
        ),
      },
    })
  }

  // 5 · El ritmo: las dos últimas semanas contra las dos de antes.
  if (serie.length >= 4) {
    const ahora = suma(serie.slice(-2).map((tramo) => tramo.aplicaron))
    const antes = suma(serie.slice(-4, -2).map((tramo) => tramo.aplicaron))
    const cambio = antes ? Math.round(((ahora - antes) / antes) * 100) : 0
    lista.push({
      id: 'ritmo',
      tema: 'El ritmo',
      icono: ChartIncreaseIcon,
      cifra: `${cambio > 0 ? '+' : ''}${cambio} %`,
      dato: 'candidatos frente a hace un mes',
      frase: (
        <>
          Llegan <Resaltado ia>{Math.abs(cambio)} % {cambio < 0 ? 'menos' : 'más'}</Resaltado> candidatos que hace un mes: {ahora} en las últimas dos semanas.
        </>
      ),
      porque:
        cambio < 0
          ? 'Cuando bajan las llegadas, compartir las vacantes con tu red y en el portal ayuda a recuperarlas.'
          : 'El portal está trayendo más gente: revisa que el equipo alcance a responderla.',
      accion: { texto: 'Ir a Vacantes', ruta: VACANTES },
      respaldo: {
        titulo: 'Candidatos que llegaron',
        contenido: (
          <Barras
            tope={Math.max(ahora, antes, 1)}
            barras={[
              { id: 'ahora', etiqueta: 'Últimas dos semanas', valor: ahora, texto: String(ahora) },
              { id: 'antes', etiqueta: 'Las dos de antes', valor: antes, texto: String(antes) },
            ]}
          />
        ),
      },
    })
  }

  // 6 · Cuánto se tarda en contratar: el promedio y cada vacante que contrató.
  const cerradas = [...filas].filter((fila) => (fila.cierre?.contratados ?? 0) > 0).sort((a, b) => a.vacante.diasAbierta - b.vacante.diasAbierta)
  const rapida = cerradas[0]
  if (resumen.diasContratar && rapida) {
    lista.push({
      id: 'tiempo',
      tema: 'El tiempo',
      icono: Clock01Icon,
      cifra: dias(resumen.diasContratar),
      dato: 'para contratar, en promedio',
      frase: (
        <>
          Contratas en <Resaltado ia>{dias(resumen.diasContratar)}</Resaltado> en promedio. <Resaltado>{rapida.vacante.titulo}</Resaltado> lo hizo en{' '}
          {rapida.vacante.diasAbierta}.
        </>
      ),
      porque: `${rapida.vacante.titulo} respondió rápido en cada etapa: copiar sus etapas acorta las demás.`,
      accion: { texto: 'Ver cómo la hicieron', ruta: `${VACANTES}/${rapida.vacante.id}` },
      respaldo: {
        titulo: 'Días hasta contratar',
        contenido: (
          <Barras
            tope={Math.max(...cerradas.map((fila) => fila.vacante.diasAbierta), 1)}
            barras={cerradas.slice(0, 4).map((fila) => ({
              id: fila.vacante.id,
              etiqueta: fila.vacante.titulo,
              valor: fila.vacante.diasAbierta,
              texto: dias(fila.vacante.diasAbierta),
              marca: fila === rapida ? 'La más rápida' : undefined,
            }))}
          />
        ),
      },
    })
  }

  // 7 · Cómo se reparten los candidatos: casi siempre pocas vacantes se llevan a casi toda la gente.
  const conGente = [...filas].filter((fila) => fila.candidatos > 0).sort((a, b) => b.candidatos - a.candidatos)
  const total = suma(conGente.map((fila) => fila.candidatos))
  const dos = conGente.slice(0, 2)
  if (conGente.length > 3 && total) {
    const resto = total - suma(dos.map((fila) => fila.candidatos))
    const parte = por(total - resto, total)
    lista.push({
      id: 'reparto',
      tema: 'El reparto',
      icono: PieChart01Icon,
      cifra: `${parte} %`,
      dato: `de la gente, en ${dos.length} vacantes`,
      frase: (
        <>
          <Resaltado>{dos[0].vacante.titulo}</Resaltado> y <Resaltado>{dos[1].vacante.titulo}</Resaltado> se llevan el <Resaltado ia>{parte} %</Resaltado> de los
          candidatos.
        </>
      ),
      porque: `Las otras ${conGente.length - 2} compiten por poca gente. Compartirlas con tu red o revisar sus requisitos reparte mejor a los candidatos.`,
      accion: { texto: 'Ir a Vacantes', ruta: VACANTES },
      respaldo: {
        titulo: 'Candidatos por vacante',
        contenido: (
          <Barras
            tope={total}
            barras={[
              ...conGente.slice(0, 3).map((fila) => ({ id: fila.vacante.id, etiqueta: fila.vacante.titulo, valor: fila.candidatos, texto: String(fila.candidatos) })),
              {
                id: 'resto',
                etiqueta: `Las otras ${conGente.length - 3}`,
                valor: total - suma(conGente.slice(0, 3).map((fila) => fila.candidatos)),
                texto: String(total - suma(conGente.slice(0, 3).map((fila) => fila.candidatos))),
              },
            ]}
          />
        ),
      },
    })
  }

  return lista
}

// La barra de cada lectura en el índice: llena las que ya pasaron, avanza en la que está a la vista y deja vacías las que
// vienen. Lleva su propio reloj para que el resto de la tarjeta no se vuelva a pintar cada décima de segundo.
function Avance({ estado, corriendo, onFin }: { estado: 'antes' | 'ahora' | 'despues'; corriendo: boolean; onFin: () => void }) {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    if (estado !== 'ahora' || !corriendo) return
    const reloj = window.setInterval(() => setValor((actual) => Math.min(actual + (PASO / DURACION) * 100, 100)), PASO)
    return () => window.clearInterval(reloj)
  }, [estado, corriendo])
  useEffect(() => {
    if (estado === 'ahora' && valor >= 100) onFin()
  }, [estado, valor, onFin])
  return <Progress aria-hidden="true" value={estado === 'antes' ? 100 : estado === 'ahora' ? valor : 0} className="**:data-[slot=progress-track]:h-1!" />
}

const pocoMovimiento = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

export function LecturasIA({ resumen, cargando }: { resumen: Resumen; cargando: boolean }) {
  const lecturas = lecturasDe(resumen)
  const total = lecturas.length
  const [activa, setActiva] = useState(0)
  const [pausado, setPausado] = useState(pocoMovimiento)
  const [encima, setEncima] = useState(false)
  const corriendo = !pausado && !encima
  const siguiente = useCallback(() => setActiva((actual) => (actual + 1) % Math.max(total, 1)), [total])
  const anterior = () => setActiva((actual) => (actual - 1 + total) % total)

  if (cargando) {
    return (
      <Card aria-busy="true" aria-label="Lo que ve la IA">
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
          <div className="flex flex-col gap-3">
            <LineaEsqueleto ancho="w-48" />
            <LineaEsqueleto tamano="titulo" ancho="w-full" className="h-8" />
            <LineaEsqueleto tamano="titulo" ancho="w-3/4" className="h-8" />
            <LineaEsqueleto ancho="w-2/3" />
          </div>
          <div className="flex flex-col gap-3">
            <LineaEsqueleto ancho="w-1/2" />
            <LineaEsqueleto ancho="w-full" />
            <LineaEsqueleto ancho="w-full" />
            <LineaEsqueleto ancho="w-4/5" />
          </div>
        </CardContent>
      </Card>
    )
  }
  if (!total) return null

  return (
    <section aria-roledescription="carrusel" aria-label="Lo que ve la IA">
      <Card
        className={cn(halo.vars, halo.halo, halo.haloSuave, 'relative isolate')}
        onPointerEnter={() => setEncima(true)}
        onPointerLeave={() => setEncima(false)}
        onFocus={() => setEncima(true)}
        onBlur={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setEncima(false)
        }}
      >
        {/* Todo va por encima del halo de la tarjeta. */}
        <CardHeader className="relative">
          <EtiquetaIA className="w-fit">Lectura de los últimos {resumen.dias} días</EtiquetaIA>
          <CardAction className="flex items-center gap-1">
            <Text as="span" variant="muted" size="sm" className="me-1 hidden tabular-nums sm:inline">
              {activa + 1} de {total}
            </Text>
            <BotonIcono aria-label="Lectura anterior" onClick={anterior}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
            </BotonIcono>
            <BotonIcono aria-label={pausado ? 'Seguir pasando las lecturas' : 'Pausar las lecturas'} aria-pressed={pausado} onClick={() => setPausado((actual) => !actual)}>
              <HugeiconsIcon icon={pausado ? PlayIcon : PauseIcon} size={16} aria-hidden="true" />
            </BotonIcono>
            <BotonIcono aria-label="Lectura siguiente" onClick={siguiente}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
            </BotonIcono>
          </CardAction>
        </CardHeader>

        {/* La lectura a la vista. Las siete van apiladas en el mismo sitio y solo se ve una: la tarjeta toma el alto de la
            más larga y el índice no salta al cambiar. Con el carrusel corriendo no se anuncia cada cambio; en pausa, sí. */}
        <CardContent className="relative grid" aria-live={corriendo ? 'off' : 'polite'}>
          {lecturas.map((lectura, indice) => (
          <div
            key={lectura.id}
            role="group"
            aria-roledescription="lectura"
            aria-label={`${indice + 1} de ${total}: ${lectura.tema}`}
            aria-hidden={indice !== activa || undefined}
            inert={indice !== activa}
            className={cn(
              'col-start-1 row-start-1 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10',
              indice === activa ? 'animate-in duration-500 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none' : 'invisible',
            )}
          >
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Text as="span" variant="muted" size="sm" className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={lectura.icono} size={16} aria-hidden="true" />
                  {lectura.tema}
                </Text>
                {lectura.paraHoy ? (
                  <Badge variant="warning-light">
                    Para resolver hoy
                  </Badge>
                ) : null}
              </div>
              <TextoResaltado size="2xl" className="max-w-3xl">
                {lectura.frase}
              </TextoResaltado>
              <Text as="p" variant="muted" size="base" className="max-w-2xl text-pretty">
                {lectura.porque}
              </Text>
              <div className="mt-auto pt-2">
                <Button nativeButton={false} render={<Link to={lectura.accion.ruta} />}>
                  {lectura.accion.texto}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-4 lg:border-s lg:ps-10">
              <Text as="span" size="sm" weight="medium">
                {lectura.respaldo.titulo}
              </Text>
              {lectura.respaldo.contenido}
            </div>
          </div>
          ))}
        </CardContent>

        {/* El índice: todas las lecturas con su cifra. En el teléfono se desliza de lado. */}
        <div role="group" aria-label="Todas las lecturas" className="relative flex gap-1 overflow-x-auto border-t px-3 pt-3 lg:grid lg:grid-cols-7 lg:overflow-visible">
          {lecturas.map((otra, indice) => (
            <Item
              key={otra.id}
              size="sm"
              variant={indice === activa ? 'muted' : 'default'}
              render={<button type="button" />}
              aria-current={indice === activa ? 'true' : undefined}
              onClick={() => setActiva(indice)}
              className="shrink-0 basis-36 cursor-pointer lg:basis-auto"
            >
              <div className="flex w-full min-w-0 flex-col gap-2.5 self-start text-left">
                <Avance
                  key={indice === activa ? `${otra.id}-ahora` : otra.id}
                  estado={indice < activa ? 'antes' : indice === activa ? 'ahora' : 'despues'}
                  corriendo={corriendo}
                  onFin={siguiente}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <Text as="span" variant="muted" size="xs" className="flex items-center gap-1">
                    <HugeiconsIcon icon={otra.icono} size={12} aria-hidden="true" />
                    {otra.tema}
                  </Text>
                  <Text as="span" size="lg" weight="semibold" className="tabular-nums">
                    {otra.cifra}
                  </Text>
                  <Text as="span" variant="muted" size="xs" className="line-clamp-2">
                    {otra.dato}
                  </Text>
                </span>
              </div>
            </Item>
          ))}
        </div>
      </Card>
    </section>
  )
}
