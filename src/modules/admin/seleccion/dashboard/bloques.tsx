import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Progress, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { ColumnaIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { Ayuda, Cambio, Cifra, Pie } from '../propuestas/components/cifras'
import { LineaEsqueleto } from '../propuestas/components/carga'
import { leer, periodoDe, type Periodo, type Resumen } from './datos'

// Los tres bloques de arriba del dashboard: las cifras, lo que lee la IA en ellas y el embudo. Con la forma de todos los
// bloques de Selección (marco gris compacto, título y bajada arriba, lo suyo en blanco), como «Cómo van los procesos» de
// Vacantes y «Tu bolsa» de Créditos: así la página lleva un solo ritmo.

// El periodo anterior no existe en los datos de la maqueta: se deriva de la cifra de hoy con una regla fija, como en el
// inicio de Vacantes (la de 7 días es la misma: 101 frente a 116). En el producto sale del histórico.
const CANDIDATOS_ANTES: Record<Periodo, number> = {
  '7': 1.15,
  '30': 0.82,
  '90': 0.74,
}
const porcentaje = (hoy: number, antes: number) => (antes === 0 ? 0 : Math.round(((hoy - antes) / antes) * 100))
const hace = (dias: number) => (dias === 7 ? 'hace una semana' : `hace ${dias} días`)

// Mientras carga, cada columna ya dice qué cuenta (el rótulo y la ayuda no dependen de los datos) y en gris la cifra y
// sus dos líneas, en el mismo alto.
const cifraOCarga = (cargando: boolean, cifra: ReactNode) =>
  cargando ? <LineaEsqueleto tamano="titulo" ancho="w-24" className="h-7" /> : cifra
const pieOCarga = (cargando: boolean, frente: string, significa: string) =>
  cargando ? (
    <div className="flex w-full flex-col gap-0.5">
      <LineaEsqueleto tamano="chico" ancho="w-40 max-w-full" />
      <LineaEsqueleto tamano="chico" ancho="w-48 max-w-full" />
    </div>
  ) : (
    <Pie frente={frente} significa={significa} />
  )

export function CifrasContratacion({ resumen, periodo, cargando }: { resumen: Resumen; periodo: Periodo; cargando: boolean }) {
  const { dias, anterior } = periodoDe(periodo)
  const { publicadas, publicadasAntes, fuera, borradores, candidatos, conGente, cerradas, conContratacion, contratados, diasContratar } =
    resumen

  const candidatosAntes = Math.round(candidatos * CANDIDATOS_ANTES[periodo])
  const porVacante = conGente.length ? Math.round(candidatos / conGente.length) : 0

  // Maqueta: el periodo anterior se tardaba cuatro días más en contratar y cerraba un poco peor.
  const diasAntes = diasContratar === null ? null : diasContratar + 4
  const masRapida = [...conContratacion].sort((a, b) => a.vacante.diasAbierta - b.vacante.diasAbierta)[0]
  const tasa = cerradas.length ? Math.round((conContratacion.length / cerradas.length) * 100) : null
  const tasaAntes = tasa === null ? null : Math.max(0, tasa - 5)
  const sinContratar = cerradas.find((fila) => !fila.cierre?.contratados)

  return (
    <section aria-labelledby="cifras-dashboard-titulo" aria-busy={cargando || undefined}>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle id="cifras-dashboard-titulo">Cómo va la contratación</FrameTitle>
          <FrameDescription>Cada cifra, frente a {anterior}.</FrameDescription>
        </FrameHeader>
        <FilaIndicadores etiqueta="Indicadores de contratación" columnas={4} enMarco>
          <ColumnaIndicador
            titulo="Vacantes activas"
            ayuda={
              <Ayuda titulo="Vacantes activas">
                Las vacantes publicadas hoy, también las que ocultaste del portal. Se comparan con las que estaban publicadas al empezar el
                periodo.
              </Ayuda>
            }
            cifra={cifraOCarga(
              cargando,
              <Cifra
                valor={String(publicadas.length)}
                cambio={<Cambio valor={publicadas.length - publicadasAntes} sufijo="" frente={hace(dias)} />}
              />,
            )}
            pie={pieOCarga(
              cargando,
              `Al empezar el periodo: ${publicadasAntes}`,
              `${fuera} ${plural(fuera, 'oculta', 'ocultas')} del portal · ${borradores} en ${plural(borradores, 'borrador', 'borradores')}`,
            )}
          />
          <ColumnaIndicador
            titulo="Candidatos"
            ayuda={
              <Ayuda titulo="Candidatos">
                Personas que aplicaron en el periodo a las vacantes que estás mirando. Si alguien aplica a dos vacantes, cuenta dos veces.
              </Ayuda>
            }
            cifra={cifraOCarga(
              cargando,
              <Cifra
                valor={candidatos.toLocaleString('es-CO')}
                cambio={<Cambio valor={porcentaje(candidatos, candidatosAntes)} sufijo=" %" frente={anterior} />}
              />,
            )}
            pie={pieOCarga(
              cargando,
              `El periodo anterior: ${candidatosAntes.toLocaleString('es-CO')}`,
              conGente.length ? `${porVacante} por vacante en promedio` : 'Nadie aplicó en este periodo',
            )}
          />
          <ColumnaIndicador
            titulo="Días para contratar"
            ayuda={
              <Ayuda titulo="Días para contratar">
                Cuántos días pasan, en promedio, desde que publicas una vacante hasta que la cierras con alguien contratado. Cuentan las que
                cerraron en el periodo. Menos es mejor.
              </Ayuda>
            }
            cifra={cifraOCarga(
              cargando,
              diasContratar === null || diasAntes === null ? (
                <Text as="span" size="xl" weight="semibold" variant="muted">
                  Sin datos
                </Text>
              ) : (
                <Cifra
                  valor={`${diasContratar} ${plural(diasContratar, 'día', 'días')}`}
                  cambio={
                    <Cambio
                      valor={diasContratar - diasAntes}
                      sufijo={plural(Math.abs(diasContratar - diasAntes), ' día', ' días')}
                      menosEsMejor
                      frente={anterior}
                    />
                  }
                />
              ),
            )}
            pie={pieOCarga(
              cargando,
              diasAntes === null ? 'Nadie se contrató en este periodo' : `El periodo anterior: ${diasAntes} días`,
              masRapida ? `La más rápida cerró en ${masRapida.vacante.diasAbierta} días` : 'Prueba con un periodo más largo',
            )}
          />
          <ColumnaIndicador
            titulo="Tasa de éxito"
            ayuda={
              <Ayuda titulo="Tasa de éxito">
                De las vacantes que cerraste en el periodo, cuántas terminaron con alguien contratado. Las que se congelaron o se cancelaron
                cuentan como cerradas sin contratar.
              </Ayuda>
            }
            cifra={cifraOCarga(
              cargando,
              tasa === null || tasaAntes === null ? (
                <Text as="span" size="xl" weight="semibold" variant="muted">
                  Sin datos
                </Text>
              ) : (
                <Cifra valor={`${tasa} %`} cambio={<Cambio valor={tasa - tasaAntes} sufijo=" pts" frente={anterior} />} />
              ),
            )}
            pie={pieOCarga(
              cargando,
              cerradas.length
                ? `${contratados} ${plural(contratados, 'contratada', 'contratadas')} en ${conContratacion.length} de ${cerradas.length} ${plural(cerradas.length, 'cerrada', 'cerradas')}`
                : 'Ninguna vacante cerró en este periodo',
              // Las frases van cortas: a cuatro columnas, la línea se corta a unas 35 letras.
              sinContratar
                ? `${sinContratar.vacante.titulo} ${sinContratar.cierre?.como.replace(/^la vacante /, '')}`
                : cerradas.length
                  ? 'Todas cerraron contratando'
                  : 'Prueba con un periodo más largo',
            )}
          />
        </FilaIndicadores>
      </Frame>
    </section>
  )
}

// ── Lo que lee la IA: tres frases con su acción, no un gráfico más (29 sep, Elkin: «¿qué tengo que hacer con esa torta?»).
// Cada una dice qué pasa, por qué importa y adónde ir a resolverlo. Va toda en un marco de IA, así que el orbe va en el
// título y no en cada frase. ──

export function LecturaIA({ resumen, cargando }: { resumen: Resumen; cargando: boolean }) {
  const lecturas = leer(resumen)
  if (!cargando && !lecturas.length) return null
  return (
    <section aria-labelledby="lectura-ia-titulo" aria-busy={cargando || undefined}>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle id="lectura-ia-titulo" className="flex items-center gap-2">
            <IconoIA />
            Lo que ve la IA hoy
          </FrameTitle>
          <FrameDescription>Lo que más pesa en tu selección y qué hacer con eso. Se actualiza todos los días a las 7:00 a. m.</FrameDescription>
        </FrameHeader>
        <FramePanel className="divide-border grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-0 lg:divide-x">
          {cargando
            ? [0, 1, 2].map((indice) => (
                <div key={indice} aria-hidden="true" className="flex min-w-0 flex-col gap-2 lg:px-5 lg:first:ps-0 lg:last:pe-0">
                  <LineaEsqueleto ancho="w-24" />
                  <LineaEsqueleto tamano="titulo" ancho="w-full" />
                  <LineaEsqueleto ancho="w-4/5" />
                  <LineaEsqueleto ancho="w-3/5" />
                </div>
              ))
            : lecturas.map((lectura) => (
                <article key={lectura.id} className="flex min-w-0 flex-col gap-1.5 lg:px-5 lg:first:ps-0 lg:last:pe-0">
                  <Text as="span" variant="muted" size="sm">
                    {lectura.tema}
                  </Text>
                  <Text as="p" weight="medium" className="text-pretty">
                    {lectura.titulo}
                  </Text>
                  <Text as="p" variant="muted" size="sm" className="text-pretty">
                    {lectura.detalle}
                  </Text>
                  {/* La acción al pie de cada columna: con textos de largo distinto, los tres botones quedan en la misma línea. */}
                  <div className="mt-auto pt-2">
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link to={lectura.accion.ruta} />}>
                      {lectura.accion.texto}
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </article>
              ))}
        </FramePanel>
      </Frame>
    </section>
  )
}

// ── El embudo: las cinco etapas que comparten todas las vacantes, en fila y en el orden en que las recorre cada persona,
// como «El proceso» de la vacante. Cada una dice cuántos llegaron, qué parte de los que aplicaron es y cuántos pasan de
// la anterior. El paso donde más gente se queda va señalado. ──

export function Embudo({ resumen, cargando }: { resumen: Resumen; cargando: boolean }) {
  const { embudo } = resumen
  const base = embudo[0]?.llegaron ?? 0
  const tasas = embudo.map((paso, indice) =>
    indice === 0 ? 1 : embudo[indice - 1].llegaron ? paso.llegaron / embudo[indice - 1].llegaron : 0,
  )
  // El peor paso, sin contar la oferta (ahí se contrata a uno por vacante y el resto sigue en proceso).
  const candidatosPeor = tasas
    .map((tasa, indice) => ({ tasa, indice }))
    .filter(({ indice }) => indice > 0 && indice < embudo.length - 1 && embudo[indice - 1].llegaron >= 5)
  const peor = candidatosPeor.sort((a, b) => a.tasa - b.tasa)[0]?.indice

  return (
    <section aria-labelledby="embudo-titulo" aria-busy={cargando || undefined}>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle id="embudo-titulo">Dónde se quedan los candidatos</FrameTitle>
          <FrameDescription>
            Cuántos llegan a cada etapa y cuántos pasan de la anterior. Son las cinco etapas que comparten todas las vacantes.
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="divide-border grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x">
          {embudo.map(({ etapa, llegaron }, indice) => (
            <div key={etapa.id} className="flex min-w-0 flex-col gap-2 lg:px-4 lg:first:ps-0 lg:last:pe-0">
              <div className="flex min-h-10 min-w-0 items-start gap-1.5">
                <Text as="span" variant="muted" size="sm" className="tabular-nums">
                  {indice + 1}
                </Text>
                {etapa.ia ? (
                  <span className="flex h-5 shrink-0 items-center">
                    <IconoIA />
                  </span>
                ) : null}
                <Text as="span" size="sm" weight="medium" className="line-clamp-2" title={etapa.titulo}>
                  {etapa.titulo}
                </Text>
              </div>
              {cargando ? (
                <>
                  <LineaEsqueleto tamano="titulo" ancho="w-20" className="h-7" />
                  <LineaEsqueleto tamano="chico" ancho="w-full" />
                  <LineaEsqueleto tamano="chico" ancho="w-3/4" />
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <Text as="span" size="xl" weight="semibold" className="tabular-nums">
                      {llegaron.toLocaleString('es-CO')}
                    </Text>
                    <Text as="span" variant="muted" size="xs">
                      {indice === 0 ? 'aplicaron' : 'llegaron'}
                    </Text>
                  </div>
                  {/* Qué parte de los que aplicaron llega hasta aquí: las barras bajan de izquierda a derecha. */}
                  <Progress value={base ? (llegaron / base) * 100 : 0} aria-label={`${llegaron} de ${base} llegaron a ${etapa.titulo}`} />
                  <Text as="span" variant="muted" size="xs" className={indice === peor ? 'text-destructive' : undefined}>
                    {indice === 0 ? 'Todos los que aplicaron' : `Pasa el ${Math.round(tasas[indice] * 100)} % de la anterior`}
                  </Text>
                  {indice === peor ? (
                    <Badge variant="warning-light" className="self-start">
                      Aquí se queda más gente
                    </Badge>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </FramePanel>
      </Frame>
    </section>
  )
}
